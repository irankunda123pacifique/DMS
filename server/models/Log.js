const getLogsBySchool = async (db, school_id) => {
    try {
        const snapshot = await db.collection('logs').where('school_id', '==', school_id).get();
        const logs = [];
        snapshot.forEach(doc => {
            logs.push({ id: doc.id, ...doc.data() });
        });
        // Sort in memory to avoid Firestore composite index requirement
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return { data: logs, error: null };
    } catch (error) { return { data: null, error }; }
};

const createLog = async (db, { school_id, message, user, category, action_type, timestamp }) => {
    try {
        const docRef = await db.collection('logs').add({
            school_id,
            message,
            user,
            category,
            action_type: action_type || null,
            timestamp: timestamp || new Date().toISOString()
        });
        const doc = await docRef.get();
        return { data: { id: doc.id, ...doc.data() }, error: null };
    } catch (error) { return { data: null, error }; }
};

const deleteLogs = async (db, school_id) => {
    try {
        const snapshot = await db.collection('logs').where('school_id', '==', school_id).get();
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        return { error: null };
    } catch (error) { return { error }; }
};

module.exports = { getLogsBySchool, createLog, deleteLogs };
