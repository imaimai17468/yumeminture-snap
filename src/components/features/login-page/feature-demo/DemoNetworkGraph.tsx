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
import { Building2, User } from "lucide-react";
import { useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type CustomNodeData = {
	label: string;
	avatarUrl: string | null;
	type: "self" | "friend" | "friend-of-friend";
	organizationName?: string;
};

const CustomNode = ({ data }: { data: CustomNodeData }) => {
	const borderColor =
		data.type === "self"
			? "ring-2 ring-primary"
			: data.type === "friend"
				? "ring-1 ring-blue-500"
				: "ring-1 ring-muted-foreground/30";

	const avatarSize = data.type === "self" ? "h-8 w-8" : "h-6 w-6";
	const avatarPixelSize = data.type === "self" ? 32 : 24;
	const centerOffset = avatarPixelSize / 2;

	return (
		<div className="relative flex flex-col items-center">
			<div className="relative">
				<Avatar className={`${avatarSize} ${borderColor}`}>
					<AvatarImage src={data.avatarUrl || undefined} alt={data.label} />
					<AvatarFallback className="text-xs">
						{data.type === "self" ? (
							<User className="h-3 w-3" />
						) : (
							data.label[0]?.toUpperCase() || "?"
						)}
					</AvatarFallback>
				</Avatar>

				{/* Handles positioned at avatar center */}
				<Handle
					type="source"
					position={Position.Top}
					style={{
						opacity: 0,
						left: "50%",
						top: `${centerOffset}px`,
						transform: "translateX(-50%)",
					}}
				/>
				<Handle
					type="source"
					position={Position.Right}
					style={{
						opacity: 0,
						right: `${-centerOffset}px`,
						top: "50%",
						transform: "translateY(-50%)",
					}}
				/>
				<Handle
					type="source"
					position={Position.Bottom}
					style={{
						opacity: 0,
						left: "50%",
						bottom: `${-centerOffset}px`,
						transform: "translateX(-50%)",
					}}
				/>
				<Handle
					type="source"
					position={Position.Left}
					style={{
						opacity: 0,
						left: `${centerOffset}px`,
						top: "50%",
						transform: "translateY(-50%)",
					}}
				/>
				<Handle
					type="target"
					position={Position.Top}
					style={{
						opacity: 0,
						left: "50%",
						top: `${centerOffset}px`,
						transform: "translateX(-50%)",
					}}
				/>
				<Handle
					type="target"
					position={Position.Right}
					style={{
						opacity: 0,
						right: `${-centerOffset}px`,
						top: "50%",
						transform: "translateY(-50%)",
					}}
				/>
				<Handle
					type="target"
					position={Position.Bottom}
					style={{
						opacity: 0,
						left: "50%",
						bottom: `${-centerOffset}px`,
						transform: "translateX(-50%)",
					}}
				/>
				<Handle
					type="target"
					position={Position.Left}
					style={{
						opacity: 0,
						left: `${centerOffset}px`,
						top: "50%",
						transform: "translateY(-50%)",
					}}
				/>
			</div>

			<div className="mt-1 flex flex-col items-center gap-0.5">
				<p className="font-medium text-[9px] text-white">
					{data.type === "self" ? "You" : data.label.split(" ")[0]}
				</p>
				{data.organizationName && (
					<Badge
						variant="secondary"
						className="flex h-3 items-center gap-0.5 px-1 py-0 text-[7px]"
					>
						<Building2 className="h-2 w-2" />
						{data.organizationName}
					</Badge>
				)}
				{data.type === "friend-of-friend" && (
					<p className="text-[7px] text-muted-foreground">Friend of friend</p>
				)}
			</div>
		</div>
	);
};

const nodeTypes = {
	custom: CustomNode,
};

// Create nodes with spread out positions
const createDemoNodes = (): Node[] => {
	const centerX = 300;
	const centerY = 200;

	return [
		{
			id: "you",
			type: "custom",
			position: { x: centerX, y: centerY },
			data: {
				label: "You",
				avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=you",
				type: "self",
				organizationName: "TechCorp",
			},
		},
		{
			id: "friend-1",
			type: "custom",
			position: { x: centerX - 120, y: centerY - 80 },
			data: {
				label: "Sarah",
				avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
				type: "friend",
				organizationName: "DesignHub",
			},
		},
		{
			id: "friend-2",
			type: "custom",
			position: { x: centerX + 110, y: centerY - 90 },
			data: {
				label: "Alex",
				avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
				type: "friend",
				organizationName: "TechCorp",
			},
		},
		{
			id: "friend-3",
			type: "custom",
			position: { x: centerX - 130, y: centerY + 85 },
			data: {
				label: "Jordan",
				avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=jordan",
				type: "friend",
				organizationName: "StartupX",
			},
		},
		{
			id: "friend-4",
			type: "custom",
			position: { x: centerX + 125, y: centerY + 75 },
			data: {
				label: "Maya",
				avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=maya",
				type: "friend",
				organizationName: "InnovateLab",
			},
		},
		{
			id: "fof-1",
			type: "custom",
			position: { x: centerX - 210, y: centerY - 15 },
			data: {
				label: "Kim",
				avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=kim",
				type: "friend-of-friend",
				organizationName: "DesignHub",
			},
		},
		{
			id: "fof-2",
			type: "custom",
			position: { x: centerX + 200, y: centerY + 10 },
			data: {
				label: "Lee",
				avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=lee",
				type: "friend-of-friend",
				organizationName: "DataCo",
			},
		},
	];
};

// Create edges
const createDemoEdges = (): Edge[] => {
	return [
		// Direct friendships
		{
			id: "you-friend-1",
			source: "you",
			target: "friend-1",
			type: "straight",
			animated: true,
			style: { stroke: "#3b82f6", strokeWidth: 1.5 },
		},
		{
			id: "you-friend-2",
			source: "you",
			target: "friend-2",
			type: "straight",
			animated: true,
			style: { stroke: "#3b82f6", strokeWidth: 1.5 },
		},
		{
			id: "you-friend-3",
			source: "you",
			target: "friend-3",
			type: "straight",
			animated: true,
			style: { stroke: "#3b82f6", strokeWidth: 1.5 },
		},
		{
			id: "you-friend-4",
			source: "you",
			target: "friend-4",
			type: "straight",
			animated: true,
			style: { stroke: "#3b82f6", strokeWidth: 1.5 },
		},
		// Friends of friends connections
		{
			id: "friend-1-fof-1",
			source: "friend-1",
			target: "fof-1",
			type: "straight",
			animated: true,
			style: { stroke: "#94a3b8", strokeWidth: 1, strokeDasharray: "3,3" },
		},
		{
			id: "friend-2-fof-2",
			source: "friend-2",
			target: "fof-2",
			type: "straight",
			animated: true,
			style: { stroke: "#94a3b8", strokeWidth: 1, strokeDasharray: "3,3" },
		},
	];
};

export const DemoNetworkGraph = () => {
	const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

	useEffect(() => {
		// Show all nodes and edges immediately
		setNodes(createDemoNodes());
		setEdges(createDemoEdges());
	}, [setNodes, setEdges]);

	return (
		<div className="h-full w-full">
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				nodeTypes={nodeTypes}
				fitView
				fitViewOptions={{ padding: 0.2, minZoom: 0.5, maxZoom: 1 }}
				nodesDraggable={true}
				nodesConnectable={false}
				elementsSelectable={true}
				defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
				proOptions={{ hideAttribution: true }}
			>
				<Background color="#333" gap={12} size={0.5} />
				<Controls className="!bg-background !border-border [&>button]:!bg-background [&>button]:!border-border [&>button:hover]:!bg-muted [&>button>svg]:!fill-foreground" />
			</ReactFlow>
		</div>
	);
};
