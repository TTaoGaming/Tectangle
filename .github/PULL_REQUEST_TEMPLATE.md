# Pull Request

## Summary
One concise sentence describing the change.

## Change Type

- [ ] Feature
- [ ] Fix
- [ ] Refactor
- [ ] Docs
- [ ] Golden Update (intentional landmark/event change)

## Verification Checklist

- [ ] Ran `npm run verify`
- [ ] Ran `npm test` (PASS)
- [ ] (If outputs changed) Ran `npm run human:extract` and reviewed diff locally
- [ ] (If intentional change) Ran `npm run goldens:curate-freeze` and committed new frozen snapshot + pointer
- [ ] No unrelated formatting noise / bulk reflow
- [ ] Synced with latest `main` (rebase if first push, else merge)

## Goldens Impact (if any)

Explain why outputs changed and expected user impact. Include brief diff metrics if available.

## Files Changed (high-level)

List the key files or areas touched (avoid exhaustive boilerplate).

## Docs / Core Managers (if applicable)

- [ ] Created workspace snapshot (path below) OR not needed  
      BACKUP-CREATED: archive-stale/archive-YYYY-MM-DDTHHMMSSZ
- [ ] Preserved important originals as `.bak.<timestamp>` (if overwriting)
- [ ] Ran header checks (`npm run check-headers`) and fixed findings
- [ ] Added/updated tests for behavioral changes
- [ ] Provided TLDR + affected managers list

## Additional Notes

Reviewer focus points (threshold changes, config tweaks, risk areas, etc.). If AI assistance used, note tool + local commands.
