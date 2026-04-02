# Welcome to the decibri Contribution Guide

Thank you for investing your time in contributing to our project! We welcome all sorts of different contributions.

Before making any type of contribution, please read our [Code of Conduct](https://github.com/analyticsinmotion/decibri/blob/main/CODE_OF_CONDUCT.md) to keep our community approachable and respectable.

In this guide you will get an overview of the contribution workflow from opening an issue and creating a Pull Request (PR).


## New contributor resources

To get a good overview of the project, please first read the [README](https://github.com/analyticsinmotion/decibri/blob/main/README.md) document. In addition, here are some great general resources to help you get started with open-source contributions:

- [Finding ways to contribute to open source on GitHub](https://docs.github.com/en/get-started/exploring-projects-on-github/finding-ways-to-contribute-to-open-source-on-github)
- [Collaborating with pull requests](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests)


## Ways to contribute

There are multiple ways in which you can contribute to this project including:

- Reporting a bug
- Submitting a fix
- Suggesting new features or improvements
- Adding or updating documentation
- Adding or improving integration guides
- Improving test coverage
- Anything else we may have forgotten


## Getting started

### Prerequisites

decibri is a native Node.js addon that wraps PortAudio. To build from source you will need:

- Node.js 18 or later
- Python 3.x (required by node-gyp)
- A C/C++ compiler:
  - **Windows**: Visual Studio Build Tools (installed automatically with most Node.js installers)
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Linux**: `build-essential` and `libasound2-dev` (`sudo apt-get install build-essential libasound2-dev`)

### Setting up the development environment

1. Fork this repository to your own account and clone it to your local machine:
   ```bash
   git clone --recurse-submodules https://github.com/YOUR_USERNAME/decibri.git
   cd decibri
   ```
   The `--recurse-submodules` flag is important. PortAudio is included as a git submodule under `deps/portaudio` and is required for the build.

2. Install dependencies and build the native addon:
   ```bash
   npm install
   ```
   This will compile PortAudio and the C++ addon from source via node-gyp.

3. Run the tests:
   ```bash
   npm test
   node test/float32.js
   ```
   These are static tests that verify the module loads and the API surface is correct. They do not require a microphone.

4. (Optional) Run the live capture and VAD tests if you have a microphone connected:
   ```bash
   node test/basic.js --live
   node test/vad.js
   ```

### Architecture overview

The project has three layers:

- **C++ native addon** (`src/decibri.cc`): Wraps PortAudio via N-API. Handles audio capture in a separate thread and marshals data to JavaScript via ThreadSafeFunction.
- **JavaScript wrapper** (`index.js`): Extends Node.js Readable stream. Adds device selection, VAD, and format handling.
- **Type definitions** (`types/index.d.ts`): TypeScript declarations with full event overloads and JSDoc annotations.

The `binding.gyp` file configures platform-specific build settings (WASAPI on Windows, CoreAudio on macOS, ALSA on Linux).

### Reporting a bug

We use GitHub Issues to raise, track, and manage bugs. All open, pending, and closed cases can be found at [decibri Issue Tracking](https://github.com/analyticsinmotion/decibri/issues).

Should you identify a bug, please search if the issue already exists in [GitHub Issues](https://github.com/analyticsinmotion/decibri/issues). You may be able to add more information or your own experience to an existing issue.

If a related issue doesn't exist, you can open a new issue using the [issues form](https://github.com/analyticsinmotion/decibri/issues/new).

To assist in fixing any issues raised more rapidly, please ensure that bug reports include the following (where applicable):

- A quick summary and/or background
- Your operating system and architecture (e.g. Windows 11 x64, macOS arm64, Ubuntu 22.04 x64)
- Node.js version (`node --version`)
- Any steps helpful to reproduce the bug
- Code or sample codes that were used
- What you expected to happen vs. what happened
- Exact error messages received (you can upload de-identified screenshots as well)

### Proposing codebase changes

We welcome contributions to the codebase from everyone who is interested in making the project better. If you want to propose a change, please follow these steps:

1. Fork this repository to your own account and clone it to your local machine with `--recurse-submodules`.
2. Create a new branch from the `main` branch for your changes. Give the branch a descriptive name that reflects the changes you plan to make.
3. Make your changes to the codebase in your local repository.
4. Test your changes thoroughly. At a minimum, run `npm test` and `node test/float32.js`.
5. Commit your changes to your local branch with a clear and descriptive commit message.
6. Push your branch to your forked repository.
7. Open a pull request (PR) against the original repository's `main` branch. Include a description of your changes, highlighting the reasons for the changes and the benefits they provide.

Our team will review your PR and provide feedback as soon as possible. We may ask you to make additional changes, so please be prepared to iterate on your changes until they are ready to be merged.

### Important notes for native code changes

- Changes to `src/decibri.cc`, `binding.gyp`, or `deps/` require recompilation. Run `npm install` after making changes to rebuild the addon.
- Prebuilt binaries are generated by the CI pipeline on release tags. You do not need to produce prebuilt binaries for a PR.
- If your change affects the public API surface, please update `types/index.d.ts` to match.

We appreciate your contributions to the project and thank you for your time in submitting a pull request.


## License

By contributing to this repository, you agree to license your contributions under the [Apache License 2.0](https://github.com/analyticsinmotion/decibri/blob/main/LICENSE).

Any contributed code or content must be your original work, and you warrant that you have the right to license it under the terms of the Apache License 2.0.

By contributing, you also acknowledge that your contribution will be included in the project under the same license as the rest of the repository.
