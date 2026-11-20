# Turn an existing feature into a plugin

You already have a feature that works: a skill, a project tool, an MCP server setup or a custom agent. Moving it into a plugin package makes it installable from one place, switchable as a unit (Settings > Plugins), updatable and shareable. This page gives the before and after layout of each case and how to verify the move. The manifest fields are in [the manifest page](./manifest.md), the code API in [the extension API page](./extension-api.md), skills with tools in [skill plugins](./skill-plugins.md).

## Rules that hold for every case

- Build the plugin in a new folder outside the original locations, for example `~/plugins/<id>`. Keep the original until the plugin is verified, then remove the original (see the next point).
- The original and the plugin must not both provide the same thing. A same-named skill in `~/.agz-code/skills` or `<project>/.agz-code/skills` wins and the plugin's copy is reported as `shadowed`. A same-named MCP server in `mcp.json` wins over the registered one. A custom agent file in `agents/` wins over the package's. Move the original out of the way before you test the plugin.
- Declare every resource in `agzPlugin` and run `manifest_check` after each change. A declared path that matches no file is a load error.
- Run these steps from Code Mode after skill_load of plugin-dev: `tools.skill__plugin_dev__scaffold({kind: "convert", id: "<id>", target: "<folder>"})` adds the `agzPlugin` key to the `package.json` of a folder that already holds the resources (it detects `skills/`, `extensions/`, `prompts/`, `themes/`, `agents/`), and `tools.skill__plugin_dev__manifest_check({path: "<folder>"})` validates it.

## A skill

Before, a skill folder lives in a skills root:

```
~/.agz-code/skills/release-notes/
  SKILL.md
  tools/draft.json
  scripts/draft.mjs
  examples/basic.json
```

After, the same folder moves whole under `skills/` in the package:

```
~/plugins/release-notes/
  package.json
  skills/release-notes/
    SKILL.md
    tools/draft.json
    scripts/draft.mjs
    examples/basic.json
```

The manifest in `package.json`:

```json
{
  "name": "release-notes",
  "version": "1.0.0",
  "files": ["skills"],
  "agzPlugin": {
    "schemaVersion": 1,
    "id": "release-notes",
    "skills": ["skills/release-notes"]
  }
}
```

What changes in behaviour:

- Scope. A plugin installed in user scope provides the skill as a global skill, in every project. A plugin installed in project scope provides it as a project skill: only in a trusted project, and script tools only (module tools are refused in project skills).
- Enable switch. The plugin is one row in Settings > Plugins with its own switch, update and remove. Turning it off removes the skill from routing and loading.
- Precedence. The skill roots are read in the order builtin, `~/.agz-code/skills`, other switched-on folders, project roots, then plugin skills. Remove the original so the plugin's copy is the one served.
- Paths. A script reads package files through `AGZ_SKILL_DIR`; nothing in the skill changes when it moves.

Verify:

1. `manifest_check` on the plugin folder returns `ok: true` and `skills/release-notes/SKILL.md` under `resources.skills`.
2. Move the original out of the skills root, link the plugin folder as a local path (see [quickstart](./quickstart.md)) and use Reload sessions.
3. In a new session, skill_load the skill and call one of its tools from Code Mode; compare the output with what the original gave.
4. After the plugin is installed, `tools.skill_test({skill: "release-notes"})` validates the package and runs its examples (more in [testing and packaging](./testing-packaging.md)).

## A project extension

Before, a file or folder under `.agz-code/tools/` is loaded as an extension:

```
<project>/.agz-code/tools/line-count.ts
```

```ts
import { Type } from "@earendil-works/pi-coding-agent";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "line_count",
    label: "Line count",
    description: "Count the lines of a text.",
    parameters: Type.Object({ text: Type.String() }),
    execute: async (_id, params) => ({ content: [{ type: "text", text: String(params.text.split("\n").length) }], details: {} }),
  });
}
```

After, the file moves to `extensions/index.ts` of a package, and its import becomes the host-provided SDK:

```
~/plugins/line-count/
  package.json
  extensions/index.ts
```

```ts
import { defineTool, type PluginAPI, Type } from "@agz-yazilim/plugin-sdk";

export default function (agz: PluginAPI) {
  agz.registerTool(
    defineTool({
      name: "line_count",
      label: "Line count",
      description: "Count the lines of a text. Returns the number as text. Changes nothing.",
      parameters: Type.Object({ text: Type.String() }),
      exposure: "codemode",
      annotations: { readOnlyHint: true },
      execute: async (_id, params) => ({ content: [{ type: "text", text: String(params.text.split("\n").length) }], details: {} }),
    }),
  );
}
```

```json
{
  "name": "line-count",
  "version": "1.0.0",
  "files": ["extensions"],
  "agzPlugin": {
    "schemaVersion": 1,
    "id": "line-count",
    "extensions": ["extensions/index.ts"]
  }
}
```

What changes in behaviour:

- Trust. A file in `<project>/.agz-code/tools/` loads only in a trusted project. A plugin in user scope loads in every project, so its code runs wherever you work; a plugin in project scope keeps the trusted-project rule.
- The old import `@earendil-works/pi-coding-agent` still resolves, but new code uses `@agz-yazilim/plugin-sdk`; do not add it as a dependency, the host provides it.
- Exposure. Set `exposure` on every tool: `direct` is declared to the model; `codemode` is callable from Code Mode scripts; `deferred` is found by tool search and called from Code Mode. Tools registered from an extension file that no profile lists are added to every profile, including read-only explorer and verifier. Design mutating tools with their own safeguards; see [the exposure rules](./extension-api.md).
- Remove the original file; two registrations of the same tool name conflict.
- The row gets update and remove. A loose file in `tools/` can only be switched off.

Verify: `manifest_check` lists `extensions/index.ts`; after Reload sessions, `await tools.line_count({text: "a\nb"})` from Code Mode returns `2`.

## An MCP server setup

Before, a server is configured in `<project>/.agz-code/mcp.json` (or the `mcp` section of agz.json):

```json
{
  "mcpServers": {
    "docs": { "command": "npx", "args": ["-y", "@example/docs-mcp"], "env": { "DOCS_TOKEN": "${DOCS_TOKEN}" } }
  }
}
```

After, an extension registers the same configuration with `registerMcpServer`; the config object has the same shape as one `mcpServers` entry:

```ts
import type { PluginAPI } from "@agz-yazilim/plugin-sdk";

export default function (agz: PluginAPI) {
  agz.registerMcpServer("docs", {
    command: "npx",
    args: ["-y", "@example/docs-mcp"],
    env: { DOCS_TOKEN: "${DOCS_TOKEN}" },
    description: "Search the example documentation.",
    exposure: "codemode",
  });
}
```

```json
{
  "name": "docs-mcp-plugin",
  "version": "1.0.0",
  "files": ["extensions"],
  "agzPlugin": { "schemaVersion": 1, "id": "docs-mcp", "extensions": ["extensions/index.ts"] }
}
```

What changes in behaviour:

- The registration is not saved: the extension registers the server on every load, so it exists exactly while the plugin is enabled. Disabling the plugin removes the server.
- A configured server of the same name wins. Delete the `docs` entry from `mcp.json` or agz.json first.
- Keep tokens out of the package. Values may reference environment variables as `${NAME}`; the user sets them in their environment.
- If the server is a script shipped in the package, give its absolute path from the extension file: `fileURLToPath(new URL("../server/mcp.mjs", import.meta.url))`. A relative `cwd` or path resolves against the session's working directory, not the package. The command (`node`, `npx`) must exist on the user's machine.

Verify: after Reload sessions the server's tools appear as `mcp__docs__<tool>` for an agent that has a grant for the server; without a grant the server is not started and its tools are not listed (see the MCP servers section of the extension API page). From Code Mode, `await searchTools("docs")` lists them. This registration shape was run with a stdio test server (the tool `mcp__docs_mcp__pid` appeared for a server named `docs-mcp`; hyphens become underscores).

## A custom agent

Before, an agent file lives in `<project>/.agz-code/agents/` or `~/.agz-code/agent/agents/`:

```
<project>/.agz-code/agents/reviewer.md
```

After, the same file goes into the package and the manifest lists it in `agents`:

```
~/plugins/review-agents/
  package.json
  agents/reviewer.md
```

```markdown
---
name: reviewer
description: Reviews a change and reports defects with evidence.
base: explorer
tools: [readJ, grepJ]
---
You review changes. Report each defect with the file and line.
```

```json
{
  "name": "review-agents",
  "version": "1.0.0",
  "files": ["agents"],
  "agzPlugin": { "schemaVersion": 1, "id": "review-agents", "agents": ["agents"] }
}
```

What changes in behaviour:

- The file rules do not change: `name` equals the file name without `.md`, `base` is one of explorer, researcher, worker, verifier or analyst, and `tools` is a subset of the base's tools.
- Precedence. A global agent or a project agent with the same name wins over the package's; the package's is reported as shadowed. Remove the original.
- Scope. A user-scope plugin provides the agent everywhere; a project-scope plugin only in a trusted project. A disabled plugin provides no agent.
- Check the file with `agent_check` while it is still in an agents folder; it only reads files there. Then move it.

Verify: `manifest_check` lists `agents/reviewer.md` under `resources.agents`; after the plugin is installed the agent appears in Settings > Agents and in the `subagent` tool's list. Loading the package through the engine's agent loader returned `reviewer` with base `explorer` and tools `readJ`, `grepJ`.
