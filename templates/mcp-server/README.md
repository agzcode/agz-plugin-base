# My Plugin

A plugin for AGZ Code that brings an MCP server. The manifest declares the server, so the plugin needs no extension code: the engine registers the server in every session that loads the plugin.

- `package.json`: `agzPlugin.mcpServers` declares the server `my-plugin`. `${pluginDir}` stands for the installed package folder, which changes with every update, so the server file is always named through it. The server is a program the plugin starts, so the manifest declares the `process` permission.
- `server/index.mjs`: a small MCP server over stdio without a dependency, with one tool, `count`.
- `test/server.test.mjs`: starts the server as the manifest declares it and talks to it over stdio.

Run `npm install`, then `npm test` and `npx agz plugin check`. Link this folder in Settings > Plugins as a local path.

An agent reaches an MCP server only after the user grants it: Settings > Agents > Tools, "MCP servers of {agent}". The declared server is listed there as soon as the plugin is installed. Its tool is then `mcp__my_plugin__count`, called from Code Mode by default.

The server is started with `node`, which must be on the PATH of the machine the engine runs on. A server whose configuration depends on a setting is registered from extension code with `registerMcpServer` instead, under another name.
