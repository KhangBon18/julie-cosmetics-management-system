# Migration Notes

- `server/scripts/runMigrations.js` applies only files matching `^\d+_.*\.sql$` and tracks the full filename in `schema_migrations`.
- The duplicate `015_*` files are legacy immutable migrations. They are tracked by full filename, so the runner can distinguish them even though the numeric prefix is duplicated.
- `hotfix_p0.sql` is a historical manual hotfix and is intentionally not runner-managed. Its changes have been folded into numbered migrations/schema state. Do not apply it directly to a current database unless you first verify the target schema, because it can conflict with existing columns/triggers.
- New changes should use the next unused numeric prefix and be idempotent.
