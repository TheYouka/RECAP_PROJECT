# Recent-content filtering for “Recien añadidas”

The change exposes each content record’s existing `created_at` value through the `ContentRead` response and uses that field in `PlaylistView` to populate the `recien-añadidas` playlist. The frontend computes a seven-day UTC cutoff, excludes records at or before the cutoff and records dated in the future, and renders qualifying records through the existing `ContentCard`. `Navbar`, `Sidebar`, the existing playlist links, and the basic rendering of the other playlist slugs remain intact; an empty result has an explicit message. **Watch for:** **confirmed** the plan records that the focused backend tests and manual browser route check could not run because of missing test/runtime dependencies and servers; the router spot-check plus successful frontend lint/build provide code-level evidence, but not a live HTTP/browser smoke test.

**Verdict**: APPROVED

## High-level view

The API change is additive: the existing content response shape keeps its prior fields and now includes `created_at`, sourced from `Content.created_at` for list, create, detail, and patch responses. The router’s list endpoint still maps every record through the same response converter, so the frontend can consume the field without a new endpoint or query contract.

`PlaylistView` gates the new fetch and date filter exclusively on the `recien-añadidas` slug. Timestamps with an explicit offset are converted to epoch time normally, while offset-less values are explicitly treated as UTC; records must be strictly newer than the seven-day cutoff and no later than the current time. The matching records are rendered with the existing `ContentCard`, with loading, error, and empty-result states inside the content container.

The other playlist slugs retain their previous Navbar, Sidebar, and slug-heading behavior because they bypass the new fetch path. Frontend lint/build and a direct backend converter check passed; **confirmed** runtime HTTP and browser smoke checks remain unavailable in the recorded environment.

<details>
<summary>Issues (1)</summary>

1. **Unavailable live route verification** — **confirmed**: the recorded manual check did not start the API or frontend, and the HTTP fallback could not run because `httpx2` is missing. Run the route smoke test when those services/dependencies are available to validate the browser-visible behavior.

</details>

<details>
<summary>Details</summary>

### Additive `GET /content` contract

`ContentRead` now carries `created_at` and `_to_read()` sources it from the content record itself. The inspected router applies `_to_read()` to `GET /content/`, so the list response exposes the field while retaining the existing fields and filtering query parameters; the same additive response field also applies to create, detail, and patch responses. The direct model/converter check passed, while the recorded HTTP check could not execute because the installed TestClient dependency set lacks `httpx2`.

### UTC cutoff for `recien-añadidas`

The recent playlist uses `Date.now()` as the UTC epoch reference and accepts only timestamps satisfying `createdAt > now - 7 days` and `createdAt <= now`. That makes the lower boundary strictly less than seven days old and excludes future-dated records. Explicit offsets are honored by `Date`; timestamps without an offset receive an explicit `Z`, avoiding browser-local interpretation and keeping the comparison in UTC.

### Scoped playlist behavior and existing presentation

The effect exits before fetching unless the slug is exactly `recien-añadidas`, so `watchlater`, `vistos`, and `viendo` are not accidentally filtered. The new branch keeps `Navbar` and `Sidebar`, places each qualifying result in the existing `content-container`, and renders the existing `ContentCard` with the API item. When the filtered collection is empty after loading, the view displays `No hay contenido añadido recientemente.` rather than an empty panel. The diff adds no CSS redesign and does not alter `App.jsx`, the playlist links, or `contentCard.jsx`.

### Verification coverage

The plan records successful `npm run lint` and `npm run build`, with only pre-existing Library warnings, plus a passing direct `_to_read()` check. It also records that both pytest commands were unavailable because the environment has no pytest, the TestClient fallback was blocked by missing `httpx2`, and the four live route checks were not run because no API/frontend servers were started. **confirmed** This is a coverage gap, but the available code inspection verifies the endpoint wiring and slug gate, and no blocking implementation concern remains in the diff. The reviewed working tree shows no commit was created.

</details>

<details>
<summary>Changed files</summary>

- `app/routers/content.py` — adds `created_at` to content response serialization.
- `frontend/src/pages/PlaylistView.jsx` — filters and renders content newer than seven days for `recien-añadidas`, with loading/error/empty states.
- `tests/test_content.py` — adds regression coverage for serialized `created_at` on content creation and listing.

Full diff: `git diff main` from the repository root.

</details>
