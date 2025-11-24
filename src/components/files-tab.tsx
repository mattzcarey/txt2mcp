import { useState, useCallback } from "react";
import { clsx } from "clsx";
import { FileIcon, CopyIcon, CheckIcon, TrashIcon, RefreshIcon, LinkIcon } from "./icons";

interface MCPFile {
	nanoid: string;
	name: string;
	type: "upload" | "remote";
	status: "active" | "updating" | "error";
	createdAt: string;
	lastUpdated: string;
	url?: string;
}

// Mock data for demonstration
const mockFiles: MCPFile[] = [
	{
		nanoid: "abc123xyz",
		name: "api-docs.txt",
		type: "upload",
		status: "active",
		createdAt: "2024-01-15T10:30:00Z",
		lastUpdated: "2024-01-15T10:30:00Z",
	},
	{
		nanoid: "def456uvw",
		name: "https://example.com/readme.txt",
		type: "remote",
		status: "active",
		createdAt: "2024-01-14T08:15:00Z",
		lastUpdated: "2024-01-15T09:00:00Z",
		url: "https://example.com/readme.txt",
	},
	{
		nanoid: "ghi789rst",
		name: "config.txt",
		type: "upload",
		status: "error",
		createdAt: "2024-01-13T14:45:00Z",
		lastUpdated: "2024-01-13T14:45:00Z",
	},
];

export function FilesTab() {
	const [files] = useState<MCPFile[]>(mockFiles);
	const [copiedId, setCopiedId] = useState<string | null>(null);

	const handleCopy = useCallback(async (nanoid: string) => {
		await navigator.clipboard.writeText(`https://${nanoid}.txt2mcp.dev`);
		setCopiedId(nanoid);
		setTimeout(() => setCopiedId(null), 2000);
	}, []);

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getStatusBadge = (status: MCPFile["status"]) => {
		switch (status) {
			case "active":
				return (
					<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900/30 text-green-400 border border-green-500/30">
						Active
					</span>
				);
			case "updating":
				return (
					<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-900/30 text-yellow-400 border border-yellow-500/30">
						Updating
					</span>
				);
			case "error":
				return (
					<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900/30 text-red-400 border border-red-500/30">
						Error
					</span>
				);
		}
	};

	if (files.length === 0) {
		return (
			<div className="text-center py-16">
				<FileIcon className="w-16 h-16 text-border mx-auto mb-4" />
				<h3 className="text-lg font-medium mb-2">No files yet</h3>
				<p className="text-muted text-sm">Upload a text file or add a remote URL to get started</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between mb-6">
				<p className="text-sm text-muted">{files.length} MCP server(s)</p>
			</div>

			<div className="space-y-3">
				{files.map((file) => (
					<div
						key={file.nanoid}
						className="bg-border/20 border border-border rounded-lg p-4 hover:border-muted/50 transition-colors"
					>
						<div className="flex items-start justify-between gap-4">
							<div className="flex items-start gap-3 flex-1 min-w-0">
								<div
									className={clsx(
										"w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
										file.type === "upload" ? "bg-accent/20" : "bg-purple-500/20",
									)}
								>
									{file.type === "upload" ? (
										<FileIcon className="w-5 h-5 text-accent" />
									) : (
										<LinkIcon className="w-5 h-5 text-purple-400" />
									)}
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2 mb-1">
										<p className="font-medium truncate">{file.name}</p>
										{getStatusBadge(file.status)}
									</div>
									<p className="text-xs text-muted font-mono mb-2">{file.nanoid}.txt2mcp.dev</p>
									<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
										<span>Created: {formatDate(file.createdAt)}</span>
										{file.type === "remote" && <span>Updated: {formatDate(file.lastUpdated)}</span>}
									</div>
								</div>
							</div>

							<div className="flex items-center gap-1 flex-shrink-0">
								<button
									onClick={() => handleCopy(file.nanoid)}
									className="p-2 hover:bg-border rounded transition-colors"
									title="Copy URL"
								>
									{copiedId === file.nanoid ? (
										<CheckIcon className="w-4 h-4 text-green-400" />
									) : (
										<CopyIcon className="w-4 h-4 text-muted" />
									)}
								</button>
								{file.type === "remote" && (
									<button
										className="p-2 hover:bg-border rounded transition-colors"
										title="Refresh now"
									>
										<RefreshIcon className="w-4 h-4 text-muted" />
									</button>
								)}
								<button
									className="p-2 hover:bg-red-900/30 rounded transition-colors"
									title="Delete"
								>
									<TrashIcon className="w-4 h-4 text-muted hover:text-red-400" />
								</button>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
