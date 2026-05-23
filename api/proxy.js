export default async function handler(req, res) {
  const url = req.query?.url;
  if (!url) {
    return res.status(400).json({ ok: false, error: "no url" });
  }
  try {
    const r = await fetch(decodeURIComponent(url));
    const text = await r.text();
    res.status(200).send(text);
  } catch(e) {
    res.status(500).json({ ok: false, err: e.message });
  }
}
