// 精靈弓箭手 · 風行者（規劃見 docs/characters.md 第 7 節）
// 核心是「越動越強、停下就弱」：射程全職業最遠；移動中射速加快，朝身後（跟移動方向相反）射出的箭傷害加倍——回馬射。
// 最強的打法是一邊遠離怪群、一邊回頭射；停下來超過一下下，射速就掉回原本。跟武僧的禪定、亡靈法師的「站在大軍後面」相反。
// 典故：帕提亞騎射手的「回馬射」；英格蘭長弓手在阿金庫爾以箭雨壓制騎士衝鋒。
// 這個檔在 game.js 之後載入，用的是 game.js 的全域；game.js 的 init 等所有腳本載完才跑

const ELF = {
    baseHealth: 70,
    moveSpeed: 100,
    // 弓：射程內最近的怪；站著不動時每 interval 秒一箭，移動中射速 ×movingRate；停下來 keepMoving 秒內還算在移動
    bow: { range: 300, interval: 0.75, damage: 6, speed: 560, movingRate: 1.6, keepMoving: 0.6 },
    // 回馬射：箭的方向跟移動方向的夾角餘弦小於 backDot 就算朝後，傷害 ×backMult
    backDot: -0.3, backMult: 2,
    // 陷阱：移動中每走 trapEvery 單位在腳下放一個，最多同時 trapMax 個；爆炸、緩速、定身三種輪流
    trap: { every: 110, max: 5, radius: 40, trigger: 22, damage: 12, slow: 0.6, slowTime: 2, rootTime: 1.4, life: 20 },
    // 夥伴上限（靈狐、鷹輪流）
    companionCap: 4,
    // 大招「箭雨」：duration 秒內每 tick 秒對畫面上 perTick 隻怪降下一箭
    rain: { cooldown: 26, duration: 5, tick: 0.2, perTick: 8, damage: 10 },
};

OPTIONAL_ART.elf_archer = 'elf_archer.png';
OPTIONAL_ART.spirit_fox = 'spirit_fox.png';
OPTIONAL_ART.hawk = 'hawk.png';
OPTIONAL_ART.deer = 'deer.png';

// 箭術、陷阱：只修練，等級是精靈自己的能力；夥伴：召喚
CONFIG.archery = { type: 'Archery', upgradeBonus: 0.14, summonCost: 0, upgradeCostBase: 20, upgradeCostInc: 9 };
CONFIG.traps = { type: 'Traps', upgradeBonus: 0.3, summonCost: 0, upgradeCostBase: 24, upgradeCostInc: 10 };
const COMPANION_COMMON = {
    targetSearchRadius: 220, returnDistance: 50, avoidanceRadius: 14, avoidanceForce: 100, playerAvoidanceForce: 40,
    wanderRadius: 30, wanderSpeedFactor: 0.3, wanderIntervalMin: 2, wanderIntervalMax: 4,
};
// 上限只有 4 隻：每隻都要很強
CONFIG.companion = { ...COMPANION_COMMON, type: 'Companion', imageName: 'spirit_fox', color: '#FFCC80', radius: 12, imgScaleMultiplier: 3.6,
    baseHealth: 160, baseAttack: 16, attackRange: 26, attackSpeed: 1.2, moveSpeed: 140, upgradeBonus: 0.27,
    summonCost: 40, upgradeCostBase: 35, upgradeCostInc: 14 };
// 鷹：從高空俯衝，攻擊距離長、出手慢但很痛
CONFIG.hawk = { ...CONFIG.companion, imageName: 'hawk', color: '#A1887F', radius: 11, imgScaleMultiplier: 3.8,
    baseHealth: 110, baseAttack: 34, attackRange: 70, attackSpeed: 0.6, moveSpeed: 170, flying: true };

Object.assign(CONFIG.evolution.names, {
    Archery: ['獵弓手', '長弓手', '風之箭神'],
    Traps: ['陷阱師', '獵場主', '機關大師'],
    Companion: ['靈狐與鷹', '森林守護', '萬獸之友'],
});
Object.assign(CONFIG.evolution.perks, {
    Archery: ['每次多射一支', '箭穿透一隻', '25% 爆擊造成雙倍傷害'],
    Traps: ['陷阱範圍 +30%', '同時可放的陷阱 +3', '陷阱炸開後再補一個'],
    Companion: ['夥伴攻速 +25%', '夥伴受到的傷害 -30%', '夥伴每擊多打一次'],
});
const ARCHERY_TIER3_CRIT = 0.25;
const TRAPS_TIER1_RADIUS = 1.3, TRAPS_TIER2_MAX = 3;
const COMP_TIER1_RATE = 1.25, COMP_TIER2_TAKEN = 0.7;

// 獵人之網：網住幾秒、網比陷阱的爆炸範圍大多少、首領被拖慢多少
const NET_TIME = 2, NET_SCALE = 1.2, NET_BOSS_SLOW = 0.5;
// 狐火：傷害是靈狐攻擊的幾成、飛多快、找多遠的怪、爆炸範圍、飛多久沒碰到就散掉；場上最多幾團
// 雙流派：誘敵深入（每幾秒最多留一個、陷阱大小）、元素陷阱（火加傷、冰凍幾秒、雷跳幾隻）、鷹眼標記（倍率、幾秒）
const LURE_TRAP_EVERY = 0.8, LURE_TRAP_SCALE = 0.7, ELEM_TRAP_FIRE = 0.6, ELEM_TRAP_FREEZE = 1.5, ELEM_TRAP_CHAINS = 3, HAWK_MARK_MULT = 2, HAWK_MARK_TIME = 4;
const FOXFIRE_SHARE = 0.6, FOXFIRE_SPEED = 230, FOXFIRE_SEEK = 170, FOXFIRE_RADIUS = 32, FOXFIRE_LIFE = 1.4, FOXFIRE_MAX = 30;

// ---------- 五個流派：各 4 張祝福，3 層與 6 層各一段共鳴；每個流派一張傳說。圖示名稱 = 祝福 id（icons.js） ----------
Object.assign(SCHOOLS, {
    parthian: { name: '回馬射', icon: 'parthian', color: '#80CBC4', res: [{ name: '騎射', desc: '停下來 2 秒內還保有移動中的射速' }, { name: '帕提亞之箭', desc: '回頭射的箭穿透所有怪' }] },
    longbow: { name: '長弓', icon: 'longbow', color: '#A5D6A7', res: [{ name: '強弓', desc: '每支箭多穿透一隻' }, { name: '鷹眼', desc: '射得越遠傷害越高（最多 ×3）' }] },
    elemental: { name: '元素箭', icon: 'elemental', color: '#90CAF9', res: [{ name: '元素共振', desc: '燃燒、冰凍、雷擊的效果 ×1.5' }, { name: '三相', desc: '每支箭同時帶三種元素' }] },
    trapper: { name: '陷阱', icon: 'trapper', color: '#FFCC80', res: [{ name: '絆索', desc: '所有陷阱炸開時都會緩速' }, { name: '獵場', desc: '陷阱炸開後在原地留下一個小陷阱' }] },
    wildfriends: { name: '森林之友', img: 'spirit_fox.png', color: '#FFE082', res: [{ name: '靈狐之舞', desc: '夥伴每擊多打一次' }, { name: '萬獸之主', desc: '每 15 秒一群鹿從畫面一端踏過另一端' }] },
});
Object.assign(BLESSINGS, {
    backPower: { school: 'parthian', name: '回身一箭', max: 3, per: 0.4, desc: b => `回頭射的傷害再 +${pct(b.per)}` },
    moveRate: { school: 'parthian', name: '馬上連珠', max: 3, per: 0.2, desc: b => `移動中射速再 +${pct(b.per)}` },
    stride: { school: 'parthian', name: '輕盈', max: 3, per: 0.1, desc: b => `你的移速 +${pct(b.per)}` },
    backSlow: { school: 'parthian', name: '絆腳箭', max: 3, per: 0.25, desc: b => `回頭射中的怪緩速 ${pct(b.per)}` },
    bowRangeUp: { school: 'longbow', name: '長臂', max: 3, per: 0.15, desc: b => `射程 +${pct(b.per)}` },
    bowPowerUp: { school: 'longbow', name: '紫杉弓', max: 5, per: 0.3, desc: b => `箭的傷害 +${pct(b.per)}` },
    farShot: { school: 'longbow', name: '遠距', max: 3, per: 0.15, desc: b => `目標每遠 100，傷害 +${pct(b.per)}` },
    volley: { school: 'longbow', name: '齊射', max: 2, per: 1, desc: b => `每次多射 ${b.per} 支` },
    fireArrow: { school: 'elemental', name: '火箭', max: 3, per: 0.35, desc: b => `輪到火箭時，命中後燃燒（再 +${pct(b.per)} 傷害）` },
    iceArrow: { school: 'elemental', name: '冰箭', max: 3, per: 0.2, desc: b => `輪到冰箭時，命中的怪緩速 ${pct(0.3 + b.per)}` },
    thunderArrow: { school: 'elemental', name: '雷箭', max: 3, per: 1, desc: b => `輪到雷箭時，電流跳到附近 ${b.per} 隻` },
    elemSurge: { school: 'elemental', name: '元素親和', max: 3, per: 0.2, desc: b => `元素效果 +${pct(b.per)}` },
    trapCount: { school: 'trapper', name: '多備幾個', max: 3, per: 2, desc: b => `同時可放的陷阱 +${b.per}` },
    trapPower: { school: 'trapper', name: '火藥', max: 5, per: 0.35, desc: b => `陷阱傷害 +${pct(b.per)}` },
    trapRate: { school: 'trapper', name: '邊走邊放', max: 3, per: 0.2, desc: b => `放陷阱的間隔 -${pct(b.per)}` },
    trapLure: { school: 'trapper', name: '誘餌', max: 1, per: 1, desc: () => '陷阱會把身邊的怪引過來' },
    compCap: { school: 'wildfriends', name: '呼朋引伴', max: 2, per: 1, desc: b => `夥伴上限 +${b.per}` },
    compPower: { school: 'wildfriends', name: '野性', max: 5, per: 0.3, desc: b => `夥伴的血量與攻擊 +${pct(b.per)}` },
    compSync: { school: 'wildfriends', name: '同步', max: 3, per: 0.2, desc: b => `你移動時，夥伴攻速 +${pct(b.per)}` },
    compHeal: { school: 'wildfriends', name: '舔傷', max: 3, per: 0.01, desc: b => `夥伴每秒回 ${pct(b.per)} 血` },
    windBow: { school: 'parthian', name: '風神之弓', legendary: true, max: 1, per: 1, desc: () => '移動中射出的箭會追蹤目標' },
    moonArrow: { school: 'longbow', name: '月光箭', legendary: true, max: 1, per: 20, desc: b => `每 ${b.per} 秒一道月光貫穿怪最多的那個方向` },
    noReturn: { school: 'elemental', name: '不歸之箭', legendary: true, max: 1, per: 3, desc: b => `箭打倒怪時，彈向下一隻（最多 ${b.per} 次）` },
    // 獵人之網：陷阱從「炸一下」變成「定住一群」，邊退邊射時身後追來的那一串都被攔下
    hunterNet: { school: 'trapper', name: '獵人之網', legendary: true, max: 1, per: NET_TIME, desc: b => `陷阱炸開時張開一張網，網住的怪 ${b.per} 秒動不了（首領只會變慢）` },
    // 狐火：靈狐從「只打一隻」變成會往旁邊撒火，近戰夥伴也能清一群
    foxfire: { school: 'wildfriends', name: '狐火', legendary: true, max: 1, per: FOXFIRE_SHARE, desc: () => '靈狐每咬一口就點起一團狐火，飛去炸附近的怪' },
    // ---- 雙流派傳說（兩個流派都到 3 層才出現）----
    lureTrap: { school: DUO_SCHOOL, duo: ['parthian', 'trapper'], name: '誘敵深入', legendary: true, max: 1, per: LURE_TRAP_EVERY, desc: () => '回頭射中的怪腳下會留一個小陷阱' },
    elemTrap: { school: DUO_SCHOOL, duo: ['elemental', 'trapper'], name: '元素陷阱', legendary: true, max: 1, per: 1, desc: () => '陷阱炸開時帶著元素：火加傷、冰凍住、雷跳到旁邊' },
    hawkMark: { school: DUO_SCHOOL, duo: ['longbow', 'wildfriends'], name: '鷹眼標記', legendary: true, max: 1, per: HAWK_MARK_MULT, desc: b => `鷹抓過的怪 ${HAWK_MARK_TIME} 秒內挨你的箭傷害 ×${b.per}` },
});
const RES_HORSEBACK_KEEP = 2;
const RES_FARSIGHT_MAX = 3, RES_FARSIGHT_PER = 100;
const RES_RESONANCE_MULT = 1.5;
const RES_SNARE_SLOW = 0.5;
const RES_HUNTGROUND_SCALE = 0.6;
const RES_STAMPEDE_EVERY = 15, RES_STAMPEDE_WIDTH = 70, RES_STAMPEDE_SPEED = 420, RES_STAMPEDE_DAMAGE = 14;
const FIRE_BASE = 0.3, ICE_BASE = 0.3, ICE_TIME = 1.5, THUNDER_RADIUS = 90, THUNDER_SHARE = 0.5;
const LURE_RADIUS = 90, LURE_TIME = 1;
const MOONBEAM_WIDTH = 40, MOONBEAM_LENGTH = 900, MOONBEAM_DAMAGE = 30;
const ELF_ACHV = { backKills: 10000, movingWave: 10, rainKills: 100 };

Object.assign(UNIT_TYPES, {
    Archery: { cfg: () => CONFIG.archery, Cls: () => null, name: '箭術', img: iconDataUrl('longbow'), upgradeOnly: true, upgradeLabel: '修練' },
    Traps: { cfg: () => CONFIG.traps, Cls: () => null, name: '陷阱', img: iconDataUrl('trapper'), upgradeOnly: true, upgradeLabel: '修練' },
    Companion: {
        cfg: () => CONFIG.companion, Cls: () => Companion, name: '夥伴', img: 'spirit_fox.png',
        cap: () => ELF.companionCap + blessVal('compCap'),
    },
});

CLASSES.elf = {
    name: '精靈弓箭手', title: '風行者', portrait: 'elf_archer.png', tagline: '邊退邊回頭射，停下來就變弱',
    // 同一套怪物加強下沒強化照樣通關（見 game.js 的 monsterRamp）
    monsterPressure: 1.3,
    unlock: 'win',
    cards: ['Archery', 'Traps', 'Companion'], schools: ['parthian', 'longbow', 'elemental', 'trapper', 'wildfriends', 'soul'],
    metaUpgrades: {
        summonHp: META_SUMMON_HP,
        stride: { icon: 'stride', name: '風之步伐', max: 5, per: 0.04, costBase: 30, desc: m => `你的移速 +${pct(m.per)}`, total: (m, lv) => `+${pct(m.per * lv)}` },
        trapCount: { icon: 'trapCount', name: '陷阱行囊', max: 3, per: 1, costBase: 40, desc: m => `同時可放的陷阱 +${m.per}`, total: (m, lv) => `+${m.per * lv}` },
    },
    hero: { imageName: 'elf_archer', baseHealth: ELF.baseHealth, moveSpeed: ELF.moveSpeed },
    attack: (p, dt) => elfShoot(p, dt),
    update: (dt) => elfUpdate(dt),
    reset: () => { gameState.elf = newElfState(); },
    onWaveStart: () => { elfState().waveStill = false; },
    onWaveEnd: () => { const e = elfState(); if (gameState.currentWave >= ELF_ACHV.movingWave && !e.waveStill) gameState.run.flags.elfMoving = true; },
    onBossKill: (b) => { if (b.lastArrowHit && !inView(b.pos)) gameState.run.flags.elfSnipe = true; },
    heroSpeedMult: () => (1 + blessVal('stride') + classMeta('stride')) * (elfState().galeT > 0 ? GALE_MULT : 1),
    // 戰鼓祭壇變成「疾風」：一陣子移速、射速 ×1.5
    buffs: () => elfState().galeT > 0 ? [{ icon: 'parthian', t: elfState().galeT, color: '#B2EBF2' }] : [],
    onRelic: (r) => {
        if (r.kind !== 'altar') return false;
        const p = gameState.player;
        elfState().galeT = GALE_TIME;
        spawnFloatText(p.pos.x, p.pos.y - 34, '疾風！', '#B2EBF2', 18, 1.2, 'parthian');
        spawnParticles(p.pos.x, p.pos.y, '#B2EBF2', 24, 160, 0.6, 3);
        Sfx.play('nova');
        return true;
    },
    drawHero: (ctx, p) => drawElfHud(ctx, p),
    drawWorld: (ctx) => drawElfWorld(ctx),
    saveExtra: () => ({ kinds: gameState.summons.filter(s => s.isAlive && s instanceof Companion).map(s => s.kind) }),
    loadExtra: (data) => {
        const kinds = (data.kinds || []).slice();
        for (const s of gameState.summons) if (s instanceof Companion && kinds.length) { s.setKind(kinds.shift()); s.currentHealth = s.maxHealth; }
    },
    achv: {
        win: '風之子', speed: ['御風而行', '流星', '疾風迅雷'],
        feats: [
            ['backKills', '帕提亞之魂', `回頭射累計打倒 ${ELF_ACHV.backKills} 隻`, 80, () => (stats().elfBackKills || 0) >= ELF_ACHV.backKills],
            ['moving', '不曾停步', `第 ${ELF_ACHV.movingWave} 波以後，一整波都在移動、沒停下來過`, 40, () => !!gameState.run.flags.elfMoving],
            ['rain', '萬箭齊發', `一次箭雨打倒 ${ELF_ACHV.rainKills} 隻`, 50, () => gameState.run.novaBest >= ELF_ACHV.rainKills],
            ['snipe', '百步穿楊', '一箭打倒畫面外的首領', 50, () => !!gameState.run.flags.elfSnipe],
            ['lone', '獨行', '一隻夥伴都不召喚，通關', 100, () => gameState.endless && !gameState.totalSummons.Companion],
        ],
    },
    ultimate: {
        name: '箭雨', icon: 'arrowrain', hint: '箭雨：整個畫面降下箭雨',
        hintRadius: () => ELF.bow.range, cooldown: () => ELF.rain.cooldown, use: () => useArrowRain(),
    },
};
const GALE_TIME = 8, GALE_MULT = 1.5;

// movingT：還算「在移動」的剩餘秒數；trapDist：離上一個陷阱走了多遠；elem：元素箭輪到哪一個
function newElfState() {
    return { bowT: 0, movingT: 0, stillT: 0, waveStill: false, trapDist: 0, traps: [], trapKind: 0, elem: 0, rainT: 0, rainTick: 0, rainKills: 0,
        moonT: 0, beams: [], stampedeT: RES_STAMPEDE_EVERY, deer: [], galeT: 0, lastX: null, lastY: null, mx: 1, my: 0, nets: [], foxfires: [], lureCd: 0 };
}
function elfState() { return gameState.elf || (gameState.elf = newElfState()); }

// ---------- 每格：移動狀態、陷阱、箭雨、月光、鹿群 ----------
function elfUpdate(dt) {
    const e = elfState(), p = gameState.player;
    if (!p) return;
    const mv = getMoveVector(), moving = Math.hypot(mv.x, mv.y) > 0.1;
    if (moving) {
        const m = Math.hypot(mv.x, mv.y);
        e.mx = mv.x / m; e.my = mv.y / m;
        e.movingT = ELF.bow.keepMoving + (res('parthian') >= 1 ? RES_HORSEBACK_KEEP : 0);
        e.stillT = 0;
    } else {
        e.movingT = Math.max(0, e.movingT - dt);
        e.stillT += dt;
        if (e.stillT > ELF.bow.keepMoving && !gameState.betweenWaves) e.waveStill = true;
    }
    e.galeT = Math.max(0, e.galeT - dt);
    e.lureCd = Math.max(0, e.lureCd - dt);
    // 陷阱：邊走邊放
    if (e.lastX !== null && moving) e.trapDist += Math.hypot(p.pos.x - e.lastX, p.pos.y - e.lastY);
    e.lastX = p.pos.x; e.lastY = p.pos.y;
    const lv = gameState.units.Traps.level;
    if ((lv > 0 || bl('trapPower')) && e.trapDist >= ELF.trap.every * (1 - blessVal('trapRate'))) {
        e.trapDist = 0;
        placeTrap(p.pos.x, p.pos.y, 1);
    }
    updateTraps(dt);
    // 大招箭雨
    if (e.rainT > 0) {
        e.rainT -= dt; e.rainTick -= dt;
        if (e.rainTick <= 0) { e.rainTick = ELF.rain.tick; rainVolley(); }
        // 沒有打到怪的箭也照樣落滿整個畫面：「箭雨」要看起來像一場雨，不是只有打中的那幾支
        e.rainFx = (e.rainFx || 0) + dt * RAIN_AMBIENT_PER_SEC;
        while (e.rainFx >= 1) {
            e.rainFx--;
            if (gameState.visualEffects.length >= ambientEffectCap()) break;
            gameState.visualEffects.push(new FallingArrowEffect({ x: camera.x + Math.random() * view.w, y: camera.y + Math.random() * view.h }));
        }
        if (e.rainT <= 0) { gameState.run.novaBest = Math.max(gameState.run.novaBest, e.rainKills); }
    }
    // 月光箭
    if (bl('moonArrow') && !gameState.betweenWaves) {
        e.moonT -= dt;
        if (e.moonT <= 0) { e.moonT = BLESSINGS.moonArrow.per; moonBeam(p); }
    }
    for (let i = e.beams.length - 1; i >= 0; i--) { e.beams[i].life -= dt; if (e.beams[i].life <= 0) e.beams.splice(i, 1); }
    // 萬獸之主：鹿群
    if (res('wildfriends') >= 2 && !gameState.betweenWaves) {
        e.stampedeT -= dt;
        if (e.stampedeT <= 0) { e.stampedeT = RES_STAMPEDE_EVERY; startStampede(p); }
    }
    updateStampede(dt);
    for (let i = e.nets.length - 1; i >= 0; i--) { e.nets[i].life -= dt; if (e.nets[i].life <= 0) e.nets.splice(i, 1); }
    if (e.foxfires.length) updateFoxfires(dt);
    // 夥伴回血
    if (bl('compHeal')) for (const s of gameState.summons) if (s.isAlive && s instanceof Companion) s.currentHealth = Math.min(s.maxHealth, s.currentHealth + s.maxHealth * blessVal('compHeal') * dt);
}
function elfMoving() { return elfState().movingT > 0; }

// ---------- 弓 ----------
function bowRange() { return ELF.bow.range * (1 + blessVal('bowRangeUp')); }
function arrowDamage() {
    return ELF.bow.damage * getWaveStatMultiplier(Math.max(1, gameState.currentWave))
        * (1 + gameState.units.Archery.level * CONFIG.archery.upgradeBonus) * (1 + blessVal('bowPowerUp'));
}
const elfTargets = [];
function elfShoot(p, dt) {
    const e = elfState();
    const rate = (elfMoving() ? ELF.bow.movingRate + blessVal('moveRate') : 1) * (e.galeT > 0 ? GALE_MULT : 1);
    e.bowT -= dt * rate;
    if (e.bowT > 0) return;
    const range = bowRange(), rSq = range * range;
    elfTargets.length = 0;
    monsterGrid.forEachInRadius(p.pos, range, m => { if (m.isAlive && !m.stealthed) { const d = distanceSq(m.pos, p.pos); if (d <= rSq) elfTargets.push({ m, d }); } });
    if (!elfTargets.length) return;
    elfTargets.sort((a, b) => a.d - b.d);
    e.bowT = ELF.bow.interval;
    const tier = getTier(gameState.units.Archery.level);
    const n = 1 + (tier >= 1 ? 1 : 0) + bl('volley');
    const dmg = arrowDamage();
    for (let i = 0; i < n; i++) {
        const t = elfTargets[Math.min(i, elfTargets.length - 1)].m;
        fireArrow(p.pos.x, p.pos.y - 8, t, dmg, nextElement());
    }
    Sfx.play('mageBolt');
}
// 元素箭輪流：有哪幾種就輪哪幾種；共鳴「三相」一支全帶
function nextElement() {
    const owned = ['fire', 'ice', 'thunder'].filter(k => bl(k + 'Arrow'));
    if (!owned.length) return null;
    if (res('elemental') >= 2) return 'all';
    const e = elfState();
    e.elem = (e.elem + 1) % owned.length;
    return owned[e.elem];
}
function fireArrow(x, y, target, dmg, elem) {
    const p = gameState.player, e = elfState();
    const dx = target.pos.x - x, dy = target.pos.y - y, d = Math.hypot(dx, dy) || 1;
    const dir = { x: dx / d, y: dy / d };
    // 朝身後射（跟移動方向相反）＝回馬射
    const back = elfMoving() && (dir.x * e.mx + dir.y * e.my) < ELF.backDot;
    const tier = getTier(gameState.units.Archery.level);
    const pierce = (tier >= 2 ? 1 : 0) + (res('longbow') >= 1 ? 1 : 0) + (back && res('parthian') >= 2 ? 999 : 0);
    gameState.visualEffects.push(new Arrow(x, y, dir, target, dmg * (back ? ELF.backMult + blessVal('backPower') : 1), pierce, back, elem, bl('windBow') && elfMoving(), bl('noReturn') ? BLESSINGS.noReturn.per : 0));
}

// 箭：直線飛、碰到怪就打（可以穿透）；不用 Projectile 是因為要穿透、要記「是不是回頭射」
const ARROW_HIT_R = 12, ARROW_LIFE = 0.9, ARROW_TURN = 7;
const ELF_SHIELD_BLOCK = 0.5;
class Arrow extends TimedEffect {
    constructor(x, y, dir, target, dmg, pierce, back, elem, homing, chains) {
        super({ x, y }, ARROW_LIFE);
        this.dir = dir; this.target = target; this.dmg = dmg; this.pierce = pierce; this.back = back; this.elem = elem; this.homing = homing; this.chains = chains;
        this.hit = new Set();
        this.from = { x, y };
    }
    update(dt) {
        super.update(dt);
        if (!this.isAlive) return;
        if (this.homing && this.target && this.target.isAlive) {
            const want = Math.atan2(this.target.pos.y - this.pos.y, this.target.pos.x - this.pos.x), cur = Math.atan2(this.dir.y, this.dir.x);
            let df = want - cur;
            while (df > Math.PI) df -= Math.PI * 2;
            while (df < -Math.PI) df += Math.PI * 2;
            const a = cur + Math.sign(df) * Math.min(Math.abs(df), ARROW_TURN * dt);
            this.dir = { x: Math.cos(a), y: Math.sin(a) };
        }
        const step = ELF.bow.speed * dt;
        this.pos.x += this.dir.x * step; this.pos.y += this.dir.y * step;
        const rSq = ARROW_HIT_R * ARROW_HIT_R;
        monsterGrid.forEachInRadius(this.pos, ARROW_HIT_R + 16, m => {
            if (!this.isAlive || !m.isAlive || this.hit.has(m) || distanceSq(m.pos, this.pos) > rSq + m.radius * m.radius) return;
            this.hit.add(m);
            this.strike(m);
            if (this.pierce-- <= 0) this.isAlive = false;
        });
    }
    strike(m) {
        let dmg = this.dmg;
        // 鷹眼：射得越遠越痛；遠距：每遠 100 加一截
        const dist = Math.hypot(m.pos.x - this.from.x, m.pos.y - this.from.y);
        dmg *= 1 + blessVal('farShot') * dist / 100;
        if (res('longbow') >= 2) dmg *= Math.min(RES_FARSIGHT_MAX, 1 + dist / RES_FARSIGHT_PER / 2);
        if (getTier(gameState.units.Archery.level) >= 3 && Math.random() < ARCHERY_TIER3_CRIT) dmg *= 2;
        if (m.hawkMarkUntil > worldTime) dmg *= HAWK_MARK_MULT;
        const surge = (1 + blessVal('elemSurge')) * (res('elemental') >= 1 ? RES_RESONANCE_MULT : 1);
        const el = this.elem;
        if (el === 'fire' || el === 'all') dmg *= 1 + (FIRE_BASE + blessVal('fireArrow')) * surge;
        // 骨盾衛兵：箭也算飛彈，但精靈的箭只被擋一半（其他飛彈全擋）。精靈的火力幾乎全在箭上，全擋的話碰到盾陣只剩陷阱和夥伴；
        // 原本箭完全不吃盾牌，跟「盾牌擋飛彈」矛盾，盾衛對精靈也等於不存在
        const block = projectileBlockAt(m) * ELF_SHIELD_BLOCK;
        if (block > 0) { dmg *= 1 - block; spawnParticles(m.pos.x, m.pos.y, '#CFD8DC', 3, 50, 0.2, 2); }
        m.takeDamage(dmg);
        m.lastArrowHit = true;
        if (this.back) {
            if (!m.isAlive) stats().elfBackKills = (stats().elfBackKills || 0) + 1;
            if (bl('backSlow') && m.isAlive) m.applySlow(blessVal('backSlow'), 1);
            // 雙流派「誘敵深入」：追著你的那隻腳下留一個小陷阱
            const e = elfState();
            if (bl('lureTrap') && e.lureCd <= 0) { e.lureCd = LURE_TRAP_EVERY; placeTrap(m.pos.x, m.pos.y, LURE_TRAP_SCALE); spawnParticles(m.pos.x, m.pos.y, '#FFCC80', 5, 40, 0.3, 2); }
        }
        if ((el === 'ice' || el === 'all') && m.isAlive) m.applySlow(Math.min(0.9, (ICE_BASE + blessVal('iceArrow')) * surge), ICE_TIME);
        if (el === 'thunder' || el === 'all') {
            let left = Math.max(1, bl('thunderArrow'));
            const rSq = THUNDER_RADIUS * THUNDER_RADIUS;
            monsterGrid.forEachInRadius(m.pos, THUNDER_RADIUS, o => {
                if (left <= 0 || o === m || !o.isAlive || distanceSq(o.pos, m.pos) > rSq) return;
                o.takeDamage(dmg * THUNDER_SHARE * surge); left--;
                gameState.visualEffects.push(new ZapEffect(m.pos, o.pos));
            });
        }
        if (el) spawnParticles(m.pos.x, m.pos.y, ELEM_COLORS[el], 4, 50, 0.3, 2);
        // 不歸之箭：打倒就彈向下一隻
        if (!m.isAlive && this.chains > 0) {
            const next = monsterGrid.nearestShared(m.pos, ELF.bow.range * 0.5);
            if (next && next.isAlive && !this.hit.has(next)) {
                this.chains--;
                const dx = next.pos.x - this.pos.x, dy = next.pos.y - this.pos.y, d = Math.hypot(dx, dy) || 1;
                this.dir = { x: dx / d, y: dy / d }; this.target = next; this.pierce++; this.life = ARROW_LIFE;
            }
        }
    }
    draw(ctx) {
        if (!inView(this.pos)) return;
        // 元素箭身上帶那個元素的光；背射（加倍）的箭換成青色箭桿＋青光
        const glow = this.elem ? ELEM_COLORS[this.elem] : this.back ? ARROW_BACK_GLOW : null;
        if (glow) {
            const g = ARROW_GLOW_SIZE;
            ctx.globalAlpha = 0.7;
            ctx.drawImage(getGlowSprite(glow), this.pos.x - g / 2, this.pos.y - g / 2, g, g);
            ctx.globalAlpha = 1;
        }
        drawShaped(this.back ? 'arrowBack' : 'arrow', this.pos.x - this.dir.x * 6, this.pos.y - this.dir.y * 6, Math.atan2(this.dir.y, this.dir.x), 0);
    }
}
const ELEM_COLORS = { fire: '#FF7043', ice: '#81D4FA', thunder: '#FFF176', all: '#E1BEE7' };
const ARROW_BACK_GLOW = '#80CBC4', ARROW_GLOW_SIZE = 26;
const FALLING_ARROW_ANGLE = Math.PI * 0.42;   // 箭雨的箭朝右下方插
// 箭：細長木桿、葉形箭頭、綠色羽毛；永遠朝飛行方向
function drawArrowShape(g, shaft, feather) {
    g.lineWidth = 1.4; g.strokeStyle = SHAPE_OUTLINE;
    g.fillStyle = feather;
    g.beginPath(); g.moveTo(-13, -0.6); g.lineTo(-7.5, -0.6); g.lineTo(-10, -3.4); g.lineTo(-14, -3.4); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-13, 0.6); g.lineTo(-7.5, 0.6); g.lineTo(-10, 3.4); g.lineTo(-14, 3.4); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = shaft;
    g.beginPath(); g.rect(-13, -0.9, 21, 1.8); g.fill(); g.stroke();
    g.fillStyle = '#ECEFF1';
    g.beginPath(); g.moveTo(7.5, 0); g.quadraticCurveTo(10, -2.8, 13.5, 0); g.quadraticCurveTo(10, 2.8, 7.5, 0); g.closePath(); g.fill(); g.stroke();
}
SHAPE_SPRITES.arrow = { len: 28, wid: 8, spin: 0, streak: 10, draw: g => drawArrowShape(g, '#A1887F', '#66BB6A') };
SHAPE_SPRITES.arrowBack = { len: 28, wid: 8, spin: 0, streak: 16, streakColor: ARROW_BACK_GLOW, draw: g => drawArrowShape(g, '#4DB6AC', '#B2DFDB') };
class ZapEffect extends TimedEffect {
    constructor(a, b) { super(a, 0.15); this.b = { ...b.pos ? b.pos : b }; }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life / this.duration;
        ctx.strokeStyle = '#FFF176'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(this.pos.x, this.pos.y);
        const mx = (this.pos.x + this.b.x) / 2 + randomInRange(-8, 8), my = (this.pos.y + this.b.y) / 2 + randomInRange(-8, 8);
        ctx.lineTo(mx, my); ctx.lineTo(this.b.x, this.b.y); ctx.stroke();
        ctx.restore();
    }
}

// ---------- 陷阱 ----------
const TRAP_KINDS = ['blast', 'slow', 'root'];
function trapMax() { return ELF.trap.max + blessVal('trapCount') + classMeta('trapCount') + (getTier(gameState.units.Traps.level) >= 2 ? TRAPS_TIER2_MAX : 0); }
function placeTrap(x, y, scale) {
    const e = elfState();
    if (e.traps.length >= trapMax()) e.traps.shift();
    const kind = TRAP_KINDS[e.trapKind++ % TRAP_KINDS.length];
    e.traps.push({ x, y, kind, scale, life: ELF.trap.life, lureT: 0 });
}
function updateTraps(dt) {
    const e = elfState(), T = ELF.trap;
    const tier = getTier(gameState.units.Traps.level);
    for (let i = e.traps.length - 1; i >= 0; i--) {
        const t = e.traps[i];
        t.life -= dt;
        if (t.life <= 0) { e.traps.splice(i, 1); continue; }
        // 誘餌：剛放下時把身邊的怪引過來
        if (bl('trapLure') && t.lureT <= 0) {
            t.lureT = 99;
            groundMonsterGrid.forEachInRadius(t, LURE_RADIUS, m => { if (m.isAlive && !(m instanceof BossMonster)) { m.tauntBy = { isAlive: true, pos: { x: t.x, y: t.y }, takeDamage() {} }; m.tauntT = LURE_TIME; } });
        }
        if (!groundMonsterGrid.anyWithin(t, T.trigger * t.scale)) continue;
        e.traps.splice(i, 1);
        const r = T.radius * t.scale * (tier >= 1 ? TRAPS_TIER1_RADIUS : 1), rSq = r * r;
        const dmg = T.damage * getWaveStatMultiplier(Math.max(1, gameState.currentWave)) * (1 + gameState.units.Traps.level * CONFIG.traps.upgradeBonus) * (1 + blessVal('trapPower')) * t.scale;
        groundMonsterGrid.forEachInRadius(t, r, m => {
            if (!m.isAlive || distanceSq(m.pos, t) > rSq) return;
            m.takeDamage(t.kind === 'blast' ? dmg * 1.6 : dmg * 0.6);
            if (!m.isAlive || m instanceof BossMonster) return;
            if (t.kind === 'slow' || res('trapper') >= 1) m.applySlow(t.kind === 'slow' ? T.slow : RES_SNARE_SLOW, T.slowTime);
            if (t.kind === 'root') m.applySlow(0.95, T.rootTime);
        });
        gameState.visualEffects.push(new TrapBurstEffect(t, r, t.kind));
        if (bl('hunterNet')) castNet(t, r * NET_SCALE);
        if (bl('elemTrap')) elementalTrap(t, r, dmg);
        // 獵場、三階：炸開後原地再補一個小的
        if ((res('trapper') >= 2 || tier >= 3) && t.scale >= 1) e.traps.push({ x: t.x, y: t.y, kind: TRAP_KINDS[e.trapKind++ % 3], scale: RES_HUNTGROUND_SCALE, life: T.life, lureT: 99 });
    }
}
// 陷阱的顏色：爆炸金橘、冰霜淺藍、荊棘綠（我方的東西不用紅，見專案 CLAUDE.md）
const TRAP_COLORS = { blast: '#FFB300', slow: '#4FC3F7', root: '#9CCC65' };
// 陷阱長得像陷阱：爆炸是一顆帶尖刺的鐵地雷、中間一圈金色符文；冰霜是地上一個六角冰晶符印；荊棘是一圈帶刺的藤蔓套索。
// 平常微微發光、一亮一暗（看得出「埋好了、還沒觸發」）；每種事先畫好一張，直接貼
const TRAP_PX = 3, TRAP_SIZE = 26;
const trapSprites = {};
const TRAP_DRAW = {
    blast(g) {
        g.fillStyle = '#455A64'; g.strokeStyle = SHAPE_OUTLINE; g.lineWidth = 1.6;
        for (let i = 0; i < 8; i++) {
            const a = i * Math.PI / 4;
            g.beginPath(); g.moveTo(Math.cos(a - 0.22) * 7, Math.sin(a - 0.22) * 7); g.lineTo(Math.cos(a) * 11, Math.sin(a) * 11); g.lineTo(Math.cos(a + 0.22) * 7, Math.sin(a + 0.22) * 7); g.closePath(); g.fill(); g.stroke();
        }
        g.fillStyle = '#546E7A';
        g.beginPath(); g.arc(0, 0, 7.5, 0, Math.PI * 2); g.fill(); g.stroke();
        g.strokeStyle = '#FFB300'; g.lineWidth = 1.4;
        g.beginPath(); g.arc(0, 0, 4.2, 0, Math.PI * 2); g.stroke();
        g.fillStyle = '#FFE082';
        g.beginPath(); g.arc(0, 0, 1.8, 0, Math.PI * 2); g.fill();
    },
    slow(g) {
        g.strokeStyle = SHAPE_OUTLINE; g.lineWidth = 3.2;
        const hex = () => { g.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; if (i) g.lineTo(Math.cos(a) * 9, Math.sin(a) * 9); else g.moveTo(Math.cos(a) * 9, Math.sin(a) * 9); } g.closePath(); };
        hex(); g.stroke();
        g.strokeStyle = '#81D4FA'; g.lineWidth = 1.6; hex(); g.stroke();
        for (let i = 0; i < 3; i++) {
            const a = i * Math.PI / 3;
            g.strokeStyle = SHAPE_OUTLINE; g.lineWidth = 3;
            g.beginPath(); g.moveTo(Math.cos(a) * -7, Math.sin(a) * -7); g.lineTo(Math.cos(a) * 7, Math.sin(a) * 7); g.stroke();
            g.strokeStyle = '#E1F5FE'; g.lineWidth = 1.4;
            g.beginPath(); g.moveTo(Math.cos(a) * -7, Math.sin(a) * -7); g.lineTo(Math.cos(a) * 7, Math.sin(a) * 7); g.stroke();
        }
    },
    root(g) {
        g.strokeStyle = SHAPE_OUTLINE; g.lineWidth = 4;
        g.beginPath(); g.arc(0, 0, 8, 0, Math.PI * 2); g.stroke();
        g.strokeStyle = '#7CB342'; g.lineWidth = 2.4;
        g.beginPath(); g.arc(0, 0, 8, 0, Math.PI * 2); g.stroke();
        g.fillStyle = '#C5E1A5'; g.strokeStyle = SHAPE_OUTLINE; g.lineWidth = 1.2;
        for (let i = 0; i < 7; i++) {
            const a = i * Math.PI * 2 / 7;
            g.beginPath(); g.moveTo(Math.cos(a - 0.2) * 8, Math.sin(a - 0.2) * 8); g.lineTo(Math.cos(a) * 3.5, Math.sin(a) * 3.5); g.lineTo(Math.cos(a + 0.2) * 8, Math.sin(a + 0.2) * 8); g.closePath(); g.fill(); g.stroke();
        }
    },
};
function trapSprite(kind) {
    if (trapSprites[kind]) return trapSprites[kind];
    const c = document.createElement('canvas');
    c.width = c.height = TRAP_SIZE * TRAP_PX;
    const g = c.getContext('2d');
    g.translate(c.width / 2, c.height / 2); g.scale(TRAP_PX, TRAP_PX);
    g.lineJoin = 'round'; g.lineCap = 'round';
    TRAP_DRAW[kind](g);
    return (trapSprites[kind] = c);
}
// 觸發：爆炸是金橘火球＋碎片、冰霜是一圈冰晶往外炸、荊棘是藤蔓從地面竄出來纏住
class TrapBurstEffect extends TimedEffect {
    constructor(pos, r, kind) {
        super(pos, 0.45); this.r = r; this.kind = kind;
        const col = TRAP_COLORS[kind];
        if (kind === 'blast') { spawnParticles(pos.x, pos.y, col, 18, 160, 0.5, 3); spawnParticles(pos.x, pos.y, '#90A4AE', 8, 110, 0.6, 3); addShake(3); }
        else if (kind === 'slow') spawnParticles(pos.x, pos.y, '#E1F5FE', 14, 120, 0.5, 3);
        else spawnParticles(pos.x, pos.y, col, 10, 70, 0.5, 3);
    }
    draw(ctx) {
        const k = 1 - this.life / this.duration, col = TRAP_COLORS[this.kind], x = this.pos.x, y = this.pos.y;
        ctx.save();
        if (this.kind === 'blast') {
            const g = this.r * 2.4 * (0.4 + 0.6 * k);
            ctx.globalAlpha = (1 - k) * 0.9;
            ctx.drawImage(getGlowSprite(col), x - g / 2, y - g / 2, g, g);
            ctx.strokeStyle = '#FFE082'; ctx.lineWidth = 6 * (1 - k) + 1;
            ctx.beginPath(); ctx.arc(x, y, this.r * (0.3 + 0.8 * k), 0, Math.PI * 2); ctx.stroke();
        } else if (this.kind === 'slow') {
            ctx.globalAlpha = 1 - k;
            ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.fillStyle = '#E1F5FE';
            for (let i = 0; i < 8; i++) {
                const a = i * Math.PI / 4, rr = this.r * (0.3 + 0.7 * k);
                const cx = x + Math.cos(a) * rr, cy = y + Math.sin(a) * rr;
                ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6); ctx.lineTo(cx + Math.cos(a + 1.7) * 3, cy + Math.sin(a + 1.7) * 3); ctx.lineTo(cx - Math.cos(a) * 4, cy - Math.sin(a) * 4); ctx.lineTo(cx + Math.cos(a - 1.7) * 3, cy + Math.sin(a - 1.7) * 3); ctx.closePath(); ctx.fill(); ctx.stroke();
            }
            ctx.globalAlpha = (1 - k) * 0.35; ctx.fillStyle = col;
            ctx.beginPath(); ctx.arc(x, y, this.r * (0.5 + 0.5 * k), 0, Math.PI * 2); ctx.fill();
        } else {
            // 藤蔓從中心往外竄、再縮回去（同德魯伊種子落地）
            const grow = Math.min(1, k * 2.5);
            ctx.globalAlpha = k < 0.7 ? 1 : (1 - k) / 0.3;
            ctx.strokeStyle = '#558B2F'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
            for (let i = 0; i < 7; i++) {
                const a = i / 7 * Math.PI * 2, rr = this.r * grow;
                ctx.beginPath(); ctx.moveTo(x, y);
                ctx.quadraticCurveTo(x + Math.cos(a + 0.7) * rr * 0.6, y + Math.sin(a + 0.7) * rr * 0.6 - 8, x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.6);
                ctx.stroke();
            }
            ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke();
        }
        ctx.restore();
    }
}

// ---------- 雙流派「元素陷阱」：陷阱炸開時輪流帶火、冰、雷 ----------
const ELEM_TRAP_ORDER = ['fire', 'ice', 'thunder'], ELEM_TRAP_CHAIN_RANGE = 120;
function elementalTrap(c, r, dmg) {
    const e = elfState(), el = ELEM_TRAP_ORDER[(e.elemTrapIdx = ((e.elemTrapIdx || 0) + 1) % ELEM_TRAP_ORDER.length)];
    const rSq = r * r, inside = [];
    groundMonsterGrid.forEachInRadius(c, r, m => { if (m.isAlive && distanceSq(m.pos, c) <= rSq) inside.push(m); });
    if (el === 'fire') for (const m of inside) m.takeDamage(dmg * ELEM_TRAP_FIRE);
    if (el === 'ice') for (const m of inside) if (!(m instanceof BossMonster)) m.applySlow(0.95, ELEM_TRAP_FREEZE);
    if (el === 'thunder') {
        const near = [], cr = ELEM_TRAP_CHAIN_RANGE;
        monsterGrid.forEachInRadius(c, cr, m => { if (m.isAlive && distanceSq(m.pos, c) <= cr * cr) near.push(m); });
        near.sort((a, b) => distanceSq(a.pos, c) - distanceSq(b.pos, c));
        for (const m of near.slice(0, ELEM_TRAP_CHAINS)) { m.takeDamage(dmg); gameState.visualEffects.push(new ZapEffect(c, m.pos)); }
    }
    addWorldFx({ kind: 'ring', x: c.x, y: c.y, r0: r * 0.3, r1: r * 1.1, life: 0.4, color: ELEM_COLORS[el], width: 6 });
    spawnParticles(c.x, c.y, ELEM_COLORS[el], 12, 100, 0.45, 3);
}
// 雙流派「鷹眼標記」：被鷹抓過的怪頭上一根金色的鷹羽
function drawHawkMarks(ctx) {
    if (!bl('hawkMark')) return;
    for (const m of gameState.monsters) {
        if (!m.isAlive || !(m.hawkMarkUntil > worldTime) || !inView(m.pos)) continue;
        const x = m.pos.x, y = m.pos.y - m.imageHeight * 0.5 - 12, left = m.hawkMarkUntil - worldTime;
        ctx.save();
        ctx.globalAlpha = Math.min(1, left / 0.5);
        ctx.translate(x, y); ctx.rotate(-0.5 + Math.sin(worldTime * 3 + x) * 0.1);
        ctx.beginPath(); ctx.moveTo(0, 9); ctx.quadraticCurveTo(-6, 0, 0, -9); ctx.quadraticCurveTo(6, 0, 0, 9); ctx.closePath();
        ctx.fillStyle = '#FFD54F'; ctx.fill(); ctx.strokeStyle = SHAPE_OUTLINE; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.strokeStyle = '#8D6E63'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(0, 11); ctx.lineTo(0, -7); ctx.moveTo(0, -2); ctx.lineTo(-3, -5); ctx.moveTo(0, 2); ctx.lineTo(3, -1); ctx.stroke();
        ctx.restore();
    }
}

// ---------- 傳說「獵人之網」：陷阱炸開時撒出一張網 ----------
function castNet(c, r) {
    const rSq = r * r;
    groundMonsterGrid.forEachInRadius(c, r, m => {
        if (!m.isAlive || distanceSq(m.pos, c) > rSq) return;
        m.applySlow(m instanceof BossMonster ? NET_BOSS_SLOW : 1, NET_TIME);
    });
    elfState().nets.push({ x: c.x, y: c.y, r, life: NET_TIME, spin: Math.random() * Math.PI });
}
// 網：菱形網眼的繩網（兩組斜繩，裁在一圈粗的邊繩裡）、邊繩上綁著鉛墜，先往外張開、最後淡掉。
// 不要畫成「放射線＋同心圓」：那是蜘蛛網的樣子
const NET_ROPE = '#D7CCC8', NET_RIM = '#A1887F', NET_WEIGHT = '#546E7A', NET_MESH = 14, NET_WEIGHTS = 8, NET_OPEN = 0.18, NET_FADE = 0.35, NET_FLAT = 0.8;
function drawNet(ctx, n) {
    const age = NET_TIME - n.life, open = Math.min(1, age / NET_OPEN), r = n.r * (0.35 + 0.65 * open), ry = r * NET_FLAT;
    ctx.save();
    ctx.globalAlpha = Math.min(1, n.life / NET_FADE);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.save();
    ctx.beginPath(); ctx.ellipse(n.x, n.y, r, ry, 0, 0, Math.PI * 2); ctx.clip();
    ctx.translate(n.x, n.y); ctx.rotate(n.spin);
    for (const [col, lw] of [[SHAPE_OUTLINE, 3], [NET_ROPE, 1.4]]) {
        ctx.strokeStyle = col; ctx.lineWidth = lw;
        ctx.beginPath();
        for (let c = -r * 1.5; c <= r * 1.5; c += NET_MESH) {
            ctx.moveTo(c - r * 1.5, -r * 1.5); ctx.lineTo(c + r * 1.5, r * 1.5);
            ctx.moveTo(c + r * 1.5, -r * 1.5); ctx.lineTo(c - r * 1.5, r * 1.5);
        }
        ctx.stroke();
    }
    ctx.restore();
    for (const [col, lw] of [[SHAPE_OUTLINE, 5], [NET_RIM, 2.4]]) {
        ctx.strokeStyle = col; ctx.lineWidth = lw;
        ctx.beginPath(); ctx.ellipse(n.x, n.y, r, ry, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = NET_WEIGHT; ctx.strokeStyle = SHAPE_OUTLINE; ctx.lineWidth = 1.2;
    for (let i = 0; i < NET_WEIGHTS; i++) {
        const a = n.spin + i * Math.PI * 2 / NET_WEIGHTS;
        ctx.beginPath(); ctx.arc(n.x + Math.cos(a) * r, n.y + Math.sin(a) * ry, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
}

// ---------- 傳說「狐火」：靈狐咬一口，點起一團追著怪飛的狐火 ----------
function lightFoxfire(fox) {
    const e = elfState();
    if (e.foxfires.length >= FOXFIRE_MAX) return;
    e.foxfires.push({ x: fox.pos.x, y: fox.pos.y - 10, vx: randomInRange(-40, 40), vy: -80, life: FOXFIRE_LIFE, dmg: fox.attack * FOXFIRE_SHARE, target: null, seed: Math.random() * 6 });
}
function updateFoxfires(dt) {
    const e = elfState(), STEER = 6;
    for (let i = e.foxfires.length - 1; i >= 0; i--) {
        const f = e.foxfires[i];
        f.life -= dt;
        if (!f.target || !f.target.isAlive) { const m = monsterGrid.nearestShared(f, FOXFIRE_SEEK); f.target = m && m.isAlive ? m : null; }
        if (f.target) {
            const dx = f.target.pos.x - f.x, dy = f.target.pos.y - f.y, d = Math.hypot(dx, dy) || 1;
            if (d <= f.target.radius + 6) {
                const rSq = FOXFIRE_RADIUS * FOXFIRE_RADIUS;
                monsterGrid.forEachInRadius(f, FOXFIRE_RADIUS, m => { if (m.isAlive && distanceSq(m.pos, f) <= rSq) m.takeDamage(f.dmg); });
                if (inView(f)) { spawnParticles(f.x, f.y, FOXFIRE_COLOR, 10, 90, 0.4, 3); spawnParticles(f.x, f.y, FOXFIRE_CORE, 5, 50, 0.3, 2); }
                e.foxfires.splice(i, 1);
                continue;
            }
            const k = Math.min(1, dt * STEER);
            f.vx += (dx / d * FOXFIRE_SPEED - f.vx) * k; f.vy += (dy / d * FOXFIRE_SPEED - f.vy) * k;
        } else f.vy -= 20 * dt;
        f.x += f.vx * dt; f.y += f.vy * dt;
        if (f.life <= 0) { if (inView(f)) spawnParticles(f.x, f.y, FOXFIRE_COLOR, 4, 30, 0.3, 2); e.foxfires.splice(i, 1); }
    }
}
// 狐火：一團青藍色的鬼火，火舌朝飛行的反方向拖，一閃一閃（我方特效不用紅）
const FOXFIRE_COLOR = '#26C6DA', FOXFIRE_CORE = '#E0F7FA';
function drawFoxfire(ctx, f) {
    const sp = Math.hypot(f.vx, f.vy) || 1, ux = f.vx / sp, uy = f.vy / sp, flick = 1 + 0.15 * Math.sin(worldTime * 25 + f.seed);
    const tail = 17 * flick, w = 7 * flick;
    ctx.save();
    ctx.globalAlpha = 0.65;
    ctx.drawImage(getGlowSprite(FOXFIRE_COLOR), f.x - 20, f.y - 20, 40, 40);
    ctx.globalAlpha = Math.min(1, f.life / 0.2);
    const flame = (s) => {
        ctx.beginPath();
        ctx.moveTo(f.x - ux * tail * s, f.y - uy * tail * s);
        ctx.quadraticCurveTo(f.x - uy * w * s, f.y + ux * w * s, f.x + ux * w * 0.9 * s, f.y + uy * w * 0.9 * s);
        ctx.quadraticCurveTo(f.x + uy * w * s, f.y - ux * w * s, f.x - ux * tail * s, f.y - uy * tail * s);
        ctx.closePath();
    };
    flame(1); ctx.fillStyle = FOXFIRE_COLOR; ctx.fill(); ctx.strokeStyle = SHAPE_OUTLINE; ctx.lineWidth = 1.4; ctx.stroke();
    flame(0.55); ctx.fillStyle = FOXFIRE_CORE; ctx.fill();
    ctx.restore();
}

// ---------- 大招：箭雨 ----------
function useArrowRain() {
    const e = elfState(), p = gameState.player;
    e.rainT = ELF.rain.duration; e.rainTick = 0; e.rainKills = 0;
    spawnFloatText(p.pos.x, p.pos.y - 40, '箭雨！', '#B2EBF2', 18, 1.2, 'arrowrain');
    addShake(4);
    Sfx.play('nova');
    gameState.ultCooldown = ELF.rain.cooldown;
    gameState.run.novas++;
    stats().novas++;
    return true;
}
function rainVolley() {
    const e = elfState();
    const pool = gameState.monsters.filter(m => m.isAlive && !m.stealthed && inView(m.pos));
    const dmg = ELF.rain.damage * getWaveStatMultiplier(Math.max(1, gameState.currentWave)) * (1 + gameState.units.Archery.level * CONFIG.archery.upgradeBonus) * (1 + blessVal('bowPowerUp'));
    for (let i = 0; i < ELF.rain.perTick && pool.length; i++) {
        const m = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
        m.takeDamage(dmg);
        if (!m.isAlive) e.rainKills++;
        gameState.visualEffects.push(new FallingArrowEffect(m.pos));
    }
}
// 箭雨的一支箭：地上的影子越來越大 → 從斜上方插下來（跟平射同一支箭）→ 揚起一點塵土、插在地上一會兒再淡掉
const RAIN_FALL = 0.28, RAIN_STUCK = 0.55, RAIN_HEIGHT = 140, RAIN_DRIFT = 30, RAIN_AMBIENT_PER_SEC = 45;
const RAIN_DUST = '#BCAAA4', RAIN_SHADOW = 'rgba(0, 0, 0, 0.3)';
class FallingArrowEffect extends TimedEffect {
    constructor(pos) { super(pos, RAIN_FALL + RAIN_STUCK); this.landed = false; }
    update(dt) {
        super.update(dt);
        if (!this.landed && this.duration - this.life >= RAIN_FALL) {
            this.landed = true;
            if (inView(this.pos)) spawnParticles(this.pos.x, this.pos.y, RAIN_DUST, 3, 40, 0.35, 2.5);
        }
    }
    draw(ctx) {
        if (!inView(this.pos)) return;
        const t = this.duration - this.life, k = Math.min(1, t / RAIN_FALL);
        const dx = Math.cos(FALLING_ARROW_ANGLE), dy = Math.sin(FALLING_ARROW_ANGLE);
        if (!this.landed) {
            ctx.fillStyle = RAIN_SHADOW;
            ctx.beginPath(); ctx.ellipse(this.pos.x, this.pos.y, 2 + 5 * k, 1 + 2 * k, 0, 0, Math.PI * 2); ctx.fill();
            drawShaped('arrow', this.pos.x - dx * 12 - (1 - k) * RAIN_DRIFT, this.pos.y - dy * 12 - (1 - k) * RAIN_HEIGHT, FALLING_ARROW_ANGLE, 0);
            return;
        }
        // 插在地上：箭頭埋進土裡，只露出後半截
        ctx.globalAlpha = Math.min(1, this.life / (RAIN_STUCK * 0.5));
        drawShaped('arrow', this.pos.x - dx * 9, this.pos.y - dy * 9, FALLING_ARROW_ANGLE, 0);
        ctx.globalAlpha = 1;
    }
}

// ---------- 月光箭：貫穿怪最多的那個方向 ----------
function moonBeam(p) {
    const e = elfState();
    let best = null, bestN = 0;
    for (let i = 0; i < 16; i++) {
        const a = i / 16 * Math.PI * 2, ux = Math.cos(a), uy = Math.sin(a);
        let n = 0;
        for (const m of gameState.monsters) {
            if (!m.isAlive) continue;
            const dx = m.pos.x - p.pos.x, dy = m.pos.y - p.pos.y, along = dx * ux + dy * uy;
            if (along > 0 && along < MOONBEAM_LENGTH && Math.abs(dx * -uy + dy * ux) < MOONBEAM_WIDTH) n++;
        }
        if (n > bestN) { bestN = n; best = { ux, uy }; }
    }
    if (!best) return;
    const dmg = MOONBEAM_DAMAGE * getWaveStatMultiplier(Math.max(1, gameState.currentWave)) * (1 + blessVal('bowPowerUp'));
    for (const m of gameState.monsters) {
        if (!m.isAlive) continue;
        const dx = m.pos.x - p.pos.x, dy = m.pos.y - p.pos.y, along = dx * best.ux + dy * best.uy;
        if (along > 0 && along < MOONBEAM_LENGTH && Math.abs(dx * -best.uy + dy * best.ux) < MOONBEAM_WIDTH) m.takeDamage(dmg);
    }
    e.beams.push({ x: p.pos.x, y: p.pos.y, ux: best.ux, uy: best.uy, life: 0.5 });
    addShake(3);
}

// ---------- 萬獸之主：一群鹿從畫面一端衝到另一端 ----------
function startStampede(p) {
    const e = elfState(), left = Math.random() < 0.5;
    const y0 = p.pos.y + randomInRange(-60, 60), x0 = p.pos.x + (left ? -1 : 1) * (view.cssW / view.zoom / 2 + 60);
    const dmg = RES_STAMPEDE_DAMAGE * getWaveStatMultiplier(Math.max(1, gameState.currentWave)) * (1 + blessVal('compPower'));
    for (let i = 0; i < 6; i++) e.deer.push({ x: x0 - (left ? 1 : -1) * i * 26, y: y0 + randomInRange(-RES_STAMPEDE_WIDTH / 2, RES_STAMPEDE_WIDTH / 2), vx: (left ? 1 : -1) * RES_STAMPEDE_SPEED, dist: 0, dmg, hit: new Set() });
}
function updateStampede(dt) {
    const e = elfState(), maxDist = view.cssW / view.zoom + 240;
    for (let i = e.deer.length - 1; i >= 0; i--) {
        const d = e.deer[i];
        d.x += d.vx * dt; d.dist += Math.abs(d.vx * dt);
        monsterGrid.forEachInRadius(d, 22, m => { if (m.isAlive && !d.hit.has(m) && distanceSq(m.pos, d) < 22 * 22) { d.hit.add(m); m.takeDamage(d.dmg); if (m.isAlive && !(m instanceof BossMonster)) m.knockVel = { x: Math.sign(d.vx) * 160, y: randomInRange(-60, 60) }; } });
        if (d.dist > maxDist) e.deer.splice(i, 1);
    }
}

// ---------- 畫面 ----------
function drawElfHud(ctx, p) {
    // 移動中射速加成時，腳下一圈風
    if (!elfMoving()) return;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#B2EBF2'; ctx.lineWidth = 2;
    const t = worldTime * 6;
    ctx.beginPath(); ctx.ellipse(p.pos.x, p.pos.y + p.imageHeight * 0.4, 18, 6, 0, t % (Math.PI * 2), t % (Math.PI * 2) + Math.PI * 1.2); ctx.stroke();
    ctx.restore();
}
function drawElfWorld(ctx) {
    const e = elfState();
    for (const t of e.traps) {
        if (!inView(t)) continue;
        const s = TRAP_SIZE * t.scale, pulse = 0.5 + 0.5 * Math.sin(worldTime * 3 + t.x);
        ctx.globalAlpha = 0.25 + 0.25 * pulse;
        ctx.drawImage(getGlowSprite(TRAP_COLORS[t.kind]), t.x - s * 0.8, t.y - s * 0.8, s * 1.6, s * 1.6);
        ctx.globalAlpha = 1;
        ctx.drawImage(trapSprite(t.kind), t.x - s / 2, t.y - s / 2, s, s);
    }
    for (const b of e.beams) {
        ctx.save();
        ctx.globalAlpha = b.life * 1.6;
        ctx.strokeStyle = '#E3F2FD'; ctx.lineWidth = MOONBEAM_WIDTH * 0.6 * b.life * 2;
        ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + b.ux * MOONBEAM_LENGTH, b.y + b.uy * MOONBEAM_LENGTH); ctx.stroke();
        ctx.restore();
    }
    for (const n of e.nets) if (inView(n)) drawNet(ctx, n);
    drawHawkMarks(ctx);
    for (const f of e.foxfires) if (inView(f)) drawFoxfire(ctx, f);
    const deer = images.deer;
    if (deer) for (const d of e.deer) {
        if (!inView(d)) continue;
        const w = 40, h = w * deer.naturalHeight / deer.naturalWidth;
        ctx.save();
        ctx.translate(d.x, d.y);
        if (d.vx < 0) ctx.scale(-1, 1);
        ctx.drawImage(deer, -w / 2, -h / 2, w, h);
        ctx.restore();
    }
}

// ---------- 夥伴：靈狐（近戰、快）與鷹（俯衝、出手慢但痛）輪流 ----------
class Companion extends SummonUnit {
    constructor(x, y, level, p) {
        super(x, y, CONFIG.companion, level, p);
        this.setKind(gameState.units.Companion.count % 2 ? 'hawk' : 'fox');
    }
    setKind(kind) {
        this.kind = kind;
        this.config = kind === 'hawk' ? CONFIG.hawk : CONFIG.companion;
        const img = images[this.config.imageName];
        this.radius = this.config.radius;
        if (img) {
            this.image = img;
            this.imageWidth = this.radius * this.config.imgScaleMultiplier;
            this.imageHeight = this.imageWidth * img.naturalHeight / img.naturalWidth;
            this._spriteW = null; this._flashSprites = null;
        }
        this.refreshStats();
    }
    computeStats() {
        super.computeStats();
        this.maxHealth = Math.round(this.maxHealth * (1 + blessVal('compPower')));
        this.attack *= 1 + blessVal('compPower');
        if (this.tier >= 1) this.attackSpeed *= COMP_TIER1_RATE;
    }
    attackTarget() {
        const t = this.target;
        if (!t || !t.isAlive) return;
        const hits = 1 + (this.tier >= 3 ? 1 : 0) + (res('wildfriends') >= 1 ? 1 : 0);
        for (let i = 0; i < hits && t.isAlive; i++) t.takeDamage(this.attack);
        this.healFromDamage(this.attack);
        if (this.kind === 'hawk') {
            spawnParticles(t.pos.x, t.pos.y, '#D7CCC8', 6, 70, 0.35, 2);
            if (bl('hawkMark') && t.isAlive) t.hawkMarkUntil = worldTime + HAWK_MARK_TIME;
        }
        else if (bl('foxfire')) lightFoxfire(this);
        const fx = getVisualEffectFromPool(SlashEffect);
        if (fx) { fx.init(this.pos, t.pos); gameState.visualEffects.push(fx); }
        const sync = elfMoving() ? 1 + blessVal('compSync') : 1;
        this.attackCooldown = 1 / (this.attackSpeed * sync);
    }
    takeDamage(amount) {
        super.takeDamage(amount * (this.tier >= 2 ? COMP_TIER2_TAKEN : 1));
    }
    die() {
        if (!this.isAlive) return;
        this.isAlive = false;
        gameState.units.Companion.count--;
        onSummonDeath(this);
        spawnParticles(this.pos.x, this.pos.y, '#FFE082', 12, 70, 0.5);
        updateUI();
    }
}
