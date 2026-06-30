const getStaffByUsername = async (db, username) => {
    try {
        const [rows] = await db.query('SELECT * FROM staff WHERE username = ? LIMIT 1', [username]);
        return { data: rows[0] || null, error: null };
    } catch (error) { return { data: null, error }; }
};

const getStaffById = async (db, id) => {
    try {
        const [rows] = await db.query('SELECT * FROM staff WHERE id = ? LIMIT 1', [id]);
        return { data: rows[0] || null, error: null };
    } catch (error) { return { data: null, error }; }
};

const getStaffBySchool = async (db, school_id) => {
    try {
        const [rows] = await db.query('SELECT * FROM staff WHERE school_id = ?', [school_id]);
        return { data: rows, error: null };
    } catch (error) { return { data: null, error }; }
};

const createStaff = async (db, { school_id, name, username, password, position, phone, status, profile_image }) => {
    try {
        const [result] = await db.query(
            'INSERT INTO staff (school_id, name, username, password, position, phone, status, profile_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [school_id, name, username, password, position || null, phone || null, status || 'pending', profile_image || null]
        );
        const [rows] = await db.query('SELECT * FROM staff WHERE id = ?', [result.insertId]);
        return { data: rows[0], error: null };
    } catch (error) { return { data: null, error }; }
};

const updateStaff = async (db, id, updates) => {
    try {
        const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        await db.query(`UPDATE staff SET ${fields} WHERE id = ?`, [...Object.values(updates), id]);
        const [rows] = await db.query('SELECT * FROM staff WHERE id = ?', [id]);
        return { data: rows[0], error: null };
    } catch (error) { return { data: null, error }; }
};

const deleteStaff = async (db, id) => {
    try {
        await db.query('DELETE FROM staff WHERE id = ?', [id]);
        return { error: null };
    } catch (error) { return { error }; }
};

module.exports = { getStaffByUsername, getStaffById, getStaffBySchool, createStaff, updateStaff, deleteStaff };
