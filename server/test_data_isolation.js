const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

// Test data for two different clinics
const clinic1User = {
    username: 'clinic1_admin',
    password: process.env.TEST_PASSWORD || 'test123',
};

const clinic2User = {
    username: 'clinic2_admin',
    password: process.env.TEST_PASSWORD || 'test123',
};

// Helper function to create axios instance with token
const createApiClient = (token) => {
    return axios.create({
        baseURL: API_URL,
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
};

async function testDataIsolation() {
    console.log('🔒 Testing Data Isolation Between Clinics\n');
    console.log('='.repeat(60));

    let clinic1Token, clinic2Token;
    let clinic1Id, clinic2Id;

    try {
        // Step 1: Register two users from different clinics
        console.log('\n📝 Step 1: Registering users for two different clinics...\n');

        try {
            const reg1 = await axios.post(`${API_URL}/auth/register`, {
                username: clinic1User.username,
                password: clinic1User.password,
                role: 'admin'
            });
            clinic1Token = reg1.data.token;
            clinic1Id = reg1.data.clinicId;
            console.log(`✅ Clinic 1 User created: ${clinic1User.username}`);
            console.log(`   Clinic ID: ${clinic1Id}`);
        } catch (error) {
            if (error.response?.status === 400 && error.response?.data?.message === 'User already exists') {
                console.log(`ℹ️  Clinic 1 User already exists, logging in...`);
                const login1 = await axios.post(`${API_URL}/auth/login`, clinic1User);
                clinic1Token = login1.data.token;
                clinic1Id = login1.data.clinicId;
                console.log(`✅ Clinic 1 User logged in: ${clinic1User.username}`);
                console.log(`   Clinic ID: ${clinic1Id}`);
            } else {
                throw error;
            }
        }

        try {
            const reg2 = await axios.post(`${API_URL}/auth/register`, {
                username: clinic2User.username,
                password: clinic2User.password,
                role: 'admin'
            });
            clinic2Token = reg2.data.token;
            clinic2Id = reg2.data.clinicId;
            console.log(`✅ Clinic 2 User created: ${clinic2User.username}`);
            console.log(`   Clinic ID: ${clinic2Id}`);
        } catch (error) {
            if (error.response?.status === 400 && error.response?.data?.message === 'User already exists') {
                console.log(`ℹ️  Clinic 2 User already exists, logging in...`);
                const login2 = await axios.post(`${API_URL}/auth/login`, clinic2User);
                clinic2Token = login2.data.token;
                clinic2Id = login2.data.clinicId;
                console.log(`✅ Clinic 2 User logged in: ${clinic2User.username}`);
                console.log(`   Clinic ID: ${clinic2Id}`);
            } else {
                throw error;
            }
        }

        // Verify different clinic IDs
        if (clinic1Id === clinic2Id) {
            console.log('\n❌ ERROR: Both users have the same clinicId!');
            process.exit(1);
        }

        console.log('\n✅ Two different clinics confirmed!');

        // Step 2: Create test data for each clinic
        console.log('\n📦 Step 2: Creating test data for each clinic...\n');

        const api1 = createApiClient(clinic1Token);
        const api2 = createApiClient(clinic2Token);

        // Create a customer for Clinic 1
        const customer1 = await api1.post('/customers', {
            name: 'Clinic 1 Customer',
            phone: '0111111111',
            email: 'clinic1@test.com',
            address: 'Clinic 1 Address'
        });
        console.log(`✅ Created customer for Clinic 1: ${customer1.data.name}`);

        // Create a customer for Clinic 2
        const customer2 = await api2.post('/customers', {
            name: 'Clinic 2 Customer',
            phone: '0222222222',
            email: 'clinic2@test.com',
            address: 'Clinic 2 Address'
        });
        console.log(`✅ Created customer for Clinic 2: ${customer2.data.name}`);

        // Create a product for Clinic 1
        const product1 = await api1.post('/products', {
            name: 'Clinic 1 Product',
            price: 100
        });
        console.log(`✅ Created product for Clinic 1: ${product1.data.name}`);

        // Create a product for Clinic 2
        const product2 = await api2.post('/products', {
            name: 'Clinic 2 Product',
            price: 200
        });
        console.log(`✅ Created product for Clinic 2: ${product2.data.name}`);

        // Step 3: Verify data isolation
        console.log('\n🔍 Step 3: Verifying data isolation...\n');

        // Clinic 1 should only see their own customers
        const clinic1Customers = await api1.get('/customers');
        console.log(`Clinic 1 sees ${clinic1Customers.data.length} customer(s)`);

        const hasClinic2Customer = clinic1Customers.data.some(c => c.name === 'Clinic 2 Customer');
        if (hasClinic2Customer) {
            console.log('❌ FAILED: Clinic 1 can see Clinic 2 customer!');
            process.exit(1);
        }
        console.log('✅ Clinic 1 cannot see Clinic 2 customers');

        // Clinic 2 should only see their own customers
        const clinic2Customers = await api2.get('/customers');
        console.log(`Clinic 2 sees ${clinic2Customers.data.length} customer(s)`);

        const hasClinic1Customer = clinic2Customers.data.some(c => c.name === 'Clinic 1 Customer');
        if (hasClinic1Customer) {
            console.log('❌ FAILED: Clinic 2 can see Clinic 1 customer!');
            process.exit(1);
        }
        console.log('✅ Clinic 2 cannot see Clinic 1 customers');

        // Clinic 1 should only see their own products
        const clinic1Products = await api1.get('/products');
        console.log(`Clinic 1 sees ${clinic1Products.data.length} product(s)`);

        const hasClinic2Product = clinic1Products.data.some(p => p.name === 'Clinic 2 Product');
        if (hasClinic2Product) {
            console.log('❌ FAILED: Clinic 1 can see Clinic 2 product!');
            process.exit(1);
        }
        console.log('✅ Clinic 1 cannot see Clinic 2 products');

        // Clinic 2 should only see their own products
        const clinic2Products = await api2.get('/products');
        console.log(`Clinic 2 sees ${clinic2Products.data.length} product(s)`);

        const hasClinic1Product = clinic2Products.data.some(p => p.name === 'Clinic 1 Product');
        if (hasClinic1Product) {
            console.log('❌ FAILED: Clinic 2 can see Clinic 1 product!');
            process.exit(1);
        }
        console.log('✅ Clinic 2 cannot see Clinic 1 products');

        // Step 4: Test cross-clinic access prevention
        console.log('\n🛡️  Step 4: Testing cross-clinic access prevention...\n');

        try {
            // Try to update Clinic 2's customer using Clinic 1's token
            await api1.put(`/customers/${customer2.data._id}`, {
                name: 'Hacked Customer'
            });
            console.log('❌ FAILED: Clinic 1 was able to update Clinic 2 customer!');
            process.exit(1);
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('✅ Clinic 1 cannot update Clinic 2 customer (404 Not Found)');
            } else {
                console.log(`✅ Clinic 1 cannot update Clinic 2 customer (${error.response?.status})`);
            }
        }

        try {
            // Try to delete Clinic 1's product using Clinic 2's token
            await api2.delete(`/products/${product1.data._id}`);
            console.log('❌ FAILED: Clinic 2 was able to delete Clinic 1 product!');
            process.exit(1);
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('✅ Clinic 2 cannot delete Clinic 1 product (404 Not Found)');
            } else {
                console.log(`✅ Clinic 2 cannot delete Clinic 1 product (${error.response?.status})`);
            }
        }

        // Final Summary
        console.log('\n' + '='.repeat(60));
        console.log('\n🎉 ALL TESTS PASSED!');
        console.log('\n✅ Data Isolation Summary:');
        console.log('   • Each clinic can only see their own data');
        console.log('   • Cross-clinic read access is prevented');
        console.log('   • Cross-clinic write/delete access is prevented');
        console.log('   • JWT-based clinicId filtering is working correctly');
        console.log('\n' + '='.repeat(60));

    } catch (error) {
        console.error('\n❌ Test Failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Run the test
testDataIsolation();
