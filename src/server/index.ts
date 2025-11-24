import { Hono } from "hono";
import { cors } from "hono/cors";
import { nanoid as generateNanoid } from "nanoid";
import { getAgentByName } from "agents";
import { MCPServer } from "./mcp-server";

// Generate lowercase nanoid to avoid case sensitivity issues with DNS/URLs
const nanoid = () => generateNanoid(24).toLowerCase();

export { MCPServer };

export interface Env {
	MCPServer: DurableObjectNamespace<MCPServer>;
	BUCKET: R2Bucket;
	ASSETS: Fetcher;
}

const api = new Hono<{ Bindings: Env }>();

api.use("/*", cors());

// Upload a file
api.post("/api/upload", async (c) => {
	const formData = await c.req.formData();
	const file = formData.get("file") as File | null;

	if (!file) {
		return c.json({ error: "No file provided" }, 400);
	}

	if (file.size > 10 * 1024 * 1024) {
		return c.json({ error: "File size must be less than 10MB" }, 400);
	}

	const content = await file.text();
	const id = nanoid();

	// Store in R2
	await c.env.BUCKET.put(`${id}/content.txt`, content);
	await c.env.BUCKET.put(
		`${id}/metadata.json`,
		JSON.stringify({
			name: file.name,
			type: "upload",
			createdAt: new Date().toISOString(),
		}),
	);

	// Initialize the Durable Object
	const agent = await getAgentByName(c.env.MCPServer, id);
	await agent.initialize(content, file.name, "upload");

	return c.json({ nanoid: id, url: `https://${id}.txt2mcp.com` });
});

// Add a remote URL
api.post("/api/remote", async (c) => {
	const { url } = await c.req.json<{ url: string }>();

	if (!url) {
		return c.json({ error: "No URL provided" }, 400);
	}

	try {
		new URL(url);
	} catch {
		return c.json({ error: "Invalid URL" }, 400);
	}

	const response = await fetch(url);
	if (!response.ok) {
		return c.json({ error: "Failed to fetch remote content" }, 400);
	}

	const content = await response.text();
	const id = nanoid();

	// Store in R2
	await c.env.BUCKET.put(`${id}/content.txt`, content);
	await c.env.BUCKET.put(
		`${id}/metadata.json`,
		JSON.stringify({
			name: url,
			type: "remote",
			sourceUrl: url,
			createdAt: new Date().toISOString(),
		}),
	);

	// Initialize the Durable Object
	const agent = await getAgentByName(c.env.MCPServer, id);
	await agent.initialize(content, url, "remote", url);

	return c.json({ nanoid: id, url: `https://${id}.txt2mcp.com` });
});

// Get status of an MCP server
api.get("/api/status/:nanoid", async (c) => {
	const id = c.req.param("nanoid");

	const metadataObj = await c.env.BUCKET.get(`${id}/metadata.json`);
	if (!metadataObj) {
		return c.json({ error: "Not found" }, 404);
	}

	const contentObj = await c.env.BUCKET.get(`${id}/content.txt`);
	const metadata = await metadataObj.json<{
		name: string;
		type: "upload" | "remote";
		sourceUrl?: string;
		createdAt: string;
	}>();
	const content = contentObj ? await contentObj.text() : "";

	return c.json({
		nanoid: id,
		name: metadata.name,
		type: metadata.type,
		sourceUrl: metadata.sourceUrl,
		createdAt: metadata.createdAt,
		content,
	});
});

// MCP endpoint - route to the Durable Object
api.all("/mcp", async (c) => {
	// Use Host header to get the actual requested hostname
	const host = c.req.header("host") || new URL(c.req.url).hostname;
	const id = host.split(".")[0];

	if (!id || id === "txt2mcp" || id === "www") {
		return c.json({ error: "Invalid MCP server" }, 400);
	}

	const agent = await getAgentByName(c.env.MCPServer, id);
	return agent.onMcpRequest(c.req.raw);
});

// Export the fetch handler
export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		// Use the Host header which contains the actual requested hostname
		const host = request.headers.get("host") || url.hostname;

		// Check if this is a subdomain request (not main domain)
		const isSubdomain = host !== "txt2mcp.com" && host !== "www.txt2mcp.com" && host.endsWith(".txt2mcp.com");

		if (isSubdomain) {
			// Subdomains only serve /mcp endpoint
			if (url.pathname === "/mcp") {
				return api.fetch(request, env, ctx);
			}
			// Return info about how to use the MCP server
			if (url.pathname === "/" || url.pathname === "") {
				const nanoid = host.split(".")[0];
				return new Response(
					JSON.stringify({
						name: "txt2mcp MCP Server",
						nanoid,
						endpoint: `https://${host}/mcp`,
						usage: "Connect your MCP client to the endpoint URL above",
					}),
					{
						headers: {
							"Content-Type": "application/json",
							"Access-Control-Allow-Origin": "*",
						},
					},
				);
			}
			return new Response("Not Found", { status: 404 });
		}

		// Main domain: Handle API routes
		if (url.pathname.startsWith("/api/")) {
			return api.fetch(request, env, ctx);
		}

		// Main domain: Serve static assets for everything else
		return env.ASSETS.fetch(request);
	},
};
