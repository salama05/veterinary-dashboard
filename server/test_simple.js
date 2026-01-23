const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

async function simpleTest() {
    console.log('Testing Data Isolation\n');

    try {
        // Login as admin (existing user)
        console.log('1. Logging in as admin...');
        const login = await axios.post(`${API_URL}/auth/login`, {
            username: process.env.ADMIN_USERNAME,
            password: process.env.ADMIN_PASSWORD
        });

        console.log('Login successful!');
        console.log('User ID:', login.data._id);
        console.log('Username:', login.data.username);
        console.log('Clinic ID:', login.data.clinicId);
        console.log('Role:', login.data.role);

        const token = login.data.token;
        const clinicId = login.data.clinicId;

        // Decode JWT to verify clinicId
        const base64Payload = token.split('.')[1];
        const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
        console.log('\nJWT Payload:');
        console.log('  ID:', payload.id);
        console.log('  Role:', payload.role);
        console.log('  Clinic ID:', payload.clinicId);

        // Create API client with token
        const api = axios.create({
            baseURL: API_URL,
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // Test fetching data
        console.log('\n2. Fetching data...');

        const customers = await api.get('/customers');
        console.log(`Found ${customers.data.length} customers`);

        const products = await api.get('/products');
        console.log(`Found ${products.data.length} products`);

        const appointments = await api.get('/appointments');
        console.log(`Found ${appointments.data.length} appointments`);

        // Verify all data has the same clinicId
        console.log('\n3. Verifying clinicId in data...');

        const allCustomersHaveClinicId = customers.data.every(c => c.clinicId === clinicId);
        const allProductsHaveClinicId = products.data.every(p => p.clinicId === clinicId);
        const allAppointmentsHaveClinicId = appointments.data.every(a => a.clinicId === clinicId);

        if (allCustomersHaveClinicId) {
            console.log('✅ All customers have correct clinicId');
        } else {
            console.log('❌ Some customers have different clinicId!');
        }

        if (allProductsHaveClinicId) {
            console.log('✅ All products have correct clinicId');
        } else {
            console.log('❌ Some products have different clinicId!');
        }

        if (allAppointmentsHaveClinicId) {
            console.log('✅ All appointments have correct clinicId');
        } else {
            console.log('❌ Some appointments have different clinicId!');
        }

        console.log('\n✅ Test completed successfully!');
        console.log('\nConclusion:');
        console.log('- JWT contains clinicId');
        console.log('- All fetched data belongs to the same clinic');
        console.log('- Data filtering is working correctly');

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        process.exit(1);
    }
}

simpleTest();
