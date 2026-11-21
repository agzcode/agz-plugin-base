# Skill plugins

A skill is a folder with a `SKILL.md` that teaches agents a procedure, and optionally tools, scripts and examples. A skill plugin ships one or more skills through the manifest's `skills` field. It needs no extension code. The skill format itself belongs to the skill-creator skill; this page covers what a plugin author needs.

## Layout

```
my-plugin/
  package.json                      agzPlugin.skills: ["skills/my-plugin"]
  skills/my-plugin/
    SKILL.md                        frontmatter and body
    tools/count_words.json          one tool spec per file
    scripts/count_words.mjs         the tool's entry point
    examples/two-lines.json         one example per tool, three or more in all
    references/  assets/            optional documents and data
```

The manifest, from the skill template:

```json
{
	"name": "my-plugin",
	"version": "0.1.0",
	"description": "A starting point for a plugin.",
	"type": "module",
	"license": "MIT",
	"files": ["skills", "README.md"],
	"engines": {
		"agz-plugin-sdk": "^1"
	},
	"scripts": {
		"test": "agz plugin test"
	},
	"devDependencies": {
		"@agz-yazilim/plugin-kit": "1.5.0",
		"@agz-yazilim/plugin-sdk": "1.5.0",
		"@types/node": "22.19.19",
		"typescript": "7.0.2"
	},
	"agzPlugin": {
		"schemaVersion": 1,
		"id": "my-plugin",
		"name": "My Plugin",
		"description": "A starting point for a plugin.",
		"skills": ["skills/my-plugin"]
	}
}
```

Include everything the skill needs in the package: scripts, references, assets and licenses. Relative paths in the skill must still work after packing. `pack_check` flags every file of a declared skill folder that npm would leave out.

## SKILL.md

```md
---
name: my-plugin
description: 'A starting point for a plugin.'
metadata:
  version: 0.1.0
  agz-kind: routed
---

# My Plugin

Replace this body with the procedure agents should follow. Name the tools, say when to use them and what a good result looks like.

Call `count_words({text})` to count the words, lines and characters of a text. It reads nothing from disk and changes nothing.
```

| Field | Rule |
|---|---|
| `name` | Required. Lowercase words joined by hyphens, at most 64 characters. It should equal the folder name. |
| `description` | Required, at most 1024 characters. Say what the skill does, add `Use when ...` with the phrasings users write in their languages, and `Not for ...`. The router reads it. |
| `metadata.version` | Like `1`, `1.2` or `1.2.3`. Raise it when you change the package. |
| `metadata.agz-kind` | `routed` (the default) or `direct`. Agents find a routed skill with skill_route and load it with skill_load. |

Keep the body under 500 lines. Put detail in `references/`.

A name that already exists in a stronger place wins: built-in over global over project. The loser is reported as shadowed and not loaded.

## Tools

A tool spec is `tools/<tool>.json`. The file name without `.json` equals `name`.

```json
{
	"name": "count_words",
	"description": "Count the words, lines and characters of a text. Words are runs of non-space characters, lines are separated by line breaks, characters are Unicode code points. Fails when text is missing or longer than 200000 characters.",
	"surface": "codemode",
	"mutating": false,
	"input": {
		"type": "object",
		"properties": { "text": { "type": "string", "maxLength": 200000, "description": "The text to count." } },
		"required": ["text"],
		"additionalProperties": false
	},
	"output": {
		"type": "object",
		"properties": {
			"words": { "type": "integer" },
			"lines": { "type": "integer" },
			"characters": { "type": "integer" }
		},
		"required": ["words", "lines", "characters"]
	},
	"run": { "kind": "script", "entry": "count_words.mjs" }
}
```

| Field | Rule |
|---|---|
| `name` | `^[a-z][a-z0-9_]*$`, at most 40 characters. |
| `description` | Required. Agents read it: give units, limits and failure cases. |
| `mutating` | Declare it on every tool. `true` for a tool that writes anything, `false` for one that only reads. Read-only agents cannot call a mutating tool. |
| `input` | A JSON Schema with top-level `"type": "object"`. |
| `output` | A JSON Schema. An object schema makes Code Mode calls resolve to the object. |
| `run` | `{ "kind": "script" or "module", "entry": "<file>" }`. The entry is relative to `scripts/` and must stay inside the package. |

The schema subset is `type`, `enum`, `const`, `properties`, `required`, `additionalProperties`, `items`, `minItems`, `maxItems`, `minLength`, `maxLength`, `pattern`, `minimum`, `maximum`, `anyOf`, `oneOf` and `allOf`. `$ref` and tuple `items` are refused. The runtime checks the input before the run and the output after it.

### Script tools

A script runs as one child process per call. The entry is `.mjs`, `.py` or `.sh`. Input arrives as one JSON document on stdin. Print one JSON document on stdout and write logs to stderr. Fail with a non-zero exit and a message that says what to fix. A call is limited to 30 seconds and 1 MiB of output. Read the package's own files through the `AGZ_SKILL_DIR` environment variable; the working directory is the user's project.

```js
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
```

### Module tools

A module tool is an `.mjs` or `.js` file exporting `execute(input, context)`. It runs inside the engine process, so it can use only Node built-ins and must not block or exit. A module tool is refused in a project skill (`module-project-scope`). A skill from a user-scope plugin loads as a global skill and a skill from a project-scope plugin as a project skill, so a project-scope plugin cannot ship module tools. Prefer script tools: they are sandboxed per process and work in every scope.

## Examples

Each tool needs an example in `examples/`. A skill with tools needs at least three passing examples and one for every tool.

```json
{ "tool": "count_words", "name": "two lines", "input": { "text": "Hello world.\nSecond line here." }, "expected": { "words": 5, "lines": 2, "characters": 30 } }
```

`input` must match the tool's input schema. `expected` may list only the fields you want checked.

## Calling a skill's tools

After skill_load of the skill, agents call its tools from Code Mode as `skill__<skill>__<tool>`, with hyphens in the skill name written as underscores:

```js
const counted = await tools.skill__my_plugin__count_words({ text: "one two three" });
return counted.words;
```

The tool resolves to its output object. A failure rejects with `skill__<skill>__<tool>: <error>`. Agents without Code Mode use `skill_execute({ skill, tool, input })`.

## Test and evaluate

The skill-creator skill's Code Mode tools check a skill: `tools.skill_test({ skill })` validates the package and runs every example, and `tools.skill_eval({ skill, cases })` checks that phrasings of the need rank the skill in the top 3. The engine's plugin-dev test runs the same package check (`testSkillPackage`) on the scaffolded templates.

## Ship it

1. Declare the skill folder in `agzPlugin.skills`.
2. Run `manifest_check`: the `skills` list must show the `SKILL.md` path.
3. Run `pack_check` and fix every `missing` entry.
4. Link or publish the package (see [the quickstart](./quickstart.md)).

If the plugin also needs hooks, commands or MCP servers, add `extensions` (see [the extension API](./extension-api.md)). To add several skills, list each folder or a glob such as `skills/*` (see [the manifest](./manifest.md)).
