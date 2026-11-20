# Test, package and publish

Check the manifest, check what ships, test the tools, then publish. Every check below is a tool of the plugin-dev skill or a command you can run yourself.

## Check the manifest: manifest_check

```js
const result = await tools.skill__plugin_dev__manifest_check({ path: "/home/me/plugins/notes-helper" });
return result;
```

It validates the manifest with the loader's own rules and lists the files each resource field resolves to. It returns every error, where the loader stops at the first: `ok`, `errors`, `warnings`, `resources`. A folder without a manifest returns `ok: false`. Warnings are advice the loader does not enforce (a skill name that differs from its folder, a missing description, no default export in an extension, no package name or version). Fix errors; read warnings.

## Check what ships: pack_check

```js
const packed = await tools.skill__plugin_dev__pack_check({ path: "/home/me/plugins/notes-helper" });
return { ok: packed.ok, files: packed.files, missing: packed.missing };
```

It runs `npm pack --dry-run --json --ignore-scripts` and compares the file list with the manifest: `missing` lists declared resource files, files of a declared skill folder and relative imports of extension files that the package would leave out. The usual cause is a `files` list in `package.json` that omits a folder. It returns early when the manifest is invalid.

## Test skill tools

- `tools.skill_test({skill: "<name>"})` validates the package and runs every example in a scratch directory. A skill with tools needs at least 3 passing examples and one per tool. It runs the skill in a sandbox that holds only the skill folder: scripts must not import files outside it. Examples of node scripts also get the host's `node` and `npm` when they are found on PATH, so a tool such as `pack_check` can run `npm`. That works for the standard layout (`<prefix>/bin/npm` pointing into `<prefix>/lib/node_modules/npm`, as with nvm, tarball and CI tool-cache installs); shims (volta, asdf) and split installs (Debian's apt npm) are not supported. The sandbox still has no network and no writes outside its temporary space.
- `tools.skill_eval({skill: "<name>", cases: [...]})` routes up to 12 phrasings of the need through the lexical router and reports whether the skill ranks first or in the top 3. Write the phrasings in the words users use, in each language the skill targets.
- Both find a plugin's skill by name once the plugin is installed and its original copy is gone. The format is in the skill-creator skill's `references/format.md`.

## Test extension code

- Put logic in a module that does not import `@agz-yazilim/plugin-sdk` and unit-test it with `node --test`; keep `extensions/index.ts` thin. The SDK is provided by the host and cannot be imported by a plain Node test.
- Test the real registration in a session: link the folder, Reload sessions, then call the tool from Code Mode with a good input, with a bad input and with the failure you describe in its description. The line-count example returned `{"file":"work/sample.txt","lines":3}` for a good call and the tool error `line-count: cannot read nope.txt: ENOENT` for a bad one.
- Use [the kit's mock host and mock engine](./testing.md) for unit tests. Run `npx agz plugin test --integration` to check that [the engine from the installed app](./cli.md#integration-test) loads the plugin. This check does not call a model or exercise the running session.

## Pack

For your own plugin:

```sh
npx agz plugin pack
```

It writes `<name>-<version>.tgz` of exactly what `pack_check` listed. To try it, unpack the archive and install the `package/` folder as a local path; the archive itself is not an install source. The packed copy catches scripts or assets that worked in your folder but are missing from the archive.

The kit checks the manifest, SDK range, types and package contents before running `npm pack --ignore-scripts`. It does not publish the archive.

## Versioning

Use semantic versions in `package.json`: patch for a fix, minor for a new tool or option, major for a changed tool input or output. A skill raises its own `metadata.version` the same way when its content changes. Tag each release in Git (`v1.2.0`) so users can pin it (see [the GitHub page](./github.md)); an npm source `npm:<package>@1.2.0` is pinned the same way, and an unpinned npm or Git source is updated by the Update button.

## Signed releases in the public catalog

Publishing to the catalog is not self-service: the operator must certify the publisher and approve each release. You can distribute your plugin through [another supported install source](./overview.md#sources-and-scope) without listing it in the catalog.

1. Ask the catalog operator to certify your publisher handle and bind your catalog key to the manifest id. Confirm the signing key's fingerprint through a separate channel. Sign the operator's one-time challenge with the candidate key; keep the private key with the publisher, not in the registry or package.
2. Choose the exact artifact users will receive. For npm, obtain the distributed tarball from the registry; for Git, use the full commit in a local repository and its canonical HTTPS remote URL. Users need their own access to private npm or Git. For a direct HTTPS archive, use a stable public HTTPS URL without credentials, a query, or redirects. Git and direct archives must contain the built package without runtime dependencies; npm may declare dependencies but must not ship `node_modules`. The engine runs no install scripts for signed releases.
3. Prepare the bytes locally with `npx agz plugin publish release-spec.json --out release.json`. The input has `handle`, `keyGeneration`, `pluginKey`, `pluginId`, `version`, `serial`, `source`, `artifact` (local tarball or Git repository), and `publicKey` (local Minisign `.pub` file). `source` is `{kind:"npm",registry,package}`, `{kind:"git",url,commit}`, or `{kind:"https",url}`. Both the version and serial must increase. The command checks the artifact's manifest and prints separate digests for the artifact and for `release.json`. It does not sign, upload, or start the engine server.
4. Sign the unchanged `release.json` with your Minisign private key and the trusted comment `version:agz.catalog.release.v1:<serial>` (replace `<serial>` with its number). Submit the document and signature through the catalog operator's publishing process. The release stays pending until the operator approves that exact document.
5. Test on another engine with access to the package. In Settings > Plugins, check the signed release, then review the version, serial, document digest and permissions before you confirm. The document digest is not the artifact digest. If the release changes after approval, the engine cancels installation rather than trying an unsigned source.
