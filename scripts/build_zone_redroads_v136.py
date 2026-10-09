"""Build the Zone Clock red-road cost raster from a user-supplied route overlay.

Source: roads.png (2048 x 2048), red roads extracted/downsampled to
a 512 x 512 packed binary mask in assets/zone-road-red-mask-v136.txt.
No third-party Python packages are required.
"""
from pathlib import Path
import base64
import lzma
import struct
import zlib

SIZE = 512
SOURCE = Path('assets/zone-road-red-mask-v136.txt')
DEST = Path('assets/zone-road-cost-red-v136.png')

packed = lzma.decompress(base64.b64decode(SOURCE.read_text(encoding='ascii').strip()))
assert len(packed) == SIZE * SIZE // 8, f'Invalid road mask: {len(packed)} bytes'

road = bytearray(SIZE * SIZE)
for i in range(len(road)):
    road[i] = (packed[i >> 3] >> (7 - (i & 7))) & 1
assert 7500 <= sum(road) <= 8500, f'Unexpected number of road pixels: {sum(road)}'

# Eight-neighbor chamfer distance (10=one horizontal cell, 14=diagonal).
# Off-road travel remains possible but incurs a strong routing penalty.
INF = 100000
D = [0 if value else INF for value in road]
for y in range(SIZE):
    offset = y * SIZE
    for x in range(SIZE):
        i = offset + x
        d = D[i]
        if x:
            d = min(d, D[i - 1] + 10)
        if y:
            d = min(d, D[i - SIZE] + 10)
            if x:
                d = min(d, D[i - SIZE - 1] + 14)
            if x < SIZE - 1:
                d = min(d, D[i - SIZE + 1] + 14)
        D[i] = d
for y in range(SIZE - 1, -1, -1):
    offset = y * SIZE
    for x in range(SIZE - 1, -1, -1):
        i = offset + x
        d = D[i]
        if x < SIZE - 1:
            d = min(d, D[i + 1] + 10)
        if y < SIZE - 1:
            d = min(d, D[i + SIZE] + 10)
            if x:
                d = min(d, D[i + SIZE - 1] + 14)
            if x < SIZE - 1:
                d = min(d, D[i + SIZE + 1] + 14)
        D[i] = d

# R=0 on the red roads => minimum cost in the existing A* planner.
# R=234 on distant terrain => high but passable cost.
cost = bytes(min(234, (v * 234 + 25) // 50) for v in D)

def chunk(typ, data):
    payload = typ + data
    return (
        struct.pack('>I', len(data)) + payload +
        struct.pack('>I', zlib.crc32(payload) & 0xffffffff)
    )

png = b'\x89PNG\r\n\x1a\n'
png += chunk(b'IHDR', struct.pack('>IIBBBBB', SIZE, SIZE, 8, 0, 0, 0, 0))
raw = b''.join(
    b'\x00' + cost[row * SIZE:(row + 1) * SIZE]
    for row in range(SIZE)
)
png += chunk(b'IDAT', zlib.compress(raw, 9))
png += chunk(b'IEND', b'')
DEST.write_bytes(png)
print(f'Built {DEST}: {len(png)} bytes; road cells={sum(road)}')

def replace_once(data, old, new, label):
    matches = data.count(old)
    if matches != 1:
        raise SystemExit(f'{label}: expected 1 replacement, found {matches}')
    return data.replace(old, new)

app = Path('app.js')
code = app.read_text(encoding='utf-8')
code = replace_once(
    code,
    "'./assets/zone-road-cost-512.png';",
    "'./assets/zone-road-cost-red-v136.png';",
    'road cost asset'
)
# Rebuild stored road routes with the new model, without removing waypoints.
code = replace_once(
    code,
    '  loadRoadPlannerState();\n  updateRoadPlannerUI();',
    '''  loadRoadPlannerState();
  // PWA v136: invalidate old geometry; preserve the user-selected stops.
  if (mapRoadPlannerSequence.length >= 2) {
    mapRoadPlannerRoutePoints = [];
    mapRoadPlannerMeters = 0;
    requestRoadPlannerAutoBuild();
  }
  updateRoadPlannerUI();''',
    'rebuild saved route'
)
app.write_text(code, encoding='utf-8')

swpath = Path('service-worker.js')
sw = swpath.read_text(encoding='utf-8')
sw = replace_once(sw, 'stalker2-zone-clock-app-v135', 'stalker2-zone-clock-app-v136', 'app cache')
sw = replace_once(sw, 'stalker2-zone-clock-map-v135', 'stalker2-zone-clock-map-v136', 'map cache')
if sw.count("./assets/zone-road-cost-512.png") != 2:
    raise SystemExit('Unexpected service worker road asset entries')
sw = sw.replace("./assets/zone-road-cost-512.png", "./assets/zone-road-cost-red-v136.png")
swpath.write_text(sw, encoding='utf-8')

index = Path('index.html')
html = index.read_text(encoding='utf-8')
html = replace_once(html, 'ZONE CLOCK <strong>v1.35</strong>', 'ZONE CLOCK <strong>v1.36</strong>', 'visible version')
index.write_text(html, encoding='utf-8')

readme = Path('README.txt')
with readme.open('a', encoding='utf-8') as out:
    out.write("""
\nВерсия 136:
- для прокладки маршрутов по местоположениям и артефактам используются красные дороги из пользовательской карты roads.png;
- построена отдельная дорожная модель 512x512 с предпочтением красных линий и короткими подходами вне сети;
- сохраненные точки маршрута сохраняются, прежние рассчитанные дорожные линии перестраиваются;
- исходная битовая маска дорог сохранена в assets/zone-road-red-mask-v136.txt;
- офлайн-кэш повышен до v136.
""")
