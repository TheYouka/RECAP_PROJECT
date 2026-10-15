from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import Session

from app.database import get_session
from app.models import Bookmark, Content, ContentType, RecapSource

router = APIRouter(prefix="/content", tags=["bookmarks"])

# Tipos de contenido que admiten separador. Se define como lista de
# permitidos, no de bloqueados: un tipo nuevo (libros, series, etc.)
# empieza sin separador hasta que se decida habilitarlo explícitamente aquí.
BOOKMARKABLE_TYPES = {ContentType.movie}


# ---------------------------------------------------------------------------
# Schemas de entrada / salida
# ---------------------------------------------------------------------------
class BookmarkCreate(BaseModel):
    position: str = Field(min_length=1)
    recap_text: Optional[str] = None
    recap_source: RecapSource = RecapSource.manual


class BookmarkUpdate(BaseModel):
    position: Optional[str] = Field(default=None, min_length=1)
    recap_text: Optional[str] = None
    recap_source: Optional[RecapSource] = None


class BookmarkRead(BaseModel):
    content_id: int
    position: str
    recap_text: Optional[str] = None
    recap_source: RecapSource
    updated_at: datetime


def _to_read(bookmark: Bookmark) -> BookmarkRead:
    return BookmarkRead(
        content_id=bookmark.content_id,
        position=bookmark.position,
        recap_text=bookmark.recap_text,
        recap_source=bookmark.recap_source,
        updated_at=bookmark.updated_at,
    )


def _get_content_or_404(content_id: int, session: Session) -> Content:
    content = session.get(Content, content_id)
    if content is None:
        raise HTTPException(status_code=404, detail="Contenido no encontrado")
    return content


# ---------------------------------------------------------------------------
# CREATE
# ---------------------------------------------------------------------------
@router.post("/{content_id}/bookmark", response_model=BookmarkRead, status_code=201)
def create_bookmark(
    content_id: int, payload: BookmarkCreate, session: Session = Depends(get_session)
):
    content = _get_content_or_404(content_id, session)

    if content.type not in BOOKMARKABLE_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"El tipo de contenido '{content.type.value}' no admite separador",
        )

    if content.bookmark is not None:
        raise HTTPException(
            status_code=409,
            detail="Este contenido ya tiene un separador, usa PATCH para actualizarlo",
        )

    bookmark = Bookmark(
        content_id=content.id,
        position=payload.position,
        recap_text=payload.recap_text,
        recap_source=payload.recap_source,
    )
    session.add(bookmark)
    session.commit()
    session.refresh(bookmark)
    return _to_read(bookmark)


# ---------------------------------------------------------------------------
# READ
# ---------------------------------------------------------------------------
@router.get("/{content_id}/bookmark", response_model=BookmarkRead)
def get_bookmark(content_id: int, session: Session = Depends(get_session)):
    content = _get_content_or_404(content_id, session)
    if content.bookmark is None:
        raise HTTPException(status_code=404, detail="Este contenido no tiene separador")
    return _to_read(content.bookmark)


# ---------------------------------------------------------------------------
# UPDATE
# ---------------------------------------------------------------------------
@router.patch("/{content_id}/bookmark", response_model=BookmarkRead)
def update_bookmark(
    content_id: int, payload: BookmarkUpdate, session: Session = Depends(get_session)
):
    content = _get_content_or_404(content_id, session)
    if content.bookmark is None:
        raise HTTPException(status_code=404, detail="Este contenido no tiene separador")

    bookmark = content.bookmark
    fields = payload.model_dump(exclude_unset=True)
    for field, value in fields.items():
        setattr(bookmark, field, value)
    bookmark.updated_at = datetime.now(timezone.utc)

    session.add(bookmark)
    session.commit()
    session.refresh(bookmark)
    return _to_read(bookmark)


# ---------------------------------------------------------------------------
# DELETE
# ---------------------------------------------------------------------------
@router.delete("/{content_id}/bookmark", status_code=204)
def delete_bookmark(content_id: int, session: Session = Depends(get_session)):
    content = _get_content_or_404(content_id, session)
    if content.bookmark is None:
        raise HTTPException(status_code=404, detail="Este contenido no tiene separador")

    session.delete(content.bookmark)
    session.commit()
    return None
