const getStaffByUsername = async (db, username) => {
    try {
        const snapshot = await db.collection('staff').where('username', '==', username).limit(1).get();
        if (snapshot.empty) return { data: null, error: null };
        const doc = snapshot.docs[0];
        return { data: { id: doc.id, ...doc.data() }, error: null };
    } catch (error) { return { data: null, error }; }
};

const getStaffById = async (db, id) => {
    try {
        const doc = await db.collection('staff').doc(id).get();
        if (!doc.exists) return { data: null, error: null };
        return { data: { id: doc.id, ...doc.data() }, error: null };
    } catch (error) { return { data: null, error }; }
};

const getStaffBySchool = async (db, school_id) => {
    try {
        const snapshot = await db.collection('staff').where('school_id', '==', school_id).get();
        const staff = [];
        snapshot.forEach(doc => {
            staff.push({ id: doc.id, ...doc.data() });
        });
        return { data: staff, error: null };
    } catch (error) { return { data: null, error }; }
};

const createStaff = async (db, { school_id, name, username, password, position, phone, status, profile_image }) => {
    try {
        const docRef = await db.collection('staff').add({
            school_id,
            name,
            username,
            password,
            position: position || null,
            phone: phone || null,
            status: status || 'pending',
            profile_image: profile_image || null,
            created_at: new Date().toISOString()
        });
        const doc = await docRef.get();
        return { data: { id: doc.id, ...doc.data() }, error: null };
    } catch (error) { return { data: null, error }; }
};

const updateStaff = async (db, id, updates) => {
    try {
        await db.collection('staff').doc(id).update(updates);
        const doc = await db.collection('staff').doc(id).get();
        return { data: { id: doc.id, ...doc.data() }, error: null };
    } catch (error) { return { data: null, error }; }
};

const deleteStaff = async (db, id) => {
    try {
        await db.collection('staff').doc(id).delete();
        return { error: null };
    } catch (error) { return { error }; }
};

module.exports = { getStaffByUsername, getStaffById, getStaffBySchool, createStaff, updateStaff, deleteStaff };
