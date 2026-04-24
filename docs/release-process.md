# Release Process

This repository ships from `main` through reviewed pull requests. The process below keeps releases incremental and contributor-friendly.

## Workflow

1. Create a focused branch from `main`.
2. Implement one bounded issue or a tightly-coupled batch.
3. Run the relevant checks for the touched surfaces.
4. Open a pull request with testing notes and rollout notes.
5. Merge only when the branch is green and reviewer feedback is resolved.

## Release Notes

Every pull request should call out:

- affected packages
- new or changed environment variables
- operational steps such as seeds, migrations, or infrastructure changes
- user-facing behavior changes

## Versioning

- Use conventional, human-readable commit messages for contributor clarity.
- Aggregate release notes by milestone or deployment window.
- Treat incompatible environment or deployment changes as release blockers until documented.

## Production Safety Checks

- No direct secret values in source control.
- No undocumented config changes.
- No silent changes to public API shapes or shared contracts.
- No unreviewed changes to payment or authentication flows.
