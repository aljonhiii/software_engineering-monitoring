import nodemailer from 'nodemailer';
import os from 'os';
import dotenv from 'dotenv';

/**
 * Detect primary physical IPv4 address for fallback LAN links.
 */
export function getPrimaryLanIp() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    const lower = name.toLowerCase();
    const isVirtual = /(virtual|vethernet|hyper-v|vbox|wsl|docker|loopback)/i.test(lower);
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) {
        // Exclude VirtualBox Host-Only (192.168.56.x) and link-local (169.254.x)
        if (!addr.address.startsWith('192.168.56.') && !addr.address.startsWith('169.254.')) {
          if (!isVirtual && (addr.address.startsWith('192.168.') || addr.address.startsWith('10.') || addr.address.startsWith('172.'))) {
            return addr.address;
          }
          candidates.push({ ip: addr.address, isVirtual });
        }
      }
    }
  }

  const physical = candidates.find((c) => !c.isVirtual);
  return physical ? physical.ip : (candidates[0]?.ip || '127.0.0.1');
}

/**
 * Get active frontend base URL for invitations.
 * Automatically resolves to the physical LAN IP in development (or explicit production domain)
 * so email links opened on mobile phones/tablets connect smoothly.
 */
export function getFrontendBaseUrl(req = null) {
  dotenv.config({ override: true });
  const configured = process.env.FRONTEND_URL
    ? String(process.env.FRONTEND_URL).trim().replace(/\/+$/, '')
    : '';

  // If explicitly configured with a public production domain (not localhost), use it
  if (configured && !configured.includes('localhost') && !configured.includes('127.0.0.1')) {
    return configured;
  }

  // If request comes from an external host/IP, infer the host
  if (req && typeof req.get === 'function') {
    const hostHeader = req.get('host');
    if (hostHeader && !hostHeader.includes('localhost') && !hostHeader.includes('127.0.0.1')) {
      const hostIp = hostHeader.split(':')[0];
      return `http://${hostIp}:5173`;
    }
  }

  // Auto-detect host computer's active Wi-Fi LAN IP
  const lanIp = getPrimaryLanIp();
  return `http://${lanIp}:5173`;
}

/**
 * Creates and verifies nodemailer transporter if credentials exist.
 */
function getTransporter() {
  // Dynamically reload .env to ensure fresh credentials even if server was not restarted
  dotenv.config({ override: true });

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER ? String(process.env.SMTP_USER).trim() : '';
  const pass = process.env.SMTP_PASS ? String(process.env.SMTP_PASS).replace(/\s+/g, '') : '';

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false, // Prevents self-signed cert blocks in dev
    },
  });
}

/**
 * Sanitize strings against HTML / XSS injection in email clients.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate responsive HTML email for buyer account activation.
 */
function buildInvitationHtml({ fullName, username, setupUrl, dedicatedKiosk, expiresAt }) {
  const safeFullName = escapeHtml(fullName);
  const safeUsername = escapeHtml(username);
  const safeKioskId = dedicatedKiosk ? escapeHtml(dedicatedKiosk.id) : '';
  const safeKioskName = dedicatedKiosk ? escapeHtml(dedicatedKiosk.name || 'Dedicated KixCleen Machine') : '';
  const safeKioskCity = dedicatedKiosk ? escapeHtml(dedicatedKiosk.city || 'Zamboanga City') : '';

  const kioskSnippet = dedicatedKiosk
    ? `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; font-weight: 700;">
          Assigned Dedicated Kiosk
        </p>
        <p style="margin: 0; font-family: monospace; font-size: 15px; font-weight: 700; color: #0f172a;">
          ${safeKioskId}
        </p>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #475569;">
          ${safeKioskName} &bull; ${safeKioskCity}
        </p>
      </div>
    `
    : '';

  const expiryText = expiresAt
    ? `<p style="font-size: 12px; color: #94a3b8; margin-top: 18px;">This link will expire on <strong>${new Date(expiresAt).toLocaleDateString()}</strong>.</p>`
    : '';

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Welcome to KixCleen</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 16px; color: #0f172a;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <!-- Header -->
        <tr>
          <td style="padding: 32px 32px 20px 32px; background-color: #09090b; color: #ffffff;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td>
                  <span style="font-size: 18px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #ffffff;">
                    KIXCLEEN
                  </span>
                  <span style="font-size: 12px; font-weight: 500; color: #a1a1aa; margin-left: 8px;">
                    | Business Monitoring Platform
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding: 32px;">
            <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #0f172a;">
              Welcome, ${safeFullName}!
            </h1>
            <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155;">
              A buyer owner account has been created for you on the KixCleen Platform. You can now activate your account, configure your password, and monitor your kiosk terminals in real time.
            </p>

            <div style="background-color: #f1f5f9; border-radius: 8px; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #334155;">
              <strong>Username:</strong> <code style="background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${safeUsername}</code>
            </div>

            ${kioskSnippet}

            <!-- CTA Button -->
            <div style="margin: 28px 0 20px 0; text-align: center;">
              <a href="${setupUrl}" target="_blank" style="display: inline-block; background-color: #09090b; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 28px; border-radius: 9999px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                Activate Account & Set Password &rarr;
              </a>
            </div>

            <p style="margin: 24px 0 8px 0; font-size: 12px; color: #64748b; line-height: 1.5;">
              Or copy and paste this URL into your browser:
            </p>
            <p style="margin: 0; font-size: 11px; word-break: break-all; color: #0369a1; font-family: monospace; background-color: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
              ${setupUrl}
            </p>

            ${expiryText}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
            <p style="margin: 0 0 4px 0;">KixCleen Automated Vendo & Monitoring System</p>
            <p style="margin: 0;">If you did not request this invitation, you may safely ignore this email.</p>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}

/**
 * Dispatch an account setup invitation email to a buyer.
 *
 * @param {object} params
 * @param {string} params.to Recipient email address
 * @param {string} params.fullName Recipient full name
 * @param {string} params.username Recipient username
 * @param {string} params.setupUrl Full clickable setup URL (including token)
 * @param {object} [params.dedicatedKiosk] Dedicated kiosk details if provisioned
 * @param {string} [params.expiresAt] ISO date string of link expiration
 * @returns {Promise<{ sent: boolean, mode: string, previewUrl: string, error?: string }>}
 */
export async function sendBuyerInvitationEmail({
  to,
  fullName,
  username,
  setupUrl,
  dedicatedKiosk = null,
  expiresAt = null,
}) {
  const cleanTo = String(to).trim();
  const transporter = getTransporter();
  const user = process.env.SMTP_USER ? String(process.env.SMTP_USER).trim() : '';
  let from = process.env.SMTP_FROM || `"KixCleen Platform" <${user || 'noreply@kixcleen.com'}>`;
  if (user && user.endsWith('@gmail.com') && from.includes('@kixcleen.com')) {
    from = `"KixCleen Platform" <${user}>`;
  }

  if (!transporter) {
    // Development / Safe fallback mode when SMTP credentials are not yet set
    console.log('\n================================================================');
    console.log('📧 [EMAIL DISPATCH - DEV / CONSOLE MODE]');
    console.log('To:         ', cleanTo);
    console.log('Name:       ', fullName);
    console.log('Subject:    ', 'Activate Your KixCleen Account — Dedicated Kiosk Setup');
    console.log('Kiosk:      ', dedicatedKiosk ? `${dedicatedKiosk.id} (${dedicatedKiosk.name})` : 'None');
    console.log('Setup Link: ', setupUrl);
    console.log('💡 Note:     Configure SMTP_USER and SMTP_PASS in backend/.env to send real emails.');
    console.log('================================================================\n');

    return {
      sent: false,
      mode: 'console_dev',
      previewUrl: setupUrl,
      reason: 'SMTP credentials not configured in backend/.env',
    };
  }

  try {
    const htmlContent = buildInvitationHtml({
      fullName,
      username,
      setupUrl,
      dedicatedKiosk,
      expiresAt,
    });

    const plainText = `
Welcome to KixCleen, ${fullName}!

An account has been created for you on the KixCleen Platform.
Username: ${username}
${dedicatedKiosk ? `Assigned Kiosk: ${dedicatedKiosk.id} (${dedicatedKiosk.name})` : ''}

Activate your account and set your password by visiting the link below:
${setupUrl}

${expiresAt ? `This link expires on ${new Date(expiresAt).toLocaleDateString()}.` : ''}
    `.trim();

    const info = await transporter.sendMail({
      from,
      to: cleanTo,
      subject: 'Activate Your KixCleen Account — Dedicated Kiosk Setup',
      text: plainText,
      html: htmlContent,
    });

    console.log(`[EmailService] Invitation email successfully sent to ${cleanTo} (Message ID: ${info.messageId})`);
    return {
      sent: true,
      mode: 'smtp',
      messageId: info.messageId,
      previewUrl: setupUrl,
    };
  } catch (err) {
    console.error(`[EmailService] Failed to send email to ${cleanTo} via SMTP:`, err.message);
    console.log(`[EmailService] Fallback setup link: ${setupUrl}`);

    return {
      sent: false,
      mode: 'smtp_error',
      error: err.message,
      previewUrl: setupUrl,
    };
  }
}
