// 好玩體檢表：讀自動遊玩（tools/playtest.mjs）的 log，算「好玩的前提」那幾項指標，超出健康範圍的標出來。
// 用法：node tools/fun-report.mjs <log 資料夾或檔案...>
//
// 研究上量不到「好玩」本身，量得到的是它的前提（各項依據見每個指標旁的註解）：
//   結果有懸念（Browne／Iida 的 uncertainty）、每波死亡率平滑上升（Isaksen 2015 的 survival analysis）、
//   開局不會白死、早點出現挑戰、沒有長段無聊（GameFlow）、每 10 波一個高峰（難度曲線）、贏的局有驚險（Browne 的 drama）、
//   選擇有意義（Jaffe 2012 的 restricted play：亂挑要明顯輸給好好挑）、多種打法行得通（Fontaine 2019）、職業平衡。
// 健康範圍是經驗起點，不是論文數字。手感、打擊感、公不公平、新鮮感機器人量不到，那些要真人。
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BETWEEN_WAVE_SECONDS = 3;
const BOSS_EVERY = 10;
// 每波的威脅值 = 主角掉的血（佔最大血量）＋ 大軍折損比例 × LOST_WEIGHT
const LOST_WEIGHT = 0.5;
const DANGER_HP = 0.5;          // 血量第一次掉到這以下 = 開始緊張
const NEAR_DEATH_HP = 0.25;     // 贏的局裡掉到這以下 = 驚險
const BORING_THREAT = 0.05;     // 威脅值低於這個算「沒壓力」
const BOSS_PEAK_RATIO = 1.5;    // 首領波威脅 ≥ 那一輪中位數 × 這個，才算高峰
const BOSS_PEAK_MIN = 0.1;
const EARLY_WAVES = 5;

// 破關率目標（挑法/強化）：亂挑 ≈ 不懂搭配的新手，沒強化應該打不過（其他倖存者遊戲的新手倒在一局中段、玩 3～8 局才第一次通關）；
// 好好挑 ≈ 熟手，沒強化偶爾能通關（難度研究：高手不靠強化也要過得去）；強化越多越穩
const RANGES = {
    winRate: {
        'random/zero': [0, 0.1], 'random/half': [0.2, 0.5], 'random/max': [0.5, 0.9],
        'smart/zero': [0.1, 0.3], 'smart/half': [0.4, 0.7], 'smart/max': [0.7, 0.95],
    },
    earlyDeath: 0.05,
    firstDangerMin: [2, 5],
    boringRun: 3,
    bossPeak: 0.6,
    drama: [0.15, 0.4],
    choiceGap: 0.1,
    classSpread: 0.15,
    topKiller: 0.5,
    // 被重擊打死：玩家看不出危險在哪（Juul 的「失敗要能歸因到自己」）；被一大群圍住幾秒內倒下看得到，不算在這裡
    heavyDeath: 0.1,
    // 通關一局幾分鐘：遊戲標的是約 25 分鐘，怪太多、打不完會拖成拖棚
    winMinutes: [20, 35],
};
// 單下扣到最大生命這個比例以上算重擊；3 秒內倒下、而且一半以上的血是重擊打掉的，算「被重擊打死」
// （log 只有每種來源的加總與單下最大，所以單下最大到重擊的那種來源，整筆都算重擊）
const HEAVY_HIT = 0.2;
const HEAVY_SHARE = 0.5;

function files(args) {
    const out = [];
    for (const a of args) {
        if (statSync(a).isDirectory()) for (const f of readdirSync(a)) { if (f.endsWith('.log')) out.push(join(a, f)); }
        else out.push(a);
    }
    return out;
}

function parse(f) {
    const txt = readFileSync(f, 'utf8');
    const res = txt.match(/^RESULT .*$/m);
    if (!res) return null;
    const kv = Object.fromEntries([...res[0].matchAll(/(\w+)=(\S+)/g)].map(m => [m[1], m[2]]));
    const rows = txt.split('\n').filter(l => /^\d+\t/.test(l)).map(l => {
        const [wave, dur, minHp, dmg, , , lost] = l.split('\t');
        return { wave: +wave, dur: +dur, minHp: +minHp, dmg: +dmg, lost: +(lost || 0) };
    });
    const build = (txt.match(/^BUILD (\S+)/m) || [])[1] || null;
    const burst = (txt.match(/^BURST (\S+)/m) || [])[1];
    const lastHits = JSON.parse((txt.match(/^BURST \S+ (\{.*\})$/m) || [])[1] || '{}');
    return {
        file: f, cls: kv.class || '?', pick: kv.pick || 'smart', meta: kv.meta || 'zero',
        won: kv.won === 'true', wave: +kv.wave, killer: kv.killedBy, stuck: /^STUCK/m.test(txt), minutes: parseFloat(kv.t),
        rows, build, burst: burst == null ? null : burst === 'true', lastHits,
    };
}

const threat = r => r.dmg + LOST_WEIGHT * r.lost;
const median = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const pct = v => `${Math.round(v * 100)}%`;
const flag = bad => bad ? '✗' : '✓';

function runMetrics(r) {
    let t = 0, firstDanger = null, boring = 0, maxBoring = 0, peaks = 0, cycles = 0;
    for (const w of r.rows) {
        t += w.dur + BETWEEN_WAVE_SECONDS;
        if (firstDanger == null && w.minHp < DANGER_HP) firstDanger = t / 60;
        // 首領打完的下一波本來就該喘口氣，不算無聊
        if (threat(w) < BORING_THREAT && w.wave % BOSS_EVERY !== 1) { boring++; maxBoring = Math.max(maxBoring, boring); } else boring = 0;
    }
    for (let b = BOSS_EVERY; b <= r.rows.length; b += BOSS_EVERY) {
        const boss = r.rows.find(w => w.wave === b);
        const cyc = r.rows.filter(w => w.wave > b - BOSS_EVERY && w.wave < b).map(threat);
        if (!boss || !cyc.length) continue;
        cycles++;
        if (threat(boss) >= Math.max(BOSS_PEAK_MIN, median(cyc) * BOSS_PEAK_RATIO)) peaks++;
    }
    return { firstDanger, maxBoring, peaks, cycles, nearDeath: r.rows.some(w => w.minHp < NEAR_DEATH_HP) };
}

const runs = files(process.argv.slice(2)).map(parse).filter(Boolean);
if (!runs.length) { console.error('usage: node tools/fun-report.mjs <log dir or files>'); process.exit(1); }
for (const r of runs) Object.assign(r, runMetrics(r));

const groups = {};
for (const r of runs) (groups[`${r.pick}/${r.meta}`] ||= []).push(r);

for (const [key, g] of Object.entries(groups)) {
    const [pick, meta] = key.split('/');
    const wins = g.filter(r => r.won), losses = g.filter(r => !r.won);
    const winRate = wins.length / g.length;
    const lines = [];
    const range = RANGES.winRate[key];
    lines.push(`${flag(range && (winRate < range[0] || winRate > range[1]))} 破關率 ${pct(winRate)}（${wins.length}/${g.length}）${range ? `　目標 ${pct(range[0])}–${pct(range[1])}` : ''}${losses.length ? `　沒破的中位數倒在第 ${median(losses.map(r => r.wave))} 波` : ''}`);
    // 每波死亡率：死在第 w 波 ÷ 活到第 w 波（Isaksen 2015）
    const hz = [];
    for (let w = 1; w <= 50; w += 5) {
        const alive = g.filter(r => r.wave >= w || r.won).length;
        const died = losses.filter(r => r.wave >= w && r.wave < w + 5).length;
        hz.push(alive ? `${w}-${w + 4}:${pct(died / alive)}` : `${w}-${w + 4}:-`);
    }
    lines.push(`  每 5 波死亡率 ${hz.join(' ')}`);
    const early = losses.filter(r => r.wave <= EARLY_WAVES).length / g.length;
    lines.push(`${flag(early > RANGES.earlyDeath)} 開局（前 ${EARLY_WAVES} 波）就倒 ${pct(early)}　目標 < ${pct(RANGES.earlyDeath)}`);
    const fd = g.map(r => r.firstDanger).filter(v => v != null);
    const fdMed = fd.length ? median(fd) : null;
    lines.push(`${flag(fdMed == null || fdMed < RANGES.firstDangerMin[0] || fdMed > RANGES.firstDangerMin[1])} 第一次掉到半血 ${fdMed == null ? '從沒發生' : `中位數第 ${fdMed.toFixed(1)} 分鐘`}　目標 ${RANGES.firstDangerMin.join('–')} 分鐘`);
    const boringMax = median(g.map(r => r.maxBoring));
    lines.push(`${flag(boringMax > RANGES.boringRun)} 最長無聊段 中位數連續 ${boringMax} 波沒壓力　目標 ≤ ${RANGES.boringRun}`);
    const cyc = g.reduce((a, r) => a + r.cycles, 0), pk = g.reduce((a, r) => a + r.peaks, 0);
    lines.push(`${flag(cyc && pk / cyc < RANGES.bossPeak)} 首領是那一輪的高峰 ${cyc ? pct(pk / cyc) : '-'}（${pk}/${cyc} 輪）　目標 ≥ ${pct(RANGES.bossPeak)}`);
    if (wins.length) {
        const wm = median(wins.map(r => r.minutes));
        lines.push(`${flag(wm < RANGES.winMinutes[0] || wm > RANGES.winMinutes[1])} 通關一局 中位數 ${wm.toFixed(0)} 分鐘　目標 ${RANGES.winMinutes.join('–')} 分鐘　最久 ${Math.max(...wins.map(r => r.minutes)).toFixed(0)}`);
        const drama =wins.filter(r => r.nearDeath).length / wins.length;
        lines.push(`${flag(drama < RANGES.drama[0] || drama > RANGES.drama[1])} 贏的局有驚險（掉到 ${pct(NEAR_DEATH_HP)} 以下）${pct(drama)}　目標 ${RANGES.drama.map(pct).join('–')}`);
    }
    // 職業平衡：各職業破關率最高減最低（每職業局數少時只看得出大差距）
    const byCls = {};
    for (const r of g) (byCls[r.cls] ||= []).push(r);
    const clsRates = Object.entries(byCls).map(([c, a]) => [c, a.filter(r => r.won).length / a.length, median(a.map(r => r.won ? 50 : r.wave))]);
    if (clsRates.length > 1) {
        const spread = Math.max(...clsRates.map(x => x[1])) - Math.min(...clsRates.map(x => x[1]));
        lines.push(`${flag(spread > RANGES.classSpread)} 職業破關率差距 ${pct(spread)}　目標 ≤ ${pct(RANGES.classSpread)}　${clsRates.map(([c, w, m]) => `${c} ${pct(w)}/${m}`).join(' ')}`);
    }
    if (losses.length) {
        const kc = {};
        for (const r of losses) { const k = r.stuck ? '(卡住)' : r.killer; kc[k] = (kc[k] || 0) + 1; }
        const top = Object.entries(kc).sort((a, b) => b[1] - a[1]);
        lines.push(`${flag(top[0][1] / losses.length > RANGES.topKiller)} 死因最集中 ${top[0][0]} ${pct(top[0][1] / losses.length)}　目標 ≤ ${pct(RANGES.topKiller)}　${top.map(([k, n]) => `${k}×${n}`).join(' ')}`);
        const bursts = losses.filter(r => r.burst != null);
        if (bursts.length) {
            const burstRuns = bursts.filter(r => r.burst);
            const heavyShare = r => {
                const all = Object.values(r.lastHits), tot = all.reduce((a, s) => a + s.f, 0);
                return tot ? all.filter(s => s.max >= HEAVY_HIT).reduce((a, s) => a + s.f, 0) / tot : 0;
            };
            const heavy = burstRuns.filter(r => heavyShare(r) >= HEAVY_SHARE).length / bursts.length;
            lines.push(`${flag(heavy > RANGES.heavyDeath)} 被重擊打死（3 秒內從半血以上歸零、一半以上是單下 ${pct(HEAVY_HIT)} 以上）${pct(heavy)}　目標 ≤ ${pct(RANGES.heavyDeath)}`);
            lines.push(`  被一群圍死（3 秒內從半血以上歸零、多半是小傷害）${pct((burstRuns.length / bursts.length) - heavy)}`);
            // 3 秒內倒下的那幾局，死前 3 秒誰打掉多少血（平均每局佔最大生命幾成、一共幾下、單下最多）
            const src = {};
            for (const r of burstRuns) for (const [k, a] of Object.entries(r.lastHits)) { const s = src[k] ||= { f: 0, n: 0, max: 0 }; s.f += a.f; s.n += a.n; s.max = Math.max(s.max, a.max); }
            const srcList = Object.entries(src).sort((a, b) => b[1].f - a[1].f);
            if (srcList.length) lines.push(`  3 秒內倒下時誰在打${srcList.map(([k, s]) => `${k} 平均${pct(s.f / burstRuns.length)}／${s.n}下／單下最多${pct(s.max)}`).join('　')}`);
        }
    }
    const builds = wins.map(r => r.build).filter(Boolean);
    if (builds.length) {
        const bc = {};
        for (const b of builds) bc[b] = (bc[b] || 0) + 1;
        const n = builds.length, entropy = -Object.values(bc).reduce((a, c) => a + c / n * Math.log(c / n), 0);
        lines.push(`  贏的局主力流派 ${Object.entries(bc).map(([k, v]) => `${k}×${v}`).join(' ')}（有效流派數 ${Math.exp(entropy).toFixed(1)}）`);
    }
    console.log(`\n== 挑祝福：${pick}　局外強化：${meta}　（${g.length} 局）`);
    for (const l of lines) console.log(l);
}

// 選擇有沒有意義（Jaffe 2012）：同一強化等級下，好好挑要明顯贏亂挑
const metas = [...new Set(runs.map(r => r.meta))];
for (const m of metas) {
    const s = groups[`smart/${m}`], rnd = groups[`random/${m}`];
    if (!s || !rnd) continue;
    const gap = s.filter(r => r.won).length / s.length - rnd.filter(r => r.won).length / rnd.length;
    console.log(`\n${flag(gap < RANGES.choiceGap)} 選擇有意義（強化 ${m}）：好好挑比亂挑破關率高 ${pct(gap)}　目標 ≥ ${pct(RANGES.choiceGap)}`);
}
