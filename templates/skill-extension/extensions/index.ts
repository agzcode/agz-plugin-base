import { defineTool, type PluginAPI, Type } from "@agz-yazilim/plugin-sdk";

const echo = defineTool({
	name: "my_plugin_echo",
	label: "My Plugin echo",
	description: "Return the given text unchanged. Replace this with the plugin's real tool.",
	parameters: Type.Object({ text: Type.String({ description: "The text to return." }) }),
	// "codemode": callable from Code Mode scripts, not declared to the model on every turn.
	exposure: "codemode",
	execute: async (_toolCallId, params) => ({ content: [{ type: "text", text: params.text }], details: {} }),
});

export default function (agz: PluginAPI) {
	agz.registerTool(echo);
	// A hook runs before the call: here it refuses an empty echo with a reason the agent can read.
	agz.on("tool_call", async (event) => {
		if (event.toolName === "my_plugin_echo" && String(event.input.text ?? "") === "") {
			return { block: true, reason: "my_plugin_echo needs a non-empty text" };
		}
		return undefined;
	});
}
