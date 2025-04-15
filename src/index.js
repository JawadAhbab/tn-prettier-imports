const tsparser = require('prettier/parser-typescript')
const estree = require('prettier/plugins/estree')

module.exports = {
  parsers: { typescript: tsparser.parsers.typescript },
  printers: {
    estree: {
      ...estree.printers.estree,
      print: (path, options, print) => {
        const value = estree.printers.estree.print(path, options, print)
        if (value[0] !== 'import') return value

        const line = []
        value.flat(Infinity).forEach(vi => {
          if (typeof vi === 'string') return line.push(vi)
          if (vi.type !== 'group') return line.push(vi)
          vi.contents.flat(Infinity).forEach(ci => {
            if (typeof ci === 'string') return line.push(ci)
            if (ci.type !== 'indent') return
            ci.contents.flat(Infinity).forEach(cci => {
              if (typeof cci === 'string') return line.push(cci)
              if (cci.type === 'line') return line.push(' ')
            })
            line.push(' ')
          })
        })
        return line
      },
    },
  },
}
