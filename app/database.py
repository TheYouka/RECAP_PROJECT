import os

from dotenv import load_dotenv
from sqlmodel import Session, SQLModel, create_engine, select

# Importar los modelos registra sus tablas en SQLModel.metadata
# para que create_db_and_tables() las cree.
from app import models  # noqa: F401

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./recap.db")

# check_same_thread=False es necesario para SQLite con FastAPI,
# ya que las peticiones pueden atenderse en distintos hilos.
engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})


# Playlists que siempre deben existir (arrancan vacías).
DEFAULT_PLAYLISTS = ["Watchlater", "Vistas", "Viendo", "Recien añadidas"]


def create_default_playlists() -> None:
    """Crea las playlists por defecto que aún no existan (idempotente, por nombre)."""
    with Session(engine) as session:
        existing = set(session.exec(select(models.Playlist.name)).all())
        for name in DEFAULT_PLAYLISTS:
            if name not in existing:
                session.add(models.Playlist(name=name))
        session.commit()


def create_db_and_tables() -> None:
    """Crea el archivo de base de datos, las tablas y las playlists por defecto."""
    SQLModel.metadata.create_all(engine)
    create_default_playlists()


def get_session():
    """Dependencia de FastAPI: entrega una sesión de base de datos por petición."""
    with Session(engine) as session:
        yield session
