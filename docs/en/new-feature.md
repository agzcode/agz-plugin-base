# Add a new feature as a plugin

This page takes a feature that does not exist yet from idea to a packed plugin: choose the kind, design the tools, build from a template, iterate, test and pack. The first steps of the loop are also in the [quickstart](./quickstart.md); the manifest in [the manifest page](./manifest.md).

## Decide: skill, extension code or both

| The feature needs | Use |
|---|---|
| Instructions for the agent (a procedure, rules, when to use what) | A skill: `SKILL.md` |
| A tool that reads input and returns output, run as a script per call | A skill with a script tool: `tools/<tool>.json` + `scripts/` |
| Hooks on events, commands, providers, virtual models, UI calls | Extension code |
| A tool that must stay in the engine process or share state between calls | Extension code (`registerTool`) |
| An MCP server connection | Extension code (`registerMcpServer`) |
| Instructions that explain tools registered by extension code | Both: skill plus extension in one package |

A script tool starts one process per call (30 s and 1 MiB of output limits) and runs in a sandbox when its spec says `mutating: false`. Extension code runs inside the host process with the host's permissions, so keep it small and review it.

## Design the tool surface

- Name and describe a tool for the agent that reads it: what it does, units, limits and the failure cases. The description is the only documentation the agent sees.
- Exposure of extension tools: `direct` is declared to the model; `codemode` is callable from Code Mode scripts without a model declaration on every turn; `deferred` is found by tool search and called from Code Mode. Tools registered from an extension file that no profile lists are added to every profile, including read-only explorer and verifier. A mutating extension tool needs its own safeguards; a read-only profile is not a permission barrier. See [the exposure rules](./extension-api.md).
- Mutating. A skill tool declares `mutating: true` when it writes anything and `false` when it only reads; a tool that does not say counts as mutating. Read-only agents (explorer, verifier, researcher, analyst) cannot call mutating skill tools, so keep reading and writing in separate tools. For an extension tool, set `annotations: { readOnlyHint: true }` on a read-only tool and `destructiveHint: true` on one that deletes or overwrites.
- Return text the agent can act on. Throw an error with a short message that says what to fix; do not return stack traces.
- Keep secrets out of the package, the manifest and skill text.

## Build with the scaffold

From Code Mode, after skill_load of plugin-dev:

```js
const made = await tools.skill__plugin_dev__scaffold({ kind: "skill+extension", id: "notes-helper", target: "/home/me/plugins/notes-helper" });
return made.next;
```

`kind` is `skill`, `extension` or `skill+extension`. The scaffold copies a working template, refuses a target that exists and is not empty, and returns the manifest check of the result. The skill+extension template's `package.json` is:

```json
{
  "name": "notes-helper",
  "version": "0.1.0",
  "description": "A starting point for a plugin.",
  "type": "module",
  "license": "MIT",
  "files": ["skills", "extensions", "README.md"],
  "agzPlugin": {
    "schemaVersion": 1,
    "id": "notes-helper",
    "name": "Notes Helper",
    "description": "A starting point for a plugin.",
    "skills": ["skills/notes-helper"],
    "extensions": ["extensions/index.ts"]
  }
}
```

Replace the template's example tool with your own, and rewrite the skill body and tool descriptions.

## Iterate with a local folder

1. Run `manifest_check` on the folder until `ok` is true and the file lists are what you meant. Warnings are advice; errors block.
2. In Settings > Plugins > Install a plugin, choose the Local path kind, pick the folder and install. The plugin is read in place and shows the Development badge; there is no copy to refresh.
3. After each edit use Reload sessions in the banner that appears (busy sessions reload when their run ends). A new session also loads the current files.
4. In the session, call the tool from Code Mode and check the real output. A skill's tools appear after skill_load of that skill.

## Test

Test tools and the manifest as described in [testing and packaging](./testing-packaging.md): `manifest_check`, `skill_test`, and for extension code a pure-logic unit test plus a real call after Reload sessions.

## Pack

Run `pack_check` on the folder: it lists the files `npm pack` would ship and which declared paths, skill files or imported modules are missing from them. The usual cause is a `files` list in `package.json` that leaves a folder out. Publishing and the official catalog requirements are on [the testing and packaging page](./testing-packaging.md); installing from a repository is on [the GitHub page](./github.md).
