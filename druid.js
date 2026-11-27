// 德魯伊 · 橡樹賢者（規劃見 docs/characters.md 第 5 節）
// 核心是「紮根」：用靈魂在腳下種橡樹（不會動、會隨時間長大的據點），狼與熊的數量上限＝橡樹提供的林地；
// 野獸離最近的橡樹越遠越弱，所以要選一個地方打這一仗，換地方就得重新種樹。
// 每一波輪一個凱爾特節氣（Samhain、Imbolc、Beltane、Lughnasadh），給全軍不同效果。
// 典故：老普林尼《博物志》記載高盧德魯伊崇拜橡樹與槲寄生，以金鐮割下槲寄生。
// 這個檔在 game.js 之後載入，用的是 game.js 的全域；game.js 的 init 等所有腳本載完才跑

const DRUID = {
    // 比法師（50）厚一點：野獸不像骷髏那樣人海，怪比較容易漏到德魯伊身上
    baseHealth: 80,
    moveSpeed: 88,
    // 普攻「荊棘種子」：丟向射程內最近的怪，落地在 radius 內造成傷害、纏住小怪（緩速 root、rootTime 秒）
    seed: { interval: 1.1, range: 190, radius: 32, damage: 5, root: 0.85, rootTime: 1.0, flight: 0.45 },
    // 橡樹與野獸每活 growEvery 秒長大一階（最多 3 階），每階血量、攻擊 +stageBonus
    growEvery: 20, maxStage: 3, stageBonus: 0.3,
    // 每棵橡樹養幾隻野獸
    beastsPerOak: 3,
    // 野獸守的是「家」：德魯伊身邊 homeRadius 內正在挨打的那棵橡樹，沒有就是最近的那棵（都沒有就跟著德魯伊）。
    // 跟著德魯伊跑的話，怪去啃留在後面的橡樹時沒有野獸會回去救；只守最近那棵的話，林地另一頭的樹被圍著啃、那一波遲遲打不完
    homeRadius: 300, attackedTime: 2,
    // 離德魯伊超過 dormantRadius 的橡樹（不是樹人）沉睡：怪不把它當目標。
    // 不然怪會圍著一棵遠在畫面外、沒有野獸守的老橡樹啃好幾分鐘，那一波遲遲打不完
    dormantRadius: 380,
    // 野獸在最近一棵橡樹 groveRadius 內全力；再往外每 farFalloff 掉到 farMin
    groveRadius: 170, farFalloff: 320, farMin: 0.4,
    // 開局送一棵樹苗、一隻狼：不然第一波連一隻野獸都養不起
    startOak: true, startBeasts: ['Wolf', 'Wolf'],
    // 大招「野性化身」：變成巨熊 duration 秒，每 interval 秒拍擊身邊 radius 內所有怪並擊退，受傷 ×taken，全部野獸狂暴
    bearForm: { cooldown: 24, duration: 8, radius: 70, interval: 0.55, damage: 16, knock: 220, taken: 0.5, speed: 1.1 },
};

OPTIONAL_ART.druid = 'druid.png';
OPTIONAL_ART.druid_bearform = 'druid_bearform.png';
OPTIONAL_ART.druid_wolf = 'druid_wolf.png';
OPTIONAL_ART.druid_bear = 'druid_bear.png';
OPTIONAL_ART.druid_treant = 'druid_treant.png';
OPTIONAL_ART.sacred_oak = 'sacred_oak.png';

const BEAST_COMMON = {
    targetSearchRadius: 160, returnDistance: 40, avoidanceRadius: 13, avoidanceForce: 100, playerAvoidanceForce: 40,
    wanderRadius: 30, wanderSpeedFactor: 0.3, wanderIntervalMin: 2, wanderIntervalMax: 4,
};
CONFIG.sacredOak = {
    ...BEAST_COMMON, type: 'SacredOak', imageName: 'sacred_oak', color: '#558B2F', radius: 15, imgScaleMultiplier: 4.2,
    // 樹人（稀有祝福「森林覺醒」）才會打：treantAttack 是那時的攻擊力
    baseHealth: 140, baseAttack: 0, treantAttack: 14, attackRange: 34, attackSpeed: 0.7, moveSpeed: 55, upgradeBonus: 0.3,
};
CONFIG.wolf = {
    ...BEAST_COMMON, type: 'Wolf', imageName: 'druid_wolf', color: '#90A4AE', radius: 10, imgScaleMultiplier: 3.3,
    baseHealth: 40, baseAttack: 9, attackRange: 24, attackSpeed: 1.3, moveSpeed: 125, upgradeBonus: 0.3,
};
CONFIG.bear = {
    ...BEAST_COMMON, type: 'Bear', imageName: 'druid_bear', color: '#795548', radius: 13, imgScaleMultiplier: 3.6,
    baseHealth: 140, baseAttack: 12, attackRange: 28, attackSpeed: 0.8, moveSpeed: 78, upgradeBonus: 0.35,
};

Object.assign(CONFIG.evolution.names, {
    SacredOak: ['古橡', '聖橡', '萬年神木'],
    Wolf: ['灰狼', '撲狼', '芬里爾之子'],
    Bear: ['棕熊', '洞熊', '熊靈'],
});
Object.assign(CONFIG.evolution.perks, {
    SacredOak: ['身邊的野獸持續回血', '長大速度加倍', '被打時把傷害刺回去'],
    Wolf: ['移速 +25%', '撲咬：咬新目標的第一口 ×3', '每次咬兩口'],
    Bear: ['受到的傷害 -25%', '拍擊波及身邊的怪', '每 5 秒震地，擊退並緩速'],
});
const OAK_TIER1_HEAL = 0.015, OAK_TIER1_RADIUS = 80;
const OAK_TIER2_GROWTH = 2;
const OAK_TIER3_THORNS = 0.3;
const WOLF_TIER1_SPEED = 1.25, WOLF_TIER2_POUNCE = 3;
const BEAR_TIER1_TAKEN = 0.75, BEAR_CLEAVE_RADIUS = 30, BEAR_CLEAVE_SHARE = 0.5;
const BEAR_SLAM_EVERY = 5, BEAR_SLAM_RADIUS = 55, BEAR_SLAM_MULT = 1.5, BEAR_SLAM_SLOW = 0.7, BEAR_SLAM_SLOW_TIME = 1.2;

// ---------- 四大節：每一波輪一個 ----------
// mult 是「效果強度」：四大節流派的祝福、稀有祝福會放大它
const FESTIVALS = [
    { id: 'samhain', name: '亡者之夜', icon: 'fest_samhain', color: '#B388FF', desc: '野獸倒下時化成狼魂再戰一次' },
    { id: 'imbolc', name: '初春', icon: 'fest_imbolc', color: '#B2FF59', desc: '全體持續回血' },
    { id: 'beltane', name: '篝火', icon: 'fest_beltane', color: '#FF7043', desc: '野獸的攻擊帶火' },
    { id: 'lughnasadh', name: '收穫', icon: 'fest_lughnasadh', color: '#FFD54F', desc: '經驗 +30%' },
];
const FEST_INDEX = Object.fromEntries(FESTIVALS.map((f, i) => [f.id, i]));
const FEST_SAMHAIN_HP = 0.5;
const FEST_IMBOLC_BEAST = 0.02, FEST_IMBOLC_HERO = 0.006;
const FEST_BELTANE_DMG = 0.35;
const FEST_HARVEST_SOULS = 0.3;

// 綠人：每隻迸幾顆、種子傷害是普攻的幾成、迸多遠找目標；場上同時最多幾顆（一大群同時倒下時不要炸出幾百顆）
const GREEN_MAN_SEEDS = 3, GREEN_MAN_SHARE = 0.6, GREEN_MAN_REACH = 110, GREEN_MAN_MAX_LIVE = 24;
// 巨石陣：圈多大、圈裡節氣效果乘多少、幾顆石頭、立起來要多久
const HENGE_MULT = 3, HENGE_RADIUS = 85, HENGE_STONES = 8, HENGE_RISE = 0.6;
// 狼母生的小狼：體型比例、淡銀色的毛
const PUP_SCALE = 0.7, PUP_TINT = '#ECEFF1', PUP_TINT_STRENGTH = 0.35;
// 雙流派：熊之林（橡樹旁的熊受傷倍率、多近算旁邊）、荊棘狼（纏住幾秒）、狩獵之月（每次來幾隻小狼）
const GROVE_BEAR_TAKEN = 0.5, GROVE_BEAR_RADIUS = 90, THORN_WOLF_ROOT = 0.6, HUNT_MOON_PUPS = 2;

// ---------- 五個流派：各 4 張祝福，加一張稀有祝福（game.js 從 res 產生）；每個流派一張傳說。圖示名稱 = 祝福 id（icons.js） ----------
Object.assign(SCHOOLS, {
    grove: { name: '聖林', img: 'sacred_oak.png', color: '#AED581', res: [{ name: '根深', desc: '橡樹受到的傷害 -40%' }, { name: '森林覺醒', desc: '第 3 階的橡樹拔根成為樹人，會走過去打' }] },
    pack: { name: '狼群', img: 'druid_wolf.png', color: '#B0BEC5', res: [{ name: '狼嚎', desc: '每 10 秒全體狼攻速 +40%，持續 4 秒' }, { name: '狼王', desc: '每 6 隻狼出一隻狼王，身邊的狼攻速 +25%' }] },
    bear: { name: '巨熊', img: 'druid_bear.png', color: '#BCAAA4', res: [{ name: '熊皮', desc: '熊會嘲諷身邊的怪' }, { name: '熊靈', desc: '化身時所有熊一起狂暴，傷害 ×1.6' }] },
    wild: { name: '荒野', icon: 'thorns', color: '#9CCC65', res: [{ name: '荊棘之地', desc: '種子落地留下一片荊棘，持續刺傷' }, { name: '荊棘之冠', desc: '每棵橡樹周圍長出一圈荊棘' }] },
    seasons: { name: '四大節', icon: 'wheel', color: '#FFCC80', res: [{ name: '節慶', desc: '當前節氣效果加倍' }, { name: '輪轉', desc: '四個節氣的效果同時生效' }] },
});
Object.assign(BLESSINGS, {
    oakHp: { school: 'grove', name: '古木', max: 5, per: 0.3, desc: b => `橡樹血量 +${pct(b.per)}` },
    oakGrowth: { school: 'grove', name: '沃土', max: 3, per: 0.25, desc: b => `橡樹與野獸長大速度 +${pct(b.per)}` },
    groveSize: { school: 'grove', name: '林地', max: 3, per: 1, desc: b => `每棵橡樹多養 ${b.per} 隻野獸` },
    oakHeal: { school: 'grove', name: '樹蔭', max: 3, per: 0.01, desc: b => `橡樹身邊的野獸每秒回 ${pct(b.per)} 血` },
    wolfFang: { school: 'pack', name: '利齒', max: 5, per: 0.3, desc: b => `狼的傷害 +${pct(b.per)}` },
    packHunt: { school: 'pack', name: '群獵', max: 3, per: 0.06, desc: b => `身邊每多一隻狼，狼的傷害 +${pct(b.per)}` },
    wolfSpeed: { school: 'pack', name: '疾足', max: 3, per: 0.2, desc: b => `狼的移速與攻速 +${pct(b.per)}` },
    wolfCrit: { school: 'pack', name: '咬喉', max: 3, per: 0.12, desc: b => `狼有 ${pct(b.per)} 機率咬出雙倍傷害` },
    bearHide: { school: 'bear', name: '厚皮', max: 5, per: 0.35, desc: b => `熊的血量 +${pct(b.per)}` },
    bearMaul: { school: 'bear', name: '熊掌', max: 5, per: 0.3, desc: b => `熊的傷害 +${pct(b.per)}` },
    bearTime: { school: 'bear', name: '冬眠甦醒', max: 2, per: 3, desc: b => `巨熊化身多 ${b.per} 秒` },
    bearStun: { school: 'bear', name: '震懾', max: 3, per: 0.2, desc: b => `被熊打中的怪緩速 ${pct(b.per)}` },
    seedPower: { school: 'wild', name: '毒棘', max: 5, per: 0.35, desc: b => `荊棘種子傷害 +${pct(b.per)}` },
    seedRoot: { school: 'wild', name: '纏根', max: 3, per: 0.4, desc: b => `種子纏住怪的時間 +${b.per} 秒` },
    seedCount: { school: 'wild', name: '撒種', max: 2, per: 1, desc: b => `每次多丟 ${b.per} 顆種子` },
    seedRadius: { school: 'wild', name: '蔓生', max: 3, per: 0.2, desc: b => `種子範圍 +${pct(b.per)}` },
    festPower: { school: 'seasons', name: '祭司', max: 3, per: 0.5, desc: b => `節氣效果 +${pct(b.per)}` },
    festLinger: { school: 'seasons', name: '餘韻', max: 1, per: 1, desc: () => '上一個節氣的效果也保留' },
    festRenew: { school: 'seasons', name: '新生', max: 1, per: 1, desc: () => '每次換節氣，全體野獸回滿血' },
    festOffering: { school: 'seasons', name: '獻祭', max: 2, per: 1, desc: b => `每次換節氣，所有橡樹長大 ${b.per} 階` },
    goldenSickle: { school: 'grove', name: '金鐮', legendary: true, max: 1, per: 0.1, desc: b => `每波第 3 階的橡樹結出槲寄生，撿到回 ${pct(b.per)} 血、全軍狂暴` },
    yggdrasil: { school: 'grove', name: '世界樹', legendary: true, max: 1, per: 1, desc: () => '最老的那棵橡樹不會死：倒下時在你腳邊重新長成樹苗' },
    whiteBull: { school: 'bear', name: '白牛獻祭', legendary: true, max: 1, per: 3, desc: b => `熊倒下時，整片林地這一波長大速度 ×${b.per}` },
    // 狼母：狼群要「養大」才有回報，林地上限不再是狼數的天花板
    wolfMother: { school: 'pack', name: '狼母', legendary: true, max: 1, per: 1, desc: () => '狼長到第 3 階時生出一隻小狼，小狼不佔林地' },
    // 綠人：凱爾特的葉面人，死去之處長出新芽。被纏住的怪一倒，種子就往旁邊迸，一路連鎖
    greenMan: { school: 'wild', name: '綠人', legendary: true, max: 1, per: GREEN_MAN_SEEDS, desc: b => `被纏住的怪死掉時迸出 ${b.per} 顆種子，把旁邊的怪也纏住` },
    // 巨石陣：四大節原本整片地圖都吃，這張把它綁在一個位置上，跟德魯伊「選地方打這一仗」同一個方向
    stonehenge: { school: 'seasons', name: '巨石陣', legendary: true, max: 1, per: HENGE_MULT, desc: b => `換節氣時在你腳下立起一圈巨石，站在圈裡節氣效果 ×${b.per}` },
    // ---- 雙流派傳說（兩個流派都到 3 層才出現）----
    groveBears: { school: DUO_SCHOOL, duo: ['grove', 'bear'], name: '熊之林', legendary: true, max: 1, per: GROVE_BEAR_TAKEN, desc: b => `站在橡樹旁的熊受到的傷害 -${pct(1 - b.per)}` },
    thornWolves: { school: DUO_SCHOOL, duo: ['pack', 'wild'], name: '荊棘狼', legendary: true, max: 1, per: THORN_WOLF_ROOT, desc: b => `狼咬到的怪被藤蔓纏住 ${b.per} 秒（首領、精英不會）` },
    huntMoon: { school: DUO_SCHOOL, duo: ['seasons', 'pack'], name: '狩獵之月', legendary: true, max: 1, per: HUNT_MOON_PUPS, desc: b => `每換一次節氣，${b.per} 隻小狼加入狼群（不佔林地）` },
});
const RES_ROOTS_TAKEN = 0.6;
const RES_HOWL_EVERY = 10, RES_HOWL_TIME = 4, RES_HOWL_RATE = 1.4;
const RES_KING_EVERY = 6, RES_KING_MULT = 2, RES_KING_RADIUS = 100, RES_KING_RATE = 1.25, RES_KING_SCALE = 1.35;
const RES_BEARHIDE_RADIUS = 60, RES_BEARHIDE_EVERY = 0.5, RES_BEARHIDE_TIME = 1.2;
const RES_BEARSPIRIT_MULT = 1.6, RES_BEARSPIRIT_HEAL = 0.3;
const BEAR_LEAVES = 16;   // 變身時捲起的落葉片數
const RES_THORNPATCH_TIME = 3, RES_THORNPATCH_TICK = 0.5, RES_THORNPATCH_SHARE = 0.25;
const RES_CROWN_RADIUS = 70, RES_CROWN_EVERY = 1, RES_CROWN_SHARE = 0.5;
const RES_TREANT_LEASH = 200;
const SICKLE_PICK_RADIUS = 26, SICKLE_FRENZY = 6;
// 德魯伊專屬成就的門檻
const DRUID_ACHV = { oaks: 10, evergreenWaves: 8, kings: 5, loneOakWave: 15 };

Object.assign(UNIT_TYPES, {
    SacredOak: {
        card: { cap: 2, capPer: 1, every: 10 },
        cfg: () => CONFIG.sacredOak, Cls: () => SacredOak, name: '橡樹', img: 'sacred_oak.png',
        // 種在德魯伊腳下（不是身後）：據點要種在自己選的位置
        summon: (level) => plantOak(level),
    },
    Wolf: { card: { cap: 3, capPer: 2, every: 4 }, cfg: () => CONFIG.wolf, Cls: () => Wolf, name: '狼', img: 'druid_wolf.png', cap: () => beastRoom('Wolf') },
    Bear: { card: { cap: 1, capPer: 1, every: 8 }, cfg: () => CONFIG.bear, Cls: () => Bear, name: '熊', img: 'druid_bear.png', cap: () => beastRoom('Bear') },
});

CLASSES.druid = {
    name: '德魯伊', title: '橡樹賢者', portrait: 'druid.png', tagline: '種下橡樹，在自己選的林地打這一仗',
    // 同一套怪物加強下沒強化常常通關（見 game.js 的 monsterRamp）
    monsterPressure: 1.2,
    unlock: 'relics30',
    // 橡樹自己不打人：開局光有樹撐不過前幾波，狼一開始就會
    startCards: ['SacredOak', 'Wolf'],
    cards: ['SacredOak', 'Wolf', 'Bear'], schools: ['grove', 'pack', 'bear', 'wild', 'seasons', 'soul'],
    metaUpgrades: {
        summonHp: META_SUMMON_HP,
        groveSize: { icon: 'groveSize', name: '每棵樹的野獸', max: 2, per: 1, costBase: 60, desc: m => `每棵橡樹多養 ${m.per} 隻野獸`, total: (m, lv) => `+${m.per * lv} 隻` },
        bearTime: { icon: 'bearTime', name: '巨熊化身時間', max: 3, per: 1, costBase: 35, desc: m => `巨熊化身 +${m.per} 秒`, total: (m, lv) => `+${m.per * lv} 秒` },
    },
    hero: { imageName: 'druid', baseHealth: DRUID.baseHealth, moveSpeed: DRUID.moveSpeed },
    attack: (p, dt) => druidAttack(p, dt),
    update: (dt) => druidUpdate(dt),
    reset: () => { gameState.druid = newDruidState(); },
    onRunStart: () => {
        const p = gameState.player;
        if (DRUID.startOak) { plantOak(0, true); gameState.totalSummons.SacredOak++; }
        for (const type of DRUID.startBeasts) {
            const pos = p.getSummonPosition();
            gameState.summons.push(new (UNIT_TYPES[type].Cls())(pos.x, pos.y, 0, p));
            gameState.units[type].count++;
            gameState.totalSummons[type]++;
        }
    },
    onWaveStart: () => druidWaveStart(),
    onMonsterKill: (m) => { if (bl('greenMan') && m.rootedUntil > worldTime) greenManBurst(m); },
    drawGround: (ctx) => drawStonehenge(ctx),
    onWaveEnd: () => {
        const d = druidState();
        d.evergreen = d.oakLostThisWave ? 0 : d.evergreen + 1;
        d.oakLostThisWave = false;
        if (d.evergreen >= DRUID_ACHV.evergreenWaves) gameState.run.flags.druidEvergreen = true;
    },
    onBossKill: () => { if (druidState().bearT > 0) gameState.run.flags.druidBearBoss = true; },
    soulMult: () => 1 + festivalStrength('lughnasadh') * FEST_HARVEST_SOULS,
    targetableSummons: () => {
        const p = gameState.player, out = druidState().targetable, rSq = DRUID.dormantRadius * DRUID.dormantRadius;
        out.length = 0;
        for (const s of gameState.summons) if (!(s instanceof SacredOak) || s.treant || distanceSq(s.pos, p.pos) <= rSq) out.push(s);
        return out;
    },
    heroSpeedMult: () => druidState().bearT > 0 ? DRUID.bearForm.speed : 1,
    heroDamageTakenMult: () => druidState().bearT > 0 ? DRUID.bearForm.taken : 1,
    drawHero: (ctx, p) => drawDruidHud(ctx, p),
    drawWorld: (ctx) => drawDruidWorld(ctx),
    // 戰場遺跡：戰鼓祭壇讓所有橡樹與野獸長大一階（加上原本的全軍狂暴）；靈泉旁的橡樹直接長到第 3 階（見 druidUpdate）
    // 德魯伊守在林地裡，遺跡冒在林地範圍內，不用丟下野獸跑去拿
    relicDist: [150, 240],
    onRelic: (r) => {
        if (r.kind !== 'altar') return false;
        gameState.frenzyTimer = Math.max(gameState.frenzyTimer, RELIC_TYPES.altar.frenzy);
        for (const s of gameState.summons) if (s.isAlive && s.grow) s.grow(1);
        const p = gameState.player;
        spawnFloatText(p.pos.x, p.pos.y - 34, '萬物生長！', '#C5E1A5', 18, 1.2, 'oakGrowth');
        addShake(5);
        Sfx.play('nova');
        return true;
    },
    saveExtra: () => {
        const d = druidState();
        return {
            oaks: gameState.summons.filter(s => s.isAlive && s instanceof SacredOak).map(s => ({ x: Math.round(s.anchor.x), y: Math.round(s.anchor.y), age: Math.round(s.age) })),
            beasts: gameState.summons.filter(s => s.isAlive && s instanceof Beast).map(s => ({ type: s.config.type, age: Math.round(s.age) })),
            evergreen: d.evergreen, planted: d.planted,
        };
    },
    loadExtra: (data) => {
        const oaks = (data.oaks || []).slice(), beasts = (data.beasts || []).slice();
        for (const s of gameState.summons) {
            if (s instanceof SacredOak && oaks.length) {
                const o = oaks.shift();
                s.anchor = { x: o.x, y: o.y }; s.pos.x = o.x; s.pos.y = o.y; s.age = o.age;
                s.syncStage(); s.currentHealth = s.maxHealth;
            } else if (s instanceof Beast) {
                const i = beasts.findIndex(b => b.type === s.config.type);
                if (i < 0) continue;
                s.age = beasts.splice(i, 1)[0].age;
                s.syncStage(); s.currentHealth = s.maxHealth;
            }
        }
        druidState().evergreen = data.evergreen || 0;
        druidState().planted = data.planted || 0;
    },
    achv: {
        win: '林地之王', speed: ['迅捷之風', '奔狼', '山林疾影'],
        feats: [
            ['oaks', '萬古林', `同時有 ${DRUID_ACHV.oaks} 棵長到第 3 階的橡樹`, 60, () => gameState.summons.filter(s => s.isAlive && s instanceof SacredOak && s.stage >= DRUID.maxStage).length >= DRUID_ACHV.oaks],
            ['bearBoss', '熊王', '化身巨熊時打倒首領', 40, () => !!gameState.run.flags.druidBearBoss],
            ['evergreen', '四季常青', `連續 ${DRUID_ACHV.evergreenWaves} 波沒有任何一棵橡樹倒下`, 50, () => !!gameState.run.flags.druidEvergreen],
            ['kings', '群狼之首', `同時有 ${DRUID_ACHV.kings} 隻狼王`, 50, () => gameState.summons.filter(s => s.isAlive && s.king).length >= DRUID_ACHV.kings],
            ['loneOak', '孤木', `只靠開局那棵橡樹，撐過第 ${DRUID_ACHV.loneOakWave} 波`, 60, () => getSurvivedWaves() >= DRUID_ACHV.loneOakWave && druidState().planted === 0],
        ],
    },
    ultimate: {
        name: '化身', icon: 'bearform', hint: '野性化身：變成巨熊橫掃身邊、野獸狂暴',
        hintRadius: () => DRUID.bearForm.radius * 1.5, cooldown: () => DRUID.bearForm.cooldown, use: () => useBearForm(),
    },
};

// fest：這一波的節氣（FESTIVALS 的索引），prevFest：上一波的（稀有祝福、餘韻用）；planted：玩家自己種了幾棵（不含開局那棵）
function newDruidState() {
    return { home: { pos: { x: 0, y: 0 } }, targetable: [], seedT: 0, bearT: 0, swipeT: 0, fest: -1, prevFest: -1, howlT: 0, howlCd: RES_HOWL_EVERY, tauntT: 0, crownT: 0, kingT: 0,
        patches: [], sickles: [], boostWave: -1, evergreen: 0, oakLostThisWave: false, planted: 0, oakSeq: 0, henge: null, greenLive: 0 };
}
function druidState() { return gameState.druid || (gameState.druid = newDruidState()); }

// 這個節氣現在的強度（0 = 沒生效）
function festivalStrength(id) {
    const d = druidState();
    const i = FEST_INDEX[id];
    const active = res('seasons') >= 2 || d.fest === i || (bl('festLinger') && d.prevFest === i);
    if (!active) return 0;
    return (1 + blessVal('festPower')) * (res('seasons') >= 1 ? 2 : 1) * (inHenge() ? HENGE_MULT : 1);
}
function inHenge() {
    const h = druidState().henge, p = gameState.player;
    return !!(h && p && bl('stonehenge') && distanceSq(p.pos, h) <= HENGE_RADIUS * HENGE_RADIUS);
}

function oaks() { return gameState.summons.filter(s => s.isAlive && s instanceof SacredOak); }
// 林地容量扣掉另一種野獸占掉的，就是這一種還能養幾隻（cap 是「這一種的上限」）
function beastRoom(type) {
    const cap = oaks().length * (DRUID.beastsPerOak + blessVal('groveSize') + classMeta('groveSize'));
    const other = type === 'Wolf' ? gameState.units.Bear.count : gameState.units.Wolf.count;
    return Math.max(0, cap - other);
}
// free：開局送的那棵（不算「自己種的」）
function plantOak(level, free = false) {
    const p = gameState.player, d = druidState();
    // 新的樹長在林地裡（最老那棵旁邊，照蜂巢格由內往外找空位）：自動種的時候主角在到處閃，種在腳下會東一棵西一棵。
    // 一棵都沒了才種在主角腳下，那裡就是新的林地
    const home = eldestOak();
    const spot = freeOakSpot(home ? home.anchor : p.pos);
    gameState.summons.push(new SacredOak(spot.x, spot.y, level, p));
    const x = spot.x, y = spot.y;
    gameState.units.SacredOak.count++;
    if (!free) d.planted++;
    spawnParticles(x, y, '#AED581', 18, 80, 0.6, 3);
}
const OAK_SPACING = 34, OAK_SPOT_RINGS = 8;
function freeOakSpot(c) {
    const taken = oaks().map(o => o.anchor), minSq = (OAK_SPACING * 0.85) ** 2;
    const free = (x, y) => taken.every(a => (a.x - x) ** 2 + (a.y - y) ** 2 >= minSq);
    if (free(c.x, c.y)) return { x: c.x, y: c.y };
    // 蜂巢格第 r 圈有 6r 個點：沿六個方向各走 r 步
    const dirs = [[1, 0], [0.5, 0.866], [-0.5, 0.866], [-1, 0], [-0.5, -0.866], [0.5, -0.866]];
    for (let r = 1; r <= OAK_SPOT_RINGS; r++) {
        let x = c.x + dirs[4][0] * r * OAK_SPACING, y = c.y + dirs[4][1] * r * OAK_SPACING;
        for (let side = 0; side < 6; side++) {
            for (let k = 0; k < r; k++) {
                if (free(x, y)) return { x, y };
                x += dirs[side][0] * OAK_SPACING; y += dirs[side][1] * OAK_SPACING;
            }
        }
    }
    return { x: c.x, y: c.y };
}
// 野獸離最近的橡樹多遠 → 傷害倍率
function groveMult(pos) {
    let best = Infinity;
    for (const s of gameState.summons) if (s.isAlive && s instanceof SacredOak) best = Math.min(best, distanceSq(pos, s.pos));
    if (best === Infinity) return DRUID.farMin;
    const d = Math.sqrt(best);
    if (d <= DRUID.groveRadius) return 1;
    return Math.max(DRUID.farMin, 1 - (d - DRUID.groveRadius) / DRUID.farFalloff * (1 - DRUID.farMin));
}
function growthRate() {
    const d = druidState();
    return (1 + blessVal('oakGrowth')) * (bl('whiteBull') && d.boostWave === gameState.currentWave ? BLESSINGS.whiteBull.per : 1);
}

function druidWaveStart() {
    const d = druidState(), p = gameState.player;
    d.prevFest = d.fest;
    d.fest = (gameState.currentWave - 1) % FESTIVALS.length;
    const F = FESTIVALS[d.fest];
    spawnFloatText(p.pos.x, p.pos.y - 46, `${F.name}：${F.desc}`, F.color, 14, 2.2, F.icon);
    if (bl('huntMoon')) for (let i = 0; i < HUNT_MOON_PUPS; i++) spawnPup(p.pos, i === 0 ? '狩獵之月' : null);
    if (bl('stonehenge')) {
        d.henge = { x: p.pos.x, y: p.pos.y, t: 0 };
        spawnParticles(p.pos.x, p.pos.y, '#BCAAA4', 26, HENGE_RADIUS * 1.6, 0.7, 4);
        addShake(4);
    }
    if (bl('festRenew')) for (const s of gameState.summons) if (s.isAlive && s instanceof Beast) s.currentHealth = s.maxHealth;
    if (bl('festOffering')) for (const s of oaks()) s.grow(bl('festOffering'));
    for (const s of gameState.summons) if (s instanceof Beast && s.spirited) { s.spirited = false; s.refreshStats(); }
    // 金鐮：每棵第 3 階的橡樹結一顆槲寄生
    if (bl('goldenSickle')) for (const o of oaks()) if (o.stage >= DRUID.maxStage) d.sickles.push({ x: o.pos.x + randomInRange(-24, 24), y: o.pos.y + 20 + randomInRange(0, 12) });
}

// ---------- 每格 ----------
function druidUpdate(dt) {
    const d = druidState(), p = gameState.player;
    if (!p) return;
    let homeOak = null, hd = DRUID.homeRadius * DRUID.homeRadius, hit = false;
    for (const s of gameState.summons) {
        if (!s.isAlive || !(s instanceof SacredOak)) continue;
        s.attackedT = Math.max(0, (s.attackedT || 0) - dt);
        const dd = distanceSq(s.pos, p.pos);
        if (dd > DRUID.homeRadius * DRUID.homeRadius) continue;
        const underAttack = s.attackedT > 0;
        if ((underAttack && !hit) || (underAttack === hit && dd < hd)) { hd = dd; homeOak = s; hit = underAttack; }
    }
    d.home.pos.x = homeOak ? homeOak.pos.x : p.pos.x;
    d.home.pos.y = homeOak ? homeOak.pos.y : p.pos.y;
    if (d.henge) d.henge.t += dt;
    if (d.bearT > 0) {
        d.bearT -= dt;
        if (d.bearT <= 0) { d.bearT = 0; setHeroImage(p, 'druid'); }
    }
    // 初春：全體回血
    const imbolc = festivalStrength('imbolc');
    if (imbolc > 0 && p.currentHealth < p.maxHealth) p.currentHealth = Math.min(p.maxHealth, p.currentHealth + p.maxHealth * FEST_IMBOLC_HERO * imbolc * dt);
    // 狼嚎：定時全體狼加攻速
    if (res('pack') >= 1) {
        d.howlCd -= dt;
        if (d.howlCd <= 0) { d.howlCd = RES_HOWL_EVERY; d.howlT = RES_HOWL_TIME; spawnFloatText(p.pos.x, p.pos.y - 40, '狼嚎', '#B0BEC5', 13, 1, 'wolfSpeed'); }
    }
    d.howlT = Math.max(0, d.howlT - dt);
    // 狼王：每秒重排一次（照加入順序，前面那幾隻當王）
    d.kingT -= dt;
    if (d.kingT <= 0) {
        d.kingT = 1;
        const wolves = gameState.summons.filter(s => s.isAlive && s instanceof Wolf).sort((a, b) => a.uid - b.uid);
        const kings = res('pack') >= 2 ? Math.floor(wolves.length / RES_KING_EVERY) : 0;
        wolves.forEach((w, i) => { const k = i < kings; if (w.king !== k) { w.king = k; w.refreshStats(); } });
        // 狼母：長到第 3 階的成狼各生一隻小狼（小狼自己不會再生）
        if (bl('wolfMother')) for (const w of wolves) if (w.stage >= DRUID.maxStage && !w.pup && !w.birthed) birthPup(w);
    }
    // 熊皮：熊嘲諷身邊的怪
    d.tauntT -= dt;
    const taunt = res('bear') >= 1 && d.tauntT <= 0;
    if (taunt) d.tauntT = RES_BEARHIDE_EVERY;
    d.crownT -= dt;
    const crown = res('wild') >= 2 && d.crownT <= 0;
    if (crown) d.crownT = RES_CROWN_EVERY;
    const crownDmg = crown ? seedDamage() * RES_CROWN_SHARE : 0;
    const springs = gameState.relics.filter(r => r.kind === 'spring' && !r.done);
    for (const s of gameState.summons) {
        if (!s.isAlive) continue;
        if (imbolc > 0 && (s instanceof Beast || s instanceof SacredOak)) s.currentHealth = Math.min(s.maxHealth, s.currentHealth + s.maxHealth * FEST_IMBOLC_BEAST * imbolc * dt);
        if (taunt && s instanceof Bear) monsterGrid.forEachInRadius(s.pos, RES_BEARHIDE_RADIUS, m => { if (m.isAlive && !(m instanceof BossMonster)) { m.tauntBy = s; m.tauntT = RES_BEARHIDE_TIME; } });
        if (s instanceof SacredOak) {
            if (crownDmg) { const rSq = RES_CROWN_RADIUS * RES_CROWN_RADIUS; monsterGrid.forEachInRadius(s.pos, RES_CROWN_RADIUS, m => { if (m.isAlive && distanceSq(m.pos, s.pos) <= rSq) m.takeDamage(crownDmg); }); }
            // 靈泉旁邊的橡樹直接長到第 3 階
            for (const r of springs) if (s.stage < DRUID.maxStage && distanceSq(s.pos, r) <= (RELIC_RADIUS + 60) * (RELIC_RADIUS + 60)) { s.grow(DRUID.maxStage - s.stage); spawnFloatText(s.pos.x, s.pos.y - 30, '神木', '#C5E1A5', 13, 1, 'oakHp'); }
        }
    }
    // 荊棘之地：一片片地刺
    for (let i = d.patches.length - 1; i >= 0; i--) {
        const t = d.patches[i];
        t.life -= dt; t.tick -= dt;
        if (t.tick <= 0) {
            t.tick = RES_THORNPATCH_TICK;
            const rSq = t.r * t.r;
            groundMonsterGrid.forEachInRadius(t, t.r, m => { if (m.isAlive && distanceSq(m.pos, t) <= rSq) m.takeDamage(t.dmg); });
        }
        if (t.life <= 0) d.patches.splice(i, 1);
    }
    // 槲寄生：走過去撿
    for (let i = d.sickles.length - 1; i >= 0; i--) {
        const k = d.sickles[i];
        if (distanceSq(k, p.pos) > SICKLE_PICK_RADIUS * SICKLE_PICK_RADIUS) continue;
        d.sickles.splice(i, 1);
        const heal = Math.round(p.maxHealth * BLESSINGS.goldenSickle.per);
        p.currentHealth = Math.min(p.maxHealth, p.currentHealth + heal);
        gameState.frenzyTimer = Math.max(gameState.frenzyTimer, SICKLE_FRENZY);
        spawnFloatText(p.pos.x, p.pos.y - 30, `槲寄生 +${formatNumberK(heal)}`, '#C5E1A5', 14, 1.2, 'goldenSickle');
        spawnParticles(k.x, k.y, '#FFF59D', 16, 90, 0.6, 3);
        Sfx.play('pick');
    }
}

// ---------- 普攻：荊棘種子；化身時改成拍擊 ----------
function seedDamage() {
    return DRUID.seed.damage * getWaveStatMultiplier(Math.max(1, gameState.currentWave)) * (1 + blessVal('seedPower'));
}
const seedTargets = [];
function druidAttack(p, dt) {
    const d = druidState();
    if (d.bearT > 0) { bearSwipe(p, dt); return; }
    d.seedT -= dt;
    if (d.seedT > 0) return;
    const S = DRUID.seed, rSq = S.range * S.range;
    seedTargets.length = 0;
    monsterGrid.forEachInRadius(p.pos, S.range, m => { if (m.isAlive && !m.stealthed) { const dd = distanceSq(m.pos, p.pos); if (dd <= rSq) seedTargets.push({ m, dd }); } });
    if (!seedTargets.length) return;
    seedTargets.sort((a, b) => a.dd - b.dd);
    d.seedT = S.interval;
    const n = 1 + bl('seedCount');
    const dmg = seedDamage(), radius = S.radius * (1 + blessVal('seedRadius'));
    for (let i = 0; i < n; i++) {
        const t = seedTargets[Math.min(i * 2, seedTargets.length - 1)].m;
        gameState.visualEffects.push(new SeedEffect(p.pos, { x: t.pos.x, y: t.pos.y }, dmg, radius));
    }
    Sfx.play('mageBolt');
}
// 種子：一顆帶著小葉子的橡實，發著淡綠光，邊飛邊翻
SHAPE_SPRITES.acorn = {
    len: 12, wid: 12, spin: 1.5, glow: '#9CCC65',
    draw(g) {
        g.lineWidth = 1.4; g.strokeStyle = SHAPE_OUTLINE;
        g.fillStyle = '#A1887F';
        g.beginPath(); g.ellipse(1, 0, 4.2, 3.4, 0, 0, Math.PI * 2); g.fill(); g.stroke();
        g.fillStyle = '#5D4037';
        g.beginPath(); g.arc(-1.8, 0, 3.6, Math.PI * 0.5, Math.PI * 1.5); g.closePath(); g.fill(); g.stroke();
        g.fillStyle = '#7CB342';
        g.beginPath(); g.moveTo(-4.8, 0); g.quadraticCurveTo(-6, -4.5, -2, -5.5); g.quadraticCurveTo(-3, -2, -4.8, 0); g.fill(); g.stroke();
        g.strokeStyle = '#D7CCC8'; g.lineWidth = 0.8;
        g.beginPath(); g.arc(1.5, -0.8, 2, -Math.PI * 0.8, -Math.PI * 0.2); g.stroke();
    },
};
class SeedEffect extends TimedEffect {
    constructor(from, to, dmg, radius) {
        super(from, DRUID.seed.flight + 0.35);
        this.from = { ...from }; this.to = to; this.dmg = dmg; this.radius = radius; this.landed = false;
    }
    update(dt) {
        super.update(dt);
        if (this.landed || this.duration - this.life < DRUID.seed.flight) return;
        this.landed = true;
        const S = DRUID.seed, rSq = this.radius * this.radius, rootTime = S.rootTime + blessVal('seedRoot');
        if (this.green) druidState().greenLive--;
        monsterGrid.forEachInRadius(this.to, this.radius, m => {
            if (!m.isAlive || distanceSq(m.pos, this.to) > rSq) return;
            m.takeDamage(this.dmg);
            if (m.isAlive && !(m instanceof BossMonster) && !m.isElite) { m.applySlow(S.root, rootTime); m.rootedUntil = worldTime + rootTime; }
        });
        if (res('wild') >= 1) druidState().patches.push({ x: this.to.x, y: this.to.y, r: this.radius, life: RES_THORNPATCH_TIME, tick: 0, dmg: this.dmg * RES_THORNPATCH_SHARE });
        spawnParticles(this.to.x, this.to.y, '#9CCC65', 6, 50, 0.4, 2);
    }
    draw(ctx) {
        const t = this.duration - this.life, k = Math.min(1, t / DRUID.seed.flight);
        if (!this.landed) {
            const x = this.from.x + (this.to.x - this.from.x) * k, y = this.from.y + (this.to.y - this.from.y) * k - Math.sin(k * Math.PI) * 40;
            // 落點先冒出一圈淡綠，看得出要落在哪
            ctx.save();
            ctx.globalAlpha = 0.25 + 0.35 * k;
            ctx.strokeStyle = '#9CCC65'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.ellipse(this.to.x, this.to.y, this.radius * k, this.radius * 0.6 * k, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
            drawShaped('acorn', x, y, 0, this.from.x);
            return;
        }
        // 落地：藤蔓從地面竄出來再縮回去
        const g = 1 - (this.life / 0.35);
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - g);
        ctx.strokeStyle = '#7CB342'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (let i = 0; i < 6; i++) {
            const a = i / 6 * Math.PI * 2, r = this.radius * (0.4 + 0.6 * Math.min(1, g * 2));
            ctx.beginPath();
            ctx.moveTo(this.to.x, this.to.y);
            ctx.quadraticCurveTo(this.to.x + Math.cos(a + 0.6) * r * 0.6, this.to.y + Math.sin(a + 0.6) * r * 0.6 - 6, this.to.x + Math.cos(a) * r, this.to.y + Math.sin(a) * r * 0.6);
            ctx.stroke();
        }
        ctx.restore();
    }
}

function bearSwipe(p, dt) {
    const d = druidState(), B = DRUID.bearForm;
    d.swipeT -= dt;
    if (d.swipeT > 0) return;
    const rSq = B.radius * B.radius;
    const dmg = B.damage * getWaveStatMultiplier(Math.max(1, gameState.currentWave));
    let any = false;
    monsterGrid.forEachInRadius(p.pos, B.radius, m => {
        if (!m.isAlive || distanceSq(m.pos, p.pos) > rSq) return;
        any = true;
        m.takeDamage(dmg);
        if (!m.isAlive || m instanceof BossMonster) return;
        const dir = normalizeVector({ x: m.pos.x - p.pos.x, y: m.pos.y - p.pos.y });
        m.knockVel = { x: dir.x * B.knock, y: dir.y * B.knock };
    });
    if (!any) return;
    d.swipeT = B.interval;
    const fx = getVisualEffectFromPool(SweepEffect) || new SweepEffect();
    fx.init(p.pos, 0, Math.PI, B.radius, false);
    gameState.visualEffects.push(fx);
    addShake(3);
    Sfx.play('hit');
}

function useBearForm() {
    const d = druidState(), p = gameState.player, B = DRUID.bearForm;
    d.bearT = B.duration + blessVal('bearTime') + classMeta('bearTime');
    d.swipeT = 0;
    setHeroImage(p, 'druid_bearform');
    gameState.frenzyTimer = Math.max(gameState.frenzyTimer, d.bearT);
    // 熊靈：所有熊一起狂暴、回一截血
    if (res('bear') >= 2) for (const s of gameState.summons) if (s.isAlive && s instanceof Bear) { s.currentHealth = Math.min(s.maxHealth, s.currentHealth + s.maxHealth * RES_BEARSPIRIT_HEAL); spawnParticles(s.pos.x, s.pos.y, '#FFAB91', 8, 70, 0.5, 3); }
    spawnParticles(p.pos.x, p.pos.y, '#A1887F', 30, 180, 0.6, 3);
    // 變身：落葉繞著身體捲成一陣旋風往外散，同時一聲咆哮震開兩圈
    addWorldFx({ kind: 'leaves', x: p.pos.x, y: p.pos.y, r: B.radius * 1.6, count: BEAR_LEAVES, spin: Math.PI * 3, seed: Math.random() * 6, life: 0.9 });
    addWorldFx({ kind: 'ring', x: p.pos.x, y: p.pos.y, r0: 20, r1: B.radius * 2.2, life: 0.6, color: '#8D6E63', width: 10 });
    addWorldFx({ kind: 'ring', x: p.pos.x, y: p.pos.y, r0: 10, r1: B.radius * 1.4, life: 0.45, color: '#C5E1A5', width: 5, delay: 0.12 });
    spawnFloatText(p.pos.x, p.pos.y - 40, '野性化身！', '#FFCC80', 18, 1.2, 'bearform');
    addShake(7);
    Sfx.play('boss');
    gameState.ultCooldown = B.cooldown;
    gameState.run.novas++;
    stats().novas++;
    return true;
}

// ---------- 畫面：節氣圖示貼在血條旁、荊棘地、槲寄生 ----------
function drawDruidHud(ctx, p) {
    const d = druidState();
    if (d.fest < 0) return;
    const icon = getIconImage(FESTIVALS[d.fest].icon);
    if (!icon) return;
    const s = 14, x = p.pos.x + 22, y = p.pos.y + p.imageHeight * 0.5 - 4;
    ctx.drawImage(icon, x, y, s, s);
}
function drawDruidWorld(ctx) {
    const d = druidState();
    drawGroveBears(ctx);
    if (d.patches.length) {
        ctx.save();
        ctx.strokeStyle = '#689F38'; ctx.lineWidth = 2; ctx.lineCap = 'round';
        for (const t of d.patches) {
            if (!inView(t)) continue;
            ctx.globalAlpha = Math.min(0.7, t.life);
            for (let i = 0; i < 7; i++) {
                const a = i * 2.39, r = t.r * (0.3 + (i % 3) * 0.25);
                const x = t.x + Math.cos(a) * r, y = t.y + Math.sin(a) * r * 0.6;
                ctx.beginPath(); ctx.moveTo(x - 3, y + 2); ctx.lineTo(x, y - 6); ctx.lineTo(x + 3, y + 2); ctx.stroke();
            }
        }
        ctx.restore();
    }
    const mist = getIconImage('goldenSickle');
    for (const k of d.sickles) {
        if (!inView(k) || !mist) continue;
        const bob = Math.sin(worldTime * 4 + k.x) * 2;
        ctx.drawImage(getGlowSprite('#FFF59D'), k.x - 16, k.y - 16 + bob, 32, 32);
        ctx.drawImage(mist, k.x - 9, k.y - 9 + bob, 18, 18);
    }
}

// ---------- 傳說「狼母」：成狼生小狼 ----------
function birthPup(w) {
    w.birthed = true;
    spawnPup(w.pos, '狼母');
}
// 一隻不佔林地的小狼（狼母、狩獵之月）
function spawnPup(at, label) {
    const p = gameState.player;
    const pup = new Wolf(at.x + randomInRange(-10, 10), at.y + randomInRange(4, 12), gameState.units.Wolf.level, p);
    pup.pup = true;
    pup.refreshStats();
    pup.currentHealth = pup.maxHealth;
    gameState.summons.push(pup);
    spawnParticles(pup.pos.x, pup.pos.y, PUP_TINT, 10, 50, 0.5, 3);
    spawnParticles(pup.pos.x, pup.pos.y, '#C5E1A5', 8, 40, 0.6, 2);
    addWorldFx({ kind: 'ring', x: pup.pos.x, y: pup.pos.y, r0: 6, r1: 34, life: 0.45, color: '#C5E1A5', width: 4 });
    if (inView(pup.pos) && label) spawnFloatText(pup.pos.x, pup.pos.y - 22, label, '#ECEFF1', 12, 1.0, label === '狼母' ? 'wolfMother' : 'huntMoon');
}

// ---------- 傳說「綠人」：被纏住的怪倒下，種子往旁邊迸 ----------
function greenManBurst(m) {
    const d = druidState();
    if (d.greenLive >= GREEN_MAN_MAX_LIVE) return;
    const near = [], rSq = GREEN_MAN_REACH * GREEN_MAN_REACH;
    monsterGrid.forEachInRadius(m.pos, GREEN_MAN_REACH, o => { if (o !== m && o.isAlive && !o.stealthed && distanceSq(o.pos, m.pos) <= rSq) near.push(o); });
    near.sort((a, b) => distanceSq(a.pos, m.pos) - distanceSq(b.pos, m.pos));
    const dmg = seedDamage() * GREEN_MAN_SHARE, radius = DRUID.seed.radius * (1 + blessVal('seedRadius'));
    for (let i = 0; i < GREEN_MAN_SEEDS && d.greenLive < GREEN_MAN_MAX_LIVE; i++) {
        const a = Math.random() * Math.PI * 2;
        const to = near[i] ? { x: near[i].pos.x, y: near[i].pos.y } : { x: m.pos.x + Math.cos(a) * GREEN_MAN_REACH * 0.6, y: m.pos.y + Math.sin(a) * GREEN_MAN_REACH * 0.6 };
        const fx = new SeedEffect(m.pos, to, dmg, radius);
        fx.green = true;
        d.greenLive++;
        gameState.visualEffects.push(fx);
    }
    if (inView(m.pos)) gameState.visualEffects.push(new GreenBurstEffect(m.pos));
}
// 倒下的地方冒出一株兩片葉的新芽，一圈葉子往外翻飛
const LEAF_GREEN = '#7CB342', LEAF_LIGHT = '#C5E1A5', GREEN_BURST_LEAVES = 7;
function drawLeaf(ctx, x, y, a, s) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(0, -4.5, 5, 0); ctx.quadraticCurveTo(0, 4.5, -5, 0); ctx.closePath();
    ctx.fillStyle = LEAF_GREEN; ctx.fill();
    ctx.strokeStyle = SHAPE_OUTLINE; ctx.lineWidth = 1.2 / s; ctx.stroke();
    ctx.strokeStyle = LEAF_LIGHT; ctx.lineWidth = 0.8 / s;
    ctx.beginPath(); ctx.moveTo(-3.5, 0); ctx.lineTo(3.5, 0); ctx.stroke();
    ctx.restore();
}
class GreenBurstEffect extends TimedEffect {
    constructor(pos) { super({ x: pos.x, y: pos.y }, 0.6); this.spin = Math.random() * Math.PI * 2; }
    draw(ctx) {
        const k = 1 - this.life / this.duration, { x, y } = this.pos;
        ctx.save();
        ctx.globalAlpha = Math.min(1, this.life / 0.2);
        ctx.drawImage(getGlowSprite(LEAF_LIGHT), x - 26, y - 26, 52, 52);
        // 新芽：莖往上長，頂端兩片葉子張開
        const h = 18 * Math.min(1, k * 3);
        ctx.strokeStyle = SHAPE_OUTLINE; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.lineTo(x, y + 6 - h); ctx.stroke();
        ctx.strokeStyle = '#558B2F'; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.lineTo(x, y + 6 - h); ctx.stroke();
        const open = Math.min(1, k * 3);
        drawLeaf(ctx, x - 8 * open, y + 6 - h, -0.5, 1.6 * open + 0.1);
        drawLeaf(ctx, x + 8 * open, y + 6 - h, Math.PI + 0.5, 1.6 * open + 0.1);
        // 往外翻飛的葉子
        for (let i = 0; i < GREEN_BURST_LEAVES; i++) {
            const a = this.spin + i * Math.PI * 2 / GREEN_BURST_LEAVES, r = 10 + 40 * k;
            drawLeaf(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7 - 8 * Math.sin(k * Math.PI), a + k * 6, 1.4);
        }
        ctx.restore();
    }
}

// ---------- 傳說「巨石陣」：換節氣時腳下立起一圈巨石 ----------
// 畫在地面那一層（人、怪站在石頭前面會擋住石頭）。站在圈裡時石頭與地上的圈泛金光
const HENGE_GOLD = '#FFE082', HENGE_STONE = '#8E8A84', HENGE_STONE_DARK = '#6E6A65', HENGE_STONE_LIGHT = '#B5B0A8', HENGE_CRACK = '#4E4A46', HENGE_MOSS = '#689F38';
const HENGE_STONE_W = 15, HENGE_STONE_H = 30;
const HENGE_SHAPES = [
    { w: 1, h: 1, lean: 0, bump: 1, chip: 2, crack: 3 }, { w: 0.85, h: 0.8, lean: 1.5, bump: -1, chip: 0, crack: -2 },
    { w: 1.1, h: 1.1, lean: -1, bump: 2, chip: 3, crack: 1 }, { w: 0.9, h: 0.9, lean: 0.5, bump: 0, chip: 1, crack: -3 },
];
function drawStonehenge(ctx) {
    const h = druidState().henge;
    if (!h || !bl('stonehenge')) return;
    const rise = Math.min(1, h.t / HENGE_RISE), inside = inHenge(), pulse = 0.5 + 0.5 * Math.sin(worldTime * 4);
    ctx.save();
    ctx.globalAlpha = inside ? 0.55 + 0.25 * pulse : 0.3;
    ctx.strokeStyle = HENGE_GOLD; ctx.lineWidth = inside ? 4 : 2.5;
    ctx.setLineDash([10, 8]);
    ctx.beginPath(); ctx.arc(h.x, h.y, HENGE_RADIUS, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    if (inside) {
        ctx.globalAlpha = 0.12 + 0.06 * pulse;
        ctx.fillStyle = HENGE_GOLD;
        ctx.beginPath(); ctx.arc(h.x, h.y, HENGE_RADIUS, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    const stones = [];
    for (let i = 0; i < HENGE_STONES; i++) { const a = i * Math.PI * 2 / HENGE_STONES; stones.push({ i, x: h.x + Math.cos(a) * HENGE_RADIUS, y: h.y + Math.sin(a) * HENGE_RADIUS }); }
    stones.sort((a, b) => a.y - b.y);
    for (const s of stones) {
        // 每塊石頭高矮、歪斜、輪廓的凹凸都不一樣（照編號固定，不會每格亂跳）
        const v = HENGE_SHAPES[s.i % HENGE_SHAPES.length], w = HENGE_STONE_W * v.w, sh = HENGE_STONE_H * v.h * rise;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath(); ctx.ellipse(s.x, s.y + 2, w * 0.75, 3.5, 0, 0, Math.PI * 2); ctx.fill();
        if (sh < 2) continue;
        const L = s.x - w / 2, R = s.x + w / 2, top = s.y - sh, tl = s.x - w * 0.38 + v.lean, tr = s.x + w * 0.4 + v.lean;
        const outline = () => {
            ctx.beginPath();
            ctx.moveTo(L, s.y); ctx.lineTo(L + v.bump, s.y - sh * 0.45); ctx.lineTo(tl, top + 3);
            ctx.lineTo(s.x + v.lean - 1, top); ctx.lineTo(tr, top + 2 + v.chip); ctx.lineTo(R - v.bump * 0.5, s.y - sh * 0.55); ctx.lineTo(R, s.y); ctx.closePath();
        };
        outline(); ctx.fillStyle = HENGE_STONE; ctx.fill();
        // 右半暗面、左緣亮面
        ctx.save(); outline(); ctx.clip();
        ctx.fillStyle = HENGE_STONE_DARK; ctx.fillRect(s.x + w * 0.08 + v.lean * 0.5, top - 2, w, sh + 4);
        ctx.fillStyle = HENGE_STONE_LIGHT; ctx.fillRect(L, top - 2, w * 0.22, sh + 4);
        ctx.restore();
        outline(); ctx.strokeStyle = SHAPE_OUTLINE; ctx.lineWidth = 2; ctx.stroke();
        // 裂紋
        ctx.strokeStyle = HENGE_CRACK; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(s.x + v.crack, top + sh * 0.2); ctx.lineTo(s.x + v.crack - 2, top + sh * 0.38); ctx.lineTo(s.x + v.crack + 1, top + sh * 0.5); ctx.stroke();
        // 底部一撮青苔
        ctx.fillStyle = HENGE_MOSS;
        ctx.beginPath(); ctx.ellipse(s.x - w * 0.12, s.y - 2, w * 0.4, 2.6, 0, 0, Math.PI * 2); ctx.fill();
        // 刻在石上的符紋：站在圈裡時亮成金色
        ctx.strokeStyle = inside ? HENGE_GOLD : HENGE_CRACK; ctx.lineWidth = inside ? 2 : 1.4;
        ctx.beginPath();
        ctx.moveTo(s.x - 1, top + sh * 0.55); ctx.lineTo(s.x - 1, top + sh * 0.85);
        ctx.moveTo(s.x - 4, top + sh * 0.6); ctx.lineTo(s.x - 1, top + sh * 0.7); ctx.lineTo(s.x + 2, top + sh * 0.6);
        ctx.stroke();
    }
    ctx.restore();
}

// ---------- 雙流派「熊之林」：站在橡樹旁的熊比較硬 ----------
function bearInGrove(b) {
    if (!bl('groveBears')) return false;
    const rSq = GROVE_BEAR_RADIUS * GROVE_BEAR_RADIUS;
    for (const s of gameState.summons) if (s.isAlive && s instanceof SacredOak && distanceSq(s.pos, b.pos) <= rSq) return true;
    return false;
}
// 受到庇護的熊腳下一圈繞著轉的葉子
function drawGroveBears(ctx) {
    if (!bl('groveBears')) return;
    for (const b of gameState.summons) {
        if (!b.isAlive || !(b instanceof Bear) || !inView(b.pos) || !bearInGrove(b)) continue;
        const y = b.pos.y + b.imageHeight * 0.3, r = b.radius * 1.6;
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = LEAF_GREEN; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(b.pos.x, y, r, r * 0.4, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
        for (let i = 0; i < 4; i++) { const a = worldTime * 2 + i * Math.PI / 2; drawLeaf(ctx, b.pos.x + Math.cos(a) * r, y + Math.sin(a) * r * 0.4, a + Math.PI / 2, 0.9); }
        ctx.restore();
    }
}
// ---------- 雙流派「荊棘狼」：狼咬到的怪被藤蔓纏住 ----------
function thornSnare(m) {
    if (!m.isAlive) return;
    const fresh = !(m.rootedUntil > worldTime);
    m.applySlow(DRUID.seed.root, THORN_WOLF_ROOT);
    m.rootedUntil = Math.max(m.rootedUntil || 0, worldTime + THORN_WOLF_ROOT);
    if (fresh && inView(m.pos) && gameState.visualEffects.length < ambientEffectCap()) gameState.visualEffects.push(new VineSnareEffect(m));
}
// 幾條藤從怪腳下竄起、纏上牠的腳（跟著怪走），時間到縮回去
class VineSnareEffect extends TimedEffect {
    constructor(m) { super(m.pos, THORN_WOLF_ROOT); this.m = m; }
    draw(ctx) {
        const m = this.m, k = 1 - this.life / this.duration, grow = Math.min(1, k * 4), x = m.pos.x, y = m.pos.y + m.radius * 0.6;
        ctx.save();
        ctx.globalAlpha = k < 0.75 ? 1 : (1 - k) / 0.25;
        ctx.lineCap = 'round';
        for (const [col, lw] of [[SHAPE_OUTLINE, 4.5], ['#7CB342', 2.4]]) {
            ctx.strokeStyle = col; ctx.lineWidth = lw;
            for (let i = 0; i < 4; i++) {
                const s = i < 2 ? -1 : 1, ox = s * (5 + (i % 2) * 6), h = (10 + (i % 2) * 6) * grow;
                ctx.beginPath(); ctx.moveTo(x + ox * 1.4, y + 2); ctx.quadraticCurveTo(x + ox * 1.6, y - h * 0.5, x + ox * 0.3, y - h); ctx.stroke();
            }
        }
        ctx.fillStyle = '#C5E1A5'; ctx.strokeStyle = SHAPE_OUTLINE; ctx.lineWidth = 1;
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + s * 9, y - 7 * grow); ctx.lineTo(x + s * 12, y - 10 * grow); ctx.lineTo(x + s * 8, y - 11 * grow); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        ctx.restore();
    }
}

// ---------- 橡樹 ----------
class SacredOak extends SummonUnit {
    constructor(x, y, level, p) {
        super(x, y, CONFIG.sacredOak, level, p);
        // seq：種下的順序（世界樹認「最老的那棵」、樹人錯開找目標的格數）
        this.seq = ++druidState().oakSeq;
        this.anchor = { x, y };
        this.age = 0;
        this.stage = 0;
        this.thornT = 0;
        this.syncStage();
        this.currentHealth = this.maxHealth;
    }
    grow(stages) {
        this.age = Math.min(DRUID.maxStage * DRUID.growEvery, (this.stage + stages) * DRUID.growEvery);
        this.syncStage();
    }
    syncStage() {
        const s = Math.min(DRUID.maxStage, Math.floor(this.age / DRUID.growEvery));
        if (s === this.stage && this._synced) return;
        const up = s > this.stage;
        this.stage = s;
        this._synced = true;
        this.refreshStats();
        if (up && gameState.player) spawnParticles(this.pos.x, this.pos.y - 10, '#C5E1A5', 14, 70, 0.6, 3);
    }
    get treant() { return res('grove') >= 2 && this.stage >= DRUID.maxStage; }
    computeStats() {
        super.computeStats();
        const k = 1 + (this.stage || 0) * DRUID.stageBonus;
        this.maxHealth = Math.round(this.maxHealth * k * (1 + blessVal('oakHp')));
        this.attack = this.config.treantAttack * (1 + this.level * this.config.upgradeBonus) * k;
        // 樹苗小、長大才高聳；樹人換成會走的那張圖
        this.drawScale = (0.55 + 0.17 * (this.stage || 0)) * (1 + CONFIG.evolution.sizeBonusPerTier * this.tier);
        const img = images[this.treant ? 'druid_treant' : 'sacred_oak'];
        if (img && this.image !== img) { this.image = img; this.imageHeight = this.imageWidth * img.naturalHeight / img.naturalWidth; this._spriteW = null; this._flashSprites = null; }
    }
    update(dt) {
        if (!this.isAlive) return;
        this.tickFlash(dt);
        const before = this.stage;
        this.age += dt * growthRate() * (this.tier >= 2 ? OAK_TIER2_GROWTH : 1);
        if (Math.floor(this.age / DRUID.growEvery) !== before && before < DRUID.maxStage) this.syncStage();
        // 一階起：身邊的野獸回血（再加上祝福「樹蔭」）
        const heal = (this.tier >= 1 ? OAK_TIER1_HEAL : 0) + blessVal('oakHeal');
        if (heal > 0) {
            const rSq = OAK_TIER1_RADIUS * OAK_TIER1_RADIUS;
            summonGrid.forEachInRadius(this.pos, OAK_TIER1_RADIUS, s => { if (s.isAlive && s instanceof Beast && distanceSq(s.pos, this.pos) <= rSq) s.currentHealth = Math.min(s.maxHealth, s.currentHealth + s.maxHealth * heal * dt); });
        }
        if (!this.treant) { this.pos.x = this.anchor.x; this.pos.y = this.anchor.y; return; }
        // 樹人：在自己的根附近找怪打，追太遠就走回去
        if (this.attackCooldown > 0) this.attackCooldown -= dt * (gameState.frenzyTimer > 0 ? CONFIG.nova.frenzyAttackRate : 1);
        if (this.target && (!this.target.isAlive || distanceSq(this.target.pos, this.anchor) > RES_TREANT_LEASH * RES_TREANT_LEASH)) this.target = null;
        if (!this.target && (frameNo + this.seq) % TARGET_SEARCH_FRAMES === 0) {
            const m = groundMonsterGrid.nearestShared(this.anchor, RES_TREANT_LEASH);
            this.target = m && m.isAlive ? m : null;
        }
        const goal = this.target ? this.target.pos : this.anchor;
        const dx = goal.x - this.pos.x, dy = goal.y - this.pos.y, dist = Math.hypot(dx, dy);
        const stop = this.target ? this.attackRange * 0.8 : 4;
        if (dist > stop) {
            const step = Math.min(dist - stop, this.moveSpeed * dt);
            this.pos.x += dx / dist * step; this.pos.y += dy / dist * step;
            if (Math.abs(dx) > 0.5) this.facingDirection = dx > 0 ? 1 : -1;
        }
        if (this.target && this.attackCooldown <= 0 && distanceSq(this.pos, this.target.pos) <= this.attackRangeSq) {
            this.target.takeDamage(this.attack);
            this.attackCooldown = 1 / this.attackSpeed;
            const fx = getVisualEffectFromPool(SlashEffect);
            if (fx) { fx.init(this.pos, this.target.pos); gameState.visualEffects.push(fx); }
        }
    }
    takeDamage(amount, source = null) {
        if (!this.isAlive) return;
        const k = res('grove') >= 1 ? RES_ROOTS_TAKEN : 1;
        this.attackedT = DRUID.attackedTime;
        if (this.tier >= 3 && source instanceof Monster && source.isAlive) source.takeDamage(amount * OAK_TIER3_THORNS);
        // 世界樹：最老的那棵不會死，在德魯伊腳邊重新長成樹苗（原地不死的話，怪會圍著它啃到這一波永遠打不完）
        if (bl('yggdrasil') && this.currentHealth - amount * k <= 0 && this === eldestOak() && gameState.player) {
            spawnParticles(this.pos.x, this.pos.y, '#C5E1A5', 20, 90, 0.7, 3);
            const p = gameState.player;
            this.anchor = { x: p.pos.x, y: p.pos.y }; this.pos.x = p.pos.x; this.pos.y = p.pos.y;
            this.age = 0; this.syncStage(); this.currentHealth = this.maxHealth;
            this.target = null;
            spawnFloatText(this.pos.x, this.pos.y - 30, '世界樹', '#C5E1A5', 13, 1.2, 'yggdrasil');
            return;
        }
        super.takeDamage(amount * k);
    }
    die() {
        if (!this.isAlive) return;
        this.isAlive = false;
        gameState.units.SacredOak.count--;
        druidState().oakLostThisWave = true;
        onSummonDeath(this);
        spawnParticles(this.pos.x, this.pos.y, '#8D6E63', 16, 80, 0.6, 3);
        updateUI();
    }
    drawHealthBar(ctx) {
        super.drawHealthBar(ctx);
        // 荊棘之冠：樹腳一圈刺
        if (res('wild') < 2) return;
        ctx.save();
        ctx.strokeStyle = 'rgba(124, 179, 66, 0.55)'; ctx.lineWidth = 2;
        ctx.setLineDash([3, 5]);
        ctx.beginPath(); ctx.ellipse(this.pos.x, this.pos.y + 10, RES_CROWN_RADIUS, RES_CROWN_RADIUS * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
    }
}
function eldestOak() {
    let best = null;
    for (const s of gameState.summons) if (s.isAlive && s instanceof SacredOak && (!best || s.seq < best.seq)) best = s;
    return best;
}

// ---------- 野獸 ----------
let beastSeq = 0;
class Beast extends SummonUnit {
    constructor(x, y, config, level, p) {
        // 跟隨、回防、傳送都以「家」為準（見 DRUID.homeRadius）
        super(x, y, config, level, druidState().home);
        this.uid = ++beastSeq;
        this.age = 0;
        this.stage = 0;
        this.slamT = BEAR_SLAM_EVERY;
        this.lastTarget = null;
    }
    grow(stages) {
        this.age = Math.min(DRUID.maxStage * DRUID.growEvery, ((this.stage || 0) + stages) * DRUID.growEvery);
        this.syncStage();
    }
    syncStage() {
        const s = Math.min(DRUID.maxStage, Math.floor(this.age / DRUID.growEvery));
        if (s === this.stage) return;
        this.stage = s;
        this.refreshStats();
    }
    computeStats() {
        super.computeStats();
        const type = this.config.type;
        const k = (1 + (this.stage || 0) * DRUID.stageBonus) * (this.king ? RES_KING_MULT : 1);
        this.maxHealth = Math.round(this.maxHealth * k * (type === 'Bear' ? 1 + blessVal('bearHide') : 1));
        this.attack *= k * (type === 'Wolf' ? 1 + blessVal('wolfFang') : 1 + blessVal('bearMaul'));
        if (type === 'Wolf') {
            const sp = 1 + blessVal('wolfSpeed');
            this.moveSpeed *= sp * (this.tier >= 1 ? WOLF_TIER1_SPEED : 1);
            this.attackSpeed *= sp;
        }
        this.drawScale = (0.85 + 0.08 * (this.stage || 0)) * (1 + CONFIG.evolution.sizeBonusPerTier * this.tier) * (this.king ? RES_KING_SCALE : 1) * (this.pup ? PUP_SCALE : 1);
        if (this.pup) { this.tint = PUP_TINT; this.tintStrength = PUP_TINT_STRENGTH; }
        if (this.king) { this.tint = '#FFD54F'; this.tintStrength = 0.35; }
        if (this.spirited) { this.tint = '#B388FF'; this.tintStrength = 0.5; }
    }
    update(dt, monsters, summons, player) {
        if (!this.isAlive) return;
        if (this.stage < DRUID.maxStage) {
            const before = Math.floor(this.age / DRUID.growEvery);
            this.age += dt * growthRate();
            if (Math.floor(this.age / DRUID.growEvery) !== before) this.syncStage();
        }
        super.update(dt, monsters, summons, player);
    }
    attackTarget() {
        const t = this.target;
        if (!t || !t.isAlive) return;
        const d = druidState(), type = this.config.type;
        let dmg = this.attack * groveMult(this.pos) * (1 + festivalStrength('beltane') * FEST_BELTANE_DMG);
        if (type === 'Wolf') {
            let pack = 0;
            if (bl('packHunt')) summonGrid.forEachInRadius(this.pos, 60, s => { if (s !== this && s.isAlive && s instanceof Wolf) pack++; });
            dmg *= 1 + pack * blessVal('packHunt');
            if (this.tier >= 2 && t !== this.lastTarget) dmg *= WOLF_TIER2_POUNCE;
            if (Math.random() < blessVal('wolfCrit')) dmg *= 2;
            if (bl('thornWolves') && !(t instanceof BossMonster) && !t.isElite) thornSnare(t);
        } else if (d.bearT > 0 && res('bear') >= 2) dmg *= RES_BEARSPIRIT_MULT;
        this.lastTarget = t;
        const bites = type === 'Wolf' && this.tier >= 3 ? 2 : 1;
        for (let i = 0; i < bites; i++) t.takeDamage(dmg);
        this.healFromDamage(dmg);
        if (type === 'Bear') {
            if (bl('bearStun') && t.isAlive) t.applySlow(blessVal('bearStun'), 0.8);
            if (this.tier >= 2) {
                const rSq = BEAR_CLEAVE_RADIUS * BEAR_CLEAVE_RADIUS;
                groundMonsterGrid.forEachInRadius(t.pos, BEAR_CLEAVE_RADIUS, m => { if (m !== t && m.isAlive && distanceSq(m.pos, t.pos) <= rSq) m.takeDamage(dmg * BEAR_CLEAVE_SHARE); });
            }
        }
        if (festivalStrength('beltane') > 0 && Math.random() < 0.3) spawnParticles(t.pos.x, t.pos.y, '#FF7043', 3, 40, 0.35, 2);
        const fx = getVisualEffectFromPool(SlashEffect);
        if (fx) { fx.init(this.pos, t.pos); gameState.visualEffects.push(fx); }
        let rate = 1;
        if (type === 'Wolf') {
            if (d.howlT > 0) rate *= RES_HOWL_RATE;
            if (res('pack') >= 2 && !this.king && summonGrid.forEachInRadius(this.pos, RES_KING_RADIUS, s => s.isAlive && s.king)) rate *= RES_KING_RATE;
        }
        this.attackCooldown = 1 / (this.attackSpeed * rate);
        // 三階熊：定時震地
        if (type === 'Bear' && this.tier >= 3) {
            this.slamT -= 1 / this.attackSpeed;
            if (this.slamT <= 0) {
                this.slamT = BEAR_SLAM_EVERY;
                const rSq = BEAR_SLAM_RADIUS * BEAR_SLAM_RADIUS;
                groundMonsterGrid.forEachInRadius(this.pos, BEAR_SLAM_RADIUS, m => {
                    if (!m.isAlive || distanceSq(m.pos, this.pos) > rSq) return;
                    m.takeDamage(dmg * BEAR_SLAM_MULT);
                    if (m.isAlive) m.applySlow(BEAR_SLAM_SLOW, BEAR_SLAM_SLOW_TIME);
                });
                spawnParticles(this.pos.x, this.pos.y + 8, '#A1887F', 12, 90, 0.5, 3);
            }
        }
    }
    takeDamage(amount, source = null) {
        if (!this.isAlive) return;
        super.takeDamage(amount * (this.config.type === 'Bear' && this.tier >= 1 ? BEAR_TIER1_TAKEN : 1) * (this.config.type === 'Bear' && bearInGrove(this) ? GROVE_BEAR_TAKEN : 1));
    }
    die() {
        if (!this.isAlive) return;
        // 亡者之夜：倒下時化成狼魂再戰一次
        if (festivalStrength('samhain') > 0 && !this.spirited) {
            this.spirited = true;
            this.refreshStats();
            this.currentHealth = Math.round(this.maxHealth * Math.min(1, FEST_SAMHAIN_HP * festivalStrength('samhain')));
            spawnParticles(this.pos.x, this.pos.y, '#B388FF', 12, 70, 0.6, 3);
            return;
        }
        this.isAlive = false;
        if (!this.pup) gameState.units[this.config.type].count--;
        if (this.config.type === 'Bear' && bl('whiteBull') && druidState().boostWave !== gameState.currentWave) {
            druidState().boostWave = gameState.currentWave;
            spawnFloatText(this.pos.x, this.pos.y - 24, '白牛獻祭', '#FFF8E1', 14, 1.4, 'whiteBull');
        }
        onSummonDeath(this);
        spawnParticles(this.pos.x, this.pos.y, '#8D6E63', 10, 70, 0.45);
        updateUI();
    }
}
class Wolf extends Beast { constructor(x, y, level, p) { super(x, y, CONFIG.wolf, level, p); } }
class Bear extends Beast { constructor(x, y, level, p) { super(x, y, CONFIG.bear, level, p); } }
