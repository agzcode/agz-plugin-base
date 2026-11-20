# Quickstart

This page builds a plugin with the `agz plugin` command, links it in the app and calls its tool. The command is described in [Command line](./cli.md).

## Before you start

- Node.js 22.19 or newer.
- `agz plugin create` comes from the kit: run it as `npx agz plugin` in a folder where `@agz-yazilim/plugin-kit` is installed.

## Create the plugin

In an empty folder of your own, run `npm init -y` first: without a `package.json` or `node_modules` there, npm installs into the nearest parent folder that has one. Then install the kit from npm, create the plugin with it, and install the plugin's dependencies:

```sh
npm init -y
npm install --save-dev --save-exact --ignore-scripts @agz-yazilim/plugin-kit@1.3.0
npx agz plugin create notes-helper --kind skill+extension --id acme/notes-helper
cd notes-helper
npm install --ignore-scripts
```

`create` writes the versions of the kit that created the plugin and of its SDK into `devDependencies`, so `npm install` in the plugin folder installs the same versions.

The plugin's id is `acme/notes-helper`: `acme` is the publisher, a name you choose for everything you publish, so replace it with your own. The `skill+extension` kind gives a skill in `skills/notes-helper` and extension code in `extensions/index.ts`. The extension file starts like this:

```ts
import { defineTool, type PluginAPI, Type } from "@agz-yazilim/plugin-sdk";

const echo = defineTool({
	name: "notes_helper_echo",
	label: "Notes Helper echo",
	description: "Return the given text unchanged. Replace this with the plugin's real tool.",
	parameters: Type.Object({ text: Type.String({ description: "The text to return." }) }),
	// "codemode": callable from Code Mode scripts, not declared to the model on every turn.
	exposure: "codemode",
	execute: async (_toolCallId, params) => ({ content: [{ type: "text", text: params.text }], details: {} }),
});

export default function (agz: PluginAPI) {
	agz.registerTool(echo);
	// A hook runs before the call: here it refuses an empty echo with a reason the agent can read.
	agz.on("tool_call", async (event) => {
		if (event.toolName === "notes_helper_echo" && String(event.input.text ?? "") === "") {
			return { block: true, reason: "notes_helper_echo needs a non-empty text" };
		}
		return undefined;
	});
}
```

Replace the echo tool with the plugin's own tool when you are ready; [Extension API](./extension-api.md) describes what a tool, a hook and the other parts can do.

## Check and test

```sh
npm test
npx agz plugin check
```

`npm test` runs `agz plugin test`, which runs the test file the template put in `test/`. `check` validates the manifest, the SDK range and the types, and lists the files the package would ship. Both exit with 0 when they pass.

## Link the plugin in the app

1. Open Settings > Plugins and install a plugin from a local folder: choose the `notes-helper` folder. Its row shows the Development badge. The folder is not copied: the app reads it where it is, so your next change needs no new install.
2. Press Reload sessions, so the open sessions load it. A new session loads it when it starts.

## Call the tool

The tool has exposure `codemode`: the model does not see it on every turn, and a Code Mode script calls it as `tools.<tool name>(arguments)`. Open a session and ask the agent to run this script in Code Mode:

```js
return await tools.notes_helper_echo({ text: "hello" });
```

The result holds `hello`. Then ask it to run the same call with an empty text, `{ text: "" }`: the hook refuses it, and the script fails with `notes_helper_echo needs a non-empty text`.

## Keep developing

`npx agz plugin dev` checks the folder after every change and keeps running until Ctrl+C. While the folder is linked, the app reloads the sessions that loaded it after a change. When the plugin is ready, `npx agz plugin pack` checks it and writes the tarball into the folder. To distribute a release through the catalog, follow [Signed releases in the public catalog](./testing-packaging.md#signed-releases-in-the-public-catalog).

## Where to go from here

The `create` templates cover a tool, a hook and a skill. For the other kinds of contribution, the `agz-plugin-base` repository has a template to copy and a complete example of each: an engine module for background work, an MCP server declared in the manifest, project-scoped settings, the plugin's own data folder, a panel view, and a plugin without code (agents, prompts, a bot template). They are listed in [Example plugins](./examples.md).
