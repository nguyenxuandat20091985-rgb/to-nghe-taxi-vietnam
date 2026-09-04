const DEFAULT_ALLOWED_ORIGINS = [
  'https://to-nghe-taxi-vietnam.vercel.app',
  'https://to-nghe-taxi-vietnam.firebaseapp.com',
  'https://to-nghe-taxi.web.app',
  'https://nguyenxuandat20091985-rgb.github.io'
];

const SYSTEM_PROMPT = 'Bạn là AI tư vấn thân thiện tại Đền Tổ Nghề Taxi. Trả lời ngắn gọn, ấm áp bằng tiếng Việt, hỗ trợ tài xế về nghề nghiệp, an toàn giao thông, tâm lý, và lời khuyên bình an. Không đưa lời khuyên y tế, pháp lý hoặc tài chính chuyên sâu.';

function allowedOrigins() {
  const configured = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((value) => value.trim()).filter(Boolean)
    : [];
  return [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...configured])];
}

function setCors(res, origin) {
  if (origin && allowedOrigins().includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  setCors(res, origin);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
  if (origin && !allowedOrigins().includes(origin)) {
    return sendJson(res, 403, { error: 'Origin not allowed' });
  }
  if (!process.env.GROQ_API_KEY) return sendJson(res, 503, { error: 'AI service is not configured' });

  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!message || message.length > 2000) {
    return sendJson(res, 400, { error: 'Message must be between 1 and 2000 characters' });
  }

  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 600
      })
    });

    if (!upstream.ok) return sendJson(res, 502, { error: 'AI upstream request failed' });
    const data = await upstream.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) return sendJson(res, 502, { error: 'AI returned no response' });
    return sendJson(res, 200, { reply });
  } catch {
    return sendJson(res, 502, { error: 'AI service unavailable' });
  }
}
