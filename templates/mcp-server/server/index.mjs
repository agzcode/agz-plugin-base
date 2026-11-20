// A minimal MCP server over stdio, without a dependency: one JSON-RPC message per line on stdin, one answer per line
// on stdout. It implements what a client needs to list and call tools: initialize, ping, tools/list and tools/call.
// Replace TOOLS with the plugin's real tools, or swap the whole file for a server built on an MCP library.
import { createInterface } from "node:readline";

const TOOLS = [
	{
		name: "count",
		description: "Count the words, lines and characters of a text. Returns the three numbers as JSON.",
		inputSchema: {
			type: "object",
			properties: { text: { type: "string", description: "The text to count." } },
			required: ["text"],
		},
		run: ({ text }) => {
			if (typeof text !== "string") throw new Error("text must be a string");
			const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
			return { words, lines: text === "" ? 0 : text.split("\n").length, characters: [...text].length };
		},
	},
];

/** The answer to one request, or undefined for a notification, which gets none. */
function answer(message) {
	const { id, method, params } = message;
	if (id === undefined) return undefined;
	const result = (value) => ({ jsonrpc: "2.0", id, result: value });
	switch (method) {
		case "initialize":
			return result({
				protocolVersion: typeof params?.protocolVersion === "string" ? params.protocolVersion : "2025-06-18",
				capabilities: { tools: {} },
				serverInfo: { name: "my-plugin", version: "0.1.0" },
			});
		case "ping":
			return result({});
		case "tools/list":
			return result({ tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) });
		case "tools/call": {
			const tool = TOOLS.find((entry) => entry.name === params?.name);
			if (tool === undefined) return { jsonrpc: "2.0", id, error: { code: -32602, message: `unknown tool ${String(params?.name)}` } };
			try {
				const value = tool.run(params.arguments ?? {});
				return result({ content: [{ type: "text", text: JSON.stringify(value) }], structuredContent: value });
			} catch (error) {
				// A tool's own failure is a result the model reads, not a protocol error.
				return result({ content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }], isError: true });
			}
		}
		default:
			return { jsonrpc: "2.0", id, error: { code: -32601, message: `method not found: ${String(method)}` } };
	}
}

const lines = createInterface({ input: process.stdin });
lines.on("line", (line) => {
	if (line.trim() === "") return;
	let message;
	try {
		message = JSON.parse(line);
	} catch {
		process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse error" } })}\n`);
		return;
	}
	const reply = answer(message);
	if (reply !== undefined) process.stdout.write(`${JSON.stringify(reply)}\n`);
});
// The client closes stdin to stop the server.
lines.on("close", () => process.exit(0));
