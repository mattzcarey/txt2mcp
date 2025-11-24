export function AboutTab() {
	return (
		<div className="space-y-8">
			<div>
				<h2 className="text-lg font-medium mb-3">What is txt2mcp?</h2>
				<p className="text-muted leading-relaxed">
					txt2mcp converts text files into MCP (Model Context Protocol) servers. Upload a file or
					provide a URL, and get a unique endpoint that AI assistants can connect to.
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="bg-card border border-border rounded-xl p-5">
					<h3 className="font-medium mb-2">Instant Conversion</h3>
					<p className="text-sm text-muted">
						Upload a text file and get an MCP server URL immediately.
					</p>
				</div>
				<div className="bg-card border border-border rounded-xl p-5">
					<h3 className="font-medium mb-2">Auto-Updates</h3>
					<p className="text-sm text-muted">
						Remote URLs are automatically synced when content changes.
					</p>
				</div>
				<div className="bg-card border border-border rounded-xl p-5">
					<h3 className="font-medium mb-2">Unique Subdomains</h3>
					<p className="text-sm text-muted">
						Each server gets a unique URL like{" "}
						<code className="text-accent text-xs">abc123.txt2mcp.com</code>
					</p>
				</div>
				<div className="bg-card border border-border rounded-xl p-5">
					<h3 className="font-medium mb-2">Edge Powered</h3>
					<p className="text-sm text-muted">
						Built on Cloudflare Workers for global, low-latency delivery.
					</p>
				</div>
			</div>

			<div>
				<h2 className="text-lg font-medium mb-3">How to Use</h2>
				<div className="bg-card border border-border rounded-xl p-5 font-mono text-sm">
					<p className="text-muted mb-2"># Add to your MCP client config</p>
					<pre className="text-foreground overflow-x-auto">
						{`{
  "mcpServers": {
    "my-content": {
      "url": "https://abc123.txt2mcp.com/sse"
    }
  }
}`}
					</pre>
				</div>
			</div>

			<div className="pt-4 border-t border-border">
				<p className="text-xs text-muted">Built with Cloudflare Workers and Durable Objects</p>
			</div>
		</div>
	);
}
