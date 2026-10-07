/* StoreFlow — Auth helpers */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sql } = require('./db');

const SESSION_COOKIE = 'sf_session';
const SESSION_TTL_HOURS = 720;
const OFFLINE_GRACE_HOURS = 24;
const AUTH_TOKEN_TTL_MIN = 60;

const uuid = () => crypto.randomUUID();
const randomHex = (n = 32) => crypto.randomBytes(n).toString('hex');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}
async function verifyPassword(password, stored) {
  try { return await bcrypt.compare(password, stored); } catch { return false; }
}

function signLicenseToken(payload, secret) {
  return jwt.sign(payload, secret, { algorithm: 'HS256' });
}
function verifyLicenseToken(token, secret) {
  try { return jwt.verify(token, secret, { algorithms: ['HS256'] }); }
  catch { return null; }
}

function getCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

function setSessionCookie(res, token, maxAgeSec) {
  res.setHeader('Set-Cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSec}`
  );
}
function clearSessionCookie(res) {
  res.setHeader('Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
  );
}

async function authenticate(req) {
  let token = getCookie(req, SESSION_COOKIE);
  if (!token) {
    const auth = req.headers.authorization || '';
    if (auth.startsWith('Bearer ')) token = auth.slice(7);
  }
  if (!token) return null;

  const tokenHash = sha256(token);
  const { rows } = await sql`
    SELECT * FROM sessions
    WHERE token_hash = ${tokenHash}
      AND revoked_at IS NULL
      AND expires_at > NOW()
    LIMIT 1
  `;
  const session = rows[0];
  if (!session) return null;

  const { rows: userRows } = await sql`SELECT * FROM users WHERE id = ${session.user_id} LIMIT 1`;
  const user = userRows[0];
  if (!user || user.status !== 'active') return null;

  const storeId = session.store_id || req.headers['x-store-id'];
  let membership = null;
  if (storeId) {
    const { rows } = await sql`
      SELECT * FROM store_users WHERE store_id = ${storeId} AND user_id = ${user.id} AND is_active = true LIMIT 1
    `;
    membership = rows[0];
  }
  if (!membership) {
    const { rows } = await sql`
      SELECT * FROM store_users WHERE user_id = ${user.id} AND is_active = true
      ORDER BY CASE WHEN role='owner' THEN 0 ELSE 1 END, created_at LIMIT 1
    `;
    membership = rows[0];
  }

  return {
    user,
    session,
    storeId: membership?.store_id || null,
    role: membership?.role || null,
    permissions: membership ? safeJson(membership.permissions, {}) : {},
  };
}

function safeJson(s, fallback) { try { return JSON.parse(s); } catch { return fallback; } }

async function audit(req, ctx, { storeId, action, entity, entityId, detail }) {
  const m = clientMeta(req);
  try {
    await sql`
      INSERT INTO audit_logs (id, store_id, user_id, user_name, action, entity, entity_id, detail, device_id, ip, user_agent)
      VALUES (${uuid()}, ${storeId || null}, ${ctx.auth?.user?.id || null}, ${ctx.auth?.user?.name || null},
              ${action}, ${entity || null}, ${entityId || null},
              ${detail ? JSON.stringify(detail) : null},
              ${m.deviceId}, ${m.ip}, ${m.ua})
    `;
  } catch (e) { console.warn('audit failed', e.message); }
}

function clientMeta(req) {
  return {
    ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
    ua: req.headers['user-agent'] || '',
    deviceId: req.headers['x-device-id'] || null,
  };
}

module.exports = {
  SESSION_COOKIE, SESSION_TTL_HOURS, OFFLINE_GRACE_HOURS, AUTH_TOKEN_TTL_MIN,
  uuid, randomHex, sha256,
  hashPassword, verifyPassword,
  signLicenseToken, verifyLicenseToken,
  getCookie, setSessionCookie, clearSessionCookie,
  authenticate, safeJson, audit, clientMeta,
};