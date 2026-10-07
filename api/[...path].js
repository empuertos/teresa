/* StoreFlow — All API routes (Vercel serverless) */
const { sql, setup } = require('../lib/db');
const A = require('../lib/auth');

const {
  uuid, randomHex, sha256,
  hashPassword, verifyPassword,
  signLicenseToken,
  getCookie, setSessionCookie, clearSessionCookie,
  authenticate, safeJson, audit, clientMeta,
  SESSION_TTL_HOURS, OFFLINE_GRACE_HOURS, AUTH_TOKEN_TTL_MIN,
} = A;

/* ── helpers ─────────────────────────────── */
const nowIso = () => new Date().toISOString();
const isoPlus = (min) => new Date(Date.now() + min * 60000).toISOString();

function send(res, status, data) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}
const ok  = (res, data = {}) => send(res, 200, { ok: true, ...data });
const fail = (res, msg, status = 400, code = null) => send(res, status, { ok: false, error: msg, code });

function readBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    let data = '';
    req.on('data', (c) => { data += c; });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); }
    });
  });
}

async function requireAuth(req, res) {
  const auth = await authenticate(req);
  if (!auth) { fail(res, 'Not authenticated', 401, 'UNAUTHENTICATED'); return null; }
  return auth;
}

function requireRole(auth, res, ...roles) {
  if (auth.user.is_platform_admin) return true;
  if (!roles.includes(auth.role)) { fail(res, 'Forbidden', 403, 'FORBIDDEN'); return false; }
  return true;
}

/* ═══════════════════════════════════════════
   ROUTER
   ═══════════════════════════════════════════ */
module.exports = async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = url.pathname.replace(/^\/api/, '') || '/';
  const method = req.method;

  try {
    // ── Setup (one-time) ──────────────────
    if (method === 'GET' && path === '/setup') {
      const key = url.searchParams.get('key');
      if (!process.env.SETUP_KEY || key !== process.env.SETUP_KEY) {
        return fail(res, 'Invalid setup key', 403);
      }
      await setup();
      return ok(res, { message: 'Database ready' });
    }

    if (method === 'GET' && path === '/health') {
      try { await sql`SELECT 1`; return ok(res, { db: 'ok', time: nowIso() }); }
      catch (e) { return fail(res, 'DB error: ' + e.message, 500); }
    }

    /* ═════════ AUTH ═════════ */

    // Register
    if (method === 'POST' && path === '/auth/register') {
      const b = await readBody(req);
      const email = String(b.email || '').trim().toLowerCase();
      const name = String(b.name || '').trim();
      const storeName = String(b.storeName || '').trim();
      const password = String(b.password || '');

      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail(res, 'Valid email required');
      if (!name || name.length < 2) return fail(res, 'Full name required');
      if (!storeName) return fail(res, 'Store name required');
      if (password.length < 8) return fail(res, 'Password must be 8+ characters');

      const { rows: exists } = await sql`SELECT id FROM users WHERE email = ${email}`;
      if (exists[0]) return fail(res, 'Email already registered', 409, 'EMAIL_TAKEN');

      const userId = uuid(), storeId = uuid(), subId = uuid();
      const hash = await hashPassword(password);
      const trialEnd = isoPlus(60 * 24 * 14);

      await sql`INSERT INTO users (id, email, name, password_hash) VALUES (${userId}, ${email}, ${name}, ${hash})`;
      await sql`INSERT INTO stores (id, owner_id, name, branch_name) VALUES (${storeId}, ${userId}, ${storeName}, 'Main Branch')`;
      await sql`INSERT INTO store_users (id, store_id, user_id, role) VALUES (${uuid()}, ${storeId}, ${userId}, 'owner')`;
      await sql`INSERT INTO subscriptions (id, store_id, plan, status, expires_at, amount)
                VALUES (${subId}, ${storeId}, 'trial', 'trialing', ${trialEnd}, 0)`;
      await sql`INSERT INTO categories (id, store_id, name, color) VALUES (${uuid()}, ${storeId}, 'General', '#2563eb')`;

      return ok(res, { userId, storeId, message: 'Account created.' });
    }

    // Login
    if (method === 'POST' && path === '/auth/login') {
      const b = await readBody(req);
      const email = String(b.email || '').trim().toLowerCase();
      const password = String(b.password || '');
      const deviceUid = String(b.deviceUid || '').trim() || null;
      const m = clientMeta(req);

      if (!email || !password) return fail(res, 'Email and password required');

      const { rows: recent } = await sql`
        SELECT COUNT(*)::int AS n FROM login_attempts
        WHERE email = ${email} AND success = false
          AND created_at > NOW() - INTERVAL '15 minutes'
      `;
      if (recent[0]?.n >= 8) return fail(res, 'Too many attempts. Try later.', 429, 'RATE_LIMITED');

      const { rows: userRows } = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
      const user = userRows[0];

      const record = (s) => sql`INSERT INTO login_attempts (id, email, ip, success) VALUES (${uuid()}, ${email}, ${m.ip}, ${s})`;

      if (!user) { await record(false); return fail(res, 'Invalid credentials', 401, 'BAD_CREDENTIALS'); }
      if (user.status !== 'active') return fail(res, 'Account suspended', 403, 'SUSPENDED');

      const valid = await verifyPassword(password, user.password_hash);
      if (!valid) { await record(false); return fail(res, 'Invalid credentials', 401, 'BAD_CREDENTIALS'); }
      await record(true);

      const { rows: memRows } = await sql`
        SELECT su.*, s.name AS store_name FROM store_users su
        JOIN stores s ON s.id = su.store_id
        WHERE su.user_id = ${user.id} AND su.is_active = true
        ORDER BY CASE WHEN su.role='owner' THEN 0 ELSE 1 END, su.created_at
        LIMIT 1
      `;
      const membership = memRows[0];

      const token = randomHex(32);
      const tokenHash = sha256(token);
      const expiresAt = isoPlus(SESSION_TTL_HOURS * 60);

      await sql`
        INSERT INTO sessions (id, user_id, store_id, token_hash, device_id, user_agent, ip, expires_at)
        VALUES (${uuid()}, ${user.id}, ${membership?.store_id || null}, ${tokenHash},
                ${deviceUid}, ${m.ua}, ${m.ip}, ${expiresAt})
      `;

      await sql`UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}`;

      if (deviceUid && membership?.store_id) {
        const { rows: devRows } = await sql`
          SELECT id FROM devices WHERE store_id = ${membership.store_id} AND device_uid = ${deviceUid}
        `;
        if (!devRows[0]) {
          await sql`
            INSERT INTO devices (id, store_id, device_uid, name, platform, registered_by, last_seen_at)
            VALUES (${uuid()}, ${membership.store_id}, ${deviceUid}, 'POS Terminal', ${m.ua.slice(0, 80)}, ${user.id}, NOW())
          `;
        } else {
          await sql`UPDATE devices SET last_seen_at = NOW() WHERE id = ${devRows[0].id}`;
        }
      }

      setSessionCookie(res, token, SESSION_TTL_HOURS * 3600);

      return ok(res, {
        token,
        user: { id: user.id, email: user.email, name: user.name, isPlatformAdmin: !!user.is_platform_admin },
        store: membership ? { id: membership.store_id, name: membership.store_name, role: membership.role } : null,
      });
    }

    // Logout
    if (method === 'POST' && path === '/auth/logout') {
      const auth = await requireAuth(req, res); if (!auth) return;
      await sql`UPDATE sessions SET revoked_at = NOW() WHERE id = ${auth.session.id}`;
      await audit(req, { auth }, { storeId: auth.storeId, action: 'logout' });
      clearSessionCookie(res);
      return ok(res);
    }

    // Logout all
    if (method === 'POST' && path === '/auth/logout-all') {
      const auth = await requireAuth(req, res); if (!auth) return;
      await sql`UPDATE sessions SET revoked_at = NOW() WHERE user_id = ${auth.user.id} AND revoked_at IS NULL`;
      clearSessionCookie(res);
      return ok(res);
    }

    // Me
    if (method === 'GET' && path === '/auth/me') {
      const auth = await requireAuth(req, res); if (!auth) return;
      const { rows: stores } = await sql`
        SELECT s.id, s.name, s.branch_name, s.currency, s.address, s.phone, s.email,
               s.receipt_width, s.allow_negative_inventory, s.discount_enabled, s.max_discount_pct,
               s.refund_enabled, su.role, su.permissions,
               sub.status AS sub_status, sub.expires_at AS sub_expires, sub.plan
        FROM store_users su
        JOIN stores s ON s.id = su.store_id
        LEFT JOIN subscriptions sub ON sub.store_id = s.id
        WHERE su.user_id = ${auth.user.id} AND su.is_active = true
        ORDER BY CASE WHEN su.role='owner' THEN 0 ELSE 1 END
      `;
      return ok(res, {
        user: { id: auth.user.id, email: auth.user.email, name: auth.user.name, phone: auth.user.phone,
                isPlatformAdmin: !!auth.user.is_platform_admin },
        activeStoreId: auth.storeId, role: auth.role, permissions: auth.permissions,
        stores: stores || [],
      });
    }

    // Change password
    if (method === 'POST' && path === '/auth/change-password') {
      const auth = await requireAuth(req, res); if (!auth) return;
      const { currentPassword, newPassword } = await readBody(req);
      if (!currentPassword || !newPassword) return fail(res, 'Both passwords required');
      if (newPassword.length < 8) return fail(res, 'Password must be 8+ characters');
      if (!await verifyPassword(currentPassword, auth.user.password_hash))
        return fail(res, 'Current password incorrect', 401);

      const hash = await hashPassword(newPassword);
      await sql`UPDATE users SET password_hash = ${hash}, updated_at = NOW() WHERE id = ${auth.user.id}`;
      await sql`UPDATE sessions SET revoked_at = NOW() WHERE user_id = ${auth.user.id} AND id != ${auth.session.id}`;
      return ok(res, { message: 'Password updated.' });
    }

    // Forgot password
    if (method === 'POST' && path === '/auth/forgot-password') {
      const { email } = await readBody(req);
      const e = String(email || '').trim().toLowerCase();
      if (!e) return fail(res, 'Email required');
      const { rows } = await sql`SELECT id FROM users WHERE email = ${e} LIMIT 1`;
      if (rows[0]) {
        const token = randomHex(32);
        const tokenHash = sha256(token);
        await sql`
          INSERT INTO password_resets (id, user_id, token_hash, expires_at)
          VALUES (${uuid()}, ${rows[0].id}, ${tokenHash}, ${isoPlus(60)})
        `;
        if (process.env.NODE_ENV !== 'production') console.log('reset:', token);
      }
      return ok(res, { message: 'If that email exists, a reset link has been sent.' });
    }

    // Reset password
    if (method === 'POST' && path === '/auth/reset-password') {
      const { token, password } = await readBody(req);
      if (!token || !password) return fail(res, 'Token and password required');
      if (password.length < 8) return fail(res, 'Password must be 8+ characters');

      const tokenHash = sha256(token);
      const { rows } = await sql`
        SELECT * FROM password_resets
        WHERE token_hash = ${tokenHash} AND used_at IS NULL AND expires_at > NOW() LIMIT 1
      `;
      const reset = rows[0];
      if (!reset) return fail(res, 'Invalid or expired token', 400);

      const hash = await hashPassword(password);
      await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${reset.user_id}`;
      await sql`UPDATE password_resets SET used_at = NOW() WHERE id = ${reset.id}`;
      await sql`UPDATE sessions SET revoked_at = NOW() WHERE user_id = ${reset.user_id}`;
      return ok(res, { message: 'Password reset. Please sign in.' });
    }

    /* ═════════ SUBSCRIPTION ═════════ */

    async function evalSub(storeId) {
      const { rows: subRows } = await sql`SELECT * FROM subscriptions WHERE store_id = ${storeId} LIMIT 1`;
      const sub = subRows[0];
      const { rows: storeRows } = await sql`SELECT * FROM stores WHERE id = ${storeId} LIMIT 1`;
      const store = storeRows[0];
      if (!store) return { valid: false, reason: 'store_not_found', status: 'unknown' };
      if (!store.is_active) return { valid: false, reason: 'store_suspended', status: 'suspended' };
      if (!sub) return { valid: false, reason: 'no_subscription', status: 'none' };

      const expires = sub.expires_at ? new Date(sub.expires_at).getTime() : 0;
      if (sub.status === 'suspended') return { valid: false, reason: 'subscription_suspended', status: 'suspended', sub };
      if (sub.status === 'cancelled') return { valid: false, reason: 'subscription_cancelled', status: 'cancelled', sub };
      if (sub.status === 'expired' || (expires && Date.now() > expires))
        return { valid: false, reason: 'subscription_expired', status: 'expired', sub };
      return { valid: true, reason: 'active', status: sub.status, sub };
    }

    if (method === 'GET' && path === '/subscription/status') {
      const auth = await requireAuth(req, res); if (!auth) return;
      if (!auth.storeId) return fail(res, 'No active store', 400);
      const r = await evalSub(auth.storeId);
      return ok(res, {
        valid: r.valid, reason: r.reason, status: r.status,
        plan: r.sub?.plan || null,
        expiresAt: r.sub?.expires_at || null,
      });
    }

    if (method === 'POST' && path === '/subscription/verify') {
      const auth = await requireAuth(req, res); if (!auth) return;
      if (!auth.storeId) return fail(res, 'No active store', 400);

      const b = await readBody(req);
      const deviceUid = String(b.deviceUid || req.headers['x-device-id'] || '').trim();
      const evalRes = await evalSub(auth.storeId);

      let device = null;
      if (deviceUid) {
        const { rows } = await sql`SELECT * FROM devices WHERE store_id = ${auth.storeId} AND device_uid = ${deviceUid} LIMIT 1`;
        device = rows[0];
        if (!device) {
          const { rows: cntRows } = await sql`SELECT COUNT(*)::int AS n FROM devices WHERE store_id = ${auth.storeId}`;
          const autoApprove = (cntRows[0]?.n || 0) === 0;
          const id = uuid();
          await sql`
            INSERT INTO devices (id, store_id, device_uid, name, platform, registered_by, last_seen_at, status)
            VALUES (${id}, ${auth.storeId}, ${deviceUid}, 'POS Terminal',
                    ${clientMeta(req).ua.slice(0, 80)}, ${auth.user.id}, NOW(),
                    ${autoApprove ? 'authorized' : 'pending'})
          `;
          const { rows: newDev } = await sql`SELECT * FROM devices WHERE id = ${id}`;
          device = newDev[0];
        }
      }

      if (!evalRes.valid) {
        await sql`
          INSERT INTO authorization_records (id, store_id, device_id, user_id, token_id, subscription_status, expires_at)
          VALUES (${uuid()}, ${auth.storeId}, ${device?.id || null}, ${auth.user.id}, ${uuid()},
                  ${evalRes.status}, NOW())
        `;
        return fail(res,
          evalRes.reason === 'subscription_expired' ? 'Your monthly subscription has expired.' : 'Subscription could not be verified.',
          403, evalRes.reason.toUpperCase());
      }

      if (device && device.status === 'revoked')
        return fail(res, 'This device has been revoked.', 403, 'DEVICE_REVOKED');

      const tokenId = uuid();
      const exp = Date.now() + AUTH_TOKEN_TTL_MIN * 60000;
      const payload = {
        sid: auth.storeId, did: device?.id || null, uid: auth.user.id, jti: tokenId,
        sub: evalRes.status, exp: Math.floor(exp / 1000), iat: Math.floor(Date.now() / 1000),
        grace: OFFLINE_GRACE_HOURS,
      };
      const token = signLicenseToken(payload, process.env.AUTH_SIGNING_KEY);

      await sql`
        INSERT INTO authorization_records (id, store_id, device_id, user_id, token_id, subscription_status, expires_at)
        VALUES (${uuid()}, ${auth.storeId}, ${device?.id || null}, ${auth.user.id}, ${tokenId},
                ${evalRes.status}, ${new Date(exp).toISOString()})
      `;
      if (device) {
        await sql`UPDATE devices SET last_verified_at = NOW(), last_seen_at = NOW() WHERE id = ${device.id}`;
      }

      return ok(res, {
        authorization: token,
        issuedAt: Date.now(), expiresAt: exp, graceHours: OFFLINE_GRACE_HOURS,
        subscription: { status: evalRes.status, plan: evalSub.sub?.plan, expiresAt: evalRes.sub?.expires_at },
        device: device ? { id: device.id, name: device.name, status: device.status } : null,
      });
    }

    /* ═════════ DEVICES ═════════ */
    if (method === 'GET' && path === '/devices') {
      const auth = await requireAuth(req, res); if (!auth) return;
      if (!requireRole(auth, res, 'owner', 'manager')) return;
      const { rows } = await sql`
        SELECT id, device_uid, name, platform, status, last_seen_at, last_verified_at, revoked_at, created_at
        FROM devices WHERE store_id = ${auth.storeId} ORDER BY created_at DESC
      `;
      return ok(res, { devices: rows });
    }

    if (method === 'POST' && path === '/devices/revoke') {
      const auth = await requireAuth(req, res); if (!auth) return;
      if (!requireRole(auth, res, 'owner', 'manager')) return;
      const { deviceId } = await readBody(req);
      if (!deviceId) return fail(res, 'deviceId required');
      await sql`UPDATE devices SET status='revoked', revoked_at=NOW() WHERE id = ${deviceId} AND store_id = ${auth.storeId}`;
      return ok(res);
    }

    /* ═════════ PRODUCTS ═════════ */
    if (method === 'GET' && path === '/products') {
      const auth = await requireAuth(req, res); if (!auth) return;
      const q = (url.searchParams.get('q') || '').trim();
      const category = url.searchParams.get('category') || '';

      let query = `
        SELECT p.*, COALESCE(i.quantity, 0) AS stock, c.name AS category_name
        FROM products p
        LEFT JOIN inventory i ON i.product_id = p.id AND i.store_id = p.store_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.store_id = $1 AND p.is_archived = false
      `;
      const params = [auth.storeId];
      if (category) { params.push(category); query += ` AND p.category_id = $${params.length}`; }
      if (q) { params.push(`%${q}%`, `%${q}%`, `%${q}%`); query += ` AND (p.name ILIKE $${params.length-2} OR p.sku ILIKE $${params.length-1} OR p.barcode ILIKE $${params.length})`; }
      query += ' ORDER BY p.name LIMIT 2000';

      const result = await sql.query(query, params);
      return ok(res, { products: result.rows });
    }

    if (method === 'POST' && path === '/products') {
      const auth = await requireAuth(req, res); if (!auth) return;
      if (!requireRole(auth, res, 'owner', 'manager')) return;
      const b = await readBody(req);
      if (!b.name) return fail(res, 'Product name required');

      const id = uuid();
      await sql`
        INSERT INTO products (id, store_id, sku, barcode, name, description, category_id,
          cost_price, price, unit, reorder_level, track_stock, is_active)
        VALUES (${id}, ${auth.storeId}, ${b.sku || null}, ${b.barcode || null}, ${b.name},
                ${b.description || null}, ${b.categoryId || null},
                ${Number(b.costPrice) || 0}, ${Number(b.price) || 0}, ${b.unit || 'pc'},
                ${Number(b.reorderLevel) || 5}, ${b.trackStock !== false}, ${b.isActive !== false})
      `;
      await sql`INSERT INTO inventory (id, store_id, product_id, quantity) VALUES (${uuid()}, ${auth.storeId}, ${id}, ${Number(b.stock) || 0})`;

      if (Number(b.stock)) {
        await sql`
          INSERT INTO inventory_movements (id, store_id, product_id, type, quantity, previous_qty, new_qty, reason, user_id)
          VALUES (${uuid()}, ${auth.storeId}, ${id}, 'stock_in', ${Number(b.stock)}, 0, ${Number(b.stock)}, 'Initial stock', ${auth.user.id})
        `;
      }
      return ok(res, { id });
    }

    if (method === 'PUT' && path.match(/^\/products\/[^/]+$/)) {
      const auth = await requireAuth(req, res); if (!auth) return;
      if (!requireRole(auth, res, 'owner', 'manager')) return;
      const id = path.split('/')[2];
      const b = await readBody(req);
      const map = { sku:'sku', barcode:'barcode', name:'name', description:'description',
        categoryId:'category_id', costPrice:'cost_price', price:'price', unit:'unit',
        reorderLevel:'reorder_level', trackStock:'track_stock', isActive:'is_active' };
      const sets = [], vals = [];
      for (const [k, col] of Object.entries(map)) {
        if (b[k] !== undefined) { vals.push(b[k]); sets.push(`${col} = $${vals.length}`); }
      }
      if (!sets.length) return fail(res, 'Nothing to update');
      vals.push(id, auth.storeId);
      const q = `UPDATE products SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${vals.length-1} AND store_id = $${vals.length}`;
      await sql.query(q, vals);
      return ok(res);
    }

    if (method === 'DELETE' && path.match(/^\/products\/[^/]+$/)) {
      const auth = await requireAuth(req, res); if (!auth) return;
      if (!requireRole(auth, res, 'owner', 'manager')) return;
      const id = path.split('/')[2];
      await sql`UPDATE products SET is_archived=true, is_active=false WHERE id = ${id} AND store_id = ${auth.storeId}`;
      return ok(res);
    }

    /* ═════════ CATEGORIES ═════════ */
    if (method === 'GET' && path === '/categories') {
      const auth = await requireAuth(req, res); if (!auth) return;
      const { rows } = await sql`SELECT * FROM categories WHERE store_id = ${auth.storeId} ORDER BY sort_order, name`;
      return ok(res, { categories: rows });
    }

    if (method === 'POST' && path === '/categories') {
      const auth = await requireAuth(req, res); if (!auth) return;
      if (!requireRole(auth, res, 'owner', 'manager')) return;
      const { name, color } = await readBody(req);
      if (!name) return fail(res, 'Category name required');
      const id = uuid();
      await sql`INSERT INTO categories (id, store_id, name, color) VALUES (${id}, ${auth.storeId}, ${name}, ${color || '#2563eb'})`;
      return ok(res, { id });
    }

    /* ═════════ INVENTORY ═════════ */
    if (method === 'GET' && path === '/inventory') {
      const auth = await requireAuth(req, res); if (!auth) return;
      const { rows } = await sql`
        SELECT i.*, p.name, p.sku, p.barcode, p.unit, p.price, p.cost_price, p.reorder_level, p.is_active,
               c.name AS category_name
        FROM inventory i
        JOIN products p ON p.id = i.product_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE i.store_id = ${auth.storeId} AND p.is_archived = false
        ORDER BY p.name LIMIT 2000
      `;
      return ok(res, { inventory: rows });
    }

    if (method === 'POST' && path === '/inventory/adjust') {
      const auth = await requireAuth(req, res); if (!auth) return;
      if (!requireRole(auth, res, 'owner', 'manager')) return;
      const { productId, type, quantity, reason } = await readBody(req);
      if (!productId || !type || quantity === undefined) return fail(res, 'productId, type, quantity required');

      const { rows: invRows } = await sql`SELECT * FROM inventory WHERE store_id = ${auth.storeId} AND product_id = ${productId} LIMIT 1`;
      const inv = invRows[0];
      if (!inv) return fail(res, 'Inventory not found', 404);

      const delta = Number(quantity);
      const prev = Number(inv.quantity);
      const next = prev + delta;

      await sql`UPDATE inventory SET quantity = ${next}, updated_at = NOW() WHERE id = ${inv.id}`;
      await sql`
        INSERT INTO inventory_movements (id, store_id, product_id, type, quantity, previous_qty, new_qty, reason, user_id)
        VALUES (${uuid()}, ${auth.storeId}, ${productId}, ${type}, ${delta}, ${prev}, ${next}, ${reason || null}, ${auth.user.id})
      `;
      return ok(res, { previous: prev, new: next });
    }

    /* ═════════ CUSTOMERS ═════════ */
    if (method === 'GET' && path === '/customers') {
      const auth = await requireAuth(req, res); if (!auth) return;
      const q = (url.searchParams.get('q') || '').trim();
      let query = `SELECT * FROM customers WHERE store_id = $1 AND is_active = true`;
      const params = [auth.storeId];
      if (q) { params.push(`%${q}%`, `%${q}%`, `%${q}%`); query += ` AND (name ILIKE $2 OR phone ILIKE $3 OR email ILIKE $4)`; }
      query += ' ORDER BY name LIMIT 500';
      const result = await sql.query(query, params);
      return ok(res, { customers: result.rows });
    }

    if (method === 'POST' && path === '/customers') {
      const auth = await requireAuth(req, res); if (!auth) return;
      const b = await readBody(req);
      if (!b.name) return fail(res, 'Customer name required');
      const id = uuid();
      await sql`
        INSERT INTO customers (id, store_id, name, phone, email, address, notes)
        VALUES (${id}, ${auth.storeId}, ${b.name}, ${b.phone || null}, ${b.email || null}, ${b.address || null}, ${b.notes || null})
      `;
      return ok(res, { id });
    }

    /* ═════════ TRANSACTIONS ═════════ */
    async function processSale(auth, payload) {
      const { id: clientId, number, customerId, customerName, items, payments,
        discount = 0, discountType = 'amount', paymentMethod = 'cash',
        createdOffline = false, createdAt } = payload;

      if (!clientId) throw new Error('Transaction id required');
      if (!Array.isArray(items) || !items.length) throw new Error('Cart is empty');

      const { rows: exist } = await sql`SELECT id FROM transactions WHERE id = ${clientId}`;
      if (exist[0]) return { id: clientId, duplicate: true };

      const { rows: storeRows } = await sql`SELECT * FROM stores WHERE id = ${auth.storeId}`;
      const store = storeRows[0];
      if (!store) throw new Error('Store not found');

      let subtotal = 0, costTotal = 0;
      const resolved = [];

      for (const line of items) {
        const qty = Number(line.quantity);
        if (!qty || qty <= 0) throw new Error('Invalid quantity');

        const { rows: prodRows } = await sql`
          SELECT p.*, COALESCE(i.quantity, 0) AS stock, i.id AS inv_id
          FROM products p
          LEFT JOIN inventory i ON i.product_id = p.id AND i.store_id = p.store_id
          WHERE p.id = ${line.productId} AND p.store_id = ${auth.storeId} AND p.is_archived = false
        `;
        const product = prodRows[0];
        if (!product) throw new Error('Product not found');
        if (!product.is_active) throw new Error('Product inactive');

        if (product.track_stock && Number(product.stock) < qty && !store.allow_negative_inventory) {
          throw new Error(`Insufficient stock for ${product.name} (${product.stock} left)`);
        }

        const unitPrice = createdOffline && store.offline_policy === 'permissive'
          ? Number(line.unitPrice) : Number(product.price);
        const lineTotal = unitPrice * qty;
        subtotal += lineTotal;
        costTotal += Number(product.cost_price) * qty;
        resolved.push({
          productId: product.id, name: product.name, sku: product.sku,
          quantity: qty, unitPrice, unitCost: Number(product.cost_price),
          lineTotal, invId: product.inv_id, prevStock: Number(product.stock), trackStock: !!product.track_stock,
        });
      }

      let discountAmount = Number(discount) || 0;
      if (discountType === 'percent') discountAmount = subtotal * (discountAmount / 100);
      if (!store.discount_enabled && discountAmount > 0) throw new Error('Discounts disabled');
      if (discountAmount > subtotal * (Number(store.max_discount_pct) / 100))
        throw new Error(`Discount exceeds ${store.max_discount_pct}%`);

      const taxable = Math.max(0, subtotal - discountAmount);
      const tax = store.tax_rate ? taxable * (Number(store.tax_rate) / 100) : 0;
      const total = Math.round((taxable + tax) * 100) / 100;

      const paymentList = Array.isArray(payments) && payments.length ? payments : [{ method: paymentMethod, amount: total }];
      const paidTotal = paymentList.reduce((s, p) => s + Number(p.amount || 0), 0);
      const cashPay = paymentList.length === 1 && paymentList[0].method === 'cash' ? paymentList[0] : null;

      let tendered = 0, changeDue = 0;
      if (cashPay) {
        tendered = Number(cashPay.tendered || cashPay.amount);
        if (tendered < total) throw new Error('Insufficient payment');
        changeDue = Math.round((tendered - total) * 100) / 100;
      } else {
        if (paidTotal < total - 0.005) throw new Error('Insufficient payment');
        changeDue = Math.max(0, Math.round((paidTotal - total) * 100) / 100);
      }

      const txnId = clientId;
      const txnNumber = number || `TXN-${Date.now().toString(36).toUpperCase()}`;
      const paid = cashPay ? tendered : paidTotal;

      await sql`
        INSERT INTO transactions
        (id, store_id, device_id, cashier_id, cashier_name, customer_id, customer_name, number,
         status, subtotal, discount, discount_type, tax, total, cost_total, profit,
         paid, change_due, payment_method, created_offline, created_at, synced_at)
        VALUES (${txnId}, ${auth.storeId}, ${clientMeta.docDeviceId || null}, ${auth.user.id}, ${auth.user.name},
                ${customerId || null}, ${customerName || null}, ${txnNumber},
                'completed', ${subtotal}, ${discountAmount}, ${discountType}, ${tax}, ${total},
                ${costTotal}, ${total - costTotal}, ${paid}, ${changeDue}, ${paymentMethod},
                ${createdOffline}, ${createdAt ? new Date(createdAt).toISOString() : new Date().toISOString()}, NOW())
      `;

      for (const r of resolved) {
        await sql`
          INSERT INTO transaction_items (id, transaction_id, store_id, product_id, product_name, sku,
            quantity, unit_price, unit_cost, line_total)
          VALUES (${uuid()}, ${txnId}, ${auth.storeId}, ${r.productId}, ${r.name}, ${r.sku},
                  ${r.quantity}, ${r.unitPrice}, ${r.unitCost}, ${r.lineTotal})
        `;
        if (r.trackStock && r.invId) {
          const newQty = r.prevStock - r.quantity;
          await sql`UPDATE inventory SET quantity = ${newQty}, updated_at = NOW() WHERE id = ${r.invId}`;
          await sql`
            INSERT INTO inventory_movements (id, store_id, product_id, type, quantity, previous_qty, new_qty, reason, reference_id, user_id)
            VALUES (${uuid()}, ${auth.storeId}, ${r.productId}, 'sale', ${-r.quantity}, ${r.prevStock}, ${newQty},
                    ${'Sale ' + txnNumber}, ${txnId}, ${auth.user.id})
          `;
        }
      }

      for (const p of paymentList) {
        await sql`
          INSERT INTO payments (id, transaction_id, store_id, method, amount, reference, tendered, change_due)
          VALUES (${uuid()}, ${txnId}, ${auth.storeId}, ${p.method || 'cash'}, ${Number(p.amount || total)},
                  ${p.reference || null}, ${p.tendered || null}, ${changeDue})
        `;
      }

      const cashIn = paymentList.filter(p => p.method === 'cash').reduce((s, p) => s + Number(p.amount || 0), 0);
      if (cashIn > 0) {
        await sql`
          INSERT INTO cash_flow (id, store_id, direction, category, description, amount, method, reference, user_id, user_name)
          VALUES (${uuid()}, ${auth.storeId}, 'in', 'sales', ${'Sale ' + txnNumber}, ${cashIn}, 'cash', ${txnId}, ${auth.user.id}, ${auth.user.name})
        `;
      }

      if (customerId) {
        await sql`UPDATE customers SET total_spent = total_spent + ${total}, visits = visits + 1 WHERE id = ${customerId} AND store_id = ${auth.storeId}`;
      }

      return { id: txnId, number: txnNumber, subtotal, discount: discountAmount, tax, total, changeDue, paid, items: resolved, paymentMethod };
    }

    if (method === 'POST' && path === '/transactions') {
      const auth = await requireAuth(req, res); if (!auth) return;
      const payload = await readBody(req);
      try {
        const result = await processSale(auth, payload);
        return ok(res, { transaction: result });
      } catch (e) { return fail(res, e.message, 400, 'SALE_FAILED'); }
    }

    if (method === 'POST' && path === '/transactions/sync') {
      const auth = await requireAuth(req, res); if (!auth) return;
      const body = await readBody(req);
      const ops = Array.isArray(body.operations) ? body.operations : [];
      const m = clientMeta(req);
      const results = [];

      for (const op of ops) {
        const clientOpId = op.clientOpId || op.payload?.id || uuid();
        const { rows: seen } = await sql`SELECT id FROM sync_queue WHERE store_id = ${auth.storeId} AND client_op_id = ${clientOpId}`;
        if (seen[0]) { results.push({ clientOpId, status: 'duplicate' }); continue; }

        let status = 'processed', error = null, result = null;
        try {
          if (op.type === 'transaction') {
            result = await processSale(auth, { ...op.payload, createdOffline: true });
          } else if (op.type === 'held') {
            await sql`
              INSERT INTO held_transactions (id, store_id, cashier_id, cashier_name, customer_id, customer_name,
                label, cart, subtotal, discount, total, status, notes, held_at)
              VALUES (${op.payload.id}, ${auth.storeId}, ${auth.user.id}, ${auth.user.name},
                      ${op.payload.customerId || null}, ${op.payload.customerName || null},
                      ${op.payload.label || null}, ${JSON.stringify(op.payload.cart || [])},
                      ${op.payload.subtotal || 0}, ${op.payload.discount || 0}, ${op.payload.total || 0},
                      'held', ${op.payload.notes || null}, ${op.payload.heldAt || nowIso()})
              ON CONFLICT (id) DO NOTHING
            `;
            result = { id: op.payload.id };
          } else if (op.type === 'cashflow') {
            const cf = op.payload;
            await sql`
              INSERT INTO cash_flow (id, store_id, direction, category, description, amount, method, reference, occurred_at, user_id, user_name, notes)
              VALUES (${cf.id}, ${auth.storeId}, ${cf.direction}, ${cf.category}, ${cf.description || null}, ${cf.amount},
                      ${cf.method || 'cash'}, ${cf.reference || null}, ${cf.occurredAt || nowIso()},
                      ${auth.user.id}, ${auth.user.name}, ${cf.notes || null})
              ON CONFLICT (id) DO NOTHING
            `;
            result = { id: cf.id };
          } else {
            status = 'failed'; error = `Unknown op: ${op.type}`;
          }
        } catch (e) { status = 'failed'; error = e.message; }

        await sql`
          INSERT INTO sync_queue (id, store_id, device_id, client_op_id, op_type, payload, status, error, processed_at)
          VALUES (${uuid()}, ${auth.storeId}, ${m.deviceId}, ${clientOpId}, ${op.type},
                  ${JSON.stringify(op.payload)}, ${status}, ${error}, NOW())
          ON CONFLICT (store_id, client_op_id) DO NOTHING
        `;

        results.push({ clientOpId, status, error, transactionId: result?.id || null, data: result });
      }

      return ok(res, { results, syncedAt: nowIso() });
    }

    if (method === 'GET' && path === '/transactions') {
      const auth = await requireAuth(req, res); if (!auth) return;
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '200', 10), 1000);
      const { rows } = await sql`
        SELECT t.*, u.name AS cashier_full_name FROM transactions t
        LEFT JOIN users u ON u.id = t.cashier_id
        WHERE t.store_id = ${auth.storeId}
        ORDER BY t.created_at DESC LIMIT ${limit}
      `;
      return ok(res, { transactions: rows });
    }

    /* ═════════ HELD ═════════ */
    if (method === 'GET' && path === '/held-transactions') {
      const auth = await requireAuth(req, res); if (!auth) return;
      const { rows } = await sql`
        SELECT * FROM held_transactions WHERE store_id = ${auth.storeId} AND status = 'held' ORDER BY held_at DESC
      `;
      return ok(res, { held: rows.map(h => ({ ...h, cart: safeJson(h.cart, []) })) });
    }

    if (method === 'POST' && path === '/held-transactions') {
      const auth = await requireAuth(req, res); if (!auth) return;
      const b = await readBody(req);
      const id = b.id || uuid();
      await sql`
        INSERT INTO held_transactions (id, store_id, cashier_id, cashier_name, customer_id, customer_name,
          label, cart, subtotal, discount, total, notes)
        VALUES (${id}, ${auth.storeId}, ${auth.user.id}, ${auth.user.name},
                ${b.customerId || null}, ${b.customerName || null}, ${b.label || null},
                ${JSON.stringify(b.cart || [])}, ${b.subtotal || 0}, ${b.discount || 0}, ${b.total || 0},
                ${b.notes || null})
      `;
      return ok(res, { id });
    }

    if (method === 'POST' && path.match(/^\/held-transactions\/[^/]+\/resume$/)) {
      const auth = await requireAuth(req, res); if (!auth) return;
      const id = path.split('/')[2];
      const { rows } = await sql`SELECT * FROM held_transactions WHERE id = ${id} AND store_id = ${auth.storeId} AND status = 'held'`;
      const held = rows[0];
      if (!held) return fail(res, 'Held transaction not found', 404);
      await sql`UPDATE held_transactions SET status='resumed', resolved_at=NOW(), resolved_by=${auth.user.id} WHERE id = ${id}`;
      return ok(res, { held: { ...held, cart: safeJson(held.cart, []) } });
    }

    if (method === 'POST' && path.match(/^\/held-transactions\/[^/]+\/cancel$/)) {
      const auth = await requireAuth(req, res); if (!auth) return;
      const id = path.split('/')[2];
      const { reason } = await readBody(req);
      await sql`
        UPDATE held_transactions SET status='cancelled', resolved_at=NOW(), resolved_by=${auth.user.id}, notes=${reason || null}
        WHERE id = ${id} AND store_id = ${auth.storeId}
      `;
      return ok(res);
    }

    /* ═════════ CASH FLOW ═════════ */
    if (method === 'GET' && path === '/cashflow') {
      const auth = await requireAuth(req, res); if (!auth) return;
      const { rows } = await sql`
        SELECT * FROM cash_flow WHERE store_id = ${auth.storeId} ORDER BY occurred_at DESC LIMIT 1000
      `;
      const { rows: totals } = await sql`
        SELECT
          COALESCE(SUM(CASE WHEN direction='in'  THEN amount END), 0) AS cash_in,
          COALESCE(SUM(CASE WHEN direction='out' THEN amount END), 0) AS cash_out
        FROM cash_flow WHERE store_id = ${auth.storeId}
      `;
      return ok(res, {
        entries: rows,
        totals: {
          cashIn: Number(totals[0]?.cash_in || 0),
          cashOut: Number(totals[0]?.cash_out || 0),
          net: Number(totals[0]?.cash_in || 0) - Number(totals[0]?.cash_out || 0),
        },
      });
    }

    if (method === 'POST' && path === '/cashflow') {
      const auth = await requireAuth(req, res); if (!auth) return;
      const b = await readBody(req);
      if (!b.direction || !b.category || b.amount === undefined) return fail(res, 'direction, category, amount required');
      const id = b.id || uuid();
      await sql`
        INSERT INTO cash_flow (id, store_id, direction, category, description, amount, method, reference, occurred_at, user_id, user_name, notes)
        VALUES (${id}, ${auth.storeId}, ${b.direction}, ${b.category}, ${b.description || null}, ${Number(b.amount)},
                ${b.method || 'cash'}, ${b.reference || null}, ${b.occurredAt || nowIso()},
                ${auth.user.id}, ${auth.user.name}, ${b.notes || null})
        ON CONFLICT (id) DO NOTHING
      `;
      return ok(res, { id });
    }

    /* ═════════ SHIFTS ═════════ */
    if (method === 'GET' && path === '/shifts/current') {
      const auth = await requireAuth(req, res); if (!auth) return;
      const { rows } = await sql`
        SELECT * FROM cashier_shifts WHERE store_id = ${auth.storeId} AND cashier_id = ${auth.user.id}
        AND status = 'open' ORDER BY opened_at DESC LIMIT 1
      `;
      return ok(res, { shift: rows[0] || null });
    }

    if (method === 'POST' && path === '/shifts/open') {
      const auth = await requireAuth(req, res); if (!auth) return;
      const { openingCash } = await readBody(req);
      const { rows: ex } = await sql`SELECT id FROM cashier_shifts WHERE store_id = ${auth.storeId} AND cashier_id = ${auth.user.id} AND status = 'open'`;
      if (ex[0]) return fail(res, 'Shift already open', 409);
      const id = uuid();
      await sql`
        INSERT INTO cashier_shifts (id, store_id, cashier_id, cashier_name, opening_cash)
        VALUES (${id}, ${auth.storeId}, ${auth.user.id}, ${auth.user.name}, ${Number(openingCash) || 0})
      `;
      return ok(res, { id });
    }

    /* ═════════ DASHBOARD ═════════ */
    if (method === 'GET' && path === '/reports/dashboard') {
      const auth = await requireAuth(req, res); if (!auth) return;
      const range = url.searchParams.get('range') || 'today';
      const fromSql = range === '7d' ? "NOW() - INTERVAL '7 days'"
        : range === '30d' ? "NOW() - INTERVAL '30 days'"
        : range === 'month' ? "date_trunc('month', NOW())"
        : "date_trunc('day', NOW())";

      const { rows: sales } = await sql.query(`
        SELECT COALESCE(SUM(total), 0) AS revenue, COALESCE(SUM(cost_total), 0) AS cost,
               COALESCE(SUM(profit), 0) AS profit, COUNT(*)::int AS txn_count,
               COALESCE(AVG(total), 0) AS avg_txn
        FROM transactions WHERE store_id = $1 AND status IN ('completed','partially_refunded')
          AND created_at >= ${fromSql}
      `, [auth.storeId]);

      const { rows: flows } = await sql.query(`
        SELECT COALESCE(SUM(CASE WHEN direction='in'  THEN amount END), 0) AS ci,
               COALESCE(SUM(CASE WHEN direction='out' THEN amount END), 0) AS co
        FROM cash_flow WHERE store_id = $1 AND occurred_at >= ${fromSql}
      `, [auth.storeId]);

      const { rows: low } = await sql`
        SELECT COUNT(*)::int AS n FROM inventory i JOIN products p ON p.id = i.product_id
        WHERE i.store_id = ${auth.storeId} AND p.track_stock = true AND p.is_archived = false
          AND i.quantity > 0 AND i.quantity <= p.reorder_level
      `;

      const { rows: oos } = await sql`
        SELECT COUNT(*)::int AS n FROM inventory i JOIN products p ON p.id = i.product_id
        WHERE i.store_id = ${auth.storeId} AND p.track_stock = true AND p.is_archived = false AND i.quantity <= 0
      `;

      const { rows: top } = await sql.query(`
        SELECT ti.product_name AS name, SUM(ti.quantity) AS qty, SUM(ti.line_total) AS revenue
        FROM transaction_items ti JOIN transactions t ON t.id = ti.transaction_id
        WHERE t.store_id = $1 AND t.status IN ('completed','partially_refunded')
          AND t.created_at >= ${fromSql}
        GROUP BY ti.product_name ORDER BY revenue DESC LIMIT 10
      `, [auth.storeId]);

      const s = sales[0], f = flows[0];
      return ok(res, {
        range,
        metrics: {
          revenue: Number(s?.revenue || 0), cost: Number(s?.cost || 0), profit: Number(s?.profit || 0),
          txnCount: Number(s?.txn_count || 0), avgTxn: Number(s?.avg_txn || 0),
          cashIn: Number(f?.ci || 0), cashOut: Number(f?.co || 0),
          netCash: Number(f?.ci || 0) - Number(f?.co || 0),
          lowStock: Number(low[0]?.n || 0), outOfStock: Number(oos[0]?.n || 0),
        },
        topProducts: top,
      });
    }

    /* ═════════ STAFF ═════════ */
    if (method === 'GET' && path === '/staff') {
      const auth = await requireAuth(req, res); if (!auth) return;
      if (!requireRole(auth, res, 'owner', 'manager')) return;
      const { rows } = await sql`
        SELECT su.id, su.role, su.is_active, u.id AS user_id, u.name, u.email, u.phone, u.last_login_at
        FROM store_users su JOIN users u ON u.id = su.user_id
        WHERE su.store_id = ${auth.storeId}
        ORDER BY CASE WHEN su.role='owner' THEN 0 ELSE 1 END, u.name
      `;
      return ok(res, { staff: rows });
    }

    if (method === 'POST' && path === '/staff') {
      const auth = await requireAuth(req, res); if (!auth) return;
      if (!requireRole(auth, res, 'owner')) return;
      const b = await readBody(req);
      if (!b.email || !b.name || !b.password) return fail(res, 'name, email, password required');
      if (b.password.length < 8) return fail(res, 'Password must be 8+ characters');
      if (!['manager', 'cashier'].includes(b.role)) return fail(res, 'Invalid role');

      const email = b.email.trim().toLowerCase();
      let { rows: uRows } = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
      let user = uRows[0];

      if (!user) {
        const uid = uuid();
        const hash = await hashPassword(b.password);
        await sql`INSERT INTO users (id, email, name, phone, password_hash) VALUES (${uid}, ${email}, ${b.name}, ${b.phone || null}, ${hash})`;
        user = { id: uid };
      }

      const { rows: ex } = await sql`SELECT id FROM store_users WHERE store_id = ${auth.storeId} AND user_id = ${user.id}`;
      if (ex[0]) return fail(res, 'Already a member', 409);

      const id = uuid();
      await sql`
        INSERT INTO store_users (id, store_id, user_id, role, permissions)
        VALUES (${id}, ${auth.storeId}, ${user.id}, ${b.role}, ${JSON.stringify(b.permissions || {})})
      `;
      return ok(res, { id, userId: user.id });
    }

    if (method === 'DELETE' && path.match(/^\/staff\/[^/]+$/)) {
      const auth = await requireAuth(req, res); if (!auth) return;
      if (!requireRole(auth, res, 'owner')) return;
      const id = path.split('/')[2];
      const { rows } = await sql`SELECT * FROM store_users WHERE id = ${id} AND store_id = ${auth.storeId} LIMIT 1`;
      const target = rows[0];
      if (!target) return fail(res, 'Not found', 404);
      if (target.role === 'owner') return fail(res, 'Cannot remove owner', 403);
      await sql`DELETE FROM store_users WHERE id = ${id}`;
      await sql`UPDATE sessions SET revoked_at = NOW() WHERE user_id = ${target.user_id}`;
      return ok(res);
    }

    /* Fallback */
    return fail(res, `Endpoint not found: ${method} ${path}`, 404);

  } catch (err) {
    console.error('API error:', err);
    return fail(res, err.message || 'Server error', 500, 'SERVER_ERROR');
  }
};