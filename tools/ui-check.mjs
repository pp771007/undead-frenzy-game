// 介面檢查：用「實際玩家手機」的條件截出各個畫面，改了介面就跑一次看有沒有字撐破框。
// 用法：node tools/ui-check.mjs <遊戲網址> <輸出資料夾> [字體放大倍率] [寬] [高] [職業 id，預設 necro]
//
// 預設條件取自一支玩家手機在 LINE 內建瀏覽器裡的實機截圖（2026-11 回報）：
//   可用畫面 360×620 CSS px：寬度取版面的下限（index.html 的 MIN_LAYOUT_W，再窄的手機會被撐回 360），
//   高度取「瀏覽器網頁縮放 150%」那支手機換算到 360 寬時的高度 —— 比兩支實機回報（408×673、273×469）都窄也都矮，這裡過了它們就過，
//   系統「字型大小」讓字放大約 1.5～1.8 倍、框不變，而且那個瀏覽器不理會 text-size-adjust。
// 遊戲用 cancelTextZoom（game.js）把放大量回去；這裡模擬放大、再呼叫一次 cancelTextZoom 驗證它算得對。
// 環境變數 FIX=0 可以看「不補償」時的樣子（應該會跟那張實機截圖一樣：按鈕字變直排、數字超出框）。
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const URL = process.argv[2];
const OUT = process.argv[3];
const SCALE = Number(process.argv[4] || 1.8);
const W = Number(process.argv[5] || 360), H = Number(process.argv[6] || 620);
const CLASS = process.argv[7] || 'necro';
// 實機截圖量出來的每 CSS px 像素數
const DPR = 2.25;
if (!URL || !OUT) { console.error('usage: node tools/ui-check.mjs <url> <out-dir> [scale] [width] [height]'); process.exit(1); }
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('PAGEERROR', e.message));
// 模擬系統字型放大：樣式表裡每條 px 字級乘上倍率、框不動。桌面 Chromium 的放大設定在有 text-size-adjust 的頁面上不會作用，只能這樣模擬
await page.addInitScript(({ scale, fix }) => {
    document.addEventListener('DOMContentLoaded', () => {
        if (scale !== 1) {
            for (const sheet of document.styleSheets) {
                let rules; try { rules = sheet.cssRules; } catch (e) { continue; }
                for (const r of rules) { const m = r.style && /^([\d.]+)px$/.exec(r.style.fontSize); if (m) r.style.fontSize = `${parseFloat(m[1]) * scale}px`; }
            }
        }
        if (fix && typeof cancelTextZoom === 'function') window.__measuredZoom = cancelTextZoom();
    });
}, { scale: SCALE, fix: process.env.FIX !== '0' });
await page.goto(URL);
await page.waitForFunction(() => typeof appScreen !== 'undefined' && appScreen === 'title', null, { timeout: 30000 });
console.log('measured zoom:', await page.evaluate(() => window.__measuredZoom));

const shot = async (name) => { await page.waitForTimeout(600); await page.screenshot({ path: join(OUT, `${name}.png`) }); console.log(join(OUT, `${name}.png`)); };
await shot('1-title');
// 戰鬥中：數字盡量撐到最寬（三位數兵數、二位數等級、帶兩位數的血量）
await page.evaluate((cls) => {
    meta.tutorialDone = true;
    meta.classSel = cls;
    if (CLASSES[cls].unlock) meta.achv[CLASSES[cls].unlock] = true;
    resetGame(); enterPlaying(); tutorial = null;
    gameState.currentWave = 21; prepareNextWave(); gameState.banner = null;
    gameState.souls = 1e6;
    const [a, b, c] = CLASSES[cls].cards;
    for (let i = 0; i < 9; i++) tryUpgrade(a);
    for (let i = 0; i < 25; i++) tryUpgrade(c);
    for (let i = 0; i < 117; i++) trySummon(a);
    for (let i = 0; i < 209; i++) trySummon(c);
    for (let i = 0; i < 5; i++) trySummon(b);
    gameState.souls = 16100; updateUI();
}, CLASS);
await shot('2-playing');
// 抽卡：說明最長的那幾張（最容易撐破框）
const longest = (n) => page.evaluate(([cls, n]) => Object.keys(BLESSINGS).filter(id => !BLESSINGS[id].legendary && CLASSES[cls].schools.includes(BLESSINGS[id].school))
    .sort((x, y) => BLESSINGS[y].desc(BLESSINGS[y]).length - BLESSINGS[x].desc(BLESSINGS[x]).length).slice(0, n), [CLASS, n]);
const three = CLASS === 'necro' ? ['cleave', 'eagleEye', 'frenzyTime'] : await longest(3);
const four = CLASS === 'necro' ? ['auraMight', 'giantBones', 'soulVolley', 'pact'] : await longest(4);
await page.evaluate((opts) => { gameState.pendingDraft = { options: opts }; openDraft(); }, three);
await shot('3-draft');
await page.evaluate((opts) => { gameState.pendingDraft = { options: opts }; renderDraftCards(); }, four);
await shot('4-draft-four');
// 稀有祝福：兩段效果寫在同一張，說明最長，最容易撐破框
await page.evaluate((cls) => {
    const rares = Object.keys(BLESSINGS).filter(id => BLESSINGS[id].rare && CLASSES[cls].schools.includes(BLESSINGS[id].school))
        .sort((x, y) => BLESSINGS[y].desc(BLESSINGS[y]).length - BLESSINGS[x].desc(BLESSINGS[x]).length);
    gameState.pendingDraft = { options: rares.slice(0, 3) }; renderDraftCards();
}, CLASS);
await shot('4a-draft-rare');
// 傳說與暫停選單的祝福列表都要看得到：每個流派塞滿幾張
await page.evaluate((cls) => {
    for (const s of CLASSES[cls].schools) {
        const ids = Object.keys(BLESSINGS).filter(id => BLESSINGS[id].school === s && !BLESSINGS[id].legendary);
        for (let k = 0; k < 6; k++) { const id = ids[k % ids.length]; if (bl(id) < BLESSINGS[id].max) { gameState.pendingDraft = { options: [id] }; pickBlessing(id); } }
    }
    const leg = Object.keys(BLESSINGS).filter(id => BLESSINGS[id].legendary && CLASSES[cls].schools.includes(BLESSINGS[id].school));
    // 職業專屬的傳說排在共用（靈魂流派）的後面
    gameState.pendingDraft = { options: leg.slice(-3), boss: true }; renderDraftCards(); showScreen(uiElements.draftScreen, true); gameState.draftOpen = true;
}, CLASS);
await shot('4b-draft-legend');
// 雙流派傳說：標籤並排兩個流派頭像，最容易撐破卡片
await page.evaluate((cls) => {
    const duo = Object.keys(BLESSINGS).filter(id => BLESSINGS[id].duo && BLESSINGS[id].duo.every(s => CLASSES[cls].schools.includes(s)));
    gameState.pendingDraft = { options: duo.slice(0, 3), boss: true }; renderDraftCards();
}, CLASS);
await shot('4c-draft-duo');
await page.evaluate(() => { gameState.draftOpen = false; showScreen(uiElements.draftScreen, false); togglePause(); });
await shot('5-pause');
// 第 21 波陣亡會上榜：先跳恭喜，關掉後是排行榜，再點開自己那一筆
await page.evaluate(() => { togglePause(); gameState.gameOver = true; showGameOver('died'); });
await shot('6a-lb-congrats');
await page.evaluate(() => closeLbCongrats());
await shot('6b-leaderboard');
await page.evaluate(() => openLbDetail(lbMineId));
await shot('6c-lb-detail');
await page.evaluate(() => { showScreen(uiElements.lbDetail, false); closeLeaderboard(); });
await shot('6-gameover');
await page.evaluate(() => openMeta('gameover'));
await shot('7-meta');
await browser.close();
