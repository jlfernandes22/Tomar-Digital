// ============================================================================
// Tomar+Digital — Email Service
// Description: Branded HTML email templates with embedded images for
//              account verification and password recovery flows.
// ============================================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Brand colors — inspired by the "Convento" palette (Convento de Cristo / Templar Gold)
const BRAND = {
  primary: "#914c00",        // Templar gold (light mode)
  primaryDark: "#6b3a00",    // Deeper gold for hover/accents
  accent: "#ffb77f",         // Warm amber
  background: "#faf6f0",     // Cream / parchment
  surface: "#ffffff",        // Card surface
  text: "#2d1b0e",           // Dark brown text
  textMuted: "#7a6b5d",      // Muted brown
  border: "#e8dcc8",         // Soft border
  success: "#16a34a",        // Green (security notes)
  warning: "#dc2626",        // Red (expiration warnings)
};

const EMAIL_IMAGE_PATH = path.join(
  __dirname,
  "..",
  "EmailImages",
  "tomar-background-email.webp"
);

const SUPPORT_EMAIL = "tomardigitalsuporte@gmail.com";

// ---------------------------------------------------------------------------
// Image loading & conversion (cached)
// ---------------------------------------------------------------------------

let cachedImageBuffer = null;
let cachedImageMime = "image/png";

/**
 * Loads the banner image from /BackEnd/EmailImages/tomar-background-email.webp,
 * converts it to PNG (for maximum email-client compatibility — Outlook desktop
 * and some older clients do not render WebP), and caches the buffer so the
 * conversion only happens once per process lifetime.
 *
 * @returns {Promise<{buffer: Buffer, mime: string}>}
 */
async function getBannerImage() {
  if (cachedImageBuffer) {
    return { buffer: cachedImageBuffer, mime: cachedImageMime };
  }

  if (!fs.existsSync(EMAIL_IMAGE_PATH)) {
    console.warn(
      "[emailService] Banner image not found at:",
      EMAIL_IMAGE_PATH,
      "— falling back to no image."
    );
    return null;
  }

  try {
    const webpBuffer = fs.readFileSync(EMAIL_IMAGE_PATH);
    // Convert WebP → PNG. PNG preserves quality and is universally supported
    // by every major email client (Gmail, Apple Mail, Outlook, Yahoo, etc.)
    cachedImageBuffer = await sharp(webpBuffer).png().toBuffer();
    cachedImageMime = "image/png";
    console.log("[emailService] Banner image loaded and converted to PNG.");
    return { buffer: cachedImageBuffer, mime: cachedImageMime };
  } catch (err) {
    console.error("[emailService] Failed to load/convert banner image:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// HTML template helpers
// ---------------------------------------------------------------------------

/**
 * Builds the shared HTML email shell with a branded header image, content body,
 * and footer. All styles are inline (email clients strip <style> tags in many
 * cases, so inline CSS is the safest approach).
 *
 * @param {object} opts
 * @param {string} opts.title       — Email subject / hero title
 * @param {string} opts.subtitle    — Short subtitle under the hero
 * @param {string} opts.bodyHtml    — Inner HTML body content
 * @param {string} [opts.greeting]  — Personalized greeting line
 * @returns {string} Full HTML document
 */
function buildEmailShell({ title, subtitle, bodyHtml, greeting }) {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.background};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:${BRAND.text};">
  <!-- Preheader (hidden preview text shown in inbox) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${BRAND.background};">
    ${subtitle}
  </div>

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.background};padding:24px 0;">
    <tr>
      <td align="center">
        <!-- Card container (max-width 600px) -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${BRAND.surface};border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(45,27,14,0.08);border:1px solid ${BRAND.border};">

          <!-- Branded header image (embedded via CID) -->
          <tr>
            <td style="padding:0;">
              <img src="cid:tomar-header-banner" alt="Tomar+Digital" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;text-decoration:none;" />
            </td>
          </tr>

          <!-- Greeting -->
          ${greeting ? `
          <tr>
            <td style="padding:32px 40px 0 40px;">
              <h2 style="margin:0;font-size:20px;font-weight:600;color:${BRAND.text};">${greeting}</h2>
            </td>
          </tr>
          ` : ""}

          <!-- Hero title -->
          <tr>
            <td style="padding:${greeting ? "8px" : "32px"} 40px 0 40px;">
              <h1 style="margin:0;font-size:26px;line-height:1.3;font-weight:700;color:${BRAND.primary};">${title}</h1>
            </td>
          </tr>

          <!-- Subtitle -->
          <tr>
            <td style="padding:8px 40px 0 40px;">
              <p style="margin:0;font-size:15px;line-height:1.6;color:${BRAND.textMuted};">${subtitle}</p>
            </td>
          </tr>

          <!-- Body content -->
          <tr>
            <td style="padding:24px 40px 0 40px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer divider -->
          <tr>
            <td style="padding:32px 40px 0 40px;">
              <hr style="border:0;border-top:1px solid ${BRAND.border};margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px 40px;">
              <p style="margin:0 0 8px 0;font-size:13px;line-height:1.5;color:${BRAND.textMuted};">
                <strong style="color:${BRAND.primary};">Tomar+Digital</strong><br/>
                Plataforma de digitalização de serviços do concelho de Tomar
              </p>
              <p style="margin:0 0 4px 0;font-size:12px;line-height:1.5;color:${BRAND.textMuted};">
                Need help? Contact us at
                <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND.primary};text-decoration:none;">${SUPPORT_EMAIL}</a>
              </p>
              <p style="margin:0;font-size:11px;line-height:1.5;color:${BRAND.textMuted};opacity:0.7;">
                &copy; ${new Date().getFullYear()} Tomar+Digital. All rights reserved.<br/>
                This is an automated message — please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Code box component (the big highlighted verification code)
// ---------------------------------------------------------------------------

function codeBox(code, accentLabel) {
  // Split the 6-digit code into individual digits for a "digit slot" look
  const digits = String(code)
    .split("")
    .map(
      (d) => `
        <td align="center" valign="middle" width="48" height="56"
            style="width:48px;height:56px;background-color:${BRAND.surface};border:2px solid ${BRAND.primary};border-radius:8px;font-size:26px;font-weight:700;color:${BRAND.primary};font-family:'Courier New',Courier,monospace;">
          ${d}
        </td>
        <td width="6" style="width:6px;font-size:0;line-height:0;">&nbsp;</td>`
    )
    .join("");

  return `
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate;">
          <tr>
            <td colspan="13" style="padding-bottom:8px;text-align:center;">
              <span style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:${BRAND.textMuted};">${accentLabel}</span>
            </td>
          </tr>
          <tr>${digits}<td style="width:0;">&nbsp;</td></tr>
        </table>
      </td>
    </tr>
  </table>`;
}

// ---------------------------------------------------------------------------
// Public API — high-level email senders
// ---------------------------------------------------------------------------

/**
 * Sends a branded account verification email with a 6-digit code.
 *
 * @param {import("nodemailer").Transporter} transporter
 * @param {object} opts
 * @param {string} opts.to       — recipient email
 * @param {string} opts.code     — 6-digit verification code
 * @param {string} [opts.name]   — recipient name (optional, falls back to email)
 * @returns {Promise<void>}
 */
export async function sendVerificationEmail(transporter, { to, code, name }) {
  const greetingName = name && name.trim() ? name.trim() : null;
  const greeting = greetingName
    ? `Ol&aacute;, ${escapeHtml(greetingName)}!`
    : "Ol&aacute;!";

  const bodyHtml = `

    ${codeBox(code, "C&oacute;digo de Confirma&ccedil;&atilde;o")}

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0 0 0;background-color:#fef3e7;border-left:4px solid ${BRAND.primary};border-radius:8px;">
      <tr>
        <td style="padding:14px 18px;">
          <p style="margin:0;font-size:13px;line-height:1.5;color:${BRAND.text};">
            <strong>&#9888; Seguran&ccedil;a:</strong> Nunca partilhe este c&oacute;digo com terceiros.
            A equipa Tomar+Digital nunca lhe pedir&aacute; a sua palavra-passe ou este c&oacute;digo por telefone ou email.
          </p>
        </td>
      </tr>
    </table>`;

  const html = buildEmailShell({
    title: "Confirme a sua conta",
    subtitle: "Basta introduzir o c&oacute;digo de 6 d&iacute;gitos na aplica&ccedil;&atilde;o para ativar a sua conta.",
    greeting,
    bodyHtml,
  });

  await sendBrandedMail(transporter, {
    to,
    subject: "Tomar+Digital — Confirme a sua conta",
    html,
  });
}

/**
 * Sends a branded password recovery email with a 6-digit code.
 *
 * @param {import("nodemailer").Transporter} transporter
 * @param {object} opts
 * @param {string} opts.to       — recipient email
 * @param {string} opts.code     — 6-digit recovery code
 * @param {string} [opts.name]   — recipient name (optional)
 * @returns {Promise<void>}
 */
export async function sendPasswordRecoveryEmail(transporter, { to, code, name }) {
  const greetingName = name && name.trim() ? name.trim() : null;
  const greeting = greetingName
    ? `Ol&aacute;, ${escapeHtml(greetingName)}!`
    : "Ol&aacute;!";

  const bodyHtml = `

    ${codeBox(code, "C&oacute;digo de Recupera&ccedil;&atilde;o")}

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0 0 0;background-color:#fdecec;border-left:4px solid ${BRAND.warning};border-radius:8px;">
      <tr>
        <td style="padding:14px 18px;">
          <p style="margin:0;font-size:13px;line-height:1.5;color:${BRAND.text};">
            <strong>&#9203; Expira em 15 minutos:</strong> Por seguran&ccedil;a, este c&oacute;digo s&oacute; &eacute; v&aacute;lido
            durante 15 minutos. Se expirar, ter&aacute; de pedir um novo c&oacute;digo de recupera&ccedil;&atilde;o.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:16px 0 0 0;font-size:14px;line-height:1.6;color:${BRAND.textMuted};">
      <strong>N&atilde;o foi voc&ecirc;?</strong> Se n&atilde;o solicitou a redefini&ccedil;&atilde;o da palavra-passe,
      ignore este email. A sua conta permanece segura e nenhuma altera&ccedil;&atilde;o ser&aacute; efetuada.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0 0 0;background-color:#fef3e7;border-left:4px solid ${BRAND.primary};border-radius:8px;">
      <tr>
        <td style="padding:14px 18px;">
          <p style="margin:0;font-size:13px;line-height:1.5;color:${BRAND.text};">
            <strong>&#9888; Seguran&ccedil;a:</strong> Nunca partilhe este c&oacute;digo. A equipa Tomar+Digital
            nunca lhe pedir&aacute; a sua palavra-passe ou este c&oacute;digo.
          </p>
        </td>
      </tr>
    </table>`;

  const html = buildEmailShell({
    title: "Recupera&ccedil;&atilde;o de Palavra-passe",
    subtitle: "Use o c&oacute;digo abaixo para redefinir a sua palavra-passe. Expira em 15 minutos.",
    greeting,
    bodyHtml,
  });

  await sendBrandedMail(transporter, {
    to,
    subject: "Tomar+Digital — Recuperação de Palavra-passe",
    html,
  });
}

// ---------------------------------------------------------------------------
// Low-level sender — attaches the banner image as an inline CID attachment
// ---------------------------------------------------------------------------

/**
 * Sends an email with the Tomar+Digital banner image embedded as an inline
 * CID attachment (so it renders without requiring external image hosting).
 *
 * @param {import("nodemailer").Transporter} transporter
 * @param {object} opts
 * @param {string} opts.to       — recipient email
 * @param {string} opts.subject  — email subject
 * @param {string} opts.html     — full HTML body
 * @returns {Promise<void>}
 */
async function sendBrandedMail(transporter, { to, subject, html }) {
  const banner = await getBannerImage();

  const mailOptions = {
    from: '"Tomar+Digital Support" <tomardigitalsuporte@gmail.com>',
    to,
    subject,
    html,
  };

  if (banner) {
    mailOptions.attachments = [
      {
        filename: "tomar-header.png",
        content: banner.buffer,
        contentType: banner.mime,
        cid: "tomar-header-banner", // referenced in HTML as src="cid:tomar-header-banner"
        encoding: "base64",
      },
    ];
  }

  await transporter.sendMail(mailOptions);
}

// ---------------------------------------------------------------------------
// Utility — minimal HTML escaping for user-provided names
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default {
  sendVerificationEmail,
  sendPasswordRecoveryEmail,
};
