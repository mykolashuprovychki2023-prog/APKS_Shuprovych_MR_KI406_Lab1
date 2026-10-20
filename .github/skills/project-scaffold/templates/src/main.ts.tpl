import { greet } from './greeting.ts';

/** Entry point of the cross-platform hello executable. */
function main(): void {
  console.log(greet());
  console.log(`Platform: ${process.platform}/${process.arch}, Node.js ${process.version}`);
}

main();
