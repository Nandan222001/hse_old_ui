"""Where uploaded evidence photos live.

Files go to disk under `backend/uploads/<subdir>/`, and what gets stored on the
record is the URL path, not the bytes. Two reasons: `evidence_json` is a JSON
column read by the mobile app and the website, so a base64 blob there would bloat
every row and every list query that selects it; and a path can be served
directly by the static mount without loading the image into Python.

Deliberately local-disk rather than S3/Azure: nothing else in this codebase talks
to object storage yet, and adding a cloud dependency for a feature the client has
not asked to host remotely would be a bigger decision than this change warrants.
The one function below is the seam to change if that day comes.
"""
from __future__ import annotations

import logging
import re
import uuid
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# backend/uploads — sibling of app/, outside the package so a redeploy that
# replaces the code does not wipe the evidence.
UPLOAD_ROOT = Path(__file__).resolve().parent.parent.parent / "uploads"

# The public prefix the static mount serves these under.
URL_PREFIX = "/uploads"

# Evidence photos and videos.
ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/heic": ".heic",
    "image/heif": ".heif",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "video/quicktime": ".mov",
    "video/webm": ".webm",
    "video/3gpp": ".3gp",
    "video/mpeg": ".mpeg",
    "video/x-msvideo": ".avi",
}

MAX_BYTES = 100 * 1024 * 1024  # 100 MB — accommodates video recordings


class MediaRejected(ValueError):
    """The upload was refused. The caller turns this into a 400."""


# CAPA evidence is not only photographs. A procedure change is evidenced by the
# revised document, a training action by the training record, a test by its
# report — so the document formats are allowed alongside the media ones, and
# only for that upload path. Deliberately no archives and nothing executable:
# the allow-list is the whole defence, so it stays boring.
DOCUMENT_CONTENT_TYPES = {
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "text/csv": ".csv",
    "text/plain": ".txt",
}

EVIDENCE_CONTENT_TYPES = {**ALLOWED_CONTENT_TYPES, **DOCUMENT_CONTENT_TYPES}


def _safe_extension(
    filename: Optional[str],
    content_type: Optional[str],
    allowed: Optional[dict] = None,
) -> str:
    """Pick the extension from the declared type, never from the filename.

    The filename arrives from the device and is attacker-controlled in the
    general case; deriving the extension from it is how you end up writing
    `evidence.php`. The content type is checked against a fixed allow-list, so
    the extension can only ever be one of a handful of known-safe values.
    """
    allowed = allowed if allowed is not None else ALLOWED_CONTENT_TYPES
    if content_type:
        ext = allowed.get(content_type.split(";")[0].strip().lower())
        if ext:
            return ext
    # Fall back to the filename's suffix only if it is itself on the allow-list.
    if filename:
        suffix = Path(filename).suffix.lower()
        if suffix in set(allowed.values()):
            return suffix
    raise MediaRejected(
        f"Unsupported media type '{content_type or filename or 'unknown'}'. "
        f"Allowed: {', '.join(sorted(set(allowed)))}"
    )


def save_image(
    content: bytes,
    filename: Optional[str],
    content_type: Optional[str],
    subdir: str = "incidents",
    allowed_types: Optional[dict] = None,
) -> str:
    """Write one media file and return the URL path to store on the record.

    The stored name is a fresh uuid: the device's filename is discarded entirely,
    so two workers photographing/videoing the same thing cannot collide and nothing
    user-supplied reaches the filesystem.

    `allowed_types` widens the allow-list for callers that legitimately accept
    more than photos — CAPA evidence, which includes documents. It defaults to
    the media-only list, so no existing caller changes behaviour.
    """
    if not content:
        raise MediaRejected("Empty file")
    if len(content) > MAX_BYTES:
        raise MediaRejected(
            f"File is {len(content) // (1024 * 1024)} MB; the limit is {MAX_BYTES // (1024 * 1024)} MB"
        )

    ext = _safe_extension(filename, content_type, allowed_types)

    # Constrain the subdir to a plain word so a caller can never traverse out of
    # UPLOAD_ROOT with something like "../../etc".
    safe_subdir = re.sub(r"[^a-z0-9_]", "", (subdir or "misc").lower()) or "misc"

    target_dir = UPLOAD_ROOT / safe_subdir
    target_dir.mkdir(parents=True, exist_ok=True)

    name = f"{uuid.uuid4().hex}{ext}"
    (target_dir / name).write_bytes(content)

    url = f"{URL_PREFIX}/{safe_subdir}/{name}"
    logger.info("Stored evidence media %s (%s bytes)", url, len(content))
    return url
