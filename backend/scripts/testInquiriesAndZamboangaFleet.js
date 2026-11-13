import assert from 'assert';

const BASE_URL = process.env.TEST_API_URL || 'http://127.0.0.1:3000/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('================================================================');
  console.log('🧪 Testing Zamboanga Fleet, Inquiries & Overview Telemetry');
  console.log('================================================================\n');

  // Test 1: Public Kiosks are centered in Zamboanga City
  const publicKiosksRes = await request('/public/kiosks');
  assert.strictEqual(publicKiosksRes.status, 200, 'Public kiosks fetch failed');
  assert.ok(publicKiosksRes.data.kiosks.length > 0, 'No public kiosks returned');
  const zambKiosks = publicKiosksRes.data.kiosks.filter((k) => k.city === 'Zamboanga City');
  assert.ok(zambKiosks.length >= 5, 'Expected at least 5 kiosks in Zamboanga City');
  console.log(`✅ PASS: Public kiosks localized to Zamboanga City (${zambKiosks.length} locations)`);

  const kcc = zambKiosks.find((k) => k.id === 'KIOSK-01-MAIN');
  assert.ok(kcc, 'KIOSK-01-MAIN not found');
  assert.strictEqual(kcc.latitude, 6.9214, 'KCC Mall latitude mismatch');
  assert.strictEqual(kcc.longitude, 122.079, 'KCC Mall longitude mismatch');
  console.log('✅ PASS: KCC Mall de Zamboanga coordinates verified: (6.9214, 122.0790)');

  // Test 2: Submit Customer Order Inquiry from Landing Page
  const inqPayload = {
    fullName: 'Maria Cristina Zamboanga',
    email: `maria_${Date.now()}@example.com`,
    phone: '0917-888-9999',
    preferredLocation: 'KCC Mall de Zamboanga (Camino Nuevo)',
    inquiryType: 'Order Shoe Cleaning Service',
    estimatedPairs: '3-5 Pairs',
    message: 'Need deep disinfection for sports shoes and leather dress shoes.',
  };
  const submitRes = await request('/public/inquiries', {
    method: 'POST',
    body: JSON.stringify(inqPayload),
  });
  assert.strictEqual(submitRes.status, 201, 'Customer inquiry submission failed');
  assert.ok(submitRes.data.inquiry, 'No inquiry returned in response');
  assert.ok(submitRes.data.inquiry.id.startsWith('INQ-ZAM-'), 'Inquiry ID should start with INQ-ZAM-');
  const createdInquiryId = submitRes.data.inquiry.id;
  console.log(`✅ PASS: Customer order inquiry created with ID: ${createdInquiryId}`);

  // Test 3: Super Admin Login & Verification
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: 'superadmin@kixcleen.com',
      password: 'admin1234',
    }),
  });
  assert.strictEqual(loginRes.status, 200, 'Super admin login failed');
  const adminToken = loginRes.data.token;
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  console.log('✅ PASS: Super admin logged in for administrative verification');

  // Test 4: Admin Inquiries Retrieval
  const adminInqRes = await request('/admin/inquiries', { headers: adminHeaders });
  assert.strictEqual(adminInqRes.status, 200, 'Admin inquiries fetch failed');
  const foundInq = adminInqRes.data.inquiries.find((i) => i.id === createdInquiryId);
  assert.ok(foundInq, 'Newly created inquiry not present in admin list');
  assert.strictEqual(foundInq.status, 'pending', 'Status should initially be pending');
  console.log('✅ PASS: Admin inquiries list contains newly submitted order inquiry');

  // Test 5: Admin Update Inquiry Status
  const patchRes = await request(`/admin/inquiries/${createdInquiryId}`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: JSON.stringify({ status: 'contacted', adminNotes: 'Called customer, confirmed schedule.' }),
  });
  assert.strictEqual(patchRes.status, 200, 'Update inquiry status failed');
  assert.strictEqual(patchRes.data.inquiry.status, 'contacted', 'Status was not updated');
  console.log('✅ PASS: Inquiry status successfully updated to "contacted"');

  // Test 6: Overview Telemetry Statistics
  const overviewRes = await request('/admin/overview', { headers: adminHeaders });
  assert.strictEqual(overviewRes.status, 200, 'Overview telemetry fetch failed');
  const ov = overviewRes.data.overview;
  assert.strictEqual(ov.fleetCity, 'Zamboanga City', 'Overview fleet city should be Zamboanga City');
  assert.ok(typeof ov.totalRevenue === 'number', 'Expected totalRevenue number');
  assert.ok(typeof ov.totalOrders === 'number', 'Expected totalOrders number');
  assert.ok(typeof ov.uptimePct === 'number', 'Expected uptimePct number');
  assert.ok(ov.serviceDistribution, 'Expected serviceDistribution breakdown');
  assert.ok(ov.categoryDistribution, 'Expected categoryDistribution breakdown');
  assert.ok(ov.fleetConsumables, 'Expected fleetConsumables breakdown');
  assert.ok(Array.isArray(ov.recentActivity), 'Expected recentActivity array');
  console.log(`✅ PASS: Overview statistics verified: Revenue ₱${ov.totalRevenue}, Orders: ${ov.totalOrders}, Uptime: ${ov.uptimePct}%`);

  // Test 7: Delete Inquiry Cleanup
  const deleteRes = await request(`/admin/inquiries/${createdInquiryId}`, {
    method: 'DELETE',
    headers: adminHeaders,
  });
  assert.strictEqual(deleteRes.status, 200, 'Inquiry deletion failed');
  console.log('✅ PASS: Test inquiry cleaned up successfully');

  console.log('\n================================================================');
  console.log('🎉 ALL 7 TESTS PASSED! ZAMBOANGA FLEET, INQUIRIES & STATS VERIFIED!');
  console.log('================================================================\n');
}

run().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
