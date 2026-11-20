// The MCP server of the plugin, over stdio and without a dependency: one JSON-RPC message per line on stdin, one answer
// per line on stdout. It implements what a client needs to list and call tools.
import { createInterface } from "node:readline";
import { addDays, daysBetween, weekday } from "./dates.mjs";

const date = (description) => ({ type: "string", description: `${description}, as YYYY-MM-DD.` });

const TOOLS = [
	{
		name: "days_between",
		description: "Count the days from one date to another. Returns days (negative when `to` is earlier), and the same span as whole weeks and remaining days.",
		inputSchema: { type: "object", properties: { from: date("The first date"), to: date("The second date") }, required: ["from", "to"] },
		run: daysBetween,
	},
	{
		name: "add_days",
		description: "Find the date a number of days after a date, or before it with a negative number. Returns the date and its weekday.",
		inputSchema: {
			type: "object",
			properties: { date: date("The date to start from"), days: { type: "integer", description: "Days to add; negative goes back." } },
			required: ["date", "days"],
		},
		run: addDays,
	},
	{
		name: "weekday",
		description: "Tell the weekday of a date, and its ISO 8601 week number and week year.",
		inputSchema: { type: "object", properties: { date: date("The date") }, required: ["date"] },
		run: weekday,
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
				serverInfo: { name: "date-tools", version: "1.0.0" },
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
				// A bad date is a result the model reads and corrects, not a protocol error.
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
