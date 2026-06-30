const getStudentsBySchool = async (db, school_id) => {
    try {
        const [rows] = await db.query('SELECT * FROM students WHERE school_id = ?', [school_id]);
        return { data: rows, error: null };
    } catch (error) { return { data: null, error }; }
};

const getStudentById = async (db, id) => {
    try {
        const [rows] = await db.query('SELECT * FROM students WHERE id = ? LIMIT 1', [id]);
        return { data: rows[0] || null, error: null };
    } catch (error) { return { data: null, error }; }
};

const createStudent = async (db, { school_id, full_name, class: cls, gender, parent_name, parent_phone, profile_image, discipline_marks }) => {
    try {
        const [result] = await db.query(
            'INSERT INTO students (school_id, full_name, class, gender, parent_name, parent_phone, profile_image, discipline_marks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [school_id, full_name, cls, gender || null, parent_name || null, parent_phone || null, profile_image || null, discipline_marks ?? 100]
        );
        const [rows] = await db.query('SELECT * FROM students WHERE id = ?', [result.insertId]);
        return { data: rows[0], error: null };
    } catch (error) { return { data: null, error }; }
};

const updateStudent = async (db, id, updates) => {
    try {
        const fields = Object.keys(updates).map(k => `\`${k}\` = ?`).join(', ');
        await db.query(`UPDATE students SET ${fields} WHERE id = ?`, [...Object.values(updates), id]);
        const [rows] = await db.query('SELECT * FROM students WHERE id = ?', [id]);
        return { data: rows[0], error: null };
    } catch (error) { return { data: null, error }; }
};

const deleteStudent = async (db, id) => {
    try {
        await db.query('DELETE FROM students WHERE id = ?', [id]);
        return { error: null };
    } catch (error) { return { error }; }
};

module.exports = { getStudentsBySchool, getStudentById, createStudent, updateStudent, deleteStudent };
