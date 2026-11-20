# Turn an existing Git project into a plugin

You have a repository with a command-line tool or a library and want agents to use it. You add a manifest and a thin wrapper; you do not move or rewrite the project. This page uses a small project, `line-count`, whose CLI prints the number of lines of a file as JSON. The steps were run end to end, including an install and updates from a repository (see [the GitHub page](./github.md)).

## 1. Work in a local clone

```
line-count/
  package.json
  bin/line-count.mjs
  src/count-lines.mjs
```

## 2. Add the manifest with the scaffold convert mode

Create the resources first (steps 3 and 4), then from Code Mode:

```js
await tools.skill__plugin_dev__scaffold({ kind: "convert", id: "line-count", target: "/home/me/src/line-count" });
```

Convert writes only the `agzPlugin` key into `package.json`, keeps the other fields, detects `SKILL.md`, `skills/`, `extensions/`, `prompts/`, `themes/` and `agents/`, and puts the file back if the result would not validate. It fails when `agzPlugin` already exists or there is nothing to declare. For this project it wrote:

```json
{
  "agzPlugin": {
    "schemaVersion": 1,
    "id": "line-count",
    "extensions": ["extensions"],
    "skills": ["skills"]
  }
}
```

Also add a `files` list to `package.json`, for example `["bin", "src", "extensions", "skills"]`. Without it npm packs every file that is not ignored, including tests and samples.

## 3. Wrap the CLI as a tool

An extension tool runs the CLI with `agz.exec(command, args, options)`, which returns `{ stdout, stderr, code, killed }`. File `extensions/index.ts`:

```ts
import { fileURLToPath } from "node:url";
import { defineTool, type PluginAPI, Type } from "@agz-yazilim/plugin-sdk";

// The project's CLI, found from this file: <package>/extensions/index.ts -> <package>/bin/line-count.mjs.
const cli = fileURLToPath(new URL("../bin/line-count.mjs", import.meta.url));

export default function (agz: PluginAPI) {
  agz.registerTool(
    defineTool({
      name: "line_count",
      label: "Line count",
      description:
        "Count the lines of a text file by running the line-count CLI with node. The path is relative to the working directory. Reads the file and changes nothing. Fails when the CLI exits with an error, for example when the file does not exist.",
      parameters: Type.Object({ path: Type.String({ description: "File to count." }) }),
      exposure: "codemode",
      annotations: { readOnlyHint: true },
      execute: async (_toolCallId, params, signal, _onUpdate, ctx) => {
        const result = await agz.exec("node", [cli, params.path], { cwd: ctx.cwd, signal, timeout: 30_000 });
        if (result.code !== 0) throw new Error(result.stderr.trim() || `line-count exited with ${result.code}`);
        return { content: [{ type: "text", text: result.stdout.trim() }], details: {} };
      },
    }),
  );
}
```

Run with the session's working directory (`ctx.cwd`), pass the abort `signal`, set a `timeout`, and turn a non-zero exit into a short error. In the run, a missing file produced the tool error `line-count: cannot read nope.txt: ENOENT` because the CLI prints one clear line to stderr; a CLI that crashes with a stack trace gives the agent the whole trace, so make the CLI (or the wrapper) print one line.

The command must exist on the user's machine: `node` here, or the CLI's own binary on PATH. The desktop app's engine is not a `node`; name the prerequisite in the tool description and the README.

Add a guidance skill so agents know when to use the tool. File `skills/line-count/SKILL.md`:

```markdown
---
name: line-count
description: 'Count the lines of a text file with the line-count project. Use when asked how many lines a file has, or: dosya kaç satır, satır say.'
metadata:
  version: 0.1.0
  agz-kind: routed
---

# Line count

Call `line_count({path})` from Code Mode to count the lines of a text file. The path is relative to the working directory. The tool reads the file and changes nothing; a final line break does not add a line. When it fails, the message says why (for example `cannot read nope.txt: ENOENT`).
```

### The alternative: a skill script tool

A skill tool (`tools/<tool>.json` plus a script in `scripts/`) also works for a wrapper around a program on PATH or around logic that lives inside the skill folder. The script runs on the engine's own runtime. Two limits seen in the run: a script that imports the project's code from outside the skill folder (`AGZ_SKILL_DIR/../../src/...`) works in a session but fails `skill_test`, which runs the skill in a sandbox that holds only the skill folder (`ERR_MODULE_NOT_FOUND`); and a skill with tools needs at least 3 passing examples. To wrap the repository's own code, prefer the extension above.

## 4. Check

`manifest_check` on the clone returned `ok: true` with `extensions/index.ts` and `skills/line-count/SKILL.md`. `pack_check` listed the files `npm pack` ships; with no `files` list it also listed `sample.txt`, which is how a missing `files` field shows up.

In an isolated host the plugin was installed as a local path: `line_count({path: "work/sample.txt"})` from Code Mode returned `{"file":"work/sample.txt","lines":3}`.

## Dependencies and install scripts

When the plugin is installed from Git, the engine clones the repository, checks out the ref, and runs `npm install --omit=dev --legacy-peer-deps` in it when it has a `package.json`, with `--ignore-scripts` unless the user chose to run the install scripts. Consequences:

- Runtime dependencies belong in `dependencies`. `devDependencies` are not installed, so a build step that needs them cannot run on the user's machine: commit the built output. A build in `prepare` runs only when the user chooses to run the install scripts.
- Lifecycle scripts do not run by default: the install passes `--ignore-scripts`, so a `prepare` script does not run. The user can tick "Run install scripts" in the confirmation (`runScripts: true` in the API). Then the scripts run on install and on each update, so they must be safe to run on the user's machine. Install and update need the user's confirmation in any case, because the extension code runs when a session loads it.
- Do not depend on `@agz-yazilim/plugin-sdk`; the host provides it.
- An update runs `git clean -fdx` before it installs again, so untracked files in the checkout (a lockfile, a hand-made file) are removed; only what the repository and the install scripts produce remains.

## 5. Install from GitHub

Tag a release, then in Settings > Plugins > Install a plugin choose GitHub, enter `owner/line-count` and the ref `v1.0.0`. The source forms, pinning and updates are on [the GitHub page](./github.md). Test the packed result as described in [testing and packaging](./testing-packaging.md).
