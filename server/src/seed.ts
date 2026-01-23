import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User';

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/salama_vet')
    .then(() => console.log('MongoDB Connected'))
    .catch((err) => console.error(err));

const seedUser = async () => {
    try {
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD;
        const adminClinicId = process.env.ADMIN_CLINIC_ID || 'default-clinic-id';

        if (!adminUsername || !adminPassword) {
            console.error('❌ ADMIN_USERNAME or ADMIN_PASSWORD not set in environment variables');
            process.exit(1);
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(adminPassword, salt);

        try {
            await User.collection.drop();
        } catch (err) {
            // Collection might not exist, ignore
        }

        await User.create({
            username: adminUsername,
            passwordHash,
            role: 'admin',
            clinicId: adminClinicId
        });

        console.log(`✅ Admin user created: ${adminUsername}`);
        console.log(`   Clinic ID: ${adminClinicId}`);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedUser();
