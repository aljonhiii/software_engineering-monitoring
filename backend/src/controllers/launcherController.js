/**
 * Dynamic Kiosk Terminal Launcher & Auto-Discovery Controller
 * Discovers and routes to the active Shoeclean Kiosk application regardless
 * of which port Expo bundler is currently running on (8081, 8082, 8083, etc.).
 */

let lastRegisteredShoecleanUrl = null;

const CANDIDATE_PORTS = [8081, 8082, 8083, 8084, 8085, 8080, 19006, 19000];

/**
 * Checks a specific port to see if it is running the Shoeclean kiosk customer terminal.
 */
async function probePortForShoeclean(port, timeoutMs = 350) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`http://localhost:${port}`, { signal: ctrl.signal });
    clearTimeout(timer);

    if (!res.ok && res.status !== 304) return false;
    const text = await res.text();

    const isMonitorApp =
      text.includes('KixCleen Monitor') ||
      text.includes('kixcleenmonitor') ||
      text.includes('kixcleen-monitor');

    const isShoecleanKiosk =
      (text.includes('<title>KixCleen</title>') ||
        text.includes('shoeclean') ||
        text.includes('com.shoeclean.vendo')) &&
      !isMonitorApp;

    return isShoecleanKiosk;
  } catch {
    return false;
  }
}

/**
 * Dynamically resolves the base URL where Shoeclean Kiosk is currently accessible.
 */
export async function findActiveShoecleanUrl() {
  // 1. Check last actively registered URL from heartbeat / client ping
  if (lastRegisteredShoecleanUrl) {
    try {
      const urlObj = new URL(lastRegisteredShoecleanUrl);
      const port = Number(urlObj.port) || 80;
      const isAlive = await probePortForShoeclean(port, 250);
      if (isAlive) return lastRegisteredShoecleanUrl;
    } catch {
      lastRegisteredShoecleanUrl = null;
    }
  }

  // 2. Check environment variable override if set
  if (process.env.KIOSK_BASE_URL) {
    try {
      const urlObj = new URL(process.env.KIOSK_BASE_URL);
      const port = Number(urlObj.port) || 80;
      const isAlive = await probePortForShoeclean(port, 250);
      if (isAlive) return process.env.KIOSK_BASE_URL;
    } catch {
      // Fall through to scanner
    }
  }

  // 3. Scan all candidate ports in parallel
  const probePromises = CANDIDATE_PORTS.map(async (port) => {
    const isShoeclean = await probePortForShoeclean(port, 350);
    return isShoeclean ? `http://localhost:${port}` : null;
  });

  const results = await Promise.all(probePromises);
  const found = results.find(Boolean) || null;

  if (found) {
    lastRegisteredShoecleanUrl = found;
  }

  return found;
}

/**
 * GET /api/launcher/kiosk?kioskId=KIOSK-XYZ
 * Main launcher entry point: opens the Shoeclean Kiosk directly on its active port.
 */
export async function launchKiosk(req, res) {
  const kioskId = String(req.query.kioskId || 'KIOSK-01-MAIN').trim().toUpperCase();
  const activeUrl = await findActiveShoecleanUrl();

  if (activeUrl) {
    const targetUrl = `${activeUrl}/?kioskId=${encodeURIComponent(kioskId)}`;
    console.log(`[Launcher] Redirecting to active Shoeclean Kiosk at: ${targetUrl}`);
    return res.redirect(302, targetUrl);
  }

  // If Shoeclean is not running yet, serve an auto-refreshing helper page
  res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Connecting to KixCleen Kiosk Terminal</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 32px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      background: #0284c7;
      color: white;
      margin-bottom: 16px;
    }
    .spinner {
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top-color: #38bdf8;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      animation: spin 0.8s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h1 {
      font-size: 20px;
      margin: 0 0 8px 0;
      color: #ffffff;
    }
    p {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.5;
      margin: 8px 0;
    }
    .kiosk-tag {
      font-family: monospace;
      font-weight: bold;
      color: #38bdf8;
      background: #0f172a;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid #334155;
    }
    .instruction {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 12px;
      font-family: monospace;
      font-size: 12px;
      color: #a5f3fc;
      margin: 16px 0;
      text-align: left;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Auto-Detecting Kiosk Terminal</div>
    <h1>Launching Shoeclean Kiosk</h1>
    <p>Target Machine ID: <span class="kiosk-tag">${kioskId}</span></p>
    <div class="spinner"></div>
    <p>Searching active local ports for the <strong>Shoeclean Kiosk</strong> application...</p>
    <div class="instruction">
      cd shoeclean<br/>
      npm run web
    </div>
    <p style="font-size: 11px; color: #64748b;">This page will automatically redirect the moment Shoeclean starts up on any port.</p>
  </div>

  <script>
    const kioskId = ${JSON.stringify(kioskId)};
    async function checkActivePort() {
      try {
        const res = await fetch('/api/launcher/detect?kioskId=' + encodeURIComponent(kioskId));
        if (res.ok) {
          const data = await res.json();
          if (data.running && data.targetUrl) {
            window.location.replace(data.targetUrl);
            return;
          }
        }
      } catch (err) {}
      setTimeout(checkActivePort, 1500);
    }
    setTimeout(checkActivePort, 1000);
  </script>
</body>
</html>
  `);
}

/**
 * GET /api/launcher/detect?kioskId=KIOSK-XYZ
 * Returns JSON with the detected Shoeclean Kiosk port and target URL.
 */
export async function detectKiosk(req, res) {
  const kioskId = String(req.query.kioskId || 'KIOSK-01-MAIN').trim().toUpperCase();
  const activeUrl = await findActiveShoecleanUrl();

  res.json({
    success: true,
    running: Boolean(activeUrl),
    baseUrl: activeUrl,
    targetUrl: activeUrl ? `${activeUrl}/?kioskId=${encodeURIComponent(kioskId)}` : null,
  });
}

/**
 * POST /api/launcher/register
 * Allows Shoeclean app instances to report their active URL dynamically.
 */
export async function registerKiosk(req, res) {
  const { origin } = req.body || {};
  if (origin && typeof origin === 'string') {
    try {
      const urlObj = new URL(origin);
      lastRegisteredShoecleanUrl = `${urlObj.protocol}//${urlObj.host}`;
      console.log(`[Launcher] Shoeclean registered its active URL: ${lastRegisteredShoecleanUrl}`);
      return res.json({ success: true, registeredUrl: lastRegisteredShoecleanUrl });
    } catch {
      // Ignore invalid URL
    }
  }
  res.json({ success: false, message: 'Invalid origin' });
}
