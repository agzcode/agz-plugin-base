import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

// The snippet store: one file per snippet in `<data>/snippets/`, where `<data>` is the plugin's data folder. One file
// per snippet means two sessions that save different snippets never overwrite each other.

export const MAX_SNIPPETS = 200;
export const MAX_BYTES = 64 * 1024;
/** A name is also a file name, so it is held to characters that cannot leave the folder. */
const NAME = /^[a-z0-9][a-z0-9._-]{0,63}$/;

export interface SnippetInfo {
	name: string;
	bytes: number;
	/** The last save, in milliseconds since 1970. */
	savedAt: number;
}

export class SnippetError extends Error {}

function fileOf(dataDir: string, name: string): string {
	if (!NAME.test(name)) throw new SnippetError(`"${name.slice(0, 80)}" is not a snippet name: use 1 to 64 lowercase letters, digits, ".", "_" or "-", starting with a letter or a digit`);
	return join(dataDir, "snippets", `${name}.txt`);
}

export async function listSnippets(dataDir: string): Promise<SnippetInfo[]> {
	let files: string[];
	try {
		files = await readdir(join(dataDir, "snippets"));
	} catch {
		// Nothing was saved yet.
		return [];
	}
	const infos: SnippetInfo[] = [];
	for (const file of files.filter((entry) => entry.endsWith(".txt")).sort()) {
		const info = await stat(join(dataDir, "snippets", file));
		infos.push({ name: file.slice(0, -".txt".length), bytes: info.size, savedAt: Math.round(info.mtimeMs) });
	}
	return infos;
}

/** Saves `text` under `name`, replacing an earlier snippet of that name. Returns whether it replaced one. */
export async function saveSnippet(dataDir: string, name: string, text: string): Promise<{ replaced: boolean }> {
	const file = fileOf(dataDir, name);
	const bytes = Buffer.byteLength(text);
	if (bytes > MAX_BYTES) throw new SnippetError(`the text has ${bytes} bytes; a snippet holds at most ${MAX_BYTES}`);
	const existing = await listSnippets(dataDir);
	const replaced = existing.some((entry) => entry.name === name);
	if (!replaced && existing.length >= MAX_SNIPPETS) throw new SnippetError(`${MAX_SNIPPETS} snippets are kept already; delete one first`);
	await mkdir(join(dataDir, "snippets"), { recursive: true });
	// Written beside the file and renamed: a reader sees the old text or the new one, never half of one. The temporary
	// name does not end in .txt, so a list never shows it.
	const temporary = `${file}.${randomUUID()}.tmp`;
	await writeFile(temporary, text);
	await rename(temporary, file);
	return { replaced };
}

/** The text of a snippet; undefined when there is none of that name. */
export async function readSnippet(dataDir: string, name: string): Promise<string | undefined> {
	try {
		return await readFile(fileOf(dataDir, name), "utf8");
	} catch (error) {
		if (error instanceof SnippetError) throw error;
		return undefined;
	}
}

/** Deletes a snippet. Returns whether there was one. */
export async function deleteSnippet(dataDir: string, name: string): Promise<boolean> {
	const file = fileOf(dataDir, name);
	const existed = (await readSnippet(dataDir, name)) !== undefined;
	await rm(file, { force: true });
	return existed;
}
