// server.js - Vercel-compatible Express server
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();

// Middleware
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage (for demo - in production use a database)
let gifts = [];
let penalties = [];

// Initialize with demo data
function initializeDemoData() {
    if (gifts.length === 0) {
        gifts = [
            {
                id: 1,
                description: 'Traditional Thanka painting',
                value: 5000,
                date: '2023-10-15',
                giver: 'Local Artist',
                status: 'pending',
                relationship: 'business',
                circumstances: 'Gift given in appreciation for cultural advice',
                submittedAt: '2023-10-15T10:30:00Z'
            },
            {
                id: 2,
                description: 'Book on Bhutanese Culture',
                value: 800,
                date: '2023-10-10',
                giver: 'Brother',
                status: 'approved',
                relationship: 'immediate-relative',
                circumstances: 'Birthday gift from brother',
                submittedAt: '2023-10-10T14:20:00Z'
            }
        ];
    }
    
    if (penalties.length === 0) {
        penalties = [
            {
                id: 1,
                date: '2023-09-15',
                publicServant: 'Karma Wangdi',
                breachType: 'Late Declaration (24h rule)',
                giftValue: 7000,
                fineAmount: 14000,
                status: 'unpaid'
            },
            {
                id: 2,
                date: '2023-08-22',
                publicServant: 'Choki Dorji',
                breachType: 'Acceptance from Prohibited Source',
                giftValue: 12500,
                fineAmount: 25000,
                status: 'paid'
            }
        ];
    }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'Bhutan Gift Transparency System API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        compliance: 'Gift Rules 2017, Anti-Corruption Commission of Bhutan'
    });
});

// Get all gifts
app.get('/api/gifts', (req, res) => {
    initializeDemoData();
    res.json({
        success: true,
        count: gifts.length,
        data: gifts
    });
});

// Submit a new gift declaration
app.post('/api/gifts', (req, res) => {
    try {
        const {
            description,
            value,
            receiptDate,
            giftType,
            giverName,
            giverDesignation,
            giverAgency,
            relationship,
            circumstances,
            disposition,
            isProhibitedSource
        } = req.body;

        // Validation
        if (!description || !value || !giverName || !relationship || !circumstances) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        const newGift = {
            id: Date.now(),
            description,
            value: parseFloat(value),
            receiptDate: receiptDate || new Date().toISOString(),
            giftType: giftType || 'item',
            giver: {
                name: giverName,
                designation: giverDesignation,
                agency: giverAgency
            },
            relationship,
            circumstances,
            disposition: disposition || 'In possession of recipient',
            isProhibitedSource: isProhibitedSource || false,
            status: 'pending',
            submittedAt: new Date().toISOString(),
            reference: `BGTS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
        };

        gifts.push(newGift);
        
        // Log for debugging
        console.log('New gift declaration submitted:', {
            reference: newGift.reference,
            value: newGift.value,
            relationship: newGift.relationship
        });

        res.status(201).json({
            success: true,
            message: 'Gift declaration submitted successfully',
            reference: newGift.reference,
            data: newGift,
            reminder: 'Remember: Gifts must be declared within 24 hours of receipt (Rule 27)'
        });

    } catch (error) {
        console.error('Error submitting gift:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit gift declaration'
        });
    }
});

// Get gift by ID
app.get('/api/gifts/:id', (req, res) => {
    initializeDemoData();
    const gift = gifts.find(g => g.id === parseInt(req.params.id));
    
    if (!gift) {
        return res.status(404).json({
            success: false,
            error: 'Gift declaration not found'
        });
    }
    
    res.json({
        success: true,
        data: gift
    });
});

// Calculate penalty
app.post('/api/calculate-penalty', (req, res) => {
    try {
        const { value, breachNumber } = req.body;
        const numericValue = parseFloat(value) || 0;
        const breachNum = parseInt(breachNumber) || 1;
        
        // Rule 37 multipliers
        let multiplier;
        switch(breachNum) {
            case 1:
                multiplier = 2; // First offense: 2× value
                break;
            case 2:
                multiplier = 5; // Second offense: 5× value
                break;
            default:
                multiplier = 10; // Third or more: 10× value
        }
        
        const fine = numericValue * multiplier;
        
        res.json({
            success: true,
            data: {
                giftValue: numericValue,
                breachNumber: breachNum,
                multiplier: multiplier,
                calculatedFine: fine,
                formattedFine: `Nu. ${fine.toLocaleString()}`,
                ruleReference: 'Rule 37: Penalty for breach'
            }
        });
        
    } catch (error) {
        console.error('Error calculating penalty:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate penalty'
        });
    }
});

// Check prohibited source
app.post('/api/check-source', (req, res) => {
    try {
        const { relationship } = req.body;
        
        if (!relationship) {
            return res.status(400).json({
                success: false,
                error: 'Relationship is required'
            });
        }
        
        const results = {
            // Prohibited sources (Rule 8)
            'seeks-action': {
                title: 'PROHIBITED SOURCE',
                description: 'This giver is a prohibited source under Rule 8(a).',
                details: 'Who seeks official action or business from the public servant\'s agency.',
                isProhibited: true,
                rule: 'Rule 8(a)',
                action: 'Cannot accept gifts from this source'
            },
            'does-business': {
                title: 'PROHIBITED SOURCE',
                description: 'This giver is a prohibited source under Rule 8(b).',
                details: 'Who does business or seeks to do business with the public servant\'s agency.',
                isProhibited: true,
                rule: 'Rule 8(b)',
                action: 'Cannot accept gifts from this source'
            },
            'regulated': {
                title: 'PROHIBITED SOURCE',
                description: 'This giver is a prohibited source under Rule 8(c).',
                details: 'Who conducts activities regulated by the public servant\'s agency.',
                isProhibited: true,
                rule: 'Rule 8(c)',
                action: 'Cannot accept gifts from this source'
            },
            'affected': {
                title: 'PROHIBITED SOURCE',
                description: 'This giver is a prohibited source under Rule 8(d).',
                details: 'Who has interests that may be affected by performance or non-performance of the public servant\'s official duties.',
                isProhibited: true,
                rule: 'Rule 8(d)',
                action: 'Cannot accept gifts from this source'
            },
            // Exceptions (Rule 11)
            'immediate-relative': {
                title: 'ALLOWED (with conditions)',
                description: 'Gifts from immediate relatives are allowed.',
                details: 'When clearly motivated by the relationship rather than the official position.',
                isProhibited: false,
                rule: 'Rule 11(b)',
                action: 'May accept if clearly personal in nature'
            },
            'personal-friend': {
                title: 'ALLOWED (with conditions)',
                description: 'Gifts based on personal relationships may be allowed.',
                details: 'When clearly motivated by the personal relationship rather than official position.',
                isProhibited: false,
                rule: 'Rule 11(a)',
                action: 'May accept if clearly personal in nature'
            },
            'colleague': {
                title: 'RESTRICTED',
                description: 'Gifts between public servants are generally prohibited.',
                details: 'Limited exceptions for special occasions of nominal value.',
                isProhibited: true,
                rule: 'Rule 12',
                action: 'Generally cannot accept, except for special occasions'
            }
        };
        
        const result = results[relationship] || {
            title: 'REVIEW REQUIRED',
            description: 'This relationship requires further review.',
            details: 'Please consult with your Gift Disclosure Administrator.',
            isProhibited: null,
            rule: 'General review required',
            action: 'Submit for review by HoA/Gift Administration Committee'
        };
        
        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error checking source:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check prohibited source'
        });
    }
});

// Get all penalties
app.get('/api/penalties', (req, res) => {
    initializeDemoData();
    res.json({
        success: true,
        count: penalties.length,
        data: penalties
    });
});

// Get nominal value information
app.get('/api/nominal-value', (req, res) => {
    // Assuming national minimum wage of Nu. 3,750 per month (example)
    const dailyWage = 3750 / 30; // ~125 per day
    const nominalValueLimit = dailyWage * 10; // 10 days' wage
    
    res.json({
        success: true,
        data: {
            dailyMinimumWage: Math.round(dailyWage),
            nominalValueLimit: Math.round(nominalValueLimit),
            ruleReference: 'Rule 47(h): Nominal value means an amount not more than ten days\' national minimum wage',
            description: 'Gifts of nominal value may be accepted under certain conditions'
        }
    });
});

// Get gift rules summary
app.get('/api/rules/summary', (req, res) => {
    res.json({
        success: true,
        data: {
            title: 'Gift Rules 2017 Summary',
            rules: [
                {
                    rule: 'Rule 6',
                    title: 'Prohibition',
                    description: 'A public servant shall not solicit or accept a gift from a prohibited source.'
                },
                {
                    rule: 'Rule 8',
                    title: 'Prohibited Sources',
                    description: 'Includes those seeking official action, doing business, regulated by, or affected by the agency.'
                },
                {
                    rule: 'Rule 11',
                    title: 'Exceptions',
                    description: 'Gifts from immediate relatives or based on personal relationships may be allowed.'
                },
                {
                    rule: 'Rule 27',
                    title: 'Declaration Timeline',
                    description: 'Gifts must be declared within 24 hours of receipt.'
                },
                {
                    rule: 'Rule 37',
                    title: 'Penalties',
                    description: 'Fines: 1st offense 2× value, 2nd 5×, 3rd+ 10× value.'
                }
            ],
            source: 'Anti-Corruption Commission of Bhutan, Gift Rules 2017'
        }
    });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        availableEndpoints: [
            'GET  /api/health',
            'GET  /api/gifts',
            'POST /api/gifts',
            'GET  /api/gifts/:id',
            'POST /api/calculate-penalty',
            'POST /api/check-source',
            'GET  /api/penalties',
            'GET  /api/nominal-value',
            'GET  /api/rules/summary'
        ]
    });
});

// Serve SPA - handle all other routes by serving index.html
app.get('*', (req, res) => {
    // Don't interfere with API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            error: 'API endpoint not found'
        });
    }
    
    // For all other routes, serve the frontend
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Export the Express app for Vercel serverless
module.exports = app;

// For local development, start the server
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   🇧🇹  BHUTAN GIFT TRANSPARENCY SYSTEM (BGTS)                       ║
║   📋  Compliant with Gift Rules 2017                                ║
║   🏛️   Anti-Corruption Commission of Bhutan                        ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║   ✅  Server running on port ${PORT}                               ║
║   🌐  Local: http://localhost:${PORT}                              ║
║   🚀  Mode: ${process.env.VERCEL ? 'Vercel Serverless' : 'Local'}  ║
║                                                                      ║
║   📡  API Endpoints:                                                ║
║   • GET    /api/health              - Health check                 ║
║   • GET    /api/gifts               - List gift declarations       ║
║   • POST   /api/gifts               - Submit new declaration       ║
║   • POST   /api/calculate-penalty   - Calculate penalty            ║
║   • POST   /api/check-source        - Check prohibited source      ║
║   • GET    /api/penalties           - List penalties               ║
║                                                                      ║
║   🛑  Press Ctrl+C to stop                                         ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
        `);
        
        // Initialize demo data
        initializeDemoData();
        console.log('📊 Demo data initialized');
    });
}