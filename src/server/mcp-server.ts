import { Agent } from "agents";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  createMcpHandler,
  WorkerTransport,
  type TransportState,
} from "agents/mcp";
import { z } from "zod";
import { create, insert, search, type Orama } from "@orama/orama";
import { RecursiveChunker } from "@chonkiejs/core";
import { Effect } from "effect";

const STATE_KEY = "mcp_transport_state";
const CHUNK_SIZE = 2000;
const MIN_CHARS_PER_CHUNK = 200;

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

interface ChunkDocument {
  chunkIndex: number;
  content: string;
  fileName: string;
}

type DocsDb = Orama<{
  chunkIndex: "number";
  content: "string";
  fileName: "string";
}>;

const formatResults = (
  results: Awaited<ReturnType<typeof search>>,
  query: string,
  k: number,
  fileName: string
): string => {
  const hitCount = results.count;
  const elapsed = results.elapsed.formatted;

  let output = `**Search Results**\n\n`;
  output += `Found ${hitCount} result${hitCount !== 1 ? "s" : ""} for "${query}" in "${fileName}" (${elapsed})\n\n`;

  if (hitCount === 0) {
    output += `No results found. Try using different keywords or modify the spelling.`;
    return output;
  }

  output += `Showing top ${Math.min(k, hitCount)} result${Math.min(k, hitCount) !== 1 ? "s" : ""}:\n\n`;
  output += `---\n\n`;

  for (const hit of results.hits) {
    const doc = hit.document as ChunkDocument;
    output += `**Chunk ${doc.chunkIndex + 1}**\n\n`;
    output += `${doc.content}\n\n`;
    output += `---\n\n`;
  }

  return output;
};

export class MCPServer extends Agent<Env, State> {
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

  private buildSearchIndex = (content: string, fileName: string) =>
    Effect.gen(function* () {
      const chunker = yield* Effect.promise(() =>
        RecursiveChunker.create({
          chunkSize: CHUNK_SIZE,
          minCharactersPerChunk: MIN_CHARS_PER_CHUNK,
        })
      );

      const chunks = yield* Effect.promise(() => chunker.chunk(content));

      const docsDb: DocsDb = yield* Effect.sync(() =>
        create({
          schema: {
            chunkIndex: "number",
            content: "string",
            fileName: "string",
          } as const,
          components: {
            tokenizer: {
              stemming: true,
              language: "english",
            },
          },
        })
      );

      for (let i = 0; i < chunks.length; i++) {
        yield* Effect.sync(() =>
          insert(docsDb, {
            chunkIndex: i,
            content: chunks[i].text,
            fileName,
          })
        );
      }

      return docsDb;
    });

  private async loadContent(): Promise<{
    content: string;
    name: string;
  } | null> {
    // First try state
    if (this.state.content) {
      return { content: this.state.content, name: this.state.name };
    }

    // Fall back to R2 - get nanoid from Agent.name (set by getAgentByName)
    const nanoid = this.name;
    if (!nanoid) {
      return null;
    }

    try {
      // Try exact case first, then try listing to find case-insensitive match
      let contentObj = await this.env.BUCKET.get(`${nanoid}/content.txt`);
      let metadataObj = await this.env.BUCKET.get(`${nanoid}/metadata.json`);
      let actualNanoid = nanoid;

      // If not found, try to find case-insensitive match by listing
      if (!contentObj) {
        const list = await this.env.BUCKET.list({ limit: 1000 });
        const lowerNanoid = nanoid.toLowerCase();

        for (const obj of list.objects) {
          const key = obj.key;
          const keyNanoid = key.split("/")[0];
          if (keyNanoid.toLowerCase() === lowerNanoid) {
            actualNanoid = keyNanoid;
            break;
          }
        }

        if (actualNanoid !== nanoid) {
          contentObj = await this.env.BUCKET.get(`${actualNanoid}/content.txt`);
          metadataObj = await this.env.BUCKET.get(
            `${actualNanoid}/metadata.json`
          );
        }
      }

      if (!contentObj) {
        return null;
      }

      const content = await contentObj.text();
      const metadata = metadataObj
        ? await metadataObj.json<{
            name: string;
            type: "upload" | "remote";
            sourceUrl?: string;
          }>()
        : { name: nanoid, type: "upload" as const };

      // Update state for future requests
      this.setState({
        content,
        name: metadata.name,
        type: metadata.type,
        sourceUrl: metadata.sourceUrl,
        lastUpdated: new Date().toISOString(),
      });

      return { content, name: metadata.name };
    } catch (error) {
      console.error("Failed to load content from R2:", error);
      return null;
    }
  }

  onStart() {
    const self = this;

    this.server.tool(
      "search",
      "Token efficient search through the text content using Orama full-text search",
      {
        query: z
          .string()
          .describe(
            "Search query string (e.g., 'api endpoint', 'configuration')"
          ),
        k: z
          .number()
          .optional()
          .default(5)
          .describe("Number of results to return"),
      },
      async ({ query, k }) => {
        const loaded = await self.loadContent();

        if (!loaded) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No content available to search. The document may not be initialized.",
              },
            ],
          };
        }

        const { content, name: fileName } = loaded;

        const searchEffect = Effect.gen(function* () {
          const term = query.trim();

          const docsDb = yield* self.buildSearchIndex(content, fileName);

          const result = search(docsDb, { term, limit: k });
          const searchResult = yield* result instanceof Promise
            ? Effect.promise(() => result)
            : Effect.succeed(result);

          return {
            content: [
              {
                type: "text" as const,
                text: formatResults(searchResult, term, k, fileName),
              },
            ],
          };
        }).pipe(
          Effect.catchAll((error) => {
            console.error("Search error:", error);
            return Effect.succeed({
              content: [
                {
                  type: "text" as const,
                  text: `Search error: ${error instanceof Error ? error.message : "Unknown error"}`,
                },
              ],
            });
          })
        );

        return await Effect.runPromise(searchEffect);
      }
    );
  }

  async onMcpRequest(request: Request) {
    return createMcpHandler(this.server)(
      request,
      this.env,
      {} as ExecutionContext
    );
  }

  async initialize(
    content: string,
    name: string,
    type: "upload" | "remote",
    sourceUrl?: string
  ) {
    this.setState({
      content,
      name,
      type,
      sourceUrl,
      lastUpdated: new Date().toISOString(),
    });

    // Schedule updates for remote URLs (every day)
    if (type === "remote" && sourceUrl) {
      await this.ctx.storage.setAlarm(Date.now() + 24 * 60 * 60 * 1000);
    }
  }

  alarm = async () => {
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

    // Schedule next update (daily)
    await this.ctx.storage.setAlarm(Date.now() + 24 * 60 * 60 * 1000);
  };
}
