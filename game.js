const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ---------- 畫面與鏡頭：畫布鋪滿整個螢幕，鏡頭跟著法師，地圖無限延伸 ----------
// 不管手機直拿還是電腦橫放，畫面裡看得到的世界面積都差不多是 VIEW_AREA（世界單位²），
// 單位大小不會因為螢幕形狀忽大忽小
const VIEW_AREA = 600 * 400 * 1.5;
// 解析度上限：同類網頁遊戲都沒開到 2 倍（PokéSurvivor、RO 倖存者 1.5 倍，PokeBonk 手機 1.25 倍）。
// 手機顯示晶片卡在要填的像素數，1.5 倍只要填 2 倍時的 56%，肉眼幾乎看不出差別
const MAX_DPR = 1.5;
// 省電模式：解析度 1 倍＋每秒 30 格（見 SLOW_FRAME_MS）
const SAVER_DPR = 1;
const CAMERA_FOLLOW = 6;
// 鏡頭往移動方向多帶 CAMERA_LEAD 世界單位：只跟著法師的話，走起來法師反而偏到前進那一側，前面看得比後面少
const CAMERA_LEAD = 70;
const CAMERA_LEAD_FOLLOW = 2.5;
const cameraLead = { x: 0, y: 0 };
const view = { cssW: 600, cssH: 400, dpr: 1, unitPx: 1, zoom: 1, w: 600, h: 400 };
const camera = { x: -300, y: -200 };
function resizeCanvas() {
    const vv = window.visualViewport;
    const cssW = Math.max(1, Math.round(vv ? vv.width : window.innerWidth));
    const cssH = Math.max(1, Math.round(vv ? vv.height : window.innerHeight));
    const dpr = Math.min(meta.powerSaver ? SAVER_DPR : MAX_DPR, window.devicePixelRatio || 1) * dynRes.scale;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    const unitPx = Math.sqrt(cssW * cssH / VIEW_AREA);
    Object.assign(view, { cssW, cssH, dpr, unitPx, zoom: unitPx * dpr, w: cssW / unitPx, h: cssH / unitPx });
    auraLayer = null;
    frozenFrameDrawn = false;
    hudTop = uiElements.hudTop ? Math.round(uiElements.hudTop.getBoundingClientRect().bottom) - HUD_TOP_FADE_PX : hudTop;
    if (gameState && gameState.player) snapCamera();
}
function snapCamera() {
    const p = gameState.player;
    if (!p) return;
    cameraLead.x = 0; cameraLead.y = 0;
    camera.x = p.pos.x - view.w / 2;
    camera.y = p.pos.y - view.h / 2;
}
function updateCamera(deltaTime, moveVec) {
    const p = gameState.player;
    if (!p) return;
    const lk = Math.min(1, deltaTime * CAMERA_LEAD_FOLLOW);
    cameraLead.x += (moveVec.x * CAMERA_LEAD - cameraLead.x) * lk;
    cameraLead.y += (moveVec.y * CAMERA_LEAD - cameraLead.y) * lk;
    const k = Math.min(1, deltaTime * CAMERA_FOLLOW);
    camera.x += (p.pos.x + cameraLead.x - view.w / 2 - camera.x) * k;
    camera.y += (p.pos.y + cameraLead.y - view.h / 2 - camera.y) * k;
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
    victoryScreen: $id('victory-screen'), victoryReward: $id('victory-reward'), victoryUnlock: $id('victory-unlock'), victoryTime: $id('victory-time'),
    victoryContinueBtn: $id('victory-continue-btn'), victoryEndBtn: $id('victory-end-btn'),
    titleCurseBtn: $id('title-curse-btn'), curseScreen: $id('curse-screen'), curseList: $id('curse-list'),
    curseLevel: $id('curse-level'), curseMult: $id('curse-mult'), curseMinus: $id('curse-minus'), cursePlus: $id('curse-plus'),
    curseCloseBtn: $id('curse-close-btn'),
    titleAchvBtn: $id('title-achv-btn'), achvScreen: $id('achv-screen'), achvList: $id('achv-list'), achvCount: $id('achv-count'), achvTabs: $id('achv-tabs'), achvSubtabs: $id('achv-subtabs'),
    achvCloseBtn: $id('achv-close-btn'), achvToast: $id('achv-toast'),
    titleLbBtn: $id('title-lb-btn'), gameoverLbBtn: $id('gameover-lb-btn'), finalTarget: $id('final-target'),
    lbScreen: $id('lb-screen'), lbTabs: $id('lb-tabs'), lbList: $id('lb-list'), lbCloseBtn: $id('lb-close-btn'),
    lbDetail: $id('lb-detail'), lbDetailBody: $id('lb-detail-body'), lbDetailCloseBtn: $id('lb-detail-close-btn'),
    lbCongrats: $id('lb-congrats'), lbCongratsRanks: $id('lb-congrats-ranks'), lbCongratsResult: $id('lb-congrats-result'), lbNameInput: $id('lb-name-input'),
    lbCongratsOkBtn: $id('lb-congrats-ok-btn'), lbCongratsCloseBtn: $id('lb-congrats-close-btn'),
    pauseReward: $id('pause-reward'),
    gameoverTitle: $id('gameover-title'),
    soulsInfo: $id('souls-info'),
    crystalsInfo: $id('crystals-info'),
    playerHealthInfo: $id('player-health-info'),
    hpFill: $id('hp-fill'),
    unitCards: $id('unit-cards'),
    pauseResumeBtn: $id('pause-resume-btn'),
    skipWaveBtn: $id('skip-wave-btn'),
    holdCombo: $id('hold-combo'),
    finalKiller: $id('final-killer'),
    ultBtn: $id('nova-btn'),
    messageArea: $id('message-area'),
    titleScreen: $id('title-screen'),
    titleContinueBtn: $id('title-continue-btn'),
    titleStartBtn: $id('title-start-btn'), titleDailyBtn: $id('title-daily-btn'),
    titleHero: $id('title-hero'), classPicker: $id('class-picker'), classInfo: $id('class-info'),
    titleMetaBtn: $id('title-meta-btn'),
    titleSettingsBtn: $id('title-settings-btn'),
    titleBest: $id('title-best'),
    metaScreen: $id('meta-screen'),
    metaList: $id('meta-list'),
    metaCrystals: $id('meta-crystals'),
    metaCloseBtn: $id('meta-close-btn'),
    metaRefundBtn: $id('meta-refund-btn'),
    metaEarn: $id('meta-earn'),
    settingsScreen: $id('settings-screen'),
    settingsCloseBtn: $id('settings-close-btn'),
    volumeSlider: $id('volume-slider'),
    sfxSlider: $id('sfx-slider'),
    pauseVolumeSlider: $id('pause-volume-slider'),
    pauseSfxSlider: $id('pause-sfx-slider'),
    saverToggle: $id('saver-toggle'),
    pauseSaverToggle: $id('pause-saver-toggle'),
    fullscreenToggle: $id('fullscreen-toggle'),
    pauseFullscreenToggle: $id('pause-fullscreen-toggle'),
    installBtn: $id('install-btn'),
    installScreen: $id('install-screen'),
    installSteps: $id('install-steps'),
    installNote: $id('install-note'),
    installOpenBtn: $id('install-open-btn'),
    installCloseBtn: $id('install-close-btn'),
    draftScreen: $id('draft-screen'),
    draftCards: $id('draft-cards'),
    rerollBtn: $id('reroll-btn'), skipBtn: $id('skip-btn'), healBtn: $id('heal-btn'),
    pauseMenu: $id('pause-menu'),
    pauseResonance: $id('pause-resonance'),
    pauseBlessings: $id('pause-blessings'),
    resumeGameBtn: $id('resume-game-btn'),
    pauseTitleBtn: $id('pause-title-btn'),
    restartGameBtn: $id('restart-game-btn'),
    pauseSummonStats: $id('pause-summon-stats'),
    gameOverScreen: $id('game-over-screen'),
    finalWaveText: $id('final-wave-text'),
    bestWaveText: $id('best-wave-text'),
    finalKills: $id('final-kills'),
    finalSummons: $id('final-summons'),
    finalStreak: $id('final-streak'),
    finalReward: $id('final-reward'),
    finalRewardDetail: $id('final-reward-detail'),
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
        // 走速要比大部分雜兵快（血狼 50、赤鷲 95、石像鬼 100），走位才甩得開；直撲法師的蝙蝠（115）刻意比法師快
        baseHealth: 50, baseMoveSpeed: 110, radius: 12, color: '#03A9F4',
        imageName: 'player', imgScaleMultiplier: 4,
        initialSouls: 20,
        // 法師自己會打：每 boltInterval 秒對 boltRange 內最近的怪射一顆靈魂彈。
        // 傷害乘上怪物的波數成長倍率，任何一波都是兩三發打死一隻血狼——前期兵少時能自保、清掉落單的，
        // 但永遠只是補刀，主力還是召喚物。
        // 會追蹤之後幾乎發發命中（直線飛時常打歪），單發傷害從 5 降下來抵銷：不然站著不動的玩家也撐得到最後一波
        boltDamage: 3.5, boltInterval: 0.65, boltRange: 150,
        // 魂火骷髏：從法杖頂端扇形射出、彎過去追目標（見 Projectile 的 homing），飛行中加速
        bolt: { projectileRadius: 5, projectileColor: '#7FF0F0', projectileSpeed: 240, boltStyle: 'soul' },
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
        minWave: 3, waveInterval: 2,
    },
    bloaterMonster: {
        type: 'Bloater', name: '腐屍', baseHealth: 18, baseAttack: 14, radius: 12,
        imageName: 'basic_melee', art: 'bloater', imgScaleMultiplier: 5.5, artScale: 4, tint: '#7CB342', tintStrength: 0.55,
        attackRange: 22, attackSpeed: 1.0, moveSpeed: 62, color: '#7CB342',
        soulDrop: 2, waveSpeedIncreaseFactor: 0.01,
        minWave: 6, waveInterval: 3,
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
    dragonBoss: {
        type: 'Boss', name: '腐朽骨龍', baseHealth: 650, baseAttack: 24, radius: 26,
        // 專屬圖載不到時退回骸骨巨像的圖染綠
        imageName: 'boss_colossus', art: 'boss_dragon', imgScaleMultiplier: 4.5, artScale: 5, tint: '#2E7D32', tintStrength: 0.55,
        attackRange: 34, attackSpeed: 0.7, moveSpeed: 34, color: '#2E7D32',
        soulDrop: 50, waveSpeedIncreaseFactor: 0.004, slowResist: 0.5,
        // 吐息：朝法師畫一塊扇形預警，蓄力後整塊扇形噴下去（大軍擠在前面會被燒一大片，法師要閃出扇形）
        breathInterval: 6, breathWindup: 1.0, breathRange: 240, breathAngle: Math.PI / 3.5, breathTriggerRange: 280,
        breathDamageMult: 2.5, breathPlayerHpRatio: 0.25,
        // 飛撲：飛上天（打不到）、地上紅圈標出法師起飛時站的位置，flightTime 秒後砸下來
        flyInterval: 11, flightTime: 1.6, flyHeight: 120, landRadius: 100, landDamageMult: 2, landPlayerHpRatio: 0.3,
        // 血量低於這個比例後兩招都變快
        phase2Ratio: 0.5, phase2Speed: 1.4,
    },
    thief: {
        type: 'Thief', name: '金魂竊賊', baseHealth: 60, baseAttack: 0, radius: 11,
        imageName: 'fast_melee', art: 'thief', imgScaleMultiplier: 3, artScale: 4.5, tint: '#FFC107', tintStrength: 0.55,
        // 要比法師和骷髏慢，帶著大軍追得上才有意思
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
        minWave: 11, waveInterval: 7,
        // 潛行時召喚物看不到她（見 SpatialGrid.rebuild），只在蓄力到刺完後現形的那段時間會被大軍圍毆，所以每隻幾乎都會出手一次。
        // 不理召喚物、只找法師：靠近後在法師腳下標記，蓄力完瞬移過去刺一刀。
        // 傷害是法師最大生命的固定比例、不隨波數變大：站著不動才會中，一直走一定閃得掉（法師走速 × 蓄力 0.75 秒 ≫ 判定半徑）
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
        minWave: 17, waveInterval: 4,
        // 往目標丟一團毒：落點先出現預警圈，飛行 lobTime 秒後變成毒池，持續 puddleLife 秒，每 puddleTick 秒對圈內的召喚物與法師造成傷害。
        // 懲罰大軍擠成一團、法師站著不動。
        // 對法師的傷害是最大生命的固定比例（同刺客）：照怪物攻擊算的話第 30 波站進去 1.5 秒就死，完全來不及反應
        throwWindup: 0.45, lobTime: 1.0, puddleRadius: 40, puddleLife: 3, puddleTick: 0.5, puddleDamageMult: 0.4, puddlePlayerHpRatio: 0.06,
    },
    bloodEye: {
        type: 'BloodEye', name: '血瞳', baseHealth: 22, baseAttack: 0, radius: 11,
        // 專屬圖載不到時退回眼魔的圖染成血紅（跟敵方骷髏同一套「我方兵種染紅＝敵人」的做法）
        imageName: 'eye_monster', art: 'blood_eye', imgScaleMultiplier: 3, artScale: 3.3, tint: '#D50000', tintStrength: 0.6,
        // attackRange = 停在離法師多遠的地方射，attackSpeed = 每秒射幾發
        attackRange: 190, attackSpeed: 0.4, moveSpeed: 48, color: '#D50000',
        soulDrop: 3, waveSpeedIncreaseFactor: 0.006,
        minWave: 4, waveInterval: 3,
        // 大軍圍在法師身邊，其他怪幾乎碰不到法師，走位前中期沒有意義。血瞳只盯法師：蓄力 windup 秒後朝法師「當下的位置」射一顆慢速血彈，
        // 飛過大軍頭上、只打法師。有在走就躲得掉（飛 190 要 1.2 秒，法師走得了一百多），站著不動才會一直中。
        // 傷害是法師最大生命的固定比例（同刺客、投手），不隨波數變大
        windup: 0.55, boltSpeed: 160, boltRange: 380, boltRadius: 7, boltPlayerHpRatio: 0.08,
    },
    gargoyle: {
        type: 'Gargoyle', name: '腐翼石像鬼', baseHealth: 30, baseAttack: 7, radius: 12,
        // 專屬圖載不到時退回赤鷲的圖染成石頭灰
        imageName: 'fast_melee', art: 'gargoyle', imgScaleMultiplier: 3.2, artScale: 4.8, tint: '#78909C', tintStrength: 0.65,
        attackRange: 18, attackSpeed: 1.1, moveSpeed: 100, color: '#78909C',
        soulDrop: 3, waveSpeedIncreaseFactor: 0.006,
        minWave: 12, waveInterval: 4,
        // 會飛：骷髏（近戰）打不到、橫掃也掃不到（見 groundMonsterGrid），只有眼魔、法師的靈魂彈、怨靈與新星傷得到。
        // 專撲眼魔：只出骷髏會被牠剋，跟「盾衛剋只出眼魔」互補，兵種搭配才有取捨
        flying: true, preySearchRadius: 320, hoverHeight: 16, hoverBob: 3, hoverBobSpeed: 5,
    },
    soulDevourer: {
        type: 'SoulDevourer', name: '吞魂者', baseHealth: 60, baseAttack: 6, radius: 14,
        imageName: 'basic_melee', art: 'soul_devourer', imgScaleMultiplier: 5, artScale: 3.2, tint: '#33691E', tintStrength: 0.6,
        attackRange: 20, attackSpeed: 0.8, moveSpeed: 58, color: '#33691E',
        soulDrop: 4, waveSpeedIncreaseFactor: 0.006,
        minWave: 9, waveInterval: 5,
        // 去吃地上還沒被吸走的靈魂：每吃 1 靈魂，血量 +出生血量的 hpPerSoul、體型 +growPerSoul（封頂 +maxGrow）；
        // 打死原數吐回吃掉的。跟玩家搶錢：牠吃得越多越硬、越難打回來，要嘛走過去撿、要嘛放新星一口氣吸走。
        // 不多吐：吐 1.5 倍時牠變成收入放大器（大軍腳下滿地靈魂都被牠吃、殺掉多拿五成），一局多出上萬靈魂
        orbSearchRadius: 260, hpPerSoul: 0.12, growPerSoul: 0.03, maxGrow: 1.0, refundMult: 1,
    },
    tombstone: {
        type: 'Tombstone', name: '招魂墓碑', baseHealth: 260, baseAttack: 0, radius: 18,
        // 專屬圖載不到時用畫的（見 TombstoneMonster.drawPlaceholder）；imageName 只是讓載入流程有圖可用
        imageName: 'armored_melee', art: 'tombstone', imgScaleMultiplier: 4, artScale: 3.5,
        attackRange: 0, attackSpeed: 1, moveSpeed: 0, color: '#607D8B',
        // 牠叫出來的血狼不掉靈魂（見 noSouls）：不然墓碑是一台刷錢機，大軍膨脹到什麼都一出場就死
        soulDrop: 15, soulPerWave: 1, waveSpeedIncreaseFactor: 0,
        minWave: 19, waveInterval: 10,
        // 出現在畫面外不會動，每 spawnInterval 秒冒 spawnCount 隻血狼（牠叫出來的最多同時 maxSpawned 隻），lifetime 秒後自己崩塌、不掉靈魂。
        // 帶大軍去拆才拿得到那一大筆靈魂；不理牠就是多吃一陣子小怪。畫面邊緣一直有箭頭指著牠
        spawnInterval: 3.5, spawnCount: 2, maxSpawned: 8, lifetime: 30,
    },
    slime: {
        type: 'Slime', name: '瘟膿史萊姆', baseHealth: 24, baseAttack: 4, radius: 13,
        imageName: 'basic_melee', art: 'slime', imgScaleMultiplier: 4, artScale: 3.2, tint: '#C0CA33', tintStrength: 0.6,
        attackRange: 20, attackSpeed: 1, moveSpeed: 42, color: '#C0CA33',
        soulDrop: 1, waveSpeedIncreaseFactor: 0.008,
        minWave: 5, waveInterval: 3,
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
        minWave: 7, waveInterval: 4, flockSize: 6, wobble: 0.6, playerHpRatio: 0.03,
    },
    witchDoctor: {
        type: 'WitchDoctor', name: '腐骨巫醫', baseHealth: 35, baseAttack: 0, radius: 12,
        imageName: 'basic_melee', art: 'witch_doctor', imgScaleMultiplier: 5, artScale: 3.8, tint: '#689F38', tintStrength: 0.5,
        // attackRange = 站在多遠外施法，attackSpeed = 每秒補幾次血
        attackRange: 150, attackSpeed: 0.25, moveSpeed: 40, color: '#689F38',
        soulDrop: 4, waveSpeedIncreaseFactor: 0.006,
        minWave: 13, waveInterval: 6, healRadius: 100, healRatio: 0.25,
    },
    shieldGuard: {
        type: 'ShieldGuard', name: '骨盾衛兵', baseHealth: 60, baseAttack: 8, radius: 14,
        imageName: 'armored_melee', art: 'shield_guard', imgScaleMultiplier: 6, artScale: 3.4, tint: '#607D8B', tintStrength: 0.5,
        attackRange: 22, attackSpeed: 0.8, moveSpeed: 34, color: '#607D8B',
        soulDrop: 4, waveSpeedIncreaseFactor: 0.006,
        // 眼魔的飛彈（含爆炸波及）打在牠和牠盾陣裡的怪身上只剩 (1 - projectileBlock)：
        // 只出眼魔清不掉這一群，要派骷髏衝進去先把盾衛打掉（見 projectileBlockAt）。
        // 擋全部：用百分比的話，眼魔等級一高還是秒穿（實測擋 97% 時 Lv30 眼魔仍比骷髏快，時間卡在飛行與找目標、不在傷害）。
        // 法師的靈魂彈穿盾，所以只出眼魔也不會卡死波次：法師慢慢磨得死，或派骷髏衝進去
        minWave: 15, waveInterval: 5, projectileBlock: 1,
    },
    corpseWorm: {
        type: 'CorpseWorm', name: '屍蟲', baseHealth: 70, baseAttack: 10, radius: 16,
        imageName: 'armored_melee', art: 'corpse_worm', imgScaleMultiplier: 6, artScale: 4.5, tint: '#9E9E9E', tintStrength: 0.5,
        attackRange: 0, attackSpeed: 1, moveSpeed: 75, color: '#9E9E9E',
        soulDrop: 6, waveSpeedIncreaseFactor: 0.004,
        // 地底移動 burrowTime 秒（打不到）→ 地面預警 warnTime 秒 → 竄出傷害一圈 → 露在地面 surfaceTime 秒（這時才打得到）→ 再鑽下去
        minWave: 23, waveInterval: 6,
        burrowTime: 3.5, warnTime: 0.9, eruptRadius: 55, eruptDamageMult: 2.5, eruptPlayerHpRatio: 0.25, surfaceTime: 3,
    },
    gravePriest: {
        type: 'GravePriest', name: '墓地祭司', baseHealth: 45, baseAttack: 0, radius: 12,
        imageName: 'wraith', art: 'grave_priest', imgScaleMultiplier: 3, artScale: 3.6, tint: '#1B5E20', tintStrength: 0.5,
        attackRange: 150, attackSpeed: 0.2, moveSpeed: 38, color: '#1B5E20',
        soulDrop: 5, waveSpeedIncreaseFactor: 0.006,
        // 身邊陣亡的召喚物會被牠復活成敵方骷髏（亡靈法師的招式反過來用）
        minWave: 26, waveInterval: 6, raiseRadius: 130, raiseCooldown: 1.2, maxRaised: 6,
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
        startWave: 21,
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
        // 等於開戰前的大字倒數（COUNTDOWN_SECONDS）：波間沒事做，5 秒 × 50 波 = 一局四分多鐘在等
        betweenTime: 3,
        // 前 earlyWaves 波每波成長較多，讓前期就有壓力
        earlyWaves: 20, earlyScalePerWave: 0.035,
        scalePerWave: 0.02, lateWave: 50, lateScalePerWave: 0.007,
        // 召喚物不設上限時，玩家收入隨怪物「數量」成長、戰力隨累積收入成長，線性變強的怪物永遠追不上
        // （舊版就是這樣撐到無限波）。從 expStartWave 起再乘上 expGrowth^(超過的波數)，保證終究會被淹沒
        expStartWave: 20, expGrowth: 1.11,
        // 一局的目標：第 finalWave 波最終首領墮落亡靈王出場，打贏算通關（約 25 分鐘）。
        // 之後可以選擇繼續無盡模式，每波再多乘 endlessGrowth，通常十幾波內結束，不會變成一小時的慢慢輸
        finalWave: 50, endlessGrowth: 1.05,
        // 狼群是「填充」用的；中後期的壓力主要交給各種新威脅，所以每波增加的數量不多。
        // 底數給高一點是為了開場：第 1 波只有 2～4 隻時，前幾波畫面上幾乎沒東西可打
        basicBase: 8, basicPerWave: 1.0,
        bossEvery: 10, bossWaveCountFactor: 0.5,
        // 每 10 波一輪的怪物數量（索引 = 波數 % 10，0 是首領波另外算）：
        // 首領剛打完的兩波明顯變少，讓大軍爽割一輪，再一路加壓到下一隻首領（鋸齒形難度）
        cycleCountFactors: [1, 0.55, 0.75, 0.9, 0.95, 1, 1.05, 1.1, 1.2, 1.3],
        spawnIntervalBase: 0.9, spawnIntervalPerWave: 0.01, spawnIntervalMin: 0.35,
        firstSpawnDelay: 0.8, packMin: 1, packMax: 4, packSpread: 25,
        // 每 packGrowEvery 波，每一撮最多再多 1 隻：後期一波上百隻，一小撮一小撮慢慢走進上千隻的大軍裡，
        // 畫面上同時只有二三十隻、一波拖到一分鐘。成撮湧進來才有大群對撞的場面
        packGrowEvery: 6,
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
        // 新星同時讓整支大軍狂暴 frenzyDuration 秒（攻擊冷卻走 frenzyAttackRate 倍快），並把場上的靈魂全吸過來：
        // 只有「炸身邊」時，大軍擋在前面的局面法師根本不會被貼身，整局按不到幾次。有了這一半，它變成抓時機爆發的按鈕
        frenzyDuration: 4, frenzyAttackRate: 1.6,
        frenzyVignette: 'rgba(186, 104, 200, 0.7)',
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
// 全軍通用的祝福（骷髏、怨靈、眼魔都吃）：卡片標「全軍」、不算進任何流派的共鳴、抽卡不加權。
// 骨甲、嗜魂原本被歸到骷髏流派，卡片上是骷髏頭像、說明卻寫「召喚物」，還會幫眼魔流派的人湊骷髏共鳴
const ARMY_SCHOOL = 'army';
// 契約不屬於任何流派：不算共鳴、卡片標「契約」
const PACT_SCHOOL = 'pact';
// 整局的乘數（詛咒、契約、每日變異共用，見 runMods）：每個鍵的中文說法，以及「大於 1 是好事嗎」
// 契約與每日變異的說明文字都從數字產生，數字改了說明跟著變
const RUN_MOD_LABELS = {
    summonDmgMult: { label: '召喚物傷害', good: true },
    summonAtkSpeedMult: { label: '召喚物攻速', good: true },
    boltDmgMult: { label: '法師靈魂彈傷害', good: true },
    soulMult: { label: '靈魂掉落', good: true },
    costMult: { label: '召喚費用', good: false },
    novaCdMult: { label: '新星冷卻', good: false },
    mageHpMult: { label: '法師血量', good: true },
    hpMult: { label: '怪物血量', good: false },
    atkMult: { label: '怪物攻擊', good: false },
    speedMult: { label: '怪物移速', good: false },
    eliteMult: { label: '精英怪', good: false },
    bossHpMult: { label: '首領血量', good: false },
};
const RUN_MOD_TIMES_FROM = 2;   // 兩倍以上寫「×2.5」，比「+150%」好懂
function runModText(key, v) {
    const L = RUN_MOD_LABELS[key].label;
    if (v >= RUN_MOD_TIMES_FROM) return `${L} ×${v}`;
    return v >= 1 ? `${L} +${pct(v - 1)}` : `${L} -${pct(1 - v)}`;
}
function isGoodMod(key, v) { return (v > 1) === RUN_MOD_LABELS[key].good; }
// 好處一行綠、壞處一行紅（卡片、每日變異共用）
function runModsHtml(mods) {
    const keys = Object.keys(mods);
    return keys.filter(k => isGoodMod(k, mods[k])).concat(keys.filter(k => !isGoodMod(k, mods[k])))
        .map(k => `<span class="${isGoodMod(k, mods[k]) ? 'boon' : 'bane'}">${runModText(k, mods[k])}</span>`).join('');
}
// school：所屬流派（見 SCHOOLS），同流派累積層數觸發共鳴；全軍都吃的寫 ARMY_SCHOOL，不算進任何流派
const BLESSINGS = {
    boneBlade: { school: 'skel', name: '骨刃', max: 5, per: 0.35, desc: b => `骷髏傷害 +${pct(b.per)}` },
    cleave: { school: 'skel', name: '橫掃', max: 3, per: 0.3, desc: b => `骷髏攻擊波及周圍 ${pct(b.per)}` },
    boneArmor: { school: ARMY_SCHOOL, name: '骨甲', max: 5, per: 0.3, desc: b => `召喚物血量 +${pct(b.per)}` },
    raiseDead: { school: 'skel', name: '亡者復甦', max: 4, per: 0.05, desc: b => `擊殺時 ${pct(b.per)} 復活成骷髏` },
    lifesteal: { school: ARMY_SCHOOL, name: '嗜魂', max: 2, per: 0.15, desc: b => `召喚物造成傷害的 ${pct(b.per)} 回血` },
    splitGaze: { school: 'eye', name: '分裂凝視', max: 3, per: 1, desc: b => `眼魔每次多射 ${b.per} 發` },
    frenzyEye: { school: 'eye', name: '狂熱之眼', max: 4, per: 0.3, desc: b => `眼魔攻速 +${pct(b.per)}` },
    eagleEye: { school: 'eye', name: '鷹眼', max: 3, per: 0.2, desc: b => `眼魔射程 +${pct(b.per)}` },
    wraithBlast: { school: 'wraith', name: '怨念爆裂', max: 4, per: 0.6, desc: b => `怨靈爆炸傷害 +${pct(b.per)}` },
    rebirth: { school: 'wraith', name: '輪迴', max: 2, per: 0.4, desc: b => `怨靈陣亡時 ${pct(b.per)} 重生` },
    frostAura: { school: 'wraith', name: '寒冥光環', max: 3, per: 5, desc: b => `怨靈光環持續傷害 ${b.per}（隨怨靈等級成長）` },
    auraMight: { school: 'wraith', name: '冥界加持', max: 3, per: 0.2, desc: b => `怨靈光環裡的骷髏、眼魔傷害 +${pct(b.per)}` },
    // totalDesc：暫停選單顯示累積效果時用（「並回滿」只在選的當下成立）
    vitality: { school: 'mage', name: '不死之軀', max: 5, per: 25, desc: b => `法師血量 +${b.per} 並回滿`, totalDesc: b => `法師血量 +${b.per}` },
    novaPower: { school: 'mage', name: '新星強化', max: 4, per: 0.5, cdPer: 0.15, desc: b => `新星傷害 +${pct(b.per)}、冷卻 -${pct(b.cdPer)}` },
    soulBlade: { school: 'mage', name: '靈魂之刃', max: 4, per: 0.6, desc: b => `法師靈魂彈傷害 +${pct(b.per)}` },
    soulVolley: { school: 'mage', name: '靈魂連射', max: 2, per: 1, desc: b => `法師每次多射 ${b.per} 顆` },
    shadowStep: { school: 'mage', name: '幽影步', max: 3, per: 0.12, desc: b => `法師移速 +${pct(b.per)}` },
    frenzyTime: { school: 'mage', name: '狂潮延長', max: 3, per: 1.5, desc: b => `新星的大軍狂暴多 ${b.per} 秒` },
    soulHarvest: { school: 'soul', name: '靈魂收割', max: 4, per: 0.25, desc: b => `靈魂掉落 +${pct(b.per)}` },
    magnet: { school: 'soul', name: '靈魂牽引', max: 2, per: 0.6, desc: b => `拾取範圍 +${pct(b.per)}` },
    pact: { school: 'soul', name: '亡者契約', max: 2, per: 0.25, desc: b => `召喚費用 -${pct(b.per)}` },
    // ---- 傳說：首領波的三選一固定佔一張、一般波次偶爾出現（LEGEND_CHANCE_NORMAL），每種一局只能拿一次；改變打法，不只是加數字 ----
    boneBurst: { school: 'skel', name: '骸骨爆裂', legendary: true, max: 1, per: 3, desc: () => '骷髏陣亡時炸傷周圍的怪' },
    giantBones: { school: 'skel', name: '巨骨', legendary: true, max: 1, per: 8, desc: b => `每 ${b.per} 隻骷髏出一隻巨人` },
    ricochet: { school: 'eye', name: '跳彈魔眼', legendary: true, max: 1, per: 2, desc: b => `眼魔的彈多彈射 ${b.per} 次` },
    soulfire: { school: 'mage', name: '魂火', legendary: true, max: 1, per: 0.6, desc: () => '法師的靈魂彈命中時爆炸' },
    frostNova: { school: 'mage', name: '寒冰新星', legendary: true, max: 1, per: 3, desc: b => `新星範圍變大，凍住敵人 ${b.per} 秒` },
    eliteHunter: { school: 'mage', name: '精英獵手', legendary: true, max: 1, per: 1, desc: () => '擊殺精英怪時新星冷卻歸零' },
    soulSiphon: { school: 'mage', name: '吸魂之軀', legendary: true, max: 1, per: 1, desc: b => `每吸一顆靈魂，法師回 ${b.per} 血` },
    twinSummon: { school: 'soul', name: '雙生召喚', legendary: true, max: 1, per: 0.3, desc: b => `召喚時 ${pct(b.per)} 機率多送一隻` },
    midas: { school: 'soul', name: '點金', legendary: true, max: 1, per: 0.15, desc: b => `擊殺時 ${pct(b.per)} 掉落三倍靈魂` },
    deathPact: { school: 'soul', name: '殘魂回收', legendary: true, max: 1, per: 0.3, desc: b => `召喚物陣亡時 ${pct(b.per)} 掉回靈魂` },
    // ---- 契約（同 PokeBonk 生存模式的 pact）：好處很大、壞處跟著整局。一般波次偶爾出一張（PACT_CHANCE），每種一局只能立一次。
    // 效果寫在 mods，跟詛咒共用 runMods() 的乘數；圖示是 icons.js 的 pact_*
    bloodPact: { school: PACT_SCHOOL, pact: true, icon: 'pact_blood', name: '血祭契約', max: 1, mods: { summonDmgMult: 1.5, mageHpMult: 0.7 }, desc: b => runModsHtml(b.mods) },
    greedPact: { school: PACT_SCHOOL, pact: true, icon: 'pact_greed', name: '貪婪契約', max: 1, mods: { soulMult: 1.5, hpMult: 1.25 }, desc: b => runModsHtml(b.mods) },
    furyPact: { school: PACT_SCHOOL, pact: true, icon: 'pact_fury', name: '戰狂契約', max: 1, mods: { summonAtkSpeedMult: 1.3, atkMult: 1.3 }, desc: b => runModsHtml(b.mods) },
    flamePact: { school: PACT_SCHOOL, pact: true, icon: 'pact_flame', name: '魂焰契約', max: 1, mods: { boltDmgMult: 2.5, speedMult: 1.15 }, desc: b => runModsHtml(b.mods) },
    swarmPact: { school: PACT_SCHOOL, pact: true, icon: 'pact_swarm', name: '群聚契約', max: 1, mods: { costMult: 0.7, eliteMult: 2 }, desc: b => runModsHtml(b.mods) },
    stormPact: { school: PACT_SCHOOL, pact: true, icon: 'pact_storm', name: '雷鳴契約', max: 1, mods: { novaCdMult: 0.6, bossHpMult: 1.4 }, desc: b => runModsHtml(b.mods) },
};
// 卡片、暫停選單、飄字的圖示：契約寫在 icon，其他就是祝福自己的 id
function blessIcon(id) { return BLESSINGS[id].icon || id; }

// ---------- 流派共鳴：同一流派的祝福累積到 RESONANCE_STEPS 的層數，各觸發一次共鳴 ----------
// 同 Hades 的雙神祝福、吸血鬼倖存者的武器進化：專精一條路要有爆發點，不然 27 張各加一點數字，選哪張都差不多
const SCHOOLS = {
    skel: { name: '骷髏', img: 'skeleton_warrior.png', color: '#ECEFF1', res: [{ name: '骨潮', desc: '骷髏攻速 +25%' }, { name: '不滅骨軍', desc: '骷髏陣亡時 35% 當場重組' }] },
    eye: { name: '眼魔', img: 'eye_monster.png', color: '#F48FB1', res: [{ name: '連環凝視', desc: '眼魔的彈多彈射 1 次' }, { name: '千眼', desc: '眼魔每次多射 1 發' }] },
    wraith: { name: '怨靈', img: 'wraith.png', color: '#80CBC4', res: [{ name: '冥域', desc: '怨靈光環範圍 +30%' }, { name: '哀嚎', desc: '怨靈每 3 秒脈衝，傷害 ×2' }] },
    mage: { name: '法師', img: 'player.png', color: '#80DEEA', res: [{ name: '魂彈連發', desc: '法師射速 +40%' }, { name: '新星湧動', desc: '新星冷卻 -35%' }] },
    soul: { name: '靈魂', icon: 'soul', color: '#B2EBF2', res: [{ name: '引魂', desc: '拾取範圍 +60%' }, { name: '豐收', desc: '靈魂掉落 +30%' }] },
};
const RESONANCE_STEPS = [3, 6];
// 共鳴的實際數值（SCHOOLS 的說明文字跟著這裡寫）
const RES_SKEL_ATK_SPEED = 0.25;
const RES_SKEL_REVIVE = 0.35;
const RES_WRAITH_RADIUS = 1.3;
const RES_WRAITH_PULSE_MULT = 2;
const RES_MAGE_RATE = 1.4;
const RES_NOVA_CD = 0.35;
const RES_MAGNET = 0.6;
const RES_SOULS = 0.3;
function schoolPoints(school) {
    if (school === ARMY_SCHOOL || school === PACT_SCHOOL) return 0;
    let n = 0;
    for (const id in BLESSINGS) if (BLESSINGS[id].school === school) n += bl(id);
    return n;
}
function resonanceTier(points) {
    let t = 0;
    while (t < RESONANCE_STEPS.length && points >= RESONANCE_STEPS[t]) t++;
    return t;
}
// 熱路徑（每隻召喚物算數值、每發飛彈）直接查快取，祝福變動時才重算
function res(school) { return gameState.resonance[school] || 0; }
function refreshResonance() {
    const r = {};
    for (const s in SCHOOLS) r[s] = resonanceTier(schoolPoints(s));
    gameState.resonance = r;
}
// 傳說的細部數值（說明文字只講會影響選擇的那一個數）
const GIANT_STAT_MULT = 3;
const GIANT_SCALE_MULT = 1.6;
const FROST_NOVA_RADIUS_MULT = 1.4;
const FROST_NOVA_SLOW = 0.92;
const MIDAS_MULT = 3;
// 一般波次的三選一也有這個機率出一張傳說（首領波則是保證一張）
const LEGEND_CHANCE_NORMAL = 0.12;
// 這一波起，一般波次的三選一有 PACT_CHANCE 機率把其中一張換成契約（首領波不出：那一輪留給傳說）
const PACT_START_WAVE = 6;
const PACT_CHANCE = 0.18;
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
    freeReroll: { icon: 'reroll', name: '先知之眼', max: 3, per: 1, costBase: 80, desc: m => `每局重抽次數 +${m.per}` },
    // 改變「怎麼選」的解鎖，不只是加數字：放逐讓一局更容易成型、多一張讓每次都有得挑
    banish: { icon: 'banish', name: '斷念', max: 3, per: 1, costBase: 60, desc: m => `每局可放逐 ${m.per} 張祝福（整局不再出現）` },
    extraChoice: { icon: 'extraChoice', name: '多一條路', max: 1, per: 1, costBase: 250, desc: () => '祝福多一張可選' },
    headStart: { icon: 'star', name: '開局祝福', max: 1, per: 1, costBase: 150, desc: () => '開局先選一次祝福' },
};
const CRYSTALS_PER_WAVE = 2;
const CRYSTALS_PER_BOSS = 15;
function defaultMeta() {
    return { crystals: 0, upgrades: {}, relicSeen: {}, achv: {}, stats: defaultStats(), bestClear: {}, leaderboard: [], lbName: '', tutorialDone: false, wins: 0, curseUnlocked: 0, curseSelected: 0, bgmVolume: CONFIG.audio.initialVolume, sfxVolume: CONFIG.audio.initialSfxVolume, powerSaver: false };
}
function loadMeta() {
    try {
        const m = JSON.parse(SaveStore.get(META_KEY));
        if (m) return { ...defaultMeta(), ...m, upgrades: { ...(m.upgrades || {}) }, stats: { ...defaultStats(), ...(m.stats || {}) }, leaderboard: m.leaderboard || seedLeaderboard(m.bestClear) };
    } catch (e) { }
    return defaultMeta();
}
function saveMeta() {
    try { SaveStore.set(META_KEY, JSON.stringify(meta)); } catch (e) { }
}
// 存檔庫是非同步開的，開場（boot）讀完才把存的內容填進來
const meta = defaultMeta();
function metaLv(id) { return meta.upgrades[id] || 0; }
function metaVal(id) { return META_UPGRADES[id].per * metaLv(id); }
function metaCost(id) { return META_UPGRADES[id].costBase * (metaLv(id) + 1); }

// ---------- 成就：第一次達成就給結晶（跨局保留） ----------
// 同類遊戲的成就都是上百個（PokéSurvivor 149 個）：每一類都有「近的」與「遠的」目標，每一局都至少有幾個摸得到。
// 條件都看目前狀態或跨局統計（meta.stats），不需要每格算；圖示見 achievement-icons.js（圖鑑那一類直接用那隻怪的立繪）。
// 清單裡會用到稍後才宣告的 CURSES、DAILY_MUTATIONS，所以第一次用到時才建（achievements()）
const ACHV_CATEGORIES = [
    { id: 'journey', name: '征途' }, { id: 'endless', name: '無盡' }, { id: 'curse', name: '詛咒' }, { id: 'boss', name: '首領' },
    { id: 'bestiary', name: '圖鑑' }, { id: 'army', name: '大軍' }, { id: 'resonance', name: '共鳴' }, { id: 'legend', name: '傳說' },
    { id: 'pact', name: '契約' }, { id: 'streak', name: '連殺' }, { id: 'relic', name: '遺跡' }, { id: 'daily', name: '每日' },
    { id: 'career', name: '生涯' }, { id: 'challenge', name: '挑戰' }, { id: 'class', name: '職業' }, { id: 'legacy', name: '傳承' },
];
const ACHV_JOURNEY = [[5, 'wave5', '破曉', 10], [10, 'wave10', '初陣', 15], [15, 'wave15', '老兵', 20], [20, 'wave20', '百戰', 25], [25, 'wave25', '過半', 30],
    [30, 'wave30', '屍山', 35], [35, 'wave35', '血海', 40], [40, 'wave40', '龍門', 45], [45, 'wave45', '最後的長夜', 50]];
// 通關時間：自動遊玩（一路搶開戰、不停下來）約 25 分鐘，真人多半更久
const ACHV_SPEED = [[28, 'speed28', '急行軍', 40], [24, 'speed24', '閃擊戰', 80], [20, 'speed20', '神速', 150]];
const ACHV_ENDLESS = [[55, 'endless55', '無盡伊始', 60], [60, 'endless', '無盡深淵', 80], [70, 'endless70', '深淵凝視', 100], [80, 'endless80', '虛空行者', 140], [100, 'endless100', '永恆', 250]];
// 詛咒幾級以上通關：沿用舊的 id（curseMid = 4 級、curseMax = 全開），其他級補上
const ACHV_CURSE_IDS = ['curse1', 'curse2', 'curse3', 'curseMid', 'curse5', 'curse6', 'curse7', 'curseMax'];
const ACHV_CURSE_NAMES = ['初嚐詛咒', '雙重枷鎖', '三重苦難', '受詛者', '五毒俱全', '六道輪迴', '七宗罪', '萬咒之王'];
const ACHV_BOSSES = [['ColossusBoss', 'boss'], ['PlagueBoss', 'plagueBoss'], ['HunterBoss', 'hunterBoss'], ['DragonBoss', 'dragonBoss'], ['LichBoss', 'lichBoss']];
// 圖鑑：各種怪累計打倒幾隻。自動遊玩打完一整局（50 波）每種大約打倒：血狼 2600、赤鷲 740、血牙野豬 300、腐屍 400、史萊姆 3150、
// 蝙蝠 1900、刺客 180、投手 200、血瞳 450、石像鬼 250、吞魂者 240、巫醫 180、盾衛 180、屍蟲 100、祭司 85、墓碑 38、竊賊 3。
// 門檻約是三局的量：一局拿不完、玩幾局會陸續解開
const ACHV_BESTIARY = [
    ['BasicMelee', 'basicMeleeMonster', 8000], ['FastMelee', 'fastMeleeMonster', 2000], ['ArmoredMelee', 'armoredMeleeMonster', 1000],
    ['Bloater', 'bloaterMonster', 1200], ['Slime', 'slime', 10000], ['Bat', 'bat', 6000], ['Assassin', 'assassin', 500], ['Spitter', 'spitter', 600],
    ['BloodEye', 'bloodEye', 1500], ['Gargoyle', 'gargoyle', 800], ['SoulDevourer', 'soulDevourer', 700], ['WitchDoctor', 'witchDoctor', 500],
    ['ShieldGuard', 'shieldGuard', 500], ['CorpseWorm', 'corpseWorm', 300], ['GravePriest', 'gravePriest', 250], ['Tombstone', 'tombstone', 100], ['Thief', 'thief', 15],
];
// 召喚費用隨數量變貴（SUMMON_COST_STEP）之後，自動遊玩一局的大軍最多 150～480 隻
const ACHV_ARMY = [[50, 'army50', '一支軍隊', 10], [150, 'army150', '亡者之海', 30], [300, 'army300', '千軍萬馬', 50], [450, 'army450', '萬骨大軍', 80], [600, 'army600', '死亡天災', 150]];
const ACHV_UNITS = ['SkeletonWarrior', 'EyeMonster', 'Wraith'];
const ACHV_STREAK = [[100, 'streak100', '開葷', 10], [250, 'streak250', '殺紅了眼', 20], [500, 'streak1', '殺戮狂潮', 30], [1000, 'streak1000', '千人斬', 45], [2000, 'streak2', '屠戮之王', 60], [5000, 'streak5000', '死神親臨', 120]];
const ACHV_CAREER = [
    ['kills10k', '萬骨枯', '累計打倒 1 萬隻怪', 20, s => s.totalKills >= 1e4],
    ['kills100k', '十萬亡魂', '累計打倒 10 萬隻怪', 60, s => s.totalKills >= 1e5],
    ['kills1m', '百萬屠夫', '累計打倒 100 萬隻怪', 200, s => s.totalKills >= 1e6],
    ['summons1k', '招魂師', '累計召喚 1000 隻', 15, s => s.summons >= 1e3],
    ['summons10k', '亡者君主', '累計召喚 1 萬隻', 50, s => s.summons >= 1e4],
    ['summons100k', '冥府之主', '累計召喚 10 萬隻', 150, s => s.summons >= 1e5],
    ['souls100k', '收魂人', '累計收集 10 萬靈魂', 20, s => s.souls >= 1e5],
    ['souls1m', '靈魂富豪', '累計收集 100 萬靈魂', 60, s => s.souls >= 1e6],
    ['souls10m', '吞天', '累計收集 1000 萬靈魂', 200, s => s.souls >= 1e7],
    ['runs10', '常客', '玩 10 局', 20, s => s.runs >= 10],
    ['runs50', '不死之心', '玩 50 局', 60, s => s.runs >= 50],
    ['runs100', '輪迴百世', '玩 100 局', 150, s => s.runs >= 100],
    ['novas100', '新星信徒', '累計放 100 次新星', 20, s => s.novas >= 100],
    ['novas1000', '星爆千回', '累計放 1000 次新星', 80, s => s.novas >= 1000],
];
const ACHV_RELICS = [
    ['coffin1', '開棺', '打開第一座封印寶棺', 10, s => (s.relics.coffin || 0) >= 1],
    ['coffins', '盜墓者', '累計打開 10 座封印寶棺', 30, s => (s.relics.coffin || 0) >= 10],
    ['coffin50', '盜墓之王', '累計打開 50 座封印寶棺', 80, s => (s.relics.coffin || 0) >= 50],
    ['altar10', '戰鼓手', '累計敲響 10 座戰鼓祭壇', 25, s => (s.relics.altar || 0) >= 10],
    ['altar50', '戰神之鼓', '累計敲響 50 座戰鼓祭壇', 70, s => (s.relics.altar || 0) >= 50],
    ['spring10', '泉水常客', '累計喝乾 10 座靈泉', 30, s => (s.relics.spring || 0) >= 10],
    ['relics30', '巡禮者', '累計啟動 30 座戰場遺跡', 40, s => Object.values(s.relics).reduce((a, b) => a + b, 0) >= 30],
];
const ACHV_SPEED_WAVE = 20, ACHV_SPEED_SECONDS = 10;
const ACHV_WEALTH = 10000;
const ACHV_MASSACRE = 1000;
const ACHV_NOVA_BLAST = 50;
const ACHV_THIEVES = 5;
const ACHV_LAST_STAND = 0.1;
const ACHV_STEADY = 0.5;
const ACHV_FLAWLESS_WAVE = 20;
const ACHV_BLITZ_SECONDS = 20;
// 前兩隻首領自動遊玩都能無傷、20 秒內打倒：這兩個挑戰從這一波的首領起才算
const ACHV_BOSS_CHALLENGE_WAVE = 30;
const ACHV_LEGENDS = 3;
const ACHV_PACTS = 3;
const ACHV_DAILY_WAVE = 20;
const ACHV_DAILY_DAYS = 7;
const ACHV_BOSS_TOTAL = 25;
// 精英潮一波就是幾十隻精英，一局打完會超過一千隻
const ACHV_ELITES = [[500, 'elite500', '精英剋星', 30], [5000, 'elite5000', '王者殺手', 90]];

function defaultStats() {
    return { kills: {}, totalKills: 0, elites: 0, summons: 0, souls: 0, runs: 0, novas: 0, bosses: 0, relics: {}, legends: {}, pacts: {}, dailyDays: {} };
}
function stats() { return meta.stats; }
// 這一局的紀錄（挑戰類成就用）：開新局時歸零，存檔一起存
function emptyRunStats() {
    // recruits：自己按卡片召喚了幾次（開局就帶的兵、免費送的不算）；splits：打完每一波首領時的時間（排行榜的分段計時）
    return { novas: 0, upgrades: 0, picks: 0, hits: 0, minHp: 1, waveKills: 0, maxWaveKills: 0, thieves: 0, novaBest: 0, recruits: 0, relics: {}, flags: {}, splits: {} };
}
function runUnitsUsed() { return Object.keys(gameState.totalSummons).filter(k => gameState.totalSummons[k] > 0); }
function wonOnlyWith(type) { const u = runUnitsUsed(); return gameState.endless && u.length === 1 && u[0] === type; }
function countTaken(pred) { return Object.keys(gameState.blessings).filter(id => BLESSINGS[id] && pred(BLESSINGS[id]) && gameState.blessings[id] > 0).length; }

let ACHIEVEMENTS = null;
function achievements() { return ACHIEVEMENTS || (ACHIEVEMENTS = buildAchievements()); }
function buildAchievements() {
    const L = [];
    const add = (cat, id, name, desc, reward, test, look, cls) => L.push({ cat, id, name, desc, reward, test, look, cls });
    const necro = () => runClass() === DEFAULT_CLASS;
    const S = stats;
    for (const [w, id, name, r] of ACHV_JOURNEY) add('journey', id, name, `撐過第 ${w} 波`, r, () => getSurvivedWaves() >= w);
    add('journey', 'win', '凱旋', '打倒墮落亡靈王', 60, () => gameState.endless);
    for (const [min, id, name, r] of ACHV_SPEED) add('journey', id, name, `${min} 分鐘內通關`, r, () => gameState.endless && gameState.run.clearTime > 0 && gameState.run.clearTime <= min * 60);
    for (const [w, id, name, r] of ACHV_ENDLESS) add('endless', id, name, `無盡模式撐到第 ${w} 波`, r, () => gameState.endless && getSurvivedWaves() >= w);
    ACHV_CURSE_IDS.forEach((id, i) => add('curse', id, ACHV_CURSE_NAMES[i], `詛咒 ${i + 1} 以上通關（${CURSES[i].name}）`, 40 + i * 25, () => gameState.endless && gameState.curse >= i + 1));
    for (const [cls, cfgKey] of ACHV_BOSSES) add('boss', `boss_${cls}`, `討伐${CONFIG[cfgKey].name}`, `打倒${CONFIG[cfgKey].name}`, cls === 'LichBoss' ? 60 : 20, () => !!gameState.bossKills[cls]);
    add('boss', 'bossNoHit', '毫髮無傷', `第 ${ACHV_BOSS_CHALLENGE_WAVE} 波以後的首領波，一下都沒被打中`, 50, () => !!gameState.run.flags.bossNoHit);
    add('boss', 'bossBlitz', '閃電戰', `第 ${ACHV_BOSS_CHALLENGE_WAVE} 波以後的首領，出場 ${ACHV_BLITZ_SECONDS} 秒內打倒`, 50, () => !!gameState.run.flags.bossBlitz);
    add('boss', 'bossTotal', '首領屠夫', `累計打倒 ${ACHV_BOSS_TOTAL} 隻首領`, 60, () => S().bosses >= ACHV_BOSS_TOTAL);
    for (const [type, cfgKey, n] of ACHV_BESTIARY) add('bestiary', `kill_${type}`, CONFIG[cfgKey].name, `累計打倒 ${n} 隻${CONFIG[cfgKey].name}`, 20, () => (S().kills[type] || 0) >= n, CONFIG[cfgKey]);
    for (const [n, id, name, r] of ACHV_ELITES) add('bestiary', id, name, `累計打倒 ${n} 隻精英怪`, r, () => S().elites >= n);
    for (const [n, id, name, r] of ACHV_ARMY) add('army', id, name, `同時有 ${n} 隻召喚物`, r, () => gameState.summons.length >= n);
    for (const type of ACHV_UNITS) CONFIG.evolution.levels.forEach((lv, t) => {
        const name = CONFIG.evolution.names[type][t];
        add('army', `evo_${type}_${t + 1}`, name, `升到 Lv${lv}，進化成${name}`, 15 + t * 20, () => gameState.units[type].level >= lv);
    });
    for (const s of CLASSES.necro.schools) SCHOOLS[s].res.forEach((r, t) => add('resonance', t === 1 ? `res_${s}` : `res1_${s}`, r.name, `${SCHOOLS[s].name}流派疊到 ${RESONANCE_STEPS[t]} 層`, t === 1 ? 40 : 15, () => res(s) >= t + 1));
    for (const id of Object.keys(BLESSINGS).filter(b => BLESSINGS[b].legendary && legendAchvIcon(b))) add('legend', `leg_${id}`, BLESSINGS[id].name, `拿到傳說祝福「${BLESSINGS[id].name}」`, 15, () => !!S().legends[id]);
    add('legend', 'legends', '傳說加身', `一局拿到 ${ACHV_LEGENDS} 張傳說祝福`, 40, () => countTaken(b => b.legendary) >= ACHV_LEGENDS);
    add('legend', 'legendAll', '萬古傳說', '每一張傳說祝福都拿過', 120, () => Object.keys(BLESSINGS).filter(b => BLESSINGS[b].legendary).every(b => S().legends[b]));
    for (const id of Object.keys(BLESSINGS).filter(b => BLESSINGS[b].pact)) add('pact', `pact_${id}`, BLESSINGS[id].name, `立下「${BLESSINGS[id].name}」`, 15, () => !!S().pacts[id]);
    add('pact', 'pacts', '魔鬼交易', `一局立下 ${ACHV_PACTS} 份契約`, 40, () => countTaken(b => b.pact) >= ACHV_PACTS);
    add('pact', 'pactWin', '與魔共舞', `帶著 ${ACHV_PACTS} 份契約通關`, 100, () => gameState.endless && countTaken(b => b.pact) >= ACHV_PACTS);
    for (const [n, id, name, r] of ACHV_STREAK) add('streak', id, name, `連殺 ${n}`, r, () => gameState.bestStreak >= n);
    for (const [id, name, desc, r, t] of ACHV_RELICS) add('relic', id, name, desc, r, () => t(S()));
    add('relic', 'relicTrio', '朝聖者', '一局內三種遺跡都用過', 40, () => Object.keys(RELIC_TYPES).every(k => gameState.run.relics[k]));
    for (const d of DAILY_MUTATIONS) add('daily', `daily_${d.id}`, d.name, `在「${d.name}」撐過第 ${ACHV_DAILY_WAVE} 波`, 30, () => gameState.daily === d.id && getSurvivedWaves() >= ACHV_DAILY_WAVE);
    add('daily', 'dailyWeek', '一週不缺席', `在 ${ACHV_DAILY_DAYS} 個不同的日子玩每日變異`, 60, () => Object.keys(S().dailyDays).length >= ACHV_DAILY_DAYS);
    for (const [id, name, desc, r, t] of ACHV_CAREER) add('career', id, name, desc, r, () => t(S()));
    add('challenge', 'noNova', '不靠新星', '一次新星都不放，通關', 100, () => necro() && gameState.endless && gameState.run.novas === 0);
    add('challenge', 'onlySkel', '純骨之軍', '只召喚骷髏，通關', 80, () => wonOnlyWith('SkeletonWarrior'));
    add('challenge', 'onlyEye', '千目之主', '只召喚眼魔，通關', 80, () => wonOnlyWith('EyeMonster'));
    add('challenge', 'onlyWraith', '怨魂之王', '只召喚怨靈，通關', 120, () => wonOnlyWith('Wraith'));
    add('challenge', 'noUpgrade', '人海戰術', '一次都不升級，撐過第 30 波', 80, () => getSurvivedWaves() >= 30 && gameState.run.upgrades === 0);
    add('challenge', 'ascetic', '苦行者', '一張祝福都不拿，撐過第 30 波', 100, () => getSurvivedWaves() >= 30 && gameState.run.picks === 0);
    add('challenge', 'flawless', '完美防禦', `撐過第 ${ACHV_FLAWLESS_WAVE} 波，一下都沒被打中`, 80, () => getSurvivedWaves() >= ACHV_FLAWLESS_WAVE && gameState.run.hits === 0);
    add('challenge', 'steady', '從容', `通關，血量從沒低於 ${pct(ACHV_STEADY)}`, 80, () => gameState.endless && gameState.run.minHp >= ACHV_STEADY);
    add('challenge', 'lastStand', '背水一戰', `血量低於 ${pct(ACHV_LAST_STAND)} 時撐完那一波`, 40, () => !!gameState.run.flags.lastStand);
    add('challenge', 'massacre', '屠城', `一波內打倒 ${ACHV_MASSACRE} 隻怪`, 40, () => gameState.run.maxWaveKills >= ACHV_MASSACRE);
    add('challenge', 'novaBlast', '星爆', `一次新星打倒 ${ACHV_NOVA_BLAST} 隻怪`, 40, () => necro() && gameState.run.novaBest >= ACHV_NOVA_BLAST);
    add('challenge', 'speedClear', '秒殺', `第 ${ACHV_SPEED_WAVE} 波以後，${ACHV_SPEED_SECONDS} 秒內清完一波`, 40, () => !!gameState.run.flags.speedClear);
    add('challenge', 'wealthy', '守財奴', `手上同時有 ${formatNumberK(ACHV_WEALTH)} 靈魂`, 30, () => gameState.souls >= ACHV_WEALTH);
    add('challenge', 'thiefChase', '追財', `一局打倒 ${ACHV_THIEVES} 隻金魂竊賊`, 40, () => gameState.run.thieves >= ACHV_THIEVES);
    // 職業：亡靈法師以外的每個職業一組——通關、三檔速通、五個流派各疊滿、再加職業自己定義的 feats
    for (const [cid, c] of Object.entries(CLASSES)) {
        if (!c.achv) continue;
        const mine = () => runClass() === cid, A = c.achv;
        add('class', `${cid}_win`, A.win, `以${c.name}通關`, ACHV_CLASS_WIN, () => mine() && gameState.endless, null, cid);
        ACHV_SPEED.forEach(([min, , , r], i) => add('class', `${cid}_speed${min}`, A.speed[i], `以${c.name}在 ${min} 分鐘內通關`, r,
            () => mine() && gameState.endless && gameState.run.clearTime > 0 && gameState.run.clearTime <= min * 60, null, cid));
        for (const s of c.schools) if (s !== 'soul') add('class', `${cid}_res_${s}`, SCHOOLS[s].res[1].name, `${c.name}的「${SCHOOLS[s].name}」疊到 ${RESONANCE_STEPS[1]} 層`, ACHV_CLASS_RES, () => mine() && res(s) >= 2, null, cid);
        for (const [id, name, desc, r, test] of A.feats) add('class', `${cid}_${id}`, name, desc, r, () => mine() && test(), null, cid);
    }
    add('legacy', 'metaFirst', '傳承之始', '買下第一個永久強化', 10, () => Object.values(meta.upgrades).some(v => v > 0));
    add('legacy', 'metaMax', '登峰造極', '任一永久強化升滿', 30, () => Object.keys(META_UPGRADES).some(id => metaLv(id) >= META_UPGRADES[id].max));
    add('legacy', 'metaAll', '大圓滿', '全部永久強化升滿', 150, () => Object.keys(META_UPGRADES).every(id => metaLv(id) >= META_UPGRADES[id].max));
    return L;
}
const ACHV_CLASS_WIN = 80, ACHV_CLASS_RES = 40;
const ACHV_CHECK_EVERY = 0.5;
const ACHV_TOAST_MS = 2600;
let achvCheckTimer = 0;
const achvToastQueue = [];
let achvToastBusy = false;
function achvDone(id) { return !!meta.achv[id]; }
// anywhere：傳承類在標題畫面買強化時也要能達成；其他只在遊戲中檢查（標題背景也是一局 gameState）
function checkAchievements(anywhere = false) {
    if (!anywhere && (appScreen !== 'playing' || !gameState.player)) return;
    for (const a of achievements()) {
        if (achvDone(a.id) || (anywhere && a.cat !== 'legacy') || !a.test()) continue;
        meta.achv[a.id] = true;
        meta.crystals += a.reward;
        if (!anywhere) { gameState.achvCrystals += a.reward; gameState.achvCount++; }
        saveMeta();
        achvToastQueue.push(a);
        if (!achvToastBusy) showNextAchvToast();
    }
}
// 成就圖示：圖鑑用那隻怪的立繪（跟場上一樣染色），其他用 achievement-icons.js 裡各自的向量圖
const ACHV_PORTRAIT_PX = 64;
const achvPortraitCache = {};
function achvIconHtml(a) {
    if (!a.look) return `<span class="icon achv-icon">${ACHV_ICON_SVGS[a.id] || ''}</span>`;
    if (!achvPortraitCache[a.id]) {
        const look = monsterLook(a.look), img = images[look.imageName];
        if (!img) return '<span class="icon achv-icon"></span>';
        const k = ACHV_PORTRAIT_PX / Math.max(img.width, img.height);
        achvPortraitCache[a.id] = getSprite(img, img.width * k / SPRITE_RES, img.height * k / SPRITE_RES, look.tint, look.tintStrength || 0.45).toDataURL();
    }
    return `<span class="icon achv-icon"><img src="${achvPortraitCache[a.id]}" alt=""></span>`;
}
function showNextAchvToast() {
    const a = achvToastQueue.shift();
    const el = uiElements.achvToast;
    if (!a) { achvToastBusy = false; el.classList.remove('show'); return; }
    achvToastBusy = true;
    el.innerHTML = `${achvIconHtml(a)}<div class="achv-toast-text"><b>${a.name}</b><span>${a.desc}</span></div><span class="crystal-count">${iconHtml('crystal')}+${a.reward}</span>`;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    Sfx.play('comboMilestone');
    setTimeout(showNextAchvToast, ACHV_TOAST_MS);
}
let achvTab = ACHV_CATEGORIES[0].id;
let achvClassTab = null;
function renderAchievements() {
    const all = achievements();
    const done = all.filter(a => achvDone(a.id)).length;
    uiElements.achvCount.textContent = `${done}/${all.length}`;
    uiElements.achvTabs.innerHTML = ACHV_CATEGORIES.map(c => {
        const list = all.filter(a => a.cat === c.id), n = list.filter(a => achvDone(a.id)).length;
        return `<button class="achv-tab${c.id === achvTab ? ' on' : ''}${n === list.length ? ' full' : ''}" data-tab="${c.id}">${c.name}<span>${n}/${list.length}</span></button>`;
    }).join('');
    // 職業分頁底下再分一排職業；第一次打開停在標題畫面選的那個職業
    const byClass = achvTab === 'class';
    const classIds = Object.keys(CLASSES).filter(id => all.some(a => a.cls === id));
    if (!classIds.includes(achvClassTab)) achvClassTab = classIds.includes(selectedClass()) ? selectedClass() : classIds[0];
    uiElements.achvSubtabs.classList.toggle('hidden', !byClass);
    if (byClass) uiElements.achvSubtabs.innerHTML = classIds.map(id => {
        const list = all.filter(a => a.cls === id), n = list.filter(a => achvDone(a.id)).length;
        return `<button class="achv-tab achv-subtab${id === achvClassTab ? ' on' : ''}${n === list.length ? ' full' : ''}" data-cls="${id}"><img src="${CLASSES[id].portrait}" alt=""><div>${CLASSES[id].name}<span>${n}/${list.length}</span></div></button>`;
    }).join('');
    uiElements.achvList.innerHTML = all.filter(a => a.cat === achvTab && (!byClass || a.cls === achvClassTab)).map(a => {
        const ok = achvDone(a.id);
        return `<div class="meta-row achv-row ${ok ? 'done' : ''}">${achvIconHtml(a)}<div class="meta-info"><div class="meta-name">${a.name}</div><div class="meta-desc">${a.desc}</div></div><span class="crystal-count">${iconHtml('crystal')}${a.reward}</span></div>`;
    }).join('');
}

// 召喚費用隨場上同種兵的數量變貴：每多 SUMMON_COST_STEP 隻，費用多一倍底價。
// 費用固定的話一局 5～10 萬靈魂能堆出兩三千隻兵，怪物再強也碰不到法師；變貴之後大軍停在幾百隻，
// 「多召喚」與「升級」要取捨，壓力也才漏得到法師身上
const SUMMON_COST_STEP = 25;
function getSummonCost(config) {
    const n = gameState.units[config.type].count;
    return Math.max(1, Math.round(config.summonCost * (1 + n / SUMMON_COST_STEP) * (1 - blessVal('pact')) * runMods().costMult));
}
function getMagnetRadius() {
    return CONFIG.player.magnetRadius * (1 + blessVal('magnet') + (res('soul') >= 1 ? RES_MAGNET : 0));
}
function getNovaCooldown() {
    return CONFIG.nova.cooldown * (1 - BLESSINGS.novaPower.cdPer * bl('novaPower')) * (1 - metaVal('novaMastery')) * (res('mage') >= 2 ? 1 - RES_NOVA_CD : 1) * runMods().novaCdMult;
}
function getNovaDamage() {
    return Math.round(CONFIG.nova.baseDamage * getWaveStatMultiplier(Math.max(1, gameState.currentWave)) * (1 + blessVal('novaPower')));
}

// ---------- 兵種與職業 ----------
// 兵種：底部卡片召喚／升級的單位。Cls 用函式包起來：類別宣告在後面
// 以下選填（職業檔裡用）：
//   upgradeOnly：這張卡只有「修練」，等級是主角自己的能力（武僧的拳、精靈的箭術）；upgradeLabel／summonLabel：按鈕上的字
//   cap()：這種兵自己的上限（德魯伊的野獸看林地）；capLabel：召不了時按鈕上的字（可以是函式）
//   canSummon()：現在能不能召（吸血鬼的轉化要身邊有怪）；summon(level)：自訂的召喚（付完費之後呼叫，要自己把 count 加上去）
const UNIT_TYPES = {
    SkeletonWarrior: { cfg: () => CONFIG.skeletonWarrior, Cls: () => SkeletonWarrior, name: '骷髏', img: 'skeleton_warrior.png' },
    Wraith: { cfg: () => CONFIG.wraith, Cls: () => Wraith, name: '怨靈', img: 'wraith.png' },
    EyeMonster: { cfg: () => CONFIG.eyeMonster, Cls: () => EyeMonster, name: '眼魔', img: 'eye_monster.png' },
};
// 職業：這一局的底部三張卡是哪三種兵、有哪幾個流派（祝福池跟著流派走）、主角的立繪與基本數值、普攻、大招。規劃見 docs/characters.md
//   hero：imageName（images 的鍵）、baseHealth、moveSpeed
//   attack(player, dt)：主角每格的普攻
//   ultimate：右下大招按鈕。use() 成功回傳 true；cooldown() 是滿的冷卻秒數；hint 是第一次教玩家時的那句話，
//             hintRadius() 內有好幾隻怪時才教（這時候按下去最有感）
// 以下選填（其他職業在自己的檔案裡定義，例如 warrior.js）：
//   name／title／portrait／tagline：標題畫面選職業時顯示；unlock：解鎖它的成就 id（沒有就是一開始就能玩）
//   troopCap()：底部三種兵加起來的人數上限
//   update(dt)：每格在主角與召喚物之前跑一次；reset()：開新局、讀檔時清掉職業自己的狀態
//   heroSpeedMult()／heroDamageTakenMult()：主角移速、受到的傷害倍率；onHeroHurt(lostFrac)：主角掉了幾成血
//   drawHero(ctx, player)：畫在主角血條之後（怒氣條之類）
//   saveExtra()／loadExtra(data)：存檔時多存、讀檔重建召喚物後還原的東西
//   onRunStart()：開新局（不是讀檔）時跑一次，例如開局就帶的兵
//   blockBolt(bolt)：射向主角的血彈飛行途中每格問一次，回傳 true 就被擋下（戰士的盾兵）
//   onUpgrade(type)：底部卡片升級成功之後；upgradeCostMult()：升級費用倍率
//   onWaveStart()／onWaveEnd()：每一波開始時、清完時
//   onBossKill(boss)：打倒首領時；onRelic(relic)：遺跡讀條完成時，回傳 true 就取代預設效果
//   canAfford(cost)／pay(cost)：用什麼付召喚與升級（吸血鬼可以拿自己的血付）；onOrbCollect(value)：撿到靈魂時，回傳要存進錢包的量
//   soulMult(monster)：這隻怪掉的靈魂倍率；onMonsterKill(monster)：怪死掉時
//   heroHidden()：主角這一格怪看不到（刺客隱身）
//   targetableSummons()：怪找目標時看得到的召喚物（沒有就是全部）；德魯伊離得太遠的橡樹會沉睡、怪不理
//   drawWorld(ctx)：世界座標、畫在特效之後；drawScreen(ctx)：螢幕座標、畫在介面之前
//   currency：{ icon, glow: [r, g, b] }，錢包與掉落物長什麼樣（吸血鬼是血）；沒有就是靈魂
//   onSpring(relic, dt)：站在靈泉裡時取代回血（吸血鬼的聖水會燙）
//   preventDeath()：主角血量歸零時問一次，回傳 true 就不死（職業自己把血補回來）
//   relicChannelMult()：站在遺跡上讀條的速度倍率（刺客隱身時快三倍）
//   relicDist：[最近, 最遠]，遺跡離主角多遠冒出來（德魯伊守林地，冒在林地裡）
//   buffs()：[{ icon, t, color }]，職業自己的限時效果，跟狂暴一起排在狀態列底下顯示倒數
const CLASSES = {
    necro: {
        name: '亡靈法師', title: '亡靈法師', portrait: 'player.png', tagline: '召喚沒有上限的骷髏大軍',
        cards: ['SkeletonWarrior', 'Wraith', 'EyeMonster'], schools: ['skel', 'eye', 'wraith', 'mage', 'soul'],
        hero: { imageName: 'player', baseHealth: CONFIG.player.baseHealth, moveSpeed: CONFIG.player.baseMoveSpeed },
        attack: (p, dt) => p.shootBolt(dt),
        ultimate: { name: '新星', icon: 'burst', hint: '新星：炸開身邊的怪、大軍狂暴', hintRadius: () => CONFIG.nova.radius, cooldown: () => getNovaCooldown(), use: () => useNova() },
    },
};
const DEFAULT_CLASS = 'necro';
function runClass() { return gameState.classId || DEFAULT_CLASS; }
function classDef() { return CLASSES[runClass()]; }
function classUnlocked(id) { const c = CLASSES[id]; return !!c && (!c.unlock || !!meta.achv[c.unlock]); }
// 標題畫面選的職業（沒解鎖或不存在就退回亡靈法師）
function selectedClass() { return classUnlocked(meta.classSel) ? meta.classSel : DEFAULT_CLASS; }
// 底部三種兵加起來到上限了沒（有上限的職業才有）
function troopCapped() {
    const c = classDef();
    return !!c.troopCap && c.cards.reduce((n, t) => n + gameState.units[t].count, 0) >= c.troopCap();
}
// 這種兵現在召不了：總人數滿了、自己的上限滿了、或是職業說現在不行
function summonBlocked(type) {
    const U = UNIT_TYPES[type];
    return troopCapped() || (!!U.cap && gameState.units[type].count >= U.cap()) || (!!U.canSummon && !U.canSummon());
}
function canAfford(cost) {
    const c = classDef();
    return c.canAfford ? c.canAfford(cost) : gameState.souls >= cost;
}
function payCost(cost) {
    const c = classDef();
    if (c.pay) return c.pay(cost);
    if (gameState.souls < cost) return false;
    gameState.souls -= cost;
    return true;
}
// 換主角的立繪（德魯伊化身巨熊）：寬度照原本，高度照新圖比例
// 錢包的圖示（底部卡片的價格、上方的數字旁邊）
function currencyIcon() { return (classDef().currency && classDef().currency.icon) || 'soul'; }
function setHeroImage(p, name) {
    const img = images[name];
    if (!img || p.image === img) return;
    p.image = img;
    p.imageHeight = p.imageWidth * (img.naturalHeight / img.naturalWidth);
    p._spriteW = null;
    p._flashSprites = null;
}
// 每種兵在場上幾隻、幾級、下一級升級多少錢。所有兵種都有一格（祝福可能叫出不在卡片上的兵），新局歸零
function emptyUnits() {
    const u = {};
    for (const type in UNIT_TYPES) u[type] = { count: 0, level: 0, upgradeCost: UNIT_TYPES[type].cfg().upgradeCostBase };
    return u;
}

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
    units: emptyUnits(), classId: DEFAULT_CLASS,
    imagesLoaded: false,
    bgmVolume: meta.bgmVolume,
    musicStarted: false,
    totalSummons: emptySummonStats(),
    totalKills: emptyKillStats(),
    spawnQueue: [], spawnTimer: 0, banner: null,
    blessings: {}, pendingDraft: null, draftOpen: false, ultCooldown: 0, frenzyTimer: 0, extraDrafts: 0,
    waveEvent: null, lastEventWave: 0, streak: 0, streakTimer: 0, bestStreak: 0,
    hazards: [], enemyBolts: [], curse: 0, endless: false, victoryOpen: false,
    resonance: {}, banished: [], banishLeft: 0, rerollsLeft: 0,
    relics: [], relicTimer: 0, relicDrafts: 0, waveSouls: 0, lastWaveSouls: 0,
    bossKills: {}, achvCrystals: 0, achvCount: 0, run: emptyRunStats(), runTime: 0,
};

function emptySummonStats() { return Object.fromEntries(Object.keys(UNIT_TYPES).map(t => [t, 0])); }
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
// 數字鍵 1／2／3 對應底部第幾張卡（哪一種兵看職業）
const UNIT_HOTKEYS = { Digit1: 0, Digit2: 1, Digit3: 2 };

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
    blood_eye: 'blood_eye.png',
    gargoyle: 'gargoyle.png',
    soul_devourer: 'soul_devourer.png',
    tombstone: 'tombstone.png',
    boss_dragon: 'boss_dragon.png',
    relic_altar: 'relic_altar.png',
    relic_spring: 'relic_spring.png',
    relic_coffin: 'relic_coffin.png',
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
// 只放地面上的怪：骷髏找目標、橫掃用這個，飛行怪（石像鬼）近戰打不到
const groundMonsterGrid = new SpatialGrid(GRID_CELL);
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
    // 敵人射向法師：低沉下滑，跟法師自己高音上揚的靈魂彈分得開
    bloodShot: { gap: 0.15, fn: s => s.tone(420, 0.18, { type: 'sawtooth', vol: 0.07, slideTo: 160 }) },
    // 鬼魂般的「咻」：一段往上滑的柔和音加一點氣音
    mageBolt: { gap: 0.1, fn: s => { s.tone(420, 0.16, { type: 'sine', vol: 0.05, slideTo: 900 }); s.noise(0.1, { vol: 0.03, filterFreq: 2200 }); } },
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
        const config = CONFIG.player, H = classDef().hero;
        super(x, y, config.radius, config.color, H.imageName, config.imgScaleMultiplier);
        this.maxHealth = H.baseHealth;
        this.currentHealth = this.maxHealth;
        this.moveSpeed = H.moveSpeed;
        this.hpTrail = 1;
        this.absorbGlow = 0;
        this.boltT = 0;
        this.castGlow = 0;
    }
    // 法杖頂端（世界座標）：靈魂彈從這裡射出、施法時這裡閃光。圖朝右時杖在右手邊，朝左就鏡像
    staffTip() {
        return { x: this.pos.x + this.facingDirection * this.imageWidth * MAGE_STAFF_TIP_X, y: this.pos.y - this.imageHeight * MAGE_STAFF_TIP_Y };
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
        this.boltT = P.boltInterval / (res('mage') >= 1 ? RES_MAGE_RATE : 1);
        const dmg = P.boltDamage * getWaveStatMultiplier(Math.max(1, gameState.currentWave)) * (1 + blessVal('soulBlade')) * runMods().boltDmgMult;
        const tip = this.staffTip();
        const n = Math.min(shots, boltTargets.length);
        for (let i = 0; i < n; i++) {
            const pr = getProjectileFromPool();
            pr.init(tip.x, tip.y, boltTargets[i].m, P.bolt, dmg, null, 0, bl('soulfire') > 0);
            // 多發時扇形散開、一發時隨機偏一點，再由追蹤彎回目標：看起來是「放出去的魂」而不是直線射擊
            const spread = n > 1 ? (i / (n - 1) - 0.5) * SOUL_BOLT_FAN * 2 : randomInRange(-SOUL_BOLT_WOBBLE, SOUL_BOLT_WOBBLE);
            const c = Math.cos(spread), s = Math.sin(spread), d = pr.direction;
            pr.direction = { x: d.x * c - d.y * s, y: d.x * s + d.y * c };
            pr.homing = true;
            gameState.projectiles.push(pr);
        }
        this.castGlow = 1;
        spawnParticles(tip.x, tip.y, SOUL_BOLT_GLOW, 5, 70, 0.3, 2.5);
        Sfx.play('mageBolt');
    }
    update(deltaTime, moveVec) {
        if (!this.isAlive) return;
        this.tickFlash(deltaTime);
        const ratio = this.currentHealth / this.maxHealth;
        this.hpTrail = ratio > this.hpTrail ? ratio : Math.max(ratio, this.hpTrail - PLAYER_HP_TRAIL_SPEED * deltaTime);
        this.absorbGlow = Math.max(0, this.absorbGlow - ABSORB_GLOW_DECAY * deltaTime);
        const cls = classDef();
        this.moveSpeed = cls.hero.moveSpeed * (1 + blessVal('shadowStep')) * (cls.heroSpeedMult ? cls.heroSpeedMult() : 1);
        this.castGlow = Math.max(0, this.castGlow - CAST_GLOW_DECAY * deltaTime);
        const moveX = moveVec.x * this.moveSpeed * deltaTime;
        const moveY = moveVec.y * this.moveSpeed * deltaTime;
        this.pos.x += moveX;
        this.pos.y += moveY;

        this.updateFacingDirection(moveVec.x);
        classDef().attack(this, deltaTime);
    }
    // source：打這一下的怪（毒池則是丟毒的那隻），陣亡畫面要寫是誰殺的
    takeDamage(amount, source = null) {
        if (!this.isAlive) return;
        // 單一下傷害封頂：滿血不會被一下秒掉（後期精英腐屍一爆就超過法師血量），死亡要來自看得到的壓力
        const cls = classDef();
        if (cls.heroDamageTakenMult) amount *= cls.heroDamageTakenMult();
        const lost = Math.min(amount, this.maxHealth * PLAYER_MAX_HIT_RATIO, this.currentHealth);
        this.currentHealth -= lost;
        if (cls.onHeroHurt && lost > 0) cls.onHeroHurt(lost / this.maxHealth);
        this.currentHealth = Math.max(0, Math.round(this.currentHealth));
        const run = gameState.run;
        run.hits++;
        run.flags.waveHit = true;
        run.minHp = Math.min(run.minHp, this.currentHealth / this.maxHealth);
        this.hitFlash = CONFIG.visuals.hitFlashDuration;
        gameState.hurtFlash = CONFIG.visuals.hurtFlashDuration;
        addShake(4);
        Sfx.play('hurt');
        if (this.currentHealth <= 0 && !(cls.preventDeath && cls.preventDeath())) {
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
        // 施法瞬間杖頭亮一下
        if (this.isAlive && this.castGlow > 0) {
            const tip = this.staffTip(), g = CAST_GLOW_SIZE * (0.6 + 0.4 * this.castGlow);
            ctx.globalAlpha = this.castGlow;
            ctx.drawImage(getGlowSprite(SOUL_BOLT_GLOW), tip.x - g / 2, tip.y - g / 2, g, g);
            ctx.globalAlpha = 1;
        }
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
        const cls = classDef();
        if (cls.drawHero) cls.drawHero(ctx, this);
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
        const rm = runMods();
        this.attack = attack * rm.summonDmgMult;
        this.attackSpeed = this.config.attackSpeed * (type === 'EyeMonster' ? 1 + blessVal('frenzyEye') : 1)
            * (type === 'SkeletonWarrior' && res('skel') >= 1 ? 1 + RES_SKEL_ATK_SPEED : 1) * rm.summonAtkSpeedMult;
        this.moveSpeed = this.config.moveSpeed;

        if (this.config.type === 'EyeMonster') {
            this.attackRange = (this.config.attackRange + (this.level * this.config.attackRangeUpgrade)) * (1 + blessVal('eagleEye'));
        } else {
            this.attackRange = this.config.attackRange;
        }
        this.attackRangeSq = this.attackRange * this.attackRange;

        if (this.config.type === 'Wraith') {
            // 共鳴「冥域」乘在封頂之後：要靠專精怨靈流派才突破單隻光環的上限
            this.slowRadius = Math.min(this.config.slowRadiusMax, this.config.slowRadiusBase + (this.level * this.config.slowRadiusUpgrade)) * (res('wraith') >= 1 ? RES_WRAITH_RADIUS : 1);
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
        // 傳說「巨骨」召出來的巨人：算在數值裡，選別的祝福重算時才不會被洗掉
        if (this.giant) {
            this.maxHealth *= GIANT_STAT_MULT;
            this.attack *= GIANT_STAT_MULT;
            this.drawScale *= GIANT_SCALE_MULT;
        }

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

        if (this.attackCooldown > 0) { this.attackCooldown -= deltaTime * (gameState.frenzyTimer > 0 ? CONFIG.nova.frenzyAttackRate : 1); }

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

        const searchR = summonSearchRadius(this.config);
        if (this.target && (!this.target.isAlive || distanceSq(this.pos, this.target.pos) > searchR * searchR * 1.5)) {
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
        const grid = this.config.type === 'SkeletonWarrior' ? groundMonsterGrid : monsterGrid;
        return grid.nearestShared(this.pos, summonSearchRadius(this.config));
    }

    // 怨靈附近的骷髏移速加倍、眼魔攻速加倍
    applyWraithBuff() {
        this.buffedMoveSpeedMultiplier = 1.0;
        this.buffedAttackSpeedMultiplier = 1.0;
        this.auraDamageMult = 1;
        const type = this.config.type;
        if (type === 'Wraith') return;
        const buffed = wraithGrid.forEachInRadius(this.pos, gameState.wraithBuffRadius, w =>
            w.isAlive && distanceSq(this.pos, w.pos) <= w.buffRadiusSq);
        if (!buffed) return;
        this.auraDamageMult = 1 + blessVal('auraMight');
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

        const currentAttackDamage = Math.round(this.attack * this.auraDamageMult);

        const E = CONFIG.evolution;
        if (this.config.type === 'EyeMonster') {
            const targets = [this.target];
            const extra = blessVal('splitGaze') + (this.tier >= 2 ? E.eyeExtraShots : 0) + (res('eye') >= 2 ? 1 : 0);
            if (extra > 0) {
                const others = [];
                monsterGrid.forEachInRadius(this.pos, this.attackRange, m => {
                    if (m.isAlive && m !== this.target && distanceSq(this.pos, m.pos) <= this.attackRangeSq) others.push(m);
                });
                others.sort((a, b) => distanceSq(this.pos, a.pos) - distanceSq(this.pos, b.pos));
                for (let i = 0; i < extra; i++) targets.push(others[i] || this.target);
            }
            const bounces = (this.tier >= 1 ? E.eyeBounces : 0) + (bl('ricochet') ? BLESSINGS.ricochet.per : 0) + (res('eye') >= 1 ? 1 : 0);
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
                groundMonsterGrid.forEachInRadius(mainTarget.pos, CLEAVE_RADIUS, m => {
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
        const reviveChance = this.config.type !== 'SkeletonWarrior' ? 0
            : Math.max(this.tier >= 3 ? E.skelReviveChance : 0, res('skel') >= 2 ? RES_SKEL_REVIVE : 0);
        if (reviveChance > 0 && !this.revived && Math.random() < reviveChance) {
            this.revived = true;
            this.currentHealth = Math.round(this.maxHealth * E.skelReviveHealth);
            spawnParticles(this.pos.x, this.pos.y, '#EF9A9A', 10, 60, 0.5);
            return;
        }
        this.isAlive = false;
        onSummonDeath(this);
        spawnParticles(this.pos.x, this.pos.y, '#B0BEC5', 10, 70, 0.45);
        if (this.config.type === 'SkeletonWarrior' && bl('boneBurst')) boneBurst(this);
        if (bl('deathPact') && Math.random() < BLESSINGS.deathPact.per) dropSouls(this.pos.x, this.pos.y, 1);
        switch (this.config.type) {
            case 'SkeletonWarrior': gameState.units.SkeletonWarrior.count--; break;
            case 'EyeMonster': gameState.units.EyeMonster.count--; break;
            case 'Wraith': break;
        }
        if (this.config.type !== 'Wraith') {
            updateUI();
        }
    }
}

// 這一波的怪出完、場上只剩最後幾隻時，整支大軍放大索敵範圍去追。
// 不然最後一隻停在所有召喚物的索敵範圍外（實測：墓地祭司隔著一隻怨靈站在法師 270 外，骷髏 150、眼魔 180、法師 150 都搆不到），波次永遠打不完
const STRAGGLER_MAX = 3;
// 要小於 SUMMON_TELEPORT_DIST：追出去的召喚物不能被當成「落後太遠」傳送回法師身邊
const STRAGGLER_SEARCH_RADIUS = 400;
function summonSearchRadius(config) {
    return gameState.straggling ? STRAGGLER_SEARCH_RADIUS : config.targetSearchRadius;
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
        // 共鳴「哀嚎」：不用等進化就脈衝，而且傷害加倍
        const wail = res('wraith') >= 2;
        if (!this.isAlive || (this.tier < 2 && !wail)) return;
        const E = CONFIG.evolution;
        this.pulseTimer = (this.pulseTimer ?? Math.random() * E.wraithPulseInterval) - deltaTime;
        if (this.pulseTimer > 0) return;
        this.pulseTimer = E.wraithPulseInterval;
        if (!monsterGrid.anyWithin(this.pos, this.slowRadius)) return;
        const dmg = Math.round(this.explosionDamage() * E.wraithPulseMult * (wail ? RES_WRAITH_PULSE_MULT : 1));
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
        gameState.units.Wraith.count--;
        onSummonDeath(this);
        if (Math.random() < blessVal('rebirth') && gameState.player && gameState.player.isAlive) {
            const pos = gameState.player.getSummonPosition();
            gameState.summons.push(new Wraith(pos.x, pos.y, gameState.units.Wraith.level, gameState.player));
            gameState.units.Wraith.count++;
            spawnParticles(pos.x, pos.y, '#4DB6AC', 14, 80, 0.6);
            spawnFloatText(pos.x, pos.y - 16, '輪迴', '#80CBC4', 13);
            Sfx.play('raise');
        }
        updateUI();
    }
}

// 飛彈飛這麼久還沒打中就消失（打空、目標先死了）。不能用「出了畫面多遠」判斷：最後幾隻怪落單時大軍會追到畫面外很遠
// （見 STRAGGLER_SEARCH_RADIUS），眼魔在那裡射的每一發都會在命中前被刪掉，波次永遠打不完（實測卡在離法師 650 的巫醫）
const PROJECTILE_MAX_AGE = 3;

class Projectile {
    constructor(startX, startY, target, shooterConfig, damage) {
        this.init(startX, startY, target, shooterConfig, damage);
    }

    init(startX, startY, target, shooterConfig, damage, owner = null, bounces = 0, blast = false) {
        this.homing = false;
        this.age = 0;
        this.trailT = 0;
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
        if (this.homing) this.steer(deltaTime);

        this.pos.x += this.direction.x * this.speed * deltaTime;
        this.pos.y += this.direction.y * this.speed * deltaTime;

        if (this.target && this.target.isAlive) {
            const distToTargetSq = distanceSq(this.pos, this.target.pos);
            const hitRadiusSq = (this.radius + this.target.radius) * (this.radius + this.target.radius);

            if (distToTargetSq <= hitRadiusSq) {
                const hit = this.target;
                const block = this.style === 'soul' ? 0 : projectileBlockAt(hit);
                if (block) spawnParticles(this.pos.x, this.pos.y, '#CFD8DC', 3, 50, 0.2, 2);
                else if (this.homing) soulBoltBurst(this.pos);
                else spawnParticles(this.pos.x, this.pos.y, this.color, BOLT_HIT_SPARKS, 60, 0.25, 2);
                const dealt = this.damage * (1 - block);
                hit.takeDamage(dealt);
                if (this.owner) this.owner.healFromDamage(dealt);
                if (this.owner && this.owner.onHit) this.owner.onHit(hit);
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

        if (this.age > PROJECTILE_MAX_AGE) this.isAlive = false;
    }

    // 魂火骷髏：轉向目標（每秒最多轉 SOUL_BOLT_TURN 弧度）、加速、沿路留鬼火殘影
    steer(deltaTime) {
        this.age += deltaTime;
        this.speed = Math.min(SOUL_BOLT_MAX_SPEED, this.speed + SOUL_BOLT_ACCEL * deltaTime);
        if (this.target && this.target.isAlive) {
            const want = Math.atan2(this.target.pos.y - this.pos.y, this.target.pos.x - this.pos.x);
            const cur = Math.atan2(this.direction.y, this.direction.x);
            let diff = want - cur;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            const turn = Math.sign(diff) * Math.min(Math.abs(diff), SOUL_BOLT_TURN * deltaTime);
            this.direction = { x: Math.cos(cur + turn), y: Math.sin(cur + turn) };
            this.targetPos.x = this.target.pos.x; this.targetPos.y = this.target.pos.y;
        }
        this.trailT -= deltaTime;
        if (this.trailT <= 0 && gameState.particles.length < CONFIG.visuals.maxParticles) {
            this.trailT = SOUL_BOLT_TRAIL_EVERY;
            spawnParticles(this.pos.x - this.direction.x * 6, this.pos.y - this.direction.y * 6, SOUL_BOLT_GLOW, 1, 15, 0.35, 3);
        }
    }

    explodeAt(hit) {
        const E = CONFIG.evolution;
        const rSq = E.eyeBlastRadius * E.eyeBlastRadius;
        // 法師的「魂火」與眼魔的爆裂魔眼共用同一套爆炸，只是倍率不同
        const dmg = Math.round(this.damage * (this.style === 'soul' ? BLESSINGS.soulfire.per : E.eyeBlastMult));
        monsterGrid.forEachInRadius(hit.pos, E.eyeBlastRadius, m => {
            if (m !== hit && m.isAlive && distanceSq(hit.pos, m.pos) <= rSq) m.takeDamage(this.style === 'soul' ? dmg : dmg * (1 - projectileBlockAt(m)));
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
        const scale = pr.homing ? SOUL_BOLT_TAIL_SCALE : 1;
        const w = sp.width / k * scale, h = sp.height / k * scale;
        // 圖的中心是整顆彗星的中心，在彈頭後方半條拖尾的位置
        const cx = pr.pos.x - dx * BOLT_TAIL_LEN * scale / 2, cy = pr.pos.y - dy * BOLT_TAIL_LEN * scale / 2;
        ctx.drawImage(sp, cx - w / 2, cy - h / 2, w, h);
        if (pr.homing) {
            // 彈頭是一顆不跟著轉的骷髏（頭上腳下），往左飛時鏡像
            const sk = getSoulSkullSprite(dx < 0);
            const s = SOUL_SKULL_SIZE;
            ctx.drawImage(sk, pr.pos.x - s / 2, pr.pos.y - s / 2, s, s);
        }
    }
}

// ---------- 法師的魂火骷髏 ----------
const SOUL_BOLT_GLOW = '#7FF0F0';
const SOUL_BOLT_FAN = 0.55;          // 多發時最外側偏多少弧度
const SOUL_BOLT_WOBBLE = 0.35;       // 單發時隨機偏多少弧度
const SOUL_BOLT_TURN = 7;            // 每秒最多轉幾弧度
const SOUL_BOLT_ACCEL = 520;
const SOUL_BOLT_MAX_SPEED = 420;
const SOUL_BOLT_TRAIL_EVERY = 0.03;
const SOUL_BOLT_TAIL_SCALE = 1.35;
const SOUL_SKULL_SIZE = 24;          // 世界單位
const SOUL_SKULL_PX = 72;            // 預先畫好的圖的像素
const SOUL_BURST_RADIUS = 20;
const SOUL_BURST_SPARKS = 10;
const SOUL_HIT_COLORS = { fill: '127, 240, 240', stroke: '224, 255, 255' };
const MAGE_STAFF_TIP_X = 0.3;        // × 圖寬，往面向那一側
const MAGE_STAFF_TIP_Y = 0.12;       // × 圖高，往上
const CAST_GLOW_DECAY = 6;
const CAST_GLOW_SIZE = 34;
const soulSkullSprites = [];
function getSoulSkullSprite(flipped) {
    const key = flipped ? 1 : 0;
    if (soulSkullSprites[key]) return soulSkullSprites[key];
    const P = SOUL_SKULL_PX, c = document.createElement('canvas');
    c.width = c.height = P;
    const g = c.getContext('2d');
    if (flipped) { g.translate(P, 0); g.scale(-1, 1); }
    g.drawImage(getGlowSprite(SOUL_BOLT_GLOW), 0, 0, P, P);
    const u = P / 72;
    g.lineWidth = 3 * u;
    g.strokeStyle = TEXT_OUTLINE;
    g.fillStyle = '#E0FFFF';
    // 頭蓋＋下顎（面朝右：臉偏右邊）
    g.beginPath();
    g.moveTo(22 * u, 40 * u);
    g.bezierCurveTo(14 * u, 22 * u, 26 * u, 12 * u, 38 * u, 13 * u);
    g.bezierCurveTo(52 * u, 14 * u, 58 * u, 26 * u, 54 * u, 38 * u);
    g.lineTo(54 * u, 46 * u);
    g.lineTo(46 * u, 50 * u);
    g.lineTo(46 * u, 56 * u);
    g.lineTo(32 * u, 56 * u);
    g.lineTo(31 * u, 50 * u);
    g.closePath();
    g.fill(); g.stroke();
    // 發光的眼窩與鼻孔
    g.fillStyle = '#00838F';
    g.beginPath(); g.ellipse(36 * u, 34 * u, 5 * u, 6 * u, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(48 * u, 34 * u, 4 * u, 5.5 * u, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#7FF0F0';
    g.beginPath(); g.arc(37 * u, 34 * u, 2 * u, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(48.5 * u, 34 * u, 1.8 * u, 0, Math.PI * 2); g.fill();
    g.fillStyle = TEXT_OUTLINE;
    g.beginPath(); g.moveTo(43 * u, 40 * u); g.lineTo(41 * u, 45 * u); g.lineTo(45 * u, 45 * u); g.closePath(); g.fill();
    // 牙縫
    g.lineWidth = 2 * u;
    g.beginPath(); g.moveTo(37 * u, 50 * u); g.lineTo(37 * u, 56 * u); g.moveTo(42 * u, 50 * u); g.lineTo(42 * u, 56 * u); g.stroke();
    soulSkullSprites[key] = c;
    return c;
}
// 命中：一圈青色波紋＋往外噴的碎光
function soulBoltBurst(pos) {
    spawnParticles(pos.x, pos.y, SOUL_BOLT_GLOW, SOUL_BURST_SPARKS, 110, 0.35, 2.5);
    if (gameState.visualEffects.length < MAX_AMBIENT_EFFECTS) gameState.visualEffects.push(new NovaEffect(pos, SOUL_BURST_RADIUS, SOUL_HIT_COLORS));
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
    blood: { glowIn: 'rgba(255, 138, 128, 0.95)', glowMid: 'rgba(213, 0, 0, 0.45)', glowOut: 'rgba(213, 0, 0, 0)', body: '#D50000', core: '#FFCDD2' },
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

// 主角的範圍揮砍（戰士的大劍、德魯伊化身後的熊掌）：一道弧光從內往外掃
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
        if (!this.isAlive) return;   // 被吞魂者吃掉的那一格還在陣列裡，不能再被撿
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
                const cls = classDef();
                gameState.souls += cls.onOrbCollect ? cls.onOrbCollect(this.value) : this.value;
                if (this.value >= c.floatTextMinValue) spawnFloatText(player.pos.x, player.pos.y - 20, `+${this.value}`, '#80DEEA');
                updateUI();
            }
            player.absorbGlow = Math.min(1.5, player.absorbGlow + ABSORB_GLOW_PER_ORB);
            if (bl('soulSiphon') && player.currentHealth < player.maxHealth) {
                player.currentHealth = Math.min(player.maxHealth, player.currentHealth + BLESSINGS.soulSiphon.per);
            }
            Sfx.play('orb');
        }
    }
    draw(ctx) {
        if (!orbSprite || orbSpriteFor !== currencyIcon()) buildOrbSprites();
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
let orbSprite = null, orbGlowSprite = null, orbSpriteFor = null;
const SOUL_ORB_GLOW = [77, 208, 225];
function buildOrbSprites() {
    orbSpriteFor = currencyIcon();
    const icon = getIconImage(orbSpriteFor);
    const [cr, cg, cb] = (classDef().currency && classDef().currency.glow) || SOUL_ORB_GLOW;
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
    grad.addColorStop(0, `rgba(${Math.min(255, cr + 50)}, ${Math.min(255, cg + 14)}, ${Math.min(255, cb + 9)}, 0.9)`);
    grad.addColorStop(0.4, `rgba(${cr}, ${cg}, ${cb}, 0.35)`);
    grad.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
    gg.fillStyle = grad;
    gg.fillRect(0, 0, ORB_SPRITE_PX, ORB_SPRITE_PX);
}

function dropSouls(x, y, amount) {
    if (amount <= 0) return;
    gameState.waveSouls += amount;
    stats().souls += amount;
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
        if (!o.banked) { const cls = classDef(); gameState.souls += cls.onOrbCollect ? cls.onOrbCollect(o.value) : o.value; o.banked = true; }
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
        const cm = runMods();
        this.maxHealth = Math.round(this.maxHealth * cm.hpMult);
        this.attack *= cm.atkMult;
        this.baseMoveSpeed *= cm.speedMult;
        this.moveSpeed = this.baseMoveSpeed;
        this.currentHealth = this.maxHealth;
    }

    soulValue() {
        if (this.noSouls) return 0;
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
        if (this.tauntT > 0) this.tauntT -= deltaTime;
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
        // 被嘲諷（戰士的重盾兵）：這段時間只打那一隻
        if (this.tauntT > 0 && this.tauntBy && this.tauntBy.isAlive) { this.target = this.tauntBy; return; }
        let closestTarget = null;
        let minDistanceSq = Infinity;

        if (player.isAlive && !heroHiddenNow) {
            minDistanceSq = distanceSq(this.pos, player.pos);
            closestTarget = player;
        }
        // 只需要找比法師近的召喚物：搜尋半徑就是到法師的距離（沒有上限的話，離大軍很遠的怪要一圈圈查上千格）
        const nearestSummon = summonCoarseGrid.nearest(this.pos, Math.min(Math.sqrt(minDistanceSq), MONSTER_SEEK_MAX));
        if (this.target === player && heroHiddenNow) this.target = null;
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
        const st = stats(), type = this.config.type;
        st.kills[type] = (st.kills[type] || 0) + 1;
        st.totalKills++;
        if (this.isElite) st.elites++;
        gameState.run.waveKills++;
        gameState.run.maxWaveKills = Math.max(gameState.run.maxWaveKills, gameState.run.waveKills);
        if (type === 'Thief') gameState.run.thieves++;
        const ev = getWaveEvent();
        const cls = classDef();
        if (cls.onMonsterKill) cls.onMonsterKill(this);
        const souls = this.soulValue() * (cls.soulMult ? cls.soulMult(this) : 1) * (1 + blessVal('soulHarvest') + (res('soul') >= 2 ? RES_SOULS : 0)) * (1 + metaVal('soulAffinity')) * (ev && ev.soulMult ? ev.soulMult : 1) * (1 + getStreakBonus()) * runMods().soulMult
            + gameState.soulCarry;
        const whole = Math.floor(souls);
        gameState.soulCarry = souls - whole;
        dropSouls(this.pos.x, this.pos.y, whole);
        // 傳說「點金」：偶爾整隻變成金子
        if (bl('midas') && Math.random() < BLESSINGS.midas.per) {
            dropSouls(this.pos.x, this.pos.y, Math.max(1, whole) * (MIDAS_MULT - 1));
            spawnParticles(this.pos.x, this.pos.y, '#FFD54F', 14, 110, 0.6, 3);
        }
        if (!(this instanceof BossMonster) && Math.random() < blessVal('raiseDead') && gameState.player) {
            gameState.summons.push(new SkeletonWarrior(this.pos.x, this.pos.y, gameState.units.SkeletonWarrior.level, gameState.player));
            gameState.units.SkeletonWarrior.count++;
            gameState.totalSummons.SkeletonWarrior++;
            spawnParticles(this.pos.x, this.pos.y, '#B39DDB', 14, 90, 0.6);
            spawnFloatText(this.pos.x, this.pos.y - 16, '復甦', '#B39DDB', 13);
            Sfx.play('raise');
        }
        spawnParticles(this.pos.x, this.pos.y, '#CE93D8', 8, 60, 0.6);
        if (this.isElite) {
            spawnParticles(this.pos.x, this.pos.y, '#FFD54F', 16, 120, 0.7, 3);
            spawnFloatText(this.pos.x, this.pos.y - 18, '精英擊破', '#FFD54F', 13);
            // 傳說「精英獵手」：新星馬上又能放
            if (bl('eliteHunter') && gameState.ultCooldown > 0) {
                gameState.ultCooldown = 0;
                if (gameState.player) spawnParticles(gameState.player.pos.x, gameState.player.pos.y, '#CE93D8', 16, 90, 0.5, 3);
            }
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
        this.maxHealth = this.currentHealth = Math.round(this.maxHealth * runMods().bossHpMult);
        this.spawnedAt = worldTime;
    }
    applySlow(amount, duration) {
        super.applySlow(amount * (1 - this.config.slowResist), duration);
    }
    drawHealthBar() { }
    die() {
        super.die();
        gameState.bossKills[this.constructor.name] = true;
        stats().bosses++;
        if (classDef().onBossKill) classDef().onBossKill(this);
        if (gameState.currentWave >= ACHV_BOSS_CHALLENGE_WAVE && worldTime - this.spawnedAt <= ACHV_BLITZ_SECONDS) gameState.run.flags.bossBlitz = true;
        spawnParticles(this.pos.x, this.pos.y, '#E1BEE7', 50, 220, 1.0, 4);
        spawnFloatText(this.pos.x, this.pos.y - 30, '首領擊破！', '#E1BEE7', 20, 1.6);
        spawnFloatText(this.pos.x, this.pos.y - 8, `+${CRYSTALS_PER_BOSS}`, '#CE93D8', 17, 1.6, 'crystal');
        gameState.rerollsLeft += REROLLS_PER_BOSS;
        spawnFloatText(this.pos.x, this.pos.y + 14, `+${REROLLS_PER_BOSS}`, '#90CAF9', 17, 1.6, 'reroll');
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

const DRAGON_FIRE = '#76FF03';
const DRAGON_SHADOW = 'rgba(0, 0, 0, 0.35)';
class DragonBoss extends BossMonster {
    constructor(x, y, waveNumber) {
        super(x, y, waveNumber, CONFIG.dragonBoss);
        const c = this.config;
        this.breathT = c.breathInterval * 0.6;
        this.flyT = c.flyInterval;
        this.windup = 0;
        this.breathDir = { x: 1, y: 0 };
        this.flight = 0;
        this.from = null; this.land = null;
        this.enraged = false;
    }
    // 飛在天上時誰都打不到、也不會被當成目標（格子不收潛行中的單位）
    get stealthed() { return this.flight > 0; }
    takeDamage(amount) {
        if (this.flight > 0) return;
        super.takeDamage(amount);
    }
    update(deltaTime, player, summons) {
        if (!this.isAlive) return;
        const c = this.config;
        if (!this.enraged && this.currentHealth < this.maxHealth * c.phase2Ratio) {
            this.enraged = true;
            spawnFloatText(this.pos.x, this.pos.y - 40, '狂怒', '#CCFF90', 20, 1.4);
            spawnParticles(this.pos.x, this.pos.y, DRAGON_FIRE, 30, 160, 0.7, 4);
            addShake(8);
            Sfx.play('boss');
        }
        const sp = this.enraged ? c.phase2Speed : 1;
        if (this.flight > 0) {
            this.tickFlash(deltaTime);   // 起飛前剛被打到的閃白要繼續退，不然整段飛行都是白色剪影
            this.flight -= deltaTime;
            const k = 1 - Math.max(0, this.flight) / c.flightTime;
            this.pos.x = this.from.x + (this.land.x - this.from.x) * k;
            this.pos.y = this.from.y + (this.land.y - this.from.y) * k;
            this.updateFacingDirection(this.land.x - this.from.x);
            if (this.flight <= 0) this.slamDown(player, summons);
            return;
        }
        if (this.windup > 0) {
            this.tickFlash(deltaTime);
            this.windup -= deltaTime;
            if (this.windup <= 0) this.breathe(player, summons);
            return;
        }
        this.breathT -= deltaTime * sp;
        this.flyT -= deltaTime * sp;
        if (this.flyT <= 0 && player.isAlive) {
            this.flyT = c.flyInterval;
            this.flight = c.flightTime;
            this.from = { x: this.pos.x, y: this.pos.y };
            this.land = { x: player.pos.x, y: player.pos.y };
            spawnParticles(this.pos.x, this.pos.y, '#B0BEC5', 20, 120, 0.5, 3);
            Sfx.play('dash');
            return;
        }
        if (this.breathT <= 0 && player.isAlive && distanceSq(this.pos, player.pos) < c.breathTriggerRange * c.breathTriggerRange) {
            this.breathT = c.breathInterval;
            this.windup = c.breathWindup;
            this.breathDir = normalizeVector({ x: player.pos.x - this.pos.x, y: player.pos.y - this.pos.y });
            this.updateFacingDirection(this.breathDir.x);
            return;
        }
        super.update(deltaTime, player, summons);
    }
    inBreath(pos) {
        const c = this.config;
        const dx = pos.x - this.pos.x, dy = pos.y - this.pos.y;
        const dSq = dx * dx + dy * dy;
        if (dSq > c.breathRange * c.breathRange) return false;
        const d = Math.sqrt(dSq) || 1;
        return (dx * this.breathDir.x + dy * this.breathDir.y) / d >= Math.cos(c.breathAngle / 2);
    }
    breathe(player, summons) {
        const c = this.config;
        const dmg = this.attack * c.breathDamageMult;
        summonGrid.forEachInRadius(this.pos, c.breathRange, s => { if (s.isAlive && this.inBreath(s.pos)) s.takeDamage(dmg); });
        if (player.isAlive && this.inBreath(player.pos)) player.takeDamage(player.maxHealth * c.breathPlayerHpRatio, this);
        const base = Math.atan2(this.breathDir.y, this.breathDir.x);
        for (let i = 0; i < 40; i++) {
            const a = base + (Math.random() - 0.5) * c.breathAngle, r = Math.random() * c.breathRange;
            spawnParticles(this.pos.x + Math.cos(a) * r, this.pos.y + Math.sin(a) * r, DRAGON_FIRE, 1, 40, 0.5, 4);
        }
        addShake(8);
        Sfx.play('nova');
    }
    slamDown(player, summons) {
        const c = this.config;
        const rSq = c.landRadius * c.landRadius;
        const dmg = this.attack * c.landDamageMult;
        summonGrid.forEachInRadius(this.pos, c.landRadius, s => { if (s.isAlive && distanceSq(this.pos, s.pos) <= rSq) s.takeDamage(dmg); });
        if (player.isAlive && distanceSq(this.pos, player.pos) <= rSq) player.takeDamage(player.maxHealth * c.landPlayerHpRatio, this);
        const effect = getVisualEffectFromPool(ExplosionEffect);
        if (effect) { effect.init(this.pos, c.landRadius); gameState.visualEffects.push(effect); }
        spawnParticles(this.pos.x, this.pos.y, '#BCAAA4', 34, 200, 0.6, 3);
        addShake(12);
        Sfx.play('slam');
    }
    draw(ctx) {
        if (!this.isAlive) return;
        const c = this.config;
        if (this.windup > 0) {
            // 扇形預警：外框先畫滿，裡面的紅色隨蓄力往外長
            const p = 1 - this.windup / c.breathWindup;
            const base = Math.atan2(this.breathDir.y, this.breathDir.x);
            ctx.save();
            ctx.fillStyle = `rgba(229, 57, 53, ${(0.12 + 0.2 * p).toFixed(2)})`;
            ctx.beginPath(); ctx.moveTo(this.pos.x, this.pos.y);
            ctx.arc(this.pos.x, this.pos.y, c.breathRange * p, base - c.breathAngle / 2, base + c.breathAngle / 2); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(255, 82, 82, 0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(this.pos.x, this.pos.y);
            ctx.arc(this.pos.x, this.pos.y, c.breathRange, base - c.breathAngle / 2, base + c.breathAngle / 2); ctx.closePath(); ctx.stroke();
            ctx.restore();
        }
        if (this.flight > 0) {
            // 落點紅圈越填越滿；影子在地上跟著移動，身體在空中劃一道弧
            const k = 1 - this.flight / c.flightTime;
            ctx.save();
            ctx.fillStyle = `rgba(229, 57, 53, ${(0.12 + 0.2 * k).toFixed(2)})`;
            ctx.beginPath(); ctx.arc(this.land.x, this.land.y, c.landRadius * k, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(255, 82, 82, 0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(this.land.x, this.land.y, c.landRadius, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = DRAGON_SHADOW;
            ctx.beginPath(); ctx.ellipse(this.pos.x, this.pos.y + this.imageHeight * 0.35, this.radius * 1.6, this.radius * 0.6, 0, 0, Math.PI * 2); ctx.fill();
            ctx.translate(0, -Math.sin(k * Math.PI) * c.flyHeight);
            super.draw(ctx);
            ctx.restore();
            return;
        }
        super.draw(ctx);
    }
}

// 首領輪替：第 10 / 20 / 30 / 40 波依序出場，無盡模式之後重複（等級隨波數提高）
const BOSS_ROTATION = [ColossusBoss, PlagueBoss, HunterBoss, DragonBoss];
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

const BOSS_CONFIG_OF = new Map([[ColossusBoss, () => CONFIG.boss], [PlagueBoss, () => CONFIG.plagueBoss], [HunterBoss, () => CONFIG.hunterBoss], [DragonBoss, () => CONFIG.dragonBoss], [LichBoss, () => CONFIG.lichBoss]]);

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

const BLOOD_EYE_GLOW = '#FF1744';
const BLOOD_EYE_GLOW_SCALE = 2.2;   // × 圖寬
const BLOOD_BOLT_DRAW_SCALE = 1.6;  // 比我方飛彈大一號：要躲的東西一眼就要看到
const BLOOD_BOLT_HIT_SPARKS = 16;
class BloodEyeMonster extends Monster {
    constructor(x, y, waveNumber, isElite) {
        super(x, y, CONFIG.bloodEye, waveNumber, isElite);
        this.windup = 0;
        // 剛出場別馬上射，錯開同一批出生的
        this.attackCooldown = randomInRange(0.5, 1.5) / this.attackSpeed;
    }
    findTarget(player) {
        this.target = player.isAlive ? player : null;
    }
    update(deltaTime, player, summons) {
        if (!this.isAlive) return;
        if (this.windup > 0) {
            this.tickFlash(deltaTime);
            this.windup -= deltaTime;
            const k = 1 - this.windup / this.config.windup;
            this.drawScale = 1 + 0.2 * Math.sin(k * Math.PI);
            if (this.windup <= 0) { this.drawScale = 1; this.fire(player); }
            return;
        }
        super.update(deltaTime, player, summons);
    }
    attackTarget() {
        this.windup = this.config.windup;
        this.attackCooldown = 1.0 / this.attackSpeed;
    }
    fire(player) {
        if (!player.isAlive) return;
        const dir = normalizeVector({ x: player.pos.x - this.pos.x, y: player.pos.y - this.pos.y });
        gameState.enemyBolts.push({ pos: { x: this.pos.x, y: this.pos.y }, dir, travel: 0, source: this });
        spawnParticles(this.pos.x, this.pos.y, BLOOD_EYE_GLOW, 6, 60, 0.3, 2.5);
        Sfx.play('bloodShot');
    }
    draw(ctx) {
        if (this.isAlive && this.windup > 0) {
            const k = 1 - this.windup / this.config.windup;
            const g = this.imageWidth * BLOOD_EYE_GLOW_SCALE;
            ctx.globalAlpha = 0.3 + 0.6 * k;
            ctx.drawImage(getGlowSprite(BLOOD_EYE_GLOW), this.pos.x - g / 2, this.pos.y - g / 2, g, g);
            ctx.globalAlpha = 1;
        }
        super.draw(ctx);
    }
}

function updateEnemyBolts(deltaTime) {
    const c = CONFIG.bloodEye;
    const p = gameState.player;
    const step = c.boltSpeed * deltaTime;
    const cls = classDef();
    for (const b of gameState.enemyBolts) {
        b.pos.x += b.dir.x * step;
        b.pos.y += b.dir.y * step;
        b.travel += step;
        if (cls.blockBolt && cls.blockBolt(b)) {
            b.travel = Infinity;
            spawnParticles(b.pos.x, b.pos.y, '#CFD8DC', BLOOD_BOLT_HIT_SPARKS / 2, 90, 0.3, 3);
            continue;
        }
        if (p && p.isAlive) {
            const hit = p.radius + c.boltRadius;
            if (distanceSq(b.pos, p.pos) <= hit * hit) {
                b.travel = Infinity;
                spawnParticles(b.pos.x, b.pos.y, BLOOD_EYE_GLOW, BLOOD_BOLT_HIT_SPARKS, 110, 0.35, 3);
                p.takeDamage(p.maxHealth * c.boltPlayerHpRatio, b.source);
            }
        }
    }
    gameState.enemyBolts = gameState.enemyBolts.filter(b => b.travel < c.boltRange);
}

function drawEnemyBolts() {
    const k = BOLT_SPRITE_PX_PER_UNIT;
    for (const b of gameState.enemyBolts) {
        if (!inView(b.pos)) continue;
        const idx = ((Math.round(Math.atan2(b.dir.y, b.dir.x) / (Math.PI * 2) * BOLT_DIRECTIONS) % BOLT_DIRECTIONS) + BOLT_DIRECTIONS) % BOLT_DIRECTIONS;
        const sp = getBoltDirSprite('blood', idx);
        const w = sp.width / k * BLOOD_BOLT_DRAW_SCALE, h = sp.height / k * BLOOD_BOLT_DRAW_SCALE;
        const tail = BOLT_TAIL_LEN / 2 * BLOOD_BOLT_DRAW_SCALE;
        ctx.drawImage(sp, b.pos.x - b.dir.x * tail - w / 2, b.pos.y - b.dir.y * tail - h / 2, w, h);
    }
}

const GARGOYLE_SHADOW = 'rgba(0, 0, 0, 0.28)';
class GargoyleMonster extends Monster {
    constructor(x, y, waveNumber, isElite) {
        super(x, y, CONFIG.gargoyle, waveNumber, isElite);
        this.flying = true;
        this.phase = Math.random() * Math.PI * 2;
    }
    // 先找附近的眼魔，沒有才照一般規則（法師或最近的召喚物）
    findTarget(player, summons) {
        const R = this.config.preySearchRadius;
        let best = null, bestSq = R * R;
        summonCoarseGrid.forEachInRadius(this.pos, R, s => {
            if (!s.isAlive || s.config.type !== 'EyeMonster') return;
            const d = distanceSq(this.pos, s.pos);
            if (d < bestSq) { bestSq = d; best = s; }
        });
        if (best) this.target = best;
        else super.findTarget(player, summons);
    }
    draw(ctx) {
        if (!this.isAlive) return;
        const c = this.config;
        // 地上的影子留在原位、身體浮在上面：一眼看得出「在天上」
        ctx.fillStyle = GARGOYLE_SHADOW;
        ctx.beginPath();
        ctx.ellipse(this.pos.x, this.pos.y + this.imageHeight * 0.35, this.radius * 1.1, this.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        const lift = c.hoverHeight + Math.sin(worldTime * c.hoverBobSpeed + this.phase) * c.hoverBob;
        ctx.save();
        ctx.translate(0, -lift);
        super.draw(ctx);
        ctx.restore();
    }
}

class SoulDevourerMonster extends Monster {
    constructor(x, y, waveNumber, isElite) {
        super(x, y, CONFIG.soulDevourer, waveNumber, isElite);
        this.eaten = 0;
        this.birthHealth = this.maxHealth;
        this.baseRadius = this.radius;
    }
    // 附近地上有還沒被吸走的靈魂就去吃，沒有才找人打；靈魂也有 pos / isAlive，直接當目標用
    findTarget(player, summons) {
        const R = this.config.orbSearchRadius;
        let best = null, bestSq = R * R;
        for (let i = 0; i < gameState.orbs.length; i++) {
            const o = gameState.orbs[i];
            if (!o.isAlive || o.attracted || o.inedible) continue;
            const d = distanceSq(this.pos, o.pos);
            if (d < bestSq) { bestSq = d; best = o; }
        }
        if (best) this.target = best;
        else super.findTarget(player, summons);
    }
    attackTarget() {
        const o = this.target;
        if (o instanceof SoulOrb) {
            if (o.isAlive && !o.attracted) this.eat(o);
            this.target = null;
            return;
        }
        super.attackTarget();
    }
    eat(o) {
        const c = this.config;
        o.isAlive = false;
        this.eaten += o.value;
        const gain = Math.round(this.birthHealth * c.hpPerSoul * o.value);
        this.maxHealth += gain;
        this.currentHealth += gain;
        this.drawScale = 1 + Math.min(c.maxGrow, this.eaten * c.growPerSoul);
        this.radius = this.baseRadius * this.drawScale;
        spawnParticles(o.pos.x, o.pos.y, '#80DEEA', 6, 50, 0.35, 2.5);
        Sfx.play('bloat');
    }
    // 吃掉的靈魂另外吐，不吃祝福／連殺加成，而且吐出來的別隻吞魂者不能吃：
    // 實測放任的話「死了吐 1.5 倍 → 隔壁那隻吃掉 → 死了再吐 1.5 倍」一路滾，一局吐出三到九萬靈魂（其他怪全部加起來約五萬）
    die() {
        super.die();
        const refund = Math.floor(this.eaten * this.config.refundMult);
        if (refund <= 0) return;
        const from = gameState.orbs.length;
        dropSouls(this.pos.x, this.pos.y, refund);
        for (let i = from; i < gameState.orbs.length; i++) gameState.orbs[i].inedible = true;
    }
}

const TOMBSTONE_LIFE_RING = 'rgba(165, 214, 167, 0.85)';
const TOMBSTONE_FIRE = '#69F0AE';
class TombstoneMonster extends Monster {
    constructor(x, y, waveNumber, isElite) {
        super(x, y, CONFIG.tombstone, waveNumber, isElite);
        this.life = this.config.lifetime;
        this.spawnT = this.config.spawnInterval * 0.5;
        this.spawned = [];
        this.phase = Math.random() * Math.PI * 2;
    }
    soulValue() {
        return (this.config.soulDrop + this.config.soulPerWave * this.waveNumber) * (this.isElite ? CONFIG.elite.soulMult : 1);
    }
    // 不會動、不攻擊：只冒怪、倒數
    update(deltaTime) {
        if (!this.isAlive) return;
        const c = this.config;
        this.tickFlash(deltaTime);
        this.life -= deltaTime;
        if (this.life <= 0) { this.crumble(); return; }
        this.spawnT -= deltaTime;
        if (this.spawnT > 0) return;
        this.spawnT = c.spawnInterval;
        this.spawned = this.spawned.filter(m => m.isAlive);
        const n = Math.min(c.spawnCount, c.maxSpawned - this.spawned.length);
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2;
            const m = new BasicMeleeMonster(this.pos.x + Math.cos(a) * 30, this.pos.y + Math.sin(a) * 30, this.waveNumber, false);
            m.noSouls = true;
            gameState.monsters.push(m);
            this.spawned.push(m);
            spawnParticles(m.pos.x, m.pos.y, TOMBSTONE_FIRE, 8, 60, 0.4, 2.5);
        }
        if (n > 0 && inView(this.pos)) Sfx.play('spawn');
    }
    // 時間到自己垮掉：不算擊殺、不掉靈魂
    crumble() {
        this.isAlive = false;
        spawnParticles(this.pos.x, this.pos.y, '#90A4AE', 22, 90, 0.6, 3);
        gameState.visualEffects.push(new DeathFadeEffect(this));
    }
    draw(ctx) {
        if (!this.isAlive) return;
        if (images.tombstone) super.draw(ctx);
        else { this.drawPlaceholder(ctx); this.drawHealthBar(ctx); }
        // 腳下一圈倒數：剩多少時間會自己垮掉
        const k = Math.max(0, this.life / this.config.lifetime);
        ctx.strokeStyle = TOMBSTONE_LIFE_RING;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(this.pos.x, this.pos.y + this.imageHeight * 0.4, this.radius * 1.6, this.radius * 0.6, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k);
        ctx.stroke();
    }
    drawPlaceholder(ctx) {
        const w = this.radius * 2, h = this.radius * 2.6;
        const x = this.pos.x - w / 2, y = this.pos.y - h * 0.6;
        ctx.fillStyle = this.hitFlash > 0 ? '#ECEFF1' : '#546E7A';
        ctx.strokeStyle = TEXT_OUTLINE;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x, y + h);
        ctx.lineTo(x, y + w / 2);
        ctx.arc(this.pos.x, y + w / 2, w / 2, Math.PI, 0);
        ctx.lineTo(x + w, y + h);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = TOMBSTONE_FIRE;
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(worldTime * 6 + this.phase);
        ctx.fillRect(this.pos.x - 2, y + h * 0.25, 4, h * 0.45);
        ctx.fillRect(this.pos.x - w * 0.25, y + h * 0.38, w * 0.5, 4);
        ctx.globalAlpha = 1;
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
    // 腳下畫出盾陣範圍：圈裡的怪也擋飛彈
    draw(ctx) {
        if (this.isAlive) {
            ctx.fillStyle = SHIELD_WALL_FILL;
            ctx.strokeStyle = SHIELD_WALL_STROKE;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(this.pos.x, this.pos.y + this.imageHeight * 0.3, SHIELD_WALL_RADIUS, SHIELD_WALL_RADIUS * 0.55, 0, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
        }
        super.draw(ctx);
    }
}
// 骨盾衛兵的盾陣：身邊這麼大一圈的怪，飛彈類傷害一樣被擋（只擋自己的話，眼魔把旁邊清光就好，等於沒有天敵）
const SHIELD_WALL_RADIUS = 55;
const SHIELD_WALL_FILL = 'rgba(144, 164, 174, 0.12)';
const SHIELD_WALL_STROKE = 'rgba(176, 190, 197, 0.55)';
let shieldCheckFrame = -1, anyShieldGuard = false;
function projectileBlockAt(m) {
    if (m.config.projectileBlock) return m.config.projectileBlock;
    // 場上沒有盾衛時（大部分時間）直接略過，不用每一發都查格子
    if (shieldCheckFrame !== frameNo) {
        shieldCheckFrame = frameNo;
        anyShieldGuard = gameState.monsters.some(g => g.isAlive && g.config.projectileBlock);
    }
    if (!anyShieldGuard) return 0;
    let block = 0;
    const rSq = SHIELD_WALL_RADIUS * SHIELD_WALL_RADIUS;
    monsterGrid.forEachInRadius(m.pos, SHIELD_WALL_RADIUS, g => {
        if (g.isAlive && g.config.projectileBlock && distanceSq(g.pos, m.pos) <= rSq) block = g.config.projectileBlock;
    });
    return block;
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
// ---------- 戰場遺跡：開戰後在畫面外冒出一座祭壇／靈泉／寶棺，法師帶著大軍走過去站上去才生效 ----------
// 同類遊戲（PokéSurvivor 的力量祭壇、泉水、上鎖寶箱；PokeBonk 的神殿與寶球）都靠地圖物件讓走位有目的：
// 空地圖上移動只為了閃招和吸靈魂。大軍跟著法師走，「要把整支軍隊拉去哪裡打」本身就是一個決定
const RELIC_START_WAVE = 2;
// 遺跡不跟著波次走：在場上待 RELIC_LIFE 秒「戰鬥時間」（波與波之間不算），跨波也還在。
// 綁在波次上時一波常只剩十幾秒，走過去剛啟動就收掉了（實測每 5 座有 1 座是在那波剩不到 5 秒時才啟動）
const RELIC_LIFE = 40;
// 剩這麼多秒時倒數圈開始閃
const RELIC_BLINK_AT = 6;
// 第一座在第 RELIC_START_WAVE 波開戰後幾秒出現：避開開戰橫幅，也讓大軍先接上戰線，走過去才有「離開陣地」的代價
const RELIC_FIRST_DELAY_MIN = 4, RELIC_FIRST_DELAY_MAX = 9;
// 場上的遺跡都處理掉（拿了、崩了、散了）之後，再隔這麼久的戰鬥時間冒下一座
const RELIC_GAP_MIN = 24, RELIC_GAP_MAX = 38;
// 二選一：從這一波起，一部分遺跡成對冒在相反方向，走進其中一座、另一座就崩塌（要血還是要錢）
const RELIC_FORK_WAVE = 8;
const RELIC_FORK_CHANCE = 0.4;
// 成對的第二座偏離正對面最多這麼多弧度：不會永遠剛好在正後方
const RELIC_FORK_SPREAD = 0.5;
const RELIC_DIST_MIN = 260, RELIC_DIST_MAX = 360;
const RELIC_RADIUS = 42;
// 讀條中途離開：每秒退回這個比例（被怪逼走一下不會全部重來）
const RELIC_DRAIN_PER_SEC = 0.35;
const RELIC_HEAL_TEXT_EVERY = 0.6;
// 靈泉的權重 = 這個數 × 法師缺血比例：滿血時不出，越殘越容易出
const RELIC_SPRING_NEED_WEIGHT = 2.5;
// art／artW：立繪與畫出來的寬（世界單位，法師約 48），高照圖的比例
const RELIC_TYPES = {
    altar: { name: '戰鼓祭壇', hint: '站上去，大軍狂暴', icon: 'burst', art: 'relic_altar', artW: 62, color: '#E1BEE7', glow: '186, 104, 200', channel: 2, frenzy: 12, weight: 1 },
    // pool：一座泉總共回多少（× 法師血量上限），回完就乾
    spring: { name: '靈泉', hint: '站在裡面回血', icon: 'heart', art: 'relic_spring', artW: 72, color: '#A5D6A7', glow: '67, 160, 71', healPerSec: 0.15, pool: 0.6 },
    // 靈魂 = 上一波全部掉落的 soulShare 倍：跟著當下的經濟成長，不用另外調每一波的數字
    coffin: { name: '封印寶棺', hint: '站上去打開', icon: 'lock', art: 'relic_coffin', artW: 80, color: '#FFE082', glow: '255, 179, 0', channel: 3, soulShare: 0.5, soulMin: 20, draftChance: 0.35, weight: 1 },
};
// 物件的底邊落在範圍圈中心往下這麼多：看起來是「放在圈裡」，法師走進圈時站在物件前面
const RELIC_ART_BASE = 16;
// 喝乾的靈泉、還沒拿完的泉：立繪的不透明度從這個值（快乾了）到 1（滿的）
const RELIC_SPRING_DRY_ALPHA = 0.45;
function relicArtSize(T) {
    const img = images[T.art];
    if (!img) return null;
    return { img, w: T.artW, h: T.artW * img.height / img.width };
}

function scheduleRelic(wave) {
    if (wave === RELIC_START_WAVE) gameState.relicTimer = randomInRange(RELIC_FIRST_DELAY_MIN, RELIC_FIRST_DELAY_MAX);
}

function pickRelicKind(exclude) {
    const p = gameState.player;
    const w = {};
    for (const k in RELIC_TYPES) w[k] = RELIC_TYPES[k].weight || 0;
    w.spring = RELIC_SPRING_NEED_WEIGHT * (1 - p.currentHealth / p.maxHealth);
    if (exclude) w[exclude] = 0;
    let total = 0;
    for (const k in w) total += w[k];
    let r = Math.random() * total;
    for (const k in w) { r -= w[k]; if (r < 0) return k; }
    return exclude === 'coffin' ? 'altar' : 'coffin';
}

function placeRelic(kind, angle, pair) {
    const p = gameState.player, T = RELIC_TYPES[kind];
    const [dMin, dMax] = classDef().relicDist || [RELIC_DIST_MIN, RELIC_DIST_MAX];
    const d = randomInRange(dMin, dMax);
    gameState.relics.push({ kind, x: p.pos.x + Math.cos(angle) * d, y: p.pos.y + Math.sin(angle) * d, progress: 0, pool: T.pool || 0, healFrac: 0, healShown: 0, healTextTimer: 0, done: false, fade: 1, life: RELIC_LIFE, pair });
}

// 每種只在玩家第一次看到時用橫幅介紹；之後靠畫面邊緣的箭頭和地上的圖示就認得
function introduceRelic(key, text, sub, color, icon) {
    meta.relicSeen = meta.relicSeen || {};
    if (meta.relicSeen[key] || gameState.banner) return;
    gameState.banner = { text, sub, color, life: CONFIG.wave.bannerDuration * 1.5, icon };
    meta.relicSeen[key] = true;
    saveMeta();
}

function spawnRelic() {
    const p = gameState.player;
    if (!p || !p.isAlive) return;
    const a = Math.random() * Math.PI * 2;
    const kind = pickRelicKind();
    const fork = gameState.currentWave >= RELIC_FORK_WAVE && Math.random() < RELIC_FORK_CHANCE;
    const pair = fork ? Math.random() : 0;
    placeRelic(kind, a, pair);
    if (fork) {
        placeRelic(pickRelicKind(kind), a + Math.PI + randomInRange(-RELIC_FORK_SPREAD, RELIC_FORK_SPREAD), pair);
        introduceRelic('fork', '二選一', '走進一座，另一座就崩塌', '#FFE082', 'fork');
    }
    const T = RELIC_TYPES[kind];
    introduceRelic(kind, T.name, T.hint, T.color, T.icon);
    Sfx.play('spawn');
}

// 二選一：走進其中一座的那一刻，另一座崩塌
function breakRelicPartner(r) {
    for (const o of gameState.relics) {
        if (o === r || o.done || o.pair !== r.pair) continue;
        o.done = true;
        spawnParticles(o.x, o.y, '#9E9E9E', 24, 120, 0.6, 3);
        spawnFloatText(o.x, o.y - 30, '崩塌', '#BDBDBD', 14, 1);
    }
    r.pair = 0;
}

function expireRelic(r) {
    r.done = true;
    spawnParticles(r.x, r.y, RELIC_TYPES[r.kind].color, 12, 60, 0.5, 2);
    spawnFloatText(r.x, r.y - 30, '消散', '#BDBDBD', 13, 0.9);
}

function finishRelic(r) {
    const T = RELIC_TYPES[r.kind];
    const p = gameState.player;
    r.done = true;
    stats().relics[r.kind] = (stats().relics[r.kind] || 0) + 1;
    gameState.run.relics[r.kind] = true;
    spawnParticles(r.x, r.y, T.color, 30, 160, 0.7, 3);
    if (classDef().onRelic && classDef().onRelic(r)) return;
    if (r.kind === 'altar') {
        gameState.frenzyTimer = Math.max(gameState.frenzyTimer, T.frenzy);
        spawnFloatText(p.pos.x, p.pos.y - 34, '大軍狂暴！', '#E1BEE7', 18, 1.1, 'burst');
        const live = gameState.summons, step = Math.max(1, Math.floor(live.length / FRENZY_SPARK_SUMMONS));
        for (let i = 0; i < live.length; i += step) if (live[i].isAlive) spawnParticles(live[i].pos.x, live[i].pos.y, FRENZY_SPARK_COLOR, 3, 60, 0.5, 3);
        addShake(5);
        Sfx.play('nova');
    } else if (r.kind === 'coffin') {
        const souls = Math.max(T.soulMin, Math.round(gameState.lastWaveSouls * T.soulShare));
        dropSouls(r.x, r.y, souls);
        // 寶棺自己噴的不算進「這一波掉了多少」，不然下一座寶棺會越滾越大
        gameState.waveSouls -= souls;
        spawnFloatText(r.x, r.y - 30, `+${formatNumberK(souls)}`, '#80DEEA', 18, 1.3, 'soul');
        if (Math.random() < T.draftChance) {
            gameState.relicDrafts++;
            spawnFloatText(r.x, r.y - 52, '祝福 +1', '#FFD54F', 18, 1.6, 'star');
        }
        addShake(4);
        Sfx.play('pick');
    } else {
        spawnFloatText(r.x, r.y - 30, '乾涸', '#A5D6A7', 13, 0.9);
    }
}

function updateRelics(deltaTime) {
    const fighting = !gameState.betweenWaves;
    const hadLive = gameState.relics.some(r => !r.done);
    if (fighting && !hadLive && gameState.currentWave >= RELIC_START_WAVE && !isFinalWave(gameState.currentWave)) {
        gameState.relicTimer -= deltaTime;
        if (gameState.relicTimer <= 0) spawnRelic();
    }
    if (!gameState.relics.length) return;
    const p = gameState.player;
    const rSq = RELIC_RADIUS * RELIC_RADIUS;
    for (const r of gameState.relics) {
        if (r.done) { r.fade -= deltaTime * 2; continue; }
        if (fighting) {
            r.life -= deltaTime;
            if (r.life <= 0) { expireRelic(r); continue; }
        }
        const T = RELIC_TYPES[r.kind];
        const inside = p && p.isAlive && distanceSq(p.pos, r) <= rSq;
        if (inside && r.pair) breakRelicPartner(r);
        if (r.kind === 'spring') {
            r.healTextTimer -= deltaTime;
            if (inside && classDef().onSpring) classDef().onSpring(r, deltaTime);
            else if (inside && p.currentHealth < p.maxHealth) {
                r.healFrac += Math.min(p.maxHealth * T.healPerSec * deltaTime, r.pool * p.maxHealth);
                const whole = Math.min(Math.floor(r.healFrac), p.maxHealth - p.currentHealth);
                if (whole > 0) {
                    p.currentHealth += whole;
                    r.healFrac -= whole;
                    r.pool -= whole / p.maxHealth;
                    r.healShown += whole;
                }
                if (Math.random() < deltaTime * 8) spawnParticles(p.pos.x + randomInRange(-12, 12), p.pos.y + 6, T.color, 1, 30, 0.6, 3);
            }
            if (r.healShown > 0 && (r.healTextTimer <= 0 || !inside)) {
                spawnFloatText(p.pos.x, p.pos.y - 24, `+${r.healShown} HP`, '#81C784', 14, 0.9);
                r.healShown = 0;
                r.healTextTimer = RELIC_HEAL_TEXT_EVERY;
            }
            if (r.pool <= 0) finishRelic(r);
            continue;
        }
        const cls = classDef();
        r.progress = inside ? r.progress + deltaTime * (cls.relicChannelMult ? cls.relicChannelMult() : 1) / T.channel : Math.max(0, r.progress - deltaTime * RELIC_DRAIN_PER_SEC);
        if (r.progress >= 1) finishRelic(r);
    }
    gameState.relics = gameState.relics.filter(r => r.fade > 0);
    if (hadLive && !gameState.relics.some(r => !r.done)) gameState.relicTimer = randomInRange(RELIC_GAP_MIN, RELIC_GAP_MAX);
}

// 波次結束：遺跡留在場上（倒數停住，下一波接著算）；寶棺開出的祝福接在這一波的祝福後面
function settleRelicsAtWaveEnd() {
    if (gameState.relicDrafts <= 0) return;
    if (gameState.pendingDraft) gameState.extraDrafts += gameState.relicDrafts;
    else { queueDraft(); gameState.extraDrafts += gameState.relicDrafts - 1; }
    gameState.relicDrafts = 0;
}

// 地上那一圈（站上去的範圍）和物件本身：畫在召喚物底下，大軍走過去會擋在前面
function drawRelicsGround() {
    const t = worldTime;
    for (const r of gameState.relics) {
        if (!inView(r)) continue;
        const T = RELIC_TYPES[r.kind];
        const fill = 0.1 + 0.05 * Math.sin(t * 3);
        ctx.globalAlpha = Math.max(0, r.fade);
        ctx.fillStyle = `rgba(${T.glow}, ${fill.toFixed(2)})`;
        ctx.beginPath(); ctx.arc(r.x, r.y, RELIC_RADIUS, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = TEXT_OUTLINE;
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.strokeStyle = `rgba(${T.glow}, 0.35)`;
        ctx.lineWidth = 2;
        ctx.stroke();
        // 外圈就是倒數：剩多少時間就畫多長，快散掉時閃
        if (!r.done) {
            const left = Math.max(0, r.life / RELIC_LIFE);
            const blink = r.life < RELIC_BLINK_AT ? 0.45 + 0.55 * Math.abs(Math.sin(t * 6)) : 1;
            ctx.globalAlpha = Math.max(0, r.fade) * blink;
            ctx.strokeStyle = T.color;
            ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(r.x, r.y, RELIC_RADIUS, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left); ctx.stroke();
            ctx.globalAlpha = Math.max(0, r.fade);
        }
        // 慢慢轉的虛線內圈：一眼看得出是「可以站上去的地方」，不是怪的招式預警（預警是紅的、會填滿）
        ctx.save();
        ctx.translate(r.x, r.y);
        ctx.rotate(t * 0.6);
        ctx.setLineDash([7, 7]);
        ctx.strokeStyle = `rgba(${T.glow}, 0.8)`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, RELIC_RADIUS - 7, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        const art = relicArtSize(T);
        if (art) {
            const full = r.kind === 'spring' ? r.pool / T.pool : 1;
            ctx.globalAlpha = Math.max(0, r.fade) * (RELIC_SPRING_DRY_ALPHA + (1 - RELIC_SPRING_DRY_ALPHA) * full);
            ctx.drawImage(getSprite(art.img, art.w, art.h), r.x - art.w / 2, r.y + RELIC_ART_BASE - art.h, art.w, art.h);
        }
    }
    ctx.globalAlpha = 1;
}

// 浮在上面的圖示與讀條：畫在法師與召喚物之上、浮在物件頂上（至少高過法師的頭），站上去讀條時才看得到進度
const RELIC_BADGE_R = 15;
const RELIC_BADGE_LIFT = 58;
const RELIC_BADGE_GAP = 14;
function drawRelicsTop() {
    const t = worldTime;
    for (const r of gameState.relics) {
        if (!inView(r)) continue;
        const T = RELIC_TYPES[r.kind];
        const art = relicArtSize(T);
        const lift = Math.max(RELIC_BADGE_LIFT, art ? art.h - RELIC_ART_BASE + RELIC_BADGE_GAP : 0);
        const bx = r.x, by = r.y - lift - Math.sin(t * 2.5) * 3;
        ctx.globalAlpha = Math.max(0, r.fade);
        ctx.fillStyle = 'rgba(14, 10, 20, 0.85)';
        ctx.beginPath(); ctx.arc(bx, by, RELIC_BADGE_R, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(${T.glow}, 0.9)`;
        ctx.stroke();
        const k = r.kind === 'spring' ? r.pool / T.pool : r.progress;
        if (k > 0) {
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.strokeStyle = T.color;
            ctx.beginPath(); ctx.arc(bx, by, RELIC_BADGE_R + 3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke();
            ctx.lineCap = 'butt';
        }
        const icon = getIconImage(T.icon);
        if (icon) ctx.drawImage(icon, bx - 10, by - 10, 20, 20);
    }
    ctx.globalAlpha = 1;
}

// 進行中的限時效果：圖示＋倒數圈，排在狀態列底下左邊。效果在身上時一直看得到，不只開頭那一下飄字
const BUFF_CHIP_R = 15;
const BUFF_CHIP_GAP = 8;
const BUFF_CHIP_LEFT = 14;
const BUFF_CHIP_TOP = 26;
const FRENZY_CHIP_COLOR = '#E1BEE7';
// 每種效果的起始長度：計時器往上跳（又拿到一次）時重記，倒數圈才畫得出「剩幾成」
const buffPeak = {};
function activeBuffs() {
    const list = [];
    if (gameState.frenzyTimer > 0) list.push({ icon: 'burst', t: gameState.frenzyTimer, color: FRENZY_CHIP_COLOR });
    const cls = classDef();
    if (cls.buffs) list.push(...cls.buffs());
    return list;
}
function drawBuffChips() {
    if (appScreen !== 'playing' || !gameState.player) return;
    const list = activeBuffs();
    for (const k in buffPeak) if (!list.some(b => b.icon === k)) delete buffPeak[k];
    let x = BUFF_CHIP_LEFT + BUFF_CHIP_R;
    const y = hudTop + BUFF_CHIP_TOP;
    for (const b of list) {
        const peak = buffPeak[b.icon];
        if (!peak || b.t > peak.last + 0.01) buffPeak[b.icon] = { max: b.t, last: b.t };
        else peak.last = b.t;
        const k = b.t / buffPeak[b.icon].max;
        ctx.fillStyle = 'rgba(14, 10, 20, 0.85)';
        ctx.beginPath(); ctx.arc(x, y, BUFF_CHIP_R, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.stroke();
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.strokeStyle = b.color;
        ctx.beginPath(); ctx.arc(x, y, BUFF_CHIP_R + 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke();
        ctx.lineCap = 'butt';
        const icon = getIconImage(b.icon);
        if (icon) ctx.drawImage(icon, x - 10, y - 10, 20, 20);
        x += BUFF_CHIP_R * 2 + BUFF_CHIP_GAP;
    }
}

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
// ---------- 每日變異（同 PokeBonk 的 Daily Mutation）：每天一條特殊規則，當天第一場結算的結晶 ×DAILY_CRYSTAL_MULT ----------
// 照本地日期輪流，連續兩天不會重複；只有規則沒有排行榜，所以照樣吃永久強化，但不疊詛咒
const DAILY_MS = 86400000;
const DAILY_CRYSTAL_MULT = 2;
const DAILY_MUTATIONS = [
    { id: 'glass', icon: 'mut_glass', name: '玻璃之軀', mods: { mageHpMult: 0.25, summonDmgMult: 2, boltDmgMult: 2 } },
    { id: 'giants', icon: 'mut_giants', name: '巨獸橫行', mods: { hpMult: 2, atkMult: 1.5, speedMult: 0.85, soulMult: 1.6 } },
    { id: 'eyes', icon: 'mut_eyes', name: '千眼之日', rule: '只能召喚眼魔', onlyUnit: 'EyeMonster', mods: { summonDmgMult: 1.3 } },
    { id: 'bloodMoon', icon: 'mut_bloodMoon', name: '永夜血月', rule: '每一波都是血月' , forceEvent: 'bloodMoon' },
    { id: 'feast', icon: 'mut_feast', name: '靈魂盛宴', mods: { soulMult: 2, hpMult: 1.5, atkMult: 1.25 } },
    { id: 'bones', icon: 'mut_bones', name: '白骨之日', rule: '只能召喚骷髏', onlyUnit: 'SkeletonWarrior', mods: { summonAtkSpeedMult: 1.3 } },
    { id: 'market', icon: 'mut_market', name: '魔鬼市集', rule: '每次選祝福都有一張契約', pactAlways: true },
    { id: 'storm', icon: 'mut_storm', name: '新星風暴', mods: { novaCdMult: 0.4, speedMult: 1.25 } },
];
function localDayNumber() {
    const now = new Date();
    return Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / DAILY_MS);
}
function todayKey() { return String(localDayNumber()); }
function todayMutation() { return DAILY_MUTATIONS[localDayNumber() % DAILY_MUTATIONS.length]; }
function dailyDef() { return gameState.daily ? DAILY_MUTATIONS.find(d => d.id === gameState.daily) || null : null; }
// 規則的純文字（確認框、開戰橫幅）：特殊規則在前，乘數在後
function dailyRulesText(d) {
    return [d.rule, ...Object.keys(d.mods || {}).map(k => runModText(k, d.mods[k]))].filter(Boolean).join('、');
}
// 這一局是每日變異、而且那一天的加倍還沒領過
function dailyCrystalMult() {
    return gameState.daily && meta.dailyClaimed !== gameState.dailyDate ? DAILY_CRYSTAL_MULT : 1;
}
function unitAllowed(type) {
    const d = dailyDef();
    return !d || !d.onlyUnit || d.onlyUnit === type;
}

// 整局的乘數：詛咒、已立的契約、每日變異疊在一起（鍵見 RUN_MOD_LABELS）。
// 生怪、算靈魂每次都要查，所以快取在 gameState.runModsCache；詛咒、契約、每日變異變動時呼叫 invalidateRunMods()
function runMods() {
    return gameState.runModsCache || (gameState.runModsCache = computeRunMods());
}
function invalidateRunMods() { gameState.runModsCache = null; }
function computeRunMods() {
    const m = { assassinEarly: false };
    for (const k in RUN_MOD_LABELS) m[k] = 1;
    const apply = (src) => { for (const k in RUN_MOD_LABELS) if (src[k]) m[k] *= src[k]; };
    const lv = gameState.curse || 0;
    for (let i = 0; i < lv && i < CURSES.length; i++) {
        apply(CURSES[i]);
        if (CURSES[i].assassinEarly) m.assassinEarly = true;
    }
    for (const id in gameState.blessings) if (BLESSINGS[id] && BLESSINGS[id].pact && gameState.blessings[id] > 0) apply(BLESSINGS[id].mods);
    const d = dailyDef();
    if (d && d.mods) apply(d.mods);
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
    const d = dailyDef();
    if (d && d.forceEvent) return isBossWave ? null : d.forceEvent;
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
    const cm = runMods();
    // 第一輪前面沒有首領，不打「首領後喘息」的折扣（不然第 1、2 波只剩一半）
    const cycleFactor = W.cycleCountFactors[wave % W.bossEvery];
    const cycle = isBossWave ? W.bossWaveCountFactor : (wave < W.bossEvery ? Math.max(1, cycleFactor) : cycleFactor);
    const factor = cycle * (ev && ev.countMult ? ev.countMult : 1);
    const classes = [];
    const add = (Cls, n) => { for (let i = 0; i < n; i++) classes.push(Cls); };
    add(BasicMeleeMonster, Math.round((W.basicBase + wave * W.basicPerWave) * factor));
    [[CONFIG.fastMeleeMonster, FastMeleeMonster], [CONFIG.bloaterMonster, BloaterMonster], [CONFIG.armoredMeleeMonster, ArmoredMeleeMonster],
    [CONFIG.assassin, AssassinMonster], [CONFIG.spitter, SpitterMonster], [CONFIG.bloodEye, BloodEyeMonster],
    [CONFIG.gargoyle, GargoyleMonster], [CONFIG.soulDevourer, SoulDevourerMonster], [CONFIG.tombstone, TombstoneMonster], [CONFIG.slime, SlimeMonster], [CONFIG.bat, BatMonster],
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
    // 墓碑不當精英：分裂詞綴會裂成三座墓碑
    const queue = classes.map(Cls => ({ Cls, elite: Cls !== ThiefMonster && Cls !== TombstoneMonster && Math.random() < eliteChance }));
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
    const packMax = W.packMax + Math.floor(wave / W.packGrowEvery);
    const packSize = head.Cls.prototype instanceof BossMonster ? 1 : W.packMin + Math.floor(Math.random() * (packMax - W.packMin + 1));
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
    const assassinWave = runMods().assassinEarly ? ASSASSIN_EARLY_WAVE : CONFIG.assassin.minWave;
    // cfg：那隻怪的設定，名字與橫幅上的立繪都從那裡拿；精英詞綴不是一種怪，自己給名字、只用圖示
    const list = [
        { wave: assassinWave, cfg: CONFIG.assassin, hint: '腳下出現紅圈就快走開', icon: 'warning', color: '#EF9A9A' },
        { wave: CONFIG.bloodEye.minWave, cfg: CONFIG.bloodEye, hint: '朝法師射血彈，走動就躲得掉', icon: 'warning', color: '#FF8A80' },
        { wave: CONFIG.soulDevourer.minWave, cfg: CONFIG.soulDevourer, hint: '會吃地上的靈魂變大，快撿或放新星吸走', icon: 'soul', color: '#80DEEA' },
        { wave: CONFIG.gargoyle.minWave, cfg: CONFIG.gargoyle, hint: '會飛，骷髏打不到，靠眼魔與法師', icon: 'claws', color: '#B0BEC5' },
        { wave: CONFIG.tombstone.minWave, cfg: CONFIG.tombstone, hint: '一直冒小怪，帶大軍去拆有大獎', icon: 'skull', color: '#A5D6A7' },
        { wave: CONFIG.slime.minWave, cfg: CONFIG.slime, hint: '打死會分裂', icon: 'plague', color: '#E6EE9C' },
        { wave: CONFIG.witchDoctor.minWave, cfg: CONFIG.witchDoctor, hint: '會幫怪物補血，先殺牠', icon: 'raiseDead', color: '#AED581' },
        { wave: CONFIG.bat.minWave, cfg: CONFIG.bat, hint: '直撲法師，邊走邊放新星', icon: 'claws', color: '#BCAAA4' },
        { wave: CONFIG.shieldGuard.minWave, cfg: CONFIG.shieldGuard, hint: '盾牌擋飛彈，靠骷髏近戰', icon: 'boneArmor', color: '#B0BEC5' },
        { wave: CONFIG.spitter.minWave, cfg: CONFIG.spitter, hint: '別站進綠色毒池', icon: 'plague', color: POISON_LIGHT },
        { wave: CONFIG.eliteAffix.startWave, name: '精英詞綴', hint: '綠光環繞的會分裂、冒火的會暴走', icon: 'crown', color: '#FFD54F' },
        { wave: CONFIG.corpseWorm.minWave, cfg: CONFIG.corpseWorm, hint: '會從地底鑽出，紅圈出現就走開', icon: 'warning', color: '#BCAAA4' },
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
    gameState.enemyBolts = [];
    gameState.projectiles.forEach(returnProjectileToPool);
    gameState.projectiles = [];
    gameState.visualEffects.forEach(returnVisualEffectToPool);
    gameState.visualEffects = [];

    const waveNum = gameState.currentWave;
    gameState.waveEvent = rollWaveEvent(waveNum);
    if (gameState.waveEvent) gameState.lastEventWave = waveNum;
    gameState.spawnQueue = buildWaveQueue(waveNum);
    gameState.spawnTimer = CONFIG.wave.firstSpawnDelay;
    gameState.run.waveKills = 0;
    if (classDef().onWaveStart) classDef().onWaveStart();
    gameState.run.flags.waveHit = false;
    gameState.waveStartAt = worldTime;
    gameState.lastWaveSouls = gameState.waveSouls;
    gameState.waveSouls = 0;
    scheduleRelic(waveNum);
    const isBossWave = waveNum % CONFIG.wave.bossEvery === 0;
    const ev = getWaveEvent();
    if (isBossWave) {
        if (isFinalWave(waveNum)) {
            gameState.banner = { text: '最終決戰', sub: `${CONFIG.lichBoss.name}降臨`, color: '#FF8A65', life: CONFIG.wave.bannerDuration * 1.5, icon: 'crown' };
        } else {
            const bossName = BOSS_CONFIG_OF.get(getBossClass(waveNum))().name;
            gameState.banner = { text: '首領來襲', sub: `第 ${waveNum} 波 · ${bossName}`, color: '#E1BEE7', life: CONFIG.wave.bannerDuration, icon: 'warning' };
        }
    } else if (waveNum === 1 && dailyDef()) {
        const d = dailyDef();
        gameState.banner = { text: d.name, sub: dailyRulesText(d), color: '#FF8A80', life: CONFIG.wave.bannerDuration * 1.8, icon: d.icon };
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
        // 波與波之間誰都不回血：法師被咬掉的一路帶到下一波（回血靠靈泉、選祝福時的「補滿血」、不死之軀、吸魂之軀），
        // 召喚物的殘血也帶著走（靠嗜魂、升級時多出來的血），打得越吃力的局越要拿資源去補
        const run = gameState.run;
        if (p && p.isAlive && p.currentHealth < p.maxHealth * ACHV_LAST_STAND) run.flags.lastStand = true;
        if (gameState.currentWave >= ACHV_SPEED_WAVE && worldTime - gameState.waveStartAt <= ACHV_SPEED_SECONDS) run.flags.speedClear = true;
        if (gameState.currentWave >= ACHV_BOSS_CHALLENGE_WAVE && gameState.currentWave % CONFIG.wave.bossEvery === 0 && !run.flags.waveHit) run.flags.bossNoHit = true;
        if (classDef().onWaveEnd) classDef().onWaveEnd();
        checkAchievements();
        saveMeta();
        spawnCrystalText(CRYSTALS_PER_WAVE);
        queueDraftIfDue();
        settleRelicsAtWaveEnd();
        lbWaveEnd();
        gameState.projectiles.forEach(returnProjectileToPool);
        gameState.projectiles = [];
        gameState.visualEffects.forEach(returnVisualEffectToPool);
        gameState.visualEffects = [];
        gameState.hazards = [];
        gameState.enemyBolts = [];
        const won = isFinalWave(gameState.currentWave) && !gameState.endless;
        if (won) gameState.endless = true;
        saveGameState();
        updateUI();
        if (won) showVictory();
        else if (gameState.pendingDraft) openDraft();
    }
}

// ---------- 通關 ----------
// ---------- 通關時間：每個職業各自的最快紀錄（同 PokeBonk 的計時獎牌）：有紀錄可破，打贏的局才有再打一次的理由 ----------
// 計的是遊戲裡實際經過的時間（暫停、選祝福時不算），開戰前的倒數也算：提早開戰就是在搶時間
function formatClock(sec) {
    const s = Math.floor(sec);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function bestClearOf(cls) { return (meta.bestClear || {})[cls] || null; }
// 回傳這一局是不是新紀錄（第一次通關也算）
function recordClear() {
    const cls = runClass(), t = gameState.runTime, prev = bestClearOf(cls);
    gameState.run.clearTime = t;
    if (prev && prev.time <= t) return false;
    meta.bestClear = { ...(meta.bestClear || {}), [cls]: { time: t, curse: gameState.curse || 0 } };
    return true;
}

function showVictory() {
    const isRecord = recordClear();
    const prevBest = bestClearOf(runClass());
    checkAchievements();
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
    uiElements.victoryTime.innerHTML = `${iconHtml('clock')}${formatClock(gameState.run.clearTime)}` +
        (isRecord ? '<b class="new-record">新紀錄</b>' : `<span class="best-time">最快 ${formatClock(prevBest.time)}</span>`);
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

// ---------- 排行榜：綜合榜與各職業榜各留前十名（存在這台裝置的 meta 裡） ----------
// 名次：通關的排前面、照通關時間快到慢；沒通關的照撐過的波數多到少，同波數用時短的在前。
// time 是 runTime：通關後就不再走（無盡模式不算），所以通關的那筆就是通關時間。
// 每日變異的規則每天不同（只能召喚眼魔、血量剩四分之一…），跟一般局比不公平，不上榜
const LB_SIZE = 10;
// 撐過這幾波才上榜：開局就放棄的不用跳恭喜
const LB_MIN_WAVE = 5;
const LB_DEFAULT_NAME = '無名亡靈';
const LB_ALL = 'all';
const LB_RESULT_NAMES = { died: '陣亡', quit: '中途結束' };
// 對手：榜上先排好十個亡靈議會的人，從第 7 波排到 21 分半通關。只有自己的紀錄的話，
// 新玩家打開是空的、沒有東西可追；有一排名字擋在前面，每一局都在「爬」，戰鬥中越過誰也喊得出來。
// 只寫在程式裡、不進存檔；玩家的紀錄多了，他們自然被擠出榜外
const LB_RIVAL_SEC_PER_WAVE = 32;
const LB_RIVALS = [
    ['永夜之主 薩洛斯', 'necro', 0, 1290, '亡靈王倒下的那晚，我只用了二十一分半'],
    ['鐵壁 瓦倫', 'warrior', 0, 1500, '陣型不散，就沒有過不去的夜'],
    ['月影 希兒', 'elf', 0, 1740, '停下腳步的弓手，活不過第十波'],
    ['血伯爵 卡蘭', 'vampire', 44, 0, '再一口血，我就能看見第五十波'],
    ['古橡 艾薇', 'druid', 37, 0, '我的林地撐過了三十七個黎明'],
    ['無聲 夜鴉', 'rogue', 30, 0, '沒有人看見我倒下'],
    ['石拳 玄空', 'monk', 24, 0, '拳到之處，皆是禪'],
    ['老兵 葛雷', 'warrior', 18, 0, '十八波，夠我吹一輩子了'],
    ['見習 米拉', 'necro', 12, 0, '骷髏好可愛，可是怪好多……'],
    ['迷途 小骨', 'necro', 7, 0, '我只是想回家'],
].map(([name, cls, wave, time, motto], i) => ({
    id: `rival${i}`, rival: true, name, cls, motto, curse: 0,
    won: wave === 0, wave: wave || CONFIG.wave.finalWave, time: time || wave * LB_RIVAL_SEC_PER_WAVE,
}));

function lbCompare(a, b) {
    if (a.won !== b.won) return a.won ? -1 : 1;
    if (a.won) return a.time - b.time;
    return b.wave - a.wave || a.time - b.time;
}
function lbEntries(tab) {
    return [...meta.leaderboard, ...LB_RIVALS].filter(e => tab === LB_ALL || e.cls === tab);
}
function lbBoard(tab) {
    return lbEntries(tab).sort(lbCompare).slice(0, LB_SIZE);
}
function lbRank(e, tab) { return lbBoard(tab).indexOf(e) + 1; }
// 還沒存進榜的成績（打到一半的這一局）會排第幾：比它好的有幾筆
function lbPlace(run, tab) { return lbEntries(tab).filter(e => e !== run && lbCompare(e, run) < 0).length + 1; }
// 自己最好的那筆（不分職業）：拿來判斷哪些對手是「這一局才第一次超越」
function lbOwnBest() { return [...meta.leaderboard].sort(lbCompare)[0] || null; }
function lbBeaten(r, best) { return !!best && lbCompare(best, r) < 0; }
// 打到一半的這一局，當成一筆成績
function lbRunNow() {
    return { cls: runClass(), won: !!gameState.endless, wave: getSurvivedWaves(), time: gameState.runTime };
}
// 掉出所有榜的就刪掉，存檔不會一直長大
function lbPrune() {
    const keep = new Set(lbBoard(LB_ALL));
    for (const id of Object.keys(CLASSES)) lbBoard(id).forEach(e => keep.add(e));
    meta.leaderboard = meta.leaderboard.filter(e => keep.has(e));
}
// 排行榜功能出來之前的玩家：每個職業的最快通關紀錄先放上榜（只知道時間與詛咒）
function seedLeaderboard(bestClear) {
    return Object.entries(bestClear || {}).map(([cls, r], i) => ({ id: i + 1, name: LB_DEFAULT_NAME, cls, won: true, time: r.time, curse: r.curse || 0 }));
}
// 這一局上榜就回傳那一筆（passed：這一局第一次超越的對手），沒上榜回 null
function lbSubmit(reason) {
    if (appScreen !== 'playing' || gameState.daily || getSurvivedWaves() < LB_MIN_WAVE) return null;
    const best = lbOwnBest();
    const k = reason === 'died' ? gameState.killedBy : null;
    const e = {
        id: Date.now(), name: meta.lbName || LB_DEFAULT_NAME, cls: runClass(), date: Date.now(),
        won: !!gameState.endless, time: gameState.runTime, wave: getSurvivedWaves(), curse: gameState.curse || 0,
        result: reason, killer: k ? `${k.isElite ? '精英' : ''}${k.config.name}` : '',
        kills: Object.values(gameState.totalKills).reduce((a, b) => a + b, 0),
        summons: Object.values(gameState.totalSummons).reduce((a, b) => a + b, 0),
        streak: gameState.bestStreak, bosses: gameState.totalKills.Boss || 0,
        blessings: { ...gameState.blessings }, splits: { ...gameState.run.splits },
    };
    meta.leaderboard.push(e);
    lbPrune();
    if (!meta.leaderboard.includes(e)) return null;
    return { entry: e, passed: LB_RIVALS.filter(r => lbCompare(e, r) < 0 && !lbBeaten(r, best)) };
}

// 波次結束時喊一聲：這一局第一次越過某個對手（以前的紀錄還沒贏過他），或是首領波的分段時間跟自己最快的通關比
function lbWaveEnd() {
    if (appScreen !== 'playing' || gameState.daily || gameState.endless) return;
    const w = gameState.currentWave, run = gameState.run, now = lbRunNow();
    if (w % CONFIG.wave.bossEvery === 0) run.splits[w] = gameState.runTime;
    const best = lbOwnBest();
    const passed = LB_RIVALS.filter(r => !r.won && r.wave === w - 1 && !lbBeaten(r, best));
    if (passed.length > 0) {
        gameState.banner = { text: `超越 ${passed[0].name}`, sub: `排行榜綜合第 ${lbPlace(now, LB_ALL)} 名`, color: '#FFD54F', life: CONFIG.wave.bannerDuration * 1.4, icon: 'podium' };
        return;
    }
    const target = lbSplitTarget(w);
    if (target != null && !isFinalWave(w)) {
        const d = gameState.runTime - target;
        gameState.banner = { text: `比最佳${d <= 0 ? '快' : '慢'} ${formatClock(Math.abs(d))}`, sub: `第 ${w} 波 · ${formatClock(gameState.runTime)}`, color: d <= 0 ? '#A5D6A7' : '#EF9A9A', life: CONFIG.wave.bannerDuration * 1.2, icon: 'clock' };
    }
}
// 這個職業自己最快的那次通關，打到第 w 波時用了多久（沒有就 null）
function lbSplitTarget(w) {
    const best = meta.leaderboard.filter(e => e.won && e.cls === runClass() && e.splits && e.splits[w] != null).sort(lbCompare)[0];
    return best ? best.splits[w] : null;
}
// 結算畫面的下一個目標：榜上排在這一局前面的那一筆，還差多少
function lbNextTargetHtml(run) {
    if (gameState.daily) return '';
    const board = lbBoard(LB_ALL), place = lbPlace(run, LB_ALL);
    if (place === 1) return `${iconHtml('crown')}綜合榜第一`;
    const t = board[Math.min(place, board.length + 1) - 2];
    if (!t) return '';
    const who = escapeHtml(t.name);
    if (t.won && !run.won) return `${iconHtml('podium')}通關就能超越 ${who}`;
    if (t.won) return `${iconHtml('podium')}再快 ${formatClock(run.time - t.time + 1)} 超越 ${who}`;
    return `${iconHtml('podium')}再撐 ${t.wave - run.wave + 1} 波超越 ${who}`;
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
function lbClassImg(cls) { return CLASSES[cls] ? `<img src="${CLASSES[cls].portrait}" alt="">` : ''; }
// 名次的小標籤：綜合 #3、[頭像]戰士 #1（沒進那張榜的不列）
function lbRanksHtml(e) {
    const all = lbRank(e, LB_ALL), mine = lbRank(e, e.cls);
    return (all ? `<span>${iconHtml('podium')}綜合<b>#${all}</b></span>` : '') +
        (mine && CLASSES[e.cls] ? `<span>${lbClassImg(e.cls)}${CLASSES[e.cls].name}<b>#${mine}</b></span>` : '');
}
// 成績一行：通關的寫通關時間，沒通關的寫撐到第幾波＋用了多久
function lbResultHtml(e) {
    if (e.won) return `<div class="lb-result">${iconHtml('crown')}通關 ${formatClock(e.time)}${e.wave > CONFIG.wave.finalWave ? `<small>無盡模式撐到第 ${e.wave} 波</small>` : ''}</div>`;
    const how = e.killer ? `被${e.killer}擊倒` : LB_RESULT_NAMES[e.result] || '';
    return `<div class="lb-result">${iconHtml('skull')}第 ${e.wave} 波 · ${formatClock(e.time)}${how ? `<small>${how}</small>` : ''}</div>`;
}

let lbTab = LB_ALL;
let lbMineId = null;
function openLeaderboard(tab = lbTab) {
    lbTab = tab;
    renderLeaderboard();
    showScreen(uiElements.lbScreen, true);
}
function closeLeaderboard() {
    lbMineId = null;
    showScreen(uiElements.lbScreen, false);
}
function renderLeaderboard() {
    const tabs = [LB_ALL, ...Object.keys(CLASSES)];
    if (!tabs.includes(lbTab)) lbTab = LB_ALL;
    uiElements.lbTabs.innerHTML = tabs.map(id => {
        const pic = id === LB_ALL ? iconHtml('podium') : lbClassImg(id);
        return `<button class="achv-tab achv-subtab${id === lbTab ? ' on' : ''}" data-lb-tab="${id}">${pic}<div>${id === LB_ALL ? '綜合' : CLASSES[id].name}</div></button>`;
    }).join('');
    const board = lbBoard(lbTab);
    uiElements.lbList.innerHTML = board.length === 0 ? `<span class="empty-note">撐過第 ${LB_MIN_WAVE} 波就能上榜</span>` : board.map((e, i) => {
        const sub = (e.won ? `<span>${iconHtml('crown')}通關</span>` : `<span>${iconHtml('skull')}第 ${e.wave} 波</span>`) +
            (e.curse > 0 ? `<span>${iconHtml('flame')}詛咒 ${e.curse}</span>` : '') +
            (e.rival ? '<span class="lb-tag">對手</span>' : '');
        return `<button class="lb-row${e.id === lbMineId ? ' mine' : ''}${e.rival ? ' rival' : ''}" data-lb="${e.id}"><span class="lb-no">${i + 1}</span>${lbClassImg(e.cls)}` +
            `<span class="lb-who"><div class="lb-name">${escapeHtml(e.name)}</div><div class="lb-sub">${sub}</div></span>` +
            `<span class="lb-time${e.won ? ' won' : ''}">${iconHtml('clock')}${formatClock(e.time)}</span></button>`;
    }).join('');
    const mineRow = uiElements.lbList.querySelector('.mine');
    if (mineRow) mineRow.scrollIntoView({ block: 'nearest' });
}
function openLbDetail(id) {
    const e = lbEntries(LB_ALL).find(x => String(x.id) === String(id));
    if (!e) return;
    const C = CLASSES[e.cls];
    const stat = (v, label) => v == null ? '' : `<div class="result-stat"><b>${v}</b><span>${label}</span></div>`;
    uiElements.lbDetailBody.innerHTML =
        `<div class="lb-detail-head">${lbClassImg(e.cls)}<div><div class="lb-name">${escapeHtml(e.name)}</div>` +
        `<div class="lb-sub">${C ? (C.title === C.name ? C.name : `${C.name} · ${C.title}`) : ''}${e.date ? `<span>${new Date(e.date).toLocaleDateString('zh-TW')}</span>` : ''}</div></div></div>` +
        `<div class="lb-ranks">${lbRanksHtml(e)}${e.curse > 0 ? `<span>${iconHtml('flame')}詛咒<b>${e.curse}</b></span>` : ''}</div>` +
        lbResultHtml(e) +
        (e.rival ? `<p class="lb-motto">「${e.motto}」</p><div class="lb-sub lb-beaten">${lbBeaten(e, lbOwnBest()) ? `${iconHtml('crown')}已經超越` : e.won ? `${formatClock(e.time)} 內通關就能超越` : `撐過第 ${e.wave + 1} 波就能超越`}</div>` : '') +
        (e.kills == null ? '' : `<div class="result-stats">${stat(formatNumberK(e.kills), '擊殺')}${stat(formatNumberK(e.summons), '召喚')}${stat(formatNumberK(e.streak), '最高連殺')}${stat(e.bosses, '首領')}</div>`) +
        (e.blessings ? `<div class="bless-list">${blessingChipsHtml(e.blessings)}</div>` : '');
    showScreen(uiElements.lbDetail, true);
}

// 結算時上榜：恭喜＋留名字。不填直接關掉就用預設名字（上次填過的名字、沒填過就是「無名亡靈」）
let lbPending = null;
// 這一局第一次超越的對手最多列這幾個（一口氣跳很多名時只列最前面的）
const LB_PASSED_SHOWN = 2;
function openLbCongrats({ entry: e, passed }) {
    lbPending = e;
    uiElements.lbCongratsRanks.innerHTML = lbRanksHtml(e);
    const top = passed.sort(lbCompare).slice(0, LB_PASSED_SHOWN);
    uiElements.lbCongratsResult.innerHTML = lbResultHtml(e) +
        (top.length ? `<div class="lb-passed">${top.map(r => `<span>${lbClassImg(r.cls)}超越 ${r.name}</span>`).join('')}${passed.length > top.length ? `<span>等 ${passed.length} 人</span>` : ''}</div>` : '');
    uiElements.lbNameInput.value = meta.lbName || '';
    uiElements.lbNameInput.placeholder = LB_DEFAULT_NAME;
    showScreen(uiElements.lbCongrats, true);
    // 手機上自動點進輸入框會直接彈出鍵盤蓋住名次，只在有實體鍵盤的裝置上這樣做
    if (!matchMedia('(pointer: coarse)').matches) uiElements.lbNameInput.focus();
}
function closeLbCongrats() {
    const e = lbPending;
    if (!e) return;
    lbPending = null;
    const typed = uiElements.lbNameInput.value.trim();
    if (typed) meta.lbName = typed;
    e.name = typed || LB_DEFAULT_NAME;
    saveMeta();
    uiElements.lbNameInput.blur();
    showScreen(uiElements.lbCongrats, false);
    // 接著打開排行榜看自己排在哪：進了綜合榜就看綜合，不然看職業榜
    lbMineId = e.id;
    openLeaderboard(lbRank(e, LB_ALL) ? LB_ALL : e.cls);
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

// 右下的大招按鈕、空白鍵：交給這一局職業的大招
function useUltimate() {
    const p = gameState.player;
    if (!p || !p.isAlive || gameState.ultCooldown > 0 || gameState.isPaused || gameState.gameOver || gameState.draftOpen) return false;
    if (!classDef().ultimate.use()) return false;
    markUltTaught();
    return true;
}

function useNova() {
    const p = gameState.player;
    const c = CONFIG.nova;
    const dmg = getNovaDamage();
    // 傳說「寒冰新星」：範圍變大、緩速加強到幾乎凍住
    const frost = bl('frostNova') > 0;
    const radius = c.radius * (frost ? FROST_NOVA_RADIUS_MULT : 1);
    const rSq = radius * radius;
    let novaKills = 0;
    gameState.monsters.forEach(m => {
        if (!m.isAlive) return;
        const dSq = distanceSq(m.pos, p.pos);
        if (dSq > rSq) return;
        const dir = normalizeVector({ x: m.pos.x - p.pos.x, y: m.pos.y - p.pos.y });
        const kb = c.knockbackSpeed * (m instanceof BossMonster ? c.bossKnockbackMult : 1);
        m.knockVel = { x: dir.x * kb, y: dir.y * kb };
        m.applySlow(frost ? FROST_NOVA_SLOW : c.slowAmount, frost ? BLESSINGS.frostNova.per : c.slowDuration);
        m.takeDamage(dmg);
        if (!m.isAlive) novaKills++;
    });
    gameState.run.novas++;
    gameState.run.novaBest = Math.max(gameState.run.novaBest, novaKills);
    stats().novas++;
    gameState.frenzyTimer = c.frenzyDuration + blessVal('frenzyTime');
    for (let i = 0; i < gameState.orbs.length; i++) gameState.orbs[i].attracted = true;
    // 寫效果不寫招式名：「狂潮」沒人知道是什麼，「大軍狂暴」一看就懂是自己的兵變強；兵身上同時冒紫火花（挑一部分，上千隻全冒會塞爆粒子上限）
    spawnFloatText(p.pos.x, p.pos.y - 34, '大軍狂暴！', '#E1BEE7', 18, 1.1, 'burst');
    const live = gameState.summons, step = Math.max(1, Math.floor(live.length / FRENZY_SPARK_SUMMONS));
    for (let i = 0; i < live.length; i += step) if (live[i].isAlive) spawnParticles(live[i].pos.x, live[i].pos.y, FRENZY_SPARK_COLOR, 3, 60, 0.5, 3);
    gameState.visualEffects.push(new NovaEffect(p.pos, radius));
    spawnParticles(p.pos.x, p.pos.y, frost ? '#B3E5FC' : '#CE93D8', 36, 260, 0.5, 3);
    addShake(7);
    Sfx.play('nova');
    gameState.ultCooldown = getNovaCooldown();
    ensureMusicPlaying();
    updateUI();
    return true;
}

function queueDraftIfDue() {
    const w = gameState.currentWave;
    if (w <= 0 || (w % CONFIG.draft.every !== 0 && w % CONFIG.wave.bossEvery !== 0)) return;
    queueDraft(w % CONFIG.wave.bossEvery === 0);
}

// 首領波：三張裡固定一張傳說（還有沒拿過的才給），放在隨機位置；其他波有 LEGEND_CHANCE_NORMAL 機率也出一張
// 偏向已經在走的流派：該流派每有 1 層，抽中的權重 +DRAFT_SCHOOL_WEIGHT（封頂 DRAFT_WEIGHT_MAX 倍）。
// 完全隨機的話 27 張平均攤開，一局很難湊到共鳴、組不出一套打法
const DRAFT_SCHOOL_WEIGHT = 0.4;
const DRAFT_WEIGHT_MAX = 3;
function draftWeight(id) {
    return Math.min(DRAFT_WEIGHT_MAX, 1 + DRAFT_SCHOOL_WEIGHT * schoolPoints(BLESSINGS[id].school));
}
function weightedPick(ids, n) {
    const pool = ids.slice(), out = [];
    while (out.length < n && pool.length) {
        const w = pool.map(draftWeight);
        let r = Math.random() * w.reduce((a, b) => a + b, 0);
        let i = 0;
        while (i < pool.length - 1 && (r -= w[i]) > 0) i++;
        out.push(pool.splice(i, 1)[0]);
    }
    return out;
}
function draftOptionCount() {
    return CONFIG.draft.optionCount + metaVal('extraChoice');
}
// exclude：這次不能出的（放逐換卡時，畫面上已有的那幾張）
// 這個職業抽得到的祝福：自己的流派，加上全軍通用的（契約另外由 pactPool 抽，各職業共用）
function blessingInClass(id) {
    const s = BLESSINGS[id].school;
    return s === ARMY_SCHOOL || classDef().schools.includes(s);
}
function draftPool(legendary, exclude = []) {
    return Object.keys(BLESSINGS).filter(id => bl(id) < BLESSINGS[id].max && !BLESSINGS[id].legendary === !legendary
        && !BLESSINGS[id].pact && blessingInClass(id) && !gameState.banished.includes(id) && !exclude.includes(id));
}
function pactPool(exclude = []) {
    return Object.keys(BLESSINGS).filter(id => BLESSINGS[id].pact && bl(id) < BLESSINGS[id].max && !gameState.banished.includes(id) && !exclude.includes(id));
}
function rollDraftOptions(boss) {
    const count = draftOptionCount();
    const legendRoll = boss || Math.random() < LEGEND_CHANCE_NORMAL;
    const legend = legendRoll ? weightedPick(draftPool(true), 1)[0] : null;
    const daily = dailyDef();
    const pactRoll = !boss && ((daily && daily.pactAlways) || (gameState.currentWave >= PACT_START_WAVE && Math.random() < PACT_CHANCE));
    const pact = pactRoll ? weightedPick(pactPool(), 1)[0] : null;
    const special = [legend, pact].filter(Boolean);
    const options = weightedPick(draftPool(false), count - special.length);
    for (const id of special) options.splice(Math.floor(Math.random() * (options.length + 1)), 0, id);
    return options;
}

function queueDraft(boss = false) {
    const options = rollDraftOptions(boss);
    if (options.length > 0) gameState.pendingDraft = { options, boss };
}

// 重抽是整局共用的次數（同吸血鬼倖存者）：開局 REROLLS_PER_RUN 次＋永久強化「先知之眼」，每打倒一隻首領再補 REROLLS_PER_BOSS 次。
// 不用靈魂買：原本每次 20、40、60 魂而且下一次抽卡又從 20 起算，後期一波收入上千，等於想刷幾次就刷幾次，選卡沒有重量
const REROLLS_PER_RUN = 2;
const REROLLS_PER_BOSS = 1;

// 卡片上的流派標籤：頭像＋名字＋共鳴進度（每一段 RESONANCE_STEPS 一組點，這張選下去會亮的那一點閃爍）
function schoolBadgeHtml(school) {
    const S = SCHOOLS[school];
    return S.img ? `<img class="school-img" src="${S.img}" alt="">` : iconHtml(S.icon, 'icon school-img');
}
function resonancePipsHtml(school, preview) {
    const pts = schoolPoints(school), max = RESONANCE_STEPS[RESONANCE_STEPS.length - 1];
    let html = '';
    for (let i = 0; i < max; i++) {
        if (RESONANCE_STEPS.includes(i) && i > 0) html += '<span class="res-gap"></span>';
        const cls = i < pts ? 'pip on' : (preview && i === pts ? 'pip next' : 'pip');
        html += `<span class="${cls}"></span>`;
    }
    return `<span class="pips res-pips">${html}</span>`;
}
function schoolChipHtml(id) {
    const school = BLESSINGS[id].school;
    if (school === ARMY_SCHOOL) return `<span class="school-chip">${iconHtml('summon', 'icon school-img')}<span>全軍</span></span>`;
    if (school === PACT_SCHOOL) return `<span class="school-chip pact-chip">${iconHtml('flame', 'icon school-img')}<span>契約</span></span>`;
    const S = SCHOOLS[school];
    // 這張選下去剛好湊滿一段：整個標籤亮起來
    const willResonate = RESONANCE_STEPS.includes(schoolPoints(school) + 1);
    return `<span class="school-chip${willResonate ? ' resonates' : ''}" style="--school:${S.color}">${schoolBadgeHtml(school)}<span>${willResonate ? '共鳴' : S.name}</span></span>${resonancePipsHtml(school, true)}`;
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
    box.classList.toggle('four', gameState.pendingDraft.options.length === 4);
    gameState.pendingDraft.options.forEach(id => {
        const b = BLESSINGS[id];
        const card = document.createElement('button');
        card.className = `draft-card panel${b.legendary ? ' legendary' : ''}${b.pact ? ' pact' : ''}`;
        const banish = gameState.banishLeft > 0 ? `<button class="card-banish" data-banish="${id}">${iconHtml('banish', 'icon btn-icon')}放逐</button>` : '';
        card.innerHTML = `${schoolChipHtml(id)}${iconHtml(blessIcon(id), 'icon card-icon')}<span class="draft-name">${b.name}</span><span class="pips">${blessingPips(id, true)}</span><span class="draft-desc">${b.desc(b)}</span>${banish}`;
        // 用 pointerup 不用 click：另一隻手指還按著搖桿時瀏覽器不會合成 click。
        // 不用 pointerdown，是因為祝福選了收不回來，按下去還能滑開反悔
        // 觸控的 pointerup 一定回到按下的那張卡（隱式捕捉），所以要自己看放開時手指還在不在卡上
        card.addEventListener('pointerup', (e) => {
            if (e.target.closest('.card-banish')) { banishBlessing(id); return; }
            const r = card.getBoundingClientRect();
            if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) pickBlessing(id);
        });
        box.appendChild(card);
    });
    uiElements.rerollBtn.innerHTML = `${iconHtml('reroll', 'icon btn-icon')}重抽<span class="price">×${gameState.rerollsLeft}</span>`;
    uiElements.rerollBtn.disabled = gameState.rerollsLeft <= 0;
    uiElements.skipBtn.innerHTML = `跳過<span class="price">${iconHtml('soul')}+${formatNumberK(draftSkipSouls())}</span>`;
    const missing = draftHealAmount();
    uiElements.healBtn.innerHTML = `${iconHtml('heart', 'icon btn-icon')}補滿血<span class="price">+${missing}</span>`;
    uiElements.healBtn.disabled = missing <= 0;
}

// 補滿血：不拿祝福，換法師血量回滿。波與波之間不回血，所以每次選祝福都是「變強還是保命」
function draftHealAmount() {
    const p = gameState.player;
    return p && p.isAlive ? p.maxHealth - p.currentHealth : 0;
}
function healDraft() {
    if (!gameState.pendingDraft) return;
    const p = gameState.player, heal = draftHealAmount();
    if (heal <= 0) return;
    p.currentHealth = p.maxHealth;
    gameState.run.heals = (gameState.run.heals || 0) + 1;
    spawnFloatText(p.pos.x, p.pos.y - 26, `+${heal} HP`, '#81C784', 16, 1.4, 'heart');
    spawnParticles(p.pos.x, p.pos.y, '#81C784', 24, 110, 0.7, 3);
    Sfx.play('heal');
    closeDraft();
}

// 跳過（同 PokeBonk 的 Skip）：三張都不合這一局的路線時，不拿祝福、換一筆靈魂（剛打完那一波掉落的 DRAFT_SKIP_SHARE 倍）
const DRAFT_SKIP_SHARE = 0.5;
const DRAFT_SKIP_MIN = 20;
function draftSkipSouls() {
    return Math.max(DRAFT_SKIP_MIN, Math.round(gameState.waveSouls * DRAFT_SKIP_SHARE));
}
function skipDraft() {
    if (!gameState.pendingDraft) return;
    const souls = draftSkipSouls();
    gameState.souls += souls;
    if (gameState.player) spawnFloatText(gameState.player.pos.x, gameState.player.pos.y - 26, `+${formatNumberK(souls)}`, '#80DEEA', 16, 1.4, 'soul');
    closeDraft();
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
    if (!gameState.pendingDraft || gameState.rerollsLeft <= 0) return;
    gameState.rerollsLeft--;
    gameState.pendingDraft.options = rollDraftOptions(gameState.pendingDraft.boss);
    renderDraftCards();
    Sfx.play('draft');
    updateUI();
}

// 放逐：這張整局不再出現，原位換一張同稀有度的新卡
function banishBlessing(id) {
    const d = gameState.pendingDraft;
    if (!d || gameState.banishLeft <= 0 || !d.options.includes(id)) return;
    gameState.banished.push(id);
    gameState.banishLeft--;
    const replacement = weightedPick(BLESSINGS[id].pact ? pactPool(d.options) : draftPool(BLESSINGS[id].legendary, d.options), 1)[0];
    if (replacement) d.options[d.options.indexOf(id)] = replacement;
    else d.options = d.options.filter(o => o !== id);
    renderDraftCards();
    Sfx.play('draft');
}

function announceResonance(school, tier) {
    const S = SCHOOLS[school], R = S.res[tier - 1];
    gameState.banner = { text: `${S.name}共鳴 · ${R.name}`, sub: R.desc, color: S.color, life: CONFIG.wave.bannerDuration * 1.4, icon: 'star' };
    addShake(4);
    Sfx.play('evolve');
}

function pickBlessing(id) {
    if (!gameState.pendingDraft || !gameState.pendingDraft.options.includes(id)) return;
    const school = BLESSINGS[id].school, tierBefore = res(school);
    gameState.blessings[id] = bl(id) + 1;
    gameState.run.picks++;
    if (BLESSINGS[id].legendary) stats().legends[id] = true;
    if (BLESSINGS[id].pact) stats().pacts[id] = true;
    refreshResonance();
    if (res(school) > tierBefore) announceResonance(school, res(school));
    if (id === 'vitality' && gameState.player) {
        gameState.player.maxHealth += BLESSINGS.vitality.per;
        gameState.player.currentHealth = gameState.player.maxHealth;
    }
    if (BLESSINGS[id].pact) {
        invalidateRunMods();
        const hpMult = BLESSINGS[id].mods.mageHpMult;
        if (hpMult && gameState.player) {
            const p = gameState.player;
            p.maxHealth = Math.max(1, Math.round(p.maxHealth * hpMult));
            p.currentHealth = Math.min(p.currentHealth, p.maxHealth);
        }
    }
    gameState.summons.forEach(s => { if (s.isAlive) s.refreshStats(); });
    if (gameState.player) {
        spawnParticles(gameState.player.pos.x, gameState.player.pos.y, '#FFD54F', 24, 120, 0.7, 3);
        spawnFloatText(gameState.player.pos.x, gameState.player.pos.y - 26, BLESSINGS[id].name, '#FFD54F', 16, 1.4, blessIcon(id));
    }
    closeDraft();
}
// 選了或跳過之後：收起畫面，還有排隊的祝福就接著開
function closeDraft() {
    gameState.pendingDraft = null;
    gameState.draftOpen = false;
    showScreen(uiElements.draftScreen, false);
    if (gameState.extraDrafts > 0) {
        gameState.extraDrafts--;
        queueDraft();
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
// 暫停選單：有層數的流派各一列，進度點＋已經觸發的共鳴
function renderResonance(container) {
    const rows = Object.keys(SCHOOLS).filter(s => schoolPoints(s) > 0).map(s => {
        const S = SCHOOLS[s], t = res(s);
        const active = S.res.slice(0, t).map(r => `<div class="bless-effect"><b>${r.name}</b> ${r.desc}</div>`).join('');
        return `<div class="bless-row res-row" style="--school:${S.color}">${schoolBadgeHtml(s)}<div class="bless-text"><div class="bless-name"><span class="nm">${S.name}</span>${resonancePipsHtml(s, false)}</div>${active}</div></div>`;
    });
    container.classList.toggle('hidden', rows.length === 0);
    container.innerHTML = rows.join('');
}

function renderBlessingDetail(container) {
    const ids = Object.keys(BLESSINGS).filter(id => bl(id) > 0);
    container.innerHTML = ids.length === 0 ? '<span class="empty-note">還沒有祝福</span>' : ids.map(id => {
        const B = BLESSINGS[id], lv = bl(id);
        const pips = Array.from({ length: B.max }, (_, i) => `<span class="pip ${i < lv ? 'on' : ''}"></span>`).join('');
        return `<div class="bless-row">${iconHtml(blessIcon(id))}<div class="bless-text"><div class="bless-name"><span class="nm">${B.name}</span><span class="pips">${pips}</span></div><div class="bless-effect">${blessTotalDesc(id)}</div></div></div>`;
    }).join('');
}

function renderBlessingList(container) {
    container.innerHTML = blessingChipsHtml(gameState.blessings);
}
// levels：{ 祝福 id: 層數 }（這一局的，或排行榜上存下來的）
function blessingChipsHtml(levels) {
    const ids = Object.keys(BLESSINGS).filter(id => levels[id] > 0);
    return ids.length === 0 ? '<span class="empty-note">還沒有祝福</span>' : ids.map(id =>
        `<span class="bless-chip">${iconHtml(blessIcon(id))}${BLESSINGS[id].name}${levels[id] > 1 ? `<b>${levels[id]}</b>` : ''}</span>`).join('');
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
        const s = JSON.parse(SaveStore.get(SAVE_KEY));
        if (s && COMPATIBLE_SAVE_VERSIONS.includes(s.saveVersion)) return s;
    } catch (e) { }
    return null;
}
function getBestWave() {
    try { return parseInt(SaveStore.get(BEST_WAVE_KEY), 10) || 0; } catch (e) { return 0; }
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
    const daily = todayMutation();
    const claimed = meta.dailyClaimed === todayKey();
    uiElements.titleDailyBtn.innerHTML = `${iconHtml(daily.icon, 'icon btn-icon')}每日 · ${daily.name}` +
        (claimed ? `<span class="price">${iconHtml('trophy')}</span>` : `<span class="price">${iconHtml('crystal')}×${DAILY_CRYSTAL_MULT}</span>`);
    const best = getBestWave();
    const wins = meta.wins || 0;
    renderClassPicker();
    const fastest = bestClearOf(selectedClass());
    uiElements.titleBest.innerHTML = (best > 0 ? `${iconHtml('trophy')}最佳 ${best} 波　` : '') +
        (wins > 0 ? `${iconHtml('crown')}通關 ${wins}　` : '') +
        (fastest ? `${iconHtml('clock')}最快 ${formatClock(fastest.time)}　` : '') +
        `<span class="crystal-count">${iconHtml('crystal')}${meta.crystals}</span>`;
    uiElements.titleMetaBtn.classList.toggle('can-upgrade', canBuyAnyMeta());
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
    // 結算上面疊的排行榜視窗：一次收一層，上榜恭喜收掉時照樣用預設名字登錄
    if (lbPending) { closeLbCongrats(); return; }
    if (uiElements.lbDetail.style.display === 'flex') { showScreen(uiElements.lbDetail, false); return; }
    if (uiElements.lbScreen.style.display === 'flex') { closeLeaderboard(); return; }
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

function startDailyRun() {
    const d = todayMutation();
    const save = peekSave();
    const overwrite = save && save.currentWave > 0 ? `\n第 ${save.currentWave} 波的進度會被覆蓋` : '';
    const bonus = meta.dailyClaimed === todayKey() ? '' : `\n今天第一場結晶 ×${DAILY_CRYSTAL_MULT}`;
    showConfirm(`每日變異 · ${d.name}`, `${dailyRulesText(d)}${bonus}${overwrite}`, '出發', () => { resetGame(d); enterPlaying(); });
}

// ---------- 標題畫面選職業：一排頭像，選中的金框；還沒解鎖的暗下來壓一個鎖，點了說怎麼解鎖 ----------
function renderClassPicker() {
    const sel = selectedClass();
    uiElements.titleHero.src = CLASSES[sel].portrait;
    const ids = Object.keys(CLASSES);
    uiElements.classPicker.classList.toggle('hidden', ids.length < 2);
    uiElements.classPicker.innerHTML = ids.map(id => {
        const ok = classUnlocked(id);
        return `<button class="class-pick${id === sel ? ' on' : ''}${ok ? '' : ' locked'}" data-class="${id}" aria-label="${CLASSES[id].name}"><img src="${CLASSES[id].portrait}" alt="">${ok ? '' : iconHtml('lock')}</button>`;
    }).join('');
    uiElements.classInfo.innerHTML = `<b>${CLASSES[sel].title}</b> · ${CLASSES[sel].tagline}`;
}
function pickClass(id) {
    if (!CLASSES[id]) return;
    if (!classUnlocked(id)) {
        const a = achievements().find(x => x.id === CLASSES[id].unlock);
        uiElements.classInfo.innerHTML = `${iconHtml('lock')}<b>${CLASSES[id].title}</b> · 解鎖：${a ? a.desc : ''}`;
        Sfx.play('deny');
        return;
    }
    meta.classSel = id;
    saveMeta();
    Sfx.play('click');
    // 標題背景也是一局：換成新職業的樣子
    setupNewRun();
    refreshTitle();
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
    uiElements.gameoverMetaBtn.classList.toggle('can-upgrade', canBuyAnyMeta());
}
function canBuyAnyMeta() {
    return Object.keys(META_UPGRADES).some(id => metaLv(id) < META_UPGRADES[id].max && meta.crystals >= metaCost(id));
}
// 已經花在某一項上的結晶（第 n 級花 costBase × n）
function metaSpent(id) {
    const lv = metaLv(id);
    return META_UPGRADES[id].costBase * lv * (lv + 1) / 2;
}
// 全部退還（同吸血鬼倖存者）：結晶全數退回，可以換一套搭配再試
function refundMeta() {
    let back = 0;
    for (const id of Object.keys(META_UPGRADES)) back += metaSpent(id);
    if (back <= 0) return;
    meta.crystals += back;
    meta.upgrades = {};
    saveMeta();
    Sfx.play('pick');
    renderMeta();
}

function renderMeta() {
    uiElements.metaCrystals.innerHTML = `${iconHtml('crystal')}${meta.crystals}`;
    uiElements.metaEarn.innerHTML = `<span>${iconHtml('skull')}每撐過 1 波 +${CRYSTALS_PER_WAVE}</span><span>${iconHtml('crown')}首領 +${CRYSTALS_PER_BOSS}</span><span>${iconHtml('trophy')}通關 +${VICTORY_CRYSTALS}</span>`;
    uiElements.metaRefundBtn.disabled = !Object.keys(META_UPGRADES).some(id => metaLv(id) > 0);
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
    checkAchievements(true);
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

// ---------- 新手提示（只在第一局）：先教移動，再教召喚，再教按住連發；開戰後第一次被怪貼近時教新星 ----------
const TUTORIAL_MOVE_DIST = 60;
let tutorial = null;
function startTutorialIfNeeded() {
    // 新手教學教的是亡靈法師（第一次玩一定是它，其他職業要解鎖）
    if (meta.tutorialDone || gameState.currentWave > 0 || !gameState.player || runClass() !== DEFAULT_CLASS) return;
    tutorial = { step: 'move', start: { ...gameState.player.pos } };
}
function updateTutorial() {
    if (!tutorial || !gameState.player) return;
    if (tutorial.step === 'move' && distanceSq(gameState.player.pos, tutorial.start) > TUTORIAL_MOVE_DIST * TUTORIAL_MOVE_DIST) {
        tutorial.step = 'summon';
        UNIT_UI[0].el.summon.classList.add('hint-pulse');
    } else if (tutorial.step === 'summon' && gameState.totalSummons[UNIT_UI[0].type] > 0) {
        tutorial.step = 'hold';
    } else if (tutorial.step === 'hold') {
        // 按住連續成功到按鈕上方浮出「×N」就算學會。第一波開打前倒數是停住的：靈魂不夠按住連發的話不能卡在這一步
        const learned = holdCombo >= HOLD_COMBO_SHOW_FROM && holdActionState.actionType === 'summon';
        const broke = gameState.souls < getSummonCost(UNIT_TYPES[UNIT_UI[0].type].cfg()) * HOLD_COMBO_SHOW_FROM;
        if (learned || broke) {
            UNIT_UI[0].el.summon.classList.remove('hint-pulse');
            tutorial = null;
            meta.tutorialDone = true;
            saveMeta();
        }
    }
}

// 大招提示：開戰後主角身邊第一次有好幾隻怪、大招又剛好能用時，指著按鈕講它能幹嘛；每個職業按過一次就不再出現
const ULT_HINT_NEAR = 3;
let ultHint = false;
// 亡靈法師的舊紀錄存在 meta.novaTaught
function ultTaught() { return !!((meta.ultTaught || {})[runClass()] || (runClass() === 'necro' && meta.novaTaught)); }
function updateUltHint() {
    if (ultTaught() || !gameState.player || gameState.betweenWaves || gameState.currentWave < 1) { setUltHint(false); return; }
    if (ultHint || gameState.ultCooldown > 0) return;
    const p = gameState.player.pos, R = classDef().ultimate.hintRadius(), rSq = R * R;
    let near = 0;
    for (let i = 0; i < gameState.monsters.length; i++) {
        const m = gameState.monsters[i];
        if (m.isAlive && !m.stealthed && distanceSq(m.pos, p) <= rSq) near++;
    }
    if (near >= ULT_HINT_NEAR) setUltHint(true);
}
function setUltHint(on) {
    if (ultHint === on) return;
    ultHint = on;
    uiElements.ultBtn.classList.toggle('hint-pulse', on);
}
function markUltTaught() {
    if (ultTaught()) return;
    meta.ultTaught = { ...(meta.ultTaught || {}), [runClass()]: true };
    saveMeta();
    setUltHint(false);
}
function drawUltHint() {
    if (!ultHint) return;
    const t = performance.now() / 1000;
    const r = uiElements.ultBtn.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top - 8 + Math.sin(t * 5) * 4;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#e9c46a';
    ctx.strokeStyle = '#0e0a14';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 12, y - 16); ctx.lineTo(x + 12, y - 16); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.textAlign = 'right';
    drawOutlinedText(classDef().ultimate.hint, Math.min(view.cssW - 8, x + 30), y - 30, 17, '#f4ecd8');
    ctx.restore();
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
        const r = UNIT_UI[0].el.summon.getBoundingClientRect();
        const card = UNIT_UI[0].el.summon.closest('.unit-card').getBoundingClientRect();
        const x = r.left + r.width / 2, y = card.top - 6 + Math.sin(t * 5) * 4;
        ctx.fillStyle = '#e9c46a';
        ctx.strokeStyle = '#0e0a14';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 12, y - 16); ctx.lineTo(x + 12, y - 16); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.textAlign = 'left';
        drawOutlinedText(tutorial.step === 'hold' ? '按住不放：連續召喚、升級' : `召喚第一隻${UNIT_TYPES[UNIT_UI[0].type].name}`, Math.max(8, x - 30), y - 30, 18, '#f4ecd8');
    }
    ctx.restore();
}

function popLevelBadge(type) {
    const card = UNIT_UI.find(u => u.type === type);
    if (!card) return;
    const el = card.el.level;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
}

function updateTimers(deltaTime) {
    // 新手提示還沒走完前，第一波不開始倒數
    if (tutorial && gameState.currentWave === 0) return;
    updateSpawner(deltaTime);
    gameState.ultCooldown = Math.max(0, gameState.ultCooldown - deltaTime);
    // 波與波之間沒有怪打，狂暴不扣時間：不會白白耗在空檔裡
    if (!gameState.betweenWaves) gameState.frenzyTimer = Math.max(0, gameState.frenzyTimer - deltaTime);
    achvCheckTimer -= deltaTime;
    if (achvCheckTimer <= 0) { achvCheckTimer = ACHV_CHECK_EVERY; checkAchievements(); }
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
    const U = UNIT_TYPES[type];
    if (!U || U.upgradeOnly || !unitAllowed(type) || summonBlocked(type)) return false;
    const config = U.cfg(), SummonClass = U.Cls(), unit = gameState.units[type];
    const level = unit.level;
    const cost = getSummonCost(config);
    if (gameState.draftOpen) return false;
    if (U.summon) {
        if (!payCost(cost)) return false;
        gameState.run.recruits++;
        stats().summons++;
        U.summon(level);
        gameState.totalSummons[type]++;
        Sfx.play(combo ? 'summonCombo' : 'summon', combo);
        updateUI();
        ensureMusicPlaying();
        return true;
    }
    if (payCost(cost)) {
        // 傳說「雙生召喚」：有機率多送一隻，多送的那隻冒金光
        const twin = bl('twinSummon') > 0 && Math.random() < BLESSINGS.twinSummon.per;
        gameState.run.recruits++;
        for (let n = 0; n < (twin ? 2 : 1); n++) {
            if (n && summonBlocked(type)) break;
            const spawnPos = gameState.player.getSummonPosition();
            const summon = new SummonClass(spawnPos.x, spawnPos.y, level, gameState.player);
            // 傳說「巨骨」：骷髏每第 N 隻是巨人
            if (type === 'SkeletonWarrior' && bl('giantBones')) {
                gameState.giantTick = (gameState.giantTick || 0) + 1;
                if (gameState.giantTick % BLESSINGS.giantBones.per === 0) { summon.giant = true; summon.refreshStats(); }
            }
            gameState.summons.push(summon);
            stats().summons++;
            spawnParticles(spawnPos.x, spawnPos.y, n ? '#FFD54F' : '#7E57C2', 12, 70, 0.5);
            gameState.totalSummons[type]++;
            unit.count++;
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

// 升級要花多少（職業可以打折，例如戰士的軍餉）
function getUpgradeCost(type) {
    const c = classDef();
    return Math.max(1, Math.round(gameState.units[type].upgradeCost * (c.upgradeCostMult ? c.upgradeCostMult() : 1)));
}

function tryUpgrade(type, combo = 0) {
    if (!UNIT_TYPES[type] || !unitAllowed(type)) return false;
    if (gameState.draftOpen) return false;
    const cost = getUpgradeCost(type);
    if (!payCost(cost)) return false;
    gameState.run.upgrades++;
    levelUpUnit(type);
    Sfx.play(combo ? 'upgradeCombo' : 'upgrade', combo);
    updateUI();
    ensureMusicPlaying();
    return true;
}
// 某個兵種升一級：花費由呼叫端處理（卡片付靈魂；戰士開寶棺拿到的軍餉免費）
function levelUpUnit(type) {
    const unit = gameState.units[type];
    const oldTier = getTier(unit.level);
    unit.level++;
    const newTier = getTier(unit.level);
    unit.upgradeCost += UNIT_TYPES[type].cfg().upgradeCostInc;
    if (classDef().onUpgrade) classDef().onUpgrade(type);
    gameState.summons.forEach(s => {
        if (s.isAlive && s.config.type === type) {
            s.levelUp();
            spawnParticles(s.pos.x, s.pos.y, '#FFD54F', 5, 50, 0.4);
        }
    });
    popLevelBadge(type);
    if (newTier > oldTier) announceEvolution(type, newTier);
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
    if (len > JOYSTICK_RADIUS) {
        // 浮動搖桿：拉出半徑外時底座跟著手指拖過去。底座固定的話，手指拉遠之後要反方向走得先拉回原點，轉向慢半拍
        inputState.pointerStartPos = { x: pos.x - deltaX / len * JOYSTICK_RADIUS, y: pos.y - deltaY / len * JOYSTICK_RADIUS };
    }
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
        const btn = UNIT_UI.find(u => u.type === unitType).el[actionType];
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
let lastShownCrystals = 0;
// 底部的兵種卡：照這一局職業的 cards 產生（buildUnitCards），每張記著是哪種兵與自己的元素
let UNIT_UI = [];
let builtCardsFor = null;
function buildUnitCards() {
    const cards = classDef().cards;
    $id('currency-icon').innerHTML = ICON_SVGS[currencyIcon()] || '';
    const key = cards.join(',');
    if (builtCardsFor === key) return;
    builtCardsFor = key;
    uiElements.unitCards.innerHTML = cards.map(type => {
        const U = UNIT_TYPES[type];
        return `<div class="unit-card panel${U.upgradeOnly ? ' upgrade-only' : ''}" data-unit="${type}">
            <div class="unit-head">
                <div class="portrait"><img src="${U.img}" alt=""><span class="unit-count">0</span><span class="lv-badge">0</span></div>
                <div class="unit-info"><span class="unit-name">${U.name}</span><span class="unit-stars"></span></div>
            </div>
            <div class="unit-btns">
                <button class="btn btn-green" data-act="summon"></button>
                <button class="btn btn-gold" data-act="upgrade"></button>
            </div>
        </div>`;
    }).join('');
    UNIT_UI = cards.map((type, i) => {
        const card = uiElements.unitCards.children[i];
        const el = {
            level: card.querySelector('.lv-badge'), stars: card.querySelector('.unit-stars'), count: card.querySelector('.unit-count'),
            summon: card.querySelector('[data-act="summon"]'), upgrade: card.querySelector('[data-act="upgrade"]'),
        };
        setupHoldableButton(el.summon, 'summon', type);
        setupHoldableButton(el.upgrade, 'upgrade', type);
        return { type, el };
    });
}
// 長按連發：按下開始、放開／滑出／被打斷就停
function setupHoldableButton(button, actionType, unitType) {
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
}

// 升級什麼時候划算，玩家用看的就知道（升級鈕發光），不用自己算：
// 升一級 = 場上每隻同種兵都 +upgradeBonus，等於多出 upgradeBonus × 隻數 隻兵；
// 拿同樣的錢去召喚只買得到 升級價 ÷ 召喚價 隻。前者比較多就是划算。下一級剛好進化（解鎖新能力）也算
function isUpgradeGoodDeal(type, level, summonCost, upgradeCost) {
    if (UNIT_TYPES[type].upgradeOnly || CONFIG.evolution.levels.includes(level + 1) || summonBlocked(type)) return true;
    return UNIT_TYPES[type].cfg().upgradeBonus * gameState.units[type].count * summonCost >= upgradeCost;
}

function starsHtml(tier) {
    const lv = CONFIG.evolution.levels;
    let html = '';
    for (let i = 0; i < lv.length; i++) html += iconHtml('star', i < tier ? 'icon' : 'icon off');
    if (tier < lv.length) html += `<span>Lv${lv[tier]}</span>`;
    return html;
}

function priceButtonHtml(label, cost) {
    return `<span>${label}</span><span class="price">${iconHtml(currencyIcon())}${formatNumberK(cost)}</span>`;
}

function updateUI() {
    const souls = gameState.souls;
    const p = gameState.player;
    if (p) {
        // 持續回血、曬傷是一格一格的小數：顯示時進位（還沒歸零就不會顯示 0）
        setTextIfChanged(uiElements.playerHealthInfo, `${Math.ceil(p.currentHealth)}/${Math.round(p.maxHealth)}`);
        const ratio = p.maxHealth > 0 ? p.currentHealth / p.maxHealth : 0;
        setStyleIfChanged(uiElements.hpFill, 'width', `${Math.round(ratio * 100)}%`);
    }

    setTextIfChanged(uiElements.soulsInfo, formatNumberK(souls));
    if (souls > lastShownSouls && !uiElements.soulsInfo.classList.contains('bump')) uiElements.soulsInfo.classList.add('bump');
    lastShownSouls = souls;
    // 這一局到目前為止賺到的結晶（結束時入帳）：局外貨幣要在局內看得到，才知道是怎麼賺來的
    const crystals = getRunReward();
    if (uiElements.crystalsInfo.textContent !== String(crystals)) {
        if (crystals > lastShownCrystals) uiElements.crystalsInfo.classList.add('bump');
        uiElements.crystalsInfo.textContent = String(crystals);
    }
    lastShownCrystals = crystals;

    // 波次之間顯示「即將來的那一波」，不是剛打完的那一波
    const holding = tutorial && gameState.currentWave === 0;
    const secs = Math.ceil(gameState.timeToNextWave);
    if (gameState.betweenWaves) {
        setTextIfChanged(uiElements.waveInfo, waveLabel(gameState.currentWave + 1));
        setTextIfChanged(uiElements.timerInfo, holding ? '先熟悉操作' : `${secs} 秒後開戰`);
    } else {
        setTextIfChanged(uiElements.waveInfo, waveLabel(gameState.currentWave));
        setTextIfChanged(uiElements.timerInfo, `剩餘 ${countRemainingMonsters()}`);
    }
    uiElements.wavePlate.classList.toggle('urgent', gameState.betweenWaves && !holding && secs <= COUNTDOWN_SECONDS);

    const canAct = !gameState.isPaused && !gameState.gameOver && !gameState.draftOpen;
    for (const u of UNIT_UI) {
        const el = u.el, unit = gameState.units[u.type];
        const level = unit.level;
        const U = UNIT_TYPES[u.type];
        const summonCost = getSummonCost(U.cfg());
        const upgradeCost = getUpgradeCost(u.type);
        setTextIfChanged(el.level, String(level));
        setHtmlIfChanged(el.stars, starsHtml(getTier(level)));
        setTextIfChanged(el.count, formatNumberK(unit.count));
        const capped = summonBlocked(u.type);
        const capLabel = typeof U.capLabel === 'function' ? U.capLabel() : U.capLabel;
        setHtmlIfChanged(el.summon, capped ? `<span>${capLabel || '滿編'}</span>` : priceButtonHtml(U.summonLabel || '召喚', summonCost));
        setHtmlIfChanged(el.upgrade, priceButtonHtml(U.upgradeLabel || '升級', upgradeCost));
        const allowed = unitAllowed(u.type);
        if (el.summon.disabled !== !(canAct && allowed && !capped)) el.summon.disabled = !(canAct && allowed && !capped);
        if (el.upgrade.disabled !== !(canAct && allowed)) el.upgrade.disabled = !(canAct && allowed);
        el.summon.closest('.unit-card').classList.toggle('daily-locked', !allowed);
        const affordSummon = canAfford(summonCost), affordUpgrade = canAfford(upgradeCost);
        el.summon.classList.toggle('cant-afford', !affordSummon);
        el.upgrade.classList.toggle('cant-afford', !affordUpgrade);
        el.upgrade.classList.toggle('good-deal', affordUpgrade && isUpgradeGoodDeal(u.type, level, summonCost, upgradeCost));
    }

    setStyleIfChanged(uiElements.skipWaveBtn, 'display', gameState.betweenWaves && !gameState.gameOver && !(tutorial && gameState.currentWave === 0) ? '' : 'none');
    updateUltButton();
}

// updateUI 每格都跑。寫進 DOM 就算內容一模一樣，瀏覽器也要重新排版、重畫那一塊 ——
// 量過：每格無條件重寫介面，整個瀏覽器多吃約三成顆 CPU 核心，比畫整個戰場還多。所以一律變了才寫
function setHtmlIfChanged(el, html) {
    if (el.dataset.html === html) return;
    el.innerHTML = html;
    el.dataset.html = html;
}
function setTextIfChanged(el, text) {
    if (el.textContent !== text) el.textContent = text;
}
function setStyleIfChanged(el, prop, value) {
    if (el.style[prop] !== value) el.style[prop] = value;
}

function updateUltButton() {
    const btn = uiElements.ultBtn;
    const cd = gameState.ultCooldown;
    const U = classDef().ultimate;
    const off = gameState.gameOver || gameState.isPaused || gameState.draftOpen;
    if (btn.disabled !== off) btn.disabled = off;
    if (cd > 0) {
        // 取整數百分比：肉眼看不出差別，按鈕從每格重畫變成冷卻期間總共重畫一百次
        const done = Math.floor((1 - cd / U.cooldown()) * 100);
        setHtmlIfChanged(btn, `${iconHtml(U.icon)}<span>${Math.ceil(cd)}</span>`);
        if (btn.dataset.cd !== String(done)) {
            btn.dataset.cd = String(done);
            btn.style.background = `conic-gradient(rgba(156, 39, 176, 0.9) ${done}%, #1d1628 ${done}%)`;
        }
        btn.classList.remove('nova-ready');
    } else {
        setHtmlIfChanged(btn, `${iconHtml(U.icon)}<span>${U.name}</span>`);
        if (btn.dataset.cd) { btn.dataset.cd = ''; btn.style.background = ''; }
        btn.classList.add('nova-ready');
    }
}

// 撐過的波數：波次之間代表這一波已經清完；打到一半就只算到上一波
function getSurvivedWaves() {
    return Math.max(0, gameState.betweenWaves ? gameState.currentWave : gameState.currentWave - 1);
}
// 結算明細：結晶是怎麼算出來的（跟 getRunReward 同一套數字）
function renderRewardDetail(survived) {
    const bosses = gameState.totalKills.Boss || 0, mult = curseCrystalMult();
    let html = `<span>${iconHtml('skull')}${survived} 波 ×${CRYSTALS_PER_WAVE}<b>+${survived * CRYSTALS_PER_WAVE}</b></span>`;
    if (bosses > 0) html += `<span>${iconHtml('crown')}首領 ${bosses} 隻 ×${CRYSTALS_PER_BOSS}<b>+${bosses * CRYSTALS_PER_BOSS}</b></span>`;
    if (mult > 1) html += `<span>${iconHtml('flame')}詛咒<b>×${mult.toFixed(1)}</b></span>`;
    if (dailyCrystalMult() > 1) html += `<span>${iconHtml(dailyDef().icon)}每日變異<b>×${DAILY_CRYSTAL_MULT}</b></span>`;
    // 成就的結晶達成當下就入帳了，這裡只是列出來，不算進 getRunReward
    if (gameState.achvCount > 0) html += `<span>${iconHtml('trophy')}成就 ${gameState.achvCount} 個<b>+${gameState.achvCrystals}</b></span>`;
    uiElements.finalRewardDetail.innerHTML = html;
}

function getRunReward() {
    return Math.round((getSurvivedWaves() * CRYSTALS_PER_WAVE + gameState.totalKills.Boss * CRYSTALS_PER_BOSS) * curseCrystalMult() * dailyCrystalMult());
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
        try { SaveStore.set(BEST_WAVE_KEY, String(survived)); } catch (e) { }
    }
    uiElements.finalWaveText.textContent = survived;
    uiElements.bestWaveText.innerHTML = isRecord ? `${iconHtml('trophy')}新紀錄` : `最佳 ${best} 波`;
    uiElements.bestWaveText.classList.toggle('new-record', isRecord);
    const kills = Object.values(gameState.totalKills).reduce((a, b) => a + b, 0);
    const summons = Object.values(gameState.totalSummons).reduce((a, b) => a + b, 0);
    uiElements.finalKills.textContent = formatNumberK(kills);
    uiElements.finalSummons.textContent = formatNumberK(summons);
    uiElements.finalStreak.textContent = formatNumberK(gameState.bestStreak);
    checkAchievements();
    const ranked = lbSubmit(reason);
    const reward = getRunReward();
    meta.crystals += reward;
    renderRewardDetail(survived);
    // 那一天的加倍只算一場：有拿到結晶才算用掉（開了馬上放棄不會白白浪費）
    if (dailyCrystalMult() > 1 && reward > 0) meta.dailyClaimed = gameState.dailyDate;
    saveMeta();
    uiElements.finalReward.innerHTML = `${iconHtml('crystal')}+${reward + gameState.achvCrystals}`;
    uiElements.gameoverMetaBtn.classList.toggle('can-upgrade', canBuyAnyMeta());
    renderBlessingList(uiElements.finalBlessings);
    uiElements.hud.classList.add('hidden');
    showScreen(uiElements.gameOverScreen, true);
    SaveStore.remove(SAVE_KEY);
    pauseMusic();
    const target = lbNextTargetHtml(ranked ? ranked.entry : lbRunNow());
    uiElements.finalTarget.classList.toggle('hidden', !target);
    uiElements.finalTarget.innerHTML = target;
    if (ranked) openLbCongrats(ranked);
}

const SAVE_KEY = 'necromancerGameState_v16_stats_audio';
// 跟存檔分開放：遊戲結束會刪存檔，紀錄要留著
const BEST_WAVE_KEY = 'undeadFrenzy_bestWave';
const SAVE_VERSION = 18;
// v16 是祝福系統之前的存檔，缺的欄位讀取時補預設值即可；v18 起兵種狀態收進 units、多了 classId
const COMPATIBLE_SAVE_VERSIONS = [16, 17, 18];


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
        classId: gameState.classId,
        units: gameState.units,
        totalSummons: gameState.totalSummons,
        totalKills: gameState.totalKills,
        blessings: gameState.blessings,
        pendingDraft: gameState.pendingDraft,
        bestStreak: gameState.bestStreak,
        extraDrafts: gameState.extraDrafts,
        banished: gameState.banished,
        banishLeft: gameState.banishLeft,
        rerollsLeft: gameState.rerollsLeft,
        classExtra: classDef().saveExtra ? classDef().saveExtra() : null,
        relics: gameState.relics.filter(r => !r.done),
        relicTimer: gameState.relicTimer,
        waveSouls: gameState.waveSouls,
        achvCrystals: gameState.achvCrystals,
        run: gameState.run,
        achvCount: gameState.achvCount,
        runTime: gameState.runTime,
        curse: gameState.curse,
        endless: gameState.endless,
        daily: gameState.daily,
        dailyDate: gameState.dailyDate,
    };

    try {
        const savedString = JSON.stringify(stateToSave);
        SaveStore.set(SAVE_KEY, savedString);
    } catch (error) {
        showMessage("儲存失敗!", 1500);
    }
}

function loadGameState() {
    const savedString = SaveStore.get(SAVE_KEY);
    if (savedString) {
        let loadedState;
        try { loadedState = JSON.parse(savedString); }
        catch (error) {
            SaveStore.remove(SAVE_KEY); return false;
        }

        if (!COMPATIBLE_SAVE_VERSIONS.includes(loadedState.saveVersion)) {
            SaveStore.remove(SAVE_KEY); return false;
        }

        resetGameInternalState(false);

        gameState.souls = loadedState.souls ?? CONFIG.player.initialSouls;
        gameState.currentWave = loadedState.currentWave ?? 0;
        gameState.timeToNextWave = loadedState.timeToNextWave ?? CONFIG.wave.betweenTime;
        gameState.betweenWaves = loadedState.betweenWaves ?? true;
        gameState.classId = CLASSES[loadedState.classId] ? loadedState.classId : DEFAULT_CLASS;
        if (classDef().reset) classDef().reset();
        gameState.pendingClassExtra = loadedState.classExtra ?? null;
        buildUnitCards();
        gameState.units = emptyUnits();
        if (loadedState.units) {
            for (const type in loadedState.units) if (gameState.units[type]) Object.assign(gameState.units[type], loadedState.units[type]);
        } else {
            // v17 之前的存檔：三種兵各有自己的欄位
            const legacy = { SkeletonWarrior: ['skeletonWarrior', 'skeletonWarriorLevel', 'skeletonWarriorCount'], EyeMonster: ['eyeMonster', 'eyeMonsterLevel', 'eyeMonsterCount'], Wraith: ['wraith', 'wraithLevel', 'wraithCount'] };
            for (const type in legacy) {
                const [costKey, levelKey, countKey] = legacy[type], u = gameState.units[type];
                u.level = loadedState[levelKey] ?? 0;
                u.count = loadedState[countKey] ?? 0;
                if (loadedState.currentCosts && loadedState.currentCosts[costKey] != null) u.upgradeCost = loadedState.currentCosts[costKey];
            }
        }

        gameState.totalSummons = { ...emptySummonStats(), ...loadedState.totalSummons };
        gameState.totalKills = { ...emptyKillStats(), ...loadedState.totalKills };
        gameState.bestStreak = loadedState.bestStreak ?? 0;
        gameState.blessings = loadedState.blessings ?? {};
        refreshResonance();
        gameState.banished = loadedState.banished ?? [];
        gameState.banishLeft = loadedState.banishLeft ?? 0;
        gameState.rerollsLeft = loadedState.rerollsLeft ?? REROLLS_PER_RUN + metaVal('freeReroll');
        gameState.pendingDraft = loadedState.pendingDraft ?? null;
        gameState.extraDrafts = loadedState.extraDrafts ?? 0;
        gameState.waveSouls = loadedState.waveSouls ?? 0;
        gameState.relics = (loadedState.relics || []).map(r => ({ ...r, life: r.life ?? RELIC_LIFE, pair: r.pair || 0 }));
        gameState.relicTimer = loadedState.relicTimer ?? randomInRange(RELIC_FIRST_DELAY_MIN, RELIC_FIRST_DELAY_MAX);
        gameState.achvCrystals = loadedState.achvCrystals ?? 0;
        gameState.achvCount = loadedState.achvCount ?? 0;
        gameState.runTime = loadedState.runTime ?? 0;
        gameState.run = { ...emptyRunStats(), ...(loadedState.run || {}) };
        gameState.curse = loadedState.curse ?? 0;
        gameState.daily = loadedState.daily ?? null;
        gameState.dailyDate = loadedState.dailyDate ?? null;
        invalidateRunMods();
        // 已經過了最終波的舊存檔直接算進無盡模式，不會再跳一次通關
        gameState.endless = loadedState.endless ?? (gameState.currentWave >= CONFIG.wave.finalWave);
        // 祝福系統之前的存檔：照已經打過的波數補發當初該拿到的祝福選擇
        if (loadedState.saveVersion < 17 && gameState.currentWave >= CONFIG.draft.every) {
            gameState.extraDrafts = Math.floor(gameState.currentWave / CONFIG.draft.every) - 1;
            queueDraft();
        }

        gameState.player = new Player(0, 0);
        snapCamera();
        gameState.player.maxHealth = loadedState.playerMaxHealth ?? classDef().hero.baseHealth;
        gameState.player.currentHealth = loadedState.playerCurrentHealth ?? gameState.player.maxHealth;
        gameState.player.maxHealth = Math.max(1, Math.round(gameState.player.maxHealth));
        gameState.player.currentHealth = Math.min(gameState.player.maxHealth, Math.max(0, Math.round(gameState.player.currentHealth)));

        return true;

    }
    return false;
}

function restoreSummonsFromLoad() {
    if (!gameState.player) return;
    gameState.summons = [];

    for (const type in gameState.units) {
        const unit = gameState.units[type], Cls = UNIT_TYPES[type].Cls();
        for (let i = 0; i < unit.count; i++) {
            const spawnPos = getRandomSpawnPosNearPlayer(40);
            gameState.summons.push(new Cls(spawnPos.x, spawnPos.y, unit.level, gameState.player));
        }
    }
    if (classDef().loadExtra && gameState.pendingClassExtra) classDef().loadExtra(gameState.pendingClassExtra);
    gameState.pendingClassExtra = null;
}

function resetGameInternalState() {
    if (gameState.messageTimeout) clearTimeout(gameState.messageTimeout);
    stopHoldActionInternal();
    holdActionState = { actionType: null, unitType: null, timeoutId: null, intervalId: null, isHolding: false, pointerDownTime: 0 };

    projectilePool.length = 0;
    visualEffectPool.length = 0;
    tutorial = null;
    for (const u of UNIT_UI) u.el.summon.classList.remove('hint-pulse');
    heroHiddenNow = false;

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
        units: emptyUnits(), classId: DEFAULT_CLASS,
        imagesLoaded: gameState.imagesLoaded,
        bgmVolume: meta.bgmVolume,
        musicStarted: musicWasStarted,
        totalSummons: emptySummonStats(),
        totalKills: emptyKillStats(),
        spawnQueue: [], spawnTimer: 0, banner: null,
        blessings: {}, pendingDraft: null, draftOpen: false, ultCooldown: 0, frenzyTimer: 0, extraDrafts: 0,
        waveEvent: null, lastEventWave: 0, streak: 0, streakTimer: 0, bestStreak: 0,
        hazards: [], enemyBolts: [], curse: 0, endless: false, victoryOpen: false,
        resonance: {}, banished: [], banishLeft: 0, rerollsLeft: 0,
        relics: [], relicTimer: 0, relicDrafts: 0, waveSouls: 0, lastWaveSouls: 0,
        bossKills: {}, achvCrystals: 0, achvCount: 0, run: emptyRunStats(), runTime: 0,
    };
    inputState = { isPointerDown: false, pointerStartPos: { x: 0, y: 0 }, pointerCurrentPos: { x: 0, y: 0 }, movementVector: { x: 0, y: 0 }, pointerId: null };
}

// 新的一局（不碰存檔）：永久強化在這裡套用
function setupNewRun(daily = null) {
    resetGameInternalState();
    gameState.classId = selectedClass();
    if (classDef().reset) classDef().reset();
    buildUnitCards();
    gameState.daily = daily ? daily.id : null;
    gameState.dailyDate = daily ? todayKey() : null;
    gameState.curse = daily ? 0 : Math.min(meta.curseSelected || 0, meta.curseUnlocked || 0);
    invalidateRunMods();
    gameState.player = new Player(0, 0);
    gameState.player.maxHealth = Math.round((classDef().hero.baseHealth + metaVal('mageHp')) * runMods().mageHpMult);
    gameState.player.currentHealth = gameState.player.maxHealth;
    gameState.souls = CONFIG.player.initialSouls + metaVal('startSouls');
    gameState.banishLeft = metaVal('banish');
    gameState.rerollsLeft = REROLLS_PER_RUN + metaVal('freeReroll');
    snapCamera();
    [uiElements.gameOverScreen, uiElements.pauseMenu, uiElements.draftScreen].forEach(el => showScreen(el, false));
}

function resetGame(daily = null) {
    SaveStore.remove(SAVE_KEY);
    setupNewRun(daily);
    if (classDef().onRunStart) classDef().onRunStart();
    stats().runs++;
    if (daily) stats().dailyDays[todayKey()] = true;
    saveMeta();
    if (metaLv('headStart') > 0) queueDraft();
    updateUI();
}

function updatePauseMenuStats() {
    uiElements.pauseSummonStats.innerHTML = classDef().cards.map(type =>
        `<div class="stat-cell"><img src="${UNIT_TYPES[type].img}" alt=""><b>${formatNumberK(gameState.totalSummons[type])}</b></div>`).join('');
    renderResonance(uiElements.pauseResonance);
    renderBlessingDetail(uiElements.pauseBlessings);
    uiElements.pauseReward.innerHTML = `結束可得 ${iconHtml('crystal')}+${getRunReward()}`;
}

function togglePause() {
    if (appScreen !== 'playing' || gameState.gameOver || gameState.draftOpen || gameState.victoryOpen) return;
    gameState.isPaused = !gameState.isPaused;
    if (gameState.isPaused) {
        stopHoldAction();
        syncSettingControls();
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


// 這一格主角是不是隱身（怪找目標時每隻都要問，所以每格算一次存起來）
let heroHiddenNow = false;
function updateGame(deltaTime) {
    frameNo++;
    worldTime += deltaTime;
    if (appScreen === 'playing' && !gameState.endless) gameState.runTime += deltaTime;
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
    const targetable = classDef().targetableSummons;
    summonCoarseGrid.rebuild(targetable ? targetable() : gameState.summons);
    monsterGrid.rebuild(gameState.monsters);
    groundMonsterGrid.rebuild(gameState.monsters.filter(m => !m.flying));
    rebuildEyeTargetCounts(gameState.summons);
    gameState.priests = gameState.monsters.filter(m => m.isAlive && m instanceof GravePriestMonster);
    gameState.straggling = !gameState.betweenWaves && countRemainingMonsters() <= STRAGGLER_MAX;

    const cls = classDef();
    if (cls.update && gameState.player) cls.update(deltaTime);
    heroHiddenNow = !!(cls.heroHidden && cls.heroHidden());
    const moveVec = getMoveVector();
    if (gameState.player) gameState.player.update(deltaTime, moveVec);
    updateCamera(deltaTime, moveVec);

    for (let i = 0; i < gameState.summons.length; i++) {
        if (gameState.summons[i].isAlive) gameState.summons[i].update(deltaTime, gameState.monsters, gameState.summons, gameState.player);
    }
    for (let i = 0; i < gameState.monsters.length; i++) {
        if (gameState.monsters[i].isAlive) gameState.monsters[i].update(deltaTime, gameState.player, gameState.summons);
    }
    updateHazards(deltaTime);
    updateRelics(deltaTime);
    updateEnemyBolts(deltaTime);
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

const FRENZY_SPARK_SUMMONS = 40;
const FRENZY_SPARK_COLOR = '#E040FB';
// 大軍狂暴中：畫面四周一圈紫光，隨剩餘時間淡出、帶一點脈動
const FRENZY_PULSE_HZ = 4;
function drawFrenzyOverlay() {
    const t = gameState.frenzyTimer;
    if (t <= 0) return;
    const C = CONFIG.nova;
    const a = Math.min(1, t / C.frenzyDuration * 2) * (0.75 + 0.25 * Math.sin(worldTime * Math.PI * 2 * FRENZY_PULSE_HZ));
    const W = view.cssW, H = view.cssH;
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.6);
    g.addColorStop(0, 'rgba(186, 104, 200, 0)');
    g.addColorStop(1, C.frenzyVignette);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
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
const POINTER_TOMB_COLOR = '#A5D6A7';
const POINTER_NEAREST_COLOR = '#EF9A9A';
const POINTER_PORTRAIT_BOX = 26;
function drawOffscreenPointers() {
    if (appScreen !== 'playing' || !gameState.player) return;
    let bounds = null;
    let anyVisible = false, nearest = null, nearestD = Infinity;
    const p = gameState.player.pos;
    for (const r of gameState.relics) {
        if (r.done) continue;
        const sx = (r.x - camera.x) * view.unitPx, sy = (r.y - camera.y) * view.unitPx;
        if (sx > 0 && sx < view.cssW && sy > 0 && sy < view.cssH) continue;
        bounds = bounds || pointerBounds();
        drawEdgePointer(sx, sy, RELIC_TYPES[r.kind].color, bounds, getIconImage(RELIC_TYPES[r.kind].icon), 22, 22);
    }
    for (let i = 0; i < gameState.monsters.length; i++) {
        const m = gameState.monsters[i];
        if (!m.isAlive || m.stealthed) continue;
        const sx = (m.pos.x - camera.x) * view.unitPx, sy = (m.pos.y - camera.y) * view.unitPx;
        const onScreen = sx > 0 && sx < view.cssW && sy > 0 && sy < view.cssH;
        if (onScreen) { anyVisible = true; continue; }
        const isThief = m instanceof ThiefMonster;
        const isTomb = m instanceof TombstoneMonster;
        if (isThief || isTomb || m instanceof BossMonster) {
            bounds = bounds || pointerBounds();
            const icon = getIconImage(isThief ? 'sack' : 'skull');
            drawEdgePointer(sx, sy, isThief ? POINTER_THIEF_COLOR : isTomb ? POINTER_TOMB_COLOR : POINTER_BOSS_COLOR, bounds, icon, 24, 24);
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
    drawRelicsGround();
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
    drawEnemyBolts();
    // 標題畫面上法師是 HTML 立繪，畫布這邊只留地面
    if (gameState.player && gameState.player.isAlive && appScreen !== 'title') gameState.player.draw(ctx);
    drawRelicsTop();

    for (let i = 0; i < gameState.visualEffects.length; i++) {
        if (gameState.visualEffects[i].isAlive) gameState.visualEffects[i].draw(ctx);
    }
    const drawCls = classDef();
    if (drawCls.drawWorld && gameState.player && appScreen !== 'title') drawCls.drawWorld(ctx);
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
    drawFrenzyOverlay();
    if (drawCls.drawScreen && gameState.player && appScreen !== 'title') drawCls.drawScreen(ctx);
    drawBossBar();
    drawStreak();
    drawOffscreenPointers();
    drawBuffChips();
    drawCountdown();
    drawBanner();
    drawJoystick();
    drawTutorial();
    drawUltHint();
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
// 120Hz 螢幕上 rAF 一秒叫 120 次；畫面 60 fps 就夠順，多出來那一半只是讓手機發燙
const TARGET_FRAME_MS = 1000 / 60;
// 標題畫面背景只是緩緩飄動、省電模式寧可少畫幾格：都用每秒 30 格
const SLOW_FRAME_MS = 1000 / 30;
function frameIntervalMs() {
    return appScreen === 'title' || meta.powerSaver ? SLOW_FRAME_MS : TARGET_FRAME_MS;
}
// rAF 的時間戳會抖，60Hz 螢幕偶爾 16.4ms 就來；不留餘裕的話會被當成太早而整格跳掉
const FRAME_EARLY_TOLERANCE_MS = 2;
let nextFrameAt = 0;
// 停住的那一格已經畫在畫布上了；改變畫布大小會清空畫布，要重畫
let frozenFrameDrawn = false;
function gameLoop(currentTime) {
    animationFrameId = requestAnimationFrame(gameLoop);
    if (currentTime < nextFrameAt - FRAME_EARLY_TOLERANCE_MS) return;
    // 落後（慢手機跑不到 60）就從現在重新對齊，不連續補畫
    nextFrameAt = Math.max(nextFrameAt + frameIntervalMs(), currentTime);
    const elapsed = Math.max(0, (currentTime - loopLastTime) / 1000);
    const deltaTime = Math.min(0.1, elapsed);
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
    if (appScreen !== 'playing' || gameState.isPaused || gameState.gameOver) { resetDynResWindow(); return; }

    const frozen = isWorldFrozen();
    const workStart = performance.now();
    if (!frozen) updateGame(deltaTime);
    updateTutorial();
    updateUltHint();
    // 戰場停住時畫面一格都不會變（教學提示會動，所以有教學時照畫），畫一次留在畫布上就好
    if (!frozen || tutorial || !frozenFrameDrawn) drawGame();
    frozenFrameDrawn = frozen;
    updateUI();
    if (frozen) resetDynResWindow();
    else sampleDynRes(elapsed, performance.now() - workStart, currentTime);
}

// ---------- 自動降解析度（做法參考 PokeBonk） ----------
// 每 DYN_RES_WINDOW_S 秒看一次實際格數：太卡就把解析度降一階，順了再慢慢升回來。
// 只在遊戲程式本身沒吃滿時間時才降 —— 卡在遊戲邏輯的話，少畫幾個像素也不會變順
const DYN_RES_WINDOW_S = 2;
const DYN_RES_STEP = 0.1;
const DYN_RES_MIN = 0.6;
// 門檻跟著目標格數走：60 格時低於 45 降、55 以上升；省電模式 30 格時低於約 23 降
const DYN_RES_LOW_RATIO = 0.75;
const DYN_RES_HIGH_RATIO = 0.92;
// 一格的時間有七成以上花在遊戲程式裡 = 卡在邏輯，不是卡在畫圖
const DYN_RES_JS_BOUND = 0.7;
// 相隔這麼久以上的一格（切到背景、卡頓）不算進順暢度
const DYN_RES_MAX_GAP_S = 0.25;
// 升上去之後很快又降回來，下次升級要等的視窗數就加倍，免得在兩階之間來回跳
const DYN_RES_UP_WAIT_START = 2;
const DYN_RES_UP_WAIT_MAX = 30;
const DYN_RES_BOUNCE_MS = 25000;
const dynRes = { scale: 1, t: 0, frames: 0, work: 0, good: 0, wait: DYN_RES_UP_WAIT_START, lastUp: -Infinity };
function resetDynResWindow() {
    dynRes.t = 0; dynRes.frames = 0; dynRes.work = 0;
}
function sampleDynRes(elapsedS, workMs, now) {
    if (elapsedS > DYN_RES_MAX_GAP_S) { resetDynResWindow(); return; }
    dynRes.t += elapsedS; dynRes.frames++; dynRes.work += workMs;
    if (dynRes.t < DYN_RES_WINDOW_S) return;
    const fps = dynRes.frames / dynRes.t;
    const jsShare = dynRes.work / 1000 / dynRes.t;
    resetDynResWindow();
    const target = 1000 / frameIntervalMs();
    if (fps < target * DYN_RES_LOW_RATIO && jsShare < DYN_RES_JS_BOUND && dynRes.scale > DYN_RES_MIN) {
        if (now - dynRes.lastUp < DYN_RES_BOUNCE_MS) dynRes.wait = Math.min(DYN_RES_UP_WAIT_MAX, dynRes.wait * 2);
        dynRes.good = 0;
        setDynResScale(dynRes.scale - DYN_RES_STEP);
    } else if (fps >= target * DYN_RES_HIGH_RATIO && dynRes.scale < 1) {
        if (++dynRes.good >= dynRes.wait) {
            dynRes.good = 0;
            dynRes.lastUp = now;
            setDynResScale(dynRes.scale + DYN_RES_STEP);
        }
    } else {
        dynRes.good = 0;
    }
}
function setDynResScale(s) {
    s = Math.round(Math.max(DYN_RES_MIN, Math.min(1, s)) * 100) / 100;
    if (s === dynRes.scale) return;
    dynRes.scale = s;
    resizeCanvas();
}

// 選祝福、凱旋畫面打開時戰場停住，背景要看得到，但只畫停住的那一格；暫停與結束則連畫都停
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

// 標題的設定頁與暫停選單各有一組控制項，數值同一份（存在永久資料裡）
function syncSettingControls() {
    uiElements.volumeSlider.value = uiElements.pauseVolumeSlider.value = meta.bgmVolume;
    uiElements.sfxSlider.value = uiElements.pauseSfxSlider.value = meta.sfxVolume;
    uiElements.saverToggle.checked = uiElements.pauseSaverToggle.checked = !!meta.powerSaver;
}
function bindSaverToggles() {
    [uiElements.saverToggle, uiElements.pauseSaverToggle].forEach(t => {
        t.addEventListener('change', e => {
            meta.powerSaver = e.target.checked;
            saveMeta();
            syncSettingControls();
            resetDynResWindow();
            nextFrameAt = 0;
            resizeCanvas();
            // 暫停中迴圈不畫圖，改了解析度畫布會被清空，背後的戰場要補畫一次
            if (appScreen === 'playing') drawGame();
        });
    });
}
function bindVolumeSliders() {
    [uiElements.volumeSlider, uiElements.pauseVolumeSlider].forEach(s => {
        s.addEventListener('input', e => { setMusicVolume(parseFloat(e.target.value)); syncSettingControls(); });
        s.addEventListener('change', saveMeta);
    });
    [uiElements.sfxSlider, uiElements.pauseSfxSlider].forEach(s => {
        s.addEventListener('input', e => {
            setSfxVolume(parseFloat(e.target.value));
            syncSettingControls();
            Sfx.unlock();
            Sfx.play('orb');
        });
        s.addEventListener('change', saveMeta);
    });
}

// iPhone 的 Safari 不支援網頁全螢幕（要加到主畫面才行），已經用全螢幕 App 開著也用不到，這兩種情況不顯示開關
function bindFullscreenToggles() {
    const toggles = [uiElements.fullscreenToggle, uiElements.pauseFullscreenToggle];
    if (!document.fullscreenEnabled || matchMedia('(display-mode: fullscreen)').matches) {
        toggles.forEach(t => t.closest('.setting-row').classList.add('hidden'));
        return;
    }
    const sync = () => toggles.forEach(t => { t.checked = !!document.fullscreenElement; });
    toggles.forEach(t => t.addEventListener('change', e => {
        const req = e.target.checked ? document.documentElement.requestFullscreen() : document.exitFullscreen();
        req.catch(sync);
    }));
    // 全螢幕中按返回鍵 / Esc 會被瀏覽器拿去退出全螢幕，遊戲收不到 popstate / keydown；畫面一縮怪照打，所以退出時直接暫停
    document.addEventListener('fullscreenchange', () => {
        sync();
        if (!document.fullscreenElement && appScreen === 'playing' && !gameState.isPaused && !gameState.gameOver && !gameState.draftOpen && !gameState.victoryOpen) {
            togglePause();
        }
    });
    sync();
}

// 安裝：Chrome / Edge / Android Chrome 會給 beforeinstallprompt，按鈕直接叫出安裝視窗；
// 其他瀏覽器網頁叫不出來（Safari、Samsung、App 內建瀏覽器），按鈕改成打開這個裝置的步驟教學
let installPrompt = null;
function isInstalledApp() {
    return matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true;
}
function installEnv() {
    const ua = navigator.userAgent;
    if (/ Line\//i.test(ua)) return 'line';
    if (/FBAN|FBAV|FB_IAB|Instagram|MicroMessenger|Barcelona/i.test(ua)) return 'inapp';
    if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    if (/Macintosh/.test(ua) && /Safari\//.test(ua) && !/Chrome|Chromium|Edg|Firefox/.test(ua)) return 'macSafari';
    return null;
}
// [圖示, 動作, 補充]；補充只放「找不到時怎麼辦」
const INSTALL_GUIDES = {
    ios: { steps: [['share', '點「分享」', '找不到就先點「⋯」'], ['addHome', '選「加入主畫面」']], note: '主畫面的 App 存檔另外算，目前的進度不會帶過去' },
    android: { steps: [['menuDots', '點瀏覽器的選單'], ['addHome', '選「安裝」或「加到主畫面」']] },
    macSafari: { steps: [['share', '點「分享」'], ['addHome', '選「加入 Dock」']] },
    line: { steps: [], hint: '開啟後再到設定安裝', openExternal: true },
    inapp: { steps: [['menuDots', '點右上角的選單'], ['browser', '選「用瀏覽器開啟」', '開啟後再到設定安裝']] },
};
function refreshInstallButton() {
    uiElements.installBtn.classList.toggle('hidden', isInstalledApp() || (!installPrompt && !installEnv()));
}
function showInstallGuide() {
    const guide = INSTALL_GUIDES[installEnv()];
    uiElements.installSteps.innerHTML = guide.steps.map(([icon, text, hint], i) =>
        `<li><span class="step-no">${i + 1}</span>${iconHtml(icon)}<span class="step-text">${text}${hint ? `<span class="step-hint">${hint}</span>` : ''}</span></li>`).join('');
    uiElements.installSteps.classList.toggle('hidden', !guide.steps.length);
    uiElements.installNote.textContent = guide.note || guide.hint || '';
    uiElements.installNote.classList.toggle('warn', !!guide.note);
    uiElements.installNote.classList.toggle('hidden', !guide.note && !guide.hint);
    uiElements.installOpenBtn.classList.toggle('hidden', !guide.openExternal);
    showScreen(uiElements.installScreen, true);
}
window.addEventListener('beforeinstallprompt', e => {
    installPrompt = e;
    refreshInstallButton();
});
window.addEventListener('appinstalled', () => {
    installPrompt = null;
    refreshInstallButton();
});
// LINE 的參數：網址帶 openExternalBrowser=1 會改用手機預設的瀏覽器開
const LINE_EXTERNAL_PARAM = 'openExternalBrowser';
function bindInstallButton() {
    uiElements.installBtn.addEventListener('click', () => {
        if (!installPrompt) { showInstallGuide(); return; }
        installPrompt.prompt();
        installPrompt.userChoice.then(() => {
            installPrompt = null;
            refreshInstallButton();
        });
    });
    uiElements.installOpenBtn.addEventListener('click', () => {
        const url = new URL(location.href);
        url.hash = '';
        url.searchParams.set(LINE_EXTERNAL_PARAM, '1');
        location.href = url.toString();
    });
    uiElements.installCloseBtn.addEventListener('click', () => showScreen(uiElements.installScreen, false));
    refreshInstallButton();
}

// 裝成 App 與離線遊玩靠 Service Worker；第一次開的時候它還沒接手，把這次載過的檔案清單交給它補進快取
function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
    navigator.serviceWorker.register('sw.js')
        .then(() => navigator.serviceWorker.ready)
        .then(reg => {
            // 背景音樂要等玩家按開始才載入，不在已載入的清單裡，另外補上
            const urls = [location.href.split('#')[0], ...performance.getEntriesByType('resource').map(e => e.name), ...[...document.querySelectorAll('audio[src]')].map(a => a.src)];
            reg.active.postMessage({ type: 'precache', urls });
        })
        .catch(() => { });
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

// 手機系統的「字型大小」：LINE 這類 App 的內建瀏覽器會把字整體放大、框維持原尺寸，而且不理會 text-size-adjust
// （實機截圖：字放大約 1.5～1.8 倍，血量數字超出血條、「召喚」被擠成直排，桌機與一般瀏覽器完全看不到）。
// 量探針實際畫多高得到倍率，把樣式表裡每一條 px 字級除回去：畫出來就是設計的大小，以後新增的介面也自動適用。
// 畫布上的字不受影響（ctx.font 不會被放大），不用處理
const TZ_PROBE_PX = 100;
const TZ_MIN_ZOOM = 1.05;   // 小於這個當成沒放大（量測誤差）
// 只能補一次：量的是不受補償的 #tz-probe，第二次呼叫會量到同樣的倍率、把字級再除一次（介面檢查工具也會呼叫它）
let textZoomCancelled = null;
function cancelTextZoom() {
    if (textZoomCancelled !== null) return textZoomCancelled;
    const probe = document.getElementById('tz-probe');
    if (!probe) return 1;
    const k = probe.getBoundingClientRect().height / TZ_PROBE_PX;
    textZoomCancelled = k > TZ_MIN_ZOOM ? k : 1;
    if (!(k > TZ_MIN_ZOOM)) return 1;
    for (const sheet of document.styleSheets) {
        let rules;
        try { rules = sheet.cssRules; } catch (e) { continue; }   // 跨網域的樣式表（Google Fonts）讀不到，也沒有字級
        for (const rule of rules) {
            if (!rule.style || rule.selectorText === '#tz-probe') continue;
            const m = /^([\d.]+)px$/.exec(rule.style.fontSize);
            if (m) rule.style.fontSize = `${(parseFloat(m[1]) / k).toFixed(2)}px`;
        }
    }
    return k;
}

function init() {
    cancelTextZoom();
    hydrateIcons();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', resizeCanvas);
    setMusicVolume(meta.bgmVolume);
    setSfxVolume(meta.sfxVolume);
    syncSettingControls();
    bindVolumeSliders();
    bindSaverToggles();
    bindFullscreenToggles();
    bindInstallButton();

    canvas.addEventListener('pointerdown', handleCanvasPointerDown);
    canvas.addEventListener('pointermove', handleCanvasPointerMove);
    canvas.addEventListener('pointerup', handleCanvasPointerUp);
    canvas.addEventListener('pointercancel', handleCanvasPointerUp);
    canvas.addEventListener('pointerleave', handleCanvasPointerUp);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handleBackButton);

    buildUnitCards();

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
    onTap(uiElements.titleDailyBtn, startDailyRun);
    uiElements.classPicker.addEventListener('click', (e) => { const b = e.target.closest('[data-class]'); if (b) pickClass(b.dataset.class); });
    onTap(uiElements.titleContinueBtn, continueRun);
    onTap(uiElements.titleMetaBtn, () => openMeta('title'));
    onTap(uiElements.titleSettingsBtn, () => { syncSettingControls(); showScreen(uiElements.settingsScreen, true); });
    onTap(uiElements.settingsCloseBtn, () => { saveMeta(); showScreen(uiElements.settingsScreen, false); });
    onTap(uiElements.metaCloseBtn, closeMeta);
    onTap(uiElements.metaRefundBtn, () => showConfirm('全部退還？', '結晶全數退回，可以重新分配', '退還', refundMeta));
    onTap(uiElements.titleCurseBtn, () => { renderCurse(); showScreen(uiElements.curseScreen, true); });
    onTap(uiElements.curseCloseBtn, () => { showScreen(uiElements.curseScreen, false); refreshTitle(); });
    onTap(uiElements.titleAchvBtn, () => { renderAchievements(); showScreen(uiElements.achvScreen, true); });
    onTap(uiElements.achvCloseBtn, () => showScreen(uiElements.achvScreen, false));
    uiElements.achvTabs.addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) { achvTab = b.dataset.tab; renderAchievements(); } });
    uiElements.achvSubtabs.addEventListener('click', (e) => { const b = e.target.closest('[data-cls]'); if (b) { achvClassTab = b.dataset.cls; renderAchievements(); } });
    onTap(uiElements.titleLbBtn, () => openLeaderboard());
    onTap(uiElements.gameoverLbBtn, () => openLeaderboard());
    onTap(uiElements.finalTarget, () => openLeaderboard(LB_ALL));
    onTap(uiElements.lbCloseBtn, closeLeaderboard);
    uiElements.lbTabs.addEventListener('click', (e) => { const b = e.target.closest('[data-lb-tab]'); if (b) { lbTab = b.dataset.lbTab; renderLeaderboard(); } });
    uiElements.lbList.addEventListener('click', (e) => { const b = e.target.closest('[data-lb]'); if (b) openLbDetail(b.dataset.lb); });
    onTap(uiElements.lbDetailCloseBtn, () => showScreen(uiElements.lbDetail, false));
    onTap(uiElements.lbCongratsOkBtn, closeLbCongrats);
    onTap(uiElements.lbCongratsCloseBtn, closeLbCongrats);
    uiElements.lbNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') closeLbCongrats(); });
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
    onTap(uiElements.skipBtn, skipDraft);
    onTap(uiElements.healBtn, healDraft);
    onTap(uiElements.confirmNo, () => showScreen(uiElements.confirmDialog, false));
    onTap(uiElements.confirmYes, () => {
        showScreen(uiElements.confirmDialog, false);
        const action = confirmAction;
        confirmAction = null;
        if (action) action();
    });
    uiElements.soulsInfo.addEventListener('animationend', () => uiElements.soulsInfo.classList.remove('bump'));
    uiElements.crystalsInfo.addEventListener('animationend', () => uiElements.crystalsInfo.classList.remove('bump'));

    uiElements.ultBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (!useUltimate() && gameState.ultCooldown > 0 && !gameState.isPaused) denyFeedback(uiElements.ultBtn);
    });

    window.addEventListener('keydown', (e) => {
        // 在輸入框打字（排行榜留名字）時，按鍵不能變成移動、召喚、暫停
        if (e.target instanceof HTMLInputElement && e.target.type === 'text') return;
        if (gameState.draftOpen) {
            const idx = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(e.code);
            if (idx >= 0 && gameState.pendingDraft && gameState.pendingDraft.options[idx]) pickBlessing(gameState.pendingDraft.options[idx]);
            return;
        }
        if (appScreen !== 'playing') return;
        if (e.code === 'Escape' || e.code === 'KeyP') { togglePause(); return; }
        if (gameState.isPaused || gameState.gameOver) return;
        if (e.code === 'Space') { e.preventDefault(); useUltimate(); return; }
        if (MOVE_KEYS[e.code]) { keysDown.add(e.code); e.preventDefault(); ensureMusicPlaying(); return; }
        const card = UNIT_UI[UNIT_HOTKEYS[e.code]];
        if (card) { e.shiftKey ? tryUpgrade(card.type) : trySummon(card.type); }
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
        registerServiceWorker();
    });
}

async function boot() {
    await SaveStore.ready;
    await SaveStore.adopt([META_KEY, SAVE_KEY, BEST_WAVE_KEY]);
    Object.assign(meta, loadMeta());
    // 裝成 App 的才要求「不要自動清掉」：一般分頁要求的話 Firefox 會跳出詢問
    if (matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches && navigator.storage && navigator.storage.persist) {
        navigator.storage.persist();
    }
    init();
}

// 等所有腳本（各職業的 warrior.js…）都載完、登記好自己，才開始
window.addEventListener('DOMContentLoaded', boot);