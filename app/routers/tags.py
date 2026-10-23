from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.database import get_session
from app.models import Tag

router = APIRouter(prefix="/tags", tags=["tags"])


# ---------------------------------------------------------------------------
# Schemas de entrada / salida
# ---------------------------------------------------------------------------
# Color hexadecimal de 6 dígitos con "#", ej. "#a78bfa" (lo que entrega <input type="color">).
HEX_COLOR_PATTERN = r"^#[0-9a-fA-F]{6}$"


class TagCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    color: str | None = Field(default=None, pattern=HEX_COLOR_PATTERN)


class TagUpdate(BaseModel):
    # Ambos opcionales: se puede renombrar, cambiar el color, o las dos cosas.
    name: str | None = Field(default=None, min_length=1, max_length=50)
    color: str | None = Field(default=None, pattern=HEX_COLOR_PATTERN)


class TagRead(BaseModel):
    id: int
    name: str
    color: str | None = None


def _to_read(tag: Tag) -> TagRead:
    return TagRead(id=tag.id, name=tag.name, color=tag.color)


def _clean_name(name: str) -> str:
    """Quita espacios sobrantes y rechaza nombres que quedan vacíos."""
    cleaned = name.strip()
    if not cleaned:
        raise HTTPException(status_code=422, detail="El nombre del tag no puede estar vacío")
    return cleaned


def _ensure_name_available(session: Session, name: str, exclude_id: int | None = None) -> None:
    """Lanza 409 si ya existe otro tag con ese nombre (la columna es UNIQUE)."""
    query = select(Tag).where(Tag.name == name)
    if exclude_id is not None:
        query = query.where(Tag.id != exclude_id)
    if session.exec(query).first() is not None:
        raise HTTPException(status_code=409, detail="Ya existe un tag con ese nombre")


# ---------------------------------------------------------------------------
# CREATE
# ---------------------------------------------------------------------------
@router.post("/", response_model=TagRead, status_code=201)
def create_tag(payload: TagCreate, session: Session = Depends(get_session)):
    name = _clean_name(payload.name)
    _ensure_name_available(session, name)
    ##print(TagCreate)
    # El color se guarda en minúsculas para que siempre tenga el mismo formato.
    color = payload.color.lower() if payload.color else None
    tag = Tag(name=name, color=color)
    
    session.add(tag)
    session.commit()
    session.refresh(tag)
    return _to_read(tag)


# ---------------------------------------------------------------------------
# READ (lista)
# ---------------------------------------------------------------------------
@router.get("/", response_model=list[TagRead])
def list_tags(session: Session = Depends(get_session)):
    tags = session.exec(select(Tag).order_by(Tag.name)).all()
    return [_to_read(t) for t in tags]


# ---------------------------------------------------------------------------
# READ (uno)
# ---------------------------------------------------------------------------
@router.get("/{tag_id}", response_model=TagRead)
def get_tag(tag_id: int, session: Session = Depends(get_session)):
    tag = session.get(Tag, tag_id)
    if tag is None:
        raise HTTPException(status_code=404, detail="Tag no encontrado")
    return _to_read(tag)


# ---------------------------------------------------------------------------
# UPDATE
# ---------------------------------------------------------------------------
@router.patch("/{tag_id}", response_model=TagRead)
def update_tag(tag_id: int, payload: TagUpdate, session: Session = Depends(get_session)):
    tag = session.get(Tag, tag_id)
    if tag is None:
        raise HTTPException(status_code=404, detail="Tag no encontrado")

    # model_fields_set = solo los campos que el cliente envió realmente.
    # Así "no mandó color" (se deja igual) se distingue de "color": null (se borra).
    sent = payload.model_fields_set

    if "name" in sent:
        if payload.name is None:
            raise HTTPException(status_code=422, detail="El nombre del tag no puede ser null")
        name = _clean_name(payload.name)
        _ensure_name_available(session, name, exclude_id=tag_id)
        tag.name = name

    if "color" in sent:
        tag.color = payload.color.lower() if payload.color else None

    session.add(tag)
    session.commit()
    session.refresh(tag)
    return _to_read(tag)


# ---------------------------------------------------------------------------
# DELETE
# ---------------------------------------------------------------------------
@router.delete("/{tag_id}", status_code=204)
def delete_tag(tag_id: int, session: Session = Depends(get_session)):
    tag = session.get(Tag, tag_id)
    if tag is None:
        raise HTTPException(status_code=404, detail="Tag no encontrado")
    # Al borrar el tag, SQLModel también borra sus filas en content_tag
    # (la relación many-to-many lo gestiona). Los contenidos no se tocan.
    session.delete(tag)
    session.commit()
    return None
