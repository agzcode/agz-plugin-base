import { readFileSync } from "node:fs";

const { text } = JSON.parse(readFileSync(0, "utf8"));
const trimmed = text.trim();
process.stdout.write(
	JSON.stringify({
		words: trimmed === "" ? 0 : trimmed.split(/\s+/).length,
		lines: text === "" ? 0 : text.split(/\r?\n/).length,
		characters: [...text].length,
	}),
);
