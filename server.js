// server.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://workid:workid@db:5432/workid'
});

// helper: simple auth mock – future me token se replace karna
async function getUserFromHeader(req) {
  // front-end se temporary header: x-user-id: <uuid>
  const userId = req.header('x-user-id');
  if (!userId) return null;
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  return rows[0] || null;
}

/* ========== HR: POST JOB ========== */
app.post('/api/jobs', async (req, res) => {
  try {
    const user = await getUserFromHeader(req);
    if (!user || user.role !== 'hr') {
      return res.status(401).json({ error: 'HR login required' });
    }

    const {
      companyId, title, location,
      skills, salaryRange, widStatusReq,
      minRating, deadline
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO jobs
       (companyid, title, location, skills, salary_range, wid_status_req, min_rating, deadline)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [companyId, title, location, skills, salaryRange, widStatusReq || 'any', minRating || 0, deadline || null]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed_to_create_job' });
  }
});

/* ========== CANDIDATE: LIST JOBS ========== */
app.get('/api/jobs', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT j.*, c.legalname AS company_name
       FROM jobs j
       LEFT JOIN companies c ON c.id = j.companyid
       ORDER BY j.createdat DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed_to_list_jobs' });
  }
});

/* ========== CANDIDATE: APPLY TO JOB ========== */
app.post('/api/jobs/:jobId/apply', async (req, res) => {
  try {
    const user = await getUserFromHeader(req);
    if (!user || user.role !== 'candidate') {
      return res.status(401).json({ error: 'Candidate login required' });
    }

    const jobId = req.params.jobId;

    // check duplicate
    const exists = await pool.query(
      'SELECT 1 FROM job_applications WHERE jobid=$1 AND candidateid=$2',
      [jobId, user.id]
    );
    if (exists.rowCount > 0) {
      return res.status(400).json({ error: 'already_applied' });
    }

    const { rows } = await pool.query(
      `INSERT INTO job_applications (jobid, candidateid)
       VALUES ($1,$2) RETURNING *`,
      [jobId, user.id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed_to_apply' });
  }
});

/* ========== HR: VIEW APPLICATIONS FOR A JOB ========== */
app.get('/api/jobs/:jobId/applications', async (req, res) => {
  try {
    const user = await getUserFromHeader(req);
    if (!user || user.role !== 'hr') {
      return res.status(401).json({ error: 'HR login required' });
    }

    const jobId = req.params.jobId;

    const { rows } = await pool.query(
      `SELECT a.*, u.email, u.profile, u.workid
       FROM job_applications a
       JOIN users u ON u.id = a.candidateid
       WHERE a.jobid = $1
       ORDER BY a.appliedat DESC`,
      [jobId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed_to_get_applications' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log('API running on ' + port));