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

const $id = (id) => document.getElementById(id);
const uiElements = {
    hud: $id('hud'),
    hudTop: $id('hud-top'),
    waveInfo: $id('wave-info'),
    timerInfo: $id('timer-info'),
    wavePlate: $id('wave-plate'),
    hudBottom: $id('hud-bottom'),
    victoryScreen: $id('victory-screen'), victoryReward: $id('victory-reward'), victoryUnlock: $id('victory-unlock'),
    victoryContinueBtn: $id('victory-continue-btn'), victoryEndBtn: $id('victory-end-btn'),
    titleCurseBtn: $id('title-curse-btn'), curseScreen: $id('curse-screen'), curseList: $id('curse-list'),
    curseLevel: $id('curse-level'), curseMult: $id('curse-mult'), curseMinus: $id('curse-minus'), cursePlus: $id('curse-plus'),
    curseCloseBtn: $id('curse-close-btn'),
    pauseReward: $id('pause-reward'),
    gameoverTitle: $id('gameover-title'),
    soulsInfo: $id('souls-info'),
    playerHealthInfo: $id('player-health-info'),
    hpFill: $id('hp-fill'),
    skelLevel: $id('skel-level'), skelStars: $id('skel-stars'), skelCount: $id('skel-count'),
    summonSkeletonBtn: $id('summon-skeleton-btn'), upgradeSkeletonBtn: $id('upgrade-skeleton-btn'),
    eyeMonsterLevel: $id('eye-monster-level'), eyeMonsterStars: $id('eye-monster-stars'), eyeMonsterCount: $id('eye-monster-count'),
    summonEyeMonsterBtn: $id('summon-eye-monster-btn'), upgradeEyeMonsterBtn: $id('upgrade-eye-monster-btn'),
    wraithLevel: $id('wraith-level'), wraithStars: $id('wraith-stars'), wraithCount: $id('wraith-count'),
    summonWraithBtn: $id('summon-wraith-btn'), upgradeWraithBtn: $id('upgrade-wraith-btn'),
    pauseResumeBtn: $id('pause-resume-btn'),
    skipWaveBtn: $id('skip-wave-btn'),
    holdCombo: $id('hold-combo'),
    finalKiller: $id('final-killer'),
    novaBtn: $id('nova-btn'),
    messageArea: $id('message-area'),
    titleScreen: $id('title-screen'),
    titleContinueBtn: $id('title-continue-btn'),
    titleStartBtn: $id('title-start-btn'),
    titleMetaBtn: $id('title-meta-btn'),
    titleSettingsBtn: $id('title-settings-btn'),
    titleBest: $id('title-best'),
    metaScreen: $id('meta-screen'),
    metaList: $id('meta-list'),
    metaCrystals: $id('meta-crystals'),
    metaCloseBtn: $id('meta-close-btn'),
    settingsScreen: $id('settings-screen'),
    settingsCloseBtn: $id('settings-close-btn'),
    volumeSlider: $id('volume-slider'),
    sfxSlider: $id('sfx-slider'),
    pauseVolumeSlider: $id('pause-volume-slider'),
    pauseSfxSlider: $id('pause-sfx-slider'),
    draftScreen: $id('draft-screen'),
    draftCards: $id('draft-cards'),
    rerollBtn: $id('reroll-btn'),
    pauseMenu: $id('pause-menu'),
    pauseBlessings: $id('pause-blessings'),
    resumeGameBtn: $id('resume-game-btn'),
    pauseTitleBtn: $id('pause-title-btn'),
    restartGameBtn: $id('restart-game-btn'),
    statSummonSkel: $id('stat-summon-skel'),
    statSummonEye: $id('stat-summon-eye'),
    statSummonWraith: $id('stat-summon-wraith'),
    gameOverScreen: $id('game-over-screen'),
    finalWaveText: $id('final-wave-text'),
    bestWaveText: $id('best-wave-text'),
    finalKills: $id('final-kills'),
    finalSummons: $id('final-summons'),
    finalStreak: $id('final-streak'),
    finalReward: $id('final-reward'),
    finalBlessings: $id('final-blessings'),
    restartButton: $id('restart-button'),
    gameoverTitleBtn: $id('gameover-title-btn'),
    gameoverMetaBtn: $id('gameover-meta-btn'),
    confirmDialog: $id('confirm-dialog'),
    confirmTitle: $id('confirm-title'),
    confirmText: $id('confirm-text'),
    confirmYes: $id('confirm-yes'),
    confirmNo: $id('confirm-no'),
    bgm: $id('bgm'),
};

const CONFIG = {
    player: {
        baseHealth: 50, baseMoveSpeed: 90, radius: 12, color: '#03A9F4',
        imageName: 'player', imgScaleMultiplier: 4,
        initialSouls: 20,
        // 法師自己會打：每 boltInterval 秒對 boltRange 內最近的怪射一顆靈魂彈。
        // 傷害乘上怪物的波數成長倍率，任何一波都是兩三發打死一隻血狼——前期兵少時能自保、清掉落單的，
        // 但永遠只是補刀，主力還是召喚物
        boltDamage: 5, boltInterval: 0.65, boltRange: 150,
        bolt: { projectileRadius: 3, projectileColor: '#7FF0F0', projectileSpeed: 340, boltStyle: 'soul' },
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
        projectileColor: '#F06292', boltStyle: 'eye',
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
        type: 'BasicMelee', name: '血狼', baseHealth: 12, baseAttack: 4, radius: 12,
        imageName: 'basic_melee', imgScaleMultiplier: 5,
        attackRange: 20, attackSpeed: 1.0, moveSpeed: 50, color: '#EF5350',
        soulDrop: 1, waveSpeedIncreaseFactor: 0.01,
    },
    fastMeleeMonster: {
        type: 'FastMelee', name: '赤鷲', baseHealth: 20, baseAttack: 6, radius: 11,
        imageName: 'fast_melee', imgScaleMultiplier: 3,
        attackRange: 18, attackSpeed: 1.2, moveSpeed: 95, color: '#FF7043',
        soulDrop: 2, waveSpeedIncreaseFactor: 0.012,
        minWave: 4, waveInterval: 2,
    },
    bloaterMonster: {
        type: 'Bloater', name: '腐屍', baseHealth: 18, baseAttack: 14, radius: 12,
        imageName: 'basic_melee', art: 'bloater', imgScaleMultiplier: 5.5, artScale: 4, tint: '#7CB342', tintStrength: 0.55,
        attackRange: 22, attackSpeed: 1.0, moveSpeed: 62, color: '#7CB342',
        soulDrop: 2, waveSpeedIncreaseFactor: 0.01,
        minWave: 8, waveInterval: 3,
        // 貼上目標後先膨脹一下才爆，給召喚物一個把它打掉的空檔
        fuseTime: 0.6, blastRadius: 42,
    },
    armoredMeleeMonster: {
        type: 'ArmoredMelee', name: '血牙野豬', baseHealth: 90, baseAttack: 18, radius: 15,
        imageName: 'armored_melee', imgScaleMultiplier: 6,
        attackRange: 22, attackSpeed: 0.8, moveSpeed: 30, color: '#B71C1C',
        soulDrop: 5, waveSpeedIncreaseFactor: 0.008,
        minWave: 9, waveInterval: 4,
    },
    boss: {
        type: 'Boss', name: '骸骨巨像', baseHealth: 500, baseAttack: 22, radius: 26,
        imageName: 'armored_melee', art: 'boss_colossus', imgScaleMultiplier: 4.5, tint: '#AB47BC', tintStrength: 0.5,
        attackRange: 32, attackSpeed: 0.6, moveSpeed: 30, color: '#AB47BC',
        soulDrop: 40, waveSpeedIncreaseFactor: 0.004,
        slamInterval: 5, slamWindup: 1.1, slamRadius: 80, slamDamageMult: 1.0,
        // 首領只吃一半的緩速，不然一隻怨靈就能把它定在原地
        slowResist: 0.5,
    },
    plagueBoss: {
        type: 'Boss', name: '疫病母巢', baseHealth: 600, baseAttack: 18, radius: 24,
        imageName: 'basic_melee', art: 'boss_plague', imgScaleMultiplier: 6.5, artScale: 5, tint: '#33691E', tintStrength: 0.6,
        attackRange: 30, attackSpeed: 0.8, moveSpeed: 26, color: '#33691E',
        soulDrop: 45, waveSpeedIncreaseFactor: 0.004,
        spawnInterval: 4, spawnCountBase: 3, spawnCountPerTier: 1, spawnRadius: 40,
        slowResist: 0.5,
    },
    hunterBoss: {
        type: 'Boss', name: '暗影獵手', baseHealth: 450, baseAttack: 26, radius: 20,
        imageName: 'fast_melee', art: 'boss_hunter', imgScaleMultiplier: 4.2, artScale: 5, tint: '#311B92', tintStrength: 0.6,
        attackRange: 26, attackSpeed: 1.2, moveSpeed: 55, color: '#311B92',
        soulDrop: 45, waveSpeedIncreaseFactor: 0.006,
        // 先畫一條預警線，再沿線高速衝過去，路上的召喚物 / 法師都吃傷害
        dashInterval: 4.5, dashWindup: 0.8, dashDistance: 260, dashSpeed: 700, dashWidth: 28,
        dashDamageMult: 1.5, dashTriggerRange: 300,
        slowResist: 0.5,
    },
    thief: {
        type: 'Thief', name: '金魂竊賊', baseHealth: 60, baseAttack: 0, radius: 11,
        imageName: 'fast_melee', art: 'thief', imgScaleMultiplier: 3, artScale: 4.5, tint: '#FFC107', tintStrength: 0.55,
        // 要比法師（90）和骷髏（80）慢，帶著大軍追得上才有意思
        attackRange: 0, attackSpeed: 1, moveSpeed: 60, color: '#FFC107',
        soulDrop: 20, soulPerWave: 2, waveSpeedIncreaseFactor: 0.005,
        // lifetime 秒後掉頭逃跑；逃 escapeTime 秒還沒跑出畫面就原地化成煙（不掉靈魂）
        lifetime: 20, escapeTime: 5, leashRadius: 260,
    },
    assassin: {
        type: 'Assassin', name: '暗影刺客', baseHealth: 40, baseAttack: 0, radius: 11,
        imageName: 'fast_melee', art: 'assassin', imgScaleMultiplier: 3, artScale: 3.5, tint: '#5E35B1', tintStrength: 0.6,
        // attackRange 只用來決定她在法師身邊多遠停下來等瞬移，她本身不普攻
        attackRange: 90, attackSpeed: 1, moveSpeed: 68, color: '#5E35B1',
        soulDrop: 6, waveSpeedIncreaseFactor: 0.006,
        minWave: 12, waveInterval: 7,
        // 潛行時召喚物看不到她（見 SpatialGrid.rebuild），只在蓄力到刺完後現形的那段時間會被大軍圍毆，所以每隻幾乎都會出手一次。
        // 不理召喚物、只找法師：靠近後在法師腳下標記，蓄力完瞬移過去刺一刀。
        // 傷害是法師最大生命的固定比例、不隨波數變大：站著不動才會中，一直走一定閃得掉（走速 90 × 蓄力 0.75 秒 ≫ 判定半徑）
        blinkRange: 200, blinkCooldown: 4.5, blinkWindup: 0.75, strikeRadius: 34, strikeHpRatio: 0.3,
        // 平常半透明（潛行），蓄力到瞬移後這段時間現形
        stealthAlpha: 0.5, revealTime: 1.5,
    },
    spitter: {
        type: 'Spitter', name: '瘟疫投手', baseHealth: 30, baseAttack: 5, radius: 12,
        // 沒有專屬圖：借疫病母巢的圖縮小、染紫，跟首領分得開
        imageName: 'basic_melee', art: 'boss_plague', imgScaleMultiplier: 5, artScale: 3.6, tint: '#8E24AA', tintStrength: 0.5, keepTintOnArt: true,
        // attackRange = 站在多遠外丟毒（不貼身），attackSpeed = 每秒丟幾次
        attackRange: 170, attackSpeed: 0.28, moveSpeed: 45, color: '#8E24AA',
        soulDrop: 3, waveSpeedIncreaseFactor: 0.006,
        // 第 21 波＝首領後的喘息波，怪少，新敵人在這時候登場比較好學
        minWave: 21, waveInterval: 4,
        // 往目標丟一團毒：落點先出現預警圈，飛行 lobTime 秒後變成毒池，持續 puddleLife 秒，每 puddleTick 秒對圈內的召喚物與法師造成傷害。
        // 懲罰大軍擠成一團、法師站著不動。
        // 對法師的傷害是最大生命的固定比例（同刺客）：照怪物攻擊算的話第 30 波站進去 1.5 秒就死，完全來不及反應
        throwWindup: 0.45, lobTime: 1.0, puddleRadius: 40, puddleLife: 3, puddleTick: 0.5, puddleDamageMult: 0.4, puddlePlayerHpRatio: 0.06,
    },
    slime: {
        type: 'Slime', name: '瘟膿史萊姆', baseHealth: 24, baseAttack: 4, radius: 13,
        imageName: 'basic_melee', art: 'slime', imgScaleMultiplier: 4, artScale: 3.2, tint: '#C0CA33', tintStrength: 0.6,
        attackRange: 20, attackSpeed: 1, moveSpeed: 42, color: '#C0CA33',
        soulDrop: 1, waveSpeedIncreaseFactor: 0.008,
        minWave: 8, waveInterval: 3,
        // 打死分裂成 splitCount 隻小的，最多分 generations 代；小的血少、體型小、跑比較快
        splitCount: 2, generations: 2, childHpMult: 0.45, childScale: 0.72, childSpeedMult: 1.2,
    },
    bat: {
        type: 'Bat', name: '吸血蝙蝠群', baseHealth: 7, baseAttack: 2, radius: 8,
        imageName: 'fast_melee', art: 'bat', imgScaleMultiplier: 3, artScale: 4.2, tint: '#5D4037', tintStrength: 0.6,
        attackRange: 16, attackSpeed: 1.2, moveSpeed: 115, color: '#5D4037',
        soulDrop: 1, waveSpeedIncreaseFactor: 0.004,
        // 一單位 = 一群 flockSize 隻；不理召喚物、直撲法師。
        // 咬法師扣固定比例：照攻擊力算的話第 40 波一群一秒就咬死法師，而牠們比法師快、跑不掉
        minWave: 16, waveInterval: 4, flockSize: 6, wobble: 0.6, playerHpRatio: 0.03,
    },
    witchDoctor: {
        type: 'WitchDoctor', name: '腐骨巫醫', baseHealth: 35, baseAttack: 0, radius: 12,
        imageName: 'basic_melee', art: 'witch_doctor', imgScaleMultiplier: 5, artScale: 3.8, tint: '#689F38', tintStrength: 0.5,
        // attackRange = 站在多遠外施法，attackSpeed = 每秒補幾次血
        attackRange: 150, attackSpeed: 0.25, moveSpeed: 40, color: '#689F38',
        soulDrop: 4, waveSpeedIncreaseFactor: 0.006,
        minWave: 15, waveInterval: 6, healRadius: 100, healRatio: 0.25,
    },
    shieldGuard: {
        type: 'ShieldGuard', name: '骨盾衛兵', baseHealth: 60, baseAttack: 8, radius: 14,
        imageName: 'armored_melee', art: 'shield_guard', imgScaleMultiplier: 6, artScale: 3.4, tint: '#607D8B', tintStrength: 0.5,
        attackRange: 22, attackSpeed: 0.8, moveSpeed: 34, color: '#607D8B',
        soulDrop: 4, waveSpeedIncreaseFactor: 0.006,
        // 眼魔飛彈打在牠身上只剩 (1 - projectileBlock)：只出眼魔會被剋，要混骷髏近戰
        minWave: 18, waveInterval: 5, projectileBlock: 0.85,
    },
    corpseWorm: {
        type: 'CorpseWorm', name: '屍蟲', baseHealth: 70, baseAttack: 10, radius: 16,
        imageName: 'armored_melee', art: 'corpse_worm', imgScaleMultiplier: 6, artScale: 4.5, tint: '#9E9E9E', tintStrength: 0.5,
        attackRange: 0, attackSpeed: 1, moveSpeed: 75, color: '#9E9E9E',
        soulDrop: 6, waveSpeedIncreaseFactor: 0.004,
        // 地底移動 burrowTime 秒（打不到）→ 地面預警 warnTime 秒 → 竄出傷害一圈 → 露在地面 surfaceTime 秒（這時才打得到）→ 再鑽下去
        minWave: 28, waveInterval: 6,
        burrowTime: 3.5, warnTime: 0.9, eruptRadius: 55, eruptDamageMult: 2.5, eruptPlayerHpRatio: 0.25, surfaceTime: 3,
    },
    gravePriest: {
        type: 'GravePriest', name: '墓地祭司', baseHealth: 45, baseAttack: 0, radius: 12,
        imageName: 'wraith', art: 'grave_priest', imgScaleMultiplier: 3, artScale: 3.6, tint: '#1B5E20', tintStrength: 0.5,
        attackRange: 150, attackSpeed: 0.2, moveSpeed: 38, color: '#1B5E20',
        soulDrop: 5, waveSpeedIncreaseFactor: 0.006,
        // 身邊陣亡的召喚物會被牠復活成敵方骷髏（亡靈法師的招式反過來用）
        minWave: 33, waveInterval: 6, raiseRadius: 130, raiseCooldown: 1.2, maxRaised: 6,
    },
    raisedSkeleton: {
        type: 'RaisedSkeleton', name: '敵方骷髏', baseHealth: 18, baseAttack: 6, radius: 11,
        imageName: 'skeleton_warrior', imgScaleMultiplier: 2.8, tint: '#E53935', tintStrength: 0.55,
        attackRange: 22, attackSpeed: 1, moveSpeed: 70, color: '#E53935',
        soulDrop: 1, waveSpeedIncreaseFactor: 0.006,
    },
    lichBoss: {
        type: 'Boss', name: '墮落亡靈王', baseHealth: 1400, baseAttack: 24, radius: 28,
        imageName: 'armored_melee', art: 'lich_king', imgScaleMultiplier: 4.5, artScale: 4.2, tint: '#B71C1C', tintStrength: 0.6,
        // 施法型：站在遠處，不普攻
        attackRange: 170, attackSpeed: 0.5, moveSpeed: 32, color: '#B71C1C',
        soulDrop: 120, waveSpeedIncreaseFactor: 0.004, slowResist: 0.5,
        summonInterval: 6, summonCount: 5,
        novaInterval: 7, novaWindup: 1.3, novaRadius: 120, novaDamageMult: 2, novaPlayerHpRatio: 0.35,
        curseInterval: 9, curseCount: 3, curseSpread: 70,
        // 血量低於這個比例進第二階段，所有招式間隔 ÷ phase2Speed
        phase2Ratio: 0.5, phase2Speed: 1.5,
    },
    eliteAffix: {
        // 這一波起精英怪會帶一個詞綴，牠腳下的圈換顏色
        startWave: 25,
        list: {
            // 外觀見 Monster.drawAffix：分裂是繞身的光球，狂暴是腳下的火
            split: { color: '#9CCC65', count: 3, hpMult: 0.35 },
            frenzy: { color: '#FF7043', threshold: 0.5, speedMult: 1.6, atkSpeedMult: 1.5 },
        },
    },
    waveEvents: {
        startWave: 6, chance: 0.3,
        list: {
            bloodMoon: { icon: 'bloodMoon', name: '血月', desc: '怪物 ×1.6、靈魂 ×2', countMult: 1.6, soulMult: 2, overlay: 'rgba(183, 28, 28, 0.13)', color: '#EF9A9A' },
            eliteTide: { icon: 'crown', name: '精英潮', desc: '精英怪大量出現', eliteMult: 4, eliteMax: 0.6, color: '#FFD54F' },
            frenzy: { icon: 'claws', name: '狂暴', desc: '怪物更快、靈魂 ×1.5', speedMult: 1.35, atkSpeedMult: 1.3, soulMult: 1.5, overlay: 'rgba(255, 111, 0, 0.08)', color: '#FFAB91' },
            plague: { icon: 'plague', name: '腐屍狂潮', desc: '腐屍 ×3', bloaterMult: 3, color: '#AED581' },
            treasure: { icon: 'sack', name: '金魂竊賊', desc: '打倒逃跑的竊賊拿大量靈魂', thieves: 3, color: '#FFE082' },
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
        // 前 earlyWaves 波每波成長較多，讓前期就有壓力
        earlyWaves: 20, earlyScalePerWave: 0.035,
        scalePerWave: 0.02, lateWave: 50, lateScalePerWave: 0.007,
        // 召喚物不設上限時，玩家收入隨怪物「數量」成長、戰力隨累積收入成長，線性變強的怪物永遠追不上
        // （舊版就是這樣撐到無限波）。從 expStartWave 起再乘上 expGrowth^(超過的波數)，保證終究會被淹沒
        expStartWave: 20, expGrowth: 1.07,
        // 一局的目標：第 finalWave 波最終首領墮落亡靈王出場，打贏算通關（約 25 分鐘）。
        // 之後可以選擇繼續無盡模式，每波再多乘 endlessGrowth，通常十幾波內結束，不會變成一小時的慢慢輸
        finalWave: 50, endlessGrowth: 1.05,
        // 狼群是「填充」用的；中後期的壓力主要交給各種新威脅，所以每波增加的數量不多
        basicBase: 3, basicPerWave: 1.0,
        bossEvery: 10, bossWaveCountFactor: 0.5,
        // 每 10 波一輪的怪物數量（索引 = 波數 % 10，0 是首領波另外算）：
        // 首領剛打完的兩波明顯變少，讓大軍爽割一輪，再一路加壓到下一隻首領（鋸齒形難度）
        cycleCountFactors: [1, 0.55, 0.75, 0.9, 0.95, 1, 1.05, 1.1, 1.2, 1.3],
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
        popLiftMin: 70, popLiftMax: 130, gravity: 520, bounce: 0.35, bounceStop: 25,
        friction: 4,
        // 剛掉出來的一小段時間不吸，讓「噴出來」看得見
        attractDelay: 0.25,
        attractSpeed: 380, attractAccel: 600,
        // 被吸時的側向弧度與它消失的速度（每秒）
        swirl: 0.9, swirlDecay: 2.5,
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
    // 兵種進化：等級到門檻就升一階（一顆星），外型變大換色、多一個能力
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

// ---------- 祝福（每 3 波 / 首領波三選一，可疊層）；圖示名稱 = 祝福 id（icons.js） ----------
const CLEAVE_RADIUS = 35;
const pct = (v) => `${Math.round(v * 100)}%`;
const BLESSINGS = {
    boneBlade: { name: '骨刃', max: 5, per: 0.35, desc: b => `骷髏傷害 +${pct(b.per)}` },
    cleave: { name: '橫掃', max: 3, per: 0.3, desc: b => `骷髏攻擊波及周圍 ${pct(b.per)}` },
    boneArmor: { name: '骨甲', max: 5, per: 0.3, desc: b => `召喚物血量 +${pct(b.per)}` },
    splitGaze: { name: '分裂凝視', max: 3, per: 1, desc: b => `眼魔每次多射 ${b.per} 發` },
    frenzyEye: { name: '狂熱之眼', max: 4, per: 0.3, desc: b => `眼魔攻速 +${pct(b.per)}` },
    wraithBlast: { name: '怨念爆裂', max: 4, per: 0.6, desc: b => `怨靈爆炸傷害 +${pct(b.per)}` },
    rebirth: { name: '輪迴', max: 2, per: 0.4, desc: b => `怨靈陣亡時 ${pct(b.per)} 重生` },
    frostAura: { name: '寒冥光環', max: 3, per: 5, desc: b => `怨靈光環持續傷害 ${b.per}（隨怨靈等級成長）` },
    raiseDead: { name: '亡者復甦', max: 4, per: 0.05, desc: b => `擊殺時 ${pct(b.per)} 復活成骷髏` },
    soulHarvest: { name: '靈魂收割', max: 4, per: 0.25, desc: b => `靈魂掉落 +${pct(b.per)}` },
    magnet: { name: '靈魂牽引', max: 2, per: 0.6, desc: b => `拾取範圍 +${pct(b.per)}` },
    // totalDesc：暫停選單顯示累積效果時用（「並回滿」只在選的當下成立）
    vitality: { name: '不死之軀', max: 5, per: 25, desc: b => `法師血量 +${b.per} 並回滿`, totalDesc: b => `法師血量 +${b.per}` },
    novaPower: { name: '新星強化', max: 4, per: 0.5, cdPer: 0.15, desc: b => `新星傷害 +${pct(b.per)}、冷卻 -${pct(b.cdPer)}` },
    pact: { name: '亡者契約', max: 2, per: 0.25, desc: b => `召喚費用 -${pct(b.per)}` },
    lifesteal: { name: '嗜魂', max: 2, per: 0.15, desc: b => `召喚物造成傷害的 ${pct(b.per)} 回血` },
    soulBlade: { name: '靈魂之刃', max: 4, per: 0.6, desc: b => `法師靈魂彈傷害 +${pct(b.per)}` },
    soulVolley: { name: '靈魂連射', max: 2, per: 1, desc: b => `法師每次多射 ${b.per} 顆` },
    // ---- 傳說：只在首領波的三選一出現（固定佔一張），每種一局只能拿一次；改變打法，不只是加數字 ----
    boneBurst: { name: '骸骨爆裂', legendary: true, max: 1, per: 3, desc: () => '骷髏陣亡時炸傷周圍的怪' },
    twinSummon: { name: '雙生召喚', legendary: true, max: 1, per: 0.3, desc: b => `召喚時 ${pct(b.per)} 機率多送一隻` },
    soulfire: { name: '魂火', legendary: true, max: 1, per: 0.6, desc: () => '法師的靈魂彈命中時爆炸' },
};
const BONE_BURST_RADIUS = 40;

function getTier(level) {
    const lv = CONFIG.evolution.levels;
    let t = 0;
    while (t < lv.length && level >= lv[t]) t++;
    return t;
}

function bl(id) { return (gameState.blessings && gameState.blessings[id]) || 0; }
function blessVal(id) { return BLESSINGS[id].per * bl(id); }

// ---------- 永久強化（跨局保留）：每局結束依撐過的波數與擊敗的首領拿靈魂結晶 ----------
const META_KEY = 'undeadFrenzy_meta';
const META_UPGRADES = {
    startSouls: { icon: 'soul', name: '靈魂儲備', max: 5, per: 10, costBase: 30, desc: m => `開局靈魂 +${m.per}` },
    mageHp: { icon: 'heart', name: '法師體魄', max: 5, per: 10, costBase: 30, desc: m => `法師血量 +${m.per}` },
    novaMastery: { icon: 'burst', name: '新星精通', max: 5, per: 0.08, costBase: 40, desc: m => `新星冷卻 -${pct(m.per)}` },
    boneMarrow: { icon: 'boneArmor', name: '骨髓強化', max: 5, per: 0.06, costBase: 50, desc: m => `召喚物血量 +${pct(m.per)}` },
    soulAffinity: { icon: 'soulHarvest', name: '靈魂親和', max: 5, per: 0.06, costBase: 50, desc: m => `靈魂掉落 +${pct(m.per)}` },
    freeReroll: { icon: 'reroll', name: '先知之眼', max: 2, per: 1, costBase: 80, desc: m => `每次祝福免費重抽 ${m.per} 次` },
    headStart: { icon: 'star', name: '開局祝福', max: 1, per: 1, costBase: 150, desc: () => '開局先選一次祝福' },
};
const CRYSTALS_PER_WAVE = 2;
const CRYSTALS_PER_BOSS = 15;
function defaultMeta() {
    return { crystals: 0, upgrades: {}, tutorialDone: false, wins: 0, curseUnlocked: 0, curseSelected: 0, bgmVolume: CONFIG.audio.initialVolume, sfxVolume: CONFIG.audio.initialSfxVolume };
}
function loadMeta() {
    try {
        const m = JSON.parse(localStorage.getItem(META_KEY));
        if (m) return { ...defaultMeta(), ...m, upgrades: { ...(m.upgrades || {}) } };
    } catch (e) { }
    return defaultMeta();
}
function saveMeta() {
    try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) { }
}
const meta = loadMeta();
function metaLv(id) { return meta.upgrades[id] || 0; }
function metaVal(id) { return META_UPGRADES[id].per * metaLv(id); }
function metaCost(id) { return META_UPGRADES[id].costBase * (metaLv(id) + 1); }

function getSummonCost(config) {
    return Math.max(1, Math.round(config.summonCost * (1 - blessVal('pact'))));
}
function getMagnetRadius() {
    return CONFIG.player.magnetRadius * (1 + blessVal('magnet'));
}
function getNovaCooldown() {
    return CONFIG.nova.cooldown * (1 - BLESSINGS.novaPower.cdPer * bl('novaPower')) * (1 - metaVal('novaMastery'));
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
    shake: 0, hurtFlash: 0, soulCarry: 0, killedBy: null,
    sfxVolume: meta.sfxVolume,
    souls: CONFIG.player.initialSouls,
    currentWave: 0,
    timeToNextWave: CONFIG.wave.betweenTime, betweenWaves: true,
    gameOver: false, lastTime: 0, messageTimeout: null,
    isPaused: false,
    skeletonWarriorLevel: 0, eyeMonsterLevel: 0, wraithLevel: 0,
    skeletonWarriorCount: 0, eyeMonsterCount: 0, wraithCount: 0,
    currentCosts: { ...CONFIG.upgradeCosts },
    imagesLoaded: false,
    bgmVolume: meta.bgmVolume,
    musicStarted: false,
    totalSummons: emptySummonStats(),
    totalKills: emptyKillStats(),
    spawnQueue: [], spawnTimer: 0, banner: null,
    blessings: {}, pendingDraft: null, draftOpen: false, novaCooldown: 0, extraDrafts: 0,
    waveEvent: null, lastEventWave: 0, streak: 0, streakTimer: 0, bestStreak: 0,
    hazards: [], curse: 0, endless: false, victoryOpen: false,
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
// 載入畫面的進度條：每個要等的資源算一份
const loadProgress = { done: 0, total: 0 };
function trackLoad(promise) {
    loadProgress.total++;
    return promise.finally(() => { loadProgress.done++; });
}
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

const OPTIONAL_ART = {
    ground: 'ground_tile.jpg',
    boss_colossus: 'boss_colossus.png',
    boss_plague: 'boss_plague.png',
    boss_hunter: 'boss_hunter.png',
    bloater: 'bloater.png',
    thief: 'thief.png',
    assassin: 'assassin.png',
    slime: 'slime.png',
    bat: 'bat.png',
    witch_doctor: 'witch_doctor.png',
    shield_guard: 'shield_guard.png',
    corpse_worm: 'corpse_worm.png',
    grave_priest: 'grave_priest.png',
    lich_king: 'lich_king.png',
};

async function loadAllImages() {
    const imageSources = {
        player: 'player.png',
        skeleton_warrior: 'skeleton_warrior.png',
        eye_monster: 'eye_monster.png',
        wraith: 'wraith.png',
        basic_melee: 'basic_melee.png',
        fast_melee: 'fast_melee.png',
        armored_melee: 'armored_melee.png',
    };

    const promises = Object.entries(imageSources).map(([name, src]) =>
        trackLoad(loadImage(src)).then(img => { images[name] = img; })
    );
    // 新美術圖：有放檔案就用，沒有就沿用舊圖上色，不算載入失敗
    Object.entries(OPTIONAL_ART).forEach(([name, src]) => {
        promises.push(trackLoad(loadImage(src)).then(img => { images[name] = img; }).catch(() => { }));
    });

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

// 中間實心、往外淡掉的光暈（精英詞綴用）；跟怨靈的中空光環一樣按顏色畫一次存起來
const GLOW_SPRITE_SIZE = 64;
const glowCache = new Map();
function getGlowSprite(color) {
    let c = glowCache.get(color);
    if (c) return c;
    const S = GLOW_SPRITE_SIZE, r = S / 2;
    c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    const gradient = g.createRadialGradient(r, r, 0, r, r, r);
    gradient.addColorStop(0, color + 'CC');
    gradient.addColorStop(0.45, color + '55');
    gradient.addColorStop(1, color + '00');
    g.fillStyle = gradient;
    g.fillRect(0, 0, S, S);
    glowCache.set(color, c);
    return c;
}

// 分裂光球、狂暴火星：光暈＋本體事先合成一張，每顆每格只貼一次（精英潮時場上可能有上百隻精英）
const AFFIX_SPRITE_PX = 48;
const affixOrbCache = new Map();
function getAffixOrbSprite(color) {
    let c = affixOrbCache.get(color);
    if (c) return c;
    const S = AFFIX_SPRITE_PX, m = S / 2, r = S / 6;   // 貼的時候是 6 倍球半徑見方
    c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    g.drawImage(getGlowSprite(color), 0, 0, S, S);
    g.fillStyle = color;
    g.strokeStyle = TEXT_OUTLINE;
    g.lineWidth = r * 0.27;
    g.beginPath(); g.arc(m, m, r, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.7)';
    g.beginPath(); g.arc(m - r * 0.3, m - r * 0.3, r * 0.35, 0, Math.PI * 2); g.fill();
    affixOrbCache.set(color, c);
    return c;
}
const emberCache = new Map();
function getEmberSprite(glowColor) {
    let c = emberCache.get(glowColor);
    if (c) return c;
    const S = AFFIX_SPRITE_PX, q = S / 4;   // 貼的時候是 4 倍火星邊長見方，亮點佔中間 1/4
    c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    g.drawImage(getGlowSprite(glowColor), 0, 0, S, S);
    g.fillStyle = FRENZY_EMBER_COLOR;
    g.fillRect((S - q) / 2, (S - q) / 2, q, q);
    emberCache.set(glowColor, c);
    return c;
}

// 幾百隻怨靈的光環疊在一起，全解析度混色的像素量會讓畫布卡死；
// 光環本來就是模糊漸層，先畫在 1/AURA_LAYER_DIVISOR 解析度的圖層，再一次放大貼上
const AURA_LAYER_DIVISOR = 4;
let auraLayer = null;
// 圖層蓋住目前畫面範圍（世界座標），在世界座標下貼回去
// 光環疊在一起看起來就是一整片：每 AURA_DEDUPE_CELL 見方只畫範圍最大的那一個，
// 畫出來的聯集幾乎一樣，但上千隻怨靈擠在一起時要畫的數量有上限（750 隻時原本這一步要 24ms）
const AURA_DEDUPE_CELL = 30;
const auraCells = new Map();
// 光環圖層每 AURA_REFRESH_FRAMES 格才重畫一次，中間照舊貼（圖層多蓋畫面外一圈，鏡頭移動幾格也還蓋得住）
const AURA_REFRESH_FRAMES = 3;
let auraLayerFrame = -Infinity;
let auraLayerHasContent = false;
const auraLayerOrigin = { x: 0, y: 0 };
function drawAuraLayer() {
    if (!auraLayer || frameNo - auraLayerFrame >= AURA_REFRESH_FRAMES || frameNo < auraLayerFrame) {
        renderAuraLayer();
        auraLayerFrame = frameNo;
    }
    if (!auraLayerHasContent) return;
    ctx.drawImage(auraLayer, auraLayerOrigin.x, auraLayerOrigin.y, auraLayer.width * AURA_LAYER_DIVISOR, auraLayer.height * AURA_LAYER_DIVISOR);
}
function renderAuraLayer() {
    auraCells.clear();
    for (let i = 0; i < gameState.summons.length; i++) {
        const s = gameState.summons[i];
        if (!s.isAlive || s.config.type !== 'Wraith') continue;
        const k = Math.floor(s.pos.x / AURA_DEDUPE_CELL) * GRID_KEY_STRIDE + Math.floor(s.pos.y / AURA_DEDUPE_CELL);
        const cur = auraCells.get(k);
        if (!cur || s.slowRadius > cur.slowRadius) auraCells.set(k, s);
    }
    if (!auraLayer) {
        auraLayer = document.createElement('canvas');
        auraLayer.width = Math.ceil((view.w + CULL_MARGIN * 2) / AURA_LAYER_DIVISOR);
        auraLayer.height = Math.ceil((view.h + CULL_MARGIN * 2) / AURA_LAYER_DIVISOR);
    }
    const g = auraLayer.getContext('2d');
    g.clearRect(0, 0, auraLayer.width, auraLayer.height);
    auraLayerHasContent = auraCells.size > 0;
    if (!auraLayerHasContent) return;
    auraLayerOrigin.x = camera.x - CULL_MARGIN;
    auraLayerOrigin.y = camera.y - CULL_MARGIN;
    const scale = 1 / AURA_LAYER_DIVISOR;
    for (const w of auraCells.values()) w.drawAura(g, scale, auraLayerOrigin.x, auraLayerOrigin.y);
}

// ---------- 空間格子：「找附近的怪 / 召喚物」只查附近格子，不用每隻跟全部比 ----------
// 召喚物上千隻時，每隻跟每隻比對是平方成長；每格開始時把單位分進格子，查詢只看半徑涵蓋的格子。
// 地圖無限延伸，所以格子用雜湊表存（只存有東西的格子）。
const GRID_KEY_OFFSET = 32768;
const GRID_KEY_STRIDE = 65536;
// 找最近目標時最多往外找幾圈；超過就當作附近沒有
const MAX_NEAREST_RINGS = 40;
class SpatialGrid {
    constructor(cell) { this.cell = cell; this.map = new Map(); this.pool = []; this.sharedNearest = new Map(); this.sharedAny = new Map(); }
    key(cx, cy) { return (cx + GRID_KEY_OFFSET) * GRID_KEY_STRIDE + (cy + GRID_KEY_OFFSET); }
    cellAt(cx, cy) { return this.map.get(this.key(cx, cy)); }
    rebuild(items) {
        for (const arr of this.map.values()) { arr.length = 0; this.pool.push(arr); }
        this.map.clear();
        this.sharedNearest.clear();
        this.sharedAny.clear();
        for (let i = 0; i < items.length; i++) {
            const it = items[i];
            // 潛行中的單位不放進格子：召喚物找目標、範圍傷害都看不到它（新星直接掃全部怪物，照樣打得到）
            if (!it.isAlive || it.stealthed) continue;
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
    // 「附近有沒有」的共用版，規則同 nearestShared（怨靈的光環開關用：上百隻擠在同幾格，每隻每格都問一次）
    anyWithinShared(pos, r) {
        const cx = this.cx(pos.x), cy = this.cy(pos.y);
        const k = this.key(cx, cy) * NEAREST_SHARED_RADIUS_SLOTS + (Math.round(r) % NEAREST_SHARED_RADIUS_SLOTS);
        let v = this.sharedAny.get(k);
        if (v === undefined) {
            v = this.anyWithin({ x: (cx + 0.5) * this.cell, y: (cy + 0.5) * this.cell }, r);
            this.sharedAny.set(k, v);
        }
        return v;
    }
    // 同一格裡的單位共用這一格（以格子中心為準）的搜尋結果，每次 rebuild 清空。
    // 上千隻召喚物擠在一起時大家問的幾乎是同一個問題；誤差最多半格的對角線，對「往哪隻怪走」沒有影響
    nearestShared(pos, maxR) {
        const cx = this.cx(pos.x), cy = this.cy(pos.y);
        const k = this.key(cx, cy) * NEAREST_SHARED_RADIUS_SLOTS + (Math.round(maxR) % NEAREST_SHARED_RADIUS_SLOTS);
        if (this.sharedNearest.has(k)) {
            const hit = this.sharedNearest.get(k);
            if (!hit || hit.isAlive) return hit;
        }
        const r = this.nearest({ x: (cx + 0.5) * this.cell, y: (cy + 0.5) * this.cell }, maxR);
        this.sharedNearest.set(k, r);
        return r;
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
// 怪物找召喚物的搜尋半徑上限（法師死了、距離是無限大時用）
const MONSTER_SEEK_MAX = 1000;
// nearestShared 的快取鍵 = 格子鍵 × 這個數 + 搜尋半徑：同一格不同半徑的查詢分開存
const NEAREST_SHARED_RADIUS_SLOTS = 1024;
// 召喚物格子邊長要 ≥ 最大推開半徑（怨靈互推 25 × 1.5 = 37.5）
const GRID_CELL = 40;
// 擠成一團時推開力道早就頂到上限，參考最近這麼多個鄰居就夠；上千隻擠在一起時差別是平方 vs 線性
const MAX_AVOID_NEIGHBORS = 12;
const WRAITH_GRID_CELL = 75;
const summonGrid = new SpatialGrid(GRID_CELL);
// 怪物從遠處找召喚物用的粗格子：搜尋半徑動輒幾百，用 40 的細格子一次要查好幾百格（每格畫面兩萬多次查表）
const SUMMON_COARSE_CELL = 160;
const summonCoarseGrid = new SpatialGrid(SUMMON_COARSE_CELL);
const monsterGrid = new SpatialGrid(GRID_CELL);
const wraithGrid = new SpatialGrid(WRAITH_GRID_CELL);

// 上千隻召喚物擠在法師身邊時，就算只查附近格子，每隻附近還是有上百隻；
// 推開方向每隻每 AVOID_RECALC_FRAMES 格才重算一次（各自錯開），其餘沿用，肉眼看不出差別
const AVOID_RECALC_FRAMES = 3;
let frameNo = 0;
// 戰場動畫（閃爍、冒泡、脈動）用的時鐘：只在戰場更新時前進，暫停／選祝福時畫面才會整個停住
let worldTime = 0;
let avoidSlotCounter = 0;
const MONSTER_RETARGET_FRAMES = 3;
const MONSTER_FAR_RETARGET_FRAMES = 12;
const MONSTER_FAR_DIST = 200;
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

// 連段音高：五聲音階（Do Re Mi Sol La）一格一格往上，爬 COMBO_PITCH_TOP 格（兩個八度）後在最上面那個八度循環，
// 不會一路爬到刺耳；五聲音階任兩個音都不衝突，連起來像在彈旋律
const PENTATONIC_STEPS = [0, 2, 4, 7, 9];
const COMBO_PITCH_TOP = 10;
const SUMMON_COMBO_BASE_HZ = 262;
const UPGRADE_COMBO_BASE_HZ = 330;
function comboPitch(n) {
    let i = Math.max(0, n - 1);
    if (i > COMBO_PITCH_TOP) i = COMBO_PITCH_TOP - PENTATONIC_STEPS.length + 1 + (i - COMBO_PITCH_TOP - 1) % PENTATONIC_STEPS.length;
    const semis = PENTATONIC_STEPS[i % PENTATONIC_STEPS.length] + 12 * Math.floor(i / PENTATONIC_STEPS.length);
    return Math.pow(2, semis / 12);
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
    // arg 原樣交給音效定義（連段音效用它決定音高）
    play(name, arg) {
        if (!this.ctx || this.ctx.state !== 'running' || gameState.sfxVolume <= 0) return;
        const def = SFX_DEFS[name];
        if (!def) return;
        const now = this.ctx.currentTime;
        if (this.last[name] && now - this.last[name] < def.gap) return;
        this.last[name] = now;
        def.fn(this, arg);
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
    deny: { gap: 0.12, fn: s => { s.tone(200, 0.09, { type: 'square', vol: 0.06 }); s.tone(150, 0.12, { type: 'square', vol: 0.06, delay: 0.08 }); } },
    tick: { gap: 0.3, fn: s => { s.tone(880, 0.08, { type: 'square', vol: 0.07 }); s.tone(440, 0.12, { type: 'triangle', vol: 0.08 }); } },
    // 長按連段：第 n 下沿五聲音階往上爬，每下短而有打擊感（比連發間隔 150ms 短，不會糊成一團）
    summonCombo: { gap: 0.04, fn: (s, n) => { const f = SUMMON_COMBO_BASE_HZ * comboPitch(n); s.tone(f, 0.09, { type: 'triangle', vol: 0.14, slideTo: f * 1.5 }); s.noise(0.03, { vol: 0.05, filterFreq: 4000 }); } },
    upgradeCombo: { gap: 0.04, fn: (s, n) => { const f = UPGRADE_COMBO_BASE_HZ * comboPitch(n); s.tone(f, 0.1, { type: 'square', vol: 0.05 }); s.tone(f * 2, 0.14, { type: 'triangle', vol: 0.08 }); s.noise(0.025, { vol: 0.04, filterFreq: 6000 }); } },
    comboMilestone: { gap: 0.3, fn: s => { [1046, 1318, 1568, 2093].forEach((f, i) => s.tone(f, 0.18, { type: 'triangle', vol: 0.1, delay: i * 0.035 })); s.noise(0.15, { vol: 0.06, filterFreq: 8000 }); } },
    mageBolt: { gap: 0.1, fn: s => s.tone(1200, 0.06, { type: 'triangle', vol: 0.035, slideTo: 1800 }) },
    click: { gap: 0.05, fn: s => s.tone(660, 0.05, { type: 'triangle', vol: 0.09, slideTo: 880 }) },
    streak: { gap: 0.3, fn: s => { [659, 880, 1175].forEach((f, i) => s.tone(f, 0.12, { type: 'square', vol: 0.07, delay: i * 0.05 })); } },
    spawn: { gap: 0.3, fn: s => s.noise(0.3, { vol: 0.15, filterFreq: 500 }) },
    splat: { gap: 0.15, fn: s => { s.noise(0.2, { vol: 0.15, filterFreq: 700 }); s.tone(140, 0.18, { vol: 0.08, slideTo: 70 }); } },
    victory: { gap: 1, fn: s => { [523, 659, 784, 1046, 1318].forEach((f, i) => s.tone(f, 0.35, { type: 'triangle', vol: 0.16, delay: i * 0.12 })); } },
    mark: { gap: 0.2, fn: s => { s.tone(1500, 0.12, { type: 'triangle', vol: 0.1, slideTo: 2400 }); s.tone(1500, 0.12, { type: 'triangle', vol: 0.06, slideTo: 2400, delay: 0.1 }); } },
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
function spawnFloatText(x, y, text, color = '#FFFFFF', size = 14, life = 0.9, icon = null) {
    gameState.floatTexts.push({ x, y, text, color, size, life, maxLife: life, icon });
}

// ---------- 畫布上的字：跟 HTML 介面同一套黑暗奇幻襯線字，深色粗描邊 ----------
const CANVAS_FONT_FAMILY = '"Noto Serif TC", "Songti TC", "PMingLiU", serif';
const TEXT_OUTLINE = '#0e0a14';
const TEXT_OUTLINE_MAX = 11;
function canvasFont(size, weight = 900) {
    return `${weight} ${size}px ${CANVAS_FONT_FAMILY}`;
}
function drawOutlinedText(text, x, y, size, color, weight = 900) {
    ctx.font = canvasFont(size, weight);
    ctx.lineJoin = 'round';
    // 大字的描邊要封頂：照比例放大會把數字的內圈整個塗黑
    ctx.lineWidth = Math.min(TEXT_OUTLINE_MAX, Math.max(3, size * 0.22));
    ctx.strokeStyle = TEXT_OUTLINE;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}
// 圖示＋文字並排置中（或靠左 / 靠右）
function drawIconLabel(iconName, text, x, y, size, color, align = 'center') {
    const img = iconName ? getIconImage(iconName) : null;
    const iconSize = img ? size * 1.3 : 0;
    const gap = img ? size * 0.3 : 0;
    ctx.font = canvasFont(size);
    const tw = ctx.measureText(text).width;
    const total = iconSize + gap + tw;
    let left = align === 'center' ? x - total / 2 : (align === 'right' ? x - total : x);
    if (img) ctx.drawImage(img, left, y - iconSize * 0.72, iconSize, iconSize);
    ctx.textAlign = 'left';
    drawOutlinedText(text, left + iconSize + gap, y, size, color);
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
        // 一定要有初值：批次繪製用 `hitFlash <= 0` 跳過，undefined 會被當成「正在閃白」
        this.hitFlash = 0;
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
                ctx.drawImage(this.getFlashSprite(flipped), x, y, w, h);
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

    // 上千隻每格都會呼叫：直接比對欄位，不要每次組字串當鍵
    getCachedSprite(flipped) {
        if (this._spriteTint !== this.tint || this._spriteStrength !== this.tintStrength || this._spriteW !== this.imageWidth) {
            this._sprites = [
                getSprite(this.image, this.imageWidth, this.imageHeight, this.tint, this.tintStrength || 0.45, false),
                getSprite(this.image, this.imageWidth, this.imageHeight, this.tint, this.tintStrength || 0.45, true),
            ];
            this._spriteTint = this.tint;
            this._spriteStrength = this.tintStrength;
            this._spriteW = this.imageWidth;
            this._flashSprites = null;
        }
        return this._sprites[flipped ? 1 : 0];
    }
    getFlashSprite(flipped) {
        if (!this._flashSprites) {
            this._flashSprites = [
                getSprite(this.image, this.imageWidth, this.imageHeight, '#FFFFFF', 1, false),
                getSprite(this.image, this.imageWidth, this.imageHeight, '#FFFFFF', 1, true),
            ];
        }
        return this._flashSprites[flipped ? 1 : 0];
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

// 扣血後白色殘影每秒縮短的比例；低於這個比例血條閃紅
const PLAYER_HP_TRAIL_SPEED = 0.6;
const PLAYER_HP_LOW = 0.3;
const PLAYER_MAX_HIT_RATIO = 0.4;
// 吸到靈魂時法師身上的光暈：每吸一顆加一點，每秒淡掉這麼多
const ABSORB_GLOW_PER_ORB = 0.35;
const ABSORB_GLOW_DECAY = 2.5;

const boltTargets = [];
class Player extends GameObject {
    constructor(x, y) {
        const config = CONFIG.player;
        super(x, y, config.radius, config.color, config.imageName, config.imgScaleMultiplier);
        this.maxHealth = config.baseHealth;
        this.currentHealth = this.maxHealth;
        this.moveSpeed = config.baseMoveSpeed;
        this.hpTrail = 1;
        this.absorbGlow = 0;
        this.boltT = 0;
    }
    shootBolt(deltaTime) {
        this.boltT -= deltaTime;
        if (this.boltT > 0) return;
        const P = CONFIG.player;
        // 一次射幾顆就挑最近的幾隻，各打一隻（靈魂連射）
        const shots = 1 + blessVal('soulVolley');
        const rSq = P.boltRange * P.boltRange;
        boltTargets.length = 0;
        monsterGrid.forEachInRadius(this.pos, P.boltRange, m => {
            if (!m.isAlive) return;
            const d = distanceSq(this.pos, m.pos);
            if (d <= rSq) boltTargets.push({ m, d });
        });
        if (!boltTargets.length) return;
        if (boltTargets.length > shots) boltTargets.sort((a, b) => a.d - b.d);
        this.boltT = P.boltInterval;
        const dmg = P.boltDamage * getWaveStatMultiplier(Math.max(1, gameState.currentWave)) * (1 + blessVal('soulBlade'));
        for (let i = 0; i < Math.min(shots, boltTargets.length); i++) {
            const pr = getProjectileFromPool();
            pr.init(this.pos.x, this.pos.y - this.imageHeight * 0.15, boltTargets[i].m, P.bolt, dmg, null, 0, bl('soulfire') > 0);
            gameState.projectiles.push(pr);
        }
        Sfx.play('mageBolt');
    }
    update(deltaTime, moveVec) {
        if (!this.isAlive) return;
        this.tickFlash(deltaTime);
        const ratio = this.currentHealth / this.maxHealth;
        this.hpTrail = ratio > this.hpTrail ? ratio : Math.max(ratio, this.hpTrail - PLAYER_HP_TRAIL_SPEED * deltaTime);
        this.absorbGlow = Math.max(0, this.absorbGlow - ABSORB_GLOW_DECAY * deltaTime);
        const moveX = moveVec.x * this.moveSpeed * deltaTime;
        const moveY = moveVec.y * this.moveSpeed * deltaTime;
        this.pos.x += moveX;
        this.pos.y += moveY;

        this.updateFacingDirection(moveVec.x);
        this.shootBolt(deltaTime);
    }
    // source：打這一下的怪（毒池則是丟毒的那隻），陣亡畫面要寫是誰殺的
    takeDamage(amount, source = null) {
        if (!this.isAlive) return;
        // 單一下傷害封頂：滿血不會被一下秒掉（後期精英腐屍一爆就超過法師血量），死亡要來自看得到的壓力
        this.currentHealth -= Math.min(amount, this.maxHealth * PLAYER_MAX_HIT_RATIO);
        this.currentHealth = Math.max(0, Math.round(this.currentHealth));
        this.hitFlash = CONFIG.visuals.hitFlashDuration;
        gameState.hurtFlash = CONFIG.visuals.hurtFlashDuration;
        addShake(4);
        Sfx.play('hurt');
        if (this.currentHealth <= 0) {
            gameState.killedBy = source;
            this.die();
        }
        updateUI();
    }
    draw(ctx) {
        if (this.isAlive && this.absorbGlow > 0 && orbGlowSprite) {
            const g = 70 + this.absorbGlow * 20;
            ctx.globalAlpha = Math.min(1, this.absorbGlow) * 0.75;
            ctx.drawImage(orbGlowSprite, this.pos.x - g / 2, this.pos.y - g / 2, g, g);
            ctx.globalAlpha = 1;
        }
        super.draw(ctx);
    }
    // 法師的血條一直貼在腳下：眼睛本來就盯著法師，不用另外去看角落
    drawHealthBar(ctx) {
        if (!this.isAlive) return;
        const w = 38, h = 6;
        const x = this.pos.x - w / 2, y = this.pos.y + this.imageHeight * 0.5 + 1;
        const ratio = Math.max(0, this.currentHealth / this.maxHealth);
        ctx.fillStyle = 'rgba(14, 10, 20, 0.85)';
        roundRect(x - 1.5, y - 1.5, w + 3, h + 3, 3);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        if (this.hpTrail > ratio) ctx.fillRect(x, y, w * this.hpTrail, h);
        const low = ratio <= PLAYER_HP_LOW;
        ctx.fillStyle = ratio > 0.5 ? '#66BB6A' : (low ? '#EF5350' : '#FFCA28');
        if (low) ctx.globalAlpha = 0.6 + 0.4 * Math.sin(worldTime * 1000 / 90);
        ctx.fillRect(x, y, w * ratio, h);
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x, y, w * ratio, h * 0.4);
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
        this.maxHealth = Math.round(this.config.baseHealth * multiplier * (1 + blessVal('boneArmor')) * (1 + metaVal('boneMarrow')));
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
            let monsterInRangeForAura = monsterGrid.anyWithinShared(this.pos, this.slowRadius);
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
        // 地圖無限大、法師比多數召喚物快：離太遠就加速追上，遠到出了畫面就直接傳送回身邊，
        // 不然法師一路往前走，大軍會被甩在後面、法師一個人被圍
        const distToPlayerSq = distanceSq(this.pos, this.playerTransform.pos);
        if (distToPlayerSq > SUMMON_TELEPORT_DIST * SUMMON_TELEPORT_DIST && !inView(this.pos)) {
            const p = getRandomSpawnPosNearPlayer(SUMMON_TELEPORT_SCATTER);
            this.pos.x = p.x; this.pos.y = p.y;
            this.target = null;
            if (gameState.particles.length < CONFIG.visuals.maxParticles) spawnParticles(p.x, p.y, '#7E57C2', 4, 50, 0.4);
        } else if (distToPlayerSq > SUMMON_CATCHUP_DIST * SUMMON_CATCHUP_DIST && !this.target) {
            currentMoveSpeed *= SUMMON_CATCHUP_MULT;
        }
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
                if (monsterGrid.anyWithinShared(this.pos, this.slowRadius)) {
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
        return monsterGrid.nearestShared(this.pos, this.config.targetSearchRadius);
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
        onSummonDeath(this);
        spawnParticles(this.pos.x, this.pos.y, '#B0BEC5', 10, 70, 0.45);
        if (this.config.type === 'SkeletonWarrior' && bl('boneBurst')) boneBurst(this);
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

const SUMMON_CATCHUP_DIST = 140;
// 回到法師身邊的移動本來會再乘 0.5（見 update 的 isReturning 分支），所以倍率要夠大，最慢的怨靈才追得上法師
const SUMMON_CATCHUP_MULT = 3.2;
const SUMMON_TELEPORT_DIST = 520;
const SUMMON_TELEPORT_SCATTER = 70;

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
        onSummonDeath(this);
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
        this.style = shooterConfig.boltStyle;
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
                const block = hit.config && hit.config.projectileBlock;
                if (block) spawnParticles(this.pos.x, this.pos.y, '#CFD8DC', 3, 50, 0.2, 2);
                else spawnParticles(this.pos.x, this.pos.y, this.color, BOLT_HIT_SPARKS, 60, 0.25, 2);
                hit.takeDamage(block ? this.damage * (1 - block) : this.damage);
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
        // 法師的「魂火」與眼魔的爆裂魔眼共用同一套爆炸，只是倍率不同
        const dmg = Math.round(this.damage * (this.style === 'soul' ? BLESSINGS.soulfire.per : E.eyeBlastMult));
        monsterGrid.forEachInRadius(hit.pos, E.eyeBlastRadius, m => {
            if (m !== hit && m.isAlive && distanceSq(hit.pos, m.pos) <= rSq) m.takeDamage(dmg);
        });
        spawnParticles(hit.pos.x, hit.pos.y, this.color, 4, 70, 0.3, 2);
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
}

// 彗星圖事先轉好 BOLT_DIRECTIONS 個方向，每張只裁到剛好包住彗星；畫的時候挑最近的方向直接貼。
// 不在畫的時候旋轉：旋轉後貼圖每個像素都要重新取樣，實測 58 顆要 2ms，事先轉好只要 0.65ms 上下
const BOLT_DIRECTIONS = 32;
const boltDirSprites = {};
function getBoltDirSprite(style, i) {
    const list = boltDirSprites[style] || (boltDirSprites[style] = []);
    let c = list[i];
    if (c) return c;
    const base = getBoltSprite(style);
    const a = i / BOLT_DIRECTIONS * Math.PI * 2;
    const cos = Math.cos(a), sin = Math.sin(a);
    const W = BOLT_TAIL_LEN + BOLT_DRAW_SIZE, H = BOLT_DRAW_SIZE;
    const k = BOLT_SPRITE_PX_PER_UNIT;
    c = document.createElement('canvas');
    c.width = Math.ceil((Math.abs(W * cos) + Math.abs(H * sin)) * k);
    c.height = Math.ceil((Math.abs(W * sin) + Math.abs(H * cos)) * k);
    const g = c.getContext('2d');
    g.translate(c.width / 2, c.height / 2);
    g.rotate(a);
    g.drawImage(base, -W * k / 2, -H * k / 2, W * k, H * k);
    list[i] = c;
    return c;
}
function drawProjectilesBatched() {
    const list = gameState.projectiles;
    const k = BOLT_SPRITE_PX_PER_UNIT;
    for (let i = 0; i < list.length; i++) {
        const pr = list[i];
        if (!pr.isAlive || !inView(pr.pos)) continue;
        const dx = pr.direction.x, dy = pr.direction.y;
        const idx = ((Math.round(Math.atan2(dy, dx) / (Math.PI * 2) * BOLT_DIRECTIONS) % BOLT_DIRECTIONS) + BOLT_DIRECTIONS) % BOLT_DIRECTIONS;
        const sp = getBoltDirSprite(pr.style, idx);
        const w = sp.width / k, h = sp.height / k;
        // 圖的中心是整顆彗星的中心，在彈頭後方半條拖尾的位置
        const cx = pr.pos.x - dx * BOLT_TAIL_LEN / 2, cy = pr.pos.y - dy * BOLT_TAIL_LEN / 2;
        ctx.drawImage(sp, cx - w / 2, cy - h / 2, w, h);
    }
}

// 飛彈的外觀（世界單位）。碰撞照舊用 projectileRadius，這裡只管畫多大
const BOLT_DRAW_SIZE = 22;
const BOLT_ORB_R = 4.5;
const BOLT_TAIL_LEN = 20;
const BOLT_TRAIL_COUNT = 4;
const BOLT_HIT_SPARKS = 4;
const BOLT_SPRITE_PX_PER_UNIT = 3;
// 誰射的就用誰的顏色：眼魔粉紅、法師靈魂青（跟靈魂光球同色）
const BOLT_STYLES = {
    eye: { glowIn: 'rgba(255, 179, 213, 0.85)', glowMid: 'rgba(240, 98, 146, 0.35)', glowOut: 'rgba(240, 98, 146, 0)', body: '#F06292', core: '#FCE4EC' },
    soul: { glowIn: 'rgba(214, 251, 251, 0.9)', glowMid: 'rgba(127, 240, 240, 0.38)', glowOut: 'rgba(127, 240, 240, 0)', body: '#7FF0F0', core: '#E8FFFF' },
};
// 預先畫好一整顆朝右的彗星：拖尾是一串越來越小、越來越淡的光暈（只有光、不帶描邊，疊起來才不會一節一節），
// 最前面是光暈＋描邊彈體。畫面上幾十顆同時飛，每顆每格只貼一張圖
const boltSprites = {};
function getBoltSprite(style) {
    if (boltSprites[style]) return boltSprites[style];
    const S = BOLT_STYLES[style];
    const k = BOLT_SPRITE_PX_PER_UNIT;
    const G = 64, gc = G / 2;
    const glow = document.createElement('canvas');
    glow.width = glow.height = G;
    const gg = glow.getContext('2d');
    const grad = gg.createRadialGradient(gc, gc, 0, gc, gc, gc);
    grad.addColorStop(0, S.glowIn);
    grad.addColorStop(0.45, S.glowMid);
    grad.addColorStop(1, S.glowOut);
    gg.fillStyle = grad;
    gg.fillRect(0, 0, G, G);

    const c = document.createElement('canvas');
    c.width = Math.ceil((BOLT_TAIL_LEN + BOLT_DRAW_SIZE) * k);
    c.height = Math.ceil(BOLT_DRAW_SIZE * k);
    const g = c.getContext('2d');
    const hx = (BOLT_TAIL_LEN + BOLT_DRAW_SIZE / 2) * k, hy = c.height / 2;
    for (let i = BOLT_TRAIL_COUNT; i >= 1; i--) {
        const t = i / (BOLT_TRAIL_COUNT + 1);
        const s = BOLT_DRAW_SIZE * (1 - t * 0.7) * k;
        g.globalAlpha = 0.9 * (1 - t);
        g.drawImage(glow, hx - BOLT_TAIL_LEN * t * k - s / 2, hy - s / 2, s, s);
    }
    g.globalAlpha = 1;
    const D = BOLT_DRAW_SIZE * k;
    g.drawImage(glow, hx - D / 2, hy - D / 2, D, D);
    const r = BOLT_ORB_R * k;
    g.fillStyle = S.body;
    g.strokeStyle = TEXT_OUTLINE;
    g.lineWidth = 1.2 * k;
    g.beginPath(); g.arc(hx, hy, r, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = S.core;
    g.beginPath(); g.arc(hx, hy, r * 0.55, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#FFFFFF';
    g.beginPath(); g.arc(hx - r * 0.3, hy - r * 0.3, r * 0.22, 0, Math.PI * 2); g.fill();
    boltSprites[style] = c;
    return c;
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
        this.size = ORB_SIZE_BASE + Math.min(ORB_SIZE_BONUS_MAX, value * ORB_SIZE_PER_VALUE);
        this.age = 0;
        this.attracted = false;
        this.pullTime = 0;
        this.spin = Math.random() < 0.5 ? -1 : 1;
        this.dist = Infinity;
        // 噴出來時往上彈一下再落地，看起來像「掉出來」
        this.z = 0;
        this.vz = randomInRange(c.popLiftMin, c.popLiftMax);
        this.banked = false;
        this.isAlive = true;
    }
    update(deltaTime, player) {
        const c = CONFIG.orbs;
        this.age += deltaTime;
        if (this.z > 0 || this.vz > 0) {
            this.vz -= c.gravity * deltaTime;
            this.z += this.vz * deltaTime;
            if (this.z <= 0) { this.z = 0; this.vz = -this.vz * c.bounce; if (this.vz < c.bounceStop) this.vz = 0; }
        }
        const dx = player.pos.x - this.pos.x, dy = player.pos.y - this.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        this.dist = dist;
        const magnet = getMagnetRadius();
        if (this.banked || dist < magnet) this.attracted = true;
        if (this.attracted && this.age > c.attractDelay) {
            // 一開始帶一點側向速度、越飛越直：繞一小段弧線被吸進去，而不是一條直線
            this.pullTime += deltaTime;
            const swirl = Math.max(0, 1 - this.pullTime * c.swirlDecay) * c.swirl * this.spin;
            const ux = dx / dist, uy = dy / dist;
            const dir = normalizeVector({ x: ux - uy * swirl, y: uy + ux * swirl });
            const sp = c.attractSpeed + this.pullTime * c.attractAccel;
            this.vel.x = dir.x * sp;
            this.vel.y = dir.y * sp;
            this.z *= Math.max(0, 1 - 8 * deltaTime);
            this.vz = 0;
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
            player.absorbGlow = Math.min(1.5, player.absorbGlow + ABSORB_GLOW_PER_ORB);
            Sfx.play('orb');
        }
    }
    draw(ctx) {
        if (!orbSprite) buildOrbSprites();
        const flying = this.attracted && this.pullTime > 0;
        // 越靠近法師越小，像被吸進身體裡
        const shrink = flying ? Math.max(0.35, Math.min(1, this.dist / 45)) : 1;
        const s = this.size * shrink;
        const x = this.pos.x;
        const bob = flying || this.z > 0 ? 0 : Math.sin(this.age * 5 + this.spin) * 1.5;
        const y = this.pos.y - this.z + bob;
        if (!flying) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath(); ctx.ellipse(x, this.pos.y + s * 0.45, s * 0.35, s * 0.13, 0, 0, Math.PI * 2); ctx.fill();
        }
        if (flying) {
            // 拖尾：沿著來的方向放幾團越來越淡、越來越小的光
            for (let i = 1; i <= ORB_TRAIL_GHOSTS; i++) {
                const k = i * ORB_TRAIL_STEP;
                const gs = s * (1.6 - i * 0.35);
                ctx.globalAlpha = 0.5 - i * 0.15;
                ctx.drawImage(orbGlowSprite, x - this.vel.x * k - gs / 2, y - this.vel.y * k - gs / 2, gs, gs);
            }
            ctx.globalAlpha = 1;
        }
        const pulse = 0.55 + 0.2 * Math.sin(this.age * 7 + this.spin * 2);
        const g = s * 2.2;
        ctx.globalAlpha = pulse;
        ctx.drawImage(orbGlowSprite, x - g / 2, y - g / 2, g, g);
        ctx.globalAlpha = 1;
        ctx.drawImage(orbSprite, x - s / 2, y - s / 2, s, s);
    }
}

// 靈魂光球用自繪的靈魂火焰圖示；先縮成小張貼圖，上百顆一起畫才不會每顆都去縮放向量圖
const ORB_SIZE_BASE = 14;
const ORB_SIZE_PER_VALUE = 1.6;
const ORB_SIZE_BONUS_MAX = 8;
const ORB_SPRITE_PX = 48;
const ORB_TRAIL_GHOSTS = 3;
const ORB_TRAIL_STEP = 0.014;
let orbSprite = null, orbGlowSprite = null;
function buildOrbSprites() {
    const icon = getIconImage('soul');
    orbSprite = document.createElement('canvas');
    orbSprite.width = orbSprite.height = ORB_SPRITE_PX;
    const g = orbSprite.getContext('2d');
    if (icon) g.drawImage(icon, 0, 0, ORB_SPRITE_PX, ORB_SPRITE_PX);
    else { g.fillStyle = '#E0F7FA'; g.beginPath(); g.arc(ORB_SPRITE_PX / 2, ORB_SPRITE_PX / 2, ORB_SPRITE_PX / 3, 0, Math.PI * 2); g.fill(); }
    orbGlowSprite = document.createElement('canvas');
    orbGlowSprite.width = orbGlowSprite.height = ORB_SPRITE_PX;
    const gg = orbGlowSprite.getContext('2d');
    const r = ORB_SPRITE_PX / 2;
    const grad = gg.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, 'rgba(128, 222, 234, 0.9)');
    grad.addColorStop(0.4, 'rgba(77, 208, 225, 0.35)');
    grad.addColorStop(1, 'rgba(77, 208, 225, 0)');
    gg.fillStyle = grad;
    gg.fillRect(0, 0, ORB_SPRITE_PX, ORB_SPRITE_PX);
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
    return linear * Math.pow(W.expGrowth, Math.max(0, wave - W.expStartWave))
        * Math.pow(W.endlessGrowth, Math.max(0, wave - W.finalWave));
}

// 怪物長什麼樣子：有專屬新圖就用新圖、不再上色；沒有就用舊圖上色代替。
// 場上的怪物和新威脅橫幅都照這裡挑圖，兩邊才不會一個是新圖、一個是染色的舊圖
function monsterLook(config) {
    const art = config.art && images[config.art] ? config.art : null;
    const keepTint = !art || config.keepTintOnArt;
    return {
        imageName: art || config.imageName,
        // 新圖的留白和舊圖不同，各自有一個縮放
        scale: art && config.artScale ? config.artScale : config.imgScaleMultiplier,
        tint: keepTint ? config.tint : null,
        tintStrength: keepTint ? config.tintStrength : 0,
    };
}

// 精英詞綴特效（世界單位、每秒）
const SPLIT_ORBIT_RADIUS = 0.6;   // × 圖寬
const SPLIT_ORBIT_SPEED = 2.4;
const SPLIT_ORBIT_TILT = 0.35;    // 軌道壓扁成橢圓，看起來是斜著的一圈
const SPLIT_ORB_R = 4.5;
const FRENZY_AURA_SCALE = 1.4;    // × 圖寬
const FRENZY_PULSE_SPEED = 6;
const FRENZY_ENRAGED_BOOST = 1.5; // 發狂後光暈變大、火星變快
const FRENZY_EMBERS = 6;
const FRENZY_EMBERS_ENRAGED = 11;
const FRENZY_EMBER_SIZE = 4;
const FRENZY_EMBER_RATE = 0.9;
const FRENZY_EMBER_COLOR = '#FFF59D';
const FRENZY_BURST_SPARKS = 24;

class Monster extends GameObject {
    constructor(x, y, config, waveNumber, isElite = false) {
        const E = CONFIG.elite;
        const look = monsterLook(config);
        super(x, y, config.radius * (isElite ? E.sizeMult : 1), config.color, look.imageName, look.scale);
        this.config = config;
        this.isElite = isElite;
        this.tint = isElite ? E.tint : look.tint;
        this.tintStrength = isElite ? E.tintStrength : look.tintStrength;
        this.waveNumber = waveNumber;
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
            if (waveNumber >= CONFIG.eliteAffix.startWave && !(this instanceof BossMonster)) {
                const ids = Object.keys(CONFIG.eliteAffix.list);
                this.affix = ids[Math.floor(Math.random() * ids.length)];
                // 特效動畫的起始相位：好幾隻精英同時在場時不會整齊劃一地一起轉
                this.fxSeed = Math.random() * 10;
            }
        }
        const cm = curseMods();
        this.maxHealth = Math.round(this.maxHealth * cm.hpMult);
        this.attack *= cm.atkMult;
        this.baseMoveSpeed *= cm.speedMult;
        this.moveSpeed = this.baseMoveSpeed;
        this.currentHealth = this.maxHealth;
    }

    soulValue() {
        return this.config.soulDrop * (this.isElite ? CONFIG.elite.soulMult : 1);
    }

    draw(ctx) {
        if (this.isElite && this.isAlive) {
            ctx.save();
            ctx.strokeStyle = this.affix ? CONFIG.eliteAffix.list[this.affix].color : 'rgba(255, 213, 79, 0.85)';
            ctx.lineWidth = this.enraged ? 4 : 2;
            ctx.beginPath();
            ctx.ellipse(this.pos.x, this.pos.y + this.imageHeight * 0.38, this.radius * 1.3, this.radius * 0.5, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        const fx = this.affix && this.isAlive;
        if (fx) this.drawAffix(ctx, true);
        super.draw(ctx);
        if (fx) this.drawAffix(ctx, false);
    }

    // 詞綴用特效講，不寫字：分裂＝身邊繞著「之後會變成的那幾隻」小光球；狂暴＝腳下冒火，發狂後燒得更兇。
    // behind = 畫在身體後面的那一半（光暈、繞到後方的光球）
    drawAffix(ctx, behind) {
        const A = CONFIG.eliteAffix.list[this.affix];
        const t = worldTime + this.fxSeed;
        const { x, y } = this.pos;
        if (this.affix === 'split') {
            // 照圖的寬度算：圖比碰撞半徑大很多，照半徑繞的話整圈都躲在身體後面
            const R = this.imageWidth * SPLIT_ORBIT_RADIUS;
            for (let i = 0; i < A.count; i++) {
                const a = t * SPLIT_ORBIT_SPEED + i * Math.PI * 2 / A.count;
                const depth = Math.sin(a);
                if ((depth < 0) !== behind) continue;
                const ox = x + Math.cos(a) * R, oy = y + depth * R * SPLIT_ORBIT_TILT;
                // 繞到前面的大一點、後面的小一點，看起來是一圈在轉
                const s = SPLIT_ORB_R * (1 + depth * 0.2);
                ctx.drawImage(getAffixOrbSprite(A.color), ox - s * 3, oy - s * 3, s * 6, s * 6);
            }
            return;
        }
        // frenzy
        const hot = this.enraged ? FRENZY_ENRAGED_BOOST : 1;
        const feetY = y + this.imageHeight * 0.3;
        if (behind) {
            const pulse = 1 + 0.15 * Math.sin(t * FRENZY_PULSE_SPEED * hot);
            const s = this.imageWidth * FRENZY_AURA_SCALE * hot * pulse;
            ctx.drawImage(getGlowSprite(A.color), x - s / 2, feetY - s * 0.6, s, s);
            return;
        }
        // 火星往上飄：位置直接由時間算，不存狀態
        const n = this.enraged ? FRENZY_EMBERS_ENRAGED : FRENZY_EMBERS;
        // 精英怪本身染成橘金色，火星要亮黃＋紅光才不會融進身體；飄到頭頂以上，在深色地面上最明顯
        const rise = this.imageHeight * 1.2;
        const ember = getEmberSprite(A.color);
        for (let i = 0; i < n; i++) {
            const ph = (t * FRENZY_EMBER_RATE * hot + i / n) % 1;
            ctx.globalAlpha = 1 - ph;
            const ex = x + Math.sin(i * 7.31 + t * 2) * this.imageWidth * 0.35;
            const ey = feetY - ph * rise;
            const es = FRENZY_EMBER_SIZE * (1 - ph * 0.5);
            ctx.drawImage(ember, ex - es * 2, ey - es * 2, es * 4, es * 4);
        }
        ctx.globalAlpha = 1;
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

        // 每 MONSTER_RETARGET_FRAMES 格重找一次最近目標（各自錯開）；離目標還很遠的話隔久一點再找（反正都是往大軍走）；目標死了立刻重找
        if (this.retargetSlot === undefined) this.retargetSlot = (avoidSlotCounter++) % MONSTER_FAR_RETARGET_FRAMES;
        const far = this.target && distanceSq(this.pos, this.target.pos) > MONSTER_FAR_DIST * MONSTER_FAR_DIST;
        const every = far ? MONSTER_FAR_RETARGET_FRAMES : MONSTER_RETARGET_FRAMES;
        if (!this.target || !this.target.isAlive || (frameNo + this.retargetSlot) % every === 0) {
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
        // 只需要找比法師近的召喚物：搜尋半徑就是到法師的距離（沒有上限的話，離大軍很遠的怪要一圈圈查上千格）
        const nearestSummon = summonCoarseGrid.nearest(this.pos, Math.min(Math.sqrt(minDistanceSq), MONSTER_SEEK_MAX));
        if (nearestSummon && distanceSq(this.pos, nearestSummon.pos) < minDistanceSq) closestTarget = nearestSummon;
        this.target = closestTarget;
    }


    attackTarget() {
        if (!this.target || !this.target.isAlive) return;
        this.target.takeDamage(this.attack * (this.weakenTimer > 0 ? 1 - CONFIG.evolution.wraithWeaken : 1), this);

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

        if (this.currentHealth <= 0) { this.die(); return; }
        if (this.affix === 'frenzy' && !this.enraged) {
            const F = CONFIG.eliteAffix.list.frenzy;
            if (this.currentHealth < this.maxHealth * F.threshold) {
                this.enraged = true;
                this.baseMoveSpeed *= F.speedMult;
                this.attackSpeed *= F.atkSpeedMult;
                // 發狂那一下用一大團火花講，之後腳下的火也會變大
                spawnParticles(this.pos.x, this.pos.y, F.color, FRENZY_BURST_SPARKS, 130, 0.6, 3);
            }
        }
    }

    die() {
        this.isAlive = false;
        registerKill();
        const ev = getWaveEvent();
        const souls = this.soulValue() * (1 + blessVal('soulHarvest')) * (1 + metaVal('soulAffinity')) * (ev && ev.soulMult ? ev.soulMult : 1) * (1 + getStreakBonus()) * curseMods().soulMult
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
        if (this.affix === 'split') {
            const S = CONFIG.eliteAffix.list.split;
            for (let i = 0; i < S.count; i++) {
                const a = (i / S.count) * Math.PI * 2;
                const m = new this.constructor(this.pos.x + Math.cos(a) * 14, this.pos.y + Math.sin(a) * 14, this.waveNumber, false);
                m.maxHealth = m.currentHealth = Math.max(1, Math.round(m.maxHealth * S.hpMult));
                gameState.monsters.push(m);
            }
            spawnParticles(this.pos.x, this.pos.y, S.color, 18, 110, 0.5, 3);
        }
        gameState.visualEffects.push(new DeathFadeEffect(this));
        Sfx.play('kill');
        // 每種怪都記：結算的「擊殺」是全部加總，只記固定幾種的話新怪物會被漏算
        gameState.totalKills[this.config.type] = (gameState.totalKills[this.config.type] || 0) + 1;
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
        if (player.isAlive && distanceSq(this.pos, player.pos) <= rSq) player.takeDamage(this.attack, this);
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
        this.maxHealth = this.currentHealth = Math.round(this.maxHealth * curseMods().bossHpMult);
    }
    applySlow(amount, duration) {
        super.applySlow(amount * (1 - this.config.slowResist), duration);
    }
    drawHealthBar() { }
    die() {
        super.die();
        spawnParticles(this.pos.x, this.pos.y, '#E1BEE7', 50, 220, 1.0, 4);
        spawnFloatText(this.pos.x, this.pos.y - 30, '首領擊破！', '#E1BEE7', 20, 1.6);
        spawnFloatText(this.pos.x, this.pos.y - 8, `+${CRYSTALS_PER_BOSS}`, '#CE93D8', 17, 1.6, 'crystal');
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
        if (player.isAlive && distanceSq(this.pos, player.pos) <= rSq) player.takeDamage(dmg, this);
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
            if (player.isAlive && !this.dashHit.has(player) && distanceSq(this.pos, player.pos) <= wSq) { this.dashHit.add(player); player.takeDamage(dmg, this); }
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
// 最終首領：召喚敵方骷髏、在身邊放新星（先紅圈預警）、往法師腳下丟詛咒地面；半血後所有招式變快
class LichBoss extends BossMonster {
    constructor(x, y, waveNumber) {
        super(x, y, waveNumber, CONFIG.lichBoss);
        const c = this.config;
        this.summonT = c.summonInterval * 0.5;
        this.novaT = c.novaInterval;
        this.curseT = c.curseInterval * 0.6;
        this.windup = 0;
        this.enraged = false;
    }
    update(deltaTime, player, summons) {
        if (!this.isAlive) return;
        const c = this.config;
        if (!this.enraged && this.currentHealth < this.maxHealth * c.phase2Ratio) {
            this.enraged = true;
            spawnFloatText(this.pos.x, this.pos.y - 40, '狂怒', '#FF8A80', 20, 1.4);
            spawnParticles(this.pos.x, this.pos.y, '#E040FB', 30, 160, 0.7, 4);
            addShake(8);
            Sfx.play('boss');
        }
        const sp = this.enraged ? c.phase2Speed : 1;
        if (this.windup > 0) {
            this.tickFlash(deltaTime);
            this.windup -= deltaTime;
            if (this.windup <= 0) this.castNova(player, summons);
            return;
        }
        this.summonT -= deltaTime * sp;
        this.novaT -= deltaTime * sp;
        this.curseT -= deltaTime * sp;
        if (this.summonT <= 0) {
            this.summonT = c.summonInterval;
            for (let i = 0; i < c.summonCount; i++) {
                const a = (i / c.summonCount) * Math.PI * 2;
                const x = this.pos.x + Math.cos(a) * 45, y = this.pos.y + Math.sin(a) * 45;
                gameState.monsters.push(new RaisedSkeletonMonster(x, y, this.waveNumber, false));
                spawnParticles(x, y, '#E53935', 8, 60, 0.5, 3);
            }
            Sfx.play('spawn');
        }
        if (this.curseT <= 0 && player.isAlive) {
            this.curseT = c.curseInterval;
            for (let i = 0; i < c.curseCount; i++) {
                const off = i === 0 ? 0 : c.curseSpread;
                gameState.hazards.push({
                    kind: 'curse', source: this, sx: this.pos.x, sy: this.pos.y - this.imageHeight * 0.3,
                    x: player.pos.x + randomInRange(-off, off), y: player.pos.y + randomInRange(-off, off),
                    r: CURSE_POOL_RADIUS, flight: CONFIG.spitter.lobTime, life: CURSE_POOL_LIFE, tick: 0, dmg: this.attack * CURSE_POOL_DAMAGE_MULT,
                });
            }
        }
        if (this.novaT <= 0) {
            this.novaT = c.novaInterval;
            this.windup = c.novaWindup;
            return;
        }
        super.update(deltaTime, player, summons);
    }
    attackTarget() { this.attackCooldown = 1.0 / this.attackSpeed; }
    castNova(player, summons) {
        const c = this.config;
        const rSq = c.novaRadius * c.novaRadius, dmg = this.attack * c.novaDamageMult;
        for (let i = 0; i < summons.length; i++) {
            const s = summons[i];
            if (s.isAlive && distanceSq(this.pos, s.pos) <= rSq) s.takeDamage(dmg);
        }
        if (player.isAlive && distanceSq(this.pos, player.pos) <= rSq) player.takeDamage(player.maxHealth * c.novaPlayerHpRatio, this);
        const effect = getVisualEffectFromPool(ExplosionEffect);
        if (effect) { effect.init(this.pos, c.novaRadius); gameState.visualEffects.push(effect); }
        spawnParticles(this.pos.x, this.pos.y, '#E040FB', 36, 200, 0.6, 3);
        addShake(10);
        Sfx.play('nova');
    }
    draw(ctx) {
        if (this.isAlive && this.windup > 0) {
            const c = this.config;
            const p = 1 - this.windup / c.novaWindup;
            ctx.save();
            ctx.fillStyle = `rgba(229, 57, 53, ${(0.12 + 0.2 * p).toFixed(2)})`;
            ctx.beginPath(); ctx.arc(this.pos.x, this.pos.y, c.novaRadius * p, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(255, 82, 82, 0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(this.pos.x, this.pos.y, c.novaRadius, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
        }
        super.draw(ctx);
    }
}
const CURSE_POOL_RADIUS = 46;
const CURSE_POOL_LIFE = 4;
const CURSE_POOL_DAMAGE_MULT = 0.5;

const BOSS_CONFIG_OF = new Map([[ColossusBoss, () => CONFIG.boss], [PlagueBoss, () => CONFIG.plagueBoss], [HunterBoss, () => CONFIG.hunterBoss], [LichBoss, () => CONFIG.lichBoss]]);

const THIEF_VANISH_PUFF = 20;
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
            // 玩家一路跟著的話牠永遠在畫面裡、永遠消失不了，而波次要等牠消失才結束：逃一陣子就直接化成煙
            if (this.life <= -this.config.escapeTime) {
                this.isAlive = false;
                spawnParticles(this.pos.x, this.pos.y, this.config.color, THIEF_VANISH_PUFF, 90, 0.6, 3);
                return;
            }
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

class AssassinMonster extends Monster {
    constructor(x, y, waveNumber, isElite) {
        super(x, y, CONFIG.assassin, waveNumber, isElite);
        this.blinkTimer = CONFIG.assassin.blinkCooldown * randomInRange(0.3, 0.8);
        this.windup = 0;
        this.mark = null;
        this.revealed = 0;
    }
    get stealthed() { return this.revealed <= 0; }
    findTarget(player) {
        this.target = player.isAlive ? player : null;
    }
    update(deltaTime, player, summons) {
        if (!this.isAlive) return;
        const c = this.config;
        if (this.revealed > 0) this.revealed -= deltaTime;
        if (this.windup > 0) {
            this.tickFlash(deltaTime);
            this.windup -= deltaTime;
            if (this.windup <= 0) this.strike(player);
            return;
        }
        this.blinkTimer -= deltaTime;
        if (this.blinkTimer <= 0 && player.isAlive && distanceSq(this.pos, player.pos) < c.blinkRange * c.blinkRange) {
            this.windup = c.blinkWindup;
            this.mark = { x: player.pos.x, y: player.pos.y };
            this.revealed = c.blinkWindup + c.revealTime;
            Sfx.play('mark');
            return;
        }
        super.update(deltaTime, player, summons);
    }
    attackTarget() { }
    strike(player) {
        const c = this.config;
        spawnParticles(this.pos.x, this.pos.y, '#7E57C2', 12, 80, 0.4, 3);
        this.pos.x = this.mark.x;
        this.pos.y = this.mark.y;
        spawnParticles(this.pos.x, this.pos.y, '#B39DDB', 16, 120, 0.4, 3);
        Sfx.play('dash');
        if (player.isAlive && distanceSq(player.pos, this.mark) <= c.strikeRadius * c.strikeRadius) {
            this.updateFacingDirection(player.pos.x - this.pos.x);
            const effect = getVisualEffectFromPool(SlashEffect);
            if (effect) { effect.init(this.pos, player.pos); gameState.visualEffects.push(effect); }
            player.takeDamage(player.maxHealth * c.strikeHpRatio, this);
        } else {
            spawnFloatText(this.mark.x, this.mark.y - 20, '閃過', '#B3E5FC', 13);
        }
        this.mark = null;
        this.blinkTimer = c.blinkCooldown;
    }
    // 標記另外畫在召喚物之上、法師之下：不然會被大軍蓋住，刺客本人在畫面外時也會漏畫
    drawMark(ctx) {
        {
            const c = this.config;
            const p = 1 - this.windup / c.blinkWindup;
            const r = c.strikeRadius;
            const { x, y } = this.mark;
            ctx.save();
            ctx.fillStyle = `rgba(229, 57, 53, ${(0.1 + 0.25 * p).toFixed(2)})`;
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(255, 82, 82, 0.95)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
            // 往內收的圈：收到判定圈時就是出手的瞬間
            ctx.globalAlpha = 0.8;
            ctx.beginPath(); ctx.arc(x, y, r * (2.2 - 1.2 * p), 0, Math.PI * 2); ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.moveTo(x - r * 0.45, y); ctx.lineTo(x + r * 0.45, y);
            ctx.moveTo(x, y - r * 0.45); ctx.lineTo(x, y + r * 0.45);
            ctx.stroke();
            ctx.restore();
        }
    }
    draw(ctx) {
        if (!this.isAlive) return;
        if (this.stealthed) ctx.globalAlpha = this.config.stealthAlpha;
        super.draw(ctx);
        ctx.globalAlpha = 1;
    }
}

class SpitterMonster extends Monster {
    constructor(x, y, waveNumber, isElite) {
        super(x, y, CONFIG.spitter, waveNumber, isElite);
        this.throwWindup = 0;
    }
    update(deltaTime, player, summons) {
        if (!this.isAlive) return;
        if (this.throwWindup > 0) {
            // 丟之前先鼓起來、發綠光：看得出「這隻要丟東西了」
            this.tickFlash(deltaTime);
            this.throwWindup -= deltaTime;
            const k = 1 - this.throwWindup / this.config.throwWindup;
            this.drawScale = 1 + 0.25 * Math.sin(k * Math.PI);
            if (this.throwWindup <= 0) { this.drawScale = 1; this.throwGlob(); }
            return;
        }
        super.update(deltaTime, player, summons);
    }
    attackTarget() {
        if (!this.target || !this.target.isAlive) return;
        this.throwWindup = this.config.throwWindup;
        this.attackCooldown = 1.0 / this.attackSpeed;
    }
    throwGlob() {
        if (!this.target || !this.target.isAlive) return;
        const c = this.config;
        const spread = c.puddleRadius * 0.4;
        gameState.hazards.push({
            source: this, sx: this.pos.x, sy: this.pos.y - this.imageHeight * 0.2,
            x: this.target.pos.x + randomInRange(-spread, spread), y: this.target.pos.y + randomInRange(-spread, spread),
            r: c.puddleRadius * (this.isElite ? CONFIG.elite.sizeMult : 1),
            flight: c.lobTime, life: c.puddleLife, tick: 0, dmg: this.attack * c.puddleDamageMult,
        });
        spawnParticles(this.pos.x, this.pos.y - this.imageHeight * 0.2, POISON_LIGHT, 8, 60, 0.35, 3);
    }
    draw(ctx) {
        if (this.isAlive && this.throwWindup > 0) {
            const k = 1 - this.throwWindup / this.config.throwWindup;
            ctx.globalAlpha = 0.25 + 0.45 * k;
            const g = this.imageWidth * 1.6;
            if (poisonGlowSprite) ctx.drawImage(poisonGlowSprite, this.pos.x - g / 2, this.pos.y - g / 2, g, g);
            ctx.globalAlpha = 1;
        }
        super.draw(ctx);
    }
}

// 毒的顏色一律用綠色（大家一看就懂是毒），投手本體是紫色，兩者靠那條拋物線連在一起
const POISON_DARK = '#33691E';
const POISON_MID = '#7CB342';
const POISON_LIGHT = '#C5E1A5';
let poisonGlowSprite = null;
function buildPoisonGlow() {
    const S = 64, r = S / 2;
    poisonGlowSprite = document.createElement('canvas');
    poisonGlowSprite.width = poisonGlowSprite.height = S;
    const g = poisonGlowSprite.getContext('2d');
    const grad = g.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, 'rgba(197, 225, 165, 0.9)');
    grad.addColorStop(0.5, 'rgba(124, 179, 66, 0.4)');
    grad.addColorStop(1, 'rgba(124, 179, 66, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, S, S);
}

class SlimeMonster extends Monster {
    constructor(x, y, waveNumber, isElite, gen = 0) {
        super(x, y, CONFIG.slime, waveNumber, isElite);
        this.gen = gen;
        if (gen > 0) {
            const c = this.config;
            const s = Math.pow(c.childScale, gen);
            this.radius *= s; this.imageWidth *= s; this.imageHeight *= s;
            this.maxHealth = this.currentHealth = Math.max(1, Math.round(this.maxHealth * Math.pow(c.childHpMult, gen)));
            this.baseMoveSpeed *= Math.pow(c.childSpeedMult, gen);
            this.moveSpeed = this.baseMoveSpeed;
        }
    }
    die() {
        super.die();
        const c = this.config;
        if (this.gen >= c.generations) return;
        for (let i = 0; i < c.splitCount; i++) {
            const a = Math.random() * Math.PI * 2;
            gameState.monsters.push(new SlimeMonster(this.pos.x + Math.cos(a) * 10, this.pos.y + Math.sin(a) * 10, this.waveNumber, false, this.gen + 1));
        }
        spawnParticles(this.pos.x, this.pos.y, '#D4E157', 10, 80, 0.4, 3);
    }
}

class BatMonster extends Monster {
    constructor(x, y, waveNumber, isElite) {
        super(x, y, CONFIG.bat, waveNumber, isElite);
        this.phase = Math.random() * Math.PI * 2;
    }
    findTarget(player) {
        this.target = player.isAlive ? player : summonGrid.nearest(this.pos);
    }
    attackTarget() {
        if (this.target !== gameState.player) { super.attackTarget(); return; }
        this.target.takeDamage(this.target.maxHealth * this.config.playerHpRatio, this);
        this.attackCooldown = 1.0 / this.attackSpeed;
    }
    update(deltaTime, player, summons) {
        if (!this.isAlive) return;
        super.update(deltaTime, player, summons);
        // 左右擺動的飛行路線：一群一起飛時不會疊成一隻
        if (!this.target) return;
        this.phase += deltaTime * 8;
        const d = normalizeVector({ x: this.target.pos.x - this.pos.x, y: this.target.pos.y - this.pos.y });
        const w = Math.sin(this.phase) * this.moveSpeed * this.config.wobble * deltaTime;
        this.pos.x += -d.y * w;
        this.pos.y += d.x * w;
    }
}

class WitchDoctorMonster extends Monster {
    constructor(x, y, waveNumber, isElite) {
        super(x, y, CONFIG.witchDoctor, waveNumber, isElite);
        this.healPulse = 0;
    }
    update(deltaTime, player, summons) {
        if (!this.isAlive) return;
        if (this.healPulse > 0) this.healPulse -= deltaTime;
        super.update(deltaTime, player, summons);
    }
    attackTarget() {
        const c = this.config;
        const rSq = c.healRadius * c.healRadius;
        monsterGrid.forEachInRadius(this.pos, c.healRadius, m => {
            if (m === this || !m.isAlive || m.currentHealth >= m.maxHealth || distanceSq(this.pos, m.pos) > rSq) return;
            m.currentHealth = Math.min(m.maxHealth, Math.round(m.currentHealth + m.maxHealth * c.healRatio));
            if (gameState.particles.length < CONFIG.visuals.maxParticles) spawnParticles(m.pos.x, m.pos.y, '#AED581', 4, 40, 0.5, 3);
        });
        this.healPulse = HEAL_PULSE_TIME;
        this.attackCooldown = 1.0 / this.attackSpeed;
        Sfx.play('heal');
    }
    draw(ctx) {
        if (this.isAlive) {
            const r = this.config.healRadius;
            // 補血範圍常駐淡綠圈；施法時一圈綠光往外擴
            ctx.strokeStyle = 'rgba(174, 213, 129, 0.35)';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(this.pos.x, this.pos.y, r, 0, Math.PI * 2); ctx.stroke();
            if (this.healPulse > 0) {
                const k = 1 - this.healPulse / HEAL_PULSE_TIME;
                ctx.fillStyle = `rgba(174, 213, 129, ${(0.3 * (1 - k)).toFixed(2)})`;
                ctx.beginPath(); ctx.arc(this.pos.x, this.pos.y, r * k, 0, Math.PI * 2); ctx.fill();
            }
        }
        super.draw(ctx);
    }
}
const HEAL_PULSE_TIME = 0.5;

class ShieldGuardMonster extends Monster {
    constructor(x, y, waveNumber, isElite) { super(x, y, CONFIG.shieldGuard, waveNumber, isElite); }
}

class CorpseWormMonster extends Monster {
    constructor(x, y, waveNumber, isElite) {
        super(x, y, CONFIG.corpseWorm, waveNumber, isElite);
        this.state = 'burrow';
        this.stateT = this.config.burrowTime * randomInRange(0.6, 1);
        this.mark = null;
    }
    // 在地底與預警時召喚物看不到、也打不到
    get stealthed() { return this.state !== 'surface'; }
    takeDamage(amount) {
        if (this.stealthed) return;
        super.takeDamage(amount);
    }
    update(deltaTime, player, summons) {
        if (!this.isAlive) return;
        const c = this.config;
        this.tickFlash(deltaTime);
        if (this.slowTimer > 0) { this.slowTimer -= deltaTime; if (this.slowTimer <= 0) { this.speedMultiplier = 1; this.slowTimer = 0; } }
        this.stateT -= deltaTime;
        if (this.state === 'burrow') {
            // 鑽到大軍裡最靠近法師的那隻底下；沒有召喚物就鑽到法師腳下
            const s = summonGrid.nearest(player.pos, WORM_SEEK_RADIUS);
            const tgt = s ? s.pos : player.pos;
            const dx = tgt.x - this.pos.x, dy = tgt.y - this.pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const step = Math.min(dist, this.baseMoveSpeed * this.speedMultiplier * deltaTime);
            this.pos.x += dx / dist * step;
            this.pos.y += dy / dist * step;
            if (dist < WORM_ARRIVE_DIST || this.stateT <= 0) {
                this.state = 'warn';
                this.stateT = c.warnTime;
                this.mark = { x: this.pos.x, y: this.pos.y };
                Sfx.play('rumble');
            }
            return;
        }
        if (this.state === 'warn') {
            if (this.stateT <= 0) this.erupt(player);
            return;
        }
        this.drawScale = Math.min(1, 0.4 + (c.surfaceTime - this.stateT) * 3);
        if (this.stateT <= 0) {
            this.state = 'burrow';
            this.stateT = c.burrowTime;
            this.drawScale = 1;
            spawnParticles(this.pos.x, this.pos.y, '#795548', 10, 70, 0.4, 3);
        }
    }
    erupt(player) {
        const c = this.config;
        this.state = 'surface';
        this.stateT = c.surfaceTime;
        this.mark = null;
        const r = c.eruptRadius, rSq = r * r, dmg = this.attack * c.eruptDamageMult;
        summonGrid.forEachInRadius(this.pos, r, s => { if (s.isAlive && distanceSq(this.pos, s.pos) <= rSq) s.takeDamage(dmg); });
        if (player.isAlive && distanceSq(this.pos, player.pos) <= rSq) player.takeDamage(player.maxHealth * c.eruptPlayerHpRatio, this);
        spawnParticles(this.pos.x, this.pos.y, '#8D6E63', 26, 160, 0.6, 4);
        addShake(6);
        Sfx.play('slam');
    }
    drawMark(ctx) {
        const c = this.config;
        const p = 1 - this.stateT / c.warnTime;
        const r = c.eruptRadius;
        const { x, y } = this.mark;
        ctx.save();
        ctx.fillStyle = `rgba(229, 57, 53, ${(0.12 + 0.22 * p).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(x, y, r * p, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255, 82, 82, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
        // 地面裂縫
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 3;
        for (let i = 0; i < 6; i++) {
            const a = i * 1.05 + 0.3;
            const len = r * (0.35 + 0.5 * p) * (0.7 + 0.3 * ((i * 37) % 10) / 10);
            ctx.beginPath(); ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(a) * len * 0.5 + Math.sin(a) * 5, y + Math.sin(a) * len * 0.5 - Math.cos(a) * 5);
            ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
            ctx.stroke();
        }
        ctx.restore();
    }
    draw(ctx) {
        if (!this.isAlive) return;
        if (this.stealthed) {
            // 地底移動中只看得到一團隆起的土
            const t = worldTime;
            ctx.fillStyle = '#4E342E';
            ctx.beginPath(); ctx.ellipse(this.pos.x, this.pos.y, 16, 8, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#6D4C41';
            for (let i = 0; i < 4; i++) {
                const a = i * 1.6 + t * 6;
                ctx.beginPath(); ctx.arc(this.pos.x + Math.cos(a) * 9, this.pos.y - 3 + Math.sin(a * 2) * 2, 3, 0, Math.PI * 2); ctx.fill();
            }
            return;
        }
        super.draw(ctx);
    }
}
const WORM_SEEK_RADIUS = 220;
const WORM_ARRIVE_DIST = 12;

class GravePriestMonster extends Monster {
    constructor(x, y, waveNumber, isElite) {
        super(x, y, CONFIG.gravePriest, waveNumber, isElite);
        this.raiseCd = 0;
        this.raised = 0;
        this.beams = [];
    }
    update(deltaTime, player, summons) {
        if (!this.isAlive) return;
        if (this.raiseCd > 0) this.raiseCd -= deltaTime;
        for (const b of this.beams) b.life -= deltaTime;
        this.beams = this.beams.filter(b => b.life > 0);
        super.update(deltaTime, player, summons);
    }
    attackTarget() { this.attackCooldown = 1.0 / this.attackSpeed; }
    tryRaise(summon) {
        const c = this.config;
        if (this.raiseCd > 0 || this.raised >= c.maxRaised || distanceSq(this.pos, summon.pos) > c.raiseRadius * c.raiseRadius) return false;
        gameState.monsters.push(new RaisedSkeletonMonster(summon.pos.x, summon.pos.y, this.waveNumber, false));
        this.raised++;
        this.raiseCd = c.raiseCooldown;
        this.beams.push({ x: summon.pos.x, y: summon.pos.y, life: PRIEST_BEAM_TIME });
        spawnParticles(summon.pos.x, summon.pos.y, '#69F0AE', 10, 60, 0.5, 3);
        Sfx.play('raise');
        return true;
    }
    draw(ctx) {
        if (this.isAlive) {
            ctx.strokeStyle = 'rgba(105, 240, 174, 0.3)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 6]);
            ctx.beginPath(); ctx.arc(this.pos.x, this.pos.y, this.config.raiseRadius, 0, Math.PI * 2); ctx.stroke();
            ctx.setLineDash([]);
            for (const b of this.beams) {
                ctx.strokeStyle = `rgba(105, 240, 174, ${(b.life / PRIEST_BEAM_TIME).toFixed(2)})`;
                ctx.lineWidth = 3;
                ctx.beginPath(); ctx.moveTo(this.pos.x, this.pos.y - this.imageHeight * 0.2); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
        }
        super.draw(ctx);
    }
}
const PRIEST_BEAM_TIME = 0.5;

class RaisedSkeletonMonster extends Monster {
    constructor(x, y, waveNumber, isElite) { super(x, y, CONFIG.raisedSkeleton, waveNumber, isElite); }
}

// 傳說「骸骨爆裂」：骷髏陣亡時炸一圈
function boneBurst(s) {
    const dmg = s.attack * BLESSINGS.boneBurst.per;
    const rSq = BONE_BURST_RADIUS * BONE_BURST_RADIUS;
    monsterGrid.forEachInRadius(s.pos, BONE_BURST_RADIUS, m => {
        if (m.isAlive && distanceSq(s.pos, m.pos) <= rSq) m.takeDamage(dmg);
    });
    spawnParticles(s.pos.x, s.pos.y, '#FFE0B2', 8, 140, 0.35, 3);
    Sfx.play('explode');
}

// 召喚物陣亡時：附近的墓地祭司把它復活成敵方骷髏
function onSummonDeath(summon) {
    const ps = gameState.priests;
    if (!ps || !ps.length) return;
    for (let i = 0; i < ps.length; i++) if (ps[i].isAlive && ps[i].tryRaise(summon)) return;
}

// 毒池：先飛（地上有預警圈）、落地後持續傷害圈內的召喚物與法師
function updateHazards(deltaTime) {
    const c = CONFIG.spitter;
    const p = gameState.player;
    for (const h of gameState.hazards) {
        if (h.flight > 0) {
            h.flight -= deltaTime;
            if (h.flight <= 0) {
                spawnParticles(h.x, h.y, hazardStyle(h).mid, 14, 90, 0.4, 3);
                Sfx.play('splat');
            }
            continue;
        }
        h.life -= deltaTime;
        h.tick -= deltaTime;
        if (h.tick > 0) continue;
        h.tick = c.puddleTick;
        const rSq = h.r * h.r;
        summonGrid.forEachInRadius(h, h.r, s => { if (s.isAlive && distanceSq(h, s.pos) <= rSq) s.takeDamage(h.dmg); });
        if (p && p.isAlive && distanceSq(h, p.pos) <= rSq) {
            p.takeDamage(p.maxHealth * c.puddlePlayerHpRatio, h.source);
            spawnFloatText(p.pos.x, p.pos.y - 30, hazardStyle(h).hurtText, hazardStyle(h).light, 13, 0.6);
        }
    }
    gameState.hazards = gameState.hazards.filter(h => h.life > 0);
}

// 拋物線上的一點：k = 0 在投手手上，1 在落點
function lobPoint(h, k) {
    return { x: h.sx + (h.x - h.sx) * k, y: h.sy + (h.y - h.sy) * k - Math.sin(k * Math.PI) * LOB_ARC_HEIGHT };
}
const LOB_ARC_HEIGHT = 70;
// 投手的毒是綠色、亡靈王的詛咒地面是紫色；其他畫法一樣
const HAZARD_STYLES = {
    poison: { fill: 'rgba(124, 179, 66, 0.42)', dark: POISON_DARK, mid: POISON_MID, light: POISON_LIGHT, hurtText: '中毒' },
    curse: { fill: 'rgba(123, 31, 162, 0.45)', dark: '#4A148C', mid: '#AB47BC', light: '#E1BEE7', hurtText: '詛咒' },
};
function hazardStyle(h) {
    return HAZARD_STYLES[h.kind || 'poison'];
}
const LOB_PATH_DOTS = 12;

function drawHazards() {
    if (!poisonGlowSprite) buildPoisonGlow();
    const t = worldTime;
    const skull = getIconImage('skull');
    for (const h of gameState.hazards) {
        if (h.flight > 0 || !inView(h)) continue;
        const fade = Math.min(1, h.life * 2);
        const st = hazardStyle(h);
        ctx.globalAlpha = fade;
        ctx.fillStyle = st.fill;
        ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = st.dark;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.strokeStyle = st.mid;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(h.x, h.y, h.r - 3, 0, Math.PI * 2); ctx.stroke();
        // 冒泡＋往上飄的毒煙
        for (let i = 0; i < 5; i++) {
            const ph = (t * 0.8 + i * 0.37) % 1;
            const a = i * 1.7, rr = h.r * (0.2 + 0.13 * i);
            const bx = h.x + Math.cos(a) * rr, by = h.y + Math.sin(a) * rr * 0.6;
            ctx.globalAlpha = fade * (1 - ph) * 0.8;
            ctx.fillStyle = st.light;
            ctx.beginPath(); ctx.arc(bx, by - ph * 26, 2.5 + ph * 4, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = fade * 0.9;
        if (skull) ctx.drawImage(skull, h.x - 11, h.y - 11, 22, 22);
        ctx.globalAlpha = 1;
    }
}

// 飛行中的毒團與落點預警畫在召喚物之上：大軍擠在一起時才不會被蓋住
function drawLobs() {
    if (!gameState.hazards.length) return;
    if (!poisonGlowSprite) buildPoisonGlow();
    const lob = CONFIG.spitter.lobTime;
    const skull = getIconImage('skull');
    for (const h of gameState.hazards) {
        if (h.flight <= 0) continue;
        const k = 1 - h.flight / lob;
        // 落點：跟巨像重擊同一套「紅圈越填越滿，滿了就落下」
        if (inView(h)) {
            ctx.fillStyle = `rgba(229, 57, 53, ${(0.12 + 0.2 * k).toFixed(2)})`;
            ctx.beginPath(); ctx.arc(h.x, h.y, h.r * k, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(255, 82, 82, 0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.stroke();
            if (skull) { ctx.globalAlpha = 0.85; ctx.drawImage(skull, h.x - 10, h.y - 10, 20, 20); ctx.globalAlpha = 1; }
        }
        // 剩下要飛的那段拋物線畫成虛線：看得出是哪一隻丟的、會掉在哪
        ctx.beginPath();
        for (let i = 0; i <= LOB_PATH_DOTS; i++) {
            const pt = lobPoint(h, k + (1 - k) * (i / LOB_PATH_DOTS));
            if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
        }
        ctx.lineCap = 'round';
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = 'rgba(14, 10, 20, 0.6)';
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.strokeStyle = hazardStyle(h).light;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.setLineDash([]);
        const g = lobPoint(h, k);
        ctx.drawImage(poisonGlowSprite, g.x - 14, g.y - 14, 28, 28);
        ctx.fillStyle = hazardStyle(h).mid;
        ctx.strokeStyle = hazardStyle(h).dark;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(g.x, g.y, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
}

// ---------- 詛咒：通關後解鎖的自選難度，每一級多一條規則、結晶倍率跟著提高（同 Hades 熱度 / Slay the Spire 進階） ----------
const CURSES = [
    { icon: 'claws', name: '兇暴', desc: '怪物血量 +25%', hpMult: 1.25 },
    { icon: 'warning', name: '暗殺令', desc: '刺客提早出現、數量加倍', assassinEarly: true },
    { icon: 'fastForward', name: '疾行', desc: '怪物移速 +15%', speedMult: 1.15 },
    { icon: 'soul', name: '貧瘠', desc: '靈魂掉落 -20%', soulMult: 0.8 },
    { icon: 'crown', name: '精英橫行', desc: '精英怪機率 ×2', eliteMult: 2 },
    { icon: 'skull', name: '暴君', desc: '首領血量 +50%', bossHpMult: 1.5 },
    { icon: 'heart', name: '脆弱', desc: '法師血量 -30%', mageHpMult: 0.7 },
    { icon: 'flame', name: '血債', desc: '怪物攻擊 +30%', atkMult: 1.3 },
];
const CURSE_CRYSTAL_STEP = 0.3;
const ASSASSIN_EARLY_WAVE = 6;
const VICTORY_CRYSTALS = 100;
function curseMods() {
    const m = { hpMult: 1, atkMult: 1, speedMult: 1, soulMult: 1, eliteMult: 1, bossHpMult: 1, mageHpMult: 1, assassinEarly: false };
    const lv = (gameState && gameState.curse) || 0;
    for (let i = 0; i < lv && i < CURSES.length; i++) {
        const c = CURSES[i];
        for (const k of ['hpMult', 'atkMult', 'speedMult', 'soulMult', 'eliteMult', 'bossHpMult', 'mageHpMult']) if (c[k]) m[k] *= c[k];
        if (c.assassinEarly) m.assassinEarly = true;
    }
    return m;
}
function curseCrystalMult(lv = gameState.curse || 0) {
    return 1 + CURSE_CRYSTAL_STEP * lv;
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
        if (p) spawnFloatText(p.pos.x, p.pos.y - 50, `${gameState.streak} 連殺！`, '#FFAB40', 22, 1.4, 'flame');
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
    const cm = curseMods();
    const cycle = isBossWave ? W.bossWaveCountFactor : W.cycleCountFactors[wave % W.bossEvery];
    const factor = cycle * (ev && ev.countMult ? ev.countMult : 1);
    const classes = [];
    const add = (Cls, n) => { for (let i = 0; i < n; i++) classes.push(Cls); };
    add(BasicMeleeMonster, Math.round((W.basicBase + wave * W.basicPerWave) * factor));
    [[CONFIG.fastMeleeMonster, FastMeleeMonster], [CONFIG.bloaterMonster, BloaterMonster], [CONFIG.armoredMeleeMonster, ArmoredMeleeMonster],
    [CONFIG.assassin, AssassinMonster], [CONFIG.spitter, SpitterMonster], [CONFIG.slime, SlimeMonster], [CONFIG.bat, BatMonster],
    [CONFIG.witchDoctor, WitchDoctorMonster], [CONFIG.shieldGuard, ShieldGuardMonster], [CONFIG.corpseWorm, CorpseWormMonster],
    [CONFIG.gravePriest, GravePriestMonster]]
        .forEach(([cfg, Cls]) => {
            const early = Cls === AssassinMonster && cm.assassinEarly;
            const minWave = early ? ASSASSIN_EARLY_WAVE : cfg.minWave;
            if (wave < minWave) return;
            const typeMult = (Cls === BloaterMonster && ev && ev.bloaterMult ? ev.bloaterMult : 1) * (early ? 2 : 1) * (cfg.flockSize || 1);
            add(Cls, Math.max(1, Math.round((1 + Math.floor((wave - minWave) / cfg.waveInterval)) * factor * typeMult)));
        });
    if (ev && ev.thieves) add(ThiefMonster, ev.thieves);
    for (let i = classes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [classes[i], classes[j]] = [classes[j], classes[i]];
    }
    let eliteChance = getEliteChance(wave) * cm.eliteMult;
    if (ev && ev.eliteMult) eliteChance = Math.min(ev.eliteMax, Math.max(CONFIG.elite.chanceBase, eliteChance) * ev.eliteMult);
    const queue = classes.map(Cls => ({ Cls, elite: Cls !== ThiefMonster && Math.random() < eliteChance }));
    if (isFinalWave(wave)) queue.unshift({ Cls: LichBoss, elite: false });
    else if (isBossWave) queue.unshift({ Cls: getBossClass(wave), elite: false });
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

// 新威脅第一次出現的那一波，橫幅改成介紹它：一句「看到什麼就做什麼」
function getNewcomer(wave) {
    const assassinWave = curseMods().assassinEarly ? ASSASSIN_EARLY_WAVE : CONFIG.assassin.minWave;
    // cfg：那隻怪的設定，名字與橫幅上的立繪都從那裡拿；精英詞綴不是一種怪，自己給名字、只用圖示
    const list = [
        { wave: assassinWave, cfg: CONFIG.assassin, hint: '腳下出現紅圈就快走開', icon: 'warning', color: '#EF9A9A' },
        { wave: CONFIG.slime.minWave, cfg: CONFIG.slime, hint: '打死會分裂', icon: 'plague', color: '#E6EE9C' },
        { wave: CONFIG.witchDoctor.minWave, cfg: CONFIG.witchDoctor, hint: '會幫怪物補血，先殺牠', icon: 'raiseDead', color: '#AED581' },
        { wave: CONFIG.bat.minWave, cfg: CONFIG.bat, hint: '直撲法師，邊走邊放新星', icon: 'claws', color: '#BCAAA4' },
        { wave: CONFIG.shieldGuard.minWave, cfg: CONFIG.shieldGuard, hint: '盾牌擋飛彈，靠骷髏近戰', icon: 'boneArmor', color: '#B0BEC5' },
        { wave: CONFIG.spitter.minWave, cfg: CONFIG.spitter, hint: '別站進綠色毒池', icon: 'plague', color: POISON_LIGHT },
        { wave: CONFIG.eliteAffix.startWave, name: '精英詞綴', hint: '綠光環繞的會分裂、冒火的會暴走', icon: 'crown', color: '#FFD54F' },
        { wave: CONFIG.corpseWorm.minWave, cfg: CONFIG.corpseWorm, hint: '地面裂開就散開', icon: 'warning', color: '#BCAAA4' },
        { wave: CONFIG.gravePriest.minWave, cfg: CONFIG.gravePriest, hint: '會把陣亡的召喚物變成敵人，先殺牠', icon: 'skull', color: '#69F0AE' },
    ];
    const hit = list.find(n => n.wave === wave);
    if (!hit) return null;
    return { name: hit.cfg ? hit.cfg.name : hit.name, hint: hit.hint, icon: hit.icon, color: hit.color, look: hit.cfg ? monsterLook(hit.cfg) : null };
}

function isFinalWave(wave) {
    return wave === CONFIG.wave.finalWave;
}
// 通關前顯示離終點還有多遠；通關後是無盡模式
function waveLabel(wave) {
    return gameState.endless ? `無盡 ${wave}` : `第 ${wave}/${CONFIG.wave.finalWave} 波`;
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
    gameState.hazards = [];
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
        if (isFinalWave(waveNum)) {
            gameState.banner = { text: '最終決戰', sub: `${CONFIG.lichBoss.name}降臨`, color: '#FF8A65', life: CONFIG.wave.bannerDuration * 1.5, icon: 'crown' };
        } else {
            const bossName = BOSS_CONFIG_OF.get(getBossClass(waveNum))().name;
            gameState.banner = { text: '首領來襲', sub: `第 ${waveNum} 波 · ${bossName}`, color: '#E1BEE7', life: CONFIG.wave.bannerDuration, icon: 'warning' };
        }
    } else if (getNewcomer(waveNum)) {
        const n = getNewcomer(waveNum);
        gameState.banner = { text: n.name, sub: `新威脅 · ${n.hint}`, color: n.color, life: CONFIG.wave.bannerDuration * 1.8, icon: n.icon, look: n.look };
    } else if (ev) {
        gameState.banner = { text: ev.name, sub: `第 ${waveNum} 波 · ${ev.desc}`, color: ev.color, life: CONFIG.wave.bannerDuration * 1.3, icon: ev.icon };
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
        spawnCrystalText(CRYSTALS_PER_WAVE);
        queueDraftIfDue();
        gameState.projectiles.forEach(returnProjectileToPool);
        gameState.projectiles = [];
        gameState.visualEffects.forEach(returnVisualEffectToPool);
        gameState.visualEffects = [];
        gameState.hazards = [];
        const won = isFinalWave(gameState.currentWave) && !gameState.endless;
        if (won) gameState.endless = true;
        saveGameState();
        updateUI();
        if (won) showVictory();
        else if (gameState.pendingDraft) openDraft();
    }
}

// ---------- 通關 ----------
function showVictory() {
    const lv = gameState.curse || 0;
    const bonus = Math.round(VICTORY_CRYSTALS * curseCrystalMult(lv));
    meta.crystals += bonus;
    meta.wins = (meta.wins || 0) + 1;
    const unlockedBefore = meta.curseUnlocked || 0;
    if (lv >= unlockedBefore && unlockedBefore < CURSES.length) meta.curseUnlocked = lv + 1;
    saveMeta();
    gameState.victoryOpen = true;
    stopHoldAction();
    uiElements.victoryReward.innerHTML = `${iconHtml('crystal')}+${bonus}`;
    const newCurse = (meta.curseUnlocked || 0) > unlockedBefore;
    uiElements.victoryUnlock.classList.toggle('hidden', !newCurse);
    if (newCurse) uiElements.victoryUnlock.innerHTML = `${iconHtml(CURSES[meta.curseUnlocked - 1].icon)}解鎖詛咒 ${meta.curseUnlocked}`;
    showScreen(uiElements.victoryScreen, true);
    Sfx.play('victory');
}

function continueEndless() {
    gameState.victoryOpen = false;
    showScreen(uiElements.victoryScreen, false);
    loopLastTime = performance.now();
    if (gameState.pendingDraft) openDraft();
}

function endRunFromVictory() {
    gameState.victoryOpen = false;
    showScreen(uiElements.victoryScreen, false);
    gameState.gameOver = true;
    showGameOver('victory');
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
    queueDraft(w % CONFIG.wave.bossEvery === 0);
}

function shuffled(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
// 首領波：三張裡固定一張傳說（還有沒拿過的才給），放在隨機位置；其他波只有一般祝福
function rollDraftOptions(boss) {
    const open = id => bl(id) < BLESSINGS[id].max;
    const regular = shuffled(Object.keys(BLESSINGS).filter(id => open(id) && !BLESSINGS[id].legendary));
    const legend = boss ? shuffled(Object.keys(BLESSINGS).filter(id => open(id) && BLESSINGS[id].legendary))[0] : null;
    if (!legend) return regular.slice(0, CONFIG.draft.optionCount);
    const options = regular.slice(0, CONFIG.draft.optionCount - 1);
    options.splice(Math.floor(Math.random() * (options.length + 1)), 0, legend);
    return options;
}

function queueDraft(boss = false) {
    const options = rollDraftOptions(boss);
    if (options.length > 0) gameState.pendingDraft = { options, rerolls: 0, boss };
}

// 重抽：永久強化給的免費次數用完後，每次比上一次貴
const REROLL_BASE_COST = 20;
function rerollCost() {
    const used = gameState.pendingDraft ? (gameState.pendingDraft.rerolls || 0) : 0;
    const free = metaLv('freeReroll');
    return used < free ? 0 : REROLL_BASE_COST * (used - free + 1);
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

function renderDraftCards() {
    const box = uiElements.draftCards;
    box.innerHTML = '';
    gameState.pendingDraft.options.forEach(id => {
        const b = BLESSINGS[id];
        const card = document.createElement('button');
        card.className = `draft-card panel${b.legendary ? ' legendary' : ''}`;
        card.innerHTML = `${iconHtml(id, 'icon card-icon')}<span class="draft-name">${b.name}</span><span class="pips">${blessingPips(id, true)}</span><span class="draft-desc">${b.desc(b)}</span>`;
        // 用 pointerup 不用 click：另一隻手指還按著搖桿時瀏覽器不會合成 click。
        // 不用 pointerdown，是因為祝福選了收不回來，按下去還能滑開反悔
        // 觸控的 pointerup 一定回到按下的那張卡（隱式捕捉），所以要自己看放開時手指還在不在卡上
        card.addEventListener('pointerup', (e) => {
            const r = card.getBoundingClientRect();
            if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) pickBlessing(id);
        });
        box.appendChild(card);
    });
    const cost = rerollCost();
    uiElements.rerollBtn.innerHTML = cost === 0
        ? `${iconHtml('reroll', 'icon btn-icon')}免費重抽`
        : `${iconHtml('reroll', 'icon btn-icon')}重抽<span class="price">${iconHtml('soul')}${cost}</span>`;
    uiElements.rerollBtn.disabled = gameState.souls < cost;
}

function openDraft() {
    if (!gameState.pendingDraft) return;
    stopHoldAction();
    gameState.draftOpen = true;
    renderDraftCards();
    showScreen(uiElements.draftScreen, true);
    Sfx.play('draft');
    updateUI();
}

function rerollDraft() {
    if (!gameState.pendingDraft) return;
    const cost = rerollCost();
    if (gameState.souls < cost) return;
    gameState.souls -= cost;
    gameState.pendingDraft.rerolls = (gameState.pendingDraft.rerolls || 0) + 1;
    gameState.pendingDraft.options = rollDraftOptions(gameState.pendingDraft.boss);
    renderDraftCards();
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
    showScreen(uiElements.draftScreen, false);
    if (gameState.extraDrafts > 0) {
        gameState.extraDrafts--;
        queueDraft();
    }
    if (gameState.player) {
        spawnParticles(gameState.player.pos.x, gameState.player.pos.y, '#FFD54F', 24, 120, 0.7, 3);
        spawnFloatText(gameState.player.pos.x, gameState.player.pos.y - 26, BLESSINGS[id].name, '#FFD54F', 16, 1.4, id);
    }
    Sfx.play('pick');
    saveGameState();
    updateUI();
    if (gameState.pendingDraft) openDraft();
}

// 暫停選單：每個祝福疊了幾層、加起來的實際效果
function blessTotalDesc(id) {
    const B = BLESSINGS[id], lv = bl(id);
    return (B.totalDesc || B.desc)({ ...B, per: B.per * lv, cdPer: (B.cdPer || 0) * lv });
}
function renderBlessingDetail(container) {
    const ids = Object.keys(BLESSINGS).filter(id => bl(id) > 0);
    container.innerHTML = ids.length === 0 ? '<span class="empty-note">還沒有祝福</span>' : ids.map(id => {
        const B = BLESSINGS[id], lv = bl(id);
        const pips = Array.from({ length: B.max }, (_, i) => `<span class="pip ${i < lv ? 'on' : ''}"></span>`).join('');
        return `<div class="bless-row">${iconHtml(id)}<div class="bless-text"><div class="bless-name"><span class="nm">${B.name}</span><span class="pips">${pips}</span></div><div class="bless-effect">${blessTotalDesc(id)}</div></div></div>`;
    }).join('');
}

function renderBlessingList(container) {
    const ids = Object.keys(BLESSINGS).filter(id => bl(id) > 0);
    container.innerHTML = ids.length === 0 ? '<span class="empty-note">還沒有祝福</span>' : ids.map(id =>
        `<span class="bless-chip">${iconHtml(id)}${BLESSINGS[id].name}${bl(id) > 1 ? `<b>${bl(id)}</b>` : ''}</span>`).join('');
}

// ---------- 畫面切換：標題 / 遊玩中，以及疊在上面的視窗 ----------
let appScreen = 'loading';
function showScreen(el, show) {
    el.style.display = show ? 'flex' : 'none';
}

let confirmAction = null;
function showConfirm(title, text, yesLabel, onYes) {
    uiElements.confirmTitle.textContent = title;
    uiElements.confirmText.textContent = text;
    uiElements.confirmYes.textContent = yesLabel;
    confirmAction = onYes;
    showScreen(uiElements.confirmDialog, true);
}

function peekSave() {
    try {
        const s = JSON.parse(localStorage.getItem(SAVE_KEY));
        if (s && COMPATIBLE_SAVE_VERSIONS.includes(s.saveVersion)) return s;
    } catch (e) { }
    return null;
}
function getBestWave() {
    try { return parseInt(localStorage.getItem(BEST_WAVE_KEY), 10) || 0; } catch (e) { return 0; }
}

function refreshTitle() {
    const save = peekSave();
    uiElements.titleContinueBtn.classList.toggle('hidden', !save);
    if (save) uiElements.titleContinueBtn.innerHTML = `${iconHtml('play', 'icon btn-icon')}繼續 · 第 ${save.currentWave} 波`;
    uiElements.titleStartBtn.classList.toggle('btn-gold', !save);
    uiElements.titleStartBtn.classList.toggle('btn-green', !!save);
    const curse = Math.min(meta.curseSelected || 0, meta.curseUnlocked || 0);
    uiElements.titleStartBtn.textContent = curse > 0 ? `開始遊戲 · 詛咒 ${curse}` : '開始遊戲';
    uiElements.titleCurseBtn.classList.toggle('hidden', !(meta.curseUnlocked > 0));
    const best = getBestWave();
    const wins = meta.wins || 0;
    uiElements.titleBest.innerHTML = (best > 0 ? `${iconHtml('trophy')}最佳 ${best} 波　` : '') +
        (wins > 0 ? `${iconHtml('crown')}通關 ${wins}　` : '') +
        `<span class="crystal-count">${iconHtml('crystal')}${meta.crystals}</span>`;
}

function showTitle() {
    // 標題背景畫的是 gameState：不清掉的話上一局的怪、連殺數會留在背景，
    // 震動值也只在遊戲更新時才衰減，離開那一下在震的話背景會一直抖。
    // 開新局（resetGame）與繼續（loadGameState）都會重建狀態，存檔不受影響
    setupNewRun();
    appScreen = 'title';
    gameState.isPaused = false;
    uiElements.hud.classList.add('hidden');
    [uiElements.gameOverScreen, uiElements.pauseMenu, uiElements.draftScreen, uiElements.victoryScreen].forEach(el => showScreen(el, false));
    showScreen(uiElements.titleScreen, true);
    refreshTitle();
    // 收掉遊戲中墊的那一筆歷史，標題畫面按返回才會照常離開
    if (history.state && history.state.inGame) history.back();
}

// 手機的返回鍵 / 返回手勢：遊戲中先墊一筆歷史，按返回只會觸發 popstate（拿來暫停），不會直接離開頁面
function armBackButton() {
    if (!(history.state && history.state.inGame)) history.pushState({ inGame: true }, '');
}
function handleBackButton() {
    if (appScreen !== 'playing') return;
    armBackButton();
    if (gameState.gameOver) { showTitle(); return; }
    if (gameState.draftOpen || gameState.victoryOpen) return;
    if (uiElements.confirmDialog.style.display === 'flex') { showScreen(uiElements.confirmDialog, false); return; }
    togglePause();
}

function enterPlaying() {
    appScreen = 'playing';
    armBackButton();
    showScreen(uiElements.titleScreen, false);
    uiElements.hud.classList.remove('hidden');
    resizeCanvas();
    loopLastTime = performance.now();
    ensureMusicPlaying();
    startTutorialIfNeeded();
    updateUI();
    if (gameState.pendingDraft) openDraft();
}

function startNewRun() {
    const begin = () => { resetGame(); enterPlaying(); };
    const save = peekSave();
    if (save && save.currentWave > 0) showConfirm('開始新的一局？', `第 ${save.currentWave} 波的進度會被覆蓋`, '開始', begin);
    else begin();
}

function continueRun() {
    if (!loadGameState()) { refreshTitle(); return; }
    restoreSummonsFromLoad();
    enterPlaying();
}

let metaReturnTo = 'title';
function openMeta(returnTo) {
    metaReturnTo = returnTo;
    renderMeta();
    showScreen(uiElements.metaScreen, true);
}
function closeMeta() {
    showScreen(uiElements.metaScreen, false);
    if (metaReturnTo === 'title') refreshTitle();
}
function renderMeta() {
    uiElements.metaCrystals.innerHTML = `${iconHtml('crystal')}${meta.crystals}`;
    uiElements.metaList.innerHTML = Object.entries(META_UPGRADES).map(([id, m]) => {
        const lv = metaLv(id), maxed = lv >= m.max, cost = metaCost(id);
        const pips = Array.from({ length: m.max }, (_, i) => `<span class="pip ${i < lv ? 'on' : ''}"></span>`).join('');
        const btn = maxed
            ? '<button class="btn btn-dark" disabled>已滿</button>'
            : `<button class="btn btn-gold" data-meta="${id}" ${meta.crystals < cost ? 'disabled' : ''}><span class="price">${iconHtml('crystal')}${cost}</span></button>`;
        return `<div class="meta-row">${iconHtml(m.icon)}<div class="meta-info"><div class="meta-name">${m.name}<span class="pips">${pips}</span></div><div class="meta-desc">${m.desc(m)}</div></div>${btn}</div>`;
    }).join('');
}
function buyMeta(id) {
    const m = META_UPGRADES[id];
    if (!m || metaLv(id) >= m.max) return;
    const cost = metaCost(id);
    if (meta.crystals < cost) return;
    meta.crystals -= cost;
    meta.upgrades[id] = metaLv(id) + 1;
    saveMeta();
    Sfx.unlock();
    Sfx.play('upgrade');
    renderMeta();
}

// ---------- 詛咒選單 ----------
function renderCurse() {
    const unlocked = meta.curseUnlocked || 0;
    const sel = Math.min(meta.curseSelected || 0, unlocked);
    uiElements.curseLevel.textContent = sel;
    uiElements.curseMult.innerHTML = `${iconHtml('crystal')}×${curseCrystalMult(sel).toFixed(1)}`;
    uiElements.curseMinus.disabled = sel <= 0;
    uiElements.cursePlus.disabled = sel >= unlocked;
    uiElements.curseList.innerHTML = CURSES.map((c, i) => {
        const locked = i >= unlocked;
        const cls = locked ? 'locked' : (i < sel ? 'on' : '');
        return `<div class="curse-row ${cls}"><span class="lv">${i + 1}</span>${iconHtml(locked ? 'lock' : c.icon)}<div class="meta-desc">${c.desc}</div></div>`;
    }).join('');
}
function stepCurse(d) {
    meta.curseSelected = Math.max(0, Math.min(meta.curseUnlocked || 0, (meta.curseSelected || 0) + d));
    saveMeta();
    renderCurse();
}

// ---------- 新手提示（只在第一局）：先教移動，再教召喚 ----------
const TUTORIAL_MOVE_DIST = 60;
let tutorial = null;
function startTutorialIfNeeded() {
    if (meta.tutorialDone || gameState.currentWave > 0 || !gameState.player) return;
    tutorial = { step: 'move', start: { ...gameState.player.pos } };
}
function updateTutorial() {
    if (!tutorial || !gameState.player) return;
    if (tutorial.step === 'move' && distanceSq(gameState.player.pos, tutorial.start) > TUTORIAL_MOVE_DIST * TUTORIAL_MOVE_DIST) {
        tutorial.step = 'summon';
        uiElements.summonSkeletonBtn.classList.add('hint-pulse');
    } else if (tutorial.step === 'summon' && gameState.totalSummons.SkeletonWarrior > 0) {
        uiElements.summonSkeletonBtn.classList.remove('hint-pulse');
        tutorial = null;
        meta.tutorialDone = true;
        saveMeta();
    }
}
function drawTutorial() {
    if (!tutorial) return;
    const t = performance.now() / 1000;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    if (tutorial.step === 'move') {
        const cx = view.cssW / 2, cy = view.cssH * 0.6;
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = 'rgba(233, 196, 106, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx, cy, JOYSTICK_RADIUS, 0, Math.PI * 2); ctx.stroke();
        const kx = cx + Math.sin(t * 2.2) * JOYSTICK_RADIUS * 0.7;
        ctx.fillStyle = 'rgba(233, 196, 106, 0.9)';
        ctx.beginPath(); ctx.arc(kx, cy, 18, 0, Math.PI * 2); ctx.fill();
        drawOutlinedText('按住畫面拖曳移動', cx, cy - JOYSTICK_RADIUS - 18, 20, '#f4ecd8');
    } else {
        // 卡片是蓋在畫布上的 HTML，提示要畫在卡片上緣之上才看得到
        const r = uiElements.summonSkeletonBtn.getBoundingClientRect();
        const card = uiElements.summonSkeletonBtn.closest('.unit-card').getBoundingClientRect();
        const x = r.left + r.width / 2, y = card.top - 6 + Math.sin(t * 5) * 4;
        ctx.fillStyle = '#e9c46a';
        ctx.strokeStyle = '#0e0a14';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 12, y - 16); ctx.lineTo(x + 12, y - 16); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.textAlign = 'left';
        drawOutlinedText('召喚第一隻骷髏', Math.max(8, x - 30), y - 30, 18, '#f4ecd8');
    }
    ctx.restore();
}

function popLevelBadge(type) {
    const el = { SkeletonWarrior: uiElements.skelLevel, EyeMonster: uiElements.eyeMonsterLevel, Wraith: uiElements.wraithLevel }[type];
    if (!el) return;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
}

function updateTimers(deltaTime) {
    // 新手提示還沒走完前，第一波不開始倒數
    if (tutorial && gameState.currentWave === 0) return;
    updateSpawner(deltaTime);
    gameState.novaCooldown = Math.max(0, gameState.novaCooldown - deltaTime);
    if (gameState.streakTimer > 0) {
        gameState.streakTimer -= deltaTime;
        if (gameState.streakTimer <= 0) gameState.streak = 0;
    }
    if (gameState.banner) {
        gameState.banner.life -= deltaTime;
        // 出場動畫照「出現了多久」算：橫幅長短不一，用 bannerDuration - life 推算的話長橫幅一開始會被放大好幾倍
        gameState.banner.age = (gameState.banner.age || 0) + deltaTime;
        if (gameState.banner.life <= 0) gameState.banner = null;
    }
    if (gameState.betweenWaves && gameState.currentWave >= 0) {
        const before = Math.ceil(gameState.timeToNextWave);
        gameState.timeToNextWave -= deltaTime;
        const after = Math.ceil(gameState.timeToNextWave);
        if (after !== before && after >= 1 && after <= COUNTDOWN_SECONDS) Sfx.play('tick');
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

// combo：長按連段的第幾下（0 = 單點），連段時換成會往上爬的音效
function trySummon(type, combo = 0) {
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
        // 傳說「雙生召喚」：有機率多送一隻，多送的那隻冒金光
        const twin = bl('twinSummon') > 0 && Math.random() < BLESSINGS.twinSummon.per;
        for (let n = 0; n < (twin ? 2 : 1); n++) {
            const spawnPos = gameState.player.getSummonPosition();
            gameState.summons.push(new SummonClass(spawnPos.x, spawnPos.y, level, gameState.player));
            spawnParticles(spawnPos.x, spawnPos.y, n ? '#FFD54F' : '#7E57C2', 12, 70, 0.5);
            if (gameState.totalSummons.hasOwnProperty(type)) {
                gameState.totalSummons[type]++;
            }
            switch (type) {
                case 'SkeletonWarrior': gameState.skeletonWarriorCount++; break;
                case 'EyeMonster': gameState.eyeMonsterCount++; break;
                case 'Wraith': gameState.wraithCount++; break;
            }
        }
        Sfx.play(combo ? 'summonCombo' : 'summon', combo);
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
        text: name,
        stars: tier,
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

function tryUpgrade(type, combo = 0) {
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
        Sfx.play(combo ? 'upgradeCombo' : 'upgrade', combo);
        popLevelBadge(type);
        if (newTier > oldTier) announceEvolution(type, newTier);
        updateUI();
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
    const act = () => { if (actionFn(unitType, holdCombo + 1)) bumpHoldCombo(actionType, unitType); };
    holdCombo = 0;

    holdActionState.timeoutId = setTimeout(() => {
        if (!holdActionState.isHolding || holdActionState.unitType !== unitType || holdActionState.actionType !== actionType) return;

        act();

        holdActionState.intervalId = setInterval(() => {
            if (!holdActionState.isHolding || holdActionState.unitType !== unitType || holdActionState.actionType !== actionType) {
                stopHoldActionInternal();
                return;
            }
            act();
        }, CONFIG.holdingButton.repeatInterval);

    }, CONFIG.holdingButton.holdDelay);
}

// 長按的倍數標籤：這次按住成功了幾次，浮在按鈕正上方；單點一下不顯示
const HOLD_COMBO_SHOW_FROM = 2;
const HOLD_COMBO_GAP = 8;      // px：標籤底到按鈕頂
const HOLD_COMBO_EDGE = 6;     // px：不貼出螢幕邊
const HOLD_COMBO_MILESTONE = 10;
let holdCombo = 0;
function bumpHoldCombo(actionType, unitType) {
    holdCombo++;
    if (holdCombo < HOLD_COMBO_SHOW_FROM) return;
    const el = uiElements.holdCombo;
    const n = el.querySelector('.hc-n');
    n.textContent = holdCombo;
    if (holdCombo === HOLD_COMBO_SHOW_FROM) {
        const btn = UNIT_UI.find(u => u.type === unitType).el()[actionType];
        // 召喚畫那個單位、升級畫向上箭頭：跟按鈕上的意思一樣，不用另外寫字
        el.querySelector('.hc-art').innerHTML = actionType === 'summon'
            ? `<img src="${btn.closest('.unit-card').querySelector('.portrait img').src}" alt="">`
            : ICON_SVGS.arrowUp;
        el.className = `${actionType} show`;
        const r = btn.getBoundingClientRect();
        const half = el.offsetWidth / 2;
        el.style.left = `${Math.min(window.innerWidth - half - HOLD_COMBO_EDGE, Math.max(half + HOLD_COMBO_EDGE, r.left + r.width / 2))}px`;
        el.style.top = `${r.top - HOLD_COMBO_GAP}px`;
    }
    // 每滿 HOLD_COMBO_MILESTONE 下：一聲亮晶晶的和弦，整個標籤大彈一下
    const milestone = holdCombo % HOLD_COMBO_MILESTONE === 0;
    if (milestone) Sfx.play('comboMilestone');
    const target = milestone ? el : n;
    const cls = milestone ? 'milestone' : 'bump';
    target.classList.remove(cls);
    void target.offsetWidth;
    target.classList.add(cls);
}
function hideHoldCombo() {
    holdCombo = 0;
    uiElements.holdCombo.classList.remove('show');
}

// 靈魂不夠 / 冷卻中還按：不能沒反應，否則玩家以為沒按到
function denyFeedback(el) {
    Sfx.unlock();
    Sfx.play('deny');
    el.classList.remove('deny-shake');
    void el.offsetWidth;
    el.classList.add('deny-shake');
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
        hideHoldCombo();
        holdActionState.isHolding = false;
        holdActionState.actionType = null;
        holdActionState.unitType = null;
        holdActionState.pointerDownTime = 0;
    } else if (!actionType && !unitType && holdActionState.isHolding) {
        stopHoldActionInternal();
        hideHoldCombo();
        holdActionState.isHolding = false;
        holdActionState.actionType = null;
        holdActionState.unitType = null;
        holdActionState.pointerDownTime = 0;
    }
}


let lastShownSouls = 0;
const UNIT_UI = [
    { type: 'SkeletonWarrior', config: () => CONFIG.skeletonWarrior, countKey: 'skeletonWarriorCount', levelKey: 'skeletonWarriorLevel', costKey: 'skeletonWarrior', el: () => ({ level: uiElements.skelLevel, stars: uiElements.skelStars, count: uiElements.skelCount, summon: uiElements.summonSkeletonBtn, upgrade: uiElements.upgradeSkeletonBtn }) },
    { type: 'EyeMonster', config: () => CONFIG.eyeMonster, countKey: 'eyeMonsterCount', levelKey: 'eyeMonsterLevel', costKey: 'eyeMonster', el: () => ({ level: uiElements.eyeMonsterLevel, stars: uiElements.eyeMonsterStars, count: uiElements.eyeMonsterCount, summon: uiElements.summonEyeMonsterBtn, upgrade: uiElements.upgradeEyeMonsterBtn }) },
    { type: 'Wraith', config: () => CONFIG.wraith, countKey: 'wraithCount', levelKey: 'wraithLevel', costKey: 'wraith', el: () => ({ level: uiElements.wraithLevel, stars: uiElements.wraithStars, count: uiElements.wraithCount, summon: uiElements.summonWraithBtn, upgrade: uiElements.upgradeWraithBtn }) },
];

// 升級什麼時候划算，玩家用看的就知道（升級鈕發光），不用自己算：
// 升一級 = 場上每隻同種兵都 +upgradeBonus，等於多出 upgradeBonus × 隻數 隻兵；
// 拿同樣的錢去召喚只買得到 升級價 ÷ 召喚價 隻。前者比較多就是划算。下一級剛好進化（解鎖新能力）也算
function isUpgradeGoodDeal(u, level, summonCost, upgradeCost) {
    if (CONFIG.evolution.levels.includes(level + 1)) return true;
    return u.config().upgradeBonus * gameState[u.countKey] * summonCost >= upgradeCost;
}

function starsHtml(tier) {
    const lv = CONFIG.evolution.levels;
    let html = '';
    for (let i = 0; i < lv.length; i++) html += iconHtml('star', i < tier ? 'icon' : 'icon off');
    if (tier < lv.length) html += `<span>Lv${lv[tier]}</span>`;
    return html;
}

function priceButtonHtml(label, cost) {
    return `<span>${label}</span><span class="price">${iconHtml('soul')}${formatNumberK(cost)}</span>`;
}

function updateUI() {
    const souls = gameState.souls;
    const p = gameState.player;
    if (p) {
        uiElements.playerHealthInfo.textContent = `${p.currentHealth}/${p.maxHealth}`;
        const ratio = p.maxHealth > 0 ? p.currentHealth / p.maxHealth : 0;
        uiElements.hpFill.style.width = `${Math.round(ratio * 100)}%`;
    }

    uiElements.soulsInfo.textContent = formatNumberK(souls);
    if (souls > lastShownSouls && !uiElements.soulsInfo.classList.contains('bump')) uiElements.soulsInfo.classList.add('bump');
    lastShownSouls = souls;

    // 波次之間顯示「即將來的那一波」，不是剛打完的那一波
    const holding = tutorial && gameState.currentWave === 0;
    const secs = Math.ceil(gameState.timeToNextWave);
    if (gameState.betweenWaves) {
        uiElements.waveInfo.textContent = waveLabel(gameState.currentWave + 1);
        uiElements.timerInfo.textContent = holding ? '先熟悉操作' : `${secs} 秒後開戰`;
    } else {
        uiElements.waveInfo.textContent = waveLabel(gameState.currentWave);
        uiElements.timerInfo.textContent = `剩餘 ${countRemainingMonsters()}`;
    }
    uiElements.wavePlate.classList.toggle('urgent', gameState.betweenWaves && !holding && secs <= COUNTDOWN_SECONDS);

    const canAct = !gameState.isPaused && !gameState.gameOver && !gameState.draftOpen;
    for (const u of UNIT_UI) {
        const el = u.el();
        const level = gameState[u.levelKey];
        const summonCost = getSummonCost(u.config());
        const upgradeCost = gameState.currentCosts[u.costKey];
        if (el.level.textContent !== String(level)) el.level.textContent = level;
        setHtmlIfChanged(el.stars, starsHtml(getTier(level)));
        el.count.textContent = formatNumberK(gameState[u.countKey]);
        setHtmlIfChanged(el.summon, priceButtonHtml('召喚', summonCost));
        setHtmlIfChanged(el.upgrade, priceButtonHtml('升級', upgradeCost));
        el.summon.disabled = !canAct;
        el.upgrade.disabled = !canAct;
        el.summon.classList.toggle('cant-afford', souls < summonCost);
        el.upgrade.classList.toggle('cant-afford', souls < upgradeCost);
        el.upgrade.classList.toggle('good-deal', souls >= upgradeCost && isUpgradeGoodDeal(u, level, summonCost, upgradeCost));
    }

    uiElements.skipWaveBtn.style.display = gameState.betweenWaves && !gameState.gameOver && !(tutorial && gameState.currentWave === 0) ? '' : 'none';
    updateNovaButton();
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
        setHtmlIfChanged(btn, `${iconHtml('burst')}<span>${Math.ceil(cd)}</span>`);
        btn.style.background = `conic-gradient(rgba(156, 39, 176, 0.9) ${done}%, #1d1628 ${done}%)`;
        btn.classList.remove('nova-ready');
    } else {
        setHtmlIfChanged(btn, `${iconHtml('burst')}<span>新星</span>`);
        btn.style.background = '';
        btn.classList.add('nova-ready');
    }
}

// 撐過的波數：波次之間代表這一波已經清完；打到一半就只算到上一波
function getSurvivedWaves() {
    return Math.max(0, gameState.betweenWaves ? gameState.currentWave : gameState.currentWave - 1);
}
function getRunReward() {
    return Math.round((getSurvivedWaves() * CRYSTALS_PER_WAVE + gameState.totalKills.Boss * CRYSTALS_PER_BOSS) * curseCrystalMult());
}
function spawnCrystalText(amount) {
    const p = gameState.player;
    if (p && amount > 0) spawnFloatText(p.pos.x, p.pos.y - 44, `+${amount}`, '#CE93D8', 15, 1.4, 'crystal');
}

function endRunFromPause() {
    showConfirm('結束這局？', `結算並獲得 ${getRunReward()} 結晶`, '結束', () => {
        showScreen(uiElements.pauseMenu, false);
        gameState.isPaused = false;
        gameState.gameOver = true;
        showGameOver('quit');
    });
}

const GAMEOVER_TITLES = { died: '陣亡', quit: '本局結束', victory: '凱旋' };
// 陣亡畫面上的兇手：頭像跟場上長得一樣（同一套 monsterLook，要染色的就染），精英怪名字前加「精英」
const KILLER_PORTRAIT_PX = 96;
function renderKiller(m) {
    const box = uiElements.finalKiller;
    box.classList.toggle('hidden', !m);
    if (!m) return;
    const look = monsterLook(m.config);
    const img = images[look.imageName];
    const k = KILLER_PORTRAIT_PX / Math.max(img.width, img.height);
    const sprite = getSprite(img, img.width * k / SPRITE_RES, img.height * k / SPRITE_RES, look.tint, look.tintStrength || 0.45);
    box.querySelector('img').src = sprite.toDataURL();
    box.querySelector('b').textContent = `${m.isElite ? '精英' : ''}${m.config.name}`;
}

function showGameOver(reason = 'died') {
    if (!gameState.gameOver || uiElements.gameOverScreen.style.display === 'flex') return;
    // 通關後在無盡模式陣亡也算凱旋：這一局是贏的
    const title = reason === 'died' && gameState.endless ? 'victory' : reason;
    uiElements.gameoverTitle.textContent = GAMEOVER_TITLES[title];
    uiElements.gameoverTitle.classList.toggle('victory', title === 'victory');
    renderKiller(reason === 'died' ? gameState.killedBy : null);
    const survived = getSurvivedWaves();
    const best = getBestWave();
    const isRecord = survived > best;
    if (isRecord) {
        try { localStorage.setItem(BEST_WAVE_KEY, String(survived)); } catch (e) { }
    }
    uiElements.finalWaveText.textContent = survived;
    uiElements.bestWaveText.innerHTML = isRecord ? `${iconHtml('trophy')}新紀錄` : `最佳 ${best} 波`;
    uiElements.bestWaveText.classList.toggle('new-record', isRecord);
    const kills = Object.values(gameState.totalKills).reduce((a, b) => a + b, 0);
    const summons = Object.values(gameState.totalSummons).reduce((a, b) => a + b, 0);
    uiElements.finalKills.textContent = formatNumberK(kills);
    uiElements.finalSummons.textContent = formatNumberK(summons);
    uiElements.finalStreak.textContent = formatNumberK(gameState.bestStreak);
    const reward = getRunReward();
    meta.crystals += reward;
    saveMeta();
    uiElements.finalReward.innerHTML = `${iconHtml('crystal')}+${reward}`;
    renderBlessingList(uiElements.finalBlessings);
    uiElements.hud.classList.add('hidden');
    showScreen(uiElements.gameOverScreen, true);
    localStorage.removeItem(SAVE_KEY);
    pauseMusic();
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
        totalSummons: gameState.totalSummons,
        totalKills: gameState.totalKills,
        blessings: gameState.blessings,
        pendingDraft: gameState.pendingDraft,
        bestStreak: gameState.bestStreak,
        extraDrafts: gameState.extraDrafts,
        curse: gameState.curse,
        endless: gameState.endless,
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

        gameState.totalSummons = { ...emptySummonStats(), ...loadedState.totalSummons };
        gameState.totalKills = { ...emptyKillStats(), ...loadedState.totalKills };
        gameState.bestStreak = loadedState.bestStreak ?? 0;
        gameState.blessings = loadedState.blessings ?? {};
        gameState.pendingDraft = loadedState.pendingDraft ?? null;
        gameState.extraDrafts = loadedState.extraDrafts ?? 0;
        gameState.curse = loadedState.curse ?? 0;
        // 已經過了最終波的舊存檔直接算進無盡模式，不會再跳一次通關
        gameState.endless = loadedState.endless ?? (gameState.currentWave >= CONFIG.wave.finalWave);
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

function resetGameInternalState() {
    if (gameState.messageTimeout) clearTimeout(gameState.messageTimeout);
    stopHoldActionInternal();
    holdActionState = { actionType: null, unitType: null, timeoutId: null, intervalId: null, isHolding: false, pointerDownTime: 0 };

    projectilePool.length = 0;
    visualEffectPool.length = 0;
    tutorial = null;
    uiElements.summonSkeletonBtn.classList.remove('hint-pulse');

    const musicWasStarted = gameState.musicStarted;

    gameState = {
        player: null,
        summons: [], monsters: [], projectiles: [], visualEffects: [],
        orbs: [], particles: [], floatTexts: [],
        shake: 0, hurtFlash: 0, soulCarry: 0, killedBy: null,
        sfxVolume: meta.sfxVolume,
        souls: CONFIG.player.initialSouls,
        currentWave: 0,
        timeToNextWave: CONFIG.wave.betweenTime, betweenWaves: true,
        gameOver: false, isPaused: false,
        messageTimeout: null,
        skeletonWarriorLevel: 0, eyeMonsterLevel: 0, wraithLevel: 0,
        skeletonWarriorCount: 0, eyeMonsterCount: 0, wraithCount: 0,
        currentCosts: {
            skeletonWarrior: CONFIG.skeletonWarrior.upgradeCostBase,
            eyeMonster: CONFIG.eyeMonster.upgradeCostBase,
            wraith: CONFIG.wraith.upgradeCostBase,
        },
        imagesLoaded: gameState.imagesLoaded,
        bgmVolume: meta.bgmVolume,
        musicStarted: musicWasStarted,
        totalSummons: emptySummonStats(),
        totalKills: emptyKillStats(),
        spawnQueue: [], spawnTimer: 0, banner: null,
        blessings: {}, pendingDraft: null, draftOpen: false, novaCooldown: 0, extraDrafts: 0,
        waveEvent: null, lastEventWave: 0, streak: 0, streakTimer: 0, bestStreak: 0,
        hazards: [], curse: 0, endless: false, victoryOpen: false,
    };
    inputState = { isPointerDown: false, pointerStartPos: { x: 0, y: 0 }, pointerCurrentPos: { x: 0, y: 0 }, movementVector: { x: 0, y: 0 }, pointerId: null };
}

// 新的一局（不碰存檔）：永久強化在這裡套用
function setupNewRun() {
    resetGameInternalState();
    gameState.curse = Math.min(meta.curseSelected || 0, meta.curseUnlocked || 0);
    gameState.player = new Player(0, 0);
    gameState.player.maxHealth = Math.round((CONFIG.player.baseHealth + metaVal('mageHp')) * curseMods().mageHpMult);
    gameState.player.currentHealth = gameState.player.maxHealth;
    gameState.souls = CONFIG.player.initialSouls + metaVal('startSouls');
    snapCamera();
    [uiElements.gameOverScreen, uiElements.pauseMenu, uiElements.draftScreen].forEach(el => showScreen(el, false));
}

function resetGame() {
    localStorage.removeItem(SAVE_KEY);
    setupNewRun();
    if (metaLv('headStart') > 0) queueDraft();
    updateUI();
}

function updatePauseMenuStats() {
    uiElements.statSummonSkel.textContent = formatNumberK(gameState.totalSummons.SkeletonWarrior);
    uiElements.statSummonEye.textContent = formatNumberK(gameState.totalSummons.EyeMonster);
    uiElements.statSummonWraith.textContent = formatNumberK(gameState.totalSummons.Wraith);
    renderBlessingDetail(uiElements.pauseBlessings);
    uiElements.pauseReward.innerHTML = `結束可得 ${iconHtml('crystal')}+${getRunReward()}`;
}

function togglePause() {
    if (appScreen !== 'playing' || gameState.gameOver || gameState.draftOpen || gameState.victoryOpen) return;
    gameState.isPaused = !gameState.isPaused;
    if (gameState.isPaused) {
        stopHoldAction();
        syncVolumeSliders();
        updatePauseMenuStats();
        showScreen(uiElements.pauseMenu, true);
        pauseMusic();
    } else {
        showScreen(uiElements.pauseMenu, false);
        loopLastTime = performance.now();
        ensureMusicPlaying();
    }
    updateUI();
}

function leaveToTitleFromPause() {
    const go = () => { showScreen(uiElements.pauseMenu, false); showTitle(); };
    if (gameState.betweenWaves) go();
    else showConfirm('回到標題？', '這一波的進度不會保留', '回標題', go);
}


function updateGame(deltaTime) {
    frameNo++;
    worldTime += deltaTime;
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
    summonCoarseGrid.rebuild(gameState.summons);
    monsterGrid.rebuild(gameState.monsters);
    rebuildEyeTargetCounts(gameState.summons);
    gameState.priests = gameState.monsters.filter(m => m.isAlive && m instanceof GravePriestMonster);

    if (gameState.player) gameState.player.update(deltaTime, getMoveVector());
    updateCamera(deltaTime);

    for (let i = 0; i < gameState.summons.length; i++) {
        if (gameState.summons[i].isAlive) gameState.summons[i].update(deltaTime, gameState.monsters, gameState.summons, gameState.player);
    }
    for (let i = 0; i < gameState.monsters.length; i++) {
        if (gameState.monsters[i].isAlive) gameState.monsters[i].update(deltaTime, gameState.player, gameState.summons);
    }
    updateHazards(deltaTime);
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
    drawIconLabel(ev.icon, ev.name, 10, hudTop + 20, 15, ev.color, 'left');
    ctx.restore();
}

function drawStreak() {
    if (gameState.streak < CONFIG.streak.showFrom) return;
    const bonus = getStreakBonus();
    const fade = Math.min(1, gameState.streakTimer / CONFIG.streak.window * 3);
    ctx.save();
    ctx.globalAlpha = 0.4 + 0.6 * fade;
    drawIconLabel('flame', String(gameState.streak), view.cssW - 10, hudTop + 24, 20, '#FFAB40', 'right');
    if (bonus > 0) {
        ctx.textAlign = 'right';
        drawOutlinedText(`靈魂 +${pct(bonus)}`, view.cssW - 10, hudTop + 42, 12, '#80DEEA');
    }
    ctx.restore();
}

function drawBossBar() {
    const boss = getAliveBoss();
    if (!boss) return;
    const w = Math.min(view.cssW * 0.46, 300), h = 12;
    const x = (view.cssW - w) / 2, y = hudTop + 26;
    ctx.save();
    drawIconLabel('skull', `${boss.config.name}  Lv${boss.tier}`, view.cssW / 2, y - 6, 14, '#E1BEE7');
    // 外框：深色粗框 + 暗金細框，跟介面面板同一套
    ctx.fillStyle = TEXT_OUTLINE;
    roundRect(x - 3, y - 3, w + 6, h + 6, 8); ctx.fill();
    ctx.fillStyle = '#2a1636';
    roundRect(x, y, w, h, 6); ctx.fill();
    const ratio = Math.max(0, boss.currentHealth / boss.maxHealth);
    if (ratio > 0) {
        const g = ctx.createLinearGradient(0, y, 0, y + h);
        g.addColorStop(0, '#d17cf0'); g.addColorStop(1, '#7b1fa2');
        ctx.fillStyle = g;
        roundRect(x, y, w * ratio, h, 6); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(x + 3, y + 2, Math.max(0, w * ratio - 6), 2);
    }
    ctx.strokeStyle = '#9c7a3c';
    ctx.lineWidth = 1.5;
    roundRect(x - 1, y - 1, w + 2, h + 2, 7); ctx.stroke();
    ctx.restore();
}

function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
}

// 畫面邊緣的方位標記：竊賊、首領跑出畫面時一定標；畫面上一隻怪都看不到時，再標最近那隻怪
// （不然一直走都遇不到，只能亂猜方向）
const POINTER_EDGE_PAD = 30;
const POINTER_TOP_EXTRA = 70;
const POINTER_THIEF_COLOR = '#FFD54F';
const POINTER_BOSS_COLOR = '#CE93D8';
const POINTER_NEAREST_COLOR = '#EF9A9A';
const POINTER_PORTRAIT_BOX = 26;
function drawOffscreenPointers() {
    if (appScreen !== 'playing' || !gameState.player) return;
    let bounds = null;
    let anyVisible = false, nearest = null, nearestD = Infinity;
    const p = gameState.player.pos;
    for (let i = 0; i < gameState.monsters.length; i++) {
        const m = gameState.monsters[i];
        if (!m.isAlive || m.stealthed) continue;
        const sx = (m.pos.x - camera.x) * view.unitPx, sy = (m.pos.y - camera.y) * view.unitPx;
        const onScreen = sx > 0 && sx < view.cssW && sy > 0 && sy < view.cssH;
        if (onScreen) { anyVisible = true; continue; }
        const isThief = m instanceof ThiefMonster;
        if (isThief || m instanceof BossMonster) {
            bounds = bounds || pointerBounds();
            const icon = getIconImage(isThief ? 'sack' : 'skull');
            drawEdgePointer(sx, sy, isThief ? POINTER_THIEF_COLOR : POINTER_BOSS_COLOR, bounds, icon, 24, 24);
            continue;
        }
        const d = distanceSq(p, m.pos);
        if (d < nearestD) { nearestD = d; nearest = m; }
    }
    if (anyVisible || !nearest || gameState.betweenWaves) return;
    // 圈裡畫那隻怪本人的小頭像：看得出那個方向來的是什麼
    const sprite = nearest.getCachedSprite(false);
    const k = POINTER_PORTRAIT_BOX / Math.max(nearest.imageWidth, nearest.imageHeight);
    const sx = (nearest.pos.x - camera.x) * view.unitPx, sy = (nearest.pos.y - camera.y) * view.unitPx;
    drawEdgePointer(sx, sy, POINTER_NEAREST_COLOR, bounds || pointerBounds(), sprite, nearest.imageWidth * k, nearest.imageHeight * k);
}

// 標記能放的範圍：避開上方狀態列與下方召喚面板
function pointerBounds() {
    const hb = uiElements.hudBottom.getBoundingClientRect();
    return {
        left: POINTER_EDGE_PAD, right: view.cssW - POINTER_EDGE_PAD,
        top: hudTop + POINTER_TOP_EXTRA, bottom: (hb.height ? hb.top : view.cssH) - POINTER_EDGE_PAD,
    };
}

function drawEdgePointer(sx, sy, color, b, img, iw, ih) {
    const cx = view.cssW / 2, cy = (b.top + b.bottom) / 2;
    const dx = sx - cx, dy = sy - cy;
    const s = Math.min(Math.abs(dx) > 0.01 ? (dx > 0 ? b.right - cx : cx - b.left) / Math.abs(dx) : Infinity,
        Math.abs(dy) > 0.01 ? (dy > 0 ? b.bottom - cy : cy - b.top) / Math.abs(dy) : Infinity);
    const px = cx + dx * s, py = cy + dy * s;
    const ang = Math.atan2(dy, dx);
    const pulse = 1 + 0.08 * Math.sin(worldTime * 1000 / 150);
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(pulse, pulse);
    ctx.save();
    ctx.rotate(ang);
    ctx.fillStyle = color;
    ctx.strokeStyle = TEXT_OUTLINE;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(29, 0); ctx.lineTo(17, -9); ctx.lineTo(17, 9); ctx.closePath();
    ctx.stroke(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(14, 10, 20, 0.85)';
    ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = color;
    ctx.stroke();
    if (img) ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih);
    ctx.restore();
}

// 開戰前最後幾秒在畫面中間跳大數字：只看角落的小字很容易錯過開戰
const COUNTDOWN_SECONDS = 3;
function drawCountdown() {
    if (appScreen !== 'playing' || !gameState.betweenWaves || gameState.draftOpen) return;
    const t = gameState.timeToNextWave;
    if (t <= 0 || t > COUNTDOWN_SECONDS) return;
    const n = Math.ceil(t);
    const elapsed = n - t;
    const scale = 1 + Math.max(0, 0.2 - elapsed) * 3;
    ctx.save();
    ctx.globalAlpha = 1 - Math.max(0, elapsed - 0.75) * 2;
    ctx.translate(view.cssW / 2, view.cssH * BANNER_Y);
    ctx.scale(scale, scale);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawOutlinedText(`第 ${gameState.currentWave + 1} 波`, 0, -64, 20, '#f4ecd8', 700);
    drawOutlinedText(String(n), 0, 0, 96, n === 1 ? '#ff8a65' : '#e9c46a');
    ctx.restore();
}

const BANNER_Y = 0.36;
const BANNER_PORTRAIT_SIZE = 110;
const BANNER_PORTRAIT_MIN = 48;
const BANNER_PORTRAIT_BOTTOM = -40;
const BANNER_PORTRAIT_GLOW = 0.35;
function drawBannerPortrait(look, color) {
    const img = images[look.imageName];
    if (!img) return;
    // 橫拿手機時橫幅上方沒多少空間：縮到不壓到上方的狀態列
    const room = view.cssH * BANNER_Y + BANNER_PORTRAIT_BOTTOM - hudTop;
    const box = Math.max(BANNER_PORTRAIT_MIN, Math.min(BANNER_PORTRAIT_SIZE, room));
    const k = box / Math.max(img.width, img.height);
    const w = img.width * k, h = img.height * k;
    const cy = BANNER_PORTRAIT_BOTTOM - h / 2;
    // 背後一圈牠的代表色光暈，亂軍裡也看得出這是主角
    const glow = ctx.createRadialGradient(0, cy, 0, 0, cy, box * 0.6);
    glow.addColorStop(0, color);
    glow.addColorStop(1, `${color}00`);
    const alpha = ctx.globalAlpha;
    ctx.globalAlpha = alpha * BANNER_PORTRAIT_GLOW;
    ctx.fillStyle = glow;
    ctx.fillRect(-box * 0.6, cy - box * 0.6, box * 1.2, box * 1.2);
    ctx.globalAlpha = alpha;
    const px = view.dpr / SPRITE_RES;
    const sprite = getSprite(img, w * px, h * px, look.tint, look.tintStrength || 0.45);
    ctx.drawImage(sprite, -w / 2, cy - h / 2, w, h);
}

function drawBanner() {
    const b = gameState.banner;
    if (!b) return;
    const t = b.age || 0;
    const alpha = Math.min(1, t * 4, b.life * 2.5);
    const scale = 1 + Math.max(0, 0.25 - t) * 1.5;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(view.cssW / 2, view.cssH * BANNER_Y);
    ctx.scale(scale, scale);
    // 底下一條淡淡的暗色緞帶，讓大字在亂軍裡也看得清楚
    const ribbon = ctx.createLinearGradient(-view.cssW / 2, 0, view.cssW / 2, 0);
    ribbon.addColorStop(0, 'rgba(14,10,20,0)');
    ribbon.addColorStop(0.5, 'rgba(14,10,20,0.6)');
    ribbon.addColorStop(1, 'rgba(14,10,20,0)');
    ctx.fillStyle = ribbon;
    ctx.fillRect(-view.cssW / 2, -44, view.cssW, b.sub ? 88 : 64);
    if (b.stars) {
        const star = getIconImage('star');
        const s = 30;
        for (let i = 0; i < b.stars; i++) if (star) ctx.drawImage(star, (i - (b.stars - 1) / 2) * (s + 4) - s / 2, -78, s, s);
    }
    // 新威脅：名字上方站著那隻怪本人，名字旁就不再放圖示
    if (b.look) drawBannerPortrait(b.look, b.color);
    drawIconLabel(b.look ? null : (b.icon || null), b.text, 0, 0, 40, b.color);
    if (b.sub) {
        ctx.textAlign = 'center';
        drawOutlinedText(b.sub, 0, 32, 17, '#f4ecd8', 700);
    }
    ctx.restore();
}

// 召喚物按貼圖分組畫：顯示卡畫同一張貼圖可以整批送出，骷髏／眼魔／怨靈交錯著畫、中間又夾血條的話，
// 每換一次就斷一批（3000 隻時這一步卡 25ms，而且跟解析度無關）。召喚物彼此本來就沒有前後順序，分組畫看起來一樣。
// 注意：召喚物不會呼叫自己的 draw()，要加召喚物專屬的畫法得加在這裡
const summonBuckets = new Map();
const summonBucketPool = [];
const visibleSummons = [];
// 大軍擠成一團時，底下被蓋住的召喚物看不到卻照樣要畫：畫面上超過 SUMMON_THIN_START 隻時，
// 每 SUMMON_THIN_CELL 見方只畫一隻（擠成一團看起來還是一整團，小軍隊完全不受影響）
const SUMMON_THIN_START = 400;
const SUMMON_THIN_CELL = 14;
const summonThinCells = new Set();
function drawSummonsBatched() {
    visibleSummons.length = 0;
    summonThinCells.clear();
    let onScreen = 0;
    for (let i = 0; i < gameState.summons.length; i++) if (gameState.summons[i].isAlive && inView(gameState.summons[i].pos)) onScreen++;
    const thin = onScreen > SUMMON_THIN_START;
    for (let i = 0; i < gameState.summons.length; i++) {
        const s = gameState.summons[i];
        if (!s.isAlive || !inView(s.pos)) continue;
        if (thin) {
            const k = Math.floor(s.pos.x / SUMMON_THIN_CELL) * GRID_KEY_STRIDE + Math.floor(s.pos.y / SUMMON_THIN_CELL);
            if (summonThinCells.has(k)) continue;
            summonThinCells.add(k);
        }
        visibleSummons.push(s);
        const spr = s.getCachedSprite(s.facingDirection < 0);
        let arr = summonBuckets.get(spr);
        if (!arr) { arr = summonBucketPool.pop() || []; summonBuckets.set(spr, arr); }
        arr.push(s);
    }
    for (const [spr, arr] of summonBuckets) {
        for (let i = 0; i < arr.length; i++) {
            const s = arr[i];
            const k = s.drawScale || 1;
            const w = s.imageWidth * k, h = s.imageHeight * k;
            ctx.drawImage(spr, s.pos.x - w / 2, s.pos.y - h / 2, w, h);
        }
        arr.length = 0;
        summonBucketPool.push(arr);
    }
    summonBuckets.clear();
    for (let i = 0; i < visibleSummons.length; i++) {
        const s = visibleSummons[i];
        if (s.hitFlash <= 0) continue;
        const k = s.drawScale || 1;
        const w = s.imageWidth * k, h = s.imageHeight * k;
        ctx.globalAlpha = Math.min(1, s.hitFlash / CONFIG.visuals.hitFlashDuration) * 0.85;
        ctx.drawImage(s.getFlashSprite(s.facingDirection < 0), s.pos.x - w / 2, s.pos.y - h / 2, w, h);
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < visibleSummons.length; i++) visibleSummons[i].drawHealthBar(ctx);
}

function drawGame() {
    ctx.save();
    if (gameState.shake > 0 && !isWorldFrozen()) {
        drawOffset.x = (Math.random() * 2 - 1) * gameState.shake;
        drawOffset.y = (Math.random() * 2 - 1) * gameState.shake;
    } else {
        drawOffset.x = 0; drawOffset.y = 0;
    }
    const z = view.zoom;
    ctx.setTransform(z, 0, 0, z, (-camera.x + drawOffset.x) * z, (-camera.y + drawOffset.y) * z);
    drawGround();
    drawHazards();
    for (let i = 0; i < gameState.orbs.length; i++) if (inView(gameState.orbs[i].pos)) gameState.orbs[i].draw(ctx);

    drawAuraLayer();

    for (let i = 0; i < gameState.monsters.length; i++) {
        const m = gameState.monsters[i];
        if (m.isAlive && (inView(m.pos) || m instanceof BossMonster)) m.draw(ctx);
    }
    drawSummonsBatched();
    drawProjectilesBatched();
    for (let i = 0; i < gameState.monsters.length; i++) {
        const m = gameState.monsters[i];
        if (m.isAlive && m.mark) m.drawMark(ctx);
    }
    drawLobs();
    // 標題畫面上法師是 HTML 立繪，畫布這邊只留地面
    if (gameState.player && gameState.player.isAlive && appScreen !== 'title') gameState.player.draw(ctx);

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
        drawIconLabel(t.icon, t.text, t.x, t.y, t.size, t.color);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    setScreenTransform();
    drawEventOverlay();
    drawBossBar();
    drawStreak();
    drawOffscreenPointers();
    drawCountdown();
    drawBanner();
    drawJoystick();
    drawTutorial();
    if (appScreen === 'title') drawTitleWisps();

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


// 單一一條 rAF 迴圈一直跑，依目前畫面決定要更新什麼
let animationFrameId = null;
let loopLastTime = 0;
const TITLE_DRIFT_SPEED = 14;
function gameLoop(currentTime) {
    animationFrameId = requestAnimationFrame(gameLoop);
    const deltaTime = Math.min(0.1, Math.max(0, (currentTime - loopLastTime) / 1000));
    loopLastTime = currentTime;

    // 圖片載完後還在等字型時也要繼續畫，不然進度條會停在半途
    if (appScreen === 'loading') { drawLoading(); return; }
    if (appScreen === 'title') {
        camera.x += TITLE_DRIFT_SPEED * deltaTime;
        camera.y += TITLE_DRIFT_SPEED * 0.4 * deltaTime;
        drawGame();
        return;
    }
    document.body.classList.toggle('world-frozen', appScreen === 'playing' && (isWorldFrozen() || gameState.isPaused || gameState.gameOver));
    if (appScreen !== 'playing' || gameState.isPaused || gameState.gameOver) return;

    if (!isWorldFrozen()) updateGame(deltaTime);
    updateTutorial();
    drawGame();
    updateUI();
}

// 選祝福、凱旋畫面打開時戰場停住但畫面照畫（背景要看得到）；暫停與結束則連畫都停
function isWorldFrozen() {
    return gameState.draftOpen || gameState.victoryOpen;
}

function startGameLoop() {
    if (animationFrameId !== null) return;
    loopLastTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
}

// 標題畫面背景緩緩飄升的靈魂光點：不存狀態，位置直接由時間算出來
const TITLE_WISP_COUNT = 36;
function drawTitleWisps() {
    const t = performance.now() / 1000;
    const W = view.cssW, H = view.cssH;
    ctx.save();
    for (let i = 0; i < TITLE_WISP_COUNT; i++) {
        const h1 = (Math.sin(i * 12.9898) * 43758.5453) % 1, h2 = (Math.sin(i * 78.233) * 12543.123) % 1;
        const r1 = Math.abs(h1), r2 = Math.abs(h2);
        const speed = 12 + r2 * 26;
        const y = H + 20 - ((t * speed + r1 * (H + 40)) % (H + 40));
        const x = r1 * W + Math.sin(t * (0.4 + r2) + i) * 18;
        const size = 1.5 + r2 * 2.5;
        const alpha = 0.25 + 0.35 * Math.sin(t * (1 + r1) + i) ** 2;
        ctx.globalAlpha = alpha * 0.35;
        ctx.fillStyle = '#7ff0f0';
        ctx.beginPath(); ctx.arc(x, y, size * 3, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#d6fbfb';
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
}

function drawLoading() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#140f1c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setScreenTransform();
    const cx = view.cssW / 2, cy = view.cssH / 2;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawOutlinedText('載入中…', cx, cy - LOADING_BAR_GAP, 22, '#e9c46a');
    // 外框跟 Boss 血條同一套：深色粗框 + 暗金細框
    const w = Math.min(view.cssW * 0.6, LOADING_BAR_MAX_W), h = LOADING_BAR_H;
    const x = cx - w / 2, y = cy;
    ctx.fillStyle = TEXT_OUTLINE;
    roundRect(x - 3, y - 3, w + 6, h + 6, 8); ctx.fill();
    ctx.fillStyle = '#2a1636';
    roundRect(x, y, w, h, 6); ctx.fill();
    const ratio = loadProgress.total ? loadProgress.done / loadProgress.total : 0;
    if (ratio > 0) {
        const g = ctx.createLinearGradient(0, y, 0, y + h);
        g.addColorStop(0, '#f4d58d'); g.addColorStop(1, '#c08a2e');
        ctx.fillStyle = g;
        roundRect(x, y, w * ratio, h, 6); ctx.fill();
    }
    ctx.strokeStyle = '#9c7a3c';
    ctx.lineWidth = 1.5;
    roundRect(x - 1, y - 1, w + 2, h + 2, 7); ctx.stroke();
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}
const LOADING_BAR_MAX_W = 260;
const LOADING_BAR_H = 12;
const LOADING_BAR_GAP = 28;

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
    meta.bgmVolume = gameState.bgmVolume;
    if (uiElements.bgm) {
        uiElements.bgm.volume = gameState.bgmVolume;
    }
}

function setSfxVolume(volume) {
    gameState.sfxVolume = Math.max(0, Math.min(1, volume));
    meta.sfxVolume = gameState.sfxVolume;
    Sfx.setVolume(gameState.sfxVolume);
}

// 標題的設定頁與暫停選單各有一組滑桿，數值同一份（存在永久資料裡）
function syncVolumeSliders() {
    uiElements.volumeSlider.value = uiElements.pauseVolumeSlider.value = meta.bgmVolume;
    uiElements.sfxSlider.value = uiElements.pauseSfxSlider.value = meta.sfxVolume;
}
function bindVolumeSliders() {
    [uiElements.volumeSlider, uiElements.pauseVolumeSlider].forEach(s => {
        s.addEventListener('input', e => { setMusicVolume(parseFloat(e.target.value)); syncVolumeSliders(); });
        s.addEventListener('change', saveMeta);
    });
    [uiElements.sfxSlider, uiElements.pauseSfxSlider].forEach(s => {
        s.addEventListener('input', e => {
            setSfxVolume(parseFloat(e.target.value));
            syncVolumeSliders();
            Sfx.unlock();
            Sfx.play('orb');
        });
        s.addEventListener('change', saveMeta);
    });
}

function handleVisibilityChange() {
    // 切到別的 App / 回桌面：自動暫停，回來時停在暫停選單，不會一回來就被圍死
    if (document.hidden && appScreen === 'playing' && !gameState.isPaused && !gameState.gameOver && !gameState.draftOpen) {
        togglePause();
        return;
    }
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

function hydrateIcons() {
    document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = ICON_SVGS[el.dataset.icon] || ''; });
}

const FONT_LOAD_TIMEOUT_MS = 2500;
function waitForFonts() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const load = Promise.all([
        document.fonts.load(`900 20px ${CANVAS_FONT_FAMILY}`),
        document.fonts.load(`700 20px ${CANVAS_FONT_FAMILY}`),
    ]).catch(() => { });
    return Promise.race([load, new Promise(r => setTimeout(r, FONT_LOAD_TIMEOUT_MS))]);
}

function init() {
    hydrateIcons();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', resizeCanvas);
    setMusicVolume(meta.bgmVolume);
    setSfxVolume(meta.sfxVolume);
    syncVolumeSliders();
    bindVolumeSliders();

    canvas.addEventListener('pointerdown', handleCanvasPointerDown);
    canvas.addEventListener('pointermove', handleCanvasPointerMove);
    canvas.addEventListener('pointerup', handleCanvasPointerUp);
    canvas.addEventListener('pointercancel', handleCanvasPointerUp);
    canvas.addEventListener('pointerleave', handleCanvasPointerUp);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handleBackButton);

    const setupHoldableButton = (button, actionType, unitType) => {
        button.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            button.setPointerCapture(e.pointerId);
            // 一樣開始長按：按著等靈魂進帳，夠了就會自動買下去
            if (button.classList.contains('cant-afford')) denyFeedback(button);
            startHoldAction(actionType, unitType);
            ensureMusicPlaying();
        });
        const stop = (e) => {
            stopHoldAction(actionType, unitType);
            if (button.hasPointerCapture(e.pointerId)) {
                try { button.releasePointerCapture(e.pointerId); } catch (err) { }
            }
        };
        button.addEventListener('pointerup', stop);
        button.addEventListener('pointerleave', (e) => {
            if (holdActionState.isHolding && holdActionState.actionType === actionType && holdActionState.unitType === unitType) stop(e);
        });
        button.addEventListener('pointercancel', (e) => {
            if (holdActionState.isHolding && holdActionState.actionType === actionType && holdActionState.unitType === unitType) stop(e);
        });
    };
    setupHoldableButton(uiElements.summonSkeletonBtn, 'summon', 'SkeletonWarrior');
    setupHoldableButton(uiElements.summonEyeMonsterBtn, 'summon', 'EyeMonster');
    setupHoldableButton(uiElements.summonWraithBtn, 'summon', 'Wraith');
    setupHoldableButton(uiElements.upgradeSkeletonBtn, 'upgrade', 'SkeletonWarrior');
    setupHoldableButton(uiElements.upgradeEyeMonsterBtn, 'upgrade', 'EyeMonster');
    setupHoldableButton(uiElements.upgradeWraithBtn, 'upgrade', 'Wraith');

    // 按鍵音統一在這裡：任何按鈕一按下就響（按下不是放開，手感才即時；召喚、新星這些也有）。
    // 按不了的鈕：停用的放「不行」；買不起的召喚鈕由 denyFeedback 放，這裡不再疊一聲
    document.addEventListener('pointerdown', (e) => {
        const btn = e.target.closest('button');
        if (!btn || btn.classList.contains('cant-afford')) return;
        Sfx.unlock();
        Sfx.play(btn.disabled ? 'deny' : 'click');
    }, true);
    // 觸控的 pointerdown 不算使用者手勢，第一次解鎖音效要等到 click
    const onTap = (el, fn) => el.addEventListener('click', () => { Sfx.unlock(); fn(); });
    onTap(uiElements.titleStartBtn, startNewRun);
    onTap(uiElements.titleContinueBtn, continueRun);
    onTap(uiElements.titleMetaBtn, () => openMeta('title'));
    onTap(uiElements.titleSettingsBtn, () => { syncVolumeSliders(); showScreen(uiElements.settingsScreen, true); });
    onTap(uiElements.settingsCloseBtn, () => { saveMeta(); showScreen(uiElements.settingsScreen, false); });
    onTap(uiElements.metaCloseBtn, closeMeta);
    onTap(uiElements.titleCurseBtn, () => { renderCurse(); showScreen(uiElements.curseScreen, true); });
    onTap(uiElements.curseCloseBtn, () => { showScreen(uiElements.curseScreen, false); refreshTitle(); });
    onTap(uiElements.curseMinus, () => stepCurse(-1));
    onTap(uiElements.cursePlus, () => stepCurse(1));
    onTap(uiElements.victoryContinueBtn, continueEndless);
    onTap(uiElements.victoryEndBtn, endRunFromVictory);
    uiElements.metaList.addEventListener('click', (e) => {
        const b = e.target.closest('[data-meta]');
        if (b && !b.disabled) buyMeta(b.dataset.meta);
    });
    // 戰鬥中的暫停鈕跟開戰鈕一樣在 pointerdown 觸發：移動中另一隻手按也要有效
    uiElements.pauseResumeBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        togglePause();
    });
    onTap(uiElements.resumeGameBtn, togglePause);
    onTap(uiElements.pauseTitleBtn, leaveToTitleFromPause);
    onTap(uiElements.restartGameBtn, endRunFromPause);
    onTap(uiElements.restartButton, () => { resetGame(); enterPlaying(); });
    onTap(uiElements.gameoverTitleBtn, showTitle);
    onTap(uiElements.gameoverMetaBtn, () => openMeta('gameover'));
    onTap(uiElements.rerollBtn, rerollDraft);
    onTap(uiElements.confirmNo, () => showScreen(uiElements.confirmDialog, false));
    onTap(uiElements.confirmYes, () => {
        showScreen(uiElements.confirmDialog, false);
        const action = confirmAction;
        confirmAction = null;
        if (action) action();
    });
    uiElements.soulsInfo.addEventListener('animationend', () => uiElements.soulsInfo.classList.remove('bump'));

    uiElements.novaBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (!useNova() && gameState.novaCooldown > 0 && !gameState.isPaused) denyFeedback(uiElements.novaBtn);
    });

    window.addEventListener('keydown', (e) => {
        if (gameState.draftOpen) {
            const idx = ['Digit1', 'Digit2', 'Digit3'].indexOf(e.code);
            if (idx >= 0 && gameState.pendingDraft && gameState.pendingDraft.options[idx]) pickBlessing(gameState.pendingDraft.options[idx]);
            return;
        }
        if (appScreen !== 'playing') return;
        if (e.code === 'Escape' || e.code === 'KeyP') { togglePause(); return; }
        if (gameState.isPaused || gameState.gameOver) return;
        if (e.code === 'Space') { e.preventDefault(); useNova(); return; }
        if (MOVE_KEYS[e.code]) { keysDown.add(e.code); e.preventDefault(); ensureMusicPlaying(); return; }
        const unit = UNIT_HOTKEYS[e.code];
        if (unit) { e.shiftKey ? tryUpgrade(unit) : trySummon(unit); }
    });
    window.addEventListener('keyup', (e) => keysDown.delete(e.code));
    window.addEventListener('blur', () => keysDown.clear());

    // 用 pointerdown 不用 click：另一隻手指還按著搖桿時，瀏覽器不會把這一下算成 click
    uiElements.skipWaveBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (gameState.betweenWaves && !gameState.isPaused && !gameState.gameOver) {
            gameState.timeToNextWave = 0;
            ensureMusicPlaying();
        }
    });

    startGameLoop();
    Promise.all([loadAllImages(), trackLoad(preloadIconImages()), trackLoad(waitForFonts())]).then(() => {
        setupNewRun();
        showTitle();
    });
}

init();