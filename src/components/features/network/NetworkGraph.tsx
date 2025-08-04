"use client";

import {
	Background,
	Controls,
	type Edge,
	Handle,
	type Node,
	Position,
	ReactFlow,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Building2, Loader2, Network, User } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type {
	NetworkData,
	NetworkNode,
} from "@/gateways/friendship/fetch-network-data";

type CustomNodeData = {
	label: string;
	avatarUrl: string | null;
	type: "self" | "friend" | "friend-of-friend";
	organizationName?: string;
	originalId: string;
};

const CustomNode = ({ data }: { data: CustomNodeData }) => {
	const borderColor =
		data.type === "self"
			? "ring-4 ring-primary ring-offset-2"
			: data.type === "friend"
				? "ring-2 ring-blue-500"
				: "ring-1 ring-muted-foreground/50";

	const avatarSize = data.type === "self" ? "h-16 w-16" : "h-12 w-12";

	return (
		<div className="relative flex flex-col items-center">
			<Handle
				type="source"
				position={Position.Top}
				style={{ opacity: 0, top: data.type === "self" ? "32px" : "24px" }}
			/>
			<Handle
				type="source"
				position={Position.Right}
				style={{ opacity: 0, top: "50%" }}
			/>
			<Handle
				type="source"
				position={Position.Bottom}
				style={{ opacity: 0, bottom: data.type === "self" ? "32px" : "24px" }}
			/>
			<Handle
				type="source"
				position={Position.Left}
				style={{ opacity: 0, top: "50%" }}
			/>
			<Handle
				type="target"
				position={Position.Top}
				style={{ opacity: 0, top: data.type === "self" ? "32px" : "24px" }}
			/>
			<Handle
				type="target"
				position={Position.Right}
				style={{ opacity: 0, top: "50%" }}
			/>
			<Handle
				type="target"
				position={Position.Bottom}
				style={{ opacity: 0, bottom: data.type === "self" ? "32px" : "24px" }}
			/>
			<Handle
				type="target"
				position={Position.Left}
				style={{ opacity: 0, top: "50%" }}
			/>
			<Link
				href={`/profile/${data.originalId}`}
				className="flex flex-col items-center transition-transform hover:scale-110"
			>
				<div className="relative flex flex-col items-center">
					<Avatar
						className={`${avatarSize} ${borderColor} ring-offset-background`}
					>
						<AvatarImage src={data.avatarUrl || undefined} alt={data.label} />
						<AvatarFallback>
							{data.type === "self" ? (
								<User className="h-6 w-6" />
							) : (
								data.label[0]?.toUpperCase() || "?"
							)}
						</AvatarFallback>
					</Avatar>
					{data.organizationName && (
						<Badge
							variant="secondary"
							className="-bottom-3 absolute whitespace-nowrap px-2 py-0.5 text-xs"
						>
							<Building2 className="mr-1 h-3 w-3" />
							{data.organizationName}
						</Badge>
					)}
				</div>
				<div className="mt-4 space-y-0.5 text-center">
					<p className="font-medium text-xs">
						{data.type === "self" ? "You" : data.label}
					</p>
					{data.type === "friend-of-friend" && (
						<p className="text-[10px] text-muted-foreground">
							Friend of friend
						</p>
					)}
				</div>
			</Link>
		</div>
	);
};

const nodeTypes = {
	custom: CustomNode,
};

type NetworkGraphProps = {
	networkData?: NetworkData;
};

export const NetworkGraph = ({ networkData }: NetworkGraphProps) => {
	const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Calculate node positions in a circular layout
	const calculateNodePositions = useCallback((networkNodes: NetworkNode[]) => {
		const centerX = 400;
		const centerY = 300;
		const positions: { [key: string]: { x: number; y: number } } = {};

		// Find self node
		const selfNode = networkNodes.find((n) => n.type === "self");
		if (selfNode) {
			positions[selfNode.id] = { x: centerX, y: centerY };
		}

		// Position friends in a circle around self
		const friends = networkNodes.filter((n) => n.type === "friend");
		const friendRadius = 200;
		friends.forEach((friend, index) => {
			const angle = (index * 2 * Math.PI) / friends.length;
			positions[friend.id] = {
				x: centerX + Math.cos(angle) * friendRadius,
				y: centerY + Math.sin(angle) * friendRadius,
			};
		});

		// Position friends of friends in outer circle
		const friendsOfFriends = networkNodes.filter(
			(n) => n.type === "friend-of-friend",
		);
		const fofRadius = 350;
		friendsOfFriends.forEach((fof, index) => {
			const angle = (index * 2 * Math.PI) / friendsOfFriends.length;
			positions[fof.id] = {
				x: centerX + Math.cos(angle) * fofRadius,
				y: centerY + Math.sin(angle) * fofRadius,
			};
		});

		return positions;
	}, []);

	// Convert network data to React Flow format
	useEffect(() => {
		if (!networkData) {
			setIsLoading(false);
			return;
		}

		const positions = calculateNodePositions(networkData.nodes);

		const flowNodes: Node[] = networkData.nodes.map((node) => ({
			id: node.id,
			type: "custom",
			position: positions[node.id] || { x: 0, y: 0 },
			data: {
				label: node.name,
				avatarUrl: node.avatarUrl,
				type: node.type,
				organizationName: node.organizationName,
				originalId: node.id,
			},
		}));

		// Find self node id
		const selfNodeId = networkData.nodes.find((n) => n.type === "self")?.id;

		const flowEdges: Edge[] = networkData.links.map((link, _index) => {
			// Check if this link is from self to a friend
			const isFromSelf =
				(link.source === selfNodeId || link.target === selfNodeId) &&
				link.type === "direct";

			return {
				id: `${link.source}-${link.target}`,
				source: link.source,
				target: link.target,
				type: "straight",
				animated: true,
				style: {
					stroke: isFromSelf ? "#3b82f6" : "#94a3b8",
					strokeWidth: isFromSelf ? 2 : 1,
					strokeDasharray: isFromSelf ? undefined : "5,5",
				},
			};
		});

		setNodes(flowNodes);
		setEdges(flowEdges);
		setIsLoading(false);
	}, [networkData, calculateNodePositions, setNodes, setEdges]);

	if (isLoading) {
		return (
			<div className="flex min-h-[600px] items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!networkData || networkData.nodes.length === 0) {
		return (
			<div className="flex min-h-[600px] items-center justify-center rounded-lg border-2 border-muted-foreground/25 border-dashed">
				<div className="space-y-4 text-center">
					<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
						<Network className="h-10 w-10 text-muted-foreground" />
					</div>
					<div className="space-y-2">
						<h3 className="font-semibold text-lg">No Connections Yet</h3>
						<p className="mx-auto max-w-sm text-muted-foreground text-sm">
							Start building your network by taking photos with friends!
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="relative h-[600px] w-full rounded-lg border bg-background/50">
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				nodeTypes={nodeTypes}
				fitView
				minZoom={0.5}
				maxZoom={1.5}
				defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
				proOptions={{ hideAttribution: true }}
			>
				<Background color="#aaa" gap={16} />
				<Controls className="!bg-background !border-border [&>button]:!bg-background [&>button]:!border-border [&>button:hover]:!bg-muted [&>button>svg]:!fill-foreground" />
			</ReactFlow>

			{/* Legend */}
			<div className="absolute top-4 right-4 rounded-lg border bg-background/95 p-3 shadow-sm backdrop-blur-sm">
				<h4 className="mb-2 font-medium text-xs">Connections</h4>
				<div className="space-y-1.5">
					<div className="flex items-center gap-2">
						<div className="h-0.5 w-8 bg-blue-500"></div>
						<span className="text-muted-foreground text-xs">
							Your direct friends
						</span>
					</div>
					<div className="flex items-center gap-2">
						<svg
							width="32"
							height="2"
							className="overflow-visible"
							aria-hidden="true"
						>
							<line
								x1="0"
								y1="1"
								x2="32"
								y2="1"
								stroke="#94a3b8"
								strokeWidth="1"
								strokeDasharray="5,5"
							/>
						</svg>
						<span className="text-muted-foreground text-xs">
							Other connections
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};
