module.exports = value => {
  if (value[0] !== 'import') return false
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
}
