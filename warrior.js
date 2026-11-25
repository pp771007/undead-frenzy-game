// 戰士 · 鐵血軍團長（規劃見 docs/characters.md 第 2 節）
// 跟亡靈法師「人海、大軍散開圍上去」相反：少數精兵排成三排陣型跟著戰士、陣型面向移動方向、轉向慢，
// 從背後與側翼挨打的士兵傷害加倍；士兵各自累積擊殺升老兵，陣亡就沒了；戰士本人站在陣型中央揮大劍，受傷累積怒氣，
// 滿了自動狂怒、退去後虛脫。典故：羅馬軍團的三線、龜甲陣、先擲標槍再衝鋒；維京狂戰士。
// 這個檔在 game.js 之後載入，用的是 game.js 的全域（CONFIG、CLASSES、UNIT_TYPES、SummonUnit…）；game.js 的 init 等所有腳本載完才跑

const WARRIOR = {
    // 站最前線、波與波之間不回血：血要比躲在大軍後面的法師（50）厚得多
    baseHealth: 120,
    moveSpeed: 92,
    // 大劍橫掃：每 swingInterval 秒砍一次面向前方 swingArc 弧度內、swingRange 內的所有怪
    swingInterval: 0.85, swingRange: 52, swingArc: Math.PI * 1.1, swingDamage: 7,
    // 大劍每砍死一隻回最大血量的 killHeal，一刀最多 killHealMax
    killHeal: 0.015, killHealMax: 0.05,
    // 鐵甲：戰士本人常駐受傷 ×armorTaken（狂怒時再乘 berserkTaken）。陣型只擋得住正面，側面背後來的怪最近的就是戰士
    armorTaken: 0.75,
    // 每次升級（任何兵種）戰士本人成長多少：怪的攻擊會指數成長，戰士站在前線，自己不長的話後期兩三下就倒
    drillHp: 0.02, drillDamage: 0.03,
    // 陣型每秒最多轉多少弧度：轉向慢，從背後殺來的怪要先「轉過去」才擋得住
    turnRate: 2.2,
    // 從背後（相對陣型面向）打到士兵的傷害倍率
    flankMult: 2,
    // 人數上限（之後由軍團紀律流派加）
    troopCap: 16,
    startSquad: ['Shieldman', 'Shieldman', 'Spearman', 'Crossbowman'],
    // 陣型：每排幾人、排距、人距；盾兵、長槍排在戰士前方 frontDist 起，弩手、退下來休息的盾兵排在戰士後方 rearDist 起
    rowSize: 6, rowGap: 17, colGap: 19, frontDist: 40, rearDist: 22,
    // 士兵離自己的位置超過這麼遠才去追怪（近戰）；離位置太遠時加速歸隊
    engageRadius: 75, regroupDist: 110, regroupMult: 2.4, marchMult: 1.3,
    // 盾兵血量低於 rotateBelow 退到最後一排、每秒回 rotateRegen，回到 rotateBackAbove 再上前（三線輪替）
    rotateBelow: 0.4, rotateBackAbove: 0.85, rotateRegen: 0.06,
    // 老兵：累計擊殺到這些數字各升一星（老兵、精銳、百戰），每星血量與攻擊 +vetBonus
    vetKills: [8, 25, 60], vetBonus: 0.3, vetNames: ['老兵', '精銳', '百戰'],
    // 怒氣：失去 1% 血量 +ragePerHp、大劍每砍中一隻 +ragePerHit、士兵陣亡 +ragePerFallen；滿了自動狂怒
    rageMax: 100, ragePerHp: 2.2, ragePerHit: 0.6, ragePerFallen: 6,
    berserkTime: 8, exhaustTime: 4,
    berserkSwingRate: 1.7, berserkTaken: 0.5, berserkSpeed: 1.15, berserkRange: 1.25,
    exhaustSpeed: 0.5, exhaustSwingRate: 0.5,
    // 大招「標槍齊射」：全軍朝面向擲出標槍（長條範圍），每個士兵讓傷害再多 perTroop；之後全軍衝鋒 chargeTime 秒
    javelin: { cooldown: 20, length: 290, width: 90, damage: 14, perTroop: 0.12, chargeTime: 3, chargeSpeed: 1.6, flight: 0.3 },
    // 盾牆：血彈離盾兵這麼近就被擋下，盾兵吃最大血量的 boltBlockCost
    boltBlockRadius: 16, boltBlockCost: 0.06,
    // 盾兵的嘲諷：身邊這麼近的怪改打盾兵（不撲向戰士），二階起範圍 ×tauntTier2Mult
    tauntRadius: 65, tauntTier2Mult: 2, tauntTime: 1.2, tauntEvery: 0.5,
    // 三階盾兵每隔這麼久格擋一下
    blockEvery: 4,
};

OPTIONAL_ART.warrior = 'warrior.png';
OPTIONAL_ART.soldier_shield = 'soldier_shield.png';
OPTIONAL_ART.soldier_spear = 'soldier_spear.png';
OPTIONAL_ART.soldier_crossbow = 'soldier_crossbow.png';

// 士兵的設定：欄位跟骷髏一樣（SummonUnit 會讀 wander*、targetSearchRadius 這些），rank 決定排在陣型第幾段
const SOLDIER_COMMON = {
    // 人少：每升一級加得比骷髏（0.1）多得多，升級才划得來
    radius: 11, imgScaleMultiplier: 3.2, moveSpeed: 85, upgradeBonus: 0.35,
    targetSearchRadius: 150, returnDistance: 30, avoidanceRadius: 14, avoidanceForce: 100, playerAvoidanceForce: 40,
    wanderRadius: 0, wanderSpeedFactor: 0, wanderIntervalMin: 99, wanderIntervalMax: 99,
};
CONFIG.shieldman = {
    ...SOLDIER_COMMON, type: 'Shieldman', rank: 0, imageName: 'soldier_shield', color: '#90A4AE',
    baseHealth: 90, baseAttack: 5, attackRange: 26, attackSpeed: 0.9,
    summonCost: 12, upgradeCostBase: 30, upgradeCostInc: 12,
};
CONFIG.spearman = {
    ...SOLDIER_COMMON, type: 'Spearman', rank: 1, imageName: 'soldier_spear', color: '#B0BEC5',
    // 長槍越過盾牌刺：攻擊距離長；對大型怪（首領、體型大的、會飛的）傷害 ×bigMult
    baseHealth: 55, baseAttack: 11, attackRange: 46, attackSpeed: 0.8, bigMult: 2, bigRadius: 16,
    summonCost: 14, upgradeCostBase: 30, upgradeCostInc: 12,
};
CONFIG.crossbowman = {
    ...SOLDIER_COMMON, type: 'Crossbowman', rank: 2, imageName: 'soldier_crossbow', color: '#A1887F',
    baseHealth: 35, baseAttack: 16, attackRange: 200, attackSpeed: 0.5,
    projectileColor: '#D7CCC8', boltStyle: 'quarrel', projectileSpeed: 420, projectileRadius: 3,
    summonCost: 16, upgradeCostBase: 35, upgradeCostInc: 14,
};
BOLT_STYLES.quarrel = { glowIn: 'rgba(255, 236, 179, 0.8)', glowMid: 'rgba(188, 170, 164, 0.35)', glowOut: 'rgba(188, 170, 164, 0)', body: '#8D6E63', core: '#FFF3E0' };

// 三階進化：名字與能力（announceEvolution 讀 CONFIG.evolution.names／perks）
Object.assign(CONFIG.evolution.names, {
    Shieldman: ['老練盾兵', '重盾兵', '禁衛'],
    Spearman: ['老練槍兵', '方陣槍兵', '龍騎槍'],
    Crossbowman: ['老練弩手', '連弩手', '神射手'],
});
Object.assign(CONFIG.evolution.perks, {
    Shieldman: ['受到的傷害 -30%', '嘲諷範圍加倍', '每 4 秒格擋一次攻擊'],
    Spearman: ['刺擊距離 +25%', '一槍刺穿兩隻', '對精英、首領傷害加倍'],
    Crossbowman: ['射程 +25%', '每次射兩箭', '弩箭命中後彈射一次'],
});
const SOLDIER_TIER1_TAKEN = 0.7;
const SOLDIER_TIER1_REACH = 1.25;
const SPEAR_PIERCE_RADIUS = 28;
const SOLDIER_TIER3_ELITE_MULT = 2;

Object.assign(UNIT_TYPES, {
    Shieldman: { cfg: () => CONFIG.shieldman, Cls: () => Shieldman, name: '盾兵', img: 'soldier_shield.png' },
    Spearman: { cfg: () => CONFIG.spearman, Cls: () => Spearman, name: '長槍兵', img: 'soldier_spear.png' },
    Crossbowman: { cfg: () => CONFIG.crossbowman, Cls: () => Crossbowman, name: '弩手', img: 'soldier_crossbow.png' },
});

CLASSES.warrior = {
    name: '戰士', title: '鐵血軍團長', portrait: 'warrior.png', tagline: '少數精兵排成陣型，自己站最前線',
    unlock: 'wave20',
    cards: ['Shieldman', 'Spearman', 'Crossbowman'], schools: ['soul'],
    hero: { imageName: 'warrior', baseHealth: WARRIOR.baseHealth, moveSpeed: WARRIOR.moveSpeed },
    troopCap: () => WARRIOR.troopCap,
    attack: (p, dt) => warriorSwing(p, dt),
    update: (dt) => warriorUpdate(dt),
    reset: () => { gameState.war = newWarState(); },
    // 軍團長不是光桿開局：一開始就帶一支小隊（不花靈魂、算進人數上限）
    onRunStart: () => {
        for (const type of WARRIOR.startSquad) {
            const pos = gameState.player.getSummonPosition();
            gameState.summons.push(new (UNIT_TYPES[type].Cls())(pos.x, pos.y, 0, gameState.player));
            gameState.units[type].count++;
            gameState.totalSummons[type]++;
        }
    },
    heroSpeedMult: () => warState().berserkT > 0 ? WARRIOR.berserkSpeed : warState().exhaustT > 0 ? WARRIOR.exhaustSpeed : 1,
    heroDamageTakenMult: () => WARRIOR.armorTaken * (warState().berserkT > 0 ? WARRIOR.berserkTaken : 1),
    onHeroHurt: (lostFrac) => addRage(lostFrac * 100 * WARRIOR.ragePerHp),
    drawHero: (ctx, p) => drawWarriorHud(ctx, p),
    // 軍團長跟著部下一起操練：每升級一次任何兵種，戰士最大血量 +drillHp、大劍傷害 +drillDamage
    onUpgrade: () => {
        const w = warState(), p = gameState.player;
        w.drills++;
        const gain = Math.max(1, Math.round(WARRIOR.baseHealth * WARRIOR.drillHp));
        p.maxHealth += gain;
        p.currentHealth += gain;
    },
    // 盾牆：射向戰士的血彈碰到站在前排（沒退下來休息）的盾兵就被擋下，盾兵吃一點傷害
    blockBolt: (b) => {
        let blocker = null;
        const rSq = WARRIOR.boltBlockRadius * WARRIOR.boltBlockRadius;
        summonGrid.forEachInRadius(b.pos, WARRIOR.boltBlockRadius, s => {
            if (!blocker && s.isAlive && s instanceof Shieldman && !s.resting && distanceSq(s.pos, b.pos) <= rSq) blocker = s;
        });
        if (!blocker) return false;
        blocker.takeDamage(blocker.maxHealth * WARRIOR.boltBlockCost);
        return true;
    },
    // 老兵的擊殺數要跟著存檔：讀檔重建士兵時照兵種、依序把擊殺數還回去
    saveExtra: () => {
        const kills = {};
        for (const s of gameState.summons) if (s.isAlive && s instanceof Soldier) (kills[s.config.type] = kills[s.config.type] || []).push(s.kills);
        return { kills, rage: warState().rage, drills: warState().drills };
    },
    loadExtra: (data) => {
        const left = { ...(data.kills || {}) };
        for (const s of gameState.summons) {
            if (!(s instanceof Soldier)) continue;
            const list = left[s.config.type];
            if (!list || !list.length) continue;
            s.kills = list.shift();
            s.vet = WARRIOR.vetKills.filter(k => s.kills >= k).length;
            s.refreshStats();
            s.currentHealth = s.maxHealth;
        }
        warState().rage = data.rage || 0;
        warState().drills = data.drills || 0;
    },
    ultimate: {
        name: '標槍', icon: 'javelin', hint: '標槍：全軍朝前方齊射，再衝鋒',
        hintRadius: () => WARRIOR.javelin.length * 0.5, cooldown: () => WARRIOR.javelin.cooldown, use: () => useJavelin(),
    },
};

// drills：這一局一共升級了幾次（軍團長跟著部下一起操練變強）
function newWarState() { return { rage: 0, berserkT: 0, exhaustT: 0, fx: 1, fy: 0, swingT: 0, chargeT: 0, tauntT: 0, drills: 0 }; }
function warState() { return gameState.war || (gameState.war = newWarState()); }
function troopCount() { return classDef().cards.reduce((n, t) => n + gameState.units[t].count, 0); }

function addRage(amount) {
    const w = warState();
    if (w.berserkT > 0 || w.exhaustT > 0) return;
    w.rage = Math.min(WARRIOR.rageMax, w.rage + amount);
    if (w.rage < WARRIOR.rageMax) return;
    w.rage = 0;
    w.berserkT = WARRIOR.berserkTime;
    const p = gameState.player;
    spawnParticles(p.pos.x, p.pos.y, '#FF5252', 36, 200, 0.7, 3);
    spawnFloatText(p.pos.x, p.pos.y - 40, '狂怒！', '#FF8A80', 20, 1.2, 'rage');
    addShake(8);
    Sfx.play('boss');
}

// ---------- 每格：陣型面向、狂怒計時、嘲諷、排位 ----------
let soldierSeq = 0;
function warriorUpdate(dt) {
    const w = warState(), p = gameState.player;
    if (!p) return;
    if (w.berserkT > 0) { w.berserkT -= dt; if (w.berserkT <= 0) { w.berserkT = 0; w.exhaustT = WARRIOR.exhaustTime; spawnFloatText(p.pos.x, p.pos.y - 40, '虛脫', '#B0BEC5', 15, 1.2); } }
    else if (w.exhaustT > 0) w.exhaustT = Math.max(0, w.exhaustT - dt);
    w.chargeT = Math.max(0, w.chargeT - dt);
    // 面向慢慢轉向移動方向
    const mv = getMoveVector();
    if (Math.hypot(mv.x, mv.y) > 0.1) {
        const cur = Math.atan2(w.fy, w.fx), want = Math.atan2(mv.y, mv.x);
        let d = want - cur;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        const step = Math.sign(d) * Math.min(Math.abs(d), WARRIOR.turnRate * dt);
        w.fx = Math.cos(cur + step); w.fy = Math.sin(cur + step);
    }
    // 二階以上的盾兵：每隔一下把身邊的怪的仇恨拉到自己身上
    w.tauntT -= dt;
    const taunt = w.tauntT <= 0;
    if (taunt) w.tauntT = WARRIOR.tauntEvery;
    // 排位：各兵種依加入順序排成一排排，盾兵最前；退下來休息的盾兵排在最後
    const groups = [[], [], [], []];
    for (const s of gameState.summons) {
        if (!s.isAlive || !(s instanceof Soldier)) continue;
        groups[s.resting ? 3 : s.config.rank].push(s);
        if (taunt && s instanceof Shieldman && !s.resting) {
            const r = WARRIOR.tauntRadius * (s.tier >= 2 ? WARRIOR.tauntTier2Mult : 1);
            monsterGrid.forEachInRadius(s.pos, r, m => { if (m.isAlive && !(m instanceof BossMonster)) { m.tauntBy = s; m.tauntT = WARRIOR.tauntTime; } });
        }
    }
    // 戰士站在陣型中間：盾兵、長槍從前方 frontDist 往後排，弩手、休息的盾兵從後方 rearDist 往後排
    const rx = -w.fy, ry = w.fx;
    let row = 0;
    groups.forEach((g, gi) => {
        if (gi === 2) row = 0;
        const start = gi < 2 ? WARRIOR.frontDist : -WARRIOR.rearDist;
        g.sort((a, b) => a.uid - b.uid);
        for (let i = 0; i < g.length; i += WARRIOR.rowSize) {
            const n = Math.min(WARRIOR.rowSize, g.length - i);
            const d = start - row * WARRIOR.rowGap;
            for (let j = 0; j < n; j++) {
                const lat = (j - (n - 1) / 2) * WARRIOR.colGap;
                g[i + j].slot.x = p.pos.x + w.fx * d + rx * lat;
                g[i + j].slot.y = p.pos.y + w.fy * d + ry * lat;
            }
            row++;
        }
    });
}

// ---------- 戰士本人：大劍橫掃 ----------
function warriorSwing(p, dt) {
    const w = warState();
    w.swingT -= dt * (w.berserkT > 0 ? WARRIOR.berserkSwingRate : w.exhaustT > 0 ? WARRIOR.exhaustSwingRate : 1);
    if (w.swingT > 0) return;
    const range = WARRIOR.swingRange * (w.berserkT > 0 ? WARRIOR.berserkRange : 1), rSq = range * range;
    // 狂怒時整圈都砍；平常只砍面向前方
    const halfArc = w.berserkT > 0 ? Math.PI : WARRIOR.swingArc / 2, cosHalf = Math.cos(halfArc);
    const hits = [];
    monsterGrid.forEachInRadius(p.pos, range, m => {
        if (!m.isAlive || m.stealthed) return;
        const dx = m.pos.x - p.pos.x, dy = m.pos.y - p.pos.y, dSq = dx * dx + dy * dy;
        if (dSq > rSq) return;
        const d = Math.sqrt(dSq) || 1;
        if ((dx * w.fx + dy * w.fy) / d >= cosHalf) hits.push(m);
    });
    if (!hits.length) return;
    w.swingT = WARRIOR.swingInterval;
    const dmg = WARRIOR.swingDamage * getWaveStatMultiplier(Math.max(1, gameState.currentWave)) * runMods().boltDmgMult * (1 + w.drills * WARRIOR.drillDamage);
    let kills = 0;
    for (const m of hits) { m.takeDamage(dmg); if (!m.isAlive) kills++; }
    // 大劍親手砍死的怪回血：站最前線又沒有波間回血，戰士要靠打下去撐住
    if (kills > 0 && p.currentHealth < p.maxHealth) {
        const heal = Math.max(1, Math.round(p.maxHealth * Math.min(WARRIOR.killHealMax, kills * WARRIOR.killHeal)));
        p.currentHealth = Math.min(p.maxHealth, p.currentHealth + heal);
        spawnFloatText(p.pos.x, p.pos.y - 26, `+${heal}`, '#81C784', 12, 0.6);
    }
    addRage(hits.length * WARRIOR.ragePerHit);
    const fx = getVisualEffectFromPool(SweepEffect) || new SweepEffect();
    fx.init(p.pos, Math.atan2(w.fy, w.fx), halfArc, range, w.berserkT > 0);
    gameState.visualEffects.push(fx);
    Sfx.play('hit');
}

class SweepEffect extends TimedEffect {
    constructor() { super(null, 0.18); }
    init(pos, angle, halfArc, range, rage) {
        this.initBase(pos, 0.18);
        this.angle = angle; this.halfArc = halfArc; this.range = range; this.rage = rage;
        return this;
    }
    draw(ctx) {
        const k = 1 - this.life / this.duration;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - k) * 0.85;
        ctx.strokeStyle = this.rage ? '#FF5252' : '#ECEFF1';
        ctx.lineWidth = 6 * (1 - k) + 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.range * (0.75 + 0.25 * k), this.angle - this.halfArc, this.angle + this.halfArc);
        ctx.stroke();
        ctx.restore();
    }
}

// ---------- 大招：標槍齊射，然後衝鋒 ----------
function useJavelin() {
    const p = gameState.player, w = warState(), J = WARRIOR.javelin;
    const troops = troopCount();
    const dmg = J.damage * getWaveStatMultiplier(Math.max(1, gameState.currentWave)) * (1 + troops * J.perTroop);
    const halfW = J.width / 2;
    let kills = 0;
    for (const m of gameState.monsters) {
        if (!m.isAlive || m.stealthed) continue;
        const dx = m.pos.x - p.pos.x, dy = m.pos.y - p.pos.y;
        const along = dx * w.fx + dy * w.fy, side = Math.abs(dx * -w.fy + dy * w.fx);
        if (along < -20 || along > J.length || side > halfW) continue;
        m.takeDamage(dmg);
        if (!m.isAlive) kills++;
    }
    gameState.run.novaBest = Math.max(gameState.run.novaBest, kills);
    // 每個士兵（和戰士自己）各丟一根：畫面上看得到一整排標槍飛出去
    const throwers = [p, ...gameState.summons.filter(s => s.isAlive && s instanceof Soldier)];
    const fx = new JavelinEffect(throwers.map(t => ({ x: t.pos.x, y: t.pos.y })), w.fx, w.fy, J.length, J.flight);
    gameState.visualEffects.push(fx);
    w.chargeT = J.chargeTime;
    gameState.frenzyTimer = Math.max(gameState.frenzyTimer, J.chargeTime);
    gameState.ultCooldown = J.cooldown;
    spawnFloatText(p.pos.x, p.pos.y - 34, '衝鋒！', '#FFCC80', 18, 1.1, 'javelin');
    addShake(6);
    Sfx.play('nova');
    gameState.run.novas++;
    stats().novas++;
    return true;
}

class JavelinEffect extends TimedEffect {
    constructor(starts, fx, fy, length, flight) {
        super(starts[0], flight + 0.25);
        this.starts = starts; this.fx = fx; this.fy = fy; this.length = length; this.flight = flight;
    }
    draw(ctx) {
        const t = this.duration - this.life, k = Math.min(1, t / this.flight);
        ctx.save();
        ctx.lineCap = 'round';
        ctx.globalAlpha = Math.min(1, this.life * 4);
        for (const s of this.starts) {
            const hx = s.x + this.fx * this.length * k, hy = s.y + this.fy * this.length * k - Math.sin(k * Math.PI) * 30;
            ctx.strokeStyle = '#4E342E'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(hx - this.fx * 18, hy - this.fy * 18); ctx.lineTo(hx, hy); ctx.stroke();
            ctx.strokeStyle = '#CFD8DC'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(hx - this.fx * 4, hy - this.fy * 4); ctx.lineTo(hx + this.fx * 5, hy + this.fy * 5); ctx.stroke();
        }
        ctx.restore();
    }
}

// ---------- 戰士頭上：怒氣條、狂怒的紅光 ----------
const RAGE_BAR_W = 38, RAGE_BAR_H = 4;
function drawWarriorHud(ctx, p) {
    const w = warState();
    const x = p.pos.x - RAGE_BAR_W / 2, y = p.pos.y + p.imageHeight * 0.5 + 9;
    if (w.berserkT > 0) {
        ctx.save();
        ctx.globalAlpha = 0.35 + 0.15 * Math.sin(worldTime * 12);
        ctx.drawImage(getGlowSprite('#FF1744'), p.pos.x - 45, p.pos.y - 45, 90, 90);
        ctx.restore();
    }
    const k = w.berserkT > 0 ? w.berserkT / WARRIOR.berserkTime : w.exhaustT > 0 ? 0 : w.rage / WARRIOR.rageMax;
    ctx.fillStyle = 'rgba(14, 10, 20, 0.85)';
    ctx.fillRect(x - 1.5, y - 1.5, RAGE_BAR_W + 3, RAGE_BAR_H + 3);
    ctx.fillStyle = w.berserkT > 0 ? '#FF1744' : w.exhaustT > 0 ? '#607D8B' : '#FF9100';
    ctx.fillRect(x, y, RAGE_BAR_W * (w.exhaustT > 0 ? 1 - w.exhaustT / WARRIOR.exhaustTime : k), RAGE_BAR_H);
}

// ---------- 士兵 ----------
class Soldier extends SummonUnit {
    constructor(x, y, config, level, playerTransform) {
        super(x, y, config, level, playerTransform);
        this.uid = ++soldierSeq;
        this.kills = 0;
        this.vet = 0;
        this.resting = false;
        this.slot = { x, y };
        this.auraDamageMult = 1;
        this.blockT = 0;
    }
    computeStats() {
        super.computeStats();
        // SummonUnit 的建構子會先算一次數值，那時還沒設 vet
        const v = 1 + (this.vet || 0) * WARRIOR.vetBonus;
        this.maxHealth = Math.round(this.maxHealth * v);
        this.attack *= v;
        if (this.tier >= 1 && this.config.type !== 'Shieldman') this.attackRange *= SOLDIER_TIER1_REACH;
        this.attackRangeSq = this.attackRange * this.attackRange;
    }
    update(deltaTime) {
        if (!this.isAlive) return;
        this.tickFlash(deltaTime);
        const w = warState(), p = this.playerTransform;
        this.attackCooldown -= deltaTime * (gameState.frenzyTimer > 0 ? CONFIG.nova.frenzyAttackRate : 1);
        if (this.blockT > 0) this.blockT -= deltaTime;
        // 三線輪替：盾兵殘血退到後排回血，回滿再上前
        if (this.config.type === 'Shieldman') {
            if (!this.resting && this.currentHealth < this.maxHealth * WARRIOR.rotateBelow) { this.resting = true; this.target = null; }
            if (this.resting) {
                this.currentHealth = Math.min(this.maxHealth, this.currentHealth + this.maxHealth * WARRIOR.rotateRegen * deltaTime);
                if (this.currentHealth >= this.maxHealth * WARRIOR.rotateBackAbove) this.resting = false;
            }
        }
        // 找目標：近戰只追離自己位置不遠的（守住陣型），弩手打射程內最近的
        if (this.target && (!this.target.isAlive || this.target.stealthed)) this.target = null;
        if (!this.resting && (!this.target || (frameNo + this.uid) % TARGET_SEARCH_FRAMES === 0)) {
            const ranged = this.config.type === 'Crossbowman';
            const grid = this.config.type === 'Shieldman' ? groundMonsterGrid : monsterGrid;
            const from = ranged ? this.pos : this.slot;
            const r = ranged ? this.attackRange : WARRIOR.engageRadius + this.attackRange;
            const m = grid.nearestShared(from, gameState.straggling ? STRAGGLER_SEARCH_RADIUS : r);
            this.target = m && m.isAlive && !m.stealthed ? m : null;
        }
        // 移動：近戰走到目標身邊，其他時候回自己的位置；離位置太遠加速歸隊，遠到出了畫面直接傳送
        let gx = this.slot.x, gy = this.slot.y;
        const melee = this.config.type !== 'Crossbowman';
        if (this.target && melee) {
            const dSq = distanceSq(this.pos, this.target.pos);
            if (dSq > this.attackRangeSq * 0.8) { gx = this.target.pos.x; gy = this.target.pos.y; } else { gx = this.pos.x; gy = this.pos.y; }
        }
        const dpx = p.pos.x - this.pos.x, dpy = p.pos.y - this.pos.y;
        if (dpx * dpx + dpy * dpy > SUMMON_TELEPORT_DIST * SUMMON_TELEPORT_DIST && !inView(this.pos)) {
            this.pos.x = this.slot.x; this.pos.y = this.slot.y; this.target = null;
        }
        const dx = gx - this.pos.x, dy = gy - this.pos.y, dist = Math.hypot(dx, dy);
        if (dist > 2) {
            const far = Math.hypot(this.slot.x - this.pos.x, this.slot.y - this.pos.y) > WARRIOR.regroupDist && !this.target;
            // 跟著戰士行軍時要跟得上：歸隊的速度至少是戰士的 marchMult 倍，不然邊走邊掉隊、陣型排不起來
            const base = this.target ? this.moveSpeed : Math.max(this.moveSpeed, p.moveSpeed * WARRIOR.marchMult);
            const speed = base * (w.chargeT > 0 ? WARRIOR.javelin.chargeSpeed : 1) * (far ? WARRIOR.regroupMult : 1);
            const step = Math.min(dist, speed * deltaTime);
            this.pos.x += dx / dist * step;
            this.pos.y += dy / dist * step;
            if (Math.abs(dx) > 0.5) this.facingDirection = dx > 0 ? 1 : -1;
        } else if (!this.target) {
            // 站定時跟陣型面向同一邊
            this.facingDirection = w.fx >= 0 ? 1 : -1;
        }
        if (this.target && this.attackCooldown <= 0 && distanceSq(this.pos, this.target.pos) <= this.attackRangeSq) {
            this.facingDirection = this.target.pos.x >= this.pos.x ? 1 : -1;
            this.attackTarget();
        }
    }
    attackTarget() {
        const t = this.target;
        if (!t || !t.isAlive) return;
        const c = this.config;
        let dmg = this.attack;
        if (this.tier >= 3 && (t.isElite || t instanceof BossMonster)) dmg *= SOLDIER_TIER3_ELITE_MULT;
        if (c.type === 'Crossbowman') {
            const targets = [t];
            if (this.tier >= 2) {
                const other = monsterGrid.nearestShared(t.pos, this.attackRange);
                targets.push(other && other !== t && other.isAlive ? other : t);
            }
            for (const target of targets) {
                const pr = getProjectileFromPool();
                pr.init(this.pos.x, this.pos.y, target, c, dmg, this, this.tier >= 3 ? 1 : 0, false);
                gameState.projectiles.push(pr);
            }
        } else {
            if (c.bigMult && (t instanceof BossMonster || t.flying || t.radius >= c.bigRadius)) dmg *= c.bigMult;
            t.takeDamage(dmg);
            this.healFromDamage(dmg);
            this.onHit(t);
            if (c.type === 'Spearman' && this.tier >= 2) {
                const rSq = SPEAR_PIERCE_RADIUS * SPEAR_PIERCE_RADIUS;
                let done = false;
                monsterGrid.forEachInRadius(t.pos, SPEAR_PIERCE_RADIUS, m => {
                    if (done || m === t || !m.isAlive || distanceSq(t.pos, m.pos) > rSq) return;
                    m.takeDamage(dmg); this.onHit(m); done = true;
                });
            }
            const fx = getVisualEffectFromPool(SlashEffect);
            if (fx) { fx.init(this.pos, t.pos); gameState.visualEffects.push(fx); }
        }
        this.attackCooldown = 1 / this.attackSpeed;
    }
    // 打死了就記一筆（弩箭由 Projectile 命中時呼叫）：累積到門檻升老兵
    onHit(m) {
        if (m.isAlive) return;
        this.kills++;
        const v = WARRIOR.vetKills.filter(k => this.kills >= k).length;
        if (v <= this.vet) return;
        this.vet = v;
        this.refreshStats();
        spawnFloatText(this.pos.x, this.pos.y - 22, WARRIOR.vetNames[v - 1], '#FFD54F', 12, 1.0, 'star');
    }
    takeDamage(amount, source = null) {
        if (!this.isAlive) return;
        if (this.config.type === 'Shieldman' && this.tier >= 3 && this.blockT <= 0) {
            this.blockT = WARRIOR.blockEvery;
            spawnParticles(this.pos.x, this.pos.y, '#ECEFF1', 6, 60, 0.3, 2);
            return;
        }
        let k = this.config.type === 'Shieldman' && this.tier >= 1 ? SOLDIER_TIER1_TAKEN : 1;
        // 從陣型背後打來的加倍
        if (source && source.pos) {
            const w = warState(), p = gameState.player;
            if ((source.pos.x - p.pos.x) * w.fx + (source.pos.y - p.pos.y) * w.fy < 0) k *= WARRIOR.flankMult;
        }
        super.takeDamage(amount * k);
    }
    die() {
        if (!this.isAlive) return;
        this.isAlive = false;
        gameState.units[this.config.type].count--;
        onSummonDeath(this);
        addRage(WARRIOR.ragePerFallen);
        spawnParticles(this.pos.x, this.pos.y, '#B0BEC5', 10, 70, 0.45);
    }
    // 老兵的星星畫在血條上方
    drawHealthBar(ctx) {
        super.drawHealthBar(ctx);
        if (!this.vet) return;
        const star = getIconImage('star');
        if (!star) return;
        const y = this.pos.y - this.imageHeight * 0.5 - 12;
        for (let i = 0; i < this.vet; i++) ctx.drawImage(star, this.pos.x - this.vet * 4 + i * 8, y, 8, 8);
    }
}
class Shieldman extends Soldier { constructor(x, y, level, p) { super(x, y, CONFIG.shieldman, level, p); } }
class Spearman extends Soldier { constructor(x, y, level, p) { super(x, y, CONFIG.spearman, level, p); } }
class Crossbowman extends Soldier { constructor(x, y, level, p) { super(x, y, CONFIG.crossbowman, level, p); } }
