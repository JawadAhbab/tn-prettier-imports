module.exports = (value, chains) => {
  for (let chain of chains) {
    const cvalue = chain(value)
    if (cvalue) return cvalue
  }
  return value
}
