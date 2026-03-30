# Security

Analytics in Motion takes the security of decibri seriously. As a native Node.js addon with compiled binaries, we are especially attentive to supply chain and binary integrity concerns. If you believe you have found a security vulnerability in this repository, please report it to us as described below.

## Responsible Disclosure

We are strongly committed to the responsible disclosure of security vulnerabilities. Please follow these guidelines when reporting security issues:

- Please send an email to [pi@analyticsinmotion.com](mailto:pi@analyticsinmotion.com) and include the words "SECURITY - decibri package" in the subject line.
- Alternatively, you can use [GitHub's private vulnerability reporting](https://github.com/analyticsinmotion/decibri/security/advisories/new) to report directly through GitHub.
- Provide details of the potential vulnerability, including information such as:
  - a description of the vulnerability and how it can be exploited;
  - the affected version of the package;
  - the platform and architecture (e.g., Windows x64, macOS arm64);
  - steps to reproduce the issue;
  - any other relevant information that could help us fix the vulnerability.
- Please do not report security vulnerabilities through public GitHub issues.

## Supply Chain and Binary Integrity

Decibri ships prebuilt native binaries for multiple platforms. To protect the integrity of these binaries:

- All binaries are compiled exclusively in GitHub Actions CI — no binaries are built or uploaded manually
- Builds are triggered only by tagged releases from the main branch
- The CI workflow verifies all four platform binaries are present before publishing to npm
- Publishing to npm is handled by CI using a scoped, time-limited access token
- Source code for the native addon and the full build configuration are open source and auditable

## Supported Versions

This security policy applies to the following versions of the package:

| Package Version | Supported                  |
|:---------------:|:--------------------------:|
| < 1.0           | :x: No longer supported    |
| Latest 1.x.x    | :white_check_mark:         |

Security fixes are applied to the latest release only.

## CVE Policy

For confirmed vulnerabilities, we will request a CVE identifier where appropriate and publish a GitHub Security Advisory with details of the issue, affected versions, and remediation steps.

## Security Best Practices for Users

Follow these best practices when using this package:

- Keep your dependencies up to date regularly
- Only install packages from trustworthy sources
- Enable two-factor authentication (2FA) on your npm account
- Verify that prebuilt binaries are resolved from the official npm registry
- Use `npm audit` regularly to check for known vulnerabilities in your dependency tree
- Follow the principle of least privilege when granting microphone access in your application

## Acknowledgments

Thank you! Your help in keeping our users secure is appreciated.

## Contact

If you have any security questions, please contact [pi@analyticsinmotion.com](mailto:pi@analyticsinmotion.com).
