export default async function handler(req, res) {
  const url = req.query?.url;
  if (!url) {
    return res.status(400).json({ error: "missing url" });
  }

  try {
    const targetUrl = decodeURIComponent(url);
    const fetchOptions = {};
    
    // Forward Authorization header for Twitter API
    if (req.headers.authorization) {
      fetchOptions.headers = {
        Authorization: req.headers.authorization
      };
    }

    const response = await fetch(targetUrl, fetchOptions);
    const body = await response.text();
    
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", response.headers.get("content-type") || "text/plain");
    res.status(response.status).send(body);
  } catch (e) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(502).json({ error: "proxy error", detail: e.message });
  }
}
