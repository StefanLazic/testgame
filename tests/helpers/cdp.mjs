// A very small Chrome DevTools Protocol client, built on node's global
// WebSocket so the browser tests need no npm dependencies at all.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CANDIDATES = [
  process.env.CHROME_BIN,
  '/usr/local/share/chromium/chrome-linux/chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

export function findChrome() {
  for (const bin of CANDIDATES) {
    try { fs.accessSync(bin, fs.constants.X_OK); return bin; } catch { /* keep looking */ }
  }
  return null;
}

class Connection {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Set();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`${msg.error.message} (${JSON.stringify(msg.params || {})})`));
        else resolve(msg.result);
      } else if (msg.method) {
        for (const fn of this.listeners) fn(msg);
      }
    });
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(payload));
      setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error(`CDP timeout: ${method}`));
      }, 30000);
    });
  }

  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  close() { try { this.ws.close(); } catch { /* already gone */ } }
}

export async function launchBrowser({ width = 390, height = 844 } = {}) {
  const bin = findChrome();
  if (!bin) throw new Error('No Chrome/Chromium binary found — set CHROME_BIN.');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'mimi-smoke-'));
  const child = spawn(bin, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader',
    '--disable-dev-shm-usage', '--no-first-run', '--disable-extensions',
    `--window-size=${width},${height}`,
    '--remote-debugging-port=0', `--user-data-dir=${profile}`,
    'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  const wsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    const timer = setTimeout(() => reject(new Error(`Chrome did not start:\n${buf}`)), 30000);
    child.stderr.on('data', (chunk) => {
      buf += chunk;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) { clearTimeout(timer); resolve(m[1]); }
    });
    child.on('exit', (code) => { clearTimeout(timer); reject(new Error(`Chrome exited (${code}):\n${buf}`)); });
  });

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', () => reject(new Error('CDP socket failed')), { once: true });
  });
  const conn = new Connection(ws);

  return {
    async newPage(url) { return newPage(conn, url, { width, height }); },
    async close() {
      conn.close();
      child.kill();
      await new Promise((r) => setTimeout(r, 100));
      try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* best effort */ }
    },
  };
}

async function newPage(conn, url, { width, height }) {
  const { targetId } = await conn.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await conn.send('Target.attachToTarget', { targetId, flatten: true });
  const send = (method, params) => conn.send(method, params, sessionId);

  const consoleErrors = [];
  const consoleLog = [];
  conn.on((msg) => {
    if (msg.sessionId !== sessionId) return;
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = (msg.params.args || []).map((a) => a.value ?? a.description ?? a.type).join(' ');
      consoleLog.push(`${msg.params.type}: ${text}`);
      if (msg.params.type === 'error') consoleErrors.push(text);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails;
      consoleErrors.push(d.exception?.description || d.text);
    }
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 2, mobile: true,
    screenOrientation: { type: 'portraitPrimary', angle: 0 },
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });

  const page = {
    consoleErrors,
    consoleLog,
    send,
    async goto(target) {
      await send('Page.navigate', { url: target });
      await page.waitFor('document.readyState === "complete"', 30000);
    },
    // `expression` is always evaluated as an expression — wrap anything
    // multi-statement in an IIFE at the call site.
    async eval(expression) {
      const res = await send('Runtime.evaluate', {
        expression: `(${expression})`,
        returnByValue: true,
        awaitPromise: true,
      });
      if (res.exceptionDetails) {
        throw new Error(`page.eval failed: ${res.exceptionDetails.exception?.description || res.exceptionDetails.text}`);
      }
      return res.result.value;
    },
    async waitFor(expression, timeout = 20000, label = expression) {
      const deadline = Date.now() + timeout;
      let last;
      while (Date.now() < deadline) {
        try { last = await page.eval(expression); } catch (err) { last = `threw: ${err.message}`; }
        if (last) return last;
        await new Promise((r) => setTimeout(r, 120));
      }
      throw new Error(`Timed out waiting for: ${label} (last value ${JSON.stringify(last)})`);
    },
    // Real touch taps, so the game's pointer handling is exercised the same way
    // a phone would exercise it.
    async touchTap(x, y) {
      const point = { x: Math.round(x), y: Math.round(y), radiusX: 6, radiusY: 6, force: 1 };
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
      await new Promise((r) => setTimeout(r, 40));
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await new Promise((r) => setTimeout(r, 60));
    },
    async tapSelector(selector) {
      // The shop row scrolls horizontally on a phone, so bring the target into
      // view before measuring it — otherwise the tap lands on the board.
      await page.eval(`(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (el) el.scrollIntoView({ block: 'nearest', inline: 'center' });
        return true;
      })()`);
      await new Promise((r) => setTimeout(r, 120));
      const box = await page.eval(`(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const hit = document.elementFromPoint(cx, cy);
        return { x: cx, y: cy, w: r.width, h: r.height, covered: !(hit === el || el.contains(hit)) };
      })()`);
      if (!box) throw new Error(`No element for selector ${selector}`);
      if (box.w < 1 || box.h < 1) throw new Error(`Element ${selector} has no size`);
      if (box.covered) throw new Error(`Element ${selector} is covered by something else at (${box.x}, ${box.y})`);
      await page.touchTap(box.x, box.y);
      return box;
    },
    async close() { await conn.send('Target.closeTarget', { targetId }); },
  };

  if (url) await page.goto(url);
  return page;
}
