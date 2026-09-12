# Stocklana Hackathon Specification & Internal Release Standard

## PART A — OFFICIAL STOCKLANA REQUIREMENTS (Verified Facts Only)

* **Hackathon Name:** Stocklana
* **Host / Organizer:** Solana Foundation
* **Official URL:** `https://hackathons.solana.com/hackathons/stocklana`
* **Official Timeline:**
  * **Live:** Friday 11 September, 12:00 UTC
  * **Submissions Close:** Friday 18 September, 4:00pm ET (20:00 UTC)
  * **Judging:** Through 2 October. Winners announced on the hackathon page.
* **Prize Pool:** $100,000 USD (awarded by Solana Foundation, Main Track).
* **Official Theme & Scope:**
  * *"Tokenized stocks are already trading on Solana. Build the products that make owning and using them better than the brokerage app people have today."*
  * Directions highlighted: Trading and markets, Investing and portfolios, Credit and yield, Data and infrastructure, Consumer.
  * Recommendation: *"Pick one wedge and make it excellent. A narrow product that works end to end beats a broad one that only demos."*
* **Official Judging Criteria (As Written on Official Site):**
  * Core Question: *"Could this be a real app that people will actually use?"*
  * **A real use case:** A clear user and a problem they have today.
  * **It works:** A working demo beats a slide deck. Show the happy path end to end.
  * **Solana-native:** It should make sense on Solana specifically, not just be ported there.
  * **Execution:** Quality of the product, code, and design over the week.
* **Official Submission Form Requirements:**
  * Project name.
  * At least one link judges can open: GitHub repo, live demo, pitch video, or technical video (full URLs starting with https://).
  * Team members registered via the submit form.
* **Official Eligibility:**
  * Open to individuals and teams. One submission per team.
  * Original work required (open-source dependencies allowed if disclosed).

---

## PART B — JUSTFAIR INTERNAL RELEASE STANDARD (Strict Internal Engineering Bar)

*The items below are NOT mandated rules of Stocklana, but our own internal completion standards to ensure a flawless, competitive submission.*

1. **Public Open-Source Repository:** Clean Git commit history, zero secrets, complete reproducible setup guide.
2. **Production Deployment:** Fast, publicly accessible web application with zero console crashes and mobile-responsive layout.
3. **High-Definition Demo Video (<3 Minutes):** Clear audio, showing the end-to-end happy path in the first 30 seconds without slides or filler.
4. **Real Mainnet Data Verification:** 100% real Solana Token-2022 stock mints and live Jupiter routing. No mocked trade data dressed as real execution.
5. **Zero-Custody / Zero-Fund Movement Safety Guarantee:** Strictly non-custodial preflight verification; never requests private keys or broadcasts unauthorized trades.
6. **Security & Repository Audit:** Automated lint, typecheck, dependency audit, and automated test suite passing with 0 failures prior to final submission.
7. **Comprehensive Human UAT:** Manual testing on desktop and mobile browsers across multiple tokenized stock assets.
