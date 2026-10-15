# RECAP Project

Personal content management system for movies and albums with tagging and bookmarking capabilities.

## Features

- **Content Management (RF-01)**: CRUD operations for movies and albums
- **Tagging System (RF-02)**: Create, assign, and remove tags from content
- **Bookmarks (RF-03)**: Save favorite content with notes
- **AI Integration (RF-04)**: Placeholder for AI-powered recommendations

## Tech Stack

- FastAPI
- SQLModel (SQLAlchemy + Pydantic)
- SQLite

## Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Running the Application

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Environment Variables

Create a `.env` file in the project root:

```
DATABASE_URL=sqlite:///./recap.db
```

## Project Structure

```
RECAP_PROJECT/
├── app/
│   ├── __init__.py
│   ├── main.py           → FastAPI + lifespan + routers
│   ├── database.py       → SQLite engine and session
│   ├── models.py         → SQLModel entities
│   ├── routers/
│   │   ├── content.py    → Content CRUD
│   │   ├── tags.py       → Tags CRUD + assignment
│   │   └── bookmarks.py  → Bookmarks CRUD
│   └── services/
│       └── recap_ai.py   → AI placeholder
├── tests/
│   └── test_content.py
├── .env
├── requirements.txt
└── README.md
```