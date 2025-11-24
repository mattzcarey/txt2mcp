import { Hono } from "hono";
import { cors } from "hono/cors";
import { nanoid } from "nanoid";
import { MCPServer } from "./mcp-server";

export { MCPServer };

export interface Env {
	MCPServer: DurableObjectNamespace<MCPServer>;
	BUCKET: R2Bucket;
}

const app = new Hono<{ Bindings: Env }>();

app.use("/*", cors());

// Upload a file
app.post("/api/upload", async (c) => {
	const formData = await c.req.formData();
	const file = formData.get("file") as File | null;

	if (!file) {
		return c.json({ error: "No file provided" }, 400);
	}

	if (file.size > 10 * 1024 * 1024) {
		return c.json({ error: "File size must be less than 10MB" }, 400);
	}

	const content = await file.text();
	const id = nanoid(10);

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
	const doId = c.env.MCPServer.idFromName(id);
	const stub = c.env.MCPServer.get(doId);
	await stub.initialize(content, file.name, "upload");

	return c.json({ nanoid: id, url: `https://${id}.txt2mcp.com` });
});

// Add a remote URL
app.post("/api/remote", async (c) => {
	const { url } = await c.req.json<{ url: string }>();

	if (!url) {
		return c.json({ error: "No URL provided" }, 400);
	}

	// Validate URL
	try {
		new URL(url);
	} catch {
		return c.json({ error: "Invalid URL" }, 400);
	}

	// Fetch the content
	const response = await fetch(url);
	if (!response.ok) {
		return c.json({ error: "Failed to fetch remote content" }, 400);
	}

	const content = await response.text();
	const id = nanoid(10);

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

	// Initialize the Durable Object with scheduled updates
	const doId = c.env.MCPServer.idFromName(id);
	const stub = c.env.MCPServer.get(doId);
	await stub.initialize(content, url, "remote", url);

	return c.json({ nanoid: id, url: `https://${id}.txt2mcp.com` });
});

// Get status of an MCP server
app.get("/api/status/:nanoid", async (c) => {
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

// MCP endpoints - route to the Durable Object
app.all("/sse/*", async (c) => {
	// Extract nanoid from subdomain or query param
	const url = new URL(c.req.url);
	const host = url.hostname;
	const nanoid = host.split(".")[0];

	if (!nanoid || nanoid === "txt2mcp" || nanoid === "www") {
		return c.json({ error: "Invalid MCP server" }, 400);
	}

	const doId = c.env.MCPServer.idFromName(nanoid);
	const stub = c.env.MCPServer.get(doId);

	return stub.fetch(c.req.raw);
});

app.all("/mcp/*", async (c) => {
	const url = new URL(c.req.url);
	const host = url.hostname;
	const nanoid = host.split(".")[0];

	if (!nanoid || nanoid === "txt2mcp" || nanoid === "www") {
		return c.json({ error: "Invalid MCP server" }, 400);
	}

	const doId = c.env.MCPServer.idFromName(nanoid);
	const stub = c.env.MCPServer.get(doId);

	return stub.fetch(c.req.raw);
});

export default app;
