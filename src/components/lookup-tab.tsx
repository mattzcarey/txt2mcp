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

	const handleLookup = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			if (!nanoidInput.trim()) return;

			setIsLoading(true);
			setError(null);
			setServerInfo(null);

			try {
				const response = await fetch(`/api/status/${nanoidInput.trim()}`);

				if (!response.ok) {
					if (response.status === 404) {
						throw new Error("MCP server not found");
					}
					const data = await response.json();
					throw new Error(data.error || "Lookup failed");
				}

				const data = await response.json();
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
			await navigator.clipboard.writeText(`https://${serverInfo.nanoid}.txt2mcp.com`);
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
				<div className="bg-card border border-border rounded-xl p-6">
					<div className="flex items-start justify-between gap-4 mb-6">
						<div>
							<h3 className="font-medium mb-1">{serverInfo.name}</h3>
							<p className="text-sm text-muted">
								{serverInfo.type === "remote" ? "Remote URL" : "Uploaded file"}
							</p>
						</div>
						<span className="px-2.5 py-1 bg-success/10 text-success text-xs font-medium rounded-full">
							Active
						</span>
					</div>

					<div className="space-y-4">
						<div>
							<p className="text-xs text-muted mb-1.5">MCP Server URL</p>
							<div className="flex items-center gap-2 bg-background border border-border rounded-lg p-3">
								<code className="flex-1 text-sm font-mono text-accent break-all">
									https://{serverInfo.nanoid}.txt2mcp.com
								</code>
								<button
									onClick={handleCopy}
									className="flex-shrink-0 p-1.5 hover:bg-card rounded transition-colors"
								>
									{copied ? (
										<svg
											className="w-4 h-4 text-success"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
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
											className="w-4 h-4 text-muted"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
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

						{serverInfo.sourceUrl && (
							<div>
								<p className="text-xs text-muted mb-1.5">Source URL</p>
								<p className="text-sm font-mono text-foreground/80 break-all">
									{serverInfo.sourceUrl}
								</p>
							</div>
						)}

						<div>
							<p className="text-xs text-muted mb-1.5">Created</p>
							<p className="text-sm">{new Date(serverInfo.createdAt).toLocaleString()}</p>
						</div>

						<div>
							<p className="text-xs text-muted mb-1.5">Content Preview</p>
							<pre className="text-sm font-mono text-foreground/80 bg-background border border-border rounded-lg p-3 overflow-x-auto max-h-40">
								{serverInfo.content.slice(0, 500)}
								{serverInfo.content.length > 500 && "..."}
							</pre>
						</div>
					</div>
				</div>

				<button
					onClick={handleReset}
					className="w-full py-3 bg-card hover:bg-card-hover border border-border rounded-lg font-medium transition-colors"
				>
					Look Up Another
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="text-center mb-8">
				<h2 className="text-lg font-medium mb-2">Look up an MCP Server</h2>
				<p className="text-sm text-muted">Enter the nanoid to view server details</p>
			</div>

			{error && (
				<div className="bg-error/10 border border-error/20 rounded-lg p-4 text-error text-sm">
					{error}
				</div>
			)}

			<form onSubmit={handleLookup} className="space-y-4">
				<input
					type="text"
					value={nanoidInput}
					onChange={(e) => setNanoidInput(e.target.value)}
					placeholder="Enter nanoid (e.g., abc123xyz)"
					className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-accent font-mono"
				/>
				<button
					type="submit"
					disabled={!nanoidInput.trim() || isLoading}
					className="w-full py-3 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
				>
					{isLoading ? (
						<span className="inline-flex items-center gap-2">
							<svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								/>
								<path
									className="opacity-75"
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
				The nanoid is the unique identifier in your MCP server URL
			</p>
		</div>
	);
}
