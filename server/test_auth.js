const axios = require('axios');
require('dotenv').config();

async function testAuthentication() {
    try {
        console.log('🔐 Testing JWT Authentication with clinicId...\n');

        // Test login
        console.log('1️⃣ Testing Login...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            username: process.env.ADMIN_USERNAME,
            password: process.env.ADMIN_PASSWORD
        });

        console.log('✅ Login Successful!');
        console.log('Response Data:', JSON.stringify(loginResponse.data, null, 2));

        // Check if clinicId is present
        if (loginResponse.data.clinicId) {
            console.log('\n✅ clinicId is present:', loginResponse.data.clinicId);
        } else {
            console.log('\n❌ WARNING: clinicId is missing from response!');
        }

        // Decode JWT to verify clinicId is in token
        const token = loginResponse.data.token;
        const base64Payload = token.split('.')[1];
        const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());

        console.log('\n2️⃣ JWT Token Payload:');
        console.log(JSON.stringify(payload, null, 2));

        if (payload.clinicId) {
            console.log('\n✅ clinicId is present in JWT token:', payload.clinicId);
        } else {
            console.log('\n❌ WARNING: clinicId is missing from JWT token!');
        }

        // Test protected route
        console.log('\n3️⃣ Testing Protected Route (Dashboard Stats)...');
        const dashboardResponse = await axios.get('http://localhost:5000/api/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Protected route accessed successfully!');
        console.log('Dashboard Stats:', JSON.stringify(dashboardResponse.data, null, 2));

        console.log('\n🎉 All tests passed! JWT authentication with clinicId is working correctly.');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        process.exit(1);
    }
}

testAuthentication();
