import type { PluginAPI } from "@agz-yazilim/plugin-sdk";
import { activeRules, describeRules, findViolation, readSettings } from "./rules.ts";

export default function (agz: PluginAPI) {
	const settings = () => readSettings(agz.getPluginSettings());
	// A setting that does not work is ignored, so say so once per problem instead of on every command.
	let warnedAbout = "";

	agz.on("tool_call", async (event, ctx) => {
		const current = settings();
		if (!current.shellTools.includes(event.toolName)) return undefined;
		const { rules, problems } = activeRules(current);
		const summary = problems.join("\n");
		if (summary !== warnedAbout) {
			warnedAbout = summary;
			for (const problem of problems) ctx.ui.notify(`command-guard: ${problem}`, "warning");
		}
		const command = event.input.command;
		if (typeof command !== "string") return undefined;
		const rule = findViolation(command, rules);
		if (rule === undefined) return undefined;
		if (current.mode === "warn") {
			ctx.ui.notify(`command-guard: ${rule.description} (rule ${rule.id}); allowed because the mode is warn`, "warning");
			return undefined;
		}
		return {
			block: true,
			reason: `command-guard blocked this command: ${rule.description} (rule ${rule.id}). Do not retry it in another form; ask the user to run it or to change the Command Guard settings.`,
		};
	});

	agz.registerCommand("guard-rules", {
		description: "List the Command Guard rules and which of them are on",
		handler: async () => {
			agz.sendMessage({ customType: "command-guard.rules", content: describeRules(settings()), display: true });
		},
	});
}
