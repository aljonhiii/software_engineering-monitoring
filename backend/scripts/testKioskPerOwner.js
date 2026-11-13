/**
 * End-to-End Verification Test for Kiosk-Per-Owner Provisioning & Launcher System
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

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

async function run() {
  console.log('================================================================');
  console.log('🚀 Running Kiosk-Per-Owner Automated Verification');
  console.log('================================================================\n');

  // Step 1: Super Admin Login
  const loginRes = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: 'superadmin@kixcleen.com',
      password: 'admin1234',
    }),
  });
  assert(loginRes.ok && loginRes.data.user?.role === 'superadmin', 'Super Admin logged in successfully');
  const adminToken = loginRes.data.token;
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  // Step 2: Super Admin creates a new buyer with auto-dedicated kiosk
  const rand = Math.floor(1000 + Math.random() * 9000);
  const testUsername = `owner_${rand}`;
  const testFullName = `Branch Owner ${rand}`;
  const testEmail = `owner_${rand}@partner.ph`;

  const createBuyerRes = await req('/admin/buyers', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      fullName: testFullName,
      email: testEmail,
      username: testUsername,
      phone: '+63 917 111 ' + rand,
      companyName: `Partner Branch ${rand}`,
      createDedicatedKiosk: true,
      dedicatedKioskName: `${testFullName} Terminal`,
      dedicatedKioskCity: 'Makati City',
      dedicatedKioskAddress: 'Greenbelt 5 Ground Floor',
    }),
  });

  assert(createBuyerRes.status === 201 && createBuyerRes.data.success, 'Super Admin created owner with dedicated kiosk');
  const { buyer, invitation, dedicatedKiosk } = createBuyerRes.data;
  assert(dedicatedKiosk && dedicatedKiosk.id, `Dedicated kiosk provisioned with ID: ${dedicatedKiosk?.id}`);
  assert(
    dedicatedKiosk.launcherUrl.startsWith('http://localhost:8081') &&
      dedicatedKiosk.launcherUrl.includes(`?kioskId=${encodeURIComponent(dedicatedKiosk.id)}`),
    `Dedicated kiosk launcher URL points to Shoeclean on port 8081: ${dedicatedKiosk.launcherUrl}`
  );
  assert(invitation && invitation.token, 'Account setup invitation token generated');

  // Step 3: Verify the owner's invitation setup endpoint
  const inviteRes = await req(`/auth/verify-invite?token=${encodeURIComponent(invitation.token)}`);
  assert(inviteRes.ok && inviteRes.data.success, 'Owner invitation token verified');
  const inviteData = inviteRes.data.invitation;
  assert(
    inviteData.assignedKiosks && inviteData.assignedKiosks.some((k) => k.id === dedicatedKiosk.id),
    'Invitation endpoint includes assigned dedicated kiosk in assignedKiosks'
  );
  const invitedKiosk = inviteData.assignedKiosks.find((k) => k.id === dedicatedKiosk.id);
  assert(invitedKiosk.launcherUrl, 'Assigned kiosk in invitation has launcherUrl');

  // Step 4: Complete Account Setup (Set Password)
  const completeRes = await req('/auth/complete-setup', {
    method: 'POST',
    body: JSON.stringify({
      token: invitation.token,
      password: 'password1234',
    }),
  });
  assert(completeRes.ok && completeRes.data.success, 'Owner completed password setup');

  // Step 5: Owner Logs In
  const ownerLoginRes = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: testUsername,
      password: 'password1234',
    }),
  });
  assert(ownerLoginRes.ok && ownerLoginRes.data.token, 'New owner logged into monitoring backend');
  const ownerToken = ownerLoginRes.data.token;
  const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };

  // Step 6: Owner dashboard shows their dedicated kiosk and 0 initial transactions
  const ownerStatsRes = await req('/dashboard/stats', { headers: ownerHeaders });
  assert(ownerStatsRes.ok, 'Owner fetched dashboard stats');
  assert(
    ownerStatsRes.data.stats?.primaryKioskId === dedicatedKiosk.id,
    `Dedicated kiosk ${dedicatedKiosk.id} is primary kiosk in owner dashboard stats`
  );
  assert(
    ownerStatsRes.data.stats?.assignedKiosksCount === 1,
    'Owner has exactly 1 assigned kiosk'
  );

  const machineRes = await req('/machine/status', { headers: ownerHeaders });
  assert(
    machineRes.ok && machineRes.data.kiosks && machineRes.data.kiosks.some((k) => k.id === dedicatedKiosk.id),
    'Dedicated kiosk appears in new owner /api/machine/status list'
  );

  const initialTxRes = await req('/transactions', { headers: ownerHeaders });
  assert(initialTxRes.ok && initialTxRes.data.count === 0, 'Initial transactions count for new owner is 0');

  // Step 7: Simulate Order Submitted on Dedicated Kiosk
  const testOrderId = `ORD-${rand}-${Date.now().toString().slice(-4)}`;
  const orderRes = await req('/transactions', {
    method: 'POST',
    body: JSON.stringify({
      orderId: testOrderId,
      kioskId: dedicatedKiosk.id,
      shoeType: 'Canvas Sneakers',
      serviceTier: 'deep_clean',
      serviceName: 'Deep Cleaning',
      addons: [{ id: 'deodorizer', name: 'Deodorizer', price: 50 }],
      basePrice: 250,
      addonsPrice: 50,
      totalAmount: 300,
      paymentMethod: 'gcash',
      paymentStatus: 'paid',
      transactionId: `GCASH-${rand}`,
    }),
  });
  assert(orderRes.ok && orderRes.data.success, `Order ${testOrderId} submitted for kiosk ${dedicatedKiosk.id}`);

  // Step 8: Verify Order appears in this owner's transactions
  const updatedOwnerTxRes = await req('/transactions', { headers: ownerHeaders });
  assert(
    updatedOwnerTxRes.ok &&
      updatedOwnerTxRes.data.transactions &&
      updatedOwnerTxRes.data.transactions.some((t) => t.orderId === testOrderId),
    `Order ${testOrderId} reflected on owner ${testUsername}'s monitoring feed!`
  );

  // Step 9: Verify Strict Multi-Tenant Isolation (Other owner 'sample' cannot see this order)
  const sampleLoginRes = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: 'sample',
      password: 'sample1234',
    }),
  });
  assert(sampleLoginRes.ok, 'Sample owner logged in');
  const sampleHeaders = { Authorization: `Bearer ${sampleLoginRes.data.token}` };

  const sampleTxRes = await req('/transactions', { headers: sampleHeaders });
  assert(sampleTxRes.ok, "Sample owner fetched transactions");
  const leakedOrder = sampleTxRes.data.transactions.find((t) => t.orderId === testOrderId);
  assert(!leakedOrder, `Strict Isolation Confirmed: Order ${testOrderId} is NOT visible to other owner 'sample'!`);

  // Step 10: Verify Super Admin Buyers List contains assigned kiosk with launcher
  const adminBuyersRes = await req('/admin/buyers', { headers: adminHeaders });
  assert(adminBuyersRes.ok, 'Super Admin fetched buyers list');
  const listedBuyer = adminBuyersRes.data.buyers.find((b) => b.id === buyer.id);
  assert(listedBuyer, 'Newly created buyer appears in superadmin buyers list');
  assert(
    listedBuyer.assignedKiosks && listedBuyer.assignedKiosks.some((k) => k.id === dedicatedKiosk.id && k.launcherUrl),
    'Assigned kiosk in superadmin buyers list has valid launcherUrl'
  );

  console.log('\n================================================================');
  console.log('🎉 ALL 10 TESTS PASSED! KIOSK-PER-OWNER WORKFLOW FULLY VERIFIED!');
  console.log('================================================================');
}

run().catch((err) => {
  console.error('Fatal error during test:', err);
  process.exit(1);
});
