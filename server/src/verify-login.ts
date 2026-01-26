import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';

dotenv.config();

const verifyLogin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/salama_vet');
        console.log('MongoDB Connected');

        const demoUsername = process.env.DEMO_USERNAME || 'demo';
        const demoPassword = process.env.DEMO_PASSWORD || 'demo123';

        console.log(`Checking login for: ${demoUsername} with password from .env`);

        const user = await User.findOne({ username: demoUsername });

        if (!user) {
            console.error('❌ Demo user NOT found in database!');
            process.exit(1);
        }

        const isMatch = await user.comparePassword(demoPassword);

        if (isMatch) {
            console.log('✅ Login SUCCESSFUL! Password matches.');
            console.log(`   User ID: ${user._id}`);
            console.log(`   Clinic ID: ${user.clinicId}`);
        } else {
            console.error('❌ Login FAILED! Password does not match.');
        }

        await mongoose.disconnect();
        process.exit(isMatch ? 0 : 1);
    } catch (error) {
        console.error('❌ Verification Error:', error);
        process.exit(1);
    }
};

verifyLogin();
