import { launch, BASE, login, state, out } from './lib.mjs';
import { openPos } from './t05a-pos-online.mjs';
const S = state();
const { browser, ctx, page } = await launch();
await login(page, S.M.email, S.pw); await openPos(page, S); await page.waitForTimeout(3000);
const cdp = await ctx.newCDPSession(page); await cdp.send('Runtime.enable'); const urls = {}; cdp.on('Debugger.scriptParsed', s => { urls[s.scriptId] = s.url; }); await cdp.send('Debugger.enable');
const { result } = await cdp.send('Runtime.evaluate', { expression: 'window' });
const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId });
const online = listeners.filter(l => l.type === 'online');
const res = [];
for (const l of online) { const d = l.handler && l.handler.description ? l.handler.description.slice(0, 500) : '(?)'; res.push({ type: l.type, scriptId: l.scriptId, line: l.lineNumber, col: l.columnNumber, handler: d }); }
for (const r of res) { r.url = urls[r.scriptId]; try { const src = (await cdp.send('Debugger.getScriptSource', { scriptId: r.scriptId })).scriptSource.split('\n')[r.line] || ''; r.contexte = src.slice(Math.max(0, r.col - 420), r.col + 260); } catch (e) { r.contexte = 'ERR ' + e.message; } }
console.log(JSON.stringify(res, null, 1));
const scripts = {}; 
await browser.close();

