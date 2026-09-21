// Starts a Freepik Mystic text-to-image job.
// The API key lives only here, as a Netlify environment variable —
// it never reaches the browser.
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const apiKey = process.env.FREEPIK_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'FREEPIK_API_KEY is not set on this Netlify site.' })
    };
  }

  let input;
  try {
    input = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const {
    prompt,
    aspect_ratio = 'widescreen_16_9',
    resolution = '2k',
    realism = true,
    engine = 'automatic',
    creative_detailing = 33
  } = input;

  if (!prompt || !prompt.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'A prompt is required.' }) };
  }

  try {
    const res = await fetch('https://api.freepik.com/v1/ai/mystic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-freepik-api-key': apiKey
      },
      body: JSON.stringify({ prompt, aspect_ratio, resolution, realism, engine, creative_detailing })
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
