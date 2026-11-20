import { readFileSync } from "node:fs";

const SECTION_OF = { feat: "Added", fix: "Fixed", perf: "Changed", refactor: "Changed", docs: "Documentation" };
const LEFT_OUT = new Set(["chore", "test", "ci", "build", "style"]);
const ORDER = ["Breaking changes", "Added", "Fixed", "Changed", "Documentation", "Other"];
// type(scope)!: description
const CONVENTIONAL = /^(?<type>[a-z]+)(?:\((?<scope>[^)]*)\))?(?<bang>!)?:\s*(?<description>.+)$/;

const { subjects } = JSON.parse(readFileSync(0, "utf8"));
if (!Array.isArray(subjects) || subjects.length > 2000 || subjects.some((subject) => typeof subject !== "string")) {
	process.stderr.write("subjects must be an array of at most 2000 strings\n");
	process.exit(1);
}

const sections = new Map();
let ignored = 0;
const add = (title, line) => {
	const items = sections.get(title) ?? [];
	if (!items.includes(line)) items.push(line);
	sections.set(title, items);
};

for (const raw of subjects) {
	const subject = raw.trim();
	if (subject === "") continue;
	const match = CONVENTIONAL.exec(subject);
	if (match === null) {
		add(/BREAKING CHANGE/.test(subject) ? "Breaking changes" : "Other", subject);
		continue;
	}
	const { type, scope, bang, description } = match.groups;
	const line = scope === undefined || scope === "" ? description : `**${scope}:** ${description}`;
	if (bang !== undefined || /BREAKING CHANGE/.test(description)) add("Breaking changes", line);
	else if (type in SECTION_OF) add(SECTION_OF[type], line);
	else if (LEFT_OUT.has(type)) ignored++;
	else add("Other", subject);
}

const result = ORDER.filter((title) => sections.has(title)).map((title) => ({ title, items: sections.get(title) }));
const markdown = result.map(({ title, items }) => `### ${title}\n\n${items.map((item) => `- ${item}`).join("\n")}\n`).join("\n");
process.stdout.write(JSON.stringify({ markdown, sections: result, ignored }));
