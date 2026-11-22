const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ---------- 畫面與鏡頭：畫布鋪滿整個螢幕，鏡頭跟著法師，地圖無限延伸 ----------
// 不管手機直拿還是電腦橫放，畫面裡看得到的世界面積都差不多是 VIEW_AREA（世界單位²），
// 單位大小不會因為螢幕形狀忽大忽小
const VIEW_AREA = 600 * 400 * 1.5;
const MAX_DPR = 2;
const CAMERA_FOLLOW = 6;
const view = { cssW: 600, cssH: 400, dpr: 1, unitPx: 1, zoom: 1, w: 600, h: 400 };
const camera = { x: -300, y: -200 };
function resizeCanvas() {
    const vv = window.visualViewport;
    const cssW = Math.max(1, Math.round(vv ? vv.width : window.innerWidth));
    const cssH = Math.max(1, Math.round(vv ? vv.height : window.innerHeight));
    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    const unitPx = Math.sqrt(cssW * cssH / VIEW_AREA);
    Object.assign(view, { cssW, cssH, dpr, unitPx, zoom: unitPx * dpr, w: cssW / unitPx, h: cssH / unitPx });
    auraLayer = null;
    hudTop = uiElements.hudTop ? Math.round(uiElements.hudTop.getBoundingClientRect().bottom) - HUD_TOP_FADE_PX : hudTop;
    if (gameState && gameState.player) snapCamera();
}
function snapCamera() {
    const p = gameState.player;
    if (!p) return;
    camera.x = p.pos.x - view.w / 2;
    camera.y = p.pos.y - view.h / 2;
}
function updateCamera(deltaTime) {
    const p = gameState.player;
    if (!p) return;
    const k = Math.min(1, deltaTime * CAMERA_FOLLOW);
    camera.x += (p.pos.x - view.w / 2 - camera.x) * k;
    camera.y += (p.pos.y - view.h / 2 - camera.y) * k;
}
const CULL_MARGIN = 80;
function inView(pos) {
    return pos.x > camera.x - CULL_MARGIN && pos.x < camera.x + view.w + CULL_MARGIN &&
        pos.y > camera.y - CULL_MARGIN && pos.y < camera.y + view.h + CULL_MARGIN;
}

const uiElements = {
    waveInfo: document.getElementById('wave-info'),
    timerInfo: document.getElementById('timer-info'),
    soulsInfo: document.getElementById('souls-info'),
    playerHealthInfo: document.getElementById('player-health-info'),
    hpFill: document.getElementById('hp-fill'),
    hudTop: document.getElementById('hud-top'),
    skelLevel: document.getElementById('skel-level'),
    skelCount: document.getElementById('skel-count'),
    summonSkeletonBtn: document.getElementById('summon-skeleton-btn'),
    upgradeSkeletonBtn: document.getElementById('upgrade-skeleton-btn'),
    eyeMonsterLevel: document.getElementById('eye-monster-level'),
    eyeMonsterCount: document.getElementById('eye-monster-count'),
    summonEyeMonsterBtn: document.getElementById('summon-eye-monster-btn'),
    upgradeEyeMonsterBtn: document.getElementById('upgrade-eye-monster-btn'),
    wraithLevel: document.getElementById('wraith-level'),
    wraithCount: document.getElementById('wraith-count'),
    summonWraithBtn: document.getElementById('summon-wraith-btn'),
    upgradeWraithBtn: document.getElementById('upgrade-wraith-btn'),
    pauseResumeBtn: document.getElementById('pause-resume-btn'),
    messageArea: document.getElementById('message-area'),
    gameOverScreen: document.getElementById('game-over-screen'),
    finalWaveText: document.getElementById('final-wave-text'),
    bestWaveText: document.getElementById('best-wave-text'),
    finalStatsText: document.getElementById('final-stats-text'),
    finalBlessings: document.getElementById('final-blessings'),
    restartButton: document.getElementById('restart-button'),
    pauseMenu: document.getElementById('pause-menu'),
    volumeSlider: document.getElementById('volume-slider'),
    sfxSlider: document.getElementById('sfx-slider'),
    resumeGameBtn: document.getElementById('resume-game-btn'),
    statSummonSkel: document.getElementById('stat-summon-skel'),
    statSummonEye: document.getElementById('stat-summon-eye'),
    statSummonWraith: document.getElementById('stat-summon-wraith'),
    statKillBasic: document.getElementById('stat-kill-basic'),
    statKillFast: document.getElementById('stat-kill-fast'),
    statKillArmored: document.getElementById('stat-kill-armored'),
    statKillBloater: document.getElementById('stat-kill-bloater'),
    statKillBoss: document.getElementById('stat-kill-boss'),
    skipWaveBtn: document.getElementById('skip-wave-btn'),
    novaBtn: document.getElementById('nova-btn'),
    draftScreen: document.getElementById('draft-screen'),
    draftCards: document.getElementById('draft-cards'),
    pauseBlessings: document.getElementById('pause-blessings'),
    bgm: document.getElementById('bgm'),
    restartGameBtn: document.getElementById('restart-game-btn'),
    restartConfirmDialog: document.getElementById('restart-confirm-dialog'),
    restartConfirmYes: document.getElementById('restart-confirm-yes'),
    restartConfirmNo: document.getElementById('restart-confirm-no'),
};

const CONFIG = {
    player: {
        baseHealth: 50, baseMoveSpeed: 90, radius: 12, color: '#03A9F4',
        imageName: 'player', imgScaleMultiplier: 4,
        initialSouls: 20,
        avoidanceRadius: 15,
        magnetRadius: 75,
    },
    skeletonWarrior: {
        type: 'SkeletonWarrior', baseHealth: 36, baseAttack: 5, radius: 10,
        imageName: 'skeleton_warrior', imgScaleMultiplier: 2.8,
        attackRange: 25, attackSpeed: 1.0, moveSpeed: 80, color: '#FFFFFF',
        upgradeBonus: 0.10,
        summonCost: 3,
        upgradeCostBase: 10,
        upgradeCostInc: 5,
        targetSearchRadius: 150, returnDistance: 50,
        avoidanceRadius: 18, avoidanceForce: 130,
        playerAvoidanceForce: 60,
        wanderRadius: 20, wanderSpeedFactor: 0.3, wanderIntervalMin: 1.5, wanderIntervalMax: 3.0,
        wraithBuffMoveSpeedMultiplier: 2.0,
    },
    eyeMonster: {
        type: 'EyeMonster', baseHealth: 12, baseAttack: 15, radius: 11,
        imageName: 'eye_monster', imgScaleMultiplier: 3,
        attackRange: 120,
        attackRangeUpgrade: 3,
        attackSpeed: 0.8, moveSpeed: 60, color: '#A1887F',
        upgradeBonus: 0.10,
        summonCost: 8,
        upgradeCostBase: 15,
        upgradeCostInc: 8,
        targetSearchRadius: 180, returnDistance: 30,
        avoidanceRadius: 16, avoidanceForce: 120,
        playerAvoidanceForce: 50,
        wanderRadius: 15, wanderSpeedFactor: 0.3, wanderIntervalMin: 1.8, wanderIntervalMax: 3.5,
        projectileColor: '#F06292',
        projectileSpeed: 300,
        projectileRadius: 3,
        retreatCheckDistance: 40,
        retreatSpeedFactor: 1.1,
        wraithBuffAttackSpeedMultiplier: 2.0,
    },
    wraith: {
        type: 'Wraith', baseHealth: 15, baseAttack: 0, radius: 11,
        imageName: 'wraith', imgScaleMultiplier: 2.7,
        attackRange: 0,
        slowRadiusBase: 80,
        slowRadiusUpgrade: 5,
        // 單隻怨靈的光環封頂：不封的話一隻高等怨靈就蓋滿全圖、怪物定身，挑戰直接消失
        slowRadiusMax: 150,
        slowAmountMax: 0.7,
        slowAmountBase: 0.5,
        slowAmountUpgrade: 0.025,
        slowDuration: 1.5, attackSpeed: 1.0, moveSpeed: 55, color: '#4DB6AC',
        upgradeBonus: 0.15,
        summonCost: 10,
        upgradeCostBase: 20,
        upgradeCostInc: 10,
        targetSearchRadius: 200, returnDistance: 40,
        avoidanceRadius: 25,
        avoidanceForce: 160,
        wraithAvoidanceMultiplier: 1.5,
        playerAvoidanceForce: 70,
        retreatSpeedFactor: 0.4,
        wanderRadius: 35, wanderSpeedFactor: 0.25, wanderIntervalMin: 2.0, wanderIntervalMax: 4.0,
        buffRadiusProperty: 'slowRadius',
        auraColor: '#4DB6AC',
        explosionBaseDamage: 45,
    },
    basicMeleeMonster: {
        type: 'BasicMelee', baseHealth: 12, baseAttack: 4, radius: 12,
        imageName: 'basic_melee', imgScaleMultiplier: 5,
        attackRange: 20, attackSpeed: 1.0, moveSpeed: 50, color: '#EF5350',
        soulDrop: 1, waveSpeedIncreaseFactor: 0.01,
    },
    fastMeleeMonster: {
        type: 'FastMelee', baseHealth: 20, baseAttack: 6, radius: 11,
        imageName: 'fast_melee', imgScaleMultiplier: 3,
        attackRange: 18, attackSpeed: 1.2, moveSpeed: 95, color: '#FF7043',
        soulDrop: 2, waveSpeedIncreaseFactor: 0.012,
        minWave: 4, waveInterval: 2,
    },
    bloaterMonster: {
        type: 'Bloater', baseHealth: 18, baseAttack: 14, radius: 12,
        imageName: 'basic_melee', imgScaleMultiplier: 5.5, tint: '#7CB342', tintStrength: 0.55,
        attackRange: 22, attackSpeed: 1.0, moveSpeed: 62, color: '#7CB342',
        soulDrop: 2, waveSpeedIncreaseFactor: 0.01,
        minWave: 8, waveInterval: 3,
        // 貼上目標後先膨脹一下才爆，給召喚物一個把它打掉的空檔
        fuseTime: 0.6, blastRadius: 42,
    },
    armoredMeleeMonster: {
        type: 'ArmoredMelee', baseHealth: 90, baseAttack: 18, radius: 15,
        imageName: 'armored_melee', imgScaleMultiplier: 6,
        attackRange: 22, attackSpeed: 0.8, moveSpeed: 30, color: '#B71C1C',
        soulDrop: 5, waveSpeedIncreaseFactor: 0.008,
        minWave: 9, waveInterval: 4,
    },
    boss: {
        type: 'Boss', name: '骸骨巨像', baseHealth: 500, baseAttack: 22, radius: 26,
        imageName: 'armored_melee', imgScaleMultiplier: 4.5, tint: '#AB47BC', tintStrength: 0.5,
        attackRange: 32, attackSpeed: 0.6, moveSpeed: 30, color: '#AB47BC',
        soulDrop: 40, waveSpeedIncreaseFactor: 0.004,
        slamInterval: 5, slamWindup: 1.1, slamRadius: 80, slamDamageMult: 1.0,
        // 首領只吃一半的緩速，不然一隻怨靈就能把它定在原地
        slowResist: 0.5,
    },
    plagueBoss: {
        type: 'Boss', name: '疫病母巢', baseHealth: 600, baseAttack: 18, radius: 24,
        imageName: 'basic_melee', imgScaleMultiplier: 6.5, tint: '#33691E', tintStrength: 0.6,
        attackRange: 30, attackSpeed: 0.8, moveSpeed: 26, color: '#33691E',
        soulDrop: 45, waveSpeedIncreaseFactor: 0.004,
        spawnInterval: 4, spawnCountBase: 3, spawnCountPerTier: 1, spawnRadius: 40,
        slowResist: 0.5,
    },
    hunterBoss: {
        type: 'Boss', name: '暗影獵手', baseHealth: 450, baseAttack: 26, radius: 20,
        imageName: 'fast_melee', imgScaleMultiplier: 4.2, tint: '#311B92', tintStrength: 0.6,
        attackRange: 26, attackSpeed: 1.2, moveSpeed: 55, color: '#311B92',
        soulDrop: 45, waveSpeedIncreaseFactor: 0.006,
        // 先畫一條預警線，再沿線高速衝過去，路上的召喚物 / 法師都吃傷害
        dashInterval: 4.5, dashWindup: 0.8, dashDistance: 260, dashSpeed: 700, dashWidth: 28,
        dashDamageMult: 1.5, dashTriggerRange: 300,
        slowResist: 0.5,
    },
    thief: {
        type: 'Thief', name: '金魂竊賊', baseHealth: 60, baseAttack: 0, radius: 11,
        imageName: 'fast_melee', imgScaleMultiplier: 3, tint: '#FFC107', tintStrength: 0.55,
        attackRange: 0, attackSpeed: 1, moveSpeed: 85, color: '#FFC107',
        soulDrop: 20, soulPerWave: 2, waveSpeedIncreaseFactor: 0.005,
        lifetime: 15, leashRadius: 260,
    },
    waveEvents: {
        startWave: 6, chance: 0.3,
        list: {
            bloodMoon: { icon: '🌕', name: '血月', desc: '怪物 ×1.6、靈魂 ×2', countMult: 1.6, soulMult: 2, overlay: 'rgba(183, 28, 28, 0.13)', color: '#EF9A9A' },
            eliteTide: { icon: '👑', name: '精英潮', desc: '精英怪大量出現', eliteMult: 4, eliteMax: 0.6, color: '#FFD54F' },
            frenzy: { icon: '💢', name: '狂暴', desc: '怪物更快、靈魂 ×1.5', speedMult: 1.35, atkSpeedMult: 1.3, soulMult: 1.5, overlay: 'rgba(255, 111, 0, 0.08)', color: '#FFAB91' },
            plague: { icon: '🤢', name: '腐屍狂潮', desc: '腐屍 ×3', bloaterMult: 3, color: '#AED581' },
            treasure: { icon: '💰', name: '金魂竊賊', desc: '打倒逃跑的竊賊拿大量靈魂', thieves: 3, color: '#FFE082' },
        },
    },
    streak: {
        // 這麼多秒內沒有新的擊殺，連殺就歸零
        window: 2.5,
        bonusStep: 25, bonusPerStep: 0.05, bonusMax: 0.5,
        showFrom: 10,
        milestones: [50, 100, 250, 500, 1000, 2500, 5000],
    },
    elite: {
        startWave: 5, chanceBase: 0.03, chancePerWave: 0.004, chanceMax: 0.15,
        hpMult: 3, atkMult: 1.5, sizeMult: 1.25, soulMult: 4,
        tint: '#FFD54F', tintStrength: 0.35,
    },
    wave: {
        betweenTime: 5,
        // 前 earlyWaves 波成長較快（前期原本最無聊，要有壓力）；之後的斜率與舊版相同
        // （舊版：每 5 波 +10%、第 50 波後每波再 +0.7%），已經玩到很後面的存檔不會突然變難
        earlyWaves: 20, earlyScalePerWave: 0.035,
        scalePerWave: 0.02, lateWave: 50, lateScalePerWave: 0.007,
        // 召喚物不設上限時，玩家收入隨怪物「數量」成長、戰力隨累積收入成長，線性變強的怪物永遠追不上
        // （舊版就是這樣撐到無限波）。從 expStartWave 起再乘上 expGrowth^(超過的波數)，保證終究會被淹沒
        expStartWave: 30, expGrowth: 1.08,
        basicBase: 3, basicPerWave: 1.3,
        bossEvery: 10, bossWaveCountFactor: 0.5,
        spawnIntervalBase: 0.9, spawnIntervalPerWave: 0.01, spawnIntervalMin: 0.35,
        firstSpawnDelay: 0.8, packMin: 1, packMax: 4, packSpread: 25,
        healRatio: 0.2,
        bannerDuration: 1.8,
    },
    visuals: {
        slashEffectDuration: 0.15,
        slashEffectColor: 'rgba(255, 255, 255, 0.8)',
        slashEffectWidth: 2,
        slashEffectArcRadius: 15,
        slashEffectArcAngle: Math.PI / 3,
        explosionEffectDuration: 0.35,
        explosionEffectColor: 'rgba(255, 165, 0, 0.8)',
        hitFlashDuration: 0.12,
        deathFadeDuration: 0.3,
        maxParticles: 400,
        shakeDecayPerSec: 30,
        hurtFlashDuration: 0.35,
    },
    orbs: {
        maxOrbsPerDrop: 4,
        popSpeedMin: 40, popSpeedMax: 110,
        friction: 4,
        // 剛掉出來的一小段時間不吸，讓「噴出來」看得見
        attractDelay: 0.25,
        attractSpeed: 380,
        pickupPadding: 8,
        // 數值大的才飄字，避免一大群小怪死掉時滿畫面 +1
        floatTextMinValue: 5,
    },
    nova: {
        radius: 110, baseDamage: 25, cooldown: 18,
        knockbackSpeed: 280, knockbackFriction: 8, bossKnockbackMult: 0.2,
        slowAmount: 0.5, slowDuration: 1.5,
        effectDuration: 0.4,
    },
    draft: {
        every: 3, optionCount: 3,
    },
    // 兵種進化：等級到門檻就升一階（★），外型變大換色、多一個能力
    evolution: {
        levels: [10, 25, 50],
        tints: ['#64B5F6', '#FFD54F', '#EF5350'],
        tintStrength: [0.28, 0.32, 0.36],
        sizeBonusPerTier: 0.12,
        names: {
            SkeletonWarrior: ['骨騎士', '骨將軍', '骨王'],
            EyeMonster: ['彈射魔眼', '雙瞳魔眼', '爆裂魔眼'],
            Wraith: ['衰弱怨靈', '脈衝怨靈', '湮滅怨靈'],
        },
        perks: {
            SkeletonWarrior: ['20% 爆擊造成雙倍傷害', '攻擊橫掃周圍敵人', '陣亡時 50% 重組復活'],
            EyeMonster: ['彈幕命中後彈射 1 次', '每次多射 1 發', '彈幕命中時爆炸'],
            Wraith: ['光環內的怪攻擊力 -25%', '每 3 秒脈衝傷害', '死亡爆炸更大並定身'],
        },
        skelCritChance: 0.2, skelCritMult: 2,
        skelCleave: 0.3,
        skelReviveChance: 0.5, skelReviveHealth: 0.5,
        eyeBounces: 1, eyeBounceRange: 90,
        eyeExtraShots: 1,
        eyeBlastRadius: 28, eyeBlastMult: 0.5,
        wraithWeaken: 0.25,
        wraithPulseInterval: 3, wraithPulseMult: 0.3,
        wraithBlastRadiusMult: 1.5, wraithStunDuration: 1.0,
    },
    holdingButton: {
        holdDelay: 350,
        repeatInterval: 150,
    },
    audio: {
        initialVolume: 0.3,
        initialSfxVolume: 0.5,
    }
};

// ---------- 祝福（每 3 波 / 首領波三選一，可疊層） ----------
const CLEAVE_RADIUS = 35;
const pct = (v) => `${Math.round(v * 100)}%`;
const BLESSINGS = {
    boneBlade: { icon: '🗡️', name: '骨刃', max: 5, per: 0.35, desc: b => `骷髏傷害 +${pct(b.per)}` },
    cleave: { icon: '🌀', name: '橫掃', max: 3, per: 0.3, desc: b => `骷髏攻擊波及周圍 ${pct(b.per)}` },
    boneArmor: { icon: '🛡️', name: '骨甲', max: 5, per: 0.3, desc: b => `召喚物血量 +${pct(b.per)}` },
    splitGaze: { icon: '👁️', name: '分裂凝視', max: 3, per: 1, desc: b => `眼魔每次多射 ${b.per} 發` },
    frenzyEye: { icon: '⚡', name: '狂熱之眼', max: 4, per: 0.3, desc: b => `眼魔攻速 +${pct(b.per)}` },
    wraithBlast: { icon: '💣', name: '怨念爆裂', max: 4, per: 0.6, desc: b => `怨靈爆炸傷害 +${pct(b.per)}` },
    rebirth: { icon: '♻️', name: '輪迴', max: 2, per: 0.4, desc: b => `怨靈陣亡時 ${pct(b.per)} 重生` },
    frostAura: { icon: '❄️', name: '寒冥光環', max: 3, per: 5, desc: () => '怨靈光環每秒造成傷害' },
    raiseDead: { icon: '⚰️', name: '亡者復甦', max: 4, per: 0.05, desc: b => `擊殺時 ${pct(b.per)} 復活成骷髏` },
    soulHarvest: { icon: '💠', name: '靈魂收割', max: 4, per: 0.25, desc: b => `靈魂掉落 +${pct(b.per)}` },
    magnet: { icon: '🧲', name: '靈魂牽引', max: 2, per: 0.6, desc: b => `拾取範圍 +${pct(b.per)}` },
    vitality: { icon: '❤️', name: '不死之軀', max: 5, per: 25, desc: b => `法師血量 +${b.per} 並回滿` },
    novaPower: { icon: '💥', name: '新星強化', max: 4, per: 0.5, cdPer: 0.15, desc: b => `新星傷害 +${pct(b.per)}、冷卻 -${pct(b.cdPer)}` },
    pact: { icon: '📜', name: '亡者契約', max: 2, per: 0.25, desc: b => `召喚費用 -${pct(b.per)}` },
    lifesteal: { icon: '🩸', name: '嗜魂', max: 2, per: 0.15, desc: b => `召喚物造成傷害的 ${pct(b.per)} 回血` },
};

function getTier(level) {
    const lv = CONFIG.evolution.levels;
    let t = 0;
    while (t < lv.length && level >= lv[t]) t++;
    return t;
}

function bl(id) { return (gameState.blessings && gameState.blessings[id]) || 0; }
function blessVal(id) { return BLESSINGS[id].per * bl(id); }

function getSummonCost(config) {
    return Math.max(1, Math.round(config.summonCost * (1 - blessVal('pact'))));
}
function getMagnetRadius() {
    return CONFIG.player.magnetRadius * (1 + blessVal('magnet'));
}
function getNovaCooldown() {
    return CONFIG.nova.cooldown * (1 - BLESSINGS.novaPower.cdPer * bl('novaPower'));
}
function getNovaDamage() {
    return Math.round(CONFIG.nova.baseDamage * getWaveStatMultiplier(Math.max(1, gameState.currentWave)) * (1 + blessVal('novaPower')));
}

CONFIG.upgradeCosts = {
    skeletonWarrior: CONFIG.skeletonWarrior.upgradeCostBase,
    eyeMonster: CONFIG.eyeMonster.upgradeCostBase,
    wraith: CONFIG.wraith.upgradeCostBase,
};

CONFIG.upgradeCostIncrements = {
    skeletonWarrior: CONFIG.skeletonWarrior.upgradeCostInc,
    eyeMonster: CONFIG.eyeMonster.upgradeCostInc,
    wraith: CONFIG.wraith.upgradeCostInc,
};

const projectilePool = [];
const visualEffectPool = [];
const MAX_POOL_SIZE = 100;

function getProjectileFromPool() {
    if (projectilePool.length > 0) {
        return projectilePool.pop();
    }
    return new Projectile(0, 0, null, {}, 0);
}

function returnProjectileToPool(projectile) {
    if (projectilePool.length < MAX_POOL_SIZE) {
        projectile.target = null;
        projectilePool.push(projectile);
    }
}

function getVisualEffectFromPool(EffectClass) {
    for (let i = visualEffectPool.length - 1; i >= 0; i--) {
        if (visualEffectPool[i] instanceof EffectClass) {
            return visualEffectPool.splice(i, 1)[0];
        }
    }
    if (EffectClass === SlashEffect) return new SlashEffect({ x: 0, y: 0 }, { x: 0, y: 0 });
    if (EffectClass === ExplosionEffect) return new ExplosionEffect({ x: 0, y: 0 }, 0);
    return null;
}

function returnVisualEffectToPool(effect) {
    // 只有 getVisualEffectFromPool 會重建的類別才回收，其他的放進池子只會佔位
    if (!(effect instanceof SlashEffect) && !(effect instanceof ExplosionEffect)) return;
    if (visualEffectPool.length < MAX_POOL_SIZE) {
        effect.target = null;
        visualEffectPool.push(effect);
    }
}

let gameState = {
    player: null, summons: [], monsters: [],
    projectiles: [],
    visualEffects: [],
    orbs: [], particles: [], floatTexts: [],
    shake: 0, hurtFlash: 0, soulCarry: 0,
    sfxVolume: CONFIG.audio.initialSfxVolume,
    souls: CONFIG.player.initialSouls,
    currentWave: 0,
    timeToNextWave: CONFIG.wave.betweenTime, betweenWaves: true,
    gameOver: false, lastTime: 0, messageTimeout: null,
    isPaused: false,
    skeletonWarriorLevel: 0, eyeMonsterLevel: 0, wraithLevel: 0,
    skeletonWarriorCount: 0, eyeMonsterCount: 0, wraithCount: 0,
    currentCosts: { ...CONFIG.upgradeCosts },
    imagesLoaded: false,
    bgmVolume: CONFIG.audio.initialVolume,
    musicStarted: false,
    totalSummons: emptySummonStats(),
    totalKills: emptyKillStats(),
    spawnQueue: [], spawnTimer: 0, banner: null,
    blessings: {}, pendingDraft: null, draftOpen: false, novaCooldown: 0, extraDrafts: 0,
    waveEvent: null, lastEventWave: 0, streak: 0, streakTimer: 0, bestStreak: 0,
};

function emptySummonStats() { return { SkeletonWarrior: 0, EyeMonster: 0, Wraith: 0 }; }
function emptyKillStats() { return { BasicMelee: 0, FastMelee: 0, Bloater: 0, ArmoredMelee: 0, Boss: 0 }; }

let holdActionState = {
    actionType: null,
    unitType: null,
    timeoutId: null,
    intervalId: null,
    isHolding: false,
    pointerDownTime: 0,
};


let inputState = {
    isPointerDown: false, pointerStartPos: { x: 0, y: 0 },
    pointerCurrentPos: { x: 0, y: 0 }, movementVector: { x: 0, y: 0 },
    pointerId: null,
};
const keysDown = new Set();
const MOVE_KEYS = {
    KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1],
    KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0],
};
const UNIT_HOTKEYS = { Digit1: 'SkeletonWarrior', Digit2: 'Wraith', Digit3: 'EyeMonster' };

function getMoveVector() {
    let x = 0, y = 0;
    keysDown.forEach(code => { const v = MOVE_KEYS[code]; if (v) { x += v[0]; y += v[1]; } });
    if (x !== 0 || y !== 0) return normalizeVector({ x, y });
    return inputState.movementVector;
}

const images = {};
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => {
            reject(err);
        };
        img.src = src;
    });
}

async function loadAllImages() {
    const imageSources = {
        player: 'player.png',
        skeleton_warrior: 'skeleton_warrior.png',
        eye_monster: 'eye_monster.png',
        wraith: 'wraith.png',
        basic_melee: 'basic_melee.png',
        fast_melee: 'fast_melee.png',
        armored_melee: 'armored_melee.png',
        background: 'background.jpg',
    };

    const promises = Object.entries(imageSources).map(([name, src]) =>
        loadImage(src).then(img => { images[name] = img; })
    );

    try {
        await Promise.all(promises);
        gameState.imagesLoaded = true;
    } catch (error) {
        showMessage("部分圖片載入失敗，遊戲可能無法正常顯示！", 5000);
        gameState.imagesLoaded = true;
    }
}


function distanceSq(pos1, pos2) { const dx = pos1.x - pos2.x; const dy = pos1.y - pos2.y; return dx * dx + dy * dy; }
function normalizeVector(vec) { const mag = Math.sqrt(vec.x * vec.x + vec.y * vec.y); if (mag === 0) return { x: 0, y: 0 }; return { x: vec.x / mag, y: vec.y / mag }; }
// 怪物從目前畫面外圍一圈生出來
const SPAWN_MARGIN = 40;
function getRandomPositionOutsideView() {
    const side = Math.floor(Math.random() * 4);
    const left = camera.x - SPAWN_MARGIN, right = camera.x + view.w + SPAWN_MARGIN;
    const top = camera.y - SPAWN_MARGIN, bottom = camera.y + view.h + SPAWN_MARGIN;
    switch (side) {
        case 0: return { x: randomInRange(left, right), y: top };
        case 1: return { x: right, y: randomInRange(top, bottom) };
        case 2: return { x: randomInRange(left, right), y: bottom };
        default: return { x: left, y: randomInRange(top, bottom) };
    }
}
function randomInRange(min, max) { return Math.random() * (max - min) + min; }
function getRandomSpawnPosNearPlayer(radius = 30) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    const c = gameState.player ? gameState.player.pos : { x: 0, y: 0 };
    return { x: c.x + Math.cos(angle) * distance, y: c.y + Math.sin(angle) * distance };
}
function formatNumberK(num) {
    if (num < 1000) {
        return num.toString();
    }
    const kNum = num / 1000;
    let formatted = kNum.toFixed(2);
    if (formatted.endsWith('.00')) {
        formatted = formatted.substring(0, formatted.length - 3);
    } else if (formatted.endsWith('0')) {
        formatted = formatted.substring(0, formatted.length - 1);
    }
    return formatted + 'K';
}

// ---------- 縮好尺寸的貼圖快取（含受擊閃白、精英金光、腐屍綠） ----------
// 原圖約 500px、畫面上只畫 30~60px；每格即時縮小上千張大圖是召喚物多時最吃效能的地方。
// 依顯示尺寸預先縮一份（乘 SPRITE_RES 留給高解析度螢幕），之後每格直接貼。
const SPRITE_RES = 2;
// 震畫面的位移；單位直接 setTransform 時要加上它
const drawOffset = { x: 0, y: 0 };
const spriteCache = new Map();
// flipped = 預先畫好朝左的版本：畫的時候不用每隻切換翻轉矩陣（數千隻時那個狀態切換會讓畫布整個卡住）
function getSprite(img, w, h, tint = null, strength = 0, flipped = false) {
    const cw = Math.max(1, Math.ceil(w * SPRITE_RES)), ch = Math.max(1, Math.ceil(h * SPRITE_RES));
    const key = `${img.src}|${cw}x${ch}|${tint}|${strength}|${flipped}`;
    let c = spriteCache.get(key);
    if (c) return c;
    c = document.createElement('canvas');
    c.width = cw; c.height = ch;
    const g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    if (flipped) { g.translate(cw, 0); g.scale(-1, 1); }
    g.drawImage(img, 0, 0, cw, ch);
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (tint) {
        g.globalCompositeOperation = 'source-atop';
        g.globalAlpha = strength;
        g.fillStyle = tint;
        g.fillRect(0, 0, cw, ch);
    }
    spriteCache.set(key, c);
    return c;
}

// 怨靈光環：幾百隻怨靈每格各自產生大面積漸層很貴，同一個半徑畫一次存起來重複貼
const auraCache = new Map();
function getAuraSprite(color, radius, innerRadius) {
    const r = Math.ceil(radius);
    const key = `${color}|${r}`;
    let c = auraCache.get(key);
    if (c) return c;
    c = document.createElement('canvas');
    c.width = c.height = r * 2;
    const g = c.getContext('2d');
    const gradient = g.createRadialGradient(r, r, innerRadius, r, r, r);
    gradient.addColorStop(0, color + '00');
    gradient.addColorStop(0.7, color + '70');
    gradient.addColorStop(1, color + '0F');
    g.fillStyle = gradient;
    g.beginPath();
    g.arc(r, r, r, 0, Math.PI * 2);
    g.fill();
    auraCache.set(key, c);
    return c;
}

// 幾百隻怨靈的光環疊在一起，全解析度混色的像素量會讓畫布卡死；
// 光環本來就是模糊漸層，先畫在 1/AURA_LAYER_DIVISOR 解析度的圖層，再一次放大貼上
const AURA_LAYER_DIVISOR = 4;
let auraLayer = null;
// 圖層蓋住目前畫面範圍（世界座標），在世界座標下貼回去
function drawAuraLayer() {
    const wraiths = gameState.summons.filter(s => s.isAlive && s.config.type === 'Wraith');
    if (wraiths.length === 0) return;
    if (!auraLayer) {
        auraLayer = document.createElement('canvas');
        auraLayer.width = Math.ceil(view.w / AURA_LAYER_DIVISOR);
        auraLayer.height = Math.ceil(view.h / AURA_LAYER_DIVISOR);
    }
    const g = auraLayer.getContext('2d');
    g.clearRect(0, 0, auraLayer.width, auraLayer.height);
    const scale = 1 / AURA_LAYER_DIVISOR;
    for (let i = 0; i < wraiths.length; i++) wraiths[i].drawAura(g, scale, camera.x, camera.y);
    ctx.drawImage(auraLayer, camera.x, camera.y, auraLayer.width * AURA_LAYER_DIVISOR, auraLayer.height * AURA_LAYER_DIVISOR);
}

// ---------- 空間格子：「找附近的怪 / 召喚物」只查附近格子，不用每隻跟全部比 ----------
// 召喚物上千隻時，每隻跟每隻比對是平方成長；每格開始時把單位分進格子，查詢只看半徑涵蓋的格子。
// 地圖無限延伸，所以格子用雜湊表存（只存有東西的格子）。
const GRID_KEY_OFFSET = 32768;
const GRID_KEY_STRIDE = 65536;
// 找最近目標時最多往外找幾圈；超過就當作附近沒有
const MAX_NEAREST_RINGS = 40;
class SpatialGrid {
    constructor(cell) { this.cell = cell; this.map = new Map(); this.pool = []; }
    key(cx, cy) { return (cx + GRID_KEY_OFFSET) * GRID_KEY_STRIDE + (cy + GRID_KEY_OFFSET); }
    cellAt(cx, cy) { return this.map.get(this.key(cx, cy)); }
    rebuild(items) {
        for (const arr of this.map.values()) { arr.length = 0; this.pool.push(arr); }
        this.map.clear();
        for (let i = 0; i < items.length; i++) {
            const it = items[i];
            if (!it.isAlive) continue;
            const k = this.key(this.cx(it.pos.x), this.cy(it.pos.y));
            let arr = this.map.get(k);
            if (!arr) { arr = this.pool.pop() || []; this.map.set(k, arr); }
            arr.push(it);
        }
    }
    cx(x) { return Math.floor(x / this.cell); }
    cy(y) { return Math.floor(y / this.cell); }
    // fn 回傳 true 就提早結束；回傳值表示有沒有提早結束
    forEachInRadius(pos, r, fn) {
        const x0 = this.cx(pos.x - r), x1 = this.cx(pos.x + r);
        const y0 = this.cy(pos.y - r), y1 = this.cy(pos.y + r);
        for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
                const cell = this.cellAt(x, y);
                if (!cell) continue;
                for (let i = 0; i < cell.length; i++) if (fn(cell[i])) return true;
            }
        }
        return false;
    }
    // 先看自己那一格、再看周圍 8 格；fn 回傳 true 就停。給「擠成一團時只參考最近幾個」用
    forEachNearCenterFirst(pos, fn) {
        const cx = this.cx(pos.x), cy = this.cy(pos.y);
        const scan = (x, y) => {
            const cell = this.cellAt(x, y);
            if (!cell) return false;
            for (let i = 0; i < cell.length; i++) if (fn(cell[i])) return true;
            return false;
        };
        if (scan(cx, cy)) return;
        for (let i = 0; i < NEIGHBOR_OFFSETS.length; i++) {
            if (scan(cx + NEIGHBOR_OFFSETS[i][0], cy + NEIGHBOR_OFFSETS[i][1])) return;
        }
    }
    anyWithin(pos, r) {
        const rSq = r * r;
        return this.forEachInRadius(pos, r, it => it.isAlive && distanceSq(pos, it.pos) <= rSq);
    }
    // 由內往外一圈一圈找；某一圈的格子離 pos 至少 (k-1) 格，已經找到更近的就停
    nearest(pos, maxR = Infinity) {
        const cx = this.cx(pos.x), cy = this.cy(pos.y);
        let best = null, bestSq = maxR === Infinity ? Infinity : maxR * maxR;
        const maxRing = maxR === Infinity ? MAX_NEAREST_RINGS : Math.ceil(maxR / this.cell) + 1;
        const visit = (x, y) => {
            const cell = this.cellAt(x, y);
            if (!cell) return;
            for (let i = 0; i < cell.length; i++) {
                const it = cell[i];
                if (!it.isAlive) continue;
                const d = distanceSq(pos, it.pos);
                if (d < bestSq) { bestSq = d; best = it; }
            }
        };
        for (let k = 0; k <= maxRing; k++) {
            const minDist = (k - 1) * this.cell;
            if (minDist > 0 && minDist * minDist > bestSq) break;
            if (k === 0) { visit(cx, cy); continue; }
            for (let x = cx - k; x <= cx + k; x++) { visit(x, cy - k); visit(x, cy + k); }
            for (let y = cy - k + 1; y <= cy + k - 1; y++) { visit(cx - k, y); visit(cx + k, y); }
        }
        return best;
    }
}
const NEIGHBOR_OFFSETS = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]];
// 召喚物格子邊長要 ≥ 最大推開半徑（怨靈互推 25 × 1.5 = 37.5）
const GRID_CELL = 40;
// 擠成一團時推開力道早就頂到上限，參考最近這麼多個鄰居就夠；上千隻擠在一起時差別是平方 vs 線性
const MAX_AVOID_NEIGHBORS = 12;
const WRAITH_GRID_CELL = 75;
const summonGrid = new SpatialGrid(GRID_CELL);
const monsterGrid = new SpatialGrid(GRID_CELL);
const wraithGrid = new SpatialGrid(WRAITH_GRID_CELL);

// 上千隻召喚物擠在法師身邊時，就算只查附近格子，每隻附近還是有上百隻；
// 推開方向每隻每 AVOID_RECALC_FRAMES 格才重算一次（各自錯開），其餘沿用，肉眼看不出差別
const AVOID_RECALC_FRAMES = 3;
let frameNo = 0;
let avoidSlotCounter = 0;
const MONSTER_RETARGET_FRAMES = 3;
const TARGET_SEARCH_FRAMES = 3;

// 眼魔分散火力用：每格開始時統計「每隻怪被幾隻眼魔瞄準」，選目標時查表，不用每隻眼魔掃全部召喚物
let eyeTargetCounts = new Map();
function rebuildEyeTargetCounts(summons) {
    eyeTargetCounts = new Map();
    for (let i = 0; i < summons.length; i++) {
        const s = summons[i];
        if (s.isAlive && s.config.type === 'EyeMonster' && s.target && s.target.isAlive) {
            eyeTargetCounts.set(s.target, (eyeTargetCounts.get(s.target) || 0) + 1);
        }
    }
}

// ---------- 合成音效（不用音檔） ----------
const Sfx = {
    ctx: null, master: null, noiseBuf: null, last: {},
    unlock() {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        if (!this.ctx) {
            this.ctx = new AC();
            this.master = this.ctx.createGain();
            this.master.connect(this.ctx.destination);
            const len = this.ctx.sampleRate;
            this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
            const d = this.noiseBuf.getChannelData(0);
            for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
            this.setVolume(gameState.sfxVolume);
        }
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => { });
    },
    setVolume(v) { if (this.master) this.master.gain.value = v; },
    tone(freq, dur, opt = {}) {
        const { type = 'sine', vol = 0.2, slideTo = null, delay = 0 } = opt;
        const t0 = this.ctx.currentTime + delay;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, t0);
        if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
        g.gain.setValueAtTime(vol, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        o.connect(g); g.connect(this.master);
        o.start(t0); o.stop(t0 + dur + 0.02);
    },
    noise(dur, opt = {}) {
        const { vol = 0.2, filterFreq = 1200, delay = 0 } = opt;
        const t0 = this.ctx.currentTime + delay;
        const s = this.ctx.createBufferSource();
        s.buffer = this.noiseBuf;
        const f = this.ctx.createBiquadFilter();
        f.type = 'lowpass'; f.frequency.value = filterFreq;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(vol, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        s.connect(f); f.connect(g); g.connect(this.master);
        s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.02);
    },
    play(name) {
        if (!this.ctx || this.ctx.state !== 'running' || gameState.sfxVolume <= 0) return;
        const def = SFX_DEFS[name];
        if (!def) return;
        const now = this.ctx.currentTime;
        if (this.last[name] && now - this.last[name] < def.gap) return;
        this.last[name] = now;
        def.fn(this);
    },
};
// gap = 同一種音效最短間隔（秒），一群怪同時被打時不會炸成一團噪音
const SFX_DEFS = {
    hit: { gap: 0.05, fn: s => s.noise(0.04, { vol: 0.07, filterFreq: 2500 }) },
    kill: { gap: 0.04, fn: s => s.tone(520, 0.09, { type: 'triangle', vol: 0.1, slideTo: 240 }) },
    summon: { gap: 0.06, fn: s => s.tone(220, 0.16, { vol: 0.16, slideTo: 440 }) },
    upgrade: { gap: 0.1, fn: s => { [523, 659, 784].forEach((f, i) => s.tone(f, 0.09, { type: 'triangle', vol: 0.12, delay: i * 0.06 })); } },
    orb: { gap: 0.03, fn: s => s.tone(880, 0.06, { vol: 0.06, slideTo: 1320 }) },
    explode: { gap: 0.08, fn: s => { s.noise(0.35, { vol: 0.3, filterFreq: 600 }); s.tone(90, 0.3, { vol: 0.25, slideTo: 40 }); } },
    hurt: { gap: 0.15, fn: s => s.tone(160, 0.15, { type: 'square', vol: 0.08, slideTo: 90 }) },
    bloat: { gap: 0.08, fn: s => { s.noise(0.25, { vol: 0.25, filterFreq: 800 }); s.tone(140, 0.2, { vol: 0.2, slideTo: 50 }); } },
    slam: { gap: 0.3, fn: s => { s.noise(0.5, { vol: 0.45, filterFreq: 300 }); s.tone(60, 0.5, { vol: 0.4, slideTo: 30 }); } },
    boss: { gap: 1, fn: s => { s.tone(110, 0.5, { type: 'sawtooth', vol: 0.15 }); s.tone(82, 0.7, { type: 'sawtooth', vol: 0.15, delay: 0.3 }); } },
    bossDie: { gap: 1, fn: s => { s.noise(0.9, { vol: 0.4, filterFreq: 500 }); [392, 523, 659, 784].forEach((f, i) => s.tone(f, 0.18, { type: 'triangle', vol: 0.15, delay: 0.2 + i * 0.1 })); } },
    elite: { gap: 0.2, fn: s => { s.tone(990, 0.1, { type: 'triangle', vol: 0.12 }); s.tone(1320, 0.15, { type: 'triangle', vol: 0.12, delay: 0.08 }); } },
    wave: { gap: 0.5, fn: s => { s.tone(330, 0.12, { type: 'triangle', vol: 0.14 }); s.tone(440, 0.22, { type: 'triangle', vol: 0.14, delay: 0.12 }); } },
    gameover: { gap: 1, fn: s => s.tone(392, 0.9, { type: 'triangle', vol: 0.2, slideTo: 130 }) },
    nova: { gap: 0.2, fn: s => { s.tone(220, 0.45, { type: 'sawtooth', vol: 0.15, slideTo: 55 }); s.noise(0.4, { vol: 0.25, filterFreq: 900 }); } },
    draft: { gap: 0.3, fn: s => { [660, 880, 1100].forEach((f, i) => s.tone(f, 0.25, { vol: 0.12, delay: i * 0.08 })); } },
    pick: { gap: 0.2, fn: s => { [523, 784, 1046].forEach((f, i) => s.tone(f, 0.15, { type: 'triangle', vol: 0.14, delay: i * 0.05 })); } },
    streak: { gap: 0.3, fn: s => { [659, 880, 1175].forEach((f, i) => s.tone(f, 0.12, { type: 'square', vol: 0.07, delay: i * 0.05 })); } },
    spawn: { gap: 0.3, fn: s => s.noise(0.3, { vol: 0.15, filterFreq: 500 }) },
    dash: { gap: 0.3, fn: s => { s.noise(0.25, { vol: 0.25, filterFreq: 3000 }); s.tone(600, 0.25, { type: 'sawtooth', vol: 0.1, slideTo: 150 }); } },
    evolve: { gap: 0.5, fn: s => { s.noise(0.5, { vol: 0.2, filterFreq: 2000 }); [392, 523, 659, 784, 1046].forEach((f, i) => s.tone(f, 0.22, { type: 'triangle', vol: 0.15, delay: i * 0.07 })); } },
    pulse: { gap: 0.15, fn: s => s.tone(300, 0.2, { vol: 0.08, slideTo: 120 }) },
    raise: { gap: 0.15, fn: s => s.tone(180, 0.25, { type: 'triangle', vol: 0.14, slideTo: 360 }) },
};

// ---------- 粒子 / 飄字 / 震動 ----------
function spawnParticles(x, y, color, count, speed = 80, life = 0.5, size = 2.5) {
    const ps = gameState.particles;
    for (let i = 0; i < count && ps.length < CONFIG.visuals.maxParticles; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = speed * (0.3 + Math.random() * 0.7);
        ps.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, maxLife: life, color, size: size * (0.6 + Math.random() * 0.6) });
    }
}
function spawnFloatText(x, y, text, color = '#FFFFFF', size = 14, life = 0.9) {
    gameState.floatTexts.push({ x, y, text, color, size, life, maxLife: life });
}
function addShake(amount) {
    gameState.shake = Math.min(14, Math.max(gameState.shake, amount));
}


class GameObject {
    constructor(x, y, radius, color, imageName = null, imgScaleMultiplier = 2.5) {
        this.pos = { x, y };
        this.radius = radius;
        this.color = color;
        this.isAlive = true;
        this.id = `go_${Date.now()}_${Math.random()}`;
        this.facingDirection = 1;
        this.image = imageName && images[imageName] ? images[imageName] : null;
        this.imgScaleMultiplier = imgScaleMultiplier;
        this.imageWidth = this.image ? this.radius * this.imgScaleMultiplier : this.radius * 2;
        this.imageHeight = this.image ? this.radius * this.imgScaleMultiplier : this.radius * 2;
        if (this.image && this.image.naturalWidth > 0) {
            this.imageHeight = this.imageWidth * (this.image.naturalHeight / this.image.naturalWidth);
        }
    }

    draw(ctx) {
        if (!this.isAlive) return;

        if (this.image) {
            const s = this.drawScale || 1;
            const w = this.imageWidth * s, h = this.imageHeight * s;
            // 上千隻時每隻 save/restore、切換矩陣、查貼圖表都很貴：左右兩張貼圖預先備好、存在自己身上，直接貼
            const flipped = this.facingDirection < 0;
            const x = this.pos.x - w / 2, y = this.pos.y - h / 2;
            ctx.drawImage(this.getCachedSprite(flipped), x, y, w, h);
            if (this.hitFlash > 0) {
                ctx.globalAlpha = Math.min(1, this.hitFlash / CONFIG.visuals.hitFlashDuration) * 0.85;
                ctx.drawImage(getSprite(this.image, this.imageWidth, this.imageHeight, '#FFFFFF', 1, flipped), x, y, w, h);
                ctx.globalAlpha = 1;
            }
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        this.drawHealthBar(ctx);
    }

    drawHealthBar(ctx) {
        if (this.isAlive && typeof this.currentHealth === 'number' && typeof this.maxHealth === 'number' && this.currentHealth < this.maxHealth) {
            const barWidth = this.radius * 1.6;
            const barHeight = 4;
            const barYOffset = this.imageHeight ? this.imageHeight * 0.5 + 5 : this.radius + 5;
            const barX = this.pos.x - barWidth / 2;
            const barY = this.pos.y - barYOffset;
            const healthPercent = this.currentHealth / this.maxHealth;

            ctx.fillStyle = '#555';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : (healthPercent > 0.2 ? '#FFC107' : '#F44336');
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
    }


    update(deltaTime) { }

    getCachedSprite(flipped) {
        const key = `${this.tint}|${this.tintStrength}`;
        if (this._spriteKey !== key) {
            this._sprites = [
                getSprite(this.image, this.imageWidth, this.imageHeight, this.tint, this.tintStrength || 0.45, false),
                getSprite(this.image, this.imageWidth, this.imageHeight, this.tint, this.tintStrength || 0.45, true),
            ];
            this._spriteKey = key;
        }
        return this._sprites[flipped ? 1 : 0];
    }

    tickFlash(deltaTime) {
        if (this.hitFlash > 0) this.hitFlash -= deltaTime;
    }

    updateFacingDirection(moveX) {
        if (moveX > 0.1) {
            this.facingDirection = 1;
        } else if (moveX < -0.1) {
            this.facingDirection = -1;
        }
    }
}

class Player extends GameObject {
    constructor(x, y) {
        const config = CONFIG.player;
        super(x, y, config.radius, config.color, config.imageName, config.imgScaleMultiplier);
        this.maxHealth = config.baseHealth;
        this.currentHealth = this.maxHealth;
        this.moveSpeed = config.baseMoveSpeed;
    }
    update(deltaTime, moveVec) {
        if (!this.isAlive) return;
        this.tickFlash(deltaTime);
        const moveX = moveVec.x * this.moveSpeed * deltaTime;
        const moveY = moveVec.y * this.moveSpeed * deltaTime;
        this.pos.x += moveX;
        this.pos.y += moveY;

        this.updateFacingDirection(moveVec.x);
    }
    takeDamage(amount) {
        if (!this.isAlive) return;
        this.currentHealth -= amount;
        this.currentHealth = Math.max(0, Math.round(this.currentHealth));
        this.hitFlash = CONFIG.visuals.hitFlashDuration;
        gameState.hurtFlash = CONFIG.visuals.hurtFlashDuration;
        addShake(4);
        Sfx.play('hurt');
        if (this.currentHealth <= 0) {
            this.die();
        }
        updateUI();
    }
    die() {
        this.isAlive = false;
        gameState.gameOver = true;
        Sfx.play('gameover');
        showGameOver();
    }
    getSummonPosition() {
        const direction = normalizeVector(getMoveVector());
        const spawnDist = (this.imageWidth ? this.imageWidth / 2 : this.radius) + 15;
        let spawnX = this.pos.x + spawnDist;
        let spawnY = this.pos.y;
        if (direction.x !== 0 || direction.y !== 0) {
            spawnX = this.pos.x - direction.x * spawnDist;
            spawnY = this.pos.y - direction.y * spawnDist;
        } else {
            spawnX = this.pos.x - this.facingDirection * spawnDist;
            spawnY = this.pos.y;
        }

        return { x: spawnX, y: spawnY };
    }
}

class SummonUnit extends GameObject {
    constructor(x, y, config, level, playerTransform) {
        super(x, y, config.radius, config.color, config.imageName, config.imgScaleMultiplier);
        this.config = config;
        this.playerTransform = playerTransform;
        this.level = level;
        this.attackCooldown = 0;
        this.target = null;
        this.isReturning = false;
        this.applyLevelStats();
        this.currentHealth = this.maxHealth;
        this.wanderTimer = randomInRange(config.wanderIntervalMin * 0.5, config.wanderIntervalMax * 0.5);
        this.wanderTargetPos = { ...this.pos };
        this.isWandering = false;
        this.buffedMoveSpeedMultiplier = 1.0;
        this.buffedAttackSpeedMultiplier = 1.0;

        if (this.config.type === 'Wraith') {
            this.isRetreatingToPlayer = false;
        }
        if (this.config.type === 'EyeMonster') {
            this.isRetreatingFromMonster = false;
        }
    }

    // 拿到祝福時重算數值，血量照比例保留
    refreshStats() {
        const ratio = this.maxHealth > 0 ? this.currentHealth / this.maxHealth : 1;
        this.computeStats();
        this.currentHealth = Math.max(1, Math.round(this.maxHealth * ratio));
    }

    applyLevelStats() {
        this.computeStats();
        this.applyLevelHealthGain();
    }

    computeStats() {
        const type = this.config.type;
        const multiplier = 1 + (this.level * this.config.upgradeBonus);
        this.maxHealth = Math.round(this.config.baseHealth * multiplier * (1 + blessVal('boneArmor')));
        let attack = (this.config.baseAttack > 0) ? (this.config.baseAttack * multiplier) : 0;
        if (type === 'SkeletonWarrior') attack *= 1 + blessVal('boneBlade');
        this.attack = attack;
        this.attackSpeed = this.config.attackSpeed * (type === 'EyeMonster' ? 1 + blessVal('frenzyEye') : 1);
        this.moveSpeed = this.config.moveSpeed;

        if (this.config.type === 'EyeMonster') {
            this.attackRange = this.config.attackRange + (this.level * this.config.attackRangeUpgrade);
        } else {
            this.attackRange = this.config.attackRange;
        }
        this.attackRangeSq = this.attackRange * this.attackRange;

        if (this.config.type === 'Wraith') {
            this.slowRadius = Math.min(this.config.slowRadiusMax, this.config.slowRadiusBase + (this.level * this.config.slowRadiusUpgrade));
            this.slowAmount = this.config.slowAmountBase + (this.level * this.config.slowAmountUpgrade);
            this.slowAmount = Math.min(this.slowAmount, this.config.slowAmountMax);
            this.slowRadiusSq = this.slowRadius * this.slowRadius;
            this.buffRadius = this.slowRadius;
            this.buffRadiusSq = this.slowRadiusSq;
        } else {
            this.slowRadius = 0;
            this.slowAmount = 0;
            this.buffRadius = 0;
            this.buffRadiusSq = 0;
        }

        const E = CONFIG.evolution;
        this.tier = getTier(this.level);
        this.tint = this.tier > 0 ? E.tints[this.tier - 1] : null;
        this.tintStrength = this.tier > 0 ? E.tintStrength[this.tier - 1] : 0;
        this.drawScale = 1 + E.sizeBonusPerTier * this.tier;

        this.maxHealth = Math.round(this.maxHealth);
    }

    applyLevelHealthGain() {
        if (this.currentHealth > 0 && this.level > 0 && this.config.upgradeBonus > 0) {
            const healthGainPerLevel = Math.round(this.config.baseHealth * this.config.upgradeBonus);
            if (healthGainPerLevel > 0) {
                this.currentHealth += healthGainPerLevel;
            }
        }
        this.currentHealth = Math.round(Math.min(this.currentHealth, this.maxHealth));
    }

    healFromDamage(dealt) {
        const ls = blessVal('lifesteal');
        if (ls > 0 && this.isAlive) this.currentHealth = Math.min(this.maxHealth, this.currentHealth + dealt * ls);
    }

    update(deltaTime, monsters, otherSummons, player) {
        if (!this.isAlive) return;
        this.tickFlash(deltaTime);

        this.applyWraithBuff();

        if (this.attackCooldown > 0) { this.attackCooldown -= deltaTime; }

        if (this.config.type === 'EyeMonster') {
            this.isRetreatingFromMonster = monsterGrid.anyWithin(this.pos, this.config.retreatCheckDistance);
        } else {
            this.isRetreatingFromMonster = false;
        }

        if (this.config.type === 'Wraith') {
            let monsterInRangeForAura = monsterGrid.anyWithin(this.pos, this.slowRadius);
            this.isRetreatingToPlayer = monsterInRangeForAura;
            if (this.isRetreatingToPlayer) {
                this.target = null;
                this.isReturning = false;
            }
        }

        if (this.target && (!this.target.isAlive || distanceSq(this.pos, this.target.pos) > this.config.targetSearchRadius * this.config.targetSearchRadius * 1.5)) {
            this.target = null;
        }

        // 附近沒怪時不用每格重找（閒著的大軍每格掃一次很貴），每 TARGET_SEARCH_FRAMES 格找一次
        if (this.searchSlot === undefined) this.searchSlot = (avoidSlotCounter++) % TARGET_SEARCH_FRAMES;
        const searchThisFrame = (frameNo + this.searchSlot) % TARGET_SEARCH_FRAMES === 0;
        if (!this.target && searchThisFrame && !this.isRetreatingFromMonster && !this.isRetreatingToPlayer) {
            if (this.config.type === 'EyeMonster') {
                this.target = this.findBestTarget(monsters, otherSummons);
                if (this.target) eyeTargetCounts.set(this.target, (eyeTargetCounts.get(this.target) || 0) + 1);
            } else if (this.config.type !== 'Wraith') {
                this.target = this.findNearestMonster();
            }
            if (this.target) {
                this.isReturning = false;
                this.isWandering = false;
            }
        }

        if (!this.target && !this.isRetreatingFromMonster && !this.isRetreatingToPlayer) {
            const distToPlayerSq = distanceSq(this.pos, this.playerTransform.pos);
            const returnDistSq = this.config.returnDistance * this.config.returnDistance;
            if (distToPlayerSq > returnDistSq * 1.5) {
                this.isReturning = true;
                this.isWandering = false;
            }
            else if (this.isReturning && distToPlayerSq < returnDistSq * 0.8) {
                this.isReturning = false;
            }
        } else if (this.target || this.isRetreatingFromMonster || this.isRetreatingToPlayer) {
            this.isReturning = false;
        }

        let moveDirection = { x: 0, y: 0 };
        let currentMoveSpeed = this.moveSpeed * this.buffedMoveSpeedMultiplier;
        let isIdle = true;
        let moveX = 0;
        let moveY = 0;


        if (this.isRetreatingFromMonster && this.config.type === 'EyeMonster') {
            isIdle = false;
            const directionToPlayer = normalizeVector({ x: this.playerTransform.pos.x - this.pos.x, y: this.playerTransform.pos.y - this.pos.y });
            moveDirection = directionToPlayer;
            currentMoveSpeed *= this.config.retreatSpeedFactor;
            this.target = null;
        } else if (this.isRetreatingToPlayer && this.config.type === 'Wraith') {
            isIdle = false;
            const directionToPlayer = normalizeVector({ x: this.playerTransform.pos.x - this.pos.x, y: this.playerTransform.pos.y - this.pos.y });
            moveDirection = directionToPlayer;
            currentMoveSpeed *= this.config.retreatSpeedFactor;
        }
        else if (this.target) {
            isIdle = false;
            const targetDistSq = distanceSq(this.pos, this.target.pos);
            const engageRangeSq = this.attackRangeSq;
            if (targetDistSq > engageRangeSq * 0.95) {
                moveDirection = normalizeVector({ x: this.target.pos.x - this.pos.x, y: this.target.pos.y - this.pos.y });
            } else {
                moveDirection = { x: 0, y: 0 };
            }
        }
        else if (this.isReturning) {
            isIdle = false;
            const playerPos = this.playerTransform.pos;
            const distToPlayerSq = distanceSq(this.pos, playerPos);
            const returnThresholdSq = this.config.returnDistance * this.config.returnDistance;
            if (distToPlayerSq > returnThresholdSq * 0.5) {
                moveDirection = normalizeVector({ x: playerPos.x - this.pos.x, y: playerPos.y - this.pos.y });
            } else {
                this.isReturning = false;
                moveDirection = { x: 0, y: 0 };
            }
        }

        const avoidanceVector = this.cachedAvoidance(player);

        let finalMove = { x: moveDirection.x * currentMoveSpeed, y: moveDirection.y * currentMoveSpeed };

        const isActivelyMoving = this.target || this.isRetreatingFromMonster || this.isRetreatingToPlayer;
        if (!isActivelyMoving && (this.isReturning || this.isWandering)) {
            finalMove.x = finalMove.x * 0.5 + avoidanceVector.x;
            finalMove.y = finalMove.y * 0.5 + avoidanceVector.y;
        } else {
            finalMove.x += avoidanceVector.x;
            finalMove.y += avoidanceVector.y;
        }


        moveX = finalMove.x * deltaTime;
        moveY = finalMove.y * deltaTime;

        if (Math.abs(moveX) > 0.01 || Math.abs(moveY) > 0.01) {
            this.pos.x += moveX;
            this.pos.y += moveY;
            isIdle = false;
            this.updateFacingDirection(moveX);
        }


        if (isIdle && !this.isReturning) {
            this.wanderTimer -= deltaTime;
            if (this.wanderTimer <= 0) {
                this.isWandering = true;
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * this.config.wanderRadius;
                this.wanderTargetPos.x = this.pos.x + Math.cos(angle) * distance;
                this.wanderTargetPos.y = this.pos.y + Math.sin(angle) * distance;
                this.wanderTimer = randomInRange(this.config.wanderIntervalMin, this.config.wanderIntervalMax);
            }
            if (this.isWandering) {
                const distToWanderTargetSq = distanceSq(this.pos, this.wanderTargetPos);
                if (distToWanderTargetSq > 5 * 5) {
                    const wanderDir = normalizeVector({ x: this.wanderTargetPos.x - this.pos.x, y: this.wanderTargetPos.y - this.pos.y });
                    const wanderSpeed = this.moveSpeed * this.config.wanderSpeedFactor * this.buffedMoveSpeedMultiplier;
                    const wanderAvoidance = this.cachedAvoidance(player);
                    const wanderMoveX = (wanderDir.x * wanderSpeed + wanderAvoidance.x * 0.5) * deltaTime;
                    const wanderMoveY = (wanderDir.y * wanderSpeed + wanderAvoidance.y * 0.5) * deltaTime;
                    this.pos.x += wanderMoveX;
                    this.pos.y += wanderMoveY;
                    this.updateFacingDirection(wanderMoveX);
                } else {
                    this.isWandering = false;
                }
            }
        } else {
            this.isWandering = false;
        }

        if (this.attackCooldown <= 0 && !this.isRetreatingFromMonster) {
            if (this.config.type === 'Wraith') {
                if (monsterGrid.anyWithin(this.pos, this.slowRadius)) {
                    this.applySlowAura();
                    this.attackCooldown = 1.0 / this.attackSpeed;
                }
            }
            else if (this.target) {
                const targetDistSq = distanceSq(this.pos, this.target.pos);
                if (targetDistSq <= this.attackRangeSq) {
                    if (this.target.pos.x > this.pos.x + 1) this.facingDirection = 1;
                    else if (this.target.pos.x < this.pos.x - 1) this.facingDirection = -1;
                    this.attackTarget();
                }
            }
        }
    }

    cachedAvoidance(player) {
        if (this.avoidSlot === undefined) this.avoidSlot = (avoidSlotCounter++) % AVOID_RECALC_FRAMES;
        if (!this.avoidCache || (frameNo + this.avoidSlot) % AVOID_RECALC_FRAMES === 0) {
            this.avoidCache = this.avoidOverlap(player);
        }
        return this.avoidCache;
    }

    avoidOverlap(player) {
        let totalPushX = 0;
        let totalPushY = 0;
        const myAvoidanceRadius = this.config.avoidanceRadius;
        const myAvoidanceForce = this.config.avoidanceForce;

        let neighbors = 0;
        summonGrid.forEachNearCenterFirst(this.pos, other => {
            if (other !== this && other.isAlive) {
                let currentAvoidanceRadius = Math.max(myAvoidanceRadius, other.config.avoidanceRadius);

                const isThisWraith = this.config.type === 'Wraith';
                const isOtherWraith = other.config.type === 'Wraith';
                if (isThisWraith && isOtherWraith && this.config.wraithAvoidanceMultiplier) {
                    currentAvoidanceRadius *= this.config.wraithAvoidanceMultiplier;
                }

                const combinedAvoidanceRadius = currentAvoidanceRadius;
                const combinedAvoidanceRadiusSq = combinedAvoidanceRadius * combinedAvoidanceRadius;

                const dSq = distanceSq(this.pos, other.pos);
                if (dSq < combinedAvoidanceRadiusSq && dSq > 0.01) {
                    const distance = Math.sqrt(dSq);
                    const pushDirectionX = (this.pos.x - other.pos.x) / distance;
                    const pushDirectionY = (this.pos.y - other.pos.y) / distance;
                    const pushStrength = (1.0 - (distance / combinedAvoidanceRadius)) * (1.0 - (distance / combinedAvoidanceRadius));
                    totalPushX += pushDirectionX * pushStrength * myAvoidanceForce;
                    totalPushY += pushDirectionY * pushStrength * myAvoidanceForce;
                    if (++neighbors >= MAX_AVOID_NEIGHBORS) return true;
                }
            }
            return false;
        });

        if (player && player.isAlive && this.config.playerAvoidanceForce) {
            const combinedAvoidanceRadius = myAvoidanceRadius + CONFIG.player.avoidanceRadius;
            const playerAvoidanceRadiusSq = combinedAvoidanceRadius * combinedAvoidanceRadius;
            const dSqPlayer = distanceSq(this.pos, player.pos);

            if (dSqPlayer < playerAvoidanceRadiusSq && dSqPlayer > 0.01) {
                const distancePlayer = Math.sqrt(dSqPlayer);
                const pushDirectionXPlayer = (this.pos.x - player.pos.x) / distancePlayer;
                const pushDirectionYPlayer = (this.pos.y - player.pos.y) / distancePlayer;
                const pushStrengthPlayer = (1.0 - (distancePlayer / combinedAvoidanceRadius)) * (1.0 - (distancePlayer / combinedAvoidanceRadius));
                totalPushX += pushDirectionXPlayer * pushStrengthPlayer * this.config.playerAvoidanceForce;
                totalPushY += pushDirectionYPlayer * pushStrengthPlayer * this.config.playerAvoidanceForce;
            }
        }

        const maxAvoidanceSpeed = 180;
        const avoidanceMagSq = totalPushX * totalPushX + totalPushY * totalPushY;
        if (avoidanceMagSq > maxAvoidanceSpeed * maxAvoidanceSpeed) {
            const scale = maxAvoidanceSpeed / Math.sqrt(avoidanceMagSq);
            totalPushX *= scale;
            totalPushY *= scale;
        }

        return { x: totalPushX, y: totalPushY };
    }


    findNearestMonster() {
        return monsterGrid.nearest(this.pos, this.config.targetSearchRadius);
    }

    // 怨靈附近的骷髏移速加倍、眼魔攻速加倍
    applyWraithBuff() {
        this.buffedMoveSpeedMultiplier = 1.0;
        this.buffedAttackSpeedMultiplier = 1.0;
        const type = this.config.type;
        if (type === 'Wraith') return;
        const buffed = wraithGrid.forEachInRadius(this.pos, gameState.wraithBuffRadius, w =>
            w.isAlive && distanceSq(this.pos, w.pos) <= w.buffRadiusSq);
        if (!buffed) return;
        if (type === 'SkeletonWarrior') this.buffedMoveSpeedMultiplier = this.config.wraithBuffMoveSpeedMultiplier;
        else if (type === 'EyeMonster') this.buffedAttackSpeedMultiplier = this.config.wraithBuffAttackSpeedMultiplier;
    }

    findBestTarget(monsters, otherSummons) {
        let potentialTargets = [];
        monsterGrid.forEachInRadius(this.pos, this.attackRange, m => {
            if (m.isAlive && distanceSq(this.pos, m.pos) <= this.attackRangeSq) potentialTargets.push(m);
        });


        if (potentialTargets.length === 0) {
            return this.findNearestMonster();
        }

        let targetCounts = {};
        potentialTargets.forEach(pt => targetCounts[pt.id] = eyeTargetCounts.get(pt) || 0);

        let minCount = Infinity;
        potentialTargets.forEach(pt => {
            minCount = Math.min(minCount, targetCounts[pt.id]);
        });

        let bestCandidates = potentialTargets.filter(pt => targetCounts[pt.id] === minCount);

        if (bestCandidates.length === 1) {
            return bestCandidates[0];
        }

        if (bestCandidates.length > 1) {
            let closestTarget = null;
            let minDistSq = Infinity;
            bestCandidates.forEach(candidate => {
                const dSq = distanceSq(this.pos, candidate.pos);
                if (dSq < minDistSq) {
                    minDistSq = dSq;
                    closestTarget = candidate;
                }
            });
            return closestTarget;
        }

        return potentialTargets[0] || null;
    }

    attackTarget() {
        if (!this.target || !this.target.isAlive) return;

        const currentAttackDamage = Math.round(this.attack);

        const E = CONFIG.evolution;
        if (this.config.type === 'EyeMonster') {
            const targets = [this.target];
            const extra = blessVal('splitGaze') + (this.tier >= 2 ? E.eyeExtraShots : 0);
            if (extra > 0) {
                const others = [];
                monsterGrid.forEachInRadius(this.pos, this.attackRange, m => {
                    if (m.isAlive && m !== this.target && distanceSq(this.pos, m.pos) <= this.attackRangeSq) others.push(m);
                });
                others.sort((a, b) => distanceSq(this.pos, a.pos) - distanceSq(this.pos, b.pos));
                for (let i = 0; i < extra; i++) targets.push(others[i] || this.target);
            }
            const bounces = this.tier >= 1 ? E.eyeBounces : 0;
            const blast = this.tier >= 3;
            targets.forEach(t => {
                const projectile = getProjectileFromPool();
                projectile.init(this.pos.x, this.pos.y, t, this.config, currentAttackDamage, this, bounces, blast);
                gameState.projectiles.push(projectile);
            });
        } else if (this.config.type === 'SkeletonWarrior') {
            const mainTarget = this.target;
            let dmg = currentAttackDamage;
            if (this.tier >= 1 && Math.random() < E.skelCritChance) {
                dmg = Math.round(dmg * E.skelCritMult);
                spawnParticles(mainTarget.pos.x, mainTarget.pos.y, '#FFEE58', 3, 60, 0.25, 2);
            }
            mainTarget.takeDamage(dmg);
            this.healFromDamage(dmg);
            const splash = blessVal('cleave') + (this.tier >= 2 ? E.skelCleave : 0);
            if (splash > 0) {
                const splashDmg = Math.round(dmg * splash);
                const rSq = CLEAVE_RADIUS * CLEAVE_RADIUS;
                monsterGrid.forEachInRadius(mainTarget.pos, CLEAVE_RADIUS, m => {
                    if (m !== mainTarget && m.isAlive && distanceSq(mainTarget.pos, m.pos) <= rSq) m.takeDamage(splashDmg);
                });
            }
            const effect = getVisualEffectFromPool(SlashEffect);
            if (effect) {
                effect.init(this.pos, this.target.pos);
                gameState.visualEffects.push(effect);
            }
        }
        let cooldownDuration = 1.0 / this.attackSpeed;
        if (this.config.type === 'EyeMonster') {
            cooldownDuration /= this.buffedAttackSpeedMultiplier;
        }
        this.attackCooldown = cooldownDuration;
    }

    applySlowAura() {
        if (this.config.type !== 'Wraith') return;
        const frost = blessVal('frostAura');
        const frostDmg = frost > 0 ? Math.round(frost * (1 + this.level * this.config.upgradeBonus)) : 0;
        const weaken = this.tier >= 1;
        monsterGrid.forEachInRadius(this.pos, this.slowRadius, monster => {
            if (monster.isAlive && distanceSq(this.pos, monster.pos) <= this.slowRadiusSq) {
                monster.applySlow(this.slowAmount, this.config.slowDuration);
                if (weaken) monster.weakenTimer = this.config.slowDuration;
                if (frostDmg) monster.takeDamage(frostDmg);
            }
        });
    }


    takeDamage(amount) {
        if (!this.isAlive) return;
        this.currentHealth -= amount;
        this.currentHealth = Math.max(0, Math.round(this.currentHealth));
        this.hitFlash = CONFIG.visuals.hitFlashDuration;
        if (this.currentHealth <= 0) {
            this.die();
        }
    }

    levelUp() {
        this.level++;
        this.applyLevelStats();
        updateUI();
    }

    die() {
        if (!this.isAlive) return;
        const E = CONFIG.evolution;
        if (this.config.type === 'SkeletonWarrior' && this.tier >= 3 && !this.revived && Math.random() < E.skelReviveChance) {
            this.revived = true;
            this.currentHealth = Math.round(this.maxHealth * E.skelReviveHealth);
            spawnParticles(this.pos.x, this.pos.y, '#EF9A9A', 10, 60, 0.5);
            return;
        }
        this.isAlive = false;
        spawnParticles(this.pos.x, this.pos.y, '#B0BEC5', 10, 70, 0.45);
        switch (this.config.type) {
            case 'SkeletonWarrior': gameState.skeletonWarriorCount--; break;
            case 'EyeMonster': gameState.eyeMonsterCount--; break;
            case 'Wraith': break;
        }
        if (this.config.type !== 'Wraith') {
            updateUI();
        }
    }
}

class SkeletonWarrior extends SummonUnit {
    constructor(x, y, level, playerTransform) {
        super(x, y, CONFIG.skeletonWarrior, level, playerTransform);
    }
}

class EyeMonster extends SummonUnit {
    constructor(x, y, level, playerTransform) {
        super(x, y, CONFIG.eyeMonster, level, playerTransform);
    }
}

class Wraith extends SummonUnit {
    constructor(x, y, level, playerTransform) {
        super(x, y, CONFIG.wraith, level, playerTransform);
    }

    drawAura(g, scale, offsetX, offsetY) {
        if (!this.isAlive || !this.config.auraColor) return;
        const r = this.slowRadius;
        if (!inView(this.pos) && !inView({ x: this.pos.x + r, y: this.pos.y }) && !inView({ x: this.pos.x - r, y: this.pos.y })) return;
        const d = r * 2 * scale;
        g.drawImage(getAuraSprite(this.config.auraColor, r * scale, this.radius * 0.5 * scale), (this.pos.x - r - offsetX) * scale, (this.pos.y - r - offsetY) * scale, d, d);
    }

    draw(ctx) {
        super.draw(ctx);
    }

    attackTarget() { }

    explosionDamage() {
        const explosionDamageMultiplier = 1 + (this.level * this.config.upgradeBonus);
        return Math.round(CONFIG.wraith.explosionBaseDamage * explosionDamageMultiplier * (1 + blessVal('wraithBlast')));
    }

    update(deltaTime, monsters, otherSummons, player) {
        super.update(deltaTime, monsters, otherSummons, player);
        if (!this.isAlive || this.tier < 2) return;
        const E = CONFIG.evolution;
        this.pulseTimer = (this.pulseTimer ?? Math.random() * E.wraithPulseInterval) - deltaTime;
        if (this.pulseTimer > 0) return;
        this.pulseTimer = E.wraithPulseInterval;
        if (!monsterGrid.anyWithin(this.pos, this.slowRadius)) return;
        const dmg = Math.round(this.explosionDamage() * E.wraithPulseMult);
        monsterGrid.forEachInRadius(this.pos, this.slowRadius, m => {
            if (m.isAlive && distanceSq(this.pos, m.pos) <= this.slowRadiusSq) m.takeDamage(dmg);
        });
        if (gameState.visualEffects.length < MAX_AMBIENT_EFFECTS) {
            gameState.visualEffects.push(new NovaEffect(this.pos, this.slowRadius, PULSE_EFFECT_COLORS));
        }
        Sfx.play('pulse');
    }

    die() {
        if (!this.isAlive) return;

        const E = CONFIG.evolution;
        const explosionDamage = this.explosionDamage();
        const radius = this.slowRadius * (this.tier >= 3 ? E.wraithBlastRadiusMult : 1);
        const explosionRadiusSq = radius * radius;
        const stun = this.tier >= 3;

        monsterGrid.forEachInRadius(this.pos, radius, monster => {
            if (monster.isAlive && distanceSq(this.pos, monster.pos) <= explosionRadiusSq) {
                if (stun) monster.applySlow(1, E.wraithStunDuration);
                monster.takeDamage(explosionDamage);
            }
        });

        const effect = getVisualEffectFromPool(ExplosionEffect);
        if (effect) {
            effect.init(this.pos, radius);
            gameState.visualEffects.push(effect);
        }
        spawnParticles(this.pos.x, this.pos.y, '#FFB74D', 24, 160, 0.5, 3);
        addShake(6);
        Sfx.play('explode');

        this.isAlive = false;
        gameState.wraithCount--;
        if (Math.random() < blessVal('rebirth') && gameState.player && gameState.player.isAlive) {
            const pos = gameState.player.getSummonPosition();
            gameState.summons.push(new Wraith(pos.x, pos.y, gameState.wraithLevel, gameState.player));
            gameState.wraithCount++;
            spawnParticles(pos.x, pos.y, '#4DB6AC', 14, 80, 0.6);
            spawnFloatText(pos.x, pos.y - 16, '輪迴', '#80CBC4', 13);
            Sfx.play('raise');
        }
        updateUI();
    }
}

const PROJECTILE_DESPAWN_MARGIN = 200;

class Projectile {
    constructor(startX, startY, target, shooterConfig, damage) {
        this.init(startX, startY, target, shooterConfig, damage);
    }

    init(startX, startY, target, shooterConfig, damage, owner = null, bounces = 0, blast = false) {
        this.owner = owner;
        this.bounces = bounces;
        this.blast = blast;
        this.pos = { x: startX, y: startY };
        this.radius = shooterConfig.projectileRadius;
        this.color = shooterConfig.projectileColor;
        this.isAlive = true;
        this.target = target;
        this.speed = shooterConfig.projectileSpeed;
        this.damage = damage;
        this.targetPos = target ? { ...target.pos } : { x: 0, y: 0 };
        this.direction = target ? normalizeVector({ x: this.targetPos.x - startX, y: this.targetPos.y - startY }) : { x: 0, y: 0 };
        return this;
    }

    update(deltaTime) {
        if (!this.isAlive) return;

        this.pos.x += this.direction.x * this.speed * deltaTime;
        this.pos.y += this.direction.y * this.speed * deltaTime;

        if (this.target && this.target.isAlive) {
            const distToTargetSq = distanceSq(this.pos, this.target.pos);
            const hitRadiusSq = (this.radius + this.target.radius) * (this.radius + this.target.radius);

            if (distToTargetSq <= hitRadiusSq) {
                const hit = this.target;
                hit.takeDamage(this.damage);
                if (this.owner) this.owner.healFromDamage(this.damage);
                if (this.blast) this.explodeAt(hit);
                if (this.bounces > 0 && this.bounceFrom(hit)) return;
                this.isAlive = false;
                return;
            }
        } else {
            const distToOriginalTargetSq = distanceSq(this.pos, this.targetPos);
            if (distToOriginalTargetSq < (this.radius * 3) * (this.radius * 3)) {
                this.isAlive = false;
            }
        }

        if (this.pos.x < camera.x - PROJECTILE_DESPAWN_MARGIN || this.pos.x > camera.x + view.w + PROJECTILE_DESPAWN_MARGIN ||
            this.pos.y < camera.y - PROJECTILE_DESPAWN_MARGIN || this.pos.y > camera.y + view.h + PROJECTILE_DESPAWN_MARGIN) {
            this.isAlive = false;
        }
    }

    explodeAt(hit) {
        const E = CONFIG.evolution;
        const rSq = E.eyeBlastRadius * E.eyeBlastRadius;
        const dmg = Math.round(this.damage * E.eyeBlastMult);
        monsterGrid.forEachInRadius(hit.pos, E.eyeBlastRadius, m => {
            if (m !== hit && m.isAlive && distanceSq(hit.pos, m.pos) <= rSq) m.takeDamage(dmg);
        });
        spawnParticles(hit.pos.x, hit.pos.y, '#F48FB1', 4, 70, 0.3, 2);
    }

    bounceFrom(hit) {
        const E = CONFIG.evolution;
        let next = null, best = E.eyeBounceRange * E.eyeBounceRange;
        monsterGrid.forEachInRadius(hit.pos, E.eyeBounceRange, m => {
            if (m === hit || !m.isAlive) return;
            const d = distanceSq(hit.pos, m.pos);
            if (d < best) { best = d; next = m; }
        });
        if (!next) return false;
        this.bounces--;
        this.target = next;
        this.targetPos = { ...next.pos };
        this.direction = normalizeVector({ x: next.pos.x - this.pos.x, y: next.pos.y - this.pos.y });
        return true;
    }

    draw(ctx) {
        if (!this.isAlive) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class TimedEffect {
    constructor(pos, duration) {
        this.initBase(pos, duration);
    }

    initBase(pos, duration) {
        this.pos = pos ? { ...pos } : { x: 0, y: 0 };
        this.duration = duration || 0.1;
        this.life = this.duration;
        this.isAlive = true;
        return this;
    }

    update(deltaTime) {
        this.life -= deltaTime;
        if (this.life <= 0) { this.isAlive = false; }
    }
    draw(ctx) { }
}

class SlashEffect extends TimedEffect {
    constructor(attackerPos, targetPos) {
        super(null, 0);
        this.init(attackerPos, targetPos);
    }

    init(attackerPos, targetPos) {
        const midX = (attackerPos.x + targetPos.x) / 2;
        const midY = (attackerPos.y + targetPos.y) / 2;
        super.initBase({ x: midX, y: midY }, CONFIG.visuals.slashEffectDuration);

        this.startPos = { ...attackerPos };
        this.targetPos = { ...targetPos };

        const dx = this.targetPos.x - this.startPos.x;
        const dy = this.targetPos.y - this.startPos.y;
        this.angle = Math.atan2(dy, dx);

        this.arcCenterX = this.targetPos.x - Math.cos(this.angle) * (CONFIG.visuals.slashEffectArcRadius * 0.4);
        this.arcCenterY = this.targetPos.y - Math.sin(this.angle) * (CONFIG.visuals.slashEffectArcRadius * 0.4);
        return this;
    }


    draw(ctx) {
        if (!this.isAlive) return;
        const alpha = Math.max(0, this.life / this.duration);
        const arcAngle = CONFIG.visuals.slashEffectArcAngle;
        const startAngle = this.angle - arcAngle / 2;
        const endAngle = this.angle + arcAngle / 2;
        let rgbaColor = CONFIG.visuals.slashEffectColor;
        try {
            const colorParts = rgbaColor.match(/\d+(\.\d+)?/g);
            if (colorParts && colorParts.length >= 3) {
                rgbaColor = `rgba(${colorParts[0]}, ${colorParts[1]}, ${colorParts[2]}, ${alpha.toFixed(2)})`;
            } else { rgbaColor = `rgba(255, 255, 255, ${alpha.toFixed(2)})`; }
        } catch (e) { rgbaColor = `rgba(255, 255, 255, ${alpha.toFixed(2)})`; }

        ctx.strokeStyle = rgbaColor;
        ctx.lineWidth = CONFIG.visuals.slashEffectWidth;
        ctx.beginPath();
        ctx.arc(this.arcCenterX, this.arcCenterY, CONFIG.visuals.slashEffectArcRadius, startAngle, endAngle);
        ctx.stroke();
    }
}

class ExplosionEffect extends TimedEffect {
    constructor(pos, radius) {
        super(null, 0);
        this.init(pos, radius);
    }

    init(pos, radius) {
        super.initBase(pos, CONFIG.visuals.explosionEffectDuration);
        this.maxRadius = radius || 10;
        return this;
    }


    draw(ctx) {
        if (!this.isAlive) return;
        const progress = 1 - (this.life / this.duration);
        const currentRadius = this.maxRadius * progress;
        const alpha = 1 - progress;

        let rgbaColor = CONFIG.visuals.explosionEffectColor;
        try {
            const colorParts = rgbaColor.match(/\d+(\.\d+)?/g);
            if (colorParts && colorParts.length >= 3) {
                rgbaColor = `rgba(${colorParts[0]}, ${colorParts[1]}, ${colorParts[2]}, ${alpha.toFixed(2)})`;
            } else { rgbaColor = `rgba(255, 165, 0, ${alpha.toFixed(2)})`; }
        } catch (e) { rgbaColor = `rgba(255, 165, 0, ${alpha.toFixed(2)})`; }

        ctx.strokeStyle = rgbaColor;
        ctx.lineWidth = 3 + 4 * (1 - progress);
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, currentRadius, 0, Math.PI * 2);
        ctx.stroke();
    }
}


class DeathFadeEffect extends TimedEffect {
    constructor(obj) {
        super(obj.pos, CONFIG.visuals.deathFadeDuration);
        this.image = obj.image ? getSprite(obj.image, obj.imageWidth, obj.imageHeight, obj.tint, obj.tintStrength || 0.45) : null;
        this.w = obj.imageWidth * (obj.drawScale || 1);
        this.h = obj.imageHeight * (obj.drawScale || 1);
        this.facing = obj.facingDirection;
    }
    draw(ctx) {
        if (!this.isAlive || !this.image) return;
        const p = 1 - this.life / this.duration;
        ctx.save();
        ctx.globalAlpha = 1 - p;
        ctx.translate(this.pos.x, this.pos.y + p * 6);
        ctx.scale(this.facing * (1 + p * 0.2), 1 - p * 0.6);
        ctx.drawImage(this.image, -this.w / 2, -this.h / 2, this.w, this.h);
        ctx.restore();
    }
}

class SoulOrb {
    constructor(x, y, value) {
        const c = CONFIG.orbs;
        this.pos = { x, y };
        const a = Math.random() * Math.PI * 2;
        const v = randomInRange(c.popSpeedMin, c.popSpeedMax);
        this.vel = { x: Math.cos(a) * v, y: Math.sin(a) * v };
        this.value = value;
        this.size = 3 + Math.min(4, value * 0.7);
        this.age = 0;
        this.attracted = false;
        this.banked = false;
        this.isAlive = true;
    }
    update(deltaTime, player) {
        const c = CONFIG.orbs;
        this.age += deltaTime;
        const dx = player.pos.x - this.pos.x, dy = player.pos.y - this.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const magnet = getMagnetRadius();
        if (this.banked || dist < magnet) this.attracted = true;
        if (this.attracted && this.age > c.attractDelay) {
            const sp = c.attractSpeed + this.age * 60;
            this.vel.x = dx / (dist || 1) * sp;
            this.vel.y = dy / (dist || 1) * sp;
        } else {
            const f = Math.max(0, 1 - c.friction * deltaTime);
            this.vel.x *= f; this.vel.y *= f;
        }
        this.pos.x += this.vel.x * deltaTime;
        this.pos.y += this.vel.y * deltaTime;
        if (this.age > c.attractDelay && dist < player.radius + c.pickupPadding) {
            this.isAlive = false;
            if (!this.banked) {
                gameState.souls += this.value;
                if (this.value >= c.floatTextMinValue) spawnFloatText(player.pos.x, player.pos.y - 20, `+${this.value}`, '#80DEEA');
                updateUI();
            }
            Sfx.play('orb');
        }
    }
    draw(ctx) {
        const bob = Math.sin(this.age * 6) * 1.2;
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#4DD0E1';
        ctx.beginPath(); ctx.arc(this.pos.x, this.pos.y + bob, this.size * 2, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#E0F7FA';
        ctx.beginPath(); ctx.arc(this.pos.x, this.pos.y + bob, this.size, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}

function dropSouls(x, y, amount) {
    if (amount <= 0) return;
    const n = Math.min(CONFIG.orbs.maxOrbsPerDrop, amount);
    const base = Math.floor(amount / n);
    let rest = amount - base * n;
    for (let i = 0; i < n; i++) {
        const v = base + (rest > 0 ? 1 : 0);
        if (rest > 0) rest--;
        gameState.orbs.push(new SoulOrb(x, y, v));
    }
}

function bankAllOrbs() {
    gameState.orbs.forEach(o => {
        if (!o.banked) { gameState.souls += o.value; o.banked = true; }
    });
}

function getWaveStatMultiplier(wave) {
    const W = CONFIG.wave;
    const linear = 1
        + W.earlyScalePerWave * Math.min(wave - 1, W.earlyWaves - 1)
        + W.scalePerWave * Math.max(0, wave - W.earlyWaves)
        + W.lateScalePerWave * Math.max(0, wave - W.lateWave);
    return linear * Math.pow(W.expGrowth, Math.max(0, wave - W.expStartWave));
}

class Monster extends GameObject {
    constructor(x, y, config, waveNumber, isElite = false) {
        const E = CONFIG.elite;
        super(x, y, config.radius * (isElite ? E.sizeMult : 1), config.color, config.imageName, config.imgScaleMultiplier);
        this.config = config;
        this.isElite = isElite;
        this.tint = isElite ? E.tint : config.tint;
        this.tintStrength = isElite ? E.tintStrength : config.tintStrength;
        this.id = `m_${Date.now()}_${Math.random()}`;
        this.attackCooldown = 0;
        this.target = null;
        this.speedMultiplier = 1.0;
        this.slowTimer = 0;
        this.applyWaveScaling(waveNumber);
        const ev = getWaveEvent();
        if (ev && ev.speedMult) {
            this.baseMoveSpeed *= ev.speedMult;
            this.moveSpeed = this.baseMoveSpeed;
            this.attackSpeed *= ev.atkSpeedMult;
        }
        if (isElite) {
            this.maxHealth = Math.round(this.maxHealth * E.hpMult);
            this.attack *= E.atkMult;
        }
        this.currentHealth = this.maxHealth;
    }

    soulValue() {
        return this.config.soulDrop * (this.isElite ? CONFIG.elite.soulMult : 1);
    }

    draw(ctx) {
        if (this.isElite && this.isAlive) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 213, 79, 0.85)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(this.pos.x, this.pos.y + this.imageHeight * 0.38, this.radius * 1.3, this.radius * 0.5, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        super.draw(ctx);
    }

    applyWaveScaling(wave) {
        const baseStatMultiplier = getWaveStatMultiplier(wave);
        this.maxHealth = Math.round(this.config.baseHealth * baseStatMultiplier);
        this.attack = this.config.baseAttack * baseStatMultiplier;
        this.attackRange = this.config.attackRange;
        this.attackRangeSq = this.attackRange * this.attackRange;
        this.attackSpeed = this.config.attackSpeed;

        const speedIncreaseFactor = this.config.waveSpeedIncreaseFactor || 0;
        const speedMultiplierCap = 2.0;
        const waveSpeedMultiplier = Math.min(speedMultiplierCap, 1 + (wave * speedIncreaseFactor));
        this.baseMoveSpeed = this.config.moveSpeed * waveSpeedMultiplier;

        this.moveSpeed = this.baseMoveSpeed * this.speedMultiplier;
        this.maxHealth = Math.round(this.maxHealth);
    }

    update(deltaTime, player, summons) {
        if (!this.isAlive) return;
        this.tickFlash(deltaTime);

        if (this.weakenTimer > 0) this.weakenTimer -= deltaTime;
        if (this.slowTimer > 0) {
            this.slowTimer -= deltaTime;
            if (this.slowTimer <= 0) {
                this.speedMultiplier = 1.0;
                this.slowTimer = 0;
            }
        }
        this.moveSpeed = this.baseMoveSpeed * this.speedMultiplier;

        if (this.attackCooldown > 0) { this.attackCooldown -= deltaTime; }

        if (this.knockVel) {
            this.pos.x += this.knockVel.x * deltaTime;
            this.pos.y += this.knockVel.y * deltaTime;
            const f = Math.max(0, 1 - CONFIG.nova.knockbackFriction * deltaTime);
            this.knockVel.x *= f; this.knockVel.y *= f;
            if (Math.abs(this.knockVel.x) + Math.abs(this.knockVel.y) < 5) this.knockVel = null;
        }

        // 每 MONSTER_RETARGET_FRAMES 格重找一次最近目標（各自錯開）；目標死了立刻重找
        if (this.retargetSlot === undefined) this.retargetSlot = (avoidSlotCounter++) % MONSTER_RETARGET_FRAMES;
        if (!this.target || !this.target.isAlive || (frameNo + this.retargetSlot) % MONSTER_RETARGET_FRAMES === 0) {
            this.findTarget(player, summons);
        }

        let moveDirection = { x: 0, y: 0 };
        let moveX = 0;
        let moveY = 0;

        if (this.target) {
            const distSqToTarget = distanceSq(this.pos, this.target.pos);
            if (distSqToTarget > this.attackRangeSq * 0.9) {
                moveDirection = normalizeVector({ x: this.target.pos.x - this.pos.x, y: this.target.pos.y - this.pos.y });
            }
            else {
                moveDirection = { x: 0, y: 0 };
            }
        } else {
            moveDirection = { x: 0, y: 0 };
        }


        moveX = moveDirection.x * this.moveSpeed * deltaTime;
        moveY = moveDirection.y * this.moveSpeed * deltaTime;

        if (Math.abs(moveX) > 0.01 || Math.abs(moveY) > 0.01) {
            this.pos.x += moveX;
            this.pos.y += moveY;
            this.updateFacingDirection(moveX);
        }

        if (this.target && this.target.isAlive && this.attackCooldown <= 0 && distanceSq(this.pos, this.target.pos) <= this.attackRangeSq) {
            if (this.target.pos.x > this.pos.x + 1) this.facingDirection = 1;
            else if (this.target.pos.x < this.pos.x - 1) this.facingDirection = -1;
            this.attackTarget();
        }
    }

    findTarget(player, summons) {
        let closestTarget = null;
        let minDistanceSq = Infinity;

        if (player.isAlive) {
            minDistanceSq = distanceSq(this.pos, player.pos);
            closestTarget = player;
        }
        const nearestSummon = summonGrid.nearest(this.pos);
        if (nearestSummon && distanceSq(this.pos, nearestSummon.pos) < minDistanceSq) closestTarget = nearestSummon;
        this.target = closestTarget;
    }


    attackTarget() {
        if (!this.target || !this.target.isAlive) return;
        this.target.takeDamage(this.attack * (this.weakenTimer > 0 ? 1 - CONFIG.evolution.wraithWeaken : 1));

        if (this.attackRange <= CONFIG.basicMeleeMonster.attackRange * 1.2) {
            const effect = getVisualEffectFromPool(SlashEffect);
            if (effect) {
                effect.init(this.pos, this.target.pos);
                gameState.visualEffects.push(effect);
            }
        }


        this.attackCooldown = 1.0 / this.attackSpeed;
    }

    takeDamage(amount) {
        if (!this.isAlive) return;
        this.currentHealth -= amount;
        this.currentHealth = Math.max(0, Math.round(this.currentHealth));
        this.hitFlash = CONFIG.visuals.hitFlashDuration;
        Sfx.play('hit');

        if (this.currentHealth <= 0) { this.die(); }
    }

    die() {
        this.isAlive = false;
        registerKill();
        const ev = getWaveEvent();
        const souls = this.soulValue() * (1 + blessVal('soulHarvest')) * (ev && ev.soulMult ? ev.soulMult : 1) * (1 + getStreakBonus())
            + gameState.soulCarry;
        const whole = Math.floor(souls);
        gameState.soulCarry = souls - whole;
        dropSouls(this.pos.x, this.pos.y, whole);
        if (!(this instanceof BossMonster) && Math.random() < blessVal('raiseDead') && gameState.player) {
            gameState.summons.push(new SkeletonWarrior(this.pos.x, this.pos.y, gameState.skeletonWarriorLevel, gameState.player));
            gameState.skeletonWarriorCount++;
            gameState.totalSummons.SkeletonWarrior++;
            spawnParticles(this.pos.x, this.pos.y, '#B39DDB', 14, 90, 0.6);
            spawnFloatText(this.pos.x, this.pos.y - 16, '復甦', '#B39DDB', 13);
            Sfx.play('raise');
        }
        spawnParticles(this.pos.x, this.pos.y, '#CE93D8', 8, 60, 0.6);
        if (this.isElite) {
            spawnParticles(this.pos.x, this.pos.y, '#FFD54F', 16, 120, 0.7, 3);
            spawnFloatText(this.pos.x, this.pos.y - 18, '精英擊破', '#FFD54F', 13);
            Sfx.play('elite');
        }
        gameState.visualEffects.push(new DeathFadeEffect(this));
        Sfx.play('kill');
        if (gameState.totalKills.hasOwnProperty(this.config.type)) {
            gameState.totalKills[this.config.type]++;
        }
        updateUI();
    }

    applySlow(amount, duration) {
        const newSpeedMultiplier = 1.0 - amount;
        if (newSpeedMultiplier < this.speedMultiplier) {
            this.speedMultiplier = newSpeedMultiplier;
        }
        this.slowTimer = Math.max(this.slowTimer, duration);
    }
}

class BasicMeleeMonster extends Monster {
    constructor(x, y, waveNumber, isElite) { super(x, y, CONFIG.basicMeleeMonster, waveNumber, isElite); }
}
class FastMeleeMonster extends Monster {
    constructor(x, y, waveNumber, isElite) { super(x, y, CONFIG.fastMeleeMonster, waveNumber, isElite); }
}
class ArmoredMeleeMonster extends Monster {
    constructor(x, y, waveNumber, isElite) { super(x, y, CONFIG.armoredMeleeMonster, waveNumber, isElite); }
}

class BloaterMonster extends Monster {
    constructor(x, y, waveNumber, isElite) {
        super(x, y, CONFIG.bloaterMonster, waveNumber, isElite);
        this.fuse = 0;
    }
    update(deltaTime, player, summons) {
        if (!this.isAlive) return;
        if (this.fuse > 0) {
            this.tickFlash(deltaTime);
            this.fuse -= deltaTime;
            const p = 1 - this.fuse / this.config.fuseTime;
            this.drawScale = 1 + p * 0.45 + Math.sin(p * 30) * 0.05;
            if (this.fuse <= 0) this.explode(player, summons);
            return;
        }
        super.update(deltaTime, player, summons);
    }
    attackTarget() {
        this.fuse = this.config.fuseTime;
    }
    explode(player, summons) {
        const r = this.config.blastRadius * (this.isElite ? CONFIG.elite.sizeMult : 1);
        const rSq = r * r;
        for (let i = 0; i < summons.length; i++) {
            const s = summons[i];
            if (s.isAlive && distanceSq(this.pos, s.pos) <= rSq) s.takeDamage(this.attack);
        }
        if (player.isAlive && distanceSq(this.pos, player.pos) <= rSq) player.takeDamage(this.attack);
        const effect = getVisualEffectFromPool(ExplosionEffect);
        if (effect) { effect.init(this.pos, r); gameState.visualEffects.push(effect); }
        spawnParticles(this.pos.x, this.pos.y, '#9CCC65', 22, 140, 0.55, 3);
        addShake(5);
        Sfx.play('bloat');
        // 自爆不算擊殺、不掉靈魂：要在它膨脹時先打掉才有獎勵
        this.isAlive = false;
    }
}

class BossMonster extends Monster {
    constructor(x, y, waveNumber, config) {
        super(x, y, config, waveNumber, false);
        this.tier = Math.max(1, Math.floor(waveNumber / CONFIG.wave.bossEvery));
        this.waveNumber = waveNumber;
    }
    applySlow(amount, duration) {
        super.applySlow(amount * (1 - this.config.slowResist), duration);
    }
    drawHealthBar() { }
    die() {
        super.die();
        spawnParticles(this.pos.x, this.pos.y, '#E1BEE7', 50, 220, 1.0, 4);
        spawnFloatText(this.pos.x, this.pos.y - 30, '首領擊破！', '#E1BEE7', 20, 1.6);
        addShake(14);
        Sfx.play('bossDie');
    }
}

class ColossusBoss extends BossMonster {
    constructor(x, y, waveNumber) {
        super(x, y, waveNumber, CONFIG.boss);
        this.slamTimer = CONFIG.boss.slamInterval;
        this.windup = 0;
    }
    update(deltaTime, player, summons) {
        if (!this.isAlive) return;
        const c = this.config;
        if (this.windup > 0) {
            this.tickFlash(deltaTime);
            this.windup -= deltaTime;
            if (this.windup <= 0) this.slam(player, summons);
            return;
        }
        this.slamTimer -= deltaTime;
        if (this.slamTimer <= 0 && this.target && distanceSq(this.pos, this.target.pos) < (c.slamRadius * 1.5) ** 2) {
            this.windup = c.slamWindup;
            this.slamTimer = c.slamInterval;
            return;
        }
        super.update(deltaTime, player, summons);
    }
    slam(player, summons) {
        const c = this.config;
        const rSq = c.slamRadius * c.slamRadius;
        const dmg = this.attack * c.slamDamageMult;
        for (let i = 0; i < summons.length; i++) {
            const s = summons[i];
            if (s.isAlive && distanceSq(this.pos, s.pos) <= rSq) s.takeDamage(dmg);
        }
        if (player.isAlive && distanceSq(this.pos, player.pos) <= rSq) player.takeDamage(dmg);
        const effect = getVisualEffectFromPool(ExplosionEffect);
        if (effect) { effect.init(this.pos, c.slamRadius); gameState.visualEffects.push(effect); }
        spawnParticles(this.pos.x, this.pos.y, '#BA68C8', 30, 180, 0.6, 3);
        addShake(10);
        Sfx.play('slam');
    }
    draw(ctx) {
        if (this.isAlive && this.windup > 0) {
            const c = this.config;
            const p = 1 - this.windup / c.slamWindup;
            ctx.save();
            ctx.fillStyle = `rgba(229, 57, 53, ${(0.12 + 0.18 * p).toFixed(2)})`;
            ctx.beginPath(); ctx.arc(this.pos.x, this.pos.y, c.slamRadius * p, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(229, 57, 53, 0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(this.pos.x, this.pos.y, c.slamRadius, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
        }
        super.draw(ctx);
    }
}

class PlagueBoss extends BossMonster {
    constructor(x, y, waveNumber) {
        super(x, y, waveNumber, CONFIG.plagueBoss);
        this.spawnTimer = CONFIG.plagueBoss.spawnInterval * 0.5;
    }
    update(deltaTime, player, summons) {
        if (!this.isAlive) return;
        super.update(deltaTime, player, summons);
        const c = this.config;
        this.spawnTimer -= deltaTime;
        if (this.spawnTimer > 0) return;
        this.spawnTimer = c.spawnInterval;
        const n = c.spawnCountBase + c.spawnCountPerTier * (this.tier - 1);
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2;
            const x = this.pos.x + Math.cos(a) * c.spawnRadius, y = this.pos.y + Math.sin(a) * c.spawnRadius;
            gameState.monsters.push(new BloaterMonster(x, y, this.waveNumber, false));
            spawnParticles(x, y, '#9CCC65', 8, 60, 0.5);
        }
        this.hitFlash = CONFIG.visuals.hitFlashDuration * 2;
        Sfx.play('spawn');
    }
}

class HunterBoss extends BossMonster {
    constructor(x, y, waveNumber) {
        super(x, y, waveNumber, CONFIG.hunterBoss);
        this.dashTimer = CONFIG.hunterBoss.dashInterval;
        this.windup = 0;
        this.dashLeft = 0;
        this.dashDir = { x: 0, y: 0 };
        this.dashHit = null;
    }
    update(deltaTime, player, summons) {
        if (!this.isAlive) return;
        const c = this.config;
        if (this.dashLeft > 0) {
            this.tickFlash(deltaTime);
            const step = Math.min(this.dashLeft, c.dashSpeed * deltaTime);
            this.pos.x += this.dashDir.x * step;
            this.pos.y += this.dashDir.y * step;
            this.dashLeft -= step;
            this.updateFacingDirection(this.dashDir.x);
            const dmg = this.attack * c.dashDamageMult;
            const wSq = c.dashWidth * c.dashWidth;
            summonGrid.forEachInRadius(this.pos, c.dashWidth, s => {
                if (s.isAlive && !this.dashHit.has(s) && distanceSq(this.pos, s.pos) <= wSq) { this.dashHit.add(s); s.takeDamage(dmg); }
            });
            if (player.isAlive && !this.dashHit.has(player) && distanceSq(this.pos, player.pos) <= wSq) { this.dashHit.add(player); player.takeDamage(dmg); }
            if (gameState.particles.length < CONFIG.visuals.maxParticles) spawnParticles(this.pos.x, this.pos.y, '#7E57C2', 2, 30, 0.35, 3);
            return;
        }
        if (this.windup > 0) {
            this.tickFlash(deltaTime);
            this.windup -= deltaTime;
            if (this.windup <= 0) {
                this.dashLeft = c.dashDistance;
                this.dashHit = new Set();
                addShake(5);
                Sfx.play('dash');
            }
            return;
        }
        this.dashTimer -= deltaTime;
        if (this.dashTimer <= 0 && this.target && distanceSq(this.pos, this.target.pos) < c.dashTriggerRange * c.dashTriggerRange) {
            this.dashTimer = c.dashInterval;
            this.windup = c.dashWindup;
            this.dashDir = normalizeVector({ x: this.target.pos.x - this.pos.x, y: this.target.pos.y - this.pos.y });
            return;
        }
        super.update(deltaTime, player, summons);
    }
    draw(ctx) {
        if (this.isAlive && this.windup > 0) {
            const c = this.config;
            const p = 1 - this.windup / c.dashWindup;
            const ex = this.pos.x + this.dashDir.x * c.dashDistance, ey = this.pos.y + this.dashDir.y * c.dashDistance;
            ctx.save();
            ctx.lineCap = 'round';
            ctx.strokeStyle = `rgba(229, 57, 53, ${(0.15 + 0.25 * p).toFixed(2)})`;
            ctx.lineWidth = c.dashWidth * 2;
            ctx.beginPath(); ctx.moveTo(this.pos.x, this.pos.y); ctx.lineTo(ex, ey); ctx.stroke();
            ctx.strokeStyle = 'rgba(229, 57, 53, 0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(this.pos.x, this.pos.y); ctx.lineTo(this.pos.x + (ex - this.pos.x) * p, this.pos.y + (ey - this.pos.y) * p); ctx.stroke();
            ctx.restore();
        }
        super.draw(ctx);
    }
}

// 首領輪替：第 10 / 20 / 30 波依序出場，之後重複（等級隨波數提高）
const BOSS_ROTATION = [ColossusBoss, PlagueBoss, HunterBoss];
function getBossClass(wave) {
    const tier = Math.max(1, Math.floor(wave / CONFIG.wave.bossEvery));
    return BOSS_ROTATION[(tier - 1) % BOSS_ROTATION.length];
}
const BOSS_CONFIG_OF = new Map([[ColossusBoss, () => CONFIG.boss], [PlagueBoss, () => CONFIG.plagueBoss], [HunterBoss, () => CONFIG.hunterBoss]]);

class ThiefMonster extends Monster {
    constructor(x, y, waveNumber) {
        super(x, y, CONFIG.thief, waveNumber, false);
        this.life = CONFIG.thief.lifetime;
        this.waveNumber = waveNumber;
    }
    soulValue() {
        return this.config.soulDrop + this.config.soulPerWave * this.waveNumber;
    }
    update(deltaTime, player, summons) {
        if (!this.isAlive) return;
        this.tickFlash(deltaTime);
        if (this.slowTimer > 0) { this.slowTimer -= deltaTime; if (this.slowTimer <= 0) { this.speedMultiplier = 1; this.slowTimer = 0; } }
        if (this.knockVel) {
            this.pos.x += this.knockVel.x * deltaTime; this.pos.y += this.knockVel.y * deltaTime;
            const f = Math.max(0, 1 - CONFIG.nova.knockbackFriction * deltaTime);
            this.knockVel.x *= f; this.knockVel.y *= f;
            if (Math.abs(this.knockVel.x) + Math.abs(this.knockVel.y) < 5) this.knockVel = null;
        }
        this.life -= deltaTime;
        const speed = this.baseMoveSpeed * this.speedMultiplier;
        let dir;
        const toPlayer = { x: player.pos.x - this.pos.x, y: player.pos.y - this.pos.y };
        const distToPlayer = Math.sqrt(toPlayer.x * toPlayer.x + toPlayer.y * toPlayer.y) || 1;
        if (this.life <= 0) {
            // 時間到就頭也不回地逃走，跑出畫面外夠遠就消失（不算擊殺、不掉靈魂）
            dir = { x: -toPlayer.x / distToPlayer, y: -toPlayer.y / distToPlayer };
            if (!inView(this.pos) && distToPlayer > Math.max(view.w, view.h)) { this.isAlive = false; return; }
        } else {
            const threat = summonGrid.nearest(this.pos, this.config.leashRadius);
            let tx = player.pos.x, ty = player.pos.y;
            if (threat && distanceSq(this.pos, threat.pos) < distanceSq(this.pos, player.pos)) { tx = threat.pos.x; ty = threat.pos.y; }
            dir = normalizeVector({ x: this.pos.x - tx, y: this.pos.y - ty });
            // 地圖無限大，直線逃跑永遠追不到：離法師太遠就改成繞著法師兜圈子
            if (distToPlayer > this.config.leashRadius) {
                const tangent = { x: -toPlayer.y / distToPlayer, y: toPlayer.x / distToPlayer };
                const pull = Math.min(1, (distToPlayer - this.config.leashRadius) / this.config.leashRadius);
                dir = normalizeVector({
                    x: dir.x * (1 - pull) + (tangent.x + toPlayer.x / distToPlayer * 0.6) * pull,
                    y: dir.y * (1 - pull) + (tangent.y + toPlayer.y / distToPlayer * 0.6) * pull,
                });
            }
        }
        this.pos.x += dir.x * speed * deltaTime;
        this.pos.y += dir.y * speed * deltaTime;
        this.updateFacingDirection(dir.x);
    }
    attackTarget() { }
}

function getWaveEvent() {
    return gameState.waveEvent ? CONFIG.waveEvents.list[gameState.waveEvent] : null;
}

function rollWaveEvent(wave) {
    const W = CONFIG.waveEvents;
    const isBossWave = wave % CONFIG.wave.bossEvery === 0;
    if (wave < W.startWave || isBossWave || gameState.lastEventWave === wave - 1) return null;
    if (Math.random() >= W.chance) return null;
    const ids = Object.keys(W.list);
    return ids[Math.floor(Math.random() * ids.length)];
}

function getStreakBonus() {
    const S = CONFIG.streak;
    return Math.min(S.bonusMax, Math.floor(gameState.streak / S.bonusStep) * S.bonusPerStep);
}

function registerKill() {
    gameState.streak++;
    gameState.streakTimer = CONFIG.streak.window;
    if (gameState.streak > gameState.bestStreak) gameState.bestStreak = gameState.streak;
    if (CONFIG.streak.milestones.includes(gameState.streak)) {
        const p = gameState.player;
        if (p) spawnFloatText(p.pos.x, p.pos.y - 50, `🔥 ${gameState.streak} 連殺！`, '#FFAB40', 22, 1.4);
        addShake(3);
        Sfx.play('streak');
    }
}

function getEliteChance(wave) {
    const E = CONFIG.elite;
    if (wave < E.startWave) return 0;
    return Math.min(E.chanceMax, E.chanceBase + E.chancePerWave * (wave - E.startWave));
}

function buildWaveQueue(wave) {
    const W = CONFIG.wave;
    const isBossWave = wave % W.bossEvery === 0;
    const ev = getWaveEvent();
    const factor = (isBossWave ? W.bossWaveCountFactor : 1) * (ev && ev.countMult ? ev.countMult : 1);
    const classes = [];
    const add = (Cls, n) => { for (let i = 0; i < n; i++) classes.push(Cls); };
    add(BasicMeleeMonster, Math.round((W.basicBase + wave * W.basicPerWave) * factor));
    [[CONFIG.fastMeleeMonster, FastMeleeMonster], [CONFIG.bloaterMonster, BloaterMonster], [CONFIG.armoredMeleeMonster, ArmoredMeleeMonster]]
        .forEach(([cfg, Cls]) => {
            if (wave < cfg.minWave) return;
            const typeMult = Cls === BloaterMonster && ev && ev.bloaterMult ? ev.bloaterMult : 1;
            add(Cls, Math.max(1, Math.round((1 + Math.floor((wave - cfg.minWave) / cfg.waveInterval)) * factor * typeMult)));
        });
        if (ev && ev.thieves) add(ThiefMonster, ev.thieves);
    for (let i = classes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [classes[i], classes[j]] = [classes[j], classes[i]];
    }
    let eliteChance = getEliteChance(wave);
    if (ev && ev.eliteMult) eliteChance = Math.min(ev.eliteMax, Math.max(CONFIG.elite.chanceBase, eliteChance) * ev.eliteMult);
    const queue = classes.map(Cls => ({ Cls, elite: Cls !== ThiefMonster && Math.random() < eliteChance }));
    if (isBossWave) queue.unshift({ Cls: getBossClass(wave), elite: false });
    return queue;
}

function getSpawnInterval(wave) {
    const W = CONFIG.wave;
    return Math.max(W.spawnIntervalMin, W.spawnIntervalBase - W.spawnIntervalPerWave * wave);
}

function updateSpawner(deltaTime) {
    if (gameState.betweenWaves || gameState.spawnQueue.length === 0) return;
    gameState.spawnTimer -= deltaTime;
    if (gameState.spawnTimer > 0) return;
    const W = CONFIG.wave;
    const wave = gameState.currentWave;
    gameState.spawnTimer = getSpawnInterval(wave);
    const head = gameState.spawnQueue[0];
    const packSize = head.Cls.prototype instanceof BossMonster ? 1 : W.packMin + Math.floor(Math.random() * (W.packMax - W.packMin + 1));
    const origin = getRandomPositionOutsideView();
    for (let i = 0; i < packSize && gameState.spawnQueue.length > 0; i++) {
        const { Cls, elite } = gameState.spawnQueue.shift();
        const x = origin.x + randomInRange(-W.packSpread, W.packSpread);
        const y = origin.y + randomInRange(-W.packSpread, W.packSpread);
        gameState.monsters.push(new Cls(x, y, wave, elite));
    }
}

function getAliveBoss() {
    for (let i = 0; i < gameState.monsters.length; i++) {
        const m = gameState.monsters[i];
        if (m.isAlive && m instanceof BossMonster) return m;
    }
    return null;
}

function prepareNextWave() {
    gameState.currentWave++;
    gameState.betweenWaves = false;
    gameState.monsters = [];
    gameState.projectiles.forEach(returnProjectileToPool);
    gameState.projectiles = [];
    gameState.visualEffects.forEach(returnVisualEffectToPool);
    gameState.visualEffects = [];

    const waveNum = gameState.currentWave;
    gameState.waveEvent = rollWaveEvent(waveNum);
    if (gameState.waveEvent) gameState.lastEventWave = waveNum;
    gameState.spawnQueue = buildWaveQueue(waveNum);
    gameState.spawnTimer = CONFIG.wave.firstSpawnDelay;
    const isBossWave = waveNum % CONFIG.wave.bossEvery === 0;
    const ev = getWaveEvent();
    if (isBossWave) {
        const bossName = BOSS_CONFIG_OF.get(getBossClass(waveNum))().name;
        gameState.banner = { text: '⚠ 首領來襲', sub: `第 ${waveNum} 波 · ${bossName}`, color: '#E1BEE7', life: CONFIG.wave.bannerDuration };
    } else if (ev) {
        gameState.banner = { text: `${ev.icon} ${ev.name}`, sub: `第 ${waveNum} 波 · ${ev.desc}`, color: ev.color, life: CONFIG.wave.bannerDuration * 1.3 };
    } else {
        gameState.banner = { text: `第 ${waveNum} 波`, sub: '', color: '#FFFFFF', life: CONFIG.wave.bannerDuration };
    }
    Sfx.play(isBossWave || ev ? 'boss' : 'wave');

    updateUI();
}

function countRemainingMonsters() {
    let alive = 0;
    for (let i = 0; i < gameState.monsters.length; i++) {
        if (gameState.monsters[i].isAlive) alive++;
    }
    return alive + gameState.spawnQueue.length;
}

function checkWaveEndCondition() {
    if (!gameState.betweenWaves && countRemainingMonsters() === 0) {
        gameState.betweenWaves = true;
        gameState.timeToNextWave = CONFIG.wave.betweenTime;
        gameState.waveEvent = null;
        bankAllOrbs();
        const p = gameState.player;
        if (p && p.isAlive && p.currentHealth < p.maxHealth) {
            const heal = Math.min(p.maxHealth - p.currentHealth, Math.ceil(p.maxHealth * CONFIG.wave.healRatio));
            p.currentHealth += heal;
            spawnFloatText(p.pos.x, p.pos.y - 24, `+${heal} HP`, '#81C784', 14, 1.2);
        }
        gameState.summons.forEach(s => { if (s.isAlive) s.currentHealth = s.maxHealth; });
        queueDraftIfDue();
        gameState.projectiles.forEach(returnProjectileToPool);
        gameState.projectiles = [];
        gameState.visualEffects.forEach(returnVisualEffectToPool);
        gameState.visualEffects = [];
        saveGameState();
        updateUI();
        if (gameState.pendingDraft) openDraft();
    }
}

const NOVA_EFFECT_COLORS = { fill: '156, 39, 176', stroke: '225, 190, 231' };
const PULSE_EFFECT_COLORS = { fill: '77, 182, 172', stroke: '178, 223, 219' };
// 脈衝這類「每隻都會一直放」的特效：場上特效太多時就不再加，避免大軍時畫面與效能被淹沒
const MAX_AMBIENT_EFFECTS = 120;

class NovaEffect extends TimedEffect {
    constructor(pos, radius, colors = NOVA_EFFECT_COLORS) {
        super(pos, CONFIG.nova.effectDuration);
        this.radius = radius;
        this.colors = colors;
    }
    draw(ctx) {
        if (!this.isAlive) return;
        const p = 1 - this.life / this.duration;
        const r = this.radius * (1 - Math.pow(1 - p, 3));
        ctx.save();
        ctx.fillStyle = `rgba(${this.colors.fill}, ${(0.25 * (1 - p)).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(this.pos.x, this.pos.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(${this.colors.stroke}, ${(1 - p).toFixed(2)})`;
        ctx.lineWidth = 6 * (1 - p) + 1;
        ctx.beginPath(); ctx.arc(this.pos.x, this.pos.y, r, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
    }
}

function useNova() {
    const p = gameState.player;
    if (!p || !p.isAlive || gameState.novaCooldown > 0 || gameState.isPaused || gameState.gameOver || gameState.draftOpen) return false;
    const c = CONFIG.nova;
    const dmg = getNovaDamage();
    const rSq = c.radius * c.radius;
    gameState.monsters.forEach(m => {
        if (!m.isAlive) return;
        const dSq = distanceSq(m.pos, p.pos);
        if (dSq > rSq) return;
        const dir = normalizeVector({ x: m.pos.x - p.pos.x, y: m.pos.y - p.pos.y });
        const kb = c.knockbackSpeed * (m instanceof BossMonster ? c.bossKnockbackMult : 1);
        m.knockVel = { x: dir.x * kb, y: dir.y * kb };
        m.applySlow(c.slowAmount, c.slowDuration);
        m.takeDamage(dmg);
    });
    gameState.visualEffects.push(new NovaEffect(p.pos, c.radius));
    spawnParticles(p.pos.x, p.pos.y, '#CE93D8', 36, 260, 0.5, 3);
    addShake(7);
    Sfx.play('nova');
    gameState.novaCooldown = getNovaCooldown();
    ensureMusicPlaying();
    updateUI();
    return true;
}

function queueDraftIfDue() {
    const w = gameState.currentWave;
    if (w <= 0 || (w % CONFIG.draft.every !== 0 && w % CONFIG.wave.bossEvery !== 0)) return;
    queueDraft();
}

function queueDraft() {
    const eligible = Object.keys(BLESSINGS).filter(id => bl(id) < BLESSINGS[id].max);
    for (let i = eligible.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
    }
    const options = eligible.slice(0, CONFIG.draft.optionCount);
    if (options.length > 0) gameState.pendingDraft = { options };
}

function blessingPips(id, highlightNext) {
    const cur = bl(id), max = BLESSINGS[id].max;
    let html = '';
    for (let i = 0; i < max; i++) {
        const cls = i < cur ? 'pip on' : (highlightNext && i === cur ? 'pip next' : 'pip');
        html += `<span class="${cls}"></span>`;
    }
    return html;
}

function openDraft() {
    if (!gameState.pendingDraft) return;
    stopHoldAction();
    gameState.draftOpen = true;
    const box = uiElements.draftCards;
    box.innerHTML = '';
    gameState.pendingDraft.options.forEach(id => {
        const b = BLESSINGS[id];
        const card = document.createElement('button');
        card.className = 'draft-card';
        card.innerHTML = `<span class="draft-icon">${b.icon}</span><span class="draft-text"><span class="draft-name">${b.name}<span class="pips">${blessingPips(id, true)}</span></span><span class="draft-desc">${b.desc(b)}</span></span>`;
        card.addEventListener('click', () => pickBlessing(id));
        box.appendChild(card);
    });
    uiElements.draftScreen.style.display = 'flex';
    Sfx.play('draft');
    updateUI();
}

function pickBlessing(id) {
    if (!gameState.pendingDraft || !gameState.pendingDraft.options.includes(id)) return;
    gameState.blessings[id] = bl(id) + 1;
    if (id === 'vitality' && gameState.player) {
        gameState.player.maxHealth += BLESSINGS.vitality.per;
        gameState.player.currentHealth = gameState.player.maxHealth;
    }
    gameState.summons.forEach(s => { if (s.isAlive) s.refreshStats(); });
    gameState.pendingDraft = null;
    gameState.draftOpen = false;
    uiElements.draftScreen.style.display = 'none';
    if (gameState.extraDrafts > 0) {
        gameState.extraDrafts--;
        queueDraft();
    }
    if (gameState.player) {
        spawnParticles(gameState.player.pos.x, gameState.player.pos.y, '#FFD54F', 24, 120, 0.7, 3);
        spawnFloatText(gameState.player.pos.x, gameState.player.pos.y - 26, `${BLESSINGS[id].icon} ${BLESSINGS[id].name}`, '#FFD54F', 15, 1.4);
    }
    Sfx.play('pick');
    saveGameState();
    updateUI();
    if (gameState.pendingDraft) openDraft();
}

function renderBlessingList(container) {
    const ids = Object.keys(BLESSINGS).filter(id => bl(id) > 0);
    container.innerHTML = ids.length === 0 ? '<span class="empty-note">—</span>' : ids.map(id =>
        `<span class="bless-chip">${BLESSINGS[id].icon} ${BLESSINGS[id].name}${bl(id) > 1 ? ` ×${bl(id)}` : ''}</span>`).join('');
}

function updateTimers(deltaTime) {
    updateSpawner(deltaTime);
    gameState.novaCooldown = Math.max(0, gameState.novaCooldown - deltaTime);
    if (gameState.streakTimer > 0) {
        gameState.streakTimer -= deltaTime;
        if (gameState.streakTimer <= 0) gameState.streak = 0;
    }
    if (gameState.banner) {
        gameState.banner.life -= deltaTime;
        if (gameState.banner.life <= 0) gameState.banner = null;
    }
    if (gameState.betweenWaves && gameState.currentWave >= 0) {
        gameState.timeToNextWave -= deltaTime;
        if (gameState.timeToNextWave <= 0) {
            prepareNextWave();
        }
        gameState.timeToNextWave = Math.max(0, gameState.timeToNextWave);
    }
}

function showMessage(msg, duration = 2000) {
    if (gameState.messageTimeout) { clearTimeout(gameState.messageTimeout); }
    uiElements.messageArea.textContent = msg;
    uiElements.messageArea.style.display = 'block';
    gameState.messageTimeout = setTimeout(() => {
        uiElements.messageArea.style.display = 'none';
        gameState.messageTimeout = null;
    }, duration);
}

function trySummon(type) {
    let config, cost, currentCount, level, SummonClass, unitName;

    switch (type) {
        case 'SkeletonWarrior':
            config = CONFIG.skeletonWarrior; cost = config.summonCost; unitName = "骷髏戰士";
            currentCount = gameState.skeletonWarriorCount; level = gameState.skeletonWarriorLevel;
            SummonClass = SkeletonWarrior;
            break;
        case 'EyeMonster':
            config = CONFIG.eyeMonster; cost = config.summonCost; unitName = "眼魔";
            currentCount = gameState.eyeMonsterCount; level = gameState.eyeMonsterLevel;
            SummonClass = EyeMonster;
            break;
        case 'Wraith':
            config = CONFIG.wraith; cost = config.summonCost; unitName = "怨靈";
            currentCount = gameState.wraithCount; level = gameState.wraithLevel;
            SummonClass = Wraith;
            break;
        default: return false;
    }

    cost = getSummonCost(config);
    if (gameState.draftOpen) return false;
    if (gameState.souls >= cost) {
        gameState.souls -= cost;
        const spawnPos = gameState.player.getSummonPosition();
        const newSummon = new SummonClass(spawnPos.x, spawnPos.y, level, gameState.player);
        gameState.summons.push(newSummon);
        spawnParticles(spawnPos.x, spawnPos.y, '#7E57C2', 12, 70, 0.5);
        Sfx.play('summon');
        if (gameState.totalSummons.hasOwnProperty(type)) {
            gameState.totalSummons[type]++;
        }
        switch (type) {
            case 'SkeletonWarrior': gameState.skeletonWarriorCount++; break;
            case 'EyeMonster': gameState.eyeMonsterCount++; break;
            case 'Wraith': gameState.wraithCount++; break;
        }
        updateUI();
        ensureMusicPlaying();
        return true;
    } else {
        return false;
    }
}

function announceEvolution(type, tier) {
    const E = CONFIG.evolution;
    const name = E.names[type][tier - 1];
    gameState.banner = {
        text: `${'★'.repeat(tier)} ${name}`,
        sub: E.perks[type][tier - 1],
        color: E.tints[tier - 1],
        life: CONFIG.wave.bannerDuration,
    };
    gameState.summons.forEach(s => {
        if (s.isAlive && s.config.type === type) spawnParticles(s.pos.x, s.pos.y, E.tints[tier - 1], 6, 90, 0.7, 3);
    });
    addShake(4);
    Sfx.play('evolve');
}

function tryUpgrade(type) {
    let cost, costIncrement, costKey, levelKey, unitName;
    switch (type) {
        case 'SkeletonWarrior':
            costKey = 'skeletonWarrior'; levelKey = 'skeletonWarriorLevel'; unitName = "骷髏戰士";
            break;
        case 'EyeMonster':
            costKey = 'eyeMonster'; levelKey = 'eyeMonsterLevel'; unitName = "眼魔";
            break;
        case 'Wraith':
            costKey = 'wraith'; levelKey = 'wraithLevel'; unitName = "怨靈";
            break;
        default: return false;
    }

    if (gameState.draftOpen) return false;
    cost = gameState.currentCosts[costKey];
    costIncrement = CONFIG.upgradeCostIncrements[costKey];

    if (gameState.souls >= cost) {
        gameState.souls -= cost;
        const oldTier = getTier(gameState[levelKey]);
        gameState[levelKey]++;
        const newTier = getTier(gameState[levelKey]);
        gameState.currentCosts[costKey] += costIncrement;
        gameState.summons.forEach(s => {
            if (s.isAlive && s.config.type === type) {
                s.levelUp();
                spawnParticles(s.pos.x, s.pos.y, '#FFD54F', 5, 50, 0.4);
            }
        });
        Sfx.play('upgrade');
        if (newTier > oldTier) announceEvolution(type, newTier);
        updateUI();
        if (newTier === oldTier && (!holdActionState.isHolding || holdActionState.actionType !== 'upgrade')) {
            showMessage(`${unitName} 已升級！ (Lv ${gameState[levelKey]})`);
        }
        ensureMusicPlaying();
        return true;
    } else {
        return false;
    }
}


function handleCanvasPointerDown(event) {
    if (gameState.isPaused || inputState.isPointerDown) return;
    if (event.target !== canvas) return;

    event.preventDefault();
    inputState.isPointerDown = true;
    inputState.pointerId = event.pointerId;
    canvas.setPointerCapture(event.pointerId);

    const pos = getPointerPosition(event);
    inputState.pointerStartPos = pos;
    inputState.pointerCurrentPos = pos;
    inputState.movementVector = { x: 0, y: 0 };
    ensureMusicPlaying();
}

function handleCanvasPointerMove(event) {
    if (gameState.isPaused || !inputState.isPointerDown || event.pointerId !== inputState.pointerId) return;
    if (event.target !== canvas) return;


    const pos = getPointerPosition(event);
    inputState.pointerCurrentPos = pos;
    const deltaX = inputState.pointerCurrentPos.x - inputState.pointerStartPos.x;
    const deltaY = inputState.pointerCurrentPos.y - inputState.pointerStartPos.y;
    const len = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (len > JOYSTICK_DEADZONE) {
        // 搖桿：拉越遠走越快，拉到半徑外就是全速
        const mag = Math.min(1, len / JOYSTICK_RADIUS);
        inputState.movementVector = { x: deltaX / len * mag, y: deltaY / len * mag };
    } else {
        inputState.movementVector = { x: 0, y: 0 };
    }
}

// 虛擬搖桿（CSS px）
const JOYSTICK_RADIUS = 50;
const JOYSTICK_DEADZONE = 6;
function drawJoystick() {
    if (!inputState.isPointerDown) return;
    const s = inputState.pointerStartPos, c = inputState.pointerCurrentPos;
    const dx = c.x - s.x, dy = c.y - s.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const k = len > JOYSTICK_RADIUS ? JOYSTICK_RADIUS / len : 1;
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(s.x, s.y, JOYSTICK_RADIUS, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = '#E1BEE7';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#CE93D8';
    ctx.beginPath(); ctx.arc(s.x + dx * k, s.y + dy * k, 20, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

function handleCanvasPointerUp(event) {
    if (!inputState.isPointerDown || event.pointerId !== inputState.pointerId) return;


    inputState.isPointerDown = false;
    inputState.movementVector = { x: 0, y: 0 };
    canvas.releasePointerCapture(event.pointerId);
    inputState.pointerId = null;
}

function getPointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    const clientX = event.clientX;
    const clientY = event.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
}


function stopHoldActionInternal() {
    if (holdActionState.timeoutId) {
        clearTimeout(holdActionState.timeoutId);
        holdActionState.timeoutId = null;
    }
    if (holdActionState.intervalId) {
        clearInterval(holdActionState.intervalId);
        holdActionState.intervalId = null;
    }
}

function startHoldAction(actionType, unitType) {
    if (gameState.isPaused || gameState.draftOpen || holdActionState.isHolding) return;

    stopHoldActionInternal();

    holdActionState.isHolding = true;
    holdActionState.actionType = actionType;
    holdActionState.unitType = unitType;
    holdActionState.pointerDownTime = performance.now();

    const actionFn = actionType === 'summon' ? trySummon : tryUpgrade;

    holdActionState.timeoutId = setTimeout(() => {
        if (!holdActionState.isHolding || holdActionState.unitType !== unitType || holdActionState.actionType !== actionType) return;

        actionFn(unitType);

        holdActionState.intervalId = setInterval(() => {
            if (!holdActionState.isHolding || holdActionState.unitType !== unitType || holdActionState.actionType !== actionType) {
                stopHoldActionInternal();
                return;
            }
            actionFn(unitType);
        }, CONFIG.holdingButton.repeatInterval);

    }, CONFIG.holdingButton.holdDelay);
}

function stopHoldAction(actionType, unitType) {
    if (holdActionState.isHolding && holdActionState.actionType === actionType && holdActionState.unitType === unitType) {

        const holdDuration = performance.now() - holdActionState.pointerDownTime;
        const actionFn = actionType === 'summon' ? trySummon : tryUpgrade;

        if (holdActionState.timeoutId && holdDuration < CONFIG.holdingButton.holdDelay) {
            clearTimeout(holdActionState.timeoutId);
            holdActionState.timeoutId = null;
            actionFn(unitType);
        }

        stopHoldActionInternal();
        holdActionState.isHolding = false;
        holdActionState.actionType = null;
        holdActionState.unitType = null;
        holdActionState.pointerDownTime = 0;
    } else if (!actionType && !unitType && holdActionState.isHolding) {
        stopHoldActionInternal();
        holdActionState.isHolding = false;
        holdActionState.actionType = null;
        holdActionState.unitType = null;
        holdActionState.pointerDownTime = 0;
    }
}


function updateUI() {
    const souls = gameState.souls;

    if (gameState.player) {
        const p = gameState.player;
        uiElements.playerHealthInfo.textContent = `${p.currentHealth}/${p.maxHealth}`;
        const ratio = p.maxHealth > 0 ? p.currentHealth / p.maxHealth : 0;
        uiElements.hpFill.style.width = `${Math.round(ratio * 100)}%`;
        uiElements.hpFill.className = ratio > 0.5 ? '' : (ratio > 0.2 ? 'mid' : 'low');
    } else {
        uiElements.playerHealthInfo.textContent = '-/-';
    }

    uiElements.soulsInfo.textContent = `靈魂: ${formatNumberK(souls)}`;
    uiElements.waveInfo.textContent = `第${gameState.currentWave}波`;

    if (gameState.betweenWaves && gameState.currentWave >= 0) {
        uiElements.timerInfo.textContent = `下一波: 倒數 ${Math.ceil(gameState.timeToNextWave)} 秒`;
    } else if (!gameState.betweenWaves) {
        uiElements.timerInfo.textContent = `怪物剩餘: ${countRemainingMonsters()}`;
    } else {
        uiElements.timerInfo.textContent = `準備開始`;
    }

    function updateUnitUI(unitType) {
        let config, count, level, summonCost, upgradeCost, uiMap;
        switch (unitType) {
            case 'SkeletonWarrior':
                config = CONFIG.skeletonWarrior; count = gameState.skeletonWarriorCount; level = gameState.skeletonWarriorLevel;
                summonCost = config.summonCost; upgradeCost = gameState.currentCosts.skeletonWarrior;
                uiMap = {
                    level: uiElements.skelLevel, count: uiElements.skelCount,
                    summonBtn: uiElements.summonSkeletonBtn, upgradeBtn: uiElements.upgradeSkeletonBtn
                };
                break;
            case 'EyeMonster':
                config = CONFIG.eyeMonster; count = gameState.eyeMonsterCount; level = gameState.eyeMonsterLevel;
                summonCost = config.summonCost; upgradeCost = gameState.currentCosts.eyeMonster;
                uiMap = {
                    level: uiElements.eyeMonsterLevel, count: uiElements.eyeMonsterCount,
                    summonBtn: uiElements.summonEyeMonsterBtn, upgradeBtn: uiElements.upgradeEyeMonsterBtn
                };
                break;
            case 'Wraith':
                config = CONFIG.wraith; count = gameState.wraithCount; level = gameState.wraithLevel;
                summonCost = config.summonCost; upgradeCost = gameState.currentCosts.wraith;
                uiMap = {
                    level: uiElements.wraithLevel, count: uiElements.wraithCount,
                    summonBtn: uiElements.summonWraithBtn, upgradeBtn: uiElements.upgradeWraithBtn
                };
                break;
            default: return;
        }

        summonCost = getSummonCost(config);
        const tier = getTier(level);
        const nextLv = CONFIG.evolution.levels[tier];
        const levelHtml = `Lv ${level} <span class="stars">${'★'.repeat(tier)}</span>` +
            (nextLv ? `<br><span class="next-evo">${'★'.repeat(tier + 1)} Lv${nextLv}</span>` : '');
        setHtmlIfChanged(uiMap.level, levelHtml);
        uiMap.count.textContent = count;

        uiMap.summonBtn.textContent = `召喚\n(${formatNumberK(summonCost)}魂)`;
        uiMap.upgradeBtn.textContent = `升級\n(${formatNumberK(upgradeCost)}魂)`;

        const canAct = !gameState.isPaused && !gameState.gameOver && !gameState.draftOpen;
        setButtonState(uiMap.summonBtn, canAct, summonCost);
        setButtonState(uiMap.upgradeBtn, canAct, upgradeCost);
    }

    updateUnitUI('SkeletonWarrior');
    updateUnitUI('EyeMonster');
    updateUnitUI('Wraith');

    uiElements.skipWaveBtn.style.display = gameState.betweenWaves && !gameState.gameOver ? '' : 'none';
    updateNovaButton();
    uiElements.pauseResumeBtn.textContent = gameState.isPaused ? '▶ 繼續' : '⏸ 暫停';
    uiElements.pauseResumeBtn.disabled = gameState.gameOver;
    uiElements.restartGameBtn.disabled = gameState.gameOver;
}

// updateUI 每格都跑，innerHTML 只在內容真的變了才寫，避免每格重建 DOM
function setHtmlIfChanged(el, html) {
    if (el.dataset.html === html) return;
    el.innerHTML = html;
    el.dataset.html = html;
}

function updateNovaButton() {
    const btn = uiElements.novaBtn;
    const cd = gameState.novaCooldown;
    btn.disabled = gameState.gameOver || gameState.isPaused || gameState.draftOpen;
    if (cd > 0) {
        const done = (1 - cd / getNovaCooldown()) * 100;
        setHtmlIfChanged(btn, `<span class="nova-icon">💥</span><span>${Math.ceil(cd)}</span>`);
        btn.style.background = `conic-gradient(rgba(156, 39, 176, 0.85) ${done}%, rgba(20, 16, 30, 0.75) ${done}%)`;
        btn.classList.remove('nova-ready');
    } else {
        setHtmlIfChanged(btn, '<span class="nova-icon">💥</span><span>新星</span>');
        btn.style.background = '';
        btn.classList.add('nova-ready');
    }
}

function setButtonState(button, isActionPossible, cost) {
    button.disabled = !isActionPossible;
    if (isActionPossible) {
        if (gameState.souls >= cost) {
            button.classList.add('can-afford');
        } else {
            button.classList.remove('can-afford');
            button.disabled = true;
        }
    } else {
        button.classList.remove('can-afford');
    }
}


function showGameOver() {
    if (gameState.gameOver && uiElements.gameOverScreen.style.display !== 'flex') {
        const survived = Math.max(0, gameState.currentWave - 1);
        uiElements.finalWaveText.textContent = `您存活了 ${survived} 波。`;
        let best = 0;
        try { best = parseInt(localStorage.getItem(BEST_WAVE_KEY), 10) || 0; } catch (e) { }
        const isRecord = survived > best;
        if (isRecord) {
            try { localStorage.setItem(BEST_WAVE_KEY, String(survived)); } catch (e) { }
        }
        uiElements.bestWaveText.textContent = isRecord ? '🏆 新紀錄！' : `最佳紀錄：${best} 波`;
        uiElements.bestWaveText.classList.toggle('new-record', isRecord);
        const kills = Object.values(gameState.totalKills).reduce((a, b) => a + b, 0);
        const summons = Object.values(gameState.totalSummons).reduce((a, b) => a + b, 0);
        uiElements.finalStatsText.textContent = `擊殺 ${formatNumberK(kills)} · 召喚 ${formatNumberK(summons)} · 最高連殺 ${formatNumberK(gameState.bestStreak)}`;
        renderBlessingList(uiElements.finalBlessings);
        uiElements.gameOverScreen.style.display = 'flex';
        localStorage.removeItem(SAVE_KEY);
        updateUI();
        pauseMusic();
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }
}

const SAVE_KEY = 'necromancerGameState_v16_stats_audio';
// 跟存檔分開放：遊戲結束會刪存檔，紀錄要留著
const BEST_WAVE_KEY = 'undeadFrenzy_bestWave';
const SAVE_VERSION = 17;
// v16 是祝福系統之前的存檔，缺的欄位讀取時補預設值即可
const COMPATIBLE_SAVE_VERSIONS = [16, 17];


function saveGameState() {
    if (!gameState.player || gameState.gameOver) return;

    const stateToSave = {
        saveVersion: SAVE_VERSION,
        souls: gameState.souls,
        currentWave: gameState.currentWave,
        timeToNextWave: gameState.timeToNextWave,
        betweenWaves: gameState.betweenWaves,
        playerCurrentHealth: gameState.player.currentHealth,
        playerMaxHealth: gameState.player.maxHealth,
        skeletonWarriorLevel: gameState.skeletonWarriorLevel,
        eyeMonsterLevel: gameState.eyeMonsterLevel,
        wraithLevel: gameState.wraithLevel,
        skeletonWarriorCount: gameState.skeletonWarriorCount,
        eyeMonsterCount: gameState.eyeMonsterCount,
        wraithCount: gameState.wraithCount,
        currentCosts: gameState.currentCosts,
        bgmVolume: gameState.bgmVolume,
        sfxVolume: gameState.sfxVolume,
        totalSummons: gameState.totalSummons,
        totalKills: gameState.totalKills,
        blessings: gameState.blessings,
        pendingDraft: gameState.pendingDraft,
        bestStreak: gameState.bestStreak,
        extraDrafts: gameState.extraDrafts,
    };

    try {
        const savedString = JSON.stringify(stateToSave);
        localStorage.setItem(SAVE_KEY, savedString);
    } catch (error) {
        showMessage("儲存失敗!", 1500);
    }
}

function loadGameState() {
    const savedString = localStorage.getItem(SAVE_KEY);
    if (savedString) {
        let loadedState;
        try { loadedState = JSON.parse(savedString); }
        catch (error) {
            localStorage.removeItem(SAVE_KEY); return false;
        }

        if (!COMPATIBLE_SAVE_VERSIONS.includes(loadedState.saveVersion)) {
            localStorage.removeItem(SAVE_KEY); return false;
        }

        resetGameInternalState(false);

        gameState.souls = loadedState.souls ?? CONFIG.player.initialSouls;
        gameState.currentWave = loadedState.currentWave ?? 0;
        gameState.timeToNextWave = loadedState.timeToNextWave ?? CONFIG.wave.betweenTime;
        gameState.betweenWaves = loadedState.betweenWaves ?? true;
        gameState.currentCosts = loadedState.currentCosts ?? { ...CONFIG.upgradeCosts };

        gameState.skeletonWarriorLevel = loadedState.skeletonWarriorLevel ?? 0;
        gameState.eyeMonsterLevel = loadedState.eyeMonsterLevel ?? 0;
        gameState.wraithLevel = loadedState.wraithLevel ?? 0;
        gameState.skeletonWarriorCount = loadedState.skeletonWarriorCount ?? 0;
        gameState.eyeMonsterCount = loadedState.eyeMonsterCount ?? 0;
        gameState.wraithCount = loadedState.wraithCount ?? 0;

        gameState.bgmVolume = loadedState.bgmVolume ?? CONFIG.audio.initialVolume;
        gameState.sfxVolume = loadedState.sfxVolume ?? CONFIG.audio.initialSfxVolume;
        Sfx.setVolume(gameState.sfxVolume);
        uiElements.sfxSlider.value = gameState.sfxVolume;
        gameState.totalSummons = { ...emptySummonStats(), ...loadedState.totalSummons };
        gameState.totalKills = { ...emptyKillStats(), ...loadedState.totalKills };
        gameState.bestStreak = loadedState.bestStreak ?? 0;
        gameState.blessings = loadedState.blessings ?? {};
        gameState.pendingDraft = loadedState.pendingDraft ?? null;
        gameState.extraDrafts = loadedState.extraDrafts ?? 0;
        // 祝福系統之前的存檔：照已經打過的波數補發當初該拿到的祝福選擇
        if (loadedState.saveVersion < 17 && gameState.currentWave >= CONFIG.draft.every) {
            gameState.extraDrafts = Math.floor(gameState.currentWave / CONFIG.draft.every) - 1;
            queueDraft();
        }

        gameState.player = new Player(0, 0);
        snapCamera();
        gameState.player.maxHealth = loadedState.playerMaxHealth ?? CONFIG.player.baseHealth;
        gameState.player.currentHealth = loadedState.playerCurrentHealth ?? gameState.player.maxHealth;
        gameState.player.maxHealth = Math.max(CONFIG.player.baseHealth, Math.round(gameState.player.maxHealth));
        gameState.player.currentHealth = Math.min(gameState.player.maxHealth, Math.max(0, Math.round(gameState.player.currentHealth)));

        setMusicVolume(gameState.bgmVolume);
        uiElements.volumeSlider.value = gameState.bgmVolume;

        showMessage("讀取存檔成功", 1500);
        return true;

    }
    return false;
}

function restoreSummonsFromLoad() {
    if (!gameState.player) return;
    gameState.summons = [];

    for (let i = 0; i < gameState.skeletonWarriorCount; i++) {
        const spawnPos = getRandomSpawnPosNearPlayer(40);
        const summon = new SkeletonWarrior(spawnPos.x, spawnPos.y, gameState.skeletonWarriorLevel, gameState.player);
        gameState.summons.push(summon);
    }
    for (let i = 0; i < gameState.eyeMonsterCount; i++) {
        const spawnPos = getRandomSpawnPosNearPlayer(40);
        const summon = new EyeMonster(spawnPos.x, spawnPos.y, gameState.eyeMonsterLevel, gameState.player);
        gameState.summons.push(summon);
    }
    for (let i = 0; i < gameState.wraithCount; i++) {
        const spawnPos = getRandomSpawnPosNearPlayer(40);
        const summon = new Wraith(spawnPos.x, spawnPos.y, gameState.wraithLevel, gameState.player);
        gameState.summons.push(summon);
    }
}

function resetGameInternalState(resetAudio = true) {
    if (gameState.messageTimeout) clearTimeout(gameState.messageTimeout);
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
    stopHoldActionInternal();
    holdActionState = { actionType: null, unitType: null, timeoutId: null, intervalId: null, isHolding: false, pointerDownTime: 0 };

    projectilePool.length = 0;
    visualEffectPool.length = 0;

    const currentVolume = gameState.bgmVolume;
    const currentSfxVolume = gameState.sfxVolume;
    const musicWasStarted = gameState.musicStarted;

    gameState = {
        player: null,
        summons: [], monsters: [], projectiles: [], visualEffects: [],
        orbs: [], particles: [], floatTexts: [],
        shake: 0, hurtFlash: 0, soulCarry: 0,
        sfxVolume: currentSfxVolume,
        souls: CONFIG.player.initialSouls,
        currentWave: 0,
        timeToNextWave: CONFIG.wave.betweenTime, betweenWaves: true,
        gameOver: false, isPaused: false,
        lastTime: performance.now(),
        messageTimeout: null,
        skeletonWarriorLevel: 0, eyeMonsterLevel: 0, wraithLevel: 0,
        skeletonWarriorCount: 0, eyeMonsterCount: 0, wraithCount: 0,
        currentCosts: {
            skeletonWarrior: CONFIG.skeletonWarrior.upgradeCostBase,
            eyeMonster: CONFIG.eyeMonster.upgradeCostBase,
            wraith: CONFIG.wraith.upgradeCostBase,
        },
        imagesLoaded: gameState.imagesLoaded,
        bgmVolume: resetAudio ? CONFIG.audio.initialVolume : currentVolume,
        musicStarted: resetAudio ? false : musicWasStarted,
        totalSummons: emptySummonStats(),
        totalKills: emptyKillStats(),
        spawnQueue: [], spawnTimer: 0, banner: null,
        blessings: {}, pendingDraft: null, draftOpen: false, novaCooldown: 0, extraDrafts: 0,
        waveEvent: null, lastEventWave: 0, streak: 0, streakTimer: 0, bestStreak: 0,
    };
    inputState = { isPointerDown: false, pointerStartPos: { x: 0, y: 0 }, pointerCurrentPos: { x: 0, y: 0 }, movementVector: { x: 0, y: 0 }, pointerId: null };
}

function resetGame() {
    localStorage.removeItem(SAVE_KEY);
    resetGameInternalState(true);
    gameState.player = new Player(0, 0);
    snapCamera();
    uiElements.gameOverScreen.style.display = 'none';
    uiElements.pauseMenu.style.display = 'none';
    uiElements.draftScreen.style.display = 'none';
    gameState.isPaused = false;
    gameState.betweenWaves = true;
    gameState.currentWave = 0;
    gameState.timeToNextWave = CONFIG.wave.betweenTime;
    setMusicVolume(CONFIG.audio.initialVolume);
    uiElements.volumeSlider.value = CONFIG.audio.initialVolume;
    updateUI();
    startGameLoop();
}

function updatePauseMenuStats() {
    uiElements.statSummonSkel.textContent = formatNumberK(gameState.totalSummons.SkeletonWarrior);
    uiElements.statSummonEye.textContent = formatNumberK(gameState.totalSummons.EyeMonster);
    uiElements.statSummonWraith.textContent = formatNumberK(gameState.totalSummons.Wraith);
    uiElements.statKillBasic.textContent = formatNumberK(gameState.totalKills.BasicMelee);
    uiElements.statKillFast.textContent = formatNumberK(gameState.totalKills.FastMelee);
    uiElements.statKillArmored.textContent = formatNumberK(gameState.totalKills.ArmoredMelee);
    uiElements.statKillBloater.textContent = formatNumberK(gameState.totalKills.Bloater);
    uiElements.statKillBoss.textContent = formatNumberK(gameState.totalKills.Boss);
    renderBlessingList(uiElements.pauseBlessings);
}

function togglePause() {
    if (gameState.gameOver || gameState.draftOpen) return;

    gameState.isPaused = !gameState.isPaused;
    if (gameState.isPaused) {
        uiElements.pauseResumeBtn.textContent = '繼續';
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        stopHoldAction();

        uiElements.volumeSlider.value = gameState.bgmVolume;
        updatePauseMenuStats();
        uiElements.pauseMenu.style.display = 'flex';
        pauseMusic();

    } else {
        uiElements.pauseMenu.style.display = 'none';
        uiElements.pauseResumeBtn.textContent = '暫停';
        startGameLoop();
        ensureMusicPlaying();
    }
    updateUI();
}

function showRestartConfirmDialog() {
    uiElements.restartConfirmDialog.style.display = 'block';
}

function hideRestartConfirmDialog() {
    uiElements.restartConfirmDialog.style.display = 'none';
}

function handleRestartGame() {
    hideRestartConfirmDialog();
    resetGame();
}

function updateGame(deltaTime) {
    frameNo++;
    updateTimers(deltaTime);

    const wraiths = [];
    let wraithBuffRadius = 0;
    for (let i = 0; i < gameState.summons.length; i++) {
        const s = gameState.summons[i];
        if (s.isAlive && s.config.type === 'Wraith') {
            wraiths.push(s);
            wraithBuffRadius = Math.max(wraithBuffRadius, s.buffRadius);
        }
    }
    gameState.wraithBuffRadius = wraithBuffRadius;
    wraithGrid.rebuild(wraiths);
    summonGrid.rebuild(gameState.summons);
    monsterGrid.rebuild(gameState.monsters);
    rebuildEyeTargetCounts(gameState.summons);

    if (gameState.player) gameState.player.update(deltaTime, getMoveVector());
    updateCamera(deltaTime);

    for (let i = 0; i < gameState.summons.length; i++) {
        if (gameState.summons[i].isAlive) gameState.summons[i].update(deltaTime, gameState.monsters, gameState.summons, gameState.player);
    }
    for (let i = 0; i < gameState.monsters.length; i++) {
        if (gameState.monsters[i].isAlive) gameState.monsters[i].update(deltaTime, gameState.player, gameState.summons);
    }
    for (let i = 0; i < gameState.projectiles.length; i++) {
        if (gameState.projectiles[i].isAlive) gameState.projectiles[i].update(deltaTime);
    }
    for (let i = 0; i < gameState.visualEffects.length; i++) {
        if (gameState.visualEffects[i].isAlive) gameState.visualEffects[i].update(deltaTime);
    }
    if (gameState.player) {
        for (let i = 0; i < gameState.orbs.length; i++) gameState.orbs[i].update(deltaTime, gameState.player);
        gameState.orbs = gameState.orbs.filter(o => o.isAlive);
    }
    updateParticlesAndTexts(deltaTime);


    const liveSummons = [];
    for (let i = 0; i < gameState.summons.length; i++) {
        if (gameState.summons[i].isAlive) liveSummons.push(gameState.summons[i]);
    }
    gameState.summons = liveSummons;

    const liveMonsters = [];
    for (let i = 0; i < gameState.monsters.length; i++) {
        if (gameState.monsters[i].isAlive) liveMonsters.push(gameState.monsters[i]);
    }
    gameState.monsters = liveMonsters;

    const liveProjectiles = [];
    for (let i = 0; i < gameState.projectiles.length; i++) {
        if (gameState.projectiles[i].isAlive) liveProjectiles.push(gameState.projectiles[i]);
        else returnProjectileToPool(gameState.projectiles[i]);
    }
    gameState.projectiles = liveProjectiles;

    const liveEffects = [];
    for (let i = 0; i < gameState.visualEffects.length; i++) {
        if (gameState.visualEffects[i].isAlive) liveEffects.push(gameState.visualEffects[i]);
        else returnVisualEffectToPool(gameState.visualEffects[i]);
    }
    gameState.visualEffects = liveEffects;


    checkWaveEndCondition();
}

function updateParticlesAndTexts(deltaTime) {
    const ps = gameState.particles;
    for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        p.life -= deltaTime;
        p.x += p.vx * deltaTime; p.y += p.vy * deltaTime;
        p.vx *= 0.94; p.vy *= 0.94;
    }
    gameState.particles = ps.filter(p => p.life > 0);
    const ft = gameState.floatTexts;
    for (let i = 0; i < ft.length; i++) { ft[i].life -= deltaTime; ft[i].y -= 28 * deltaTime; }
    gameState.floatTexts = ft.filter(t => t.life > 0);
    gameState.shake = Math.max(0, gameState.shake - CONFIG.visuals.shakeDecayPerSec * deltaTime);
    gameState.hurtFlash = Math.max(0, gameState.hurtFlash - deltaTime);
}

// ---------- 地板：無縫重複的石板（有 ground_tile.png 就用它） ----------
const GROUND_TILE_UNITS = 480;
const GROUND_TILE_RES = 2;
let groundPattern = null;
function buildGroundTile() {
    const S = GROUND_TILE_UNITS * GROUND_TILE_RES;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    if (images.ground) {
        g.drawImage(images.ground, 0, 0, S, S);
        return c;
    }
    // 程式畫的備用地板：暗色、低對比、大小不一的石板，角色才跳得出來。
    // 每塊石板也畫在上下左右錯開一整張的位置，跨邊界的石板接得起來，重複時看不出接縫
    let seed = 11;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    g.fillStyle = '#2a2622';
    g.fillRect(0, 0, S, S);
    const rows = 7;
    const rowH = S / rows;
    const gap = 4 * GROUND_TILE_RES;
    const stones = [];
    for (let r = 0; r < rows; r++) {
        // 每一排的石板寬度不一；最後一塊補到剛好一整張寬，橫向才接得起來
        let x = rnd() * rowH;
        const startX = x;
        while (x < startX + S - rowH * 0.6) {
            const w = Math.min(rowH * (0.8 + rnd() * 1.0), startX + S - x);
            stones.push({ x, y: r * rowH, w, h: rowH, shade: rnd() });
            x += w;
        }
        stones.push({ x, y: r * rowH, w: startX + S - x, h: rowH, shade: rnd() });
    }
    const drawStone = (s, ox, oy) => {
        const x0 = s.x + ox + gap / 2, y0 = s.y + oy + gap / 2, w = s.w - gap, h = s.h - gap;
        if (w <= 0 || h <= 0) return;
        const rad = Math.min(14 * GROUND_TILE_RES, w / 3, h / 3);
        const base = 62 + Math.floor(s.shade * 14);
        g.fillStyle = `rgb(${base}, ${base - 4}, ${base - 12})`;
        g.beginPath();
        g.moveTo(x0 + rad, y0); g.arcTo(x0 + w, y0, x0 + w, y0 + h, rad); g.arcTo(x0 + w, y0 + h, x0, y0 + h, rad);
        g.arcTo(x0, y0 + h, x0, y0, rad); g.arcTo(x0, y0, x0 + w, y0, rad); g.closePath();
        g.fill();
        g.strokeStyle = 'rgba(255, 245, 220, 0.05)';
        g.lineWidth = 2 * GROUND_TILE_RES;
        g.stroke();
    };
    for (const s of stones) {
        for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) drawStone(s, ox, oy);
    }
    // 零星的苔痕與碎石點，打散重複感
    for (let i = 0; i < 140; i++) {
        g.fillStyle = rnd() < 0.5 ? 'rgba(0, 0, 0, 0.12)' : 'rgba(120, 140, 90, 0.06)';
        const r = (1 + rnd() * 4) * GROUND_TILE_RES;
        g.beginPath(); g.arc(rnd() * S, rnd() * S, r, 0, Math.PI * 2); g.fill();
    }
    return c;
}
function drawGround() {
    if (!groundPattern) {
        groundPattern = ctx.createPattern(buildGroundTile(), 'repeat');
        if (groundPattern.setTransform) groundPattern.setTransform(new DOMMatrix().scale(1 / GROUND_TILE_RES));
    }
    ctx.fillStyle = groundPattern;
    ctx.fillRect(camera.x - CULL_MARGIN, camera.y - CULL_MARGIN, view.w + CULL_MARGIN * 2, view.h + CULL_MARGIN * 2);
}

// 畫在畫面上（不跟著鏡頭）的資訊，用 CSS px 座標；HUD_TOP 以下才畫，避開上方的狀態列
let hudTop = 56;
// 上方狀態列底部有一段漸層淡出，畫面上的資訊從漸層開始處就可以畫
const HUD_TOP_FADE_PX = 0;
function setScreenTransform() {
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
}

function drawEventOverlay() {
    const ev = getWaveEvent();
    if (!ev) return;
    if (ev.overlay) {
        ctx.fillStyle = ev.overlay;
        ctx.fillRect(0, 0, view.cssW, view.cssH);
    }
    ctx.save();
    ctx.textAlign = 'left';
    ctx.font = 'bold 14px sans-serif';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    const label = `${ev.icon} ${ev.name}`;
    ctx.strokeText(label, 10, hudTop + 18);
    ctx.fillStyle = ev.color;
    ctx.fillText(label, 10, hudTop + 18);
    ctx.restore();
}

function drawStreak() {
    if (gameState.streak < CONFIG.streak.showFrom) return;
    const bonus = getStreakBonus();
    const fade = Math.min(1, gameState.streakTimer / CONFIG.streak.window * 3);
    ctx.save();
    ctx.globalAlpha = 0.4 + 0.6 * fade;
    ctx.textAlign = 'right';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.font = 'bold 18px sans-serif';
    const label = `🔥 ${gameState.streak}`;
    ctx.strokeText(label, view.cssW - 10, hudTop + 20);
    ctx.fillStyle = '#FFAB40';
    ctx.fillText(label, view.cssW - 10, hudTop + 20);
    if (bonus > 0) {
        ctx.font = 'bold 12px sans-serif';
        ctx.lineWidth = 3;
        const b = `靈魂 +${pct(bonus)}`;
        ctx.strokeText(b, view.cssW - 10, hudTop + 36);
        ctx.fillStyle = '#80DEEA';
        ctx.fillText(b, view.cssW - 10, hudTop + 36);
    }
    ctx.restore();
}

function drawBossBar() {
    const boss = getAliveBoss();
    if (!boss) return;
    const w = Math.min(view.cssW * 0.5, 320), h = 8;
    const x = (view.cssW - w) / 2, y = hudTop + 22;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px sans-serif';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    const label = `${boss.config.name} Lv${boss.tier}`;
    ctx.strokeText(label, view.cssW / 2, y - 5);
    ctx.fillStyle = '#E1BEE7';
    ctx.fillText(label, view.cssW / 2, y - 5);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = '#8E24AA';
    ctx.fillRect(x, y, w * boss.currentHealth / boss.maxHealth, h);
    ctx.restore();
}

function drawBanner() {
    const b = gameState.banner;
    if (!b) return;
    const total = CONFIG.wave.bannerDuration;
    const t = total - b.life;
    const alpha = Math.min(1, t * 4, b.life * 2.5);
    const scale = 1 + Math.max(0, 0.25 - t) * 1.5;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(view.cssW / 2, view.cssH * 0.36);
    ctx.scale(scale, scale);
    ctx.textAlign = 'center';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.font = 'bold 40px sans-serif';
    ctx.strokeText(b.text, 0, 0);
    ctx.fillStyle = b.color;
    ctx.fillText(b.text, 0, 0);
    if (b.sub) {
        ctx.font = 'bold 18px sans-serif';
        ctx.lineWidth = 4;
        ctx.strokeText(b.sub, 0, 30);
        ctx.fillText(b.sub, 0, 30);
    }
    ctx.restore();
}

function drawGame() {
    ctx.save();
    if (gameState.shake > 0) {
        drawOffset.x = (Math.random() * 2 - 1) * gameState.shake;
        drawOffset.y = (Math.random() * 2 - 1) * gameState.shake;
    } else {
        drawOffset.x = 0; drawOffset.y = 0;
    }
    const z = view.zoom;
    ctx.setTransform(z, 0, 0, z, (-camera.x + drawOffset.x) * z, (-camera.y + drawOffset.y) * z);
    drawGround();
    for (let i = 0; i < gameState.orbs.length; i++) if (inView(gameState.orbs[i].pos)) gameState.orbs[i].draw(ctx);

    drawAuraLayer();

    for (let i = 0; i < gameState.monsters.length; i++) {
        const m = gameState.monsters[i];
        if (m.isAlive && (inView(m.pos) || m instanceof BossMonster)) m.draw(ctx);
    }
    for (let i = 0; i < gameState.summons.length; i++) {
        const s = gameState.summons[i];
        if (s.isAlive && inView(s.pos)) s.draw(ctx);
    }
    for (let i = 0; i < gameState.projectiles.length; i++) {
        const pr = gameState.projectiles[i];
        if (pr.isAlive && inView(pr.pos)) pr.draw(ctx);
    }
    if (gameState.player && gameState.player.isAlive) gameState.player.draw(ctx);

    for (let i = 0; i < gameState.visualEffects.length; i++) {
        if (gameState.visualEffects[i].isAlive) gameState.visualEffects[i].draw(ctx);
    }
    const ps = gameState.particles;
    for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        if (!inView(p)) continue;
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    for (const t of gameState.floatTexts) {
        ctx.globalAlpha = Math.min(1, t.life / t.maxLife * 2);
        ctx.font = `bold ${t.size}px sans-serif`;
        ctx.strokeText(t.text, t.x, t.y);
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    setScreenTransform();
    drawEventOverlay();
    drawBossBar();
    drawStreak();
    drawBanner();
    drawJoystick();

    if (gameState.hurtFlash > 0) {
        const a = gameState.hurtFlash / CONFIG.visuals.hurtFlashDuration;
        const W = view.cssW, H = view.cssH;
        const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.65);
        g.addColorStop(0, 'rgba(200,0,0,0)');
        g.addColorStop(1, `rgba(200,0,0,${(0.45 * a).toFixed(2)})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}


let animationFrameId = null;
function gameLoop(currentTime) {
    if (!gameState.imagesLoaded) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText("Loading Images...", canvas.width / 2, canvas.height / 2);
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }

    if (gameState.gameOver) {
        showGameOver();
        animationFrameId = null;
        return;
    }

    if (gameState.isPaused) {
        animationFrameId = null;
        return;
    }

    let deltaTime = (currentTime - gameState.lastTime) / 1000;
    deltaTime = Math.min(deltaTime, 0.1);
    gameState.lastTime = currentTime;

    if (!gameState.draftOpen) updateGame(deltaTime);
    drawGame();
    updateUI();

    animationFrameId = requestAnimationFrame(gameLoop);
}

function startGameLoop() {
    if (animationFrameId === null && !gameState.isPaused && !gameState.gameOver) {
        gameState.lastTime = performance.now();
        if (!document.hidden) {
            ensureMusicPlaying();
        }
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

function ensureMusicPlaying() {
    Sfx.unlock();
    if (document.hidden || gameState.isPaused || gameState.gameOver) return;
    if (!gameState.musicStarted && uiElements.bgm) {
        uiElements.bgm.play().then(() => {
            gameState.musicStarted = true;
        }).catch(error => {
            gameState.musicStarted = false;
        });
    } else if (gameState.musicStarted && uiElements.bgm && uiElements.bgm.paused) {
        uiElements.bgm.play().catch(e => { });
    }
}

function pauseMusic() {
    if (uiElements.bgm) {
        uiElements.bgm.pause();
    }
}

function setMusicVolume(volume) {
    gameState.bgmVolume = Math.max(0, Math.min(1, volume));
    if (uiElements.bgm) {
        uiElements.bgm.volume = gameState.bgmVolume;
    }
}

function handleVisibilityChange() {
    if (document.hidden) {
        if (gameState.musicStarted && !gameState.isPaused && !gameState.gameOver) {
            pauseMusic();
        }
    } else {
        if (gameState.musicStarted && !gameState.isPaused && !gameState.gameOver) {
            ensureMusicPlaying();
        }
    }
}

function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', resizeCanvas);
    setMusicVolume(gameState.bgmVolume);
    uiElements.volumeSlider.value = gameState.bgmVolume;

    canvas.addEventListener('pointerdown', handleCanvasPointerDown);
    canvas.addEventListener('pointermove', handleCanvasPointerMove);
    canvas.addEventListener('pointerup', handleCanvasPointerUp);
    canvas.addEventListener('pointercancel', handleCanvasPointerUp);
    canvas.addEventListener('pointerleave', handleCanvasPointerUp);

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const setupHoldableButton = (button, actionType, unitType) => {
        button.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            button.setPointerCapture(e.pointerId);
            startHoldAction(actionType, unitType);
            ensureMusicPlaying();
        });
        button.addEventListener('pointerup', (e) => {
            stopHoldAction(actionType, unitType);
            if (button.hasPointerCapture(e.pointerId)) {
                button.releasePointerCapture(e.pointerId);
            }
        });
        button.addEventListener('pointerleave', (e) => {
            if (holdActionState.isHolding && holdActionState.actionType === actionType && holdActionState.unitType === unitType) {
                stopHoldAction(actionType, unitType);
                if (button.hasPointerCapture(e.pointerId)) {
                    try { button.releasePointerCapture(e.pointerId); } catch (err) { }
                }
            }
        });
        button.addEventListener('pointercancel', (e) => {
            if (holdActionState.isHolding && holdActionState.actionType === actionType && holdActionState.unitType === unitType) {
                stopHoldAction(actionType, unitType);
                if (button.hasPointerCapture(e.pointerId)) {
                    try { button.releasePointerCapture(e.pointerId); } catch (err) { }
                }
            }
        });
    };

    setupHoldableButton(uiElements.summonSkeletonBtn, 'summon', 'SkeletonWarrior');
    setupHoldableButton(uiElements.summonEyeMonsterBtn, 'summon', 'EyeMonster');
    setupHoldableButton(uiElements.summonWraithBtn, 'summon', 'Wraith');

    setupHoldableButton(uiElements.upgradeSkeletonBtn, 'upgrade', 'SkeletonWarrior');
    setupHoldableButton(uiElements.upgradeEyeMonsterBtn, 'upgrade', 'EyeMonster');
    setupHoldableButton(uiElements.upgradeWraithBtn, 'upgrade', 'Wraith');


    uiElements.restartButton.addEventListener('click', resetGame);
    uiElements.pauseResumeBtn.addEventListener('click', togglePause);
    uiElements.resumeGameBtn.addEventListener('click', togglePause);
    uiElements.volumeSlider.addEventListener('input', (e) => {
        setMusicVolume(parseFloat(e.target.value));
    });
    uiElements.volumeSlider.addEventListener('change', () => {
        if (!gameState.isPaused) return;
        saveGameState();
    });
    uiElements.sfxSlider.value = gameState.sfxVolume;
    uiElements.sfxSlider.addEventListener('input', (e) => {
        gameState.sfxVolume = parseFloat(e.target.value);
        Sfx.unlock();
        Sfx.setVolume(gameState.sfxVolume);
        Sfx.play('orb');
    });
    uiElements.sfxSlider.addEventListener('change', () => {
        if (gameState.isPaused) saveGameState();
    });

    uiElements.novaBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); useNova(); });

    window.addEventListener('keydown', (e) => {
        if (gameState.draftOpen) {
            const idx = ['Digit1', 'Digit2', 'Digit3'].indexOf(e.code);
            if (idx >= 0 && gameState.pendingDraft && gameState.pendingDraft.options[idx]) pickBlessing(gameState.pendingDraft.options[idx]);
            return;
        }
        if (e.code === 'Escape' || e.code === 'KeyP') { togglePause(); return; }
        if (gameState.isPaused || gameState.gameOver) return;
        if (e.code === 'Space') { e.preventDefault(); useNova(); return; }
        if (MOVE_KEYS[e.code]) { keysDown.add(e.code); e.preventDefault(); ensureMusicPlaying(); return; }
        const unit = UNIT_HOTKEYS[e.code];
        if (unit) { e.shiftKey ? tryUpgrade(unit) : trySummon(unit); }
    });
    window.addEventListener('keyup', (e) => keysDown.delete(e.code));
    window.addEventListener('blur', () => keysDown.clear());

    uiElements.skipWaveBtn.addEventListener('click', () => {
        if (gameState.betweenWaves && !gameState.isPaused && !gameState.gameOver) {
            gameState.timeToNextWave = 0;
            ensureMusicPlaying();
        }
    });
    uiElements.restartGameBtn.addEventListener('click', showRestartConfirmDialog);
    uiElements.restartConfirmYes.addEventListener('click', handleRestartGame);
    uiElements.restartConfirmNo.addEventListener('click', hideRestartConfirmDialog);

    loadAllImages().then(() => {
        if (loadGameState()) {
            restoreSummonsFromLoad();
            updateUI();
            if (gameState.pendingDraft) openDraft();
            if (!document.hidden) {
                ensureMusicPlaying();
            }
            if (gameState.isPaused) {
                uiElements.volumeSlider.value = gameState.bgmVolume;
                updatePauseMenuStats();
                uiElements.pauseMenu.style.display = 'flex';
            } else {
                startGameLoop();
            }
        } else {
            resetGame();
        }
    }).catch(err => {
        ctx.fillStyle = '#AF0000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.font = '16px sans-serif';
        ctx.fillText("錯誤：圖片載入失敗，請檢查檔案並重新整理。", canvas.width / 2, canvas.height / 2);
    });

    requestAnimationFrame(gameLoop);

}

init();