const getTeacherByUsername = async (db, username) => {
    try {
        const [rows] = await db.query('SELECT * FROM teachers WHERE username = ? LIMIT 1', [username]);
        return { data: rows[0] || null, error: null };
    } catch (error) { return { data: null, error }; }
};

const getTeacherById = async (db, id) => {
    try {
        const [rows] = await db.query('SELECT * FROM teachers WHERE id = ? LIMIT 1', [id]);
        return { data: rows[0] || null, error: null };
    } catch (error) { return { data: null, error }; }
};

const getTeachersBySchool = async (db, school_id) => {
    try {
        const [rows] = await db.query('SELECT * FROM teachers WHERE school_id = ?', [school_id]);
        return { data: rows, error: null };
    } catch (error) { return { data: null, error }; }
};

const createTeacher = async (db, { school_id, name, username, password, subject, phone, status, profile_image }) => {
    try {
        const [result] = await db.query(
            'INSERT INTO teachers (school_id, name, username, password, subject, phone, status, profile_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [school_id, name, username, password, subject || null, phone || null, status || 'pending', profile_image || null]
        );
        const [rows] = await db.query('SELECT * FROM teachers WHERE id = ?', [result.insertId]);
        return { data: rows[0], error: null };
    } catch (error) { return { data: null, error }; }
};

const updateTeacher = async (db, id, updates) => {
    try {
        const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        await db.query(`UPDATE teachers SET ${fields} WHERE id = ?`, [...Object.values(updates), id]);
        const [rows] = await db.query('SELECT * FROM teachers WHERE id = ?', [id]);
        return { data: rows[0], error: null };
    } catch (error) { return { data: null, error }; }
};

const deleteTeacher = async (db, id) => {
    try {
        await db.query('DELETE FROM teachers WHERE id = ?', [id]);
        return { error: null };
    } catch (error) { return { error }; }
};

module.exports = { getTeacherByUsername, getTeacherById, getTeachersBySchool, createTeacher, updateTeacher, deleteTeacher };
