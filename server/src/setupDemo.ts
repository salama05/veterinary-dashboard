import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User';

dotenv.config();

const setupDemo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/salama_vet');
        console.log('MongoDB Connected');

        const demoUsername = process.env.DEMO_USERNAME || 'demo';
        const demoPassword = process.env.DEMO_PASSWORD || 'demo123';
        const demoClinicId = 'demo-clinic-id';

        const userExists = await User.findOne({ username: demoUsername });
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(demoPassword, salt);

        if (userExists) {
            userExists.passwordHash = passwordHash;
            userExists.clinicId = demoClinicId;
            await userExists.save();
            console.log(`✅ Demo user updated: ${demoUsername}`);
        } else {
            await User.create({
                username: demoUsername,
                passwordHash,
                role: 'demo',
                clinicId: demoClinicId
            });

            console.log(`✅ Demo user created: ${demoUsername}`);
            console.log(`   Clinic ID: ${demoClinicId}`);
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Setup Error:', error);
        process.exit(1);
    }
};

setupDemo();
