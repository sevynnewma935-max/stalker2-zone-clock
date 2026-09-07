const PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZrmQAAAAASUVORK5CYII=', 'base64');

function toNumber(value) {
  const normalized = String(value ?? '').trim().replace(',', '.');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : NaN;
}

function cleanThing(value) {
  return String(value || '').trim().replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 80);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const thing = cleanThing(req.query.thing);
  if (!thing) return res.status(400).json({ ok: false, error: 'thing required' });

  const params = new URLSearchParams();
  for (const key of ['x', 'y', 'z', 'yaw', 't']) {
    const raw = req.query[key];
    if (raw !== undefined && raw !== '') {
      const value = toNumber(raw);
      if (Number.isFinite(value)) params.set(key, String(value));
    }
  }
  if (!params.has('x') || !params.has('y')) return res.status(400).json({ ok: false, error: 'x/y required' });

  try {
    const upstream = await fetch(`https://dweet.cc/dweet/for/${encodeURIComponent(thing)}?${params.toString()}`, { cache: 'no-store' });
    if (!upstream.ok) throw new Error(`relay ${upstream.status}`);
  } catch (error) {
    console.error('live-pixel relay failed', error);
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Length', String(PIXEL.length));
  res.end(PIXEL);
};
