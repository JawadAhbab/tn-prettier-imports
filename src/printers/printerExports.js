module.exports = value => {
  let firstkey = ''
  let idx = 0
  while (firstkey === '') firstkey = value[idx++]
  if (firstkey !== 'export') return null

  const fv = [value].flat(Infinity)
  const hasfrom = fv.some(i => typeof i === 'string' && i.trim() === 'from')
  if (!hasfrom) return null

  const line = []
  fv.forEach(vi => {
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
