# PHASE A report: backup of recap.db

Result: PASS

Backup folder: `c:\Users\AlbertoVázquezAguila\Documents\RECAP_Project\RECAP_PROJECT\backups\2026-10-19_143442\`

Source DB was opened read-only (`mode=ro`). recap.db was not modified. No code, models or routers were touched, the API was not started, and no commits were made.

## Row counts (CSV vs DB `SELECT COUNT(*)`)

| File | CSV rows (excl. header) | DB rows | Match |
|---|---|---|---|
| album.csv | 5 | 5 | OK |
| bookmark.csv | 4 | 4 | OK |
| content.csv | 10 | 10 | OK |
| content_tag.csv | 0 | 0 | OK |
| movie.csv | 5 | 5 | OK |
| tag.csv | 0 | 0 | OK |
| content_full.csv | 10 | 10 (content) | OK |

Tables in DB (from sqlite_master, excluding sqlite_*): album, bookmark, content, content_tag, movie, tag. No other tables exist.

content_full.csv is content LEFT JOIN movie, album and bookmark. Columns: id, title, type, status, synopsis, cover_url, external_id, rating, external_link, created_at, duration_minutes, movie_release_year, director, artist, album_release_year, total_tracks, position, recap_text, recap_source, bookmark_updated_at.

## Round-trip verification

PASS. Every CSV was re-read with the csv module (utf-8-sig). Header and every field were compared to the DB values, with NULL as an empty string. This included 10 cover_url/synopsis values that contain commas, quotes or non-ASCII characters. The UTF-8 BOM is present.

## Binary copy

`c:\Users\AlbertoVázquezAguila\Documents\RECAP_Project\RECAP_PROJECT\backups\2026-10-19_143442\recap.db.bak-2026-10-19_143442` (shutil.copy2)

A README.txt with the same table is in the backup folder.

## .gitignore status

- There is no `.gitignore` in the project root, which is also the git root. The only one is `frontend\.gitignore`.
- `backups/` is NOT ignored. `git status` shows it as untracked (`?? backups/`).
- `recap.db` and `.env` are both tracked by git (`git ls-files` lists them). `.env` holds DATABASE_URL, so it is worth reviewing separately. I made no change.
- I did not edit `.gitignore` and did not commit.
- Pre-existing, unrelated working-tree state: ` D recap_modelo_datos.pdf` and `?? recap_modelo_de_datos.pdf`.

Temporary scripts were deleted. Only the `backups/` folder remains.
