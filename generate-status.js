// Polls a Freepik Mystic job until it's done.
exports.handler = async (event) => {
  const apiKey = process.env.FREEPIK_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'FREEPIK_API_KEY is not set on this Netlify site.' }) };
  }

  const taskId = event.queryStringParameters && event.queryStringParameters.task_id;
  if (!taskId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'task_id query param is required.' }) };
  }

  try {
    const res = await fetch(`https://api.freepik.com/v1/ai/mystic/${encodeURIComponent(taskId)}`, {
      headers: { 'Accept': 'application/json', 'x-freepik-api-key': apiKey }
    });

    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }

    if (!res.ok) {
      return { statusCode: res.status, body: JSON.stringify({ error: 'Freepik API error', detail: json }) };
    }

    const data = json?.data || json;
    const status = (data.status || '').toUpperCase();
    const images = data.generated || data.images || [];

    return {
      statusCode: 200,
      body: JSON.stringify({
        status,
        done: status === 'COMPLETED' || status === 'DONE' || status === 'SUCCEEDED',
        failed: status === 'FAILED' || status === 'ERROR',
        images
      })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Request to Freepik failed', detail: String(err) }) };
  }
};
