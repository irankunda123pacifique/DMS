const getClassesBySchool = async (db, school_id) => {
    try {
        const [rows] = await db.query('SELECT * FROM classes WHERE school_id = ?', [school_id]);
        return { data: rows, error: null };
    } catch (error) { return { data: null, error }; }
};

const getClassById = async (db, id) => {
    try {
        const [rows] = await db.query('SELECT * FROM classes WHERE id = ? LIMIT 1', [id]);
        return { data: rows[0] || null, error: null };
    } catch (error) { return { data: null, error }; }
};

const createClass = async (db, { school_id, name, teacher_id }) => {
    try {
        const [result] = await db.query(
            'INSERT INTO classes (school_id, name, teacher_id) VALUES (?, ?, ?)',
            [school_id, name, teacher_id || null]
        );
        const [rows] = await db.query('SELECT * FROM classes WHERE id = ?', [result.insertId]);
        return { data: rows[0], error: null };
    } catch (error) { return { data: null, error }; }
};

const updateClass = async (db, id, updates) => {
    try {
        const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        await db.query(`UPDATE classes SET ${fields} WHERE id = ?`, [...Object.values(updates), id]);
        const [rows] = await db.query('SELECT * FROM classes WHERE id = ?', [id]);
        return { data: rows[0], error: null };
    } catch (error) { return { data: null, error }; }
};

const deleteClass = async (db, id) => {
    try {
        await db.query('DELETE FROM classes WHERE id = ?', [id]);
        return { error: null };
    } catch (error) { return { error }; }
};

module.exports = { getClassesBySchool, getClassById, createClass, updateClass, deleteClass };
