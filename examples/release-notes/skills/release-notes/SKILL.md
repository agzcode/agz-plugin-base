---
name: release-notes
description: 'Write release notes or a changelog entry from git commit subjects. Use when asked for "release notes", "changelog", "what changed since the last release", "sürüm notları" or "değişiklik günlüğü".'
metadata:
  version: 1.0.0
  agz-kind: routed
---

# Release notes

Turn the commit subjects of one release into notes a user can read.

1. Find the range: the last tag (`git describe --tags --abbrev=0`) up to `HEAD`. Without a tag, use the whole history and say so.
2. Read the subjects: `git log <tag>..HEAD --format=%s`. Pass them, one string each, to `group_commits({subjects})`.
3. Use the returned `markdown` as the draft. It groups Conventional Commits by type (breaking changes first, then Added, Fixed, Changed, Documentation, Other) and leaves out `chore`, `test`, `ci`, `build` and `style` commits; `ignored` counts them.
4. Edit the draft for the reader: one sentence per change, in the project's language, without commit jargon. Keep every item the tool returned or say why you merged or dropped it.
5. Show the result and the number of ignored commits. Write it to a file only when the user names one.

`group_commits` reads nothing from disk and changes nothing. A subject that is not a Conventional Commit goes to "Other" unchanged.
