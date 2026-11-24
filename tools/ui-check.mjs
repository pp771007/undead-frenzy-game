// 介面檢查：用「實際玩家手機」的條件截出各個畫面，改了介面就跑一次看有沒有字撐破框。
// 用法：node tools/ui-check.mjs <遊戲網址> <輸出資料夾> [字體放大倍率] [寬] [高]
//
// 預設條件取自一支玩家手機在 LINE 內建瀏覽器裡的實機截圖（2026-11 回報）：
//   可用畫面約 408×673 CSS px（比一般測試用的 390×780 寬一點、矮很多），
//   系統「字型大小」讓字放大約 1.5～1.8 倍、框不變，而且那個瀏覽器不理會 text-size-adjust。
// 遊戲用 cancelTextZoom（game.js）把放大量回去；這裡模擬放大、再呼叫一次 cancelTextZoom 驗證它算得對。
// 環境變數 FIX=0 可以看「不補償」時的樣子（應該會跟那張實機截圖一樣：按鈕字變直排、數字超出框）。
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const URL = process.argv[2];
const OUT = process.argv[3];
const SCALE = Number(process.argv[4] || 1.8);
const W = Number(process.argv[5] || 408), H = Number(process.argv[6] || 673);
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
await page.evaluate(() => {
    meta.tutorialDone = true; resetGame(); enterPlaying(); tutorial = null;
    gameState.currentWave = 21; prepareNextWave(); gameState.banner = null;
    gameState.souls = 1e6;
    for (let i = 0; i < 9; i++) tryUpgrade('SkeletonWarrior');
    for (let i = 0; i < 25; i++) tryUpgrade('EyeMonster');
    for (let i = 0; i < 117; i++) trySummon('SkeletonWarrior');
    for (let i = 0; i < 209; i++) trySummon('EyeMonster');
    for (let i = 0; i < 5; i++) trySummon('Wraith');
    gameState.souls = 16100; updateUI();
});
await shot('2-playing');
await page.evaluate(() => { gameState.pendingDraft = { options: ['cleave', 'eagleEye', 'frenzyTime'] }; gameState.banishLeft = 1; openDraft(); });
await shot('3-draft');
await page.evaluate(() => { gameState.pendingDraft = { options: ['auraMight', 'giantBones', 'soulVolley', 'pact'] }; renderDraftCards(); });
await shot('4-draft-four');
await page.evaluate(() => { gameState.draftOpen = false; showScreen(uiElements.draftScreen, false); togglePause(); });
await shot('5-pause');
await page.evaluate(() => { togglePause(); gameState.gameOver = true; showGameOver('died'); });
await shot('6-gameover');
await page.evaluate(() => openMeta('gameover'));
await shot('7-meta');
await browser.close();
