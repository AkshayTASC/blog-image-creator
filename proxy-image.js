// Fetches a Freepik result image on the server and hands it back as a
// base64 data URL, so the browser can draw it on <canvas> without
// tainting it (which would block downloads/exports).
exports.handler = async (event) => {
  const url = event.queryStringParameters && event.queryStringParameters.url;
  if (!url || !/^https:\/\//.test(url)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'A valid https url query param is required.' }) };
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return { statusCode: res.status, body: JSON.stringify({ error: 'Could not fetch the image.' }) };
    }
    const contentType = res.headers.get('content-type') || 'image/png';
    const buf = Buffer.from(await res.arrayBuffer());
    return {
      statusCode: 200,
      body: JSON.stringify({ dataUrl: `data:${contentType};base64,${buf.toString('base64')}` })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Proxy fetch failed', detail: String(err) }) };
  }
};
