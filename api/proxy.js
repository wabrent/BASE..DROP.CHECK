export default async function handler(req, res) {
  const url = req.query?.url;
  if (!url) return res.status(400).json({ ok: false, error: "no url" });

  try {
    const headers = {};
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }
    const r = await fetch(decodeURIComponent(url), { headers });
    const text = await r.text();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(text);
  } catch(e) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(500).json({ ok: false, err: e.message });
  }
}
