const getLogsBySchool = async (db, school_id) => {
    try {
        const [rows] = await db.query('SELECT * FROM logs WHERE school_id = ? ORDER BY timestamp DESC', [school_id]);
        return { data: rows, error: null };
    } catch (error) { return { data: null, error }; }
};

const createLog = async (db, { school_id, message, user, category, action_type }) => {
    try {
        const [result] = await db.query(
            'INSERT INTO logs (school_id, message, user, category, action_type) VALUES (?, ?, ?, ?, ?)',
            [school_id, message, user, category, action_type || null]
        );
        const [rows] = await db.query('SELECT * FROM logs WHERE id = ?', [result.insertId]);
        return { data: rows[0], error: null };
    } catch (error) { return { data: null, error }; }
};

const deleteLogs = async (db, school_id) => {
    try {
        await db.query('DELETE FROM logs WHERE school_id = ?', [school_id]);
        return { error: null };
    } catch (error) { return { error }; }
};

module.exports = { getLogsBySchool, createLog, deleteLogs };
