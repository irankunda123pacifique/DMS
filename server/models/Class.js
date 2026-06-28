const getClassesBySchool = async (db, school_id) => {
    try {
        const snapshot = await db.collection('classes').where('school_id', '==', school_id).get();
        const classes = [];
        snapshot.forEach(doc => {
            classes.push({ id: doc.id, ...doc.data() });
        });
        return { data: classes, error: null };
    } catch (error) { return { data: null, error }; }
};

const getClassById = async (db, id) => {
    try {
        const doc = await db.collection('classes').doc(id).get();
        if (!doc.exists) return { data: null, error: null };
        return { data: { id: doc.id, ...doc.data() }, error: null };
    } catch (error) { return { data: null, error }; }
};

const createClass = async (db, { school_id, name, teacher_id }) => {
    try {
        const docRef = await db.collection('classes').add({
            school_id,
            name,
            teacher_id: teacher_id || null,
            created_at: new Date().toISOString()
        });
        const doc = await docRef.get();
        return { data: { id: doc.id, ...doc.data() }, error: null };
    } catch (error) { return { data: null, error }; }
};

const updateClass = async (db, id, updates) => {
    try {
        await db.collection('classes').doc(id).update(updates);
        const doc = await db.collection('classes').doc(id).get();
        return { data: { id: doc.id, ...doc.data() }, error: null };
    } catch (error) { return { data: null, error }; }
};

const deleteClass = async (db, id) => {
    try {
        await db.collection('classes').doc(id).delete();
        return { error: null };
    } catch (error) { return { error }; }
};

module.exports = { getClassesBySchool, getClassById, createClass, updateClass, deleteClass };
