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

    await db.query(`
        INSERT INTO schools (school_name, dod_username, password, promo_code)
        VALUES ('Kageyo TSS', 'dod', 'dod123', 'TEACHER2026')
        ON DUPLICATE KEY UPDATE school_name='Kageyo TSS', password='dod123'
    `);

    const [[school]] = await db.query(`SELECT * FROM schools WHERE dod_username='dod'`);
    console.log('✅ School:', school);
    console.log('✅ Login → username: dod | password: dod123');
    await db.end();
}

seed().catch(console.error);
