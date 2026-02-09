import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:5000/api';
let adminToken = '';

async function testAllEndpoints() {
  console.log('🧪 Testing All Fixed Endpoints\n');
  console.log('='.repeat(60));

  try {
    // 1. Login as admin
    console.log('\n1️⃣ Testing Admin Login...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@bodhscriptclub.com',
        password: 'Admin@123!'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    adminToken = loginData.accessToken;
    console.log('✅ Admin login successful');

    // 2. Get events
    console.log('\n2️⃣ Testing Get Events...');
    const eventsResponse = await fetch(`${API_URL}/events`);
    const events = await eventsResponse.json();
    console.log(`✅ Found ${events.length} events`);

    if (events.length === 0) {
      console.log('⚠️  No events found. Skipping registration tests.');
      return;
    }

    const testEvent = events[0];
    console.log(`   Testing with event: ${testEvent.title} (ID: ${testEvent._id})`);

    // 3. Test Event Registrations (Admin)
    console.log('\n3️⃣ Testing Event Registrations Endpoint (Admin)...');
    const registrationsResponse = await fetch(`${API_URL}/events/${testEvent._id}/registrations`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (registrationsResponse.ok) {
      const registrationsData = await registrationsResponse.json();
      console.log(`✅ Registrations endpoint working`);
      console.log(`   Count: ${registrationsData.count || 0}`);
      console.log(`   Registrations: ${registrationsData.registrations?.length || 0}`);
      
      if (registrationsData.registrations && registrationsData.registrations.length > 0) {
        const sample = registrationsData.registrations[0];
        console.log(`   Sample data:`, {
          name: sample.name,
          registrationNo: sample.registrationNo,
          paymentStatus: sample.paymentStatus,
          hasPayment: !!sample.payment
        });
      }
    } else {
      console.log(`❌ Registrations endpoint failed: ${registrationsResponse.status}`);
      const error = await registrationsResponse.json();
      console.log(`   Error:`, error);
    }

    // 4. Test Payment History (Admin - All)
    console.log('\n4️⃣ Testing Payment History - All Payments (Admin)...');
    const allPaymentsResponse = await fetch(`${API_URL}/payment/admin/all`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (allPaymentsResponse.ok) {
      const paymentsData = await allPaymentsResponse.json();
      console.log(`✅ All payments endpoint working`);
      console.log(`   Count: ${paymentsData.count || 0}`);
      console.log(`   Payments: ${paymentsData.payments?.length || 0}`);
      
      if (paymentsData.payments && paymentsData.payments.length > 0) {
        const sample = paymentsData.payments[0];
        console.log(`   Sample data:`, {
          orderId: sample.orderId,
          amount: sample.amount,
          status: sample.status,
          userName: sample.userName,
          eventTitle: sample.event?.title
        });
      }
    } else {
      console.log(`❌ All payments endpoint failed: ${allPaymentsResponse.status}`);
      const error = await allPaymentsResponse.json();
      console.log(`   Error:`, error);
    }

    // 5. Test Payment History by Event (Admin)
    console.log('\n5️⃣ Testing Payment History - By Event (Admin)...');
    const eventPaymentsResponse = await fetch(`${API_URL}/payment/admin/event/${testEvent._id}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (eventPaymentsResponse.ok) {
      const eventPaymentsData = await eventPaymentsResponse.json();
      console.log(`✅ Event payments endpoint working`);
      console.log(`   Count: ${eventPaymentsData.count || 0}`);
      console.log(`   Payments: ${eventPaymentsData.payments?.length || 0}`);
    } else {
      console.log(`❌ Event payments endpoint failed: ${eventPaymentsResponse.status}`);
      const error = await eventPaymentsResponse.json();
      console.log(`   Error:`, error);
    }

    // 6. Test User Registrations
    console.log('\n6️⃣ Testing User Registrations Endpoint...');
    const userRegistrationsResponse = await fetch(`${API_URL}/events/user/registrations`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (userRegistrationsResponse.ok) {
      const userRegsData = await userRegistrationsResponse.json();
      console.log(`✅ User registrations endpoint working`);
      console.log(`   Count: ${userRegsData.count || 0}`);
      console.log(`   Registrations: ${userRegsData.registrations?.length || 0}`);
    } else {
      console.log(`❌ User registrations endpoint failed: ${userRegistrationsResponse.status}`);
      const error = await userRegistrationsResponse.json();
      console.log(`   Error:`, error);
    }

    // 7. Test Payment History (User)
    console.log('\n7️⃣ Testing Payment History - User...');
    const userPaymentsResponse = await fetch(`${API_URL}/payment/history`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (userPaymentsResponse.ok) {
      const userPaymentsData = await userPaymentsResponse.json();
      console.log(`✅ User payment history endpoint working`);
      console.log(`   Count: ${userPaymentsData.count || 0}`);
      console.log(`   Payments: ${userPaymentsData.payments?.length || 0}`);
    } else {
      console.log(`❌ User payment history endpoint failed: ${userPaymentsResponse.status}`);
      const error = await userPaymentsResponse.json();
      console.log(`   Error:`, error);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All endpoint tests completed!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAllEndpoints();
