require('dotenv').config();
const mysql = require('mysql2/promise');

async function seed() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        database: process.env.DB_NAME || 'dms',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '1234'
    });

    // Insert default school/DOD
    await db.query(`
        INSERT INTO schools (school_name, dod_username, password, promo_code)
        VALUES ('Greenfield Academy', 'dod', 'dod123', 'TEACHER2026')
        ON DUPLICATE KEY UPDATE password='dod123'
    `);

    console.log('✅ Seeded: DOD login → username: dod | password: dod123');
    await db.end();
}

seed().catch(console.error);
