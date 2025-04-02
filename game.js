const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 400;

const uiElements = {
    waveInfo: document.getElementById('wave-info'),
    timerInfo: document.getElementById('timer-info'),
    soulsInfo: document.getElementById('souls-info'),
    playerHealthInfo: document.getElementById('player-health-info'), // Changed from player-level/stats
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
};

const CONFIG = {
    player: {
        baseHealth: 50, baseMoveSpeed: 90, radius: 10, color: '#03A9F4',
        iconColor: '#FFFFFF',
        initialSouls: 15,
        avoidanceRadius: 15,
        // REMOVED upgrade properties
    },
    skeletonWarrior: {
        type: 'SkeletonWarrior', baseHealth: 25, baseAttack: 5, radius: 8,
        attackRange: 25, attackSpeed: 1.0, moveSpeed: 80, color: '#FFFFFF',
        iconColor: '#424242',
        upgradeBonus: 0.10, // Affects health/attack
        summonCost: 3,
        upgradeCostBase: 10,
        upgradeCostInc: 5,
        targetSearchRadius: 150, returnDistance: 50,
        avoidanceRadius: 18, avoidanceForce: 80,
        playerAvoidanceForce: 60,
        wanderRadius: 20, wanderSpeedFactor: 0.3, wanderIntervalMin: 1.5, wanderIntervalMax: 3.0,
        wraithBuffMoveSpeedMultiplier: 2.0, // NEW: Speed buff from Wraith
    },
    eyeMonster: {
        type: 'EyeMonster', baseHealth: 8, baseAttack: 7, radius: 9,
        attackRange: 120,
        attackRangeUpgrade: 3,
        attackSpeed: 0.8, moveSpeed: 60, color: '#A1887F',
        iconColor: '#000000',
        upgradeBonus: 0.10, // Affects health/attack
        summonCost: 8,
        upgradeCostBase: 15,
        upgradeCostInc: 8,
        targetSearchRadius: 180, returnDistance: 30,
        avoidanceRadius: 16, avoidanceForce: 70,
        playerAvoidanceForce: 50,
        wanderRadius: 15, wanderSpeedFactor: 0.3, wanderIntervalMin: 1.8, wanderIntervalMax: 3.5,
        projectileColor: '#F06292',
        projectileSpeed: 300,
        projectileRadius: 3,
        retreatCheckDistance: 40, // NEW: Distance to check for nearby monsters
        retreatSpeedFactor: 1.1, // NEW: Speed when retreating
        wraithBuffAttackSpeedMultiplier: 2.0, // NEW: Attack speed buff from Wraith
    },
    wraith: {
        type: 'Wraith', baseHealth: 15, baseAttack: 0, radius: 9,
        attackRange: 0, // No direct attack
        slowRadiusBase: 80, // Used for slow and buff aura
        slowRadiusUpgrade: 5,
        slowAmountBase: 0.4,
        slowAmountUpgrade: 0.025,
        slowDuration: 1.5, attackSpeed: 1.0, moveSpeed: 55, color: '#4DB6AC',
        iconColor: '#E0F2F1',
        upgradeBonus: 0.15, // Affects health, slow radius/amount
        summonCost: 10,
        upgradeCostBase: 20,
        upgradeCostInc: 10,
        targetSearchRadius: 200, returnDistance: 40,
        avoidanceRadius: 25,
        avoidanceForce: 100,
        wraithAvoidanceMultiplier: 1.5,
        playerAvoidanceForce: 70,
        retreatSpeedFactor: 0.4, // Only when monsters are near *it*
        wanderRadius: 35, wanderSpeedFactor: 0.25, wanderIntervalMin: 2.0, wanderIntervalMax: 4.0,
        buffRadiusProperty: 'slowRadius', // NEW: Indicates which property holds the buff radius
    },
    basicMeleeMonster: {
        type: 'BasicMelee', baseHealth: 12, baseAttack: 3, radius: 10,
        attackRange: 20, attackSpeed: 1.0, moveSpeed: 50, color: '#EF5350',
        borderColor: '#C62828', soulDrop: 1, waveSpeedIncreaseFactor: 0.01,
        iconColor: '#FFFFFF'
    },
    fastMeleeMonster: {
        type: 'FastMelee', baseHealth: 8, baseAttack: 2, radius: 8,
        attackRange: 18, attackSpeed: 1.2, moveSpeed: 95, color: '#FF7043',
        borderColor: '#D84315', soulDrop: 1, waveSpeedIncreaseFactor: 0.012,
        iconColor: '#FFFFFF'
    },
    armoredMeleeMonster: {
        type: 'ArmoredMelee', baseHealth: 35, baseAttack: 4, radius: 12,
        attackRange: 22, attackSpeed: 0.8, moveSpeed: 30, color: '#B71C1C',
        borderColor: '#880E4F', soulDrop: 2, waveSpeedIncreaseFactor: 0.008,
        iconColor: '#FFFFFF'
    },
    wave: {
        baseTime: 30, betweenTime: 5, monsterScaleInterval: 5, monsterScaleFactor: 0.10,
        spawnChanceBasic: 0.60,
        spawnChanceFast: 0.25,
        spawnChanceArmored: 0.15,
        fastMonsterMinWave: 3,
        armoredMonsterMinWave: 5,
    },
    visuals: {
        slashEffectDuration: 0.15,
        slashEffectColor: 'rgba(255, 255, 255, 0.8)',
        slashEffectWidth: 2,
        slashEffectArcRadius: 15,
        slashEffectArcAngle: Math.PI / 3,
    },
    summoning: { // NEW config for hold-to-summon
        holdDelay: 2000, // ms
        repeatInterval: 150, // ms
    }
};

CONFIG.upgradeCosts = {
    // REMOVED player cost
    skeletonWarrior: CONFIG.skeletonWarrior.upgradeCostBase,
    eyeMonster: CONFIG.eyeMonster.upgradeCostBase,
    wraith: CONFIG.wraith.upgradeCostBase,
};

CONFIG.upgradeCostIncrements = {
    // REMOVED player increment
    skeletonWarrior: CONFIG.skeletonWarrior.upgradeCostInc,
    eyeMonster: CONFIG.eyeMonster.upgradeCostInc,
    wraith: CONFIG.wraith.upgradeCostInc,
};

let gameState = {
    player: null, summons: [], monsters: [],
    projectiles: [],
    visualEffects: [],
    souls: CONFIG.player.initialSouls,
    currentWave: 0,
    monstersToSpawnThisWave: 0, monstersSpawnedThisWave: 0,
    timeToNextWave: CONFIG.wave.betweenTime, betweenWaves: true,
    gameOver: false, lastTime: 0, messageTimeout: null,
    isPaused: false,
    // REMOVED playerLevel
    skeletonWarriorLevel: 0, eyeMonsterLevel: 0, wraithLevel: 0,
    skeletonWarriorCount: 0, eyeMonsterCount: 0, wraithCount: 0,
    currentCosts: { ...CONFIG.upgradeCosts },
};

// Hold-to-summon state
let holdSummonState = {
    type: null,
    timeoutId: null,
    intervalId: null,
    isHolding: false
};

let inputState = {
    isPointerDown: false, pointerStartPos: { x: 0, y: 0 },
    pointerCurrentPos: { x: 0, y: 0 }, movementVector: { x: 0, y: 0 }
};

// --- Utility Functions ---
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

// --- Base GameObject Class ---
class GameObject {
    constructor(x, y, radius, color) {
        this.pos = { x, y };
        this.radius = radius;
        this.color = color;
        this.isAlive = true;
        this.id = `go_${Date.now()}_${Math.random()}`; // Unique ID for targeting etc.
    }
    draw(ctx) { }
    update(deltaTime) { }
}

// --- Player Class ---
class Player extends GameObject {
    constructor(x, y) {
        super(x, y, CONFIG.player.radius, CONFIG.player.color);
        this.maxHealth = CONFIG.player.baseHealth;
        this.currentHealth = this.maxHealth;
        this.moveSpeed = CONFIG.player.baseMoveSpeed;
    }
    update(deltaTime, moveVec) {
        if (!this.isAlive) return;
        const moveX = moveVec.x * this.moveSpeed * deltaTime;
        const moveY = moveVec.y * this.moveSpeed * deltaTime;
        this.pos.x += moveX;
        this.pos.y += moveY;
        this.pos.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.pos.x));
        this.pos.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.pos.y));
    }
    takeDamage(amount) {
        if (!this.isAlive) return;
        this.currentHealth -= amount;
        this.currentHealth = Math.max(0, Math.round(this.currentHealth));
        if (this.currentHealth <= 0) {
            this.die();
        }
        updateUI(); // Update health display
    }
    // REMOVED applyUpgrade method
    die() {
        this.isAlive = false;
        console.log("Player died, setting gameOver=true");
        gameState.gameOver = true;
        showGameOver();
    }
    getSummonPosition() {
        const direction = normalizeVector(inputState.movementVector);
        const spawnDist = this.radius + 15;
        let spawnX = this.pos.x + spawnDist;
        let spawnY = this.pos.y;
        // Spawn opposite to movement direction if moving, else to the right
        if (direction.x !== 0 || direction.y !== 0) {
            spawnX = this.pos.x - direction.x * spawnDist;
            spawnY = this.pos.y - direction.y * spawnDist;
        }
        spawnX = Math.max(this.radius + 5, Math.min(canvas.width - this.radius - 5, spawnX));
        spawnY = Math.max(this.radius + 5, Math.min(canvas.height - this.radius - 5, spawnY));
        return { x: spawnX, y: spawnY };
    }
    draw(ctx) {
        if (!this.isAlive) return;
        // Simplified stick figure drawing remains the same
        const iconColor = this.color;
        ctx.strokeStyle = iconColor;
        ctx.lineWidth = 2;
        ctx.fillStyle = iconColor;

        const headRadius = this.radius * 0.4;
        const bodyHeight = this.radius * 0.8;
        const armY = this.pos.y - this.radius * 0.1;
        const legY = this.pos.y + this.radius * 0.3;
        const armWidth = this.radius * 0.5;
        const legWidth = this.radius * 0.3;

        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y - this.radius * 0.3, headRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y - this.radius * 0.3 + headRadius);
        ctx.lineTo(this.pos.x, legY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.pos.x - armWidth, armY + bodyHeight * 0.4);
        ctx.lineTo(this.pos.x, armY);
        ctx.lineTo(this.pos.x + armWidth, armY + bodyHeight * 0.4);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.pos.x - legWidth, this.pos.y + this.radius * 0.8);
        ctx.lineTo(this.pos.x, legY);
        ctx.lineTo(this.pos.x + legWidth, this.pos.y + this.radius * 0.8);
        ctx.stroke();

        // Health bar drawing moved to updateUI for the top bar display
    }
}

// --- Summon Unit Base Class ---
class SummonUnit extends GameObject {
    constructor(x, y, config, level, playerTransform) {
        super(x, y, config.radius, config.color);
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
        this.buffedMoveSpeedMultiplier = 1.0; // For Wraith buff
        this.buffedAttackSpeedMultiplier = 1.0; // For Wraith buff

        if (this.config.type === 'Wraith') {
            this.isRetreatingToPlayer = false; // Specific Wraith behavior
        }
        if (this.config.type === 'EyeMonster') {
            this.isRetreatingFromMonster = false; // Specific EyeMonster behavior
        }
    }

    applyLevelStats() {
        const multiplier = 1 + (this.level * this.config.upgradeBonus);
        // Apply base stats multiplied by level bonus
        this.maxHealth = Math.round(this.config.baseHealth * multiplier);
        this.attack = (this.config.baseAttack > 0) ? (this.config.baseAttack * multiplier) : 0;
        this.attackSpeed = this.config.attackSpeed;
        this.moveSpeed = this.config.moveSpeed;

        // Apply type-specific level bonuses
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
            // Buff radius uses the same property as slow radius
            this.buffRadius = this.slowRadius;
            this.buffRadiusSq = this.slowRadiusSq;
        } else {
            this.slowRadius = 0;
            this.slowAmount = 0;
            this.buffRadius = 0;
            this.buffRadiusSq = 0;
        }

        // Heal on level up (if already damaged)
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

        // Reset buffs each frame before applying new ones
        this.buffedMoveSpeedMultiplier = 1.0;
        this.buffedAttackSpeedMultiplier = 1.0;

        if (this.attackCooldown > 0) { this.attackCooldown -= deltaTime; }

        // Eye Monster Retreat Logic
        if (this.config.type === 'EyeMonster') {
            const retreatCheckDistSq = this.config.retreatCheckDistance * this.config.retreatCheckDistance;
            let enemyNearby = monsters.some(m => m.isAlive && distanceSq(this.pos, m.pos) < retreatCheckDistSq);
            this.isRetreatingFromMonster = enemyNearby;
        } else {
            this.isRetreatingFromMonster = false;
        }

        // Wraith Retreat Logic (different condition)
        if (this.config.type === 'Wraith') {
            let monsterInRangeForAura = monsters.some(m => m.isAlive && distanceSq(this.pos, m.pos) <= this.slowRadiusSq);
            this.isRetreatingToPlayer = monsterInRangeForAura; // Retreat if *any* monster is in aura range
            if (this.isRetreatingToPlayer) {
                this.target = null; // Stop targeting if retreating
                this.isReturning = false;
            }
        }


        // Target Acquisition / Clearing
        if (this.target && (!this.target.isAlive || distanceSq(this.pos, this.target.pos) > this.config.targetSearchRadius * this.config.targetSearchRadius * 1.5)) {
            this.target = null;
        }

        if (!this.target && !this.isRetreatingFromMonster && !this.isRetreatingToPlayer) {
            if (this.config.type === 'EyeMonster') {
                this.target = this.findBestTarget(monsters, otherSummons);
            } else if (this.config.type !== 'Wraith') { // Wraiths don't attack directly
                this.target = this.findNearestMonster(monsters);
            }
            if (this.target) {
                this.isReturning = false;
                this.isWandering = false;
            }
        }

        // Return to Player Logic
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
            this.isReturning = false; // Cancel return if we have a target or are retreating
        }


        // --- Movement Calculation ---
        let moveDirection = { x: 0, y: 0 };
        let currentMoveSpeed = this.moveSpeed * this.buffedMoveSpeedMultiplier; // Apply Wraith speed buff
        let isIdle = true;

        if (this.isRetreatingFromMonster && this.config.type === 'EyeMonster') {
            isIdle = false;
            const directionToPlayer = normalizeVector({ x: this.playerTransform.pos.x - this.pos.x, y: this.playerTransform.pos.y - this.pos.y });
            moveDirection = directionToPlayer;
            currentMoveSpeed *= this.config.retreatSpeedFactor;
            this.target = null; // Don't attack while retreating
        } else if (this.isRetreatingToPlayer && this.config.type === 'Wraith') {
            isIdle = false;
            const directionToPlayer = normalizeVector({ x: this.playerTransform.pos.x - this.pos.x, y: this.playerTransform.pos.y - this.pos.y });
            moveDirection = directionToPlayer;
            currentMoveSpeed *= this.config.retreatSpeedFactor; // Wraith specific retreat speed
        }
        else if (this.target) {
            isIdle = false;
            const targetDistSq = distanceSq(this.pos, this.target.pos);
            const engageRangeSq = this.attackRangeSq;
            if (targetDistSq > engageRangeSq * 0.95) { // Move closer if outside 95% of attack range
                moveDirection = normalizeVector({ x: this.target.pos.x - this.pos.x, y: this.target.pos.y - this.pos.y });
            } else { // In range, stop moving towards target
                moveDirection = { x: 0, y: 0 };
            }
        }
        else if (this.isReturning) {
            isIdle = false;
            const playerPos = this.playerTransform.pos;
            const distToPlayerSq = distanceSq(this.pos, playerPos);
            const returnThresholdSq = this.config.returnDistance * this.config.returnDistance;
            // Keep moving until reasonably close
            if (distToPlayerSq > returnThresholdSq * 0.5) {
                moveDirection = normalizeVector({ x: playerPos.x - this.pos.x, y: playerPos.y - this.pos.y });
            } else {
                this.isReturning = false; // Stop when close enough
                moveDirection = { x: 0, y: 0 };
            }
        }

        // --- Avoidance ---
        const avoidanceVector = this.avoidOverlap(otherSummons, player);

        // Combine movement and avoidance
        let finalMove = { x: moveDirection.x * currentMoveSpeed, y: moveDirection.y * currentMoveSpeed };
        finalMove.x += avoidanceVector.x;
        finalMove.y += avoidanceVector.y;

        // Apply final movement
        if (finalMove.x !== 0 || finalMove.y !== 0) {
            this.pos.x += finalMove.x * deltaTime;
            this.pos.y += finalMove.y * deltaTime;
            isIdle = false; // If avoidance is active, not truly idle for wandering
        }


        // --- Wandering ---
        if (isIdle) {
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
                    this.pos.x += wanderDir.x * wanderSpeed * deltaTime;
                    this.pos.y += wanderDir.y * wanderSpeed * deltaTime;
                } else {
                    this.isWandering = false;
                }
            }
        } else {
            this.isWandering = false; // Stop wandering if doing something else
        }


        // --- Boundary Clamp ---
        this.pos.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.pos.x));
        this.pos.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.pos.y));

        // --- Attacking ---
        if (this.attackCooldown <= 0 && !this.isRetreatingFromMonster) {
            if (this.config.type === 'Wraith') {
                // Wraiths apply aura passively (handled elsewhere or could trigger here)
                // Let's trigger the slow application check here
                if (monsters.some(m => m.isAlive && distanceSq(this.pos, m.pos) <= this.slowRadiusSq)) {
                    this.applySlowAura(monsters); // Apply slow effect
                    this.attackCooldown = 1.0 / this.attackSpeed; // Cooldown for aura pulse
                }
            }
            else if (this.target) {
                const targetDistSq = distanceSq(this.pos, this.target.pos);
                if (targetDistSq <= this.attackRangeSq) {
                    this.attackTarget();
                }
            }
        }
    }


    // Combined Avoidance Logic (minor adjustments from original)
    avoidOverlap(otherSummons, player) {
        let totalPushX = 0; let totalPushY = 0;
        let avoidanceRadius = this.config.avoidanceRadius;
        let avoidanceForce = this.config.avoidanceForce;
        const isThisWraith = this.config.type === 'Wraith';

        otherSummons.forEach(other => {
            if (other !== this && other.isAlive) {
                let currentAvoidanceRadius = Math.max(avoidanceRadius, other.config.avoidanceRadius);
                let currentAvoidanceForce = avoidanceForce;
                const isOtherWraith = other.config.type === 'Wraith';

                if (isThisWraith && isOtherWraith && this.config.wraithAvoidanceMultiplier) {
                    currentAvoidanceRadius *= this.config.wraithAvoidanceMultiplier;
                    currentAvoidanceForce *= this.config.wraithAvoidanceMultiplier;
                }
                const currentAvoidanceRadiusSq = currentAvoidanceRadius * currentAvoidanceRadius;

                const dSq = distanceSq(this.pos, other.pos);
                if (dSq < currentAvoidanceRadiusSq && dSq > 0.01) {
                    const distance = Math.sqrt(dSq);
                    const pushDirectionX = (this.pos.x - other.pos.x) / distance;
                    const pushDirectionY = (this.pos.y - other.pos.y) / distance;
                    // Stronger push when closer
                    const pushStrength = (1.0 - (distance / currentAvoidanceRadius)) * (1.0 - (distance / currentAvoidanceRadius));
                    totalPushX += pushDirectionX * pushStrength * currentAvoidanceForce;
                    totalPushY += pushDirectionY * pushStrength * currentAvoidanceForce;
                }
            }
        });

        // Avoid Player
        if (player && player.isAlive && this.config.playerAvoidanceForce) {
            const combinedAvoidanceRadius = avoidanceRadius + CONFIG.player.avoidanceRadius;
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

        // Limit max avoidance speed/force
        const maxAvoidanceSpeed = 150; // Pixels per second push limit
        const avoidanceMagSq = totalPushX * totalPushX + totalPushY * totalPushY;
        if (avoidanceMagSq > maxAvoidanceSpeed * maxAvoidanceSpeed) {
            const scale = maxAvoidanceSpeed / Math.sqrt(avoidanceMagSq);
            totalPushX *= scale;
            totalPushY *= scale;
        }

        return { x: totalPushX, y: totalPushY };
    }

    // Find nearest monster (for non-Eye Monsters)
    findNearestMonster(monsters) {
        let nearestTarget = null;
        let minDistanceSq = this.config.targetSearchRadius * this.config.targetSearchRadius;
        monsters.forEach(monster => {
            if (monster.isAlive) {
                const dSq = distanceSq(this.pos, monster.pos);
                if (dSq < minDistanceSq) {
                    minDistanceSq = dSq;
                    nearestTarget = monster;
                }
            }
        });
        return nearestTarget;
    }

    // NEW: Eye Monster targeting logic
    findBestTarget(monsters, otherSummons) {
        // 1. Find all monsters within attack range
        let potentialTargets = monsters.filter(m => m.isAlive && distanceSq(this.pos, m.pos) <= this.attackRangeSq);

        if (potentialTargets.length === 0) {
            // If none in range, maybe check search radius for *any* target?
            // For now, return null if none strictly in attack range.
            return this.findNearestMonster(monsters); // Fallback to nearest if none in range
            // return null;
        }

        // 2. Count how many *other* Eye Monsters are targeting each potential target
        let targetCounts = {};
        potentialTargets.forEach(pt => targetCounts[pt.id] = 0);

        otherSummons.forEach(other => {
            if (other !== this && other.isAlive && other.config.type === 'EyeMonster' && other.target && other.target.isAlive) {
                if (targetCounts.hasOwnProperty(other.target.id)) {
                    targetCounts[other.target.id]++;
                }
            }
        });

        // 3. Find the minimum target count among potential targets
        let minCount = Infinity;
        potentialTargets.forEach(pt => {
            minCount = Math.min(minCount, targetCounts[pt.id]);
        });

        // 4. Filter potential targets to only those with the minimum count
        let bestCandidates = potentialTargets.filter(pt => targetCounts[pt.id] === minCount);

        // 5. If only one, that's the target
        if (bestCandidates.length === 1) {
            return bestCandidates[0];
        }

        // 6. If multiple candidates have the minimum count, choose the closest among them
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

        // Fallback (shouldn't normally be reached if potentialTargets > 0)
        return potentialTargets[0] || null;
    }


    attackTarget() {
        if (!this.target || !this.target.isAlive) return;

        // Calculate damage based on level
        const multiplier = 1 + (this.level * this.config.upgradeBonus);
        const currentAttackDamage = (this.config.baseAttack > 0) ? Math.round(this.config.baseAttack * multiplier) : 0;

        if (this.config.type === 'EyeMonster') {
            const projectile = new Projectile(
                this.pos.x, this.pos.y,
                this.target,
                this.config,
                currentAttackDamage // Pass calculated damage
            );
            gameState.projectiles.push(projectile);
        } else if (this.config.type === 'SkeletonWarrior') { // Only warriors attack directly now
            this.target.takeDamage(currentAttackDamage);
            // Add slash effect for melee
            const effect = new SlashEffect(this.pos, this.target.pos);
            gameState.visualEffects.push(effect);
        }
        // Apply cooldown, considering Wraith buff for Eye Monsters
        let cooldownDuration = 1.0 / this.attackSpeed;
        if (this.config.type === 'EyeMonster') {
            cooldownDuration /= this.buffedAttackSpeedMultiplier;
        }
        this.attackCooldown = cooldownDuration;
    }

    applySlowAura(monsters) {
        if (this.config.type !== 'Wraith') return;
        monsters.forEach(monster => {
            if (monster.isAlive && distanceSq(this.pos, monster.pos) <= this.slowRadiusSq) {
                monster.applySlow(this.slowAmount, this.config.slowDuration);
            }
        });
    }

    takeDamage(amount) {
        if (!this.isAlive) return;
        this.currentHealth -= amount;
        this.currentHealth = Math.max(0, Math.round(this.currentHealth));
        if (this.currentHealth <= 0) {
            this.die();
        }
    }

    levelUp() {
        this.level++;
        this.applyLevelStats();
        console.log(`${this.config.type} 升級至 ${this.level} 級`);
        updateUI();
    }

    die() {
        this.isAlive = false;
        console.log(`${this.config.type} 死亡.`);
        switch (this.config.type) {
            case 'SkeletonWarrior': gameState.skeletonWarriorCount--; break;
            case 'EyeMonster': gameState.eyeMonsterCount--; break;
            case 'Wraith': gameState.wraithCount--; break;
        }
        updateUI();
    }

    drawHealthBar(ctx) {
        if (this.isAlive && this.currentHealth < this.maxHealth) {
            const barWidth = this.radius * 1.6; const barHeight = 3;
            const barYOffset = (this.config.type === 'Wraith' || this.config.type === 'EyeMonster') ? this.radius * 1.2 : this.radius * 1.5;
            const barX = this.pos.x - barWidth / 2;
            const barY = this.pos.y - barYOffset - barHeight - 3;
            const healthPercent = this.currentHealth / this.maxHealth;
            ctx.fillStyle = '#555'; ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : (healthPercent > 0.2 ? '#FFC107' : '#F44336');
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        }
    }
}

// --- Specific Summon Classes (Draw methods remain mostly the same) ---

class SkeletonWarrior extends SummonUnit {
    constructor(x, y, level, playerTransform) {
        super(x, y, CONFIG.skeletonWarrior, level, playerTransform);
    }
    draw(ctx) { // Drawing logic as before
        if (!this.isAlive) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(this.pos.x, this.pos.y, this.radius * 0.6, this.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.config.iconColor;
        const eyeSize = this.radius * 0.2;
        const eyeY = this.pos.y - this.radius * 0.15;
        const eyeLX = this.pos.x - this.radius * 0.25;
        const eyeRX = this.pos.x + this.radius * 0.25;
        ctx.beginPath(); ctx.arc(eyeLX, eyeY, eyeSize, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(eyeRX, eyeY, eyeSize, 0, Math.PI * 2); ctx.fill();

        ctx.strokeStyle = this.config.iconColor; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.pos.x - this.radius * 0.3, this.pos.y + this.radius * 0.3);
        ctx.lineTo(this.pos.x + this.radius * 0.3, this.pos.y + this.radius * 0.3);
        ctx.stroke();

        this.drawHealthBar(ctx);
    }
}

class EyeMonster extends SummonUnit {
    constructor(x, y, level, playerTransform) {
        super(x, y, CONFIG.eyeMonster, level, playerTransform);
    }
    draw(ctx) { // Drawing logic as before
        if (!this.isAlive) return;
        const outerRadius = this.radius;
        const scleraRadius = this.radius * 0.85;
        const pupilRadius = this.radius * 0.4;

        ctx.fillStyle = this.color; ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, outerRadius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFFFFF'; ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, scleraRadius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = this.config.iconColor; ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, pupilRadius, 0, Math.PI * 2); ctx.fill();

        this.drawHealthBar(ctx);
    }
}

class Wraith extends SummonUnit {
    constructor(x, y, level, playerTransform) {
        super(x, y, CONFIG.wraith, level, playerTransform);
    }

    // NEW: Apply buffs to nearby allies
    applyBuffAura(otherSummons) {
        if (!this.isAlive) return;
        otherSummons.forEach(summon => {
            if (summon.isAlive && summon !== this && distanceSq(this.pos, summon.pos) <= this.buffRadiusSq) {
                if (summon.config.type === 'SkeletonWarrior' && summon.config.wraithBuffMoveSpeedMultiplier) {
                    summon.buffedMoveSpeedMultiplier = Math.max(summon.buffedMoveSpeedMultiplier, summon.config.wraithBuffMoveSpeedMultiplier);
                } else if (summon.config.type === 'EyeMonster' && summon.config.wraithBuffAttackSpeedMultiplier) {
                    summon.buffedAttackSpeedMultiplier = Math.max(summon.buffedAttackSpeedMultiplier, summon.config.wraithBuffAttackSpeedMultiplier);
                }
            }
        });
    }

    drawAura(ctx) { // Draw the visual slow/buff aura
        if (!this.isAlive) return;
        const gradient = ctx.createRadialGradient(this.pos.x, this.pos.y, this.radius * 0.5, this.pos.x, this.pos.y, this.slowRadius); // Use slowRadius for visual
        gradient.addColorStop(0, this.color + '00');
        gradient.addColorStop(0.8, this.color + '2A');
        gradient.addColorStop(1, this.color + '0A');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.slowRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    draw(ctx) { // Drawing logic as before
        if (!this.isAlive) return;
        ctx.fillStyle = this.color; ctx.beginPath();
        const headRadius = this.radius * 0.8; const bodyHeight = this.radius * 1.5; const tailWidth = this.radius * 1.2;
        ctx.arc(this.pos.x, this.pos.y - headRadius * 0.2, headRadius, Math.PI, 0);
        ctx.quadraticCurveTo(this.pos.x + headRadius * 1.2, this.pos.y + bodyHeight * 0.5, this.pos.x + tailWidth * 0.3, this.pos.y + bodyHeight);
        ctx.quadraticCurveTo(this.pos.x, this.pos.y + bodyHeight * 0.8, this.pos.x - tailWidth * 0.3, this.pos.y + bodyHeight);
        ctx.quadraticCurveTo(this.pos.x - headRadius * 1.2, this.pos.y + bodyHeight * 0.5, this.pos.x - headRadius, this.pos.y - headRadius * 0.2 + headRadius);
        ctx.closePath(); ctx.fill();

        ctx.fillStyle = this.config.iconColor;
        const eyeSize = this.radius * 0.25; const eyeY = this.pos.y - headRadius * 0.1;
        ctx.beginPath(); ctx.arc(this.pos.x - this.radius * 0.3, eyeY, eyeSize, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(this.pos.x + this.radius * 0.3, eyeY, eyeSize, 0, Math.PI * 2); ctx.fill();

        this.drawHealthBar(ctx);
    }
    // Wraith doesn't directly attack
    attackTarget() { }
}

// --- Projectile Class ---
class Projectile extends GameObject {
    constructor(startX, startY, target, shooterConfig, damage) { // Accept pre-calculated damage
        super(startX, startY, shooterConfig.projectileRadius, shooterConfig.projectileColor);
        this.target = target;
        this.speed = shooterConfig.projectileSpeed;
        this.damage = damage; // Use passed damage
        this.targetPos = { ...target.pos }; // Store initial target pos
        this.direction = normalizeVector({ x: this.targetPos.x - startX, y: this.targetPos.y - startY });
    }

    update(deltaTime) {
        if (!this.isAlive) return;

        this.pos.x += this.direction.x * this.speed * deltaTime;
        this.pos.y += this.direction.y * this.speed * deltaTime;

        // Check collision with current target position if alive
        if (this.target.isAlive) {
            const distToTargetSq = distanceSq(this.pos, this.target.pos);
            // Increased hit radius for easier collision
            const hitRadiusSq = (this.radius + this.target.radius + 3) * (this.radius + this.target.radius + 3);

            if (distToTargetSq <= hitRadiusSq) {
                this.target.takeDamage(this.damage);
                this.isAlive = false;
                return;
            }
        } else { // If target died, check if projectile reached original destination
            const distToOriginalTargetSq = distanceSq(this.pos, this.targetPos);
            if (distToOriginalTargetSq < this.radius * this.radius * 9) { // Wider check area
                this.isAlive = false;
            }
        }

        // Despawn if off-screen
        const margin = 50;
        if (this.pos.x < -margin || this.pos.x > canvas.width + margin ||
            this.pos.y < -margin || this.pos.y > canvas.height + margin) {
            this.isAlive = false;
        }
    }
    draw(ctx) { // Drawing logic as before
        if (!this.isAlive) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// --- SlashEffect Class (Visual Only) ---
class SlashEffect { // Logic as before
    constructor(attackerPos, targetPos) {
        this.startPos = { ...attackerPos };
        this.targetPos = { ...targetPos };
        this.duration = CONFIG.visuals.slashEffectDuration;
        this.life = this.duration;
        this.isAlive = true;
        const dx = this.targetPos.x - this.startPos.x;
        const dy = this.targetPos.y - this.startPos.y;
        this.angle = Math.atan2(dy, dx);
        // Adjust arc center slightly towards attacker for better visual feel
        this.arcCenterX = this.targetPos.x - Math.cos(this.angle) * (CONFIG.visuals.slashEffectArcRadius * 0.4);
        this.arcCenterY = this.targetPos.y - Math.sin(this.angle) * (CONFIG.visuals.slashEffectArcRadius * 0.4);
    }
    update(deltaTime) {
        this.life -= deltaTime;
        if (this.life <= 0) { this.isAlive = false; }
    }
    draw(ctx) {
        if (!this.isAlive) return;
        const alpha = Math.max(0, this.life / this.duration);
        const arcAngle = CONFIG.visuals.slashEffectArcAngle;
        const startAngle = this.angle - arcAngle / 2;
        const endAngle = this.angle + arcAngle / 2;
        let rgbaColor = CONFIG.visuals.slashEffectColor;
        // Safely parse and apply alpha
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


// --- Monster Base Class ---
class Monster extends GameObject {
    constructor(x, y, config, waveNumber) {
        super(x, y, config.radius, config.color);
        this.config = config;
        this.id = `m_${Date.now()}_${Math.random()}`; // Unique ID needed for Eye Monster targeting
        this.attackCooldown = 0;
        this.target = null;
        this.speedMultiplier = 1.0; // For slow effects
        this.slowTimer = 0;
        this.applyWaveScaling(waveNumber);
        this.currentHealth = this.maxHealth;
        // this.moveSpeed is set within applyWaveScaling
    }

    applyWaveScaling(wave) {
        const scaleLevel = Math.floor((wave - 1) / CONFIG.wave.monsterScaleInterval);
        const statMultiplier = 1 + (scaleLevel * CONFIG.wave.monsterScaleFactor);
        this.maxHealth = Math.round(this.config.baseHealth * statMultiplier);
        this.attack = this.config.baseAttack * statMultiplier;
        this.attackRange = this.config.attackRange;
        this.attackRangeSq = this.attackRange * this.attackRange;
        this.attackSpeed = this.config.attackSpeed;
        // Apply wave-based speed increase
        const speedIncreaseFactor = this.config.waveSpeedIncreaseFactor || 0;
        this.baseMoveSpeed = this.config.moveSpeed * (1 + (wave * speedIncreaseFactor));
        this.moveSpeed = this.baseMoveSpeed * this.speedMultiplier; // Initialize current move speed
        this.maxHealth = Math.round(this.maxHealth);
    }

    update(deltaTime, player, summons) {
        if (!this.isAlive) return;

        // Update slow effect timer
        if (this.slowTimer > 0) {
            this.slowTimer -= deltaTime;
            if (this.slowTimer <= 0) {
                this.speedMultiplier = 1.0;
                this.slowTimer = 0;
            }
        }
        this.moveSpeed = this.baseMoveSpeed * this.speedMultiplier; // Apply current speed multiplier


        if (this.attackCooldown > 0) { this.attackCooldown -= deltaTime; }

        this.findTarget(player, summons);

        // Movement towards target
        let moveDirection = { x: 0, y: 0 };
        if (this.target) {
            const distSqToTarget = distanceSq(this.pos, this.target.pos);
            // Move if outside 90% of attack range
            if (distSqToTarget > this.attackRangeSq * 0.9) {
                moveDirection = normalizeVector({ x: this.target.pos.x - this.pos.x, y: this.target.pos.y - this.pos.y });
            }
            else { // In range, stop moving
                moveDirection = { x: 0, y: 0 };
            }
        } else { // No target, maybe stand still or add wander later?
            moveDirection = { x: 0, y: 0 };
        }

        // Apply movement
        if (moveDirection.x !== 0 || moveDirection.y !== 0) {
            this.pos.x += moveDirection.x * this.moveSpeed * deltaTime;
            this.pos.y += moveDirection.y * this.moveSpeed * deltaTime;
        }

        // Attack if in range and cooldown ready
        if (this.target && this.target.isAlive && this.attackCooldown <= 0 && distanceSq(this.pos, this.target.pos) <= this.attackRangeSq) {
            this.attackTarget();
        }
    }

    findTarget(player, summons) { // Logic as before
        let closestTarget = null;
        let minDistanceSq = Infinity;

        if (player.isAlive) {
            const dSq = distanceSq(this.pos, player.pos);
            if (dSq < minDistanceSq) { minDistanceSq = dSq; closestTarget = player; }
        }
        summons.forEach(summon => {
            if (summon.isAlive) {
                const dSq = distanceSq(this.pos, summon.pos);
                if (dSq < minDistanceSq) { minDistanceSq = dSq; closestTarget = summon; }
            }
        });
        this.target = closestTarget;
    }

    attackTarget() {
        if (!this.target || !this.target.isAlive) return;
        this.target.takeDamage(this.attack);

        // Add visual effect for melee attacks
        if (this.attackRangeSq <= CONFIG.basicMeleeMonster.attackRange * CONFIG.basicMeleeMonster.attackRange * 1.2) {
            const effect = new SlashEffect(this.pos, this.target.pos);
            gameState.visualEffects.push(effect);
        }

        this.attackCooldown = 1.0 / this.attackSpeed;
    }

    takeDamage(amount) { // Logic mostly as before
        if (!this.isAlive) return;
        this.currentHealth -= amount;
        this.currentHealth = Math.max(0, Math.round(this.currentHealth));

        // Simple flash effect
        const flashColor = 'rgba(255, 255, 255, 0.7)';
        const originalColor = this.color;
        this.color = flashColor;
        setTimeout(() => {
            if (this.isAlive) { this.color = originalColor; }
        }, 60);

        if (this.currentHealth <= 0) { this.die(); }
    }

    die() {
        this.isAlive = false;
        gameState.souls += this.config.soulDrop;
        updateUI();
    }

    draw(ctx) { // Drawing logic as before (border + shape)
        if (this.config.borderColor && this.isAlive) {
            ctx.fillStyle = this.config.borderColor;
            const borderOffset = 1.5;
            ctx.save();
            ctx.translate(this.pos.x, this.pos.y);
            ctx.scale(1 + borderOffset / this.radius, 1 + borderOffset / this.radius);
            ctx.translate(-this.pos.x, -this.pos.y);
            this.drawShape(ctx);
            ctx.restore();
        }
        if (this.isAlive) {
            ctx.fillStyle = this.color; // Ensure correct color for main shape
            this.drawShape(ctx);
        }
        this.drawHealthBar(ctx); // Draw health bar last
    }

    drawHealthBar(ctx) {
        if (this.currentHealth < this.maxHealth && this.isAlive) {
            const barWidth = this.radius * 1.6;
            const barHeight = 4;
            const barX = this.pos.x - barWidth / 2;
            const barY = this.pos.y - this.radius * 1.5 - barHeight - 2;
            const healthPercent = this.currentHealth / this.maxHealth;
            ctx.fillStyle = '#555';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : (healthPercent > 0.2 ? '#FFC107' : '#F44336');
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
    }

    drawShape(ctx) { /* Base implementation, overridden by subclasses */ }

    applySlow(amount, duration) { // Logic as before
        const newSpeedMultiplier = 1.0 - amount;
        // Only apply if it's a stronger slow than currently active
        if (newSpeedMultiplier < this.speedMultiplier) {
            this.speedMultiplier = newSpeedMultiplier;
        }
        // Refresh duration
        this.slowTimer = Math.max(this.slowTimer, duration);
    }
}

// --- Specific Monster Classes (Draw shapes remain the same) ---
class BasicMeleeMonster extends Monster {
    constructor(x, y, waveNumber) { super(x, y, CONFIG.basicMeleeMonster, waveNumber); }
    drawShape(ctx) { // Spiky shape
        ctx.beginPath();
        const spikes = 6; const outerRadius = this.radius; const innerRadius = this.radius * 0.7;
        for (let i = 0; i < spikes * 2; i++) {
            const radius = (i % 2 === 0) ? outerRadius : innerRadius;
            const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
            const xPos = this.pos.x + Math.cos(angle) * radius;
            const yPos = this.pos.y + Math.sin(angle) * radius;
            if (i === 0) { ctx.moveTo(xPos, yPos); } else { ctx.lineTo(xPos, yPos); }
        }
        ctx.closePath(); ctx.fill();
    }
}
class FastMeleeMonster extends Monster {
    constructor(x, y, waveNumber) { super(x, y, CONFIG.fastMeleeMonster, waveNumber); }
    drawShape(ctx) { // Arrow shape
        ctx.beginPath();
        const arrowSize = this.radius * 1.2;
        ctx.moveTo(this.pos.x + arrowSize * 0.5, this.pos.y);
        ctx.lineTo(this.pos.x - arrowSize * 0.5, this.pos.y - arrowSize * 0.4);
        ctx.lineTo(this.pos.x - arrowSize * 0.2, this.pos.y);
        ctx.lineTo(this.pos.x - arrowSize * 0.5, this.pos.y + arrowSize * 0.4);
        ctx.closePath(); ctx.fill();
    }
}
class ArmoredMeleeMonster extends Monster {
    constructor(x, y, waveNumber) { super(x, y, CONFIG.armoredMeleeMonster, waveNumber); }
    drawShape(ctx) { // Shield shape
        ctx.beginPath();
        const shieldWidth = this.radius * 1.4; const shieldHeight = this.radius * 1.4;
        const topY = this.pos.y - shieldHeight / 2; const bottomY = this.pos.y + shieldHeight / 2;
        const midX = this.pos.x; const sideX = shieldWidth / 2;
        ctx.moveTo(midX - sideX, topY); ctx.lineTo(midX + sideX, topY);
        ctx.lineTo(midX + sideX, bottomY * 0.9); ctx.lineTo(midX, bottomY);
        ctx.lineTo(midX - sideX, bottomY * 0.9);
        ctx.closePath(); ctx.fill();
    }
}

// --- Wave Management ---
function getMonsterCountForWave(wave) { return 5 + wave * 3; }

function prepareNextWave() {
    gameState.currentWave++;
    gameState.betweenWaves = false;
    gameState.monstersToSpawnThisWave = getMonsterCountForWave(gameState.currentWave);
    gameState.monstersSpawnedThisWave = 0;
    // Clear only monsters/projectiles/effects, keep summons
    gameState.monsters = [];
    gameState.projectiles = [];
    gameState.visualEffects = [];

    console.log(`準備開始第 ${gameState.currentWave} 波，生成 ${gameState.monstersToSpawnThisWave} 隻怪物`);

    // Spawn monsters (logic as before)
    for (let i = 0; i < gameState.monstersToSpawnThisWave; i++) {
        const spawnPos = getRandomPositionOutsideCanvas();
        let monster; const waveNum = gameState.currentWave; const rand = Math.random();
        let cumulativeChance = 0; let spawned = false;

        cumulativeChance += CONFIG.wave.spawnChanceArmored;
        if (!spawned && waveNum >= CONFIG.wave.armoredMonsterMinWave && rand < cumulativeChance) {
            monster = new ArmoredMeleeMonster(spawnPos.x, spawnPos.y, waveNum); spawned = true;
        }
        cumulativeChance += CONFIG.wave.spawnChanceFast;
        if (!spawned && waveNum >= CONFIG.wave.fastMonsterMinWave && rand < cumulativeChance) {
            monster = new FastMeleeMonster(spawnPos.x, spawnPos.y, waveNum); spawned = true;
        }
        if (!spawned) { // Default to Basic
            monster = new BasicMeleeMonster(spawnPos.x, spawnPos.y, waveNum);
        }
        gameState.monsters.push(monster);
        gameState.monstersSpawnedThisWave++;
    }
    updateUI();
}

function checkWaveEndCondition() {
    if (!gameState.betweenWaves && gameState.monsters.every(m => !m.isAlive)) {
        console.log(`第 ${gameState.currentWave} 波 已清空!`);
        gameState.betweenWaves = true;
        gameState.timeToNextWave = CONFIG.wave.betweenTime;
        // Clear remaining projectiles/effects from the ended wave
        gameState.projectiles = [];
        gameState.visualEffects = [];
        saveGameState(); // Save progress at the end of a wave
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

// --- UI & Game State ---
function showMessage(msg, duration = 2000) {
    if (gameState.messageTimeout) { clearTimeout(gameState.messageTimeout); }
    uiElements.messageArea.textContent = msg;
    uiElements.messageArea.style.display = 'block';
    gameState.messageTimeout = setTimeout(() => {
        uiElements.messageArea.style.display = 'none';
        gameState.messageTimeout = null;
    }, duration);
}

// Function to attempt summoning a unit
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
        default: console.error("未知的召喚物類型:", type); return false; // Indicate failure
    }

    if (gameState.souls >= cost) {
        gameState.souls -= cost;
        const spawnPos = gameState.player.getSummonPosition();
        const newSummon = new SummonClass(spawnPos.x, spawnPos.y, level, gameState.player);
        gameState.summons.push(newSummon);
        switch (type) { // Increment count
            case 'SkeletonWarrior': gameState.skeletonWarriorCount++; break;
            case 'EyeMonster': gameState.eyeMonsterCount++; break;
            case 'Wraith': gameState.wraithCount++; break;
        }
        console.log(`召喚了 ${unitName}`);
        updateUI();
        return true; // Indicate success
    } else {
        if (!holdSummonState.isHolding) { // Only show message on single click, not continuous hold failure
            showMessage(`靈魂不足 (需要 ${cost})`);
        }
        return false; // Indicate failure
    }
}

// Function to attempt upgrading a unit type
function tryUpgrade(type) {
    let cost, costIncrement, costKey, levelKey, unitName;
    switch (type) {
        // REMOVED Player case
        case 'SkeletonWarrior':
            costKey = 'skeletonWarrior'; levelKey = 'skeletonWarriorLevel'; unitName = "骷髏戰士";
            break;
        case 'EyeMonster':
            costKey = 'eyeMonster'; levelKey = 'eyeMonsterLevel'; unitName = "眼魔";
            break;
        case 'Wraith':
            costKey = 'wraith'; levelKey = 'wraithLevel'; unitName = "怨靈";
            break;
        default: console.error("未知的升級類型:", type); return;
    }

    cost = gameState.currentCosts[costKey];
    costIncrement = CONFIG.upgradeCostIncrements[costKey];

    if (gameState.souls >= cost) {
        gameState.souls -= cost;
        gameState[levelKey]++; // Increment the level for the type
        gameState.currentCosts[costKey] += costIncrement; // Increase cost for next upgrade
        // Apply level up to all existing alive units of this type
        gameState.summons.forEach(s => { if (s.isAlive && s.config.type === type) { s.levelUp(); } });
        updateUI(); showMessage(`${unitName} 已升級！ (Lv ${gameState[levelKey]})`);
    } else {
        showMessage(`靈魂不足 (需要 ${cost})`);
    }
}

// --- Input Handling (Pointer Events for Movement) ---
function handlePointerDown(event) {
    if (gameState.isPaused || event.target !== canvas) return;
    event.preventDefault(); // Prevent default canvas interactions (like text selection, image drag)
    inputState.isPointerDown = true;
    const pos = getPointerPosition(event);
    inputState.pointerStartPos = pos;
    inputState.pointerCurrentPos = pos;
    inputState.movementVector = { x: 0, y: 0 };
}
function handlePointerMove(event) {
    if (gameState.isPaused || !inputState.isPointerDown || event.target !== canvas) return;
    event.preventDefault();
    const pos = getPointerPosition(event);
    inputState.pointerCurrentPos = pos;
    const deltaX = inputState.pointerCurrentPos.x - inputState.pointerStartPos.x;
    const deltaY = inputState.pointerCurrentPos.y - inputState.pointerStartPos.y;
    // Use a small deadzone before registering movement
    if (deltaX * deltaX + deltaY * deltaY > 5 * 5) {
        inputState.movementVector = normalizeVector({ x: deltaX, y: deltaY });
    } else {
        inputState.movementVector = { x: 0, y: 0 };
    }
}
function handlePointerUp(event) {
    // Check if the up event corresponds to the active pointer down
    if (!inputState.isPointerDown) return;
    // Don't prevent default here, might interfere with button clicks outside canvas if needed
    inputState.isPointerDown = false;
    inputState.movementVector = { x: 0, y: 0 };
}
function getPointerPosition(event) { // Logic as before
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (event.touches && event.touches.length > 0) { // Active touches
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else if (event.changedTouches && event.changedTouches.length > 0) { // Touchend event
        clientX = event.changedTouches[0].clientX;
        clientY = event.changedTouches[0].clientY;
    } else { // Mouse event
        clientX = event.clientX;
        clientY = event.clientY;
    }
    // Scale position to canvas coordinates
    return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
    };
}

// --- Hold-to-Summon Logic ---
function startHoldSummon(type) {
    if (gameState.isPaused || holdSummonState.isHolding) return;

    holdSummonState.isHolding = true;
    holdSummonState.type = type;

    // Clear any previous timers for safety
    stopHoldSummonInternal();

    // Initial delay before continuous summon starts
    holdSummonState.timeoutId = setTimeout(() => {
        if (!holdSummonState.isHolding || holdSummonState.type !== type) return; // Check if still holding the same button

        // Try the first summon after the delay
        const success = trySummon(type);

        // Start the interval only if the first summon after delay was successful (implies enough souls at that moment)
        // or even if failed, start interval to keep trying? Let's start it anyway.
        holdSummonState.intervalId = setInterval(() => {
            if (!holdSummonState.isHolding || holdSummonState.type !== type) {
                stopHoldSummonInternal(); // Stop if no longer holding this button
                return;
            }
            const continuedSuccess = trySummon(type);
            if (!continuedSuccess) {
                // Optional: stop interval if souls run out? Or let it keep trying? Keep trying.
                // stopHoldSummonInternal();
            }
        }, CONFIG.summoning.repeatInterval);

    }, CONFIG.summoning.holdDelay);
}

function stopHoldSummon() {
    if (holdSummonState.isHolding) {
        holdSummonState.isHolding = false;
        stopHoldSummonInternal();
    }
}

function stopHoldSummonInternal() {
    if (holdSummonState.timeoutId) {
        clearTimeout(holdSummonState.timeoutId);
        holdSummonState.timeoutId = null;
    }
    if (holdSummonState.intervalId) {
        clearInterval(holdSummonState.intervalId);
        holdSummonState.intervalId = null;
    }
    holdSummonState.type = null;
}


// --- UI Update Function ---
function updateUI() {
    const souls = gameState.souls;

    // Update Player Health Display
    if (gameState.player) {
        uiElements.playerHealthInfo.textContent = `HP: ${gameState.player.currentHealth}/${gameState.player.maxHealth}`;
    } else {
        uiElements.playerHealthInfo.textContent = `HP: -/-`;
    }
    // REMOVED Player Level/Upgrade UI update

    uiElements.soulsInfo.textContent = `靈魂: ${souls}`;
    uiElements.waveInfo.textContent = `第${gameState.currentWave}波`;

    // Update Timer/Monster Count Info
    if (gameState.betweenWaves && gameState.currentWave >= 0) {
        uiElements.timerInfo.textContent = `下一波: 倒數 ${Math.ceil(gameState.timeToNextWave)} 秒`;
    } else if (!gameState.betweenWaves) {
        const aliveOnMap = gameState.monsters.filter(m => m.isAlive).length;
        uiElements.timerInfo.textContent = `怪物剩餘: ${aliveOnMap}`;
    } else { // Before first wave starts
        uiElements.timerInfo.textContent = `準備開始`;
    }

    // Helper function to update UI for a specific summon type
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

        uiMap.summonBtn.innerHTML = `召喚 (${summonCost}魂)`;
        uiMap.upgradeBtn.innerHTML = `升級 (${upgradeCost}魂)`;
        setButtonState(uiMap.summonBtn, souls >= summonCost);
        setButtonState(uiMap.upgradeBtn, souls >= upgradeCost);
    }

    // Update UI for all summon types
    updateUnitUI('SkeletonWarrior');
    updateUnitUI('EyeMonster');
    updateUnitUI('Wraith');

    // Update Pause/Resume Button Text
    uiElements.pauseResumeBtn.textContent = gameState.isPaused ? '繼續' : '暫停';
}

// Helper to set button disabled state and class
function setButtonState(button, canAfford) {
    button.disabled = !canAfford;
    if (canAfford) {
        button.classList.add('can-afford');
    } else {
        button.classList.remove('can-afford');
    }
}

// --- Game Over and Save/Load ---
function showGameOver() {
    console.log("showGameOver called");
    gameState.gameOver = true; // Ensure state is set
    uiElements.finalWaveText.textContent = `您存活了 ${gameState.currentWave} 波.`;
    uiElements.gameOverScreen.style.display = 'flex'; // Use flex to enable centering
    localStorage.removeItem(SAVE_KEY); // Clear save on game over
    console.log("遊戲結束，已清除存檔。");
    if (animationFrameId) { // Stop game loop if running
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

const SAVE_KEY = 'necromancerGameState_v11'; // Increment version due to player level removal
const SAVE_VERSION = 11;

function saveGameState() {
    // Don't save if game over, paused, or player doesn't exist
    if (!gameState.player || gameState.gameOver || gameState.isPaused) return;

    const stateToSave = {
        saveVersion: SAVE_VERSION,
        souls: gameState.souls,
        currentWave: gameState.currentWave,
        timeToNextWave: gameState.timeToNextWave,
        betweenWaves: gameState.betweenWaves,
        // REMOVED playerLevel
        playerCurrentHealth: gameState.player.currentHealth,
        playerMaxHealth: gameState.player.maxHealth, // Save max health too
        skeletonWarriorLevel: gameState.skeletonWarriorLevel,
        eyeMonsterLevel: gameState.eyeMonsterLevel,
        wraithLevel: gameState.wraithLevel,
        skeletonWarriorCount: gameState.skeletonWarriorCount,
        eyeMonsterCount: gameState.eyeMonsterCount,
        wraithCount: gameState.wraithCount,
        currentCosts: gameState.currentCosts,
    };

    try {
        const savedString = JSON.stringify(stateToSave);
        localStorage.setItem(SAVE_KEY, savedString);
        console.log("進度已儲存 (Wave End)");
    } catch (error) {
        console.error("儲存遊戲狀態失敗:", error);
        showMessage("儲存失敗!", 1500);
    }
}

function loadGameState() {
    const savedString = localStorage.getItem(SAVE_KEY);
    if (savedString) {
        let loadedState;
        try { loadedState = JSON.parse(savedString); }
        catch (error) {
            console.error("讀取遊戲狀態失敗 (解析錯誤):", error);
            localStorage.removeItem(SAVE_KEY); return false;
        }

        // Check save version compatibility
        if (loadedState.saveVersion !== SAVE_VERSION) {
            console.warn(`存檔版本不符 (需要 ${SAVE_VERSION}, 找到 ${loadedState.saveVersion}). 清除舊存檔並重置遊戲.`);
            localStorage.removeItem(SAVE_KEY); return false;
        }

        // Reset current state before loading
        resetGameInternalState();

        // Load values from saved state, providing defaults if missing
        gameState.souls = loadedState.souls ?? CONFIG.player.initialSouls;
        gameState.currentWave = loadedState.currentWave ?? 0;
        gameState.timeToNextWave = loadedState.timeToNextWave ?? CONFIG.wave.betweenTime;
        gameState.betweenWaves = loadedState.betweenWaves ?? true;
        // gameState.playerLevel = 0; // Player level is always 0 now
        gameState.currentCosts = loadedState.currentCosts ?? { ...CONFIG.upgradeCosts };

        gameState.skeletonWarriorLevel = loadedState.skeletonWarriorLevel ?? 0;
        gameState.eyeMonsterLevel = loaded_state.eye_monster_level ?? 0; // Potential typo fix: loadedState.eyeMonsterLevel
        gameState.wraithLevel = loadedState.wraithLevel ?? 0;
        gameState.skeletonWarriorCount = loadedState.skeletonWarriorCount ?? 0;
        gameState.eyeMonsterCount = loadedState.eyeMonsterCount ?? 0;
        gameState.wraithCount = loadedState.wraithCount ?? 0;

        // Recreate player and set health
        gameState.player = new Player(canvas.width / 2, canvas.height / 2);
        // Restore health, ensuring it's valid relative to base max health
        gameState.player.maxHealth = loadedState.playerMaxHealth ?? CONFIG.player.baseHealth;
        gameState.player.currentHealth = loadedState.playerCurrentHealth ?? gameState.player.maxHealth;
        // Sanity checks for health
        gameState.player.maxHealth = Math.max(CONFIG.player.baseHealth, Math.round(gameState.player.maxHealth));
        gameState.player.currentHealth = Math.min(gameState.player.maxHealth, Math.max(0, Math.round(gameState.player.currentHealth)));

        console.log("遊戲狀態已從 localStorage 載入 (版本相符)");
        showMessage("讀取存檔成功", 1500);
        return true; // Load successful

    }
    return false; // No save file found or version mismatch
}

// Restore summons based on loaded counts
function restoreSummonsFromLoad() {
    if (!gameState.player) return;
    gameState.summons = []; // Clear any existing summons first

    console.log(`讀取時恢復召喚物: 戰士=${gameState.skeletonWarriorCount}, 眼魔=${gameState.eyeMonsterCount}, 怨靈=${gameState.wraithCount}`);

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

// Reset internal game state variables (used by resetGame and loadGame)
function resetGameInternalState() {
    console.log("重置內部遊戲狀態...");
    if (gameState.messageTimeout) clearTimeout(gameState.messageTimeout);
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
    stopHoldSummonInternal(); // Stop any hold-summon timers

    // Reset game state object to initial values
    gameState = {
        player: null,
        summons: [], monsters: [], projectiles: [], visualEffects: [],
        souls: CONFIG.player.initialSouls,
        currentWave: 0,
        monstersToSpawnThisWave: 0, monstersSpawnedThisWave: 0,
        timeToNextWave: CONFIG.wave.betweenTime, betweenWaves: true,
        gameOver: false, isPaused: false,
        lastTime: performance.now(),
        messageTimeout: null,
        // playerLevel: 0, // Removed
        skeletonWarriorLevel: 0, eyeMonsterLevel: 0, wraithLevel: 0,
        skeletonWarriorCount: 0, eyeMonsterCount: 0, wraithCount: 0,
        currentCosts: { // Reset costs based on config base values
            skeletonWarrior: CONFIG.skeletonWarrior.upgradeCostBase,
            eyeMonster: CONFIG.eyeMonster.upgradeCostBase,
            wraith: CONFIG.wraith.upgradeCostBase,
        },
    };
    // Reset input state
    inputState = { isPointerDown: false, pointerStartPos: { x: 0, y: 0 }, pointerCurrentPos: { x: 0, y: 0 }, movementVector: { x: 0, y: 0 } };
}

// Full game reset (clears save, resets state, starts new game)
function resetGame() {
    console.log("執行完整遊戲重置 (清除存檔)...");
    localStorage.removeItem(SAVE_KEY); // Clear save data
    resetGameInternalState(); // Reset variables
    gameState.player = new Player(canvas.width / 2, canvas.height / 2); // Create new player
    uiElements.gameOverScreen.style.display = 'none'; // Hide game over screen
    gameState.isPaused = false; // Ensure not paused
    updateUI(); // Update UI to reflect reset state
    // Start the game loop if not already running
    if (animationFrameId === null) {
        gameState.lastTime = performance.now();
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

// Toggle Pause State
function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    if (gameState.isPaused) {
        // Pause actions
        uiElements.pauseResumeBtn.textContent = '繼續';
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null; // Clear ID when paused
        }
        stopHoldSummon(); // Stop hold-summoning if paused mid-hold
        // Draw pause overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "30px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("已暫停", canvas.width / 2, canvas.height / 2);
    } else {
        // Resume actions
        uiElements.pauseResumeBtn.textContent = '暫停';
        // Restart game loop if it was stopped
        if (animationFrameId === null) {
            gameState.lastTime = performance.now(); // Reset time delta calculation
            animationFrameId = requestAnimationFrame(gameLoop);
        }
    }
    updateUI(); // Update button text
}

// --- Main Game Loop ---
let animationFrameId = null;
function gameLoop(currentTime) {
    // Check for game over first
    if (gameState.gameOver) {
        showGameOver(); // Ensure game over screen is shown
        animationFrameId = null; // Stop the loop
        return;
    }

    // If paused, stop the loop (will be restarted by togglePause)
    if (gameState.isPaused) {
        animationFrameId = null;
        return;
    }

    // Calculate deltaTime
    let deltaTime = (currentTime - gameState.lastTime) / 1000;
    deltaTime = Math.min(deltaTime, 0.1); // Clamp delta time to prevent large jumps
    gameState.lastTime = currentTime;

    // --- Update Game State ---
    updateTimers(deltaTime); // Update wave timer

    // Apply Wraith Buffs (before individual updates)
    const wraiths = gameState.summons.filter(s => s.isAlive && s.config.type === 'Wraith');
    const nonWraiths = gameState.summons.filter(s => s.isAlive && s.config.type !== 'Wraith');
    wraiths.forEach(wraith => wraith.applyBuffAura(nonWraiths));


    if (gameState.player) gameState.player.update(deltaTime, inputState.movementVector); // Update player
    gameState.summons.forEach(s => s.update(deltaTime, gameState.monsters, gameState.summons, gameState.player)); // Update summons
    gameState.monsters.forEach(m => m.update(deltaTime, gameState.player, gameState.summons)); // Update monsters
    gameState.projectiles.forEach(p => p.update(deltaTime)); // Update projectiles
    gameState.visualEffects.forEach(e => e.update(deltaTime)); // Update visual effects

    // --- Cleanup Dead Entities ---
    // Filter arrays in place or create new ones
    gameState.summons = gameState.summons.filter(s => s.isAlive);
    gameState.monsters = gameState.monsters.filter(m => m.isAlive);
    gameState.projectiles = gameState.projectiles.filter(p => p.isAlive);
    gameState.visualEffects = gameState.visualEffects.filter(e => e.isAlive);

    // Check if wave ended
    checkWaveEndCondition();

    // --- Drawing ---
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

    // Draw Auras first (background elements)
    gameState.summons.forEach(s => { if (s.config.type === 'Wraith' && s.isAlive) s.drawAura(ctx); });

    // Draw main game objects
    gameState.monsters.forEach(m => m.draw(ctx));
    gameState.summons.forEach(s => s.draw(ctx));
    gameState.projectiles.forEach(p => p.draw(ctx));
    if (gameState.player) gameState.player.draw(ctx); // Draw player last (or adjust order as needed)

    // Draw visual effects on top
    gameState.visualEffects.forEach(e => e.draw(ctx));


    // Update UI elements based on current state
    updateUI();

    // Request next frame
    // Ensure loop continues only if not paused and not game over
    if (!gameState.isPaused && !gameState.gameOver) {
        animationFrameId = requestAnimationFrame(gameLoop);
    } else {
        animationFrameId = null; // Ensure ID is null if loop stops
    }
}

// --- Initialization ---
function init() {
    console.log("初始化遊戲...");

    // --- Input Event Listeners ---
    // Canvas listeners for player movement
    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('mouseup', handlePointerUp);
    canvas.addEventListener('mouseleave', handlePointerUp); // Stop movement if pointer leaves canvas
    canvas.addEventListener('touchstart', handlePointerDown, { passive: false }); // Use passive: false to allow preventDefault
    canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
    canvas.addEventListener('touchend', handlePointerUp);
    canvas.addEventListener('touchcancel', handlePointerUp); // Handle cancelled touches

    // Button listeners for upgrades and single summons (clicks)
    // REMOVED upgradePlayerBtn listener
    uiElements.upgradeSkeletonBtn.addEventListener('click', () => tryUpgrade('SkeletonWarrior'));
    uiElements.upgradeEyeMonsterBtn.addEventListener('click', () => tryUpgrade('EyeMonster'));
    uiElements.upgradeWraithBtn.addEventListener('click', () => tryUpgrade('Wraith'));

    // Listeners for Hold-to-Summon (pointer down/up on buttons)
    const summonButtons = [
        { btn: uiElements.summonSkeletonBtn, type: 'SkeletonWarrior' },
        { btn: uiElements.summonEyeMonsterBtn, type: 'EyeMonster' },
        { btn: uiElements.summonWraithBtn, type: 'Wraith' },
    ];

    summonButtons.forEach(({ btn, type }) => {
        // Start hold on pointer down (mouse or touch)
        btn.addEventListener('mousedown', (e) => { e.stopPropagation(); startHoldSummon(type); });
        btn.addEventListener('touchstart', (e) => { e.stopPropagation(); e.preventDefault(); startHoldSummon(type); }, { passive: false });

        // Attempt single summon on click (triggers after pointer up if no hold detected)
        btn.addEventListener('click', (e) => {
            // Only trigger single summon if not currently in a hold state that just ended
            if (!holdSummonState.timeoutId && !holdSummonState.intervalId) {
                trySummon(type);
            }
        });
    });

    // Stop hold on pointer up/leave (globally to catch release outside button)
    document.addEventListener('mouseup', stopHoldSummon);
    document.addEventListener('mouseleave', stopHoldSummon);
    document.addEventListener('touchend', stopHoldSummon);
    document.addEventListener('touchcancel', stopHoldSummon);


    // Other UI listeners
    uiElements.restartButton.addEventListener('click', resetGame);
    uiElements.pauseResumeBtn.addEventListener('click', togglePause);

    // --- Load Game or Start New ---
    if (loadGameState()) {
        // If loaded successfully, restore summon objects based on counts
        restoreSummonsFromLoad();
        updateUI(); // Update UI with loaded data
        // If loaded state was paused, keep it paused and draw the initial state
        if (gameState.isPaused) {
            uiElements.pauseResumeBtn.textContent = '繼續';
            // Draw current state once to show loaded game in paused state
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            gameState.summons.forEach(s => { if (s.config.type === 'Wraith' && s.isAlive) s.drawAura(ctx); });
            gameState.monsters.forEach(m => m.draw(ctx)); // Should be empty if loaded between waves
            gameState.summons.forEach(s => s.draw(ctx));
            gameState.projectiles.forEach(p => p.draw(ctx)); // Should be empty
            gameState.visualEffects.forEach(e => e.draw(ctx)); // Should be empty
            if (gameState.player) gameState.player.draw(ctx);
            // Draw pause overlay
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white"; ctx.font = "30px sans-serif"; ctx.textAlign = "center";
            ctx.fillText("已暫停 (讀檔)", canvas.width / 2, canvas.height / 2);
            animationFrameId = null; // Ensure loop doesn't start automatically
        } else {
            // If not paused, start the game loop
            gameState.lastTime = performance.now();
            if (animationFrameId === null) {
                animationFrameId = requestAnimationFrame(gameLoop);
            }
        }
    } else {
        // If load failed or no save exists, reset and start a new game
        resetGame();
    }
}

// Start the initialization process
init();