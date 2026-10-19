# Plan de seed de RECAP (5 movie + 5 music, sin tags)

## Hallazgos clave (leídos de app/models.py, routers/content.py, routers/bookmarks.py, recap_modelo_datos.pdf)

- `ContentType` solo tiene DOS valores: `movie` y `music`. No existen libros ni otros tipos (el PDF dice "Libros (V2)" todavía NO está en models.py). Total a insertar: 5 movie + 5 music = 10 items. No inventar tipos.
- `ContentStatus`: `watching | completed | paused | plan_to_watch`. `RecapSource`: `manual | ia`.
- Estado previo detectado (ya verificado, no se borró nada):
  - `recap.db` NO existe (tampoco `recap.db.bak`). `DATABASE_URL` está en `.env` (no imprimir su valor; el default de database.py es `sqlite:///./recap.db`).
  - No hay script temporal de seed en el proyecto; `.agents/` solo contenía carpetas de librerías en `.venv`.
  - Nada escuchando en el puerto 8000.
  - `git status` limpio de artefactos de seed.
  - `.venv` no tiene pip, pypdf ni pdfplumber. El PDF `recap_modelo_datos.pdf` (4 págs) ya fue leído; no hace falta volver a leerlo. `requirements.txt` NO se modifica.
- Idioma: no hay filas previas (BD inexistente), UI en español → sinopsis en español.

## Reconciliación del estado (el coder lo repite al empezar, por si cambió)

1. Si `recap.db.bak` existe: conservarlo, no sobrescribir. Si no existe y `recap.db` existe: `Copy-Item recap.db recap.db.bak`. Si `recap.db` no existe: no hay nada que respaldar (el servidor la creará en el arranque vía `create_db_and_tables()`).
2. Si hay un script temporal (`seed*.py`, `_seed*`) en la raíz: reutilizarlo si coincide con este plan, si no borrarlo al final.
3. Si hay un proceso en :8000 (`Get-NetTCPConnection -LocalPort 8000`): si es uvicorn de este proyecto, reutilizarlo y NO detenerlo al final; si no, detener solo el que uno mismo arrancó.
4. Si ya hay filas: nunca borrar ni modificar filas del usuario. Idempotencia por título (abajo).

## Esquema exacto

`POST /content/` (status 201), body `ContentCreate`:

| campo | tipo | requerido | notas |
|---|---|---|---|
| title | str | sí | |
| type | `movie`\|`music` | sí | inmutable |
| status | enum ContentStatus | no (default `plan_to_watch`) | |
| synopsis | str | no | llenar |
| cover_url | str | no | llenar con URL verificada |
| external_id | str | no | llenar (p. ej. `tmdb:496243`, `itunes:1450695723`) |
| rating | int | no | 1-10 (no se valida en la API; respetar 1-10; usar `null` solo si status = plan_to_watch) |
| external_link | str | no | URL (TMDB/Apple Music) |
| movie | `{duration_minutes:int (req), release_year:int, director:str}` | obligatorio si type=movie, si no 422 | minutos > 0, año 4 dígitos |
| album | `{artist:str (req), release_year:int, total_tracks:int}` | obligatorio si type=music, si no 422 | |

`created_at` lo pone el servidor (UTC), no se envía. Fechas: solo años enteros, no hay campos fecha en la API.
Bookmark (solo movies; música da 422): `POST /content/{id}/bookmark` body `{position: str (min 1, req), recap_text: str|null, recap_source: "manual"|"ia" (default manual)}`; `updated_at` automático. Como el usuario pidió "llenar todo", crear un bookmark en las películas con status `watching` o `paused` o `completed` (no en plan_to_watch). Tags: NO llamar a ningún endpoint `/tags` ni `/content/{id}/tags/...`.

## Inserción

Preferido: desde la raíz del proyecto `.\.venv\Scripts\python -m uvicorn app.main:app --port 8000` (en background), esperar a `GET http://localhost:8000/` = 200, y hacer POST vía API con un script Python temporal usando solo stdlib (`urllib.request`, `json`) en `seed_tmp.py`. Fallback si el servidor no es práctico: sesión SQLModel (`from app.database import engine, create_db_and_tables`) creando `Content`+`Movie`/`Album`(+`Bookmark`) replicando la lógica de `create_content`.

Regla de idempotencia: antes de insertar, `GET /content/` y saltar cualquier item cuyo `title` ya exista (comparación exacta, case-insensitive). Al insertar un movie con bookmark, si el item fue saltado, saltar también su bookmark.
Regla de backup: copiar `recap.db` a `recap.db.bak` antes de escribir SOLO si existe `recap.db` y no existe `.bak`.

## Verificación de covers (obligatoria antes de usar)

Para cada `cover_url` hacer GET (o HEAD) y exigir HTTP 200 y `Content-Type` que empiece por `image/`. Si falla, resolver otra:
- Álbumes: iTunes Search `https://itunes.apple.com/search?term=<artista+album>&entity=album&limit=1` → `artworkUrl100` cambiando `100x100bb` por `600x600bb`.
- Películas: Wikipedia REST `https://en.wikipedia.org/api/rest_v1/page/summary/<Título_de_página>` → `originalimage.source` (o `thumbnail.source`), Wikimedia Commons/upload.wikimedia.org. TMDB requiere API key: no usar.
Enviar un `User-Agent` descriptivo en las peticiones a Wikimedia (si no, 403).

## Items candidatos (10)

Películas (type=movie), todas con `movie{duration_minutes, release_year, director}`:

| # | title | género (para la sinopsis) | director | año | min | status | rating | cover (resolver con Wikipedia page) | external_link |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Parasite | thriller/drama | Bong Joon-ho | 2019 | 132 | completed | 10 | Wikipedia `Parasite_(2019_film)` | https://www.themoviedb.org/movie/496243 |
| 2 | El viaje de Chihiro | animación/fantasía | Hayao Miyazaki | 2001 | 125 | completed | 9 | Wikipedia `Spirited_Away` | https://www.themoviedb.org/movie/129 |
| 3 | Pulp Fiction | crimen/cine negro | Quentin Tarantino | 1994 | 154 | watching | 9 | Wikipedia `Pulp_Fiction` | https://www.themoviedb.org/movie/680 |
| 4 | Blade Runner 2049 | ciencia ficción | Denis Villeneuve | 2017 | 164 | paused | 8 | Wikipedia `Blade_Runner_2049` | https://www.themoviedb.org/movie/335984 |
| 5 | Whiplash | drama musical | Damien Chazelle | 2014 | 106 | plan_to_watch | null | Wikipedia `Whiplash_(2014_film)` | https://www.themoviedb.org/movie/244786 |

external_id: `tmdb:<id>` con el id del link. Bookmarks sugeridos: Pulp Fiction `position "01:12:30"`; Blade Runner 2049 `"00:58:10"`; Parasite `"02:12:00"`; Chihiro `"02:05:00"` (recap_text en español, `recap_source: "manual"`). Whiplash sin bookmark.

Música (type=music), todas con `album{artist:"Billie Eilish", release_year, total_tracks}`:

| # | title | año | pistas | status | rating | cover (iTunes search, verificar) | external_link |
|---|---|---|---|---|---|---|---|
| 1 | WHEN WE ALL FALL ASLEEP, WHERE DO WE GO? | 2019 | 14 | completed | 10 | iTunes `billie eilish when we all fall asleep` | URL Apple Music del resultado (`collectionViewUrl`) |
| 2 | Happier Than Ever | 2021 | 16 | completed | 9 | iTunes `billie eilish happier than ever` | idem |
| 3 | HIT ME HARD AND SOFT | 2024 | 10 | watching | 9 | iTunes `billie eilish hit me hard and soft` | idem |
| 4 | dont smile at me | 2017 | 9 | paused | 8 | iTunes `billie eilish dont smile at me` | idem |
| 5 | Guitar Songs | 2022 | 2 | plan_to_watch | null | iTunes `billie eilish guitar songs` | idem |

external_id: `itunes:<collectionId>`. Confirmar año y número de pistas con el resultado de iTunes (`releaseDate`, `trackCount`) y corregir si difiere. Sinopsis en español, 1-2 frases. Sin bookmark en música.

## Pasos para el coder

1. Reconciliar estado (sección arriba). Verificar: salida de los 4 chequeos documentada en el reporte final.
2. Resolver y verificar las 10 `cover_url` (200 + `image/*`). Verificar: script imprime URL, status y content-type de cada una; ninguna falla.
3. Arrancar uvicorn (o reutilizar), correr `seed_tmp.py` idempotente: POST de 10 items + bookmarks de películas. Verificar: `GET /content/?type=movie` devuelve ≥5 movies con los campos llenos y `GET /content/?type=music` ≥5 álbumes; segunda ejecución del script inserta 0 (idempotente); `GET /content/{id}/tags` = `[]` para todos y `GET /tags/` sin nuevos tags.
4. Correr la suite existente: `.\.venv\Scripts\python -m pytest tests -q` (si pytest no está instalado, indicarlo, no instalarlo en requirements.txt).
5. Limpieza: borrar `seed_tmp.py`, detener solo el uvicorn que se arrancó, no commitear `recap.db`/`recap.db.bak` salvo que ya estuvieran versionados (revisar `git status`), y no modificar `requirements.txt`.
6. Escribir `.agents/tasks/seed-review.json` solo lo hace el revisor: `{"verdict": "APPROVED"|"CHANGES_REQUESTED", "findings": [...]}`.

## Decisiones

- Sin descomposición en FEATs: el trabajo es un solo script de seed con una verificación, el loop existente lo ejecuta.
- Bookmarks incluidos porque "llena todo" y es parte del modelo; tags excluidos por petición explícita.
- Solo 10 items, no 20+: el modelo solo tiene dos tipos; inventar más tipos no es posible sin tocar models.py.
