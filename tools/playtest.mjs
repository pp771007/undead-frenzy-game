// 自動遊玩：在無頭瀏覽器裡快轉打完整局（手動呼叫 updateGame，不等畫面），印出每一波的數據。
// 用法：node tools/playtest.mjs <遊戲網址> [human|still] [標籤] > logs/xxx.log
//   human：像真人 —— 地上的預警圈、首領蓄力、血彈要 REACT 秒後才反應，每 DECIDE 秒重新決定往哪走，打得正熱就放新星；
//          沒有要閃的東西時走去拿戰場遺跡（祭壇／靈泉／寶棺），再來才是撿靈魂
//   still：站著不動，只有被包圍才放新星（量「不會走位的玩家」撐到哪）
// 兩種都每 0.5 秒把錢花光（升級鈕發光就升級，否則隨機召喚），祝福隨機挑、有傳說先拿傳說、血量低於 BOT_HEAL_BELOW 就選「補滿血」
// —— 花錢和選卡比真人有效率，勝率會偏高。
// 需要 playwright（npm i playwright）；遊戲要先用任何靜態伺服器跑起來，例如 python -m http.server 8765。
// 直接讀寫遊戲的全域變數與函式（gameState、updateGame、trySummon…），遊戲裡改名的話這裡要跟著改。
import { chromium } from 'playwright';

const URL = process.argv[2];
const POLICY = process.argv[3] || 'human';
const TAG = process.argv[4] || '-';
if (!URL) { console.error('usage: node tools/playtest.mjs <url> [human|still] [tag]'); process.exit(1); }

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 420, height: 860 } });
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto(URL);
await page.waitForFunction(() => typeof appScreen !== 'undefined' && appScreen === 'title', null, { timeout: 30000 });

await page.evaluate((policy) => {
    cancelAnimationFrame(animationFrameId); animationFrameId = -1;
    meta.tutorialDone = true; Sfx.play = () => {};
    resetGame(); enterPlaying(); tutorial = null;
    window.__bot = { t: 0, waves: [], cur: null, spendTimer: 0, policy, seen: new WeakMap(), decide: 0, src: {} };
    // 記每種怪一共掉了多少靈魂：經濟有沒有被哪隻怪放大（吞魂者第一版就是這樣抓到的）
    const B = window.__bot;
    B.relics = {};
    const origFinish = window.finishRelic;
    window.finishRelic = function (r) { B.relics[r.kind] = (B.relics[r.kind] || 0) + 1; return origFinish(r); };
    const origDie = Monster.prototype.die;
    Monster.prototype.die = function () { window.__dying = this.config.type; try { origDie.call(this); } finally { window.__dying = null; } };
    const origDrop = window.dropSouls;
    window.dropSouls = function (x, y, a) { const k = window.__dying || 'other'; B.src[k] = (B.src[k] || 0) + a; return origDrop(x, y, a); };
}, POLICY);

const SIM_SECONDS_PER_CALL = 30;
let r;
for (;;) {
    r = await page.evaluate((steps) => {
        const B = window.__bot, DT = 1 / 30, REACT = 0.4, DECIDE = 0.15, STUCK_SECONDS = 240, MAX_SECONDS = 3600;
        const noticed = (o) => { if (!B.seen.has(o)) B.seen.set(o, B.t); return B.t - B.seen.get(o) >= REACT; };
        for (let i = 0; i < steps; i++) {
            if (gameState.gameOver) return { over: true };
            if (gameState.victoryOpen) { endRunFromVictory(); return { over: true, won: true }; }
            if (gameState.draftOpen && gameState.pendingDraft) {
                const BOT_HEAL_BELOW = 0.5;
                if (gameState.player.currentHealth < gameState.player.maxHealth * BOT_HEAL_BELOW) { healDraft(); continue; }
                const opts = gameState.pendingDraft.options; const leg = opts.find(id => BLESSINGS[id].legendary);
                pickBlessing(leg || opts[Math.floor(Math.random() * opts.length)]); continue;
            }
            const p = gameState.player;
            if (!gameState.betweenWaves && (!B.cur || B.cur.wave !== gameState.currentWave)) B.cur = { wave: gameState.currentWave, start: B.t, minHp: 1, dmg: 0, peak: 0, ev: gameState.waveEvent };
            if (gameState.betweenWaves && B.cur && !B.cur.end) { B.cur.end = B.t; B.cur.dur = +(B.cur.end - B.cur.start).toFixed(1); B.cur.summons = gameState.summons.length; B.waves.push(B.cur); }
            let near = 0, fight = 0;
            for (const m of gameState.monsters) { if (!m.isAlive) continue; const d = Math.hypot(p.pos.x - m.pos.x, p.pos.y - m.pos.y); if (d < 90) near++; if (d < 300) fight++; }
            if (B.policy === 'human') {
                B.decide -= DT;
                if (B.decide <= 0) {
                    B.decide = DECIDE;
                    let hx = 0, hy = 0;
                    for (const m of gameState.monsters) {
                        if (!m.isAlive) continue;
                        const dx = p.pos.x - m.pos.x, dy = p.pos.y - m.pos.y, d = Math.hypot(dx, dy) || 1;
                        if (d < 70) { hx += dx / d; hy += dy / d; }
                        if (m.mark && noticed(m.mark)) { const ex = p.pos.x - m.mark.x, ey = p.pos.y - m.mark.y, e = Math.hypot(ex, ey) || 1; if (e < 60) { hx += ex / e * 3; hy += ey / e * 3; } }
                        if (m instanceof DragonBoss) {
                            if (m.windup > 0 && noticed(m) && m.inBreath(p.pos)) { const s = (dx * -m.breathDir.y + dy * m.breathDir.x) >= 0 ? 1 : -1; hx += -m.breathDir.y * s * 4; hy += m.breathDir.x * s * 4; }
                            if (m.flight > 0 && m.land && noticed(m.land)) { const ex = p.pos.x - m.land.x, ey = p.pos.y - m.land.y, e = Math.hypot(ex, ey) || 1; if (e < m.config.landRadius + 15) { hx += ex / e * 4; hy += ey / e * 4; } }
                            continue;
                        }
                        if (m.windup > 0 && !(m instanceof BloodEyeMonster) && noticed(m)) { const R = (m.config.novaRadius || m.config.slamRadius || 80) + 20; if (d < R) { hx += dx / d * 3; hy += dy / d * 3; } }
                    }
                    for (const h of gameState.hazards) { if (!noticed(h)) continue; const dx = p.pos.x - h.x, dy = p.pos.y - h.y, d = Math.hypot(dx, dy) || 1; if (d < h.r + 12) { hx += dx / d * 3; hy += dy / d * 3; } }
                    for (const bo of gameState.enemyBolts) { if (!noticed(bo)) continue; const tx = p.pos.x - bo.pos.x, ty = p.pos.y - bo.pos.y, along = tx * bo.dir.x + ty * bo.dir.y; if (along < 0) continue; const perp = tx * -bo.dir.y + ty * bo.dir.x; if (Math.abs(perp) < 30 && along < 200) { const s = perp >= 0 ? 1 : -1; hx += -bo.dir.y * s * 3; hy += bo.dir.x * s * 3; } }
                    const relic = Math.hypot(hx, hy) < 0.1 && gameState.relics.find(x => !x.done && noticed(x));
                    if (relic) { hx = relic.x - p.pos.x; hy = relic.y - p.pos.y; }
                    else if (Math.hypot(hx, hy) < 0.1) { let best = null, bd = 1e9; for (const o of gameState.orbs) { const d = distanceSq(o.pos, p.pos); if (d < bd) { bd = d; best = o; } } if (best && bd < 250 * 250) { hx = (best.pos.x - p.pos.x) * 0.01; hy = (best.pos.y - p.pos.y) * 0.01; } }
                    const mag = Math.hypot(hx, hy);
                    inputState.movementVector = mag > 0 ? { x: hx / mag * Math.min(1, mag), y: hy / mag * Math.min(1, mag) } : { x: 0, y: 0 };
                }
                if ((near >= 4 || fight >= 8) && gameState.ultCooldown <= 0) useUltimate();
            } else {
                inputState.movementVector = { x: 0, y: 0 };
                if (near >= 4 && gameState.ultCooldown <= 0) useUltimate();
            }
            B.spendTimer -= DT;
            if (B.spendTimer <= 0) {
                B.spendTimer = 0.5;
                for (let g = 0; g < 50; g++) {
                    let did = false;
                    for (const u of UNIT_UI) { const unit = gameState.units[u.type], uc = unit.upgradeCost; if (unit.count > 0 && gameState.souls >= uc && isUpgradeGoodDeal(u.type, unit.level, getSummonCost(UNIT_TYPES[u.type].cfg()), uc)) { did = tryUpgrade(u.type); if (did) break; } }
                    // 召喚比例照卡片順序（亡靈法師：骷髏 55%、怨靈 15%、眼魔 30%）
                    if (!did) { const x = Math.random(); did = trySummon(UNIT_UI[x < 0.55 ? 0 : x < 0.7 ? 1 : 2].type); }
                    if (!did) break;
                }
            }
            const h0 = p.currentHealth;
            updateGame(DT);
            B.t += DT;
            if (B.cur && p.currentHealth < h0) B.cur.dmg += (h0 - p.currentHealth) / p.maxHealth;
            if (B.cur && !gameState.betweenWaves) { B.cur.minHp = Math.min(B.cur.minHp, p.currentHealth / p.maxHealth); B.cur.peak = Math.max(B.cur.peak, gameState.monsters.length); }
            B.maxArmy = Math.max(B.maxArmy || 0, gameState.summons.length);
            // 一波打超過 STUCK_SECONDS 秒當成卡關：記下場上剩什麼、離法師多遠、在打誰
            if (B.cur && !gameState.betweenWaves && B.t - B.cur.start > STUCK_SECONDS) {
                // queue：還沒出場的怪（countRemainingMonsters 也算它們）；tgtD：牠跟牠的目標隔多遠；near：離牠最近的召喚物多遠、那隻在幹嘛
                B.stuck = {
                    wave: gameState.currentWave, summons: gameState.summons.length, queue: gameState.spawnQueue.length, straggling: gameState.straggling,
                    mons: gameState.monsters.filter(m => m.isAlive).slice(0, 10).map(m => {
                        const s = summonGrid.nearest(m.pos, 2000);
                        return {
                            type: m.config.type, d: Math.round(Math.hypot(m.pos.x - p.pos.x, m.pos.y - p.pos.y)), stealthed: !!m.stealthed, flying: !!m.flying,
                            tgt: m.target ? (m.target === p ? 'player' : (m.target.config?.type || 'orb')) : null, tgtD: m.target ? Math.round(Math.hypot(m.pos.x - m.target.pos.x, m.pos.y - m.target.pos.y)) : null,
                            near: s ? { type: s.config.type, d: Math.round(Math.hypot(m.pos.x - s.pos.x, m.pos.y - s.pos.y)), hasTarget: !!s.target, returning: !!s.isReturning, retreat: !!(s.isRetreatingFromMonster || s.isRetreatingToPlayer) } : null,
                        };
                    }),
                };
                return { over: true };
            }
            if (B.t > MAX_SECONDS) return { over: true };
        }
        return { over: false };
    }, SIM_SECONDS_PER_CALL * 30);
    if (r.over) break;
}

const out = await page.evaluate(() => ({
    waves: window.__bot.waves, t: window.__bot.t, wave: gameState.currentWave, stuck: window.__bot.stuck,
    killedBy: gameState.killedBy && gameState.killedBy.config && gameState.killedBy.config.type,
    souls: window.__bot.src, resonance: gameState.resonance, blessings: gameState.blessings, relics: window.__bot.relics,
    achv: Object.keys(meta.achv), maxArmy: window.__bot.maxArmy, kills: meta.stats.kills,
}));
if (out.stuck) console.log('STUCK', JSON.stringify(out.stuck));
console.log(`RESULT ${TAG} policy=${POLICY} wave=${out.wave} t=${(out.t / 60).toFixed(1)}min won=${!!r.won} killedBy=${out.killedBy}`);
console.log('SOULS', JSON.stringify(out.souls));
console.log('RELICS', JSON.stringify(out.relics), 'blessings', Object.values(out.blessings).reduce((a, b) => a + b, 0));
console.log('ACHV', out.achv.length, out.achv.join(' '), 'maxArmy', out.maxArmy);
// 每種怪一局打倒幾隻：圖鑑成就的門檻照這個定
console.log('KILLS', JSON.stringify(out.kills));
console.log('RESONANCE', JSON.stringify(out.resonance), JSON.stringify(out.blessings));
console.log('wave\tdur\tminHp\tdmg\tpeakMon\tsummons\tevent');
for (const w of out.waves) console.log([w.wave, w.dur, w.minHp.toFixed(2), w.dmg.toFixed(2), w.peak, w.summons, w.ev || ''].join('\t'));
await browser.close();
