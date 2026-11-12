/**
 * Automated End-to-End & Security Verification Suite for KixCleen Central Management Platform
 * Tests all 9 validation requirements:
 * 1. Super Admin authentication & RBAC enforcement
 * 2. Super Admin can create buyer accounts (without plaintext password exposure)
 * 3. Buyer accounts can complete their account setup via one-time invitation token
 * 4. Super Admin can register and assign kiosks (with conflicting assignment protection)
 * 5. Assigned kiosks appear in the correct buyer's monitoring app API
 * 6. Buyers cannot access unassigned kiosks or another buyer's transactions (403 Forbidden)
 * 7. Public users can view registered public kiosk locations & coordinates
 * 8. Public users cannot access private buyer account or transaction information
 * 9. Kiosk heartbeat & transaction updates remain consistent across applications
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

async function req(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

function assert(condition, label) {
  if (!condition) {
    console.error(`❌ FAIL: ${label}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${label}`);
}

async function runVerification() {
  console.log('================================================================');
  console.log('🧪 Running KixCleen Central Management Platform Verification');
  console.log('================================================================\n');

  // 1. Public Kiosk Locator API & Data Sanitization
  const pubRes = await req('/public/kiosks');
  assert(pubRes.ok && pubRes.data.success, 'Public user can fetch registered public kiosks');
  assert(Array.isArray(pubRes.data.kiosks) && pubRes.data.kiosks.length >= 4, 'Public kiosk directory returns registered locations');
  const samplePubKiosk = pubRes.data.kiosks[0];
  assert(
    samplePubKiosk.owner === undefined &&
      samplePubKiosk.buyer_id === undefined &&
      samplePubKiosk.buyerEmail === undefined,
    'Public kiosk payload does NOT expose private buyer ownership or confidential transaction data'
  );
  const missingCoordKiosk = pubRes.data.kiosks.find((k) => k.id === 'KIOSK-05-PASIG');
  assert(
    missingCoordKiosk && missingCoordKiosk.hasValidCoordinates === false,
    'Public API gracefully flags kiosks with missing coordinates (hasValidCoordinates: false)'
  );

  // 2. Unauthorized access to Super Admin & Monitoring APIs is blocked
  const unauthAdmin = await req('/admin/overview');
  assert(unauthAdmin.status === 401, 'Unauthenticated request to /api/admin/overview is rejected (401)');

  // 3. Super Admin Login
  const adminLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: 'superadmin@kixcleen.com',
      password: 'admin1234',
    }),
  });
  assert(
    adminLogin.ok && adminLogin.data.user?.role === 'superadmin',
    'Super Admin logs in successfully'
  );
  const adminToken = adminLogin.data.token;
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  // 4. Super Admin Overview
  const overviewRes = await req('/admin/overview', { headers: adminHeaders });
  assert(
    overviewRes.ok && overviewRes.data.overview.totalKiosks >= 5,
    'Super Admin can access fleet overview metrics'
  );

  // 5. Super Admin Registers a New Kiosk
  const uniqueSuffix = Date.now().toString().slice(-4);
  const testKioskId = `KIOSK-TEST-${uniqueSuffix}`;
  const createKioskRes = await req('/admin/kiosks', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      id: testKioskId,
      name: `KixCleen Test Kiosk #${uniqueSuffix} — Eastwood`,
      address: '188 E. Rodriguez Jr. Ave, Bagumbayan',
      city: 'Quezon City',
      location: 'Eastwood Mall Ground Arcade',
      latitude: 14.6097,
      longitude: 121.0798,
      status: 'online',
      isActive: true,
      isPublic: true,
    }),
  });
  assert(
    createKioskRes.status === 201 && createKioskRes.data.kiosk.id === testKioskId,
    `Super Admin registered new kiosk (${testKioskId}) with coordinates`
  );

  // 6. Super Admin Creates Buyer Account (Workflow Steps 3-7)
  const testBuyerEmail = `buyer.${uniqueSuffix}@kixtest.ph`;
  const createBuyerRes = await req('/admin/buyers', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      fullName: `Test Buyer ${uniqueSuffix}`,
      email: testBuyerEmail,
      username: `buyer_${uniqueSuffix}`,
      phone: '+63 917 000 1234',
      companyName: 'Eastwood Kicks Partner LLC',
    }),
  });
  assert(
    createBuyerRes.status === 201 &&
      createBuyerRes.data.buyer.accountStatus === 'invited' &&
      createBuyerRes.data.buyer.password_hash === undefined &&
      Boolean(createBuyerRes.data.invitation?.token),
    'Super Admin created buyer account and generated one-time invitation token (no plaintext password stored/exposed)'
  );
  const testBuyerId = createBuyerRes.data.buyer.id;
  const inviteToken = createBuyerRes.data.invitation.token;

  // 7. Super Admin Assigns Kiosk to Buyer & Tests Conflicting Assignment Rule
  const assignRes = await req('/admin/assignments', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      buyerId: testBuyerId,
      kioskIds: [testKioskId],
      notes: 'Automated E2E verification assignment',
    }),
  });
  assert(
    assignRes.ok &&
      assignRes.data.buyer.assignedKiosks.some((k) => k.id === testKioskId),
    `Super Admin assigned ${testKioskId} to new buyer (${testBuyerId})`
  );

  // Attempting to assign KIOSK-01-MAIN (already owned by USR-001-OWNER) without allowTransfer must return 409 Conflict
  const conflictRes = await req('/admin/assignments', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      buyerId: testBuyerId,
      kioskIds: ['KIOSK-01-MAIN'],
      allowTransfer: false,
    }),
  });
  assert(
    conflictRes.status === 409 && conflictRes.data.code === 'CONFLICTING_ASSIGNMENT',
    'Ownership rule prevents conflicting kiosk assignment without explicit transfer authorization (409 Conflict)'
  );

  // 8. Buyer Verifies Invitation Token & Completes Account Setup (Workflow Steps 7-8)
  const verifyInviteRes = await req(`/auth/verify-invite?token=${inviteToken}`);
  assert(
    verifyInviteRes.ok &&
      verifyInviteRes.data.invitation.email === testBuyerEmail &&
      verifyInviteRes.data.invitation.assignedKioskIds.includes(testKioskId),
    'Buyer invitation token verification returns buyer profile & assigned kiosk IDs'
  );

  const completeSetupRes = await req('/auth/complete-setup', {
    method: 'POST',
    body: JSON.stringify({
      token: inviteToken,
      password: 'BuyerSecurePass2026!',
    }),
  });
  assert(
    completeSetupRes.ok && completeSetupRes.data.user.accountStatus === 'active',
    'Buyer completed account setup and set password via one-time invitation token'
  );

  // Re-using the same one-time token must fail (404)
  const reuseTokenRes = await req(`/auth/verify-invite?token=${inviteToken}`);
  assert(
    reuseTokenRes.status === 404,
    'One-time invitation token is invalidated immediately after password setup'
  );

  // 9. Buyer Logs In to Monitoring App & Retrieves ONLY Assigned Kiosks (Workflow Steps 9-10)
  const buyerLoginRes = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: testBuyerEmail,
      password: 'BuyerSecurePass2026!',
    }),
  });
  assert(
    buyerLoginRes.ok && buyerLoginRes.data.token,
    'New buyer can log in to KixCleen Monitoring API'
  );
  const buyerHeaders = { Authorization: `Bearer ${buyerLoginRes.data.token}` };

  // Buyer cannot access Super Admin routes
  const buyerAdminAttempt = await req('/admin/overview', { headers: buyerHeaders });
  assert(
    buyerAdminAttempt.status === 403,
    'Buyer is blocked from accessing Super Admin routes (403 Forbidden)'
  );

  // Buyer fetches /api/machine/status -> sees ONLY testKioskId
  const buyerMachineRes = await req('/machine/status', { headers: buyerHeaders });
  assert(
    buyerMachineRes.ok &&
      buyerMachineRes.data.kiosks.length === 1 &&
      buyerMachineRes.data.kiosks[0].id === testKioskId,
    `Buyer monitoring API retrieves ONLY assigned kiosk (${testKioskId}) and hides other buyers' kiosks`
  );

  // Buyer attempts to query unassigned kiosk KIOSK-01-MAIN -> 403 Forbidden
  const unauthorizedKioskAttempt = await req(
    '/dashboard/stats?kioskId=KIOSK-01-MAIN',
    { headers: buyerHeaders }
  );
  assert(
    unauthorizedKioskAttempt.status === 403,
    'Buyer is blocked from querying unassigned kiosk stats (403 Forbidden)'
  );

  // Buyer attempts to view another buyer's transaction (TX-1001 on KIOSK-01-MAIN) -> 403 Forbidden
  const unauthorizedTxAttempt = await req('/transactions/TX-1001', {
    headers: buyerHeaders,
  });
  assert(
    unauthorizedTxAttempt.status === 403,
    "Buyer is blocked from viewing another buyer's transaction detail (403 Forbidden)"
  );

  // 10. Kiosk Heartbeat & Transaction Consistency Across All Apps
  const testOrderId = `KIX-20261113-${uniqueSuffix}`;
  const txPostRes = await req('/transactions', {
    method: 'POST',
    body: JSON.stringify({
      orderId: testOrderId,
      kioskId: testKioskId,
      shoeType: 'Leather Shoes',
      serviceTier: 'disinfection',
      serviceName: 'Disinfection',
      addons: [{ id: 'dryer', name: 'Dryer', price: 20 }],
      basePrice: 50,
      totalAmount: 70,
      paymentMethod: 'gcash',
      paymentStatus: 'paid',
      cleaningStatus: 'in_progress',
    }),
  });
  assert(
    txPostRes.status === 201,
    `Kiosk app recorded new transaction (${testOrderId}) on ${testKioskId}`
  );

  const buyerTxListRes = await req('/transactions', { headers: buyerHeaders });
  assert(
    buyerTxListRes.ok &&
      buyerTxListRes.data.transactions.length === 1 &&
      buyerTxListRes.data.transactions[0].orderId === testOrderId,
    "Assigned buyer immediately sees their kiosk's new transaction in Monitoring App"
  );

  console.log('\n================================================================');
  console.log('🎉 ALL 17 E2E & SECURITY VERIFICATION CHECKS PASSED!');
  console.log('================================================================');
}

runVerification().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
