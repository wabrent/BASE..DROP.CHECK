export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Auth-Token");
    return res.status(204).end();
  }

  const url = req.query?.url;
  if (!url) return res.status(400).json({ ok: false, error: "no url" });

  try {
    const headers = {};
    // Check both Authorization header and X-Auth-Token query param
    const auth = req.headers.authorization || req.query?.auth;
    if (auth) headers.Authorization = auth.startsWith("Bearer ") ? auth : "Bearer " + auth;

    const r = await fetch(decodeURIComponent(url), { headers });
    const text = await r.text();
    const ct = r.headers.get("content-type") || "text/plain";
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", ct);
    res.status(r.status).send(text);
  } catch(e) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(502).json({ ok: false, err: e.message });
  }
}
