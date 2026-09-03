// test-api.js - Automated API & Multi-User Ownership Test Suite
const http = require('http');

const BASE_URL = 'http://127.0.0.1:5000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const config = {
    method: options.method || 'GET',
    headers
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, config);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runTests() {
  console.log('========================================');
  console.log('🚀 Starting Job Application Tracker Test Suite');
  console.log('========================================\n');

  const timestamp = Date.now();
  const user1Data = {
    username: 'Dev User',
    email: `dev_${timestamp}@example.com`,
    password: 'Password123!'
  };

  const user2Data = {
    username: 'Rahul User',
    email: `rahul_${timestamp}@example.com`,
    password: 'Password123!'
  };

  // 1. Test Register User 1
  console.log('--- 1. Testing Registration ---');
  const reg1 = await request('/auth/register', {
    method: 'POST',
    body: user1Data
  });
  assert(reg1.status === 201, 'User 1 registered with 201');
  assert(reg1.data.token, 'User 1 received JWT token');
  assert(reg1.data.user.email === user1Data.email, 'User 1 email matches');
  assert(!reg1.data.user.passwordHash, 'User 1 response does not expose passwordHash');

  const token1 = reg1.data.token;

  // 2. Test Duplicate Registration
  const dupReg = await request('/auth/register', {
    method: 'POST',
    body: user1Data
  });
  assert(dupReg.status === 400, 'Duplicate email registration rejected with 400');

  // 3. Test Register User 2
  const reg2 = await request('/auth/register', {
    method: 'POST',
    body: user2Data
  });
  assert(reg2.status === 201, 'User 2 registered with 201');
  const token2 = reg2.data.token;

  // 4. Test Login
  console.log('\n--- 2. Testing Login & Authentication ---');
  const loginValid = await request('/auth/login', {
    method: 'POST',
    body: { email: user1Data.email, password: user1Data.password }
  });
  assert(loginValid.status === 200, 'Valid login returns 200');
  assert(loginValid.data.token, 'Login response includes token');

  const loginInvalid = await request('/auth/login', {
    method: 'POST',
    body: { email: user1Data.email, password: 'WrongPassword' }
  });
  assert(loginInvalid.status === 401, 'Invalid password rejected with 401');

  // 5. Test Protected Route without token
  const unauthGet = await request('/applications');
  assert(unauthGet.status === 401, 'Unauthenticated request rejected with 401');

  // 6. Test Create Applications for User 1
  console.log('\n--- 3. Testing Application Creation & Validation ---');
  const app1Data = {
    company: 'Google',
    jobRole: 'Frontend Engineer',
    status: 'Interview',
    appliedDate: '2026-09-01',
    jobUrl: 'https://careers.google.com/jobs/123',
    notes: 'Cleared technical phone screen'
  };

  const create1 = await request('/applications', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token1}` },
    body: app1Data
  });
  assert(create1.status === 201, 'User 1 created application with 201');
  assert(create1.data.company === 'Google', 'Company matches Google');
  assert(create1.data.status === 'Interview', 'Status matches Interview');
  const app1Id = create1.data._id;

  // Create second application for User 1
  const create2 = await request('/applications', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token1}` },
    body: {
      company: 'Microsoft',
      jobRole: 'Full Stack Developer',
      status: 'Applied',
      notes: 'Referral through college senior'
    }
  });
  assert(create2.status === 201, 'User 1 created second application');
  const app2Id = create2.data._id;

  // Test validation on missing required fields
  const invalidApp = await request('/applications', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token1}` },
    body: { notes: 'Missing company and role' }
  });
  assert(invalidApp.status === 400, 'Creation without required fields rejected with 400');

  // Test validation on invalid status enum
  const invalidStatusApp = await request('/applications', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token1}` },
    body: { company: 'Amazon', jobRole: 'SDE', status: 'NonExistentStatus' }
  });
  assert(invalidStatusApp.status === 400, 'Invalid status enum rejected with 400');

  // 7. Test Get Applications & Filtering
  console.log('\n--- 4. Testing Query, Search & Status Filters ---');
  const getAllUser1 = await request('/applications', {
    headers: { Authorization: `Bearer ${token1}` }
  });
  assert(getAllUser1.status === 200, 'Get all applications returns 200');
  assert(getAllUser1.data.length === 2, 'User 1 has exactly 2 applications');

  // Search by company
  const searchGoogle = await request('/applications?search=goog', {
    headers: { Authorization: `Bearer ${token1}` }
  });
  assert(searchGoogle.status === 200, 'Search query returns 200');
  assert(searchGoogle.data.length === 1 && searchGoogle.data[0].company === 'Google', 'Search by company works case-insensitively');

  // Filter by status
  const filterInterview = await request('/applications?status=Interview', {
    headers: { Authorization: `Bearer ${token1}` }
  });
  assert(filterInterview.status === 200, 'Status filter query returns 200');
  assert(filterInterview.data.length === 1 && filterInterview.data[0].status === 'Interview', 'Status filter returns matching records');

  // 8. Test Get Single Application
  console.log('\n--- 5. Testing Single Application & Update ---');
  const getSingle = await request(`/applications/${app1Id}`, {
    headers: { Authorization: `Bearer ${token1}` }
  });
  assert(getSingle.status === 200, 'Get single application returns 200');
  assert(getSingle.data._id === app1Id, 'Returned ID matches requested ID');

  // Update application
  const updateApp = await request(`/applications/${app1Id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token1}` },
    body: {
      status: 'Selected',
      notes: 'Received official offer letter!'
    }
  });
  assert(updateApp.status === 200, 'Update application returns 200');
  assert(updateApp.data.status === 'Selected', 'Status updated to Selected');
  assert(updateApp.data.notes === 'Received official offer letter!', 'Notes updated');

  // 9. Multi-User Authorization & Isolation Tests
  console.log('\n--- 6. Testing Multi-User Ownership Isolation ---');
  // User 2 lists applications -> should be 0
  const user2Apps = await request('/applications', {
    headers: { Authorization: `Bearer ${token2}` }
  });
  assert(user2Apps.status === 200 && user2Apps.data.length === 0, 'User 2 cannot see User 1 applications in list');

  // User 2 attempts to GET User 1's application
  const user2GetApp1 = await request(`/applications/${app1Id}`, {
    headers: { Authorization: `Bearer ${token2}` }
  });
  assert(user2GetApp1.status === 404, 'User 2 cannot GET User 1 application (returns 404)');

  // User 2 attempts to PUT User 1's application
  const user2PutApp1 = await request(`/applications/${app1Id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token2}` },
    body: { status: 'Rejected' }
  });
  assert(user2PutApp1.status === 404, 'User 2 cannot UPDATE User 1 application (returns 404)');

  // User 2 attempts to DELETE User 1's application
  const user2DeleteApp1 = await request(`/applications/${app1Id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token2}` }
  });
  assert(user2DeleteApp1.status === 404, 'User 2 cannot DELETE User 1 application (returns 404)');

  // 10. Test Deletion by Owner
  console.log('\n--- 7. Testing Deletion by Owner ---');
  const deleteApp2 = await request(`/applications/${app2Id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token1}` }
  });
  assert(deleteApp2.status === 200, 'Owner can delete application with 200');

  const verifyDeleted = await request(`/applications/${app2Id}`, {
    headers: { Authorization: `Bearer ${token1}` }
  });
  assert(verifyDeleted.status === 404, 'Deleted application returns 404');

  console.log('\n========================================');
  console.log('🎉 ALL BACKEND & OWNERSHIP TESTS PASSED!');
  console.log('========================================\n');
}

runTests().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
