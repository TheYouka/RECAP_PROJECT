# Seed de RECAP: 5 movie + 5 music sin tags

**Resumen**: Se leyó recap.db directamente (sqlite3) y se hicieron GET reales a las 10 cover_url. La BD contiene 10 items (5 movie, 5 music) con todos los campos del modelo llenos y sin tags. Las 10 portadas devuelven 200 con content-type de imagen. No hay archivos temporales ni servidor escuchando en :8000.

**Verdict**: APPROVED

## Criterios

1. Tipos y conteo: PASS. `ContentType` en app/models.py solo define `movie` y `music`. Hay exactamente 5 filas de cada uno (content=10, movie=5, album=5). Los ids tienen huecos (5,7,9...) por el incidente de duplicados que el coder borró; es cosmético.
2. Campos sin nulos: PASS (confirmed). Las 10 filas tienen title, type, status, synopsis (115-183 caracteres), cover_url, external_id, external_link y created_at. Las 5 películas tienen duration_minutes, release_year y director. Los 5 álbumes tienen artist, release_year y total_tracks. `rating` es NULL solo en Whiplash y Guitar Songs (status plan_to_watch), decisión documentada en el plan y coherente con "sin calificar". Hay 4 bookmarks (Parasite, Chihiro, Pulp Fiction, Blade Runner 2049) con position, recap_text y recap_source=manual. Whiplash no tiene bookmark, según el plan, y la música no admite bookmark.
3. Duplicados: PASS. La consulta `group by lower(title) having count(*)>1` devolvió vacío.
4. Portadas: PASS (confirmed). Request real a las 10 URLs: ids 1, 2 y 4 son image/png, ids 3, 6, 8, 10, 12, 14 y 16 son image/jpeg, todas con HTTP 200.
5. Tags: PASS. `tag`=0 filas y `content_tag`=0 filas.
6. Limpieza: PASS. No hay seed*.py, _seed*, uv.out, uv.err ni .bak fuera de .venv. No hay ningún socket LISTEN en :8000, solo conexiones TimeWait/FinWait2 residuales. `git status` solo muestra `.agents/` y `recap.db` sin seguir.
7. Contenido: PASS. Música: 5 álbumes de Billie Eilish (WHEN WE ALL FALL ASLEEP 2019/14 pistas, Happier Than Ever 2021/16, HIT ME HARD AND SOFT 2024/10, dont smile at me 2017/9, Guitar Songs 2022/2). Películas variadas: Parasite (Bong Joon-ho, 2019, 132 min), El viaje de Chihiro (Miyazaki, 2001, 125), Pulp Fiction (Tarantino, 1994, 154), Blade Runner 2049 (Villeneuve, 2017, 164), Whiplash (Chazelle, 2014, 106). Los datos coinciden con lo que conozco de estas obras; no se contrastaron en línea.

## Observaciones menores (no bloquean)

- `recap.db` queda sin seguir en git. Es esperable porque es la BD de datos.
- No se verificó el estado del servidor uvicorn del coder más allá de comprobar que nada escucha en :8000.
