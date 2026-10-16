"""Rebuild ZONE CLOCK v153 route-cost PNG from its versioned 512x512 road mask.

The road mask is a lossless, packed, merged extraction of /roads(1).png
(2048x2048, georegistration identical to the map), plus the original
v136 roads for backward compatibility. No user-uploaded source is required.
"""
from pathlib import Path
import base64, gzip
from PIL import Image

SIZE=512
assets=Path(__file__).resolve().parent.parent/'assets'
data=gzip.decompress(base64.b64decode((assets/'zone-road-red-mask-v153.txt').read_text().strip()))
assert len(data)==SIZE*SIZE//8
mask=[(data[i//8]>>(7-i%8))&1 for i in range(SIZE*SIZE)]
assert 10500<=sum(mask)<=11500
INF=100000
D=[0 if v else INF for v in mask]
for y in range(SIZE):
 for x in range(SIZE):
  i=y*SIZE+x;d=D[i]
  if x:d=min(d,D[i-1]+10)
  if y:
   d=min(d,D[i-SIZE]+10)
   if x:d=min(d,D[i-SIZE-1]+14)
   if x<SIZE-1:d=min(d,D[i-SIZE+1]+14)
  D[i]=d
for y in range(SIZE-1,-1,-1):
 for x in range(SIZE-1,-1,-1):
  i=y*SIZE+x;d=D[i]
  if x<SIZE-1:d=min(d,D[i+1]+10)
  if y<SIZE-1:
   d=min(d,D[i+SIZE]+10)
   if x:d=min(d,D[i+SIZE-1]+14)
   if x<SIZE-1:d=min(d,D[i+SIZE+1]+14)
  D[i]=d
cost=bytes(min(234,(v*234+25)//50) for v in D)
# Indexed PNG keeps the exact 14 grayscale cost values, with a smaller file.
levels=sorted(set(cost))
positions={value:idx for idx,value in enumerate(levels)}
image=Image.frombytes('P',(SIZE,SIZE),bytes(positions[v] for v in cost))
palette=[]
for idx in range(256):
    level=levels[idx] if idx<len(levels) else 0
    palette.extend((level,level,level))
image.putpalette(palette)
output=assets/'zone-road-cost-red-v153.png'
image.save(output,bits=8,optimize=True)
print(f'Built {output} ({sum(mask)} road cells)')
