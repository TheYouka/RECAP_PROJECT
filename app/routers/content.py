from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import Session, select

from app.database import get_session
from app.models import (
    Album,
    Content,
    ContentStatus,
    ContentType,
    Movie,
    Tag,
)
from app.routers.bookmarks import BookmarkRead, _to_read as _bookmark_to_read
from app.routers.tags import TagRead

router = APIRouter(prefix="/content", tags=["content"])


# ---------------------------------------------------------------------------
# Schemas de entrada / salida
# ---------------------------------------------------------------------------
class MovieData(BaseModel):
    duration_minutes: int
    release_year: Optional[int] = None
    director: Optional[str] = None


class AlbumData(BaseModel):
    artist: str
    release_year: Optional[int] = None
    total_tracks: Optional[int] = None


class MovieUpdate(BaseModel):
    duration_minutes: Optional[int] = None
    release_year: Optional[int] = None
    director: Optional[str] = None


class AlbumUpdate(BaseModel):
    artist: Optional[str] = None
    release_year: Optional[int] = None
    total_tracks: Optional[int] = None


class ContentCreate(BaseModel):
    title: str
    type: ContentType
    status: ContentStatus = ContentStatus.plan_to_watch
    synopsis: Optional[str] = None
    cover_url: Optional[str] = None
    external_id: Optional[str] = None
    rating: Optional[int] = None
    external_link: Optional[str] = None
    # Detalles según el tipo. Se exige el bloque que corresponda al type.
    movie: Optional[MovieData] = None
    album: Optional[AlbumData] = None


class ContentUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[ContentStatus] = None
    synopsis: Optional[str] = None
    cover_url: Optional[str] = None
    external_id: Optional[str] = None
    rating: Optional[int] = None
    external_link: Optional[str] = None
    movie: Optional[MovieUpdate] = None
    album: Optional[AlbumUpdate] = None


class ContentRead(BaseModel):
    id: int
    title: str
    type: ContentType
    status: ContentStatus
    synopsis: Optional[str] = None
    cover_url: Optional[str] = None
    external_id: Optional[str] = None
    rating: Optional[int] = None
    external_link: Optional[str] = None
    created_at: datetime
    movie: Optional[MovieData] = None
    album: Optional[AlbumData] = None
    bookmark: Optional[BookmarkRead] = None


def _to_read(content: Content) -> ContentRead:
    """Arma la respuesta combinando Content con su extensión Movie/Album."""
    movie = None
    album = None
    if content.type == ContentType.movie and content.movie:
        movie = MovieData(
            duration_minutes=content.movie.duration_minutes,
            release_year=content.movie.release_year,
            director=content.movie.director,
        )
    if content.type == ContentType.music and content.album:
        album = AlbumData(
            artist=content.album.artist,
            release_year=content.album.release_year,
            total_tracks=content.album.total_tracks,
        )
    return ContentRead(
        id=content.id,
        title=content.title,
        type=content.type,
        status=content.status,
        synopsis=content.synopsis,
        cover_url=content.cover_url,
        external_id=content.external_id,
        rating=content.rating,
        external_link=content.external_link,
        created_at=content.created_at,
        movie=movie,
        album=album,
        bookmark=_bookmark_to_read(content.bookmark) if content.bookmark else None,
    )


# ---------------------------------------------------------------------------
# CREATE
# ---------------------------------------------------------------------------
@router.post("/", response_model=ContentRead, status_code=201)
def create_content(payload: ContentCreate, session: Session = Depends(get_session)):
    if payload.type == ContentType.movie and payload.movie is None:
        raise HTTPException(status_code=422, detail="Falta el bloque 'movie' para type=movie")
    if payload.type == ContentType.music and payload.album is None:
        raise HTTPException(status_code=422, detail="Falta el bloque 'album' para type=music")

    content = Content(
        title=payload.title,
        type=payload.type,
        status=payload.status,
        synopsis=payload.synopsis,
        cover_url=payload.cover_url,
        external_id=payload.external_id,
        rating=payload.rating,
        external_link=payload.external_link,
    )
    session.add(content)
    session.flush()  # asigna content.id sin cerrar la transacción

    if payload.type == ContentType.movie:
        session.add(
            Movie(
                content_id=content.id,
                duration_minutes=payload.movie.duration_minutes,
                release_year=payload.movie.release_year,
                director=payload.movie.director,
            )
        )
    else:
        session.add(
            Album(
                content_id=content.id,
                artist=payload.album.artist,
                release_year=payload.album.release_year,
                total_tracks=payload.album.total_tracks,
            )
        )

    session.commit()
    session.refresh(content)
    return _to_read(content)


# ---------------------------------------------------------------------------
# READ (lista)
# ---------------------------------------------------------------------------
@router.get("/", response_model=list[ContentRead])
def list_content(
    session: Session = Depends(get_session),
    type: Optional[ContentType] = Query(default=None, description="Filtrar por tipo"),
    status: Optional[ContentStatus] = Query(default=None, description="Filtrar por estado"),
):
    query = select(Content)
    if type is not None:
        query = query.where(Content.type == type)
    if status is not None:
        query = query.where(Content.status == status)
    results = session.exec(query).all()
    return [_to_read(c) for c in results]


# ---------------------------------------------------------------------------
# READ (uno)
# ---------------------------------------------------------------------------
@router.get("/{content_id}", response_model=ContentRead)
def get_content(content_id: int, session: Session = Depends(get_session)):
    content = session.get(Content, content_id)
    if content is None:
        raise HTTPException(status_code=404, detail="Contenido no encontrado")
    return _to_read(content)


# ---------------------------------------------------------------------------
# UPDATE
# ---------------------------------------------------------------------------
@router.patch("/{content_id}", response_model=ContentRead)
def update_content(
    content_id: int, payload: ContentUpdate, session: Session = Depends(get_session)
):
    content = session.get(Content, content_id)
    if content is None:
        raise HTTPException(status_code=404, detail="Contenido no encontrado")

    # Campos comunes de Content (el type no se cambia una vez creado)
    common = payload.model_dump(exclude_unset=True, exclude={"movie", "album"})
    for field, value in common.items():
        setattr(content, field, value)

    # Detalles de la extensión según el tipo real del contenido
    if content.type == ContentType.movie and payload.movie is not None:
        if content.movie is None:
            raise HTTPException(status_code=404, detail="Detalle de película no encontrado")
        movie_fields = payload.movie.model_dump(exclude_unset=True)
        for field, value in movie_fields.items():
            setattr(content.movie, field, value)

    if content.type == ContentType.music and payload.album is not None:
        if content.album is None:
            raise HTTPException(status_code=404, detail="Detalle de álbum no encontrado")
        album_fields = payload.album.model_dump(exclude_unset=True)
        for field, value in album_fields.items():
            setattr(content.album, field, value)

    session.add(content)
    session.commit()
    session.refresh(content)
    return _to_read(content)


# ---------------------------------------------------------------------------
# DELETE
# ---------------------------------------------------------------------------
@router.delete("/{content_id}", status_code=204)
def delete_content(content_id: int, session: Session = Depends(get_session)):
    content = session.get(Content, content_id)
    if content is None:
        raise HTTPException(status_code=404, detail="Contenido no encontrado")
    session.delete(content)  # cascade borra Movie/Album/Bookmark asociados
    session.commit()
    return None


# ---------------------------------------------------------------------------
# TAGS del contenido (RF-02: enlazar/desenlazar tags ya existentes)
# ---------------------------------------------------------------------------
def _get_content_or_404(content_id: int, session: Session) -> Content:
    content = session.get(Content, content_id)
    if content is None:
        raise HTTPException(status_code=404, detail="Contenido no encontrado")
    return content


def _get_tag_or_404(tag_id: int, session: Session) -> Tag:
    tag = session.get(Tag, tag_id)
    if tag is None:
        raise HTTPException(status_code=404, detail="Tag no encontrado")
    return tag


@router.get("/{content_id}/tags", response_model=list[TagRead])
def list_content_tags(content_id: int, session: Session = Depends(get_session)):
    content = _get_content_or_404(content_id, session)
    return content.tags


@router.post("/{content_id}/tags/{tag_id}", response_model=list[TagRead], status_code=201)
def link_tag_to_content(
    content_id: int, tag_id: int, session: Session = Depends(get_session)
):
    content = _get_content_or_404(content_id, session)
    tag = _get_tag_or_404(tag_id, session)

    if tag not in content.tags:
        content.tags.append(tag)
        session.add(content)
        session.commit()
        session.refresh(content)

    return content.tags


@router.delete("/{content_id}/tags/{tag_id}", response_model=list[TagRead])
def unlink_tag_from_content(
    content_id: int, tag_id: int, session: Session = Depends(get_session)
):
    content = _get_content_or_404(content_id, session)
    tag = _get_tag_or_404(tag_id, session)

    if tag not in content.tags:
        raise HTTPException(status_code=404, detail="El tag no está enlazado a este contenido")

    content.tags.remove(tag)
    session.add(content)
    session.commit()
    session.refresh(content)

    return content.tags
