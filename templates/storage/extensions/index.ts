import { readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { defineTool, type PluginAPI, Type } from "@agz-yazilim/plugin-sdk";

const FILE = "items.json";
const MAX_ITEMS = 500;

export default function (agz: PluginAPI) {
	// Asked for on every call, not kept: the folder belongs to the plugin, and every session of the plugin shares it.
	const file = (): string => join(agz.getPluginPaths().data, FILE);

	const read = async (): Promise<string[]> => {
		try {
			const items: unknown = JSON.parse(await readFile(file(), "utf8"));
			return Array.isArray(items) ? items.filter((item): item is string => typeof item === "string") : [];
		} catch {
			// No file yet, or one that does not parse: the plugin starts empty.
			return [];
		}
	};

	const write = async (items: string[]): Promise<void> => {
		// Written to a temporary file and renamed, so another session never reads half a file.
		await writeFile(`${file()}.tmp`, JSON.stringify(items, null, 2));
		await rename(`${file()}.tmp`, file());
	};

	agz.registerTools([
		defineTool({
			name: "my_plugin_remember",
			label: "My Plugin remember",
			description: `Keep a short text for later sessions. Returns how many texts are kept. Fails when ${MAX_ITEMS} are kept already.`,
			parameters: Type.Object({ text: Type.String({ description: "The text to keep.", minLength: 1, maxLength: 2000 }) }),
			exposure: "codemode",
			execute: async (_toolCallId, params) => {
				const items = await read();
				if (items.length >= MAX_ITEMS) throw new Error(`my_plugin_remember: ${MAX_ITEMS} texts are kept already`);
				items.push(params.text);
				await write(items);
				return { content: [{ type: "text", text: `kept (${items.length})` }], details: { count: items.length } };
			},
		}),
		defineTool({
			name: "my_plugin_recall",
			label: "My Plugin recall",
			description: "List the texts kept with my_plugin_remember, oldest first, one per line.",
			parameters: Type.Object({}),
			exposure: "codemode",
			annotations: { readOnlyHint: true },
			execute: async () => {
				const items = await read();
				return { content: [{ type: "text", text: items.join("\n") }], details: { count: items.length } };
			},
		}),
	]);
}
