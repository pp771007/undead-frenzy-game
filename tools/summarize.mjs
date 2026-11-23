// 彙整 playtest.mjs 的輸出：每局一行結果，加上各階段法師被打中幾波、最低剩多少血、總靈魂收入。
// 用法：node tools/summarize.mjs <log 資料夾> [檔名前綴]
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
const prefix = process.argv[3] || '';
if (!dir) { console.error('usage: node tools/summarize.mjs <log-dir> [prefix]'); process.exit(1); }

// 法師這一波扣超過這個比例才算「被打中」
const HIT_THRESHOLD = 0.05;
const BANDS = [[1, 10], [11, 20], [21, 35], [36, 49]];

for (const f of readdirSync(dir).filter(n => n.startsWith(prefix) && n.endsWith('.log')).sort()) {
    const lines = readFileSync(join(dir, f), 'utf-8').trim().split('\n');
    const head = lines.find(l => l.startsWith('RESULT')) || '(no result)';
    const soulsLine = lines.find(l => l.startsWith('SOULS '));
    const souls = soulsLine ? Object.values(JSON.parse(soulsLine.slice(6))).reduce((a, b) => a + b, 0) : 0;
    const rows = lines.filter(l => /^\d/.test(l)).map(l => { const c = l.split('\t'); return { wave: +c[0], minHp: +c[2], dmg: +c[3] }; });
    const band = ([a, b]) => {
        const r = rows.filter(x => x.wave >= a && x.wave <= b);
        if (!r.length) return `w${a}-${b}    -   `;
        return `w${a}-${b} hit${String(r.filter(x => x.dmg > HIT_THRESHOLD).length).padStart(2)}/${r.length} min${Math.min(...r.map(x => x.minHp)).toFixed(2)}`;
    };
    console.log(`${f.padEnd(16)} ${head.replace(/^RESULT\s+\S*\s*/, '')} souls=${souls}\n    ${BANDS.map(band).join(' | ')}`);
}
