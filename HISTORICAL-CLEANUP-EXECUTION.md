# Historical Cleanup Execution Summary

**Date:** 2026-04-16
**Purpose:** Align decibri.cpp repository with its historical/archived status after transfer from `analyticsinmotion/decibri` to `decibri/decibri.cpp`.

---

## Files Deleted (7)

| File | Reason |
|------|--------|
| `CONTRIBUTING.md` | Historical repo, not accepting contributions |
| `CODE_OF_CONDUCT.md` | Historical repo, contained AIM email |
| `AGENTS.md` | Historical repo, no active development |
| `.github/workflows/check-portaudio-upstream.yml` | Scheduled bot creating issues on frozen repo |
| `.github/workflows/test.yml` | CI for PRs that won't be reviewed |
| `.github/workflows/prebuild.yml` | Release pipeline, no releases planned |
| `.github/dependabot.yml` | Dependency updates on frozen repo |

## Files Modified (7)

| File | Changes |
|------|---------|
| `package.json` | Added `"private": true`; updated repository URL to `decibri/decibri.cpp` |
| `README.md` | Removed all badge tables (Meta, Binaries, Integrations); updated clone URL to `decibri/decibri.cpp` |
| `LICENSE` | Changed copyright holder from "Analytics in Motion" to "Decibri" |
| `SECURITY.md` | Full rewrite — redirects security reports to `decibri/decibri` (Rust v3) |
| `CHANGELOG.md` | Added `[Unreleased] — Repository Archived` entry with transfer and freeze details |
| `docs/llms.txt` | Updated repository URLs to `decibri/decibri.cpp`; updated author URL to `decibri.com` |
| `docs/docs/nav.js` | Updated sidebar GitHub link to `decibri/decibri.cpp` |

## Files NOT Modified (by design)

| File | Reason |
|------|--------|
| `ATTRIBUTION.md` | Explicitly excluded from cleanup |
| `README.md` line 321 (copyright) | Link already pointed to correct URL |
| `CHANGELOG.md` existing entries | Historical record preserved |
| `docs/*.html` | Built artifacts, low priority |

## Remaining Manual Actions

- [ ] Close stale Dependabot PRs on GitHub
- [ ] Delete 6 remote Dependabot branches via GitHub UI
- [ ] Close PortAudio upstream issue #31 (created by now-deleted workflow)
- [ ] Consider archiving the repository via GitHub Settings
- [ ] Consider disabling Issues, Discussions, Wikis via GitHub Settings
- [ ] Revoke `NPM_TOKEN` repository secret (no longer needed)
