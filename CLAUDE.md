# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`tn-prettier-imports` is a **Prettier v3 plugin** (published npm package) that overrides Prettier's
default line-wrapping for module wiring statements, forcing them onto a **single line**:

- `import ... from '...'` — every form (named, default, namespace, `import type`, side-effect).
- `export { ... }` — local named exports.
- `export { ... } from '...'` / `export type { ... } from '...'` — re-exports.
- `export * from '...'` — namespace re-exports.

Everything else (object literals, `export const`/`function`/`class`, `export default`) is left to
Prettier's normal behavior.

There is no build step; the package ships the `src/` files directly (`package.json` `main` →
`./src/index.js`). `prettier` is a **peer dependency**.

## Commands

```bash
yarn install                         # install deps
yarn test                            # run the suite (node --test, zero extra deps)
node --test test/plugin.test.js      # run a single test file

# Eyeball the plugin against a sample file using the repo's own config:
npx prettier --config ./.prettierrc.js path/to/file.ts
```

`.prettierrc.js` loads the plugin via `plugins: ['./src/index.js']`, so running Prettier from the
repo root with that config exercises the real plugin end-to-end.

## Architecture

The plugin **post-processes Prettier's printed Doc**, it does not re-parse source. Prettier's
`print` function is called once per AST node; this plugin wraps the built-in `estree` printer's
`print`, inspects the node, and for import/export statements swaps in a flattened Doc.

Three small modules in `src/`:

1. **`index.js`** — the plugin object. Registers the estree-backed parsers (`typescript`, `babel`,
   `babel-ts`, `babel-flow`) so the plugin's printer is used for JS/TS/JSX/TSX, and wraps
   `estree.printers.estree.print`. For each node it: gets `path.node`, asks `isCollapsible`, and if
   so replaces the Doc with `flattenDoc(doc)` (falling back to the original Doc when flattening
   returns `null`).

2. **`isCollapsible.js`** — a pure AST predicate. Detection is by **node `type`**, not by
   string-sniffing the printed output. `ImportDeclaration` and `ExportAllDeclaration` always match;
   `ExportNamedDeclaration` matches only when `node.declaration == null` (i.e. a `{ ... }` specifier
   list, never `export const`/`function`/`class`).

3. **`flattenDoc.js`** — a generic Doc → single-line flattener. It walks the whole Doc tree
   (`group`/`indent`/`align`/`fill`/`if-break`/`line`/...), turning soft breaks into `''`, regular
   breaks into `' '`, and resolving `if-break` to its flat branch (which drops the trailing comma).
   **Crucially it bails (returns `null`) on `break-parent` or a hard/literal line** — those signal a
   line comment inside the braces, and collapsing past them would let `//` swallow the rest of the
   line. Block comments (`/* */`) carry no `break-parent`, so they collapse safely inline.

Key mental model: you are manipulating Prettier's **Doc IR** (`{ type: 'group' | 'indent' | 'line'
| 'if-break', ... }` objects), not source text or the AST — except for the one `node.type` check
that decides *whether* to flatten. When changing behavior, edit how that Doc tree is flattened
(`flattenDoc.js`) or which nodes qualify (`isCollapsible.js`).

## Conventions

- Plain JS (CommonJS `module.exports` / `require`), no TypeScript, no transpile.
- Repo code style is its own `.prettierrc.js`: `printWidth: 100`, 2-space tabs, no semicolons,
  single quotes, `arrowParens: 'avoid'`.
- Tests are colocated in `test/` and use Node's built-in `node:test` + `node:assert` — no test
  framework dependency. Add a case there for any behavior change and keep all cases green.
- The `/example` folder is git-ignored and referenced by `.vscode/vscode.code-workspace` but not
  committed.
