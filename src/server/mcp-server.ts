import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

interface Env {
	MCPServer: DurableObjectNamespace<MCPServer>;
	BUCKET: R2Bucket;
}

interface State {
	content: string;
	name: string;
	type: "upload" | "remote";
	sourceUrl?: string;
	lastUpdated: string;
}

export class MCPServer extends McpAgent<Env, State, {}> {
	server = new McpServer({
		name: "txt2mcp",
		version: "1.0.0",
	});

	initialState: State = {
		content: "",
		name: "",
		type: "upload",
		lastUpdated: new Date().toISOString(),
	};

	async init() {
		// Register the content resource
		this.server.resource("content", "mcp://txt2mcp/content", () => {
			return {
				contents: [
					{
						text: this.state.content,
						uri: "mcp://txt2mcp/content",
						mimeType: "text/plain",
					},
				],
			};
		});

		// Register a tool to get content info
		this.server.tool("get_content", "Get the text content", {}, async () => {
			return {
				content: [
					{
						type: "text",
						text: this.state.content,
					},
				],
			};
		});

		// Register a tool to get metadata
		this.server.tool("get_info", "Get information about this MCP server", {}, async () => {
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(
							{
								name: this.state.name,
								type: this.state.type,
								sourceUrl: this.state.sourceUrl,
								lastUpdated: this.state.lastUpdated,
								contentLength: this.state.content.length,
							},
							null,
							2,
						),
					},
				],
			};
		});
	}

	async initialize(content: string, name: string, type: "upload" | "remote", sourceUrl?: string) {
		this.setState({
			content,
			name,
			type,
			sourceUrl,
			lastUpdated: new Date().toISOString(),
		});

		// Schedule updates for remote URLs
		if (type === "remote" && sourceUrl) {
			await this.schedule(60 * 60, "updateContent"); // Update every hour
		}
	}

	async updateContent() {
		if (this.state.type !== "remote" || !this.state.sourceUrl) {
			return;
		}

		try {
			const response = await fetch(this.state.sourceUrl);
			if (response.ok) {
				const content = await response.text();
				this.setState({
					...this.state,
					content,
					lastUpdated: new Date().toISOString(),
				});

				// Update R2 as well
				await this.env.BUCKET.put(`${this.name}/content.txt`, content);

				// Schedule next update
				await this.schedule(60 * 60, "updateContent");
			}
		} catch (error) {
			console.error("Failed to update content:", error);
			// Still schedule next update even on failure
			await this.schedule(60 * 60, "updateContent");
		}
	}

	onStateUpdate(state: State) {
		console.log("State updated:", { name: state.name, contentLength: state.content.length });
	}
}
