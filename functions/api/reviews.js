const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
});

export async function onRequestGet({ env }) {
  try {
    const result = await env.REVIEWS_DB.prepare('SELECT author, text FROM reviews ORDER BY id DESC LIMIT 50').all();
    return json(result.results);
  } catch { return json({ error: 'Unavailable' }, 503); }
}

export async function onRequestPost({ request, env }) {
  try {
    if (request.headers.get('Origin') !== new URL(request.url).origin) return json({ error: 'Forbidden' }, 403);
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({ error: 'Invalid request' }, 415);
    if (Number(request.headers.get('Content-Length') || 0) > 4096) return json({ error: 'Too large' }, 413);
    const raw = await request.text();
    if (raw.length > 4096) return json({ error: 'Too large' }, 413);
    const body = JSON.parse(raw);
    const author = typeof body.author === 'string' ? body.author.trim() : '';
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!author || author.length > 80 || !text || text.length > 1000) return json({ error: 'Invalid fields' }, 400);
    const result = await env.REVIEWS_DB.prepare("INSERT INTO reviews (author, text) SELECT ?, ? WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE created_at > datetime('now', '-10 seconds'))").bind(author, text).run();
    if (!result.meta.changes) return json({ error: 'Please wait' }, 429);
    return json({ ok: true }, 201);
  } catch { return json({ error: 'Unavailable' }, 503); }
}
