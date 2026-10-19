from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

from fastapi import FastAPI

from app.database import create_db_and_tables
from app.routers import bookmarks, content, tags

# Configura los orígenes permitidos
origins = [
    "http://localhost:5173", # Tu frontend de Vite/React/Vue
]



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: crear la base de datos y las tablas
    create_db_and_tables()
    yield
    # Shutdown: cleanup si hiciera falta


app = FastAPI(title="RECAP API", lifespan=lifespan)

app.include_router(content.router)
app.include_router(tags.router)
app.include_router(bookmarks.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Permite todos los métodos (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"], # Permite todas las cabeceras
)


@app.get("/")
def read_root():
    return {"message": "Welcome to RECAP API"}
