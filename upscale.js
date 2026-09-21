// Starts a Freepik Magnific upscale/enhance job for an image the user
// already has in the tool (sent up as a base64 data URL).
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const apiKey = process.env.FREEPIK_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'FREEPIK_API_KEY is not set on this Netlify site.' }) };
  }

  let input;
  try {
    input = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const {
    image,               // base64 (no data: prefix) or a publicly reachable https URL
    scale_factor = 2,
    engine = 'automatic',
    creativity = 0,
    hdr = 0,
    fractality = 0
  } = input;

  if (!image) {
    return { statusCode: 400, body: JSON.stringify({ error: 'An image (base64 or URL) is required.' }) };
  }

  try {
    const res = await fetch('https://api.freepik.com/v1/ai/image-upscaler', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-freepik-api-key': apiKey
      },
      body: JSON.stringify({ image, scale_factor, engine, creativity, hdr, fractality })
    });

    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }

    if (!res.ok) {
      return { statusCode: res.status, body: JSON.stringify({ error: 'Freepik API error', detail: json }) };
    }

    const taskId = json?.data?.task_id || json?.task_id;
    if (!taskId) {
      return { statusCode: 502, body: JSON.stringify({ error: 'No task_id in Freepik response', detail: json }) };
    }

    return { statusCode: 200, body: JSON.stringify({ task_id: taskId }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Request to Freepik failed', detail: String(err) }) };
  }
};
