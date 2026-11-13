import assert from 'assert';

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

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
  console.log('🧪 Testing Email Invitation & Buyer Setup Lifecycle');
  console.log('================================================================\n');

  // Step 1: Login as Super Admin
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
  console.log('✅ PASS: Super admin logged in');

  // Step 2: Create a new buyer
  const uniqueId = Date.now().toString().slice(-4);
  const testEmail = `buyer_${uniqueId}@example.com`;
  const testFullName = `Auto Buyer ${uniqueId}`;

  const createRes = await request('/admin/buyers', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      fullName: testFullName,
      email: testEmail,
      createDedicatedKiosk: true,
      dedicatedKioskName: `${testFullName}'s Kiosk`,
    }),
  });

  assert.strictEqual(createRes.status, 201, 'Failed to create buyer');
  const buyerId = createRes.data.buyer.id;
  const rawInviteToken = createRes.data.invitation.token;
  const setupUrl = createRes.data.invitation.setupUrl;

  assert(setupUrl, 'Setup URL should be present in creation response');
  assert(createRes.data.emailResult, 'emailResult should be present in response');
  assert.strictEqual(createRes.data.buyer.setupStatus, 'not_done', 'Initial setupStatus must be not_done');
  assert.strictEqual(createRes.data.buyer.isSetupComplete, false, 'Initial isSetupComplete must be false');
  console.log(`✅ PASS: Buyer created with email ${testEmail}`);
  console.log(`   Setup URL generated: ${setupUrl}`);
  console.log(`   Email dispatch mode: ${createRes.data.emailResult.mode} (sent: ${createRes.data.emailResult.sent})`);

  // Step 3: Fetch buyers list and verify initial status
  const listRes1 = await request('/admin/buyers', { headers: adminHeaders });
  assert.strictEqual(listRes1.status, 200);
  const buyerBefore = listRes1.data.buyers.find((b) => b.id === buyerId);
  assert(buyerBefore, 'Created buyer must appear in buyers list');
  assert.strictEqual(buyerBefore.setupStatus, 'not_done');
  assert.strictEqual(buyerBefore.isSetupComplete, false);
  console.log('✅ PASS: Buyers list shows buyer as setupStatus: "not_done"');

  // Step 4: Verify the invitation token
  const verifyRes = await request(`/auth/verify-invite?token=${rawInviteToken}`);
  assert.strictEqual(verifyRes.status, 200, 'verify-invite should succeed with valid token');
  assert.strictEqual(verifyRes.data.invitation.email, testEmail);
  console.log('✅ PASS: Invitation token verified successfully');

  // Step 5: Complete account setup by setting password
  const completeRes = await request('/auth/complete-setup', {
    method: 'POST',
    body: JSON.stringify({
      token: rawInviteToken,
      password: 'StrongPassword123!',
    }),
  });
  assert.strictEqual(completeRes.status, 200, 'completeAccountSetup failed');
  console.log('✅ PASS: Account setup completed (password set)');

  // Step 6: Verify buyers list now shows setupStatus: "done"
  const listRes2 = await request('/admin/buyers', { headers: adminHeaders });
  assert.strictEqual(listRes2.status, 200);
  const buyerAfter = listRes2.data.buyers.find((b) => b.id === buyerId);
  assert.strictEqual(buyerAfter.setupStatus, 'done', 'setupStatus must now be "done"');
  assert.strictEqual(buyerAfter.isSetupComplete, true, 'isSetupComplete must now be true');
  console.log('✅ PASS: Buyers list shows buyer as setupStatus: "done" (Setup Link button will be hidden)');

  // Step 7: Attempt to regenerate invite for completed buyer
  const reInviteRes = await request(`/admin/buyers/${buyerId}/invite`, {
    method: 'POST',
    headers: adminHeaders,
  });
  assert.strictEqual(reInviteRes.status, 400, 'Re-inviting a completed buyer must be rejected');
  assert.strictEqual(reInviteRes.data.setupStatus, 'done');
  console.log('✅ PASS: Super admin cannot regenerate invite for already completed account');

  // Step 8: Attempt to re-use token on verify-invite
  const reVerifyRes = await request(`/auth/verify-invite?token=${rawInviteToken}`);
  assert.strictEqual(reVerifyRes.status, 404, 'Used token must return 404');
  assert.strictEqual(reVerifyRes.data.code, 'INVALID_OR_USED');
  console.log('✅ PASS: Used token rejected with code "INVALID_OR_USED" (Setup Page shows "Already Done")');

  console.log('\n================================================================');
  console.log('🎉 ALL 8 TESTS PASSED! EMAIL INVITATION & LIFECYCLE FULLY VERIFIED!');
  console.log('================================================================\n');
}

run().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
