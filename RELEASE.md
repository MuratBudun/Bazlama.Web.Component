# Release Guide

This guide explains how to create a new release of Bazlama Web Component.

## Prerequisites

1. Ensure you have NPM authentication configured
2. Make sure you're on the `main` branch
3. All tests should pass
4. Update CHANGELOG.md with new version changes

## Release Types

### Patch Release (0.0.X)
For bug fixes and small changes:
```bash
npm run release:patch
```

### Minor Release (0.X.0)
For new features that don't break existing functionality:
```bash
npm run release:minor
```

### Major Release (X.0.0)
For breaking changes:
```bash
npm run release:major
```

## Manual Release Process

### 1. Update Version

Edit `libs/core/package.json` and update the version number following [Semantic Versioning](https://semver.org/).

### 2. Update CHANGELOG.md

Add a new section for the version with:
- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security fixes

Example:
```markdown
## [0.0.6] - 2026-01-18

### Added
- New useCustomHook functionality
- Enhanced documentation

### Fixed
- TypeScript type issues
- Build configuration
```

### 3. Commit Changes

```bash
git add .
git commit -m "chore: bump version to 0.0.6"
git push origin main
```

### 4. Create and Push Tag

```bash
git tag v0.0.6
git push origin v0.0.6
```

This will automatically:
- Build the package
- Run tests
- Publish to NPM
- Create a GitHub Release

## Automated Workflow

The GitHub Actions workflow (`publish-npm.yml`) automatically handles:

1. **On Tag Push**: 
   - Detects version from tag (e.g., `v0.0.6`)
   - Builds and tests the package
   - Publishes to NPM
   - Creates GitHub Release with changelog

2. **Manual Trigger**:
   - Go to Actions > Publish to NPM and Create Release
   - Click "Run workflow"
   - Enter version number
   - Workflow creates tag and publishes

## NPM Token Setup

To enable automated publishing:

1. Create NPM token:
   - Log in to [npmjs.com](https://www.npmjs.com/)
   - Go to Access Tokens
   - Generate New Token (Automation)
   - Copy the token

2. Add to GitHub Secrets:
   - Go to Repository Settings > Secrets and variables > Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your NPM token
   - Click "Add secret"

## Version Numbers

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Breaking changes
- **MINOR** (0.X.0): New features, backward compatible
- **PATCH** (0.0.X): Bug fixes, backward compatible

## Pre-release Versions

For beta/alpha releases, use tags like:
- `v1.0.0-alpha.1`
- `v1.0.0-beta.2`
- `v1.0.0-rc.1`

## Rollback

If something goes wrong:

1. Unpublish from NPM (within 72 hours):
```bash
npm unpublish bazlama-web-component@0.0.6
```

2. Delete GitHub Release and Tag:
```bash
git tag -d v0.0.6
git push origin :refs/tags/v0.0.6
```

## Troubleshooting

### Build Fails
- Check all tests pass locally
- Verify TypeScript compilation works
- Ensure all dependencies are up to date

### Publish Fails
- Verify NPM_TOKEN is correctly set
- Check if version already exists on NPM
- Ensure you have publish rights to the package

### Release Not Created
- Check GitHub Actions logs
- Verify GITHUB_TOKEN permissions
- Ensure tag follows v*.*.* format