# AGENTS.md

Conventions, architecture, and boundaries for AI coding agents working on this repository.

---

## Project overview

`decibri` is a Node.js native addon that captures raw PCM audio
from the microphone and exposes it as a `Readable` stream. PortAudio is compiled
statically into the addon — no system audio library is required at runtime on Windows
or macOS.

---

## Commands

```bash
# Build the native addon from source
npm run build

# Run static tests (no microphone required)
node test/basic.js

# Run live capture test (microphone required)
node test/basic.js --live

# Test prebuilt binary loading — run after toolchain, loader, or binding.gyp changes
# (Not needed for every release — skip for doc/type/JS-only changes)
mkdir -p prebuilds/win32-x64
cp build/Release/decibri.node prebuilds/win32-x64/node.napi.node
mv build build_backup
node test/basic.js
mv build_backup build
rm -r prebuilds
```

---

## Architecture

```text
index.js              Node.js Readable stream wrapper (JS layer)
src/decibri.cc        Native addon — NAPI ObjectWrap around PortAudio
src/mac_permission.mm macOS-only Objective-C++ microphone permission check
types/index.d.ts      Hand-maintained TypeScript declarations
binding.gyp           Build configuration for node-gyp
deps/portaudio/       PortAudio source (git submodule — do not edit)
```

Two-layer design:

- `src/decibri.cc` exposes `NativeDecibri` via NAPI — handles PortAudio lifecycle,
  audio thread callback, and ThreadSafeFunction delivery to JS.
- `index.js` wraps `NativeDecibri` in a Node.js `Readable` stream — handles
  backpressure, stream events, and the public API.

TypeScript declarations in `types/index.d.ts` are hand-maintained and must be kept in
sync with `index.js` and the native options parser in `decibri.cc`. They are not
generated.

---

## Platform-specific code

| Platform | Audio API  | Guard macro        | Extra files                        |
|----------|------------|--------------------|------------------------------------|
| Windows  | WASAPI     | `PA_USE_WASAPI`    | none                               |
| macOS    | CoreAudio  | `PA_USE_COREAUDIO` | `src/mac_permission.mm` (ObjC++)   |
| Linux    | ALSA       | `PA_USE_ALSA`      | none                               |

`src/mac_permission.mm` is Objective-C++ and is only compiled on macOS (listed in
`binding.gyp` under the `OS=='mac'` condition). It is `extern "C"` linked — the
declaration in `decibri.cc` is guarded by `#ifdef PA_USE_COREAUDIO`.

---

## Critical constraints

### Audio thread hot path

`AudioCallback` in `decibri.cc` runs on the PortAudio audio thread. Keep it fast:

- No heap allocations beyond the single `new std::vector<uint8_t>` per chunk.
- No blocking calls.
- No JS calls — data is delivered to the JS thread via `ThreadSafeFunction`.

### NAPI version

`NAPI_VERSION` is locked at `6` in `binding.gyp` and `package.json`. Do not change
this. It targets Node.js 18 LTS and provides broad runtime compatibility.

### PortAudio submodule

`deps/portaudio/` is a git submodule. Do not modify files inside it. Build
configuration (which source files to compile) lives in `binding.gyp`.

### Binary distribution coupling

`package.json` (`dependencies.node-gyp-build`, `files` array) and
`.github/workflows/prebuild.yml` are tightly coupled. If you change one, the other
must stay consistent.

The `install` script (`node-gyp-build || node-gyp rebuild`) and the CI "Stage
prebuild artifact" step must agree on the binary path convention:
`prebuilds/{platform}-{arch}/node.napi.node`.

`prebuilds/` is in `.gitignore` — CI populates it transiently before `npm publish`.
It enters the npm tarball because `files` includes it; npm respects `files` over
`.gitignore` at publish time.

`NPM_TOKEN` must be set as a repository secret for the publish job to succeed.

---

## Boundaries

Do not do any of the following without explicit human instruction:

- **Modify `deps/portaudio/`** — it is a git submodule. Changes will be lost and may
  corrupt the submodule state.
- **Change `NAPI_VERSION`** — breaks ABI compatibility with all existing prebuilds and
  requires a full binary rebuild across all platforms.
- **Change binary naming or directory structure** — `package.json` (`files`, install
  script), `binding.gyp`, and `.github/workflows/prebuild.yml` (Stage prebuild artifact
  step) must all agree on `prebuilds/{platform}-{arch}/node.napi.node`. Changing one
  without the others breaks installs for all users.
- **Bump the package version in `package.json`** — version bumps are release decisions,
  not implementation decisions. Update `CHANGELOG.md` under `[Unreleased]` and leave
  the version for the maintainer to set.
- **Push or tag directly to `main`** — see Git Workflow below.
- **Modify `.github/workflows/prebuild.yml`** in isolation — CI changes must be
  validated against the binary naming convention and `package.json` install script.

---

## Conventions

- **Options parsing** in `decibri.cc` follows the pattern: check presence, check
  type, validate range, throw typed error. Match this pattern for any new options.

- **New constructor options** must be added in four places: the native options parser
  (`decibri.cc`), the JS constructor (`index.js`), the TypeScript interface
  (`types/index.d.ts`), and the JSDoc in `index.js`.

- **Error messages** are user-facing. Use clear, actionable language. Include the fix,
  not just the symptom. See the macOS permission error message as the model:
  `"Microphone access denied. Enable access in System Settings → Privacy & Security → Microphone."`

- **Platform-specific code** belongs in a dedicated file (e.g. `mac_permission.mm`),
  not in `decibri.cc` behind runtime checks.

---

## Changelog

Update `CHANGELOG.md` in [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.

Sections: `Added`, `Changed`, `Fixed`, `Deprecated`, `Security`.

Add entries under `[Unreleased]` — do not create a new version heading. Leave version
bumps to the maintainer. Commit changelog updates as `docs(changelog): add entries for upcoming release`.

---

## Git Workflow

- `main` branch is what is published to npm. Keep it release-ready.
- Develop on feature branches, merge to `main` for releases.
- Commit message format: `type(scope): description`
  (e.g. `feat(audio): add float32 output format`, `fix(macos): emit error on permission denied`).
- Tag releases as `vX.Y.Z`. Creating a GitHub release triggers the CI prebuild workflow.

---

## Attribution

This repository participates in the AI Attribution Protocol. See `ATTRIBUTION.md` for
reciprocity guidelines.
