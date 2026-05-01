---
name: bump-project-version
description: Bumps the project version based on the user's request.
---

## Bump Project Version

### Determining the version

The user can provide version in one of three ways:

1. **Explicit version** (e.g. `1.2.3`) - use this version directly
2. **Semver bump type** (`major`, `minor`, `patch`) - calculate new version based on the latest release
3. **No version provided** - use the latest release version from GitHub

To get the latest release, use GitHub CLI:

```bash
gh release view --json tagName --jq .tagName
```

This returns the latest release tag (e.g., `v1.2.3`).

### Calculating version from semver bump type

If user provides a bump type, calculate the new version from the latest release:

| Current Version | Bump Type | New Version |
| --------------- | --------- | ----------- |
| 1.2.3           | major     | 2.0.0       |
| 1.2.3           | minor     | 1.3.0       |
| 1.2.3           | patch     | 1.2.4       |

### Updating version in project files

Update the version in the following files:

- `package.json` - update the `version` field
- `README.md` - update version badge or version references if present

### Creating changelog

If there is no changelog in `docs/versions/v{version}/changelog.md` file, create it based on user-facing changes introduced in this version.

Focus on changes that affect the user experience, such as:

- New features and functionality
- Improvements to existing features
- Bug fixes that impact user workflow
- UI/UX changes
- Performance improvements noticeable to users
- Changes to user settings or preferences

Avoid technical details, implementation specifics, or internal refactoring that doesn't affect the user experience.

Then, create the changelog file in the `docs/versions/v{version}/changelog.md` file in english:

```markdown
# Language Learning Buddy v{version}

## What's New

## Fixed

## Changed
```
