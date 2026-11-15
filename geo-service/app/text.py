"""Text helpers: accent-insensitive normalisation and safe URL handling."""

from __future__ import annotations

import re
import unicodedata

_SEPARATORS = re.compile(r"[\s\-'’`_.,/]+")
# Only expand "st"/"ste" when another word follows, so typing "st" still finds Strasbourg.
_SAINT = re.compile(r"\b(st|ste) (?=\S)")


def normalize(value: str) -> str:
    """Lowercase, strip accents and punctuation so "Saint-Étienne" == "st etienne"."""
    decomposed = unicodedata.normalize("NFKD", value.casefold())
    without_marks = "".join(ch for ch in decomposed if not unicodedata.combining(ch))
    without_marks = without_marks.replace("œ", "oe").replace("æ", "ae")
    collapsed = _SEPARATORS.sub(" ", without_marks).strip()
    return _SAINT.sub(lambda m: "saint " if m.group(1) == "st" else "sainte ", collapsed)


def safe_url(value: object) -> str | None:
    """Return an http(s) URL or None. Prevents javascript:/data: links from data feeds."""
    if not isinstance(value, str):
        return None
    candidate = value.strip()
    if not candidate:
        return None
    if candidate.startswith("www."):
        candidate = "https://" + candidate
    lowered = candidate.lower()
    if not (lowered.startswith("http://") or lowered.startswith("https://")):
        return None
    if any(ch in candidate for ch in ("\n", "\r", " ", "<", ">", '"')):
        return None
    return candidate[:500]


def clean_text(value: object, limit: int = 600) -> str | None:
    if not isinstance(value, str):
        return None
    text = " ".join(value.split())
    if not text:
        return None
    if len(text) > limit:
        cut = text[:limit].rsplit(" ", 1)[0]
        return cut + "…"
    return text
