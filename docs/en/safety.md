# Security and approvals

agz-code lets agents do real work on your computer: they edit files, run commands and use a browser. This page explains which protections are on, what waits for your decision, and which limits remain.

## Credentials

On Linux, the files that hold provider keys, sign-in tokens and saved passwords are hidden from the agent's shell. The agent's commands run in [bubblewrap](https://github.com/containers/bubblewrap) (`bwrap`), and these files look empty to the commands:

- `~/.agz-code/agent/auth.json` and `mcp-auth.json`, and `provider-accounts.json` and `server-tokens.json` under `agz/`
- The desktop app's `engines.json` (tokens of remote engines) and `browser-passwords.json` (saved passwords)

The read tools do not show these files, and the edit and write tools refuse these paths. Writing to other files is allowed.

This is not full isolation:

- The agent can still write files and reach the network. It is not a sandbox.
- A command can still reach your systemd session or the keyring through D-Bus. That route is not closed.
- Outside Linux this protection does not exist: agent commands can read the keys. The app's protection screen says so for each system.
- Without bubblewrap the protection is off. The protection screen shows this; install the `bwrap` package and restart the app.

## Approvals

Five classes of action can be placed under your decision. For each class, the agent either asks you, is allowed, or is denied:

| Class | When it is asked |
|---|---|
| Publish to a remote | `git push`, `gh release create`, a package publish, `docker push` |
| Delete outside the project | `rm` and similar commands on a path outside the project and the temporary folders |
| Submit on a saved-login site | The in-app browser submits a form on a site where you are signed in |
| Send a message to people | Mail programs, GitHub issue and pull request comments, MCP tools that send messages |
| Open an MCP server for a skill | A loaded skill starts an MCP server; asked once for each skill and server |

The question window offers three answers: "Allow once", "Always allow in this project" (for the MCP class: "Always allow this skill and server") and "Deny". If you do not answer within 300 seconds, the request is denied.

Know the limits:

- The check reads the command text. Commands assembled at run time (for example `$(echo git) push`) get past it. A `CDPATH` in the command text is handled: after a `cd` to a relative name the check does not know the folder, so a relative delete after it is asked. A `CDPATH` from the engine's own environment is removed from the commands agents run, so `cd sub` goes to the folder below the current one, as the check assumes. A `find` that deletes is checked by its start path: one outside the project and the temp folders is asked, one inside is not. A start path that is the project root or one of its ancestors is asked too when nothing in the command can exclude it (`find <project root> -delete`); with a test such as `-name`, `-type` or `-mindepth 1` the start is taken to stay.
- The messaging class covers mail programs in the shell, `gh` comments and MCP tools that send messages. MCP tools are picked by their names, so some sending tools can slip past.

Change the classes in Settings > Approvals. The choice made in the first-run wizard is described on the [first session page](./first-session.md#approvals).

## Spending caps

In Settings > Usage and cost > Usage caps, you can set a cap for the day or for a session. A cap is measured in US dollars at list price, in tokens, or in model minutes (the time the model spent answering).

When a cap is reached, work pauses and waits: nothing is lost, and it continues where it left off after Resume. The daily cap opens again when the day changes. Existing installations start with no caps.

## Two subagents on one file

The direct subagents of one lead cannot change the same file at the same time. The first agent to edit a file owns it. If another subagent tries to edit that file, the request is refused with the owner's name, until the owner finishes. The lead is not limited by this rule and can write to any file. Workflow children have their own lock.

Not covered: writes made through the command shell or through MCP tools. When a subagent writes over a file it has not touched before with `write`, the result notes that the earlier content is no longer in the file; the lead can restore it with undo.

## Undoing the agent's edits

The Changes panel lets you undo the agent's file edits, one turn or the whole session. It works without git. Before an undo, the panel shows what will be restored.

- If someone else changed the same file after the agent, the agent's change is still reversed when none of the lines it touched were changed by the other writer. If those lines were changed, the file is left as it is and listed as left out.
- Changes made by terminal commands cannot be undone. The plan lists them separately.

## Remote engine

The app can connect to an engine running on another computer, and a phone connects the same way. By default the engine listens only on its own computer (`127.0.0.1`). You turn on remote access in Settings > Remote access.

- Every client must present an access token. The engine stores only a summary of each token, and shows a new token once, when it is created.
- The engine does not encrypt the connection itself: it speaks plain HTTP and WebSocket. When you connect over a network, use an encrypted tunnel: SSH port forwarding, a VPN, or a reverse proxy or tunnel that terminates TLS.
- If the engine runs behind a reverse proxy or tunnel, it can keep listening on this computer only.
