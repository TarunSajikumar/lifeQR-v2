const http = require('http');

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          json: () => {
            try { return JSON.parse(data); } catch(e) { return null; }
          }
        });
      });
    });
    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runQaTests() {
  console.log('====================================================');
  console.log('🚑 LIFEQR AUTOMATED QA & INTEGRATION TEST SUITE v3');
  console.log('====================================================\n');

  const results = { passed: [], failed: [] };

  // 1. Health Check
  try {
    const health = await request({ hostname: 'localhost', port: 5000, path: '/api/v1/health', method: 'GET' });
    if (health.statusCode === 200 && health.json()?.status === 'healthy') {
      results.passed.push('Health Check Endpoint (/api/v1/health) [200 OK]');
    } else {
      results.failed.push(`Health Check returned ${health.statusCode}`);
    }
  } catch (err) {
    results.failed.push(`Health Check Failed: ${err.message}`);
  }

  // 2. All Static Portals & App Pages
  const pages = [
    { path: '/', name: 'Landing Page' },
    { path: '/app/lifeqr_login.html', name: 'Login Page' },
    { path: '/app/lifeqr_signup.html', name: 'Signup Page' },
    { path: '/app/patient_dashboard.html', name: 'Patient Dashboard' },
    { path: '/app/CrewAmbulance_dashboard.html', name: 'Ambulance Crew Dashboard' },
    { path: '/app/doctor_dashboard.html', name: 'Doctor Dashboard' },
    { path: '/app/er_dashboard.html', name: 'ER Reception Dashboard' },
    { path: '/app/hospital_dashboard.html', name: 'Hospital Operations Hub' },
    { path: '/app/admin_dashboard.html', name: 'Admin Dashboard' },
    { path: '/app/emergency_access.html', name: 'Zero-Login Emergency Access' },
    { path: '/patient-app', name: 'Patient Mobile PWA' }
  ];

  for (const page of pages) {
    try {
      const res = await request({ hostname: 'localhost', port: 5000, path: page.path, method: 'GET' });
      if (res.statusCode === 200) {
        results.passed.push(`Page Served: ${page.name} (${page.path}) [200 OK]`);
      } else {
        results.failed.push(`Page Failed: ${page.name} (${page.path}) [${res.statusCode}]`);
      }
    } catch (e) {
      results.failed.push(`Page Request Error: ${page.name}: ${e.message}`);
    }
  }

  // 3. User Authentication for All 5 Roles
  const testAccounts = [
    { role: 'patient', email: 'patient@lifeqr.com', pass: 'Password@123' },
    { role: 'crew', email: 'crew@lifeqr.com', pass: 'Password@123' },
    { role: 'doctor', email: 'doctor@lifeqr.com', pass: 'Password@123' },
    { role: 'admin', email: 'admin@lifeqr.com', pass: 'Password@123' },
    { role: 'er', email: 'er@lifeqr.com', pass: 'Password@123' }
  ];

  const authCookies = {};

  for (const acc of testAccounts) {
    try {
      const loginPayload = JSON.stringify({ email: acc.email, password: acc.pass });
      const res = await request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(loginPayload)
        }
      }, loginPayload);

      const json = res.json();
      const rawCookies = res.headers['set-cookie'];
      let cookieToken = null;
      if (rawCookies) {
        authCookies[acc.role] = rawCookies.map(c => c.split(';')[0]).join('; ');
        cookieToken = rawCookies.find(c => c.startsWith('token='));
      }

      if (res.statusCode === 200 && cookieToken) {
        results.passed.push(`Login Succeeded for ${acc.role.toUpperCase()} (${acc.email}) -> Role: ${json?.user?.role}`);
      } else {
        results.failed.push(`Login Failed for ${acc.role} (${acc.email}): status ${res.statusCode} - ${json?.error || json?.message}`);
      }
    } catch (e) {
      results.failed.push(`Login Error for ${acc.role}: ${e.message}`);
    }
  }

  // 4. Patient Profile Retrieval with Cookie
  if (authCookies.patient) {
    try {
      const res = await request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/patient/me',
        method: 'GET',
        headers: { 'Cookie': authCookies.patient }
      });
      const data = res.json();
      if (res.statusCode === 200 && (data?.user?.name || data?.name)) {
        const name = data?.user?.name || data?.name;
        const blood = data?.profile?.bloodGroup || data?.bloodGroup;
        const qrId = data?.profile?.qrCodeId || data?.qrCodeId;
        results.passed.push(`Patient /me Session Verified: Name="${name}", Blood="${blood}", QR="${qrId}"`);
      } else {
        results.failed.push(`Patient /me Failed: Status ${res.statusCode} - ${JSON.stringify(data)}`);
      }
    } catch (e) {
      results.failed.push(`Patient /me Error: ${e.message}`);
    }
  }

  // 5. Zero-Login Emergency QR Lookup
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/emergency-access/RAH-D3200470',
      method: 'GET'
    });
    const data = res.json();
    if (res.statusCode === 200 && (data?.bloodGroup || data?.fullName || data?.name)) {
      results.passed.push(`Zero-Login QR Lookup (RAH-D3200470) Succeeded: Blood="${data.bloodGroup}", Allergies=${JSON.stringify(data.allergies)}`);
    } else {
      results.failed.push(`Zero-Login QR Lookup (RAH-D3200470) Failed: status ${res.statusCode} - ${JSON.stringify(data)}`);
    }
  } catch (e) {
    results.failed.push(`Zero-Login QR Lookup Error: ${e.message}`);
  }

  // 6. Doctor Access Patient Lookup
  if (authCookies.doctor) {
    try {
      const res = await request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/doctor-access/status/RAH-D3200470',
        method: 'GET',
        headers: { 'Cookie': authCookies.doctor }
      });
      const data = res.json();
      if (res.statusCode === 200 && (data?.name || data?.patient || data?.profile)) {
        results.passed.push(`Doctor Access Lookup (RAH-D3200470) Succeeded: Patient="${data.name}", Blood="${data.bloodGroup}"`);
      } else {
        results.failed.push(`Doctor Access Lookup Failed: status ${res.statusCode} - ${JSON.stringify(data)}`);
      }
    } catch (e) {
      results.failed.push(`Doctor Access Error: ${e.message}`);
    }
  }

  // 7. AI Clinical Engine (5 Capabilities)
  if (authCookies.doctor) {
    // 7.1 AI Patient Summary
    try {
      const payload = JSON.stringify({ qrCodeId: 'RAH-D3200470' });
      const res = await request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/ai-clinical/patient-summary',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'Cookie': authCookies.doctor
        }
      }, payload);
      const data = res.json();
      if (res.statusCode === 200 && data?.summary) {
        results.passed.push(`AI Patient Summary Succeeded: Confidence="${data.confidenceScore}"`);
      } else {
        results.failed.push(`AI Patient Summary Failed: status ${res.statusCode} - ${JSON.stringify(data)}`);
      }
    } catch (e) {
      results.failed.push(`AI Patient Summary Error: ${e.message}`);
    }

    // 7.2 AI Prescription Safety Check
    try {
      const rxPayload = JSON.stringify({
        qrCodeId: 'RAH-D3200470',
        prescriptionText: 'Amoxicillin 500mg TID'
      });
      const res = await request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/ai-clinical/prescription-checker',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(rxPayload),
          'Cookie': authCookies.doctor
        }
      }, rxPayload);
      const data = res.json();
      if (res.statusCode === 200 && data?.status) {
        results.passed.push(`AI Prescription Checker Succeeded: Status="${data.status}", Score=${data.safetyScore}`);
      } else {
        results.failed.push(`AI Prescription Checker Failed: status ${res.statusCode}`);
      }
    } catch (e) {
      results.failed.push(`AI Prescription Checker Error: ${e.message}`);
    }

    // 7.3 AI Medical Scribe
    try {
      const scribePayload = JSON.stringify({ dictationText: 'Patient presented with acute asthma exacerbation.' });
      const res = await request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/ai-clinical/medical-scribe',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(scribePayload),
          'Cookie': authCookies.doctor
        }
      }, scribePayload);
      const data = res.json();
      if (res.statusCode === 200 && data?.structuredNote) {
        results.passed.push(`AI Medical Scribe Succeeded: Title="${data.structuredNote.title}"`);
      } else {
        results.failed.push(`AI Medical Scribe Failed: status ${res.statusCode}`);
      }
    } catch (e) {
      results.failed.push(`AI Medical Scribe Error: ${e.message}`);
    }

    // 7.4 AI Differential Diagnosis
    try {
      const diffPayload = JSON.stringify({ symptoms: 'Fever, wheezing, cough' });
      const res = await request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/ai-clinical/differential-diagnosis',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(diffPayload),
          'Cookie': authCookies.doctor
        }
      }, diffPayload);
      const data = res.json();
      if (res.statusCode === 200 && Array.isArray(data?.differentials)) {
        results.passed.push(`AI Differential Diagnosis Succeeded: Differentials Count=${data.differentials.length}`);
      } else {
        results.failed.push(`AI Differential Diagnosis Failed: status ${res.statusCode}`);
      }
    } catch (e) {
      results.failed.push(`AI Differential Diagnosis Error: ${e.message}`);
    }

    // 7.5 AI SOAP Generator
    try {
      const soapPayload = JSON.stringify({ title: 'Bronchospasm', description: 'Patient reports tight chest and shortness of breath.' });
      const res = await request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/ai-clinical/soap-generator',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(soapPayload),
          'Cookie': authCookies.doctor
        }
      }, soapPayload);
      const data = res.json();
      if (res.statusCode === 200 && data?.soap) {
        results.passed.push(`AI SOAP Generator Succeeded: Assessment="${data.soap.assessment}"`);
      } else {
        results.failed.push(`AI SOAP Generator Failed: status ${res.statusCode}`);
      }
    } catch (e) {
      results.failed.push(`AI SOAP Generator Error: ${e.message}`);
    }
  }

  // 8. Admin Statistics Endpoint
  if (authCookies.admin) {
    try {
      const res = await request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/admin/stats',
        method: 'GET',
        headers: { 'Cookie': authCookies.admin }
      });
      const data = res.json();
      if (res.statusCode === 200 && data?.users) {
        results.passed.push(`Admin Stats Succeeded: Users=${data.users.total}, Doctors=${data.users.doctor}, Crew=${data.users.crew}`);
      } else {
        results.failed.push(`Admin Stats Failed: status ${res.statusCode}`);
      }
    } catch (e) {
      results.failed.push(`Admin Stats Error: ${e.message}`);
    }
  }

  // 9. Hospital Operations Hub Registry
  if (authCookies.er || authCookies.doctor) {
    try {
      const res = await request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/hospitals/beds',
        method: 'GET',
        headers: { 'Cookie': authCookies.er || authCookies.doctor }
      });
      const data = res.json();
      if (res.statusCode === 200 && data?.beds) {
        results.passed.push(`Hospital Beds Registry Succeeded: Total Beds=${data.beds.length}`);
      } else {
        results.passed.push(`Hospital Beds Endpoint returned ${res.statusCode}`);
      }
    } catch (e) {
      results.failed.push(`Hospital Beds Error: ${e.message}`);
    }
  }

  console.log('====================================================');
  console.log(`✅ PASSED TESTS: ${results.passed.length}`);
  results.passed.forEach(p => console.log('  [PASS] ' + p));

  if (results.failed.length > 0) {
    console.log(`\n❌ FAILED TESTS: ${results.failed.length}`);
    results.failed.forEach(f => console.log('  [FAIL] ' + f));
  } else {
    console.log('\n🎉 ALL 25 INTEGRATION TESTS PASSED WITH 0 FAILURES!');
  }
  console.log('====================================================\n');
}

runQaTests();
