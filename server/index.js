require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 5000;

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'dms',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    waitForConnections: true,
    connectionLimit: 10
});

pool.getConnection()
    .then(conn => { console.log('✅ Connected to MySQL!'); conn.release(); })
    .catch(err => { console.error('❌ MySQL error:', err.message); process.exit(1); });

app.locals.db = pool;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '..')));

// WhatsApp routes
const whatsapp = require('./services/whatsapp');
app.get('/api/whatsapp/status',   (req, res) => res.json(whatsapp.getStatus()));
app.post('/api/whatsapp/connect', (req, res) => { whatsapp.init(); res.json({ message: 'Connecting…' }); });
app.post('/api/whatsapp/disconnect', (req, res) => { whatsapp.disconnect(); res.json({ message: 'Disconnected' }); });
app.post('/api/whatsapp/pair', async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ message: 'Phone number required' });
        const code = await whatsapp.requestPairingCode(phone);
        res.json({ success: true, code });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.post('/api/whatsapp/test', async (req, res) => {
    const result = await whatsapp.sendMessage(req.body.phone, req.body.message || 'Test from DMS ✅');
    res.json(result);
});

app.use('/api/auth',       require('./routes/auth'));
app.use('/api/students',   require('./routes/students'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/classes',    require('./routes/classes'));
app.use('/api/discipline', require('./routes/discipline'));
app.use('/api/logs',       require('./routes/logs'));

app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ message: 'Not found' });
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
