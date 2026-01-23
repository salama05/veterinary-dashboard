import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

const generateToken = (id: string, role: string, clinicId: string) => {
    return jwt.sign({ id, role, clinicId }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};

export const registerUser = async (req: Request, res: Response) => {
    const { username, password, role } = req.body;

    try {
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        let clinicId = req.body.clinicId;
        if (!clinicId) {
            // Fallback for older Node versions or simply use randomBytes
            clinicId = require('crypto').randomBytes(16).toString('hex');
        }

        const user = await User.create({
            username,
            passwordHash,
            role: role || 'admin',
            clinicId
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                role: user.role,
                clinicId: user.clinicId,
                token: generateToken((user._id as unknown) as string, user.role, user.clinicId),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Registration Error Details:', error);
        res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (user && (await user.comparePassword(password))) {
            // Self-heal: Ensure clinicId exists
            if (!user.clinicId) {
                user.clinicId = 'default-clinic-id'; // Use a default or generate unique if preferred. default is safer for existing single-tenant migration.
                await user.save();
            }

            res.json({
                _id: user._id,
                username: user.username,
                role: user.role,
                clinicId: user.clinicId,
                token: generateToken((user._id as unknown) as string, user.role, user.clinicId),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
