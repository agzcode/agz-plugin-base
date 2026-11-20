// The rules of a commit message, as the plugin's settings give them, and the check of one message against them.

export interface Rules {
	format: "conventional" | "plain";
	types: string[];
	maxSubjectLength: number;
}

const DEFAULT_TYPES = ["feat", "fix", "docs", "refactor", "test", "chore"];

/** The rules from the plugin's settings; a missing or unusable value falls back to the default. */
export function rulesOf(settings: Readonly<Record<string, unknown>>): Rules {
	const types =
		typeof settings.types === "string"
			? settings.types
					.split(",")
					.map((type) => type.trim())
					.filter((type) => /^[a-z][a-z0-9-]*$/.test(type))
			: [];
	const length = settings.maxSubjectLength;
	return {
		format: settings.format === "plain" ? "plain" : "conventional",
		types: types.length > 0 ? types : DEFAULT_TYPES,
		maxSubjectLength: typeof length === "number" && length >= 20 && length <= 200 ? Math.floor(length) : 72,
	};
}

/** What is wrong with `message`, one sentence per problem; empty when it follows the rules. */
export function checkMessage(message: string, rules: Rules): string[] {
	const problems: string[] = [];
	const lines = message.replace(/\r\n/g, "\n").split("\n");
	const subject = lines[0] ?? "";

	if (subject.trim() === "") return ["The message has no subject line."];
	if (subject !== subject.trim()) problems.push("The subject starts or ends with a space.");
	// Counted in characters, not UTF-16 units, so a subject with non-Latin letters or emoji is not cut short.
	const length = [...subject].length;
	if (length > rules.maxSubjectLength) problems.push(`The subject has ${length} characters; the limit is ${rules.maxSubjectLength}.`);
	if (subject.endsWith(".")) problems.push("The subject ends with a period.");
	if (lines.length > 1 && lines[1] !== "") problems.push("The second line must be empty: a blank line separates the subject from the body.");

	if (rules.format === "conventional") {
		const match = /^([a-z][a-z0-9-]*)(\([^()\s]+\))?(!)?: (\S.*)$/.exec(subject.trim());
		if (match === null) problems.push(`The subject must read "type(scope): subject" or "type: subject", with one of the types ${rules.types.join(", ")}.`);
		else if (!rules.types.includes(match[1] ?? "")) problems.push(`The type "${match[1]}" is not allowed here; use one of ${rules.types.join(", ")}.`);
	}
	return problems;
}

/**
 * The message of a `git commit -m` in a shell command, when the command gives one that can be read without running a
 * shell: a quoted `-m` or `--message` value. A message built from a variable, a heredoc or a file is not read; the
 * guard then lets the command pass rather than guess.
 */
export function commitMessageOf(command: string): string | undefined {
	// `git`, then any options with their values, then the word `commit` on its own.
	if (!/(^|[\s;&|(])git(?:\s+[^\s;&|]+)*?\s+commit(\s|$)/.test(command)) return undefined;
	const parts: string[] = [];
	for (const match of command.matchAll(/(?:\s-[a-zA-Z]*m|\s--message)[\s=]*(?:"((?:[^"\\$`]|\\.)*)"|'([^']*)')/g)) {
		parts.push(match[1] === undefined ? (match[2] ?? "") : match[1].replace(/\\(["\\$`])/g, "$1"));
	}
	// git joins several -m values as paragraphs.
	return parts.length === 0 ? undefined : parts.join("\n\n");
}
