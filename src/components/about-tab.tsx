export function AboutTab() {
	return (
		<div className="space-y-6">
			<div>
				<h2 style={{ fontSize: "1.125rem" }} className="font-medium mb-2">
					What is txt2mcp?
				</h2>
				<p className="text-muted text-sm" style={{ lineHeight: 1.6 }}>
					txt2mcp converts text files into MCP (Model Context Protocol) servers. Upload a file or
					provide a URL, and get a unique endpoint that AI assistants can connect to.
				</p>
			</div>

			<div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
				<div className="card">
					<h3 className="font-medium mb-2">Instant Conversion</h3>
					<p className="text-sm text-muted">
						Upload a text file and get an MCP server URL immediately.
					</p>
				</div>
				<div className="card">
					<h3 className="font-medium mb-2">Auto-Updates</h3>
					<p className="text-sm text-muted">
						Remote URLs are automatically synced when content changes.
					</p>
				</div>
				<div className="card">
					<h3 className="font-medium mb-2">Unique Subdomains</h3>
					<p className="text-sm text-muted">
						Each server gets a unique URL like <code className="code-inline text-xs">abc123.txt2mcp.com</code>
					</p>
				</div>
				<div className="card">
					<h3 className="font-medium mb-2">Smart Search</h3>
					<p className="text-sm text-muted">
						Full-text search powered by Orama for fast, relevant results.
					</p>
				</div>
			</div>

			<div>
				<h2 style={{ fontSize: "1.125rem" }} className="font-medium mb-2">
					How to Use
				</h2>
				<div className="code-block font-mono text-sm">
					<p className="text-muted mb-2"># Add to your MCP client config</p>
					<pre style={{ margin: 0 }}>
						{`{
  "mcpServers": {
    "my-content": {
      "url": "https://abc123.txt2mcp.com/mcp"
    }
  }
}`}
					</pre>
				</div>
			</div>

			<div style={{ paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
				<p className="text-xs text-muted">Open source and free to use</p>
			</div>
		</div>
	);
}
