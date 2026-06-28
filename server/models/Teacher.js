const getTeacherByUsername = async (db, username) => {
    try {
        const snapshot = await db.collection('teachers').where('username', '==', username).limit(1).get();
        if (snapshot.empty) return { data: null, error: null };
        const doc = snapshot.docs[0];
        return { data: { id: doc.id, ...doc.data() }, error: null };
    } catch (error) { return { data: null, error }; }
};

const getTeacherById = async (db, id) => {
    try {
        const doc = await db.collection('teachers').doc(id).get();
        if (!doc.exists) return { data: null, error: null };
        return { data: { id: doc.id, ...doc.data() }, error: null };
    } catch (error) { return { data: null, error }; }
};

const getTeachersBySchool = async (db, school_id) => {
    try {
        const snapshot = await db.collection('teachers').where('school_id', '==', school_id).get();
        const teachers = [];
        snapshot.forEach(doc => {
            teachers.push({ id: doc.id, ...doc.data() });
        });
        return { data: teachers, error: null };
    } catch (error) { return { data: null, error }; }
};

const createTeacher = async (db, { school_id, name, username, password, subject, phone, status, profile_image }) => {
    try {
        const docRef = await db.collection('teachers').add({
            school_id,
            name,
            username,
            password,
            subject: subject || null,
            phone: phone || null,
            status: status || 'pending',
            profile_image: profile_image || null,
            created_at: new Date().toISOString()
        });
        const doc = await docRef.get();
        return { data: { id: doc.id, ...doc.data() }, error: null };
    } catch (error) { return { data: null, error }; }
};

const updateTeacher = async (db, id, updates) => {
    try {
        await db.collection('teachers').doc(id).update(updates);
        const doc = await db.collection('teachers').doc(id).get();
        return { data: { id: doc.id, ...doc.data() }, error: null };
    } catch (error) { return { data: null, error }; }
};

const deleteTeacher = async (db, id) => {
    try {
        await db.collection('teachers').doc(id).delete();
        return { error: null };
    } catch (error) { return { error }; }
};

module.exports = { getTeacherByUsername, getTeacherById, getTeachersBySchool, createTeacher, updateTeacher, deleteTeacher };
