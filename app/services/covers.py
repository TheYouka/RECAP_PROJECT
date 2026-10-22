"""Procesado y almacenamiento local de portadas (miniatura + original en JPEG)."""
import os
import re
import uuid
import warnings
from io import BytesIO
from pathlib import Path

from dotenv import load_dotenv
from fastapi import HTTPException, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError

load_dotenv()

# Raíz del proyecto (carpeta que contiene app/)
PROJECT_ROOT = Path(__file__).resolve().parents[2]

# Raíz de uploads: configurable con UPLOADS_DIR; si es relativa, cuelga de la raíz del proyecto.
UPLOADS_DIR = Path(os.getenv("UPLOADS_DIR", "uploads"))
if not UPLOADS_DIR.is_absolute():
    UPLOADS_DIR = PROJECT_ROOT / UPLOADS_DIR
UPLOADS_DIR = UPLOADS_DIR.resolve()

COVERS_DIR = UPLOADS_DIR / "covers"  # miniaturas (las que sirve la UI)
ORIGINALS_DIR = COVERS_DIR / "originals"  # originales recodificados a JPEG

# Prefijo público con el que se guarda cover_url en la BD
COVER_URL_PREFIX = "/uploads/covers/"

MAX_BYTES = 5 * 1024 * 1024  # 5 MB
THUMB_MAX_WIDTH = 400
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}

# Límite de píxeles contra decompression bombs (Pillow avisa al superarlo
# y lanza error al superar el doble).
Image.MAX_IMAGE_PIXELS = 50_000_000

# Los nombres que generamos son siempre uuid4().hex + ".jpg"
_SAFE_NAME = re.compile(r"^[0-9a-f]{32}\.jpg$")


def ensure_upload_dirs() -> None:
    """Crea las carpetas de uploads si faltan (se llama al arrancar)."""
    ORIGINALS_DIR.mkdir(parents=True, exist_ok=True)


def _read_limited(upload: UploadFile) -> bytes:
    """Lee el archivo con tope: nunca carga más de MAX_BYTES + 1 bytes."""
    data = upload.file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="La imagen supera el máximo de 5 MB")
    return data


def _open_and_validate(data: bytes) -> Image.Image:
    """Abre la imagen con Pillow (no se confía en nombre ni Content-Type) y la decodifica."""
    try:
        # Convertimos el aviso de bomba en error para rechazar imágenes enormes
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            img = Image.open(BytesIO(data))
            fmt = img.format
            if fmt not in ALLOWED_FORMATS:
                raise HTTPException(
                    status_code=415, detail="Formato no soportado: solo JPEG, PNG o WebP"
                )
            img.load()  # decodifica todo para detectar archivos corruptos
    except HTTPException:
        raise
    except (Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise HTTPException(status_code=422, detail="La imagen tiene demasiados píxeles")
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError):
        raise HTTPException(
            status_code=415, detail="El archivo no es una imagen válida (JPEG, PNG o WebP)"
        )
    return img


def _to_rgb(img: Image.Image) -> Image.Image:
    """Corrige la orientación EXIF y aplana la transparencia sobre fondo blanco."""
    img = ImageOps.exif_transpose(img)
    if img.mode in ("RGBA", "LA", "PA", "P"):
        rgba = img.convert("RGBA")
        fondo = Image.new("RGB", rgba.size, (255, 255, 255))
        fondo.paste(rgba, mask=rgba.getchannel("A"))
        return fondo
    return img.convert("RGB")


def save_cover(upload: UploadFile) -> tuple[str, list[Path]]:
    """Valida y guarda miniatura + original.

    Devuelve (cover_url, archivos_escritos). Si algo falla a mitad,
    borra lo ya escrito y relanza el error (sin archivos huérfanos).
    """
    data = _read_limited(upload)
    img = _to_rgb(_open_and_validate(data))

    # El nombre sale de un uuid, nunca del nombre que manda el usuario
    name = f"{uuid.uuid4().hex}.jpg"
    original_path = ORIGINALS_DIR / name
    thumb_path = COVERS_DIR / name
    written: list[Path] = []

    try:
        ensure_upload_dirs()

        # Original: tamaño completo, JPEG calidad 95
        img.save(original_path, "JPEG", quality=95)
        written.append(original_path)

        # Miniatura: máx. 400 px de ancho manteniendo proporción, JPEG calidad 85
        thumb = img
        if img.width > THUMB_MAX_WIDTH:
            height = max(1, round(img.height * THUMB_MAX_WIDTH / img.width))
            thumb = img.resize((THUMB_MAX_WIDTH, height), Image.LANCZOS)
        thumb.save(thumb_path, "JPEG", quality=85)
        written.append(thumb_path)
    except Exception:
        delete_files(written)
        raise

    return COVER_URL_PREFIX + name, written


def delete_files(paths: list[Path]) -> None:
    """Borra archivos ignorando los que no existan."""
    for path in paths:
        try:
            path.unlink(missing_ok=True)
        except OSError:
            pass


def delete_cover_files(cover_url: str | None) -> None:
    """Borra miniatura y original de una portada LOCAL. Ignora URLs externas."""
    if not cover_url or not cover_url.startswith("/uploads/"):
        return

    # Solo usamos el nombre final: así '../' no puede sacarnos de la carpeta
    name = Path(cover_url).name
    if not _SAFE_NAME.match(name):
        return

    for folder in (COVERS_DIR, ORIGINALS_DIR):
        path = (folder / name).resolve()
        # Defensa extra: la ruta resuelta debe seguir dentro de su carpeta
        if path.parent == folder.resolve():
            delete_files([path])
