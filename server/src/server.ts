import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import bcrypt from 'bcryptjs';
import User from './models/User';
import Customer from './models/Customer';
import Supplier from './models/Supplier';
import Sale from './models/Sale';
import Treatment from './models/Treatment';
import Purchase from './models/Purchase';
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

        // One-time Index Drop: Clear stale unique constraints that prevent multi-tenancy
        try {
            const db = mongoose.connection.db;
            if (db) {
                // Ignore errors if index doesn't exist
                await db.collection('suppliers').dropIndex('name_1').catch(() => { });
                await db.collection('customers').dropIndex('name_1').catch(() => { });
                console.log('✅ Stale unique indexes cleaned up');
            }
        } catch (err) {
            console.warn('⚠️ Could not clean up indexes (they may not exist)');
        }

        // One-time Data Repair: Re-sync all accumulated totals from records
        const repairDataConsistency = async () => {
            try {
                console.log('🔄 Starting full data consistency check...');

                // 1. Repair Customers
                const customers = await Customer.find({});
                for (const customer of customers) {
                    const sales = await Sale.find({ customer: customer._id });
                    const treatments = await Treatment.find({ customer: customer._id });

                    customer.totalSales = sales.reduce((sum, s) => sum + (s.total || 0), 0);
                    customer.totalTreatments = treatments.reduce((sum, t) => sum + (t.total || 0), 0);
                    customer.totalPaid = (customer.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
                    customer.totalRest = (customer.totalSales + customer.totalTreatments) - customer.totalPaid;

                    // Legacy Data Fix: Ensure clinicId exists to pass validation
                    if (!customer.clinicId) {
                        customer.clinicId = 'default-clinic-id';
                    }

                    await customer.save();
                }

                // 2. Repair Suppliers
                const suppliers = await Supplier.find({});
                for (const supplier of suppliers) {
                    const purchases = await Purchase.find({ supplier: supplier._id });

                    supplier.totalPurchases = purchases.reduce((sum, p) => sum + (p.total || 0), 0);
                    supplier.totalPaid = (supplier.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
                    supplier.totalRest = supplier.totalPurchases - supplier.totalPaid;

                    // Legacy Data Fix: Ensure clinicId exists to pass validation
                    if (!supplier.clinicId) {
                        supplier.clinicId = 'default-clinic-id';
                    }

                    await supplier.save();
                }

                console.log('✅ Data consistency repair completed');
            } catch (err) {
                console.error('❌ Data repair error:', err);
            }
        };

        if (process.env.RUN_REPAIR === 'true') {
            await repairDataConsistency();
        }

        // Auto-seed Demo User
        const seedDemoUser = async () => {
            try {
                const demoUsername = process.env.DEMO_USERNAME || 'demo';
                const demoPassword = process.env.DEMO_PASSWORD || 'demo123';
                const demoClinicId = 'demo-clinic-id';

                const userExists = await User.findOne({ username: demoUsername });
                const salt = await bcrypt.genSalt(10);
                const passwordHash = await bcrypt.hash(demoPassword, salt);

                if (!userExists) {
                    await User.create({
                        username: demoUsername,
                        passwordHash,
                        role: 'demo',
                        clinicId: demoClinicId
                    });
                    console.log(`✅ Demo user created: ${demoUsername}`);
                } else {
                    // Update existing demo user to match .env credentials
                    userExists.passwordHash = passwordHash;
                    userExists.clinicId = demoClinicId; // Ensure clinicId is correct
                    await userExists.save();
                    console.log(`✅ Demo user updated: ${demoUsername}`);
                }
            } catch (err) {
                console.error('❌ Demo seeding error:', err);
            }
        };

        await seedDemoUser();
        console.log('Database ready');
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
import { restrictDemo } from './middleware/demoRestriction';

// Apply Demo Restriction Middleware Globally
app.use(restrictDemo as any);

console.log('Mounting Auth Routes at /api/auth');
app.use('/api/auth', (req, res, next) => {
    console.log(`[DEBUG] Auth Request: ${req.method} ${req.url}`);
    next();
}, authRoutes);
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
