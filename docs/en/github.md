# Develop from GitHub

A plugin can be installed from a GitHub repository, developed against a local clone and updated from it; the ref decides which updates it gets. This page lists the source forms the engine accepts, how pinning and updates behave, and the development loop. The behaviour below was run against a local repository standing in for GitHub (install, tag, branch, update, remove).

## Source forms

The installer stores the shorthand forms as `git:github.com/owner/repo[@ref]` and clones `https://github.com/owner/repo` over https. A `#ref` in a `git:` or `https://` source is stored as `@ref`.

| You enter | Stored as |
|---|---|
| `owner/repo` | `git:github.com/owner/repo` |
| `owner/repo@v1.2.0` | `git:github.com/owner/repo@v1.2.0` |
| `github:owner/repo@main` | `git:github.com/owner/repo@main` |
| `git:github.com/owner/repo@v1` | unchanged |
| `git:github.com/owner/repo#v1` | `git:github.com/owner/repo@v1` |
| `https://github.com/owner/repo` | unchanged |
| `https://github.com/owner/repo.git@v1` | unchanged |
| `https://github.com/owner/repo#v1` | `https://github.com/owner/repo@v1` |

A ref is a tag, a branch (`feature/x` is allowed) or a commit; it is letters, digits, `.`, `_`, `/` and `-`, and does not start with `-`. In Settings > Plugins > Install a plugin the GitHub kind has a Repository field and an optional Ref field.

Refused:

| Form | Reason |
|---|---|
| `ssh://git@github.com/owner/repo`, `git@github.com:owner/repo.git` | The install job clones over https only; these forms are not accepted at all |
| `http://github.com/owner/repo` | Plain http is refused; use https |
| `https://user:pw@github.com/owner/repo` | A URL must not carry credentials, so they never land in settings |
| `owner/repo#main`, `github:owner/repo#main` | The shorthand takes `@ref` only, so write `owner/repo@main`. `#ref` is accepted in the `git:` and `https://` forms |
| `owner/repo/sub` | Only `owner/repo` and an optional `@ref` |
| `git:github.com/repo` | `<owner>/<repo>` is needed after the host |
| `owner/repo@-x` | A ref must not start with `-` |

## Pinning and updates

The ref decides which updates a source gets. A tag or a commit ref is pinned: it never moves, and Settings does not offer an update for it. A branch ref (`@main`) and a source without a ref (the default branch) are offered an update when that branch on the remote has moved past the checkout.

What the run showed with the repository tagged `v1.0.0` and later `v1.1.0`:

| Source | Update check | After Update |
|---|---|---|
| `owner/line-count@v1.0.0` | no update offered | stays at `v1.0.0` (the tag is fetched again) |
| `owner/line-count` | update offered when the default branch moved | moves to the newest default-branch commit (`1.1.0`) |
| `owner/line-count@main` | update offered when `main` moved | Update moves to the current tip of `main` |
| ref changed in settings to `@v1.0.0` | n/a | Update checks out `v1.0.0` again |

So a tag or a commit never moves. A branch, the default branch included, moves only when the user runs Update. Local paths have nothing to update. To release a new version, push a tag and tell users to change the ref.

Install and update run `npm install --omit=dev --legacy-peer-deps --ignore-scripts` in the checkout when it has a `package.json`. The install scripts run only when the user ticks Run install scripts in the confirmation; install and update need that confirmation in any case (see [turning a Git project into a plugin](./convert-git-project.md)). The checkout lives under the agent directory (user scope) or `<project>/.agz-code/git` (project scope) in `git/github.com/<owner>/<repo>`; the plugin is the repository root, so its `package.json` must have the `agzPlugin` manifest.

## Private repositories

Over https, a private repository installs and updates when your git credential helper can already read it (for example gh, Git Credential Manager or libsecret). agz-code stores no credentials and never prompts for them: git runs without prompts, and a repository it cannot read fails with an error that names the git credential helper. ssh forms stay refused. The alternative is to clone the repository with your own git setup and install the clone as a local path (next section); its updates are your `git pull`.

## Develop against a local clone

```sh
git clone git@github.com:owner/my-plugin.git ~/src/my-plugin
```

1. Run `manifest_check` in the clone until it is `ok`.
2. In Settings > Plugins > Install a plugin choose Local path (or Choose folder) and enter the absolute path of the clone. It is read in place and shows the Development badge.
3. After each change use Reload sessions. Nothing is copied, so there is nothing to refresh.
4. When it works, remove the local path entry and install the GitHub source with a tag.

## Publish a tag

```sh
git tag v1.0.0
git push origin v1.0.0
```

Then install `owner/my-plugin@v1.0.0` from Settings. Before tagging, run `pack_check` and the checks on [the testing and packaging page](./testing-packaging.md): the repository root is the plugin, so `files` in `package.json` does not limit a Git install (the whole checkout is used), but it does limit npm packs.
