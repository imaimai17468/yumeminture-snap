import { sql } from "drizzle-orm";
import { db } from "@/lib/drizzle/db";
import { createClient } from "@/lib/supabase/server";

export type NetworkNode = {
	id: string;
	name: string;
	avatarUrl: string | null;
	type: "self" | "friend" | "friend-of-friend";
	organizationId?: string;
	organizationName?: string;
};

export type NetworkLink = {
	source: string;
	target: string;
	type: "direct" | "indirect";
};

export type NetworkData = {
	nodes: NetworkNode[];
	links: NetworkLink[];
};

export const fetchNetworkData = async (): Promise<NetworkData> => {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { nodes: [], links: [] };
	}

	try {
		// First get self info
		const selfResult = await db.execute<{
			user_id: string;
			user_name: string | null;
			user_avatar_url: string | null;
			user_org_id: string | null;
			user_org_name: string | null;
		}>(sql`
			SELECT 
				u.id as user_id,
				u.name as user_name,
				u.avatar_url as user_avatar_url,
				o.id as user_org_id,
				o.name as user_org_name
			FROM users u
			LEFT JOIN organization_memberships om ON u.id = om.user_id AND om.status = 'approved'
			LEFT JOIN organizations o ON om.organization_id = o.id
			WHERE u.id = ${user.id}
		`);

		if (!selfResult || selfResult.length === 0) {
			return { nodes: [], links: [] };
		}

		const self = selfResult[0];
		const nodes: NetworkNode[] = [];
		const links: NetworkLink[] = [];
		const nodeIds = new Set<string>();

		// Add self node
		nodes.push({
			id: self.user_id,
			name: self.user_name || "You",
			avatarUrl: self.user_avatar_url,
			type: "self",
			organizationId: self.user_org_id || undefined,
			organizationName: self.user_org_name || undefined,
		});
		nodeIds.add(self.user_id);

		// Get all direct friends
		const friendsResult = await db.execute<{
			friend_id: string;
			friend_name: string | null;
			friend_avatar_url: string | null;
			friend_org_id: string | null;
			friend_org_name: string | null;
		}>(sql`
			SELECT DISTINCT
				u.id as friend_id,
				u.name as friend_name,
				u.avatar_url as friend_avatar_url,
				o.id as friend_org_id,
				o.name as friend_org_name
			FROM friendships f
			INNER JOIN users u ON 
				CASE 
					WHEN f.user_id_1 = ${user.id} THEN u.id = f.user_id_2
					ELSE u.id = f.user_id_1
				END
			LEFT JOIN organization_memberships om ON u.id = om.user_id AND om.status = 'approved'
			LEFT JOIN organizations o ON om.organization_id = o.id
			WHERE f.user_id_1 = ${user.id} OR f.user_id_2 = ${user.id}
		`);

		// Add friend nodes and links
		const friendIds: string[] = [];
		for (const friend of friendsResult) {
			nodes.push({
				id: friend.friend_id,
				name: friend.friend_name || "Friend",
				avatarUrl: friend.friend_avatar_url,
				type: "friend",
				organizationId: friend.friend_org_id || undefined,
				organizationName: friend.friend_org_name || undefined,
			});
			nodeIds.add(friend.friend_id);
			friendIds.push(friend.friend_id);

			links.push({
				source: self.user_id,
				target: friend.friend_id,
				type: "direct",
			});
		}

		if (friendIds.length === 0) {
			return { nodes, links };
		}

		// Get friends of friends
		const fofResult = await db.execute<{
			fof_id: string;
			fof_name: string | null;
			fof_avatar_url: string | null;
			fof_org_id: string | null;
			fof_org_name: string | null;
			friend_id: string;
		}>(sql`
			SELECT DISTINCT
				u.id as fof_id,
				u.name as fof_name,
				u.avatar_url as fof_avatar_url,
				o.id as fof_org_id,
				o.name as fof_org_name,
				CASE 
					WHEN f.user_id_1 = ANY(ARRAY[${sql.join(friendIds, sql`, `)}]::uuid[]) THEN f.user_id_1
					ELSE f.user_id_2
				END as friend_id
			FROM friendships f
			INNER JOIN users u ON 
				CASE 
					WHEN f.user_id_1 = ANY(ARRAY[${sql.join(friendIds, sql`, `)}]::uuid[]) THEN u.id = f.user_id_2
					ELSE u.id = f.user_id_1
				END
			LEFT JOIN organization_memberships om ON u.id = om.user_id AND om.status = 'approved'
			LEFT JOIN organizations o ON om.organization_id = o.id
			WHERE 
				(f.user_id_1 = ANY(ARRAY[${sql.join(friendIds, sql`, `)}]::uuid[]) OR 
				 f.user_id_2 = ANY(ARRAY[${sql.join(friendIds, sql`, `)}]::uuid[]))
				AND u.id != ${user.id}
				AND u.id != ALL(ARRAY[${sql.join(friendIds, sql`, `)}]::uuid[])
		`);

		// Add friend of friend nodes and links
		for (const fof of fofResult) {
			if (!nodeIds.has(fof.fof_id)) {
				nodes.push({
					id: fof.fof_id,
					name: fof.fof_name || "Friend of Friend",
					avatarUrl: fof.fof_avatar_url,
					type: "friend-of-friend",
					organizationId: fof.fof_org_id || undefined,
					organizationName: fof.fof_org_name || undefined,
				});
				nodeIds.add(fof.fof_id);
			}

			links.push({
				source: fof.friend_id,
				target: fof.fof_id,
				type: "indirect",
			});
		}

		// Get all friend-to-friend connections
		if (friendIds.length > 1) {
			const friendConnections = await db.execute<{
				user_id_1: string;
				user_id_2: string;
			}>(sql`
				SELECT user_id_1, user_id_2
				FROM friendships
				WHERE user_id_1 = ANY(ARRAY[${sql.join(friendIds, sql`, `)}]::uuid[]) 
				AND user_id_2 = ANY(ARRAY[${sql.join(friendIds, sql`, `)}]::uuid[])
			`);

			for (const conn of friendConnections) {
				links.push({
					source: conn.user_id_1,
					target: conn.user_id_2,
					type: "direct",
				});
			}
		}

		return { nodes, links };
	} catch (error) {
		console.error("Failed to fetch network data:", error);
		return { nodes: [], links: [] };
	}
};
