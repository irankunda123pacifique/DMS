require('dotenv').config();
const mongoose = require('mongoose');
const School = require('./models/School');
const Teacher = require('./models/Teacher');
const Staff = require('./models/Staff');
const Student = require('./models/Student');
const Class = require('./models/Class');

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Clearing existing data...');
        await Promise.all([
            School.deleteMany({}),
            Teacher.deleteMany({}),
            Staff.deleteMany({}),
            Student.deleteMany({}),
            Class.deleteMany({})
        ]);

        console.log('Seeding School...');
        const school = await School.create({
            id: 'school_1',
            school_name: 'Greenfield Academy',
            dod_username: 'admin',
            password: 'admin123',
            promo_code: 'TEACHER2026'
        });

        console.log('Seeding Teachers...');
        const t1 = await Teacher.create({ school_id: school._id, name: 'Mr. John Bosco', username: 'teacher1', password: 'pass123', subject: 'Mathematics', status: 'approved' });
        const t2 = await Teacher.create({ school_id: school._id, name: 'Ms. Diane Uwase', username: 'teacher2', password: 'pass123', subject: 'English', status: 'approved' });

        console.log('Seeding Classes...');
        await Class.create({ school_id: school._id, name: 'S4A', teacher_id: t1._id });
        await Class.create({ school_id: school._id, name: 'S4B', teacher_id: t2._id });

        console.log('Seeding Students...');
        await Student.create({ school_id: school._id, full_name: 'Alice Mutesi', class: 'S4A', gender: 'Female', parent_name: 'Mrs. Mutesi Grace', parent_phone: '+250781111001', discipline_marks: 95 });
        await Student.create({ school_id: school._id, full_name: 'Bob Nzeyimana', class: 'S4B', gender: 'Male', parent_name: 'Mr. Nzeyimana Jean', parent_phone: '+250781111002', discipline_marks: 40 });

        console.log('Seeding successful!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seed();
