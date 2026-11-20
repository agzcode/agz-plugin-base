import { defineTool, type PluginAPI, Type } from "@agz-yazilim/plugin-sdk";

export default function (agz: PluginAPI) {
	agz.registerTool(
		defineTool({
			name: "my_plugin_test_command",
			label: "My Plugin test command",
			description: "Return the command that runs the tests of the session's project, as the project or the user set it.",
			parameters: Type.Object({}),
			exposure: "codemode",
			annotations: { readOnlyHint: true },
			execute: async () => {
				// Read on every call: the user may save the settings while the session runs. For the project-scoped field the
				// host has already chosen the value: the project's own, else the user's, else the default.
				const settings = agz.getPluginSettings();
				const command = String(settings.testCommand ?? "");
				const text = settings.verbose === true ? `Run the tests of this project with: ${command}` : command;
				return { content: [{ type: "text", text }], details: { command } };
			},
		}),
	);
}
