const getRequestsBySchool = async (db, school_id) => {
    try {
        const snapshot = await db.collection('discipline_requests').where('school_id', '==', school_id).get();
        const requests = [];
        snapshot.forEach(doc => {
            requests.push({ id: doc.id, ...doc.data() });
        });
        // Sort in memory to avoid Firestore composite index requirement
        requests.sort((a, b) => new Date(b.date) - new Date(a.date));
        return { data: requests, error: null };
    } catch (error) { return { data: null, error }; }
};

const getRequestById = async (db, id) => {
    try {
        const doc = await db.collection('discipline_requests').doc(id).get();
        if (!doc.exists) return { data: null, error: null };
        return { data: { id: doc.id, ...doc.data() }, error: null };
    } catch (error) { return { data: null, error }; }
};

const createRequest = async (db, { school_id, teacher_id, staff_id, student_id, class_name, mistake, marks_removed, notes, status, target_type }) => {
    try {
        const docRef = await db.collection('discipline_requests').add({
            school_id,
            teacher_id: teacher_id || null,
            staff_id: staff_id || null,
            student_id: student_id || null,
            class_name: class_name || null,
            mistake,
            marks_removed: Number(marks_removed),
            notes: notes || null,
            status: status || 'pending',
            target_type,
            date: new Date().toISOString()
        });
        const doc = await docRef.get();
        return { data: { id: doc.id, ...doc.data() }, error: null };
    } catch (error) { return { data: null, error }; }
};

const updateRequest = async (db, id, updates) => {
    try {
        await db.collection('discipline_requests').doc(id).update(updates);
        const doc = await db.collection('discipline_requests').doc(id).get();
        return { data: { id: doc.id, ...doc.data() }, error: null };
    } catch (error) { return { data: null, error }; }
};

const deleteRequest = async (db, id) => {
    try {
        await db.collection('discipline_requests').doc(id).delete();
        return { error: null };
    } catch (error) { return { error }; }
};

module.exports = { getRequestsBySchool, getRequestById, createRequest, updateRequest, deleteRequest };
