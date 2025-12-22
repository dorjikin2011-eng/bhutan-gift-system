// api/calculate-penalty.js
export default function handler(req, res) {
  if (req.method === 'POST') {
    const { value, breachNumber } = req.body;
    const numValue = parseFloat(value) || 0;
    
    const multiplier = [2, 5, 10][(parseInt(breachNumber) || 1) - 1] || 2;
    const fine = numValue * multiplier;
    
    res.json({
      success: true,
      value: numValue,
      breachNumber: parseInt(breachNumber) || 1,
      multiplier: multiplier,
      fine: fine,
      formatted: `Nu. ${fine.toLocaleString()}`
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}