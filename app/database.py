import os

from dotenv import load_dotenv
from sqlmodel import Session, SQLModel, create_engine

# Importar los modelos registra sus tablas en SQLModel.metadata
# para que create_db_and_tables() las cree.
from app import models  # noqa: F401

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./recap.db")

# check_same_thread=False es necesario para SQLite con FastAPI,
# ya que las peticiones pueden atenderse en distintos hilos.
engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})


def create_db_and_tables() -> None:
    """Crea el archivo de base de datos y todas las tablas registradas en SQLModel."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Dependencia de FastAPI: entrega una sesión de base de datos por petición."""
    with Session(engine) as session:
        yield session
