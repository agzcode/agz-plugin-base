/** One rule: a command that matches `pattern` is dangerous for the reason in `description`. */
export interface Rule {
	id: string;
	description: string;
	pattern: RegExp;
}

// `git`, then any global options (`-C repo`, `--no-pager`), then the subcommand.
const GIT = String.raw`\bgit(?:\s+-\S+(?:\s+[^-\s]\S*)?)*\s+`;

// A "segment" is the text of one command up to the next `;`, `&`, `|` or line break, so a rule looks at the flags and
// operands of one command and not at the whole line.
export const RULES: readonly Rule[] = [
	{
		id: "rm-root",
		description: "recursive rm of the root, the home folder or everything in the current folder",
		pattern:
			/\brm\b(?=[^;&|\n]*\s(?:-[A-Za-z]*[rR][A-Za-z]*|--recursive)(?=\s|$))[^;&|\n]*?\s(?:\/|~|\$HOME|\*|\.)\/?\*?(?=\s|$|[;&|])/,
	},
	{
		id: "git-force-push",
		description: "git push --force or -f (--force-with-lease is allowed)",
		pattern: new RegExp(`${GIT}push\\b[^;&|\\n]*\\s(?:--force(?!-)|-[A-Za-z]*f[A-Za-z]*)(?=\\s|$)`),
	},
	{
		id: "git-reset-hard",
		description: "git reset --hard throws away uncommitted work",
		pattern: new RegExp(`${GIT}reset\\b[^;&|\\n]*\\s--hard\\b`),
	},
	{
		id: "pipe-to-shell",
		description: "a download piped into a shell",
		pattern: /\b(?:curl|wget)\b[^\n]*\|\s*(?:sudo\s+)?(?:ba|z|da)?sh\b/,
	},
	{
		id: "disk-overwrite",
		description: "writing to a disk device or making a file system",
		pattern: /\bdd\b[^;&|\n]*\sof=\/dev\/|\bmkfs(?:\.\w+)?\b|>\s*\/dev\/(?:sd|nvme|vd|hd)/,
	},
	{
		id: "chmod-777",
		description: "chmod -R 777 makes a whole tree world-writable",
		pattern: /\bchmod\b(?=[^;&|\n]*\s-[A-Za-z]*R)[^;&|\n]*\s0?777(?=\s|$)/,
	},
];

/** The guard's settings, read from the untyped `getPluginSettings()` record. */
export interface GuardSettings {
	mode: "block" | "warn";
	disabledRules: string[];
	extraPattern: string | undefined;
	shellTools: string[];
}

const DEFAULT_SHELL_TOOLS = "bash";

const list = (value: unknown): string[] =>
	typeof value === "string"
		? value
				.split(",")
				.map((item) => item.trim())
				.filter((item) => item !== "")
		: [];

export function readSettings(raw: Readonly<Record<string, unknown>>): GuardSettings {
	const extra = typeof raw.extraPattern === "string" && raw.extraPattern.trim() !== "" ? raw.extraPattern.trim() : undefined;
	return {
		mode: raw.mode === "warn" ? "warn" : "block",
		disabledRules: list(raw.disabledRules),
		extraPattern: extra,
		shellTools: list(raw.shellTools ?? DEFAULT_SHELL_TOOLS),
	};
}

/** The rules in force for these settings, and what is wrong with the settings (a rule id or a pattern that does not work). */
export function activeRules(settings: GuardSettings): { rules: Rule[]; problems: string[] } {
	const problems: string[] = [];
	for (const id of settings.disabledRules) {
		if (!RULES.some((rule) => rule.id === id)) problems.push(`"${id}" in "Rules to turn off" is not a rule id`);
	}
	const rules = RULES.filter((rule) => !settings.disabledRules.includes(rule.id));
	if (settings.extraPattern !== undefined) {
		try {
			rules.push({ id: "extra-pattern", description: "matches the extra pattern from the settings", pattern: new RegExp(settings.extraPattern, "i") });
		} catch (error) {
			problems.push(`the extra pattern is not a valid regular expression and is ignored: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	return { rules, problems };
}

/** The first rule the command breaks, or `undefined`. Runs of whitespace count as one space. */
export function findViolation(command: string, rules: readonly Rule[]): Rule | undefined {
	const normalized = command.replace(/\s+/g, " ").trim();
	return rules.find((rule) => rule.pattern.test(normalized));
}

/** The text `/guard-rules` shows: the mode, every rule with its state, and the problems of the settings. */
export function describeRules(settings: GuardSettings): string {
	const { rules, problems } = activeRules(settings);
	const lines = [
		`Command Guard (${settings.mode === "block" ? "blocks matching commands" : "warns about matching commands, allows them"}); checks the tools: ${settings.shellTools.join(", ") || "none"}`,
		...RULES.map((rule) => `- ${rule.id}: ${rule.description} [${rules.includes(rule) ? "on" : "off"}]`),
	];
	const extra = rules.find((rule) => rule.id === "extra-pattern");
	if (extra !== undefined) lines.push(`- extra-pattern: ${extra.pattern.source} [on]`);
	for (const problem of problems) lines.push(`Problem: ${problem}`);
	return lines.join("\n");
}
