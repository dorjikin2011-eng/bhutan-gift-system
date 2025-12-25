// 🎯 GDMS Backend — Online Gift Declaration and Management System
// 📋 Compliant with The Gift Rules 2017 | Anti-Corruption Commission, Bhutan
// ✅ Pure Node.js — no browser globals (window/document/localStorage)

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serves HTML/CSS/JS

// Fix favicon issue
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No Content
});

// Data directory
const DATA_DIR = path.join(__dirname, 'data');
const AGENCIES_FILE = path.join(DATA_DIR, 'agencies.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const GIFTS_FILE = path.join(DATA_DIR, 'gifts.json');

// Initialize storage
async function initStorage() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Agencies
    if (!(await fileExists(AGENCIES_FILE))) {
      await fs.writeFile(AGENCIES_FILE, JSON.stringify([
        { id: 'ACC', name: 'Anti-Corruption Commission', active: true },
        { id: 'MOF', name: 'Ministry of Finance', active: true },
        { id: 'MOE', name: 'Ministry of Education', active: true },
        { id: 'MOH', name: 'Ministry of Health', active: true },
        { id: 'MOHA', name: 'Ministry of Home Affairs', active: true }
      ], null, 2));
    }

    // Users (demo accounts)
    if (!(await fileExists(USERS_FILE))) {
      await fs.writeFile(USERS_FILE, JSON.stringify([
        {
          id: 'ACC-ADMIN-001',
          name: 'ACC System Administrator',
          email: 'acc.admin@acc.gov.bt',
          password: 'password123',
          agency_id: 'ACC',
          agency_name: 'Anti-Corruption Commission',
          role: 'acc-admin'
        },
        {
          id: 'MOF-HOA-001',
          name: 'Director',
          email: 'director@mof.gov.bt',
          password: 'password123',
          agency_id: 'MOF',
          agency_name: 'Ministry of Finance',
          role: 'hoa'
        },
        {
          id: 'MOF-GDA-001',
          name: 'Gift Disclosure Administrator',
          email: 'gda@mof.gov.bt',
          password: 'password123',
          agency_id: 'MOF',
          agency_name: 'Ministry of Finance',
          role: 'gda'
        },
        {
          id: 'MOF-PS-001',
          name: 'Tashi Sherpa',
          email: 'tashi@mof.gov.bt',
          password: 'password123',
          agency_id: 'MOF',
          agency_name: 'Ministry of Finance',
          role: 'public-servant'
        }
      ], null, 2));
    }

    // Gifts
    if (!(await fileExists(GIFTS_FILE))) {
      await fs.writeFile(GIFTS_FILE, JSON.stringify([
        {
          id: 'GIFT-2025-001',
          agency_id: 'MOF',
          declarant_id: 'MOF-PS-001',
          description: 'Traditional Thanka painting',
          value: 5000,
          date_received: '2025-12-20',
          giver: 'Local Artist',
          relationship: 'personal',
          status: 'pending',
          created_at: new Date().toISOString()
        },
        {
          id: 'GIFT-2025-002',
          agency_id: 'MOF',
          declarant_id: 'MOF-PS-001',
          description: 'Book on Bhutanese Culture',
          value: 800,
          date_received: '2025-12-15',
          giver: 'Brother',
          relationship: 'immediate-relative',
          status: 'approved',
          decision: 'retain',
          created_at: new Date().toISOString()
        }
      ], null, 2));
    }

    console.log('✅ GDMS data initialized');
  } catch (err) {
    console.error('❌ Storage init failed:', err);
    process.exit(1);
  }
}

// Helper: Check if file exists
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Auth: Mock login
async function authenticate(email, password) {
  try {
    const usersData = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(usersData);
    return users.find(u => u.email === email && u.password === password);
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

// Middleware: Require auth
async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const token = auth.split(' ')[1];
  try {
    // Parse mock token: "gdms_<user_id>_<timestamp>"
    const parts = token.split('_');
    if (parts.length < 3 || parts[0] !== 'gdms') {
      throw new Error('Invalid token format');
    }
    const userId = parts[1];
    const usersData = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(usersData);
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

// Middleware: Require ACC Admin
function requireAccAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role === 'acc-admin') {
      next();
    } else {
      res.status(403).json({ success: false, error: 'ACC Admin access required' });
    }
  });
}

// Middleware: Agency-scoped access
function requireAgencyAccess(req, res, next) {
  requireAuth(req, res, () => {
    // ACC Admin sees all
    if (req.user.role === 'acc-admin') {
      return next();
    }
    // Agency users: ensure data matches their agency
    if (req.body.agency_id && req.body.agency_id !== req.user.agency_id) {
      return res.status(403).json({ success: false, error: 'Agency mismatch' });
    }
    next();
  });
}

// 🌐 Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// 🔐 Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const user = await authenticate(email, password);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Generate mock token (in prod: JWT)
    const token = `gdms_${user.id}_${Date.now()}`;
    res.json({
      success: true,
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        agency_id: user.agency_id,
        agency_name: user.agency_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// 🔐 Get current user
app.get('/api/auth/me', requireAuth, (req, res) => {
  try {
    const { password, ...safeUser } = req.user;
    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// 📦 Get gifts (scoped)
app.get('/api/gifts', requireAgencyAccess, async (req, res) => {
  try {
    const giftsData = await fs.readFile(GIFTS_FILE, 'utf8');
    const gifts = JSON.parse(giftsData);
    
    let filtered = gifts;
    if (req.user.role !== 'acc-admin') {
      filtered = gifts.filter(g => g.agency_id === req.user.agency_id);
    }
    if (req.user.role === 'public-servant') {
      filtered = filtered.filter(g => g.declarant_id === req.user.id);
    }

    res.json({ success: true, data: filtered });
  } catch (error) {
    console.error('Get gifts error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ➕ Declare gift
app.post('/api/gifts', requireAgencyAccess, async (req, res) => {
  try {
    const { description, value, date_received, giver, relationship } = req.body;
    
    if (!description || !value || !giver) {
      return res.status(400).json({ success: false, error: 'Required fields missing' });
    }

    const giftsData = await fs.readFile(GIFTS_FILE, 'utf8');
    const gifts = JSON.parse(giftsData);

    const newGift = {
      id: `GIFT-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      agency_id: req.user.agency_id,
      declarant_id: req.user.id,
      description,
      value: parseFloat(value),
      date_received: date_received || new Date().toISOString().split('T')[0],
      giver,
      relationship: relationship || 'other',
      status: 'submitted',
      created_at: new Date().toISOString()
    };

    gifts.push(newGift);
    await fs.writeFile(GIFTS_FILE, JSON.stringify(gifts, null, 2));

    res.json({
      success: true,
      data: newGift,
      reference: newGift.id
    });
  } catch (error) {
    console.error('Declare gift error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ⚖️ Penalty rules
app.get('/api/penalties', requireAuth, (req, res) => {
  try {
    res.json({
      success: true,
      data: [
        { breach: 1, multiplier: 2, rule: 'Rule 37(a)' },
        { breach: 2, multiplier: 5, rule: 'Rule 37(b)' },
        { breach: 3, multiplier: 10, rule: 'Rule 37(c)' }
      ]
    });
  } catch (error) {
    console.error('Get penalties error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// 📊 ACC: National overview
app.get('/api/acc/overview', requireAccAdmin, async (req, res) => {
  try {
    const [agenciesData, giftsData] = await Promise.all([
      fs.readFile(AGENCIES_FILE, 'utf8'),
      fs.readFile(GIFTS_FILE, 'utf8')
    ]);
    
    const agencies = JSON.parse(agenciesData);
    const gifts = JSON.parse(giftsData);
    
    res.json({
      success: true,
      data: {
        totalAgencies: agencies.length,
        activeAgencies: agencies.filter(a => a.active).length,
        totalDeclarations: gifts.length,
        pendingReviews: gifts.filter(g => g.status === 'pending').length,
        nationalCompliance: 84
      }
    });
  } catch (error) {
    console.error('ACC overview error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// 🖥️ Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/acc-dashboard.html', requireAccAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'acc-dashboard.html'));
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Export for Vercel
module.exports = app;

// Start server (only for local development)
if (require.main === module) {
  initStorage().then(() => {
    app.listen(PORT, () => {
      console.log(`✅ GDMS Server running on http://localhost:${PORT}`);
      console.log(`🔗 API: http://localhost:${PORT}/api/health`);
      console.log(`📝 Demo: acc.admin@acc.gov.bt / password123`);
    });
  }).catch(err => {
    console.error('❌ Server startup failed:', err);
  });
}