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
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('admin123', salt);

        await User.deleteMany({});

        await User.create({
            username: 'admin',
            passwordHash,
            role: 'admin'
        });

        console.log('Admin user created: admin / admin123');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedUser();
