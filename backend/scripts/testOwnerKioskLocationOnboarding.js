// Script to verify Owner Onboarding and Kiosk Location Registration
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('--- Starting Owner Onboarding & Kiosk Location Registration Backend Tests ---');

  // Step 1: Login as sample buyer
  console.log('\n[1] Logging in as sample owner (username: "sample", password: "password")...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'sample', password: 'password' }),
  });

  const loginData = await loginRes.json();
  console.log('Login Response:', {
    success: loginData.success,
    role: loginData.user?.role,
    assignedKioskIds: loginData.user?.assignedKioskIds,
    onboardingCompleted: loginData.user?.onboardingCompleted,
  });

  if (!loginData.success) {
    throw new Error('Login failed: ' + loginData.message);
  }

  const token = loginData.token;

  // Step 2: Test invalid coordinate validation
  console.log('\n[2] Testing invalid coordinate validation (latitude out of bounds)...');
  const invalidRes = await fetch(`${BASE_URL}/machine/register-location`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      latitude: 999.0, // invalid!
      longitude: 122.079,
      address: 'Test Invalid Coords',
    }),
  });
  const invalidData = await invalidRes.json();
  console.log('Invalid coords response (expected 400):', invalidRes.status, invalidData.message);

  if (invalidRes.status !== 400) {
    throw new Error('Validation failed to catch invalid coordinates!');
  }

  // Step 3: Register a realistic Zamboanga City location
  console.log('\n[3] Registering valid kiosk location in Zamboanga City (Gov. Camins Ave)...');
  const validRes = await fetch(`${BASE_URL}/machine/register-location`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      kioskId: loginData.user.assignedKioskIds?.[0] || 'KIOSK-01-MAIN',
      latitude: 6.9214,
      longitude: 122.0790,
      address: 'Gov. Camins Ave, Near KCC Mall de Zamboanga',
      barangay: 'Canelar',
      city: 'Zamboanga City',
      locationName: 'KCC Mall de Zamboanga - North Entrance',
    }),
  });

  const validData = await validRes.json();
  console.log('Register Location Response:', validData);

  if (!validData.success) {
    throw new Error('Failed to register kiosk location: ' + validData.message);
  }

  // Step 4: Verify getMe reflects onboardingCompleted: true
  console.log('\n[4] Verifying /auth/me returns onboardingCompleted: true...');
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meData = await meRes.json();
  console.log('Me Response onboardingCompleted:', meData.user?.onboardingCompleted);

  if (meData.user?.onboardingCompleted !== true) {
    throw new Error('Expected onboardingCompleted to be true, got: ' + meData.user?.onboardingCompleted);
  }

  console.log('\n✅ All Backend Onboarding & Location Registration Tests Passed Successfully!');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
