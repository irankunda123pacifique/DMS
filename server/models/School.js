const getSchoolByPromoCode = async (db, promo_code) => {
    try {
        const [rows] = await db.query('SELECT * FROM schools WHERE promo_code = ? LIMIT 1', [promo_code]);
        return { data: rows[0] || null, error: null };
    } catch (error) { return { data: null, error }; }
};

const getSchoolByDodUsername = async (db, dod_username) => {
    try {
        const [rows] = await db.query('SELECT * FROM schools WHERE dod_username = ? LIMIT 1', [dod_username]);
        return { data: rows[0] || null, error: null };
    } catch (error) { return { data: null, error }; }
};

const getSchoolById = async (db, id) => {
    try {
        const [rows] = await db.query('SELECT * FROM schools WHERE id = ? LIMIT 1', [id]);
        return { data: rows[0] || null, error: null };
    } catch (error) { return { data: null, error }; }
};

const createSchool = async (db, { school_name, dod_username, password, promo_code }) => {
    try {
        const [result] = await db.query(
            'INSERT INTO schools (school_name, dod_username, password, promo_code) VALUES (?, ?, ?, ?)',
            [school_name, dod_username, password, promo_code]
        );
        const [rows] = await db.query('SELECT * FROM schools WHERE id = ?', [result.insertId]);
        return { data: rows[0], error: null };
    } catch (error) { return { data: null, error }; }
};

const updateSchool = async (db, id, updates) => {
    try {
        const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        await db.query(`UPDATE schools SET ${fields} WHERE id = ?`, [...Object.values(updates), id]);
        const [rows] = await db.query('SELECT * FROM schools WHERE id = ?', [id]);
        return { data: rows[0], error: null };
    } catch (error) { return { data: null, error }; }
};

module.exports = { getSchoolByPromoCode, getSchoolByDodUsername, getSchoolById, createSchool, updateSchool };
