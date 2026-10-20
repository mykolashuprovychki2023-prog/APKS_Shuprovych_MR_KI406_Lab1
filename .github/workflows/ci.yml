# CI for the hello project (APKS lab 1, variant 6).
# All build logic lives in ci.sh / ci.bat: the workflow only checks out the code,
# prepares a pinned Node.js version, calls the script and keeps the results
# (executables + JUnit report).
name: CI

on:
  push:
    branches: [develop, master]
  pull_request:
    branches: [develop, master]
  workflow_dispatch:

permissions:
  contents: read

jobs:
  build-and-test:
    name: build-and-test (${{ matrix.os }})
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    steps:
      - name: Checkout
        uses: actions/checkout@v7

      - name: Set up Node.js 24.20.0
        uses: actions/setup-node@v7
        with:
          node-version: 24.20.0

      - name: Build and test (ci.sh)
        if: runner.os != 'Windows'
        shell: bash
        run: bash ./ci.sh

      - name: Build and test (ci.bat)
        if: runner.os == 'Windows'
        shell: cmd
        run: .\ci.bat

      - name: Upload hello executable and test report
        if: always()
        uses: actions/upload-artifact@v7
        with:
          name: hello-${{ runner.os }}
          path: |
            build/hello
            build/hello.exe
            build/test-results/junit.xml
          if-no-files-found: warn
          retention-days: 90
