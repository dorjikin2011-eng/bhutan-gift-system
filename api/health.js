// api/health.js
export default function handler(req, res) {
  res.json({ 
    status: 'ok', 
    service: 'BGTS API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
}