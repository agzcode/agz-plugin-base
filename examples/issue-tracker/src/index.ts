import { defineTool, type PluginAPI, Type } from "@agz-yazilim/plugin-sdk";
import { fetchIssues, formatIssues, readSettings } from "./issues.ts";
import { createIssuesView } from "./view.ts";

export default function (agz: PluginAPI) {
	// Read on every call: the user may change the settings while a session runs.
	const settings = () => readSettings(agz.getPluginSettings());

	agz.registerTool(
		defineTool({
			name: "issue_tracker_search",
			label: "Search issues",
			description:
				"List issues of the project's issue tracker (a GitHub-style issues API the user configured). Returns one line per issue: number, state, title, labels, author and URL. At most the configured page size (default 20, at most 100) is returned, newest first as the API orders them; pull requests are left out. Fails when the API URL is not set, the API cannot be reached or it answers with an error status.",
			parameters: Type.Object({
				query: Type.Optional(Type.String({ description: "Only issues whose title contains this text, ignoring case." })),
				state: Type.Optional(
					Type.Union([Type.Literal("open"), Type.Literal("closed"), Type.Literal("all")], {
						description: "Which issues to list. Default: open.",
					}),
				),
				label: Type.Optional(Type.String({ description: "Only issues that carry this label." })),
			}),
			annotations: { readOnlyHint: true, openWorldHint: true },
			execute: async (_toolCallId, params, signal) => {
				const issues = await fetchIssues(
					settings(),
					{ state: params.state ?? "open", label: params.label, text: params.query },
					signal,
				);
				return { content: [{ type: "text", text: formatIssues(issues) }], details: { count: issues.length } };
			},
		}),
	);

	agz.registerView("issues", createIssuesView(settings));
	agz.on("settings_change", () => agz.invalidateView("issues"));
}
