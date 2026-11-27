// 武僧 · 少林拳師（規劃見 docs/characters.md 第 3 節）
// 核心是「連擊」：沒有任何手下，所有靈魂都花在自己身上。武僧自動在身邊的怪之間瞬步出拳，每打中一下連擊 +1、
// 連擊越高傷害越高；被打中一下連擊歸零。站著不動、身邊沒怪時入定：回血、蓄氣，下一拳依蓄氣加倍——衝還是坐。
// 典故：少林「七十二藝」分內功、外功、硬功、輕功、氣功五類（五個流派照這五類）；達摩面壁九年、一葦渡江；十八羅漢；十三棍僧救唐王。
// 這個檔在 game.js 之後載入，用的是 game.js 的全域；game.js 的 init 等所有腳本載完才跑

const MONK = {
    baseHealth: 100,
    moveSpeed: 105,
    // 瞬步出拳：每 interval 秒，瞬步到 blink 內最近的怪身邊打一拳
    // 武僧本人就是他的大軍：輸出要跟同一波法師整支骷髏隊差不多（第 8 波約每秒 100）
    punch: { interval: 0.35, blink: 60, reach: 26, damage: 16 },
    // 每一拳的拳風波及身邊 splash 內的怪（share 的傷害）：武僧沒有手下，一隻一隻打清不完一整群
    splash: 40, splashShare: 0.7,
    // 每一拳打出的傷害回 leech 的血（運氣調息）
    leech: 0.06,
    // 練過的身體：常駐受傷 ×armorTaken、dodge 機率閃過（武僧整場都在怪堆裡，所有怪都衝著他來）
    armorTaken: 0.75, dodge: 0.08,
    // 連擊：每 10 下傷害 +comboStep，最多 +comboMax
    comboStep: 0.05, comboMax: 2,
    // 禪定：不動、沒被打 zenDelay 秒，而且 zenSafe 內沒有怪就入定；每秒回 zenHeal、蓄氣，最多蓄 zenCharge 秒（下一拳 ×(1+蓄氣秒數)）；
    // 入定時連擊每秒掉 zenDecay
    zenDelay: 1.5, zenSafe: 70, zenHeal: 0.03, zenCharge: 3, zenDecay: 5,
    // 每修練一次任何一張卡，最大血量 +基礎血量的 trainHp（武僧站在怪堆裡，血不跟著長的話後期一下就倒）
    trainHp: 0.1,
    // 氣功波：每 qiEvery 拳打出一道直線氣功（長 qiLength、寬 qiWidth）
    qiEvery: 8, qiLength: 220, qiWidth: 30, qiDamage: 10,
    // 大招「十八羅漢陣」：radius 內所有怪每 tick 秒挨一輪拳，duration 秒，武僧在陣中無敵
    arhats: { cooldown: 26, duration: 6, radius: 95, tick: 0.5, damage: 6, count: 18 },
};

OPTIONAL_ART.monk = 'monk.png';
OPTIONAL_ART.arhat = 'arhat.png';
OPTIONAL_ART.staff_monk = 'staff_monk.png';

// 三張卡都只修練：拳（外功）、步（輕功）、氣（氣功）
CONFIG.fist = { type: 'Fist', upgradeBonus: 0.15, summonCost: 0, upgradeCostBase: 18, upgradeCostInc: 8 };
CONFIG.step = { type: 'Step', upgradeBonus: 0.04, summonCost: 0, upgradeCostBase: 20, upgradeCostInc: 9 };
CONFIG.qi = { type: 'Qi', upgradeBonus: 0.2, summonCost: 0, upgradeCostBase: 22, upgradeCostInc: 10 };
// 十三棍僧（傳說）：每波開頭來助陣、時間到離開
CONFIG.staffMonk = {
    type: 'StaffMonk', imageName: 'staff_monk', color: '#FFB74D', radius: 11, imgScaleMultiplier: 3.6,
    baseHealth: 80, baseAttack: 10, attackRange: 30, attackSpeed: 1.2, moveSpeed: 120, upgradeBonus: 0.15,
    targetSearchRadius: 220, returnDistance: 50, avoidanceRadius: 13, avoidanceForce: 100, playerAvoidanceForce: 40,
    wanderRadius: 20, wanderSpeedFactor: 0.3, wanderIntervalMin: 2, wanderIntervalMax: 4, summonCost: 0, upgradeCostBase: 0, upgradeCostInc: 0,
};
const STAFF_MONKS = 13, STAFF_MONK_TIME = 15;
// 金剛怒目：震波半徑 = 基礎 + 每下連擊多少（封頂），傷害 = 拳 × 斷掉當下的連擊加成 × share
const VAJRA_MIN_COMBO = 20, VAJRA_RADIUS = 40, VAJRA_RADIUS_PER = 0.6, VAJRA_RADIUS_MAX = 150, VAJRA_SHARE = 1.5, VAJRA_KNOCK = 240;
// 回龍勁：回程最多飛多遠（追著武僧跑，離太遠就散掉）、碰到武僧多近算收回
const RETURN_QI_MAX = 1.6, RETURN_QI_CATCH = 18, RETURN_QI_TRAIL = 9;
// 雙流派：如影隨形（路上的怪挨幾成的拳、離路線多近算穿過）、丹田爆發（氣功波寬幾倍）、鐵拳（每幾下連擊減多少傷、最多減多少）
const SHADOW_FIST_SHARE = 0.5, SHADOW_FIST_WIDTH = 20, DANTIAN_WIDTH = 3, IRON_FIST_EVERY = 50, IRON_FIST_STEP = 0.05, IRON_FIST_MAX = 0.3;

Object.assign(CONFIG.evolution.names, {
    Fist: ['羅漢拳', '伏虎拳', '如來神掌'],
    Step: ['一葦步', '凌波步', '縮地成寸'],
    Qi: ['小周天', '大周天', '先天罡氣'],
});
Object.assign(CONFIG.evolution.perks, {
    Fist: ['每拳打兩下', '拳風擊退身邊的怪', '每 10 拳一記龍拳（×5）'],
    Step: ['10% 機率閃過攻擊', '瞬步時無敵一瞬', '瞬步範圍加倍'],
    Qi: ['每 6 拳就打出氣功波', '氣功波打到底會炸開', '一次打出兩道氣功波'],
});
const FIST_TIER2_KNOCK = 140, FIST_TIER3_EVERY = 10, FIST_TIER3_MULT = 5;
const STEP_TIER1_DODGE = 0.1, STEP_TIER2_IFRAME = 0.15, STEP_TIER3_RANGE = 2;
const QI_TIER1_EVERY = 6, QI_TIER2_BLAST = 50;

// ---------- 五個流派（七十二藝五類）：各 4 張祝福，3 層與 6 層各一段共鳴；每個流派一張傳說。圖示名稱 = 祝福 id（icons.js） ----------
Object.assign(SCHOOLS, {
    external: { name: '外功', icon: 'external', color: '#FFAB91', res: [{ name: '連環', desc: '出拳快 20%' }, { name: '千手', desc: '連擊 100 以上，每一拳都多打兩下' }] },
    hardstyle: { name: '硬功', icon: 'hardstyle', color: '#BCAAA4', res: [{ name: '鐵布衫', desc: '一下不到 5% 血的攻擊不會打斷連擊' }, { name: '金鐘罩', desc: '每 8 秒擋下一次傷害，擋下時震退周圍' }] },
    lightfoot: { name: '輕功', icon: 'lightfoot', color: '#B2EBF2', res: [{ name: '燕子三抄', desc: '閃過攻擊後，下一拳 ×3' }, { name: '踏雪無痕', desc: '瞬步留下殘影，殘影會再打一次' }] },
    internal: { name: '內功', icon: 'internal', color: '#FFE082', res: [{ name: '小周天', desc: '打鬥中也每秒回 1% 血' }, { name: '易筋經', desc: '入定時連擊不再掉' }] },
    qigong: { name: '氣功', icon: 'qigong', color: '#80DEEA', res: [{ name: '震勁', desc: '氣功波會擊退' }, { name: '隔山打牛', desc: '氣功波穿過的第一隻怪不受傷，後面的怪傷害加倍' }] },
});
Object.assign(BLESSINGS, {
    punchPower: { school: 'external', name: '鐵砂掌', max: 5, per: 0.3, desc: b => `拳的傷害 +${pct(b.per)}` },
    comboCap: { school: 'external', name: '無盡連打', max: 2, per: 1, desc: b => `連擊加成上限 +${pct(b.per)}` },
    comboGain: { school: 'external', name: '勢如破竹', max: 3, per: 0.5, desc: b => `連擊每 10 下的加成 +${pct(b.per)}` },
    flurry: { school: 'external', name: '連珠拳', max: 2, per: 1, desc: b => `每拳多打 ${b.per} 下` },
    ironBody: { school: 'hardstyle', name: '銅皮', max: 3, per: 0.1, desc: b => `受到的傷害 -${pct(b.per)}` },
    counter: { school: 'hardstyle', name: '借力', max: 3, per: 0.3, desc: b => `把近身攻擊的 ${pct(b.per)} 打回去` },
    steadfast: { school: 'hardstyle', name: '不動如山', max: 3, per: 0.15, desc: b => `被打中時 ${pct(b.per)} 機率不斷連擊` },
    stoneSkin: { school: 'hardstyle', name: '石身', max: 3, per: 0.2, desc: b => `最大血量 +${pct(b.per)}` },
    blinkRange: { school: 'lightfoot', name: '縱躍', max: 3, per: 0.2, desc: b => `瞬步距離 +${pct(b.per)}` },
    evade: { school: 'lightfoot', name: '閃身', max: 3, per: 0.08, desc: b => `${pct(b.per)} 機率閃過攻擊` },
    swift: { school: 'lightfoot', name: '神行', max: 3, per: 0.12, desc: b => `移速 +${pct(b.per)}` },
    quickStep: { school: 'lightfoot', name: '踏影', max: 3, per: 0.12, desc: b => `出拳間隔 -${pct(b.per)}` },
    zenHeal: { school: 'internal', name: '吐納', max: 3, per: 0.5, desc: b => `入定回血 +${pct(b.per)}` },
    zenCharge: { school: 'internal', name: '蓄勁', max: 3, per: 1, desc: b => `最多多蓄 ${b.per} 秒的氣` },
    zenFast: { school: 'internal', name: '收心', max: 2, per: 0.5, desc: b => `入定前要等的時間 -${b.per} 秒` },
    zenPulse: { school: 'internal', name: '靜中有動', max: 1, per: 1, desc: () => '入定時每秒震傷身邊的怪' },
    qiPower: { school: 'qigong', name: '真氣', max: 5, per: 0.35, desc: b => `氣功波傷害 +${pct(b.per)}` },
    qiCount: { school: 'qigong', name: '雙掌', max: 2, per: 1, desc: b => `多打出 ${b.per} 道氣功波` },
    qiWidth: { school: 'qigong', name: '排山', max: 3, per: 0.3, desc: b => `氣功波變寬 ${pct(b.per)}` },
    qiFreq: { school: 'qigong', name: '運氣', max: 3, per: 1, desc: b => `少打 ${b.per} 拳就能出氣功波` },
    bodhidharma: { school: 'internal', name: '達摩面壁', legendary: true, max: 1, per: 9, desc: b => `入定滿 ${b.per} 秒頓悟：10 秒無敵、傷害 ×2` },
    reedCrossing: { school: 'lightfoot', name: '一葦渡江', legendary: true, max: 1, per: 3, desc: b => `瞬步走過的路長出蘆葦，${b.per} 秒內刺傷踩上去的怪` },
    thirteenMonks: { school: 'external', name: '十三棍僧', legendary: true, max: 1, per: STAFF_MONKS, desc: b => `每波開始時 ${b.per} 名棍僧助陣 ${STAFF_MONK_TIME} 秒` },
    // 金剛怒目：被打斷是武僧最大的懲罰，硬功把它變成反擊——疊得越高，斷的那一下炸得越大
    vajraWrath: { school: 'hardstyle', name: '金剛怒目', legendary: true, max: 1, per: VAJRA_MIN_COMBO, desc: b => `連擊 ${b.per} 以上被打斷時炸出震波，斷掉的連擊越多炸得越大` },
    // 回龍勁：同一排怪挨兩次，站位要讓怪排在你和波的路線上
    returningQi: { school: 'qigong', name: '回龍勁', legendary: true, max: 1, per: 1, desc: () => '氣功波飛到盡頭會折返，回程再打一次' },
    // ---- 雙流派傳說（兩個流派都到 3 層才出現）----
    shadowFist: { school: DUO_SCHOOL, duo: ['external', 'lightfoot'], name: '如影隨形', legendary: true, max: 1, per: SHADOW_FIST_SHARE, desc: () => '瞬步穿過的路上，每隻怪都挨一拳' },
    dantianBurst: { school: DUO_SCHOOL, duo: ['internal', 'qigong'], name: '丹田爆發', legendary: true, max: 1, per: DANTIAN_WIDTH, desc: b => `蓄氣的那一拳，同時打出 ${b.per} 倍寬的氣功波` },
    ironFist: { school: DUO_SCHOOL, duo: ['hardstyle', 'external'], name: '鐵拳', legendary: true, max: 1, per: IRON_FIST_STEP, desc: b => `連擊每 ${IRON_FIST_EVERY} 下，受到的傷害 -${pct(b.per)}（最多 -${pct(IRON_FIST_MAX)}）` },
});
const RES_CHAIN_RATE = 1.2;
const RES_THOUSAND_COMBO = 100, RES_THOUSAND_HITS = 2;
const RES_IRONSHIRT_HIT = 0.05;
const RES_GOLDBELL_EVERY = 8, RES_GOLDBELL_RADIUS = 80, RES_GOLDBELL_KNOCK = 260;
const RES_SWALLOW_MULT = 3;
const RES_ZHOUTIAN_HEAL = 0.01;
const RES_QI_KNOCK = 180;
const ZEN_PULSE_RADIUS = 70, ZEN_PULSE_SHARE = 0.5;
const ENLIGHTEN_TIME = 10, ENLIGHTEN_MULT = 2;
const REED_EVERY = 14, REED_RADIUS = 16, REED_TICK = 0.5, REED_SHARE = 0.3;
const MONK_ACHV = { combo: 500, cleanWave: 15, zen: 9, arhatKills: 100 };

Object.assign(UNIT_TYPES, {
    Fist: { cfg: () => CONFIG.fist, Cls: () => null, name: '拳', img: iconDataUrl('external'), upgradeOnly: true, upgradeLabel: '修練' },
    Step: { cfg: () => CONFIG.step, Cls: () => null, name: '步', img: iconDataUrl('lightfoot'), upgradeOnly: true, upgradeLabel: '修練' },
    Qi: { cfg: () => CONFIG.qi, Cls: () => null, name: '氣', img: iconDataUrl('qigong'), upgradeOnly: true, upgradeLabel: '修練' },
    StaffMonk: { cfg: () => CONFIG.staffMonk, Cls: () => StaffMonk, name: '棍僧', img: 'staff_monk.png' },
});

CLASSES.monk = {
    name: '武僧', title: '少林拳師', portrait: 'monk.png', tagline: '沒有手下，連擊就是一切',
    // 武僧沒有大軍、主角站最前面挨打，普攻一下扣多少有上限（game.js 的 MELEE_HERO_HIT_RATIO）時，跟其他職業用同一套怪物加強；
    // 調低（0.7）的話機器人沒強化也幾乎都通關（見 game.js 的 monsterRamp）
    monsterPressure: 1.0,
    unlock: 'streak1000',
    cards: ['Fist', 'Step', 'Qi'], schools: ['external', 'hardstyle', 'lightfoot', 'internal', 'qigong', 'soul'],
    metaUpgrades: {
        evade: { icon: 'evade', name: '金剛身法', max: 5, per: 0.02, costBase: 30, desc: m => `${pct(m.per)} 機率閃過攻擊`, total: (m, lv) => `${pct(m.per * lv)}` },
        comboCap: { icon: 'comboCap', name: '連打修練', max: 5, per: 0.1, costBase: 30, desc: m => `連擊加成上限 +${pct(m.per)}`, total: (m, lv) => `+${pct(m.per * lv)}` },
        zenHeal: { icon: 'zenHeal', name: '吐納心法', max: 4, per: 0.15, costBase: 25, desc: m => `入定回血 +${pct(m.per)}`, total: (m, lv) => `+${pct(m.per * lv)}` },
    },
    hero: { imageName: 'monk', baseHealth: MONK.baseHealth, moveSpeed: MONK.moveSpeed },
    attack: (p, dt) => monkPunch(p, dt),
    update: (dt) => monkUpdate(dt),
    reset: () => { gameState.monk = newMonkState(); },
    onUpgrade: () => {
        const p = gameState.player, gain = Math.max(1, Math.round(MONK.baseHealth * MONK.trainHp * (1 + blessVal('stoneSkin'))));
        p.maxHealth += gain;
        p.currentHealth += gain;
    },
    onWaveStart: () => {
        const k = monkState();
        k.waveHit = false;
        if (bl('thirteenMonks')) for (let i = 0; i < STAFF_MONKS; i++) {
            const a = i / STAFF_MONKS * Math.PI * 2, p = gameState.player;
            gameState.summons.push(new StaffMonk(p.pos.x + Math.cos(a) * 50, p.pos.y + Math.sin(a) * 50, gameState.units.Fist.level, p));
            gameState.units.StaffMonk.count++;
        }
    },
    onWaveEnd: () => { if (gameState.currentWave >= MONK_ACHV.cleanWave && !monkState().waveHit) gameState.run.flags.monkClean = true; },
    heroSpeedMult: () => 1 + blessVal('swift'),
    heroDamageTakenMult: () => {
        const k = monkState(), p = gameState.player;
        if (k.arhatT > 0 || k.enlightenT > 0 || k.iframeT > 0) return 0;
        // 金鐘罩：定時擋下一次
        if (res('hardstyle') >= 2 && k.bellT <= 0) {
            k.bellT = RES_GOLDBELL_EVERY;
            monsterGrid.forEachInRadius(p.pos, RES_GOLDBELL_RADIUS, m => {
                if (!m.isAlive || m instanceof BossMonster) return;
                const d = normalizeVector({ x: m.pos.x - p.pos.x, y: m.pos.y - p.pos.y });
                m.knockVel = { x: d.x * RES_GOLDBELL_KNOCK, y: d.y * RES_GOLDBELL_KNOCK };
            });
            spawnFloatText(p.pos.x, p.pos.y - 34, '金鐘罩', '#FFE082', 14, 0.8, 'hardstyle');
            gameState.visualEffects.push(new BellEffect(p.pos));
            return 0;
        }
        if (Math.random() < MONK.dodge + blessVal('evade') + classMeta('evade') + (getTier(gameState.units.Step.level) >= 1 ? STEP_TIER1_DODGE : 0)) {
            if (res('lightfoot') >= 1) k.swallow = true;
            spawnFloatText(p.pos.x, p.pos.y - 30, '閃', '#B2EBF2', 12, 0.5);
            return 0;
        }
        return MONK.armorTaken * (1 - blessVal('ironBody')) * (1 - ironFistCut());
    },
    // 被打中：連擊歸零（硬功可以撐住）、入定被打斷、借力打回去
    onHeroHurt: (lostFrac) => {
        const k = monkState();
        k.waveHit = true;
        k.zenT = 0; k.stillT = 0;
        if (!(res('hardstyle') >= 1 && lostFrac < RES_IRONSHIRT_HIT) && Math.random() >= blessVal('steadfast')) {
            if (bl('vajraWrath') && k.combo >= VAJRA_MIN_COMBO) vajraBlast(k.combo);
            else if (k.combo >= 20) spawnFloatText(gameState.player.pos.x, gameState.player.pos.y - 40, '斷', '#90A4AE', 14, 0.7);
            k.combo = 0;
        }
        if (bl('counter')) monsterGrid.forEachInRadius(gameState.player.pos, 30, m => { if (m.isAlive) m.takeDamage(punchDamage() * blessVal('counter')); });
    },
    onBossKill: (b) => { if (b.lastQiHit) gameState.run.flags.monkQiBoss = true; },
    // 戰場遺跡：靈泉變成禪修之地（站在裡面入定效果加倍，見 monkUpdate）；戰鼓祭壇給連擊 +50
    onRelic: (r) => {
        if (r.kind !== 'altar') return false;
        const k = monkState(), p = gameState.player;
        k.combo += ALTAR_COMBO;
        spawnFloatText(p.pos.x, p.pos.y - 34, `連擊 +${ALTAR_COMBO}`, '#FFAB91', 18, 1.2, 'external');
        addShake(5);
        Sfx.play('nova');
        return true;
    },
    drawHero: (ctx, p) => drawMonkHud(ctx, p),
    drawWorld: (ctx) => drawMonkWorld(ctx),
    saveExtra: () => ({ combo: monkState().combo }),
    loadExtra: (data) => { monkState().combo = data.combo || 0; },
    achv: {
        win: '少林方丈', speed: ['腳踏實地', '健步如飛', '一日千里'],
        feats: [
            ['combo', '千錘百鍊', `連擊 ${MONK_ACHV.combo}`, 50, () => monkState().bestCombo >= MONK_ACHV.combo],
            ['clean', '片葉不沾身', `第 ${MONK_ACHV.cleanWave} 波以後，一整波沒被打中`, 50, () => !!gameState.run.flags.monkClean],
            ['zen', '面壁', `入定滿 ${MONK_ACHV.zen} 秒`, 30, () => monkState().bestZen >= MONK_ACHV.zen],
            ['arhats', '羅漢降世', `一次十八羅漢陣打倒 ${MONK_ACHV.arhatKills} 隻`, 50, () => gameState.run.novaBest >= MONK_ACHV.arhatKills],
            ['qiBoss', '氣貫長虹', '用氣功波打倒首領', 40, () => !!gameState.run.flags.monkQiBoss],
        ],
    },
    ultimate: {
        name: '羅漢陣', icon: 'arhats', hint: '十八羅漢陣：陣裡的怪挨打，你無敵',
        hintRadius: () => MONK.arhats.radius, cooldown: () => MONK.arhats.cooldown, use: () => useArhats(),
    },
};
const ALTAR_COMBO = 50;
const ZEN_SPRING_MULT = 2;

// combo：目前連擊；stillT：站著不動、沒被打多久；zenT：入定了多久（>0 就是入定中）；charge：蓄了幾秒的氣
function newMonkState() {
    return { combo: 0, bestCombo: 0, punchT: 0, punches: 0, stillT: 0, zenT: 0, bestZen: 0, charge: 0, bellT: 0, iframeT: 0, swallow: false,
        arhatT: 0, arhatTick: 0, arhatKills: 0, arhatPos: null, enlightenT: 0, waves: [], ghosts: [], reeds: [], reedDist: 0, lastX: null, lastY: null, waveHit: false };
}
function monkState() { return gameState.monk || (gameState.monk = newMonkState()); }
function comboMult() {
    const k = monkState();
    return 1 + Math.min(MONK.comboMax + blessVal('comboCap') + classMeta('comboCap'), Math.floor(k.combo / 10) * MONK.comboStep * (1 + blessVal('comboGain')));
}
function punchDamage() {
    return MONK.punch.damage * getWaveStatMultiplier(Math.max(1, gameState.currentWave)) * runMods().boltDmgMult
        * (1 + gameState.units.Fist.level * CONFIG.fist.upgradeBonus) * (1 + blessVal('punchPower')) * (monkState().enlightenT > 0 ? ENLIGHTEN_MULT : 1);
}

// ---------- 每格：入定、羅漢陣、氣功波、殘影、蘆葦 ----------
function monkUpdate(dt) {
    const k = monkState(), p = gameState.player;
    if (!p) return;
    k.bellT = Math.max(0, k.bellT - dt);
    k.iframeT = Math.max(0, k.iframeT - dt);
    k.enlightenT = Math.max(0, k.enlightenT - dt);
    const mv = getMoveVector(), moving = Math.hypot(mv.x, mv.y) > 0.1;
    const spring = gameState.relics.some(r => r.kind === 'spring' && !r.done && distanceSq(r, p.pos) <= RELIC_RADIUS * RELIC_RADIUS);
    // 入定：不動、沒被打一陣子，而且身邊沒有怪
    if (moving || monsterGrid.anyWithin(p.pos, MONK.zenSafe)) { k.stillT = 0; if (k.zenT > 0) leaveZen(); }
    else {
        k.stillT += dt;
        if (k.stillT >= Math.max(0.3, MONK.zenDelay - blessVal('zenFast'))) {
            k.zenT += dt;
            k.bestZen = Math.max(k.bestZen, k.zenT);
            const boost = spring ? ZEN_SPRING_MULT : 1;
            p.currentHealth = Math.min(p.maxHealth, p.currentHealth + p.maxHealth * MONK.zenHeal * (1 + blessVal('zenHeal') + classMeta('zenHeal')) * boost * dt);
            k.charge = Math.min(MONK.zenCharge + blessVal('zenCharge'), k.charge + dt * boost);
            if (res('internal') < 2) k.combo = Math.max(0, k.combo - MONK.zenDecay * dt);
            // 達摩面壁：入定滿 9 秒頓悟
            if (bl('bodhidharma') && k.zenT >= BLESSINGS.bodhidharma.per && k.enlightenT <= 0 && !k.enlightened) {
                k.enlightened = true;
                k.enlightenT = ENLIGHTEN_TIME;
                spawnFloatText(p.pos.x, p.pos.y - 44, '頓悟！', '#FFE082', 20, 1.6, 'bodhidharma');
                spawnParticles(p.pos.x, p.pos.y, '#FFE082', 40, 180, 0.8, 3);
            }
            if (bl('zenPulse') && Math.floor(k.zenT) !== Math.floor(k.zenT - dt)) {
                monsterGrid.forEachInRadius(p.pos, ZEN_PULSE_RADIUS, m => { if (m.isAlive) m.takeDamage(punchDamage() * ZEN_PULSE_SHARE); });
            }
        }
    }
    if (res('internal') >= 1 && k.zenT <= 0) p.currentHealth = Math.min(p.maxHealth, p.currentHealth + p.maxHealth * RES_ZHOUTIAN_HEAL * dt);
    // 十八羅漢陣
    if (k.arhatT > 0) {
        k.arhatT -= dt; k.arhatTick -= dt;
        if (k.arhatTick <= 0) {
            k.arhatTick = MONK.arhats.tick;
            const A = MONK.arhats, c = k.arhatPos, rSq = A.radius * A.radius;
            const dmg = A.damage * getWaveStatMultiplier(Math.max(1, gameState.currentWave)) * (1 + gameState.units.Fist.level * CONFIG.fist.upgradeBonus) * comboMult();
            monsterGrid.forEachInRadius(c, A.radius, m => { if (m.isAlive && distanceSq(m.pos, c) <= rSq) { m.takeDamage(dmg); if (!m.isAlive) k.arhatKills++; } });
        }
        if (k.arhatT <= 0) gameState.run.novaBest = Math.max(gameState.run.novaBest, k.arhatKills);
    }
    updateQiWaves(dt);
    for (let i = k.ghosts.length - 1; i >= 0; i--) { k.ghosts[i].life -= dt; if (k.ghosts[i].life <= 0) k.ghosts.splice(i, 1); }
    // 一葦渡江：走過的路長蘆葦
    if (k.lastX !== null && bl('reedCrossing')) {
        k.reedDist += Math.hypot(p.pos.x - k.lastX, p.pos.y - k.lastY);
        if (k.reedDist >= REED_EVERY) { k.reedDist = 0; k.reeds.push({ x: p.pos.x, y: p.pos.y, life: BLESSINGS.reedCrossing.per, tick: 0 }); }
    }
    k.lastX = p.pos.x; k.lastY = p.pos.y;
    for (let i = k.reeds.length - 1; i >= 0; i--) {
        const r = k.reeds[i];
        r.life -= dt; r.tick -= dt;
        if (r.tick <= 0) { r.tick = REED_TICK; groundMonsterGrid.forEachInRadius(r, REED_RADIUS, m => { if (m.isAlive && distanceSq(m.pos, r) <= REED_RADIUS * REED_RADIUS) m.takeDamage(punchDamage() * REED_SHARE); }); }
        if (r.life <= 0) k.reeds.splice(i, 1);
    }
}
function leaveZen() {
    const k = monkState();
    k.zenT = 0;
    k.enlightened = false;
}

// ---------- 瞬步出拳 ----------
function monkPunch(p, dt) {
    const k = monkState();
    if (k.zenT > 0) return;
    const rate = (res('external') >= 1 ? RES_CHAIN_RATE : 1) / (1 - blessVal('quickStep'));
    k.punchT -= dt * rate;
    if (k.punchT > 0) return;
    const stepTier = getTier(gameState.units.Step.level);
    const blink = (MONK.punch.blink + gameState.units.Step.level * CONFIG.step.upgradeBonus * MONK.punch.blink) * (1 + blessVal('blinkRange')) * (stepTier >= 3 ? STEP_TIER3_RANGE : 1);
    const t = monsterGrid.nearestShared(p.pos, blink + MONK.punch.reach);
    if (!t || !t.isAlive || t.stealthed) return;
    k.punchT = MONK.punch.interval;
    // 瞬步：貼到牠身邊
    const dx = t.pos.x - p.pos.x, dy = t.pos.y - p.pos.y, d = Math.hypot(dx, dy) || 1;
    if (d > MONK.punch.reach) {
        const from = { x: p.pos.x, y: p.pos.y };
        const stop = d - MONK.punch.reach * 0.8;
        p.pos.x += dx / d * stop; p.pos.y += dy / d * stop;
        p.facingDirection = dx >= 0 ? 1 : -1;
        if (stepTier >= 2) k.iframeT = STEP_TIER2_IFRAME;
        if (res('lightfoot') >= 2) k.ghosts.push({ x: from.x, y: from.y, life: 0.35, target: t });
        spawnParticles(from.x, from.y, '#B2EBF2', 5, 40, 0.3, 2);
        if (bl('shadowFist')) shadowFistPath(from, p.pos, t);
    }
    let dmg = punchDamage() * comboMult();
    if (k.charge > 0) {
        if (bl('dantianBurst')) fireQi(p, t, DANTIAN_WIDTH, 1 + k.charge);
        dmg *= 1 + k.charge; k.charge = 0; spawnParticles(t.pos.x, t.pos.y, '#FFE082', 12, 90, 0.4, 3);
    }
    if (k.swallow) { dmg *= RES_SWALLOW_MULT; k.swallow = false; }
    k.punches++;
    const fistTier = getTier(gameState.units.Fist.level);
    if (fistTier >= 3 && k.punches % FIST_TIER3_EVERY === 0) { dmg *= FIST_TIER3_MULT; spawnFloatText(t.pos.x, t.pos.y - 24, '龍拳', '#FF8A65', 13, 0.7); }
    const hits = 1 + (fistTier >= 1 ? 1 : 0) + bl('flurry') + (res('external') >= 2 && k.combo >= RES_THOUSAND_COMBO ? RES_THOUSAND_HITS : 0);
    strikeMonk(t, dmg, hits, fistTier >= 2);
    // 殘影：踏雪無痕
    for (const g of k.ghosts) if (g.target === t && !g.struck) { g.struck = true; strikeMonk(t, dmg * 0.5, 1, false); }
    // 氣功波
    const every = Math.max(2, (getTier(gameState.units.Qi.level) >= 1 ? QI_TIER1_EVERY : MONK.qiEvery) - bl('qiFreq'));
    if (k.punches % every === 0) fireQi(p, t);
    gameState.visualEffects.push(new PunchEffect(t.pos));
    Sfx.play('hit');
}
// knock：二階「拳風擊退」
function strikeMonk(t, dmg, hits, knock) {
    const k = monkState(), p = gameState.player;
    let dealt = 0;
    for (let i = 0; i < hits && t.isAlive; i++) {
        t.takeDamage(dmg);
        dealt += dmg;
        k.combo++;
    }
    if (p && p.currentHealth < p.maxHealth) p.currentHealth = Math.min(p.maxHealth, p.currentHealth + dealt * MONK.leech);
    k.bestCombo = Math.max(k.bestCombo, k.combo);
    const rSq = MONK.splash * MONK.splash;
    monsterGrid.forEachInRadius(t.pos, MONK.splash, m => {
        if (m === t || !m.isAlive || distanceSq(m.pos, t.pos) > rSq) return;
        m.takeDamage(dmg * MONK.splashShare);
        if (knock && m.isAlive && !(m instanceof BossMonster)) { const d = normalizeVector({ x: m.pos.x - p.pos.x, y: m.pos.y - p.pos.y }); m.knockVel = { x: d.x * FIST_TIER2_KNOCK, y: d.y * FIST_TIER2_KNOCK }; }
    });
}
class PunchEffect extends TimedEffect {
    constructor(pos) { super(pos, 0.16); }
    draw(ctx) {
        const k = 1 - this.life / this.duration;
        ctx.save();
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = '#FFE0B2'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(this.pos.x, this.pos.y, 6 + k * 14, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
    }
}
class BellEffect extends TimedEffect {
    constructor(pos) { super(pos, 0.4); }
    draw(ctx) {
        const k = 1 - this.life / this.duration;
        ctx.save();
        ctx.globalAlpha = (1 - k) * 0.8;
        ctx.strokeStyle = '#FFD54F'; ctx.lineWidth = 6 * (1 - k) + 2;
        ctx.beginPath(); ctx.arc(this.pos.x, this.pos.y, 20 + k * RES_GOLDBELL_RADIUS, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
    }
}

// ---------- 氣功波：一道直線，穿透 ----------
const QI_SPEED = 420;
// width／power：雙流派「丹田爆發」那一道是加寬、吃蓄氣倍率的單一金色波
function fireQi(p, t, width = 1, power = 1) {
    const k = monkState();
    const base = Math.atan2(t.pos.y - p.pos.y, t.pos.x - p.pos.x);
    const n = width > 1 ? 1 : 1 + bl('qiCount') + (getTier(gameState.units.Qi.level) >= 3 ? 1 : 0);
    const dmg = MONK.qiDamage * getWaveStatMultiplier(Math.max(1, gameState.currentWave)) * (1 + gameState.units.Qi.level * CONFIG.qi.upgradeBonus) * (1 + blessVal('qiPower')) * comboMult() * power;
    for (let i = 0; i < n; i++) {
        const a = base + (i - (n - 1) / 2) * 0.35;
        k.waves.push({ x: p.pos.x, y: p.pos.y, ux: Math.cos(a), uy: Math.sin(a), dist: 0, dmg, hit: new Set(), first: true, w: MONK.qiWidth * (1 + blessVal('qiWidth')) * width, golden: width > 1 });
    }
}
// ---------- 雙流派「如影隨形」：瞬步穿過的路上每隻怪都挨一拳 ----------
function shadowFistPath(a, b, skip) {
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
    const dmg = punchDamage() * comboMult() * SHADOW_FIST_SHARE, mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    monsterGrid.forEachInRadius(mid, len / 2 + SHADOW_FIST_WIDTH, m => {
        if (m === skip || !m.isAlive) return;
        const along = (m.pos.x - a.x) * ux + (m.pos.y - a.y) * uy, side = Math.abs((m.pos.x - a.x) * -uy + (m.pos.y - a.y) * ux);
        if (along < 0 || along > len || side > SHADOW_FIST_WIDTH + m.radius) return;
        m.takeDamage(dmg);
        monkState().combo++;
        gameState.visualEffects.push(new PunchEffect(m.pos));
    });
    addWorldFx({ kind: 'beam', x: a.x, y: a.y, dx: ux, dy: uy, len, w: 9, life: 0.25, color: '#B2EBF2' });
}
// ---------- 雙流派「鐵拳」：連擊越高越硬 ----------
function ironFistCut() { return bl('ironFist') ? Math.min(IRON_FIST_MAX, Math.floor(monkState().combo / IRON_FIST_EVERY) * IRON_FIST_STEP) : 0; }
function updateQiWaves(dt) {
    const k = monkState();
    const p = gameState.player;
    for (let i = k.waves.length - 1; i >= 0; i--) {
        const q = k.waves[i];
        const step = QI_SPEED * dt;
        // 回程：每格重新瞄準武僧現在的位置
        if (q.back) {
            const dx = p.pos.x - q.x, dy = p.pos.y - q.y, d = Math.hypot(dx, dy) || 1;
            if (d <= RETURN_QI_CATCH || q.dist >= MONK.qiLength * RETURN_QI_MAX) {
                spawnParticles(q.x, q.y, '#B2EBF2', 8, 60, 0.3, 2);
                k.waves.splice(i, 1);
                continue;
            }
            q.ux = dx / d; q.uy = dy / d;
            q.trail.push({ x: q.x, y: q.y });
            if (q.trail.length > RETURN_QI_TRAIL) q.trail.shift();
        }
        q.x += q.ux * step; q.y += q.uy * step; q.dist += step;
        const half = q.w / 2;
        monsterGrid.forEachInRadius(q, half + 16, m => {
            if (!m.isAlive || q.hit.has(m) || distanceSq(m.pos, q) > (half + m.radius) * (half + m.radius)) return;
            q.hit.add(m);
            // 隔山打牛：第一隻不受傷，後面的加倍
            let dmg = q.dmg;
            if (res('qigong') >= 2) { if (q.first) { q.first = false; return; } dmg *= 2; }
            m.lastQiHit = true;
            m.takeDamage(dmg);
            if (m.isAlive) m.lastQiHit = false;
            if (res('qigong') >= 1 && m.isAlive && !(m instanceof BossMonster)) m.knockVel = { x: q.ux * RES_QI_KNOCK, y: q.uy * RES_QI_KNOCK };
        });
        if (!q.back && q.dist >= MONK.qiLength) {
            if (getTier(gameState.units.Qi.level) >= 2) {
                monsterGrid.forEachInRadius(q, QI_TIER2_BLAST, m => { if (m.isAlive && distanceSq(m.pos, q) <= QI_TIER2_BLAST * QI_TIER2_BLAST) m.takeDamage(q.dmg * 0.5); });
                spawnParticles(q.x, q.y, '#80DEEA', 14, 100, 0.4, 3);
            }
            if (bl('returningQi')) {
                q.back = true; q.dist = 0; q.hit = new Set(); q.first = true; q.trail = [];
                gameState.visualEffects.push(new QiTurnEffect({ x: q.x, y: q.y }));
            } else k.waves.splice(i, 1);
        }
    }
}

// ---------- 傳說「回龍勁」：折返的氣功波 ----------
// 回程的波拖著一條由粗到細的青色龍身（去程是直直的一段），龍頭帶一圈旋轉的氣
const RETURN_QI_COLOR = '#26C6DA', RETURN_QI_CORE = '#E0F7FA';
function drawReturningQi(ctx, q) {
    const pts = [...q.trail, { x: q.x, y: q.y }];
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 1; i < pts.length; i++) {
        const k = i / (pts.length - 1);
        ctx.globalAlpha = 0.35 + 0.55 * k;
        ctx.strokeStyle = RETURN_QI_COLOR; ctx.lineWidth = q.w * 0.15 + q.w * 0.4 * k;
        ctx.beginPath(); ctx.moveTo(pts[i - 1].x, pts[i - 1].y); ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke();
    }
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = RETURN_QI_CORE; ctx.lineWidth = q.w * 0.12;
    ctx.beginPath(); pts.forEach((pt, i) => i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)); ctx.stroke();
    // 龍頭：三道繞著頭旋轉的氣
    const spin = worldTime * 14, r = q.w * 0.45;
    ctx.strokeStyle = RETURN_QI_COLOR; ctx.lineWidth = 2.5;
    for (let j = 0; j < 3; j++) {
        const a = spin + j * Math.PI * 2 / 3;
        ctx.beginPath(); ctx.arc(q.x, q.y, r, a, a + 1.4); ctx.stroke();
    }
    ctx.fillStyle = RETURN_QI_CORE;
    ctx.beginPath(); ctx.arc(q.x, q.y, q.w * 0.18, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}
// 折返那一下：原地捲起一圈漩渦
class QiTurnEffect extends TimedEffect {
    constructor(pos) { super(pos, 0.35); }
    draw(ctx) {
        const k = 1 - this.life / this.duration;
        ctx.save();
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = RETURN_QI_COLOR; ctx.lineWidth = 3;
        for (let j = 0; j < 4; j++) {
            const a = k * 6 + j * Math.PI / 2, r = 8 + k * 22;
            ctx.beginPath(); ctx.arc(this.pos.x, this.pos.y, r, a, a + 1.2); ctx.stroke();
        }
        ctx.restore();
    }
}

// ---------- 傳說「金剛怒目」：連擊被打斷時炸開 ----------
function vajraBlast(combo) {
    const p = gameState.player;
    const r = Math.min(VAJRA_RADIUS_MAX, VAJRA_RADIUS + combo * VAJRA_RADIUS_PER), rSq = r * r;
    const dmg = punchDamage() * comboMult() * VAJRA_SHARE;
    monsterGrid.forEachInRadius(p.pos, r, m => {
        if (!m.isAlive || distanceSq(m.pos, p.pos) > rSq) return;
        m.takeDamage(dmg);
        if (m.isAlive && !(m instanceof BossMonster)) { const d = normalizeVector({ x: m.pos.x - p.pos.x, y: m.pos.y - p.pos.y }); m.knockVel = { x: d.x * VAJRA_KNOCK, y: d.y * VAJRA_KNOCK }; }
    });
    gameState.visualEffects.push(new VajraBlastEffect(p.pos, r));
    spawnFloatText(p.pos.x, p.pos.y - 44, `金剛怒目 ${Math.floor(combo)}`, VAJRA_GOLD, 16, 1.0, 'vajraWrath');
    spawnParticles(p.pos.x, p.pos.y, VAJRA_GOLD, 24, r * 2, 0.5, 3);
    addShake(Math.min(10, 4 + combo / 30));
    Sfx.play('nova');
}
// 震波：琥珀金的粗環往外推，環上一圈金剛杵的尖刺朝外，地上留下放射狀的裂痕
const VAJRA_GOLD = '#FFB300', VAJRA_LIGHT = '#FFF8E1', VAJRA_PRONGS = 12, VAJRA_CRACK = 'rgba(30, 20, 10, 0.5)';
class VajraBlastEffect extends TimedEffect {
    constructor(pos, radius) {
        super({ x: pos.x, y: pos.y }, 0.55);
        this.radius = radius;
        this.cracks = Array.from({ length: 9 }, () => ({ a: Math.random() * Math.PI * 2, len: radius * (0.5 + Math.random() * 0.4), bend: (Math.random() - 0.5) * 0.4 }));
    }
    draw(ctx) {
        const t = 1 - this.life / this.duration, ease = 1 - (1 - t) * (1 - t);
        const r = this.radius * ease, { x, y } = this.pos;
        ctx.save();
        ctx.globalAlpha = Math.min(1, this.life / 0.25);
        ctx.strokeStyle = VAJRA_CRACK; ctx.lineWidth = 2;
        ctx.beginPath();
        for (const c of this.cracks) {
            const l = c.len * Math.min(1, t * 2.5), mx = x + Math.cos(c.a) * l * 0.5, my = y + Math.sin(c.a) * l * 0.5;
            ctx.moveTo(x, y); ctx.lineTo(mx + Math.cos(c.a + c.bend) * 4, my + Math.sin(c.a + c.bend) * 4); ctx.lineTo(x + Math.cos(c.a + c.bend) * l, y + Math.sin(c.a + c.bend) * l);
        }
        ctx.stroke();
        ctx.globalAlpha = (1 - t) * 0.35;
        ctx.fillStyle = VAJRA_LIGHT;
        ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1 - t;
        for (const [col, lw] of [[SHAPE_OUTLINE, 11 * (1 - t) + 4], [VAJRA_GOLD, 8 * (1 - t) + 2]]) {
            ctx.strokeStyle = col; ctx.lineWidth = lw;
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.fillStyle = VAJRA_GOLD; ctx.strokeStyle = SHAPE_OUTLINE; ctx.lineWidth = 1.5;
        for (let i = 0; i < VAJRA_PRONGS; i++) {
            const a = i * Math.PI * 2 / VAJRA_PRONGS + t * 0.6, c = Math.cos(a), s = Math.sin(a), len = 12 * (1 - t) + 4;
            ctx.beginPath();
            ctx.moveTo(x + c * r - s * 4, y + s * r + c * 4);
            ctx.lineTo(x + c * (r + len), y + s * (r + len));
            ctx.lineTo(x + c * r + s * 4, y + s * r - c * 4);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        }
        ctx.restore();
    }
}

// ---------- 大招：十八羅漢陣 ----------
function useArhats() {
    const k = monkState(), p = gameState.player, A = MONK.arhats;
    k.arhatT = A.duration; k.arhatTick = 0; k.arhatKills = 0;
    k.arhatPos = { x: p.pos.x, y: p.pos.y };
    spawnFloatText(p.pos.x, p.pos.y - 44, '十八羅漢陣！', '#FFE082', 18, 1.3, 'arhats');
    spawnParticles(p.pos.x, p.pos.y, '#FFE082', 36, 200, 0.7, 3);
    addShake(6);
    Sfx.play('boss');
    gameState.ultCooldown = A.cooldown;
    gameState.run.novas++;
    stats().novas++;
    return true;
}

// ---------- 畫面 ----------
function drawMonkHud(ctx, p) {
    const k = monkState();
    if (k.zenT > 0 || k.enlightenT > 0) {
        ctx.save();
        ctx.globalAlpha = k.enlightenT > 0 ? 0.6 : 0.3 + 0.1 * Math.sin(worldTime * 3);
        ctx.drawImage(getGlowSprite('#FFE082'), p.pos.x - 40, p.pos.y - 42, 80, 80);
        ctx.restore();
    }
    // 蓄氣：腳下一圈金色，越滿越完整
    if (k.charge > 0) {
        const full = k.charge / (MONK.zenCharge + blessVal('zenCharge'));
        ctx.strokeStyle = '#FFD54F'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(p.pos.x, p.pos.y + 4, 22, -Math.PI / 2, -Math.PI / 2 + full * Math.PI * 2); ctx.stroke();
    }
    // 鐵拳：腳下一圈鐵環，減傷每多一段就多亮一節
    const iron = Math.round(ironFistCut() / IRON_FIST_STEP);
    if (iron > 0) {
        const segs = IRON_FIST_MAX / IRON_FIST_STEP, gap = 0.12, span = Math.PI * 2 / segs;
        ctx.save();
        ctx.lineCap = 'round';
        for (let i = 0; i < segs; i++) {
            const a0 = -Math.PI / 2 + i * span + gap, a1 = a0 + span - gap * 2;
            ctx.strokeStyle = SHAPE_OUTLINE; ctx.lineWidth = 5;
            ctx.beginPath(); ctx.ellipse(p.pos.x, p.pos.y + p.imageHeight * 0.4, 20, 8, 0, a0, a1); ctx.stroke();
            ctx.strokeStyle = i < iron ? '#B0BEC5' : 'rgba(176, 190, 197, 0.25)'; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.ellipse(p.pos.x, p.pos.y + p.imageHeight * 0.4, 20, 8, 0, a0, a1); ctx.stroke();
        }
        ctx.restore();
    }
    // 連擊數：10 以上才顯示，越高越大、越紅
    if (k.combo >= 10) {
        const c = Math.floor(k.combo), size = Math.min(22, 12 + c / 25);
        drawOutlinedText(`${c}`, p.pos.x - 24, p.pos.y - p.imageHeight * 0.5 - 4, size, c >= RES_THOUSAND_COMBO ? '#FF7043' : '#FFE0B2');
    }
}
function drawMonkWorld(ctx) {
    const k = monkState();
    for (const q of k.waves) {
        if (q.back) { drawReturningQi(ctx, q); continue; }
        ctx.save();
        ctx.globalAlpha = 0.8;
        // 丹田爆發的那一道是金色、加寬
        ctx.strokeStyle = q.golden ? '#FFD54F' : '#80DEEA'; ctx.lineWidth = q.w * 0.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(q.x - q.ux * 18, q.y - q.uy * 18); ctx.lineTo(q.x, q.y); ctx.stroke();
        ctx.strokeStyle = q.golden ? '#FFF8E1' : '#E0F7FA'; ctx.lineWidth = q.w * 0.2;
        ctx.beginPath(); ctx.moveTo(q.x - q.ux * 12, q.y - q.uy * 12); ctx.lineTo(q.x, q.y); ctx.stroke();
        ctx.restore();
    }
    for (const g of k.ghosts) {
        ctx.save();
        ctx.globalAlpha = g.life * 1.5;
        ctx.drawImage(getGlowSprite('#B2EBF2'), g.x - 18, g.y - 20, 36, 36);
        ctx.restore();
    }
    if (k.reeds.length) {
        ctx.save();
        ctx.strokeStyle = '#AED581'; ctx.lineWidth = 2;
        for (const r of k.reeds) {
            if (!inView(r)) continue;
            ctx.globalAlpha = Math.min(0.8, r.life);
            ctx.beginPath(); ctx.moveTo(r.x - 4, r.y + 4); ctx.lineTo(r.x - 2, r.y - 8); ctx.moveTo(r.x + 3, r.y + 4); ctx.lineTo(r.x + 5, r.y - 6); ctx.stroke();
        }
        ctx.restore();
    }
    // 十八羅漢：圍成一圈
    if (k.arhatT > 0 && images.arhat) {
        const A = MONK.arhats, img = images.arhat, w = 26, h = w * img.naturalHeight / img.naturalWidth;
        ctx.save();
        ctx.globalAlpha = Math.min(1, k.arhatT * 2);
        ctx.strokeStyle = 'rgba(255, 213, 79, 0.5)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(k.arhatPos.x, k.arhatPos.y, A.radius, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < A.count; i++) {
            const a = i / A.count * Math.PI * 2 + worldTime * 0.3;
            const x = k.arhatPos.x + Math.cos(a) * A.radius, y = k.arhatPos.y + Math.sin(a) * A.radius * 0.85;
            const punch = Math.sin(worldTime * 12 + i) > 0.6 ? 3 : 0;
            ctx.drawImage(img, x - w / 2 - Math.cos(a) * punch, y - h / 2 - Math.sin(a) * punch, w, h);
        }
        ctx.restore();
    }
}

// ---------- 十三棍僧（傳說）：每波開頭助陣、時間到離開 ----------
class StaffMonk extends SummonUnit {
    constructor(x, y, level, p) { super(x, y, CONFIG.staffMonk, level, p); this.life = STAFF_MONK_TIME; }
    update(dt, monsters, summons, player) {
        if (!this.isAlive) return;
        this.life -= dt;
        if (this.life <= 0) { this.die(); return; }
        super.update(dt, monsters, summons, player);
    }
    attackTarget() {
        const t = this.target;
        if (!t || !t.isAlive) return;
        t.takeDamage(this.attack * comboMult());
        const fx = getVisualEffectFromPool(SlashEffect);
        if (fx) { fx.init(this.pos, t.pos); gameState.visualEffects.push(fx); }
        this.attackCooldown = 1 / this.attackSpeed;
    }
    die() {
        if (!this.isAlive) return;
        this.isAlive = false;
        gameState.units.StaffMonk.count--;
        onSummonDeath(this);
        spawnParticles(this.pos.x, this.pos.y, '#FFB74D', 8, 60, 0.4);
    }
}
