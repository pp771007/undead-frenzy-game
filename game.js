const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 400;

const uiElements = {
    waveInfo: document.getElementById('wave-info'),
    timerInfo: document.getElementById('timer-info'),
    soulsInfo: document.getElementById('souls-info'),
    playerHealthInfo: document.getElementById('player-health-info'),
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
        initialSouls: 15,
        avoidanceRadius: 15,
        magnetRadius: 75,
    },
    skeletonWarrior: {
        type: 'SkeletonWarrior', baseHealth: 30, baseAttack: 5, radius: 10,
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
        type: 'EyeMonster', baseHealth: 8, baseAttack: 15, radius: 11,
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
        type: 'BasicMelee', baseHealth: 12, baseAttack: 5, radius: 12,
        imageName: 'basic_melee', imgScaleMultiplier: 5,
        attackRange: 20, attackSpeed: 1.0, moveSpeed: 50, color: '#EF5350',
        soulDrop: 1, waveSpeedIncreaseFactor: 0.01,
    },
    fastMeleeMonster: {
        type: 'FastMelee', baseHealth: 36, baseAttack: 9, radius: 11,
        imageName: 'fast_melee', imgScaleMultiplier: 3,
        attackRange: 18, attackSpeed: 1.2, moveSpeed: 95, color: '#FF7043',
        soulDrop: 3, waveSpeedIncreaseFactor: 0.012,
        minWave: 10, waveInterval: 3,
    },
    armoredMeleeMonster: {
        type: 'ArmoredMelee', baseHealth: 120, baseAttack: 30, radius: 15,
        imageName: 'armored_melee', imgScaleMultiplier: 6,
        attackRange: 22, attackSpeed: 0.8, moveSpeed: 30, color: '#B71C1C',
        soulDrop: 4, waveSpeedIncreaseFactor: 0.008,
        minWave: 20, waveInterval: 5,
    },
    wave: {
        baseTime: 30, betweenTime: 5, monsterScaleInterval: 5, monsterScaleFactor: 0.10,
        basicMonsterBaseCount: 1, basicMonsterIncrement: 1,
        LATE_GAME_WAVE_THRESHOLD: 50,
        EXTRA_SCALING_PER_WAVE_AFTER_50: 0.007,
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
    holdingButton: {
        holdDelay: 350,
        repeatInterval: 150,
    },
    audio: {
        initialVolume: 0.3,
        initialSfxVolume: 0.5,
    }
};

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
    totalSummons: { SkeletonWarrior: 0, EyeMonster: 0, Wraith: 0 },
    totalKills: { BasicMelee: 0, FastMelee: 0, ArmoredMelee: 0 },
};

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
function getRandomPositionOutsideCanvas() {
    const side = Math.floor(Math.random() * 4);
    const margin = 30;
    let x, y;
    switch (side) {
        case 0: x = Math.random() * canvas.width; y = -margin; break;
        case 1: x = canvas.width + margin; y = Math.random() * canvas.height; break;
        case 2: x = Math.random() * canvas.width; y = canvas.height + margin; break;
        case 3: x = -margin; y = Math.random() * canvas.height; break;
    }
    return { x, y };
}
function randomInRange(min, max) { return Math.random() * (max - min) + min; }
function getRandomSpawnPosNearCenter(radius = 30) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    let x = canvas.width / 2 + Math.cos(angle) * distance;
    let y = canvas.height / 2 + Math.sin(angle) * distance;
    x = Math.max(10, Math.min(canvas.width - 10, x));
    y = Math.max(10, Math.min(canvas.height - 10, y));
    return { x, y };
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

// ---------- 上色圖快取（受擊閃白、精英金光、腐屍綠） ----------
const TINT_MAX_SIZE = 256;
const tintCache = new Map();
function getTintedImage(img, color, strength) {
    const key = `${img.src}|${color}|${strength}`;
    let c = tintCache.get(key);
    if (c) return c;
    const scale = Math.min(1, TINT_MAX_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
    c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.naturalWidth * scale));
    c.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0, c.width, c.height);
    g.globalCompositeOperation = 'source-atop';
    g.globalAlpha = strength;
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
    tintCache.set(key, c);
    return c;
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
    wave: { gap: 0.5, fn: s => { s.tone(330, 0.12, { type: 'triangle', vol: 0.14 }); s.tone(440, 0.22, { type: 'triangle', vol: 0.14, delay: 0.12 }); } },
    gameover: { gap: 1, fn: s => s.tone(392, 0.9, { type: 'triangle', vol: 0.2, slideTo: 130 }) },
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
            ctx.save();
            ctx.translate(this.pos.x, this.pos.y);
            ctx.scale(this.facingDirection, 1);
            const img = this.tint ? getTintedImage(this.image, this.tint, this.tintStrength || 0.45) : this.image;
            ctx.drawImage(img, -w / 2, -h / 2, w, h);
            if (this.hitFlash > 0) {
                ctx.globalAlpha = Math.min(1, this.hitFlash / CONFIG.visuals.hitFlashDuration) * 0.85;
                ctx.drawImage(getTintedImage(this.image, '#FFFFFF', 1), -w / 2, -h / 2, w, h);
            }
            ctx.restore();
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
        this.pos.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.pos.x));
        this.pos.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.pos.y));

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

        spawnX = Math.max(this.radius + 5, Math.min(canvas.width - this.radius - 5, spawnX));
        spawnY = Math.max(this.radius + 5, Math.min(canvas.height - this.radius - 5, spawnY));
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

    applyLevelStats() {
        const multiplier = 1 + (this.level * this.config.upgradeBonus);
        this.maxHealth = Math.round(this.config.baseHealth * multiplier);
        this.attack = (this.config.baseAttack > 0) ? (this.config.baseAttack * multiplier) : 0;
        this.attackSpeed = this.config.attackSpeed;
        this.moveSpeed = this.config.moveSpeed;

        if (this.config.type === 'EyeMonster') {
            this.attackRange = this.config.attackRange + (this.level * this.config.attackRangeUpgrade);
        } else {
            this.attackRange = this.config.attackRange;
        }
        this.attackRangeSq = this.attackRange * this.attackRange;

        if (this.config.type === 'Wraith') {
            this.slowRadius = this.config.slowRadiusBase + (this.level * this.config.slowRadiusUpgrade);
            this.slowAmount = this.config.slowAmountBase + (this.level * this.config.slowAmountUpgrade);
            this.slowAmount = Math.min(this.slowAmount, 0.9);
            this.slowRadiusSq = this.slowRadius * this.slowRadius;
            this.buffRadius = this.slowRadius;
            this.buffRadiusSq = this.slowRadiusSq;
        } else {
            this.slowRadius = 0;
            this.slowAmount = 0;
            this.buffRadius = 0;
            this.buffRadiusSq = 0;
        }

        if (this.currentHealth > 0 && this.level > 0 && this.config.upgradeBonus > 0) {
            const healthGainPerLevel = Math.round(this.config.baseHealth * this.config.upgradeBonus);
            if (healthGainPerLevel > 0) {
                this.currentHealth += healthGainPerLevel;
            }
        }
        this.maxHealth = Math.round(this.maxHealth);
        this.currentHealth = Math.round(Math.min(this.currentHealth, this.maxHealth));
    }

    update(deltaTime, monsters, otherSummons, player) {
        if (!this.isAlive) return;
        this.tickFlash(deltaTime);

        this.buffedMoveSpeedMultiplier = 1.0;
        this.buffedAttackSpeedMultiplier = 1.0;

        if (this.attackCooldown > 0) { this.attackCooldown -= deltaTime; }

        if (this.config.type === 'EyeMonster') {
            const retreatCheckDistSq = this.config.retreatCheckDistance * this.config.retreatCheckDistance;
            let enemyNearby = monsters.some(m => m.isAlive && distanceSq(this.pos, m.pos) < retreatCheckDistSq);
            this.isRetreatingFromMonster = enemyNearby;
        } else {
            this.isRetreatingFromMonster = false;
        }

        if (this.config.type === 'Wraith') {
            let monsterInRangeForAura = monsters.some(m => m.isAlive && distanceSq(this.pos, m.pos) <= this.slowRadiusSq);
            this.isRetreatingToPlayer = monsterInRangeForAura;
            if (this.isRetreatingToPlayer) {
                this.target = null;
                this.isReturning = false;
            }
        }

        if (this.target && (!this.target.isAlive || distanceSq(this.pos, this.target.pos) > this.config.targetSearchRadius * this.config.targetSearchRadius * 1.5)) {
            this.target = null;
        }

        if (!this.target && !this.isRetreatingFromMonster && !this.isRetreatingToPlayer) {
            if (this.config.type === 'EyeMonster') {
                this.target = this.findBestTarget(monsters, otherSummons);
            } else if (this.config.type !== 'Wraith') {
                this.target = this.findNearestMonster(monsters);
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

        const avoidanceVector = this.avoidOverlap(otherSummons, player);

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
                this.wanderTargetPos.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.wanderTargetPos.x));
                this.wanderTargetPos.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.wanderTargetPos.y));
                this.wanderTimer = randomInRange(this.config.wanderIntervalMin, this.config.wanderIntervalMax);
            }
            if (this.isWandering) {
                const distToWanderTargetSq = distanceSq(this.pos, this.wanderTargetPos);
                if (distToWanderTargetSq > 5 * 5) {
                    const wanderDir = normalizeVector({ x: this.wanderTargetPos.x - this.pos.x, y: this.wanderTargetPos.y - this.pos.y });
                    const wanderSpeed = this.moveSpeed * this.config.wanderSpeedFactor * this.buffedMoveSpeedMultiplier;
                    const wanderAvoidance = this.avoidOverlap(otherSummons, player);
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


        this.pos.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.pos.x));
        this.pos.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.pos.y));

        if (this.attackCooldown <= 0 && !this.isRetreatingFromMonster) {
            if (this.config.type === 'Wraith') {
                if (monsters.some(m => m.isAlive && distanceSq(this.pos, m.pos) <= this.slowRadiusSq)) {
                    this.applySlowAura(monsters);
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

    avoidOverlap(otherSummons, player) {
        let totalPushX = 0;
        let totalPushY = 0;
        const myAvoidanceRadius = this.config.avoidanceRadius;
        const myAvoidanceForce = this.config.avoidanceForce;

        otherSummons.forEach(other => {
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
                }
            }
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


    findNearestMonster(monsters) {
        let nearestTarget = null;
        let minDistanceSq = this.config.targetSearchRadius * this.config.targetSearchRadius;
        for (let i = 0; i < monsters.length; i++) {
            const monster = monsters[i];
            if (monster.isAlive) {
                const dSq = distanceSq(this.pos, monster.pos);
                if (dSq < minDistanceSq) {
                    minDistanceSq = dSq;
                    nearestTarget = monster;
                }
            }
        }
        return nearestTarget;
    }


    findBestTarget(monsters, otherSummons) {
        let potentialTargets = [];
        for (let i = 0; i < monsters.length; i++) {
            const m = monsters[i];
            if (m.isAlive && distanceSq(this.pos, m.pos) <= this.attackRangeSq) {
                potentialTargets.push(m);
            }
        }


        if (potentialTargets.length === 0) {
            return this.findNearestMonster(monsters);
        }

        let targetCounts = {};
        potentialTargets.forEach(pt => targetCounts[pt.id] = 0);

        otherSummons.forEach(other => {
            if (other !== this && other.isAlive && other.config.type === 'EyeMonster' && other.target && other.target.isAlive) {
                if (targetCounts.hasOwnProperty(other.target.id)) {
                    targetCounts[other.target.id]++;
                }
            }
        });

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

        const multiplier = 1 + (this.level * this.config.upgradeBonus);
        const currentAttackDamage = (this.config.baseAttack > 0) ? Math.round(this.config.baseAttack * multiplier) : 0;

        if (this.config.type === 'EyeMonster') {
            const projectile = getProjectileFromPool();
            projectile.init(
                this.pos.x, this.pos.y,
                this.target,
                this.config,
                currentAttackDamage
            );
            gameState.projectiles.push(projectile);
        } else if (this.config.type === 'SkeletonWarrior') {
            this.target.takeDamage(currentAttackDamage);
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

    applySlowAura(monsters) {
        if (this.config.type !== 'Wraith') return;
        for (let i = 0; i < monsters.length; i++) {
            const monster = monsters[i];
            if (monster.isAlive && distanceSq(this.pos, monster.pos) <= this.slowRadiusSq) {
                monster.applySlow(this.slowAmount, this.config.slowDuration);
            }
        }
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

    applyBuffAura(otherSummons) {
        if (!this.isAlive) return;
        for (let i = 0; i < otherSummons.length; i++) {
            const summon = otherSummons[i];
            if (summon.isAlive && summon !== this && distanceSq(this.pos, summon.pos) <= this.buffRadiusSq) {
                if (summon.config.type === 'SkeletonWarrior' && summon.config.wraithBuffMoveSpeedMultiplier) {
                    summon.buffedMoveSpeedMultiplier = Math.max(summon.buffedMoveSpeedMultiplier, summon.config.wraithBuffMoveSpeedMultiplier);
                } else if (summon.config.type === 'EyeMonster' && summon.config.wraithBuffAttackSpeedMultiplier) {
                    summon.buffedAttackSpeedMultiplier = Math.max(summon.buffedAttackSpeedMultiplier, summon.config.wraithBuffAttackSpeedMultiplier);
                }
            }
        }
    }

    drawAura(ctx) {
        if (!this.isAlive || !this.config.auraColor) return;
        const gradient = ctx.createRadialGradient(this.pos.x, this.pos.y, this.radius * 0.5, this.pos.x, this.pos.y, this.slowRadius);
        gradient.addColorStop(0, this.config.auraColor + '00');
        gradient.addColorStop(0.7, this.config.auraColor + '70');
        gradient.addColorStop(1, this.config.auraColor + '0F');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.slowRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    draw(ctx) {
        super.draw(ctx);
    }

    attackTarget() { }

    die() {
        if (!this.isAlive) return;

        const explosionDamageMultiplier = 1 + (this.level * this.config.upgradeBonus);
        const explosionDamage = Math.round(CONFIG.wraith.explosionBaseDamage * explosionDamageMultiplier);
        const explosionRadiusSq = this.slowRadiusSq;

        for (let i = 0; i < gameState.monsters.length; i++) {
            const monster = gameState.monsters[i];
            if (monster.isAlive && distanceSq(this.pos, monster.pos) <= explosionRadiusSq) {
                monster.takeDamage(explosionDamage);
            }
        }


        const effect = getVisualEffectFromPool(ExplosionEffect);
        if (effect) {
            effect.init(this.pos, this.slowRadius);
            gameState.visualEffects.push(effect);
        }
        spawnParticles(this.pos.x, this.pos.y, '#FFB74D', 24, 160, 0.5, 3);
        addShake(6);
        Sfx.play('explode');

        this.isAlive = false;
        gameState.wraithCount--;
        updateUI();
    }
}

class Projectile {
    constructor(startX, startY, target, shooterConfig, damage) {
        this.init(startX, startY, target, shooterConfig, damage);
    }

    init(startX, startY, target, shooterConfig, damage) {
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
                this.target.takeDamage(this.damage);
                this.isAlive = false;
                return;
            }
        } else {
            const distToOriginalTargetSq = distanceSq(this.pos, this.targetPos);
            if (distToOriginalTargetSq < (this.radius * 3) * (this.radius * 3)) {
                this.isAlive = false;
            }
        }

        const margin = 50;
        if (this.pos.x < -margin || this.pos.x > canvas.width + margin ||
            this.pos.y < -margin || this.pos.y > canvas.height + margin) {
            this.isAlive = false;
        }
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
        this.image = obj.tint ? getTintedImage(obj.image, obj.tint, obj.tintStrength || 0.45) : obj.image;
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
        const magnet = CONFIG.player.magnetRadius;
        if (this.banked || dist < magnet) this.attracted = true;
        if (this.attracted && this.age > c.attractDelay) {
            const sp = c.attractSpeed + this.age * 60;
            this.vel.x = dx / (dist || 1) * sp;
            this.vel.y = dy / (dist || 1) * sp;
        } else {
            const f = Math.max(0, 1 - c.friction * deltaTime);
            this.vel.x *= f; this.vel.y *= f;
        }
        this.pos.x = Math.max(4, Math.min(canvas.width - 4, this.pos.x + this.vel.x * deltaTime));
        this.pos.y = Math.max(4, Math.min(canvas.height - 4, this.pos.y + this.vel.y * deltaTime));
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

class Monster extends GameObject {
    constructor(x, y, config, waveNumber) {
        super(x, y, config.radius, config.color, config.imageName, config.imgScaleMultiplier);
        this.config = config;
        this.id = `m_${Date.now()}_${Math.random()}`;
        this.attackCooldown = 0;
        this.target = null;
        this.speedMultiplier = 1.0;
        this.slowTimer = 0;
        this.applyWaveScaling(waveNumber);
        this.currentHealth = this.maxHealth;
    }

    applyWaveScaling(wave) {
        const scaleLevel = Math.floor((wave - 1) / CONFIG.wave.monsterScaleInterval);
        let baseStatMultiplier = 1 + (scaleLevel * CONFIG.wave.monsterScaleFactor);

        const lateGameThreshold = CONFIG.wave.LATE_GAME_WAVE_THRESHOLD;
        const extraScalingRate = CONFIG.wave.EXTRA_SCALING_PER_WAVE_AFTER_50;
        if (wave > lateGameThreshold) {
            const wavesPastThreshold = wave - lateGameThreshold;
            const lateGameBonus = wavesPastThreshold * extraScalingRate;
            baseStatMultiplier += lateGameBonus;
        }


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

        if (this.slowTimer > 0) {
            this.slowTimer -= deltaTime;
            if (this.slowTimer <= 0) {
                this.speedMultiplier = 1.0;
                this.slowTimer = 0;
            }
        }
        this.moveSpeed = this.baseMoveSpeed * this.speedMultiplier;

        if (this.attackCooldown > 0) { this.attackCooldown -= deltaTime; }

        this.findTarget(player, summons);

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
            const dSq = distanceSq(this.pos, player.pos);
            if (dSq < minDistanceSq) { minDistanceSq = dSq; closestTarget = player; }
        }
        for (let i = 0; i < summons.length; i++) {
            const summon = summons[i];
            if (summon.isAlive) {
                const dSq = distanceSq(this.pos, summon.pos);
                if (dSq < minDistanceSq) { minDistanceSq = dSq; closestTarget = summon; }
            }
        }
        this.target = closestTarget;
    }


    attackTarget() {
        if (!this.target || !this.target.isAlive) return;
        this.target.takeDamage(this.attack);

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
        dropSouls(this.pos.x, this.pos.y, this.config.soulDrop);
        spawnParticles(this.pos.x, this.pos.y, '#CE93D8', 8, 60, 0.6);
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
    constructor(x, y, waveNumber) { super(x, y, CONFIG.basicMeleeMonster, waveNumber); }
}
class FastMeleeMonster extends Monster {
    constructor(x, y, waveNumber) { super(x, y, CONFIG.fastMeleeMonster, waveNumber); }
}
class ArmoredMeleeMonster extends Monster {
    constructor(x, y, waveNumber) { super(x, y, CONFIG.armoredMeleeMonster, waveNumber); }
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

    const basicCount = CONFIG.wave.basicMonsterBaseCount + (waveNum - 1) * CONFIG.wave.basicMonsterIncrement;
    for (let i = 0; i < basicCount; i++) {
        const spawnPos = getRandomPositionOutsideCanvas();
        gameState.monsters.push(new BasicMeleeMonster(spawnPos.x, spawnPos.y, waveNum));
    }

    const fastConfig = CONFIG.fastMeleeMonster;
    if (waveNum >= fastConfig.minWave) {
        const fastCount = 1 + Math.floor((waveNum - fastConfig.minWave) / fastConfig.waveInterval);
        for (let i = 0; i < fastCount; i++) {
            const spawnPos = getRandomPositionOutsideCanvas();
            gameState.monsters.push(new FastMeleeMonster(spawnPos.x, spawnPos.y, waveNum));
        }
    }

    const armoredConfig = CONFIG.armoredMeleeMonster;
    if (waveNum >= armoredConfig.minWave) {
        const armoredCount = 1 + Math.floor((waveNum - armoredConfig.minWave) / armoredConfig.waveInterval);
        for (let i = 0; i < armoredCount; i++) {
            const spawnPos = getRandomPositionOutsideCanvas();
            gameState.monsters.push(new ArmoredMeleeMonster(spawnPos.x, spawnPos.y, waveNum));
        }
    }

    updateUI();
}

function checkWaveEndCondition() {
    let monstersAlive = false;
    for (let i = 0; i < gameState.monsters.length; i++) {
        if (gameState.monsters[i].isAlive) {
            monstersAlive = true;
            break;
        }
    }

    if (!gameState.betweenWaves && !monstersAlive) {
        gameState.betweenWaves = true;
        gameState.timeToNextWave = CONFIG.wave.betweenTime;
        bankAllOrbs();
        gameState.projectiles.forEach(returnProjectileToPool);
        gameState.projectiles = [];
        gameState.visualEffects.forEach(returnVisualEffectToPool);
        gameState.visualEffects = [];
        saveGameState();
        updateUI();
    }
}

function updateTimers(deltaTime) {
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

    cost = gameState.currentCosts[costKey];
    costIncrement = CONFIG.upgradeCostIncrements[costKey];

    if (gameState.souls >= cost) {
        gameState.souls -= cost;
        gameState[levelKey]++;
        gameState.currentCosts[costKey] += costIncrement;
        gameState.summons.forEach(s => {
            if (s.isAlive && s.config.type === type) {
                s.levelUp();
                spawnParticles(s.pos.x, s.pos.y, '#FFD54F', 5, 50, 0.4);
            }
        });
        Sfx.play('upgrade');
        updateUI();
        if (!holdActionState.isHolding || holdActionState.actionType !== 'upgrade') {
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
    if (deltaX * deltaX + deltaY * deltaY > 5 * 5) {
        inputState.movementVector = normalizeVector({ x: deltaX, y: deltaY });
    } else {
        inputState.movementVector = { x: 0, y: 0 };
    }
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
    return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
    };
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
    if (gameState.isPaused || holdActionState.isHolding) return;

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
        uiElements.playerHealthInfo.textContent = `HP: ${gameState.player.currentHealth}/${gameState.player.maxHealth}`;
    } else {
        uiElements.playerHealthInfo.textContent = `HP: -/-`;
    }

    uiElements.soulsInfo.textContent = `靈魂: ${formatNumberK(souls)}`;
    uiElements.waveInfo.textContent = `第${gameState.currentWave}波`;

    if (gameState.betweenWaves && gameState.currentWave >= 0) {
        uiElements.timerInfo.textContent = `下一波: 倒數 ${Math.ceil(gameState.timeToNextWave)} 秒`;
    } else if (!gameState.betweenWaves) {
        let aliveOnMap = 0;
        for (let i = 0; i < gameState.monsters.length; i++) {
            if (gameState.monsters[i].isAlive) aliveOnMap++;
        }
        uiElements.timerInfo.textContent = `怪物剩餘: ${aliveOnMap}`;
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

        uiMap.level.textContent = `Lv ${level}`;
        uiMap.count.textContent = count;

        uiMap.summonBtn.textContent = `召喚\n(${formatNumberK(summonCost)}魂)`;
        uiMap.upgradeBtn.textContent = `升級\n(${formatNumberK(upgradeCost)}魂)`;

        setButtonState(uiMap.summonBtn, !gameState.isPaused && !gameState.gameOver, summonCost);
        setButtonState(uiMap.upgradeBtn, !gameState.isPaused && !gameState.gameOver, upgradeCost);
    }

    updateUnitUI('SkeletonWarrior');
    updateUnitUI('EyeMonster');
    updateUnitUI('Wraith');

    uiElements.pauseResumeBtn.textContent = gameState.isPaused ? '繼續' : '暫停';
    uiElements.pauseResumeBtn.disabled = gameState.gameOver;
    uiElements.restartGameBtn.disabled = gameState.gameOver;
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
        uiElements.finalWaveText.textContent = `您存活了 ${gameState.currentWave - 1} 波。`;
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
const SAVE_VERSION = 16;


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

        if (loadedState.saveVersion !== SAVE_VERSION) {
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
        gameState.totalSummons = loadedState.totalSummons ?? { SkeletonWarrior: 0, EyeMonster: 0, Wraith: 0 };
        gameState.totalKills = loadedState.totalKills ?? { BasicMelee: 0, FastMelee: 0, ArmoredMelee: 0 };

        gameState.player = new Player(canvas.width / 2, canvas.height / 2);
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
        const spawnPos = getRandomSpawnPosNearCenter(40);
        const summon = new SkeletonWarrior(spawnPos.x, spawnPos.y, gameState.skeletonWarriorLevel, gameState.player);
        gameState.summons.push(summon);
    }
    for (let i = 0; i < gameState.eyeMonsterCount; i++) {
        const spawnPos = getRandomSpawnPosNearCenter(40);
        const summon = new EyeMonster(spawnPos.x, spawnPos.y, gameState.eyeMonsterLevel, gameState.player);
        gameState.summons.push(summon);
    }
    for (let i = 0; i < gameState.wraithCount; i++) {
        const spawnPos = getRandomSpawnPosNearCenter(40);
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
        totalSummons: { SkeletonWarrior: 0, EyeMonster: 0, Wraith: 0 },
        totalKills: { BasicMelee: 0, FastMelee: 0, ArmoredMelee: 0 },
    };
    inputState = { isPointerDown: false, pointerStartPos: { x: 0, y: 0 }, pointerCurrentPos: { x: 0, y: 0 }, movementVector: { x: 0, y: 0 }, pointerId: null };
}

function resetGame() {
    localStorage.removeItem(SAVE_KEY);
    resetGameInternalState(true);
    gameState.player = new Player(canvas.width / 2, canvas.height / 2);
    uiElements.gameOverScreen.style.display = 'none';
    uiElements.pauseMenu.style.display = 'none';
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
}

function togglePause() {
    if (gameState.gameOver) return;

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
    updateTimers(deltaTime);

    const wraiths = [];
    const nonWraiths = [];
    for (let i = 0; i < gameState.summons.length; i++) {
        const s = gameState.summons[i];
        if (s.isAlive) {
            if (s.config.type === 'Wraith') wraiths.push(s);
            else nonWraiths.push(s);
        }
    }
    wraiths.forEach(wraith => wraith.applyBuffAura(nonWraiths));

    if (gameState.player) gameState.player.update(deltaTime, getMoveVector());

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

const SHAKE_BG_MARGIN = 16;

function drawGame() {
    ctx.save();
    if (gameState.shake > 0) {
        ctx.translate((Math.random() * 2 - 1) * gameState.shake, (Math.random() * 2 - 1) * gameState.shake);
    }
    if (images.background) {
        ctx.drawImage(images.background, -SHAKE_BG_MARGIN, -SHAKE_BG_MARGIN, canvas.width + SHAKE_BG_MARGIN * 2, canvas.height + SHAKE_BG_MARGIN * 2);
    } else {
        ctx.fillStyle = '#333';
        ctx.fillRect(-SHAKE_BG_MARGIN, -SHAKE_BG_MARGIN, canvas.width + SHAKE_BG_MARGIN * 2, canvas.height + SHAKE_BG_MARGIN * 2);
    }
    for (let i = 0; i < gameState.orbs.length; i++) gameState.orbs[i].draw(ctx);

    for (let i = 0; i < gameState.summons.length; i++) {
        const s = gameState.summons[i];
        if (s.isAlive && s.config.type === 'Wraith' && s.drawAura) {
            s.drawAura(ctx);
        }
    }

    for (let i = 0; i < gameState.monsters.length; i++) {
        if (gameState.monsters[i].isAlive) gameState.monsters[i].draw(ctx);
    }
    for (let i = 0; i < gameState.summons.length; i++) {
        if (gameState.summons[i].isAlive) gameState.summons[i].draw(ctx);
    }
    for (let i = 0; i < gameState.projectiles.length; i++) {
        if (gameState.projectiles[i].isAlive) gameState.projectiles[i].draw(ctx);
    }
    if (gameState.player && gameState.player.isAlive) gameState.player.draw(ctx);

    for (let i = 0; i < gameState.visualEffects.length; i++) {
        if (gameState.visualEffects[i].isAlive) gameState.visualEffects[i].draw(ctx);
    }
    const ps = gameState.particles;
    for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
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

    if (gameState.hurtFlash > 0) {
        const a = gameState.hurtFlash / CONFIG.visuals.hurtFlashDuration;
        const g = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.height * 0.35, canvas.width / 2, canvas.height / 2, canvas.width * 0.6);
        g.addColorStop(0, 'rgba(200,0,0,0)');
        g.addColorStop(1, `rgba(200,0,0,${(0.45 * a).toFixed(2)})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}


let animationFrameId = null;
function gameLoop(currentTime) {
    if (!gameState.imagesLoaded) {
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

    updateGame(deltaTime);
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

    window.addEventListener('keydown', (e) => {
        if (e.code === 'Escape' || e.code === 'KeyP') { togglePause(); return; }
        if (gameState.isPaused || gameState.gameOver) return;
        if (MOVE_KEYS[e.code]) { keysDown.add(e.code); e.preventDefault(); ensureMusicPlaying(); return; }
        const unit = UNIT_HOTKEYS[e.code];
        if (unit) { e.shiftKey ? tryUpgrade(unit) : trySummon(unit); }
    });
    window.addEventListener('keyup', (e) => keysDown.delete(e.code));
    window.addEventListener('blur', () => keysDown.clear());

    uiElements.restartGameBtn.addEventListener('click', showRestartConfirmDialog);
    uiElements.restartConfirmYes.addEventListener('click', handleRestartGame);
    uiElements.restartConfirmNo.addEventListener('click', hideRestartConfirmDialog);

    loadAllImages().then(() => {
        if (loadGameState()) {
            restoreSummonsFromLoad();
            updateUI();
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