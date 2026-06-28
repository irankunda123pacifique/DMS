const getSchoolByPromoCode = async (db, promo_code) => {
    try {
        const snapshot = await db.collection('schools').where('promo_code', '==', promo_code).limit(1).get();
        if (snapshot.empty) return { data: null, error: null };
        const doc = snapshot.docs[0];
        return { data: { id: doc.id, ...doc.data() }, error: null };
    } catch (error) { return { data: null, error }; }
};

const getSchoolByDodUsername = async (db, dod_username) => {
    try {
        const snapshot = await db.collection('schools').where('dod_username', '==', dod_username).limit(1).get();
        if (snapshot.empty) return { data: null, error: null };
        const doc = snapshot.docs[0];
        return { data: { id: doc.id, ...doc.data() }, error: null };
    } catch (error) { return { data: null, error }; }
};

const getSchoolById = async (db, id) => {
    try {
        const doc = await db.collection('schools').doc(id).get();
        if (!doc.exists) return { data: null, error: null };
        return { data: { id: doc.id, ...doc.data() }, error: null };
    } catch (error) { return { data: null, error }; }
};

const createSchool = async (db, { school_name, dod_username, password, promo_code }) => {
    try {
        const docRef = await db.collection('schools').add({
            school_name,
            dod_username,
            password,
            promo_code,
            created_at: new Date().toISOString()
        });
        const doc = await docRef.get();
        return { data: { id: doc.id, ...doc.data() }, error: null };
    } catch (error) { return { data: null, error }; }
};

module.exports = { getSchoolByPromoCode, getSchoolByDodUsername, getSchoolById, createSchool };
