require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Higher limit for Base64 profile images

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB successfully!'))
    .catch((err) => console.error('MongoDB Connection Error:', err));

const path = require('path');

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..')));

// Routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const userRoutes = require('./routes/users');
const classRoutes = require('./routes/classes');
const disciplineRoutes = require('./routes/discipline');
const logRoutes = require('./routes/logs');

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/discipline', disciplineRoutes);
app.use('/api/logs', logRoutes);

// Fallback to index.html for SPA-like behavior or root access
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ message: 'API route not found' });
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
