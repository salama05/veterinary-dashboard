import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
        clinicId: string;
        username: string;
    };
}

export const restrictDemo = (req: AuthRequest, res: Response, next: NextFunction) => {
    // Skip restriction for login/auth routes
    if (req.path.includes('/api/auth/login') || req.path.includes('/api/auth/register')) {
        return next();
    }

    const demoUsername = process.env.DEMO_USERNAME || 'demo';
    let user = req.user;

    // If req.user is not set (middleware applied before protect), try to decode token
    if (!user && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
            user = decoded;
        } catch (error) {
            // If token fails, let 'protect' middleware handle it later
        }
    }

    if (user && user.username === demoUsername) {
        const restrictedMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];

        if (restrictedMethods.includes(req.method)) {
            return res.status(403).json({
                message: 'Action restricted in demo mode. Please upgrade for full access.'
            });
        }
    }

    next();
};
