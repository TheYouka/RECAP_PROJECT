from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------
class ContentType(str, Enum):
    movie = "movie"
    music = "music"


class ContentStatus(str, Enum):
    watching = "watching"
    completed = "completed"
    paused = "paused"
    plan_to_watch = "plan_to_watch"


class RecapSource(str, Enum):
    manual = "manual"
    ia = "ia"


# ---------------------------------------------------------------------------
# Tabla intermedia N:M entre Content y Tag
# ---------------------------------------------------------------------------
class ContentTag(SQLModel, table=True):
    __tablename__ = "content_tag"

    content_id: Optional[int] = Field(
        default=None, foreign_key="content.id", primary_key=True
    )
    tag_id: Optional[int] = Field(
        default=None, foreign_key="tag.id", primary_key=True
    )


# ---------------------------------------------------------------------------
# Content (tabla genérica)
# ---------------------------------------------------------------------------
class Content(SQLModel, table=True):
    __tablename__ = "content"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    type: ContentType
    status: ContentStatus
    synopsis: Optional[str] = None
    cover_url: Optional[str] = None
    external_id: Optional[str] = None
    rating: Optional[int] = Field(default=None, ge=1, le=10)
    external_link: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relaciones
    movie: Optional["Movie"] = Relationship(
        back_populates="content",
        sa_relationship_kwargs={"uselist": False, "cascade": "all, delete-orphan"},
    )
    album: Optional["Album"] = Relationship(
        back_populates="content",
        sa_relationship_kwargs={"uselist": False, "cascade": "all, delete-orphan"},
    )
    bookmark: Optional["Bookmark"] = Relationship(
        back_populates="content",
        sa_relationship_kwargs={"uselist": False, "cascade": "all, delete-orphan"},
    )
    tags: list["Tag"] = Relationship(
        back_populates="contents", link_model=ContentTag
    )
    # Borrar un Content quita sus PlaylistItem (no borra las Playlist).
    playlist_items: list["PlaylistItem"] = Relationship(
        back_populates="content",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


# ---------------------------------------------------------------------------
# Movie (extensión 1:1 de Content, solo si type="movie")
# ---------------------------------------------------------------------------
class Movie(SQLModel, table=True):
    __tablename__ = "movie"

    content_id: Optional[int] = Field(
        default=None, foreign_key="content.id", primary_key=True
    )
    duration_minutes: int
    release_year: Optional[int] = None
    director: Optional[str] = None

    content: Optional[Content] = Relationship(back_populates="movie")


# ---------------------------------------------------------------------------
# Album (extensión 1:1 de Content, solo si type="music")
# ---------------------------------------------------------------------------
class Album(SQLModel, table=True):
    __tablename__ = "album"

    content_id: Optional[int] = Field(
        default=None, foreign_key="content.id", primary_key=True
    )
    artist: str
    release_year: Optional[int] = None
    total_tracks: Optional[int] = None

    content: Optional[Content] = Relationship(back_populates="album")


# ---------------------------------------------------------------------------
# Tag
# ---------------------------------------------------------------------------
class Tag(SQLModel, table=True):
    __tablename__ = "tag"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    # Color en hexadecimal "#rrggbb" (ej. "#a78bfa"). None = tag sin color.
    # Columna agregada con ALTER TABLE, por eso es opcional.
    color: Optional[str] = None
    
    contents: list[Content] = Relationship(
        back_populates="tags", link_model=ContentTag
    )


# ---------------------------------------------------------------------------
# Bookmark (separador + recap, 1:1 con Content)
# ---------------------------------------------------------------------------
class Bookmark(SQLModel, table=True):
    __tablename__ = "bookmark"

    content_id: Optional[int] = Field(
        default=None, foreign_key="content.id", primary_key=True
    )
    position: str
    recap_text: Optional[str] = None
    recap_source: RecapSource = RecapSource.manual
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    content: Optional[Content] = Relationship(back_populates="bookmark")


# ---------------------------------------------------------------------------
# Playlist (lista ordenada de contenido definida por el usuario)
# ---------------------------------------------------------------------------
class Playlist(SQLModel, table=True):
    __tablename__ = "playlist"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Borrar una Playlist borra sus PlaylistItem, no los Content.
    items: list["PlaylistItem"] = Relationship(
        back_populates="playlist",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


# ---------------------------------------------------------------------------
# PlaylistItem (tabla puente N:M entre Playlist y Content, con orden)
# ---------------------------------------------------------------------------
class PlaylistItem(SQLModel, table=True):
    __tablename__ = "playlist_item"

    playlist_id: Optional[int] = Field(
        default=None, foreign_key="playlist.id", primary_key=True
    )
    content_id: Optional[int] = Field(
        default=None, foreign_key="content.id", primary_key=True
    )
    position: int
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    playlist: Optional[Playlist] = Relationship(back_populates="items")
    content: Optional[Content] = Relationship(back_populates="playlist_items")
