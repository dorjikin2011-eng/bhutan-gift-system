// server.js - Vercel compatible
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'BGTS API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Submit gift declaration
app.post('/api/gifts', (req, res) => {
    try {
        console.log('📝 New gift declaration received');
        
        const reference = `BGTS-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
        
        res.json({
            success: true,
            message: 'Gift declaration submitted successfully',
            reference: reference,
            data: {
                ...req.body,
                id: Date.now(),
                status: 'pending',
                submittedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('❌ Error submitting gift:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to submit gift declaration' 
        });
    }
});

// Calculate penalty
app.post('/api/calculate-penalty', (req, res) => {
    try {
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
    } catch (error) {
        console.error('❌ Error calculating penalty:', error);
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
        
        const results = {
            'seeks-action': {
                title: 'PROHIBITED SOURCE',
                desc: 'This giver is a prohibited source under Rule 8(a). You cannot accept gifts from them.',
                rule: 'Rule 8(a): Who seeks official action or business from the public servant\'s agency.',
                isProhibited: true
            },
            'does-business': {
                title: 'PROHIBITED SOURCE',
                desc: 'This giver is a prohibited source under Rule 8(b). You cannot accept gifts from them.',
                rule: 'Rule 8(b): Who does business or seeks to do business with the public servant\'s agency.',
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
    } catch (error) {
        console.error('❌ Error checking source:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to check source' 
        });
    }
});

// Demo data endpoints
app.get('/api/penalties', (req, res) => {
    res.json([
        {
            id: 1,
            date: '2023-09-15',
            publicServant: 'Karma Wangdi',
            breachType: 'Late Declaration (24h rule)',
            giftValue: 7000,
            fineAmount: 14000,
            status: 'unpaid'
        }
    ]);
});

app.get('/api/gifts', (req, res) => {
    res.json([
        {
            id: 1,
            description: 'Traditional Thanka painting',
            value: 5000,
            date: '2023-10-15',
            giver: 'Local Artist',
            status: 'pending'
        }
    ]);
});

// Handle SPA routing - serve index.html for all non-API routes
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return next();
    }
    
    // For Vercel, serve from public directory
    const filePath = path.join(__dirname, 'public', req.path === '/' ? 'index.html' : req.path);
    
    // Check if file exists
    if (fs.existsSync(filePath) && req.path !== '/') {
        return res.sendFile(filePath);
    }
    
    // Otherwise serve index.html (for SPA routing)
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Start server (only if not in Vercel serverless environment)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🇧🇹 Bhutan Gift Transparency System (BGTS)         ║
║   📋 Compliant with Gift Rules 2017                  ║
║                                                       ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║   ✅ Server running on port ${PORT}                  ║
║   🌐 Local: http://localhost:${PORT}                 ║
║   🚀 Environment: ${process.env.NODE_ENV || 'dev'}   ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
        `);
    });
}

// Export for Vercel serverless
module.exports = app;