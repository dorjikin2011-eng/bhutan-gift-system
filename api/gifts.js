// api/gifts.js - Serverless function
const gifts = [];

export default function handler(req, res) {
  if (req.method === 'POST') {
    // Submit new gift
    const newGift = {
      id: Date.now(),
      ...req.body,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      reference: `BGTS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    };
    
    gifts.push(newGift);
    
    res.status(201).json({
      success: true,
      message: 'Gift declaration submitted successfully',
      reference: newGift.reference,
      data: newGift
    });
  } else if (req.method === 'GET') {
    // Get all gifts
    res.json(gifts);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}