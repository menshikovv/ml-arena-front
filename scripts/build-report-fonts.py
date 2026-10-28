"""Build PDF fonts from the site subsets. Requires fonttools and brotli."""
from io import BytesIO
from pathlib import Path

from fontTools.merge import Merger
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

root = Path(__file__).resolve().parents[1] / "public" / "fonts"
for style, weight in [("Regular", 400), ("Bold", 800)]:
    subsets = []
    for language in ["latin", "cyrillic"]:
        font = TTFont(root / f"science-gothic-{language}.woff2")
        font = instantiateVariableFont(font, {"wght": weight}, inplace=True)
        font.flavor = None
        stream = BytesIO()
        font.save(stream)
        stream.seek(0)
        subsets.append(stream)
    merged = Merger().merge(subsets)
    merged.save(root / f"ScienceGothic-Report-{style}.ttf")
    print(style, len(merged.getBestCmap()), "characters")
