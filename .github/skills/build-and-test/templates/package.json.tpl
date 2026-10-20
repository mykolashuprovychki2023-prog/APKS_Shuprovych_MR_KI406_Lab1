{
  "name": "{{PROJECT_NAME}}",
  "version": "1.0.0",
  "description": "Cross-platform Hello World in TypeScript (APKS lab 1, variant 6)",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=22.18"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "bundle": "esbuild src/main.ts --bundle --platform=node --format=cjs --target=node22 --outfile=build/hello.cjs --log-level=warning",
    "build": "npm run typecheck && npm run bundle",
    "start": "node build/hello.cjs",
    "test": "vitest run",
    "package": "node scripts/build-sea.mjs",
    "ci": "npm run build && npm test && npm run package"
  },
  "devDependencies": {
    "@types/node": "24.19.2",
    "esbuild": "0.28.2",
    "postject": "1.0.0-alpha.6",
    "typescript": "7.0.2",
    "vitest": "5.0.5",
    "yaml": "2.9.1"
  }
}
