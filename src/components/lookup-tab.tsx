import { useState, useCallback } from "react";

interface ServerInfo {
	nanoid: string;
	name: string;
	type: "upload" | "remote";
	createdAt: string;
	content: string;
	sourceUrl?: string;
}

export function LookupTab() {
	const [nanoidInput, setNanoidInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
	const [copied, setCopied] = useState(false);

	const extractNanoid = (input: string): string => {
		const trimmed = input.trim();

		// Check if it's a URL (contains txt2mcp.com)
		if (trimmed.includes("txt2mcp.com")) {
			// Try to parse as URL
			try {
				const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
				const hostname = url.hostname;
				// Extract subdomain (nanoid) from hostname like "abc123.txt2mcp.com"
				const parts = hostname.split(".");
				if (parts.length >= 3 && parts[1] === "txt2mcp") {
					return parts[0];
				}
			} catch {
				// Not a valid URL, try regex
			}
			// Fallback: extract from pattern like "abc123.txt2mcp.com"
			const match = trimmed.match(/^(?:https?:\/\/)?([^.]+)\.txt2mcp\.com/);
			if (match) {
				return match[1];
			}
		}

		// Assume it's just the nanoid
		return trimmed;
	};

	const handleLookup = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			if (!nanoidInput.trim()) return;

			setIsLoading(true);
			setError(null);
			setServerInfo(null);

			try {
				const nanoid = extractNanoid(nanoidInput);
				const response = await fetch(`/api/status/${nanoid}`);

				if (!response.ok) {
					if (response.status === 404) {
						throw new Error("MCP server not found");
					}
					const data = (await response.json()) as { error?: string };
					throw new Error(data.error || "Lookup failed");
				}

				const data = (await response.json()) as ServerInfo;
				setServerInfo(data);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Lookup failed");
			} finally {
				setIsLoading(false);
			}
		},
		[nanoidInput],
	);

	const handleCopy = useCallback(async () => {
		if (serverInfo) {
			await navigator.clipboard.writeText(`https://${serverInfo.nanoid}.txt2mcp.com/mcp`);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	}, [serverInfo]);

	const handleReset = useCallback(() => {
		setServerInfo(null);
		setError(null);
		setNanoidInput("");
	}, []);

	if (serverInfo) {
		return (
			<div className="space-y-6">
				<div className="card">
					<div className="flex items-center justify-between gap-4 mb-6">
						<div>
							<h3 className="font-medium mb-1">{serverInfo.name}</h3>
							<p className="text-sm text-muted">
								{serverInfo.type === "remote" ? "Remote URL" : "Uploaded file"}
							</p>
						</div>
						<span className="badge badge-success">Active</span>
					</div>

					<div className="space-y-4">
						<div>
							<p className="text-xs text-muted mb-1">MCP Server URL</p>
							<div className="code-block">
								<div className="flex items-center gap-2">
									<code className="code-inline" style={{ flex: 1 }}>
										https://{serverInfo.nanoid}.txt2mcp.com/mcp
									</code>
									<button onClick={handleCopy} className="btn btn-ghost" style={{ padding: "0.375rem" }}>
										{copied ? (
											<svg
												width="16"
												height="16"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												style={{ color: "var(--color-success)" }}
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M5 13l4 4L19 7"
												/>
											</svg>
										) : (
											<svg
												width="16"
												height="16"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												className="text-muted"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
												/>
											</svg>
										)}
									</button>
								</div>
							</div>
						</div>

						{serverInfo.sourceUrl && (
							<div>
								<p className="text-xs text-muted mb-1">Source URL</p>
								<p className="text-sm font-mono" style={{ wordBreak: "break-all", opacity: 0.8 }}>
									{serverInfo.sourceUrl}
								</p>
							</div>
						)}

						<div>
							<p className="text-xs text-muted mb-1">Created</p>
							<p className="text-sm">{new Date(serverInfo.createdAt).toLocaleString()}</p>
						</div>

						<div>
							<p className="text-xs text-muted mb-1">Content Preview</p>
							<div className="code-block">
								<pre>
									{serverInfo.content.slice(0, 500)}
									{serverInfo.content.length > 500 && "..."}
								</pre>
							</div>
						</div>
					</div>
				</div>

				<button onClick={handleReset} className="btn btn-secondary btn-full">
					Look Up Another
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="text-center mb-8">
				<h2 style={{ fontSize: "1.125rem" }} className="font-medium mb-2">
					Look up an MCP Server
				</h2>
				<p className="text-sm text-muted">Enter the nanoid to view server details</p>
			</div>

			{error && <div className="alert alert-error">{error}</div>}

			<form onSubmit={handleLookup} className="space-y-4">
				<input
					type="text"
					value={nanoidInput}
					onChange={(e) => setNanoidInput(e.target.value)}
					placeholder="abc123xyz or abc123xyz.txt2mcp.com"
					className="input input-mono"
				/>
				<button
					type="submit"
					disabled={!nanoidInput.trim() || isLoading}
					className="btn btn-primary btn-full"
				>
					{isLoading ? (
						<span className="flex items-center gap-2">
							<svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="spinner">
								<circle
									style={{ opacity: 0.25 }}
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								/>
								<path
									style={{ opacity: 0.75 }}
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
							Looking up...
						</span>
					) : (
						"Look Up"
					)}
				</button>
			</form>

			<p className="text-xs text-center text-muted">
				Enter the nanoid or full URL of your MCP server
			</p>
		</div>
	);
}
