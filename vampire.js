// 吸血鬼 · 血月伯爵（規劃見 docs/characters.md 第 6 節）
// 核心是「血就是錢」：怪掉的是血珠，撿到先補自己的血、補滿才存進血池；召喚、升級花血池，不夠就拿自己的血付。
// 被打倒的怪有機率站起來成為眷屬，保留原本的能力（遠程怪會射血彈、巫醫會幫你補血、腐屍死了會爆）——
// 這局的軍隊長什麼樣，取決於這局遇到了什麼怪。白天吸血鬼被曬傷、眷屬變弱；入夜眷屬強化。
// 典故：斯拉夫民間的 upir（被害者死後也起身成為同類、能化身為狼、怕大蒜與聖物）。
// 這個檔在 game.js 之後載入，用的是 game.js 的全域；game.js 的 init 等所有腳本載完才跑

const VAMPIRE = {
    baseHealth: 90,
    moveSpeed: 92,
    // 普攻「血之飛刃」：射程內最近的怪，命中時吸 leech 的傷害回血
    blade: { interval: 0.8, range: 170, damage: 6, leech: 0.15 },
    // 撿到 1 點血珠補幾點血（補滿才存進血池）
    hpPerBlood: 1,
    // 晝夜：只有開戰中才走時間；白天 dayTime 秒、黑夜 nightTime 秒輪流
    dayTime: 20, nightTime: 20,
    // 白天每秒曬掉最大血量的 sunBurn（不會曬到 sunFloor 以下）、眷屬傷害 ×dayMult；黑夜眷屬 ×nightMult
    sunBurn: 0.005, sunFloor: 0.4, dayMult: 0.8, nightMult: 1.25,
    // 轉化：打倒的怪站起來的機率（入夜 ×nightConvert），眷屬上限
    convertChance: 0.08, nightConvert: 1.5, thrallCap: 15, capPerLevels: 4, convertRange: 170,
    // 大招「血月降臨」：立刻入夜 duration 秒，全軍狂暴、飛刃吸血 ×leechMult
    bloodMoon: { cooldown: 26, duration: 10, leechMult: 3 },
};

OPTIONAL_ART.vampire = 'vampire.png';
OPTIONAL_ART.blood_bat = 'blood_bat.png';
OPTIONAL_ART.blood_wolf = 'blood_wolf.png';
// 吸血鬼的攻擊、特效用夜紫：紅色是警示色，留給敵人與危險
BOLT_STYLES.nightblade = { glowIn: 'rgba(209, 196, 255, 0.9)', glowMid: 'rgba(124, 77, 255, 0.4)', glowOut: 'rgba(124, 77, 255, 0)', body: '#7C4DFF', core: '#EDE7F6' };
const VAMP_ATTACK_COLOR = '#7C4DFF', VAMP_ATTACK_DARK = '#4527A0';

// 眷屬的共通設定；每隻實際的數值照牠生前是什麼怪（thrallConfig）
const THRALL_COMMON = {
    targetSearchRadius: 170, returnDistance: 45, avoidanceRadius: 13, avoidanceForce: 100, playerAvoidanceForce: 40,
    wanderRadius: 30, wanderSpeedFactor: 0.3, wanderIntervalMin: 2, wanderIntervalMax: 4,
    upgradeBonus: 0.15, projectileSpeed: 300, projectileRadius: 4, projectileColor: VAMP_ATTACK_COLOR, boltStyle: 'nightblade',
};
// 生前的血量、攻擊乘上這個倍數（怪的基礎值是給「一大群」用的，眷屬一隻要頂一隻）；沒有攻擊力的怪（巫醫、血瞳）給 minAtk
const THRALL_HP_MULT = 2.5, THRALL_ATK_MULT = 2, THRALL_MIN_HP = 20, THRALL_MIN_ATK = 5;
const THRALL_RANGED_RANGE = 150;
// 眷屬保留原本的能力：照怪的種類分幾種打法（沒列到的：射程夠遠就是遠程，其他近戰）
const THRALL_ARCHE = { WitchDoctor: 'mender', GravePriest: 'mender', Bloater: 'bomber', CorpseWorm: 'burrower', BloodEye: 'ranged', Spitter: 'ranged' };
const THRALL_ARCHE_LABEL = { melee: '近戰', ranged: '射血彈', mender: '幫你補血', bomber: '死了會爆', burrower: '範圍重擊' };
const MENDER_HEAL = 0.08, MENDER_RADIUS = 130, MENDER_HERO_BELOW = 0.7;
const BOMBER_RADIUS = 55, BOMBER_MULT = 3;
const BURROWER_RADIUS = 40;
const THRALL_TINT = '#CE93D8', THRALL_TINT_STRENGTH = 0.45;

CONFIG.thrall = { ...THRALL_COMMON, type: 'Thrall', radius: 11, color: '#CE93D8', imageName: 'basic_melee', imgScaleMultiplier: 3,
    baseHealth: 40, baseAttack: 8, attackRange: 22, attackSpeed: 1, moveSpeed: 80 };
// 蝙蝠是最便宜的兵，又能拿自己的血付錢：價格與每級成長照其他職業的兵定的話，第 20 波就有五六百隻、七十幾級，
// 整局沒有壓力（機器人量的），所以召喚跟眷屬差不多貴、升級也貴一截，每級長得比較少
CONFIG.bloodBat = {
    ...THRALL_COMMON, type: 'BloodBat', imageName: 'blood_bat', color: '#9575CD', radius: 9, imgScaleMultiplier: 3.6,
    baseHealth: 28, baseAttack: 6, attackRange: 20, attackSpeed: 1.4, moveSpeed: 150, upgradeBonus: 0.14,
};
// 血魔法：只修練不召喚，等級是血爆的威力
CONFIG.bloodMagic = { type: 'BloodMagic', upgradeBonus: 0.25 };
const BLOOD_BURST = { interval: 5, radius: 80, damage: 10, hpCost: 0.04, missingBonus: 1.5 };

Object.assign(CONFIG.evolution.names, {
    Thrall: ['血僕', '血騎', '血之公爵'],
    BloodBat: ['吸血蝠', '蝠群', '夜之女王'],
    BloodMagic: ['血咒', '血湧', '猩紅風暴'],
});
Object.assign(CONFIG.evolution.perks, {
    Thrall: ['眷屬吸血 10%', '轉化機率加倍', '眷屬倒下時 50% 再站起來一次'],
    BloodBat: ['蝙蝠攻速 +30%', '吸到的血加倍回給你', '每次咬兩下'],
    BloodMagic: ['血爆範圍 +25%', '血爆緩速命中的怪', '血爆不再花自己的血'],
});
const THRALL_TIER1_LEECH = 0.1, THRALL_TIER3_REVIVE = 0.5;
const BAT_TIER1_RATE = 1.3, BAT_DRAIN = 0.25;
const BURST_TIER1_RADIUS = 1.25, BURST_TIER2_SLOW = 0.5;

// 蝠群風暴：轉幾秒、繞多遠（每隻蝙蝠半徑錯開一點，看起來是一團不是一條線）、轉多快、每隻多久咬一次、咬的傷害倍率
const STORM_TIME = 5, STORM_RADIUS = 52, STORM_SPREAD = 22, STORM_SPIN = 3.2, STORM_BITE_EVERY = 0.3, STORM_HIT_RADIUS = 18, STORM_MULT = 1.5;
// 月狼：爪擊範圍、扇形角度、間隔、傷害是飛刃的幾倍（近戰要貼身，比遠程危險）、吸血倍率、夜裡移速
// 雙流派：血之紐帶（眷屬回幾成血）、蝠群護主（替你擋幾成、多近的蝙蝠才擋得到、擋一下蝙蝠扣自己幾成血）
const BLOOD_BOND_HEAL = 0.2, BAT_GUARD_CUT = 0.25, BAT_GUARD_RADIUS = 80, BAT_GUARD_COST = 0.15;
const MOONWOLF_RANGE = 62, MOONWOLF_ARC = Math.PI * 0.75, MOONWOLF_EVERY = 0.55, MOONWOLF_MULT = 2.4, MOONWOLF_LEECH = 2, MOONWOLF_SPEED = 1.4;

// ---------- 五個流派：各 4 張祝福，加一張稀有祝福（game.js 從 res 產生）；每個流派一張傳說。圖示名稱 = 祝福 id（icons.js） ----------
Object.assign(SCHOOLS, {
    bloodmagic: { name: '血魔法', icon: 'bloodmagic', color: '#B388FF', res: [{ name: '血箭', desc: '血之飛刃每次多射一把' }, { name: '血祭', desc: '血量低於一半時，你的傷害加倍' }] },
    kin: { name: '眷屬', icon: 'kin', color: '#CE93D8', res: [{ name: '饗宴', desc: '眷屬每打倒一隻怪，你回 1% 血' }, { name: '血親', desc: '精英怪也能轉化，而且保留精英的強度' }] },
    bats: { name: '蝠群', img: 'blood_bat.png', color: '#9575CD', res: [{ name: '夜翼', desc: '入夜時蝙蝠攻速 +40%' }, { name: '夜幕', desc: '蝙蝠擋下射向你的飛彈' }] },
    werewolf: { name: '狼化', icon: 'werewolf', color: '#B0BEC5', res: [{ name: '狼行', desc: '入夜時你移速 +25%、飛刃吸血 +10%' }, { name: '月下狼群', desc: '入夜時近戰眷屬傷害 ×1.5、移速 +30%' }] },
    undying: { name: '不死', icon: 'coffin', color: '#9575CD', res: [{ name: '蝠化', desc: '一下被打掉 12% 以上的血時化成蝙蝠，1 秒無敵' }, { name: '永生', desc: '每局可以從棺木復活一次' }] },
});
Object.assign(BLESSINGS, {
    bmPower: { school: 'bloodmagic', name: '腥紅', max: 5, per: 0.3, desc: b => `血爆傷害 +${pct(b.per)}` },
    bmRadius: { school: 'bloodmagic', name: '血霧', max: 3, per: 0.2, desc: b => `血爆範圍 +${pct(b.per)}` },
    bmRate: { school: 'bloodmagic', name: '脈動', max: 3, per: 0.15, desc: b => `血爆間隔 -${pct(b.per)}` },
    bmLeech: { school: 'bloodmagic', name: '回流', max: 3, per: 0.06, desc: b => `血爆傷害的 ${pct(b.per)} 回到你身上` },
    kinRate: { school: 'kin', name: '初擁', max: 3, per: 0.04, desc: b => `轉化機率 +${pct(b.per)}` },
    kinCap: { school: 'kin', name: '血之家族', max: 3, per: 6, desc: b => `眷屬上限 +${b.per}` },
    kinPower: { school: 'kin', name: '血統', max: 5, per: 0.3, desc: b => `眷屬血量與攻擊 +${pct(b.per)}` },
    kinLeech: { school: 'kin', name: '共飲', max: 3, per: 0.12, desc: b => `眷屬打出的傷害 ${pct(b.per)} 補回自己` },
    batPair: { school: 'bats', name: '成雙', max: 2, per: 1, desc: b => `每次補蝙蝠多來 ${b.per} 隻` },
    batFang: { school: 'bats', name: '尖牙', max: 5, per: 0.3, desc: b => `蝙蝠傷害 +${pct(b.per)}` },
    batDrain: { school: 'bats', name: '血線', max: 3, per: 0.15, desc: b => `蝙蝠吸到的血多 ${pct(b.per)} 回給你` },
    batSpeed: { school: 'bats', name: '夜風', max: 3, per: 0.2, desc: b => `蝙蝠移速與攻速 +${pct(b.per)}` },
    vwSpeed: { school: 'werewolf', name: '狼步', max: 3, per: 0.12, desc: b => `你的移速 +${pct(b.per)}` },
    vwBite: { school: 'werewolf', name: '撕咬', max: 3, per: 0.5, desc: b => `你每 0.7 秒咬一口貼身的怪（傷害 +${pct(b.per)}）` },
    vwHowl: { school: 'werewolf', name: '嚎月', max: 3, per: 0.15, desc: b => `眷屬攻速 +${pct(b.per)}` },
    vwPack: { school: 'werewolf', name: '狼伴', max: 2, per: 2, desc: b => `每波開始時有 ${b.per} 隻狼加入眷屬` },
    mistForm: { school: 'undying', name: '霧化', max: 3, per: 0.08, desc: b => `${pct(b.per)} 機率閃過攻擊` },
    sunWard: { school: 'undying', name: '斗篷', max: 3, per: 0.3, desc: b => `白天曬傷 -${pct(b.per)}` },
    nightRegen: { school: 'undying', name: '夜息', max: 3, per: 0.004, desc: b => `入夜時每秒回 ${pct(b.per)} 血` },
    bloodBank: { school: 'undying', name: '血庫', max: 3, per: 0.3, desc: b => `撿血珠回的血 +${pct(b.per)}` },
    dracula: { school: 'kin', name: '德古拉', legendary: true, max: 1, per: 0.5, desc: () => '打倒的首領會站起來成為你的眷屬' },
    countess: { school: 'bloodmagic', name: '血伯爵夫人', legendary: true, max: 1, per: 0.2, desc: b => `補到滿血以上的部分，${pct(b.per)} 變成最大血量` },
    garlic: { school: 'undying', name: '蒜也不怕', legendary: true, max: 1, per: 1, desc: () => '白天不再曬傷，眷屬白天也不變弱' },
    // 蝠群風暴：入夜那一刻是衝進怪堆的訊號
    batStorm: { school: 'bats', name: '蝠群風暴', legendary: true, max: 1, per: STORM_TIME, desc: b => `入夜那一刻，所有蝙蝠圍著你轉 ${b.per} 秒，碰到的怪都被吸血` },
    // 月狼：夜裡從遠程換成近戰，狼化流派的「入夜變強」推到底
    moonWolf: { school: 'werewolf', name: '月狼', legendary: true, max: 1, per: MOONWOLF_LEECH, desc: b => `入夜時飛刃換成扇形爪擊，吸血 ×${b.per}、移速 +${pct(MOONWOLF_SPEED - 1)}` },
    // ---- 雙流派傳說（兩個流派都到 3 層才出現）----
    bloodBond: { school: DUO_SCHOOL, duo: ['bloodmagic', 'kin'], name: '血之紐帶', legendary: true, max: 1, per: BLOOD_BOND_HEAL, desc: b => `血爆時，範圍裡的眷屬回 ${pct(b.per)} 血` },
    batGuard: { school: DUO_SCHOOL, duo: ['bats', 'undying'], name: '蝠群護主', legendary: true, max: 1, per: BAT_GUARD_CUT, desc: b => `身邊有蝙蝠時，牠替你擋下 ${pct(b.per)} 的傷害` },
    wolfEmbrace: { school: DUO_SCHOOL, duo: ['werewolf', 'kin'], name: '狼群初擁', legendary: true, max: 1, per: 1, desc: () => '入夜時，你親手打倒的怪一定轉化成眷屬' },
});
const RES_FEAST_HEAL = 0.01;
const RES_NIGHTWING_RATE = 1.4;
const RES_NIGHTVEIL_RADIUS = 18, RES_NIGHTVEIL_COST = 0.15;
const RES_WOLFWALK_SPEED = 1.25, RES_WOLFWALK_LEECH = 0.1;
const RES_MOONPACK_DMG = 1.5, RES_MOONPACK_SPEED = 1.3;
const RES_BATFORM_HIT = 0.12, RES_BATFORM_TIME = 1, RES_BATFORM_CD = 10;
const RES_REBORN_HP = 0.5;
const VW_BITE_EVERY = 0.7, VW_BITE_RADIUS = 30, VW_BITE_DAMAGE = 5;
// 伯爵夫人：溢出轉最大血量的上限（基礎血量的幾倍）
const COUNTESS_MAX = 2;
const VAMP_ACHV = { horde: 80, kinds: 8 };

Object.assign(UNIT_TYPES, {
    Thrall: {
        card: { cap: 3, capPer: 3, every: 3 },
        cfg: () => CONFIG.thrall, Cls: () => Thrall, name: '眷屬', img: iconDataUrl('kin'),
        cap: () => thrallCap(),
        // 按下去就把身邊最近的一隻怪當場轉化
        canSummon: () => !!convertTarget(),
        summon: (level) => { const m = convertTarget(); if (m) { m.isAlive = false; raiseThrall(m, level); } },
    },
    BloodBat: { card: { cap: 4, capPer: 3, every: 3 }, cfg: () => CONFIG.bloodBat, Cls: () => BloodBat, name: '蝠群', img: 'blood_bat.png' },
    BloodMagic: { cfg: () => CONFIG.bloodMagic, Cls: () => null, name: '血魔法', img: iconDataUrl('bloodmagic'), upgradeOnly: true },
});

CLASSES.vampire = {
    name: '吸血鬼', title: '血月伯爵', portrait: 'vampire.png', tagline: '吸血續命，打倒的怪站起來為你而戰',
    // 同一套怪物加強下沒強化照樣通關（見 game.js 的 monsterRamp）。2 倍時怪物血量疊到四倍，
    // 蝙蝠打不贏巫醫補血、第 49 波卡住打不完 —— 血量灌太多只會變成拖棚，不會變好玩
    monsterPressure: 1.5,
    // unlockOld：已經沒有的舊解鎖條件（一局立下 3 份契約），舊存檔靠它解鎖的照樣算數
    unlock: 'wave30', unlockOld: 'pacts',
    // 轉化要身邊有怪才轉得到：開局光靠眷屬撐不過前幾波，蝠群一開始就會
    startCards: ['Thrall', 'BloodBat'],
    cards: ['Thrall', 'BloodBat', 'BloodMagic'], schools: ['bloodmagic', 'kin', 'bats', 'werewolf', 'undying', 'soul'],
    metaUpgrades: {
        summonHp: META_SUMMON_HP,
        kinRate: { icon: 'kinRate', name: '轉化機率', max: 4, per: 0.02, costBase: 35, desc: m => `轉化機率 +${pct(m.per)}`, total: (m, lv) => `+${pct(m.per * lv)}` },
        sunWard: { icon: 'sunWard', name: '白天曬傷', max: 4, per: 0.12, costBase: 25, desc: m => `白天曬傷 -${pct(m.per)}`, total: (m, lv) => `-${pct(m.per * lv)}` },
    },
    hero: { imageName: 'vampire', baseHealth: VAMPIRE.baseHealth, moveSpeed: VAMPIRE.moveSpeed },
    currency: { icon: 'blood', glow: [124, 77, 255] },
    attack: (p, dt) => vampAttack(p, dt),
    update: (dt) => vampUpdate(dt),
    reset: () => { gameState.vamp = newVampState(); },
    onOrbCollect: (value) => bloodPickup(value),
    unitLevelPerHero: 0.5,
    onMonsterKill: (m) => {
        // 饗宴：眷屬或蝙蝠打倒的怪，你回一點血
        if (m.lastHitByThrall && res('kin') >= 1) healHero(gameState.player.maxHealth * RES_FEAST_HEAL);
        if (m instanceof BossMonster) { if (bl('dracula')) raiseThrall(m, gameState.units.Thrall.level, true); return; }
        if (gameState.units.Thrall.count >= thrallCap() || (m.isElite && res('kin') < 2)) return;
        // 雙流派「狼群初擁」：入夜時親手打倒的一定轉化
        if (bl('wolfEmbrace') && vampState().night && m.heroBlowAt === worldTime) {
            raiseThrall(m, gameState.units.Thrall.level);
            if (inView(m.pos)) spawnFloatText(m.pos.x, m.pos.y - 24, '初擁', '#E1BEE7', 12, 0.9, 'wolfEmbrace');
            return;
        }
        if (Math.random() < convertChance()) raiseThrall(m, gameState.units.Thrall.level);
    },
    onWaveStart: () => {
        const p = gameState.player;
        for (let i = 0; i < bl('vwPack') * BLESSINGS.vwPack.per && gameState.units.Thrall.count < thrallCap(); i++) {
            const pos = p.getSummonPosition();
            spawnThrall(pos.x, pos.y, 'wolf', gameState.units.Thrall.level, false);
        }
    },
    onBossKill: () => { if (!vampState().night) gameState.run.flags.vampDayBoss = true; },
    heroSpeedMult: () => (1 + blessVal('vwSpeed')) * (vampState().night && res('werewolf') >= 1 ? RES_WOLFWALK_SPEED : 1) * (moonWolfActive() ? MOONWOLF_SPEED : 1),
    heroDamageTakenMult: () => {
        const v = vampState();
        if (v.batFormT > 0) return 0;
        if (Math.random() < blessVal('mistForm')) { const p = gameState.player; spawnFloatText(p.pos.x, p.pos.y - 30, '霧化', '#B39DDB', 12, 0.6); return 0; }
        return batGuard() ? 1 - BAT_GUARD_CUT : 1;
    },
    onHeroHurt: (lostFrac) => {
        const v = vampState();
        if (res('undying') >= 1 && lostFrac >= RES_BATFORM_HIT && v.batFormCd <= 0) {
            v.batFormT = RES_BATFORM_TIME; v.batFormCd = RES_BATFORM_CD;
            const p = gameState.player;
            spawnParticles(p.pos.x, p.pos.y, VAMP_ATTACK_COLOR, 24, 160, 0.6, 3);
            spawnFloatText(p.pos.x, p.pos.y - 34, '蝠化', '#B39DDB', 14, 1, 'batFang');
        }
    },
    // 永生：每局一次，從棺木裡站起來
    preventDeath: () => {
        const v = vampState(), p = gameState.player;
        if (res('undying') < 2 || v.reborn) return false;
        v.reborn = true;
        gameState.run.flags.vampReborn = true;
        p.currentHealth = Math.round(p.maxHealth * RES_REBORN_HP);
        spawnParticles(p.pos.x, p.pos.y, '#9575CD', 40, 200, 0.8, 3);
        spawnFloatText(p.pos.x, p.pos.y - 40, '永生', '#D1C4E9', 20, 1.6, 'coffin');
        addShake(8);
        return true;
    },
    blockBolt: (b) => {
        if (res('bats') < 2) return false;
        let blocker = null;
        const rSq = RES_NIGHTVEIL_RADIUS * RES_NIGHTVEIL_RADIUS;
        summonGrid.forEachInRadius(b.pos, RES_NIGHTVEIL_RADIUS, s => { if (!blocker && s.isAlive && s instanceof BloodBat && distanceSq(s.pos, b.pos) <= rSq) blocker = s; });
        if (!blocker) return false;
        blocker.takeDamage(blocker.maxHealth * RES_NIGHTVEIL_COST);
        return true;
    },
    // 靈泉是聖水：站進去會燙
    onSpring: (r, dt) => {
        const v = vampState(), p = gameState.player;
        v.holyT -= dt;
        if (v.holyT > 0) return;
        v.holyT = HOLY_WATER_TICK;
        p.takeDamage(p.maxHealth * HOLY_WATER_BURN * HOLY_WATER_TICK, null);
        spawnParticles(p.pos.x, p.pos.y + 6, '#E3F2FD', 4, 40, 0.4, 3);
    },
    // 封印寶棺是吸血鬼的棺木：躺進去血全滿、立刻入夜
    onRelic: (r) => {
        if (r.kind !== 'coffin') return false;
        const p = gameState.player, v = vampState();
        p.currentHealth = p.maxHealth;
        v.moonT = Math.max(v.moonT, VAMPIRE.bloodMoon.duration);
        spawnFloatText(p.pos.x, p.pos.y - 34, '棺中長眠：血全滿、入夜', '#D1C4E9', 15, 1.6, 'coffinRelic');
        spawnParticles(p.pos.x, p.pos.y, '#9575CD', 30, 140, 0.7, 3);
        Sfx.play('pick');
        updateUI();
        return true;
    },
    drawHero: (ctx, p) => drawVampHud(ctx, p),
    drawHeroUnder: (ctx, p) => drawMoonWolfAura(ctx, p),
    drawWorld: (ctx) => drawBatStorm(ctx),
    drawScreen: (ctx) => drawVampSky(ctx),
    saveExtra: () => {
        const v = vampState();
        return { thralls: gameState.summons.filter(s => s.isAlive && s instanceof Thrall).map(s => [s.config.srcType, s.elite ? 1 : 0, s.isBoss ? 1 : 0]),
            cycle: v.cycle, reborn: v.reborn, bonusHp: v.bonusHp };
    },
    loadExtra: (data) => {
        const list = (data.thralls || []).slice();
        for (const s of gameState.summons) if (s instanceof Thrall && list.length) { const [type, elite, boss] = list.shift(); s.setSource(type, !!elite, !!boss); s.currentHealth = s.maxHealth; }
        const v = vampState();
        v.cycle = data.cycle || 0; v.reborn = !!data.reborn; v.bonusHp = data.bonusHp || 0;
    },
    achv: {
        win: '永夜君王', speed: ['夜行', '血之疾行', '瞬息千里'],
        feats: [
            ['boss', '血之王冠', '轉化一隻首領', 60, () => gameState.summons.some(s => s.isAlive && s.isBoss)],
            ['horde', '夜之軍團', `同時有 ${VAMP_ACHV.horde} 隻眷屬與蝙蝠`, 50, () => gameState.units.Thrall.count + gameState.units.BloodBat.count >= VAMP_ACHV.horde],
            ['menagerie', '百鬼夜行', `眷屬裡同時有 ${VAMP_ACHV.kinds} 種不同的怪`, 50, () => new Set(gameState.summons.filter(s => s.isAlive && s instanceof Thrall).map(s => s.config.srcType)).size >= VAMP_ACHV.kinds],
            ['dayBoss', '日行者', '白天打倒首領', 40, () => !!gameState.run.flags.vampDayBoss],
            ['reborn', '不死之身', '從棺木復活之後通關', 80, () => gameState.endless && !!gameState.run.flags.vampReborn],
        ],
    },
    ultimate: {
        name: '血月', icon: 'bloodmoon', hint: '血月降臨：立刻入夜、全軍狂暴、吸血三倍',
        hintRadius: () => VAMPIRE.blade.range, cooldown: () => VAMPIRE.bloodMoon.cooldown, use: () => useBloodMoon(),
    },
};
const HOLY_WATER_TICK = 0.5, HOLY_WATER_BURN = 0.06;

// cycle：晝夜走到哪（0～dayTime+nightTime）；moonT：血月或棺木強制入夜的剩餘秒數；night：這一格是不是黑夜
function newVampState() {
    return { cycle: 0, moonT: 0, night: false, bladeT: 0, burstT: 0, biteT: 0, batFormT: 0, batFormCd: 0, holyT: 0, reborn: false, bonusHp: 0, stormT: 0, clawT: 0 };
}
function vampState() { return gameState.vamp || (gameState.vamp = newVampState()); }
function thrallCap() { return VAMPIRE.thrallCap + Math.floor(gameState.units.Thrall.level / VAMPIRE.capPerLevels) + blessVal('kinCap'); }
function convertChance() {
    const t = gameState.units.Thrall;
    return (VAMPIRE.convertChance + blessVal('kinRate') + classMeta('kinRate')) * (getTier(t.level) >= 2 ? 2 : 1) * (vampState().night ? VAMPIRE.nightConvert : 1);
}
function nightMult() {
    const v = vampState();
    if (v.night) return VAMPIRE.nightMult;
    return bl('garlic') ? 1 : VAMPIRE.dayMult;
}
// 血祭：半血以下你的傷害加倍
function sacrificeMult() {
    const p = gameState.player;
    return res('bloodmagic') >= 2 && p && p.currentHealth < p.maxHealth * 0.5 ? 2 : 1;
}

// ---------- 血的經濟 ----------
function healHero(amount) {
    const p = gameState.player;
    if (!p || !p.isAlive || amount <= 0) return 0;
    const room = p.maxHealth - p.currentHealth;
    const healed = Math.min(room, amount);
    p.currentHealth += healed;
    // 伯爵夫人：溢出的部分一點一點長成最大血量
    if (bl('countess') && amount > room) {
        const v = vampState(), cap = VAMPIRE.baseHealth * COUNTESS_MAX;
        const gain = Math.min((amount - room) * BLESSINGS.countess.per, cap - v.bonusHp);
        if (gain > 0) { v.bonusHp += gain; p.maxHealth = Math.round(p.maxHealth + gain); }
    }
    return healed;
}
// 撿到血珠：回血（經驗照算，見 game.js 的 gainXp）
function bloodPickup(value) {
    healHero(value * VAMPIRE.hpPerBlood * (1 + blessVal('bloodBank')));
}

// ---------- 每格 ----------
function vampUpdate(dt) {
    const v = vampState(), p = gameState.player;
    if (!p) return;
    const fighting = !gameState.betweenWaves;
    if (fighting) v.cycle = (v.cycle + dt) % (VAMPIRE.dayTime + VAMPIRE.nightTime);
    v.moonT = Math.max(0, v.moonT - dt);
    const wasNight = v.night;
    v.night = v.moonT > 0 || !fighting || v.cycle >= VAMPIRE.dayTime;
    if (wasNight !== v.night && fighting) spawnFloatText(p.pos.x, p.pos.y - 44, v.night ? '入夜' : '天亮了', v.night ? '#B39DDB' : '#FFE082', 15, 1.2, v.night ? 'moon' : 'sun');
    if (!wasNight && v.night && fighting) {
        if (bl('batStorm')) startBatStorm();
        if (bl('moonWolf')) { spawnFloatText(p.pos.x, p.pos.y - 60, '月狼', MOONWOLF_SILVER, 15, 1.2, 'moonWolf'); spawnParticles(p.pos.x, p.pos.y, MOONWOLF_SILVER, 20, 120, 0.6, 3); }
    }
    v.stormT = Math.max(0, v.stormT - dt);
    if (wasNight !== v.night) for (const s of gameState.summons) if (s.isAlive && (s instanceof Thrall || s instanceof BloodBat)) s.refreshStats();
    v.batFormT = Math.max(0, v.batFormT - dt);
    v.batFormCd = Math.max(0, v.batFormCd - dt);
    // 白天曬傷（不會曬到 sunFloor 以下）；夜裡「夜息」回血
    if (fighting && !v.night && !bl('garlic') && p.currentHealth > p.maxHealth * VAMPIRE.sunFloor) {
        p.currentHealth = Math.max(p.maxHealth * VAMPIRE.sunFloor, p.currentHealth - p.maxHealth * VAMPIRE.sunBurn * Math.max(0, 1 - blessVal('sunWard') - classMeta('sunWard')) * dt);
    }
    if (v.night && bl('nightRegen')) healHero(p.maxHealth * blessVal('nightRegen') * dt);
    // 血魔法：定時花一點自己的血炸開身邊
    bloodBurst(p, dt);
    // 狼化「撕咬」
    if (bl('vwBite')) {
        v.biteT -= dt;
        if (v.biteT <= 0) {
            const m = monsterGrid.nearestShared(p.pos, VW_BITE_RADIUS);
            if (m && m.isAlive) {
                v.biteT = VW_BITE_EVERY;
                const dmg = VW_BITE_DAMAGE * getWaveStatMultiplier(Math.max(1, gameState.currentWave)) * (1 + blessVal('vwBite')) * sacrificeMult();
                m.heroBlowAt = worldTime;
                m.takeDamage(dmg);
                healHero(dmg * bladeLeech());
                const fx = getVisualEffectFromPool(SlashEffect);
                if (fx) { fx.init(p.pos, m.pos); gameState.visualEffects.push(fx); }
            }
        }
    }
}
function bladeLeech() {
    const v = vampState();
    return (VAMPIRE.blade.leech + (v.night && res('werewolf') >= 1 ? RES_WOLFWALK_LEECH : 0)) * (v.moonT > 0 ? VAMPIRE.bloodMoon.leechMult : 1);
}

// ---------- 普攻：血之飛刃 ----------
const VAMP_BLADE = { projectileSpeed: 360, projectileRadius: 4, projectileColor: VAMP_ATTACK_COLOR, boltStyle: 'nightCrescent' };
// 血之飛刃：一彎夜紫色的月牙刃，邊飛邊轉，身後一圈紫光（我方攻擊不用紅，見專案 CLAUDE.md）
SHAPE_SPRITES.nightCrescent = {
    len: 18, wid: 18, spin: 3, glow: VAMP_ATTACK_COLOR,
    draw(g) {
        g.lineWidth = 1.6; g.strokeStyle = SHAPE_OUTLINE;
        // 月牙：外圓減掉偏一邊的內圓
        g.fillStyle = VAMP_ATTACK_COLOR;
        g.beginPath(); g.arc(0, 0, 8, -Math.PI * 0.85, Math.PI * 0.85); g.arc(-3.5, 0, 6.2, Math.PI * 0.62, -Math.PI * 0.62, true); g.closePath(); g.fill(); g.stroke();
        // 刃口的亮邊
        g.strokeStyle = '#EDE7F6'; g.lineWidth = 1.2;
        g.beginPath(); g.arc(0, 0, 6.8, -Math.PI * 0.6, Math.PI * 0.6); g.stroke();
    },
};
// 飛刃命中時吸血：Projectile 打中會呼叫 owner.healFromDamage
// preHit 在傷害之前呼叫：怪在 takeDamage 裡就會死、觸發 onMonsterKill，事後才標記就來不及（狼群初擁要認「是你親手打倒的」）
const vampBladeOwner = { healFromDamage: (dealt) => healHero(dealt * bladeLeech()), preHit: (m) => { m.heroBlowAt = worldTime; } };
const vampTargets = [];
function vampAttack(p, dt) {
    const v = vampState(), B = VAMPIRE.blade;
    if (moonWolfActive()) { moonClaw(p, dt); return; }
    v.bladeT -= dt;
    if (v.bladeT > 0) return;
    const rSq = B.range * B.range;
    vampTargets.length = 0;
    monsterGrid.forEachInRadius(p.pos, B.range, m => { if (m.isAlive && !m.stealthed) { const d = distanceSq(m.pos, p.pos); if (d <= rSq) vampTargets.push({ m, d }); } });
    if (!vampTargets.length) return;
    vampTargets.sort((a, b) => a.d - b.d);
    v.bladeT = B.interval;
    const n = Math.min(vampTargets.length, 1 + (res('bloodmagic') >= 1 ? 1 : 0));
    const dmg = B.damage * getWaveStatMultiplier(Math.max(1, gameState.currentWave)) * sacrificeMult();
    for (let i = 0; i < n; i++) {
        const pr = getProjectileFromPool();
        pr.init(p.pos.x, p.pos.y - 6, vampTargets[i].m, VAMP_BLADE, dmg, vampBladeOwner, 0, false);
        gameState.projectiles.push(pr);
    }
    Sfx.play('mageBolt');
}

// ---------- 雙流派「蝠群護主」：身邊最近的蝙蝠替你擋一截 ----------
// 主角每挨一下問一次：有蝙蝠在身邊就由牠扣一截血、主角少扣一截，中間拉一道紫線讓人看到是誰擋的
function batGuard() {
    if (!bl('batGuard')) return false;
    const p = gameState.player;
    let best = null, bd = BAT_GUARD_RADIUS * BAT_GUARD_RADIUS;
    for (const s of gameState.summons) { if (!s.isAlive || !(s instanceof BloodBat)) continue; const d = distanceSq(s.pos, p.pos); if (d < bd) { bd = d; best = s; } }
    if (!best) return false;
    const from = { x: best.pos.x, y: best.pos.y };
    best.takeDamage(best.maxHealth * BAT_GUARD_COST);
    const dx = p.pos.x - from.x, dy = p.pos.y - from.y, len = Math.hypot(dx, dy) || 1;
    addWorldFx({ kind: 'beam', x: from.x, y: from.y, dx: dx / len, dy: dy / len, len, w: 4, life: 0.25, color: '#B39DDB' });
    spawnParticles(from.x, from.y, VAMP_ATTACK_COLOR, 4, 40, 0.3, 2);
    return true;
}

// ---------- 傳說「月狼」：入夜時飛刃換成扇形爪擊 ----------
const MOONWOLF_SILVER = '#E1D5FF';
function moonWolfActive() { return bl('moonWolf') && vampState().night; }
function moonClaw(p, dt) {
    const v = vampState();
    v.clawT -= dt;
    if (v.clawT > 0) return;
    const t = monsterGrid.nearestShared(p.pos, MOONWOLF_RANGE);
    if (!t || !t.isAlive || t.stealthed) return;
    v.clawT = MOONWOLF_EVERY;
    const ang = Math.atan2(t.pos.y - p.pos.y, t.pos.x - p.pos.x), cosHalf = Math.cos(MOONWOLF_ARC / 2), rSq = MOONWOLF_RANGE * MOONWOLF_RANGE;
    const dmg = VAMPIRE.blade.damage * getWaveStatMultiplier(Math.max(1, gameState.currentWave)) * sacrificeMult() * MOONWOLF_MULT;
    let total = 0;
    monsterGrid.forEachInRadius(p.pos, MOONWOLF_RANGE, m => {
        if (!m.isAlive || m.stealthed) return;
        const dx = m.pos.x - p.pos.x, dy = m.pos.y - p.pos.y, dSq = dx * dx + dy * dy;
        if (dSq > rSq) return;
        const d = Math.sqrt(dSq) || 1;
        if ((dx * Math.cos(ang) + dy * Math.sin(ang)) / d < cosHalf && d > m.radius) return;
        m.heroBlowAt = worldTime;
        m.takeDamage(dmg); total += dmg;
    });
    healHero(total * bladeLeech() * MOONWOLF_LEECH);
    p.facingDirection = Math.cos(ang) >= 0 ? 1 : -1;
    gameState.visualEffects.push(new MoonClawEffect(p.pos, ang));
    Sfx.play('hit');
}
// 爪擊：三道彎月形的爪痕沿著扇形劃過去，銀紫色（我方攻擊不用紅）
class MoonClawEffect extends TimedEffect {
    constructor(pos, ang) { super({ x: pos.x, y: pos.y }, 0.28); this.ang = ang; }
    draw(ctx) {
        const k = 1 - this.life / this.duration, { x, y } = this.pos, half = MOONWOLF_ARC / 2;
        const sweep = Math.min(1, k * 2.2), from = this.ang - half, to = from + MOONWOLF_ARC * sweep;
        ctx.save();
        ctx.globalAlpha = k < 0.5 ? 1 : (1 - k) / 0.5;
        ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
            const r = MOONWOLF_RANGE * (0.55 + i * 0.2);
            for (const [col, lw] of [[VAMP_ATTACK_DARK, 7], [VAMP_ATTACK_COLOR, 4.5], [MOONWOLF_SILVER, 1.8]]) {
                ctx.strokeStyle = col; ctx.lineWidth = lw * (1 - i * 0.15);
                ctx.beginPath(); ctx.arc(x, y, r, from + i * 0.08, to + i * 0.08); ctx.stroke();
            }
        }
        ctx.restore();
    }
}
// 入夜的月狼：腳下一圈銀紫光，頭頂冒出兩隻尖尖的狼耳（畫在身體之前，看起來是從頭後面長出來的）
function drawMoonWolfAura(ctx, p) {
    if (!moonWolfActive()) return;
    const top = p.pos.y - p.imageHeight * 0.5 + 4;
    ctx.save();
    ctx.globalAlpha = 0.45 + 0.15 * Math.sin(worldTime * 5);
    ctx.drawImage(getGlowSprite(MOONWOLF_SILVER), p.pos.x - 36, p.pos.y + p.imageHeight * 0.3 - 14, 72, 28);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#B0A8C8'; ctx.strokeStyle = SHAPE_OUTLINE; ctx.lineWidth = 2;
    for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(p.pos.x + s * 3, top + 2); ctx.lineTo(p.pos.x + s * 11, top - 11); ctx.lineTo(p.pos.x + s * 13, top + 3); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = MOONWOLF_SILVER;
        ctx.beginPath(); ctx.moveTo(p.pos.x + s * 6, top + 1); ctx.lineTo(p.pos.x + s * 10.5, top - 6); ctx.lineTo(p.pos.x + s * 11.5, top + 1); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#B0A8C8';
    }
    ctx.restore();
}

// ---------- 傳說「蝠群風暴」：入夜那一刻，所有蝙蝠繞著你轉 ----------
function startBatStorm() {
    const v = vampState(), bats = gameState.summons.filter(s => s.isAlive && s instanceof BloodBat);
    if (!bats.length) return;
    v.stormT = STORM_TIME;
    bats.forEach((b, i) => { b.stormSlot = i / bats.length; b.stormR = STORM_RADIUS + STORM_SPREAD * ((i * 0.618) % 1); b.stormBite = Math.random() * STORM_BITE_EVERY; });
    const p = gameState.player;
    spawnFloatText(p.pos.x, p.pos.y - 72, '蝠群風暴', '#D1C4E9', 15, 1.2, 'batStorm');
}
function stormBat(b, dt) {
    const p = gameState.player, a = worldTime * STORM_SPIN + b.stormSlot * Math.PI * 2;
    const gx = p.pos.x + Math.cos(a) * b.stormR, gy = p.pos.y + Math.sin(a) * b.stormR * 0.8;
    const f = Math.min(1, dt * 12), dx = (gx - b.pos.x) * f;
    b.pos.x += dx; b.pos.y += (gy - b.pos.y) * f;
    if (Math.abs(dx) > 0.2) b.facingDirection = dx > 0 ? 1 : -1;
    b.stormBite -= dt;
    if (b.stormBite > 0) return;
    b.stormBite = STORM_BITE_EVERY;
    const dmg = b.attack * STORM_MULT, rSq = STORM_HIT_RADIUS * STORM_HIT_RADIUS;
    let hit = 0;
    monsterGrid.forEachInRadius(b.pos, STORM_HIT_RADIUS, m => { if (m.isAlive && distanceSq(m.pos, b.pos) <= rSq) { m.takeDamage(dmg); m.lastHitByThrall = true; hit += dmg; } });
    if (hit > 0) { healHero(hit * (BAT_DRAIN + blessVal('batDrain'))); if (inView(b.pos)) spawnParticles(b.pos.x, b.pos.y, VAMP_ATTACK_COLOR, 2, 40, 0.3, 2); }
}
// 風暴：繞著吸血鬼的幾道紫色氣旋（蝙蝠本身照常畫，氣旋讓「一圈在轉」一眼看得出來）
const STORM_ARCS = 4, STORM_TRAIL = 0.7;
function drawBatStorm(ctx) {
    const v = vampState(), p = gameState.player;
    if (v.stormT <= 0 || !p) return;
    const alpha = Math.min(1, v.stormT / 0.5, (STORM_TIME - v.stormT) / 0.3);
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < STORM_ARCS; i++) {
        const r = STORM_RADIUS + STORM_SPREAD * (i / STORM_ARCS), a = worldTime * STORM_SPIN * (1 + i * 0.1) + i * 1.7;
        ctx.globalAlpha = alpha * (0.5 - i * 0.08);
        ctx.strokeStyle = i % 2 ? '#B39DDB' : VAMP_ATTACK_COLOR; ctx.lineWidth = 5 - i;
        ctx.beginPath(); ctx.ellipse(p.pos.x, p.pos.y, r, r * 0.8, 0, a, a + Math.PI * 0.9); ctx.stroke();
    }
    // 每隻蝙蝠身後一道拖尾、身上一圈光：黑夜裡深紫的蝙蝠才看得出在繞圈
    const glow = getGlowSprite('#B39DDB');
    for (const b of gameState.summons) {
        if (!b.isAlive || !(b instanceof BloodBat) || b.stormSlot === undefined) continue;
        const a = worldTime * STORM_SPIN + b.stormSlot * Math.PI * 2;
        ctx.globalAlpha = alpha * 0.8;
        ctx.strokeStyle = '#D1C4E9'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(p.pos.x, p.pos.y, b.stormR, b.stormR * 0.8, 0, a - STORM_TRAIL, a); ctx.stroke();
        ctx.globalAlpha = alpha * 0.55;
        ctx.drawImage(glow, b.pos.x - 15, b.pos.y - 15, 30, 30);
    }
    ctx.restore();
}

// ---------- 血魔法：花一點自己的血，炸開身邊；越殘越痛 ----------
function bloodBurst(p, dt) {
    const v = vampState(), lv = gameState.units.BloodMagic.level, tier = getTier(lv);
    if (lv <= 0 && !bl('bmPower')) return;
    v.burstT -= dt;
    if (v.burstT > 0) return;
    const radius = BLOOD_BURST.radius * (1 + blessVal('bmRadius')) * (tier >= 1 ? BURST_TIER1_RADIUS : 1), rSq = radius * radius;
    if (!monsterGrid.anyWithin(p.pos, radius)) return;
    v.burstT = BLOOD_BURST.interval * (1 - blessVal('bmRate'));
    if (tier < 3) p.currentHealth = Math.max(1, p.currentHealth - p.currentHealth * BLOOD_BURST.hpCost);
    const missing = 1 - p.currentHealth / p.maxHealth;
    const dmg = BLOOD_BURST.damage * getWaveStatMultiplier(Math.max(1, gameState.currentWave)) * (1 + lv * CONFIG.bloodMagic.upgradeBonus)
        * (1 + missing * BLOOD_BURST.missingBonus) * (1 + blessVal('bmPower')) * sacrificeMult();
    let total = 0;
    monsterGrid.forEachInRadius(p.pos, radius, m => {
        if (!m.isAlive || distanceSq(m.pos, p.pos) > rSq) return;
        m.takeDamage(dmg); total += dmg;
        if (tier >= 2 && m.isAlive) m.applySlow(BURST_TIER2_SLOW, 1.2);
    });
    if (bl('bmLeech')) healHero(total * blessVal('bmLeech'));
    // 雙流派「血之紐帶」：範圍裡的眷屬回血，身上冒一圈紫色的血光
    if (bl('bloodBond')) summonGrid.forEachInRadius(p.pos, radius, s => {
        if (!s.isAlive || !(s instanceof Thrall) || distanceSq(s.pos, p.pos) > rSq) return;
        s.currentHealth = Math.min(s.maxHealth, s.currentHealth + s.maxHealth * BLOOD_BOND_HEAL);
        if (inView(s.pos)) { spawnParticles(s.pos.x, s.pos.y, '#E1BEE7', 5, 40, 0.5, 2.5); addWorldFx({ kind: 'ring', x: s.pos.x, y: s.pos.y, r0: 4, r1: 18, life: 0.35, color: VAMP_ATTACK_COLOR, width: 3 }); }
    });
    gameState.visualEffects.push(new BloodBurstEffect(p.pos, radius));
    addShake(3);
}
class BloodBurstEffect extends TimedEffect {
    constructor(pos, radius) { super(pos, 0.35); this.radius = radius; }
    draw(ctx) {
        const k = 1 - this.life / this.duration;
        ctx.save();
        ctx.globalAlpha = (1 - k) * 0.8;
        ctx.strokeStyle = VAMP_ATTACK_COLOR; ctx.lineWidth = 8 * (1 - k) + 2;
        ctx.beginPath(); ctx.arc(this.pos.x, this.pos.y, this.radius * (0.4 + 0.6 * k), 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = (1 - k) * 0.25;
        ctx.fillStyle = VAMP_ATTACK_DARK;
        ctx.beginPath(); ctx.arc(this.pos.x, this.pos.y, this.radius * (0.4 + 0.6 * k), 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}

// ---------- 大招：血月降臨 ----------
function useBloodMoon() {
    const v = vampState(), p = gameState.player, M = VAMPIRE.bloodMoon;
    v.moonT = M.duration;
    gameState.frenzyTimer = Math.max(gameState.frenzyTimer, M.duration);
    spawnFloatText(p.pos.x, p.pos.y - 40, '血月降臨！', '#B39DDB', 18, 1.3, 'bloodmoon');
    spawnParticles(p.pos.x, p.pos.y, VAMP_ATTACK_DARK, 36, 200, 0.7, 3);
    // 兩圈夜紫衝擊波，一群血蝙蝠從身上往四面八方飛散
    addWorldFx({ kind: 'ring', x: p.pos.x, y: p.pos.y, r0: 20, r1: 200, life: 0.7, color: VAMP_ATTACK_COLOR, width: 10 });
    addWorldFx({ kind: 'ring', x: p.pos.x, y: p.pos.y, r0: 10, r1: 120, life: 0.5, color: '#D1C4E9', width: 5, delay: 0.12 });
    addWorldFx({ kind: 'sprites', image: 'blood_bat', x: p.pos.x, y: p.pos.y, size: 26, life: 0.9, list: Array.from({ length: MOON_BATS }, (_, i) => { const a = i / MOON_BATS * Math.PI * 2 + Math.random() * 0.4, s = 160 + Math.random() * 120; return { vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7 }; }) });
    addShake(7);
    Sfx.play('boss');
    gameState.ultCooldown = M.cooldown;
    gameState.run.novas++;
    stats().novas++;
    return true;
}

// ---------- 轉化 ----------
function convertTarget() {
    const p = gameState.player;
    if (!p || gameState.units.Thrall.count >= thrallCap()) return null;
    let best = null, bd = VAMPIRE.convertRange * VAMPIRE.convertRange;
    for (const m of gameState.monsters) {
        if (!m.isAlive || m instanceof BossMonster || m.stealthed || (m.isElite && res('kin') < 2)) continue;
        const d = distanceSq(m.pos, p.pos);
        if (d < bd) { bd = d; best = m; }
    }
    return best;
}
function raiseThrall(m, level, boss = false) {
    const s = spawnThrall(m.pos.x, m.pos.y, configKeyOf(m.config), level, m.isElite && res('kin') >= 2, boss);
    spawnParticles(m.pos.x, m.pos.y, '#CE93D8', 14, 80, 0.6, 3);
    if (boss) spawnFloatText(m.pos.x, m.pos.y - 30, `${m.config.name}向你下跪`, '#E1BEE7', 16, 1.8, 'dracula');
    return s;
}
// src：牠生前是哪一種怪（CONFIG 的鍵；首領們的 type 都叫 Boss，只能用鍵分）
function spawnThrall(x, y, src, level, elite = false, boss = false) {
    const t = new Thrall(x, y, level, gameState.player);
    t.setSource(src, elite, boss);
    t.currentHealth = t.maxHealth;
    gameState.summons.push(t);
    gameState.units.Thrall.count++;
    return t;
}

// 每種怪轉化後的設定（同一種怪共用一份）
const thrallCfgCache = {};
// 狼伴：不是怪變的，有自己的圖（黑毛紫紋的血月之狼）
const THRALL_WOLF = { type: 'wolf', name: '狼', baseHealth: 30, baseAttack: 7, radius: 10, attackRange: 22, attackSpeed: 1.3, moveSpeed: 120, imageName: 'blood_wolf', imgScaleMultiplier: 4.1 };
const configKeys = new Map();
function configKeyOf(config) {
    if (!configKeys.size) for (const k in CONFIG) if (CONFIG[k] && typeof CONFIG[k] === 'object') configKeys.set(CONFIG[k], k);
    return configKeys.get(config) || 'basicMeleeMonster';
}
function thrallConfig(srcKey) {
    if (thrallCfgCache[srcKey]) return thrallCfgCache[srcKey];
    const src = srcKey === 'wolf' ? THRALL_WOLF : (CONFIG[srcKey] || CONFIG.basicMeleeMonster);
    const srcType = srcKey;
    const look = src === THRALL_WOLF ? { imageName: src.imageName, scale: src.imgScaleMultiplier } : monsterLook(src);
    const arche = THRALL_ARCHE[src.type] || ((src.attackRange || 0) >= 60 ? 'ranged' : 'melee');
    const ranged = arche === 'ranged' || arche === 'mender';
    return (thrallCfgCache[srcType] = {
        ...CONFIG.thrall, srcType, arche, srcName: src.name,
        imageName: look.imageName, imgScaleMultiplier: look.scale, radius: src.radius, color: src.color || '#CE93D8',
        baseHealth: Math.max(THRALL_MIN_HP, src.baseHealth) * THRALL_HP_MULT, baseAttack: Math.max(THRALL_MIN_ATK, src.baseAttack) * THRALL_ATK_MULT,
        attackRange: ranged ? THRALL_RANGED_RANGE : Math.max(20, src.attackRange || 22), attackSpeed: src.attackSpeed || 1,
        moveSpeed: Math.max(50, src.moveSpeed || 60), flying: !!src.flying,
    });
}

// ---------- 眷屬 ----------
class Thrall extends SummonUnit {
    constructor(x, y, level, p) {
        super(x, y, CONFIG.thrall, level, p);
    }
    setSource(srcType, elite, boss) {
        this.config = thrallConfig(srcType);
        this.elite = elite; this.isBoss = boss;
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
        this.maxHealth = Math.round(this.maxHealth * (1 + blessVal('kinPower')) * (this.elite ? CONFIG.elite.hpMult : 1));
        this.attack *= (1 + blessVal('kinPower')) * (this.elite ? CONFIG.elite.atkMult : 1) * nightMult();
        this.attackSpeed *= 1 + blessVal('vwHowl');
        const moon = vampState().night && res('werewolf') >= 2 && this.config.arche === 'melee';
        if (moon) { this.attack *= RES_MOONPACK_DMG; this.moveSpeed *= RES_MOONPACK_SPEED; }
        // 眷屬染成淡紫，一眼分得出是自己人；精英、首領保留原本的大小
        // 狼伴不是怪變的、圖本來就是我方的紫色配色，不染（染了整隻變粉紫，細節被洗掉）
        if (this.config.srcType !== 'wolf') { this.tint = THRALL_TINT; this.tintStrength = THRALL_TINT_STRENGTH; }
        if (this.elite) this.drawScale *= CONFIG.elite.sizeMult;
    }
    healFromDamage(dealt) {
        super.healFromDamage(dealt);
        const ls = blessVal('kinLeech') + (this.tier >= 1 ? THRALL_TIER1_LEECH : 0);
        if (ls > 0) this.currentHealth = Math.min(this.maxHealth, this.currentHealth + dealt * ls);
    }
    attackTarget() {
        const t = this.target;
        if (!t || !t.isAlive) return;
        const a = this.config.arche;
        const dmg = this.attack;
        if (a === 'mender') {
            // 巫醫、祭司：先救人（最殘的眷屬，或血不到七成的你），沒人要救才出手
            const p = gameState.player;
            let ward = null, worst = 1;
            summonGrid.forEachInRadius(this.pos, MENDER_RADIUS, s => { if (s.isAlive && s !== this && s instanceof Thrall) { const r = s.currentHealth / s.maxHealth; if (r < worst) { worst = r; ward = s; } } });
            if (p.currentHealth < p.maxHealth * MENDER_HERO_BELOW && distanceSq(p.pos, this.pos) <= MENDER_RADIUS * MENDER_RADIUS) { healHero(p.maxHealth * MENDER_HEAL * 0.5); spawnParticles(p.pos.x, p.pos.y, '#A5D6A7', 4, 40, 0.4, 2); }
            else if (ward && worst < 0.9) { ward.currentHealth = Math.min(ward.maxHealth, ward.currentHealth + ward.maxHealth * MENDER_HEAL); spawnParticles(ward.pos.x, ward.pos.y, '#A5D6A7', 4, 40, 0.4, 2); }
            else this.shoot(t, dmg);
        } else if (a === 'ranged') {
            this.shoot(t, dmg);
        } else {
            const hitT = t;
            hitT.takeDamage(dmg);
            hitT.lastHitByThrall = true;
            if (a === 'burrower') {
                const rSq = BURROWER_RADIUS * BURROWER_RADIUS;
                groundMonsterGrid.forEachInRadius(hitT.pos, BURROWER_RADIUS, m => { if (m !== hitT && m.isAlive && distanceSq(m.pos, hitT.pos) <= rSq) m.takeDamage(dmg * 0.6); });
            }
            this.healFromDamage(dmg);
            const fx = getVisualEffectFromPool(SlashEffect);
            if (fx) { fx.init(this.pos, hitT.pos); gameState.visualEffects.push(fx); }
        }
        this.attackCooldown = 1 / this.attackSpeed;
    }
    shoot(t, dmg) {
        const pr = getProjectileFromPool();
        pr.init(this.pos.x, this.pos.y, t, this.config, dmg, this, 0, false);
        gameState.projectiles.push(pr);
    }
    onHit(m) { m.lastHitByThrall = true; }
    die() {
        if (!this.isAlive) return;
        if (this.tier >= 3 && !this.revived && Math.random() < THRALL_TIER3_REVIVE) {
            this.revived = true;
            this.currentHealth = Math.round(this.maxHealth * 0.5);
            spawnParticles(this.pos.x, this.pos.y, '#CE93D8', 10, 60, 0.5);
            return;
        }
        this.isAlive = false;
        gameState.units.Thrall.count--;
        // 腐屍：死了會爆
        if (this.config.arche === 'bomber') {
            const rSq = BOMBER_RADIUS * BOMBER_RADIUS, dmg = this.attack * BOMBER_MULT;
            monsterGrid.forEachInRadius(this.pos, BOMBER_RADIUS, m => { if (m.isAlive && distanceSq(m.pos, this.pos) <= rSq) m.takeDamage(dmg); });
            spawnParticles(this.pos.x, this.pos.y, '#9CCC65', 22, 130, 0.6, 3);
            addShake(3);
        }
        onSummonDeath(this);
        spawnParticles(this.pos.x, this.pos.y, '#CE93D8', 10, 70, 0.45);
        updateUI();
    }
    drawHealthBar(ctx) {
        // 腳下一圈紫：自己人（不用紅，紅色是敵人與危險）
        ctx.strokeStyle = 'rgba(124, 77, 255, 0.75)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(this.pos.x, this.pos.y + this.imageHeight * 0.38 * (this.drawScale || 1), this.radius * 1.1, this.radius * 0.4, 0, 0, Math.PI * 2); ctx.stroke();
        super.drawHealthBar(ctx);
    }
}

// ---------- 蝙蝠 ----------
class BloodBat extends SummonUnit {
    constructor(x, y, level, p) { super(x, y, CONFIG.bloodBat, level, p); }
    update(dt, monsters, summons, player) {
        if (!this.isAlive) return;
        if (vampState().stormT > 0 && this.stormSlot !== undefined) { this.tickFlash(dt); stormBat(this, dt); return; }
        super.update(dt, monsters, summons, player);
    }
    computeStats() {
        super.computeStats();
        const v = vampState();
        this.attack *= (1 + blessVal('batFang')) * nightMult();
        const sp = 1 + blessVal('batSpeed');
        this.moveSpeed *= sp;
        this.attackSpeed *= sp * (this.tier >= 1 ? BAT_TIER1_RATE : 1) * (v.night && res('bats') >= 1 ? RES_NIGHTWING_RATE : 1);
    }
    attackTarget() {
        const t = this.target;
        if (!t || !t.isAlive) return;
        const bites = this.tier >= 3 ? 2 : 1;
        for (let i = 0; i < bites; i++) t.takeDamage(this.attack);
        t.lastHitByThrall = true;
        const drain = this.attack * bites * (BAT_DRAIN + blessVal('batDrain')) * (this.tier >= 2 ? 2 : 1);
        healHero(drain);
        this.attackCooldown = 1 / this.attackSpeed;
        if (Math.random() < 0.25) spawnParticles(t.pos.x, t.pos.y, VAMP_ATTACK_COLOR, 2, 40, 0.3, 2);
    }
    die() {
        if (!this.isAlive) return;
        this.isAlive = false;
        gameState.units.BloodBat.count--;
        onSummonDeath(this);
        spawnParticles(this.pos.x, this.pos.y, VAMP_ATTACK_DARK, 8, 60, 0.4);
        updateUI();
    }
}
// 成雙：每次補蝙蝠多來幾隻（多出來的不另外等補兵間隔）
UNIT_TYPES.BloodBat.summon = (level) => {
    const p = gameState.player;
    for (let i = 0; i < 1 + bl('batPair'); i++) {
        const pos = p.getSummonPosition();
        gameState.summons.push(new BloodBat(pos.x + randomInRange(-8, 8), pos.y + randomInRange(-8, 8), level, p));
        gameState.units.BloodBat.count++;
        spawnParticles(pos.x, pos.y, VAMP_ATTACK_COLOR, 8, 60, 0.4);
    }
};

// ---------- 畫面：太陽／月亮貼在血條旁、天色 ----------
function drawVampHud(ctx, p) {
    const v = vampState();
    const icon = getIconImage(v.night ? (v.moonT > 0 ? 'bloodmoon' : 'moon') : 'sun');
    if (icon) ctx.drawImage(icon, p.pos.x + 22, p.pos.y + p.imageHeight * 0.5 - 4, 14, 14);
    if (v.batFormT > 0) {
        ctx.save(); ctx.globalAlpha = 0.5;
        ctx.drawImage(getGlowSprite(VAMP_ATTACK_COLOR), p.pos.x - 40, p.pos.y - 40, 80, 80);
        ctx.restore();
    }
}
// 白天一層淡淡的暖光、黑夜一層藍黑（血月是深紫：整個畫面泛紅會跟低血量的紅暈搞混）。整個畫面一次 fillRect，不影響效能
function drawVampSky(ctx) {
    const v = vampState();
    ctx.fillStyle = v.moonT > 0 ? 'rgba(45, 10, 90, 0.26)' : v.night ? 'rgba(10, 6, 40, 0.24)' : 'rgba(255, 196, 110, 0.07)';
    ctx.fillRect(0, 0, view.cssW, view.cssH);
    if (v.moonT > 0) drawBloodMoon(ctx, v);
}
// 血月：畫面右上方升起一輪巨大的夜紫色月亮，背後幾道慢慢轉的紫光，快結束時淡掉（我方大招不用紅，見專案 CLAUDE.md）
const MOON_R = 46, MOON_RISE = 0.7, MOON_FADE = 1, MOON_RAYS = 9, MOON_BATS = 12;
const MOON_LIGHT = '#D1C4E9', MOON_DARK = VAMP_ATTACK_DARK, MOON_CRATER = 'rgba(40, 20, 90, 0.25)', MOON_RAY = 'rgba(179, 157, 219, 0.1)';
const MOON_CRATERS = [[-0.35, -0.2, 0.2], [0.28, 0.18, 0.26], [0.08, -0.48, 0.1], [-0.22, 0.42, 0.13], [0.45, -0.25, 0.08], [-0.55, 0.15, 0.07]];
function drawBloodMoon(ctx, v) {
    const since = VAMPIRE.bloodMoon.duration - v.moonT;
    const rise = Math.min(1, Math.max(0, since) / MOON_RISE), ease = 1 - (1 - rise) * (1 - rise);
    const alpha = Math.min(1, v.moonT / MOON_FADE) * ease;
    const cx = view.cssW * 0.72, cy = hudTop + 110 - (1 - ease) * 80;
    ctx.save();
    ctx.globalAlpha = alpha;
    // 光芒
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(worldTime * 0.15);
    ctx.fillStyle = MOON_RAY;
    for (let i = 0; i < MOON_RAYS; i++) {
        ctx.rotate(Math.PI * 2 / MOON_RAYS);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-14, -MOON_R * 4.5); ctx.lineTo(14, -MOON_R * 4.5); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = alpha * (0.75 + 0.25 * Math.sin(worldTime * 2));
    const gs = MOON_R * 5;
    ctx.drawImage(getGlowSprite(VAMP_ATTACK_COLOR), cx - gs / 2, cy - gs / 2, gs, gs);
    ctx.globalAlpha = alpha;
    const g = ctx.createRadialGradient(cx - MOON_R * 0.3, cy - MOON_R * 0.3, MOON_R * 0.1, cx, cy, MOON_R);
    g.addColorStop(0, MOON_LIGHT);
    g.addColorStop(1, MOON_DARK);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, MOON_R, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = MOON_CRATER;
    for (const [x, y, r] of MOON_CRATERS) { ctx.beginPath(); ctx.arc(cx + x * MOON_R, cy + y * MOON_R, r * MOON_R, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
}
