from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.database import get_session
from app.models import Content, ContentType, Playlist, PlaylistItem

router = APIRouter(prefix="/playlists", tags=["playlists"])


# ---------------------------------------------------------------------------
# Schemas de entrada / salida
# ---------------------------------------------------------------------------
class PlaylistCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None


class PlaylistUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = None


class PlaylistItemCreate(BaseModel):
    content_id: int
    # Si se omite, el contenido se agrega al final de la lista.
    position: Optional[int] = Field(default=None, ge=1)


class PlaylistItemMove(BaseModel):
    position: int = Field(ge=1)


class PlaylistItemRead(BaseModel):
    content_id: int
    position: int
    added_at: datetime
    title: str
    type: ContentType
    cover_url: Optional[str] = None


class PlaylistRead(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    item_count: int


class PlaylistDetail(PlaylistRead):
    items: list[PlaylistItemRead]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_playlist_or_404(playlist_id: int, session: Session) -> Playlist:
    playlist = session.get(Playlist, playlist_id)
    if playlist is None:
        raise HTTPException(status_code=404, detail="Playlist no encontrada")
    return playlist


def _ordered_items(playlist_id: int, session: Session) -> list[PlaylistItem]:
    return list(
        session.exec(
            select(PlaylistItem)
            .where(PlaylistItem.playlist_id == playlist_id)
            .order_by(PlaylistItem.position)
        ).all()
    )


def _get_item_or_404(playlist_id: int, content_id: int, session: Session) -> PlaylistItem:
    item = session.get(PlaylistItem, (playlist_id, content_id))
    if item is None:
        raise HTTPException(status_code=404, detail="El contenido no está en esta playlist")
    return item


def _renumber(items: list[PlaylistItem], session: Session) -> None:
    """Deja las posiciones contiguas 1..N siguiendo el orden de la lista."""
    for index, item in enumerate(items, start=1):
        if item.position != index:
            item.position = index
            session.add(item)


def _clean_name(name: str) -> str:
    cleaned = name.strip()
    if not cleaned:
        raise HTTPException(status_code=422, detail="El nombre de la playlist no puede estar vacío")
    return cleaned


def _to_item_read(item: PlaylistItem, content: Content) -> PlaylistItemRead:
    return PlaylistItemRead(
        content_id=item.content_id,
        position=item.position,
        added_at=item.added_at,
        title=content.title,
        type=content.type,
        cover_url=content.cover_url,
    )


def _items_read(playlist_id: int, session: Session) -> list[PlaylistItemRead]:
    return [
        _to_item_read(item, item.content) for item in _ordered_items(playlist_id, session)
    ]


def _to_read(playlist: Playlist, item_count: int) -> PlaylistRead:
    return PlaylistRead(
        id=playlist.id,
        name=playlist.name,
        description=playlist.description,
        created_at=playlist.created_at,
        item_count=item_count,
    )


def _to_detail(playlist: Playlist, session: Session) -> PlaylistDetail:
    items = _items_read(playlist.id, session)
    return PlaylistDetail(**_to_read(playlist, len(items)).model_dump(), items=items)


# ---------------------------------------------------------------------------
# CREATE
# ---------------------------------------------------------------------------
@router.post("/", response_model=PlaylistDetail, status_code=201)
def create_playlist(payload: PlaylistCreate, session: Session = Depends(get_session)):
    playlist = Playlist(name=_clean_name(payload.name), description=payload.description)
    session.add(playlist)
    session.commit()
    session.refresh(playlist)
    return _to_detail(playlist, session)


# ---------------------------------------------------------------------------
# READ (lista)
# ---------------------------------------------------------------------------
@router.get("/", response_model=list[PlaylistRead])
def list_playlists(session: Session = Depends(get_session)):
    playlists = session.exec(select(Playlist).order_by(Playlist.created_at, Playlist.id)).all()
    return [_to_read(p, len(p.items)) for p in playlists]


# ---------------------------------------------------------------------------
# READ (una, con sus items ordenados)
# ---------------------------------------------------------------------------
@router.get("/{playlist_id}", response_model=PlaylistDetail)
def get_playlist(playlist_id: int, session: Session = Depends(get_session)):
    return _to_detail(_get_playlist_or_404(playlist_id, session), session)


# ---------------------------------------------------------------------------
# UPDATE
# ---------------------------------------------------------------------------
@router.patch("/{playlist_id}", response_model=PlaylistDetail)
def update_playlist(
    playlist_id: int, payload: PlaylistUpdate, session: Session = Depends(get_session)
):
    playlist = _get_playlist_or_404(playlist_id, session)

    fields = payload.model_dump(exclude_unset=True)
    if "name" in fields:
        if fields["name"] is None:
            raise HTTPException(status_code=422, detail="El nombre no puede ser nulo")
        fields["name"] = _clean_name(fields["name"])
    for field, value in fields.items():
        setattr(playlist, field, value)

    session.add(playlist)
    session.commit()
    session.refresh(playlist)
    return _to_detail(playlist, session)


# ---------------------------------------------------------------------------
# DELETE (borra la playlist y sus items, nunca los Content)
# ---------------------------------------------------------------------------
@router.delete("/{playlist_id}", status_code=204)
def delete_playlist(playlist_id: int, session: Session = Depends(get_session)):
    playlist = _get_playlist_or_404(playlist_id, session)
    session.delete(playlist)
    session.commit()
    return None


# ---------------------------------------------------------------------------
# ITEMS: agregar / listar / mover / quitar
# ---------------------------------------------------------------------------
@router.post("/{playlist_id}/items", response_model=list[PlaylistItemRead], status_code=201)
def add_item(
    playlist_id: int, payload: PlaylistItemCreate, session: Session = Depends(get_session)
):
    _get_playlist_or_404(playlist_id, session)
    content = session.get(Content, payload.content_id)
    if content is None:
        raise HTTPException(status_code=404, detail="Contenido no encontrado")

    if session.get(PlaylistItem, (playlist_id, payload.content_id)) is not None:
        raise HTTPException(status_code=409, detail="El contenido ya está en esta playlist")

    items = _ordered_items(playlist_id, session)
    new_item = PlaylistItem(playlist_id=playlist_id, content_id=content.id, position=0)
    # Sin posición (o más allá del final) se agrega al final; si no, se inserta.
    index = len(items) if payload.position is None else min(payload.position - 1, len(items))
    items.insert(index, new_item)
    session.add(new_item)
    _renumber(items, session)
    session.commit()
    return _items_read(playlist_id, session)


@router.get("/{playlist_id}/items", response_model=list[PlaylistItemRead])
def list_items(playlist_id: int, session: Session = Depends(get_session)):
    _get_playlist_or_404(playlist_id, session)
    return _items_read(playlist_id, session)


@router.patch("/{playlist_id}/items/{content_id}", response_model=list[PlaylistItemRead])
def move_item(
    playlist_id: int,
    content_id: int,
    payload: PlaylistItemMove,
    session: Session = Depends(get_session),
):
    _get_playlist_or_404(playlist_id, session)
    item = _get_item_or_404(playlist_id, content_id, session)

    items = [i for i in _ordered_items(playlist_id, session) if i.content_id != content_id]
    items.insert(min(payload.position - 1, len(items)), item)
    _renumber(items, session)
    session.commit()
    return _items_read(playlist_id, session)


@router.delete("/{playlist_id}/items/{content_id}", status_code=204)
def remove_item(playlist_id: int, content_id: int, session: Session = Depends(get_session)):
    _get_playlist_or_404(playlist_id, session)
    item = _get_item_or_404(playlist_id, content_id, session)

    session.delete(item)
    session.flush()
    _renumber(_ordered_items(playlist_id, session), session)
    session.commit()
    return None
