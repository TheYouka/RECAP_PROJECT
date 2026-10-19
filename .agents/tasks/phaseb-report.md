# PHASE B report: Playlist and PlaylistItem

Source of truth: `recap_modelo_de_datos.pdf` (4 pages, text extracted with pypdf).

## The two new entities (from the PDF)
Playlist (`playlist`):
- id: int, PK, autoincrement
- name: str, required
- description: str, optional
- created_at: datetime, required

PlaylistItem (`playlist_item`), an N:M bridge between Playlist and Content with order:
- playlist_id: int, PK + FK to Playlist.id
- content_id: int, PK + FK to Content.id
- position: int, required
- added_at: datetime, required

Cardinality and delete rules:
- Playlist 1:N PlaylistItem and Content 1:N PlaylistItem.
- Deleting a Playlist deletes its PlaylistItem rows, not the Content.
- Deleting a Content removes its PlaylistItem rows.

## Files changed
- `app/models.py`:
  - Added `Playlist` and `PlaylistItem` with `__tablename__`, Optional PKs, timezone-aware `default_factory` datetimes and `Relationship(back_populates=...)`.
  - Added `Content.playlist_items`, because the PDF says deleting a Content removes its items. It uses `cascade="all, delete-orphan"` like the other Content relationships. It adds no column.
  - `Playlist.items` uses the same cascade.
- `app/routers/playlists.py` (new), prefix `/playlists`:
  - `POST /`, `GET /`, `GET /{id}`, `PATCH /{id}`, `DELETE /{id}`
  - `POST /{id}/items`, `GET /{id}/items`, `PATCH /{id}/items/{content_id}` (move), `DELETE /{id}/items/{content_id}`
  - Errors: 404 for a missing playlist, content or item, 409 for a duplicate item, 422 for an empty name or position < 1.
  - Positions are kept contiguous from 1: an add with `position` inserts, an add without it appends, and move and remove renumber.
- `app/main.py`: imports and registers the playlists router.
- No frontend, `requirements.txt`, `database.py` or existing-table changes. No tags were created.

## Startup and table creation
`create_db_and_tables()` calls `SQLModel.metadata.create_all(engine)` in the lifespan. `database.py` imports `app.models`, so the new tables are created the same way as the old ones. `create_all` only adds missing tables and no ALTER is needed. No existing column changes are required, so there was no stop or warning.

## Verification
See `verification-note.md`.
- The server started and the new tables were created.
- All endpoints were exercised over real HTTP, including 404, 409 and 422 cases and the Content-delete cascade.
- Counts before and after are the same: album 5, bookmark 4, content 10, content_tag 0, movie 5, tag 0. The new tables have 0 rows.
- pytest: 5 failed, 1 error. `tests/test_content.py` uses an obsolete payload (`content_type`, `year`). I did not run it on the pre-change code.

## PDF vs models.py differences left UNAPPLIED
1. Bookmark (the main one):
   - The PDF says Bookmark has its own `id` PK (autoincrement) and `content_id` as a plain FK (obligatory). The relation is Content 1:N Bookmark ("several bookmarks over time"), and deleting a Content deletes all its bookmarks.
   - Current models.py has `content_id` as PK + FK (1:1), with no `id`.
   - Applying this would change the existing `bookmark` table (a new PK column) and the bookmarks router (`/content/{id}/bookmark` is singular and uses 409 for duplicates).
   - It needs a migration and a behavior decision.
2. Content: no differences. Movie, Album, Tag and ContentTag also match. The PDF names `Album.release_year`, and models.py has it too.
3. The PDF "Pendientes" section says playlists still need their own RF-09 and a decision on whether `plan_to_watch` overlaps with a "watch later" playlist. These are product decisions and nothing was done.

## Ambiguities and decisions
- The PDF does not say how `position` behaves on insert or move. I kept it as a 1..N sequence: no position appends, a given position inserts and shifts the rest. A position larger than the list is clamped to the end.
- `added_at` and `created_at` are set server-side with UTC `default_factory`.
- A Content delete leaves a gap in positions, but the order stays correct. It is renumbered on the next playlist mutation. I did not add code for this.
- A playlist name is trimmed and capped at 100 characters, which the PDF does not specify. Names are not unique, since the PDF has no unique constraint.
- Unlike the PDF's "Content - Playlist N:M", the API only adds Content items. It does not add a separate "watch later" list.
- `recap.db` shows as modified in git (new tables). No commit was made.
