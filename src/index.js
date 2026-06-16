'use strict'

const babel = require('prettier/parser-babel')
const typescript = require('prettier/parser-typescript')
const estree = require('prettier/plugins/estree')

const flattenDoc = require('./flattenDoc')
const isCollapsible = require('./isCollapsible')

const basePrinter = estree.printers.estree

/**
 * tn-prettier-imports
 *
 * A Prettier plugin that keeps `import`/`export` statements on a single line,
 * overriding Prettier's default of wrapping long specifier lists one-per-line.
 *
 * It works by wrapping the built-in `estree` printer: the stock printer builds
 * the statement's Doc as usual, and for import/export statements we replace that
 * Doc with its flattened, single-line form. Every other node is returned
 * unchanged, so the rest of the file formats exactly as vanilla Prettier would.
 */
const print = (path, options, print) => {
  const doc = basePrinter.print(path, options, print)

  const node = path.node !== undefined ? path.node : path.getValue()
  if (!isCollapsible(node)) return doc

  const flattened = flattenDoc(doc)
  // `null` means flattening was unsafe (e.g. a line comment inside the braces);
  // fall back to Prettier's original multi-line layout.
  return flattened === null ? doc : flattened
}

// Re-register every estree-backed parser Prettier ships so this plugin's printer
// is the one used for JavaScript and TypeScript — .js/.jsx (babel), .ts (babel-ts
// or typescript), .tsx (typescript) and Flow.
module.exports = {
  parsers: {
    typescript: typescript.parsers.typescript,
    babel: babel.parsers.babel,
    'babel-ts': babel.parsers['babel-ts'],
    'babel-flow': babel.parsers['babel-flow'],
  },
  printers: {
    estree: { ...basePrinter, print },
  },
}
