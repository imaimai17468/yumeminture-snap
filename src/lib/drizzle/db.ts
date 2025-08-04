import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const getDatabaseUrl = () => {
	if (process.env.DATABASE_URL) {
		return process.env.DATABASE_URL;
	}

	throw new Error(
		"DATABASE_URL environment variable is required. " +
			"Please set it in your .env.local file. " +
			"You can find the connection string in your Supabase project settings under Settings > Database.",
	);
};

const connectionString = getDatabaseUrl();

const client = postgres(connectionString, {
	max: 10, // 最大接続数
	idle_timeout: 30, // アイドルタイムアウト（秒）
	connect_timeout: 10, // 接続タイムアウト（秒）
});

export const db = drizzle(client, { schema });
