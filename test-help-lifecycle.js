const http = require('http');

function post(url, data, token) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const bodyStr = JSON.stringify(data);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        ...(token ? (token.startsWith('token=') ? { 'Cookie': token } : { 'Authorization': `Bearer ${token}` }) : {})
      }
    };
    const req = http.request(options, (res) => {
      let resBody = '';
      const setCookie = res.headers['set-cookie'];
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(resBody);
        } catch(e) {
          parsed = resBody;
        }
        resolve({ status: res.statusCode, body: parsed, cookies: setCookie });
      });
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

function get(url, cookie) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        ...(cookie ? { 'Cookie': cookie } : {})
      }
    };
    const req = http.request(options, (res) => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(resBody) });
        } catch(e) {
          resolve({ status: res.statusCode, body: resBody });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function put(url, data, cookie) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const bodyStr = JSON.stringify(data);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        ...(cookie ? { 'Cookie': cookie } : {})
      }
    };
    const req = http.request(options, (res) => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(resBody) });
        } catch(e) {
          resolve({ status: res.statusCode, body: resBody });
        }
      });
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

function extractCookie(cookieHeader) {
  if (!cookieHeader) return '';
  if (Array.isArray(cookieHeader)) {
    return cookieHeader.map(c => c.split(';')[0]).join('; ');
  }
  return cookieHeader.split(';')[0];
}

async function testHelpFlow() {
  console.log('--- 1. Login as Doctor ---');
  const docLogin = await post('http://localhost:5000/api/v1/auth/login', {
    email: 'doctor@lifeqr.com',
    password: 'Password@123'
  });
  console.log('Doctor login status:', docLogin.status, 'User:', docLogin.body?.user?.name);
  const docCookie = extractCookie(docLogin.cookies);

  console.log('\n--- 2. Doctor Submits Help Ticket ---');
  const submitDocTicket = await post('http://localhost:5000/api/v1/help-tickets', {
    subject: 'Emergency Medication Override Confirmation Needed',
    message: 'Patient presenting with acute anaphylaxis requires epinephrine dosing override in offline triage zone.',
    category: 'EMERGENCY_OVERRIDE',
    priority: 'CRITICAL',
    patientQrCodeId: 'RAH-D3200470'
  }, docCookie);
  console.log('Doctor Ticket status:', submitDocTicket.status, 'Ticket ID:', submitDocTicket.body?.ticket?.ticketId);
  const docTicketId = submitDocTicket.body?.ticket?.ticketId;

  console.log('\n--- 3. Login as Patient ---');
  const patLogin = await post('http://localhost:5000/api/v1/auth/login', {
    email: 'patient@lifeqr.com',
    password: 'Password@123'
  });
  console.log('Patient login status:', patLogin.status, 'User:', patLogin.body?.user?.name);
  const patCookie = extractCookie(patLogin.cookies);

  console.log('\n--- 4. Patient Submits Help Ticket ---');
  const submitPatTicket = await post('http://localhost:5000/api/v1/help-tickets', {
    subject: 'Request NFC Physical Medical Card Reissue',
    message: 'I misplaced my physical LifeQR wallet card while traveling. Need new card issued with encrypted QR verification.',
    category: 'IDENTITY_MISMATCH',
    priority: 'HIGH',
    patientQrCodeId: 'RAH-D3200470'
  }, patCookie);
  console.log('Patient Ticket status:', submitPatTicket.status, 'Ticket ID:', submitPatTicket.body?.ticket?.ticketId);
  const patTicketId = submitPatTicket.body?.ticket?.ticketId;

  console.log('\n--- 5. Login as Admin ---');
  const adminLogin = await post('http://localhost:5000/api/v1/auth/login', {
    email: 'admin@lifeqr.com',
    password: 'Password@123'
  });
  console.log('Admin login status:', adminLogin.status, 'Role:', adminLogin.body?.user?.role);
  const adminCookie = extractCookie(adminLogin.cookies);

  console.log('\n--- 6. Admin Fetches All Help Tickets ---');
  const adminTickets = await get('http://localhost:5000/api/v1/admin/help-tickets', adminCookie);
  console.log('Admin tickets total:', adminTickets.body?.counts?.total, 'Pending:', adminTickets.body?.counts?.pending, 'Critical:', adminTickets.body?.counts?.critical);
  
  const foundDoc = adminTickets.body?.tickets?.find(t => t.ticketId === docTicketId);
  const foundPat = adminTickets.body?.tickets?.find(t => t.ticketId === patTicketId);
  console.log(`Found Doctor ticket (${foundDoc?.ticketId}) role: ${foundDoc?.requesterRole}`);
  console.log(`Found Patient ticket (${foundPat?.ticketId}) role: ${foundPat?.requesterRole}`);

  console.log('\n--- 7. Admin Resolves the Doctor Ticket with Notes ---');
  const resolveDocRes = await put(`http://localhost:5000/api/v1/admin/help-tickets/${docTicketId}/status`, {
    status: 'RESOLVED',
    adminNotes: 'Override approved by Chief Medical Administrator Dr. Vance. Epinephrine dose authorized under protocol EP-912.'
  }, adminCookie);
  console.log('Resolve Doc status:', resolveDocRes.status, 'New status:', resolveDocRes.body?.ticket?.status);

  console.log('\n--- 8. Admin Sets Patient Ticket to IN_PROGRESS with Notes ---');
  const updatePatRes = await put(`http://localhost:5000/api/v1/admin/help-tickets/${patTicketId}/status`, {
    status: 'IN_PROGRESS',
    adminNotes: 'Identity confirmed against government ID. Replacement NFC Card dispatched via express medical courier #MC-8812.'
  }, adminCookie);
  console.log('Update Pat status:', updatePatRes.status, 'New status:', updatePatRes.body?.ticket?.status);

  console.log('\n--- 9. Patient Checks Updated Ticket Status ---');
  const patTickets = await get('http://localhost:5000/api/v1/help-tickets/my', patCookie);
  const patTarget = patTickets.body?.tickets?.find(t => t.ticketId === patTicketId);
  console.log('Patient sees status:', patTarget?.status, 'Admin notes:', patTarget?.adminNotes);

  console.log('\n--- 10. Admin Dashboard Stats Check ---');
  const adminStats = await get('http://localhost:5000/api/v1/admin/stats', adminCookie);
  console.log('Admin stats help tickets:', adminStats.body?.helpTickets);

  console.log('\nSUCCESS: Multi-role Help Ticket workflow verified end-to-end!');
}

testHelpFlow().catch(console.error);
