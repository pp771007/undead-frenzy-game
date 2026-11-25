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
    // 每次升級（任何兵種）大劍傷害成長多少（大劍本身已經跟著波數變強）；血量的成長見 onUpgrade
    drillDamage: 0.03,
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
    radius: 11, imgScaleMultiplier: 3.2, moveSpeed: 85, upgradeBonus: 0.55,
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

// ---------- 五個流派（規劃見 docs/characters.md）：各 4 張祝福、3 層與 6 層各一段共鳴；3 張專屬傳說 ----------
// 圖示名稱 = 祝福 id（icons.js）
Object.assign(SCHOOLS, {
    shieldwall: { name: '盾牆', img: 'soldier_shield.png', color: '#B0BEC5', res: [{ name: '龜甲陣', desc: '戰士站著不動時，全軍受傷 -30%' }, { name: '鐵壁', desc: '所有盾兵每 2 秒格擋一次攻擊' }] },
    phalanx: { name: '長槍方陣', img: 'soldier_spear.png', color: '#CFD8DC', res: [{ name: '槍林', desc: '每 2 秒陣型前方整排刺擊' }, { name: '馬其頓方陣', desc: '長槍兵攻速 ×1.5' }] },
    crossbow: { name: '弩陣', img: 'soldier_crossbow.png', color: '#BCAAA4', res: [{ name: '三段射', desc: '弩手攻速 +40%' }, { name: '箭雨', desc: '每 6 秒弩手對最大一群怪齊射' }] },
    berserk: { name: '狂戰', icon: 'rage', color: '#EF9A9A', res: [{ name: '熊皮戰士', desc: '狂怒結束不會虛脫' }, { name: '戰神降臨', desc: '狂怒時全軍一起狂暴' }] },
    legion: { name: '軍團紀律', icon: 'legion', color: '#FFE082', res: [{ name: '鐵律', desc: '陣型轉向快一倍' }, { name: '最後一線', desc: '人數剩三分之一時，倖存者全部視為百戰老兵' }] },
});
Object.assign(BLESSINGS, {
    wallThick: { school: 'shieldwall', name: '厚盾', max: 5, per: 0.3, desc: b => `盾兵血量 +${pct(b.per)}` },
    wallSpikes: { school: 'shieldwall', name: '尖刺盾', max: 3, per: 0.25, desc: b => `盾兵把近戰傷害的 ${pct(b.per)} 反彈回去` },
    wallTaunt: { school: 'shieldwall', name: '挑釁', max: 3, per: 0.3, desc: b => `盾兵嘲諷範圍 +${pct(b.per)}` },
    wallRotate: { school: 'shieldwall', name: '輪替有序', max: 3, per: 0.5, desc: b => `退下休息的盾兵回血 +${pct(b.per)}` },
    spearLength: { school: 'phalanx', name: '長槍', max: 3, per: 0.15, desc: b => `長槍兵刺擊距離 +${pct(b.per)}` },
    spearPower: { school: 'phalanx', name: '破甲', max: 5, per: 0.3, desc: b => `長槍兵傷害 +${pct(b.per)}` },
    spearBrace: { school: 'phalanx', name: '拒馬', max: 3, per: 0.5, desc: b => `長槍兵對首領、大型、會飛的怪再 +${pct(b.per)}` },
    spearSweep: { school: 'phalanx', name: '掃槍', max: 2, per: 1, desc: b => `長槍每一刺多刺穿 ${b.per} 隻` },
    bowReload: { school: 'crossbow', name: '快速裝填', max: 4, per: 0.25, desc: b => `弩手攻速 +${pct(b.per)}` },
    bowPower: { school: 'crossbow', name: '重弩', max: 5, per: 0.35, desc: b => `弩手傷害 +${pct(b.per)}` },
    bowRange: { school: 'crossbow', name: '遠射', max: 3, per: 0.2, desc: b => `弩手射程 +${pct(b.per)}` },
    bowVolley: { school: 'crossbow', name: '連弩', max: 2, per: 1, desc: b => `弩手每次多射 ${b.per} 支` },
    rageGain: { school: 'berserk', name: '戰意', max: 3, per: 0.3, desc: b => `怒氣累積 +${pct(b.per)}` },
    rageLength: { school: 'berserk', name: '血怒', max: 3, per: 2, desc: b => `狂怒多 ${b.per} 秒` },
    rageCleave: { school: 'berserk', name: '旋風斬', max: 3, per: 0.2, desc: b => `大劍範圍 +${pct(b.per)}` },
    rageLeech: { school: 'berserk', name: '嗜血', max: 3, per: 0.01, desc: b => `大劍每砍死一隻多回 ${pct(b.per)} 血` },
    legionCap: { school: 'legion', name: '擴編', max: 4, per: 4, desc: b => `人數上限 +${b.per}` },
    legionDrill: { school: 'legion', name: '操練', max: 2, per: 0.25, desc: b => `升老兵需要的擊殺 -${pct(b.per)}` },
    legionPay: { school: 'legion', name: '軍餉', max: 3, per: 0.15, desc: b => `升級費用 -${pct(b.per)}` },
    legionVet: { school: 'legion', name: '百戰之師', max: 3, per: 0.1, desc: b => `老兵每顆星多 +${pct(b.per)} 血量與攻擊` },
    // 傳說：改變打法
    valhalla: { school: 'legion', name: '英靈殿', legendary: true, max: 1, per: 1, desc: () => '陣亡的老兵下一波免費歸隊，星星照舊' },
    aquila: { school: 'shieldwall', name: '鷹旗', legendary: true, max: 1, per: 0.3, desc: b => `戰士身邊的士兵受致命傷時，每波撐住一次（留 ${pct(b.per)} 血）` },
    spartans: { school: 'phalanx', name: '三百壯士', legendary: true, max: 1, per: 2.5, desc: b => `人數上限減半，每個士兵血量與攻擊 ×${b.per}` },
});
// 戰士專屬成就的門檻
const WAR_ACHV = { veterans: 10, noLossWave: 20, javelinKills: 50, noRecruitWave: 10 };
// 共鳴與傳說的細部數值（說明文字只講會影響選擇的那個數）
const RES_TURTLE_TAKEN = 0.7;
const RES_IRONWALL_BLOCK = 2;
const RES_SPEARWALL_EVERY = 2, RES_SPEARWALL_LENGTH = 70;
const RES_PHALANX_RATE = 1.5;
const RES_THREE_SHOT_RATE = 1.4;
const RES_ARROWRAIN_EVERY = 6, RES_ARROWRAIN_RADIUS = 70, RES_ARROWRAIN_RANGE = 280, RES_ARROWRAIN_SHARE = 0.6;
const RES_IRONLAW_TURN = 2;
const RES_LASTSTAND_SHARE = 1 / 3;
const AQUILA_RADIUS = 140;

Object.assign(UNIT_TYPES, {
    Shieldman: { cfg: () => CONFIG.shieldman, Cls: () => Shieldman, name: '盾兵', img: 'soldier_shield.png' },
    Spearman: { cfg: () => CONFIG.spearman, Cls: () => Spearman, name: '長槍兵', img: 'soldier_spear.png' },
    Crossbowman: { cfg: () => CONFIG.crossbowman, Cls: () => Crossbowman, name: '弩手', img: 'soldier_crossbow.png' },
});

CLASSES.warrior = {
    name: '戰士', title: '鐵血軍團長', portrait: 'warrior.png', tagline: '少數精兵排成陣型，自己站最前線',
    unlock: 'wave20',
    cards: ['Shieldman', 'Spearman', 'Crossbowman'], schools: ['shieldwall', 'phalanx', 'crossbow', 'berserk', 'legion', 'soul'],
    hero: { imageName: 'warrior', baseHealth: WARRIOR.baseHealth, moveSpeed: WARRIOR.moveSpeed },
    troopCap: () => warTroopCap(),
    upgradeCostMult: () => 1 - blessVal('legionPay'),
    // 每波開始：鷹旗重新可用；英靈殿讓上一波陣亡的老兵歸隊
    onWaveStart: () => {
        for (const s of gameState.summons) if (s instanceof Soldier) s.aquilaUsed = false;
        const w = warState(), p = gameState.player;
        w.waveLosses = 0;
        while (w.fallen.length && troopCount() < warTroopCap()) {
            const f = w.fallen.shift();
            const pos = p.getSummonPosition();
            const s = new (UNIT_TYPES[f.type].Cls())(pos.x, pos.y, gameState.units[f.type].level, p);
            s.kills = f.kills;
            s.vet = vetFromKills(f.kills);
            s.refreshStats();
            s.currentHealth = s.maxHealth;
            gameState.summons.push(s);
            gameState.units[f.type].count++;
            spawnParticles(pos.x, pos.y, '#FFE082', 16, 90, 0.7, 3);
            spawnFloatText(pos.x, pos.y - 20, '英靈歸隊', '#FFE082', 12, 1.2, 'valhalla');
        }
        w.fallen.length = 0;
    },
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
    onWaveEnd: () => {
        if (gameState.currentWave >= WAR_ACHV.noLossWave && troopCount() > 0 && warState().waveLosses === 0) gameState.run.flags.warNoLoss = true;
    },
    onBossKill: () => { if (warState().berserkT > 0) gameState.run.flags.warBerserkBoss = true; },
    // 戰場遺跡：戰鼓祭壇＝全軍衝鋒＋怒氣灌滿；封印寶棺開出軍餉，每個兵種免費升一級
    onRelic: (r) => {
        const p = gameState.player, w = warState();
        if (r.kind === 'altar') {
            gameState.frenzyTimer = Math.max(gameState.frenzyTimer, RELIC_TYPES.altar.frenzy);
            w.chargeT = WARRIOR.javelin.chargeTime;
            w.exhaustT = 0;
            addRage(WARRIOR.rageMax);
            spawnFloatText(p.pos.x, p.pos.y - 34, '衝鋒！', '#FF8A80', 18, 1.1, 'rage');
            addShake(5);
            Sfx.play('nova');
            return true;
        }
        if (r.kind === 'coffin') {
            for (const type of CLASSES.warrior.cards) levelUpUnit(type);
            spawnFloatText(r.x, r.y - 30, '軍餉：全軍升一級', '#FFE082', 16, 1.4, 'coin');
            addShake(4);
            Sfx.play('upgrade');
            updateUI();
            return true;
        }
        return false;
    },
    // 成就（通關、速通、流派共鳴由 game.js 照職業產生；這裡只列戰士自己做得到的事）
    achv: {
        win: '軍團凱旋', speed: ['強行軍', '閃電突擊', '神兵天降'],
        feats: [
            ['veterans', '百戰精兵', `陣型裡同時有 ${WAR_ACHV.veterans} 個百戰老兵`, 60,
                () => gameState.summons.filter(s => s.isAlive && s instanceof Soldier && s.vet >= WARRIOR.vetKills.length).length >= WAR_ACHV.veterans],
            ['noLoss', '寸土不讓', `第 ${WAR_ACHV.noLossWave} 波以後，一整波沒有任何士兵陣亡`, 40, () => !!gameState.run.flags.warNoLoss],
            ['berserkBoss', '血怒弒王', '狂怒中打倒首領', 40, () => !!gameState.run.flags.warBerserkBoss],
            ['javelin', '投槍如雨', `一次標槍齊射打倒 ${WAR_ACHV.javelinKills} 隻`, 50, () => gameState.run.novaBest >= WAR_ACHV.javelinKills],
            ['noRecruit', '原班人馬', `一個兵都不招募，撐過第 ${WAR_ACHV.noRecruitWave} 波`, 60, () => getSurvivedWaves() >= WAR_ACHV.noRecruitWave && gameState.run.recruits === 0],
        ],
    },
    heroSpeedMult: () => warState().berserkT > 0 ? WARRIOR.berserkSpeed : warState().exhaustT > 0 ? WARRIOR.exhaustSpeed : 1,
    heroDamageTakenMult: () => WARRIOR.armorTaken * (warState().berserkT > 0 ? WARRIOR.berserkTaken : 1) * turtleTaken(),
    onHeroHurt: (lostFrac) => addRage(lostFrac * 100 * WARRIOR.ragePerHp),
    drawHero: (ctx, p) => drawWarriorHud(ctx, p),
    // 軍團長跟著部下一起操練：每升級一次任何兵種，戰士最大血量長得跟「平均一個士兵」一樣快
    // （士兵每升一級 +upgradeBonus，分到三個兵種上）。怪的攻擊指數成長，戰士站在前線，長得比士兵慢的話後期兩三下就倒
    onUpgrade: () => {
        const w = warState(), p = gameState.player;
        w.drills++;
        const gain = Math.max(1, Math.round(WARRIOR.baseHealth * SOLDIER_COMMON.upgradeBonus / CLASSES.warrior.cards.length));
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
        return { kills, rage: warState().rage, drills: warState().drills, fallen: warState().fallen };
    },
    loadExtra: (data) => {
        const left = { ...(data.kills || {}) };
        for (const s of gameState.summons) {
            if (!(s instanceof Soldier)) continue;
            const list = left[s.config.type];
            if (!list || !list.length) continue;
            s.kills = list.shift();
            s.vet = vetFromKills(s.kills);
            s.refreshStats();
            s.currentHealth = s.maxHealth;
        }
        warState().rage = data.rage || 0;
        warState().drills = data.drills || 0;
        warState().fallen = data.fallen || [];
    },
    ultimate: {
        name: '標槍', icon: 'javelin', hint: '標槍：全軍朝前方齊射，再衝鋒',
        hintRadius: () => WARRIOR.javelin.length * 0.5, cooldown: () => WARRIOR.javelin.cooldown, use: () => useJavelin(),
    },
};

// drills：這一局一共升級了幾次（軍團長跟著部下一起操練變強）；fallen：英靈殿要讓下一波歸隊的老兵；
// still：戰士這一格有沒有站著不動（龜甲陣）；lastStand：最後一線生效中；spearT／rainT：槍林、箭雨的計時
function newWarState() { return { waveLosses: 0, rage: 0, berserkT: 0, exhaustT: 0, fx: 1, fy: 0, swingT: 0, chargeT: 0, tauntT: 0, drills: 0, fallen: [], still: false, lastStand: false, spearT: 0, rainT: 0 }; }
function warState() { return gameState.war || (gameState.war = newWarState()); }
function troopCount() { return classDef().cards.reduce((n, t) => n + gameState.units[t].count, 0); }
function warTroopCap() {
    const c = WARRIOR.troopCap + blessVal('legionCap');
    return bl('spartans') ? Math.floor(c / 2) : c;
}
function vetFromKills(kills) {
    const k = 1 - blessVal('legionDrill');
    return WARRIOR.vetKills.filter(n => kills >= n * k).length;
}
// 龜甲陣：戰士站著不動時全軍受傷打折
function turtleTaken() { return res('shieldwall') >= 1 && warState().still ? RES_TURTLE_TAKEN : 1; }

function addRage(amount) {
    const w = warState();
    if (w.berserkT > 0 || w.exhaustT > 0) return;
    w.rage = Math.min(WARRIOR.rageMax, w.rage + amount * (1 + blessVal('rageGain')));
    if (w.rage < WARRIOR.rageMax) return;
    w.rage = 0;
    w.berserkT = WARRIOR.berserkTime + blessVal('rageLength');
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
    if (w.berserkT > 0) {
        w.berserkT -= dt;
        // 戰神降臨：狂怒時全軍一起狂暴
        if (res('berserk') >= 2) gameState.frenzyTimer = Math.max(gameState.frenzyTimer, w.berserkT);
        if (w.berserkT <= 0) {
            w.berserkT = 0;
            // 熊皮戰士：不會虛脫
            if (res('berserk') < 1) { w.exhaustT = WARRIOR.exhaustTime; spawnFloatText(p.pos.x, p.pos.y - 40, '虛脫', '#B0BEC5', 15, 1.2); }
        }
    }
    else if (w.exhaustT > 0) w.exhaustT = Math.max(0, w.exhaustT - dt);
    w.chargeT = Math.max(0, w.chargeT - dt);
    // 面向慢慢轉向移動方向（鐵律：快一倍）
    const mv = getMoveVector();
    w.still = Math.hypot(mv.x, mv.y) <= 0.1;
    if (!w.still) {
        const cur = Math.atan2(w.fy, w.fx), want = Math.atan2(mv.y, mv.x);
        let d = want - cur;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        const turn = WARRIOR.turnRate * (res('legion') >= 1 ? RES_IRONLAW_TURN : 1);
        const step = Math.sign(d) * Math.min(Math.abs(d), turn * dt);
        w.fx = Math.cos(cur + step); w.fy = Math.sin(cur + step);
    }
    // 最後一線：人數剩三分之一以下時全員視為百戰老兵（狀態變了才重算數值）
    const last = res('legion') >= 2 && troopCount() > 0 && troopCount() <= warTroopCap() * RES_LASTSTAND_SHARE;
    if (last !== w.lastStand) {
        w.lastStand = last;
        for (const s of gameState.summons) if (s.isAlive && s instanceof Soldier) s.refreshStats();
        if (last) spawnFloatText(p.pos.x, p.pos.y - 44, '最後一線', '#FFE082', 16, 1.4, 'legion');
    }
    if (res('phalanx') >= 1) { w.spearT -= dt; if (w.spearT <= 0) { w.spearT = RES_SPEARWALL_EVERY; spearWall(p, w); } }
    if (res('crossbow') >= 2) { w.rainT -= dt; if (w.rainT <= 0) { w.rainT = RES_ARROWRAIN_EVERY; arrowRain(p); } }
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
            const r = WARRIOR.tauntRadius * (s.tier >= 2 ? WARRIOR.tauntTier2Mult : 1) * (1 + blessVal('wallTaunt'));
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
    const range = WARRIOR.swingRange * (w.berserkT > 0 ? WARRIOR.berserkRange : 1) * (1 + blessVal('rageCleave')), rSq = range * range;
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
        const per = WARRIOR.killHeal + blessVal('rageLeech');
        const heal = Math.max(1, Math.round(p.maxHealth * Math.min(WARRIOR.killHealMax + blessVal('rageLeech') * 3, kills * per)));
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
        const type = this.config.type;
        const vet = warState().lastStand ? WARRIOR.vetKills.length : (this.vet || 0);
        const v = (1 + vet * (WARRIOR.vetBonus + blessVal('legionVet'))) * (bl('spartans') ? BLESSINGS.spartans.per : 1);
        this.maxHealth = Math.round(this.maxHealth * v * (type === 'Shieldman' ? 1 + blessVal('wallThick') : 1));
        this.attack *= v * (type === 'Spearman' ? 1 + blessVal('spearPower') : type === 'Crossbowman' ? 1 + blessVal('bowPower') : 1);
        if (type === 'Spearman') {
            this.attackRange *= 1 + blessVal('spearLength');
            if (res('phalanx') >= 2) this.attackSpeed *= RES_PHALANX_RATE;
        }
        if (type === 'Crossbowman') {
            this.attackRange *= 1 + blessVal('bowRange');
            this.attackSpeed *= (1 + blessVal('bowReload')) * (res('crossbow') >= 1 ? RES_THREE_SHOT_RATE : 1);
        }
        if (this.tier >= 1 && type !== 'Shieldman') this.attackRange *= SOLDIER_TIER1_REACH;
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
                this.currentHealth = Math.min(this.maxHealth, this.currentHealth + this.maxHealth * WARRIOR.rotateRegen * (1 + blessVal('wallRotate')) * deltaTime);
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
            const extra = (this.tier >= 2 ? 1 : 0) + bl('bowVolley');
            if (extra > 0) {
                const others = [];
                const rSq = this.attackRangeSq;
                monsterGrid.forEachInRadius(this.pos, this.attackRange, m => { if (m.isAlive && m !== t && !m.stealthed && distanceSq(this.pos, m.pos) <= rSq) others.push(m); });
                others.sort((a, b) => distanceSq(this.pos, a.pos) - distanceSq(this.pos, b.pos));
                for (let i = 0; i < extra; i++) targets.push(others[i] || t);
            }
            for (const target of targets) {
                const pr = getProjectileFromPool();
                pr.init(this.pos.x, this.pos.y, target, c, dmg, this, this.tier >= 3 ? 1 : 0, false);
                gameState.projectiles.push(pr);
            }
        } else {
            if (c.bigMult && (t instanceof BossMonster || t.flying || t.radius >= c.bigRadius)) dmg *= c.bigMult + blessVal('spearBrace');
            t.takeDamage(dmg);
            this.healFromDamage(dmg);
            this.onHit(t);
            const pierce = c.type === 'Spearman' ? (this.tier >= 2 ? 1 : 0) + bl('spearSweep') : 0;
            if (pierce > 0) {
                const rSq = SPEAR_PIERCE_RADIUS * SPEAR_PIERCE_RADIUS;
                let left = pierce;
                monsterGrid.forEachInRadius(t.pos, SPEAR_PIERCE_RADIUS, m => {
                    if (left <= 0 || m === t || !m.isAlive || distanceSq(t.pos, m.pos) > rSq) return;
                    m.takeDamage(dmg); this.onHit(m); left--;
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
        const v = vetFromKills(this.kills);
        if (v <= this.vet) return;
        this.vet = v;
        this.refreshStats();
        spawnFloatText(this.pos.x, this.pos.y - 22, WARRIOR.vetNames[v - 1], '#FFD54F', 12, 1.0, 'star');
    }
    takeDamage(amount, source = null) {
        if (!this.isAlive) return;
        const shield = this.config.type === 'Shieldman';
        // 格擋：三階盾兵每 4 秒一次；共鳴「鐵壁」讓所有盾兵每 2 秒一次
        const blockEvery = shield && res('shieldwall') >= 2 ? RES_IRONWALL_BLOCK : shield && this.tier >= 3 ? WARRIOR.blockEvery : 0;
        if (blockEvery && this.blockT <= 0) {
            this.blockT = blockEvery;
            spawnParticles(this.pos.x, this.pos.y, '#ECEFF1', 6, 60, 0.3, 2);
            return;
        }
        let k = (shield && this.tier >= 1 ? SOLDIER_TIER1_TAKEN : 1) * turtleTaken();
        // 從陣型背後打來的加倍
        if (source && source.pos) {
            const w = warState(), p = gameState.player;
            if ((source.pos.x - p.pos.x) * w.fx + (source.pos.y - p.pos.y) * w.fy < 0) k *= WARRIOR.flankMult;
            // 尖刺盾：近戰打到盾兵的反彈回去
            if (shield && bl('wallSpikes') && source instanceof Monster && source.isAlive) source.takeDamage(amount * blessVal('wallSpikes'));
        }
        // 鷹旗：戰士身邊的士兵受致命傷時，每波撐住一次
        if (bl('aquila') && !this.aquilaUsed && this.currentHealth - amount * k <= 0 && distanceSq(this.pos, gameState.player.pos) <= AQUILA_RADIUS * AQUILA_RADIUS) {
            this.aquilaUsed = true;
            this.currentHealth = Math.max(1, Math.round(this.maxHealth * BLESSINGS.aquila.per));
            this.hitFlash = CONFIG.visuals.hitFlashDuration;
            spawnFloatText(this.pos.x, this.pos.y - 20, '鷹旗', '#FFE082', 12, 1.0, 'aquila');
            return;
        }
        super.takeDamage(amount * k);
    }
    die() {
        if (!this.isAlive) return;
        this.isAlive = false;
        gameState.units[this.config.type].count--;
        warState().waveLosses++;
        // 英靈殿：有星星的老兵下一波歸隊
        if (bl('valhalla') && this.vet > 0) warState().fallen.push({ type: this.config.type, kills: this.kills });
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
// 共鳴「槍林」：陣型前方一整排被長槍刺一輪（傷害＝場上長槍兵平均攻擊力）
function spearWall(p, w) {
    const spears = gameState.summons.filter(s => s.isAlive && s instanceof Spearman && !s.resting);
    if (!spears.length) return;
    const dmg = spears.reduce((a, s) => a + s.attack, 0) / spears.length;
    const halfW = WARRIOR.rowSize * WARRIOR.colGap / 2, from = WARRIOR.frontDist - WARRIOR.rowGap, to = WARRIOR.frontDist + RES_SPEARWALL_LENGTH;
    let any = false;
    for (const m of gameState.monsters) {
        if (!m.isAlive || m.stealthed) continue;
        const dx = m.pos.x - p.pos.x, dy = m.pos.y - p.pos.y;
        const along = dx * w.fx + dy * w.fy, side = Math.abs(dx * -w.fy + dy * w.fx);
        if (along < from || along > to || side > halfW) continue;
        m.takeDamage(dmg);
        any = true;
    }
    if (!any) return;
    const fx = new JavelinEffect(spears.map(s => ({ x: s.pos.x, y: s.pos.y })), w.fx, w.fy, RES_SPEARWALL_LENGTH, 0.15);
    gameState.visualEffects.push(fx);
}
// 共鳴「箭雨」：射程內最密的一群怪被所有弩手齊射一輪
function arrowRain(p) {
    const bows = gameState.summons.filter(s => s.isAlive && s instanceof Crossbowman);
    if (!bows.length) return;
    const near = gameState.monsters.filter(m => m.isAlive && !m.stealthed && distanceSq(m.pos, p.pos) <= RES_ARROWRAIN_RANGE * RES_ARROWRAIN_RANGE);
    if (!near.length) return;
    const rSq = RES_ARROWRAIN_RADIUS * RES_ARROWRAIN_RADIUS;
    let best = near[0], bestN = 0;
    for (const m of near) {
        let n = 0;
        for (const o of near) if (distanceSq(m.pos, o.pos) <= rSq) n++;
        if (n > bestN) { bestN = n; best = m; }
    }
    const dmg = bows.reduce((a, s) => a + s.attack, 0) * RES_ARROWRAIN_SHARE;
    const c = { x: best.pos.x, y: best.pos.y };
    for (const m of near) if (distanceSq(m.pos, c) <= rSq) m.takeDamage(dmg);
    gameState.visualEffects.push(new ArrowRainEffect(c, RES_ARROWRAIN_RADIUS));
}
class ArrowRainEffect extends TimedEffect {
    constructor(pos, radius) {
        super(pos, 0.45);
        this.radius = radius;
        this.drops = Array.from({ length: 14 }, () => { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * radius; return { x: Math.cos(a) * r, y: Math.sin(a) * r, d: Math.random() * 0.2 }; });
    }
    draw(ctx) {
        const t = this.duration - this.life;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.25 * Math.min(1, this.life * 4);
        ctx.fillStyle = '#8D6E63';
        ctx.beginPath(); ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        for (const d of this.drops) {
            const k = Math.min(1, Math.max(0, (t - d.d) / 0.15));
            if (k <= 0) continue;
            const x = this.pos.x + d.x, y = this.pos.y + d.y - (1 - k) * 60;
            ctx.strokeStyle = '#5D4037'; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(x - 3, y - 14); ctx.lineTo(x, y); ctx.stroke();
        }
        ctx.restore();
    }
}

class Shieldman extends Soldier { constructor(x, y, level, p) { super(x, y, CONFIG.shieldman, level, p); } }
class Spearman extends Soldier { constructor(x, y, level, p) { super(x, y, CONFIG.spearman, level, p); } }
class Crossbowman extends Soldier { constructor(x, y, level, p) { super(x, y, CONFIG.crossbowman, level, p); } }
