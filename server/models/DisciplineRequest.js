const getRequestsBySchool = async (db, school_id) => {
    try {
        const [rows] = await db.query('SELECT * FROM discipline_requests WHERE school_id = ? ORDER BY date DESC', [school_id]);
        return { data: rows, error: null };
    } catch (error) { return { data: null, error }; }
};

const getRequestById = async (db, id) => {
    try {
        const [rows] = await db.query('SELECT * FROM discipline_requests WHERE id = ? LIMIT 1', [id]);
        return { data: rows[0] || null, error: null };
    } catch (error) { return { data: null, error }; }
};

const createRequest = async (db, { school_id, teacher_id, staff_id, student_id, class_name, mistake, marks_removed, notes, status, target_type }) => {
    try {
        const [result] = await db.query(
            'INSERT INTO discipline_requests (school_id, teacher_id, staff_id, student_id, class_name, mistake, marks_removed, notes, status, target_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [school_id, teacher_id || null, staff_id || null, student_id || null, class_name || null, mistake, Number(marks_removed), notes || null, status || 'pending', target_type]
        );
        const [rows] = await db.query('SELECT * FROM discipline_requests WHERE id = ?', [result.insertId]);
        return { data: rows[0], error: null };
    } catch (error) { return { data: null, error }; }
};

const updateRequest = async (db, id, updates) => {
    try {
        const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        await db.query(`UPDATE discipline_requests SET ${fields} WHERE id = ?`, [...Object.values(updates), id]);
        const [rows] = await db.query('SELECT * FROM discipline_requests WHERE id = ?', [id]);
        return { data: rows[0], error: null };
    } catch (error) { return { data: null, error }; }
};

const deleteRequest = async (db, id) => {
    try {
        await db.query('DELETE FROM discipline_requests WHERE id = ?', [id]);
        return { error: null };
    } catch (error) { return { error }; }
};

module.exports = { getRequestsBySchool, getRequestById, createRequest, updateRequest, deleteRequest };
