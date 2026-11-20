# Installation

agz-code is a desktop app. Behind it runs an engine that manages the agents, sessions, memory and settings. This page covers installing the app, where the data lives, update channels and moving the data to another computer.

## Installing on Linux

Take one of the two packages from the [download page](/en/download/). Check the file's SHA-256 value against the value on its card with `sha256sum <file>`.

**AppImage** (`agz-code_<version>_amd64.AppImage`) needs no installation. Make the file executable, then start it:

```sh
chmod +x agz-code_<version>_amd64.AppImage
./agz-code_<version>_amd64.AppImage
```

**On Debian and Ubuntu based systems (.deb)**, install the package with `apt`:

```sh
sudo apt install ./<downloaded-file>.deb
```

## Windows

The Windows installer is on the download page, but agz-code has not been tested on a real Windows machine yet, so none of the steps on this page has been verified there. The tables below come from reading the code. Know this before you install it and use it for real work there.

Agents need a bash shell to run commands. Install [Git for Windows](https://git-scm.com/download/win); without it every command stops with `No bash shell found`. If you use another bash, such as Cygwin or MSYS2, add it to PATH. Setting `shellPath` in `agz.json` covers agent commands only, not the Designer's preview servers.

**Off on Windows**

| Feature | What you see | What to do instead |
|---|---|---|
| Credential file shield | Settings > Agents shows a warning that a command an agent runs can read the provider keys, OAuth tokens and saved passwords in agz's credential files. The edit and write tools still refuse to change those files. | Let agents run commands only in projects you trust. If commands must not read these keys, use agz-code on Linux. |
| Read-only shell, researcher agent | A warning when the session starts, and every bash call is refused. | Use the agent's read and web tools, and run the checks yourself. |
| Read-only shell, other read-only agents | A warning when the session starts. Only a pattern check stops obvious writes, so a script or an install can still change the project. | After the session, check the project's changes, for example with `git status`. |
| Command memory protection | Nothing is shown. Commands get no separate Linux systemd scope, which lets the system end a runaway command alone. | Watch memory in Task Manager. Ask the agent to stop a runaway background process, or end it in Task Manager. |
| Skill example tests | The test stops with `skill test sandbox unavailable: Linux bubblewrap is required`. | Run those tests on Linux. |
| Chrome connection | The Chrome connection settings say the connection is not available on this system yet. | Use the in-app browser. |
| Terminal | The Terminal panel says terminals need Linux or macOS. | Use a terminal of your own, such as Windows Terminal. |

**Works differently on Windows**

| Feature | What you see | What to do instead |
|---|---|---|
| Stopping a background process | `process_kill` ends the whole process tree at once, with no graceful stop. If the process still runs after 3 seconds, the stop is repeated. | Let the process finish its writes first, or stop it yourself after it saves its work. |
| Private file modes | Nothing is shown. Files that agz keeps private on Linux and macOS (settings, sign-in data, access tokens) get the permissions of their folder instead. | Keep the data folder in your Windows user profile, the default, and do not copy it to shared places. |
| File location checks | Nothing is shown. The engine checks where a file lies by its path, not by the file it opened, so a link swapped in during a read or write can get past the check. | Do not let agents work in folders that other programs change at the same time. |
| Chrome memory | Nothing is shown. agz-code cannot read Chrome's memory, so the automatic reset of a page that grows too large does not happen. | On long sessions, watch Chrome in Task Manager, and end the task if it keeps growing. |

## Where the data lives

The engine's settings and session folder is `~/.agz-code/agent`. The other data is under `~/.agz-code/`:

| Path | Contents |
|---|---|
| `~/.agz-code/agent/` | Settings (`agz.json`), sessions, custom agent profiles, provider credential files |
| `~/.agz-code/memory/` | The general memory and its daily backups |
| `~/.agz-code/bots/` | Each bot's folder and memory |
| `~/.agz-code/skills/` | General skills |
| `~/.agz-code/plugins/` | The plugin store: installed plugins, their record, settings, secrets and own data (see [Storage](./storage.md)) |
| `~/.agz-code/data/` | Generated images, audio and 3D models |
| `~/.agz-code/AGENTS.md` | Your general instructions |

A project's own settings are in its `.agz-code/` folder and travel with its repository. That folder also names the project's plugins (`plugins.json`) and holds the project's own values of plugin settings (`plugin-config/`); the plugin packages themselves are always in the plugin store.

## Updates and channels

Check for updates in Settings > Updates. The check runs in the desktop app and needs a connected engine. The update channel decides which releases a check offers. Changing the channel installs nothing.

| Channel | Releases offered |
|---|---|
| Alpha | Every release, including early test builds |
| Beta | Beta and stable releases |
| Stable | Stable releases only |

## Moving the data to another computer

To put all your data in one archive and open it on another computer, use the engine's `data-archive` command. The command takes the engine's data-folder lock. While the app runs, the command stops with exit code 75, so quit the app first.

```sh
<engine> data-archive export ~/agz-data.tar.gz
<engine> data-archive import ~/agz-data.tar.gz
```

Replace `<engine>` with the engine file of your installation:

- Linux deb: `/opt/agz-code/resources/agz-engine`
- AppImage: after you have started the app once, `~/.cache/agz-code/engine/<version>/agz-engine`. Or extract the image with `./agz-code_<version>_amd64.AppImage --appimage-extract` and use `squashfs-root/resources/agz-engine`.

The export takes everything except what is listed below. It includes sessions, memory, `agz.json` and the other settings, the general `AGENTS.md`, general skills, bots, custom agent profiles and generated files. Of the plugin store it takes the record of installed plugins, their settings and their data.

These stay out:

- Provider keys, sign-in data and the plugins' secret values (`plugins/secrets.json`). They come only if you add `--with-credentials` to `export`.
- The installed plugin packages. The archive carries their record: after the import, install them again with Update in Settings > Plugins (see [Storage](./storage.md#moving-to-another-computer)).
- Secret values in the settings files (API keys, MCP headers). They are emptied. The import lists which ones were emptied, and you enter them again.
- The browser profile and cookies, caches, logs, temporary files, the history index and each project's `.agz-code/` folder.

Import rules:

- The target data folder, and the `skills`, `bots`, `memory`, `data`, `plugins` folders and `AGENTS.md` beside it, must be empty or missing. If one of them holds files, the command stops and writes nothing. If the target differs, name it with `--target <agentDir>`.
- The engine at the target must be the same version as the one that wrote the archive or newer.
- Exit code 0 means done, 1 means an error, and 75 means an engine is running.

Treat the archive as sensitive. Anything you typed into a session is in it, even when no secret value is.

Next step: [First session](./first-session.md).
