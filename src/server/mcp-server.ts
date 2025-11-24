import { Agent } from "agents";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpHandler, WorkerTransport, type TransportState } from "agents/mcp";
import { z } from "zod";

const STATE_KEY = "mcp_transport_state";

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

export class MCPServer extends Agent<Env, State> {
	server = new McpServer({
		name: "txt2mcp",
		version: "1.0.0",
	});

	transport = new WorkerTransport({
		sessionIdGenerator: () => this.name,
		storage: {
			get: () => this.ctx.storage.kv.get<TransportState>(STATE_KEY),
			set: (state: TransportState) => this.ctx.storage.kv.put<TransportState>(STATE_KEY, state),
		},
	});

	initialState: State = {
		content: "",
		name: "",
		type: "upload",
		lastUpdated: new Date().toISOString(),
	};

	onStart() {
		// Single search tool
		this.server.tool(
			"search",
			"Search through the text content",
			{ query: z.string().describe("The search query") },
			async ({ query }) => {
				const content = this.state.content;
				const lines = content.split("\n");
				const matches: string[] = [];

				const queryLower = query.toLowerCase();
				for (const line of lines) {
					if (line.toLowerCase().includes(queryLower)) {
						matches.push(line.trim());
					}
				}

				if (matches.length === 0) {
					return {
						content: [{ type: "text" as const, text: `No matches found for "${query}"` }],
					};
				}

				return {
					content: [
						{
							type: "text" as const,
							text: `Found ${matches.length} match(es):\n\n${matches.join("\n")}`,
						},
					],
				};
			},
		);
	}

	async onMcpRequest(request: Request) {
		return createMcpHandler(this.server, {
			transport: this.transport,
		})(request, this.env, {} as ExecutionContext);
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
			await this.ctx.storage.setAlarm(Date.now() + 60 * 60 * 1000);
		}
	}

	async alarm() {
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
				const nanoid = this.ctx.id.name;
				if (nanoid) {
					await this.env.BUCKET.put(`${nanoid}/content.txt`, content);
				}
			}
		} catch (error) {
			console.error("Failed to update content:", error);
		}

		// Schedule next update
		await this.ctx.storage.setAlarm(Date.now() + 60 * 60 * 1000);
	}
}
