// 刺客 · 阿拉穆特之影（規劃見 docs/characters.md 第 4 節）
// 核心是「暗殺目標」：場上最有威脅的那隻怪被標成目標（邊緣有箭頭指著）。怪照常衝著刺客來，飛刀一次射好幾隻清身邊的雜兵，
// 同時優先射目標；殺掉目標拿賞金、牠身邊的怪潰散逃跑，刺客隱身幾秒，下一把射向新目標的飛刀是伏擊 ×4。
// 節奏：殺進怪堆 → 刺殺目標 → 消失換位置 → 伏擊下一個目標。隱身是殺出來的獎勵，不是常態（常態隱身的話怪都不理刺客，只能自己一隻隻去找）。
// 血掉很低時自動遁形一次（有冷卻），讓脆皮的刺客敢鑽進怪堆；血量很低的怪直接處決。
// 典故：十一世紀以阿拉穆特堡為據點的尼查里派「哈薩辛」，潛伏的菲達伊專門刺殺掌權者，以少擊眾。
// 這個檔在 game.js 之後載入，用的是 game.js 的全域；game.js 的 init 等所有腳本載完才跑

const ROGUE = {
    baseHealth: 80,
    moveSpeed: 108,
    // 飛刀：一次射 count 隻（射程內的目標優先，其餘挑最近的）。怪會湧上來，一把一把丟清不動
    knife: { interval: 0.6, range: 190, damage: 6, count: 3 },
    // 隱身：殺掉目標隱身 killHide 秒；血掉到 panicHp 以下自動遁形 panicHide 秒，冷卻 panicCd 秒。
    // 隱身中怪看不到你、移速 +hideSpeed；伏擊＝下一把射向目標的飛刀 ×ambushMult（現身後還留著，直到射出去）
    killHide: 2.5, panicHp: 0.35, panicHide: 2, panicCd: 20, hideSpeed: 0.2, ambushMult: 4,
    // 隱身時每秒回最大血量的 hideRegen
    hideRegen: 0.03,
    // 每修練一次任何一張卡，最大血量 +基礎血量的 trainHp：刺客要鑽進怪堆，怪的攻擊指數成長，血不跟著長的話後期一刀就倒
    trainHp: 0.12,
    // 處決：血量低於 execute 的怪（首領除外）被飛刀打中直接處決
    execute: 0.2,
    // 雜兵只給 trashSouls 的靈魂；目標的賞金＝上一個目標之後打倒的雜兵「原本該給的」靈魂 × bountyShare（至少 bountyMin）
    // 雜兵照常會湧上來被清掉，大部分收入還是雜兵；目標是額外的大獎，不殺也活得下去、殺了賺比較多
    trashSouls: 0.8, bountyShare: 0.6, bountyMin: 15,
    // 目標死時，身邊 fearRadius 內的怪逃跑 fearTime 秒；下一個目標隔 markDelay 秒才標（隱身是獎勵不是常態：一輪大約十秒，隱身佔兩三成）
    fearRadius: 150, fearTime: 3, markDelay: 6,
    // 大招「斬首」：瞬移到目標身邊連斬 hits 下；沒有目標就斬最近的幾隻。斬完隱身 hide 秒脫身
    behead: { cooldown: 18, hits: 5, damage: 14, fallback: 8, hide: 1.5 },
};

OPTIONAL_ART.rogue = 'rogue.png';

// 飛刀、毒：只修練；影：召喚會消失的分身
CONFIG.knives = { type: 'Knives', upgradeBonus: 0.15, summonCost: 0, upgradeCostBase: 20, upgradeCostInc: 9 };
CONFIG.venom = { type: 'Venom', upgradeBonus: 0.25, summonCost: 0, upgradeCostBase: 22, upgradeCostInc: 10 };
CONFIG.shadowClone = {
    type: 'Shadow', imageName: 'rogue', color: '#4527A0', radius: 11, imgScaleMultiplier: 3.3,
    baseHealth: 60, baseAttack: 12, attackRange: 24, attackSpeed: 1.5, moveSpeed: 150, upgradeBonus: 0.3,
    targetSearchRadius: 200, returnDistance: 50, avoidanceRadius: 13, avoidanceForce: 100, playerAvoidanceForce: 40,
    wanderRadius: 20, wanderSpeedFactor: 0.3, wanderIntervalMin: 2, wanderIntervalMax: 4,
    summonCost: 8, upgradeCostBase: 26, upgradeCostInc: 11,
};
// 暗殺標記、爆擊、斬殺用金色：紅色是警示色，敵人頭上掛紅圈會看成「這隻很危險」而不是「這是你的目標」
const ROGUE_MARK_COLOR = '#FFD740';
// 影子存在幾秒、上限（每 capPerLevels 級多一個）
const SHADOW_LIFE = 20, SHADOW_CAP = 3, SHADOW_CAP_PER_LEVELS = 10;
// 毒：每層每秒傷害（跟著波數）、一層持續幾秒、最多幾層
const POISON = { dps: 1.2, time: 3, maxStacks: 5, tick: 0.5 };

Object.assign(CONFIG.evolution.names, {
    Knives: ['飛刀手', '雙刀', '千刃'],
    Venom: ['毒師', '蛇毒', '黑死之觸'],
    Shadow: ['殘影', '暗影', '無面者'],
});
Object.assign(CONFIG.evolution.perks, {
    Knives: ['每次多丟一把', '飛刀彈到附近一隻', '處決門檻 +10%'],
    Venom: ['毒層上限 +3', '中毒的怪攻擊力 -25%', '毒死的怪炸出毒霧'],
    Shadow: ['影子存在時間加倍', '影子的攻擊也會上毒', '影子消失時伏擊身邊的怪'],
});
const KNIVES_TIER3_EXECUTE = 0.1, VENOM_TIER1_STACKS = 3, VENOM_CLOUD_RADIUS = 50;
// 中毒看得出來：怪身上蓋一層綠光（層數越多越濃）、頭上冒毒泡（最多 POISON_BUBBLES 顆）、毒死爆一團綠霧
const POISON_GREEN = '#76FF03', POISON_BUBBLE = '#CCFF90', POISON_BUBBLE_EDGE = '#1B5E20';
const POISON_GLOW_BASE = 0.35, POISON_GLOW_PER_STACK = 0.07, POISON_GLOW_MAX = 0.75, POISON_GLOW_SIZE = 1.4;  // 大小 × 圖寬
const POISON_BUBBLES = 3, POISON_BUBBLE_RISE = 22, POISON_BUBBLE_SPEED = 0.9;
const POISON_HIT_SPARKS = 3, POISON_DEATH_PUFF = 10;

// ---------- 五個流派：各 4 張祝福，3 層與 6 層各一段共鳴；3 張專屬傳說。圖示名稱 = 祝福 id（icons.js） ----------
Object.assign(SCHOOLS, {
    assassination: { name: '暗殺', icon: 'assassination', color: '#FFE57F', res: [{ name: '標記', desc: '目標受到的傷害 +30%' }, { name: '死亡宣告', desc: '同時多標一個目標' }] },
    venomschool: { name: '劇毒', icon: 'venomschool', color: '#AED581', res: [{ name: '腐蝕', desc: '中毒的怪受到的傷害 +20%' }, { name: '瘟疫之刃', desc: '毒傷也會爆擊' }] },
    shadowschool: { name: '影', img: 'rogue.png', color: '#B39DDB', res: [{ name: '影襲', desc: '每次隱身都多一個影子' }, { name: '千面', desc: '處決時留下一個影子' }] },
    smoke: { name: '煙霧', icon: 'smoke', color: '#B0BEC5', res: [{ name: '煙幕', desc: '隱身時放出一團煙，煙裡的怪緩速、看不到你' }, { name: '迷蹤', desc: '被打中時 30% 隱身 1.5 秒（8 秒一次）' }] },
    intel: { name: '情報', icon: 'intel', color: '#FFE082', res: [{ name: '線人網', desc: '目標優先標精英' }, { name: '鷹巢', desc: '每波第一個目標倒下時，多一次祝福' }] },
});
Object.assign(BLESSINGS, {
    critChance: { school: 'assassination', name: '要害', max: 3, per: 0.08, desc: b => `飛刀 ${pct(b.per)} 機率爆擊（×2）` },
    critDamage: { school: 'assassination', name: '致命', max: 3, per: 0.5, desc: b => `爆擊與伏擊傷害 +${pct(b.per)}` },
    executeUp: { school: 'assassination', name: '收割', max: 3, per: 0.05, desc: b => `處決門檻 +${pct(b.per)}` },
    ambushPower: { school: 'assassination', name: '暗刃', max: 3, per: 1, desc: b => `伏擊多打 ${b.per} 倍` },
    poisonStacks: { school: 'venomschool', name: '層層疊毒', max: 3, per: 2, desc: b => `毒層上限 +${b.per}` },
    poisonPower: { school: 'venomschool', name: '烈毒', max: 5, per: 0.35, desc: b => `毒傷 +${pct(b.per)}` },
    poisonSpread: { school: 'venomschool', name: '傳染', max: 2, per: 1, desc: b => `毒死的怪把毒傳給身邊 ${b.per} 隻` },
    poisonSlow: { school: 'venomschool', name: '麻痺', max: 3, per: 0.15, desc: b => `中毒的怪緩速 ${pct(b.per)}` },
    shadowCap: { school: 'shadowschool', name: '分身術', max: 3, per: 1, desc: b => `影子上限 +${b.per}` },
    shadowTime: { school: 'shadowschool', name: '長影', max: 3, per: 4, desc: b => `影子多存在 ${b.per} 秒` },
    shadowPower: { school: 'shadowschool', name: '影刃', max: 5, per: 0.3, desc: b => `影子傷害 +${pct(b.per)}` },
    shadowStrike: { school: 'shadowschool', name: '影殺', max: 2, per: 1, desc: b => `影子的第一擊多打 ${b.per * 2} 倍` },
    smokeBomb: { school: 'smoke', name: '煙霧彈', max: 2, per: 1, desc: () => '一下被打掉 10% 以上的血時放出一團煙' },
    dodge: { school: 'smoke', name: '身法', max: 3, per: 0.08, desc: b => `${pct(b.per)} 機率閃過攻擊` },
    quickHide: { school: 'smoke', name: '遁形', max: 3, per: 4, desc: b => `危急遁形的冷卻 -${b.per} 秒` },
    longHide: { school: 'smoke', name: '藏鋒', max: 3, per: 0.5, desc: b => `每次隱身多 ${b.per} 秒` },
    bounty: { school: 'intel', name: '懸賞', max: 3, per: 0.3, desc: b => `目標的賞金 +${pct(b.per)}` },
    earlyMark: { school: 'intel', name: '眼線', max: 1, per: 360, desc: () => '目標挑你身邊的怪標，不用跑去找' },
    trashLoot: { school: 'intel', name: '順手牽羊', max: 3, per: 0.15, desc: b => `雜兵的靈魂 +${pct(b.per)}` },
    spoils: { school: 'intel', name: '戰利品', max: 2, per: 0.08, desc: b => `目標倒下時你回 ${pct(b.per)} 血` },
    oldMan: { school: 'intel', name: '山中老人', legendary: true, max: 1, per: 3, desc: b => `目標倒下時，牠身邊 ${b.per} 隻怪倒戈成為你的影子` },
    pillowDagger: { school: 'assassination', name: '枕邊匕首', legendary: true, max: 1, per: 160, desc: () => '目標被標記的那一刻起，牠身邊的怪攻擊力下降' },
    fidai: { school: 'smoke', name: '菲達伊', legendary: true, max: 1, per: 0.5, desc: b => `隱身時移速 +${pct(b.per)}，隱身中的飛刀傷害 ×${FIDAI_KNIFE}` },
});
const RES_MARKED_TAKEN = 1.3;
// 菲達伊：隱身中的飛刀都乘這個（不延長隱身：隱身時間疊太長，怪又都不理刺客了）
const FIDAI_KNIFE = 2;
const RES_CORRODE_TAKEN = 1.2;
const RES_VANISH_CHANCE = 0.3, RES_VANISH_TIME = 1.5, RES_VANISH_CD = 8;
const SMOKE_RADIUS = 70, SMOKE_TIME = 4, SMOKE_SLOW = 0.5, SMOKE_HIT = 0.1;
const DAGGER_EVERY = 1;
const ROGUE_ACHV = { targets: 100, waveTargets: 5, shadows: 6 };
// 目標優先：首領 > 精英 > 這幾種會幫別人的怪 > 血最多的
const TARGET_PRIORITY = { WitchDoctor: 1, GravePriest: 1, Tombstone: 1, Assassin: 1 };

Object.assign(UNIT_TYPES, {
    Knives: { cfg: () => CONFIG.knives, Cls: () => null, name: '飛刀', img: iconDataUrl('critChance'), upgradeOnly: true, upgradeLabel: '修練' },
    Venom: { cfg: () => CONFIG.venom, Cls: () => null, name: '毒', img: iconDataUrl('venomschool'), upgradeOnly: true, upgradeLabel: '修練' },
    Shadow: {
        cfg: () => CONFIG.shadowClone, Cls: () => ShadowClone, name: '影', img: 'rogue.png', summonLabel: '分身',
        cap: () => SHADOW_CAP + Math.floor(gameState.units.Shadow.level / SHADOW_CAP_PER_LEVELS) + blessVal('shadowCap'),
    },
});

CLASSES.rogue = {
    name: '刺客', title: '阿拉穆特之影', portrait: 'rogue.png', tagline: '潛進怪堆，刺殺標記的目標',
    unlock: 'elite500',
    cards: ['Knives', 'Venom', 'Shadow'], schools: ['assassination', 'venomschool', 'shadowschool', 'smoke', 'intel', 'soul'],
    metaUpgrades: {
        longHide: { icon: 'longHide', name: '影之修練', max: 5, per: 0.4, costBase: 30, desc: m => `每次隱身 +${m.per} 秒`, total: (m, lv) => `+${(m.per * lv).toFixed(1)} 秒` },
        ambushPower: { icon: 'ambushPower', name: '致命一擊', max: 5, per: 0.3, costBase: 30, desc: m => `伏擊多打 ${m.per} 倍`, total: (m, lv) => `+${(m.per * lv).toFixed(1)} 倍` },
        executeUp: { icon: 'executeUp', name: '斷頭台', max: 5, per: 0.02, costBase: 35, desc: m => `處決門檻 +${pct(m.per)}`, total: (m, lv) => `+${pct(m.per * lv)}` },
    },
    hero: { imageName: 'rogue', baseHealth: ROGUE.baseHealth, moveSpeed: ROGUE.moveSpeed },
    attack: (p, dt) => rogueKnives(p, dt),
    update: (dt) => rogueUpdate(dt),
    reset: () => { gameState.rogue = newRogueState(); },
    heroHidden: () => rogueState().hideT > 0 || inSmoke(gameState.player.pos),
    onUpgrade: () => {
        const p = gameState.player, gain = Math.max(1, Math.round(ROGUE.baseHealth * ROGUE.trainHp));
        p.maxHealth += gain;
        p.currentHealth += gain;
    },
    heroSpeedMult: () => rogueState().hideT > 0 ? 1 + ROGUE.hideSpeed + (bl('fidai') ? BLESSINGS.fidai.per : 0) : 1,
    heroAlpha: () => rogueState().hideT > 0 ? 0.45 : 1,
    drawHeroUnder: (ctx, p) => drawRogueStealthGround(ctx, p),
    heroDamageTakenMult: () => {
        if (Math.random() < blessVal('dodge')) { const p = gameState.player; spawnFloatText(p.pos.x, p.pos.y - 30, '閃', '#B0BEC5', 12, 0.5); return 0; }
        return 1;
    },
    // 被打不會打斷隱身（隱身是殺出來的獎勵，時間到才現身）。血掉到三成半以下自動遁形；煙霧共鳴「迷蹤」被打中有機會隱身
    onHeroHurt: (lostFrac) => {
        const r = rogueState(), p = gameState.player;
        if (p.isAlive && p.currentHealth < p.maxHealth * ROGUE.panicHp && r.panicT <= 0) {
            r.panicT = Math.max(4, ROGUE.panicCd - blessVal('quickHide'));
            enterHide(ROGUE.panicHide, '遁形');
        }
        else if (res('smoke') >= 2 && r.vanishT <= 0 && Math.random() < RES_VANISH_CHANCE) { r.vanishT = RES_VANISH_CD; enterHide(RES_VANISH_TIME); }
        if (bl('smokeBomb') && lostFrac >= SMOKE_HIT) r.smokes.push({ x: p.pos.x, y: p.pos.y, life: SMOKE_TIME * bl('smokeBomb') });
    },
    soulMult: (m) => {
        const r = rogueState();
        if (r.targets.includes(m)) return 0;
        r.trashValue += m.soulValue();
        return ROGUE.trashSouls * (1 + blessVal('trashLoot'));
    },
    onMonsterKill: (m) => { if (rogueState().targets.includes(m)) targetDown(m); },
    onWaveStart: () => { const r = rogueState(); r.markT = 0; r.waveTargets = 0; r.firstTargetThisWave = true; },
    relicChannelMult: () => rogueState().hideT > 0 ? RELIC_STEALTH_CHANNEL : 1,
    // 封印寶棺開出「情報」：下一個目標賞金加倍（原本的靈魂照給）
    onRelic: (r) => {
        if (r.kind === 'coffin') { rogueState().intelBonus = true; spawnFloatText(r.x, r.y - 52, '情報：下一個目標賞金加倍', '#FFE082', 14, 1.6, 'intel'); }
        return false;
    },
    drawHero: (ctx, p) => drawRogueHud(ctx, p),
    drawWorld: (ctx) => drawRogueWorld(ctx),
    drawScreen: (ctx) => drawTargetPointers(ctx),
    saveExtra: () => ({ trashValue: rogueState().trashValue }),
    loadExtra: (data) => { rogueState().trashValue = data.trashValue || 0; },
    achv: {
        win: '山中之王', speed: ['無聲', '暗流', '一瞬'],
        feats: [
            ['targets', '百人斬首', `累計刺殺 ${ROGUE_ACHV.targets} 個目標`, 60, () => (stats().rogueTargets || 0) >= ROGUE_ACHV.targets],
            ['executeElite', '處刑人', '處決一隻精英怪', 30, () => !!gameState.run.flags.rogueExecElite],
            ['oneShot', '一擊必殺', '一刀打倒滿血的目標', 50, () => !!gameState.run.flags.rogueOneShot],
            ['ghost', '來無影', `一波內刺殺 ${ROGUE_ACHV.waveTargets} 個目標`, 40, () => rogueState().waveTargets >= ROGUE_ACHV.waveTargets],
            ['shadows', '影武者', `同時有 ${ROGUE_ACHV.shadows} 個影子`, 50, () => gameState.units.Shadow.count >= ROGUE_ACHV.shadows],
        ],
    },
    ultimate: {
        name: '斬首', icon: 'behead', hint: '斬首：瞬移到目標身邊連斬',
        hintRadius: () => ROGUE.knife.range, cooldown: () => ROGUE.behead.cooldown, use: () => useBehead(),
    },
};
const RELIC_STEALTH_CHANNEL = 3;

// targets：目前標記的目標（共鳴「死亡宣告」時兩個）；markT：下一次標記還要等幾秒；trashValue：上一個目標之後雜兵原本該給的靈魂
function newRogueState() {
    return { targets: [], markT: 0, trashValue: 0, knifeT: 0, hideT: 0, hideMax: 1, panicT: 0, vanishT: 0, ambush: false, smokes: [], poisoned: [], poisonT: 0,
        daggerT: 0, waveTargets: 0, firstTargetThisWave: true, intelBonus: false };
}
function rogueState() { return gameState.rogue || (gameState.rogue = newRogueState()); }
function inSmoke(pos) { for (const s of rogueState().smokes) if (distanceSq(s, pos) <= SMOKE_RADIUS * SMOKE_RADIUS) return true; return false; }
function knifeDamage() {
    return ROGUE.knife.damage * getWaveStatMultiplier(Math.max(1, gameState.currentWave)) * runMods().boltDmgMult * (1 + gameState.units.Knives.level * CONFIG.knives.upgradeBonus);
}
// 隱身 dur 秒（藏鋒加秒）；已經在隱身就延長。剛消失的那一下：煙、「隱身」字、追著你的怪頭上冒問號
const STEALTH_COLOR = '#B39DDB', STEALTH_DARK = '#311B92', LOST_RADIUS = 280, LOST_MAX = 6;
function enterHide(dur, label = '隱身') {
    const r = rogueState(), p = gameState.player;
    const t = dur + blessVal('longHide') + classMeta('longHide');
    const fresh = r.hideT <= 0;
    r.hideT = Math.max(r.hideT, t);
    r.hideMax = r.hideT;
    r.ambush = true;
    if (!fresh) return;
    spawnParticles(p.pos.x, p.pos.y, '#7E57C2', 22, 110, 0.6, 4);
    spawnParticles(p.pos.x, p.pos.y, '#B0BEC5', 10, 60, 0.8, 5);
    spawnFloatText(p.pos.x, p.pos.y - 44, label, STEALTH_COLOR, 15, 1.1, 'smoke');
    Sfx.play('vanish');
    let lost = 0;
    monsterGrid.forEachInRadius(p.pos, LOST_RADIUS, m => {
        if (lost >= LOST_MAX || !m.isAlive || m.target !== p || m instanceof BossMonster) return;
        lost++;
        spawnFloatText(m.pos.x, m.pos.y - (m.imageHeight || 30) * 0.5 - 6, '?', '#ECEFF1', 16, 1.0);
    });
    if (res('smoke') >= 1) r.smokes.push({ x: p.pos.x, y: p.pos.y, life: SMOKE_TIME });
    if (res('shadowschool') >= 1) spawnShadow(p.pos.x, p.pos.y, gameState.units.Shadow.level, true);
}

// ---------- 每格：潛行、目標、毒、煙 ----------
function rogueUpdate(dt) {
    const r = rogueState(), p = gameState.player;
    if (!p) return;
    // 隱身：時間到現身（現身時一小團煙）；隱身中回血、身邊冒紫煙
    if (r.panicT > 0) r.panicT -= dt;
    if (r.vanishT > 0) r.vanishT -= dt;
    if (r.hideT > 0) {
        r.hideT -= dt;
        p.currentHealth = Math.min(p.maxHealth, p.currentHealth + p.maxHealth * ROGUE.hideRegen * dt);
        if (Math.random() < dt * 14) spawnParticles(p.pos.x + (Math.random() - 0.5) * 20, p.pos.y + 8, '#5E35B1', 1, 18, 0.7, 3);
        if (r.hideT <= 0) { r.hideT = 0; spawnParticles(p.pos.x, p.pos.y, '#7E57C2', 10, 70, 0.4, 3); }
    }
    // 目標：死了或不見了就清掉，隔一下再標新的
    r.targets = r.targets.filter(t => t.isAlive);
    const want = res('assassination') >= 2 ? 2 : 1;
    if (!gameState.betweenWaves && r.targets.length < want) {
        r.markT -= dt;
        if (r.markT <= 0) markTarget();
    }
    // 枕邊匕首：目標身邊的怪攻擊力下降
    if (bl('pillowDagger')) {
        r.daggerT -= dt;
        if (r.daggerT <= 0) {
            r.daggerT = DAGGER_EVERY;
            for (const t of r.targets) monsterGrid.forEachInRadius(t.pos, BLESSINGS.pillowDagger.per, m => { if (m.isAlive) m.weakenTimer = DAGGER_EVERY * 1.5; });
        }
    }
    // 毒
    r.poisonT -= dt;
    if (r.poisonT <= 0) { r.poisonT = POISON.tick; tickPoison(); }
    // 煙：裡面的怪緩速
    for (let i = r.smokes.length - 1; i >= 0; i--) {
        const s = r.smokes[i];
        s.life -= dt;
        if (s.life <= 0) { r.smokes.splice(i, 1); continue; }
        monsterGrid.forEachInRadius(s, SMOKE_RADIUS, m => { if (m.isAlive && distanceSq(m.pos, s) <= SMOKE_RADIUS * SMOKE_RADIUS) m.applySlow(SMOKE_SLOW, 0.3); });
    }
}

function markTarget() {
    const r = rogueState();
    const eliteFirst = res('intel') >= 1;
    let best = null, bestScore = -1;
    // 眼線：只挑身邊的怪（身邊沒有才放寬到全場）
    const p = gameState.player, nearSq = bl('earlyMark') && p ? BLESSINGS.earlyMark.per ** 2 : 0;
    const nearOk = nearSq > 0 && gameState.monsters.some(m => m.isAlive && !m.stealthed && distanceSq(m.pos, p.pos) <= nearSq);
    for (const m of gameState.monsters) {
        if (!m.isAlive || m.stealthed || r.targets.includes(m)) continue;
        if (nearOk && !(m instanceof BossMonster) && distanceSq(m.pos, p.pos) > nearSq) continue;
        const score = (m instanceof BossMonster ? 1e6 : 0) + (m.isElite ? (eliteFirst ? 1e5 : 1e4) : 0) + (TARGET_PRIORITY[m.config.type] ? 5e3 : 0) + m.maxHealth;
        if (score > bestScore) { bestScore = score; best = m; }
    }
    if (!best) return;
    r.targets.push(best);
    best.markedFullHp = best.currentHealth >= best.maxHealth;
    r.markT = ROGUE.markDelay;
    spawnFloatText(best.pos.x, best.pos.y - 30, '目標', ROGUE_MARK_COLOR, 14, 1.2, 'assassination');
    Sfx.play('mark');
}
function targetDown(m) {
    const r = rogueState(), p = gameState.player;
    const bounty = Math.max(ROGUE.bountyMin, Math.round(r.trashValue * ROGUE.bountyShare * (1 + blessVal('bounty')) * (r.intelBonus ? 2 : 1) * runMods().soulMult * (1 + metaVal('soulAffinity'))));
    r.trashValue = 0; r.intelBonus = false;
    dropSouls(m.pos.x, m.pos.y, bounty);
    spawnFloatText(m.pos.x, m.pos.y - 34, `刺殺 +${formatNumberK(bounty)}`, '#FFD54F', 16, 1.6, 'assassination');
    stats().rogueTargets = (stats().rogueTargets || 0) + 1;
    r.waveTargets++;
    if (m.markedFullHp && m.lastHitWasOneShot) gameState.run.flags.rogueOneShot = true;
    if (bl('spoils') && p) p.currentHealth = Math.min(p.maxHealth, p.currentHealth + p.maxHealth * blessVal('spoils'));
    if (res('intel') >= 2 && r.firstTargetThisWave) { gameState.relicDrafts++; spawnFloatText(m.pos.x, m.pos.y - 52, '祝福 +1', '#FFD54F', 16, 1.6, 'draft'); }
    r.firstTargetThisWave = false;
    // 身邊的怪潰散逃跑（山中老人：其中幾隻倒戈成影子）
    let turned = 0;
    monsterGrid.forEachInRadius(m.pos, ROGUE.fearRadius, o => {
        if (!o.isAlive || o === m || o instanceof BossMonster) return;
        if (bl('oldMan') && turned < BLESSINGS.oldMan.per) { turned++; o.isAlive = false; spawnShadow(o.pos.x, o.pos.y, gameState.units.Shadow.level, true); return; }
        const dx = o.pos.x - m.pos.x, dy = o.pos.y - m.pos.y, d = Math.hypot(dx, dy) || 1;
        o.tauntBy = { isAlive: true, pos: { x: o.pos.x + dx / d * 400, y: o.pos.y + dy / d * 400 }, takeDamage() {} };
        o.tauntT = ROGUE.fearTime;
    });
    addShake(5);
    Sfx.play('boss');
    // 刺殺得手：消失；伏擊留給下一個目標
    enterHide(ROGUE.killHide);
}

// ---------- 飛刀：一次射好幾隻，射程內的目標一定分到一把；伏擊只用在射向目標的那一把 ----------
const ROGUE_KNIFE = { projectileSpeed: 520, projectileRadius: 3, projectileColor: '#CFD8DC', boltStyle: 'knife' };
// 飛刀：銀色刀身、皮繩纏的刀柄、尾端一個環，邊飛邊轉
SHAPE_SPRITES.knife = {
    len: 22, wid: 8, spin: 4, streak: 12,
    draw(g) {
        g.lineWidth = 1.6; g.strokeStyle = SHAPE_OUTLINE;
        // 刀柄＋環
        g.fillStyle = '#4E342E';
        g.beginPath(); g.rect(-8, -1.6, 6, 3.2); g.fill(); g.stroke();
        g.strokeStyle = '#A1887F'; g.lineWidth = 0.9;
        for (const x of [-6.5, -4.8, -3.1]) { g.beginPath(); g.moveTo(x, -1.6); g.lineTo(x + 0.8, 1.6); g.stroke(); }
        g.strokeStyle = SHAPE_OUTLINE; g.lineWidth = 1.6;
        g.beginPath(); g.arc(-9.6, 0, 1.8, 0, Math.PI * 2); g.stroke();
        // 護手
        g.fillStyle = '#90A4AE';
        g.beginPath(); g.rect(-2.4, -3.2, 1.6, 6.4); g.fill(); g.stroke();
        // 刀身：上緣直、下緣斜到刀尖
        g.fillStyle = '#ECEFF1';
        g.beginPath(); g.moveTo(-0.8, -2.4); g.lineTo(8, -2.4); g.lineTo(11, 0); g.lineTo(8, 2.4); g.lineTo(-0.8, 2.4); g.closePath(); g.fill(); g.stroke();
        // 刀刃亮線
        g.strokeStyle = '#FFFFFF'; g.lineWidth = 0.9;
        g.beginPath(); g.moveTo(0, -0.9); g.lineTo(8.5, -0.9); g.stroke();
    },
};
// 飛刀命中：處決、上毒、記爆擊。Projectile 打中時呼叫 owner.healFromDamage／onHit
// pierceShield：飛刀打自己的「目標」時無視骨盾衛兵的盾（刺客專挑盔甲的縫）。目標挑的是場上最有威脅、血最多的怪，盾衛常被選中，
// 全擋的話主要收入的目標用主要武器打不動；其他怪照樣被擋，盾陣對刺客還是麻煩
const rogueKnifeOwner = { healFromDamage() {}, onHit: (m) => knifeHit(m), pierceShield: (m) => rogueState().targets.includes(m) };
const rogueTargets = [];
function rogueKnives(p, dt) {
    const r = rogueState(), K = ROGUE.knife;
    r.knifeT -= dt;
    if (r.knifeT > 0) return;
    const range = K.range, rSq = range * range;
    rogueTargets.length = 0;
    monsterGrid.forEachInRadius(p.pos, range, m => { if (m.isAlive && !m.stealthed) { const d = distanceSq(m.pos, p.pos); if (d <= rSq) rogueTargets.push({ m, d: r.targets.includes(m) ? -1 : d }); } });
    if (!rogueTargets.length) return;
    rogueTargets.sort((a, b) => a.d - b.d);
    r.knifeT = K.interval;
    const tier = getTier(gameState.units.Knives.level);
    const n = Math.min(rogueTargets.length, K.count + (tier >= 1 ? 1 : 0));
    for (let i = 0; i < n; i++) {
        const t = rogueTargets[i].m, isTarget = rogueTargets[i].d < 0;
        let dmg = knifeDamage();
        let crit = false;
        // 伏擊：隱身換來的那一刀，留給目標
        if (r.ambush && isTarget) {
            const mult = ROGUE.ambushMult + blessVal('ambushPower') + classMeta('ambushPower');
            dmg *= mult * (1 + blessVal('critDamage'));
            r.ambush = false; crit = true;
            spawnFloatText(t.pos.x, t.pos.y - (t.imageHeight || 30) * 0.5 - 10, `伏擊 ×${+mult.toFixed(1)}`, ROGUE_MARK_COLOR, 16, 1.0, 'ambush');
            Sfx.play('ambush');
        }
        else if (Math.random() < blessVal('critChance')) { dmg *= 2 * (1 + blessVal('critDamage')); crit = true; }
        if (r.hideT > 0 && bl('fidai')) dmg *= FIDAI_KNIFE;
        if (r.targets.includes(t) && res('assassination') >= 1) dmg *= RES_MARKED_TAKEN;
        if (t.poisonStacks > 0 && res('venomschool') >= 1) dmg *= RES_CORRODE_TAKEN;
        t.lastHitWasOneShot = t.currentHealth >= t.maxHealth && dmg >= t.currentHealth;
        const pr = getProjectileFromPool();
        pr.init(p.pos.x, p.pos.y - 6, t, ROGUE_KNIFE, dmg, rogueKnifeOwner, tier >= 2 ? 1 : 0, false);
        gameState.projectiles.push(pr);
        if (crit) spawnParticles(t.pos.x, t.pos.y, ROGUE_MARK_COLOR, 6, 60, 0.3, 2);
    }
    Sfx.play('mageBolt');
}
function executeThreshold() { return ROGUE.execute + blessVal('executeUp') + classMeta('executeUp') + (getTier(gameState.units.Knives.level) >= 3 ? KNIVES_TIER3_EXECUTE : 0); }
function knifeHit(m) {
    if (m.isAlive && !(m instanceof BossMonster) && m.currentHealth < m.maxHealth * executeThreshold()) {
        if (m.isElite) gameState.run.flags.rogueExecElite = true;
        const x = m.pos.x, y = m.pos.y;
        m.takeDamage(m.currentHealth + 1);
        spawnFloatText(x, y - 20, '處決', '#FFE57F', 12, 0.8);
        if (res('shadowschool') >= 2) spawnShadow(x, y, gameState.units.Shadow.level, true);
    }
    // 每一刀都上毒，0 級就有（同飛刀：修練是讓它更強，不是解鎖）。0 級才有毒的話開局完全看不到毒，玩家不知道這張卡在做什麼
    if (m.isAlive) {
        addPoison(m, 1);
        spawnParticles(m.pos.x, m.pos.y - 4, POISON_GREEN, POISON_HIT_SPARKS, 50, 0.3, 2);
    }
}

// ---------- 毒 ----------
function poisonCap() { return POISON.maxStacks + blessVal('poisonStacks') + (getTier(gameState.units.Venom.level) >= 1 ? VENOM_TIER1_STACKS : 0); }
function addPoison(m, stacks) {
    const r = rogueState();
    if (!m.poisonStacks) { m.poisonStacks = 0; r.poisoned.push(m); }
    m.poisonStacks = Math.min(poisonCap(), m.poisonStacks + stacks);
    m.poisonTime = POISON.time;
    introduceRelic('venom', '飛刀帶毒', `每刀疊一層，最多 ${poisonCap()} 層`, '#AED581', 'venomschool');
}
function tickPoison() {
    const r = rogueState();
    if (!r.poisoned.length) return;
    const tier = getTier(gameState.units.Venom.level);
    const per = POISON.dps * POISON.tick * getWaveStatMultiplier(Math.max(1, gameState.currentWave)) * (1 + gameState.units.Venom.level * CONFIG.venom.upgradeBonus) * (1 + blessVal('poisonPower'));
    const live = [];
    for (const m of r.poisoned) {
        if (!m.isAlive) { if (m.poisonStacks > 0) poisonDeath(m); m.poisonStacks = 0; continue; }
        m.poisonTime -= POISON.tick;
        if (m.poisonTime <= 0) { m.poisonStacks = 0; continue; }
        let dmg = per * m.poisonStacks;
        if (res('venomschool') >= 2 && Math.random() < blessVal('critChance')) dmg *= 2 * (1 + blessVal('critDamage'));
        if (tier >= 2) m.weakenTimer = POISON.tick * 2;
        if (bl('poisonSlow')) m.applySlow(blessVal('poisonSlow'), POISON.tick * 2);
        m.takeDamage(dmg);
        if (!m.isAlive) { poisonDeath(m); m.poisonStacks = 0; continue; }
        live.push(m);
    }
    r.poisoned = live;
}
// 毒死的怪：傳染、三階炸出毒霧
function poisonDeath(m) {
    const stacks = m.poisonStacks;
    if (inView(m.pos)) spawnParticles(m.pos.x, m.pos.y, POISON_GREEN, POISON_DEATH_PUFF, 70, 0.5, 3);
    if (bl('poisonSpread')) {
        let left = bl('poisonSpread');
        monsterGrid.forEachInRadius(m.pos, VENOM_CLOUD_RADIUS, o => { if (left > 0 && o.isAlive && o !== m) { addPoison(o, stacks); left--; } });
    }
    if (getTier(gameState.units.Venom.level) >= 3) {
        monsterGrid.forEachInRadius(m.pos, VENOM_CLOUD_RADIUS, o => { if (o.isAlive && distanceSq(o.pos, m.pos) <= VENOM_CLOUD_RADIUS * VENOM_CLOUD_RADIUS) addPoison(o, 1); });
        spawnParticles(m.pos.x, m.pos.y, '#9CCC65', 12, 70, 0.6, 3);
    }
}

// ---------- 大招：斬首 ----------
function useBehead() {
    const r = rogueState(), p = gameState.player, B = ROGUE.behead;
    const dmg = B.damage * getWaveStatMultiplier(Math.max(1, gameState.currentWave)) * (1 + gameState.units.Knives.level * CONFIG.knives.upgradeBonus) * (1 + blessVal('critDamage'));
    let victims = r.targets.filter(t => t.isAlive);
    if (!victims.length) {
        victims = gameState.monsters.filter(m => m.isAlive && !m.stealthed && inView(m.pos)).sort((a, b) => (b.isElite - a.isElite) || (distanceSq(a.pos, p.pos) - distanceSq(b.pos, p.pos))).slice(0, B.fallback);
        if (!victims.length) return false;
    }
    const main = victims[0];
    spawnParticles(p.pos.x, p.pos.y, '#4527A0', 16, 90, 0.4, 3);
    // 瞬移：從原地到目標身邊留一道紫色殘影
    const fromX = p.pos.x, fromY = p.pos.y, toX = main.pos.x - 14, toY = main.pos.y, dist = Math.hypot(toX - fromX, toY - fromY) || 1;
    addWorldFx({ kind: 'beam', x: fromX, y: fromY, dx: (toX - fromX) / dist, dy: (toY - fromY) / dist, len: dist, w: 7, life: 0.45, color: BEHEAD_SHADOW });
    p.pos.x = toX; p.pos.y = toY;
    let kills = 0;
    victims.forEach((v, vi) => {
        const hits = v === main ? B.hits : 1;
        for (let i = 0; i < hits && v.isAlive; i++) { v.lastHitWasOneShot = false; v.takeDamage(dmg * (r.targets.includes(v) && res('assassination') >= 1 ? RES_MARKED_TAKEN : 1)); knifeHit(v); }
        if (!v.isAlive) kills++;
        // 刀光：主目標連砍幾刀交錯成米字，其他的一人一刀、一個接一個
        const base = Math.random() * Math.PI, R = Math.max(BEHEAD_SLASH_R, v.imageWidth * 0.5);
        for (let i = 0; i < hits; i++) {
            addWorldFx({ kind: 'slash', x: v.pos.x, y: v.pos.y, a: base + i * Math.PI / hits * 1.6, arc: Math.PI * 0.9, r: R, width: BEHEAD_SLASH_W, life: 0.32, color: i % 2 ? BEHEAD_SLASH_ALT : BEHEAD_SLASH, delay: (vi + i) * BEHEAD_SLASH_GAP });
        }
        spawnParticles(v.pos.x, v.pos.y, BEHEAD_SLASH, 10, 120, 0.4, 3);
    });
    enterHide(ROGUE.behead.hide);
    gameState.run.novaBest = Math.max(gameState.run.novaBest, kills);
    spawnFloatText(p.pos.x, p.pos.y - 40, '斬首！', '#FFE57F', 18, 1.1, 'behead');
    addShake(6);
    Sfx.play('nova');
    gameState.ultCooldown = B.cooldown;
    gameState.run.novas++;
    stats().novas++;
    return true;
}
// 刀光用刺客的標記金色、一刀金一刀白（我方特效不用紅，見專案 CLAUDE.md）
const BEHEAD_SHADOW = STEALTH_COLOR, BEHEAD_SLASH = ROGUE_MARK_COLOR, BEHEAD_SLASH_ALT = '#FFF8E1';
const BEHEAD_SLASH_R = 22, BEHEAD_SLASH_W = 8, BEHEAD_SLASH_GAP = 0.06;

// ---------- 畫面：隱身（腳下暗影＋倒數圈、身體半透明）、伏擊、目標的準星、畫面外的箭頭、煙 ----------
// 腳下：一灘暗影、外圈淡紫的倒數環（剩幾秒一眼看得到）。畫在主角身體之前
function drawRogueStealthGround(ctx, p) {
    const r = rogueState();
    if (r.hideT <= 0) return;
    const x = p.pos.x, y = p.pos.y + p.imageHeight * 0.32, R = 24;
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.drawImage(getGlowSprite(STEALTH_DARK), x - 46, y - 30, 92, 60);
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = 'rgba(20, 10, 40, 0.8)'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(x, y, R, R * 0.45, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = STEALTH_COLOR; ctx.lineWidth = 3; ctx.lineCap = 'round';
    const k = Math.max(0, Math.min(1, r.hideT / r.hideMax));
    ctx.beginPath(); ctx.ellipse(x, y, R, R * 0.45, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke();
    ctx.restore();
}
// 身體畫完之後：隱身時一圈忽明忽暗的紫色輪廓光；伏擊備好時頭上一把金匕首，隱身中再拉一條金色虛線指向目標
function drawRogueHud(ctx, p) {
    const r = rogueState();
    if (r.hideT > 0) {
        ctx.save();
        ctx.globalAlpha = 0.35 + 0.15 * Math.sin(worldTime * 8);
        ctx.drawImage(getGlowSprite('#7E57C2'), p.pos.x - 34, p.pos.y - 38, 68, 68);
        ctx.restore();
    }
    if (!r.ambush) return;
    const t = r.targets.find(m => m.isAlive);
    if (r.hideT > 0 && t) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = ROGUE_MARK_COLOR; ctx.lineWidth = 2; ctx.setLineDash([6, 7]); ctx.lineDashOffset = -worldTime * 30;
        const dx = t.pos.x - p.pos.x, dy = t.pos.y - p.pos.y, d = Math.hypot(dx, dy) || 1, end = Math.max(0, d - Math.max(16, t.imageWidth * 0.45));
        ctx.beginPath(); ctx.moveTo(p.pos.x + dx / d * 20, p.pos.y + dy / d * 20); ctx.lineTo(p.pos.x + dx / d * end, p.pos.y + dy / d * end); ctx.stroke();
        ctx.restore();
    }
    const icon = getIconImage('ambush');
    if (icon) {
        const s = 26 + 2 * Math.sin(worldTime * 6), top = p.pos.y - p.imageHeight * 0.5 - s;
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.drawImage(getGlowSprite(ROGUE_MARK_COLOR), p.pos.x - s, top - s / 2, s * 2, s * 2);
        ctx.globalAlpha = 1;
        ctx.drawImage(icon, p.pos.x - s / 2, top, s, s);
        ctx.restore();
    }
}
function drawRogueWorld(ctx) {
    const r = rogueState();
    for (const s of r.smokes) {
        if (!inView(s)) continue;
        ctx.save();
        ctx.globalAlpha = Math.min(0.5, s.life * 0.3);
        ctx.drawImage(getGlowSprite('#90A4AE'), s.x - SMOKE_RADIUS * 1.3, s.y - SMOKE_RADIUS * 1.3, SMOKE_RADIUS * 2.6, SMOKE_RADIUS * 2.6);
        ctx.restore();
    }
    // 目標頭上的金色準星
    for (const t of r.targets) {
        if (!t.isAlive || !inView(t.pos)) continue;
        const R = Math.max(16, t.imageWidth * 0.45), a = worldTime * 2;
        ctx.save();
        ctx.strokeStyle = ROGUE_MARK_COLOR; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(t.pos.x, t.pos.y, R, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < 4; i++) {
            const b = a + i * Math.PI / 2;
            ctx.beginPath(); ctx.moveTo(t.pos.x + Math.cos(b) * (R - 6), t.pos.y + Math.sin(b) * (R - 6)); ctx.lineTo(t.pos.x + Math.cos(b) * (R + 6), t.pos.y + Math.sin(b) * (R + 6)); ctx.stroke();
        }
        ctx.restore();
    }
    // 中毒的怪：身上一層綠光（層數越多越濃），頭上一串往上飄的毒泡（層數越多越多顆）
    const glow = getGlowSprite(POISON_GREEN);
    for (const m of r.poisoned) {
        if (!m.isAlive || !(m.poisonStacks > 0) || !inView(m.pos)) continue;
        const g = m.imageWidth * POISON_GLOW_SIZE;
        ctx.globalAlpha = Math.min(POISON_GLOW_MAX, POISON_GLOW_BASE + POISON_GLOW_PER_STACK * m.poisonStacks);
        ctx.drawImage(glow, m.pos.x - g / 2, m.pos.y - g / 2, g, g);
        const top = m.pos.y - m.imageHeight * 0.45, n = Math.min(POISON_BUBBLES, m.poisonStacks);
        ctx.fillStyle = POISON_BUBBLE;
        ctx.strokeStyle = POISON_BUBBLE_EDGE;
        ctx.lineWidth = 1.5;
        for (let i = 0; i < n; i++) {
            const ph = (worldTime * POISON_BUBBLE_SPEED + i / n + (m.pos.x % 1)) % 1;
            ctx.globalAlpha = 1 - ph * 0.8;
            ctx.beginPath(); ctx.arc(m.pos.x + (i - (n - 1) / 2) * 7, top - ph * POISON_BUBBLE_RISE, 3 + ph * 2.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
    }
    ctx.globalAlpha = 1;
}
// 目標在畫面外時，邊緣一個金箭頭指著牠
function drawTargetPointers(ctx) {
    const r = rogueState(), W = view.cssW, H = view.cssH, z = view.zoom, pad = 30;
    for (const t of r.targets) {
        if (!t.isAlive || inView(t.pos)) continue;
        const sx = (t.pos.x - camera.x) * z, sy = (t.pos.y - camera.y) * z;
        const cx = W / 2, cy = H / 2, dx = sx - cx, dy = sy - cy;
        const k = Math.min((W / 2 - pad) / Math.abs(dx || 1), (H / 2 - pad) / Math.abs(dy || 1));
        const x = cx + dx * k, y = cy + dy * k, a = Math.atan2(dy, dx);
        ctx.save();
        ctx.translate(x, y); ctx.rotate(a);
        ctx.fillStyle = ROGUE_MARK_COLOR; ctx.strokeStyle = '#1b1424'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, -9); ctx.lineTo(-4, 0); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
    }
}

// ---------- 影子：會自己消失的分身 ----------
function spawnShadow(x, y, level, free) {
    const s = new ShadowClone(x, y, level, gameState.player);
    gameState.summons.push(s);
    gameState.units.Shadow.count++;
    if (free) spawnParticles(x, y, '#7E57C2', 8, 60, 0.4, 2);
    return s;
}
UNIT_TYPES.Shadow.summon = (level) => { const p = gameState.player, pos = p.getSummonPosition(); spawnShadow(pos.x, pos.y, level, false); };
class ShadowClone extends SummonUnit {
    constructor(x, y, level, p) {
        super(x, y, CONFIG.shadowClone, level, p);
        this.life = (SHADOW_LIFE + blessVal('shadowTime')) * (this.tier >= 1 ? 2 : 1);
        this.firstHit = true;
    }
    computeStats() {
        super.computeStats();
        this.attack *= 1 + blessVal('shadowPower');
        this.tint = '#311B92'; this.tintStrength = 0.6;
    }
    update(dt, monsters, summons, player) {
        if (!this.isAlive) return;
        this.life -= dt;
        if (this.life <= 0) { this.fade(); return; }
        super.update(dt, monsters, summons, player);
    }
    attackTarget() {
        const t = this.target;
        if (!t || !t.isAlive) return;
        let dmg = this.attack;
        if (this.firstHit) { dmg *= 1 + blessVal('shadowStrike') * 2; this.firstHit = false; }
        t.takeDamage(dmg);
        if (this.tier >= 2 && t.isAlive) addPoison(t, 1);
        const fx = getVisualEffectFromPool(SlashEffect);
        if (fx) { fx.init(this.pos, t.pos); gameState.visualEffects.push(fx); }
        this.attackCooldown = 1 / this.attackSpeed;
    }
    // 時間到：三階影子消失前伏擊身邊的怪
    fade() {
        if (this.tier >= 3) monsterGrid.forEachInRadius(this.pos, 40, m => { if (m.isAlive) m.takeDamage(this.attack * ROGUE.ambushMult * 0.5); });
        this.die();
    }
    die() {
        if (!this.isAlive) return;
        this.isAlive = false;
        gameState.units.Shadow.count--;
        onSummonDeath(this);
        spawnParticles(this.pos.x, this.pos.y, '#4527A0', 10, 60, 0.4);
        updateUI();
    }
}
