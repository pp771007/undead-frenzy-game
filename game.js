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
};

const CONFIG = {
    player: {
        baseHealth: 50, baseMoveSpeed: 90, radius: 10, color: '#03A9F4',
        iconColor: '#FFFFFF',
        initialSouls: 15,
        avoidanceRadius: 15,
    },
    skeletonWarrior: {
        type: 'SkeletonWarrior', baseHealth: 25, baseAttack: 5, radius: 8,
        attackRange: 25, attackSpeed: 1.0, moveSpeed: 80, color: '#FFFFFF',
        iconColor: '#424242',
        upgradeBonus: 0.10,
        summonCost: 3,
        upgradeCostBase: 10,
        upgradeCostInc: 5,
        targetSearchRadius: 150, returnDistance: 50,
        avoidanceRadius: 18, avoidanceForce: 80,
        playerAvoidanceForce: 60,
        wanderRadius: 20, wanderSpeedFactor: 0.3, wanderIntervalMin: 1.5, wanderIntervalMax: 3.0,
        wraithBuffMoveSpeedMultiplier: 2.0,
    },
    eyeMonster: {
        type: 'EyeMonster', baseHealth: 8, baseAttack: 7, radius: 9,
        attackRange: 120,
        attackRangeUpgrade: 3,
        attackSpeed: 0.8, moveSpeed: 60, color: '#A1887F',
        iconColor: '#000000',
        upgradeBonus: 0.10,
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
        retreatCheckDistance: 40,
        retreatSpeedFactor: 1.1,
        wraithBuffAttackSpeedMultiplier: 2.0,
    },
    wraith: {
        type: 'Wraith', baseHealth: 15, baseAttack: 0, radius: 9,
        attackRange: 0,
        slowRadiusBase: 80,
        slowRadiusUpgrade: 5,
        slowAmountBase: 0.4,
        slowAmountUpgrade: 0.025,
        slowDuration: 1.5, attackSpeed: 1.0, moveSpeed: 55, color: '#4DB6AC',
        iconColor: '#E0F2F1',
        upgradeBonus: 0.15,
        summonCost: 10,
        upgradeCostBase: 20,
        upgradeCostInc: 10,
        targetSearchRadius: 200, returnDistance: 40,
        avoidanceRadius: 25,
        avoidanceForce: 100,
        wraithAvoidanceMultiplier: 1.5,
        playerAvoidanceForce: 70,
        retreatSpeedFactor: 0.4,
        wanderRadius: 35, wanderSpeedFactor: 0.25, wanderIntervalMin: 2.0, wanderIntervalMax: 4.0,
        buffRadiusProperty: 'slowRadius',
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
    summoning: {
        holdDelay: 350, // Slightly longer delay might feel better on touch
        repeatInterval: 150,
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
    skeletonWarriorLevel: 0, eyeMonsterLevel: 0, wraithLevel: 0,
    skeletonWarriorCount: 0, eyeMonsterCount: 0, wraithCount: 0,
    currentCosts: { ...CONFIG.upgradeCosts },
};

let holdSummonState = {
    type: null,
    timeoutId: null,
    intervalId: null,
    isHolding: false,
    pointerDownTime: 0, // Track when pointer went down
};

let inputState = {
    isPointerDown: false, pointerStartPos: { x: 0, y: 0 },
    pointerCurrentPos: { x: 0, y: 0 }, movementVector: { x: 0, y: 0 },
    pointerId: null, // Track the specific pointer/touch for movement
};

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

class GameObject {
    constructor(x, y, radius, color) {
        this.pos = { x, y };
        this.radius = radius;
        this.color = color;
        this.isAlive = true;
        this.id = `go_${Date.now()}_${Math.random()}`;
    }
    draw(ctx) { }
    update(deltaTime) { }
}

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
        updateUI();
    }
    die() {
        this.isAlive = false;
        gameState.gameOver = true;
        showGameOver();
    }
    getSummonPosition() {
        const direction = normalizeVector(inputState.movementVector);
        const spawnDist = this.radius + 15;
        let spawnX = this.pos.x + spawnDist;
        let spawnY = this.pos.y;
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
    }
}

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
        finalMove.x += avoidanceVector.x;
        finalMove.y += avoidanceVector.y;

        if (finalMove.x !== 0 || finalMove.y !== 0) {
            this.pos.x += finalMove.x * deltaTime;
            this.pos.y += finalMove.y * deltaTime;
            isIdle = false;
        }

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
                    this.attackTarget();
                }
            }
        }
    }

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
                    const pushStrength = (1.0 - (distance / currentAvoidanceRadius)) * (1.0 - (distance / currentAvoidanceRadius));
                    totalPushX += pushDirectionX * pushStrength * currentAvoidanceForce;
                    totalPushY += pushDirectionY * pushStrength * currentAvoidanceForce;
                }
            }
        });

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

        const maxAvoidanceSpeed = 150;
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

    findBestTarget(monsters, otherSummons) {
        let potentialTargets = monsters.filter(m => m.isAlive && distanceSq(this.pos, m.pos) <= this.attackRangeSq);

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
            const projectile = new Projectile(
                this.pos.x, this.pos.y,
                this.target,
                this.config,
                currentAttackDamage
            );
            gameState.projectiles.push(projectile);
        } else if (this.config.type === 'SkeletonWarrior') {
            this.target.takeDamage(currentAttackDamage);
            const effect = new SlashEffect(this.pos, this.target.pos);
            gameState.visualEffects.push(effect);
        }
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
        updateUI();
    }

    die() {
        this.isAlive = false;
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

class SkeletonWarrior extends SummonUnit {
    constructor(x, y, level, playerTransform) {
        super(x, y, CONFIG.skeletonWarrior, level, playerTransform);
    }
    draw(ctx) {
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
    draw(ctx) {
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

    drawAura(ctx) {
        if (!this.isAlive) return;
        const gradient = ctx.createRadialGradient(this.pos.x, this.pos.y, this.radius * 0.5, this.pos.x, this.pos.y, this.slowRadius);
        gradient.addColorStop(0, this.color + '00');
        gradient.addColorStop(0.8, this.color + '2A');
        gradient.addColorStop(1, this.color + '0A');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.slowRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    draw(ctx) {
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
    attackTarget() { }
}

class Projectile extends GameObject {
    constructor(startX, startY, target, shooterConfig, damage) {
        super(startX, startY, shooterConfig.projectileRadius, shooterConfig.projectileColor);
        this.target = target;
        this.speed = shooterConfig.projectileSpeed;
        this.damage = damage;
        this.targetPos = { ...target.pos };
        this.direction = normalizeVector({ x: this.targetPos.x - startX, y: this.targetPos.y - startY });
    }

    update(deltaTime) {
        if (!this.isAlive) return;

        this.pos.x += this.direction.x * this.speed * deltaTime;
        this.pos.y += this.direction.y * this.speed * deltaTime;

        if (this.target.isAlive) {
            const distToTargetSq = distanceSq(this.pos, this.target.pos);
            const hitRadiusSq = (this.radius + this.target.radius + 3) * (this.radius + this.target.radius + 3);

            if (distToTargetSq <= hitRadiusSq) {
                this.target.takeDamage(this.damage);
                this.isAlive = false;
                return;
            }
        } else {
            const distToOriginalTargetSq = distanceSq(this.pos, this.targetPos);
            if (distToOriginalTargetSq < this.radius * this.radius * 9) {
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

class SlashEffect {
    constructor(attackerPos, targetPos) {
        this.startPos = { ...attackerPos };
        this.targetPos = { ...targetPos };
        this.duration = CONFIG.visuals.slashEffectDuration;
        this.life = this.duration;
        this.isAlive = true;
        const dx = this.targetPos.x - this.startPos.x;
        const dy = this.targetPos.y - this.startPos.y;
        this.angle = Math.atan2(dy, dx);
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

class Monster extends GameObject {
    constructor(x, y, config, waveNumber) {
        super(x, y, config.radius, config.color);
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
        const statMultiplier = 1 + (scaleLevel * CONFIG.wave.monsterScaleFactor);
        this.maxHealth = Math.round(this.config.baseHealth * statMultiplier);
        this.attack = this.config.baseAttack * statMultiplier;
        this.attackRange = this.config.attackRange;
        this.attackRangeSq = this.attackRange * this.attackRange;
        this.attackSpeed = this.config.attackSpeed;
        const speedIncreaseFactor = this.config.waveSpeedIncreaseFactor || 0;
        this.baseMoveSpeed = this.config.moveSpeed * (1 + (wave * speedIncreaseFactor));
        this.moveSpeed = this.baseMoveSpeed * this.speedMultiplier;
        this.maxHealth = Math.round(this.maxHealth);
    }

    update(deltaTime, player, summons) {
        if (!this.isAlive) return;

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

        if (moveDirection.x !== 0 || moveDirection.y !== 0) {
            this.pos.x += moveDirection.x * this.moveSpeed * deltaTime;
            this.pos.y += moveDirection.y * this.moveSpeed * deltaTime;
        }

        if (this.target && this.target.isAlive && this.attackCooldown <= 0 && distanceSq(this.pos, this.target.pos) <= this.attackRangeSq) {
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

        if (this.attackRangeSq <= CONFIG.basicMeleeMonster.attackRange * CONFIG.basicMeleeMonster.attackRange * 1.2) {
            const effect = new SlashEffect(this.pos, this.target.pos);
            gameState.visualEffects.push(effect);
        }

        this.attackCooldown = 1.0 / this.attackSpeed;
    }

    takeDamage(amount) {
        if (!this.isAlive) return;
        this.currentHealth -= amount;
        this.currentHealth = Math.max(0, Math.round(this.currentHealth));

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

    draw(ctx) {
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
            ctx.fillStyle = this.color;
            this.drawShape(ctx);
        }
        this.drawHealthBar(ctx);
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

    drawShape(ctx) { }

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
    drawShape(ctx) {
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
    drawShape(ctx) {
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
    drawShape(ctx) {
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

function getMonsterCountForWave(wave) { return 5 + wave * 3; }

function prepareNextWave() {
    gameState.currentWave++;
    gameState.betweenWaves = false;
    gameState.monstersToSpawnThisWave = getMonsterCountForWave(gameState.currentWave);
    gameState.monstersSpawnedThisWave = 0;
    gameState.monsters = [];
    gameState.projectiles = [];
    gameState.visualEffects = [];

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
        if (!spawned) {
            monster = new BasicMeleeMonster(spawnPos.x, spawnPos.y, waveNum);
        }
        gameState.monsters.push(monster);
        gameState.monstersSpawnedThisWave++;
    }
    updateUI();
}

function checkWaveEndCondition() {
    if (!gameState.betweenWaves && gameState.monsters.every(m => !m.isAlive)) {
        gameState.betweenWaves = true;
        gameState.timeToNextWave = CONFIG.wave.betweenTime;
        gameState.projectiles = [];
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
        switch (type) {
            case 'SkeletonWarrior': gameState.skeletonWarriorCount++; break;
            case 'EyeMonster': gameState.eyeMonsterCount++; break;
            case 'Wraith': gameState.wraithCount++; break;
        }
        updateUI();
        return true;
    } else {
        if (!holdSummonState.isHolding) {
            showMessage(`靈魂不足 (需要 ${cost})`);
        }
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
        default: return;
    }

    cost = gameState.currentCosts[costKey];
    costIncrement = CONFIG.upgradeCostIncrements[costKey];

    if (gameState.souls >= cost) {
        gameState.souls -= cost;
        gameState[levelKey]++;
        gameState.currentCosts[costKey] += costIncrement;
        gameState.summons.forEach(s => { if (s.isAlive && s.config.type === type) { s.levelUp(); } });
        updateUI(); showMessage(`${unitName} 已升級！ (Lv ${gameState[levelKey]})`);
    } else {
        showMessage(`靈魂不足 (需要 ${cost})`);
    }
}


function handleCanvasPointerDown(event) {
    if (gameState.isPaused || inputState.isPointerDown) return; // Prevent multiple pointers controlling movement
    // Only handle if the event target is the canvas itself
    if (event.target !== canvas) return;

    event.preventDefault(); // Prevent default actions like scrolling ONLY for canvas interaction
    inputState.isPointerDown = true;
    inputState.pointerId = event.pointerId; // Track the specific pointer
    canvas.setPointerCapture(event.pointerId); // Capture the pointer

    const pos = getPointerPosition(event);
    inputState.pointerStartPos = pos;
    inputState.pointerCurrentPos = pos;
    inputState.movementVector = { x: 0, y: 0 };
}

function handleCanvasPointerMove(event) {
    if (gameState.isPaused || !inputState.isPointerDown || event.pointerId !== inputState.pointerId) return;
    if (event.target !== canvas) return; // Ensure move is still over canvas if needed, though capture helps

    // event.preventDefault(); // Usually not needed for move if down prevented scroll

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

    // event.preventDefault(); // Usually not needed for up

    inputState.isPointerDown = false;
    inputState.movementVector = { x: 0, y: 0 };
    canvas.releasePointerCapture(event.pointerId); // Release the captured pointer
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


function startHoldSummon(type) {
    if (gameState.isPaused || holdSummonState.isHolding) return;

    holdSummonState.isHolding = true;
    holdSummonState.type = type;
    holdSummonState.pointerDownTime = performance.now();

    stopHoldSummonInternal(); // Clear any previous timers

    holdSummonState.timeoutId = setTimeout(() => {
        if (!holdSummonState.isHolding || holdSummonState.type !== type) return;

        const success = trySummon(type); // Try first summon after delay

        if (success) { // Only start repeating if the first one worked
             holdSummonState.intervalId = setInterval(() => {
                if (!holdSummonState.isHolding || holdSummonState.type !== type) {
                    stopHoldSummonInternal();
                    return;
                }
                const continuedSuccess = trySummon(type);
                if (!continuedSuccess) {
                     stopHoldSummonInternal(); // Stop repeating if souls run out
                }
            }, CONFIG.summoning.repeatInterval);
        } else {
            // If first attempt failed (e.g. no souls), don't start interval
             holdSummonState.isHolding = false; // Reset holding state
             holdSummonState.type = null;
        }

    }, CONFIG.summoning.holdDelay);
}

function stopHoldSummon(eventTriggeredType = null) {
    // Check if we are actually holding and if the event type matches the button type
    if (holdSummonState.isHolding && holdSummonState.type === eventTriggeredType) {

        const holdDuration = performance.now() - holdSummonState.pointerDownTime;

        // If released *before* the hold delay timeout triggered, treat as a single tap/click
        if (holdSummonState.timeoutId && holdDuration < CONFIG.summoning.holdDelay) {
             trySummon(holdSummonState.type); // Attempt single summon
        }

        // Always clear timers and reset state when pointer interaction ends
        stopHoldSummonInternal();
        holdSummonState.isHolding = false;
        holdSummonState.type = null;
        holdSummonState.pointerDownTime = 0;
    } else if (!eventTriggeredType && holdSummonState.isHolding) {
         // If called without type (e.g., general pointer up/leave outside button),
         // just clear timers and reset state
         stopHoldSummonInternal();
         holdSummonState.isHolding = false;
         holdSummonState.type = null;
         holdSummonState.pointerDownTime = 0;
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
}

function updateUI() {
    const souls = gameState.souls;

    if (gameState.player) {
        uiElements.playerHealthInfo.textContent = `HP: ${gameState.player.currentHealth}/${gameState.player.maxHealth}`;
    } else {
        uiElements.playerHealthInfo.textContent = `HP: -/-`;
    }

    uiElements.soulsInfo.textContent = `靈魂: ${souls}`;
    uiElements.waveInfo.textContent = `第${gameState.currentWave}波`;

    if (gameState.betweenWaves && gameState.currentWave >= 0) {
        uiElements.timerInfo.textContent = `下一波: 倒數 ${Math.ceil(gameState.timeToNextWave)} 秒`;
    } else if (!gameState.betweenWaves) {
        const aliveOnMap = gameState.monsters.filter(m => m.isAlive).length;
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

        uiMap.summonBtn.innerHTML = `召喚 (${summonCost}魂)`;
        uiMap.upgradeBtn.innerHTML = `升級 (${upgradeCost}魂)`;
        setButtonState(uiMap.summonBtn, souls >= summonCost && !gameState.isPaused && !gameState.gameOver);
        setButtonState(uiMap.upgradeBtn, souls >= upgradeCost && !gameState.isPaused && !gameState.gameOver);
    }

    updateUnitUI('SkeletonWarrior');
    updateUnitUI('EyeMonster');
    updateUnitUI('Wraith');

    uiElements.pauseResumeBtn.textContent = gameState.isPaused ? '繼續' : '暫停';
    uiElements.pauseResumeBtn.disabled = gameState.gameOver; // Disable pause when game over
}

function setButtonState(button, canUse) {
    button.disabled = !canUse;
    if (canUse && button.innerHTML.includes('魂')) { // Only add 'can-afford' to soul cost buttons
        // Re-check soul cost specifically for styling
        const costMatch = button.innerHTML.match(/\((\d+)魂\)/);
        const cost = costMatch ? parseInt(costMatch[1], 10) : 0;
        if (gameState.souls >= cost) {
             button.classList.add('can-afford');
        } else {
             button.classList.remove('can-afford');
             button.disabled = true; // Ensure disabled if cannot afford, even if game isn't paused/over
        }
    } else {
        button.classList.remove('can-afford');
    }
}

function showGameOver() {
    if (gameState.gameOver && uiElements.gameOverScreen.style.display !== 'flex') {
        uiElements.finalWaveText.textContent = `您存活了 ${gameState.currentWave} 波.`;
        uiElements.gameOverScreen.style.display = 'flex';
        localStorage.removeItem(SAVE_KEY);
        updateUI(); // Update button states to disabled
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }
}

const SAVE_KEY = 'necromancerGameState_v11';
const SAVE_VERSION = 11;

function saveGameState() {
    if (!gameState.player || gameState.gameOver || gameState.isPaused) return;

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
    };

    try {
        const savedString = JSON.stringify(stateToSave);
        localStorage.setItem(SAVE_KEY, savedString);
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

        if (loadedState.saveVersion !== SAVE_VERSION) {
            console.warn(`存檔版本不符 (需要 ${SAVE_VERSION}, 找到 ${loadedState.saveVersion}). 清除舊存檔並重置遊戲.`);
            localStorage.removeItem(SAVE_KEY); return false;
        }

        resetGameInternalState();

        gameState.souls = loadedState.souls ?? CONFIG.player.initialSouls;
        gameState.currentWave = loadedState.currentWave ?? 0;
        gameState.timeToNextWave = loadedState.timeToNextWave ?? CONFIG.wave.betweenTime;
        gameState.betweenWaves = loadedState.betweenWaves ?? true;
        gameState.currentCosts = loadedState.currentCosts ?? { ...CONFIG.upgradeCosts };

        gameState.skeletonWarriorLevel = loadedState.skeletonWarriorLevel ?? 0;
        // Fix typo from original code analysis
        gameState.eyeMonsterLevel = loadedState.eyeMonsterLevel ?? 0;
        gameState.wraithLevel = loadedState.wraithLevel ?? 0;
        gameState.skeletonWarriorCount = loadedState.skeletonWarriorCount ?? 0;
        gameState.eyeMonsterCount = loadedState.eyeMonsterCount ?? 0;
        gameState.wraithCount = loadedState.wraithCount ?? 0;

        gameState.player = new Player(canvas.width / 2, canvas.height / 2);
        gameState.player.maxHealth = loadedState.playerMaxHealth ?? CONFIG.player.baseHealth;
        gameState.player.currentHealth = loadedState.playerCurrentHealth ?? gameState.player.maxHealth;
        gameState.player.maxHealth = Math.max(CONFIG.player.baseHealth, Math.round(gameState.player.maxHealth));
        gameState.player.currentHealth = Math.min(gameState.player.maxHealth, Math.max(0, Math.round(gameState.player.currentHealth)));

        console.log("遊戲狀態已從 localStorage 載入 (版本相符)");
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

function resetGameInternalState() {
    if (gameState.messageTimeout) clearTimeout(gameState.messageTimeout);
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
    stopHoldSummonInternal();

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
        skeletonWarriorLevel: 0, eyeMonsterLevel: 0, wraithLevel: 0,
        skeletonWarriorCount: 0, eyeMonsterCount: 0, wraithCount: 0,
        currentCosts: {
            skeletonWarrior: CONFIG.skeletonWarrior.upgradeCostBase,
            eyeMonster: CONFIG.eyeMonster.upgradeCostBase,
            wraith: CONFIG.wraith.upgradeCostBase,
        },
    };
    inputState = { isPointerDown: false, pointerStartPos: { x: 0, y: 0 }, pointerCurrentPos: { x: 0, y: 0 }, movementVector: { x: 0, y: 0 }, pointerId: null };
}

function resetGame() {
    localStorage.removeItem(SAVE_KEY);
    resetGameInternalState();
    gameState.player = new Player(canvas.width / 2, canvas.height / 2);
    uiElements.gameOverScreen.style.display = 'none';
    gameState.isPaused = false;
    updateUI();
    if (animationFrameId === null) {
        gameState.lastTime = performance.now();
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

function togglePause() {
    if (gameState.gameOver) return; // Don't allow pause/resume if game is over

    gameState.isPaused = !gameState.isPaused;
    if (gameState.isPaused) {
        uiElements.pauseResumeBtn.textContent = '繼續';
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        stopHoldSummon(); // Stop hold if paused mid-hold

        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "30px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("已暫停", canvas.width / 2, canvas.height / 2);
    } else {
        uiElements.pauseResumeBtn.textContent = '暫停';
        if (animationFrameId === null) {
            gameState.lastTime = performance.now();
            animationFrameId = requestAnimationFrame(gameLoop);
        }
    }
    updateUI(); // Update button states based on pause
}

let animationFrameId = null;
function gameLoop(currentTime) {
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

    updateTimers(deltaTime);

    const wraiths = gameState.summons.filter(s => s.isAlive && s.config.type === 'Wraith');
    const nonWraiths = gameState.summons.filter(s => s.isAlive && s.config.type !== 'Wraith');
    wraiths.forEach(wraith => wraith.applyBuffAura(nonWraiths));

    if (gameState.player) gameState.player.update(deltaTime, inputState.movementVector);
    gameState.summons.forEach(s => s.update(deltaTime, gameState.monsters, gameState.summons, gameState.player));
    gameState.monsters.forEach(m => m.update(deltaTime, gameState.player, gameState.summons));
    gameState.projectiles.forEach(p => p.update(deltaTime));
    gameState.visualEffects.forEach(e => e.update(deltaTime));

    gameState.summons = gameState.summons.filter(s => s.isAlive);
    gameState.monsters = gameState.monsters.filter(m => m.isAlive);
    gameState.projectiles = gameState.projectiles.filter(p => p.isAlive);
    gameState.visualEffects = gameState.visualEffects.filter(e => e.isAlive);

    checkWaveEndCondition();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    gameState.summons.forEach(s => { if (s.config.type === 'Wraith' && s.isAlive) s.drawAura(ctx); });
    gameState.monsters.forEach(m => m.draw(ctx));
    gameState.summons.forEach(s => s.draw(ctx));
    gameState.projectiles.forEach(p => p.draw(ctx));
    if (gameState.player) gameState.player.draw(ctx);
    gameState.visualEffects.forEach(e => e.draw(ctx));

    updateUI();

    if (!gameState.isPaused && !gameState.gameOver) {
        animationFrameId = requestAnimationFrame(gameLoop);
    } else {
        animationFrameId = null;
    }
}

function init() {
    console.log("Initializing Game with Pointer Events...");

    // Canvas Pointer Listeners for Movement
    canvas.addEventListener('pointerdown', handleCanvasPointerDown);
    canvas.addEventListener('pointermove', handleCanvasPointerMove);
    canvas.addEventListener('pointerup', handleCanvasPointerUp);
    canvas.addEventListener('pointercancel', handleCanvasPointerUp); // Treat cancel like up
    canvas.addEventListener('pointerleave', handleCanvasPointerUp); // Stop if pointer leaves canvas bounds

    // Upgrade Button Click Listeners (simple click is fine)
    uiElements.upgradeSkeletonBtn.addEventListener('click', () => tryUpgrade('SkeletonWarrior'));
    uiElements.upgradeEyeMonsterBtn.addEventListener('click', () => tryUpgrade('EyeMonster'));
    uiElements.upgradeWraithBtn.addEventListener('click', () => tryUpgrade('Wraith'));

    // Summon Button Pointer Listeners for Tap/Hold
    const summonButtons = [
        { btn: uiElements.summonSkeletonBtn, type: 'SkeletonWarrior' },
        { btn: uiElements.summonEyeMonsterBtn, type: 'EyeMonster' },
        { btn: uiElements.summonWraithBtn, type: 'Wraith' },
    ];

    summonButtons.forEach(({ btn, type }) => {
        // Use pointer events for consistent tap/hold across devices
        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault(); // Prevent text selection, etc. on button
            btn.setPointerCapture(e.pointerId); // Capture pointer for this button
            startHoldSummon(type);
        });
        btn.addEventListener('pointerup', (e) => {
            // Pass type to ensure correct hold state is stopped
            stopHoldSummon(type);
            btn.releasePointerCapture(e.pointerId); // Release capture
        });
        // Stop hold if pointer leaves the button area while down
        btn.addEventListener('pointerleave', (e) => {
            // Only stop if currently holding THIS button type
            if (holdSummonState.isHolding && holdSummonState.type === type) {
                 stopHoldSummon(type);
                 btn.releasePointerCapture(e.pointerId);
            }
        });
         // Treat cancel like up/leave
         btn.addEventListener('pointercancel', (e) => {
             if (holdSummonState.isHolding && holdSummonState.type === type) {
                 stopHoldSummon(type);
                 btn.releasePointerCapture(e.pointerId);
             }
         });

    });

    // Other UI Listeners
    uiElements.restartButton.addEventListener('click', resetGame);
    uiElements.pauseResumeBtn.addEventListener('click', togglePause);

    // Load or Start New Game
    if (loadGameState()) {
        restoreSummonsFromLoad();
        updateUI();
        if (gameState.isPaused) {
            uiElements.pauseResumeBtn.textContent = '繼續';
            // Draw initial paused state
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            gameState.summons.forEach(s => { if (s.config.type === 'Wraith' && s.isAlive) s.drawAura(ctx); });
            gameState.monsters.forEach(m => m.draw(ctx));
            gameState.summons.forEach(s => s.draw(ctx));
            gameState.projectiles.forEach(p => p.draw(ctx));
            gameState.visualEffects.forEach(e => e.draw(ctx));
            if (gameState.player) gameState.player.draw(ctx);
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white"; ctx.font = "30px sans-serif"; ctx.textAlign = "center";
            ctx.fillText("已暫停 (讀檔)", canvas.width / 2, canvas.height / 2);
            animationFrameId = null;
        } else {
            gameState.lastTime = performance.now();
            if (animationFrameId === null) {
                animationFrameId = requestAnimationFrame(gameLoop);
            }
        }
    } else {
        resetGame();
    }
}

init();