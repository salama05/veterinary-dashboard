import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import bcrypt from 'bcryptjs';
import User from './models/User';
import dotenv from 'dotenv';
import helmet from 'helmet';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Database Connection
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/salama_vet';
mongoose.connect(mongoURI)
    .then(async () => {
        console.log('MongoDB Connected');
        // Auto-seed admin user if no users exist
        try {
            const userCount = await User.countDocuments();
            if (userCount === 0) {
                const salt = await bcrypt.genSalt(10);
                const passwordHash = await bcrypt.hash('admin123', salt);
                await User.create({
                    username: 'admin',
                    passwordHash,
                    role: 'admin'
                });
                console.log('Default admin user created: admin / admin123');
            }
        } catch (seedErr) {
            console.error('Error seeding admin user:', seedErr);
        }
    })
    .catch((err) => {
        console.error('MongoDB Connection Error:', err);
        console.error('Please ensure MongoDB is running and accessible at:', mongoURI);
    });

// Favicon handler to stop 404 errors in logs
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Routes
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import supplierRoutes from './routes/supplierRoutes';
import customerRoutes from './routes/customerRoutes';
import purchaseRoutes from './routes/purchaseRoutes';
import saleRoutes from './routes/saleRoutes';
import treatmentRoutes from './routes/treatmentRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import openingStockRoutes from './routes/openingStockRoutes';
import consumedProductRoutes from './routes/consumedProductRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import analysisRoutes from './routes/analysisRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/opening-stocks', openingStockRoutes);
app.use('/api/consumed-products', consumedProductRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/analysis', analysisRoutes);

// Serve static files from React build
// On Render, the process.cwd() is usually /opt/render/project/src/server
const clientBuildPath = path.join(process.cwd(), '../client/dist');
app.use(express.static(clientBuildPath));

// Final SPA Fallback
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) return next();
    res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
        if (err) {
            console.error('FRONTEND ERROR at path:', clientBuildPath);
            res.status(500).send(`Frontend build folder not found at: ${clientBuildPath}`);
        }
    });
});

// Start Server
app.listen(PORT, () => {
    console.log('*****************************************');
    console.log(`🚀 SALAMA VET - VERSION 7 (FINAL) ACTIVE`);
    console.log(`📍 Port: ${PORT}`);
    console.log('*****************************************');
});
