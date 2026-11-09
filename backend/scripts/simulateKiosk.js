import http from 'http';

const API_PORT = process.env.PORT || 3000;
const HOST = '127.0.0.1';

function postJson(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request(
      {
        hostname: HOST,
        port: API_PORT,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
          } catch {
            resolve({ statusCode: res.statusCode, body });
          }
        });
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function patchJson(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request(
      {
        hostname: HOST,
        port: API_PORT,
        path,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
          } catch {
            resolve({ statusCode: res.statusCode, body });
          }
        });
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

const SHOE_TYPES = [
  'Sneakers / Canvas',
  'Sports / Running',
  'Leather / Formal',
  'Suede / Nubuck',
  'Streetwear High-Tops',
];

const SERVICES = [
  { tier: 'quick', name: 'Quick Clean', price: 80 },
  { tier: 'standard', name: 'Standard Clean', price: 100 },
  { tier: 'deep', name: 'Deep Clean', price: 120 },
];

const ADDONS = [
  { name: 'Anti-Bacterial Deodorizer Spray', price: 30 },
  { name: 'Water-Repellent Nano Coating', price: 50 },
];

const METHODS = ['gcash', 'maya', 'cash'];

let waterLevel = 92;
let soapLevel = 88;

async function sendTelemetry(activity = 'Idle - Ready for customer', doorLocked = false, currentOrderId = null) {
  try {
    // Slight fluctuation in sensor levels
    waterLevel = Math.max(15, waterLevel - (activity.includes('Washing') ? 2 : 0.1));
    soapLevel = Math.max(12, soapLevel - (activity.includes('Foaming') ? 1.5 : 0.05));

    await postJson('/api/machine/heartbeat', {
      kioskId: 'KIOSK-01-MAIN',
      status: 'online',
      doorLocked,
      waterLevelPercent: Math.round(waterLevel),
      soapLevelPercent: Math.round(soapLevel),
      currentOrderId,
      currentActivity: activity,
    });
    console.log(`📡 [Telemetry] Heartbeat sent: ${activity} | Water: ${Math.round(waterLevel)}% | Soap: ${Math.round(soapLevel)}% | Door: ${doorLocked ? 'LOCKED' : 'UNLOCKED'}`);
  } catch (err) {
    console.error('❌ Telemetry heartbeat failed:', err.message);
  }
}

async function simulateOrder() {
  const orderNumber = Math.floor(1000 + Math.random() * 9000);
  const orderId = `KIX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${orderNumber}`;
  const shoe = SHOE_TYPES[Math.floor(Math.random() * SHOE_TYPES.length)];
  const svc = SERVICES[Math.floor(Math.random() * SERVICES.length)];
  const method = METHODS[Math.floor(Math.random() * METHODS.length)];
  const selectedAddons = Math.random() > 0.5 ? [ADDONS[Math.floor(Math.random() * ADDONS.length)]] : [];
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const totalAmount = svc.price + addonsTotal;

  console.log('\n======================================================');
  console.log(`👟 [Kiosk Sim] Customer initiated new order: #${orderId}`);
  console.log(`   Shoe: ${shoe} | Service: ${svc.name} (₱${svc.price})`);
  console.log(`   Method: ${method.toUpperCase()} | Total: ₱${totalAmount}`);
  console.log('======================================================');

  // Step 1: Create transaction (Customer inserts payment)
  await postJson('/api/transactions', {
    orderId,
    kioskId: 'KIOSK-01-MAIN',
    shoeType: shoe,
    serviceTier: svc.tier,
    serviceName: svc.name,
    addons: selectedAddons,
    basePrice: svc.price,
    addonsPrice: addonsTotal,
    totalAmount,
    paymentMethod: method,
    paymentStatus: 'paid',
    paymentRef: method === 'cash' ? `bill_val_${Math.floor(Math.random() * 9999)}` : `xnd_sim_${Math.floor(Math.random() * 99999)}`,
    cleaningStatus: 'pending',
  });

  // Step 2: Customer inserts shoes and door locks
  await new Promise((r) => setTimeout(r, 2000));
  await sendTelemetry(`Customer loaded shoes - Order #${orderId}`, true, orderId);

  // Step 3: Foam spraying & washing cycle
  await new Promise((r) => setTimeout(r, 3000));
  await patchJson(`/api/transactions/${orderId}`, { cleaningStatus: 'in_progress' });
  await sendTelemetry(`Foaming & dual-axis rotary brushing...`, true, orderId);

  // Step 4: Drying cycle
  await new Promise((r) => setTimeout(r, 4000));
  await sendTelemetry(`Thermal warm-air UV ozone sterilization drying...`, true, orderId);

  // Step 5: Finished & Door unlocks
  await new Promise((r) => setTimeout(r, 4000));
  await patchJson(`/api/transactions/${orderId}`, { cleaningStatus: 'completed' });
  await sendTelemetry(`Cycle completed! Ready for customer retrieval.`, false, orderId);

  console.log(`✅ [Kiosk Sim] Order #${orderId} completed successfully!\n`);

  await new Promise((r) => setTimeout(r, 3000));
  await sendTelemetry(`Idle - Ready for customer`, false, null);
}

async function start() {
  console.log('🤖 Starting KixCleen Kiosk Hardware & Customer Activity Simulator...');
  console.log(`Connecting to backend on http://${HOST}:${API_PORT}\n`);

  // Initial heartbeat
  await sendTelemetry('System Online - Kiosk Ready', false, null);

  // Run periodic telemetry heartbeat every 8 seconds
  setInterval(() => {
    sendTelemetry('Idle - Ready for customer', false, null);
  }, 8000);

  // Run first simulated order after 2 seconds
  setTimeout(async () => {
    await simulateOrder();
  }, 2000);
}

start();
