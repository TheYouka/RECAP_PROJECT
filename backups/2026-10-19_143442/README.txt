RECAP backup 2026-10-19_143442
Source: recap.db (opened read-only). CSVs are UTF-8 with BOM; NULL = empty string.

CSV file             CSV rows  DB rows  match
album.csv                   5        5  OK
bookmark.csv                4        4  OK
content.csv                10       10  OK
content_tag.csv             0        0  OK
movie.csv                   5        5  OK
tag.csv                     0        0  OK
content_full.csv           10       10  OK
(content_full.csv is a LEFT JOIN of content with movie/album/bookmark; compared against content count)
Binary copy: recap.db.bak-2026-10-19_143442

Round-trip check (field-by-field, incl. cover_url/synopsis; 10 special-char values): PASS
