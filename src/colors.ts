export function bold(str: string) {
  return `\x1b[1m${str}\x1b[0m`;
}

export function green(str: string) {
  return `\x1b[32m${str}\x1b[0m`;
}

export function red(str: string) {
  return `\x1b[31m${str}\x1b[0m`;
}

export function dim(str: string) {
  return `\x1b[2m${str}\x1b[0m`;
}

export function code(str: string) {
  return `\x1b[33m${str}\x1b[0m`;
}
