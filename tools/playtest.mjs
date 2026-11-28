// 自動遊玩：在無頭瀏覽器裡快轉打完整局（手動呼叫 updateGame，不等畫面），印出每一波的數據。
// 用法：node tools/playtest.mjs <遊戲網址> [human|still] [標籤] [職業 id，預設 necro] > logs/xxx.log
//   human：像真人 —— 地上的預警圈、首領蓄力、血彈要 REACT 秒後才反應，每 DECIDE 秒重新決定往哪走，打得正熱就放新星；
//          沒有要閃的東西時走去拿戰場遺跡（祭壇／靈泉／寶棺），再來才是撿靈魂
//   still：站著不動，只有被包圍才放新星（量「不會走位的玩家」撐到哪）
// 兩種都每 0.5 秒把錢花光（升級鈕發光就升級，否則隨機召喚），祝福挑自己在疊的流派、有傳說先拿傳說
// —— 花錢比真人快，但選卡、走位、召喚搭配都比真人粗糙得多：機器人打得到的地方，會玩的人只會更遠。
// 需要 playwright（npm i playwright）；遊戲要先用任何靜態伺服器跑起來，例如 python -m http.server 8765。
// 直接讀寫遊戲的全域變數與函式（gameState、updateGame、trySummon…），遊戲裡改名的話這裡要跟著改。
import { chromium } from 'playwright';

const URL = process.argv[2];
const POLICY = process.argv[3] || 'human';
const TAG = process.argv[4] || '-';
const CLASS = process.argv[5] || 'necro';
// 環境變數 PICK=smart|random|first：祝福怎麼挑（見迴圈裡的說明）；META=zero|half|max：開局的局外強化（half = 數值類各買一半、一次買斷的不買）
const PICK = process.env.PICK || 'smart';
const META = process.env.META || 'zero';
// FOCUS=流派 id：只走這個流派（量「每個流派單獨走能不能過」）。這個流派的卡（含傳說）先拿，沒有才照 smart 挑
const FOCUS = process.env.FOCUS || '';
if (!URL) { console.error('usage: node tools/playtest.mjs <url> [human|still] [tag]'); process.exit(1); }

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 420, height: 860 } });
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto(URL);
await page.waitForFunction(() => typeof appScreen !== 'undefined' && appScreen === 'title', null, { timeout: 30000 });

await page.evaluate(([policy, cls, pick, metaLvl, focus]) => {
    cancelAnimationFrame(animationFrameId); animationFrameId = -1;
    meta.tutorialDone = true; Sfx.play = () => {};
    // 直接把那個職業的解鎖條件打開
    if (CLASSES[cls].unlock) meta.achv[CLASSES[cls].unlock] = true;
    meta.classSel = cls;
    const metaLvOf = (m) => metaLvl === 'max' ? m.max : metaLvl === 'half' && m.max > 1 ? Math.round(m.max / 2) : 0;
    for (const id in META_UPGRADES) meta.upgrades[id] = metaLvOf(META_UPGRADES[id]);
    const classDefs = CLASSES[cls].metaUpgrades || {};
    meta.classUpgrades[cls] = {};
    for (const id in classDefs) meta.classUpgrades[cls][id] = metaLvOf(classDefs[id]);
    resetGame(); enterPlaying(); tutorial = null;
    window.__bot = { t: 0, waves: [], cur: null, policy, pick, focus, seen: new WeakMap(), decide: 0, src: {} };
    // 記每種怪一共掉了多少靈魂：經濟有沒有被哪隻怪放大（吞魂者第一版就是這樣抓到的）
    const B = window.__bot;
    B.relics = {};
    const origFinish = window.finishRelic;
    window.finishRelic = function (r) { B.relics[r.kind] = (B.relics[r.kind] || 0) + 1; return origFinish(r); };
    const origDie = Monster.prototype.die;
    Monster.prototype.die = function () { window.__dying = this.config.type; try { origDie.call(this); } finally { window.__dying = null; } };
    const origDrop = window.dropSouls;
    window.dropSouls = function (x, y, a) { const k = window.__dying || 'other'; B.src[k] = (B.src[k] || 0) + a; return origDrop(x, y, a); };
    // 主角每一下掉多少血、誰打的（佔最大生命的比例）：被秒殺時看是一隻怪一下很痛，還是好幾隻同時打中
    // 畫面上的字有沒有漏網的長小數（遊戲顯示前會被 tidyNumbers 修掉，這裡記原文）：看到就回頭補 formatNumberK
    B.decimals = {};
    const origTidy = window.tidyNumbers;
    window.tidyNumbers = function (text) { if (typeof text === 'string' && LONG_DECIMAL.test(text)) B.decimals[text] = (B.decimals[text] || 0) + 1; LONG_DECIMAL.lastIndex = 0; return origTidy(text); };
    B.hits = [];
    const origHurt = Player.prototype.takeDamage;
    Player.prototype.takeDamage = function (amount, source) {
        const h0 = this.currentHealth;
        const ret = origHurt.call(this, amount, source);
        const lost = (h0 - this.currentHealth) / this.maxHealth;
        // 首領照最近出的那一招分開記（Boss:dash、Boss:knives…）：看是哪一招在磨主角
        const type = (source && source.config && source.config.type) || 'other';
        if (lost > 0) B.hits.push([B.t, type === 'Boss' ? `Boss:${source.lastMove || 'melee'}` : type, lost]);
        return ret;
    };
}, [POLICY, CLASS, PICK, META, FOCUS]);

const SIM_SECONDS_PER_CALL = 30;
let r;
for (;;) {
    r = await page.evaluate((steps) => {
        const B = window.__bot, DT = 1 / 30, REACT = 0.4, DECIDE = 0.15, STUCK_SECONDS = 240, MAX_SECONDS = 3600;
        // 刺客：離目標超過這麼遠就走過去
        const BOT_ROGUE_HUNT = 150;
        // 近戰職業：被貼身不退（要站在怪堆前打）；武僧血低於 BOT_MONK_REST、BOT_MONK_SAFE 內沒怪時入定
        const BOT_MELEE = { warrior: true, monk: true };
        const BOT_MONK_REST = 0.5, BOT_MONK_SAFE = 150, BOT_MONK_CROWD = 4, BOT_MONK_CROWD_R = 70;
        // 精靈：怪近到這麼近就往反方向退
        const BOT_ELF_KITE = 170;
        // 收尾時走到離最後幾隻怪這麼近
        const BOT_FINISH_DIST = 110;
        // 德魯伊：沒有要閃的東西時，離林地（最近一棵橡樹）超過這麼遠就走回去
        const BOT_GROVE_RETURN = 110;
        const noticed = (o) => { if (!B.seen.has(o)) B.seen.set(o, B.t); return B.t - B.seen.get(o) >= REACT; };
        for (let i = 0; i < steps; i++) {
            if (gameState.gameOver) return { over: true };
            if (gameState.victoryOpen) { endRunFromVictory(); return { over: true, won: true }; }
            // 寶棺轉盤：不等動畫，直接拿抽到的獎（接著跳出來的三選一下一圈照常挑）
            if (gameState.wheelOpen) { closeCoffinWheel(); continue; }
            if (gameState.draftOpen && gameState.pendingDraft) {
                // 像真人一樣挑：傳說先拿；稀有卡多加分（自己在疊的流派加更多）；否則挑自己已經在疊的流派，全軍通用的算中等。
                // 完全亂挑的話同一個設定兩局可以差三十波（有一局剛好疊成、有一局全是雜牌），拿來比較職業強弱全是雜訊
                // PICK=random：完全亂挑（像不懂搭配的新手）；PICK=first：永遠拿第一張。拿來量「選擇有沒有意義」
                const opts = gameState.pendingDraft.options;
                if (B.focus) { const f = opts.find(id => BLESSINGS[id].school === B.focus && BLESSINGS[id].legendary) || opts.find(id => BLESSINGS[id].school === B.focus); if (f) { pickBlessing(f); continue; } }
                const leg = opts.find(id => BLESSINGS[id].legendary);
                if (B.pick === 'random') { pickBlessing(opts[Math.floor(Math.random() * opts.length)]); continue; }
                if (B.pick === 'first') { pickBlessing(opts[0]); continue; }
                // 召喚卡：越少張越想拿（兵是戰力的底）
                const BOT_ARMY_SCORE = 1.5, BOT_RARE_SCORE = 3, BOT_JITTER = 0.5, BOT_UNIT_SCORE = 4, BOT_UNIT_DECAY = 0.4;
                const score = (id) => { const B = BLESSINGS[id]; if (B.unitCard) return BOT_UNIT_SCORE - BOT_UNIT_DECAY * bl(id) + Math.random() * BOT_JITTER; if (B.ultCard) return BOT_UNIT_SCORE + Math.random() * BOT_JITTER; return (B.school === ARMY_SCHOOL ? BOT_ARMY_SCORE : schoolPoints(B.school)) + (B.rare ? BOT_RARE_SCORE : 0) + Math.random() * BOT_JITTER; };
                pickBlessing(leg || opts.reduce((a, b) => score(b) > score(a) ? b : a)); continue;
            }
            const p = gameState.player;
            // lost：這一波陣亡的召喚物佔開戰時大軍的比例（開戰時的數量＋這一波召的－結束時還在的）。
            // 法師躲在大軍後面時主角幾乎不掉血，壓力全落在大軍身上，只看主角掉血會以為很輕鬆
            const summonedTotal = () => Object.values(gameState.totalSummons).reduce((a, b) => a + b, 0);
            if (!gameState.betweenWaves && (!B.cur || B.cur.wave !== gameState.currentWave)) B.cur = { wave: gameState.currentWave, start: B.t, minHp: 1, dmg: 0, peak: 0, ev: gameState.waveEvent, army0: gameState.summons.length, summoned0: summonedTotal() };
            if (gameState.betweenWaves && B.cur && !B.cur.end) {
                B.cur.end = B.t; B.cur.dur = +(B.cur.end - B.cur.start).toFixed(1); B.cur.summons = gameState.summons.length;
                const lost = B.cur.army0 + (summonedTotal() - B.cur.summoned0) - gameState.summons.length;
                B.cur.lost = Math.max(0, lost) / Math.max(1, B.cur.army0);
                B.waves.push(B.cur);
            }
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
                        // 被貼身就退開（戰士不退：他要站在怪堆前砍）
                        if (d < 70 && !BOT_MELEE[runClass()]) { hx += dx / d; hy += dy / d; }
                        if (m.mark && noticed(m.mark)) { const ex = p.pos.x - m.mark.x, ey = p.pos.y - m.mark.y, e = Math.hypot(ex, ey) || 1; if (e < 60) { hx += ex / e * 3; hy += ey / e * 3; } }
                        // 首領的招式全部走地面預警（gameState.bossMarks），在下面閃
                        if (m instanceof BossMonster) continue;
                        if (m.windup > 0 && !(m instanceof BloodEyeMonster) && noticed(m)) { const R = (m.config.novaRadius || m.config.slamRadius || 80) + 20; if (d < R) { hx += dx / d * 3; hy += dy / d * 3; } }
                    }
                    // 吸血鬼站進靈泉（聖水）會燙：當成地上的危險圈走出去
                    if (runClass() === 'vampire') for (const rl of gameState.relics) { if (rl.done || rl.kind !== 'spring') continue; const dx = p.pos.x - rl.x, dy = p.pos.y - rl.y, d = Math.hypot(dx, dy) || 1; if (d < RELIC_RADIUS + 12) { hx += dx / d * 3; hy += dy / d * 3; } }
                    for (const h of gameState.hazards) { if (!noticed(h)) continue; const dx = p.pos.x - h.x, dy = p.pos.y - h.y, d = Math.hypot(dx, dy) || 1; if (d < h.r + 12) { hx += dx / d * 3; hy += dy / d * 3; } }
                    // 首領的地面預警：紅圈往外走、紅線往垂直方向走、扇形往側邊走
                    for (const mk of gameState.bossMarks) {
                        if (!noticed(mk)) continue;
                        if (mk.shape === 'circle') { const dx = p.pos.x - mk.x, dy = p.pos.y - mk.y, d = Math.hypot(dx, dy) || 1; if (d < mk.r + 15) { hx += dx / d * 3; hy += dy / d * 3; } continue; }
                        if (mk.shape === 'cone') { if (bossMarkHits(mk, p.pos)) { const cx = Math.cos(mk.a), cy = Math.sin(mk.a), tx = p.pos.x - mk.x, ty = p.pos.y - mk.y, s = (tx * -cy + ty * cx) >= 0 ? 1 : -1; hx += -cy * s * 4; hy += cx * s * 4; } continue; }
                        const tx = p.pos.x - mk.x, ty = p.pos.y - mk.y, along = tx * mk.dx + ty * mk.dy, perp = tx * -mk.dy + ty * mk.dx;
                        if (along > -15 && along < mk.len + 15 && Math.abs(perp) < mk.w + 15) { const s = perp >= 0 ? 1 : -1; hx += -mk.dy * s * 3; hy += mk.dx * s * 3; }
                    }
                    for (const bo of gameState.enemyBolts) { if (!noticed(bo)) continue; const tx = p.pos.x - bo.pos.x, ty = p.pos.y - bo.pos.y, along = tx * bo.dir.x + ty * bo.dir.y; if (along < 0) continue; const perp = tx * -bo.dir.y + ty * bo.dir.x; if (Math.abs(perp) < 30 && along < 200) { const s = perp >= 0 ? 1 : -1; hx += -bo.dir.y * s * 3; hy += bo.dir.x * s * 3; } }
                    // 戰士：沒有要閃的東西時迎上去打（陣型面向走的方向，逃跑等於把背後讓給怪），走到 BOT_WAR_HOLD 內就站定讓陣型接戰。
                    // 殘血也不撤：撤退會一路逃、整波拖到卡關，真人也不會這樣打
                    const BOT_WAR_HOLD = 55, BOT_WAR_SEEK = 400;
                    // 武僧殘血、身邊又沒怪：站著不動入定回血
                    const monkRest = runClass() === 'monk' && p.currentHealth < p.maxHealth * BOT_MONK_REST && !monsterGrid.anyWithin(p.pos, BOT_MONK_SAFE);
                    // 武僧被一群貼身時先退開找空隙（所有怪都衝著他來，站著被圍會一路掉血、連擊一直斷）
                    if (runClass() === 'monk' && Math.hypot(hx, hy) < 0.1) {
                        let n = 0, cx = 0, cy = 0;
                        monsterGrid.forEachInRadius(p.pos, BOT_MONK_CROWD_R, m => { if (m.isAlive && distanceSq(m.pos, p.pos) < BOT_MONK_CROWD_R * BOT_MONK_CROWD_R) { n++; cx += m.pos.x; cy += m.pos.y; } });
                        if (n >= BOT_MONK_CROWD) { hx = p.pos.x - cx / n; hy = p.pos.y - cy / n; }
                    }
                    if (BOT_MELEE[runClass()] && !monkRest && Math.hypot(hx, hy) < 0.1) {
                        let nm = null, nd = BOT_WAR_SEEK;
                        for (const m of gameState.monsters) { if (!m.isAlive || m.stealthed) continue; const d = Math.hypot(m.pos.x - p.pos.x, m.pos.y - p.pos.y); if (d < nd) { nd = d; nm = m; } }
                        if (nm) {
                            const ux = (nm.pos.x - p.pos.x) / (nd || 1), uy = (nm.pos.y - p.pos.y) / (nd || 1);
                            if (nd > BOT_WAR_HOLD) { hx = ux; hy = uy; } else { hx = ux * 0.05; hy = uy * 0.05; }
                        }
                    }
                    if (runClass() === 'druid' && Math.hypot(hx, hy) < 0.1) {
                        let oak = null, od = Infinity;
                        // 守著最老那棵（林地中心）：種樹也只種在它旁邊
                        oak = eldestOak(); od = oak ? distanceSq(oak.pos, p.pos) : Infinity;
                        if (oak && od > BOT_GROVE_RETURN * BOT_GROVE_RETURN) { hx = oak.pos.x - p.pos.x; hy = oak.pos.y - p.pos.y; }
                    }
                    // 精靈：一直在動（停下來射速掉回原本）。怪靠近就往反方向退（回頭射傷害加倍），夠遠就繞著怪群側移
                    if (runClass() === 'elf' && !gameState.straggling && Math.hypot(hx, hy) < 0.1) {
                        let nm = null, nd = Infinity;
                        for (const m of gameState.monsters) { if (!m.isAlive || m.stealthed) continue; const d = distanceSq(m.pos, p.pos); if (d < nd) { nd = d; nm = m; } }
                        if (nm) {
                            const d = Math.sqrt(nd) || 1, ax = (p.pos.x - nm.pos.x) / d, ay = (p.pos.y - nm.pos.y) / d;
                            if (d < BOT_ELF_KITE) { hx = ax; hy = ay; }
                            else { B.strafe = B.strafe || 1; if (Math.random() < 0.01) B.strafe *= -1; hx = -ay * B.strafe + (d > bowRange() * 0.8 ? -ax * 0.5 : 0); hy = ax * B.strafe + (d > bowRange() * 0.8 ? -ay * 0.5 : 0); }
                        }
                    }
                    // 刺客：去追標記的目標（收入幾乎全靠牠），走到飛刀射程內
                    if (runClass() === 'rogue' && Math.hypot(hx, hy) < 0.1) {
                        const t = rogueState().targets.find(x => x.isAlive);
                        if (t && distanceSq(t.pos, p.pos) > BOT_ROGUE_HUNT * BOT_ROGUE_HUNT) { hx = t.pos.x - p.pos.x; hy = t.pos.y - p.pos.y; }
                    }
                    // 只剩最後幾隻、而且沒有要閃的東西：走過去收尾。站在原地的話，停在射程外的遠程怪（血瞳 190）永遠打不到，這一波收不掉
                    if (gameState.straggling && Math.hypot(hx, hy) < 0.1) {
                        let nm = null, nd = Infinity;
                        for (const m of gameState.monsters) { if (!m.isAlive || m.stealthed) continue; const d = distanceSq(m.pos, p.pos); if (d < nd) { nd = d; nm = m; } }
                        if (nm && nd > BOT_FINISH_DIST * BOT_FINISH_DIST) { hx = nm.pos.x - p.pos.x; hy = nm.pos.y - p.pos.y; }
                    }
                    // 吸血鬼不去聖水（靈泉會燙）
                    const relic = Math.hypot(hx, hy) < 0.1 && gameState.relics.find(x => !x.done && noticed(x) && !(runClass() === 'vampire' && x.kind === 'spring'));
                    if (relic) { hx = relic.x - p.pos.x; hy = relic.y - p.pos.y; }
                    else if (Math.hypot(hx, hy) < 0.1) { let best = null, bd = 1e9; for (const o of gameState.orbs) { const d = distanceSq(o.pos, p.pos); if (d < bd) { bd = d; best = o; } } if (best && (bd < 250 * 250 || gameState.betweenWaves)) { hx = (best.pos.x - p.pos.x) * 0.01; hy = (best.pos.y - p.pos.y) * 0.01; } }
                    const mag = Math.hypot(hx, hy);
                    inputState.movementVector = mag > 0 ? { x: hx / mag * Math.min(1, mag), y: hy / mag * Math.min(1, mag) } : { x: 0, y: 0 };
                }
            } else {
                inputState.movementVector = { x: 0, y: 0 };
            }

            const h0 = p.currentHealth;
            updateGame(DT);
            B.t += DT;
            if (B.cur && p.currentHealth < h0) B.cur.dmg += (h0 - p.currentHealth) / p.maxHealth;
            // 最近 BURST_SECONDS 秒的血量：死的時候看是不是「半血以上幾秒內就歸零」（被秒殺，玩家來不及反應）
            const BURST_SECONDS = 3;
            (B.hpHist ||= []).push([B.t, p.currentHealth / p.maxHealth]);
            while (B.hpHist.length && B.hpHist[0][0] < B.t - BURST_SECONDS) B.hpHist.shift();
            if (B.cur && !gameState.betweenWaves) { B.cur.minHp = Math.min(B.cur.minHp, p.currentHealth / p.maxHealth); B.cur.peak = Math.max(B.cur.peak, gameState.monsters.length); }
            B.maxArmy = Math.max(B.maxArmy || 0, gameState.summons.length);
            // 一波打超過 STUCK_SECONDS 秒當成卡關：記下場上剩什麼、離法師多遠、在打誰
            if (B.cur && !gameState.betweenWaves && B.t - B.cur.start > STUCK_SECONDS) {
                // queue：還沒出場的怪（countRemainingMonsters 也算它們）；tgtD：牠跟牠的目標隔多遠；near：離牠最近的召喚物多遠、那隻在幹嘛
                B.stuck = {
                    wave: gameState.currentWave, summons: gameState.summons.length, level: gameState.heroLevel, heroHp: Math.round(p.currentHealth / p.maxHealth * 100), queue: gameState.spawnQueue.length, spawnTimer: gameState.spawnTimer, pendingBoss: !!gameState.pendingBoss, entrance: !!gameState.bossEntrance, straggling: gameState.straggling,
                    mons: gameState.monsters.filter(m => m.isAlive).slice(0, 10).map(m => {
                        const s = summonGrid.nearest(m.pos, 2000);
                        return {
                            type: m.config.type, hp: Math.round(m.currentHealth), maxHp: Math.round(m.maxHealth), d: Math.round(Math.hypot(m.pos.x - p.pos.x, m.pos.y - p.pos.y)), stealthed: !!m.stealthed, flying: !!m.flying,
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
    units: Object.fromEntries(Object.entries(gameState.units).filter(([, u]) => u.count || u.level).map(([t, u]) => [t, `${u.count}@L${u.level}`])),
    hero: Math.round(gameState.player.maxHealth),
    // 這一局主力是哪個流派（層數最多的；全軍通用與契約不算）
    build: Object.keys(SCHOOLS).map(s => [s, schoolPoints(s)]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none',
    burst: !gameState.player.isAlive && (window.__bot.hpHist || []).some(([, f]) => f >= 0.5),
    // 死前 3 秒：每種來源打掉幾成血、打了幾下、單下最多幾成
    lastHits: (() => {
        const B = window.__bot, BURST_SECONDS = 3, agg = {};
        for (const [t, k, f] of B.hits) if (t >= B.t - BURST_SECONDS) { const a = agg[k] ||= { f: 0, n: 0, max: 0 }; a.f += f; a.n++; a.max = Math.max(a.max, f); }
        return Object.fromEntries(Object.entries(agg).map(([k, a]) => [k, { f: +a.f.toFixed(2), n: a.n, max: +a.max.toFixed(2) }]));
    })(),
    // 整局主角被誰打掉最多血（佔最大生命的比例加總）
    hurt: Object.fromEntries(Object.entries(window.__bot.hits.reduce((o, [, k, f]) => (o[k] = (o[k] || 0) + f, o), {})).map(([k, f]) => [k, +f.toFixed(2)])),
    decimals: Object.keys(window.__bot.decimals).slice(0, 10),
}));
if (out.stuck) console.log('STUCK', JSON.stringify(out.stuck));
if (out.decimals.length) console.log('DECIMAL', JSON.stringify(out.decimals));
console.log(`RESULT ${TAG} policy=${POLICY} pick=${PICK} meta=${META} class=${CLASS} focus=${FOCUS || '-'} wave=${out.wave} t=${(out.t / 60).toFixed(1)}min won=${!!r.won} killedBy=${out.killedBy}`);
console.log('BUILD', out.build);
if (!r.won) console.log('BURST', out.burst, JSON.stringify(out.lastHits));
console.log('HURT', JSON.stringify(out.hurt));
console.log('SOULS', JSON.stringify(out.souls));
console.log('UNITS', JSON.stringify(out.units), 'heroMaxHp', out.hero);
console.log('RELICS', JSON.stringify(out.relics), 'blessings', Object.values(out.blessings).reduce((a, b) => a + b, 0));
console.log('ACHV', out.achv.length, out.achv.join(' '), 'maxArmy', out.maxArmy);
// 每種怪一局打倒幾隻：圖鑑成就的門檻照這個定
console.log('KILLS', JSON.stringify(out.kills));
console.log('RESONANCE', JSON.stringify(out.resonance), JSON.stringify(out.blessings));
console.log('wave\tdur\tminHp\tdmg\tpeakMon\tsummons\tlost\tevent');
for (const w of out.waves) console.log([w.wave, w.dur, w.minHp.toFixed(2), w.dmg.toFixed(2), w.peak, w.summons, w.lost.toFixed(2), w.ev || ''].join('\t'));
await browser.close();
