import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

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
    .then(() => console.log('MongoDB Connected'))
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

// Serve static files from React build
const clientBuildPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));

// SPA Fallback: Serve index.html for any request that doesn't match a static file or API route
app.use((req, res, next) => {
    // If it's an API route that wasn't handled, send a 404
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ message: `API route ${req.url} not found` });
    }
    // For everything else, serve index.html
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server v2 running on port ${PORT}`);
    console.log(`Serving frontend from: ${clientBuildPath}`);
});
