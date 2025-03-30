// --- 畫布與渲染環境 ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 400;

// --- UI 元素 ---
const uiElements = {
    waveInfo: document.getElementById('wave-info'),
    timerInfo: document.getElementById('timer-info'),
    soulsInfo: document.getElementById('souls-info'),
    playerLevel: document.getElementById('player-level'),
    playerStatsLabel: document.getElementById('player-stats-label'),
    upgradePlayerBtn: document.getElementById('upgrade-player-btn'),
    playerUpgradeCost: document.getElementById('player-upgrade-cost'),
    // 骷髏戰士 UI (變數名維持 skel，但標籤文字已在 HTML 修改)
    skelLevel: document.getElementById('skel-level'),
    skelCount: document.getElementById('skel-count'),
    skelMax: document.getElementById('skel-max'),
    summonSkeletonBtn: document.getElementById('summon-skeleton-btn'),
    upgradeSkeletonBtn: document.getElementById('upgrade-skeleton-btn'),
    skelSummonCost: document.getElementById('skel-summon-cost'),
    skelUpgradeCost: document.getElementById('skel-upgrade-cost'),
    // 骷髏法師 UI
    mageLevel: document.getElementById('mage-level'),
    mageCount: document.getElementById('mage-count'),
    mageMax: document.getElementById('mage-max'),
    summonMageBtn: document.getElementById('summon-mage-btn'),
    upgradeMageBtn: document.getElementById('upgrade-mage-btn'),
    mageSummonCost: document.getElementById('mage-summon-cost'),
    mageUpgradeCost: document.getElementById('mage-upgrade-cost'),
    // 怨靈 UI
    wraithLevel: document.getElementById('wraith-level'),
    wraithCount: document.getElementById('wraith-count'),
    wraithMax: document.getElementById('wraith-max'),
    summonWraithBtn: document.getElementById('summon-wraith-btn'),
    upgradeWraithBtn: document.getElementById('upgrade-wraith-btn'),
    wraithSummonCost: document.getElementById('wraith-summon-cost'),
    wraithUpgradeCost: document.getElementById('wraith-upgrade-cost'),
    pauseResumeBtn: document.getElementById('pause-resume-btn'),
    messageArea: document.getElementById('message-area'),
    gameOverScreen: document.getElementById('game-over-screen'),
    finalWaveText: document.getElementById('final-wave-text'),
    restartButton: document.getElementById('restart-button'),
};

// --- 遊戲設定 ---
const CONFIG = {
    player: {
        baseHealth: 50, baseMoveSpeed: 90, radius: 10, color: 'white',
        initialSouls: 15,
        avoidanceRadius: 15,
        upgradeMaxHealthIncrease: 10,
        upgradeSummonCapIncrease: 1,
        upgradeCostBase: 25,
        upgradeCostIncrement: 15,
    },
    skeletonWarrior: { // *** 已更名為骷髏戰士 ***
        type: 'SkeletonWarrior', baseHealth: 25, baseAttack: 5, radius: 8,
        attackRange: 25, attackSpeed: 1.0, moveSpeed: 80, color: '#E0E0E0',
        iconColor: '#FFFFFF', upgradeBonus: 0.10,
        summonCost: 3,
        upgradeCostBase: 10,
        upgradeCostInc: 5,
        maxCount: 8,
        targetSearchRadius: 150, returnDistance: 50,
        avoidanceRadius: 18, avoidanceForce: 40,
        playerAvoidanceForce: 30,
        wanderRadius: 20, wanderSpeedFactor: 0.3, wanderIntervalMin: 1.5, wanderIntervalMax: 3.0,
    },
    skeletonMage: {
        type: 'SkeletonMage', baseHealth: 8, baseAttack: 7, radius: 7,
        attackRange: 120,
        attackRangeUpgrade: 3,
        attackSpeed: 0.8, moveSpeed: 60, color: '#CABEFF',
        iconColor: '#673AB7', upgradeBonus: 0.10, summonCost: 8,
        upgradeCostBase: 15,
        upgradeCostInc: 8,
        maxCount: 4,
        targetSearchRadius: 180, returnDistance: 30,
        avoidanceRadius: 16, avoidanceForce: 35,
        playerAvoidanceForce: 25,
        wanderRadius: 15, wanderSpeedFactor: 0.3, wanderIntervalMin: 1.8, wanderIntervalMax: 3.5,
        // *** 新增：攻擊特效設定 ***
        projectileColor: '#9575CD', // 法師投射物顏色
        projectileSpeed: 300,      // 投射物速度 (像素/秒)
        projectileRadius: 3,       // 投射物半徑
    },
    wraith: {
        type: 'Wraith', baseHealth: 15, baseAttack: 0, radius: 9,
        attackRange: 0,
        slowRadiusBase: 80,
        slowRadiusUpgrade: 5,
        slowAmountBase: 0.4, slowAmountUpgrade: 0.05,
        slowDuration: 1.5, attackSpeed: 1.0, moveSpeed: 55, color: '#616161',
        iconColor: '#9C27B0', upgradeBonus: 0.15,
        summonCost: 10,
        upgradeCostBase: 20,
        upgradeCostInc: 10,
        maxCount: 3,
        targetSearchRadius: 200, returnDistance: 30,
        avoidanceRadius: 22, avoidanceForce: 40,
        playerAvoidanceForce: 35,
        retreatSpeedFactor: 0.4,
        wanderRadius: 25, wanderSpeedFactor: 0.25, wanderIntervalMin: 2.0, wanderIntervalMax: 4.0,
    },
    basicMeleeMonster: {
        type: 'BasicMelee', baseHealth: 12, baseAttack: 3, radius: 10,
        attackRange: 20, attackSpeed: 1.0, moveSpeed: 50, color: '#D32F2F',
        borderColor: '#795548', soulDrop: 1,
    },
    wave: {
        baseTime: 30, betweenTime: 5, monsterScaleInterval: 5, monsterScaleFactor: 0.10,
        spawnInterval: 0.4,
    },
};

// 在 CONFIG 初始化完成後，再定義 upgradeCosts 和 upgradeCostIncrements
CONFIG.upgradeCosts = {
    player: CONFIG.player.upgradeCostBase,
    skeletonWarrior: CONFIG.skeletonWarrior.upgradeCostBase,
    skeletonMage: CONFIG.skeletonMage.upgradeCostBase,
    wraith: CONFIG.wraith.upgradeCostBase,
};

CONFIG.upgradeCostIncrements = {
    player: CONFIG.player.upgradeCostIncrement,
    skeletonWarrior: CONFIG.skeletonWarrior.upgradeCostInc,
    skeletonMage: CONFIG.skeletonMage.upgradeCostInc,
    wraith: CONFIG.wraith.upgradeCostInc,
};


// --- 遊戲狀態 ---
let gameState = {
    player: null, summons: [], monsters: [],
    projectiles: [], // *** 新增：儲存投射物 ***
    souls: CONFIG.player.initialSouls,
    currentWave: 0,
    monstersToSpawnThisWave: 0, monstersSpawnedThisWave: 0, timeUntilNextSpawn: 0,
    timeToNextWave: CONFIG.wave.betweenTime, betweenWaves: true,
    gameOver: false, lastTime: 0, messageTimeout: null,
    isPaused: false,
    playerLevel: 0,
    skeletonWarriorLevel: 0, skeletonMageLevel: 0, wraithLevel: 0,
    skeletonWarriorCount: 0, skeletonMageCount: 0, wraithCount: 0,
    currentCosts: { ...CONFIG.upgradeCosts },
};

// --- 輸入狀態 ---
let inputState = {
    isPointerDown: false, pointerStartPos: { x: 0, y: 0 },
    pointerCurrentPos: { x: 0, y: 0 }, movementVector: { x: 0, y: 0 }
};

// --- 輔助函數 ---
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


// --- 基礎遊戲物件類別 ---
class GameObject {
    constructor(x, y, radius, color) {
        this.pos = { x, y };
        this.radius = radius;
        this.color = color;
        this.isAlive = true;
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    update(deltaTime) { /* 預留 */ }
}

// --- 玩家類別 ---
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
    applyUpgrade() {
        this.maxHealth += CONFIG.player.upgradeMaxHealthIncrease;
        this.currentHealth = this.maxHealth;
        this.maxHealth = Math.round(this.maxHealth);
        this.currentHealth = Math.round(this.currentHealth);
        console.log(`玩家升級！等級 ${gameState.playerLevel}, 血量上限 ${this.maxHealth}, 召喚上限 +1`);
        updateUI();
    }
    die() {
        this.isAlive = false;
        console.log("玩家死亡！");
        gameState.gameOver = true;
    }
    getSummonPosition() {
        const direction = normalizeVector(inputState.movementVector);
        const spawnDist = this.radius + 15;
        let spawnX = this.pos.x + spawnDist;
        let spawnY = this.pos.y;
        if (direction.x !== 0 || direction.y !== 0) {
            spawnX = this.pos.x + direction.x * spawnDist;
            spawnY = this.pos.y + direction.y * spawnDist;
        }
        spawnX = Math.max(this.radius + 5, Math.min(canvas.width - this.radius - 5, spawnX));
        spawnY = Math.max(this.radius + 5, Math.min(canvas.height - this.radius - 5, spawnY));
        return { x: spawnX, y: spawnY };
    }
    draw(ctx) {
        super.draw(ctx); // 繪製玩家本體
        // 繪製血條 (總是在玩家上方，因為玩家最後繪製)
        if (this.isAlive && this.currentHealth < this.maxHealth) {
            const barWidth = this.radius * 2;
            const barHeight = 5;
            const barX = this.pos.x - barWidth / 2;
            const barY = this.pos.y - this.radius - barHeight - 3;
            const healthPercent = this.currentHealth / this.maxHealth;
            ctx.fillStyle = '#555';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : (healthPercent > 0.2 ? '#FFC107' : '#F44336');
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        }
    }
}

// --- 召喚物基礎類別 ---
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

        if (this.config.type === 'Wraith') {
            this.isRetreatingToPlayer = false;
        }
    }

    applyLevelStats() {
        const multiplier = 1 + (this.level * this.config.upgradeBonus);
        if (this.config.upgradeBonus > 0) {
             this.maxHealth = Math.round(this.config.baseHealth * multiplier);
        } else {
             this.maxHealth = this.config.baseHealth;
        }
        if (this.config.type !== 'Wraith' && this.config.upgradeBonus > 0) {
            this.attack = this.config.baseAttack * multiplier;
        } else {
            this.attack = this.config.baseAttack;
        }
        if (this.config.type === 'SkeletonMage') {
            this.attackRange = this.config.attackRange + (this.level * this.config.attackRangeUpgrade);
        } else {
            this.attackRange = this.config.attackRange;
        }
        if (this.config.type === 'Wraith') {
            this.slowRadius = this.config.slowRadiusBase + (this.level * this.config.slowRadiusUpgrade);
            this.slowAmount = this.config.slowAmountBase + (this.level * this.config.slowAmountUpgrade);
            this.slowRadiusSq = this.slowRadius * this.slowRadius;
        } else {
            this.slowRadius = 0;
            this.slowAmount = 0;
        }
        this.attackRangeSq = this.attackRange * this.attackRange;
        this.attackSpeed = this.config.attackSpeed;
        this.moveSpeed = this.config.moveSpeed;
        if (this.currentHealth > 0 && this.level > 0 && this.config.upgradeBonus > 0) {
            const healthGainPerLevel = Math.round(this.config.baseHealth * this.config.upgradeBonus);
            if (healthGainPerLevel > 0) {
                this.currentHealth += healthGainPerLevel;
                this.currentHealth = Math.min(this.maxHealth, Math.round(this.currentHealth));
            }
        }
        this.maxHealth = Math.round(this.maxHealth);
        this.currentHealth = Math.round(this.currentHealth);
        this.currentHealth = Math.min(this.currentHealth, this.maxHealth);
    }

    update(deltaTime, monsters, otherSummons) {
        if (!this.isAlive) return;
        if (this.attackCooldown > 0) { this.attackCooldown -= deltaTime; }

        this.updateAI(deltaTime, monsters); // 更新 AI 狀態 (目標、返回、撤退)

        let moveDirection = { x: 0, y: 0 };
        let finalMoveSpeed = this.moveSpeed;
        let isIdle = true;

        // 處理怨靈撤退 (優先)
        if (this.config.type === 'Wraith' && this.isRetreatingToPlayer) {
            isIdle = false;
            const directionToPlayer = normalizeVector({ x: this.playerTransform.pos.x - this.pos.x, y: this.playerTransform.pos.y - this.pos.y });
            moveDirection = directionToPlayer;
            finalMoveSpeed = this.moveSpeed * this.config.retreatSpeedFactor;
        }
        // 處理追擊目標
        else if (this.target) {
            isIdle = false;
            const targetDistSq = distanceSq(this.pos, this.target.pos);
            const engageRangeSq = this.attackRangeSq;
            if (targetDistSq > engageRangeSq * 0.95) {
                moveDirection = normalizeVector({ x: this.target.pos.x - this.pos.x, y: this.target.pos.y - this.pos.y });
            } else {
                moveDirection = {x: 0, y: 0};
            }
        }
        // 處理返回玩家
        else if (this.isReturning) {
            isIdle = false;
            const playerPos = this.playerTransform.pos;
            const distToPlayerSq = distanceSq(this.pos, playerPos);
            const returnThresholdSq = this.config.returnDistance * this.config.returnDistance;
            if (distToPlayerSq > returnThresholdSq * 0.8) {
                moveDirection = normalizeVector({ x: playerPos.x - this.pos.x, y: playerPos.y - this.pos.y });
            } else {
                 this.isReturning = false;
                 moveDirection = {x: 0, y: 0};
            }
        }

        // 避讓邏輯 (總是計算並應用)
        const avoidanceVector = this.avoidOverlap(otherSummons, this.playerTransform);
        this.pos.x += avoidanceVector.x * deltaTime;
        this.pos.y += avoidanceVector.y * deltaTime;

        // 閒置漫遊
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
                    if (moveDirection.x === 0 && moveDirection.y === 0) {
                        moveDirection = wanderDir;
                        finalMoveSpeed = this.moveSpeed * this.config.wanderSpeedFactor;
                    }
                } else {
                    this.isWandering = false;
                }
            }
        } else {
            this.isWandering = false;
        }

        // 應用最終的移動向量
        if (moveDirection.x !== 0 || moveDirection.y !== 0) {
            this.pos.x += moveDirection.x * finalMoveSpeed * deltaTime;
            this.pos.y += moveDirection.y * finalMoveSpeed * deltaTime;
        }

         // 邊界限制
         this.pos.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.pos.x));
         this.pos.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.pos.y));

        // 攻擊 / 光環邏輯
        if (this.attackCooldown <= 0) {
            if (this.config.type === 'Wraith') {
                 let monsterInRangeForAura = false;
                 for (const monster of monsters) {
                     if (monster.isAlive && distanceSq(this.pos, monster.pos) <= this.slowRadiusSq) {
                         monsterInRangeForAura = true;
                         break;
                     }
                 }
                 if (monsterInRangeForAura) {
                    this.applySlowAura(monsters);
                    this.attackCooldown = 1.0 / this.attackSpeed;
                 }
            } else if (this.target) {
                 const targetDistSq = distanceSq(this.pos, this.target.pos);
                 if (targetDistSq <= this.attackRangeSq) {
                    this.attackTarget(); // 呼叫攻擊方法
                 }
            }
        }
    }

    updateAI(deltaTime, monsters) {
        if (this.config.type === 'Wraith') {
            let monsterInRange = false;
            for (const monster of monsters) {
                if (monster.isAlive && distanceSq(this.pos, monster.pos) <= this.slowRadiusSq) {
                    monsterInRange = true;
                    break;
                }
            }
            this.isRetreatingToPlayer = monsterInRange;
            if (this.isRetreatingToPlayer) {
                this.target = null;
                this.isReturning = false;
                this.isWandering = false;
                return;
            }
        }

        if (this.target && (!this.target.isAlive || distanceSq(this.pos, this.target.pos) > this.config.targetSearchRadius * this.config.targetSearchRadius * 1.5)) {
            this.target = null;
        }
        if (!this.target) {
            this.target = this.findNearestMonster(monsters);
            if (this.target) {
                this.isReturning = false;
                this.isWandering = false;
            }
        }
        if (!this.target) {
            const distToPlayerSq = distanceSq(this.pos, this.playerTransform.pos);
            const returnDistSq = this.config.returnDistance * this.config.returnDistance;
            if (distToPlayerSq > returnDistSq * 1.2) {
                this.isReturning = true;
                this.isWandering = false;
            } else if (this.isReturning && distToPlayerSq < returnDistSq * 0.8) {
                this.isReturning = false;
            }
        }
    }

    avoidOverlap(otherSummons, player) {
        let totalPushX = 0; let totalPushY = 0;
        const avoidanceRadiusSq = this.config.avoidanceRadius * this.config.avoidanceRadius;
        const playerAvoidanceForce = this.config.playerAvoidanceForce || this.config.avoidanceForce;
        const playerCombinedRadius = this.radius + player.radius + 5;
        const playerAvoidanceRadiusSq = playerCombinedRadius * playerCombinedRadius;

        otherSummons.forEach(other => {
            if (other !== this && other.isAlive) {
                const dSq = distanceSq(this.pos, other.pos);
                if (dSq < avoidanceRadiusSq && dSq > 0.01) {
                    const distance = Math.sqrt(dSq);
                    const pushDirectionX = (this.pos.x - other.pos.x) / distance;
                    const pushDirectionY = (this.pos.y - other.pos.y) / distance;
                    const pushStrength = 1.0 - (distance / this.config.avoidanceRadius);
                    totalPushX += pushDirectionX * pushStrength * this.config.avoidanceForce;
                    totalPushY += pushDirectionY * pushStrength * this.config.avoidanceForce;
                }
            }
        });

        if (player && player.isAlive) {
            const dSqPlayer = distanceSq(this.pos, player.pos);
            if (dSqPlayer < playerAvoidanceRadiusSq && dSqPlayer > 0.01) {
                const distancePlayer = Math.sqrt(dSqPlayer);
                const pushDirectionXPlayer = (this.pos.x - player.pos.x) / distancePlayer;
                const pushDirectionYPlayer = (this.pos.y - player.pos.y) / distancePlayer;
                const pushStrengthPlayer = 1.0 - (distancePlayer / playerCombinedRadius);
                totalPushX += pushDirectionXPlayer * pushStrengthPlayer * playerAvoidanceForce;
                totalPushY += pushDirectionYPlayer * pushStrengthPlayer * playerAvoidanceForce;
            }
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

    attackTarget() { // *** 修改：只有法師需要創建投射物 ***
        if (!this.target || !this.target.isAlive) return;

        if (this.config.type === 'SkeletonMage') {
            // 創建投射物
            const projectile = new Projectile(
                this.pos.x, this.pos.y, // 起點是法師位置
                this.target, // 目標物件
                this.config // 傳遞法師的配置以獲取投射物屬性
            );
            gameState.projectiles.push(projectile);
            console.log("法師發射投射物");
        } else if (this.config.type !== 'Wraith') { // 其他非怨靈單位直接造成傷害
            this.target.takeDamage(this.attack);
        }

        this.attackCooldown = 1.0 / this.attackSpeed; // 重置冷卻
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
            case 'SkeletonMage': gameState.skeletonMageCount--; break;
            case 'Wraith': gameState.wraithCount--; break;
        }
        updateUI();
    }
}

// --- 骷髏戰士類別 ---
class SkeletonWarrior extends SummonUnit { // *** 已更名 ***
    constructor(x, y, level, playerTransform) {
        super(x, y, CONFIG.skeletonWarrior, level, playerTransform);
    }
    draw(ctx) {
        super.draw(ctx);
        ctx.strokeStyle = this.config.iconColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const swordLength = this.radius * 0.8;
        ctx.moveTo(this.pos.x - swordLength / 2, this.pos.y + swordLength / 2);
        ctx.lineTo(this.pos.x + swordLength / 2, this.pos.y - swordLength / 2);
        ctx.moveTo(this.pos.x - swordLength / 2, this.pos.y - swordLength / 2);
        ctx.lineTo(this.pos.x + swordLength / 2, this.pos.y + swordLength / 2);
        ctx.stroke();
    }
}

// --- 骷髏法師類別 ---
class SkeletonMage extends SummonUnit {
    constructor(x, y, level, playerTransform) {
        super(x, y, CONFIG.skeletonMage, level, playerTransform);
    }
    draw(ctx) {
        super.draw(ctx);
        ctx.strokeStyle = this.config.iconColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const staffHeight = this.radius * 1.2;
        ctx.moveTo(this.pos.x, this.pos.y + staffHeight / 2);
        ctx.lineTo(this.pos.x, this.pos.y - staffHeight / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y - staffHeight / 2, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = this.config.iconColor;
        ctx.fill();
    }
    // attackTarget() - 已在基類修改，會創建投射物
}

// --- 怨靈類別 ---
class Wraith extends SummonUnit {
    constructor(x, y, level, playerTransform) {
        super(x, y, CONFIG.wraith, level, playerTransform);
    }

    // *** 新增：繪製光環的方法 ***
    drawAura(ctx) {
        if (!this.isAlive) return;
        ctx.fillStyle = this.config.iconColor + '2A'; // 更透明一些 '33' -> '2A'
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.slowRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    draw(ctx) { // *** 修改：只繪製本體和血條 ***
        if (!this.isAlive) return;
        // 繪製本體 (調用基類 draw)
        super.draw(ctx);
        // 繪製眼睛
        ctx.fillStyle = '#FFFFFF99';
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        // 繪製血條
         if (this.currentHealth < this.maxHealth) { // isAlive 已在開頭檢查
            const barWidth = this.radius * 1.6;
            const barHeight = 3;
            const barX = this.pos.x - barWidth / 2;
            const barY = this.pos.y - this.radius - barHeight - 5;
            const healthPercent = this.currentHealth / this.maxHealth;
            ctx.fillStyle = '#555';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : (healthPercent > 0.2 ? '#FFC107' : '#F44336');
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
         }
    }
    attackTarget() { /* 怨靈無直接攻擊 */ }
}

// *** 新增：投射物類別 ***
class Projectile extends GameObject {
    constructor(startX, startY, target, shooterConfig) {
        super(startX, startY, shooterConfig.projectileRadius, shooterConfig.projectileColor);
        this.target = target; // 目標物件
        this.speed = shooterConfig.projectileSpeed;
        this.damage = shooterConfig.baseAttack; // 繼承發射者的基礎攻擊力 (暫不考慮升級加成給投射物)
        this.targetPos = { ...target.pos }; // *** 記錄目標攻擊時的位置 ***
        this.direction = normalizeVector({ x: this.targetPos.x - startX, y: this.targetPos.y - startY });
    }

    update(deltaTime) {
        if (!this.isAlive) return;

        // 向目標初始位置移動
        this.pos.x += this.direction.x * this.speed * deltaTime;
        this.pos.y += this.direction.y * this.speed * deltaTime;

        // 檢查是否到達或超過目標初始位置 (或者可以檢查是否擊中當前目標位置)
        const distToTargetSq = distanceSq(this.pos, this.target.pos); // 檢查當前目標位置
        const hitRadiusSq = (this.radius + this.target.radius) * (this.radius + this.target.radius);

        if (distToTargetSq <= hitRadiusSq) {
            // 擊中目標
            if (this.target.isAlive) {
                this.target.takeDamage(this.damage); // 對目標造成傷害
            }
            this.isAlive = false; // 投射物消失
            // console.log("Projectile hit target");
        }

        // 檢查是否飛出畫面外太遠 (防止無限飛行)
        const margin = 50;
        if (this.pos.x < -margin || this.pos.x > canvas.width + margin ||
            this.pos.y < -margin || this.pos.y > canvas.height + margin) {
            this.isAlive = false;
            // console.log("Projectile out of bounds");
        }
    }
    // draw 方法繼承自 GameObject (繪製一個小圓點)
}


// --- 怪物基礎類別 ---
class Monster extends GameObject {
    constructor(x, y, config, waveNumber) {
        super(x, y, config.radius, config.color);
        this.config = config;
        this.attackCooldown = 0;
        this.target = null;
        this.speedMultiplier = 1.0;
        this.slowTimer = 0;
        this.applyWaveScaling(waveNumber);
        this.currentHealth = this.maxHealth;
    }
    applyWaveScaling(wave) {
        const scaleLevel = Math.floor((wave -1) / CONFIG.wave.monsterScaleInterval);
        const multiplier = 1 + (scaleLevel * CONFIG.wave.monsterScaleFactor);
        this.maxHealth = Math.round(this.config.baseHealth * multiplier);
        this.attack = this.config.baseAttack * multiplier;
        this.attackRangeSq = this.config.attackRange * this.config.attackRange;
        this.attackSpeed = this.config.attackSpeed;
        this.baseMoveSpeed = this.config.moveSpeed;
        this.moveSpeed = this.baseMoveSpeed;
        this.maxHealth = Math.round(this.maxHealth);
        this.currentHealth = this.maxHealth;
    }

    update(deltaTime, player, summons) {
        if (!this.isAlive) return;

        if (this.slowTimer > 0) {
            this.slowTimer -= deltaTime;
            if (this.slowTimer <= 0) {
                this.speedMultiplier = 1.0;
            }
        }
        this.moveSpeed = this.baseMoveSpeed * this.speedMultiplier;

        if (this.attackCooldown > 0) { this.attackCooldown -= deltaTime; }

        this.findTarget(player, summons);

        let moveDirection = { x: 0, y: 0 };
        if (this.target && distanceSq(this.pos, this.target.pos) > this.attackRangeSq * 0.95) {
            moveDirection = normalizeVector({ x: this.target.pos.x - this.pos.x, y: this.target.pos.y - this.pos.y });
        } else {
             moveDirection = { x: 0, y: 0 };
        }

        if (moveDirection.x !== 0 || moveDirection.y !== 0) {
            this.pos.x += moveDirection.x * this.moveSpeed * deltaTime;
            this.pos.y += moveDirection.y * this.moveSpeed * deltaTime;
        }

        if (this.target && this.attackCooldown <= 0 && distanceSq(this.pos, this.target.pos) <= this.attackRangeSq) {
            this.attackTarget();
        }
    }

    findTarget(player, summons) {
        let closestTarget = null;
        let minDistanceSq = Infinity;

        if (player.isAlive) {
            const dSq = distanceSq(this.pos, player.pos);
            if (dSq < minDistanceSq) {
                minDistanceSq = dSq;
                closestTarget = player;
            }
        }
        summons.forEach(summon => {
            if (summon.isAlive) {
                const dSq = distanceSq(this.pos, summon.pos);
                if (dSq < minDistanceSq) {
                    minDistanceSq = dSq;
                    closestTarget = summon;
                }
            }
        });
        this.target = closestTarget;
    }
    attackTarget() {
        if (!this.target || !this.target.isAlive) return;
        this.target.takeDamage(this.attack);
        this.attackCooldown = 1.0 / this.attackSpeed;
    }
    takeDamage(amount) {
        if (!this.isAlive) return;
        this.currentHealth -= amount;
        this.currentHealth = Math.max(0, Math.round(this.currentHealth));
        const originalColor = this.color; this.color = 'white'; setTimeout(() => { if(this.isAlive) this.color = originalColor; }, 50);
        if (this.currentHealth <= 0) { this.die(); }
    }
    die() {
        this.isAlive = false; console.log(`${this.config.type} 死亡.`);
        gameState.souls += this.config.soulDrop;
        updateUI();
    }
    draw(ctx) {
        if (this.config.borderColor) { ctx.fillStyle = this.config.borderColor; ctx.beginPath(); ctx.arc(this.pos.x, this.pos.y, this.radius + 1, 0, Math.PI * 2); ctx.fill(); }
        super.draw(ctx);
        if (this.currentHealth < this.maxHealth && this.isAlive) {
            const barWidth = this.radius * 1.6;
            const barHeight = 4;
            const barX = this.pos.x - barWidth / 2;
            const barY = this.pos.y - this.radius - barHeight - 2;
            const healthPercent = this.currentHealth / this.maxHealth;
            ctx.fillStyle = '#555';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : (healthPercent > 0.2 ? '#FFC107' : '#F44336');
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
         }
    }
    applySlow(amount, duration) {
        this.speedMultiplier = 1.0 - amount;
        this.slowTimer = Math.max(this.slowTimer, duration);
    }
}

// --- 基礎近戰怪物類別 ---
class BasicMeleeMonster extends Monster { constructor(x, y, waveNumber) { super(x, y, CONFIG.basicMeleeMonster, waveNumber); } }


// --- 遊戲邏輯函數 ---

function trySpawnMonster(deltaTime) {
    if (gameState.betweenWaves || gameState.monstersSpawnedThisWave >= gameState.monstersToSpawnThisWave) { return; }
    gameState.timeUntilNextSpawn -= deltaTime;
    if (gameState.timeUntilNextSpawn <= 0) {
        const spawnPos = getRandomPositionOutsideCanvas();
        const monster = new BasicMeleeMonster(spawnPos.x, spawnPos.y, gameState.currentWave);
        gameState.monsters.push(monster);
        gameState.monstersSpawnedThisWave++;
        gameState.timeUntilNextSpawn = CONFIG.wave.spawnInterval;
    }
}

function getMonsterCountForWave(wave) {
    return 3 + wave * 2;
}

function prepareNextWave() {
    gameState.currentWave++;
    gameState.betweenWaves = false;
    gameState.monstersToSpawnThisWave = getMonsterCountForWave(gameState.currentWave);
    gameState.monstersSpawnedThisWave = 0;
    gameState.timeUntilNextSpawn = 0;
    console.log(`準備開始第 ${gameState.currentWave} 波，共 ${gameState.monstersToSpawnThisWave} 隻怪物`);
    updateUI();
}

function checkWaveEndCondition() {
    if (!gameState.betweenWaves &&
        gameState.monstersSpawnedThisWave >= gameState.monstersToSpawnThisWave &&
        gameState.monsters.every(m => !m.isAlive))
    {
        console.log(`第 ${gameState.currentWave} 波 已清空!`);
        gameState.betweenWaves = true;
        gameState.timeToNextWave = CONFIG.wave.betweenTime;
        gameState.monsters = [];
        saveGameState(); // 波次結束時儲存遊戲
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
    }, duration);
}

// --- 召喚邏輯 ---
function trySummon(type) {
    let config, cost, currentCount, maxCount, level, SummonClass;
    const summonCapBonus = gameState.playerLevel * CONFIG.player.upgradeSummonCapIncrease;

    switch(type) {
        case 'SkeletonWarrior':
            config = CONFIG.skeletonWarrior; cost = config.summonCost;
            currentCount = gameState.skeletonWarriorCount;
            maxCount = config.maxCount + summonCapBonus;
            level = gameState.skeletonWarriorLevel; SummonClass = SkeletonWarrior;
            break;
         case 'SkeletonMage':
            config = CONFIG.skeletonMage; cost = config.summonCost;
            currentCount = gameState.skeletonMageCount;
            maxCount = config.maxCount + summonCapBonus;
            level = gameState.skeletonMageLevel; SummonClass = SkeletonMage;
            break;
         case 'Wraith':
            config = CONFIG.wraith; cost = config.summonCost;
            currentCount = gameState.wraithCount;
            maxCount = config.maxCount + summonCapBonus;
            level = gameState.wraithLevel; SummonClass = Wraith;
            break;
        default: console.error("未知的召喚物類型:", type); return;
    }

    if (currentCount >= maxCount) {
        showMessage(`${config.type} 數量已達上限 (${maxCount})`); return;
    }
    if (gameState.souls >= cost) {
        gameState.souls -= cost;
        const spawnPos = gameState.player.getSummonPosition();
        const newSummon = new SummonClass(spawnPos.x, spawnPos.y, level, gameState.player);
        gameState.summons.push(newSummon);
        switch (type) {
            case 'SkeletonWarrior': gameState.skeletonWarriorCount++; break;
            case 'SkeletonMage': gameState.skeletonMageCount++; break;
            case 'Wraith': gameState.wraithCount++; break;
        }
        console.log(`召喚了 ${type}`);
        updateUI();
    } else {
        showMessage(`靈魂不足 (需要 ${cost})`);
    }
}

// --- 升級邏輯 ---
function tryUpgrade(type) {
    let cost, costIncrement, costKey, levelKey;
    switch(type) {
        case 'Player':
            costKey = 'player'; levelKey = 'playerLevel';
            cost = gameState.currentCosts[costKey];
            costIncrement = CONFIG.upgradeCostIncrements[costKey];
            if (gameState.souls >= cost) {
                gameState.souls -= cost;
                gameState[levelKey]++;
                gameState.currentCosts[costKey] += costIncrement;
                gameState.player.applyUpgrade();
                updateUI(); showMessage("玩家已升級！生命回滿，上限增加！");
            } else { showMessage(`需要 ${cost} 靈魂`); }
            break;
        case 'SkeletonWarrior':
            costKey = 'skeletonWarrior'; levelKey = 'skeletonWarriorLevel';
            cost = gameState.currentCosts[costKey];
            costIncrement = CONFIG.upgradeCostIncrements[costKey];
            if (gameState.souls >= cost) {
                gameState.souls -= cost;
                gameState[levelKey]++;
                gameState.currentCosts[costKey] += costIncrement;
                gameState.summons.forEach(s => { if (s.isAlive && s.config.type === type) { s.levelUp(); } });
                updateUI(); showMessage("骷髏戰士已升級！");
            } else { showMessage(`需要 ${cost} 靈魂`); }
            break;
         case 'SkeletonMage':
            costKey = 'skeletonMage'; levelKey = 'skeletonMageLevel';
            cost = gameState.currentCosts[costKey];
            costIncrement = CONFIG.upgradeCostIncrements[costKey];
            if (gameState.souls >= cost) {
                gameState.souls -= cost;
                gameState[levelKey]++;
                gameState.currentCosts[costKey] += costIncrement;
                gameState.summons.forEach(s => { if (s.isAlive && s.config.type === type) { s.levelUp(); } });
                updateUI(); showMessage("骷髏法師已升級！");
            } else { showMessage(`需要 ${cost} 靈魂`); }
            break;
         case 'Wraith':
            costKey = 'wraith'; levelKey = 'wraithLevel';
             cost = gameState.currentCosts[costKey];
            costIncrement = CONFIG.upgradeCostIncrements[costKey];
            if (gameState.souls >= cost) {
                gameState.souls -= cost;
                gameState[levelKey]++;
                gameState.currentCosts[costKey] += costIncrement;
                 gameState.summons.forEach(s => { if (s.isAlive && s.config.type === type) { s.levelUp(); } });
                updateUI(); showMessage("怨靈已升級！");
            } else { showMessage(`需要 ${cost} 靈魂`); }
            break;
        default: console.error("未知的升級類型:", type); return;
    }
}


// --- 輸入處理 ---
function handlePointerDown(event) {
    if (gameState.isPaused) return;
    if (event.target === canvas) { event.preventDefault(); } else { return; }
    inputState.isPointerDown = true;
    const pos = getPointerPosition(event);
    inputState.pointerStartPos = pos;
    inputState.pointerCurrentPos = pos;
    inputState.movementVector = { x: 0, y: 0 };
}
function handlePointerMove(event) {
    if (gameState.isPaused || !inputState.isPointerDown) return;
    event.preventDefault();
    const pos = getPointerPosition(event);
    inputState.pointerCurrentPos = pos;
    const deltaX = inputState.pointerCurrentPos.x - inputState.pointerStartPos.x;
    const deltaY = inputState.pointerCurrentPos.y - inputState.pointerStartPos.y;
    inputState.movementVector = normalizeVector({ x: deltaX, y: deltaY });
}
function handlePointerUp(event) {
    inputState.isPointerDown = false;
    inputState.movementVector = { x: 0, y: 0 };
}
function getPointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else if (event.changedTouches && event.changedTouches.length > 0) {
        clientX = event.changedTouches[0].clientX; clientY = event.changedTouches[0].clientY;
    } else {
        clientX = event.clientX; clientY = event.clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
}

// --- UI 更新函數 ---
function updateUI() {
    const souls = gameState.souls;

    if (gameState.player) {
        uiElements.playerLevel.textContent = `Lv ${gameState.playerLevel}`;
        uiElements.playerStatsLabel.innerHTML = `HP: ${gameState.player.currentHealth}/${gameState.player.maxHealth}`;
        const playerUpgradeCost = gameState.currentCosts.player;
        uiElements.playerUpgradeCost.textContent = playerUpgradeCost;
        setButtonState(uiElements.upgradePlayerBtn, souls >= playerUpgradeCost);
    }

    uiElements.soulsInfo.textContent = `靈魂: ${souls}`;

    uiElements.waveInfo.textContent = `波次: ${gameState.currentWave}`;
    if (gameState.betweenWaves && gameState.currentWave >= 0) {
        uiElements.timerInfo.textContent = `下一波: ${Math.ceil(gameState.timeToNextWave)}s`;
    } else if (!gameState.betweenWaves) {
        const remainingMonsters = gameState.monstersToSpawnThisWave - gameState.monstersSpawnedThisWave + gameState.monsters.filter(m => m.isAlive).length;
        uiElements.timerInfo.textContent = `怪物剩餘: ${remainingMonsters}`;
    } else {
         uiElements.timerInfo.textContent = `準備開始`;
    }

    const summonCapBonus = gameState.playerLevel * CONFIG.player.upgradeSummonCapIncrease;

    const skelConfig = CONFIG.skeletonWarrior;
    const skelCount = gameState.skeletonWarriorCount;
    const skelMax = skelConfig.maxCount + summonCapBonus;
    const skelSummonCost = skelConfig.summonCost;
    const skelLevel = gameState.skeletonWarriorLevel;
    const skelUpgradeCost = gameState.currentCosts.skeletonWarrior;
    uiElements.skelLevel.textContent = `Lv ${skelLevel}`;
    uiElements.skelCount.textContent = skelCount;
    uiElements.skelMax.textContent = skelMax;
    uiElements.skelSummonCost.textContent = skelSummonCost;
    uiElements.skelUpgradeCost.textContent = skelUpgradeCost;
    setButtonState(uiElements.summonSkeletonBtn, souls >= skelSummonCost, skelCount >= skelMax);
    setButtonState(uiElements.upgradeSkeletonBtn, souls >= skelUpgradeCost);

    const mageConfig = CONFIG.skeletonMage;
    const mageCount = gameState.skeletonMageCount;
    const mageMax = mageConfig.maxCount + summonCapBonus;
    const mageSummonCost = mageConfig.summonCost;
    const mageLevel = gameState.skeletonMageLevel;
    const mageUpgradeCost = gameState.currentCosts.skeletonMage;
    uiElements.mageLevel.textContent = `Lv ${mageLevel}`;
    uiElements.mageCount.textContent = mageCount;
    uiElements.mageMax.textContent = mageMax;
    uiElements.mageSummonCost.textContent = mageSummonCost;
    uiElements.mageUpgradeCost.textContent = mageUpgradeCost;
    setButtonState(uiElements.summonMageBtn, souls >= mageSummonCost, mageCount >= mageMax);
    setButtonState(uiElements.upgradeMageBtn, souls >= mageUpgradeCost);

    const wraithConfig = CONFIG.wraith;
    const wraithCount = gameState.wraithCount;
    const wraithMax = wraithConfig.maxCount + summonCapBonus;
    const wraithSummonCost = wraithConfig.summonCost;
    const wraithLevel = gameState.wraithLevel;
    const wraithUpgradeCost = gameState.currentCosts.wraith;
    uiElements.wraithLevel.textContent = `Lv ${wraithLevel}`;
    uiElements.wraithCount.textContent = wraithCount;
    uiElements.wraithMax.textContent = wraithMax;
    uiElements.wraithSummonCost.textContent = wraithSummonCost;
    uiElements.wraithUpgradeCost.textContent = wraithUpgradeCost;
    setButtonState(uiElements.summonWraithBtn, souls >= wraithSummonCost, wraithCount >= wraithMax);
    setButtonState(uiElements.upgradeWraithBtn, souls >= wraithUpgradeCost);

    uiElements.pauseResumeBtn.textContent = gameState.isPaused ? '繼續' : '暫停';
}

function setButtonState(button, canAfford, isMaxCount = false) {
    const isDisabled = !canAfford || isMaxCount;
    button.disabled = isDisabled;
    if (canAfford && !isMaxCount) {
        button.classList.add('can-afford');
    } else {
        button.classList.remove('can-afford');
    }
}

function showGameOver() {
    uiElements.finalWaveText.textContent = `您存活了 ${gameState.currentWave} 波.`;
    uiElements.gameOverScreen.style.display = 'block';
    // *** 新增：遊戲結束時清除存檔 ***
    localStorage.removeItem(SAVE_KEY);
    console.log("遊戲結束，已清除存檔。");
}

// --- 存檔和讀檔功能 ---
const SAVE_KEY = 'necromancerGameState';

function saveGameState() {
    if (!gameState.player || gameState.gameOver || gameState.isPaused) return; // 暫停或結束時不存

    const stateToSave = {
        souls: gameState.souls,
        currentWave: gameState.currentWave,
        timeToNextWave: gameState.timeToNextWave,
        betweenWaves: gameState.betweenWaves,
        playerLevel: gameState.playerLevel,
        playerCurrentHealth: gameState.player.currentHealth,
        playerMaxHealth: gameState.player.maxHealth,
        skeletonWarriorLevel: gameState.skeletonWarriorLevel,
        skeletonMageLevel: gameState.skeletonMageLevel,
        wraithLevel: gameState.wraithLevel,
        skeletonWarriorCount: gameState.skeletonWarriorCount, // 保存數量
        skeletonMageCount: gameState.skeletonMageCount,     // 保存數量
        wraithCount: gameState.wraithCount,               // 保存數量
        currentCosts: gameState.currentCosts,
    };

    try {
        const savedString = JSON.stringify(stateToSave);
        localStorage.setItem(SAVE_KEY, savedString);
        console.log("遊戲狀態已儲存 (波次結束)");
        showMessage("進度已儲存", 1500);
    } catch (error) {
        console.error("儲存遊戲狀態失敗:", error);
        showMessage("儲存失敗!", 1500);
    }
}

function loadGameState() {
    const savedString = localStorage.getItem(SAVE_KEY);
    if (savedString) {
        try {
            const loadedState = JSON.parse(savedString);
            resetGameInternalState();

            // 恢復讀取的數值
            gameState.souls = loadedState.souls ?? CONFIG.player.initialSouls;
            gameState.currentWave = loadedState.currentWave ?? 0;
            gameState.timeToNextWave = loadedState.timeToNextWave ?? CONFIG.wave.betweenTime;
            gameState.betweenWaves = loadedState.betweenWaves ?? true;
            gameState.playerLevel = loadedState.playerLevel ?? 0;
            gameState.skeletonWarriorLevel = loadedState.skeletonWarriorLevel ?? 0;
            gameState.skeletonMageLevel = loadedState.skeletonMageLevel ?? 0;
            gameState.wraithLevel = loadedState.wraithLevel ?? 0;
            gameState.currentCosts = loadedState.currentCosts ?? { ...CONFIG.upgradeCosts };
            gameState.skeletonWarriorCount = loadedState.skeletonWarriorCount ?? 0;
            gameState.skeletonMageCount = loadedState.skeletonMageCount ?? 0;
            gameState.wraithCount = loadedState.wraithCount ?? 0;

            // 創建玩家並恢復血量
            gameState.player = new Player(canvas.width / 2, canvas.height / 2);
            const baseMaxHealth = CONFIG.player.baseHealth + gameState.playerLevel * CONFIG.player.upgradeMaxHealthIncrease;
            gameState.player.maxHealth = loadedState.playerMaxHealth ?? baseMaxHealth;
            gameState.player.currentHealth = loadedState.playerCurrentHealth ?? gameState.player.maxHealth;
            gameState.player.maxHealth = Math.round(Math.max(CONFIG.player.baseHealth, gameState.player.maxHealth));
            gameState.player.currentHealth = Math.round(Math.min(gameState.player.maxHealth, Math.max(0, gameState.player.currentHealth)));

            console.log("遊戲狀態已從 localStorage 載入");
            showMessage("讀取存檔成功", 1500);
            return true;

        } catch (error) {
            console.error("讀取遊戲狀態失敗:", error);
            localStorage.removeItem(SAVE_KEY);
            return false;
        }
    }
    return false;
}

// --- 根據讀取的狀態重新生成召喚物 ---
function restoreSummonsFromLoad() {
    if (!gameState.player) return;
    gameState.summons = []; // 清空

    console.log(`讀取時恢復召喚物: Warriors=${gameState.skeletonWarriorCount}, Mages=${gameState.skeletonMageCount}, Wraiths=${gameState.wraithCount}`);

    // 恢復骷髏戰士
    for (let i = 0; i < gameState.skeletonWarriorCount; i++) {
        const spawnPos = getRandomSpawnPosNearCenter();
        const summon = new SkeletonWarrior(spawnPos.x, spawnPos.y, gameState.skeletonWarriorLevel, gameState.player);
        gameState.summons.push(summon);
    }
    // 恢復骷髏法師
    for (let i = 0; i < gameState.skeletonMageCount; i++) {
        const spawnPos = getRandomSpawnPosNearCenter();
        const summon = new SkeletonMage(spawnPos.x, spawnPos.y, gameState.skeletonMageLevel, gameState.player);
        gameState.summons.push(summon);
    }
    // 恢復怨靈
    for (let i = 0; i < gameState.wraithCount; i++) {
        const spawnPos = getRandomSpawnPosNearCenter();
        const summon = new Wraith(spawnPos.x, spawnPos.y, gameState.wraithLevel, gameState.player);
        gameState.summons.push(summon);
    }
    // 注意：計數器在 loadGameState 中已經恢復，這裡不需要再次設置
}

// --- 重置遊戲邏輯 ---
function resetGameInternalState() {
    console.log("重置內部遊戲狀態...");
     if (gameState.messageTimeout) clearTimeout(gameState.messageTimeout);
     if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }

    gameState = {
        player: null,
        summons: [], monsters: [], projectiles: [], // 清空投射物
        souls: CONFIG.player.initialSouls,
        currentWave: 0,
        monstersToSpawnThisWave: 0, monstersSpawnedThisWave: 0, timeUntilNextSpawn: 0,
        timeToNextWave: CONFIG.wave.betweenTime, betweenWaves: true,
        gameOver: false, isPaused: false,
        lastTime: performance.now(), messageTimeout: null,
        playerLevel: 0,
        skeletonWarriorLevel: 0, skeletonMageLevel: 0, wraithLevel: 0,
        skeletonWarriorCount: 0, skeletonMageCount: 0, wraithCount: 0,
        currentCosts: { ...CONFIG.upgradeCosts },
    };
    inputState = { isPointerDown: false, pointerStartPos: { x: 0, y: 0 }, pointerCurrentPos: { x: 0, y: 0 }, movementVector: { x: 0, y: 0 } };
}

function resetGame() {
     console.log("執行完整遊戲重置 (清除存檔)...");
     localStorage.removeItem(SAVE_KEY); // 清除存檔
     resetGameInternalState();
     gameState.player = new Player(canvas.width / 2, canvas.height / 2);
     uiElements.gameOverScreen.style.display = 'none';
     updateUI();
     if (animationFrameId === null) {
        animationFrameId = requestAnimationFrame(gameLoop);
     }
}

// --- 暫停/繼續 功能 ---
function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    if (gameState.isPaused) {
        uiElements.pauseResumeBtn.textContent = '繼續';
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        // 不再自動存檔
        // 繪製暫停遮罩
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "30px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("已暫停", canvas.width / 2, canvas.height / 2);
    } else {
        uiElements.pauseResumeBtn.textContent = '暫停';
        gameState.lastTime = performance.now();
        if (animationFrameId === null) {
            animationFrameId = requestAnimationFrame(gameLoop);
        }
    }
     updateUI();
}

// --- 主要遊戲循環 ---
let animationFrameId = null;
function gameLoop(currentTime) {
    if (gameState.gameOver) {
        showGameOver(); // showGameOver 內部會清除存檔
        animationFrameId = null;
        return;
    }

    let deltaTime = (currentTime - gameState.lastTime) / 1000;
    deltaTime = Math.min(deltaTime, 0.1);
    gameState.lastTime = currentTime;

    // --- 更新邏輯 ---
    updateTimers(deltaTime);
    trySpawnMonster(deltaTime);
    gameState.player.update(deltaTime, inputState.movementVector);
    gameState.summons.forEach(s => s.update(deltaTime, gameState.monsters, gameState.summons));
    gameState.monsters.forEach(m => m.update(deltaTime, gameState.player, gameState.summons));
    gameState.projectiles.forEach(p => p.update(deltaTime)); // *** 更新投射物 ***

    // --- 過濾死亡單位 ---
    gameState.summons = gameState.summons.filter(s => s.isAlive);
    gameState.monsters = gameState.monsters.filter(m => m.isAlive);
    gameState.projectiles = gameState.projectiles.filter(p => p.isAlive); // *** 過濾消失的投射物 ***

    checkWaveEndCondition(); // 會在內部調用 saveGameState

    // --- 繪圖 ---
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 清空畫布

    // *** 修改繪圖順序 ***
    // 1. 繪製怨靈光環 (底層)
    gameState.summons.forEach(s => { if (s.config.type === 'Wraith' && s.isAlive) s.drawAura(ctx); });
    // 2. 繪製怪物
    gameState.monsters.forEach(m => m.draw(ctx));
    // 3. 繪製召喚物本體
    gameState.summons.forEach(s => s.draw(ctx));
    // 4. 繪製投射物
    gameState.projectiles.forEach(p => p.draw(ctx));
    // 5. 最後繪製玩家 (確保在最上層)
    gameState.player.draw(ctx);


    // --- 更新 UI ---
    updateUI();

    // --- 請求下一幀 ---
    if (!gameState.isPaused) {
        animationFrameId = requestAnimationFrame(gameLoop);
    } else {
        animationFrameId = null;
    }
}

// --- 初始化 ---
function init() {
    console.log("初始化遊戲...");
    // 設置監聽器
    canvas.addEventListener('mousedown', handlePointerDown); canvas.addEventListener('mousemove', handlePointerMove); canvas.addEventListener('mouseup', handlePointerUp); canvas.addEventListener('mouseleave', handlePointerUp);
    canvas.addEventListener('touchstart', handlePointerDown, { passive: false }); canvas.addEventListener('touchmove', handlePointerMove, { passive: false }); canvas.addEventListener('touchend', handlePointerUp); canvas.addEventListener('touchcancel', handlePointerUp);
    uiElements.upgradePlayerBtn.addEventListener('click', () => tryUpgrade('Player'));
    uiElements.summonSkeletonBtn.addEventListener('click', () => trySummon('SkeletonWarrior'));
    uiElements.upgradeSkeletonBtn.addEventListener('click', () => tryUpgrade('SkeletonWarrior'));
    uiElements.summonMageBtn.addEventListener('click', () => trySummon('SkeletonMage'));
    uiElements.upgradeMageBtn.addEventListener('click', () => tryUpgrade('SkeletonMage'));
    uiElements.summonWraithBtn.addEventListener('click', () => trySummon('Wraith'));
    uiElements.upgradeWraithBtn.addEventListener('click', () => tryUpgrade('Wraith'));
    uiElements.restartButton.addEventListener('click', resetGame);
    uiElements.pauseResumeBtn.addEventListener('click', togglePause);

    // 嘗試讀取存檔
    if (loadGameState()) {
        restoreSummonsFromLoad(); // 恢復召喚物
        updateUI();
        if (!gameState.isPaused) {
             gameState.lastTime = performance.now();
             animationFrameId = requestAnimationFrame(gameLoop);
        } else {
             // 繪製初始暫停畫面
             uiElements.pauseResumeBtn.textContent = '繼續';
             ctx.clearRect(0, 0, canvas.width, canvas.height);
             if(gameState.player) gameState.player.draw(ctx); // 繪製玩家在最上層
             gameState.summons.forEach(s => { if (s.config.type === 'Wraith' && s.isAlive) s.drawAura(ctx); }); // 光環
             gameState.monsters.forEach(m => m.draw(ctx)); // 怪物 (應該是空的)
             gameState.summons.forEach(s => s.draw(ctx)); // 召喚物本體
             gameState.projectiles.forEach(p => p.draw(ctx)); // 投射物 (應該是空的)
             gameState.player.draw(ctx); // 再次繪製玩家確保最上層
             // 繪製暫停提示
             ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
             ctx.fillRect(0, 0, canvas.width, canvas.height);
             ctx.fillStyle = "white";
             ctx.font = "30px sans-serif";
             ctx.textAlign = "center";
             ctx.fillText("已暫停", canvas.width / 2, canvas.height / 2);
        }
    } else {
        // 開始新遊戲
        resetGame();
    }
}

// --- 啟動遊戲 ---
init();