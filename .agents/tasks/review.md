# Backup de recap.db y entidades Playlist/PlaylistItem con router

Se respaldó la base de datos a CSV (más copia binaria) y se añadieron `Playlist` y `PlaylistItem` al modelo, con un router `/playlists` registrado en `main.py`. Las tablas nuevas se crean con `create_all`, sin ALTER ni cambios a tablas existentes. Verifiqué por mi cuenta el backup, el modelo contra el PDF, los conteos de la base de datos y el alcance del diff.

Watch for: la discrepancia de `Bookmark` entre PDF y models.py (el PDF dice 1:N con `id` propio, el código es 1:1) se dejó sin aplicar a propósito. Es preexistente y fuera del alcance pedido, pero necesita una decisión del usuario (confirmed). `backups/` no está en `.gitignore` y `.env` está versionado (confirmed).

**Verdict**: APPROVED

## High-level view

El backup está completo: un CSV por tabla, un `content_full.csv` con los joins y una copia binaria de `recap.db`, con los conteos coincidiendo con la base de datos real. Los textos con acentos y comas están bien escapados y el archivo lleva BOM UTF-8 para abrirse bien en Excel.

Las dos entidades nuevas coinciden con el PDF en nombres, tipos, PK/FK, obligatoriedad y reglas de borrado. El único añadido fuera de las tablas es la relación `Content.playlist_items` con cascade, que el PDF exige ("Borrar un Content quita sus PlaylistItem") y que no agrega columnas.

El router cubre CRUD de playlists y agregar, listar, mover y quitar items, con 404, 409 y 422 consistentes con el resto de routers. Mantiene las posiciones contiguas 1..N. No se tocó el frontend, no se crearon tags y el contenido existente quedó intacto.

<details>
<summary>Issues (4)</summary>

1. **Bookmark PDF vs código** — el PDF define Bookmark con `id` propio y relación 1:N con Content, models.py lo tiene 1:1 con `content_id` como PK. Decidir si se migra; no bloquea esta entrega porque el usuario pidió solo las dos entidades (confirmed).
2. **backups/ sin ignorar, .env versionado** — no existe `.gitignore` en la raíz, así que `backups/` (contiene datos y la copia de la base) aparece como untracked, y `recap.db` y `.env` están rastreados. Añadir un `.gitignore` antes de hacer commit (confirmed).
3. **Huecos de posición tras borrar un Content** — `DELETE /content/{id}` deja huecos en `position` de los PlaylistItem restantes. El orden sigue correcto y se renumera en la siguiente mutación; solo importa si el frontend muestra la posición cruda (confirmed, bajo impacto).
4. **pytest sin línea base** — 5 fallos y 1 error; la nota atribuye los fallos al payload obsoleto de `tests/test_content.py`, pero no se corrió en el código previo. Sin tests de playlists. No bloqueante (likely que sea preexistente).

</details>

<details>
<summary>Details</summary>

## Integridad del backup

La carpeta `backups/2026-10-19_143442/` contiene album, bookmark, content, content_tag, movie y tag en CSV, más `content_full.csv`, `README.txt` y `recap.db.bak-2026-10-19_143442` (45 056 bytes). Consulté `recap.db` en modo solo lectura: album 5, bookmark 4, content 10, content_tag 0, movie 5, tag 0, lo que coincide con el reporte. Las primeras filas de `content.csv` muestran sinopsis con comas entre comillas, acentos intactos y URLs de portada completas.

## Modelo contra el PDF

Comparé `Playlist` y `PlaylistItem` con las páginas 3 y 4 del PDF, extraídas con pypdf. Las tablas quedaron así:

- `Playlist`: `id` PK autoincremental, `name` obligatorio, `description` opcional, `created_at` obligatorio.
- `PlaylistItem`: `playlist_id` y `content_id` forman la PK compuesta y son FK a `playlist.id` y `content.id`, `position` int obligatorio y `added_at` datetime obligatorio.

Las cascadas cumplen lo que el PDF pide: borrar una Playlist borra sus items sin tocar el Content, y borrar un Content quita sus items sin tocar la Playlist. La verificación del coder lo prueba con un Content temporal.

Las tablas `bookmark` y `content` conservan sus columnas originales (consultadas con `pragma table_info`). El diff de `app/` solo toca `main.py` (import y `include_router`) y `models.py` (42 líneas añadidas, ninguna columna cambiada). `git status` no muestra nada bajo `frontend/`.

## Router /playlists

Cubre POST, GET (lista y detalle), PATCH y DELETE de playlists, y POST, GET, PATCH (mover) y DELETE de items. Usa 404 para playlist, contenido o item inexistentes, 409 para duplicados y 422 para nombre vacío o posición menor que 1. El estilo (prefijo, `Depends(get_session)`, schemas pydantic) sigue a `content.py`. Las decisiones que el PDF no especifica están documentadas en el reporte: nombre recortado y limitado a 100 caracteres, inserción con desplazamiento, posiciones fuera de rango ajustadas al final.

## Evidencia

La nota de verificación muestra el servidor iniciando sin errores, la creación de ambas tablas, unas 20 llamadas HTTP reales con los casos de error, el cascade, y los conteos finales idénticos a los iniciales, con las tablas nuevas vacías. Mi consulta de solo lectura confirma esos conteos finales (playlist 0, playlist_item 0). No volví a correr pytest ni los endpoints, como se pidió.

</details>

<details>
<summary>File map</summary>

- `app/models.py` — añade Playlist, PlaylistItem y `Content.playlist_items`
- `app/routers/playlists.py` — router nuevo
- `app/main.py` — importa y registra el router
- `recap.db` — dos tablas nuevas vacías
- `backups/2026-10-19_143442/` — CSVs, README y copia binaria
- `.agents/tasks/*.md` — reportes del flujo

</details>
