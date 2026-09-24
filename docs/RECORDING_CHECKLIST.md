# JustFair Recording Checklist (Owner)

Prepare BEFORE pressing record. Work in a clean directory outside the repo.

For the final blind owner UAT, use `C:\Users\HomePC\Desktop\JustFair-Final-UAT`
and start its sample app with `node stock-app.mjs`. Then follow the normal
public JustFair directions without using director notes or expected-result
coaching.

## Terminals (three, labeled, no other tabs visible)

- [ ] Terminal A: stock app running in WRONG state (reports gross 1000).
- [ ] Terminal B: `justfair-adapter.mjs` running on :3100, wired to the app.
- [ ] Terminal C: empty, prompt ready in the same directory.

## Browser

- [ ] Fresh profile / incognito window (no stale tabs, no bookmarks bar clutter).
- [ ] Homepage loaded for the opening + closing shots.
- [ ] Replay Lab will open itself via `--open`; do not pre-open report tabs.
- [ ] DBC page (`#dbc`) prefilled with the real config + YOUR POLICY 8.
- [ ] Zoom 100%, viewport ≥ 1280px wide.

## Commands (exact, rehearsed once off-camera)

- [ ] `npm view justfair@latest version` returns `1.0.6`; owner publication is
      complete before recording begins.
- [ ] `npx justfair@latest test --target http://localhost:3100 --tessera-mint T-OpenAI --tessera-amount 1000 --scenario TESSERA_TRANSFER_FEE_ACCOUNTING --open`
- [ ] One-line app fix + app-only restart rehearsed (know the exact line).
- [ ] Same command rerun → PASS observed in rehearsal.

## On-camera prohibitions

- [ ] No secrets, API keys, mnemonics, or private keys visible anywhere.
- [ ] No npm auth URLs, tokens, or OTP screens.
- [ ] No irrelevant terminals, editors with internal notes, or DIRECTOR.md.
- [ ] No dependency warnings scrolled into frame (run `npm install` before recording).
- [ ] No stale browser tabs from earlier takes.
- [ ] No claims beyond the SUBMISSION.md claim table (especially: no "live"
      for PreStocks lifecycle, no March-2027-observed claim, no FINISHED).

## After recording

- [ ] Verify FAIL Replay and PASS Replay are both legible at 1080p.
- [ ] Verify the PreStocks segment includes the future-event framing sentence.
- [ ] Export < 3 minutes, clear audio, no slides/filler in the first 30s.
