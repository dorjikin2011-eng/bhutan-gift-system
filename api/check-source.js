// api/check-source.js
export default function handler(req, res) {
  if (req.method === 'POST') {
    const { relationship } = req.body;
    
    const results = {
      'seeks-action': {
        title: 'PROHIBITED SOURCE',
        desc: 'This giver is a prohibited source under Rule 8(a). You cannot accept gifts from them.',
        rule: 'Rule 8(a): Who seeks official action or business from the public servant\'s agency.',
        isProhibited: true
      },
      'family': {
        title: 'ALLOWED (with conditions)',
        desc: 'Gifts from immediate relatives are allowed if clearly motivated by the relationship.',
        rule: 'Rule 11(b): Gift from an immediate relative when the circumstances make it clear that it is the relationship rather than the position which is the motivating factor.',
        isProhibited: false
      }
    };
    
    const result = results[relationship] || {
      title: 'REVIEW REQUIRED',
      desc: 'This relationship requires further review.',
      rule: 'Please consult with your Gift Disclosure Administrator.',
      isProhibited: null
    };
    
    res.json({
      success: true,
      ...result
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}