# PHASE B verification note

## Environment
- Project venv: `.venv` (Python 3.14, no pip, no pytest). The PDF parser (pypdf 5.1.0) and pytest 8.3.4 + httpx 0.28.1 were installed with the system pip into temp folders under `%TEMP%` and used through PYTHONPATH. Nothing was added to `.venv` or `requirements.txt`. The temp folders are deleted.
- DB: `recap.db` (from DATABASE_URL, value not printed).

## Before (read-only, before starting the server)
album 5, bookmark 4, content 10, content_tag 0, movie 5, tag 0. The `playlist` and `playlist_item` tables did not exist. This matches the backup report. Content ids: 1,2,3,4,6,8,10,12,14,16.

## Startup
`.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000` ran with "Application startup complete" and no errors. `create_all` created `playlist` and `playlist_item`. No ALTER was needed.
- `playlist(id PK, name NOT NULL, description, created_at NOT NULL)`
- `playlist_item(playlist_id, content_id, position NOT NULL, added_at NOT NULL, PK(playlist_id, content_id), FK playlist.id, FK content.id)`

## HTTP calls (real, via urllib against 127.0.0.1:8000)
| Call | Result |
|---|---|
| POST /playlists/ name "  TEST maraton  " | 201, name trimmed, item_count 0 |
| POST /playlists/ name "   " | 422 (empty after trim) |
| POST /playlists/ name "" | 422 (pydantic min_length) |
| GET /playlists/, GET /playlists/{id} | 200 |
| GET /playlists/99999 | 404 |
| POST items content 1 (movie) | 201, position 1 |
| POST items content 8 (music) | 201, position 2 |
| POST items content 2 (movie) with position 1 | 201, inserted first. Order became 2,1,8 with positions 1,2,3 |
| POST items content 1 again | 409 |
| POST items content 99999 | 404 |
| POST items on playlist 99999 | 404 |
| POST items position 0 | 422 |
| PATCH items/2 position 3 (reorder) | 200, order became 1,8,2 |
| PATCH items/3 (not in list) | 404 |
| PATCH playlist name + description | 200 |
| PATCH playlist name null | 422 |
| DELETE items/8 | 204. Remaining positions renumbered to 1,2 |
| DELETE items/8 again | 404 |
| DELETE playlist | 204, repeat DELETE and GET both 404 |
| Cascade check: temp movie (id 17) added to a temp playlist with content 1, then DELETE /content/17 | 204. The playlist kept only content 1, so the PlaylistItem was removed and the playlist survived. Then the temp playlist was deleted. |

Observation: after DELETE /content/{id} removes an item, the remaining positions can have a gap (content 1 stayed at position 2). The order stays correct, and the next add, move or remove renumbers to 1..N.

## After (server stopped, port 8000 closed, no uvicorn process left)
album 5, bookmark 4, content 10, content_tag 0, movie 5, tag 0, playlist 0, playlist_item 0. Original counts are unchanged, content ids are unchanged, and the new tables hold no test rows. Temp content row 17 was created and deleted by me, so it is not in the DB.

## pytest
`python -m pytest tests -q`: 5 failed, 1 error, 0 passed. The failures were not caused by this change. `tests/test_content.py` posts the obsolete payload `{"title","content_type","year"}`, which the current `/content/` schema rejects with 422, and `test_get_contents` hits an in-memory SQLite threading/table error in its fixture. I did not run pytest on the pre-change code, so "pre-existing" is based on the payload mismatch. No playlist tests were added (out of scope; the end-to-end HTTP run above covers the endpoints).

## Other notes
- `git status` shows `recap.db` as modified because of the two new tables. The content data is unchanged. No commits were made.
