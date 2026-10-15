from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.database import create_db_and_tables
from app.routers import bookmarks, content, tags


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


@app.get("/")
def read_root():
    return {"message": "Welcome to RECAP API"}
