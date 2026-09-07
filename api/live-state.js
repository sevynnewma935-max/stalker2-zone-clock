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

  try {
    const upstream = await fetch(`https://dweet.cc/get/latest/dweet/for/${encodeURIComponent(thing)}?t=${Date.now()}`, { cache: 'no-store' });
    if (!upstream.ok) return res.status(502).json({ ok: false, error: `relay ${upstream.status}` });
    const body = await upstream.json();
    const envelope = Array.isArray(body?.with) ? body.with[0] : body?.with || body;
    const content = envelope?.content || envelope?.with?.content || envelope || {};
    const created = envelope?.created || body?.created || null;
    const x = toNumber(content.x), y = toNumber(content.y), z = toNumber(content.z), yaw = toNumber(content.yaw);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return res.status(404).json({ ok: false, error: 'no live coordinates' });
    return res.status(200).json({ ok: true, thing, x, y, z: Number.isFinite(z) ? z : 0, yaw: Number.isFinite(yaw) ? yaw : 0, created });
  } catch (error) {
    return res.status(502).json({ ok: false, error: error?.message || 'relay unavailable' });
  }
};
