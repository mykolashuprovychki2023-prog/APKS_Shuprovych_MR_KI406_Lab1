/** Builds the greeting line printed by the hello executable. */
export function greet(name = 'World'): string {
  return `Hello, ${name}!`;
}
