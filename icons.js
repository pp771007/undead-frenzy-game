// 遊戲圖示：全部手繪向量，風格對齊角色立繪（深色粗描邊、平塗、一點亮部）。
// DOM 用 iconHtml(name) 內嵌；畫布用 getIconImage(name) 取已載好的 Image。
const ICON_OUTLINE = '#1b1424';
const ICON_SHINE = 'rgba(255,255,255,0.55)';

function iconSvg(body) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="${ICON_OUTLINE}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`;
}
// 粗線條圖形（爪痕、雪花、磁鐵）：先畫一條粗的深色線當描邊，再疊一條細的彩色線
function duoStroke(d, color, inner = 6) {
    return `<path d="${d}" stroke-width="${inner + 5}"/><path d="${d}" stroke="${color}" stroke-width="${inner}"/>`;
}
function shine(cx, cy, rx, ry, rot = -30) {
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="${ICON_SHINE}" stroke="none"/>`;
}
function starPath(cx, cy, rOut, rIn, points) {
    let d = '';
    for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? rOut : rIn;
        const a = -Math.PI / 2 + i * Math.PI / points;
        d += `${i === 0 ? 'M' : 'L'}${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)} `;
    }
    return d + 'Z';
}
const GHOST_PATH = 'M18 52 L18 28 C18 16 24 9 32 9 C40 9 46 16 46 28 L46 52 L41 47 L36 52 L32 47 L28 52 L23 47 Z';
// 小配件：右上角的月亮、太陽（晝夜相關的祝福），以 (x, y) 為中心的閃電
function cornerMoon() { return `<path d="M60 4 C52 4 46 10 46 17 C46 24 52 29 59 28 C54 26 51 21 51 16 C51 10 55 6 60 4 Z" fill="#fff3c4" stroke-width="2.5"/>`; }
function cornerSun() { return `<circle cx="53" cy="13" r="7" fill="#ffca28" stroke-width="2.5"/>${[0, 1, 2, 3, 4, 5].map(i => { const a = i * Math.PI / 3; return `<path d="M${(53 + Math.cos(a) * 10).toFixed(1)} ${(13 + Math.sin(a) * 10).toFixed(1)} L${(53 + Math.cos(a) * 13).toFixed(1)} ${(13 + Math.sin(a) * 13).toFixed(1)}" stroke="#ffca28" stroke-width="2.5"/>`; }).join('')}`; }
function boltAt(x, y) { return `<path d="M${x + 2} ${y - 14} L${x - 7} ${y + 2} L${x} ${y + 2} L${x - 3} ${y + 14} L${x + 8} ${y - 4} L${x + 1} ${y - 4} L${x + 5} ${y - 14} Z" fill="#fff176" stroke-width="2.5"/>`; }
const HEART_PATH ='M32 54 C12 41 5 28 12 17 C18 9 28 10 32 18 C36 10 46 9 52 17 C59 28 52 41 32 54 Z';

const ICON_BODIES = {
    heart: `<path d="${HEART_PATH}" fill="#e5484d"/>${shine(21, 22, 5, 3.5)}`,
    soul: `<path d="M32 58 C18 58 12 46 18 36 C22 29 23 21 20 10 C30 16 35 23 35 30 C38 26 40 21 40 15 C50 25 53 38 48 47 C45 54 39 58 32 58 Z" fill="#62dbe2"/>
        <path d="M32 52 C25 52 22 46 25 40 C27 36 30 34 31 29 C36 33 40 38 39 44 C38 49 36 52 32 52 Z" fill="#d6fbfb" stroke="none"/>
        <circle cx="28.5" cy="44" r="2.4" fill="${ICON_OUTLINE}" stroke="none"/><circle cx="36" cy="44" r="2.4" fill="${ICON_OUTLINE}" stroke="none"/>`,
    skull: `<path d="M32 7 C18 7 10 17 10 29 C10 37 14 42 20 45 L20 55 L44 55 L44 45 C50 42 54 37 54 29 C54 17 46 7 32 7 Z" fill="#f1ead6"/>
        <ellipse cx="23" cy="30" rx="6" ry="7" fill="${ICON_OUTLINE}" stroke="none"/><ellipse cx="41" cy="30" rx="6" ry="7" fill="${ICON_OUTLINE}" stroke="none"/>
        <path d="M32 37 L28.5 44 L35.5 44 Z" fill="${ICON_OUTLINE}" stroke="none"/>
        <path d="M27 55 L27 49 M32 55 L32 49 M37 55 L37 49" stroke-width="3"/>${shine(20, 16, 5, 3)}`,
    pause: `<rect x="15" y="12" width="12" height="40" rx="4" fill="#f1ead6"/><rect x="37" y="12" width="12" height="40" rx="4" fill="#f1ead6"/>`,
    play: `<path d="M21 11 L53 32 L21 53 Z" fill="#f1ead6"/>`,
    burst: `<path d="${starPath(32, 32, 28, 13, 10)}" fill="#c06bf5"/><circle cx="32" cy="32" r="9" fill="#f6dcff"/>`,
    fastForward: `<path d="M7 14 L30 32 L7 50 Z" fill="#8fd3ff"/><path d="M32 14 L55 32 L32 50 Z" fill="#8fd3ff"/>`,
    star: `<path d="${starPath(32, 33, 27, 12, 5)}" fill="#ffd54f"/>${shine(26, 22, 4, 2.5)}`,
    crown: `<path d="M9 46 L13 17 L24 30 L32 11 L40 30 L51 17 L55 46 Z" fill="#ffd54f"/><rect x="9" y="45" width="46" height="9" rx="2" fill="#e0a82e"/>
        <circle cx="32" cy="49.5" r="3" fill="#e5484d" stroke-width="2.5"/><circle cx="20" cy="49.5" r="2.5" fill="#62dbe2" stroke-width="2.5"/><circle cx="44" cy="49.5" r="2.5" fill="#62dbe2" stroke-width="2.5"/>`,
    bloodMoon: `<circle cx="32" cy="32" r="23" fill="#d84a4a"/><circle cx="24" cy="26" r="5" fill="#a83333" stroke-width="2.5"/><circle cx="38" cy="40" r="7" fill="#a83333" stroke-width="2.5"/><circle cx="41" cy="22" r="3" fill="#a83333" stroke-width="2.5"/>${shine(20, 18, 5, 2.5)}`,
    claws: duoStroke('M14 10 C22 24 22 40 12 54', '#ff8a50') + duoStroke('M30 8 C38 24 38 42 28 56', '#ff8a50') + duoStroke('M46 10 C54 24 54 40 44 54', '#ff8a50'),
    plague: `<circle cx="24" cy="38" r="15" fill="#8bc34a"/><circle cx="43" cy="26" r="11" fill="#9ccc65"/><circle cx="44" cy="48" r="7" fill="#7cb342"/>${shine(19, 32, 4, 2.5)}${shine(40, 21, 3, 2)}`,
    sack: `<path d="M24 25 C20 19 22 12 27 9 L37 9 C42 12 44 19 40 25 Z" fill="#b08646"/>
        <path d="M18 25 C7 35 7 54 21 57 L41 57 C55 54 55 35 44 25 Z" fill="#c9a15c"/><path d="M19 25 L45 25" stroke-width="5"/>
        <path d="M24 38 C26 44 26 50 24 54" stroke="#a5814a" stroke-width="2.5"/>
        <circle cx="45" cy="48" r="10" fill="#ffd54f"/><circle cx="45" cy="48" r="5.5" stroke="#e0a82e" stroke-width="2.5"/>`,
    flame: `<path d="M32 58 C17 58 11 46 15 35 C18 27 24 24 25 14 C34 20 37 26 37 32 C41 28 42 23 41 17 C51 26 54 38 50 47 C47 54 40 58 32 58 Z" fill="#ff8a3d"/>
        <path d="M32 53 C25 53 22 47 25 41 C27 37 31 35 32 30 C37 35 40 40 39 46 C38 50 36 53 32 53 Z" fill="#ffd54f" stroke="none"/>`,
    // ---- 戰士的五個流派（warrior.js）----
    // 流派「軍團紀律」：藍底金邊的軍旗
    legion: `<path d="M16 6 L16 60" stroke-width="4"/><path d="M16 8 L52 8 L52 40 L16 40 Z" fill="#1565c0"/><path d="M16 40 L22 46 L28 40 L34 46 L40 40 L46 46 L52 40" stroke="#ffd54f" stroke-width="3"/>
        <path d="M34 16 L37 22 L44 23 L39 28 L40 35 L34 31 L28 35 L29 28 L24 23 L31 22 Z" fill="#ffd54f" stroke-width="2"/><circle cx="16" cy="6" r="4" fill="#ffd54f" stroke-width="2.5"/>`,
    // 盾牆
    wallThick: `<circle cx="32" cy="32" r="27" fill="#607d8b"/><circle cx="32" cy="32" r="21" fill="#90a4ae" stroke-width="3"/><circle cx="32" cy="32" r="14" fill="#b0bec5" stroke-width="3"/>
        <circle cx="32" cy="32" r="5" fill="#eceff1" stroke-width="2.5"/>${[0, 1, 2, 3, 4, 5].map(i => { const a = i * Math.PI / 3; return `<circle cx="${(32 + Math.cos(a) * 24).toFixed(1)}" cy="${(32 + Math.sin(a) * 24).toFixed(1)}" r="2" fill="#eceff1" stroke="none"/>`; }).join('')}${shine(22, 20, 4, 2.5)}`,
    wallSpikes: `${[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * Math.PI / 4; return `<path d="M${(32 + Math.cos(a - 0.2) * 20).toFixed(1)} ${(32 + Math.sin(a - 0.2) * 20).toFixed(1)} L${(32 + Math.cos(a) * 30).toFixed(1)} ${(32 + Math.sin(a) * 30).toFixed(1)} L${(32 + Math.cos(a + 0.2) * 20).toFixed(1)} ${(32 + Math.sin(a + 0.2) * 20).toFixed(1)} Z" fill="#cfd8dc" stroke-width="2.5"/>`; }).join('')}
        <circle cx="32" cy="32" r="20" fill="#78909c"/><circle cx="32" cy="32" r="7" fill="#42a5f5" stroke-width="2.5"/>`,
    wallTaunt: `<path d="M8 10 L36 4 L36 50 C26 56 14 52 8 44 Z" fill="#90a4ae"/><path d="M20 16 L22 32 M21 38 L21 41" stroke="#ffd54f" stroke-width="5"/>
        <path d="M44 20 C48 24 48 32 44 36 M50 14 C57 22 57 34 50 42 M56 8 C66 20 66 36 56 48" stroke="#ffcc80" stroke-width="3"/>`,
    wallRotate: `<path d="M8 14 L26 10 L26 40 C20 44 12 42 8 36 Z" fill="#90a4ae"/><path d="M38 24 L56 20 L56 50 C50 54 42 52 38 46 Z" fill="#78909c"/>
        <path d="M30 6 C44 4 52 10 54 16" stroke="#81c784" stroke-width="3.5"/><path d="M54 16 L48 14 L54 9 Z" fill="#81c784" stroke-width="2"/>
        <path d="M34 58 C20 60 12 54 10 48" stroke="#81c784" stroke-width="3.5"/><path d="M10 48 L16 50 L10 55 Z" fill="#81c784" stroke-width="2"/>`,
    // 長槍方陣
    spearLength: `<path d="M4 60 L56 8" stroke-width="5"/><path d="M4 60 L56 8" stroke="#8d6e63" stroke-width="2.5"/><path d="M56 8 L62 2 L60 14 L50 14 Z" fill="#cfd8dc"/>
        <path d="M14 40 L20 46 M24 30 L30 36 M34 20 L40 26" stroke="#ffd54f" stroke-width="3"/>`,
    spearPower: `<path d="M10 14 L38 10 L44 46 C34 54 20 54 12 46 Z" fill="#90a4ae"/><path d="M26 18 L30 30 L22 36 L30 48" stroke-width="3"/>
        <path d="M60 4 L34 30" stroke-width="5"/><path d="M60 4 L34 30" stroke="#8d6e63" stroke-width="2.5"/><path d="M34 30 L26 34 L30 26 Z" fill="#eceff1" stroke-width="2.5"/>${'<circle cx="24" cy="34" r="2.5" fill="#ffd54f" stroke="none"/>'}`,
    spearBrace: `<path d="M8 54 L56 54" stroke-width="5"/><path d="M8 54 L56 54" stroke="#6d4c41" stroke-width="2.5"/>
        <path d="M12 56 L30 14 M26 56 L44 14 M40 56 L58 14 M52 56 L34 14 M38 56 L20 14 M24 56 L6 14" stroke-width="4"/>
        <path d="M12 56 L30 14 M26 56 L44 14 M40 56 L58 14 M52 56 L34 14 M38 56 L20 14 M24 56 L6 14" stroke="#a1887f" stroke-width="2"/>`,
    spearSweep: `<circle cx="22" cy="38" r="10" fill="#ef9a9a"/><circle cx="40" cy="26" r="10" fill="#ef9a9a"/><circle cx="19" cy="36" r="1.8" fill="#1b1424" stroke="none"/><circle cx="37" cy="24" r="1.8" fill="#1b1424" stroke="none"/>
        <path d="M4 52 L58 10" stroke-width="5"/><path d="M4 52 L58 10" stroke="#8d6e63" stroke-width="2.5"/><path d="M58 10 L62 4 L62 14 L54 14 Z" fill="#cfd8dc" stroke-width="2.5"/>`,
    // 弩陣
    bowReload: `<path d="M10 30 C16 16 40 16 46 30" stroke-width="5"/><path d="M10 30 C16 16 40 16 46 30" stroke="#8d6e63" stroke-width="2.5"/><path d="M28 18 L28 52" stroke-width="5"/><path d="M28 18 L28 52" stroke="#a1887f" stroke-width="2.5"/>
        <path d="M10 30 L28 36 L46 30" stroke="#eceff1" stroke-width="1.8"/>
        <path d="M50 40 C60 40 62 52 54 58 C48 62 40 58 40 52" stroke="#81c784" stroke-width="3.5"/><path d="M40 52 L36 46 L44 46 Z" fill="#81c784" stroke-width="2"/>`,
    bowPower: `<path d="M6 34 C12 14 52 14 58 34" stroke-width="7"/><path d="M6 34 C12 14 52 14 58 34" stroke="#5d4037" stroke-width="4"/><path d="M32 18 L32 58" stroke-width="7"/><path d="M32 18 L32 58" stroke="#8d6e63" stroke-width="4"/>
        <path d="M6 34 L32 40 L58 34" stroke="#eceff1" stroke-width="2"/><path d="M32 4 L38 14 L26 14 Z" fill="#b0bec5"/><rect x="24" y="44" width="16" height="10" rx="2" fill="#78909c"/>`,
    bowRange: `<path d="M4 44 C8 32 24 32 28 44" stroke-width="4"/><path d="M4 44 C8 32 24 32 28 44" stroke="#8d6e63" stroke-width="2"/><path d="M16 36 L16 60" stroke-width="4"/>
        <path d="M20 30 L30 22 M36 18 L44 12" stroke="#ffd54f" stroke-width="3" stroke-dasharray="3 4"/><circle cx="54" cy="10" r="7" fill="#42a5f5"/><circle cx="54" cy="10" r="3" fill="#fff8e1" stroke-width="2"/>`,
    bowVolley: `<path d="M6 46 C10 34 26 34 30 46" stroke-width="4"/><path d="M6 46 C10 34 26 34 30 46" stroke="#8d6e63" stroke-width="2"/><path d="M18 38 L18 62" stroke-width="4"/>
        ${[[50, 8], [58, 26], [44, 22]].map(([x, y]) => `<path d="M20 34 L${x} ${y}" stroke="#cfd8dc" stroke-width="2.5"/><path d="M${x} ${y} L${x - 7} ${y - 1} L${x - 3} ${y + 5} Z" fill="#eceff1" stroke-width="2"/>`).join('')}`,
    // 狂戰
    rageGain: `<path d="M32 60 C16 60 8 48 14 34 C18 26 18 18 14 6 C24 12 30 20 30 28 C34 22 36 16 36 8 C48 18 54 32 48 46 C44 54 40 60 32 60 Z" fill="#ff6d00"/>
        <path d="M32 54 C24 54 20 46 24 38 C26 34 28 32 28 26 C34 30 38 36 38 42 C38 48 36 54 32 54 Z" fill="#ffd54f" stroke="none"/>${duoStroke('M48 26 L58 16 M58 16 L50 16 M58 16 L58 24', '#ffd54f', 3)}`,
    rageLength: `<path d="M16 6 L48 6 M16 58 L48 58" stroke-width="5"/><path d="M19 8 C19 22 30 26 30 32 C30 38 19 42 19 56 L45 56 C45 42 34 38 34 32 C34 26 45 22 45 8 Z" fill="#ffe0b2"/>
        <path d="M23 18 L41 18 C40 25 34 28 32 31 C30 28 24 25 23 18 Z" fill="#ef6c00" stroke="none"/><path d="M22 54 C24 44 40 44 42 54 Z" fill="#ef6c00" stroke="none"/><path d="M32 33 L32 46" stroke="#ef6c00" stroke-width="2"/>`,
    rageCleave: `<circle cx="32" cy="32" r="24" stroke="#ffcc80" stroke-width="3" stroke-dasharray="8 6"/>
        <path d="M14 50 L44 20" stroke-width="7"/><path d="M14 50 L44 20" stroke="#cfd8dc" stroke-width="4"/><path d="M44 20 L54 10 L52 22 Z" fill="#eceff1" stroke-width="2.5"/>
        <path d="M10 46 L18 54" stroke-width="5"/><path d="M10 46 L18 54" stroke="#ffd54f" stroke-width="2.5"/><path d="M6 58 L12 52" stroke-width="5"/><path d="M6 58 L12 52" stroke="#6d4c41" stroke-width="2.5"/>`,
    rageLeech: `<path d="M8 8 L36 36" stroke-width="7"/><path d="M8 8 L36 36" stroke="#cfd8dc" stroke-width="4"/><path d="M34 30 L42 38 M38 34 L32 40" stroke-width="5"/>
        <path d="M40 40 C40 44 42 46 42 48 C42 50 40 52 40 52 C40 52 38 50 38 48 C38 46 40 44 40 40 Z" fill="#c62828" stroke-width="2"/>
        <path d="M46 62 C34 54 30 46 35 40 C39 35 44 37 46 41 C48 37 53 35 57 40 C62 46 58 54 46 62 Z" fill="#e53935"/>`,
    // 軍團紀律
    legionCap: `${[[16, 36], [32, 30], [48, 36]].map(([x, y]) => `<path d="M${x - 10} ${y + 6} C${x - 10} ${y - 8} ${x + 10} ${y - 8} ${x + 10} ${y + 6} Z" fill="#90a4ae"/><path d="M${x} ${y - 6} L${x} ${y - 12}" stroke="#1565c0" stroke-width="4"/>`).join('')}
        <path d="M4 50 L60 50" stroke-width="4"/>${duoStroke('M50 8 L50 22 M43 15 L57 15', '#81c784', 3.5)}`,
    legionDrill: `<path d="M32 22 L32 60" stroke-width="5"/><path d="M32 22 L32 60" stroke="#8d6e63" stroke-width="2.5"/><path d="M14 30 L50 30" stroke-width="5"/><path d="M14 30 L50 30" stroke="#8d6e63" stroke-width="2.5"/>
        <ellipse cx="32" cy="38" rx="10" ry="14" fill="#ffe082"/><circle cx="32" cy="14" r="9" fill="#ffe082"/><path d="M26 34 L38 42 M38 34 L26 42" stroke="#a1887f" stroke-width="2"/>
        <path d="M48 46 L58 56 M52 44 L60 52" stroke="#cfd8dc" stroke-width="3"/>`,
    legionPay: `<ellipse cx="32" cy="50" rx="18" ry="6" fill="#e0a82e"/><ellipse cx="32" cy="42" rx="18" ry="6" fill="#ffd54f"/><ellipse cx="32" cy="34" rx="18" ry="6" fill="#e0a82e"/><ellipse cx="32" cy="26" rx="18" ry="6" fill="#ffd54f"/>
        <path d="M6 8 L22 22 M58 8 L42 22" stroke-width="5"/><path d="M6 8 L22 22 M58 8 L42 22" stroke="#cfd8dc" stroke-width="2.5"/>${shine(26, 24, 4, 2)}`,
    legionVet: `<path d="M20 4 L32 18 L44 4 L44 14 L32 28 L20 14 Z" fill="#1565c0"/><circle cx="32" cy="42" r="16" fill="#ffd54f"/>
        <path d="${starPath(32, 42, 10, 4.5, 5)}" fill="#fff8e1" stroke-width="2.5"/><path d="M22 58 L32 52 L42 58" stroke="#e0a82e" stroke-width="3"/>`,
    // 傳說
    valhalla: `<path d="M8 36 C2 24 6 12 14 10 C12 20 16 28 22 30 Z M56 36 C62 24 58 12 50 10 C52 20 48 28 42 30 Z" fill="#fff8e1"/>
        <path d="M32 12 C18 12 14 24 14 36 L50 36 C50 24 46 12 32 12 Z" fill="#ffd54f"/><rect x="12" y="34" width="40" height="8" rx="2" fill="#e0a82e"/>
        <path d="M18 42 L18 52 C24 58 40 58 46 52 L46 42" fill="#b0bec5"/>${[[32, 4, 4], [6, 52, 3], [58, 50, 3]].map(([x, y, r]) => `<path d="${starPath(x, y, r, r * 0.35, 4)}" fill="#fff8e1" stroke-width="1.5"/>`).join('')}`,
    aquila: `<path d="M32 26 L32 62" stroke-width="5"/><path d="M32 26 L32 62" stroke="#8d6e63" stroke-width="2.5"/><rect x="22" y="38" width="20" height="14" rx="2" fill="#1565c0"/>
        <path d="M32 24 C24 12 10 10 4 14 C10 16 14 20 16 24 C22 22 28 24 32 28 C36 24 42 22 48 24 C50 20 54 16 60 14 C54 10 40 12 32 24 Z" fill="#ffd54f"/>
        <circle cx="32" cy="14" r="5" fill="#ffd54f"/><path d="M36 14 L40 16 L36 17 Z" fill="#e0a82e" stroke-width="2"/>`,
    spartans: `<path d="M8 34 C8 14 56 14 56 34 L56 46 C50 50 46 56 44 60 L20 60 C18 56 14 50 8 46 Z" fill="#e0a82e"/>
        <path d="M24 34 L24 50 M40 34 L40 50" stroke-width="4"/><path d="M14 30 L50 30" stroke-width="4"/>
        <path d="M10 18 C14 4 50 4 54 18 C46 12 18 12 10 18 Z" fill="#1565c0"/>${shine(20, 26, 4, 2.5)}`,
    // ---- 德魯伊（druid.js）----
    // 大招「野性化身」：熊掌印
    bearform: `<ellipse cx="32" cy="42" rx="16" ry="14" fill="#8d6e63"/>${[[14, 24, -20], [24, 15, -8], [40, 15, 8], [50, 24, 20]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="8" transform="rotate(${r} ${x} ${y})" fill="#8d6e63"/><path d="M${x} ${y - 8} L${x + r / 6} ${y - 14}" stroke-width="3"/>`).join('')}
        <ellipse cx="32" cy="44" rx="9" ry="7" fill="#a1887f" stroke="none"/>${shine(26, 38, 4, 2.5)}`,
    // 流派「荒野」：一叢帶刺的藤
    thorns: `<path d="M10 58 C14 40 26 34 30 18 M30 18 C34 32 46 36 50 56 M30 30 C22 30 16 24 14 16 M38 38 C46 36 52 30 54 22" stroke-width="7"/>
        <path d="M10 58 C14 40 26 34 30 18 M30 18 C34 32 46 36 50 56 M30 30 C22 30 16 24 14 16 M38 38 C46 36 52 30 54 22" stroke="#7cb342" stroke-width="3.5"/>
        ${[[19, 42, -60], [27, 28, -40], [37, 30, 40], [45, 46, 60], [18, 22, -80], [48, 28, 70]].map(([x, y, r]) => `<path d="M${x} ${y} l${(Math.cos(r * Math.PI / 180) * 7).toFixed(1)} ${(Math.sin(r * Math.PI / 180) * 7).toFixed(1)}" stroke="#c5e1a5" stroke-width="2.5"/>`).join('')}`,
    // 流派「四大節」：四色輪
    wheel: `<circle cx="32" cy="32" r="26" fill="#3e2723"/>${['#b388ff', '#b2ff59', '#ff7043', '#ffd54f'].map((c, i) => { const a0 = i * Math.PI / 2 - Math.PI / 2, a1 = a0 + Math.PI / 2; return `<path d="M32 32 L${(32 + Math.cos(a0) * 22).toFixed(1)} ${(32 + Math.sin(a0) * 22).toFixed(1)} A22 22 0 0 1 ${(32 + Math.cos(a1) * 22).toFixed(1)} ${(32 + Math.sin(a1) * 22).toFixed(1)} Z" fill="${c}" stroke-width="2.5"/>`; }).join('')}
        <circle cx="32" cy="32" r="6" fill="#ffecb3" stroke-width="3"/>`,
    // 四大節
    fest_samhain: `<path d="M8 40 C8 24 18 16 32 16 C46 16 56 24 56 40 C56 52 46 58 32 58 C18 58 8 52 8 40 Z" fill="#7e57c2"/><path d="M32 16 C30 10 34 6 38 6" stroke-width="3.5"/>
        <path d="M18 34 L26 30 L26 38 Z M46 34 L38 30 L38 38 Z" fill="#ffe082" stroke-width="2"/><path d="M20 46 L24 50 L28 46 L32 50 L36 46 L40 50 L44 46" stroke="#ffe082" stroke-width="3"/>`,
    fest_imbolc: `<path d="M32 60 L32 30" stroke-width="5"/><path d="M32 60 L32 30" stroke="#7cb342" stroke-width="2.5"/><path d="M32 46 C24 46 18 40 18 34 C26 34 32 40 32 46 Z" fill="#9ccc65" stroke-width="2.5"/>
        <path d="M32 30 C22 30 18 18 24 8 C28 14 32 18 32 30 Z M32 30 C42 30 46 18 40 8 C36 14 32 18 32 30 Z" fill="#f5f5f5"/><path d="M32 30 C28 22 30 12 32 6 C34 12 36 22 32 30 Z" fill="#ffffff"/>${shine(26, 16, 2.5, 4)}`,
    fest_beltane: `<path d="M10 58 L54 50 M10 50 L54 58" stroke-width="6"/><path d="M10 58 L54 50 M10 50 L54 58" stroke="#8d6e63" stroke-width="3"/>
        <path d="M32 50 C18 50 14 38 20 28 C24 22 24 16 22 6 C32 12 36 20 36 26 C40 22 42 18 42 12 C52 22 52 36 46 44 C42 49 38 50 32 50 Z" fill="#ff7043"/>
        <path d="M32 46 C26 46 24 40 26 34 C28 31 30 30 30 26 C35 29 38 34 37 39 C37 43 35 46 32 46 Z" fill="#ffd54f" stroke="none"/>`,
    fest_lughnasadh: `${[-16, -8, 0, 8, 16].map(r => `<g transform="rotate(${r} 32 58)"><path d="M32 58 L32 18" stroke-width="4.5"/><path d="M32 58 L32 18" stroke="#c8a24a" stroke-width="2"/>
        ${[0, 1, 2, 3].map(i => `<ellipse cx="${i % 2 ? 35 : 29}" cy="${12 + i * 5}" rx="3" ry="4.5" fill="#ffd54f" stroke-width="2"/>`).join('')}</g>`).join('')}
        <path d="M22 44 C28 48 36 48 42 44" stroke="#ff8f00" stroke-width="5"/>`,
    // 聖林
    oakHp: `<rect x="26" y="34" width="12" height="24" rx="3" fill="#6d4c41"/><circle cx="32" cy="24" r="18" fill="#558b2f"/><circle cx="20" cy="30" r="10" fill="#689f38"/><circle cx="44" cy="30" r="10" fill="#689f38"/>
        <path d="M28 44 C30 46 34 46 36 44 M28 50 L36 50" stroke="#3e2723" stroke-width="2"/><path d="M44 46 L56 46 L56 58 L44 58 Z" fill="#e5484d" stroke-width="2.5"/><path d="M50 49 L50 55 M47 52 L53 52" stroke="#fff" stroke-width="2.5"/>${shine(24, 16, 4, 2.5)}`,
    oakGrowth: `<path d="M6 54 C16 48 48 48 58 54 L58 60 L6 60 Z" fill="#5d4037"/><path d="M32 52 L32 30" stroke-width="5"/><path d="M32 52 L32 30" stroke="#7cb342" stroke-width="2.5"/>
        <path d="M32 36 C22 36 14 28 14 18 C24 18 32 26 32 36 Z M32 30 C42 30 50 22 50 12 C40 12 32 20 32 30 Z" fill="#9ccc65"/>${[[12, 44], [50, 42], [22, 56]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.5" fill="#ffd54f" stroke="none"/>`).join('')}
        ${duoStroke('M52 32 L52 22 M47 27 L52 22 L57 27', '#ffd54f', 2.5)}`,
    groveSize: `${[[14, 28], [32, 22], [50, 28]].map(([x, y]) => `<rect x="${x - 3}" y="${y + 8}" width="6" height="14" fill="#6d4c41" stroke-width="2.5"/><circle cx="${x}" cy="${y}" r="10" fill="#689f38" stroke-width="3"/>`).join('')}
        <ellipse cx="32" cy="52" rx="26" ry="7" fill="#33691e"/>${duoStroke('M32 46 L32 58 M26 52 L38 52', '#ffd54f', 3)}`,
    oakHeal: `<path d="M4 20 C14 4 50 4 60 20 C50 18 14 18 4 20 Z" fill="#558b2f"/><path d="M32 18 L32 60" stroke-width="5"/><path d="M32 18 L32 60" stroke="#6d4c41" stroke-width="2.5"/>
        ${[[16, 38], [48, 34], [24, 52], [44, 52]].map(([x, y]) => `<path d="M${x} ${y - 5} L${x} ${y + 5} M${x - 5} ${y} L${x + 5} ${y}" stroke="#81c784" stroke-width="3"/>`).join('')}`,
    // 狼群
    wolfFang: `<path d="M8 20 C20 12 44 12 56 20 L50 30 L44 22 L38 34 L32 22 L26 34 L20 22 L14 30 Z" fill="#eceff1"/><path d="M8 46 C20 54 44 54 56 46 L50 38 L44 44 L38 34 L32 44 L26 34 L20 44 L14 38 Z" fill="#eceff1"/>
        <path d="M38 34 L40 42 M26 34 L24 42" stroke="#c62828" stroke-width="2.5"/>`,
    packHunt: `${[[14, 22, 0.8], [50, 22, 0.8], [32, 40, 1]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-12 8 L-12 -6 L-8 -14 L-4 -6 L4 -6 L8 -14 L12 -6 L12 8 C8 14 -8 14 -12 8 Z" fill="#90a4ae"/>
        <circle cx="-5" cy="0" r="2" fill="#ffd54f" stroke="none"/><circle cx="5" cy="0" r="2" fill="#ffd54f" stroke="none"/><path d="M-2 7 L0 9 L2 7" stroke-width="2"/></g>`).join('')}`,
    // 一串越跳越遠的狼爪印
    wolfSpeed: `${[[16, 50, 0.7], [32, 36, 0.85], [50, 20, 1]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="4" rx="7" ry="6" fill="#b0bec5"/>${[[-7, -4], [-2.5, -8], [2.5, -8], [7, -4]].map(([a, b]) => `<ellipse cx="${a}" cy="${b}" rx="2.6" ry="3.4" fill="#b0bec5" stroke-width="2.5"/>`).join('')}</g>`).join('')}
        <path d="M4 40 L12 32 M8 56 L18 46 M22 26 L30 18" stroke="#8fd3ff" stroke-width="3"/>`,
    wolfCrit: `<path d="M10 52 L44 18 M20 56 L52 24 M30 58 L58 32" stroke-width="7"/><path d="M10 52 L44 18 M20 56 L52 24 M30 58 L58 32" stroke="#ff9100" stroke-width="3.5"/>
        <path d="${starPath(16, 16, 10, 4, 4)}" fill="#ffd54f" stroke-width="2.5"/>`,
    // 巨熊
    bearHide: `<path d="M8 22 C8 10 20 6 32 6 C44 6 56 10 56 22 L56 44 C56 54 46 60 32 60 C18 60 8 54 8 44 Z" fill="#795548"/><circle cx="14" cy="10" r="6" fill="#795548"/><circle cx="50" cy="10" r="6" fill="#795548"/>
        <path d="M18 26 L46 26 M16 36 L48 36 M18 46 L46 46" stroke="#5d4037" stroke-width="3"/><path d="M26 20 L26 50 M38 20 L38 50" stroke="#a1887f" stroke-width="2"/>${shine(18, 18, 4, 2.5)}`,
    bearMaul: `<ellipse cx="26" cy="40" rx="15" ry="13" fill="#8d6e63"/>${[[12, 24, -20], [22, 17, -8], [34, 18, 8], [42, 27, 20]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="7" transform="rotate(${r} ${x} ${y})" fill="#8d6e63"/>`).join('')}
        <ellipse cx="26" cy="42" rx="8" ry="6" fill="#a1887f" stroke="none"/>${[0, 1, 2].map(i => `<path d="M${42 + i * 6} ${10 + i * 3} L${52 + i * 4} ${30 + i * 4}" stroke="#ffccbc" stroke-width="3"/>`).join('')}`,
    // 熊耳朵的時鐘：化身撐更久
    bearTime: `<circle cx="13" cy="15" r="8" fill="#8d6e63"/><circle cx="51" cy="15" r="8" fill="#8d6e63"/><circle cx="32" cy="36" r="24" fill="#8d6e63"/><circle cx="32" cy="36" r="17" fill="#fff3e0"/>
        <path d="M32 24 L32 36 L41 41" stroke-width="4"/>${[0, 1, 2, 3].map(i => { const a = i * Math.PI / 2; return `<circle cx="${(32 + Math.cos(a) * 13).toFixed(1)}" cy="${(36 + Math.sin(a) * 13).toFixed(1)}" r="1.6" fill="#1b1424" stroke="none"/>`; }).join('')}`,
    bearStun: `${[[18, 18], [46, 18], [32, 10]].map(([x, y]) => `<path d="${starPath(x, y, 7, 3, 5)}" fill="#ffd54f" stroke-width="2"/>`).join('')}<ellipse cx="32" cy="44" rx="20" ry="14" fill="#ef9a9a"/>
        <path d="M24 42 L28 46 M28 42 L24 46 M36 42 L40 46 M40 42 L36 46" stroke-width="2.5"/><path d="M26 52 C30 50 34 54 38 52" stroke-width="2.5"/>`,
    // 荒野
    seedPower: `${[[20, 24, -140], [44, 24, -40], [18, 44, 160], [46, 44, 20], [32, 16, -90], [32, 56, 90]].map(([x, y, r]) => { const c = Math.cos(r * Math.PI / 180), s = Math.sin(r * Math.PI / 180); return `<path d="M${(x - s * 4).toFixed(1)} ${(y + c * 4).toFixed(1)} L${(x + c * 10).toFixed(1)} ${(y + s * 10).toFixed(1)} L${(x + s * 4).toFixed(1)} ${(y - c * 4).toFixed(1)} Z" fill="#c5e1a5" stroke-width="2.5"/>`; }).join('')}
        <ellipse cx="32" cy="36" rx="14" ry="18" fill="#7cb342"/><path d="M32 20 L32 52" stroke="#33691e" stroke-width="2.5"/>
        <circle cx="44" cy="52" r="6" fill="#ab47bc" stroke-width="2.5"/>${shine(26, 28, 3, 5, 20)}`,
    seedRoot: `<ellipse cx="32" cy="22" rx="12" ry="14" fill="#ef9a9a"/><circle cx="27" cy="20" r="2" fill="#1b1424" stroke="none"/><circle cx="37" cy="20" r="2" fill="#1b1424" stroke="none"/>
        <path d="M8 58 C12 44 20 40 22 30 C28 34 36 34 42 30 C44 40 52 44 56 58" stroke-width="7"/><path d="M8 58 C12 44 20 40 22 30 C28 34 36 34 42 30 C44 40 52 44 56 58" stroke="#7cb342" stroke-width="3.5"/>
        <path d="M18 34 C26 40 38 40 46 34" stroke="#7cb342" stroke-width="3"/>`,
    seedCount: `${[[16, 40], [32, 30], [48, 40], [24, 54], [42, 54]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="6.5" fill="#7cb342" stroke-width="2.5"/>`).join('')}
        <path d="M10 18 C20 8 44 8 54 18" stroke="#c5e1a5" stroke-width="3" stroke-dasharray="4 4"/>`,
    seedRadius: `<circle cx="32" cy="34" r="24" stroke="#9ccc65" stroke-width="3" stroke-dasharray="6 5"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * Math.PI / 4; return `<path d="M32 34 Q${(32 + Math.cos(a + 0.5) * 12).toFixed(1)} ${(34 + Math.sin(a + 0.5) * 12).toFixed(1)} ${(32 + Math.cos(a) * 20).toFixed(1)} ${(34 + Math.sin(a) * 20).toFixed(1)}" stroke="#7cb342" stroke-width="3"/>`; }).join('')}
        <circle cx="32" cy="34" r="5" fill="#558b2f" stroke-width="2.5"/>`,
    // 四大節
    festPower: `<path d="M20 60 L24 26 L40 26 L44 60 Z" fill="#eceff1"/><path d="M24 26 C24 16 40 16 40 26" fill="#eceff1"/><circle cx="32" cy="14" r="8" fill="#ffe0b2"/>
        <path d="M12 8 L20 20 M52 8 L44 20" stroke="#ffd54f" stroke-width="3"/><path d="M16 40 L8 30" stroke-width="4"/><path d="M8 30 C4 24 10 20 12 24" fill="#9ccc65" stroke-width="2.5"/>
        <path d="M44 38 L56 34" stroke-width="4"/><path d="M56 30 C60 30 60 38 56 38" stroke="#ffd54f" stroke-width="3"/>`,
    festLinger: `<circle cx="24" cy="32" r="16" fill="#ff7043" opacity="0.55"/><circle cx="40" cy="32" r="16" fill="#ffd54f"/><path d="M24 16 C14 16 8 24 8 32 C8 40 14 48 24 48" stroke-width="3" stroke-dasharray="3 3"/>`,
    festRenew: `<path d="M32 58 C22 52 12 42 12 30 C12 20 20 14 26 14 C30 14 32 18 32 18 C32 18 34 14 38 14 C44 14 52 20 52 30 C52 42 42 52 32 58 Z" fill="#9ccc65"/>
        <path d="M32 50 L32 26 M24 34 L32 26 L40 34" stroke="#fff" stroke-width="3.5"/>`,
    festOffering: `<path d="M8 50 L56 50 L50 60 L14 60 Z" fill="#bcaaa4"/><path d="M14 50 L14 44 L50 44 L50 50" fill="#d7ccc8"/>
        <path d="M32 44 L32 24" stroke-width="4"/><path d="M32 24 C24 24 20 18 20 10 C28 10 32 16 32 24 Z M32 24 C40 24 44 18 44 10 C36 10 32 16 32 24 Z" fill="#9ccc65"/>${duoStroke('M50 30 L50 18 M45 23 L50 18 L55 23', '#ffd54f', 2.5)}`,
    // 傳說
    goldenSickle: `<path d="M44 14 C26 8 10 22 14 40 C20 28 32 22 46 24 Z" fill="#ffd54f"/><path d="M44 14 C26 8 10 22 14 40" stroke-width="3"/><path d="M46 24 L54 52" stroke-width="5"/><path d="M46 24 L54 52" stroke="#8d6e63" stroke-width="2.5"/>
        ${[[28, 46], [34, 52], [24, 54]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#f1f8e9" stroke-width="2"/>`).join('')}<path d="M20 50 C24 44 30 42 36 44" stroke="#7cb342" stroke-width="3"/>${shine(26, 18, 4, 2)}`,
    yggdrasil: `<path d="M26 60 C28 46 28 38 26 30 L38 30 C36 38 36 46 38 60 Z" fill="#6d4c41"/><path d="M14 60 C20 56 24 56 28 60 M50 60 C44 56 40 56 36 60" stroke-width="4"/>
        <circle cx="32" cy="22" r="18" fill="#33691e"/><circle cx="16" cy="26" r="10" fill="#558b2f"/><circle cx="48" cy="26" r="10" fill="#558b2f"/>${[[22, 14], [40, 12], [32, 26], [14, 26], [50, 26]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#fff59d" stroke="none"/>`).join('')}`,
    whiteBull: `<path d="M14 26 C4 22 4 10 10 6 C12 14 16 18 22 20 Z M50 26 C60 22 60 10 54 6 C52 14 48 18 42 20 Z" fill="#fff8e1"/>
        <path d="M18 22 C18 14 46 14 46 22 L48 40 C48 52 40 58 32 58 C24 58 16 52 16 40 Z" fill="#f5f5f5"/><ellipse cx="32" cy="48" rx="10" ry="7" fill="#ffcdd2"/>
        <circle cx="28" cy="48" r="1.8" fill="#1b1424" stroke="none"/><circle cx="36" cy="48" r="1.8" fill="#1b1424" stroke="none"/><circle cx="25" cy="32" r="2.2" fill="#1b1424" stroke="none"/><circle cx="39" cy="32" r="2.2" fill="#1b1424" stroke="none"/>`,
    // ---- 吸血鬼（vampire.js）----
    // 錢包：一滴血
    blood: `<path d="M32 4 C42 20 52 30 52 42 C52 54 43 60 32 60 C21 60 12 54 12 42 C12 30 22 20 32 4 Z" fill="#7e57c2"/><path d="M22 42 C22 48 26 52 32 52" stroke="#ffcdd2" stroke-width="3"/>${shine(24, 36, 3, 6, 20)}`,
    sun: `${[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * Math.PI / 4; return `<path d="M${(32 + Math.cos(a) * 20).toFixed(1)} ${(32 + Math.sin(a) * 20).toFixed(1)} L${(32 + Math.cos(a) * 29).toFixed(1)} ${(32 + Math.sin(a) * 29).toFixed(1)}" stroke-width="5"/><path d="M${(32 + Math.cos(a) * 20).toFixed(1)} ${(32 + Math.sin(a) * 20).toFixed(1)} L${(32 + Math.cos(a) * 29).toFixed(1)} ${(32 + Math.sin(a) * 29).toFixed(1)}" stroke="#ffd54f" stroke-width="2.5"/>`; }).join('')}
        <circle cx="32" cy="32" r="15" fill="#ffca28"/>${shine(27, 26, 4, 2.5)}`,
    moon: `<path d="M40 6 C24 8 12 20 12 34 C12 50 26 60 40 58 C28 52 22 42 22 32 C22 20 30 10 40 6 Z" fill="#fff3c4"/>${[[46, 20, 3], [52, 38, 2.5], [40, 46, 2]].map(([x, y, r]) => `<path d="${starPath(x, y, r * 1.6, r * 0.6, 4)}" fill="#fff3c4" stroke-width="1.5"/>`).join('')}`,
    // 大招「血月降臨」
    bloodmoon: `<circle cx="32" cy="30" r="22" fill="#5e35b1"/><circle cx="24" cy="24" r="4" fill="#311b92" stroke="none"/><circle cx="38" cy="34" r="5" fill="#311b92" stroke="none"/><circle cx="30" cy="40" r="2.5" fill="#311b92" stroke="none"/>
        <path d="M14 52 L24 46 L32 54 L40 46 L50 52 L44 60 L20 60 Z" fill="#1b1424"/>${shine(22, 18, 5, 3)}`,
    // 流派
    kin: `<path d="M8 58 L8 40 C8 30 14 26 20 26 C26 26 32 30 32 40 L32 58 Z" fill="#ce93d8"/><path d="M32 58 L32 36 C32 26 38 22 44 22 C50 22 56 26 56 36 L56 58 Z" fill="#ab47bc"/>
        <circle cx="20" cy="16" r="9" fill="#e1bee7"/><circle cx="44" cy="12" r="9" fill="#ce93d8"/><circle cx="17" cy="15" r="1.8" fill="#5e35b1" stroke="none"/><circle cx="23" cy="15" r="1.8" fill="#5e35b1" stroke="none"/><circle cx="41" cy="11" r="1.8" fill="#5e35b1" stroke="none"/><circle cx="47" cy="11" r="1.8" fill="#5e35b1" stroke="none"/>`,
    bloodmagic: `<path d="M32 6 C40 18 48 26 48 36 C48 46 41 52 32 52 C23 52 16 46 16 36 C16 26 24 18 32 6 Z" fill="#5e35b1"/>${[0, 1, 2, 3, 4, 5].map(i => { const a = i * Math.PI / 3 + 0.3; return `<path d="M${(32 + Math.cos(a) * 22).toFixed(1)} ${(36 + Math.sin(a) * 22).toFixed(1)} L${(32 + Math.cos(a) * 29).toFixed(1)} ${(36 + Math.sin(a) * 29).toFixed(1)}" stroke="#b388ff" stroke-width="3"/>`; }).join('')}
        <path d="${starPath(32, 36, 9, 4, 5)}" fill="#ffcdd2" stroke-width="2"/>`,
    werewolf: `<path d="M12 60 L12 30 L6 8 L22 22 L42 22 L58 8 L52 30 L52 60 Z" fill="#78909c"/><path d="M22 34 L28 38 M42 34 L36 38" stroke="#ffd54f" stroke-width="3.5"/>
        <path d="M22 48 L26 52 L30 48 L34 52 L38 48 L42 52" stroke="#eceff1" stroke-width="2.5"/>${cornerMoon()}`,
    coffin: `<path d="M22 4 L42 4 L52 18 L44 60 L20 60 L12 18 Z" fill="#4e342e"/><path d="M22 4 L42 4 L52 18 L44 60 L20 60 L12 18 Z" fill="none" stroke="#1b1424" stroke-width="4"/>
        <path d="M32 18 L32 40 M24 26 L40 26" stroke="#ffd54f" stroke-width="3.5"/>${shine(22, 14, 3, 5, 20)}`,
    // 血魔法
    bmPower: `<path d="M32 6 C42 20 52 30 52 42 C52 54 43 60 32 60 C21 60 12 54 12 42 C12 30 22 20 32 4 Z" fill="#7e57c2"/>${boltAt(32, 40)}`,
    bmRadius: `${[24, 16, 8].map((r, i) => `<circle cx="32" cy="32" r="${r + 4}" stroke="${['#d1c4e9', '#b39ddb', '#5e35b1'][i]}" stroke-width="3" ${i === 0 ? 'stroke-dasharray="5 4"' : ''}/>`).join('')}<circle cx="32" cy="32" r="6" fill="#4527a0"/>`,
    bmRate: `<path d="M4 34 L16 34 L22 18 L30 50 L38 14 L44 34 L60 34" stroke-width="7"/><path d="M4 34 L16 34 L22 18 L30 50 L38 14 L44 34 L60 34" stroke="#9575cd" stroke-width="3.5"/>`,
    bmLeech: `<path d="M32 10 C38 20 44 26 44 34 C44 42 38 46 32 46 C26 46 20 42 20 34 C20 26 26 20 32 10 Z" fill="#7e57c2"/>
        <path d="M10 40 C8 54 20 60 32 58 M54 40 C56 54 44 60 32 58" stroke-width="5"/><path d="M10 40 C8 54 20 60 32 58 M54 40 C56 54 44 60 32 58" stroke="#81c784" stroke-width="2.5"/><path d="M6 44 L10 38 L14 44" stroke="#81c784" stroke-width="2.5"/>`,
    // 眷屬
    kinRate: `<path d="M16 62 L16 40 C16 28 24 22 32 22 C40 22 48 28 48 40 L48 62" fill="#ce93d8"/><path d="M20 26 L26 8 L32 22 L38 8 L44 26" fill="#e1bee7"/>
        <circle cx="26" cy="36" r="3" fill="#5e35b1" stroke="none"/><circle cx="38" cy="36" r="3" fill="#5e35b1" stroke="none"/>${duoStroke('M50 18 L50 6 M44 12 L56 12', '#ffd54f', 3)}`,
    kinCap: `${[[12, 0.7], [32, 0.9], [52, 0.7]].map(([x, s]) => `<g transform="translate(${x} 40) scale(${s})"><path d="M-10 22 L-10 0 C-10 -8 -5 -12 0 -12 C5 -12 10 -8 10 0 L10 22 Z" fill="#ce93d8"/><circle cx="-3" cy="-2" r="1.8" fill="#5e35b1" stroke="none"/><circle cx="3" cy="-2" r="1.8" fill="#5e35b1" stroke="none"/></g>`).join('')}
        <path d="M14 12 L22 4 L32 12 L42 4 L50 12 L46 20 L18 20 Z" fill="#ffd54f"/>`,
    kinPower: `<path d="M14 60 L14 34 C14 22 22 16 32 16 C42 16 50 22 50 34 L50 60" fill="#ab47bc"/><path d="M20 44 L44 44 M32 30 L32 58" stroke="#e1bee7" stroke-width="3"/>
        <circle cx="25" cy="28" r="3" fill="#ffcdd2" stroke="none"/><circle cx="39" cy="28" r="3" fill="#ffcdd2" stroke="none"/>${duoStroke('M8 22 L8 8 M3 13 L8 8 L13 13', '#ffd54f', 2.5)}${duoStroke('M56 22 L56 8 M51 13 L56 8 L61 13', '#ffd54f', 2.5)}`,
    kinLeech: `<path d="M8 50 L24 18 L40 50 Z" fill="#ce93d8"/><path d="M32 18 C38 28 44 34 44 42 C44 50 38 54 32 54 C26 54 20 50 20 42 C20 34 26 28 32 18 Z" fill="#7e57c2"/>
        <path d="M48 52 C56 46 58 34 52 26" stroke-width="5"/><path d="M48 52 C56 46 58 34 52 26" stroke="#81c784" stroke-width="2.5"/><path d="M48 24 L52 26 L50 30" stroke="#81c784" stroke-width="2.5"/>`,
    // 蝠群
    batPair: `${[[20, 26, 0.9], [44, 40, 0.9]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -4 C-8 -14 -22 -12 -24 -2 C-18 -6 -14 -2 -12 2 C-8 -2 -4 0 0 6 C4 0 8 -2 12 2 C14 -2 18 -6 24 -2 C22 -12 8 -14 0 -4 Z" fill="#4527a0"/><circle cx="-3" cy="-2" r="1.6" fill="#ffd54f" stroke="none"/><circle cx="3" cy="-2" r="1.6" fill="#ffd54f" stroke="none"/></g>`).join('')}`,
    batFang: `<path d="M32 18 C18 4 4 10 2 24 C10 20 16 24 18 30 C24 24 28 28 32 36 C36 28 40 24 46 30 C48 24 54 20 62 24 C60 10 46 4 32 18 Z" fill="#4527a0"/>
        <path d="M26 36 L28 46 L30 36 M34 36 L36 46 L38 36" fill="#ffffff" stroke-width="2"/><circle cx="27" cy="26" r="2.2" fill="#ffd54f" stroke="none"/><circle cx="37" cy="26" r="2.2" fill="#ffd54f" stroke="none"/>`,
    batDrain: `<path d="M20 22 C12 14 4 16 2 24 C8 22 10 24 12 28 C16 24 18 26 20 30 C22 26 24 24 28 28 C30 24 34 22 38 24 C36 16 28 14 20 22 Z" fill="#4527a0"/>
        <path d="M24 32 C30 44 40 50 52 50" stroke="#9575cd" stroke-width="3" stroke-dasharray="4 3"/><path d="M52 40 C58 48 58 56 52 60 C46 56 46 48 52 40 Z" fill="#7e57c2" stroke-width="2.5"/>`,
    batSpeed: `<path d="M38 26 C30 16 18 18 16 28 C22 26 26 28 28 32 C32 28 34 30 38 36 C42 30 44 28 48 32 C50 28 54 26 60 28 C58 18 46 16 38 26 Z" fill="#4527a0"/>
        <path d="M4 26 L14 26 M2 36 L14 36 M6 46 L18 46" stroke="#8fd3ff" stroke-width="3.5"/>`,
    // 狼化
    vwSpeed: `${[[16, 50, 0.7], [32, 36, 0.85], [50, 20, 1]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="4" rx="7" ry="6" fill="#ce93d8"/>${[[-7, -4], [-2.5, -8], [2.5, -8], [7, -4]].map(([a, b]) => `<ellipse cx="${a}" cy="${b}" rx="2.6" ry="3.4" fill="#ce93d8" stroke-width="2.5"/>`).join('')}</g>`).join('')}${cornerMoon()}`,
    vwBite: `<path d="M6 22 C18 12 46 12 58 22 L52 32 L46 24 L40 36 L32 24 L24 36 L18 24 L12 32 Z" fill="#eceff1"/><path d="M6 44 C18 54 46 54 58 44 L52 36 L46 42 L40 32 L32 42 L24 32 L18 42 L12 36 Z" fill="#eceff1"/>
        <path d="M40 36 C40 40 42 42 42 44 C42 46 40 47 40 47 C40 47 38 46 38 44 C38 42 40 40 40 36 Z" fill="#7e57c2" stroke-width="2"/>`,
    vwHowl: `<path d="M14 60 L14 34 L8 16 L22 26 L30 18 L42 30 C48 34 48 44 44 50 L44 60 Z" fill="#78909c"/><path d="M42 30 L58 22 L52 34" fill="#78909c"/>
        <path d="M50 14 C54 12 58 14 60 18 M52 6 C58 4 62 8 62 14" stroke="#e1bee7" stroke-width="3"/><circle cx="34" cy="32" r="2" fill="#ffd54f" stroke="none"/>`,
    vwPack: `${[[16, 44], [48, 44], [32, 34]].map(([x, y]) => `<g transform="translate(${x} ${y})"><path d="M-12 8 L-12 -6 L-8 -14 L-4 -6 L4 -6 L8 -14 L12 -6 L12 8 C8 14 -8 14 -12 8 Z" fill="#78909c"/><circle cx="-5" cy="0" r="2" fill="#ce93d8" stroke="none"/><circle cx="5" cy="0" r="2" fill="#ce93d8" stroke="none"/></g>`).join('')}${cornerMoon()}`,
    // 不死
    mistForm: `<path d="M8 40 C8 30 18 28 22 32 C24 22 38 20 42 30 C50 26 58 32 56 40 C60 46 54 52 48 50 C44 56 32 56 28 50 C20 54 10 50 12 44 C8 44 6 42 8 40 Z" fill="#b39ddb" opacity="0.9"/>
        <path d="M16 42 C24 38 32 46 40 42 C44 40 48 42 50 44" stroke="#ede7f6" stroke-width="3"/><path d="M40 18 L48 10 M46 22 L56 18" stroke="#ede7f6" stroke-width="3"/>`,
    sunWard: `<path d="M30 6 C20 6 12 14 12 26 L12 58 L24 52 L32 58 L40 52 L52 58 L52 26 C52 14 44 6 34 6 Z" fill="#4a148c"/><path d="M24 12 C28 20 36 20 40 12" stroke="#5e35b1" stroke-width="4"/>
        ${cornerSun()}${duoStroke('M44 6 L62 24', '#9575cd', 2.5)}`,
    nightRegen: `<path d="M34 8 C22 10 12 20 12 32 C12 46 24 56 36 54 C26 50 20 42 20 32 C20 22 26 14 34 8 Z" fill="#fff3c4"/><path d="M48 28 L48 48 M38 38 L58 38" stroke-width="7"/><path d="M48 28 L48 48 M38 38 L58 38" stroke="#81c784" stroke-width="4"/>`,
    bloodBank: `<path d="M12 22 L52 22 L48 58 L16 58 Z" fill="#8d6e63"/><path d="M8 22 L56 22" stroke-width="5"/><path d="M8 22 L56 22" stroke="#bcaaa4" stroke-width="2.5"/>
        <path d="M32 28 C37 36 42 40 42 46 C42 52 37 54 32 54 C27 54 22 52 22 46 C22 40 27 36 32 28 Z" fill="#7e57c2" stroke-width="2.5"/>${duoStroke('M32 4 L32 16 M27 11 L32 16 L37 11', '#ffd54f', 2.5)}`,
    // 傳說
    dracula: `<path d="M6 60 C8 40 16 28 32 26 C48 28 56 40 58 60 Z" fill="#1b1424"/><path d="M6 60 C8 40 16 28 32 26 C48 28 56 40 58 60" stroke="#5e35b1" stroke-width="3"/>
        <path d="M20 26 L20 12 C20 6 44 6 44 12 L44 26 C40 32 24 32 20 26 Z" fill="#eceff1"/><path d="M20 12 L32 20 L44 12" fill="#1b1424" stroke-width="2.5"/>
        <path d="M27 28 L29 33 L31 28 M33 28 L35 33 L37 28" fill="#fff" stroke-width="1.8"/><circle cx="27" cy="19" r="1.8" fill="#5e35b1" stroke="none"/><circle cx="37" cy="19" r="1.8" fill="#5e35b1" stroke="none"/><path d="M22 6 L26 0 L32 4 L38 0 L42 6 Z" fill="#ffd54f" stroke-width="2.5"/>`,
    countess: `<path d="M10 22 L18 10 L26 20 L32 6 L38 20 L46 10 L54 22 L50 30 L14 30 Z" fill="#ffd54f"/><circle cx="32" cy="20" r="3" fill="#5e35b1" stroke-width="2"/>
        <path d="M18 34 C12 46 18 58 32 58 C46 58 52 46 46 34 Z" fill="#5e35b1"/><path d="M22 40 C24 50 40 50 42 40" stroke="#ffcdd2" stroke-width="3"/>${shine(24, 40, 3, 5, 20)}`,
    garlic: `<path d="M32 12 C22 14 10 24 12 40 C14 54 26 60 32 60 C38 60 50 54 52 40 C54 24 42 14 32 12 Z" fill="#fff8e1"/><path d="M32 14 C26 26 26 48 32 60 M32 14 C38 26 38 48 32 60 M20 22 C16 34 18 50 26 58 M44 22 C48 34 46 50 38 58" stroke="#d7ccc8" stroke-width="2.5"/>
        <path d="M32 12 C30 6 34 2 38 4" stroke="#9ccc65" stroke-width="4"/>${duoStroke('M8 8 L56 56', '#e53935', 3)}`,
    // ---- 精靈弓箭手（elf.js）----
    // 大招「箭雨」
    arrowrain: `<path d="M10 20 C2 20 2 8 12 8 C14 0 30 0 32 6 C38 0 52 2 52 10 C62 10 62 20 54 20 Z" fill="#90a4ae"/>
        ${[[14, 26], [28, 32], [42, 26], [21, 44], [36, 46], [50, 40]].map(([x, y]) => `<path d="M${x} ${y - 10} L${x} ${y + 6}" stroke-width="5"/><path d="M${x} ${y - 10} L${x} ${y + 6}" stroke="#a1887f" stroke-width="2.5"/><path d="M${x} ${y + 12} L${x - 4} ${y + 4} L${x + 4} ${y + 4} Z" fill="#eceff1" stroke-width="2"/>`).join('')}`,
    // 流派
    parthian: `<path d="M44 14 C56 26 56 42 44 54" stroke-width="6"/><path d="M44 14 C56 26 56 42 44 54" stroke="#8d6e63" stroke-width="3"/><path d="M44 14 L44 54" stroke="#eceff1" stroke-width="1.8"/>
        <path d="M44 34 L8 34" stroke-width="4.5"/><path d="M44 34 L8 34" stroke="#a1887f" stroke-width="2"/><path d="M4 34 L12 29 L12 39 Z" fill="#eceff1" stroke-width="2"/>
        ${duoStroke('M30 50 L54 50 M48 45 L54 50 L48 55', '#80cbc4', 2.5)}`,
    longbow: `<path d="M20 4 C44 16 44 48 20 60" stroke-width="6"/><path d="M20 4 C44 16 44 48 20 60" stroke="#6d4c41" stroke-width="3"/><path d="M20 4 L20 60" stroke="#eceff1" stroke-width="1.8"/>
        <path d="M20 32 L58 32" stroke-width="4.5"/><path d="M20 32 L58 32" stroke="#a1887f" stroke-width="2"/><path d="M62 32 L54 27 L54 37 Z" fill="#eceff1" stroke-width="2"/>`,
    elemental: `${[['#ff7043', 14, 52], ['#4fc3f7', 32, 52], ['#fff176', 50, 52]].map(([c, x, y]) => `<path d="M${x} ${y} L${x} ${y - 34}" stroke-width="4.5"/><path d="M${x} ${y} L${x} ${y - 34}" stroke="${c}" stroke-width="2.2"/><path d="M${x} ${y - 40} L${x - 5} ${y - 30} L${x + 5} ${y - 30} Z" fill="${c}" stroke-width="2"/>`).join('')}`,
    // 張開的捕獸夾
    trapper: `<ellipse cx="32" cy="50" rx="26" ry="8" fill="#5d4037"/><path d="M8 48 C8 24 24 14 32 14 C40 14 56 24 56 48" fill="none" stroke-width="8"/><path d="M8 48 C8 24 24 14 32 14 C40 14 56 24 56 48" fill="none" stroke="#90a4ae" stroke-width="4"/>
        ${[16, 24, 32, 40, 48].map(x => `<path d="M${x - 4} ${x === 32 ? 18 : x === 24 || x === 40 ? 21 : 28} L${x} ${x === 32 ? 28 : x === 24 || x === 40 ? 31 : 38} L${x + 4} ${x === 32 ? 18 : x === 24 || x === 40 ? 21 : 28}" fill="#eceff1" stroke-width="2"/>`).join('')}
        <circle cx="32" cy="50" r="6" fill="#ffcc80" stroke-width="2.5"/>`,
    // 回馬射
    backPower: `<path d="M50 12 C60 24 60 40 50 52" stroke-width="5"/><path d="M50 12 C60 24 60 40 50 52" stroke="#8d6e63" stroke-width="2.5"/><path d="M50 32 L10 32" stroke-width="4.5"/><path d="M50 32 L10 32" stroke="#80cbc4" stroke-width="2"/>
        <path d="M4 32 L13 26 L13 38 Z" fill="#eceff1" stroke-width="2"/>${boltAt(26, 50)}`,
    moveRate: `${[18, 30, 42].map(y => `<path d="M48 ${y} L14 ${y}" stroke-width="4"/><path d="M48 ${y} L14 ${y}" stroke="#a1887f" stroke-width="1.8"/><path d="M8 ${y} L16 ${y - 4} L16 ${y + 4} Z" fill="#eceff1" stroke-width="1.8"/>`).join('')}
        <path d="M54 14 L60 14 M52 30 L60 30 M54 46 L60 46" stroke="#8fd3ff" stroke-width="3"/><path d="M14 56 L50 56" stroke="#80cbc4" stroke-width="3" stroke-dasharray="4 4"/>`,
    stride: `<path d="M18 12 L30 12 L30 38 L46 44 C52 46 52 54 46 54 L18 54 Z" fill="#a5d6a7"/><path d="M18 44 L50 44" stroke-width="3"/>
        <path d="M30 12 C40 4 52 6 58 14 C50 12 42 14 36 20" fill="#c5e1a5"/><path d="M4 30 L12 30 M2 40 L12 40" stroke="#8fd3ff" stroke-width="3"/>`,
    backSlow: `<path d="M8 50 C20 42 44 42 56 50" stroke="#4fc3f7" stroke-width="4" stroke-dasharray="5 4"/><ellipse cx="38" cy="30" rx="12" ry="14" fill="#ef9a9a"/><path d="M34 28 L36 30 M42 28 L40 30" stroke-width="2"/>
        <path d="M6 22 L26 30" stroke-width="4"/><path d="M6 22 L26 30" stroke="#80cbc4" stroke-width="2"/>${[[24, 56], [40, 58]].map(([x, y]) => `<path d="M${x} ${y} l-4 -6 M${x} ${y} l4 -6" stroke="#b3e5fc" stroke-width="2.5"/>`).join('')}`,
    // 長弓
    bowRangeUp: `<path d="M10 54 C14 40 26 40 30 54" stroke-width="4"/><path d="M10 54 C14 40 26 40 30 54" stroke="#6d4c41" stroke-width="2"/>
        <path d="M22 44 L52 14" stroke="#ffd54f" stroke-width="3" stroke-dasharray="4 4"/><circle cx="54" cy="12" r="7" fill="#e5484d"/><circle cx="54" cy="12" r="3" fill="#fff8e1" stroke-width="2"/>`,
    bowPowerUp: `<path d="M14 4 C40 18 40 46 14 60" stroke-width="8"/><path d="M14 4 C40 18 40 46 14 60" stroke="#4e342e" stroke-width="4.5"/><path d="M14 4 L14 60" stroke="#eceff1" stroke-width="2"/>
        <path d="M36 10 C40 14 44 14 48 10 M42 10 L42 24" stroke="#7cb342" stroke-width="3"/>${duoStroke('M52 40 L52 28 M47 33 L52 28 L57 33', '#ffd54f', 2.5)}`,
    farShot: `<path d="M6 32 L40 32" stroke-width="4"/><path d="M6 32 L40 32" stroke="#a1887f" stroke-width="2"/><path d="M44 32 L36 27 L36 37 Z" fill="#eceff1" stroke-width="2"/>
        ${[48, 54, 60].map((x, i) => `<path d="M${x} ${24 - i * 4} L${x} ${40 + i * 4}" stroke="#ffd54f" stroke-width="${2 + i}"/>`).join('')}`,
    volley: `${[-14, 0, 14].map(o => `<path d="M10 ${32 + o * 0.4} L50 ${32 + o}" stroke-width="4"/><path d="M10 ${32 + o * 0.4} L50 ${32 + o}" stroke="#a1887f" stroke-width="2"/><path d="M56 ${32 + o * 1.1} L48 ${27 + o} L48 ${37 + o} Z" fill="#eceff1" stroke-width="2"/>`).join('')}`,
    // 元素箭
    fireArrow: `<path d="M6 54 L42 18" stroke-width="5"/><path d="M6 54 L42 18" stroke="#a1887f" stroke-width="2.5"/><path d="M48 12 L36 18 L42 24 Z" fill="#eceff1" stroke-width="2"/>
        <path d="M46 34 C38 34 36 26 40 20 C42 16 42 12 40 6 C48 10 52 16 52 22 C56 26 54 34 46 34 Z" fill="#ff7043" stroke-width="2.5"/>`,
    iceArrow: `<path d="M6 54 L42 18" stroke-width="5"/><path d="M6 54 L42 18" stroke="#a1887f" stroke-width="2.5"/><path d="M48 12 L36 18 L42 24 Z" fill="#b3e5fc" stroke-width="2"/>
        ${duoStroke('M48 28 L48 52 M38 34 L58 46 M38 46 L58 34', '#81d4fa', 2.5)}`,
    thunderArrow: `<path d="M6 54 L42 18" stroke-width="5"/><path d="M6 54 L42 18" stroke="#a1887f" stroke-width="2.5"/><path d="M48 12 L36 18 L42 24 Z" fill="#fff59d" stroke-width="2"/>${boltAt(48, 42)}`,
    elemSurge: `${[['#ff7043', 0], ['#4fc3f7', 120], ['#fff176', 240]].map(([c, a]) => { const r = a * Math.PI / 180; return `<circle cx="${(32 + Math.cos(r) * 14).toFixed(1)}" cy="${(34 + Math.sin(r) * 14).toFixed(1)}" r="11" fill="${c}" stroke-width="2.5"/>`; }).join('')}
        <circle cx="32" cy="34" r="6" fill="#ffffff" stroke-width="2.5"/>${duoStroke('M32 4 L32 14 M27 9 L32 4 L37 9', '#ffd54f', 2.5)}`,
    // 陷阱
    trapCount: `${[[18, 22], [44, 22], [18, 46], [44, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="#78909c"/><circle cx="${x}" cy="${y}" r="3" fill="${['#ff7043', '#4fc3f7', '#9ccc65', '#ff7043'][(x + y) % 4]}" stroke="none"/>`).join('')}`,
    trapPower: `<path d="M18 22 L46 22 L52 54 L12 54 Z" fill="#5d4037"/><path d="M14 30 L50 30" stroke="#ffd54f" stroke-width="3"/><path d="M32 22 C32 14 38 10 44 8" stroke-width="3"/>
        <path d="${starPath(46, 8, 7, 3, 6)}" fill="#ff7043" stroke-width="2"/>`,
    // 一路腳印，每隔幾步一個陷阱
    trapRate: `${[[10, 54], [20, 44], [30, 36], [40, 26], [50, 18]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="3.5" ry="5" transform="rotate(40 ${x} ${y})" fill="#a5d6a7" stroke-width="2"/>${i % 2 ? `<circle cx="${x + 9}" cy="${y + 8}" r="6" fill="#78909c" stroke-width="2.5"/><circle cx="${x + 9}" cy="${y + 8}" r="2.5" fill="#ff7043" stroke="none"/>` : ''}`).join('')}`,
    // 夾子上放一塊肉，兩邊的怪被吸過來
    trapLure: `<ellipse cx="32" cy="50" rx="18" ry="6" fill="#78909c"/><path d="M22 44 C22 32 42 32 42 44" fill="#e57373"/><path d="M26 40 L38 40" stroke="#ffcdd2" stroke-width="2.5"/>
        <path d="M34 34 C36 28 40 26 44 28" stroke="#eceff1" stroke-width="3"/>${[[6, 24], [58, 24]].map(([x, y]) => duoStroke(`M${x} ${y} L${x < 32 ? x + 12 : x - 12} ${y + 10} M${x < 32 ? x + 12 : x - 12} ${y + 10} l${x < 32 ? -7 : 7} 0 M${x < 32 ? x + 12 : x - 12} ${y + 10} l0 -7`, '#ffd54f', 2.5)).join('')}`,
    // 森林之友
    // 狐狸與鷹，加一隻
    compCap: `<path d="M8 56 L8 40 L4 26 L14 34 L24 34 L34 26 L30 40 L30 56 C24 60 14 60 8 56 Z" fill="#ffcc80"/><circle cx="14" cy="44" r="2" fill="#1b1424" stroke="none"/><circle cx="24" cy="44" r="2" fill="#1b1424" stroke="none"/>
        <path d="M36 20 C40 10 52 8 60 14 C54 14 50 18 50 24 L44 30 Z" fill="#a1887f"/><path d="M36 20 C30 16 24 16 22 20 C28 20 32 22 36 26 Z" fill="#8d6e63"/><circle cx="52" cy="16" r="1.8" fill="#1b1424" stroke="none"/>
        ${duoStroke('M48 42 L48 58 M40 50 L56 50', '#ffd54f', 3)}`,
    compPower: `<ellipse cx="30" cy="38" rx="20" ry="14" fill="#ffcc80"/><path d="M16 30 L12 12 L26 26 M44 28 L48 10 L36 24" fill="#ffcc80"/><circle cx="24" cy="36" r="2.5" fill="#1b1424" stroke="none"/><circle cx="36" cy="36" r="2.5" fill="#1b1424" stroke="none"/>
        <path d="M26 44 L30 46 L34 44" stroke-width="2"/>${duoStroke('M54 50 L54 36 M49 41 L54 36 L59 41', '#ffd54f', 2.5)}`,
    compSync: `<circle cx="22" cy="34" r="14" fill="#a5d6a7"/><circle cx="42" cy="34" r="14" fill="#ffcc80" opacity="0.9"/><path d="M14 54 C24 60 40 60 50 54" stroke="#80cbc4" stroke-width="3"/>
        <path d="M24 28 L28 34 L22 40 M40 28 L36 34 L42 40" stroke-width="2.5"/>`,
    compHeal: `<ellipse cx="28" cy="40" rx="18" ry="12" fill="#ffcc80"/><path d="M14 34 L12 20 L22 30 M40 32 L42 18 L34 28" fill="#ffcc80"/>
        <path d="M44 44 C48 48 52 46 52 42" stroke="#f48fb1" stroke-width="4"/>${duoStroke('M52 12 L52 26 M45 19 L59 19', '#81c784', 3)}`,
    // 傳說
    windBow: `<path d="M18 4 C42 16 42 48 18 60" stroke-width="7"/><path d="M18 4 C42 16 42 48 18 60" stroke="#b2ebf2" stroke-width="3.5"/><path d="M18 4 L18 60" stroke="#ffffff" stroke-width="1.8"/>
        <path d="M36 22 C48 16 58 22 54 30 C50 36 42 30 46 26 M36 42 C50 38 60 46 54 52" stroke="#b2ebf2" stroke-width="3"/>`,
    moonArrow: `<path d="M38 4 C24 6 14 16 14 28 C14 40 24 48 36 48 C28 44 22 36 22 28 C22 18 30 10 38 4 Z" fill="#fff3c4"/>
        <path d="M4 60 L60 8" stroke="#e3f2fd" stroke-width="5"/><path d="M4 60 L60 8" stroke="#ffffff" stroke-width="2"/>`,
    noReturn: `<path d="M6 50 L22 34" stroke-width="4"/><path d="M6 50 L22 34" stroke="#a1887f" stroke-width="2"/><circle cx="26" cy="30" r="6" fill="#ef9a9a"/>
        <path d="M30 26 C38 18 46 22 44 30 C42 38 50 40 56 32" stroke="#ffd54f" stroke-width="3" stroke-dasharray="4 3"/><circle cx="56" cy="32" r="5" fill="#ef9a9a"/><circle cx="44" cy="52" r="5" fill="#ef9a9a"/><path d="M56 36 C56 44 52 50 46 52" stroke="#ffd54f" stroke-width="3" stroke-dasharray="4 3"/>`,
    // ---- 刺客（rogue.js）----
    // 大招「斬首」：兩把交叉的彎刀
    behead: `${[[-1, '#cfd8dc'], [1, '#eceff1']].map(([s, c]) => `<g transform="translate(32 32) scale(${s} 1)"><path d="M-22 22 C-10 4 4 -10 22 -22 C10 -2 -2 10 -16 26 Z" fill="${c}"/><path d="M-16 26 L-24 18" stroke-width="5"/><path d="M-16 26 L-24 18" stroke="#5d4037" stroke-width="2.5"/></g>`).join('')}
        <path d="M26 30 L38 34" stroke="#ffc400" stroke-width="3"/>`,
    // 流派
    assassination: `<circle cx="32" cy="32" r="24" stroke="#ffc400" stroke-width="4"/><circle cx="32" cy="32" r="12" stroke="#ffc400" stroke-width="3"/><path d="M32 4 L32 18 M32 46 L32 60 M4 32 L18 32 M46 32 L60 32" stroke="#ffc400" stroke-width="3.5"/>
        <circle cx="32" cy="32" r="3.5" fill="#ffc400" stroke="none"/>`,
    // 刺客頭上「伏擊備好了」：一把刃朝下的金匕首、旁邊一顆閃光（下一把射向目標的飛刀 ×4）
    ambush: `<path d="M25 24 L39 24 L32 58 Z" fill="#ffd740"/><path d="M32 27 L32 50" stroke="#fff8e1" stroke-width="2.5"/>
        <path d="M18 22 L46 22" stroke-width="9"/><path d="M18 22 L46 22" stroke="#8d6e63" stroke-width="4.5"/>
        <path d="M32 6 L32 18" stroke-width="9"/><path d="M32 6 L32 18" stroke="#5d4037" stroke-width="4.5"/>
        <path d="${starPath(50, 40, 9, 3, 4)}" fill="#fff8e1" stroke-width="2.5"/>`,
    venomschool: `<path d="M24 6 L40 6 L40 18 C50 24 54 34 50 44 C46 54 38 58 32 58 C26 58 18 54 14 44 C10 34 14 24 24 18 Z" fill="#7cb342"/><path d="M24 6 L40 6" stroke-width="5"/>
        <circle cx="32" cy="36" r="8" fill="#f1f8e9" stroke-width="2.5"/><path d="M28 44 L36 44" stroke="#f1f8e9" stroke-width="4"/><circle cx="29" cy="35" r="2" fill="#1b1424" stroke="none"/><circle cx="35" cy="35" r="2" fill="#1b1424" stroke="none"/>${shine(22, 30, 3, 6, 20)}`,
    smoke: `<path d="M10 44 C2 44 2 30 12 30 C12 18 28 14 34 22 C40 14 56 18 54 30 C62 32 62 44 54 44 Z" fill="#90a4ae"/><path d="M18 52 C26 48 38 56 46 52" stroke="#cfd8dc" stroke-width="3.5"/>
        <path d="M22 36 C26 32 32 34 34 38" stroke="#eceff1" stroke-width="3"/>`,
    intel: `<path d="M12 8 L44 8 L52 16 L52 58 L12 58 Z" fill="#fff3e0"/><path d="M44 8 L44 16 L52 16" fill="#ffe0b2"/><path d="M18 22 L44 22 M18 30 L44 30 M18 38 L34 38" stroke="#8d6e63" stroke-width="2.5"/>
        <circle cx="40" cy="46" r="8" fill="none" stroke="#ffc400" stroke-width="3"/><path d="M46 52 L54 60" stroke="#ffc400" stroke-width="4"/>`,
    // 暗殺
    critChance: `<path d="M14 54 L44 24" stroke-width="5"/><path d="M14 54 L44 24" stroke="#8d6e63" stroke-width="2.5"/><path d="M44 24 L56 8 L52 28 Z" fill="#eceff1" stroke-width="2.5"/>
        <path d="${starPath(20, 20, 10, 4, 4)}" fill="#ffd740" stroke-width="2.5"/>`,
    critDamage: `<path d="M8 56 L36 28" stroke-width="5"/><path d="M8 56 L36 28" stroke="#8d6e63" stroke-width="2.5"/><path d="M36 28 L52 8 L46 32 Z" fill="#eceff1" stroke-width="2.5"/>
        <path d="M44 40 C44 46 48 50 48 54 C48 58 44 60 44 60 C44 60 40 58 40 54 C40 50 44 46 44 40 Z" fill="#ff8f00" stroke-width="2"/><path d="M54 36 C54 40 57 43 57 46 C57 49 54 50 54 50 C54 50 51 49 51 46 C51 43 54 40 54 36 Z" fill="#ff8f00" stroke-width="2"/>`,
    executeUp: `<path d="M20 8 L20 60" stroke-width="5"/><path d="M20 8 L20 60" stroke="#6d4c41" stroke-width="2.5"/><path d="M20 10 C36 6 52 12 54 26 C44 22 32 24 20 30 Z" fill="#b0bec5"/>
        <rect x="34" y="44" width="22" height="8" rx="2" fill="#ffca28"/><rect x="34" y="44" width="6" height="8" rx="2" fill="#8d5a00" stroke="none"/>`,
    ambushPower: `<path d="M8 48 C16 30 48 30 56 48 Z" fill="#311b92"/><path d="M20 42 L26 38 M44 42 L38 38" stroke="#ffd740" stroke-width="3.5"/>
        <path d="M44 6 L28 30" stroke-width="5"/><path d="M44 6 L28 30" stroke="#eceff1" stroke-width="2.5"/>${duoStroke('M52 18 L52 30 M46 24 L58 24', '#ffd54f', 2.5)}`,
    // 劇毒
    poisonStacks: `${[[20, 46], [32, 30], [44, 46]].map(([x, y]) => `<path d="M${x} ${y - 14} C${x + 6} ${y - 4} ${x + 10} ${y} ${x + 10} ${y + 5} C${x + 10} ${y + 11} ${x + 5} ${y + 14} ${x} ${y + 14} C${x - 5} ${y + 14} ${x - 10} ${y + 11} ${x - 10} ${y + 5} C${x - 10} ${y} ${x - 6} ${y - 4} ${x} ${y - 14} Z" fill="#7cb342"/>`).join('')}`,
    poisonPower: `<path d="M24 6 L40 6 L40 18 C50 24 54 34 50 44 C46 54 38 58 32 58 C26 58 18 54 14 44 C10 34 14 24 24 18 Z" fill="#558b2f"/><path d="M24 6 L40 6" stroke-width="5"/>
        ${[[24, 40], [36, 46], [38, 32]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#c5e1a5" stroke-width="2"/>`).join('')}${duoStroke('M54 22 L54 8 M49 13 L54 8 L59 13', '#ffd54f', 2.5)}`,
    poisonSpread: `<circle cx="32" cy="32" r="10" fill="#7cb342"/>${[0, 1, 2, 3, 4, 5].map(i => { const a = i * Math.PI / 3; return `<circle cx="${(32 + Math.cos(a) * 22).toFixed(1)}" cy="${(32 + Math.sin(a) * 22).toFixed(1)}" r="5" fill="#9ccc65" stroke-width="2"/><path d="M${(32 + Math.cos(a) * 12).toFixed(1)} ${(32 + Math.sin(a) * 12).toFixed(1)} L${(32 + Math.cos(a) * 17).toFixed(1)} ${(32 + Math.sin(a) * 17).toFixed(1)}" stroke="#c5e1a5" stroke-width="2.5"/>`; }).join('')}`,
    poisonSlow: `<ellipse cx="32" cy="36" rx="18" ry="14" fill="#aed581"/><path d="M24 34 L28 34 M36 34 L40 34" stroke-width="2.5"/><path d="M26 42 C30 40 34 44 38 42" stroke-width="2.5"/>
        ${[[12, 18], [52, 18], [32, 10]].map(([x, y]) => `<path d="M${x - 5} ${y} L${x + 5} ${y} M${x} ${y - 5} L${x} ${y + 5}" stroke="#4fc3f7" stroke-width="2.5"/>`).join('')}`,
    // 影
    shadowCap: `${[[16, 0.75, 0.55], [48, 0.75, 0.55], [32, 1, 1]].map(([x, s, o]) => `<g transform="translate(${x} 36) scale(${s})" opacity="${o}"><circle cx="0" cy="-14" r="9" fill="#5e35b1"/><path d="M-12 22 L-12 0 C-12 -6 12 -6 12 0 L12 22 Z" fill="#5e35b1"/><path d="M-4 -15 L-1 -13 M4 -15 L1 -13" stroke="#ffd740" stroke-width="2"/></g>`).join('')}`,
    shadowTime: `<circle cx="24" cy="24" r="9" fill="#5e35b1"/><path d="M12 58 L12 38 C12 32 36 32 36 38 L36 58 Z" fill="#5e35b1"/>
        <circle cx="46" cy="44" r="14" fill="#fff3e0"/><path d="M46 36 L46 44 L52 48" stroke-width="3"/>`,
    shadowPower: `<circle cx="26" cy="18" r="9" fill="#4527a0"/><path d="M14 58 L14 34 C14 28 38 28 38 34 L38 58 Z" fill="#4527a0"/><path d="M40 40 L56 14" stroke-width="5"/><path d="M40 40 L56 14" stroke="#b39ddb" stroke-width="2.5"/>
        ${duoStroke('M54 56 L54 44 M49 49 L54 44 L59 49', '#ffd54f', 2.5)}`,
    shadowStrike: `<circle cx="20" cy="20" r="8" fill="#4527a0"/><path d="M10 54 L10 34 C10 28 30 28 30 34 L30 54 Z" fill="#4527a0"/>${[0, 1, 2].map(i => `<path d="M${34 + i * 7} ${16 + i * 4} L${44 + i * 7} ${40 + i * 4}" stroke="#ffd740" stroke-width="3.5"/>`).join('')}`,
    // 煙霧
    smokeBomb: `<circle cx="28" cy="40" r="16" fill="#37474f"/><path d="M28 24 L32 12" stroke-width="4"/><path d="M32 12 L38 8" stroke="#ffd54f" stroke-width="3"/>
        <path d="M44 18 C40 12 48 6 52 12 C58 10 60 18 56 22" fill="#cfd8dc"/>${shine(22, 34, 4, 3)}`,
    dodge: `<circle cx="20" cy="20" r="8" fill="#b0bec5" opacity="0.5"/><path d="M10 52 L10 34 C10 28 30 28 30 34 L30 52 Z" fill="#b0bec5" opacity="0.5"/><circle cx="40" cy="20" r="8" fill="#78909c"/><path d="M30 52 L30 34 C30 28 50 28 50 34 L50 52 Z" fill="#78909c"/>
        <path d="M2 40 L22 40" stroke="#e53935" stroke-width="3"/><path d="M22 40 L16 36 M22 40 L16 44" stroke="#e53935" stroke-width="3"/>`,
    quickHide: `<circle cx="26" cy="22" r="9" fill="#5e35b1" opacity="0.6"/><path d="M14 58 L14 38 C14 32 38 32 38 38 L38 58 Z" fill="#5e35b1" opacity="0.6"/>${boltAt(48, 30)}`,
    longHide: `<path d="M8 40 C2 40 2 28 12 28 C12 16 28 12 34 20 C40 12 56 16 54 28 C62 30 62 40 54 40 Z" fill="#78909c"/><circle cx="32" cy="48" r="12" fill="#fff3e0"/><path d="M32 40 L32 48 L38 52" stroke-width="3"/>`,
    // 情報
    bounty: `<path d="M10 6 L54 6 L54 58 L10 58 Z" fill="#ffe0b2"/><path d="M18 14 L46 14" stroke="#8d6e63" stroke-width="3"/><circle cx="32" cy="32" r="10" fill="#bcaaa4"/><path d="M26 30 L30 32 M38 30 L34 32" stroke-width="2"/>
        <path d="M18 48 L40 48" stroke="#ffc400" stroke-width="4"/><circle cx="50" cy="50" r="9" fill="#ffd54f" stroke-width="2.5"/><circle cx="50" cy="50" r="4.5" stroke="#e0a82e" stroke-width="2"/>`,
    earlyMark: `<circle cx="32" cy="34" r="22" fill="#eceff1"/><circle cx="32" cy="34" r="12" fill="#5d4037"/><circle cx="32" cy="34" r="5" fill="#1b1424" stroke="none"/>${shine(26, 28, 3, 2)}
        <path d="M8 34 C14 22 22 16 32 12 C42 16 50 22 56 34" stroke-width="3"/>`,
    trashLoot: `<path d="M18 26 C8 34 10 54 24 56 L40 56 C54 54 56 34 46 26 Z" fill="#8d6e63"/><path d="M22 26 L42 26 L38 18 L26 18 Z" fill="#6d4c41"/>
        <circle cx="32" cy="42" r="7" fill="#ffd54f" stroke-width="2.5"/><path d="M48 10 L58 4 M50 18 L60 16" stroke="#ffd54f" stroke-width="3"/>`,
    spoils: `<path d="M8 30 L56 30 L52 56 L12 56 Z" fill="#8d6e63"/><path d="M8 30 L14 18 L50 18 L56 30" fill="#a1887f"/>
        <path d="M32 50 C24 44 20 40 22 36 C24 32 30 32 32 36 C34 32 40 32 42 36 C44 40 40 44 32 50 Z" fill="#e53935" stroke-width="2"/>`,
    // 傳說
    oldMan: `<path d="M14 58 L22 22 L32 8 L42 22 L50 58 Z" fill="#37474f"/><path d="M24 26 C28 32 36 32 40 26" fill="#cfd8dc"/><path d="M26 34 C28 46 36 46 38 34" fill="#eceff1"/>
        <path d="M28 22 L30 24 M36 22 L34 24" stroke="#ffd54f" stroke-width="2.5"/><path d="M8 50 C14 44 20 46 22 52" stroke="#b39ddb" stroke-width="3"/>`,
    pillowDagger: `<path d="M6 40 C6 30 14 26 32 26 C50 26 58 30 58 40 C58 50 50 54 32 54 C14 54 6 50 6 40 Z" fill="#e1bee7"/><path d="M14 40 C24 36 40 36 50 40" stroke="#ce93d8" stroke-width="2.5"/>
        <path d="M34 8 L34 36" stroke-width="5"/><path d="M34 8 L34 36" stroke="#eceff1" stroke-width="2.5"/><path d="M28 10 L40 10" stroke-width="4"/><path d="M28 10 L40 10" stroke="#ffd54f" stroke-width="2"/>`,
    fidai: `<path d="M32 6 L56 18 L50 50 L32 60 L14 50 L8 18 Z" fill="#212121"/><path d="M20 28 L28 32 M44 28 L36 32" stroke="#ffd740" stroke-width="3.5"/><path d="M8 18 L32 6 L56 18 L32 22 Z" fill="#424242"/>
        <path d="M2 58 L14 46 M62 58 L50 46" stroke="#b39ddb" stroke-width="3"/>`,
    // ---- 武僧（monk.js）----
    // 大招「十八羅漢陣」：一圈金色小人
    arhats: `<circle cx="32" cy="32" r="22" stroke="#ffd54f" stroke-width="3" stroke-dasharray="3 4"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * Math.PI / 4, x = 32 + Math.cos(a) * 22, y = 32 + Math.sin(a) * 22; return `<circle cx="${x.toFixed(1)}" cy="${(y - 3).toFixed(1)}" r="3.5" fill="#ffcc80" stroke-width="2"/><path d="M${(x - 4).toFixed(1)} ${(y + 5).toFixed(1)} L${(x + 4).toFixed(1)} ${(y + 5).toFixed(1)} L${x.toFixed(1)} ${(y - 1).toFixed(1)} Z" fill="#ffa726" stroke-width="2"/>`; }).join('')}
        <circle cx="32" cy="32" r="6" fill="#ffe082" stroke-width="2.5"/>`,
    // 流派（七十二藝五類）
    external: `<path d="M16 26 C16 18 22 14 28 14 L44 14 C50 14 54 18 54 24 L54 40 C54 50 46 56 36 56 L26 56 C18 56 14 50 14 42 Z" fill="#ffcc80"/>
        <path d="M24 14 L24 30 M34 14 L34 30 M44 14 L44 30" stroke-width="3"/><path d="M14 36 C20 36 24 32 24 28" stroke-width="3"/>${[0, 1, 2].map(i => `<path d="M${6 - i} ${18 + i * 12} L${12 - i} ${18 + i * 12}" stroke="#ffab91" stroke-width="3"/>`).join('')}`,
    hardstyle: `<path d="M32 6 C20 6 12 14 12 30 C12 46 22 58 32 58 C42 58 52 46 52 30 C52 14 44 6 32 6 Z" fill="#a1887f"/><path d="M20 22 L44 22 M18 32 L46 32 M20 42 L44 42" stroke="#6d4c41" stroke-width="3"/>${shine(22, 16, 4, 2.5)}`,
    lightfoot: `<path d="M10 46 C18 40 26 42 30 50" stroke="#b2ebf2" stroke-width="3"/><path d="M30 34 C38 28 46 30 50 38" stroke="#b2ebf2" stroke-width="3"/>
        <path d="M34 48 L48 48 L52 54 L30 54 Z" fill="#8d6e63"/><path d="M48 18 C52 10 60 10 62 16 C56 16 54 18 52 24 Z" fill="#eceff1"/><path d="M4 22 L16 22 M8 30 L18 30" stroke="#b2ebf2" stroke-width="3"/>`,
    internal: `<circle cx="32" cy="32" r="24" fill="#fff8e1"/><path d="M32 8 C44 8 44 32 32 32 C20 32 20 56 32 56 C18 56 8 46 8 32 C8 18 18 8 32 8 Z" fill="#3e2723"/>
        <circle cx="32" cy="20" r="4" fill="#fff8e1" stroke="none"/><circle cx="32" cy="44" r="4" fill="#3e2723" stroke="none"/><circle cx="32" cy="32" r="24" fill="none" stroke-width="3.5"/>`,
    qigong: `<path d="M6 32 C14 18 30 16 40 24" stroke="#80deea" stroke-width="7"/><path d="M6 32 C14 46 30 48 40 40" stroke="#80deea" stroke-width="7"/><circle cx="46" cy="32" r="12" fill="#e0f7fa"/><circle cx="46" cy="32" r="6" fill="#80deea" stroke="none"/>`,
    // 外功
    punchPower: `<path d="M12 24 C12 16 18 12 24 12 L40 12 C46 12 50 16 50 22 L50 38 C50 48 42 54 32 54 L22 54 C14 54 10 48 10 40 Z" fill="#ffcc80"/><path d="M20 12 L20 28 M30 12 L30 28 M40 12 L40 28" stroke-width="3"/>
        <path d="M14 38 C20 40 34 40 40 36" stroke="#8d6e63" stroke-width="3"/>${duoStroke('M56 40 L56 26 M51 31 L56 26 L61 31', '#ffd54f', 2.5)}`,
    comboCap: `<path d="M8 44 L20 32 L32 40 L44 22 L56 30" stroke-width="7"/><path d="M8 44 L20 32 L32 40 L44 22 L56 30" stroke="#ffab91" stroke-width="3.5"/><path d="M46 10 L58 10 L58 22" stroke="#ffd54f" stroke-width="4"/>
        <path d="M6 54 L58 54" stroke="#ffd54f" stroke-width="3" stroke-dasharray="4 4"/>`,
    comboGain: `${[12, 26, 40].map((x, i) => `<rect x="${x}" y="${44 - i * 12}" width="10" height="${12 + i * 12}" rx="2" fill="${['#ffcc80', '#ffab91', '#ff7043'][i]}"/>`).join('')}${duoStroke('M54 50 L54 16 M48 22 L54 16 L60 22', '#ffd54f', 3)}`,
    flurry: `${[[16, 20], [30, 32], [44, 44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="#ffcc80"/><path d="M${x - 4} ${y - 6} L${x - 4} ${y + 2} M${x + 2} ${y - 6} L${x + 2} ${y + 2}" stroke-width="2"/>`).join('')}
        <path d="M50 8 L58 4 M54 14 L62 12" stroke="#ffab91" stroke-width="3"/>`,
    // 硬功
    // 銅色的上身：胸肌、腹肌
    ironBody: `<path d="M8 20 C14 12 22 10 32 12 C42 10 50 12 56 20 L50 40 C46 52 40 58 32 58 C24 58 18 52 14 40 Z" fill="#c58b4f"/>
        <path d="M18 24 C22 30 28 30 31 26 M46 24 C42 30 36 30 33 26 M26 38 L38 38 M26 46 L38 46 M32 32 L32 52" stroke="#7b4a1e" stroke-width="2.5"/>${shine(20, 20, 4, 2.5)}`,
    counter: `<path d="M8 40 L28 40" stroke="#e53935" stroke-width="4"/><path d="M28 40 L22 34 M28 40 L22 46" stroke="#e53935" stroke-width="4"/>
        <path d="M34 20 C34 14 38 10 44 10 L52 10 C56 10 58 14 58 18 L58 30 C58 38 52 42 46 42 L40 42 C36 42 34 38 34 34 Z" fill="#ffcc80"/>${duoStroke('M40 52 L20 52 M26 46 L20 52 L26 58', '#ffd54f', 3)}`,
    steadfast: `<path d="M8 58 L56 58 L44 24 L32 8 L20 24 Z" fill="#8d6e63"/><path d="M20 24 L32 32 L44 24" stroke="#6d4c41" stroke-width="3"/><path d="M32 8 L32 32" stroke="#a1887f" stroke-width="2"/>${shine(26, 20, 3, 2)}`,
    stoneSkin: `<path d="M32 58 C14 46 6 34 12 22 C18 10 28 12 32 20 C36 12 46 10 52 22 C58 34 50 46 32 58 Z" fill="#9e9e9e"/><path d="M20 28 L28 34 L24 42 M40 26 L36 36 L44 40" stroke="#616161" stroke-width="2.5"/>`,
    // 輕功
    blinkRange: `<circle cx="14" cy="40" r="7" fill="#b2ebf2" opacity="0.6"/><path d="M22 40 L44 40" stroke="#b2ebf2" stroke-width="3" stroke-dasharray="4 4"/><circle cx="50" cy="40" r="8" fill="#ffcc80"/>
        ${duoStroke('M22 22 L54 22 M48 16 L54 22 L48 28', '#ffd54f', 3)}`,
    evade: `<path d="M24 58 L24 34 C24 26 30 22 36 22 C42 22 46 26 46 34 L46 58" fill="#ffcc80"/><circle cx="36" cy="14" r="7" fill="#ffcc80"/><path d="M4 30 L22 36" stroke="#e53935" stroke-width="3"/><path d="M22 36 L14 30 M22 36 L14 40" stroke="#e53935" stroke-width="3"/>
        <path d="M50 30 C56 34 56 42 50 46" stroke="#b2ebf2" stroke-width="3"/>`,
    swift: `<path d="M24 14 L36 14 L36 38 L50 44 C56 46 56 54 50 54 L24 54 Z" fill="#8d6e63"/><path d="M24 44 L52 44" stroke-width="3"/><path d="M4 26 L16 26 M2 36 L14 36 M6 46 L18 46" stroke="#b2ebf2" stroke-width="3.5"/>`,
    quickStep: `${[0.3, 0.55, 1].map((o, i) => `<g opacity="${o}"><circle cx="${14 + i * 18}" cy="22" r="6" fill="#ffcc80"/><path d="M${8 + i * 18} 52 L${8 + i * 18} 34 C${8 + i * 18} 30 ${20 + i * 18} 30 ${20 + i * 18} 34 L${20 + i * 18} 52 Z" fill="#ffa726"/></g>`).join('')}`,
    // 內功
    zenHeal: `<path d="M12 50 C12 40 22 36 32 36 C42 36 52 40 52 50 Z" fill="#ffa726"/><circle cx="32" cy="24" r="10" fill="#ffcc80"/><path d="M28 24 L30 24 M34 24 L36 24" stroke-width="2"/>${duoStroke('M52 8 L52 22 M45 15 L59 15', '#81c784', 3)}`,
    zenCharge: `<circle cx="32" cy="32" r="22" stroke="#ffd54f" stroke-width="5" stroke-dasharray="100 40"/><path d="M12 48 C12 40 20 36 32 36 C44 36 52 40 52 48 Z" fill="#ffa726"/><circle cx="32" cy="24" r="8" fill="#ffcc80"/>`,
    zenFast: `<path d="M12 52 C12 42 22 38 32 38 C42 38 52 42 52 52 Z" fill="#ffa726"/><circle cx="32" cy="26" r="9" fill="#ffcc80"/>${boltAt(52, 18)}`,
    zenPulse: `${[24, 16].map(r => `<circle cx="32" cy="38" r="${r}" stroke="#ffd54f" stroke-width="3" opacity="${r === 24 ? 0.5 : 0.9}"/>`).join('')}<path d="M22 50 C22 42 26 38 32 38 C38 38 42 42 42 50 Z" fill="#ffa726"/><circle cx="32" cy="30" r="6" fill="#ffcc80"/>`,
    // 氣功
    qiPower: `<circle cx="32" cy="32" r="16" fill="#80deea"/><circle cx="32" cy="32" r="8" fill="#e0f7fa"/>${[0, 1, 2, 3, 4, 5].map(i => { const a = i * Math.PI / 3; return `<path d="M${(32 + Math.cos(a) * 20).toFixed(1)} ${(32 + Math.sin(a) * 20).toFixed(1)} L${(32 + Math.cos(a) * 28).toFixed(1)} ${(32 + Math.sin(a) * 28).toFixed(1)}" stroke="#80deea" stroke-width="3"/>`; }).join('')}`,
    qiCount: `${[20, 44].map(y => `<path d="M6 ${y} L44 ${y}" stroke="#80deea" stroke-width="8"/><path d="M6 ${y} L44 ${y}" stroke="#e0f7fa" stroke-width="3"/><circle cx="50" cy="${y}" r="7" fill="#80deea" stroke-width="2.5"/>`).join('')}`,
    qiWidth: `<path d="M6 32 L46 32" stroke="#80deea" stroke-width="22"/><path d="M6 32 L46 32" stroke="#e0f7fa" stroke-width="8"/><path d="M52 18 L60 32 L52 46" stroke-width="4"/><path d="M52 18 L60 32 L52 46" stroke="#ffd54f" stroke-width="2"/>`,
    qiFreq: `<circle cx="22" cy="32" r="14" fill="#ffcc80"/><path d="M38 32 L56 32" stroke="#80deea" stroke-width="7"/><circle cx="58" cy="32" r="4" fill="#e0f7fa" stroke-width="2"/>${boltAt(22, 32)}`,
    // 傳說
    bodhidharma: `<rect x="6" y="6" width="52" height="52" rx="4" fill="#8d6e63"/><path d="M6 20 L58 20 M6 34 L58 34 M6 48 L58 48 M22 6 L22 20 M42 20 L42 34 M22 34 L22 48 M42 48 L42 58" stroke="#6d4c41" stroke-width="2.5"/>
        <path d="M18 54 C18 44 24 40 32 40 C40 40 46 44 46 54 Z" fill="#ffa726"/><circle cx="32" cy="32" r="8" fill="#ffcc80"/><path d="${starPath(32, 14, 6, 2.2, 4)}" fill="#ffe082" stroke-width="2"/>`,
    reedCrossing: `<path d="M2 48 C16 42 30 54 44 48 C52 44 58 46 62 48 L62 62 L2 62 Z" fill="#4fc3f7"/><path d="M14 44 L50 40" stroke-width="5"/><path d="M14 44 L50 40" stroke="#aed581" stroke-width="2.5"/>
        <path d="M30 40 L30 26 C30 20 38 20 38 26 L38 40" fill="#ffa726"/><circle cx="34" cy="16" r="6" fill="#ffcc80"/>`,
    thirteenMonks: `${[[10, 40], [22, 34], [34, 40], [46, 34], [56, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y - 10}" r="4.5" fill="#ffcc80" stroke-width="2"/><path d="M${x - 5} ${y + 10} L${x - 5} ${y} C${x - 5} ${y - 4} ${x + 5} ${y - 4} ${x + 5} ${y} L${x + 5} ${y + 10} Z" fill="#ffa726" stroke-width="2"/>`).join('')}
        <path d="M4 54 L60 46" stroke-width="4"/><path d="M4 54 L60 46" stroke="#8d6e63" stroke-width="2"/>`,
    // 戰士的大招：兩支交叉擲出的標槍
    javelin: `<path d="M8 56 L50 14" stroke-width="5"/><path d="M8 56 L50 14" stroke="#8d6e63" stroke-width="2.5"/><path d="M50 14 L58 6 L56 18 L46 18 Z" fill="#cfd8dc"/>
        <path d="M18 60 L56 30" stroke-width="5"/><path d="M18 60 L56 30" stroke="#a1887f" stroke-width="2.5"/><path d="M56 30 L62 24 L60 34 L52 34 Z" fill="#eceff1"/>
        <path d="M4 40 L14 40 M2 48 L10 48" stroke="#ffcc80" stroke-width="3"/>`,
    // 戰士的狂怒：怒吼的橘色獸頭盔
    rage: `<path d="M12 22 C6 12 8 4 14 2 C14 10 18 16 22 20 Z M52 22 C58 12 56 4 50 2 C50 10 46 16 42 20 Z" fill="#f1ead6"/>
        <path d="M32 12 C18 12 12 22 12 34 C12 46 20 56 32 58 C44 56 52 46 52 34 C52 22 46 12 32 12 Z" fill="#ff6d00"/>
        <path d="M18 30 L28 34 M46 30 L36 34" stroke-width="4"/><path d="M22 44 C26 52 38 52 42 44 L38 48 L32 44 L26 48 Z" fill="#1b1424"/>${shine(22, 20, 4, 2.5)}`,
    clock: `<circle cx="32" cy="35" r="23" fill="#f1ead6"/><rect x="26" y="4" width="12" height="7" rx="2" fill="#b0bec5"/><path d="M32 11 L32 12" stroke-width="3"/>
        <path d="M32 35 L32 20 M32 35 L42 40" stroke-width="4"/><circle cx="32" cy="35" r="2.5" fill="#1b1424" stroke="none"/>${shine(21, 24, 4, 2.5)}`,
    trophy: `<path d="M18 10 L46 10 L46 24 C46 34 40 40 32 40 C24 40 18 34 18 24 Z" fill="#ffd54f"/>
        <path d="M18 15 C8 15 8 29 19 30 M46 15 C56 15 56 29 45 30" stroke-width="4"/>
        <rect x="27" y="40" width="10" height="8" fill="#e0a82e"/><rect x="18" y="48" width="28" height="8" rx="2" fill="#e0a82e"/>${shine(25, 18, 3, 6, 0)}`,
    crystal: `<path d="M32 6 L50 24 L32 58 L14 24 Z" fill="#b388ff"/><path d="M14 24 L50 24 M32 6 L26 24 L32 58 M32 6 L38 24 L32 58" stroke-width="2.5"/>${shine(24, 18, 3, 6, 30)}`,
    battery: `<rect x="4" y="14" width="50" height="36" rx="6" fill="#f1ead6"/><rect x="54" y="24" width="7" height="16" rx="2" fill="#f1ead6"/>
        <rect x="10" y="20" width="12" height="24" rx="2" fill="#7cb342" stroke-width="2.5"/><rect x="25" y="20" width="12" height="24" rx="2" fill="#7cb342" stroke-width="2.5"/>`,
    fullscreen: duoStroke('M9 23 L9 9 L23 9 M41 9 L55 9 L55 23 M55 41 L55 55 L41 55 M23 55 L9 55 L9 41', '#f1ead6', 5),
    install: duoStroke('M10 40 L10 54 L54 54 L54 40', '#ffd54f', 5) + duoStroke('M32 8 L32 38 M20 27 L32 39 L44 27', '#f1ead6', 5),
    podium: `<rect x="23" y="22" width="18" height="34" fill="#ffd54f"/><rect x="6" y="34" width="17" height="22" fill="#cfd8dc"/><rect x="41" y="40" width="17" height="16" fill="#d7965a"/>
        <path d="${starPath(32, 11, 8, 3.5, 5)}" fill="#ffd54f" stroke-width="3"/>${shine(28, 28, 2, 4, 0)}`,
    fork: duoStroke('M32 58 L32 34 L14 12 M32 34 L50 12 M14 24 L14 12 L26 12 M50 24 L50 12 L38 12', '#FFE082', 5),
    share: duoStroke('M24 26 L16 26 L16 56 L48 56 L48 26 L40 26', '#f1ead6', 4) + duoStroke('M32 40 L32 8 M22 18 L32 8 L42 18', '#4fc3f7', 4),
    addHome: `<rect x="9" y="9" width="46" height="46" rx="11" fill="#f1ead6"/><path d="M32 20 L32 44 M20 32 L44 32" stroke="#37474f" stroke-width="6"/>`,
    menuDots: `<circle cx="32" cy="13" r="6" fill="#f1ead6"/><circle cx="32" cy="32" r="6" fill="#f1ead6"/><circle cx="32" cy="51" r="6" fill="#f1ead6"/>`,
    browser: `<circle cx="32" cy="32" r="24" fill="#4fc3f7"/><path d="M8 32 L56 32 M32 8 C20 20 20 44 32 56 M32 8 C44 20 44 44 32 56" stroke-width="3"/>`,
    gear: `<path d="${starPath(32, 32, 26, 20, 8)}" fill="#b0bec5"/><circle cx="32" cy="32" r="8" fill="#37474f"/>`,
    music: duoStroke('M25 46 L25 16 M51 40 L51 10', '#f1ead6', 4) + `<path d="M23 10 L53 3 L53 15 L23 22 Z" fill="#f1ead6"/>
        <ellipse cx="17" cy="47" rx="10" ry="7.5" fill="#f1ead6" transform="rotate(-20 17 47)"/><ellipse cx="43" cy="41" rx="10" ry="7.5" fill="#f1ead6" transform="rotate(-20 43 41)"/>`,
    speaker: `<path d="M10 24 L22 24 L36 12 L36 52 L22 40 L10 40 Z" fill="#f1ead6"/>${duoStroke('M44 22 C49 27 49 37 44 42', '#f1ead6', 4)}${duoStroke('M50 15 C59 24 59 40 50 49', '#f1ead6', 4)}`,
    reroll: duoStroke('M48 26 C44 16 34 11 24 15 C17 18 13 24 13 31', '#8fd3ff') + `<path d="M50 12 L49 28 L36 23 Z" fill="#8fd3ff"/>` +
        duoStroke('M16 38 C20 48 30 53 40 49 C47 46 51 40 51 33', '#8fd3ff') + `<path d="M14 52 L15 36 L28 41 Z" fill="#8fd3ff"/>`,
    lock: `<path d="M20 28 L20 20 C20 12 25 8 32 8 C39 8 44 12 44 20 L44 28" stroke-width="10"/><path d="M20 28 L20 20 C20 12 25 8 32 8 C39 8 44 12 44 20 L44 28" stroke="#90a4ae" stroke-width="5"/>
        <rect x="13" y="27" width="38" height="29" rx="5" fill="#ffca28"/><circle cx="32" cy="39" r="4" fill="${ICON_OUTLINE}" stroke="none"/><path d="M32 41 L32 48" stroke-width="4"/>`,
    arrowUp: `<path d="M32 7 L55 32 L42 32 L42 57 L22 57 L22 32 L9 32 Z" fill="#9ccc65"/>${shine(30, 18, 3, 5, 0)}`,
    summon: `<circle cx="32" cy="32" r="25" fill="#7e57c2"/><circle cx="32" cy="32" r="17" stroke="#d1c4e9" stroke-width="2.5"/><path d="M32 20 L32 44 M20 32 L44 32" stroke-width="10"/><path d="M32 20 L32 44 M20 32 L44 32" stroke="#f3e5f5" stroke-width="5"/>`,
    home: `<path d="M8 32 L32 10 L56 32 L49 32 L49 55 L15 55 L15 32 Z" fill="#f1ead6"/><rect x="27" y="38" width="10" height="17" fill="#8d6e63"/>`,
    // 怨氣沸騰（一波拖太久，game.js 的 OVERTIME_*）：深紅火焰裡的怒目骷髏
    overtime: `<path d="M32 3 C36 11 41 11 43 5 C48 13 52 17 50 25 C55 23 59 29 57 36 L57 46 L7 46 L7 36 C5 29 9 23 14 25 C12 17 16 13 21 5 C23 11 28 11 32 3 Z" fill="#b71c1c"/>
        <path d="M32 13 C35 19 39 19 41 15 C44 21 46 27 45 34 L19 34 C18 27 20 21 23 15 C25 19 29 19 32 13 Z" fill="#ff1744" stroke="none"/>
        <path d="M32 24 C21 24 13 31 13 40 C13 46 16 50 21 52 L21 60 L43 60 L43 52 C48 50 51 46 51 40 C51 31 43 24 32 24 Z" fill="#ffcdd2"/>
        <path d="M18 36 L29 41 L28 47 L19 45 Z" fill="#ffd54f" stroke-width="3"/><path d="M46 36 L35 41 L36 47 L45 45 Z" fill="#ffd54f" stroke-width="3"/>
        <path d="M32 48 L29.5 53 L34.5 53 Z" fill="${ICON_OUTLINE}" stroke="none"/><path d="M27 60 L27 56 M32 60 L32 56 M37 60 L37 56" stroke-width="2.5"/>`,
    // ---- 首領、遺跡、戰鬥中的狀態 ----
    // 首領（首領來襲、最終決戰、首領血條、畫面邊的箭頭、打倒幾隻）：長角的紫骷髏
    boss: `<path d="M16 22 C8 18 4 8 8 2 C10 12 16 14 22 16 Z" fill="#8d6e63"/><path d="M48 22 C56 18 60 8 56 2 C54 12 48 14 42 16 Z" fill="#8d6e63"/>
        <path d="M32 12 C19 12 12 21 12 32 C12 40 16 45 21 47 L21 58 L43 58 L43 47 C48 45 52 40 52 32 C52 21 45 12 32 12 Z" fill="#b39ddb"/>
        <path d="M19 30 L29 34 L27 41 L19 39 Z" fill="#e040fb" stroke-width="3"/><path d="M45 30 L35 34 L37 41 L45 39 Z" fill="#e040fb" stroke-width="3"/>
        <path d="M32 42 L29 48 L35 48 Z" fill="${ICON_OUTLINE}" stroke="none"/><path d="M27 58 L27 53 M32 58 L32 53 M37 58 L37 53" stroke-width="2.5"/>`,
    // 招魂墓碑：冒綠火的墓碑
    tombstone: `<path d="M14 58 L14 24 C14 12 22 6 32 6 C42 6 50 12 50 24 L50 58 Z" fill="#90a4ae"/><path d="M8 58 L56 58" stroke-width="5"/>
        <path d="M32 18 L32 42 M24 26 L40 26" stroke="#607d8b" stroke-width="4"/>
        <path d="M52 30 C46 26 46 20 50 14 C50 20 56 22 56 28 C56 32 54 34 52 34 Z" fill="#69f0ae" stroke-width="2.5"/>${shine(22, 16, 3, 5, 20)}`,
    // 招魂反轉（打倒招魂墓碑、墓碑換邊替你招狼）：天藍的墓碑頂著一團天藍魂火，兩側一對翻轉箭頭
    tombClaim: `<path d="M18 60 L18 30 C18 20 24 15 32 15 C40 15 46 20 46 30 L46 60 Z" fill="#81d4fa"/><path d="M12 60 L52 60" stroke-width="5"/>
        <path d="M32 30 L32 50 M25 37 L39 37" stroke="#e1f5fe" stroke-width="4"/>
        <path d="M32 18 C25 14 24 8 28 2 C29 7 33 8 34 4 C39 9 39 15 32 18 Z" fill="#4fc3f7" stroke-width="2.5"/>
        <path d="M10 40 C4 30 6 20 12 15" stroke-width="7"/><path d="M10 40 C4 30 6 20 12 15" stroke="#e1f5fe" stroke-width="3"/><path d="M12 15 L4 16 L10 22 Z" fill="#e1f5fe" stroke-width="2"/>
        <path d="M54 24 C60 34 58 44 52 49" stroke-width="7"/><path d="M54 24 C60 34 58 44 52 49" stroke="#e1f5fe" stroke-width="3"/><path d="M52 49 L60 48 L54 42 Z" fill="#e1f5fe" stroke-width="2"/>${shine(25, 26, 3, 5, 20)}`,
    // 首領的護甲（打破才傷得到）：金色的圓盾，盾面一圈鉚釘
    bossArmor: `<circle cx="32" cy="32" r="26" fill="#ffd54f"/><circle cx="32" cy="32" r="17" fill="#ffb300" stroke-width="3"/>
        ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * Math.PI / 4; return `<circle cx="${(32 + Math.cos(a) * 21.5).toFixed(1)}" cy="${(32 + Math.sin(a) * 21.5).toFixed(1)}" r="1.8" fill="${ICON_OUTLINE}" stroke="none"/>`; }).join('')}
        <path d="M32 21 L35 29 L43 32 L35 35 L32 43 L29 35 L21 32 L29 29 Z" fill="#fff8e1" stroke-width="2.5"/>${shine(22, 20, 4, 2.5)}`,
    // 首領破防（護甲打光、暈眩、受傷加重）：裂成兩半的金盾，中間一道天藍裂光
    bossBreak: `<path d="M29 6 C16 8 7 19 7 32 C7 45 16 56 29 58 L25 44 L31 34 L24 24 Z" fill="#ffd54f"/>
        <path d="M35 6 C48 8 57 19 57 32 C57 45 48 56 35 58 L39 46 L33 36 L40 24 Z" fill="#ffd54f"/>
        <path d="M32 4 L27 22 L35 33 L28 46 L32 60" stroke="#80deea" stroke-width="4"/>
        ${[[12, 12], [54, 14], [50, 54]].map(([x, y]) => `<path d="${starPath(x, y, 6, 2.5, 4)}" fill="#e0f7fa" stroke-width="2"/>`).join('')}`,
    // 首領換階段（怒吼、變強、叫小怪）：紫色的三道爪痕上一個往上的箭頭
    bossPhase: duoStroke('M12 52 L26 14', '#ce93d8', 6) + duoStroke('M26 56 L40 18', '#ce93d8', 6) + duoStroke('M40 58 L52 26', '#ce93d8', 6)
        + `<path d="M48 4 L60 18 L53 18 L53 28 L43 28 L43 18 L36 18 Z" fill="#f3e5f5" stroke-width="2.5"/>`,
    // 職業玩法介紹（標題畫面、暫停選單打開職業介紹）：藍色圓牌上一個問號
    classGuide: `<circle cx="32" cy="32" r="26" fill="#42a5f5"/><circle cx="32" cy="32" r="19" fill="#90caf9" stroke="none"/>
        <path d="M24 25 C24 17 40 16 40 25 C40 31 32 31 32 38" stroke-width="10"/><path d="M24 25 C24 17 40 16 40 25 C40 31 32 31 32 38" stroke="#ffffff" stroke-width="5"/>
        <circle cx="32" cy="48" r="4.5" fill="#ffffff" stroke-width="3"/>${shine(20, 18, 4, 2.5)}`,
    // 地上的毒池：綠骷髏加交叉骨
    poisonPool: duoStroke('M12 48 L52 60 M52 48 L12 60', '#c5e1a5', 4) + `<path d="M32 6 C20 6 13 14 13 25 C13 32 16 36 21 39 L21 47 L43 47 L43 39 C48 36 51 32 51 25 C51 14 44 6 32 6 Z" fill="#9ccc65"/>
        <ellipse cx="25" cy="26" rx="5" ry="6" fill="${ICON_OUTLINE}" stroke="none"/><ellipse cx="39" cy="26" rx="5" ry="6" fill="${ICON_OUTLINE}" stroke="none"/><path d="M32 32 L29 38 L35 38 Z" fill="${ICON_OUTLINE}" stroke="none"/>`,
    // 精英詞綴（第一次出現的橫幅）：精英腳下的金圈，一邊分裂光球、一邊暴走的火
    eliteAffix: `<ellipse cx="32" cy="50" rx="26" ry="9" stroke-width="9"/><ellipse cx="32" cy="50" rx="26" ry="9" stroke="#ffd54f" stroke-width="4"/>
        <circle cx="19" cy="30" r="11" fill="#9ccc65"/>${shine(15, 26, 3, 2)}
        <path d="M44 46 C35 46 32 38 35 31 C37 26 41 24 41 16 C47 21 49 26 49 30 C51 28 52 25 51 21 C57 27 58 36 55 41 C53 44 49 46 44 46 Z" fill="#ff8a3d"/>`,
    // 波次事件「精英潮」：金色浪頭
    evEliteTide: `<path d="M4 54 L4 40 C10 40 12 30 20 24 C28 18 40 18 46 26 C40 26 36 30 38 36 C42 30 52 30 58 36 L60 54 Z" fill="#ffd54f"/>
        <path d="M10 46 C16 44 20 46 26 44 M34 48 C40 46 46 48 52 46" stroke="#e0a82e" stroke-width="3"/>${shine(26, 26, 5, 2.5, -20)}
        <circle cx="50" cy="14" r="3" fill="#fff59d" stroke-width="2.5"/><circle cx="58" cy="22" r="2" fill="#fff59d" stroke-width="2"/>`,
    // 遺跡「戰鼓祭壇」：紫色戰鼓與鼓棒
    altar: `<path d="M10 22 L10 48 C10 53 20 56 32 56 C44 56 54 53 54 48 L54 22" fill="#8e24aa"/>
        <ellipse cx="32" cy="22" rx="22" ry="8" fill="#f1ead6"/><path d="M14 32 L22 50 L32 32 L42 50 L50 32" stroke="#ffd54f" stroke-width="3"/>
        <path d="M18 2 L28 16 M46 2 L36 16" stroke-width="7"/><path d="M18 2 L28 16 M46 2 L36 16" stroke="#d7965a" stroke-width="3.5"/>`,
    // 護佑祭壇（主角受傷減半一陣子）：青色的六角護盾，中間一顆亮點
    altarWard: `<path d="M32 4 L56 18 L56 46 L32 60 L8 46 L8 18 Z" fill="#26c6da"/><path d="M32 14 L47 23 L47 41 L32 50 L17 41 L17 23 Z" fill="#b2ebf2" stroke-width="3"/>
        <path d="${starPath(32, 32, 9, 3.5, 4)}" fill="#ffffff" stroke-width="2"/>${shine(18, 20, 4, 2.5, -30)}`,
    // 遲滯祭壇（全場怪物變慢）：慢吞吞的蝸牛
    altarSlow: `<path d="M4 52 C4 44 12 42 20 42 L50 42 C56 42 60 46 60 52 Z" fill="#d7ccc8"/>
        <path d="M50 42 C50 36 52 30 54 26 M56 42 C57 36 60 32 62 30" stroke-width="3"/><circle cx="54" cy="25" r="3" fill="#d7ccc8" stroke-width="2.5"/><circle cx="61" cy="29" r="2.5" fill="#d7ccc8" stroke-width="2"/>
        <circle cx="30" cy="30" r="19" fill="#8bc34a"/><path d="M30 30 C30 26 36 26 36 31 C36 37 26 38 25 31 C24 23 36 20 41 27 C46 35 38 46 28 45" stroke="#33691e" stroke-width="3"/>${shine(20, 18, 4, 2.5)}`,
    // 遺跡「靈泉」：石盆裡的綠水，上面一滴
    spring: `<path d="M8 36 L56 36 L50 56 L14 56 Z" fill="#90a4ae"/><ellipse cx="32" cy="36" rx="24" ry="7" fill="#66bb6a"/><path d="M18 47 L46 47" stroke="#607d8b" stroke-width="2.5"/>
        <path d="M32 4 C26 12 22 17 22 22 C22 28 27 31 32 31 C37 31 42 28 42 22 C42 17 38 12 32 4 Z" fill="#a5d6a7"/>${shine(28, 20, 2.5, 4, 20)}`,
    // 遺跡「封印寶棺」：被鐵鍊綁住的寶箱（吸血鬼的不死流派是直立的棺材 coffin，別混）
    coffinRelic: `<path d="M6 30 L58 30 L54 56 L10 56 Z" fill="#a1887f"/><path d="M6 30 C6 16 18 10 32 10 C46 10 58 16 58 30 Z" fill="#8d6e63"/>
        <path d="M6 30 L58 30" stroke-width="4"/><path d="M8 14 L56 54 M56 14 L8 54" stroke-width="7"/><path d="M8 14 L56 54 M56 14 L8 54" stroke="#b0bec5" stroke-width="3"/>
        <rect x="24" y="24" width="16" height="16" rx="3" fill="#ffca28"/><circle cx="32" cy="31" r="2.5" fill="${ICON_OUTLINE}" stroke="none"/>`,
    // 大軍狂暴（新星、戰鼓祭壇給的狀態）：紫光裡的交叉雙劍
    armyFrenzy: `<circle cx="32" cy="32" r="26" fill="#7b1fa2"/>
        <path d="M14 14 L44 44 M50 14 L20 44" stroke-width="10"/><path d="M14 14 L44 44 M50 14 L20 44" stroke="#f1ead6" stroke-width="5"/>
        <path d="M40 48 L48 40 M24 48 L16 40" stroke-width="9"/><path d="M40 48 L48 40 M24 48 L16 40" stroke="#ffd54f" stroke-width="4"/>
        <path d="M46 46 L54 54 M18 46 L10 54" stroke-width="9"/><path d="M46 46 L54 54 M18 46 L10 54" stroke="#6d4c41" stroke-width="4"/>`,
    // 祝福（多一次三選一）：打開的書，上面一顆星
    draft: `<path d="M6 22 C16 18 26 20 32 26 C38 20 48 18 58 22 L58 54 C48 50 38 52 32 58 C26 52 16 50 6 54 Z" fill="#f1ead6"/><path d="M32 26 L32 58" stroke-width="3"/>
        <path d="M12 30 C18 28 22 29 26 31 M12 38 C18 36 22 37 26 39 M38 31 C42 29 46 28 52 30 M38 39 C42 37 46 36 52 38" stroke="#a1887f" stroke-width="2.5"/>
        <path d="${starPath(32, 11, 9, 4, 5)}" fill="#ffd54f" stroke-width="2.5"/>`,
    // 流派共鳴：兩個扣在一起的環
    resonance: `<circle cx="24" cy="32" r="15" stroke-width="9"/><circle cx="40" cy="32" r="15" stroke-width="9"/>
        <circle cx="24" cy="32" r="15" stroke="#80deea" stroke-width="4"/><circle cx="40" cy="32" r="15" stroke="#ce93d8" stroke-width="4"/>
        <path d="${starPath(32, 32, 9, 3.5, 4)}" fill="#fff59d" stroke-width="2"/>`,
    // 靈魂流派：環裡的靈魂（靈魂本身＝錢包是 soul）
    soulSchool: `<circle cx="32" cy="32" r="26" stroke-width="9"/><circle cx="32" cy="32" r="26" stroke="#80deea" stroke-width="4"/>
        <path d="M32 52 C23 52 19 44 23 37 C26 32 27 26 25 18 C32 22 35 28 35 33 C37 30 38 27 38 22 C45 29 46 38 43 44 C41 49 37 52 32 52 Z" fill="#62dbe2"/>`,
    // ---- 詛咒 ----
    // 詛咒本身（詛咒等級、詛咒按鈕）：紫色符印
    curse: `<circle cx="32" cy="32" r="25" fill="#6a1b9a"/><circle cx="32" cy="32" r="19" stroke="#ce93d8" stroke-width="2.5"/>
        <path d="${starPath(32, 33, 16, 6.5, 5)}" fill="#e1bee7" stroke-width="2.5"/><circle cx="32" cy="33" r="3" fill="#6a1b9a" stroke-width="2"/>`,
    // 兇暴（怪物血量）：長刺的綠皮怪
    curseBrutal: `<path d="${starPath(32, 33, 27, 19, 9)}" fill="#558b2f"/><circle cx="32" cy="33" r="15" fill="#9ccc65"/>
        <path d="M22 27 L30 31 M42 27 L34 31" stroke-width="3.5"/><circle cx="26.5" cy="34" r="2.5" fill="${ICON_OUTLINE}" stroke="none"/><circle cx="37.5" cy="34" r="2.5" fill="${ICON_OUTLINE}" stroke="none"/>
        <path d="M26 42 L38 42" stroke-width="3"/>`,
    // 暗殺令（刺客提早出現）：紅色標靶上插一把紫柄匕首
    curseAssassin: `<circle cx="30" cy="34" r="22" stroke-width="10"/><circle cx="30" cy="34" r="22" stroke="#e53935" stroke-width="5"/><circle cx="30" cy="34" r="8" fill="#e53935"/>
        <path d="M54 6 L60 12 L36 36 L30 30 Z" fill="#cfd8dc"/><path d="M28 32 L34 38" stroke-width="10"/><path d="M28 32 L34 38" stroke="#7e57c2" stroke-width="5"/>`,
    // 疾行（怪物移速）：紅色飛靴
    curseSwift: `<path d="M22 8 L40 8 L40 34 C40 38 44 40 50 42 C58 44 59 55 52 57 L22 57 C19 57 18 55 18 53 L18 12 C18 10 20 8 22 8 Z" fill="#c62828"/>
        <rect x="15" y="6" width="28" height="9" rx="3" fill="#ffd54f"/><path d="M18 49 L57 49" stroke-width="3"/>
        <path d="M18 22 C8 14 2 18 4 24 C0 27 2 33 8 33 C4 37 8 42 14 40 C12 44 16 47 18 44 Z" fill="#f1ead6"/>`,
    // 貧瘠（靈魂掉落）：裂開的灰色靈魂，旁邊往下的箭頭
    curseBarren: `<path d="M26 58 C14 58 9 47 14 38 C17 32 18 25 16 15 C24 20 28 26 28 32 C31 28 32 24 32 18 C40 26 42 37 38 46 C36 53 31 58 26 58 Z" fill="#90a4ae"/>
        <path d="M21 32 L26 39 L22 45 L27 51" stroke-width="2.5"/>
        <path d="M49 8 L49 36" stroke-width="10"/><path d="M49 8 L49 36" stroke="#e53935" stroke-width="5"/><path d="M39 34 L49 50 L59 34 Z" fill="#e53935"/>`,
    // 精英橫行（精英機率）：金圈裡站著兩隻長角的紫怪
    curseElite: `<ellipse cx="32" cy="52" rx="27" ry="8" stroke-width="9"/><ellipse cx="32" cy="52" rx="27" ry="8" stroke="#ffd54f" stroke-width="4"/>
        <path d="M12 28 L9 13 L18 23 Z M32 28 L34 13 L26 23 Z" fill="#ffca28" stroke-width="2.5"/><circle cx="22" cy="36" r="12" fill="#8e24aa"/>
        <path d="M33 23 L31 8 L40 18 Z M53 23 L55 8 L46 18 Z" fill="#ffca28" stroke-width="2.5"/><circle cx="43" cy="31" r="12" fill="#ab47bc"/>
        <circle cx="18" cy="36" r="2.2" fill="#ffd54f" stroke="none"/><circle cx="26" cy="36" r="2.2" fill="#ffd54f" stroke="none"/><circle cx="39" cy="31" r="2.2" fill="#ffd54f" stroke="none"/><circle cx="47" cy="31" r="2.2" fill="#ffd54f" stroke="none"/>`,
    // 暴君（首領血量）：尖刺王座
    curseTyrant: `<path d="M16 42 L16 14 L22 4 L27 12 L32 2 L37 12 L42 4 L48 14 L48 42 Z" fill="#7f0000"/>
        <path d="M21 18 L43 18 L43 38 L21 38 Z" fill="#c62828" stroke-width="3"/>
        <rect x="5" y="30" width="11" height="16" rx="2" fill="#7f0000"/><rect x="48" y="30" width="11" height="16" rx="2" fill="#7f0000"/>
        <path d="M14 48 L14 60 M50 48 L50 60" stroke-width="6"/><path d="M8 40 L56 40 L52 49 L12 49 Z" fill="#ffca28"/>`,
    // 脆弱（主角血量）：裂成兩半的心
    curseFrail: `<path d="M32 54 C12 41 5 28 12 17 C18 9 28 10 32 18 L28 28 L34 36 L29 44 Z" fill="#b23a3a" transform="translate(-3 0)"/>
        <path d="M32 18 C36 10 46 9 52 17 C59 28 52 41 32 54 L29 44 L34 36 L28 28 Z" fill="#b23a3a" transform="translate(3 0)"/>${shine(18, 22, 4, 3)}`,
    // 血債（怪物攻擊）：滴血的匕首
    curseBloodDebt: `<path d="M26 4 L38 4 L38 12 L26 12 Z" fill="#6d4c41"/><path d="M18 12 L46 12 L46 18 L18 18 Z" fill="#8d6e63"/>
        <path d="M26 18 L38 18 L38 44 L32 56 L26 44 Z" fill="#cfd8dc"/><path d="M26 34 L38 34 L38 44 L32 56 L26 44 Z" fill="#c62828"/>
        <path d="M44 42 C44 48 48 50 48 50 C48 50 52 48 52 42 C52 38 48 34 48 34 C48 34 44 38 44 42 Z" fill="#e53935" stroke-width="3"/>`,
    // ---- 契約、結算、選單 ----
    // 契約（流派標籤；每一種契約另有自己的 pact_*）：蓋紅蠟封的羊皮紙
    pact: `<path d="M12 8 L44 8 L52 16 L52 58 L12 58 Z" fill="#f1ead6"/><path d="M44 8 L44 16 L52 16" stroke-width="3"/>
        <path d="M19 22 L44 22 M19 30 L44 30 M19 38 L34 38" stroke="#a1887f" stroke-width="3"/>
        <circle cx="41" cy="47" r="9" fill="#c62828"/><path d="M37 47 L45 47 M41 43 L41 51" stroke="#ffcdd2" stroke-width="2.5"/>`,
    // 挑戰無盡：無限符號
    endless: duoStroke('M32 32 C26 22 12 20 10 32 C8 44 26 42 32 32 C38 22 56 20 54 32 C52 44 38 42 32 32', '#ef5350', 7),
    // 結算（通關後收工）：方格終點旗
    settle: `<path d="M14 6 L14 60" stroke-width="7"/><path d="M14 6 L14 60" stroke="#8d6e63" stroke-width="3"/>
        <rect x="16" y="8" width="38" height="26" fill="#f1ead6"/>
        <path d="M16 8 h9.5 v6.5 h-9.5 Z M35 8 h9.5 v6.5 h-9.5 Z M25.5 14.5 h9.5 v6.5 h-9.5 Z M44.5 14.5 h9.5 v6.5 h-9.5 Z M16 21 h9.5 v6.5 h-9.5 Z M35 21 h9.5 v6.5 h-9.5 Z M25.5 27.5 h9.5 v6.5 h-9.5 Z M44.5 27.5 h9.5 v6.5 h-9.5 Z" fill="${ICON_OUTLINE}" stroke="none"/>
        <rect x="16" y="8" width="38" height="26" stroke-width="3"/>`,
    // 最佳紀錄、新紀錄：月桂葉圍著往上的箭頭（成就是獎盃 trophy）
    record: duoStroke('M20 56 C8 48 6 32 14 16', '#7cb342', 4) + duoStroke('M44 56 C56 48 58 32 50 16', '#7cb342', 4) +
        `<ellipse cx="9" cy="40" rx="6" ry="3.5" fill="#9ccc65" stroke-width="2.5" transform="rotate(-60 9 40)"/><ellipse cx="9" cy="26" rx="6" ry="3.5" fill="#9ccc65" stroke-width="2.5" transform="rotate(-80 9 26)"/>
        <ellipse cx="55" cy="40" rx="6" ry="3.5" fill="#9ccc65" stroke-width="2.5" transform="rotate(60 55 40)"/><ellipse cx="55" cy="26" rx="6" ry="3.5" fill="#9ccc65" stroke-width="2.5" transform="rotate(80 55 26)"/>
        <path d="M32 10 L44 24 L37 24 L37 50 L27 50 L27 24 L20 24 Z" fill="#ffd54f"/>`,
    // 永久強化「全部退還」：結晶加一個往回的箭頭
    refund: `<path d="M40 12 L56 28 L40 58 L24 28 Z" fill="#b388ff"/><path d="M24 28 L56 28" stroke-width="2.5"/>` +
        duoStroke('M28 10 C16 10 8 18 8 30', '#8fd3ff', 5) + `<path d="M1 26 L8 40 L15 26 Z" fill="#8fd3ff"/>`,
    // ---- 永久強化（跟祝福長得像的那幾個各自一張）----
    // 亡者之力（全軍傷害）：骨白色的拳頭
    might: `<rect x="16" y="22" width="34" height="26" rx="8" fill="#f1ead6"/><path d="M24 22 L24 32 M32 22 L32 32 M40 22 L40 32" stroke-width="3"/>
        <path d="M18 36 C8 36 8 24 18 24" fill="#f1ead6"/><rect x="22" y="48" width="22" height="12" fill="#7e57c2"/>
        <path d="M10 10 L16 16 M32 3 L32 12 M54 10 L48 16" stroke="#ffd54f" stroke-width="3.5"/>`,
    // 大招精通（大招冷卻）：紫色爆光前的沙漏
    ultMastery: `<path d="${starPath(32, 32, 30, 21, 10)}" fill="#c06bf5"/>
        <path d="M20 10 L44 10 L44 14 C44 24 36 28 36 32 C36 36 44 40 44 50 L44 54 L20 54 L20 50 C20 40 28 36 28 32 C28 28 20 24 20 14 Z" fill="#f1ead6"/>
        <path d="M24 50 L40 50 L32 42 Z M26 16 L38 16 L32 24 Z" fill="#ffd54f" stroke="none"/>`,
    // 軍團體魄（召喚物血量）：骨頭加一顆心
    // 永久強化「骸骨先鋒」（開局就帶幾隻骷髏）：紫色圓盾前面排著三顆骷髏頭
    boneVanguard: `<circle cx="32" cy="28" r="22" fill="#5e35b1"/><circle cx="32" cy="28" r="15" fill="none" stroke="#ffd54f" stroke-width="3"/>
        ${[[18, 44], [46, 44], [32, 50]].map(([x, y]) => `<path d="M${x - 9} ${y - 2} C${x - 9} ${y - 12} ${x + 9} ${y - 12} ${x + 9} ${y - 2} C${x + 9} ${y + 3} ${x + 6} ${y + 5} ${x + 5} ${y + 5} L${x + 5} ${y + 10} L${x - 5} ${y + 10} L${x - 5} ${y + 5} C${x - 6} ${y + 5} ${x - 9} ${y + 3} ${x - 9} ${y - 2} Z" fill="#f1ead6" stroke-width="3"/><circle cx="${x - 3.5}" cy="${y - 1}" r="2.6" fill="${ICON_OUTLINE}" stroke="none"/><circle cx="${x + 3.5}" cy="${y - 1}" r="2.6" fill="${ICON_OUTLINE}" stroke="none"/>`).join('')}
        ${shine(22, 14, 5, 3)}`,
    // 屍爆（新星引爆陣亡留下的骸骨）：交叉骨頭上一顆裂開的骷髏，四周飛出骨片（不用星形爆光：那是新星 burst）
    corpseBlast: `${[[8, 14, -0.8], [56, 12, 0.8], [6, 34, -1.6], [58, 34, 1.6]].map(([x, y, a]) => `<path d="M${x} ${y} l${(Math.sin(a) * 8).toFixed(1)} ${(-Math.cos(a) * 8).toFixed(1)}" stroke-width="7"/><path d="M${x} ${y} l${(Math.sin(a) * 8).toFixed(1)} ${(-Math.cos(a) * 8).toFixed(1)}" stroke="#d1c4e9" stroke-width="3.5"/>`).join('')}
        <path d="M12 58 L52 44 M12 44 L52 58" stroke-width="9"/><path d="M12 58 L52 44 M12 44 L52 58" stroke="#efebe9" stroke-width="5"/>
        <path d="M32 8 C20 8 14 16 14 26 C14 32 17 36 21 38 L21 46 L43 46 L43 38 C47 36 50 32 50 26 C50 16 44 8 32 8 Z" fill="#efebe9"/>
        <ellipse cx="25" cy="27" rx="5" ry="6" fill="#7e57c2" stroke="none"/><ellipse cx="39" cy="27" rx="5" ry="6" fill="#7e57c2" stroke="none"/>
        <path d="M32 9 L29 17 L34 21 L31 27" stroke-width="2.5"/>${shine(22, 15, 4, 2.5)}`,
    boneMarrow: `<path d="M12 44 C6 40 10 32 16 36 L40 12 C36 6 44 2 48 8 C54 6 58 14 52 18 L28 42 C32 48 24 52 20 46 C16 52 8 48 12 44 Z" fill="#f1ead6"/>
        <path d="M45 61 C32 53 28 45 32 38 C36 33 42 34 45 39 C48 34 54 33 58 38 C62 45 58 53 45 61 Z" fill="#e5484d"/>`,
    // 靈魂親和（靈魂掉落）：滿出靈魂的豐饒角
    soulAffinity: `<path d="M4 10 C8 30 22 44 42 46 L46 30 C30 28 18 20 4 10 Z" fill="#d7965a"/><ellipse cx="44" cy="38" rx="5" ry="9" fill="#8d6e63" transform="rotate(15 44 38)"/>
        <circle cx="54" cy="48" r="6" fill="#62dbe2"/><circle cx="44" cy="56" r="4.5" fill="#62dbe2"/><circle cx="57" cy="34" r="4" fill="#62dbe2"/>${shine(52, 46, 2, 1.5)}`,
    // 不死執念（倒下時復活一次；祝福「重生」是 rebirth）：金色生命十字
    revive: `<ellipse cx="32" cy="17" rx="10" ry="12" stroke-width="11"/><ellipse cx="32" cy="17" rx="10" ry="12" stroke="#ffd54f" stroke-width="5"/>
        <path d="M12 33 L52 33 M32 30 L32 60" stroke-width="12"/><path d="M12 33 L52 33 M32 30 L32 60" stroke="#ffd54f" stroke-width="6"/>`,
    // 戰士遺跡「軍餉」：一枚金幣
    coin: `<circle cx="32" cy="32" r="24" fill="#ffca28"/><circle cx="32" cy="32" r="17" stroke="#e0a82e" stroke-width="3"/>
        <path d="M32 20 L32 44 M26 24 L36 24 C40 24 40 31 36 31 L28 31 C24 31 24 40 28 40 L38 40" stroke="#b8860b" stroke-width="3.5"/>${shine(22, 20, 4, 2.5)}`,
    close: duoStroke('M16 16 L48 48 M48 16 L16 48', '#f1ead6', 6),
    // ---- 祝福 ----
    boneBlade: `<path d="M44 8 L56 8 L56 20 L28 46 L18 36 Z" fill="#e3eaee"/><path d="M48 13 L24 39" stroke-width="2" stroke="#9fb0ba"/>
        <path d="M12 34 L30 52" stroke-width="10"/><path d="M12 34 L30 52" stroke="#8d6e63" stroke-width="5"/>
        <path d="M18 44 L9 53" stroke-width="9"/><path d="M18 44 L9 53" stroke="#f1ead6" stroke-width="5"/><circle cx="8" cy="55" r="4.5" fill="#f1ead6" stroke-width="3"/>`,
    cleave: `<path d="M8 50 C14 22 34 8 58 10 C40 16 26 30 20 52 Z" fill="#e3eaee"/><path d="M14 46 C20 26 34 15 50 13" stroke="#9fb0ba" stroke-width="2"/>`,
    boneArmor: `<path d="M32 6 L54 14 L52 34 C50 46 42 54 32 58 C22 54 14 46 12 34 L10 14 Z" fill="#78909c"/>
        <path d="M22 22 L42 42 M42 22 L22 42" stroke-width="9"/><path d="M22 22 L42 42 M42 22 L22 42" stroke="#f1ead6" stroke-width="5"/>${shine(22, 14, 5, 2.5)}`,
    splitGaze: `<circle cx="32" cy="18" r="11" fill="#f1ead6"/><circle cx="17" cy="42" r="11" fill="#f1ead6"/><circle cx="47" cy="42" r="11" fill="#f1ead6"/>
        <circle cx="32" cy="19" r="5" fill="#26a69a" stroke-width="2.5"/><circle cx="17" cy="43" r="5" fill="#26a69a" stroke-width="2.5"/><circle cx="47" cy="43" r="5" fill="#26a69a" stroke-width="2.5"/>`,
    frenzyEye: `<path d="M5 32 C15 18 49 18 59 32 C49 46 15 46 5 32 Z" fill="#f1ead6"/><circle cx="32" cy="32" r="10" fill="#26a69a"/><circle cx="32" cy="32" r="4" fill="${ICON_OUTLINE}" stroke="none"/>
        <path d="M44 2 L36 16 L44 16 L38 28" stroke-width="7"/><path d="M44 2 L36 16 L44 16 L38 28" stroke="#ffd54f" stroke-width="3.5"/>`,
    wraithBlast: `<path d="${starPath(32, 32, 30, 18, 9)}" fill="#ffb74d"/><path d="${GHOST_PATH}" fill="#e1f5fe" transform="translate(9.6 7) scale(0.7)"/>
        <circle cx="29" cy="27" r="2" fill="${ICON_OUTLINE}" stroke="none"/><circle cx="35" cy="27" r="2" fill="${ICON_OUTLINE}" stroke="none"/>`,
    rebirth: duoStroke('M50 30 C50 18 42 10 32 10 C22 10 14 18 14 30', '#4db6ac', 5) + `<path d="M56 24 L50 36 L42 26 Z" fill="#4db6ac"/>` +
        `<path d="${GHOST_PATH}" fill="#e1f5fe" transform="translate(12.8 18) scale(0.6)"/><circle cx="29" cy="34" r="2" fill="${ICON_OUTLINE}" stroke="none"/><circle cx="35" cy="34" r="2" fill="${ICON_OUTLINE}" stroke="none"/>`,
    frostAura: duoStroke('M32 6 L32 58 M9.5 19 L54.5 45 M9.5 45 L54.5 19', '#b3e5fc', 5) +
        duoStroke('M25 10 L32 17 L39 10 M25 54 L32 47 L39 54 M8 28 L17 27 L14 18 M56 36 L47 37 L50 46 M8 36 L17 37 L14 46 M56 28 L47 27 L50 18', '#b3e5fc', 3.5),
    // 亡者復甦：土堆裡伸出的骷髏手（吸血鬼的不死流派是棺材 coffin）
    raiseDead: duoStroke('M32 50 L32 30', '#f1ead6', 7) + `<path d="M23 31 C23 23 41 23 41 31 L39 35 L25 35 Z" fill="#f1ead6"/>` +
        duoStroke('M26 25 L23 11 M31 23 L30 7 M36 23 L38 8 M40 27 L47 16 M23 31 L15 25', '#f1ead6', 4) +
        `<path d="M4 60 C10 48 22 44 32 44 C42 44 54 48 60 60 Z" fill="#6d4c41"/><circle cx="18" cy="54" r="2" fill="#4e342e" stroke="none"/><circle cx="44" cy="52" r="2.5" fill="#4e342e" stroke="none"/>`,
    soulHarvest: `<path d="M14 58 L40 10" stroke-width="9"/><path d="M14 58 L40 10" stroke="#8d6e63" stroke-width="5"/>
        <path d="M38 12 C48 8 58 14 60 26 C54 20 46 18 36 20 Z" fill="#cfd8dc"/>
        <path d="M14 40 C8 40 6 34 9 30 C10 28 10 26 9 23 C14 25 16 28 16 31 C17 29 18 28 18 26 C22 30 22 36 20 38 C19 40 17 40 14 40 Z" fill="#62dbe2" stroke-width="3"/>`,
    magnet: duoStroke('M18 14 L18 34 C18 44 24 50 32 50 C40 50 46 44 46 34 L46 14', '#e5484d', 9) +
        `<rect x="10" y="8" width="16" height="11" fill="#cfd8dc" stroke-width="3.5"/><rect x="38" y="8" width="16" height="11" fill="#cfd8dc" stroke-width="3.5"/>`,
    vitality: `<path d="${HEART_PATH}" fill="#e5484d" transform="translate(-2 2) scale(0.9)"/><circle cx="46" cy="44" r="13" fill="#9ccc65"/>
        <path d="M46 37 L46 51 M39 44 L53 44" stroke="#fff" stroke-width="4.5"/>${shine(18, 22, 4.5, 3)}`,
    novaPower: `<path d="${starPath(32, 32, 28, 13, 10)}" fill="#c06bf5"/><circle cx="32" cy="32" r="9" fill="#f6dcff"/>
        <path d="M50 40 L50 58 M41 49 L59 49" stroke-width="9"/><path d="M50 40 L50 58 M41 49 L59 49" stroke="#ffd54f" stroke-width="4.5"/>`,
    // 祝福「亡者契約」（召喚費用降低）：紫色召喚陣上掛一個金色價格牌、牌上一個減號。
    // 跟「契約」流派標籤（pact，羊皮紙）分開：同名時後面那張會蓋掉前面，兩個概念一直顯示同一張圖
    summonDiscount: `<ellipse cx="28" cy="44" rx="22" ry="11" fill="#4a2c6e"/><ellipse cx="28" cy="44" rx="15" ry="6.5" fill="none" stroke="#b388ff" stroke-width="3"/>
        <path d="M28 38 L28 50 M20 44 L36 44" stroke="#b388ff" stroke-width="2.5"/>
        <path d="M34 8 L56 8 L60 12 L60 30 L44 30 L34 20 Z" fill="#ffd54f"/><circle cx="40" cy="19" r="2.6" fill="${ICON_OUTLINE}" stroke="none"/>
        <path d="M46 19 L56 19" stroke-width="4.5"/>${shine(50, 12, 4, 2)}`,
    lifesteal: `<path d="M32 6 C40 20 50 30 50 40 C50 50 42 57 32 57 C22 57 14 50 14 40 C14 30 24 20 32 6 Z" fill="#c62828"/>${shine(24, 38, 3, 6, 15)}
        <path d="M23 30 L27 43 L31 30 Z" fill="#f1ead6" stroke-width="2.5"/><path d="M33 30 L37 43 L41 30 Z" fill="#f1ead6" stroke-width="2.5"/>`,
    // 法師的靈魂彈：跟遊戲裡的彈同一個青色
    soulBlade: `<path d="M46 6 L58 6 L58 18 L30 46 L18 34 Z" fill="#7ff0f0"/><path d="M52 10 L26 38" stroke="#d6fbfb" stroke-width="3"/>
        <path d="M12 32 L32 52" stroke-width="10"/><path d="M12 32 L32 52" stroke="#5c6bc0" stroke-width="5"/>
        <path d="M20 44 L9 55" stroke-width="9"/><path d="M20 44 L9 55" stroke="#9fa8da" stroke-width="5"/>${shine(50, 12, 3, 2, 45)}`,
    // ---- 傳說祝福 ----
    boneBurst: `<path d="${starPath(32, 34, 28, 14, 9)}" fill="#ffb74d"/><path d="${starPath(32, 34, 18, 10, 9)}" fill="#ffe0b2" stroke="none"/>
        <path d="M32 18 C23 18 18 24 18 31 C18 36 21 39 24 40 L24 46 L40 46 L40 40 C43 39 46 36 46 31 C46 24 41 18 32 18 Z" fill="#f1ead6"/>
        <ellipse cx="27" cy="31" rx="3.5" ry="4" fill="${ICON_OUTLINE}" stroke="none"/><ellipse cx="37" cy="31" rx="3.5" ry="4" fill="${ICON_OUTLINE}" stroke="none"/>`,
    twinSummon: `<path d="${GHOST_PATH}" fill="#b39ddb" transform="translate(-4 6) scale(0.8)"/><path d="${GHOST_PATH}" fill="#ffe082" transform="translate(16 2) scale(0.8)"/>
        <circle cx="38" cy="25" r="2.2" fill="${ICON_OUTLINE}" stroke="none"/><circle cx="46" cy="25" r="2.2" fill="${ICON_OUTLINE}" stroke="none"/>
        <circle cx="18" cy="29" r="2.2" fill="${ICON_OUTLINE}" stroke="none"/><circle cx="26" cy="29" r="2.2" fill="${ICON_OUTLINE}" stroke="none"/>`,
    soulfire: `<path d="${starPath(36, 30, 26, 12, 8)}" fill="#7ff0f0"/><circle cx="36" cy="30" r="9" fill="#e8ffff"/>
        ${duoStroke('M8 56 L26 38', '#7ff0f0', 4)}<circle cx="27" cy="37" r="5" fill="#7ff0f0" stroke-width="3"/>`,
    giantBones: `<path d="M26 8 C14 8 7 17 7 28 C7 35 11 40 16 42 L16 52 L36 52 L36 42 C41 40 45 35 45 28 C45 17 38 8 26 8 Z" fill="#f1ead6"/>
        <ellipse cx="18" cy="28" rx="5.5" ry="6.5" fill="${ICON_OUTLINE}" stroke="none"/><ellipse cx="34" cy="28" rx="5.5" ry="6.5" fill="${ICON_OUTLINE}" stroke="none"/>
        <path d="M21 52 L21 46 M26 52 L26 46 M31 52 L31 46" stroke-width="3"/>
        <path d="M50 34 C44 34 41 38 41 43 C41 46 43 48 45 49 L45 54 L55 54 L55 49 C57 48 59 46 59 43 C59 38 56 34 50 34 Z" fill="#d7ccc8"/>
        <circle cx="47" cy="43" r="2.2" fill="${ICON_OUTLINE}" stroke="none"/><circle cx="53" cy="43" r="2.2" fill="${ICON_OUTLINE}" stroke="none"/>${shine(18, 15, 4, 2.5)}`,
    ricochet: duoStroke('M6 50 L24 22 L40 44 L58 14', '#ffe082', 4) + `<path d="M58 14 L49 15 L56 23 Z" fill="#ffe082"/>
        <circle cx="24" cy="22" r="6" fill="#ffc400"/><circle cx="40" cy="44" r="6" fill="#ffc400"/>
        <circle cx="24" cy="22" r="2.4" fill="#fce4ec" stroke="none"/><circle cx="40" cy="44" r="2.4" fill="#fce4ec" stroke="none"/>`,
    frostNova: `<path d="${starPath(32, 32, 28, 16, 12)}" fill="#81d4fa"/>` + duoStroke('M32 14 L32 50 M16 23 L48 41 M16 41 L48 23', '#e1f5fe', 3.5) +
        `<circle cx="32" cy="32" r="6" fill="#e1f5fe"/>`,
    eliteHunter: `<path d="M12 40 L15 18 L24 28 L32 13 L40 28 L49 18 L52 40 Z" fill="#ffd54f"/><rect x="12" y="39" width="40" height="8" rx="2" fill="#e0a82e"/>` +
        duoStroke('M32 49 L32 61 M23 55 L41 55', '#ce93d8', 3) + `<circle cx="32" cy="55" r="4" fill="#ce93d8" stroke-width="2.5"/>`,
    midas: `<circle cx="24" cy="38" r="15" fill="#ffd54f"/><circle cx="24" cy="38" r="9" stroke="#e0a82e" stroke-width="3"/>
        <circle cx="42" cy="26" r="15" fill="#ffe082"/><circle cx="42" cy="26" r="9" stroke="#e0a82e" stroke-width="3"/>${shine(37, 18, 4, 2.5)}
        <path d="${starPath(52, 50, 8, 3, 4)}" fill="#fff8e1" stroke-width="2.5"/>`,
    soulSiphon: `<path d="${HEART_PATH}" fill="#e5484d"/>
        <path d="M32 44 C25 44 22 38 25 33 C27 30 28 27 27 22 C32 25 35 29 35 32 C37 30 38 28 38 25 C42 29 43 35 41 39 C39 42 36 44 32 44 Z" fill="#7ff0f0" stroke-width="3"/>${shine(18, 20, 4.5, 3)}`,
    deathPact: `<path d="M26 8 C14 8 8 17 8 27 C8 33 11 37 16 39 L16 48 L36 48 L36 39 C41 37 44 33 44 27 C44 17 38 8 26 8 Z" fill="#b0bec5"/>
        <ellipse cx="19" cy="27" rx="5" ry="6" fill="${ICON_OUTLINE}" stroke="none"/><ellipse cx="33" cy="27" rx="5" ry="6" fill="${ICON_OUTLINE}" stroke="none"/>
        <path d="M50 60 C43 60 40 54 43 49 C45 46 46 43 45 37 C51 41 54 45 54 49 C56 47 57 45 57 42 C61 46 62 52 59 56 C57 59 54 60 50 60 Z" fill="#7ff0f0" stroke-width="3"/>`,
    soulVolley: duoStroke('M8 22 L26 22', '#7ff0f0', 4) + duoStroke('M8 34 L32 34', '#7ff0f0', 4) + duoStroke('M8 46 L26 46', '#7ff0f0', 4) +
        `<circle cx="32" cy="22" r="7" fill="#7ff0f0"/><circle cx="40" cy="34" r="8" fill="#7ff0f0"/><circle cx="32" cy="46" r="7" fill="#7ff0f0"/>
        <circle cx="40" cy="34" r="3.5" fill="#e8ffff" stroke="none"/>${shine(30, 20, 2, 1.5)}${shine(38, 31, 2.5, 1.5)}${shine(30, 44, 2, 1.5)}`,
    eagleEye: duoStroke('M32 3 L32 12 M32 52 L32 61', '#ffd54f', 3) +
        `<path d="M5 32 C15 18 49 18 59 32 C49 46 15 46 5 32 Z" fill="#f1ead6"/><circle cx="32" cy="32" r="10" fill="#ffc400"/>
        <circle cx="32" cy="32" r="4" fill="${ICON_OUTLINE}" stroke="none"/>${shine(28, 28, 2.5, 1.5)}`,
    auraMight: `<path d="${GHOST_PATH}" fill="#80cbc4"/><ellipse cx="26" cy="27" rx="3" ry="4" fill="${ICON_OUTLINE}" stroke="none"/>
        <ellipse cx="38" cy="27" rx="3" ry="4" fill="${ICON_OUTLINE}" stroke="none"/>${shine(24, 17, 4, 2.5)}` +
        duoStroke('M38 58 L58 38', '#cfd8dc', 4) + duoStroke('M46 42 L54 50', '#ffd54f', 3),
    frenzyTime: `<path d="M18 8 L46 8 L46 14 C46 24 36 28 36 32 C36 36 46 40 46 50 L46 56 L18 56 L18 50 C18 40 28 36 28 32 C28 28 18 24 18 14 Z" fill="#e1bee7"/>
        <path d="M24 50 L40 50 L32 41 Z" fill="#ab47bc" stroke-width="2.5"/><path d="M25 16 L39 16 L32 24 Z" fill="#ab47bc" stroke-width="2.5"/>${shine(23, 13, 2.5, 1.5)}`,
    shadowStep: duoStroke('M6 40 L20 40 M4 48 L18 48', '#b39ddb', 3) +
        `<path d="M24 50 L26 30 C26 22 32 18 38 20 L46 24 C50 26 50 30 46 32 L36 36 L36 44 L52 46 C56 47 56 52 52 53 L28 54 C25 54 24 52 24 50 Z" fill="#7e57c2"/>
        <path d="M34 22 L40 10 L44 22 Z" fill="#b39ddb" stroke-width="3"/>${shine(31, 28, 3, 2)}`,
    banish: `<circle cx="32" cy="32" r="22" fill="#3a3046" stroke-width="11"/><circle cx="32" cy="32" r="22" stroke="#e5484d" stroke-width="6"/>` +
        duoStroke('M17 47 L47 17', '#e5484d', 6),
    extraChoice: `<rect x="8" y="16" width="22" height="32" rx="3" fill="#b0bec5" transform="rotate(-15 19 32)"/>
        <rect x="34" y="16" width="22" height="32" rx="3" fill="#f1ead6" transform="rotate(15 45 32)"/>
        <rect x="21" y="12" width="22" height="32" rx="3" fill="#e9c46a"/>${shine(27, 18, 2.5, 1.5)}` +
        duoStroke('M32 49 L32 61 M26 55 L38 55', '#81c784', 3),

    // ---- 契約：每份契約一張自己的圖（好處那一半畫成主體，壞處那一半畫成點綴） ----
    // 血祭：滴著血的骷髏聖杯（召喚物變強、法師流血）
    pact_blood: `<path d="M14 10 L50 10 C50 28 42 36 32 36 C22 36 14 28 14 10 Z" fill="#c9a227"/><path d="M17 14 L47 14 C46 26 40 32 32 32 C24 32 18 26 17 14 Z" fill="#b71c1c" stroke-width="2.5"/>
        <rect x="29" y="36" width="6" height="12" fill="#c9a227"/><path d="M18 56 C18 50 46 50 46 56 Z" fill="#c9a227"/>
        <path d="M44 20 C46 26 46 30 44 33 C42 30 42 26 44 20 Z" fill="#e5484d" stroke-width="2"/><circle cx="26" cy="21" r="2.6" fill="#1b1424" stroke="none"/><circle cx="37" cy="21" r="2.6" fill="#1b1424" stroke="none"/>${shine(21, 15, 2.5, 1.5)}`,
    // 貪婪：長了惡魔角的錢袋，金幣往外滿出來
    pact_greed: `<path d="M18 26 C10 34 10 54 22 58 L42 58 C54 54 54 34 46 26 Z" fill="#a1887f"/><path d="M22 26 L42 26 L38 18 L26 18 Z" fill="#8d6e63"/>
        <path d="M24 18 C20 8 14 6 12 8 C16 10 18 14 20 20 Z M40 18 C44 8 50 6 52 8 C48 10 46 14 44 20 Z" fill="#b71c1c"/>
        <circle cx="32" cy="42" r="8" fill="#ffd54f"/><path d="M32 37 L32 47 M29 39 L35 39 M29 45 L35 45" stroke-width="2"/>
        <circle cx="16" cy="56" r="5" fill="#ffd54f" stroke-width="2.5"/><circle cx="50" cy="54" r="4" fill="#ffd54f" stroke-width="2.5"/>`,
    // 戰狂：握緊的拳頭冒著紅色怒氣、額頭兩根角
    pact_fury: `<path d="M16 30 C16 22 22 20 26 22 C26 16 32 14 36 18 C38 14 44 14 46 20 C50 20 52 24 50 30 L48 46 C46 54 38 58 30 58 C22 58 16 52 16 44 Z" fill="#ef9a9a"/>
        <path d="M26 22 L26 32 M36 18 L36 30 M46 20 L46 30" stroke-width="3"/>
        <path d="M10 18 C4 12 6 4 12 2 C12 8 16 12 20 14 Z M54 18 C60 12 58 4 52 2 C52 8 48 12 44 14 Z" fill="#b71c1c"/>
        <path d="M6 40 L12 38 M4 50 L12 48 M58 40 L52 38 M60 50 L52 48" stroke="#ff7043" stroke-width="3.5"/>`,
    // 魂焰：藍色火焰裡的骷髏（法師的靈魂彈）
    pact_flame: `<path d="M32 60 C16 60 8 48 14 34 C18 26 18 16 14 4 C26 10 32 18 32 26 C36 20 38 14 38 6 C50 16 56 32 50 46 C46 56 40 60 32 60 Z" fill="#4fc3f7"/>
        <path d="M32 26 C24 26 20 32 20 38 C20 42 22 45 25 46 L25 52 L39 52 L39 46 C42 45 44 42 44 38 C44 32 40 26 32 26 Z" fill="#e1f5fe"/>
        <ellipse cx="27" cy="38" rx="3.2" ry="3.8" fill="#1b1424" stroke="none"/><ellipse cx="37" cy="38" rx="3.2" ry="3.8" fill="#1b1424" stroke="none"/>`,
    // 群聚：一堆擠在一起的小骷髏，上面一個打折的價籤
    pact_swarm: `<circle cx="18" cy="44" r="10" fill="#f1ead6"/><circle cx="46" cy="44" r="10" fill="#f1ead6"/><circle cx="32" cy="48" r="11" fill="#f1ead6"/><circle cx="32" cy="30" r="9" fill="#f1ead6"/>
        <circle cx="15" cy="43" r="2.2" fill="#1b1424" stroke="none"/><circle cx="21" cy="43" r="2.2" fill="#1b1424" stroke="none"/><circle cx="43" cy="43" r="2.2" fill="#1b1424" stroke="none"/><circle cx="49" cy="43" r="2.2" fill="#1b1424" stroke="none"/>
        <circle cx="28" cy="47" r="2.6" fill="#1b1424" stroke="none"/><circle cx="36" cy="47" r="2.6" fill="#1b1424" stroke="none"/><circle cx="29" cy="29" r="2.2" fill="#1b1424" stroke="none"/><circle cx="35" cy="29" r="2.2" fill="#1b1424" stroke="none"/>
        <path d="M40 6 L58 6 L58 18 L52 24 L40 18 Z" fill="#81c784" stroke-width="3"/><circle cx="46" cy="12" r="2" fill="#1b1424" stroke="none"/>`,
    // 雷鳴：雷雲劈下紫色閃電
    pact_storm: `<path d="M14 34 C6 34 4 24 12 22 C12 12 24 8 30 14 C34 6 50 8 50 18 C58 18 60 30 52 34 Z" fill="#78909c"/>
        <path d="M34 30 L24 46 L32 46 L26 60 L42 40 L34 40 L40 30 Z" fill="#ce93d8"/><path d="M18 40 L14 50 M48 40 L52 48" stroke="#90caf9" stroke-width="3"/>`,

    // ---- 每日變異：每條規則一張 ----
    mut_glass: `<path d="M32 54 C12 41 5 28 12 17 C18 9 28 10 32 18 C36 10 46 9 52 17 C59 28 52 41 32 54 Z" fill="#b3e5fc"/>
        <path d="M32 18 L28 28 L36 32 L30 44" stroke-width="2.5"/><path d="M14 24 L22 26 M44 22 L50 30" stroke-width="2"/>${shine(20, 22, 5, 3)}${shine(44, 20, 2.5, 1.5)}`,
    mut_giants: `<ellipse cx="32" cy="40" rx="16" ry="18" fill="#795548"/><ellipse cx="14" cy="18" rx="6" ry="8" fill="#795548" transform="rotate(-20 14 18)"/>
        <ellipse cx="27" cy="12" rx="6" ry="8" fill="#795548"/><ellipse cx="41" cy="12" rx="6" ry="8" fill="#795548"/><ellipse cx="52" cy="19" rx="6" ry="8" fill="#795548" transform="rotate(20 52 19)"/>
        <path d="M24 40 L40 40 M26 48 L38 48" stroke="#4e342e" stroke-width="3"/>`,
    mut_eyes: `<path d="M32 4 L32 12 M32 52 L32 60 M4 32 L12 32 M52 32 L60 32 M12 12 L18 18 M46 46 L52 52 M12 52 L18 46 M46 18 L52 12" stroke="#ffe082" stroke-width="4"/>
        <path d="M10 32 C18 18 46 18 54 32 C46 46 18 46 10 32 Z" fill="#ffffff"/><circle cx="32" cy="32" r="10" fill="#ffc400"/><circle cx="32" cy="32" r="4.5" fill="#1b1424" stroke="none"/>${shine(28, 27, 2.5, 1.8)}`,
    mut_bloodMoon: `<circle cx="32" cy="28" r="22" fill="#c62828"/><circle cx="24" cy="22" r="5" fill="#b71c1c" stroke-width="2.5"/><circle cx="40" cy="32" r="4" fill="#b71c1c" stroke-width="2.5"/>
        <path d="M22 48 C22 54 26 56 26 60 C26 56 30 54 30 48 M38 49 C38 53 41 55 41 58 C41 55 44 53 44 49" fill="#e53935" stroke-width="2.5"/>${shine(20, 14, 4, 2.5)}`,
    mut_feast: `<path d="M6 36 L58 36 C58 50 46 58 32 58 C18 58 6 50 6 36 Z" fill="#8d6e63"/><path d="M6 36 L58 36" stroke-width="4"/>
        <path d="M20 36 C12 30 16 20 20 14 C22 22 26 24 26 30 C30 24 30 18 28 10 C38 18 40 28 36 36 Z" fill="#62dbe2"/>
        <path d="M38 36 C36 30 40 24 44 22 C44 28 48 30 46 36 Z" fill="#62dbe2"/><path d="M14 44 C24 48 40 48 50 44" stroke="#5d4037" stroke-width="2.5"/>`,
    mut_bones: `<circle cx="32" cy="32" r="12" fill="#fff59d"/><path d="M32 6 L32 14 M32 50 L32 58 M6 32 L14 32 M50 32 L58 32" stroke="#fff59d" stroke-width="4"/>
        <path d="M10 50 C6 46 10 40 14 44 L44 14 C40 10 46 6 50 10 C54 6 60 12 54 16 C58 20 52 26 48 22 L18 52 C22 56 16 60 12 56 C8 60 2 54 6 50 C2 46 6 40 10 44 Z" fill="#f1ead6" transform="translate(64 0) scale(-1 1)"/>
        <path d="M10 50 C6 46 10 40 14 44 L44 14 C40 10 46 6 50 10 C54 6 60 12 54 16 C58 20 52 26 48 22 L18 52 C22 56 16 60 12 56 C8 60 2 54 6 50 C2 46 6 40 10 44 Z" fill="#f1ead6"/>`,
    mut_market: `<path d="M32 10 L32 52 M18 56 L46 56 M10 22 L54 22" stroke-width="4"/><path d="M8 22 L2 38 L18 38 Z" fill="#ffd54f"/><path d="M56 22 L46 38 L62 38 Z" fill="#ffd54f"/>
        <path d="M2 38 C2 44 18 44 18 38 Z M46 38 C46 44 62 44 62 38 Z" fill="#ffd54f"/>
        <path d="M24 12 C20 4 14 4 12 6 C16 8 18 10 20 14 Z M40 12 C44 4 50 4 52 6 C48 8 46 10 44 14 Z" fill="#b71c1c"/><circle cx="32" cy="10" r="5" fill="#e5484d"/>`,
    mut_storm: `<path d="M10 14 L54 14 C50 20 44 22 36 22 C44 24 48 28 46 32 C40 30 32 32 28 34 C34 36 38 40 36 44 C32 42 26 44 24 48 C28 50 30 54 28 58 C22 50 18 42 22 34 C14 32 12 24 18 22 C12 20 10 18 10 14 Z" fill="#9575cd"/>
        <path d="${starPath(46, 46, 12, 5, 8)}" fill="#c06bf5" stroke-width="3"/><circle cx="46" cy="46" r="3.5" fill="#f6dcff" stroke-width="2"/>`,
};

const ICON_SVGS =Object.fromEntries(Object.entries(ICON_BODIES).map(([k, v]) => [k, iconSvg(v)]));

function iconHtml(name, cls = 'icon') {
    return `<span class="${cls}" aria-hidden="true">${ICON_SVGS[name] || ''}</span>`;
}

const iconImages = {};
function preloadIconImages() {
    return Promise.all(Object.entries(ICON_SVGS).map(([name, svg]) => new Promise(resolve => {
        const img = new Image();
        img.onload = () => { iconImages[name] = img; resolve(); };
        img.onerror = () => resolve();
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    })));
}
function getIconImage(name) { return iconImages[name] || null; }
// 底部卡片的頭像要一個網址：沒有立繪的卡（血魔法、武僧的拳）用圖示
function iconDataUrl(name) { return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(ICON_SVGS[name] || '')}`; }
