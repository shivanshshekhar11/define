export const toSafeIdentifier = (name: string): string =>
  name
    .replace(/[^a-zA-Z0-9_$]/g, '_')
    .replace(/^([^a-zA-Z_$])/, '_$1')

export const toKebabCase = (name: string): string =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

export const toCamelCase = (name: string): string => {
  const kebab = toKebabCase(name)

  return kebab.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase())
}
