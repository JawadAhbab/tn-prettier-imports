'use strict'

const { test } = require('node:test')
const assert = require('node:assert/strict')
const prettier = require('prettier')

const plugin = require('../src/index.js')

/** Format `code` with the plugin enabled, using the repo's own style. */
function format(code, options = {}) {
  return prettier.format(code, {
    parser: 'typescript',
    plugins: [plugin],
    printWidth: 100,
    semi: false,
    singleQuote: true,
    ...options,
  })
}

/** True when the formatted output is a single (non-empty) line. */
const isOneLine = output => output.trim().split('\n').length === 1

// ---------------------------------------------------------------------------
// Imports — every form collapses to one line.
// ---------------------------------------------------------------------------

test('named import longer than printWidth collapses', async () => {
  const code = `import { aaaaaaaaaa, bbbbbbbbbb, cccccccccc, dddddddddd, eeeeeeeeee, ffffffffff, gggggggggg, hhhhhhhhhh } from './module-path'\n`
  const out = await format(code)
  assert.ok(isOneLine(out), out)
  assert.equal(out, code)
})

test('default + named import collapses', async () => {
  const code = `import Defaultttt, { aaaaaaaaaa, bbbbbbbbbb, cccccccccc, dddddddddd, eeeeeeeeee, ffffffffff } from './module-path'\n`
  const out = await format(code)
  assert.ok(isOneLine(out), out)
})

test('`import type` collapses', async () => {
  const code = `import type { AaaaAaaa, BbbbBbbb, CcccCccc, DdddDddd, EeeeEeee, FfffFfff, GgggGggg, HhhhHhhh } from './module-path'\n`
  const out = await format(code)
  assert.ok(isOneLine(out), out)
  assert.match(out, /^import type \{/)
})

test('side-effect import is left intact', async () => {
  const code = `import './some-side-effect-module'\n`
  const out = await format(code)
  assert.equal(out, code)
})

// ---------------------------------------------------------------------------
// Exports — the bug fix: local `export { ... }` (no `from`) now collapses too.
// ---------------------------------------------------------------------------

test('local export without `from` collapses (regression: previously wrapped)', async () => {
  const code = `export { localAaaaaa, localBbbbbb, localCccccc, localDddddd, localEeeeee, localFfffff, localGggggg, localHhhhhh }\n`
  const out = await format(code)
  assert.ok(isOneLine(out), out)
  assert.equal(out, code)
})

test('re-export with `from` collapses', async () => {
  const code = `export { aaaaaaaaaa, bbbbbbbbbb, cccccccccc, dddddddddd, eeeeeeeeee, ffffffffff, gggggggggg } from './module-path'\n`
  const out = await format(code)
  assert.ok(isOneLine(out), out)
})

test('`export type { ... } from` collapses', async () => {
  const code = `export type { AaaaAaaa, BbbbBbbb, CcccCccc, DdddDddd, EeeeEeee, FfffFfff, GgggGggg, HhhhHhhh } from './module-path'\n`
  const out = await format(code)
  assert.ok(isOneLine(out), out)
})

test('`export * from` is left on one line', async () => {
  const code = `export * from './a-fairly-long-module-path-for-a-namespace-re-export-statement'\n`
  const out = await format(code)
  assert.ok(isOneLine(out), out)
})

// ---------------------------------------------------------------------------
// Non-targets — everything else formats exactly as vanilla Prettier.
// ---------------------------------------------------------------------------

test('object literal is NOT collapsed', async () => {
  const code = `const value = { aaaaaaaaaa, bbbbbbbbbb, cccccccccc, dddddddddd, eeeeeeeeee, ffffffffff, gggggggggg, hhhhhhhhhh }\n`
  const out = await format(code)
  assert.ok(!isOneLine(out), out)
  assert.match(out, /\{\n/)
})

test('`export const` with an object is NOT collapsed', async () => {
  const code = `export const config = { aaaaaaaaaa, bbbbbbbbbb, cccccccccc, dddddddddd, eeeeeeeeee, ffffffffff, gggggggggg }\n`
  const out = await format(code)
  assert.ok(!isOneLine(out), out)
  assert.match(out, /\{\n/)
})

// ---------------------------------------------------------------------------
// Comment safety.
// ---------------------------------------------------------------------------

test('block comment inside braces collapses and is preserved', async () => {
  const code = `import { aaaaaaaaaa /* note */, bbbbbbbbbb, cccccccccc, dddddddddd, eeeeeeeeee, ffffffffff, gggggggggg } from './x'\n`
  const out = await format(code)
  assert.ok(isOneLine(out), out)
  assert.match(out, /\/\* note \*\//)
})

test('line comment inside braces bails (code is not corrupted)', async () => {
  const code = `import {
  aaaaaaaaaa, // keep this comment
  bbbbbbbbbb,
} from './module-path-which-is-long-enough-here'
`
  const out = await format(code)
  // Must stay multi-line so the // comment never swallows the next specifier.
  assert.ok(!isOneLine(out), out)
  assert.match(out, /\/\/ keep this comment/)
  assert.doesNotMatch(out, /\/\/ keep this comment.*bbbbbbbbbb/)
})

// ---------------------------------------------------------------------------
// Parser coverage — the plugin works for JS, TS and TSX.
// ---------------------------------------------------------------------------

test('collapses in a .js file (babel parser)', async () => {
  const code = `import { aaaaaaaaaa, bbbbbbbbbb, cccccccccc, dddddddddd, eeeeeeeeee, ffffffffff, gggggggggg, hhhhhhhhhh } from './module-path'\n`
  const out = await format(code, { parser: 'babel' })
  assert.ok(isOneLine(out), out)
})

test('non-collapsible code is byte-identical to vanilla Prettier (regression: dropped print args)', async () => {
  // An arrow body that is a conditional returning JSX. Prettier prints these via
  // the printer's 4th `args` argument; if the plugin drops it, the closing parens
  // collapse (`))}`) and the output diverges from vanilla even though nothing here
  // is an import/export the plugin should touch.
  const code = `export default function Highlight({ parts }) {
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith('*') ? (
          <span key={index} className="hl">
            {part.slice(1, -1)}
          </span>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  )
}
`
  const withPlugin = await format(code)
  const vanilla = await prettier.format(code, { parser: 'typescript', printWidth: 100, semi: false, singleQuote: true })
  assert.equal(withPlugin, vanilla)
})

test('collapses imports in a .tsx file and leaves JSX intact', async () => {
  const code = `import { aaaaaaaaaa, bbbbbbbbbb, cccccccccc, dddddddddd, eeeeeeeeee, ffffffffff, gggggggggg, hhhhhhhhhh } from './module-path'

const App = () => <div className="container">hello</div>
`
  const out = await format(code, { parser: 'typescript' })
  const [importLine] = out.split('\n')
  assert.ok(importLine.startsWith('import {') && importLine.endsWith("from './module-path'"), out)
  assert.match(out, /<div className="container">hello<\/div>/)
})
