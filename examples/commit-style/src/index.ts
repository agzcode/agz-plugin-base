import { defineTool, type PluginAPI, Type } from "@agz-yazilim/plugin-sdk";
import { checkMessage, commitMessageOf, rulesOf } from "./rules.ts";

export default function (agz: PluginAPI) {
	// Read on every use, never kept: the user may save the settings while the session runs. For the project-scoped fields
	// the host has already chosen the value: the project's own, else the user's, else the default.
	const rules = () => rulesOf(agz.getPluginSettings());

	agz.registerTool(
		defineTool({
			name: "commit_style_check",
			label: "Commit style check",
			description:
				"Check a commit message against the commit rules of this project (subject format, allowed types, subject length, blank line before the body) before committing. Returns ok, the list of problems and the rules that apply; an empty list means the message can be used.",
			parameters: Type.Object({ message: Type.String({ description: "The whole commit message: the subject line, then an optional body.", maxLength: 20_000 }) }),
			annotations: { readOnlyHint: true },
			execute: async (_toolCallId, params) => {
				const applied = rules();
				const problems = checkMessage(params.message, applied);
				const result = { ok: problems.length === 0, problems, rules: applied };
				return {
					content: [{ type: "text", text: problems.length === 0 ? "The message follows the project's rules." : problems.map((problem) => `- ${problem}`).join("\n") }],
					details: result,
				};
			},
		}),
	);

	// Optional, off by default: refuse `git commit -m "..."` whose message breaks the rules, so the agent fixes the
	// message instead of leaving a bad commit behind.
	agz.on("tool_call", (event) => {
		if (event.toolName !== "bash" || agz.getPluginSettings().guardGitCommit !== true) return undefined;
		const command = (event.input as { command?: unknown }).command;
		if (typeof command !== "string") return undefined;
		const message = commitMessageOf(command);
		if (message === undefined) return undefined;
		const problems = checkMessage(message, rules());
		return problems.length === 0 ? undefined : { block: true, reason: `The commit message breaks this project's rules: ${problems.join(" ")}` };
	});
}
