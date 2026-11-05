"""Convierte las portadas de playlists al formato acordado: uploads/playlist-covers/{id}.jpg

Uso (desde la carpeta RECAP_PROJECT):
    .\\.venv\\Scripts\\python.exe scripts\\convert_playlist_covers.py

Qué hace:
- Busca imágenes (png, jpg, jpeg, webp) en uploads/playlist-covers/ y en su subcarpeta originals/.
- El nombre del archivo debe ser el id de la playlist (ej. 3.png -> 3.jpg).
- Si ya existe {id}.jpg, esa imagen se omite (no se sobrescribe).
- Las imágenes que estén sueltas en playlist-covers/ se mueven a originals/ después de convertirlas.
"""
from pathlib import Path

from PIL import Image

# Carpeta de portadas: RECAP_PROJECT/uploads/playlist-covers
COVERS_DIR = Path(__file__).resolve().parents[1] / "uploads" / "playlist-covers"
ORIGINALS_DIR = COVERS_DIR / "originals"

EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
JPEG_QUALITY = 85


def to_rgb(img: Image.Image) -> Image.Image:
    """JPEG no admite transparencia: se aplana sobre fondo blanco."""
    if img.mode in ("RGBA", "LA", "P"):
        rgba = img.convert("RGBA")
        fondo = Image.new("RGB", rgba.size, (255, 255, 255))
        fondo.paste(rgba, mask=rgba.getchannel("A"))
        return fondo
    return img.convert("RGB")


def main() -> None:
    COVERS_DIR.mkdir(parents=True, exist_ok=True)
    ORIGINALS_DIR.mkdir(exist_ok=True)

    # Imágenes sueltas en playlist-covers/ y las guardadas en originals/
    sources = [
        path
        for folder in (COVERS_DIR, ORIGINALS_DIR)
        for path in sorted(folder.iterdir())
        if path.is_file() and path.suffix.lower() in EXTENSIONS
    ]

    converted = 0
    for source in sources:
        in_originals = source.parent == ORIGINALS_DIR
        target = COVERS_DIR / f"{source.stem}.jpg"

        # El nombre tiene que ser el id de la playlist
        if not source.stem.isdigit():
            print(f"OMITIDA  {source.name}: el nombre debe ser el id de la playlist (ej. 3.png)")
            continue

        # Un .jpg suelto en la carpeta ya está en el formato final
        if source == target:
            continue

        if target.exists():
            print(f"OMITIDA  {source.name}: ya existe {target.name}")
            continue

        img = to_rgb(Image.open(source))
        img.save(target, "JPEG", quality=JPEG_QUALITY)
        converted += 1
        print(f"OK       {source.name} -> {target.name} ({img.width}x{img.height}, {target.stat().st_size // 1024} KB)")

        # Las que estaban sueltas pasan a originals/ para no perderlas
        if not in_originals:
            destination = ORIGINALS_DIR / source.name
            if destination.exists():
                print(f"AVISO    {source.name}: ya hay un original con ese nombre, se deja donde está")
            else:
                source.replace(destination)

    print(f"\nListo: {converted} imagen(es) convertida(s).")


if __name__ == "__main__":
    main()
