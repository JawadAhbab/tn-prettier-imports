'use strict'

/**
 * Decide whether a statement should be forced onto a single line.
 *
 * We collapse the module's "wiring" statements — the ones whose multi-line form
 * is pure noise — and nothing else:
 *
 *   - `import ... from '...'`            every form (named, default, namespace,
 *                                         `import type`, side-effect)
 *   - `export { ... }`                   local named exports
 *   - `export { ... } from '...'`        re-exports
 *   - `export * from '...'`              namespace re-exports
 *
 * An `export` that carries a declaration (`export const`, `export function`,
 * `export class`, ...) is left untouched — its body legitimately spans lines.
 * `export default ...` is an `ExportDefaultDeclaration`, so it never matches.
 *
 * @param {{ type?: string, declaration?: unknown } | null | undefined} node
 * @returns {boolean}
 */
module.exports = function isCollapsible(node) {
  if (!node || typeof node.type !== 'string') return false

  switch (node.type) {
    case 'ImportDeclaration':
    case 'ExportAllDeclaration':
      return true

    case 'ExportNamedDeclaration':
      // Only specifier lists (`export { ... }` / `export { ... } from`),
      // never `export const/function/class/...`.
      return node.declaration == null

    default:
      return false
  }
}
