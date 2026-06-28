const getStudentsBySchool = async (db, school_id) => {
    try {
        const snapshot = await db.collection('students').where('school_id', '==', school_id).get();
        const students = [];
        snapshot.forEach(doc => {
            students.push({ id: doc.id, ...doc.data() });
        });
        return { data: students, error: null };
    } catch (error) { return { data: null, error }; }
};

const getStudentById = async (db, id) => {
    try {
        const doc = await db.collection('students').doc(id).get();
        if (!doc.exists) return { data: null, error: null };
        return { data: { id: doc.id, ...doc.data() }, error: null };
    } catch (error) { return { data: null, error }; }
};

const createStudent = async (db, { school_id, full_name, class: cls, gender, parent_name, parent_phone, profile_image, discipline_marks }) => {
    try {
        const docRef = await db.collection('students').add({
            school_id,
            full_name,
            class: cls,
            gender: gender || null,
            parent_name: parent_name || null,
            parent_phone: parent_phone || null,
            profile_image: profile_image || null,
            discipline_marks: discipline_marks ?? 100,
            created_at: new Date().toISOString()
        });
        const doc = await docRef.get();
        return { data: { id: doc.id, ...doc.data() }, error: null };
    } catch (error) { return { data: null, error }; }
};

const updateStudent = async (db, id, updates) => {
    try {
        await db.collection('students').doc(id).update(updates);
        const doc = await db.collection('students').doc(id).get();
        return { data: { id: doc.id, ...doc.data() }, error: null };
    } catch (error) { return { data: null, error }; }
};

const deleteStudent = async (db, id) => {
    try {
        await db.collection('students').doc(id).delete();
        return { error: null };
    } catch (error) { return { error }; }
};

module.exports = { getStudentsBySchool, getStudentById, createStudent, updateStudent, deleteStudent };
