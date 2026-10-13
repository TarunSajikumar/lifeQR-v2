const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const BASE_URL = 'http://localhost:5000';

async function request(url, options = {}) {
  const res = await fetch(url, options);
  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  // Extract set-cookie
  const setCookie = res.headers.get('set-cookie');
  return { status: res.status, headers: res.headers, setCookie, data, ok: res.ok };
}

async function runTest() {
  console.log('====================================================');
  console.log('🚀 LIFE-QR E2E TEST: HELP SYSTEM & ADMIN PROFILE HANDLING');
  console.log('====================================================\n');

  try {
    // 1. Login as Admin
    console.log('1️⃣ Logging in as Admin (admin@lifeqr.com)...');
    const adminLoginRes = await request(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@lifeqr.com', password: 'Password@123' })
    });

    if (!adminLoginRes.ok) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes.data)}`);
    }

    const adminToken = adminLoginRes.data.token;
    console.log('✅ Admin authenticated successfully.');

    const adminHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
      ...(adminLoginRes.setCookie ? { 'Cookie': adminLoginRes.setCookie } : {})
    };

    // 2. Login as Patient
    console.log('\n2️⃣ Logging in as Patient (patient@lifeqr.com)...');
    const patientLoginRes = await request(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient@lifeqr.com', password: 'Password@123' })
    });

    if (!patientLoginRes.ok) {
      throw new Error(`Patient login failed: ${JSON.stringify(patientLoginRes.data)}`);
    }

    const patientToken = patientLoginRes.data.token;
    const patientUser = patientLoginRes.data.user;
    console.log(`✅ Patient authenticated: ${patientUser.name} (${patientUser.id})`);

    const patientHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${patientToken}`,
      ...(patientLoginRes.setCookie ? { 'Cookie': patientLoginRes.setCookie } : {})
    };

    // 3. Patient submits a Help Ticket
    console.log('\n3️⃣ Patient submitting a Help Ticket...');
    const ticketPayload = {
      category: 'MEDICAL_RECORD',
      priority: 'HIGH',
      subject: 'Urgent: Allergy profile update & QR verification',
      message: 'My severe penicillin and shellfish allergies are not listed on my emergency badge. Please update and verify.',
      patientQrCodeId: 'RAH-D3200470'
    };
    const ticketRes = await request(`${BASE_URL}/api/v1/help-tickets`, {
      method: 'POST',
      headers: patientHeaders,
      body: JSON.stringify(ticketPayload)
    });
    if (!ticketRes.ok) throw new Error(`Ticket submission failed: ${JSON.stringify(ticketRes.data)}`);
    const createdTicket = ticketRes.data.ticket;
    console.log(`✅ Ticket created: #${createdTicket.ticketId} | Status: ${createdTicket.status} | ID: ${createdTicket._id}`);

    // 4. Admin checks Help Tickets
    console.log('\n4️⃣ Admin querying Help Tickets...');
    const adminTicketsRes = await request(`${BASE_URL}/api/v1/help-tickets/admin?status=ALL`, {
      method: 'GET',
      headers: adminHeaders
    });
    if (!adminTicketsRes.ok) throw new Error(`Admin query tickets failed: ${JSON.stringify(adminTicketsRes.data)}`);
    const tickets = adminTicketsRes.data.tickets;
    console.log(`✅ Admin retrieved ${tickets.length} total tickets. Stats:`, adminTicketsRes.data.stats);
    const foundTicket = tickets.find(t => t._id === createdTicket._id);
    if (!foundTicket) throw new Error('Newly created ticket not found in admin list!');
    console.log(`✅ Target ticket #${foundTicket.ticketId} verified in admin list with status ${foundTicket.status}.`);

    // 5. Admin queries Users Directory with role & search filter
    console.log('\n5️⃣ Admin querying Users Directory (All Users)...');
    const usersRes = await request(`${BASE_URL}/api/v1/admin/users?role=all`, {
      method: 'GET',
      headers: adminHeaders
    });
    if (!usersRes.ok) throw new Error(`Admin query users failed: ${JSON.stringify(usersRes.data)}`);
    console.log(`✅ Users directory retrieved ${usersRes.data.users.length} users. Counts:`, usersRes.data.counts);
    const foundPatient = usersRes.data.users.find(u => u._id === patientUser.id);
    if (!foundPatient) throw new Error('Patient not found in admin directory!');
    console.log(`✅ Patient ${foundPatient.name} found in directory. Pending tickets: ${foundPatient.pendingTickets}`);

    // 6. Admin opens Patient Profile
    console.log('\n6️⃣ Admin opening full profile for Patient...');
    const profileRes = await request(`${BASE_URL}/api/v1/admin/users/${patientUser.id}/profile`, {
      method: 'GET',
      headers: adminHeaders
    });
    if (!profileRes.ok) throw new Error(`Get profile failed: ${JSON.stringify(profileRes.data)}`);
    const profileData = profileRes.data;
    const allergiesStr = Array.isArray(profileData.patientProfile.allergies) ? profileData.patientProfile.allergies.join(', ') : (profileData.patientProfile.allergies || 'None');
    console.log(`✅ Patient profile loaded: Name: ${profileData.user.name}, Blood Group: ${profileData.patientProfile.bloodGroup}, Allergies: [${allergiesStr}]`);
    console.log(`   Emergency Contacts: ${profileData.patientProfile.emergencyContacts?.length || 0}`);
    console.log(`   Pending Help Tickets: ${profileData.tickets?.length || 0}`);

    // 7. Admin updates Patient Profile & Auto-Resolves the linked Help Ticket
    console.log('\n7️⃣ Admin updating Patient Profile and resolving linked Ticket...');
    const updatePayload = {
      name: profileData.user.name,
      phone: '9876543210',
      bloodGroup: 'B+',
      allergies: ['Penicillin', 'Peanuts', 'Late-onset Shellfish'],
      chronicConditions: ['Mild Asthma'],
      currentMedications: ['Albuterol Inhaler PRN'],
      address: '42 Marine Drive, Mumbai, MH',
      emergencyContacts: [
        {
          name: 'Priya Sharma',
          relationship: 'Spouse',
          phone: '9876500001',
          isPrimary: true
        },
        {
          name: 'Dr. R. K. Verma',
          relationship: 'Family Physician',
          phone: '9876500002',
          isPrimary: false
        }
      ],
      sourceTicketId: createdTicket._id,
      ticketResolutionNote: 'Allergies updated with Penicillin & Shellfish alerts. Emergency contacts updated. Badge validated.'
    };

    const updateRes = await request(`${BASE_URL}/api/v1/admin/users/${patientUser.id}/profile`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify(updatePayload)
    });
    if (!updateRes.ok) throw new Error(`Update profile failed: ${JSON.stringify(updateRes.data)}`);
    console.log('✅ Update response:', updateRes.data.message);
    if (updateRes.data.resolvedTicket) {
      console.log(`✅ Linked ticket #${updateRes.data.resolvedTicket.ticketId} auto-resolved: Status: ${updateRes.data.resolvedTicket.status}`);
    } else {
      throw new Error('Ticket was not auto-resolved!');
    }

    // 8. Admin Regenerates Patient QR Code
    console.log('\n8️⃣ Admin regenerating QR Code for Patient...');
    const qrRegenRes = await request(`${BASE_URL}/api/v1/admin/users/${patientUser.id}/regenerate-qr`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({})
    });
    if (!qrRegenRes.ok) throw new Error(`Regenerate QR failed: ${JSON.stringify(qrRegenRes.data)}`);
    console.log('✅ QR regenerated successfully:');
    console.log(`   New Emergency Token: ${qrRegenRes.data.emergencyToken ? qrRegenRes.data.emergencyToken.substring(0, 16) + '...' : 'OK'}`);
    console.log(`   New QR Image Data length: ${qrRegenRes.data.qrCodeImage ? qrRegenRes.data.qrCodeImage.length : 0} bytes`);

    // 9. Admin checks Doctor Profile & Updates Specialization
    console.log('\n9️⃣ Admin checking & updating Doctor Profile...');
    const doctorInList = usersRes.data.users.find(u => u.role === 'doctor');
    if (doctorInList) {
      const docProfileRes = await request(`${BASE_URL}/api/v1/admin/users/${doctorInList._id}/profile`, {
        method: 'GET',
        headers: adminHeaders
      });
      if (!docProfileRes.ok) throw new Error(`Get doctor profile failed: ${JSON.stringify(docProfileRes.data)}`);
      console.log(`✅ Doctor profile loaded: ${docProfileRes.data.user.name} | Specialization: ${docProfileRes.data.doctorProfile?.specialization || 'N/A'}`);

      const docUpdatePayload = {
        name: docProfileRes.data.user.name,
        specialization: 'Emergency Medicine & Critical Care Trauma',
        licenseNumber: 'MCI-99824-MH',
        hospital: 'Apollo LifeQR Emergency Center',
        verificationStatus: 'VERIFIED'
      };

      const docUpdateRes = await request(`${BASE_URL}/api/v1/admin/users/${doctorInList._id}/profile`, {
        method: 'PUT',
        headers: adminHeaders,
        body: JSON.stringify(docUpdatePayload)
      });
      if (!docUpdateRes.ok) throw new Error(`Update doctor profile failed: ${JSON.stringify(docUpdateRes.data)}`);
      console.log('✅ Doctor profile updated successfully:', docUpdateRes.data.message);
    }

    console.log('\n====================================================');
    console.log('🎉 ALL INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Test failed with error:', err.message);
    process.exit(1);
  }
}

runTest();
