# tn-prettier-imports

A [Prettier](https://prettier.io) v3 plugin that keeps `import` and `export` statements on a
**single line**, overriding Prettier's default of wrapping long specifier lists one-per-line.

```ts
// Prettier on its own                         // with tn-prettier-imports
import {                                        import { one, two, three, four, five, six } from './module'
  one,
  two,
  three,
  four,
  five,
  six,
} from './module'
```

## Install

```bash
npm install --save-dev tn-prettier-imports
# or: yarn add -D tn-prettier-imports
```

Requires `prettier@^3`.

## Usage

Add it to the `plugins` array of your Prettier config:

```js
// .prettierrc.js
module.exports = {
  plugins: ['tn-prettier-imports'],
}
```

Works for JavaScript and TypeScript — `.js`, `.jsx`, `.ts`, `.tsx` (babel, babel-ts and
typescript parsers).

## What it collapses

| Statement                          | Behavior        |
| ---------------------------------- | --------------- |
| `import { ... } from '...'`        | → single line   |
| `import Default, { ... } from '…'` | → single line   |
| `import type { ... } from '...'`   | → single line   |
| `import * as ns from '...'`        | → single line   |
| `export { ... }` (local)           | → single line   |
| `export { ... } from '...'`        | → single line   |
| `export type { ... } from '...'`   | → single line   |
| `export * from '...'`              | → single line   |

Everything else is formatted exactly as vanilla Prettier would — object literals,
`export const`/`function`/`class` declarations and `export default` are left untouched.

## Comment safety

A statement that contains a **line comment** inside its braces is left in Prettier's
multi-line layout, because collapsing it would let the `//` swallow the rest of the line:

```ts
import {
  one, // still here
  two,
} from './module'
```

Block comments (`/* ... */`) collapse inline and are preserved.

## How it works

The plugin wraps Prettier's built-in `estree` printer. For each `import` / `export` statement
it takes the Doc that the stock printer produced and rewrites it into its flat, single-line
form; every other node is returned unchanged. See [CLAUDE.md](CLAUDE.md) for the architecture.

## Development

```bash
yarn install
yarn test     # node --test
```

## License

MIT
