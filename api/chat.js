const DEFAULT_ALLOWED_ORIGINS = [
  'https://to-nghe-taxi-vietnam.vercel.app',
  'https://to-nghe-taxi-vietnam.firebaseapp.com',
  'https://to-nghe-taxi.web.app',
  'https://nguyenxuandat20091985-rgb.github.io'
];

// Keep the model fixed in production so a stale GROQ_MODEL environment
// variable cannot silently select a retired/unsupported model.
const GROQ_MODEL = 'openai/gpt-oss-120b';
const SYSTEM_PROMPT = 'Bạn là AI tư vấn thân thiện tại Đền Tổ Nghề Taxi. Trả lời ngắn gọn, ấm áp bằng tiếng Việt, hỗ trợ tài xế về nghề nghiệp, an toàn giao thông, tâm lý, và lời khuyên bình an. Không đưa lời khuyên y tế, pháp lý hoặc tài chính chuyên sâu.';

function allowedOrigins() {
  const configured = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((value) => value.trim()).filter(Boolean)
    : [];
  return [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...configured])];
}

function isSameOrigin(req, origin) {
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    const requestHost = String(req.headers.host || '').split(':')[0].toLowerCase();
    return originUrl.protocol === 'https:' && originUrl.hostname.toLowerCase() === requestHost;
  } catch {
    return false;
  }
}

function isAllowedOrigin(req, origin) {
  if (!origin) return true;
  return isSameOrigin(req, origin) || allowedOrigins().includes(origin);
}

function setCors(res, origin) {
  if (origin && isAllowedOrigin({ headers: { host: new URL(origin).host } }, origin)) {
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

  // CORS is needed only for cross-origin callers. Same-origin requests from
  // the current Vercel deployment are always accepted, including preview
  // aliases, without opening the API to arbitrary Vercel projects.
  let originAllowed = false;
  try {
    originAllowed = isAllowedOrigin(req, origin);
  } catch {
    originAllowed = false;
  }

  if (origin && originAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
  if (!originAllowed) return sendJson(res, 403, { error: 'Origin not allowed' });
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
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_completion_tokens: 600
      })
    });

    if (!upstream.ok) {
      return sendJson(res, 502, {
        error: 'AI upstream request failed',
        upstreamStatus: upstream.status
      });
    }

    const data = await upstream.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) return sendJson(res, 502, { error: 'AI returned no response' });
    return sendJson(res, 200, { reply });
  } catch {
    return sendJson(res, 502, { error: 'AI service unavailable' });
  }
}
