export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "missing url" });

  try {
    const headers = {};
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }
    const r = await fetch(decodeURIComponent(url), { headers });
    const body = await r.text();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).send(body);
  } catch(e) {
    res.status(502).json({ error: "proxy error", detail: e.message });
  }
}
