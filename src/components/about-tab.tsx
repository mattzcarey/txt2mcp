import { GithubIcon } from "./icons";

export function AboutTab() {
	return (
		<div className="max-w-2xl mx-auto space-y-8">
			{/* Hero */}
			<div className="text-center">
				<h2 className="text-2xl font-bold mb-3">What is txt2mcp?</h2>
				<p className="text-muted">
					Convert any text file into an MCP (Model Context Protocol) server in seconds. Perfect for
					developers who want to expose documentation, configs, or data to AI assistants.
				</p>
			</div>

			{/* Features */}
			<div className="grid gap-4 md:grid-cols-2">
				<div className="bg-border/20 border border-border rounded-lg p-5">
					<h3 className="font-semibold mb-2">Instant Conversion</h3>
					<p className="text-sm text-muted">
						Upload a text file or provide a URL, and get a unique MCP server endpoint immediately.
					</p>
				</div>
				<div className="bg-border/20 border border-border rounded-lg p-5">
					<h3 className="font-semibold mb-2">Auto Updates</h3>
					<p className="text-sm text-muted">
						Remote files are automatically synced when the source changes, keeping your MCP server
						current.
					</p>
				</div>
				<div className="bg-border/20 border border-border rounded-lg p-5">
					<h3 className="font-semibold mb-2">Unique Subdomains</h3>
					<p className="text-sm text-muted">
						Each file gets a nanoid-based subdomain like{" "}
						<code className="text-accent">abc123.txt2mcp.dev</code>
					</p>
				</div>
				<div className="bg-border/20 border border-border rounded-lg p-5">
					<h3 className="font-semibold mb-2">Edge Powered</h3>
					<p className="text-sm text-muted">
						Built on Cloudflare Workers for fast, reliable global delivery with minimal latency.
					</p>
				</div>
			</div>

			{/* API Reference */}
			<div className="space-y-4">
				<h3 className="text-xl font-semibold">API Reference</h3>

				<div className="bg-border/20 border border-border rounded-lg overflow-hidden">
					<div className="border-b border-border px-4 py-3">
						<div className="flex items-center gap-2">
							<span className="px-2 py-0.5 bg-green-900/30 text-green-400 text-xs font-mono rounded">
								POST
							</span>
							<code className="text-sm">/api/upload</code>
						</div>
					</div>
					<div className="px-4 py-3 text-sm text-muted">
						Upload a text file directly. Returns the nanoid and MCP server URL.
					</div>
				</div>

				<div className="bg-border/20 border border-border rounded-lg overflow-hidden">
					<div className="border-b border-border px-4 py-3">
						<div className="flex items-center gap-2">
							<span className="px-2 py-0.5 bg-green-900/30 text-green-400 text-xs font-mono rounded">
								POST
							</span>
							<code className="text-sm">/api/remote</code>
						</div>
					</div>
					<div className="px-4 py-3 text-sm text-muted">
						Add a remote file URL. The content will be fetched and kept in sync.
					</div>
				</div>

				<div className="bg-border/20 border border-border rounded-lg overflow-hidden">
					<div className="border-b border-border px-4 py-3">
						<div className="flex items-center gap-2">
							<span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 text-xs font-mono rounded">
								GET
							</span>
							<code className="text-sm">/api/files</code>
						</div>
					</div>
					<div className="px-4 py-3 text-sm text-muted">
						List all your uploaded files and their metadata.
					</div>
				</div>

				<div className="bg-border/20 border border-border rounded-lg overflow-hidden">
					<div className="border-b border-border px-4 py-3">
						<div className="flex items-center gap-2">
							<span className="px-2 py-0.5 bg-red-900/30 text-red-400 text-xs font-mono rounded">
								DELETE
							</span>
							<code className="text-sm">{"/api/files/{nanoid}"}</code>
						</div>
					</div>
					<div className="px-4 py-3 text-sm text-muted">Delete a file and its MCP server.</div>
				</div>
			</div>

			{/* MCP Format */}
			<div className="space-y-4">
				<h3 className="text-xl font-semibold">MCP Server Format</h3>
				<p className="text-sm text-muted">
					Your MCP server will be accessible at{" "}
					<code className="text-accent">https://&#123;nanoid&#125;.txt2mcp.dev</code> and will serve
					your text content in a format compatible with Claude and other MCP-enabled AI assistants.
				</p>
				<div className="bg-border/20 border border-border rounded-lg p-4">
					<pre className="text-sm font-mono text-muted overflow-x-auto">
						{`{
  "name": "txt2mcp-server",
  "version": "1.0.0",
  "description": "Auto-generated MCP server",
  "tools": [...],
  "resources": [
    {
      "name": "content",
      "description": "The text file content",
      "mimeType": "text/plain"
    }
  ]
}`}
					</pre>
				</div>
			</div>

			{/* Footer */}
			<div className="border-t border-border pt-6 flex items-center justify-between">
				<p className="text-sm text-muted">Built with Cloudflare Workers, R2, and Durable Objects</p>
				<a
					href="https://github.com"
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
				>
					<GithubIcon className="w-5 h-5" />
					View on GitHub
				</a>
			</div>
		</div>
	);
}
