const tsparser = require('prettier/parser-typescript')
const estree = require('prettier/plugins/estree')
const prettierImports = require('./printers/printerImports')
const chainer = require('./accessories/chainer')
const printerExports = require('./printers/printerExports')

module.exports = {
  parsers: { typescript: tsparser.parsers.typescript },
  printers: {
    estree: {
      ...estree.printers.estree,
      print: (path, options, print) => {
        const value = estree.printers.estree.print(path, options, print)
        return chainer(value, [prettierImports, printerExports])
      },
    },
  },
}
