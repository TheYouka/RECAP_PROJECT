# Implementation Plan

Objetivo: hacer que la vista de la playlist `recien-añadidas` muestre únicamente registros de `Content` creados hace menos de 7 días, sin alterar el comportamiento básico de las otras playlists ni añadir un rediseño visual.

Decisión de diseño: exponer `created_at` en la respuesta existente de `GET /content` y filtrar en `PlaylistView`, en lugar de crear un parámetro nuevo en el backend. Esto mantiene la API actual compatible, reutiliza la carga que ya hace `Library.jsx` y limita el cambio de servidor a hacer visible un campo que ya existe en `Content`.

- [x] 1. Exponer la fecha de creación en la respuesta de contenido.
      Agregar `created_at: datetime` a `ContentRead` en `app/routers/content.py` e incluir `content.created_at` en `_to_read()`. No usar `Playlist.created_at` ni `PlaylistItem.added_at`; el campo fuente debe ser `Content.created_at`. Al quedar incluido en el schema usado por POST, GET de lista, GET individual y PATCH, las respuestas conservan todos los campos existentes y añaden la fecha necesaria para el frontend.
      Files: `app/routers/content.py`
      Verify: ejecutar `./venv/Scripts/python.exe -m pytest tests/test_content.py -k created_at` desde la raíz (en PowerShell puede usarse `./venv/Scripts/python.exe`); la prueba enfocada debe crear/consultar contenido con el contrato actual y confirmar que `GET /content/` devuelve `created_at` serializado como timestamp. Si el entorno usa otro intérprete, ejecutar el mismo comando con `python -m pytest`.

- [x] 2. Añadir una regresión backend para el campo que consume la playlist.
      Incorporar en `tests/test_content.py` una prueba con el payload vigente de la API (`type` y el bloque `movie` o `album`) que compruebe que la respuesta de creación o de listado incluye `created_at` y que su valor es parseable. Mantener la prueba aislada de los casos heredados: el archivo contiene pruebas antiguas que usan `content_type`, `year` y `PUT`, contratos que no corresponden al router actual, por lo que no ampliar este cambio para corregir funcionalidades ajenas.
      Files: `tests/test_content.py`
      Verify: `./venv/Scripts/python.exe -m pytest tests/test_content.py -k created_at` debe terminar sin fallos. Como comprobación adicional, ejecutar `./venv/Scripts/python.exe -m pytest`; si fallan los casos heredados por sus payloads/métodos obsoletos, registrar esos fallos preexistentes en la sección `Verification evidence` en vez de atribuirlos a esta modificación.

- [x] 3. Implementar el filtrado de “Recien añadidas” en `PlaylistView`.
      Modificar `frontend/src/pages/PlaylistView.jsx` para conservar `Navbar`, `Sidebar` y el parámetro `slug`, importar `useEffect`, `useState` y el `ContentCard` existente siguiendo la convención de casing que ya usa este archivo. Solo cuando `slug === "recien-añadidas"`, solicitar `GET http://localhost:8000/content`, manejar estados de carga/error y filtrar registros cuyo `created_at` sea estrictamente posterior a `ahoraUtc - 7 días` y no posterior a `ahoraUtc`. Parsear timestamps con zona como UTC y, para los timestamps sin offset que SQLite pueda devolver, añadir explícitamente `Z` antes de convertirlos a `Date`; así se compara UTC con UTC y se evitan errores de hora local. Renderizar los resultados dentro de un `div.content-container`, un `<ContentCard key={item.id} item={item} />` por registro y un mensaje de estado vacío cuando ninguno califique. No modificar `contentCard.jsx`, estilos globales, `App.jsx` ni los enlaces existentes.
      Para los slugs `watchlater`, `vistos` y `viendo`, conservar el comportamiento actual de la vista: `Navbar`, `Sidebar` y el encabezado que muestra el slug, sin aplicarles este fetch ni este filtro. El enlace existente de `Playlists.jsx` ya usa exactamente `recien-añadidas`, por lo que no debe cambiarse.
      Files: `frontend/src/pages/PlaylistView.jsx`
      Verify: desde `frontend/`, ejecutar `npm run lint` y `npm run build`; ambos deben finalizar correctamente. Si `npm` no está disponible, ejecutar los equivalentes locales `./node_modules/.bin/oxlint.cmd` y `./node_modules/.bin/vite.cmd build` en PowerShell, y anotar el comando y resultado exactos. Con la API ejecutándose en `http://localhost:8000`, comprobar manualmente en `/playlist/recien-añadidas` que solo aparecen tarjetas de contenido con edad menor de 7 días, que aparece el estado vacío cuando no hay coincidencias y que `/playlist/watchlater`, `/playlist/vistos` y `/playlist/viendo` mantienen únicamente su comportamiento anterior.

## Verification evidence

- Command (root):
  ```powershell
  ./venv/Scripts/python.exe -m pytest tests/test_content.py -k created_at
  ```
  Result: exit code 1; `C:\Users\the_y\OneDrive\Documentos\RECAP_PROJECT\venv\Scripts\python.exe: No module named pytest`.
- Command (root):
  ```powershell
  ./venv/Scripts/python.exe -m pytest
  ```
  Result: exit code 1; `C:\Users\the_y\OneDrive\Documentos\RECAP_PROJECT\venv\Scripts\python.exe: No module named pytest`.
- Command (root; direct fallback because pytest is unavailable):
  ```powershell
  @'
  from datetime import datetime, timezone
  from app.models import Content, ContentStatus, ContentType
  from app.routers.content import _to_read

  content = Content(
      id=1,
      title="Recent Movie",
      type=ContentType.movie,
      status=ContentStatus.plan_to_watch,
      created_at=datetime.now(timezone.utc),
  )
  response = _to_read(content)
  assert response.created_at == content.created_at
  assert response.model_dump()["created_at"] is not None
  print("PASS: ContentRead and _to_read expose created_at")
  '@ | ./venv/Scripts/python.exe -
  ```
  Result: exit code 0; `PASS: ContentRead and _to_read expose created_at`.
- Command (root; HTTP fallback check):
  ```powershell
  @'
  from datetime import datetime
  from fastapi.testclient import TestClient
  from sqlmodel import SQLModel, Session, create_engine
  from app.database import get_session
  from app.main import app

  engine = create_engine("sqlite://", connect_args={"check_same_thread": False})
  SQLModel.metadata.create_all(engine)

  def override_get_session():
      with Session(engine) as session:
          yield session

  app.dependency_overrides[get_session] = override_get_session
  try:
      with TestClient(app) as client:
          created = client.post(
              "/content/",
              json={"title": "Recent Movie", "type": "movie", "movie": {"duration_minutes": 120}},
          )
          assert created.status_code == 201, created.text
          created_at = created.json()["created_at"]
          datetime.fromisoformat(created_at.replace("Z", "+00:00"))

          listed = client.get("/content")
          assert listed.status_code == 200, listed.text
          assert listed.json()[0]["created_at"] == created_at
          print("PASS: POST and GET /content expose parseable created_at")
  finally:
      app.dependency_overrides.clear()
  '@ | ./venv/Scripts/python.exe -
  ```
  Result: exit code 1; `RuntimeError: The starlette.testclient module requires the httpx2 package to be installed.`
- Command (`frontend/`):
  ```powershell
  npm run lint
  ```
  Result: exit code 0. Oxlint showed only the existing warnings in `src/pages/Library.jsx`: unused `getContentTypeEmoji` and `fetchContent` accessed during initialization.
- Command (`frontend/`):
  ```powershell
  npm run build
  ```
  Result: exit code 0; Vite transformed 29 modules and generated `dist/index.html`, `dist/assets/index-urHuarCW.css`, and `dist/assets/index-Dz68JZhI.js`.
- Manual route check for `/playlist/recien-añadidas`, `/playlist/watchlater`, `/playlist/vistos`, and `/playlist/viendo`: not run because the API and frontend server were not started. Code inspection confirms only `recien-añadidas` fetches and filters, while the other three retain only the slug heading.
