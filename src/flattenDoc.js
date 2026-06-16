'use strict'

/**
 * Collapse a Prettier Doc into its single-line ("flat") form.
 *
 * Prettier represents formatted output as a tree of Doc commands
 * (`group`, `indent`, `line`, `if-break`, ...). Normally a `group` decides at
 * print time whether to break across multiple lines. This walker forces the
 * flat rendering by hand: soft breaks vanish, regular breaks become a single
 * space, and `if-break` resolves to its non-breaking branch (which, for an
 * import/export list, drops the trailing comma).
 *
 * It refuses to flatten when doing so would corrupt the code. A line comment
 * inside the braces is emitted by Prettier as a `line-suffix` plus a
 * `break-parent` (with no hardline). Forcing that onto one line would push the
 * `//` comment to the end and swallow everything after it, so any `break-parent`
 * or hard/literal line makes us bail and keep Prettier's original layout.
 *
 * @param {import('prettier').Doc} doc
 * @returns {import('prettier').Doc | null} the flattened Doc, or `null` when it
 *   cannot be safely collapsed.
 */
const BAIL = Symbol('cannot-flatten')

function walk(doc) {
  if (typeof doc === 'string') return doc
  if (Array.isArray(doc)) return doc.map(walk)
  if (doc == null || typeof doc !== 'object') return doc

  switch (doc.type) {
    case 'group':
    case 'indent':
    case 'align':
    case 'label':
    case 'indent-if-break':
    case 'line-suffix':
      return walk(doc.contents)

    case 'fill':
      return doc.parts.map(walk)

    case 'if-break':
      // The flat branch is what prints when the enclosing group does not break.
      return walk(doc.flatContents == null ? '' : doc.flatContents)

    case 'line':
      // A hard or literal line is a mandatory newline (e.g. forced by a
      // comment) — collapsing past it would change meaning, so bail.
      if (doc.hard || doc.literal) throw BAIL
      return doc.soft ? '' : ' '

    case 'break-parent':
      // Present when a line comment forces a break; single-lining is unsafe.
      throw BAIL

    case 'line-suffix-boundary':
    case 'trim':
      return ''

    default:
      // Unknown / pass-through commands (e.g. `cursor`) are kept verbatim.
      return doc
  }
}

module.exports = function flattenDoc(doc) {
  try {
    return walk(doc)
  } catch (error) {
    if (error === BAIL) return null
    throw error
  }
}
