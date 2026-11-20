import { defineTool, type PluginAPI, Type } from "@agz-yazilim/plugin-sdk";
import { deleteSnippet, listSnippets, MAX_BYTES, readSnippet, saveSnippet } from "./store.ts";

const name = Type.String({ description: 'The snippet\'s name: lowercase letters, digits, ".", "_" or "-", for example "pr-template".', minLength: 1, maxLength: 64 });

export default function (agz: PluginAPI) {
	// The plugin's data folder: lasting, shared by every session and project, kept by updates and by a plain uninstall.
	// Asked for on every call instead of kept, so the code holds no path of its own.
	const data = (): string => agz.getPluginPaths().data;

	// One call per tool: each has its own shape of `details`.
	agz.registerTool(
		defineTool({
			name: "snippet_save",
			label: "Save snippet",
			description: `Keep a text under a name so that later sessions, in any project, can get it back with snippet_get: a template, a checklist, a command that is hard to remember. Saving under an existing name replaces that snippet. At most ${MAX_BYTES} bytes.`,
			parameters: Type.Object({ name, text: Type.String({ description: "The text to keep.", minLength: 1 }) }),
			execute: async (_toolCallId, params) => {
				const { replaced } = await saveSnippet(data(), params.name, params.text);
				return { content: [{ type: "text", text: `${replaced ? "replaced" : "saved"} ${params.name}` }], details: { name: params.name, replaced } };
			},
		}),
	);
	agz.registerTool(
		defineTool({
			name: "snippet_get",
			label: "Get snippet",
			description: "Return the text kept under a name with snippet_save. Fails when there is no snippet of that name; snippet_list shows the names.",
			parameters: Type.Object({ name }),
			annotations: { readOnlyHint: true },
			execute: async (_toolCallId, params) => {
				const text = await readSnippet(data(), params.name);
				if (text === undefined) throw new Error(`snippet_get: there is no snippet named ${params.name}`);
				return { content: [{ type: "text", text }], details: { name: params.name } };
			},
		}),
	);
	agz.registerTool(
		defineTool({
			name: "snippet_list",
			label: "List snippets",
			description: "List the names of the kept snippets with their size in bytes and the date of the last save, one per line.",
			parameters: Type.Object({}),
			annotations: { readOnlyHint: true },
			execute: async () => {
				const snippets = await listSnippets(data());
				const text = snippets.length === 0 ? "No snippets are kept." : snippets.map((entry) => `${entry.name}  ${entry.bytes} bytes  ${new Date(entry.savedAt).toISOString().slice(0, 10)}`).join("\n");
				return { content: [{ type: "text", text }], details: { snippets } };
			},
		}),
	);
	agz.registerTool(
		defineTool({
			name: "snippet_delete",
			label: "Delete snippet",
			description: "Delete the snippet kept under a name. It cannot be brought back. Fails when there is no snippet of that name.",
			parameters: Type.Object({ name }),
			annotations: { destructiveHint: true },
			execute: async (_toolCallId, params) => {
				if (!(await deleteSnippet(data(), params.name))) throw new Error(`snippet_delete: there is no snippet named ${params.name}`);
				return { content: [{ type: "text", text: `deleted ${params.name}` }], details: { name: params.name } };
			},
		}),
	);
}
