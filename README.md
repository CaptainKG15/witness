# Witness

An on-chain evidence notary built on GenLayer.

Disputes often depend on what a web page said at a certain moment. Pages change and disappear. Witness lets anyone submit a public URL and a short claim. GenLayer validators each fetch the page, read it under strict rules, and must agree on a small structured reading. The agreed reading is stored on-chain. Anyone can later re-check the page and the contract records whether it is `unchanged`, `changed` or `unreadable`.

Other contracts and apps can read Witness records, so it works as a reusable building block as well as a standalone tool.

## What it does and does not do
- It notarizes the validators' **agreed reading** of a page at a point in time.
- It does **not** store raw page bytes, and it is not proof of a page's full content.
- The time of each check is the time of the transaction that recorded it, visible in the explorer.

## How consensus is used
Each validator runs the same function: fetch the page, ask an LLM, and reduce the answer to one canonical string:

`claim_supported | page_kind | injection_suspected`

| Field | Values | Why it is compared exactly |
|-------|--------|----------------------------|
| claim_supported | yes, no, unclear | The answer the user cares about. A small enum, so validators compare a decision, not wording. |
| page_kind | article, docs, price_page, other | Fixed vocabulary, so format noise cannot cause disagreement. |
| injection_suspected | true, false | Combines the model's flag with a deterministic pattern check that every validator runs identically. |

Consensus is `gl.eq_principle.strict_eq` on that canonical string. The model's free text is never stored or compared. If the output does not parse into the schema, the reading is `unreadable` and `notarize` stores nothing.

## Prompt-injection handling
- The page text is passed inside delimiters and labelled untrusted data.
- The prompt tells the model never to follow instructions found in the page.
- A deterministic pattern check runs on the page text. If the page looks like it is trying to steer the reader, `injection_suspected` is true and `claim_supported` is forced to `unclear`.
- Known limit: a page that legitimately discusses prompt injection can trip the check. It fails safe, to `unclear`.

## Contract interface
Writes:
- `notarize(url: str, claim: str) -> u256` stores a new record and returns its id.
- `recheck(record_id: u256) -> str` re-reads the page and returns `unchanged`, `changed` or `unreadable`.

Views:
- `get_record(record_id)`, `get_status(record_id)`, `count()`, `list_records(start, limit)`

Limits: URL must be https and at most 300 characters. Claim is 1 to 280 characters. Each record can be re-checked up to 25 times.

## Honest limitations
- Validators fetch the page at slightly different moments. Pages with dynamic content can produce disagreement or `changed` results without a real change.
- LLM readings can differ between models. The schema is small on purpose to reduce this, but it cannot remove it.
- The injection check is a tripwire, not a guarantee.

## The app
`app/index.html` is a single-file web app that calls the contract through `genlayer-js`. It can notarize a page, show the transaction stages, look up a record, list recent records, and re-check a record. It works on GenLayer Studio (throwaway in-browser account) and Bradbury (browser wallet). Open it with a contract address in the page or via `?network=bradbury&address=0x...`. It renders on-chain text with `textContent` only, never as HTML.

## Tests
- `tests/test_logic.py`: off-chain tests of the pure logic (schema parsing, injection tripwire, input validation, prompt shape). Run with `python3 tests/test_logic.py`. It uses a small local stand-in for the `genlayer` module.
- `tests/frontend_helpers.test.js`: tests the app's helper functions. Run with `node tests/frontend_helpers.test.js`.
- `tests/hostile_pages/` and `STUDIO_TEST.md`: hostile and control pages with expected outcomes, run in GenLayer Studio against real validators. Results so far, including what has not been run, are in `tests/attacks/RESULTS.md`.

## Deployment
Studio (sandbox):
- Contract address: `0xd35cfD7E2b3d94B86b76d1908bB9A4Cd4e0423a8`
- Explorer: https://explorer-studio.genlayer.com/contracts/0xd35cfD7E2b3d94B86b76d1908bB9A4Cd4e0423a8

Bradbury (testnet):
- Contract address: (fill in after deploying)
- Deploy transaction: (fill in)
- Explorer: https://explorer-bradbury.genlayer.com/address/(address)

Live app: https://captainkg15.github.io/witness/app/

`app/deploy.html` deploys `contracts/witness.py` to Bradbury from the browser with a wallet. It shows the SHA-256 of the source it deploys, so the deployed code can be compared with the file in this repo (for example with `genlayer code <address>` and hashing the output).
