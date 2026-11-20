# Memory

Memory is what the agents remember between sessions: decisions, preferences, project facts and lessons learned. Each item is a **record**: a short title, a one-sentence description, Markdown content and links to other records. Before it starts a job, an agent looks in its memory, so it does not have to work out again what it already knows.

Keep your standing rules in the `AGENTS.md` files, not in memory. Memory holds knowledge and history.

## What is recorded

The lead and the bots can write records. The worker can write too. The explorer, analyst, researcher and verifier only read and search. A plugin's answering agent can also read and search general memory during its run, but cannot write records.

You see records and the links between them on the Memory page, and you can edit them. The memory maintenance bot merges duplicates and corrects outdated records.

## Scope: project and general

Each record either belongs to a project or is general:

- A record written from a project's folder belongs to that project. While the project runs, only its records and the general records are visible; other projects' records are not.
- A record written without a project is general and visible in every project.

Memory has two separate stores. The general memory lives in `~/.agz-code/memory/`. Each bot's own memory lives in `~/.agz-code/bots/<bot>/memory/`, and a bot memory has no project. The two stores are not linked. A bot has no access to the general memory unless you give it read, or read and write.

## How the agent uses memory

- On every user message, the engine adds the IDs, titles and descriptions of the records close to the message. It does not add their content. If no record is close, nothing is added.
- Worker and verifier tasks do not get these hints. The lead gives them the records they need, by ID.
- A lead or bot session starts with a list of the record titles. Records written during the session are not in that list; the agent finds them by search.

## Search

Search always matches words. When embeddings are on (OpenRouter connected and semantic search turned on), meaning search is added. If embeddings are off or unavailable, search matches words only, and the result says so.

## Backups and restoring

- The general memory is backed up once a day to `~/.agz-code/memory/backups/`. The last seven daily backups are kept.
- Settings > Memory > Backups lists the backups, newest first. "Restore" puts a backup back. Restoring works only on the general memory, and only in the running desktop app. The memory returns to the state of the chosen day; changes made after that day are lost.
- Before a restore, the current memory is copied to `backups/pre-restore-<ms>.db`, so nothing is lost for good. If the backup is damaged or missing, nothing changes and the app says why.
- Each backup also rewrites `memory/export/memory.jsonl`, which holds one line per record. If the database is damaged, the records can be recovered from this file.

## History and undo

Every write goes into the history: the time, the session, who wrote it (a role, a bot, or "user" for a change made in the app), the action, and the old and new text. Edits and reverts also keep the record's earlier state. These snapshots are kept for 90 days.

- The memory maintenance bot can revert an edited record to its state before that edit.
- A deleted record keeps its content and links in the history. The memory maintenance bot can restore it under its own ID.
- The app does not show the history. The maintenance bot browses it with the `memory_history` tool.
