// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// ======= TEMP IN-MEMORY "DB" (DEMO) =======
let users = [];       // {id, role, name, email, mobile}
let companies = [];   // {id, legalName, domain, cin, address, city, state, pin, verificationStatus}
let feedback = [];    // {id, candidateWorkId, rating, text, hrEmail, createdAt}

// ======= BASIC ROUTES =======

// Health check
app.get('/', (req, res) => {
  res.json({ ok: true, app: 'WorkID backend demo' });
});

// ---- Signup (very simple, no password hash yet) ----
app.post('/api/auth/signup', (req, res) => {
  const { role, name, email, mobile } = req.body;
  if (!role || !name || !email || !mobile) {
    return res.status(400).json({ error: 'role, name, email, mobile required' });
  }
  const exists = users.find(u => u.email === email || u.mobile === mobile);
  if (exists) {
    return res.status(400).json({ error: 'User already exists' });
  }
  const user = {
    id: 'usr_' + Date.now(),
    role,
    name,
    email,
    mobile
  };
  users.push(user);
  res.json({ user });
});

// ---- List users (admin demo) ----
app.get('/api/admin/users', (req, res) => {
  res.json({ users });
});

// ---- HR: submit company for verification ----
app.post('/api/hr/company', (req, res) => {
  const {
    legalName,
    domain,
    cin,
    address,
    city,
    state,
    pin,
    hrEmail
  } = req.body;

  if (!legalName || !domain || !address || !city || !state || !pin) {
    return res.status(400).json({ error: 'Full address + legalName + domain required' });
  }

  // Correct 6-digit PIN validation
  if (!/^d{6}$/.test(String(pin))) {
    return res.status(400).json({ error: 'PIN code must be 6 digits' });
  }

  const company = {
    id: 'cmp_' + Date.now(),
    legalName,
    domain,
    cin: cin || '',
    address,
    city,
    state,
    pin: String(pin),
    verificationStatus: 'pending',
    hrEmail: hrEmail || null
  };

  companies.push(company);
  res.json({ company });
});

// ---- HR: list own companies (simple filter by hrEmail) ----
app.get('/api/hr/companies', (req, res) => {
  const hrEmail = req.query.hrEmail;
  if (!hrEmail) {
    return res.status(400).json({ error: 'hrEmail query param required' });
  }
  const my = companies.filter(c => c.hrEmail === hrEmail);
  res.json({ companies: my });
});

// ---- HR: submit feedback (with basic guards) ----
app.post('/api/hr/feedback', (req, res) => {
  const { workId, rating, text, hrEmail } = req.body;

  if (!workId || !rating || !text || !hrEmail) {
    return res.status(400).json({ error: 'workId, rating, text, hrEmail required' });
  }
  if (text.length < 40) {
    return res.status(400).json({ error: 'Feedback must be at least 40 characters' });
  }
  const numRating = Number(rating);
  if (numRating < 1 || numRating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  const fb = {
    id: 'fb_' + Date.now(),
    candidateWorkId: workId,
    rating: numRating,
    text,
    hrEmail,
    createdAt: new Date().toISOString()
  };
  feedback.push(fb);
  res.json({ feedback: fb });
});

// ---- Candidate: get all feedback for a WorkID ----
app.get('/api/candidate/feedback', (req, res) => {
  const workId = req.query.workId;
  if (!workId) {
    return res.status(400).json({ error: 'workId query param required' });
  }
  const list = feedback.filter(f => f.candidateWorkId === workId);
  res.json({ feedback: list });
});

// Start server
app.listen(PORT, () => {
  console.log(`WorkID demo backend running on port ${PORT}`);
});