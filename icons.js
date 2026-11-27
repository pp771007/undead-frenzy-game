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

// ---- 零件：弓、箭、槍、弩、劍、飛刀、陷阱、橡實、小怪 ----
// 武器零件畫在自己的座標裡（朝 +x、從 0 開始），用 placeAt 擺到圖上：
// 同一種武器不管朝哪邊、出現在哪張圖示，長相都一樣精緻（木紋亮線、銅箍、刃脊、握把纏布）
const WOOD = '#8d6e63', WOOD_DARK = '#5d4037', STEEL = '#cfd8dc', STEEL_DARK = '#90a4ae', GRIP = '#4e342e', BRASS = '#ffca28';
const EDGE_SHINE = 'rgba(255,255,255,0.5)';
function placeAt(x, y, deg, body) { return `<g transform="translate(${x} ${y}) rotate(${deg.toFixed(1)})">${body}</g>`; }
function degOf(x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI; }
function lenOf(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }
// 桿子：圓頭長條，上緣一道亮線
function rodL(len, w, color) {
    return `<rect x="0" y="${-w / 2}" width="${len.toFixed(1)}" height="${w}" rx="${w / 2}" fill="${color}" stroke-width="2.5"/>`
        + `<path d="M${w / 2} ${(-w / 2 + 1.3).toFixed(1)} L${(len - w / 2).toFixed(1)} ${(-w / 2 + 1.3).toFixed(1)}" stroke="${EDGE_SHINE}" stroke-width="1.2"/>`;
}
// 葉形槍頭：中間一道脊、一道反光；collar = 底部的銅箍（削尖的木樁不要）
function spearHeadL(len, w, fill = STEEL, collar = true) {
    return `<path d="M0 0 C${len * 0.3} ${-w} ${len * 0.62} ${-w * 0.85} ${len} 0 C${len * 0.62} ${w * 0.85} ${len * 0.3} ${w} 0 0 Z" fill="${fill}" stroke-width="2.5"/>`
        + `<path d="M${len * 0.12} 0 L${len * 0.8} 0" stroke="${STEEL_DARK}" stroke-width="1.4"/><path d="M${len * 0.22} ${-w * 0.4} Q${len * 0.45} ${-w * 0.62} ${len * 0.68} ${-w * 0.3}" stroke="${EDGE_SHINE}" stroke-width="1.4"/>`
        + (collar ? `<rect x="-3.5" y="-3.4" width="5" height="6.8" rx="1.2" fill="${BRASS}" stroke-width="2"/>` : '');
}
function spear(x1, y1, x2, y2, head = 16, w = 4.5, headFill = STEEL, collar = true) {
    const L = lenOf(x1, y1, x2, y2);
    return placeAt(x1, y1, degOf(x1, y1, x2, y2), rodL(L - head + 2, w, WOOD) + `<g transform="translate(${(L - head).toFixed(1)} 0)">${spearHeadL(head, head * 0.36, headFill, collar)}</g>`);
}
// 箭：寬刃箭頭（兩邊倒鉤）＋兩片箭羽；尾巴在 (x1,y1)
function arrow(x1, y1, x2, y2, head = STEEL, feather = '#a5d6a7', size = 1) {
    const L = lenOf(x1, y1, x2, y2) / size, hl = 10;
    return placeAt(x1, y1, degOf(x1, y1, x2, y2), `<g transform="scale(${size})">${rodL(L - hl + 1, 3.2, WOOD)}`
        + `<path d="M${L} 0 L${L - hl} -5.5 L${L - hl * 0.75} 0 L${L - hl} 5.5 Z" fill="${head}" stroke-width="2.2"/>`
        + `<path d="M11 0 L8 -6 L0 -6 L2 0 Z M11 0 L8 6 L0 6 L2 0 Z" fill="${feather}" stroke-width="2"/></g>`);
}
// 反曲弓：握把在原點、弓背朝 +x、兩端往前翹，弦在 -x 那側；r = 半長
function bowL(r, wood = WOOD, string = true) {
    const tx = -r * 0.5;
    return (string ? `<path d="M${tx} ${-r} L${tx} ${r}" stroke-width="3"/><path d="M${tx} ${-r} L${tx} ${r}" stroke="#eceff1" stroke-width="1.3"/>` : '')
        + `<path d="M${tx} ${-r} C${r * 0.35} ${-r * 0.62} ${r * 0.35} ${r * 0.62} ${tx} ${r} C${-r * 0.06} ${r * 0.55} ${-r * 0.06} ${-r * 0.55} ${tx} ${-r} Z" fill="${wood}" stroke-width="2.5"/>`
        + `<path d="M${tx} ${-r} l${r * 0.14} ${-r * 0.07} M${tx} ${r} l${r * 0.14} ${r * 0.07}" stroke-width="4.5"/><path d="M${tx} ${-r} l${r * 0.14} ${-r * 0.07} M${tx} ${r} l${r * 0.14} ${r * 0.07}" stroke="${wood}" stroke-width="2"/>`
        + `<rect x="${-r * 0.16}" y="${-r * 0.13}" width="${r * 0.3}" height="${r * 0.26}" rx="1.5" fill="${GRIP}" stroke-width="2"/>`
        + `<path d="M${r * 0.02} ${-r * 0.6} Q${r * 0.13} ${-r * 0.36} ${r * 0.14} ${-r * 0.2}" stroke="${EDGE_SHINE}" stroke-width="1.5"/>`;
}
function bow(cx, cy, r, deg, wood = WOOD) { return placeAt(cx, cy, deg, bowL(r, wood)); }
// 弩：弩身＋橫的弩臂＋扳機＋一支短矢，朝 +x，全長約 48
function crossbow(cx, cy, deg, s = 1, feather = '#90caf9') {
    return placeAt(cx, cy, deg, `<g transform="scale(${s})">`
        + `<path d="M-7 3 C-7 10 -2 11 -1 8" stroke-width="3.5"/>`
        + `<path d="M5 -15 L-4 0 L5 15" stroke-width="3"/><path d="M5 -15 L-4 0 L5 15" stroke="#eceff1" stroke-width="1.3"/>`
        + `<g transform="translate(-20 0)">${rodL(34, 7, WOOD)}</g><path d="M-23 -5 L-13 -3.5 L-13 3.5 L-23 6 Z" fill="${WOOD_DARK}" stroke-width="2.5"/>`
        + `<g transform="translate(12 0)">${bowL(15, '#78909c', false)}</g><rect x="9" y="-4.5" width="6" height="9" rx="1.5" fill="${BRASS}" stroke-width="2"/>`
        + `<g transform="translate(-4 0)">${rodL(22, 2.6, '#a1887f')}</g><path d="M26 0 L18 -4.5 L20 0 L18 4.5 Z" fill="${STEEL}" stroke-width="2"/><path d="M4 0 L1 -4 L-5 -4 L-3 0 Z M4 0 L1 4 L-5 4 L-3 0 Z" fill="${feather}" stroke-width="1.8"/>`
        + `</g>`);
}
// 雙手大劍：配重球、纏布握把、銅護手、有血槽的劍身；朝 +x
function greatswordL(len) {
    return `<circle cx="-3" cy="0" r="3.4" fill="${BRASS}" stroke-width="2.2"/><rect x="-1" y="-2.6" width="12" height="5.2" rx="2" fill="${GRIP}" stroke-width="2.2"/>`
        + `<rect x="10" y="-9" width="4.5" height="18" rx="2" fill="${BRASS}" stroke-width="2.2"/>`
        + `<path d="M14.5 -4.5 L${len - 7} -4.5 L${len} 0 L${len - 7} 4.5 L14.5 4.5 Z" fill="${STEEL}" stroke-width="2.5"/>`
        + `<path d="M17 0 L${len - 9} 0" stroke="${STEEL_DARK}" stroke-width="1.6"/><path d="M17 -2.6 L${len - 10} -2.6" stroke="${EDGE_SHINE}" stroke-width="1.2"/>`;
}
// 飛刀（刺客）：環形柄頭、纏布握把、小護手、單刃；朝 +x
function throwKnifeL(len) {
    return `<circle cx="-2" cy="0" r="3.2" stroke-width="4.5"/><circle cx="-2" cy="0" r="3.2" stroke="${BRASS}" stroke-width="2"/>`
        + `<rect x="1" y="-2.4" width="9" height="4.8" rx="1.5" fill="${GRIP}" stroke-width="2"/><rect x="10" y="-5" width="3" height="10" rx="1" fill="${BRASS}" stroke-width="2"/>`
        + `<path d="M13 -3.6 L${len - 6} -3.2 L${len} 0.6 L${len - 5} 3.8 L13 3.8 Z" fill="${STEEL}" stroke-width="2.3"/><path d="M15 -1.6 L${len - 8} -1.4" stroke="${EDGE_SHINE}" stroke-width="1.3"/>`;
}
// 縮小的捕獸夾（跟流派圖示 trapper 同一個長相）
function smallTrap(x, y, s) {
    return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="8" rx="15" ry="5" fill="#5d4037" stroke-width="3"/>`
        + `<path d="M-13 7 C-13 -8 13 -8 13 7" stroke-width="7"/><path d="M-13 7 C-13 -8 13 -8 13 7" stroke="#90a4ae" stroke-width="3.5"/>`
        + `${[-7, 0, 7].map(t => `<path d="M${t - 3} ${t === 0 ? -3 : -1} L${t} ${t === 0 ? 4 : 5} L${t + 3} ${t === 0 ? -3 : -1}" fill="#eceff1" stroke-width="1.8"/>`).join('')}`
        + `<circle cx="0" cy="8" r="3.5" fill="#ffcc80" stroke-width="2"/></g>`;
}
// 橡實（德魯伊的種子，跟彈幕 SHAPE_SPRITES.acorn 同色）
function acorn(x, y, s, rot = 0) {
    return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><ellipse cx="0" cy="3" rx="6" ry="7.5" fill="#a1887f" stroke-width="2.2"/>`
        + `<path d="M-3 4 Q-3 8 0 9" stroke="#d7ccc8" stroke-width="1.4"/>`
        + `<path d="M-7.5 -0.5 C-7.5 -7.5 7.5 -7.5 7.5 -0.5 Z" fill="#5d4037" stroke-width="2.2"/><path d="M-4.5 -3 L4.5 -3" stroke="#8d6e63" stroke-width="1.2"/>`
        + `<path d="M0 -6 C0 -9 2 -11 4 -11" stroke-width="2.4"/><path d="M2 -9 Q8 -13 10 -7 Q6 -6 2 -9 Z" fill="#7cb342" stroke-width="1.8"/></g>`;
}
// 被打的小怪：小幽靈剪影（GHOST_PATH 的中心約在 32,30）
function foe(x, y, s, fill = '#b39ddb') {
    return `<g transform="translate(${(x - 32 * s).toFixed(1)} ${(y - 30 * s).toFixed(1)}) scale(${s})"><path d="${GHOST_PATH}" fill="${fill}" stroke-width="${(2.5 / s).toFixed(1)}"/>`
        + `<circle cx="26" cy="26" r="3.5" fill="${ICON_OUTLINE}" stroke="none"/><circle cx="38" cy="26" r="3.5" fill="${ICON_OUTLINE}" stroke="none"/></g>`;
}
// 武僧的拳頭（外功 punchPower 那顆），以拳心 (x,y) 為中心
const FIST_BODY = `<path d="M12 24 C12 16 18 12 24 12 L40 12 C46 12 50 16 50 22 L50 38 C50 48 42 54 32 54 L22 54 C14 54 10 48 10 40 Z" fill="#ffcc80"/><path d="M20 12 L20 28 M30 12 L30 28 M40 12 L40 28" stroke-width="3"/>
        <path d="M14 38 C20 40 34 40 40 36" stroke="#8d6e63" stroke-width="3"/>`;
function fistAt(x, y, s, opacity = 1) { return `<g transform="translate(${x} ${y}) scale(${s}) translate(-30 -33)" opacity="${opacity}">${FIST_BODY}</g>`; }
// 武僧小人（輕功、內功那幾張的同一個人）
function monkAt(x, y, s, opacity = 1) { return `<g transform="translate(${x} ${y}) scale(${s})" opacity="${opacity}"><path d="M-9 14 L-9 1 C-9 -6 9 -6 9 1 L9 14 Z" fill="#ffa726"/><circle cx="0" cy="-11" r="6.5" fill="#ffcc80"/></g>`; }

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
    star: `<path d="${starPath(32, 33, 27, 12, 5)}" fill="#ffd54f"/>${shine(26, 22, 4, 2.5)}`,
    crown: `<path d="M9 46 L13 17 L24 30 L32 11 L40 30 L51 17 L55 46 Z" fill="#ffd54f"/><rect x="9" y="45" width="46" height="9" rx="2" fill="#e0a82e"/>
        <circle cx="32" cy="49.5" r="3" fill="#e5484d" stroke-width="2.5"/><circle cx="20" cy="49.5" r="2.5" fill="#62dbe2" stroke-width="2.5"/><circle cx="44" cy="49.5" r="2.5" fill="#62dbe2" stroke-width="2.5"/>`,
    // 百鬼夜行（怪物變多、靈魂加倍）：滴血的紅月
    hordeNight: `<circle cx="32" cy="32" r="23" fill="#d84a4a"/><circle cx="24" cy="26" r="5" fill="#a83333" stroke-width="2.5"/><circle cx="38" cy="40" r="7" fill="#a83333" stroke-width="2.5"/><circle cx="41" cy="22" r="3" fill="#a83333" stroke-width="2.5"/>${shine(20, 18, 5, 2.5)}`,
    // 躁動（怪物更快）：三道撕開的爪痕（兩頭尖、中間粗），帶速度線
    claws: `${[8, 25, 42].map(x => `<path d="M${x} 6 C${x + 13} 18 ${x + 13} 38 ${x - 1} 58 C${x + 5} 38 ${x + 5} 18 ${x} 6 Z" fill="#ff8a50" stroke-width="2.5"/><path d="M${x + 3} 16 C${x + 8} 26 ${x + 8} 36 ${x + 4} 46" stroke="#ffe0b2" stroke-width="1.6"/>`).join('')}
        <path d="M56 12 L62 8 M58 22 L63 20" stroke="#ffccbc" stroke-width="2.5"/>`,
    // 腐屍狂潮：三顆縫過線的殭屍頭
    plague: `${[[18, 42, 1, '#7cb342'], [46, 42, 1, '#7cb342'], [32, 26, 1.15, '#9ccc65']].map(([x, y, s, c]) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-12 4 C-12 -10 -6 -15 0 -15 C6 -15 12 -10 12 4 C12 11 6 14 0 14 C-6 14 -12 11 -12 4 Z" fill="${c}" stroke-width="2.6"/>
        <circle cx="-4.5" cy="0" r="3" fill="#fff59d" stroke-width="1.6"/><circle cx="5" cy="-1" r="2" fill="#fff59d" stroke-width="1.6"/><path d="M-6 8 L-3 6 L0 8 L3 6 L6 8" stroke-width="1.8"/>
        <path d="M-7 -8 L0 -12 M-5 -12 L-3.5 -7.5 M-1.5 -13.5 L-1 -9" stroke-width="1.5"/></g>`).join('')}`,
    sack: `<path d="M24 25 C20 19 22 12 27 9 L37 9 C42 12 44 19 40 25 Z" fill="#b08646"/>
        <path d="M18 25 C7 35 7 54 21 57 L41 57 C55 54 55 35 44 25 Z" fill="#c9a15c"/><path d="M19 25 L45 25" stroke-width="5"/>
        <path d="M24 38 C26 44 26 50 24 54" stroke="#a5814a" stroke-width="2.5"/>
        <circle cx="45" cy="48" r="10" fill="#ffd54f"/><circle cx="45" cy="48" r="5.5" stroke="#e0a82e" stroke-width="2.5"/>`,
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
    // 長槍：一支長槍＋旁邊一把兩頭的量尺
    spearLength: spear(6, 50, 52, 4, 18) + duoStroke('M22 60 L60 22 M22 60 L22 51 M22 60 L31 60 M60 22 L51 22 M60 22 L60 31', '#ffd54f', 3),
    // 破甲：槍尖捅穿裂開的盾，碎片飛出
    spearPower: `<path d="M6 24 L30 16 L38 40 C33 54 20 58 10 50 Z" fill="#90a4ae"/><path d="M11 28 L28 22 L33 40 C30 49 21 52 14 47 Z" fill="#b0bec5" stroke="none"/><path d="M21 21 L25 31 L18 37 L23 47" stroke-width="2.5"/>
        <path d="M42 50 L49 48 L46 55 Z M46 38 L52 40 L47 44 Z" fill="#b0bec5" stroke-width="2"/>` + spear(62, 2, 25, 37, 17) + `<path d="${starPath(24, 38, 8, 3, 4)}" fill="#ffd54f" stroke-width="2"/>`,
    // 拒馬：一根橫木上架兩組交叉、削尖的木樁
    spearBrace: [20, 44].map(cx => spear(cx + 12, 60, cx - 9, 14, 10, 4.5, '#ffe0b2', false) + spear(cx - 12, 60, cx + 9, 14, 10, 4.5, '#ffe0b2', false)).join('')
        + placeAt(4, 46, 0, rodL(56, 9, WOOD_DARK)) + `<ellipse cx="9" cy="46" rx="2.5" ry="4.5" fill="#a1887f" stroke-width="2"/><ellipse cx="55" cy="46" rx="2.5" ry="4.5" fill="#a1887f" stroke-width="2"/>`,
    // 掃槍：一槍串起兩隻怪
    spearSweep: foe(19, 40, 0.5) + foe(40, 28, 0.5) + spear(2, 52, 62, 12, 16) + `<path d="${starPath(20, 40, 5, 2, 4)}" fill="#ffd54f" stroke-width="1.6"/><path d="${starPath(40, 28, 5, 2, 4)}" fill="#ffd54f" stroke-width="1.6"/>`,
    // 弩陣
    bowReload: crossbow(26, 32, -45, 1.05) + duoStroke('M46 40 C58 38 62 52 54 58 C48 62 40 60 38 54', '#81c784', 3) + `<path d="M38 54 L33 46 L43 47 Z" fill="#81c784" stroke-width="2"/>`,
    bowPower: `<path d="${starPath(50, 14, 13, 5, 8)}" fill="#ffd54f" stroke-width="2.2"/>` + crossbow(28, 38, -50, 1.15),
    bowRange: crossbow(18, 46, -45, 0.85) + `<path d="M34 30 L46 18" stroke-width="5" stroke-dasharray="4 4"/><path d="M34 30 L46 18" stroke="#ffd54f" stroke-width="2.5" stroke-dasharray="4 4"/>`
        + `<circle cx="54" cy="10" r="8" fill="#42a5f5"/><circle cx="54" cy="10" r="4.5" fill="#fff8e1" stroke-width="2"/><circle cx="54" cy="10" r="1.6" fill="#42a5f5" stroke="none"/>`,
    bowVolley: crossbow(18, 48, -45, 0.85) + arrow(28, 28, 42, 6, STEEL, '#90caf9', 0.8) + arrow(32, 32, 56, 14, STEEL, '#90caf9', 0.8) + arrow(36, 38, 60, 32, STEEL, '#90caf9', 0.8),
    // 狂戰
    rageGain: `<path d="M32 60 C16 60 8 48 14 34 C18 26 18 18 14 6 C24 12 30 20 30 28 C34 22 36 16 36 8 C48 18 54 32 48 46 C44 54 40 60 32 60 Z" fill="#ff6d00"/>
        <path d="M32 54 C24 54 20 46 24 38 C26 34 28 32 28 26 C34 30 38 36 38 42 C38 48 36 54 32 54 Z" fill="#ffd54f" stroke="none"/>${duoStroke('M48 26 L58 16 M58 16 L50 16 M58 16 L58 24', '#ffd54f', 3)}`,
    rageLength: `<path d="M16 6 L48 6 M16 58 L48 58" stroke-width="5"/><path d="M19 8 C19 22 30 26 30 32 C30 38 19 42 19 56 L45 56 C45 42 34 38 34 32 C34 26 45 22 45 8 Z" fill="#ffe0b2"/>
        <path d="M23 18 L41 18 C40 25 34 28 32 31 C30 28 24 25 23 18 Z" fill="#ef6c00" stroke="none"/><path d="M22 54 C24 44 40 44 42 54 Z" fill="#ef6c00" stroke="none"/><path d="M32 33 L32 46" stroke="#ef6c00" stroke-width="2"/>`,
    // 旋風斬：大劍外面一圈旋轉的刀風
    rageCleave: duoStroke('M8 34 A24 24 0 0 1 50 16', '#ffab40', 3.5) + `<path d="M55 21 L45 16 L54 10 Z" fill="#ffab40" stroke-width="2"/>`
        + duoStroke('M56 30 A24 24 0 0 1 14 48', '#ffab40', 3.5) + `<path d="M9 43 L19 48 L10 54 Z" fill="#ffab40" stroke-width="2"/>` + placeAt(16, 50, -45, greatswordL(46)),
    // 嗜血：大劍砍下去，血回到自己的心
    rageLeech: placeAt(9, 9, 45, greatswordL(38))
        + `<path d="M40 34 C43 38 45 40 45 43 C45 46 43 48 40 48 C37 48 35 46 35 43 C35 40 37 38 40 34 Z" fill="#e5484d" stroke-width="2"/>`
        + `<g transform="translate(26 28) scale(0.58)"><path d="${HEART_PATH}" fill="#e5484d" stroke-width="5"/>${shine(21, 22, 5, 3.5)}</g>`,
    // 軍團紀律
    legionCap: `${[[16, 36], [32, 30], [48, 36]].map(([x, y]) => `<path d="M${x - 10} ${y + 6} C${x - 10} ${y - 8} ${x + 10} ${y - 8} ${x + 10} ${y + 6} Z" fill="#90a4ae"/><path d="M${x} ${y - 6} L${x} ${y - 12}" stroke="#1565c0" stroke-width="4"/>`).join('')}
        <path d="M4 50 L60 50" stroke-width="4"/>${duoStroke('M50 8 L50 22 M43 15 L57 15', '#81c784', 3.5)}`,
    // 操練：稻草人靶，胸口畫著靶心，旁邊一道劍痕
    legionDrill: placeAt(30, 62, -90, rodL(44, 5, WOOD)) + placeAt(8, 30, 0, rodL(44, 4.5, WOOD))
        + `<ellipse cx="30" cy="39" rx="11" ry="14" fill="#d7b98a"/><path d="M20 33 L40 33 M19 45 L41 45" stroke="#a1887f" stroke-width="2.2"/>
        <circle cx="30" cy="39" r="6" fill="#1e88e5" stroke-width="2"/><circle cx="30" cy="39" r="2.4" fill="#ffd54f" stroke="none"/>
        <circle cx="30" cy="16" r="8" fill="#d7b98a"/><path d="M25 14 L28 17 M28 14 L25 17 M32 14 L35 17 M35 14 L32 17" stroke-width="1.8"/>${shine(26, 34, 2.5, 4, 20)}`
        + duoStroke('M44 54 L60 38', '#eceff1', 2.5) + duoStroke('M48 58 L62 44', '#eceff1', 2),
    legionPay: `<ellipse cx="32" cy="50" rx="18" ry="6" fill="#e0a82e"/><ellipse cx="32" cy="42" rx="18" ry="6" fill="#ffd54f"/><ellipse cx="32" cy="34" rx="18" ry="6" fill="#e0a82e"/><ellipse cx="32" cy="26" rx="18" ry="6" fill="#ffd54f"/>
        <path d="M6 8 L22 22 M58 8 L42 22" stroke-width="5"/><path d="M6 8 L22 22 M58 8 L42 22" stroke="#cfd8dc" stroke-width="2.5"/>${shine(26, 24, 4, 2)}`,
    legionVet: `<path d="M20 4 L32 18 L44 4 L44 14 L32 28 L20 14 Z" fill="#1565c0"/><circle cx="32" cy="42" r="16" fill="#ffd54f"/>
        <path d="${starPath(32, 42, 10, 4.5, 5)}" fill="#fff8e1" stroke-width="2.5"/><path d="M22 58 L32 52 L42 58" stroke="#e0a82e" stroke-width="3"/>`,
    // 傳說
    valhalla: `<path d="M8 36 C2 24 6 12 14 10 C12 20 16 28 22 30 Z M56 36 C62 24 58 12 50 10 C52 20 48 28 42 30 Z" fill="#fff8e1"/>
        <path d="M32 12 C18 12 14 24 14 36 L50 36 C50 24 46 12 32 12 Z" fill="#ffd54f"/><rect x="12" y="34" width="40" height="8" rx="2" fill="#e0a82e"/>
        <path d="M18 42 L18 52 C24 58 40 58 46 52 L46 42" fill="#b0bec5"/>${[[32, 4, 4], [6, 52, 3], [58, 50, 3]].map(([x, y, r]) => `<path d="${starPath(x, y, r, r * 0.35, 4)}" fill="#fff8e1" stroke-width="1.5"/>`).join('')}`,
    // 鷹旗：羅馬軍團的金鷹旗 —— 展翅金鷹、月桂環、藍色銘牌
    aquila: placeAt(32, 63, -90, rodL(34, 5, WOOD))
        + `<circle cx="32" cy="44" r="8" stroke-width="5.5"/><circle cx="32" cy="44" r="8" stroke="#7cb342" stroke-width="2.6"/>
        <rect x="21" y="52" width="22" height="9" rx="1.5" fill="#1e88e5"/><path d="M25 56.5 L39 56.5" stroke="#ffd54f" stroke-width="1.8"/>
        ${[1, -1].map(s => `<g transform="translate(32 0) scale(${s} 1)"><path d="M-2 26 C-10 24 -20 18 -26 4 C-21 7 -19 6 -17 8 C-17 4 -15 2 -13 1 C-12 6 -9 11 -3 17 Z" fill="#ffd54f"/><path d="M-6 20 C-12 16 -16 12 -19 7 M-5 15 C-9 11 -11 8 -13 4" stroke="#e0a82e" stroke-width="1.6"/></g>`).join('')}
        <path d="M27 20 C27 13 37 13 37 20 L36 31 L32 35 L28 31 Z" fill="#ffd54f"/><circle cx="34" cy="12" r="5" fill="#ffd54f"/><path d="M38 10 L43 12.5 L38 15 Z" fill="#ff8f00" stroke-width="2"/>
        <circle cx="35" cy="11" r="1.2" fill="${ICON_OUTLINE}" stroke="none"/><rect x="22" y="33" width="20" height="4.5" rx="1.5" fill="#e0a82e"/>${shine(30, 20, 2, 3.5, 20)}`,
    spartans: `<path d="M8 34 C8 14 56 14 56 34 L56 46 C50 50 46 56 44 60 L20 60 C18 56 14 50 8 46 Z" fill="#e0a82e"/>
        <path d="M24 34 L24 50 M40 34 L40 50" stroke-width="4"/><path d="M14 30 L50 30" stroke-width="4"/>
        <path d="M10 18 C14 4 50 4 54 18 C46 12 18 12 10 18 Z" fill="#1565c0"/>${shine(20, 26, 4, 2.5)}`,
    // 蠍弩：一支粗弩箭斜斜穿過小怪、釘進裂開的地面
    scorpio: `<ellipse cx="34" cy="54" rx="26" ry="7" fill="#6d4c41"/><ellipse cx="30" cy="52" rx="14" ry="3" fill="#8d6e63" stroke="none"/>`
        + `<g transform="translate(7.3 9.6) scale(0.8)"><path d="${GHOST_PATH}" fill="#b39ddb" stroke-width="3"/>
            <path d="M22 23 L29 30 M29 23 L22 30 M35 23 L42 30 M42 23 L35 30" stroke-width="3"/></g>`
        + arrow(18, 0, 41, 54, STEEL, '#42a5f5', 1.45)
        + `<ellipse cx="41" cy="54.5" rx="7" ry="3" fill="#2e1f17" stroke-width="2.2"/>
        <path d="M33 56 L26 60 M49 55 L57 58 M46 52 L53 48 M36 52 L30 49" stroke-width="2.2"/>
        <circle cx="51" cy="45" r="3" fill="#bcaaa4" stroke-width="2"/><circle cx="56" cy="50" r="2.2" fill="#bcaaa4" stroke-width="1.8"/><circle cx="28" cy="46" r="2.2" fill="#bcaaa4" stroke-width="1.8"/>`,
    // 刀槍不入：金色護身符文（ᛉ）擋住砍來的劍和刺來的槍，兩把都斷成兩截
    unbreakable: `<circle cx="32" cy="32" r="18" fill="#ffca28"/><circle cx="32" cy="32" r="12" fill="#fff3c4" stroke-width="2.5"/>
        <path d="M32 23 L32 42 M32 31 L25 24 M32 31 L39 24" stroke-width="3.5"/><path d="M32 23 L32 42 M32 31 L25 24 M32 31 L39 24" stroke="#e65100" stroke-width="1.6"/>`
        + placeAt(3, 59, -45, `<circle cx="-3" cy="0" r="3.4" fill="${BRASS}" stroke-width="2.2"/><rect x="-1" y="-2.6" width="11" height="5.2" rx="2" fill="${GRIP}" stroke-width="2.2"/>`
            + `<rect x="9" y="-8" width="4.5" height="16" rx="2" fill="${BRASS}" stroke-width="2.2"/><path d="M13.5 -4.5 L24 -4.5 L26 -1 L23.5 0.5 L25 4.5 L13.5 4.5 Z" fill="${STEEL}" stroke-width="2.4"/>`
            + `<path d="M15.5 -2.4 L22 -2.4" stroke="${EDGE_SHINE}" stroke-width="1.2"/>`)
        + placeAt(13, 15, -135, `<path d="M0 -4.5 L9 -4.5 L16 0 L9 4.5 L0 4.5 L2 1.5 L-1 0 Z" fill="${STEEL}" stroke-width="2.3"/><path d="M2 -2.4 L9 -2.4" stroke="${EDGE_SHINE}" stroke-width="1.2"/>`)
        + placeAt(63, 22, 156, rodL(13, 5, WOOD) + `<path d="M12 -2.5 L16 -3.5 L14 -0.5 L17 1 L13.5 2.5" fill="${WOOD}" stroke-width="2"/>`)
        + placeAt(54, 6, -70, spearHeadL(13, 4.8))
        + `${[[20, 22], [46, 21], [21, 44]].map(([x, y]) => `<path d="${starPath(x, y, 5, 1.8, 4)}" fill="#fff8e1" stroke-width="1.6"/>`).join('')}${shine(26, 25, 3, 2)}`,
    // ---- 德魯伊（druid.js）----
    // 大招「野性化身」：熊掌印
    bearform: `<ellipse cx="32" cy="42" rx="16" ry="14" fill="#8d6e63"/>${[[14, 24, -20], [24, 15, -8], [40, 15, 8], [50, 24, 20]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="8" transform="rotate(${r} ${x} ${y})" fill="#8d6e63"/><path d="M${x} ${y - 8} L${x + r / 6} ${y - 14}" stroke-width="3"/>`).join('')}
        <ellipse cx="32" cy="44" rx="9" ry="7" fill="#a1887f" stroke="none"/>${shine(26, 38, 4, 2.5)}`,
    // 流派「荒野」：一叢帶刺的藤
    // 荊棘之冠：一圈編起來的帶刺藤冠
    thorns: `${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6 + 0.2, c = Math.cos(a), s = Math.sin(a); const bx = 32 + c * 23, by = 34 + s * 13; return `<path d="M${(bx - s * 3).toFixed(1)} ${(by + c * 2).toFixed(1)} L${(32 + c * 31).toFixed(1)} ${(34 + s * 20).toFixed(1)} L${(bx + s * 3).toFixed(1)} ${(by - c * 2).toFixed(1)} Z" fill="#f1ead6" stroke-width="2"/>`; }).join('')}
        <ellipse cx="32" cy="34" rx="23" ry="13" stroke-width="10"/><ellipse cx="32" cy="34" rx="23" ry="13" stroke="#6d4c41" stroke-width="6"/>
        <path d="M9 34 C14 26 20 30 26 22 C32 28 38 20 44 23 C48 27 52 26 55 34 M11 40 C18 47 24 41 30 47 C36 42 42 48 48 44 C52 42 54 40 55 36" stroke="#7cb342" stroke-width="2.5"/>
        ${[[14, 28], [40, 21], [22, 46], [50, 43]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.4" transform="rotate(-25 ${x} ${y})" fill="#9ccc65" stroke-width="1.8"/>`).join('')}`,
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
    // 巨熊
    bearHide: `<path d="M8 22 C8 10 20 6 32 6 C44 6 56 10 56 22 L56 44 C56 54 46 60 32 60 C18 60 8 54 8 44 Z" fill="#795548"/><circle cx="14" cy="10" r="6" fill="#795548"/><circle cx="50" cy="10" r="6" fill="#795548"/>
        <path d="M18 26 L46 26 M16 36 L48 36 M18 46 L46 46" stroke="#5d4037" stroke-width="3"/><path d="M26 20 L26 50 M38 20 L38 50" stroke="#a1887f" stroke-width="2"/>${shine(18, 18, 4, 2.5)}`,
    bearMaul: `<ellipse cx="26" cy="40" rx="15" ry="13" fill="#8d6e63"/>${[[12, 24, -20], [22, 17, -8], [34, 18, 8], [42, 27, 20]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="7" transform="rotate(${r} ${x} ${y})" fill="#8d6e63"/>`).join('')}
        <ellipse cx="26" cy="42" rx="8" ry="6" fill="#a1887f" stroke="none"/>${[0, 1, 2].map(i => `<path d="M${42 + i * 6} ${10 + i * 3} L${52 + i * 4} ${30 + i * 4}" stroke="#ffccbc" stroke-width="3"/>`).join('')}`,
    // 熊耳朵的時鐘：化身撐更久
    bearTime: `<circle cx="13" cy="15" r="8" fill="#8d6e63"/><circle cx="51" cy="15" r="8" fill="#8d6e63"/><circle cx="32" cy="36" r="24" fill="#8d6e63"/><circle cx="32" cy="36" r="17" fill="#fff3e0"/>
        <path d="M32 24 L32 36 L41 41" stroke-width="4"/>${[0, 1, 2, 3].map(i => { const a = i * Math.PI / 2; return `<circle cx="${(32 + Math.cos(a) * 13).toFixed(1)}" cy="${(36 + Math.sin(a) * 13).toFixed(1)}" r="1.6" fill="#1b1424" stroke="none"/>`; }).join('')}`,
    // 荒野
    seedPower: `${[[20, 24, -140], [44, 24, -40], [18, 44, 160], [46, 44, 20], [32, 16, -90], [32, 56, 90]].map(([x, y, r]) => { const c = Math.cos(r * Math.PI / 180), s = Math.sin(r * Math.PI / 180); return `<path d="M${(x - s * 4).toFixed(1)} ${(y + c * 4).toFixed(1)} L${(x + c * 10).toFixed(1)} ${(y + s * 10).toFixed(1)} L${(x + s * 4).toFixed(1)} ${(y - c * 4).toFixed(1)} Z" fill="#c5e1a5" stroke-width="2.5"/>`; }).join('')}
        <ellipse cx="32" cy="36" rx="14" ry="18" fill="#7cb342"/><path d="M32 20 L32 52" stroke="#33691e" stroke-width="2.5"/>
        <circle cx="44" cy="52" r="6" fill="#ab47bc" stroke-width="2.5"/>${shine(26, 28, 3, 5, 20)}`,
    // 纏根：從地裡竄出的根把一隻怪的下半身綁住
    seedRoot: `<ellipse cx="32" cy="58" rx="26" ry="4.5" fill="#5d4037" stroke-width="2.5"/>` + foe(32, 28, 0.85)
        + duoStroke('M10 58 C12 48 22 50 26 42 C30 36 40 40 44 34 C46 30 50 30 52 32', '#8d6e63', 3.5) + duoStroke('M54 58 C52 48 42 50 38 44 C34 38 24 42 18 36 C16 34 13 34 12 36', '#7cb342', 3.5)
        + `${[[52, 32], [12, 36], [30, 39]].map(([x, y]) => `<ellipse cx="${x}" cy="${y - 4}" rx="2.4" ry="4" transform="rotate(30 ${x} ${y - 4})" fill="#9ccc65" stroke-width="1.6"/>`).join('')}`,
    // 撒種：三顆橡實一起拋出去
    seedCount: `<path d="M8 58 C10 46 14 40 18 36 M30 60 C30 48 32 36 32 26 M54 58 C52 46 50 40 46 36" stroke="#c5e1a5" stroke-width="2.5" stroke-dasharray="3 4"/>`
        + acorn(16, 32, 1.1, -25) + acorn(32, 20, 1.2, 0) + acorn(48, 32, 1.1, 25) + duoStroke('M54 4 L54 16 M48 10 L60 10', '#81c784', 3),
    // 蔓生：橡實外面長出一圈帶葉的藤，四個方向往外推
    seedRadius: `<circle cx="32" cy="34" r="20" stroke-width="6.5"/><circle cx="32" cy="34" r="20" stroke="#7cb342" stroke-width="3"/>
        ${[0, 1, 2, 3, 4, 5].map(i => { const a = i * Math.PI / 3 + 0.5, x = 32 + Math.cos(a) * 20, y = 34 + Math.sin(a) * 20; return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="5" ry="2.8" transform="rotate(${(a * 180 / Math.PI + 60).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="#9ccc65" stroke-width="1.8"/>`; }).join('')}
        ${[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => duoStroke(`M${32 + sx * 18} ${34 + sy * 18} l${sx * 8} ${sy * 8} m${-sx * 6} 0 l${sx * 6} 0 l0 ${-sy * 6}`, '#ffd54f', 2.2)).join('')}` + acorn(32, 35, 1.25),
    // 四大節
    festPower: `<path d="M20 60 L24 26 L40 26 L44 60 Z" fill="#eceff1"/><path d="M24 26 C24 16 40 16 40 26" fill="#eceff1"/><circle cx="32" cy="14" r="8" fill="#ffe0b2"/>
        <path d="M12 8 L20 20 M52 8 L44 20" stroke="#ffd54f" stroke-width="3"/><path d="M16 40 L8 30" stroke-width="4"/><path d="M8 30 C4 24 10 20 12 24" fill="#9ccc65" stroke-width="2.5"/>
        <path d="M44 38 L56 34" stroke-width="4"/><path d="M56 30 C60 30 60 38 56 38" stroke="#ffd54f" stroke-width="3"/>`,
    // 餘韻：四節之輪上，這一節跟上一節同時亮著（其餘兩節暗），一道箭頭從上一節繞過來
    festLinger: `<circle cx="32" cy="34" r="24" fill="#3e2723"/>${['#b388ff', '#b2ff59', '#ff7043', '#ffd54f'].map((c, i) => { const a0 = i * Math.PI / 2 - Math.PI / 2, a1 = a0 + Math.PI / 2; return `<path d="M32 34 L${(32 + Math.cos(a0) * 20).toFixed(1)} ${(34 + Math.sin(a0) * 20).toFixed(1)} A20 20 0 0 1 ${(32 + Math.cos(a1) * 20).toFixed(1)} ${(34 + Math.sin(a1) * 20).toFixed(1)} Z" fill="${c}" stroke-width="2.5" opacity="${i < 2 ? 1 : 0.3}"/>`; }).join('')}
        <circle cx="32" cy="34" r="5" fill="#ffecb3" stroke-width="2.5"/>` + duoStroke('M8 22 A27 27 0 0 1 40 6', '#fff3c4', 2.5) + `<path d="M44 7 L37 1 L36 11 Z" fill="#fff3c4" stroke-width="2"/>`,
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
    // 狼母：灰色的母狼低頭，銀白小狼依偎在牠下巴前，地上一片新葉
    wolfMother: `<path d="M4 58 C14 52 50 52 60 58" stroke-width="4"/><path d="M4 58 C14 52 50 52 60 58" stroke="#7cb342" stroke-width="2"/>
        <g transform="translate(24 28) scale(1.75)"><path d="M-12 8 L-12 -6 L-8 -14 L-4 -6 L4 -6 L8 -14 L12 -6 L12 8 C8 14 -8 14 -12 8 Z" fill="#90a4ae" stroke-width="2.3"/>
            <path d="M-9 -9 L-8 -12 L-6 -7 Z M9 -9 L8 -12 L6 -7 Z" fill="#cfd8dc" stroke="none"/><path d="M-7 1 C-5 -0.5 -3 -0.5 -2 1 M2 1 C3 -0.5 5 -0.5 7 1" stroke-width="1.5"/>
            <path d="M-4 6 C-2 9 2 9 4 6 C2 4 -2 4 -4 6 Z" fill="#eceff1" stroke-width="1.3"/><circle cx="0" cy="5.6" r="1.4" fill="#1b1424" stroke="none"/></g>
        <g transform="translate(46 46) scale(0.9)"><path d="M-12 8 L-12 -6 L-8 -14 L-4 -6 L4 -6 L8 -14 L12 -6 L12 8 C8 14 -8 14 -12 8 Z" fill="#eceff1"/>
            <path d="M-9 -9 L-8 -12 L-6 -7 Z M9 -9 L8 -12 L6 -7 Z" fill="#ffccbc" stroke="none"/><circle cx="-5" cy="0" r="2.4" fill="#1b1424" stroke="none"/><circle cx="5" cy="0" r="2.4" fill="#1b1424" stroke="none"/>
            <circle cx="-4.3" cy="-0.8" r="0.8" fill="#fff" stroke="none"/><circle cx="5.7" cy="-0.8" r="0.8" fill="#fff" stroke="none"/><circle cx="0" cy="6" r="1.8" fill="#1b1424" stroke="none"/></g>
        <path d="M54 22 C54 14 60 12 62 12 C62 18 58 22 54 22 Z" fill="#9ccc65" stroke-width="2"/><path d="M54 22 L50 28" stroke-width="2.2"/>`,
    // 綠人：一張由葉子圍成的臉，嘴裡吐出帶葉的藤
    greenMan: `${[[-150, 26], [-120, 27], [-90, 28], [-60, 27], [-30, 26], [180, 24], [0, 24], [150, 23], [30, 23]].map(([deg, r]) => { const a = deg * Math.PI / 180, x = 32 + Math.cos(a) * r * 0.82, y = 32 + Math.sin(a) * r * 0.85; return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="10" ry="5.5" transform="rotate(${deg} ${x.toFixed(1)} ${y.toFixed(1)})" fill="#558b2f" stroke-width="2.5"/><path d="M${(x - Math.cos(a) * 7).toFixed(1)} ${(y - Math.sin(a) * 7).toFixed(1)} L${(x + Math.cos(a) * 7).toFixed(1)} ${(y + Math.sin(a) * 7).toFixed(1)}" stroke="#aed581" stroke-width="1.4"/>`; }).join('')}
        <ellipse cx="32" cy="33" rx="15" ry="18" fill="#9ccc65"/><path d="M20 26 C24 22 28 22 30 26 M34 26 C36 22 40 22 44 26" stroke-width="2.6"/>
        <ellipse cx="25.5" cy="30" rx="2.6" ry="3" fill="#1b1424" stroke="none"/><ellipse cx="38.5" cy="30" rx="2.6" ry="3" fill="#1b1424" stroke="none"/><circle cx="26.3" cy="29" r="0.9" fill="#f1f8e9" stroke="none"/><circle cx="39.3" cy="29" r="0.9" fill="#f1f8e9" stroke="none"/>
        <path d="M32 31 L30 38 L34 38" stroke-width="2"/><ellipse cx="32" cy="43" rx="5" ry="3.5" fill="#33691e" stroke-width="2.2"/>`
        + duoStroke('M32 45 C30 52 38 54 44 56 C50 58 54 54 58 58', '#7cb342', 2.5)
        + `<ellipse cx="45" cy="52" rx="4" ry="2.2" transform="rotate(-30 45 52)" fill="#9ccc65" stroke-width="1.6"/><ellipse cx="55" cy="54" rx="4" ry="2.2" transform="rotate(20 55 54)" fill="#9ccc65" stroke-width="1.6"/>${shine(26, 22, 3, 2)}`,
    // 巨石陣：兩座三石門和一塊立石站在草地上，後面升起一輪夏至的太陽
    stonehenge: `<circle cx="32" cy="30" r="15" fill="#ffd54f"/>${Array.from({ length: 8 }, (_, i) => { const a = Math.PI + i * Math.PI / 7; return `<path d="M${(32 + Math.cos(a) * 19).toFixed(1)} ${(30 + Math.sin(a) * 19).toFixed(1)} L${(32 + Math.cos(a) * 25).toFixed(1)} ${(30 + Math.sin(a) * 25).toFixed(1)}" stroke="#ffd54f" stroke-width="3"/>`; }).join('')}
        <path d="M2 50 C16 46 48 46 62 50 L62 60 L2 60 Z" fill="#7cb342"/>
        ${[[4, 24], [40, 24]].map(([x, w]) => `<path d="M${x + 2} 52 L${x + 3} 32 L${x + 8} 32 L${x + 9} 52 Z M${x + w - 9} 52 L${x + w - 8} 32 L${x + w - 3} 32 L${x + w - 2} 52 Z" fill="#9e9e9e"/><rect x="${x}" y="26" width="${w}" height="7" rx="1.5" fill="#bdbdbd"/>
            <path d="M${x + 4} 34 L${x + 4.5} 49 M${x + w - 6} 34 L${x + w - 5.5} 49" stroke="#e0e0e0" stroke-width="1.6"/>`).join('')}
        <path d="M28 54 L29 38 C29 35 35 35 35 38 L36 54 Z" fill="#9e9e9e"/><path d="M30.5 40 L31 52" stroke="#e0e0e0" stroke-width="1.6"/>
        <path d="M6 53 C8 51 10 51 12 53 M50 53 C52 51 54 51 56 53 M28 55 C30 53 33 53 36 55" stroke="#558b2f" stroke-width="2"/>`,
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
    // 脈動：一滴血，前面跳著一道心跳線
    bmRate: `<path d="M32 4 C42 20 52 30 52 42 C52 54 43 60 32 60 C21 60 12 54 12 42 C12 30 22 20 32 4 Z" fill="#7e57c2"/>${shine(23, 30, 3, 5, 20)}` + duoStroke('M2 42 L16 42 L22 28 L30 54 L37 22 L43 42 L62 42', '#ede7f6', 3),
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
    // 血線：蝙蝠吸到的血沿著一條血流送回一滴血＋回血的加號
    batDrain: `<g transform="translate(20 18) scale(1.05)"><path d="M0 -4 C-8 -14 -22 -12 -24 -2 C-18 -6 -14 -2 -12 2 C-8 -2 -4 0 0 6 C4 0 8 -2 12 2 C14 -2 18 -6 24 -2 C22 -12 8 -14 0 -4 Z" fill="#4527a0" stroke-width="2.6"/><circle cx="-3" cy="-2" r="1.6" fill="#ffd54f" stroke="none"/><circle cx="3" cy="-2" r="1.6" fill="#ffd54f" stroke="none"/><path d="M-2 4 L-1.2 7 L-0.4 4 M0.4 4 L1.2 7 L2 4" fill="#fff" stroke-width="1"/></g>`
        + duoStroke('M20 26 C22 40 30 48 42 48', '#9575cd', 3.5) + `<path d="M50 34 C55 42 58 46 58 51 C58 56 54 59 50 59 C46 59 42 56 42 51 C42 46 45 42 50 34 Z" fill="#7e57c2"/>${shine(47, 47, 1.8, 3, 20)}`
        + duoStroke('M56 18 L56 30 M50 24 L62 24', '#81c784', 3),
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
    // 蝠群風暴：一圈紫色氣旋繞著一輪彎月，四隻蝙蝠順著氣旋飛
    batStorm: `<path d="M38 22 C30 22 26 28 26 34 C26 40 30 46 38 46 C32 44 30 39 30 34 C30 29 32 24 38 22 Z" fill="#fff3c4" stroke-width="2.5"/>`
        + duoStroke('M30 8 C46 7 56 16 57 28', '#7c4dff', 2.4) + duoStroke('M56 40 C52 52 42 58 32 58', '#b39ddb', 2.4)
        + duoStroke('M20 55 C10 49 6 40 7 30', '#7c4dff', 2.4) + duoStroke('M9 20 C13 13 18 10 22 9', '#b39ddb', 2.4)
        + `${[[32, 9, 0.62, 10], [56, 33, 0.62, 100], [27, 57, 0.62, 190], [8, 25, 0.62, 280]].map(([x, y, s, r]) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M0 -4 C-8 -14 -22 -12 -24 -2 C-18 -6 -14 -2 -12 2 C-8 -2 -4 0 0 6 C4 0 8 -2 12 2 C14 -2 18 -6 24 -2 C22 -12 8 -14 0 -4 Z" fill="#4527a0" stroke-width="4"/><circle cx="-3" cy="-2" r="2" fill="#ffd54f" stroke="none"/><circle cx="3" cy="-2" r="2" fill="#ffd54f" stroke="none"/></g>`).join('')}`,
    // 月狼：銀紫色的狼仰頭對著彎月嚎叫，前面三道爪痕
    moonWolf: `<path d="M58 3 C51 3 46 8 46 15 C46 22 51 27 58 27 C54 24 52 20 52 15 C52 10 54 6 58 3 Z" fill="#fff3c4" stroke-width="2.5"/>
        <path d="M8 60 C8 50 9 42 12 34 C13 28 14 24 16 20 L14 7 L22 15 L30 11 L42 5 L38 12 L31 19 C29 24 28 28 30 34 C32 42 33 52 34 60 Z" fill="#9e94bc"/>
        <path d="M15.5 17 L15 10 L20 15 Z" fill="#e1d5ff" stroke="none"/><path d="M38 12 L32 15" stroke-width="2"/><circle cx="25" cy="16" r="1.9" fill="#ffd54f" stroke="none"/>
        <path d="M16 36 C18 44 20 50 20 58 M24 38 C25 46 26 52 26 58" stroke="#e1d5ff" stroke-width="1.8"/><path d="M44 3 L47 1 M45 8 L49 8" stroke="#e1d5ff" stroke-width="1.8"/>`
        + `${[0, 1, 2].map(i => duoStroke(`M${40 + i * 7} ${38 + i * 2} C${48 + i * 6} ${44 + i * 2} ${50 + i * 5} ${52 + i * 2} ${46 + i * 5} ${60}`, '#b39ddb', 2.6)).join('')}`,
    // ---- 精靈弓箭手（elf.js）----
    // 大招「箭雨」
    arrowrain: `<path d="M10 20 C2 20 2 8 12 8 C14 0 30 0 32 6 C38 0 52 2 52 10 C62 10 62 20 54 20 Z" fill="#90a4ae"/>
        ${[[14, 26], [28, 32], [42, 26], [21, 44], [36, 46], [50, 40]].map(([x, y]) => `<path d="M${x} ${y - 10} L${x} ${y + 6}" stroke-width="5"/><path d="M${x} ${y - 10} L${x} ${y + 6}" stroke="#a1887f" stroke-width="2.5"/><path d="M${x} ${y + 12} L${x - 4} ${y + 4} L${x + 4} ${y + 4} Z" fill="#eceff1" stroke-width="2"/>`).join('')}`,
    // 流派
    // 流派「帕提亞」：往左回身射，人往右跑
    parthian: bow(44, 30, 22, 180) + arrow(50, 30, 6, 30) + duoStroke('M28 54 L54 54 M48 49 L54 54 L48 59', '#80cbc4', 2.5),
    // 流派「長弓」：一把高過人的長弓搭著箭
    longbow: bow(20, 32, 28, 0, '#6d4c41') + arrow(10, 32, 60, 32),
    // 流派「元素」：火、冰、雷三支箭
    elemental: arrow(20, 60, 10, 8, '#ff7043', '#ffccbc') + arrow(32, 62, 32, 4, '#81d4fa', '#e1f5fe') + arrow(44, 60, 54, 8, '#fff176', '#fff9c4'),
    // 張開的捕獸夾
    trapper: `<ellipse cx="32" cy="50" rx="26" ry="8" fill="#5d4037"/><path d="M8 48 C8 24 24 14 32 14 C40 14 56 24 56 48" fill="none" stroke-width="8"/><path d="M8 48 C8 24 24 14 32 14 C40 14 56 24 56 48" fill="none" stroke="#90a4ae" stroke-width="4"/>
        ${[16, 24, 32, 40, 48].map(x => `<path d="M${x - 4} ${x === 32 ? 18 : x === 24 || x === 40 ? 21 : 28} L${x} ${x === 32 ? 28 : x === 24 || x === 40 ? 31 : 38} L${x + 4} ${x === 32 ? 18 : x === 24 || x === 40 ? 21 : 28}" fill="#eceff1" stroke-width="2"/>`).join('')}
        <circle cx="32" cy="50" r="6" fill="#ffcc80" stroke-width="2.5"/>`,
    // 回馬射
    // 回身一箭：往左射出的箭在箭尖爆出一團金光
    backPower: `<path d="${starPath(11, 32, 11, 4.5, 8)}" fill="#ffd54f" stroke-width="2"/>` + bow(48, 32, 22, 180) + arrow(52, 32, 10, 32, '#eceff1', '#a5d6a7', 1.1),
    // 馬上連珠：三支箭一支接一支往前飛，尾巴拖著速度線
    moveRate: arrow(4, 16, 40, 16) + arrow(14, 32, 50, 32) + arrow(24, 48, 60, 48) + `<path d="M2 26 L10 26 M10 42 L18 42 M4 58 L14 58" stroke="#80cbc4" stroke-width="2.5"/>`,
    // 輕盈：精靈的綠靴子長出一片葉子翅膀
    stride: `<path d="M18 10 L32 10 L32 36 C40 38 48 40 52 44 C56 48 54 54 48 54 L18 54 C16 54 15 52 15 50 Z" fill="#81c784"/><path d="M16 18 L33 18" stroke-width="5"/><path d="M16 18 L33 18" stroke="#c5e1a5" stroke-width="2.4"/>
        <path d="M15 48 L54 48" stroke-width="3"/><path d="M33 13 C40 2 54 2 60 10 C52 10 47 14 43 20 C47 18 53 18 57 22 C49 25 41 25 34 22 Z" fill="#c5e1a5"/><path d="M35 18 C43 12 50 9 57 10" stroke="#7cb342" stroke-width="1.6"/>
        ${shine(22, 28, 2.5, 6, 0)}<path d="M2 30 L11 30 M4 40 L12 40" stroke="#8fd3ff" stroke-width="3"/>`,
    // 絆腳箭：往回射的箭纏著一條帶兩顆鉛墜的繩，打中就絆住
    // 絆腳箭：往回射的箭插在怪身上，箭尾的繩子把牠的腳綁住
    backSlow: foe(22, 30, 0.85) + duoStroke('M8 50 C14 54 30 54 36 50 M10 44 C16 48 28 48 34 44', '#4fc3f7', 2.4)
        + arrow(62, 20, 24, 30) + duoStroke('M40 26 C44 34 40 42 34 46', '#4fc3f7', 2),
    // 長弓
    bowRangeUp: bow(20, 44, 16, -45, '#8d6e63') + `<path d="M28 36 Q36 16 48 14" stroke-width="5" stroke-dasharray="4 4"/><path d="M26 38 Q36 16 48 14" stroke="#ffd54f" stroke-width="2.5" stroke-dasharray="4 4"/>`
        + `<circle cx="54" cy="12" r="8" fill="#42a5f5"/><circle cx="54" cy="12" r="4.5" fill="#fff8e1" stroke-width="2"/><circle cx="54" cy="12" r="1.6" fill="#42a5f5" stroke="none"/>`,
    // 紫杉弓：深色紫杉木的弓，掛著一枝紫杉葉
    // 紫杉弓：深色紫杉木的弓，握把上綁著一枝紫杉葉
    bowPowerUp: bow(22, 32, 28, 0, '#6d4c41') + placeAt(26, 30, -35, rodL(20, 3, '#33691e'))
        + `${[[32, 24, 30], [36, 22, -60], [38, 18, 30], [42, 17, -60], [43, 13, 30]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="4.2" ry="1.9" transform="rotate(${r} ${x} ${y})" fill="#7cb342" stroke-width="1.6"/>`).join('')}`
        + duoStroke('M52 58 L52 40 M46 46 L52 40 L58 46', '#ffd54f', 3),
    // 遠距：箭往前飛，後面三道越來越粗的力道
    farShot: arrow(4, 32, 42, 32, '#eceff1') + `${[48, 54, 60].map((x, i) => duoStroke(`M${x} ${24 - i * 4} L${x} ${40 + i * 4}`, '#ffd54f', 1.6 + i)).join('')}`,
    // 齊射：三支箭並排射出
    volley: arrow(6, 34, 52, 12, STEEL, '#a5d6a7', 0.95) + arrow(6, 38, 58, 34, STEEL, '#a5d6a7', 0.95) + arrow(6, 42, 52, 56, STEEL, '#a5d6a7', 0.95),
    // 元素箭
    fireArrow: `<path d="M48 36 C38 36 35 27 39 20 C41 16 41 12 39 5 C48 9 53 16 53 22 C57 26 56 36 48 36 Z" fill="#ff7043" stroke-width="2.5"/><path d="M47 31 C42 31 41 26 43 22 C45 25 47 22 47 18 C51 21 52 27 47 31 Z" fill="#ffd54f" stroke="none"/>`
        + arrow(6, 58, 52, 12, '#ffab91', '#ffccbc'),
    iceArrow: arrow(6, 58, 48, 16, '#b3e5fc', '#e1f5fe') + `<path d="M58 6 L50 9 L44 18 L54 12 Z" fill="#e1f5fe" stroke-width="2"/>` + duoStroke('M46 30 L46 54 M36 36 L56 48 M36 48 L56 36', '#81d4fa', 2.5),
    thunderArrow: arrow(6, 58, 50, 14, '#fff59d', '#fff9c4') + boltAt(46, 42) + duoStroke('M56 22 L62 18 M50 6 L52 1', '#fff176', 2),
    elemSurge: `${[['#ff7043', 0], ['#4fc3f7', 120], ['#fff176', 240]].map(([c, a]) => { const r = a * Math.PI / 180; return `<circle cx="${(32 + Math.cos(r) * 14).toFixed(1)}" cy="${(34 + Math.sin(r) * 14).toFixed(1)}" r="11" fill="${c}" stroke-width="2.5"/>`; }).join('')}
        <circle cx="32" cy="34" r="6" fill="#ffffff" stroke-width="2.5"/>${duoStroke('M32 4 L32 14 M27 9 L32 4 L37 9', '#ffd54f', 2.5)}`,
    // 陷阱
    // 多備幾個：一疊捕獸夾＋加號
    trapCount: smallTrap(18, 44, 0.85) + smallTrap(42, 48, 0.85) + smallTrap(28, 26, 0.85) + duoStroke('M54 6 L54 18 M48 12 L60 12', '#81c784', 3),
    trapPower: `<path d="M18 22 L46 22 L52 54 L12 54 Z" fill="#5d4037"/><path d="M14 30 L50 30" stroke="#ffd54f" stroke-width="3"/><path d="M32 22 C32 14 38 10 44 8" stroke-width="3"/>
        <path d="${starPath(46, 8, 7, 3, 6)}" fill="#ff7043" stroke-width="2"/>`,
    // 一路腳印，每隔幾步一個陷阱
    trapRate: `${[[8, 54], [18, 44], [28, 36], [38, 26], [48, 18], [56, 8]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.5" ry="5" transform="rotate(40 ${x} ${y})" fill="#a5d6a7" stroke-width="2"/>`).join('')}` + smallTrap(34, 50, 0.6) + smallTrap(54, 34, 0.6),
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
    // 風神之弓：淡青色的弓，射出的箭沿著一道彎的風追過去
    windBow: bow(16, 32, 26, 0, '#80deea') + `<path d="M24 32 C40 32 44 12 58 14" stroke="#b2ebf2" stroke-width="3" stroke-dasharray="4 4"/>`
        + duoStroke('M34 46 C44 40 54 44 52 52 C50 58 42 54 46 50', '#b2ebf2', 2.5) + arrow(46, 20, 60, 12, '#e0f7fa', '#b2ebf2', 0.7),
    // 月光箭：新月射出一支發光的箭，貫穿整個畫面
    moonArrow: `<path d="M38 4 C24 6 14 16 14 28 C14 40 24 48 36 48 C28 44 22 36 22 28 C22 18 30 10 38 4 Z" fill="#fff3c4"/>${shine(20, 22, 2, 5, 15)}
        <path d="M4 60 L60 8" stroke="#e3f2fd" stroke-width="9" opacity="0.45"/>` + arrow(4, 60, 60, 8, '#fff8e1', '#e3f2fd'),
    // 不歸之箭：箭打倒第一隻，順著虛線彈到下一隻、再下一隻
    noReturn: foe(26, 30, 0.42, '#78909c') + foe(52, 26, 0.38) + foe(44, 52, 0.38)
        + `<path d="M30 26 C38 16 46 18 48 22 M54 32 C56 40 52 46 48 48" stroke="#ffd54f" stroke-width="3" stroke-dasharray="4 3"/>` + arrow(2, 52, 24, 32, STEEL, '#a5d6a7', 0.85)
        + `<path d="${starPath(26, 30, 6, 2.2, 4)}" fill="#ffd54f" stroke-width="1.6"/>`,
    // 獵人之網：一張繩網罩住小怪，邊緣綁著鉛墜釘在地上
    hunterNet: `<ellipse cx="32" cy="56" rx="27" ry="5" fill="#5d4037"/>`
        + `<g transform="translate(4 8) scale(0.88)"><path d="${GHOST_PATH}" fill="#b39ddb" stroke-width="3"/><path d="M21 23 L28 30 M28 23 L21 30 M36 23 L43 30 M43 23 L36 30" stroke-width="3"/></g>`
        + `${(() => {
            // 菱形網眼：兩組斜線，只取落在半橢圓網罩（底邊 y=55）裡的那一段
            const inside = (x, y) => y <= 55 && ((x - 32) / 25) ** 2 + ((y - 55) / 44) ** 2 <= 1;
            const segs = [];
            for (const s of [1, -1]) for (let c = -66; c <= 66; c += 12) {
                let a = null, b = null;
                for (let t = 0; t <= 64; t += 0.5) { const x = 32 + s * (t - 32) + c, y = t; if (inside(x, y)) { if (!a) a = [x, y]; b = [x, y]; } }
                if (a && b && Math.hypot(b[0] - a[0], b[1] - a[1]) > 3) segs.push(`M${a[0].toFixed(1)} ${a[1].toFixed(1)} L${b[0].toFixed(1)} ${b[1].toFixed(1)}`);
            }
            const d = segs.join(' '), rim = 'M7 55 C7 26 18 11 32 11 C46 11 57 26 57 55';
            return `<path d="${d}" stroke-width="3.2"/><path d="${d}" stroke="#d7ccc8" stroke-width="1.5"/><path d="${rim}" stroke-width="4.5"/><path d="${rim}" stroke="#a1887f" stroke-width="2.2"/>`;
        })()}
        <circle cx="32" cy="11" r="3.5" fill="#a1887f" stroke-width="2"/>${[7, 19, 45, 57].map(x => `<circle cx="${x}" cy="55" r="3.4" fill="#546e7a" stroke-width="2"/>`).join('')}`,
    // 狐火：靈狐的頭，身邊飄著兩團青藍色的狐火
    foxfire: `<path d="M10 22 L14 4 L26 16 L38 16 L50 4 L54 22 C56 34 46 46 32 50 C18 46 8 34 10 22 Z" fill="#ffb74d"/>
        <path d="M14 8 L16 16 L22 15 Z M50 8 L48 16 L42 15 Z" fill="#fff3e0" stroke="none"/>
        <path d="M12 26 C18 36 26 40 32 48 C38 40 46 36 52 26 C46 30 40 32 32 32 C24 32 18 30 12 26 Z" fill="#fff8e1" stroke-width="2.5"/>
        <path d="M20 22 C22 20 26 20 28 23 M36 23 C38 20 42 20 44 22" stroke-width="3"/><circle cx="32" cy="38" r="2.6" fill="#1b1424" stroke="none"/>`
        + `${[[9, 50, 0.42], [55, 46, 0.36]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s}) translate(-32 -36)"><path d="M32 58 C17 58 11 46 15 35 C18 27 24 24 25 14 C34 20 37 26 37 32 C41 28 42 23 41 17 C51 26 54 38 50 47 C47 54 40 58 32 58 Z" fill="#26c6da" stroke-width="${(2.4 / s).toFixed(1)}"/>
            <path d="M32 53 C25 53 22 47 25 41 C27 37 31 35 32 30 C37 35 40 40 39 46 C38 50 36 53 32 53 Z" fill="#e0f7fa" stroke="none"/></g>`).join('')}`,
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
    // 要害：飛刀的刀尖閃出會心一擊的星
    critChance: `<path d="${starPath(46, 18, 14, 5, 4)}" fill="#ffd740" stroke-width="2.5"/>${shine(42, 14, 2, 1.5)}` + placeAt(10, 56, -48, throwKnifeL(40)),
    // 致命：飛刀插進一大團爆開的金光，旁邊往上的箭頭
    critDamage: `<path d="${starPath(40, 24, 20, 9, 10)}" fill="#ffab00" stroke-width="2.5"/><path d="${starPath(40, 24, 10, 5, 10)}" fill="#fff8e1" stroke="none"/>` + placeAt(6, 58, -45, throwKnifeL(40))
        + duoStroke('M54 60 L54 46 M48 52 L54 46 L60 52', '#ffd740', 3),
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
    // 迷魂毒：中毒發綠的小怪，眼睛轉成漩渦、咧嘴傻笑，頭上一圈毒綠漩渦和兩顆星
    madVenom: `<g transform="translate(0 10)"><path d="${GHOST_PATH}" fill="#9ccc65"/>
            <path d="M25 27 m-1 0 a1 1 0 1 1 2 0 a3 3 0 1 1 -5 -1 a5 5 0 1 1 8 3 M40 27 m-1 0 a1 1 0 1 1 2 0 a3 3 0 1 1 -5 -1 a5 5 0 1 1 8 3" stroke-width="2.4"/>
            <path d="M23 38 L27 41 L31 38 L35 41 L39 38" stroke-width="2.6"/><path d="M20 15 C24 12 28 12 30 15" stroke="#dcedc8" stroke-width="2.4"/></g>
        <path d="M53 44 C53 48 55 50 55 52 C55 55 51 55 51 52 C51 50 53 48 53 44 Z" fill="#76ff03" stroke-width="1.8"/>`
        + duoStroke('M32 12 C35 12 36 9 33.5 7.5 C30 6 26 9 27.5 13 C29 17 37 17 39 11 C40.5 6 35 2 29 3.5', '#b2ff59', 2.4)
        + `${[[14, 8], [50, 9]].map(([x, y]) => `<path d="${starPath(x, y, 5, 2, 4)}" fill="#fff59d" stroke-width="1.6"/>`).join('')}`,
    // 移形換影：刺客和一個紫色影子，中間上下兩道弧形箭頭互相指向對方
    shadowSwap: `${[[15, 40, '#455a64', 1], [49, 40, '#7e57c2', 0.75]].map(([x, y, c, o]) => `<g transform="translate(${x} ${y}) scale(0.8)" opacity="${o}"><path d="M-12 22 L-12 0 C-12 -6 -8 -10 0 -24 C8 -10 12 -6 12 0 L12 22 Z" fill="${c}"/>
            <ellipse cx="0" cy="-8" rx="6" ry="5" fill="#1b1424" stroke="none"/><path d="M-4 -9 L-1.5 -7.5 M4 -9 L1.5 -7.5" stroke="#ffd740" stroke-width="2"/></g>`).join('')}`
        + duoStroke('M18 14 C24 4 40 4 46 14', '#b39ddb', 3) + `<path d="M50 20 L42 15 L49 10 Z" fill="#b39ddb" stroke-width="2"/>`
        + duoStroke('M46 60 C40 64 24 64 18 58', '#b39ddb', 3) + `<path d="M13 53 L22 56 L16 62 Z" fill="#b39ddb" stroke-width="2"/>`,
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
    // 無盡連打：拳頭打出一串越來越大的打擊星，最上面那顆還在往上長
    comboCap: fistAt(22, 42, 0.72) + `${[[42, 46, 5], [48, 32, 6.5], [54, 16, 8]].map(([x, y, r]) => `<path d="${starPath(x, y, r, r * 0.42, 6)}" fill="#ffb74d" stroke-width="2"/>`).join('')}` + duoStroke('M44 10 L44 2 M40 6 L44 2 L48 6', '#ffd54f', 2.2),
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
    // 縱躍：武僧沿著一道長弧跳出去，身後留著殘影
    blinkRange: `<path d="M10 56 Q30 0 52 50" stroke="#b2ebf2" stroke-width="3" stroke-dasharray="4 4"/>` + monkAt(12, 46, 0.7, 0.3) + monkAt(28, 26, 0.8, 0.55) + monkAt(50, 42, 1)
        + `<ellipse cx="50" cy="58" rx="9" ry="2.5" fill="#b2ebf2" stroke="none" opacity="0.6"/>`,
    evade: `<path d="M24 58 L24 34 C24 26 30 22 36 22 C42 22 46 26 46 34 L46 58" fill="#ffcc80"/><circle cx="36" cy="14" r="7" fill="#ffcc80"/><path d="M4 30 L22 36" stroke="#e53935" stroke-width="3"/><path d="M22 36 L14 30 M22 36 L14 40" stroke="#e53935" stroke-width="3"/>
        <path d="M50 30 C56 34 56 42 50 46" stroke="#b2ebf2" stroke-width="3"/>`,
    swift: `<path d="M24 14 L36 14 L36 38 L50 44 C56 46 56 54 50 54 L24 54 Z" fill="#8d6e63"/><path d="M24 44 L52 44" stroke-width="3"/><path d="M4 26 L16 26 M2 36 L14 36 M6 46 L18 46" stroke="#b2ebf2" stroke-width="3.5"/>`,
    // 踏影：一拳接一拳，前面兩拳還留著殘影
    quickStep: fistAt(16, 34, 0.55, 0.3) + fistAt(27, 34, 0.6, 0.55) + fistAt(42, 34, 0.7) + `<path d="M2 22 L10 22 M2 34 L8 34 M2 46 L10 46" stroke="#b2ebf2" stroke-width="2.5"/>`,
    // 內功
    zenHeal: `<path d="M12 50 C12 40 22 36 32 36 C42 36 52 40 52 50 Z" fill="#ffa726"/><circle cx="32" cy="24" r="10" fill="#ffcc80"/><path d="M28 24 L30 24 M34 24 L36 24" stroke-width="2"/>${duoStroke('M52 8 L52 22 M45 15 L59 15', '#81c784', 3)}`,
    zenCharge: `<circle cx="32" cy="32" r="22" stroke="#ffd54f" stroke-width="5" stroke-dasharray="100 40"/><path d="M12 48 C12 40 20 36 32 36 C44 36 52 40 52 48 Z" fill="#ffa726"/><circle cx="32" cy="24" r="8" fill="#ffcc80"/>`,
    zenFast: `<path d="M12 52 C12 42 22 38 32 38 C42 38 52 42 52 52 Z" fill="#ffa726"/><circle cx="32" cy="26" r="9" fill="#ffcc80"/>${boltAt(52, 18)}`,
    zenPulse: `${[24, 16].map(r => `<circle cx="32" cy="38" r="${r}" stroke="#ffd54f" stroke-width="3" opacity="${r === 24 ? 0.5 : 0.9}"/>`).join('')}<path d="M22 50 C22 42 26 38 32 38 C38 38 42 42 42 50 Z" fill="#ffa726"/><circle cx="32" cy="30" r="6" fill="#ffcc80"/>`,
    // 氣功
    qiPower: `<circle cx="32" cy="32" r="16" fill="#80deea"/><circle cx="32" cy="32" r="8" fill="#e0f7fa"/>${[0, 1, 2, 3, 4, 5].map(i => { const a = i * Math.PI / 3; return `<path d="M${(32 + Math.cos(a) * 20).toFixed(1)} ${(32 + Math.sin(a) * 20).toFixed(1)} L${(32 + Math.cos(a) * 28).toFixed(1)} ${(32 + Math.sin(a) * 28).toFixed(1)}" stroke="#80deea" stroke-width="3"/>`; }).join('')}`,
    // 雙掌：兩隻張開的手掌往前推，各推出一道氣功波
    qiCount: `${[[16, 44], [42, 50]].map(([x, y]) => `<circle cx="${x + 1}" cy="${y - 27}" r="8.5" fill="#80deea"/><circle cx="${x + 1}" cy="${y - 27}" r="4" fill="#e0f7fa" stroke="none"/><path d="M${x - 9} ${y - 36} C${x - 4} ${y - 42} ${x + 6} ${y - 42} ${x + 11} ${y - 36}" stroke="#80deea" stroke-width="2.2"/><g transform="translate(${x} ${y})"><path d="M-8 10 L-8 -10 C-8 -12.5 -4.5 -12.5 -4.5 -10 L-4.5 -3 L-3.5 -13 C-3.5 -15.5 0 -15.5 0 -13 L0 -3 L1 -12 C1 -14.5 4.5 -14.5 4.5 -12 L4.5 -2 L5.5 -8 C5.5 -10.5 9 -10.5 9 -8 L9 4 C9 10 5 14 0 14 C-5 14 -8 12 -8 10 Z" fill="#ffcc80" stroke-width="2.4"/><path d="M-8 3 L-13 -2 C-14.5 -4 -12 -6 -10.5 -4.5 L-8 -2" fill="#ffcc80" stroke-width="2.2"/></g>`).join('')}`,
    // 排山：又寬又厚的一道氣功波，旁邊標著寬度
    qiWidth: `<path d="M20 6 C38 14 38 50 20 58 C46 58 60 46 62 32 C60 18 46 6 20 6 Z" fill="#80deea"/><path d="M28 14 C40 22 40 42 28 50 C44 48 52 40 54 32 C52 24 44 16 28 14 Z" fill="#e0f7fa" stroke="none"/>`
        + duoStroke('M8 6 L8 58 M3 12 L8 6 L13 12 M3 52 L8 58 L13 52', '#ffd54f', 2.5),
    // 運氣：握緊的拳頭聚起一團旋轉的氣
    qiFreq: fistAt(22, 42, 0.72) + `<circle cx="46" cy="18" r="12" fill="#80deea"/><circle cx="46" cy="18" r="5.5" fill="#e0f7fa" stroke="none"/>`
        + `<path d="M34 12 C36 2 54 2 58 12 M58 24 C56 34 38 34 34 24" stroke="#e0f7fa" stroke-width="2.4"/>`,
    // 傳說
    bodhidharma: `<rect x="6" y="6" width="52" height="52" rx="4" fill="#8d6e63"/><path d="M6 20 L58 20 M6 34 L58 34 M6 48 L58 48 M22 6 L22 20 M42 20 L42 34 M22 34 L22 48 M42 48 L42 58" stroke="#6d4c41" stroke-width="2.5"/>
        <path d="M18 54 C18 44 24 40 32 40 C40 40 46 44 46 54 Z" fill="#ffa726"/><circle cx="32" cy="32" r="8" fill="#ffcc80"/><path d="${starPath(32, 14, 6, 2.2, 4)}" fill="#ffe082" stroke-width="2"/>`,
    reedCrossing: `<path d="M2 48 C16 42 30 54 44 48 C52 44 58 46 62 48 L62 62 L2 62 Z" fill="#4fc3f7"/><path d="M14 44 L50 40" stroke-width="5"/><path d="M14 44 L50 40" stroke="#aed581" stroke-width="2.5"/>
        <path d="M30 40 L30 26 C30 20 38 20 38 26 L38 40" fill="#ffa726"/><circle cx="34" cy="16" r="6" fill="#ffcc80"/>`,
    thirteenMonks: `${[[10, 40], [22, 34], [34, 40], [46, 34], [56, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y - 10}" r="4.5" fill="#ffcc80" stroke-width="2"/><path d="M${x - 5} ${y + 10} L${x - 5} ${y} C${x - 5} ${y - 4} ${x + 5} ${y - 4} ${x + 5} ${y} L${x + 5} ${y + 10} Z" fill="#ffa726" stroke-width="2"/>`).join('')}
        <path d="M4 54 L60 46" stroke-width="4"/><path d="M4 54 L60 46" stroke="#8d6e63" stroke-width="2"/>`,
    // 金剛怒目：一串佛珠在右邊斷開、珠子飛出去，中間炸開一團琥珀金的震波
    vajraWrath: `<path d="${starPath(32, 37, 19, 10, 12)}" fill="#ffb300"/><circle cx="32" cy="37" r="8" fill="#fff8e1" stroke-width="2.5"/>
        <path d="${Array.from({ length: 11 }, (_, i) => { const a = (160 + i * 21) * Math.PI / 180; return `${i ? 'L' : 'M'}${(32 + Math.cos(a) * 25).toFixed(1)} ${(37 + Math.sin(a) * 25).toFixed(1)}`; }).join(' ')}" stroke-width="2"/>
        ${Array.from({ length: 11 }, (_, i) => { const a = (160 + i * 21) * Math.PI / 180, x = 32 + Math.cos(a) * 25, y = 37 + Math.sin(a) * 25; return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i === 5 ? 5 : 3.8}" fill="${i === 5 ? '#ffd54f' : '#8d6e63'}" stroke-width="2"/>`; }).join('')}
        ${[[59, 47, 3.6], [55, 57, 3.2], [47, 61, 2.8]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#8d6e63" stroke-width="2"/>`).join('')}
        <path d="M51 41 L55 44 M48 50 L51 54 M41 55 L43 59" stroke="#ffe082" stroke-width="2"/>${shine(28, 33, 2.5, 1.6)}`,
    // 回龍勁：氣功波從武僧手上打出去，在盡頭繞一個彎、龍頭朝回飛
    returningQi: monkAt(11, 46, 0.95)
        + duoStroke('M20 44 L42 44 C61 44 61 17 42 17 L27 17', '#26c6da', 6)
        + `<path d="M24 44 L42 44 C57 44 57 17 42 17 L30 17" stroke="#e0f7fa" stroke-width="1.6"/>`
        + `<path d="M15 17 L27 9 L25 17 L27 25 Z" fill="#26c6da" stroke-width="2.5"/><circle cx="21" cy="15.5" r="1.4" fill="${ICON_OUTLINE}" stroke="none"/>
        <path d="M44 9 C47 6 51 6 53 9 M50 30 C53 28 56 29 57 32" stroke="#80deea" stroke-width="2.2"/>`,
    // 戰士的大招：兩支交叉擲出的標槍
    javelin: spear(6, 52, 54, 6, 18, 4) + spear(16, 62, 60, 28, 18, 4) + `<path d="M2 36 L12 36 M2 44 L9 44" stroke="#ffcc80" stroke-width="3"/>`,
    // 戰士的狂怒：怒吼的橘色獸頭盔
    rage: `<path d="M12 22 C6 12 8 4 14 2 C14 10 18 16 22 20 Z M52 22 C58 12 56 4 50 2 C50 10 46 16 42 20 Z" fill="#f1ead6"/>
        <path d="M32 12 C18 12 12 22 12 34 C12 46 20 56 32 58 C44 56 52 46 52 34 C52 22 46 12 32 12 Z" fill="#ff6d00"/>
        <path d="M18 30 L28 34 M46 30 L36 34" stroke-width="4"/><path d="M22 44 C26 52 38 52 42 44 L38 48 L32 44 L26 48 Z" fill="#1b1424"/>${shine(22, 20, 4, 2.5)}`,
    clock: `<circle cx="32" cy="35" r="23" fill="#f1ead6"/><rect x="26" y="4" width="12" height="7" rx="2" fill="#b0bec5"/><path d="M32 11 L32 12" stroke-width="3"/>
        <path d="M32 35 L32 20 M32 35 L42 40" stroke-width="4"/><circle cx="32" cy="35" r="2.5" fill="#1b1424" stroke="none"/>${shine(21, 24, 4, 2.5)}`,
    trophy: `<path d="M18 10 L46 10 L46 24 C46 34 40 40 32 40 C24 40 18 34 18 24 Z" fill="#ffd54f"/>
        <path d="M18 15 C8 15 8 29 19 30 M46 15 C56 15 56 29 45 30" stroke-width="4"/>
        <rect x="27" y="40" width="10" height="8" fill="#e0a82e"/><rect x="18" y="48" width="28" height="8" rx="2" fill="#e0a82e"/>${shine(25, 18, 3, 6, 0)}`,
    battery: `<rect x="4" y="14" width="50" height="36" rx="6" fill="#f1ead6"/><rect x="54" y="24" width="7" height="16" rx="2" fill="#f1ead6"/>
        <rect x="10" y="20" width="12" height="24" rx="2" fill="#7cb342" stroke-width="2.5"/><rect x="25" y="20" width="12" height="24" rx="2" fill="#7cb342" stroke-width="2.5"/>`,
    // 減少晃動：手機畫面兩側的震動線
    reduceShake: duoStroke('M10 23 C6 28 6 36 10 41 M54 23 C58 28 58 36 54 41', '#f1ead6', 3.5) + duoStroke('M4 27 C2.5 30 2.5 34 4 37 M60 27 C61.5 30 61.5 34 60 37', '#f1ead6', 2.5) +
        `<rect x="17" y="8" width="30" height="48" rx="6" fill="#7e8bd6"/><rect x="21" y="14" width="22" height="32" rx="2" fill="#26324a" stroke-width="2.5"/>
        <path d="M21 40 L27 33 L31 37 L36 30 L43 38 L43 46 L21 46 Z" fill="#4db6ac" stroke-width="2.5"/><circle cx="37" cy="21" r="3" fill="#fff3c4" stroke-width="2"/>
        <circle cx="32" cy="51" r="1.8" fill="#1b1424" stroke="none"/>${shine(22, 11, 3, 1.5, 0)}`,
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
    // 永久強化的「通用」分頁（七個職業都吃得到的強化）：三個不同顏色的兜帽身影並肩站，頭上一顆金星
    metaShared: `<path d="${starPath(32, 11, 9, 4, 5)}" fill="#ffd54f" stroke-width="3"/><circle cx="14" cy="12" r="2" fill="#fff59d" stroke-width="1.5"/><circle cx="50" cy="12" r="2" fill="#fff59d" stroke-width="1.5"/>
        ${[[17, 36, 0.78, '#9575cd'], [47, 36, 0.78, '#66bb6a'], [32, 43, 1, '#42a5f5']].map(([x, y, s, c]) => {
            const p = (dx, dy) => `${(x + dx * s).toFixed(1)} ${(y + dy * s).toFixed(1)}`;
            return `<path d="M${p(-13, 20)} C${p(-13, 0)} ${p(-9, -13)} ${p(0, -15)} C${p(9, -13)} ${p(13, 0)} ${p(13, 20)} Z" fill="${c}"/>
                <path d="M${p(-13, 20)} L${p(-6, 6)} M${p(13, 20)} L${p(6, 6)}" stroke="rgba(27,20,36,0.35)" stroke-width="2"/>
                <ellipse cx="${x}" cy="${(y - 2 * s).toFixed(1)}" rx="${(7.5 * s).toFixed(1)}" ry="${(8.5 * s).toFixed(1)}" fill="rgba(27,20,36,0.3)" stroke="none"/>
                <ellipse cx="${x}" cy="${(y - 2 * s).toFixed(1)}" rx="${(6 * s).toFixed(1)}" ry="${(7 * s).toFixed(1)}" fill="#2a1f33" stroke-width="2"/>
                <circle cx="${(x - 2.4 * s).toFixed(1)}" cy="${(y - 2 * s).toFixed(1)}" r="${(1.4 * s).toFixed(1)}" fill="#f1ead6" stroke="none"/><circle cx="${(x + 2.4 * s).toFixed(1)}" cy="${(y - 2 * s).toFixed(1)}" r="${(1.4 * s).toFixed(1)}" fill="#f1ead6" stroke="none"/>
                ${shine(x - 6 * s, y - 9 * s, 2.5 * s, 1.5 * s)}`;
        }).join('')}`,
    // 聚寶祭壇（地上的經驗全部飛過來）：中間一個琥珀色漩渦，三顆經驗光球拖著速度線繞進去
    altarMagnet: `<circle cx="32" cy="32" r="18" fill="#ffb74d"/>
        ${[0, 120, 240].map(r => `<path d="M32 32 C36 25 45 24 49 31" transform="rotate(${r} 32 32)" stroke="#b26a00" stroke-width="3"/>`).join('')}
        <circle cx="32" cy="32" r="4" fill="#fff8e1" stroke-width="2"/>${shine(24, 22, 4, 2.5)}
        ${[-70, 50, 170].map(deg => {
            const a = deg * Math.PI / 180, R = 23, x = 32 + Math.cos(a) * R, y = 32 + Math.sin(a) * R;
            const tx = Math.sin(a), ty = -Math.cos(a), ox = Math.cos(a), oy = Math.sin(a);
            const streak = (off, l0, l1) => `M${(x + tx * l0 + ox * off).toFixed(1)} ${(y + ty * l0 + oy * off).toFixed(1)} L${(x + tx * l1 + ox * off).toFixed(1)} ${(y + ty * l1 + oy * off).toFixed(1)}`;
            return `<path d="${streak(-3, 8, 15)} ${streak(3, 8, 12)}" stroke-width="5"/><path d="${streak(-3, 8, 15)} ${streak(3, 8, 12)}" stroke="#b2ebf2" stroke-width="2"/>
                <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="#62dbe2"/>${shine(x - 2, y - 2, 2.2, 1.4)}`;
        }).join('')}`,
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
    // 蝠潮（蝙蝠群提早出現）：一大兩小三隻褐色蝙蝠撲下來，紅眼露牙（敵方的蝙蝠，跟吸血鬼的紫蝠分開）
    curseBats: `${[[32, 44, 1.2], [15, 22, 0.68], [49, 19, 0.6]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -6 C-6 -16 -20 -16 -25 -6 C-19 -9 -15 -5 -14 0 C-10 -4 -6 -2 -4 4 L0 10 L4 4 C6 -2 10 -4 14 0 C15 -5 19 -9 25 -6 C20 -16 6 -16 0 -6 Z" fill="#6d4c41" stroke-width="${(4.5 / s).toFixed(1)}"/><path d="M-5 -8 L-7 -14 L-2 -9 M5 -8 L7 -14 L2 -9" fill="#6d4c41" stroke-width="${(2.5 / s).toFixed(1)}"/><circle cx="-3" cy="-3" r="1.8" fill="#ff1744" stroke="none"/><circle cx="3" cy="-3" r="1.8" fill="#ff1744" stroke="none"/><path d="M-2 3 L-1 6 L0 3 L1 6 L2 3" fill="#fff" stroke-width="0.8"/></g>`).join('')}`,
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
    // ---- 結算、選單 ----
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
    // 全軍傷害：骨白色的拳頭
    might: `<rect x="16" y="22" width="34" height="26" rx="8" fill="#f1ead6"/><path d="M24 22 L24 32 M32 22 L32 32 M40 22 L40 32" stroke-width="3"/>
        <path d="M18 36 C8 36 8 24 18 24" fill="#f1ead6"/><rect x="22" y="48" width="22" height="12" fill="#7e57c2"/>
        <path d="M10 10 L16 16 M32 3 L32 12 M54 10 L48 16" stroke="#ffd54f" stroke-width="3.5"/>`,
    // 大招冷卻：紫色爆光前的沙漏
    ultMastery: `<path d="${starPath(32, 32, 30, 21, 10)}" fill="#c06bf5"/>
        <path d="M20 10 L44 10 L44 14 C44 24 36 28 36 32 C36 36 44 40 44 50 L44 54 L20 54 L20 50 C20 40 28 36 28 32 C28 28 20 24 20 14 Z" fill="#f1ead6"/>
        <path d="M24 50 L40 50 L32 42 Z M26 16 L38 16 L32 24 Z" fill="#ffd54f" stroke="none"/>`,
    // 永久強化「召喚物血量」：骨頭加一顆心
    // 永久強化「開局骷髏」（開局就帶幾隻骷髏）：紫色圓盾前面排著三顆骷髏頭
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
    // 靈魂掉落：滿出靈魂的豐饒角
    soulAffinity: `<path d="M4 10 C8 30 22 44 42 46 L46 30 C30 28 18 20 4 10 Z" fill="#d7965a"/><ellipse cx="44" cy="38" rx="5" ry="9" fill="#8d6e63" transform="rotate(15 44 38)"/>
        <circle cx="54" cy="48" r="6" fill="#62dbe2"/><circle cx="44" cy="56" r="4.5" fill="#62dbe2"/><circle cx="57" cy="34" r="4" fill="#62dbe2"/>${shine(52, 46, 2, 1.5)}`,
    // 倒下復活（倒下時復活一次；祝福「重生」是 rebirth）：金色生命十字
    revive: `<ellipse cx="32" cy="17" rx="10" ry="12" stroke-width="11"/><ellipse cx="32" cy="17" rx="10" ry="12" stroke="#ffd54f" stroke-width="5"/>
        <path d="M12 33 L52 33 M32 30 L32 60" stroke-width="12"/><path d="M12 33 L52 33 M32 30 L32 60" stroke="#ffd54f" stroke-width="6"/>`,
    // 金幣（局外的錢：結算拿到、拿去買永久強化）：一枚印著錢字號的金幣
    gold: `<circle cx="32" cy="32" r="24" fill="#ffca28"/><circle cx="32" cy="32" r="17" stroke="#e0a82e" stroke-width="3"/>
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
    lifesteal: `<path d="M32 6 C40 20 50 30 50 40 C50 50 42 57 32 57 C22 57 14 50 14 40 C14 30 24 20 32 6 Z" fill="#c62828"/>${shine(24, 38, 3, 6, 15)}
        <path d="M23 30 L27 43 L31 30 Z" fill="#f1ead6" stroke-width="2.5"/><path d="M33 30 L37 43 L41 30 Z" fill="#f1ead6" stroke-width="2.5"/>`,
    // 法師的靈魂彈：跟遊戲裡的彈同一個青色
    soulBlade: `<path d="M46 6 L58 6 L58 18 L30 46 L18 34 Z" fill="#7ff0f0"/><path d="M52 10 L26 38" stroke="#d6fbfb" stroke-width="3"/>
        <path d="M12 32 L32 52" stroke-width="10"/><path d="M12 32 L32 52" stroke="#5c6bc0" stroke-width="5"/>
        <path d="M20 44 L9 55" stroke-width="9"/><path d="M20 44 L9 55" stroke="#9fa8da" stroke-width="5"/>${shine(50, 12, 3, 2, 45)}`,
    // 疾骨：一根骨頭往前衝，後面拖著速度線
    swiftBones: duoStroke('M4 22 L18 22 M2 34 L14 34 M6 46 L18 46', '#8fd3ff', 3)
        + `<g transform="rotate(-20 38 34)"><path d="M22 30 C18 26 20 20 25 22 C26 18 32 18 32 23 L46 23 C46 18 52 18 53 22 C58 20 60 26 56 30 C60 34 58 40 53 38 C52 42 46 42 46 37 L32 37 C32 42 26 42 25 38 C20 40 18 34 22 30 Z" fill="#f1ead6"/>
            <path d="M33 27 L45 27" stroke="#d7ccc8" stroke-width="2"/></g>${shine(30, 26, 3, 1.6, -20)}`,
    // 破綻凝視：眼魔的眼睛外面套一圈金色準星，告訴骷髏「打這裡」
    weakGaze: `<path d="M6 32 C16 19 48 19 58 32 C48 45 16 45 6 32 Z" fill="#f1ead6"/><circle cx="32" cy="32" r="9" fill="#26a69a"/><circle cx="32" cy="32" r="3.5" fill="${ICON_OUTLINE}" stroke="none"/>`
        + `<circle cx="32" cy="32" r="22" stroke-width="7"/><circle cx="32" cy="32" r="22" stroke="#ffd54f" stroke-width="3"/>`
        + duoStroke('M32 2 L32 12 M32 52 L32 62 M2 32 L10 32 M54 32 L62 32', '#ffd54f', 3) + shine(26, 28, 2, 1.4),
    // ---- 傳說祝福 ----
    // 怨靈附身：一隻青色怨靈從背後抱住一隻小怪，那隻怪的眼睛也變成青色
    possession: `<g transform="translate(-6 14) scale(0.9)"><path d="${GHOST_PATH}" fill="#78909c"/><ellipse cx="26" cy="27" rx="4" ry="4.5" fill="#80cbc4" stroke="none"/><ellipse cx="38" cy="27" rx="4" ry="4.5" fill="#80cbc4" stroke="none"/>
            <path d="M24 38 L28 41 L32 38 L36 41 L40 38" stroke-width="2.5"/></g>
        <g transform="translate(18 -2) scale(0.8)" opacity="0.9"><path d="${GHOST_PATH}" fill="#80cbc4"/><ellipse cx="26" cy="27" rx="3" ry="4" fill="${ICON_OUTLINE}" stroke="none"/><ellipse cx="38" cy="27" rx="3" ry="4" fill="${ICON_OUTLINE}" stroke="none"/></g>`
        + duoStroke('M36 30 C30 34 24 34 20 38', '#80cbc4', 3.5) + duoStroke('M52 32 C50 40 44 44 38 46', '#80cbc4', 3.5)
        + `${[[10, 12], [56, 54]].map(([x, y]) => `<path d="${starPath(x, y, 5, 2, 4)}" fill="#e0f2f1" stroke-width="1.6"/>`).join('')}`,
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
    // 跳彈魔眼：眼魔的金色眼彈在牆上彈了兩次，每次彈開都迸出火花
    ricochet: duoStroke('M4 54 L22 20 L38 46 L48 26', '#ffe082', 3) + `${[[22, 20], [38, 46]].map(([x, y]) => `<path d="${starPath(x, y, 7, 2.6, 6)}" fill="#fff8e1" stroke-width="1.8"/>`).join('')}`
        + `<circle cx="52" cy="18" r="10" fill="#ffc400"/><ellipse cx="52" cy="18" rx="4.5" ry="6.5" fill="#fff8e1" stroke-width="1.8"/><ellipse cx="52" cy="18" rx="1.6" ry="4.6" fill="${ICON_OUTLINE}" stroke="none"/>${shine(48, 13, 2.5, 1.5)}`,
    eliteHunter: `<path d="M12 40 L15 18 L24 28 L32 13 L40 28 L49 18 L52 40 Z" fill="#ffd54f"/><rect x="12" y="39" width="40" height="8" rx="2" fill="#e0a82e"/>` +
        duoStroke('M32 49 L32 61 M23 55 L41 55', '#ce93d8', 3) + `<circle cx="32" cy="55" r="4" fill="#ce93d8" stroke-width="2.5"/>`,
    midas: `<circle cx="24" cy="38" r="15" fill="#ffd54f"/><circle cx="24" cy="38" r="9" stroke="#e0a82e" stroke-width="3"/>
        <circle cx="42" cy="26" r="15" fill="#ffe082"/><circle cx="42" cy="26" r="9" stroke="#e0a82e" stroke-width="3"/>${shine(37, 18, 4, 2.5)}
        <path d="${starPath(52, 50, 8, 3, 4)}" fill="#fff8e1" stroke-width="2.5"/>`,
    soulSiphon: `<path d="${HEART_PATH}" fill="#e5484d"/>
        <path d="M32 44 C25 44 22 38 25 33 C27 30 28 27 27 22 C32 25 35 29 35 32 C37 30 38 28 38 25 C42 29 43 35 41 39 C39 42 36 44 32 44 Z" fill="#7ff0f0" stroke-width="3"/>${shine(18, 20, 4.5, 3)}`,
    soulVolley: duoStroke('M8 22 L26 22', '#7ff0f0', 4) + duoStroke('M8 34 L32 34', '#7ff0f0', 4) + duoStroke('M8 46 L26 46', '#7ff0f0', 4) +
        `<circle cx="32" cy="22" r="7" fill="#7ff0f0"/><circle cx="40" cy="34" r="8" fill="#7ff0f0"/><circle cx="32" cy="46" r="7" fill="#7ff0f0"/>
        <circle cx="40" cy="34" r="3.5" fill="#e8ffff" stroke="none"/>${shine(30, 20, 2, 1.5)}${shine(38, 31, 2.5, 1.5)}${shine(30, 44, 2, 1.5)}`,
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
};

// ---- 雙流派傳說：每張都把兩個流派的東西畫在一起 ----
const FLAME_PATH = 'M32 58 C17 58 11 46 15 35 C18 27 24 24 25 14 C34 20 37 26 37 32 C41 28 42 23 41 17 C51 26 54 38 50 47 C47 54 40 58 32 58 Z';
const FLAME_CORE = 'M32 53 C25 53 22 47 25 41 C27 37 31 35 32 30 C37 35 40 40 39 46 C38 50 36 53 32 53 Z';
const SKULL_SHAPE = 'M32 7 C18 7 10 17 10 29 C10 37 14 42 20 45 L20 55 L44 55 L44 45 C50 42 54 37 54 29 C54 17 46 7 32 7 Z';
const WOLF_HEAD = 'M-12 8 L-12 -6 L-8 -14 L-4 -6 L4 -6 L8 -14 L12 -6 L12 8 C8 14 -8 14 -12 8 Z';
const BAT_SHAPE = 'M0 -4 C-8 -14 -22 -12 -24 -2 C-18 -6 -14 -2 -12 2 C-8 -2 -4 0 0 6 C4 0 8 -2 12 2 C14 -2 18 -6 24 -2 C22 -12 8 -14 0 -4 Z';
function skullAt(x, y, s, eye = ICON_OUTLINE) {
    return `<g transform="translate(${x} ${y}) scale(${s}) translate(-32 -31)"><path d="${SKULL_SHAPE}" fill="#f1ead6" stroke-width="${(4 / s).toFixed(1)}"/>`
        + `<ellipse cx="23" cy="30" rx="6" ry="7" fill="${eye}" stroke="none"/><ellipse cx="41" cy="30" rx="6" ry="7" fill="${eye}" stroke="none"/><path d="M32 37 L28.5 44 L35.5 44 Z" fill="${ICON_OUTLINE}" stroke="none"/></g>`;
}
function flameAt(x, y, s, fill, core) {
    return `<g transform="translate(${x} ${y}) scale(${s}) translate(-32 -36)"><path d="${FLAME_PATH}" fill="${fill}" stroke-width="${(4 / s).toFixed(1)}"/><path d="${FLAME_CORE}" fill="${core}" stroke="none"/></g>`;
}
function wolfHeadAt(x, y, s, fill = '#90a4ae', eye = '#ffd54f') {
    return `<g transform="translate(${x} ${y}) scale(${s})"><path d="${WOLF_HEAD}" fill="${fill}" stroke-width="${(2.6 / s * s).toFixed(1)}"/><path d="M-9 -9 L-8 -12 L-6 -7 Z M9 -9 L8 -12 L6 -7 Z" fill="#cfd8dc" stroke="none"/>`
        + `<circle cx="-5" cy="0" r="2" fill="${eye}" stroke="none"/><circle cx="5" cy="0" r="2" fill="${eye}" stroke="none"/><path d="M-2 7 L0 9 L2 7" stroke-width="1.6"/></g>`;
}
function ghostAt(x, y, s, fill) {
    return `<g transform="translate(${x} ${y}) scale(${s}) translate(-32 -30)"><path d="${GHOST_PATH}" fill="${fill}" stroke-width="${(4 / s).toFixed(1)}"/><circle cx="26" cy="27" r="3.5" fill="${ICON_OUTLINE}" stroke="none"/><circle cx="38" cy="27" r="3.5" fill="${ICON_OUTLINE}" stroke="none"/></g>`;
}
Object.assign(ICON_BODIES, {
    // 冥火骨兵（骷髏＋怨靈）：骷髏頭燒著怨靈青色的火
    ghostfireBones: flameAt(32, 30, 1.05, '#4db6ac', '#e0f2f1') + skullAt(32, 42, 0.55, '#26a69a'),
    // 靈視（眼魔＋法師）：眼魔的眼睛射出一發青色魂彈
    soulGaze: `<path d="M3 40 C10 28 34 28 41 40 C34 52 10 52 3 40 Z" fill="#f1ead6"/><circle cx="22" cy="40" r="8" fill="#26a69a"/><circle cx="22" cy="40" r="3.2" fill="${ICON_OUTLINE}" stroke="none"/>`
        + duoStroke('M34 32 L52 14', '#7ff0f0', 4) + `<path d="${starPath(54, 12, 9, 4, 8)}" fill="#7ff0f0" stroke-width="2.5"/><circle cx="54" cy="12" r="3.5" fill="#e8ffff" stroke-width="1.8"/>${shine(16, 36, 2.5, 1.6)}`,
    // 哀魂新星（怨靈＋新星）：紫色新星的三個尖角各衝出一隻怨靈
    wailingNova: `<path d="${starPath(32, 34, 24, 11, 10)}" fill="#c06bf5"/><circle cx="32" cy="34" r="8" fill="#f6dcff"/>` + ghostAt(12, 14, 0.42, '#80cbc4') + ghostAt(52, 14, 0.42, '#80cbc4') + ghostAt(32, 56, 0.42, '#80cbc4'),
    // 盾怒（盾牆＋狂戰）：圓盾上冒出橘色怒火
    shieldFury: flameAt(32, 22, 0.75, '#ff6d00', '#ffd54f') + `<circle cx="32" cy="42" r="19" fill="#607d8b"/><circle cx="32" cy="42" r="13" fill="#90a4ae" stroke-width="3"/><circle cx="32" cy="42" r="5" fill="#ffab40" stroke-width="2.5"/>${shine(24, 34, 4, 2.2)}`,
    // 移動龜甲（盾牆＋軍團紀律）：三面盾舉過頭頂連成屋頂，底下一道往前的箭頭
    marchingTestudo: `${[12, 32, 52].map(x => `<rect x="${x - 10}" y="12" width="20" height="16" rx="3" fill="#1e88e5"/><rect x="${x - 7}" y="15" width="14" height="10" rx="2" stroke="#ffd54f" stroke-width="1.8"/><circle cx="${x}" cy="20" r="2.2" fill="#ffd54f" stroke-width="1.5"/>`).join('')}
        ${[14, 32, 50].map(x => `<path d="M${x} 30 L${x} 42" stroke-width="5"/><path d="M${x} 30 L${x} 42" stroke="${WOOD}" stroke-width="2.5"/>`).join('')}` + duoStroke('M6 52 L52 52', '#81c784', 3.5) + `<path d="M50 45 L60 52 L50 59 Z" fill="#81c784" stroke-width="2.5"/>`,
    // 怒射（弩陣＋狂戰）：弩一次射出三支帶火的弩箭
    furyVolley: crossbow(16, 50, -45, 0.8) + `${[[26, 30, 40, 8], [30, 34, 54, 16], [34, 40, 58, 34]].map(([a, b, c, d]) => arrow(a, b, c, d, '#ffcc80', '#ffab40', 0.8)).join('')}` + flameAt(56, 52, 0.28, '#ff6d00', '#ffd54f'),
    // 如影隨形（外功＋輕功）：一顆拳頭往前衝，身後拖著兩道青色殘影
    shadowFist: fistAt(18, 34, 0.5, 0.35) + fistAt(28, 32, 0.6, 0.6) + fistAt(42, 30, 0.75) + duoStroke('M2 20 L14 20 M4 44 L14 44', '#b2ebf2', 3),
    // 丹田爆發（內功＋氣功）：盤坐的武僧雙掌推出一道很寬的金色氣功波
    dantianBurst: `<circle cx="14" cy="42" r="10" fill="#ffd54f" opacity="0.5" stroke="none"/>` + monkAt(14, 40, 1)
        + [[30, 10, 6], [42, 16, 5], [54, 22, 4]].map(([x, h, w]) => duoStroke(`M${x - 6} ${38 - h} Q${x + 4} 37 ${x - 6} ${36 + h}`, '#ffd54f', w)).join('')
        + `<path d="M26 37 L58 37" stroke="#fff8e1" stroke-width="3" opacity="0.8"/>`,
    // 鐵拳（硬功＋外功）：一顆灰鐵色的拳頭，指節發亮，外面一圈鐵環
    ironFist: `<circle cx="32" cy="34" r="27" stroke-width="7"/><circle cx="32" cy="34" r="27" stroke="#b0bec5" stroke-width="3" stroke-dasharray="10 5"/>` + `<g transform="translate(32 34) scale(0.75) translate(-30 -33)">${FIST_BODY.replace('#ffcc80', '#90a4ae')}</g>` + shine(24, 26, 4, 2),
    // 淬毒匕首（暗殺＋劇毒）：一把飛刀滴著綠毒，刀尖一顆金色伏擊星
    poisonAmbush: placeAt(8, 56, -45, throwKnifeL(52)) + `<path d="M28 34 C26 40 30 42 30 44 C30 47 25 47 25 44 C25 42 28 40 28 34 Z M40 24 C38 30 42 32 42 34 C42 37 37 37 37 34 C37 32 40 30 40 24 Z" fill="#76ff03" stroke-width="1.8"/>`
        + `<path d="${starPath(50, 12, 10, 4, 4)}" fill="#ffd740" stroke-width="2.2"/>`,
    // 煙中影（影＋煙霧）：一團灰煙裡站起一個紫色的影子
    smokeShades: `<g transform="translate(32 36) scale(0.85)" opacity="0.9"><circle cx="0" cy="-14" r="9" fill="#5e35b1"/><path d="M-12 22 L-12 0 C-12 -6 12 -6 12 0 L12 22 Z" fill="#5e35b1"/><path d="M-4 -15 L-1 -13 M4 -15 L1 -13" stroke="#ffd740" stroke-width="2"/></g>`
        + `<path d="M4 54 C2 46 10 42 16 46 C16 38 26 36 30 42 C34 36 46 38 46 46 C52 42 62 46 60 54 Z" fill="#b0bec5"/><path d="M10 50 C14 48 18 49 20 51 M36 49 C40 47 44 48 46 50" stroke="#eceff1" stroke-width="2"/>`,
    // 連環懸賞（情報＋暗殺）：兩個金色準星用鐵鍊串在一起
    bountyChain: `${[[16, 20], [48, 44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="12" stroke-width="7"/><circle cx="${x}" cy="${y}" r="12" stroke="#ffd740" stroke-width="3"/>${duoStroke(`M${x} ${y - 16} L${x} ${y - 8} M${x} ${y + 8} L${x} ${y + 16} M${x - 16} ${y} L${x - 8} ${y} M${x + 8} ${y} L${x + 16} ${y}`, '#ffd740', 2.5)}<circle cx="${x}" cy="${y}" r="3" fill="#ffd740" stroke-width="2"/>`).join('')}`
        + `${[[26, 28], [32, 32], [38, 36]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="4.5" ry="2.8" transform="rotate(${35 + i * 10} ${x} ${y})" stroke-width="5"/><ellipse cx="${x}" cy="${y}" rx="4.5" ry="2.8" transform="rotate(${35 + i * 10} ${x} ${y})" stroke="#90a4ae" stroke-width="2.2"/>`).join('')}`,
    // 熊之林（聖林＋巨熊）：熊頭蹲在一棵橡樹前，身邊兩片葉子
    groveBears: `<path d="M28 44 L28 30 L36 30 L36 44 Z" fill="#6d4c41"/><circle cx="32" cy="18" r="15" fill="#558b2f"/><circle cx="18" cy="24" r="9" fill="#7cb342"/><circle cx="46" cy="24" r="9" fill="#7cb342"/>
        <circle cx="20" cy="38" r="6" fill="#8d6e63"/><circle cx="44" cy="38" r="6" fill="#8d6e63"/><ellipse cx="32" cy="48" rx="16" ry="13" fill="#8d6e63"/><ellipse cx="32" cy="53" rx="7" ry="5" fill="#bcaaa4"/>
        <circle cx="26" cy="45" r="2" fill="${ICON_OUTLINE}" stroke="none"/><circle cx="38" cy="45" r="2" fill="${ICON_OUTLINE}" stroke="none"/><ellipse cx="32" cy="51" rx="2.6" ry="2" fill="${ICON_OUTLINE}" stroke="none"/>`,
    // 荊棘狼（狼群＋荒野）：狼頭的嘴邊纏著一圈帶刺的藤
    thornWolves: wolfHeadAt(32, 30, 1.7) + duoStroke('M6 50 C14 40 22 54 32 46 C42 38 48 54 58 44', '#7cb342', 3)
        + `${[[12, 45], [26, 50], [40, 44], [54, 47]].map(([x, y]) => `<path d="M${x - 3} ${y} L${x} ${y - 6} L${x + 3} ${y} Z" fill="#c5e1a5" stroke-width="1.6"/>`).join('')}`,
    // 狩獵之月（四大節＋狼群）：一輪滿月底下兩隻小狼探頭
    huntMoon: `<circle cx="32" cy="22" r="18" fill="#fff3c4"/><circle cx="26" cy="18" r="3.5" fill="#ffe082" stroke="none"/><circle cx="38" cy="26" r="4.5" fill="#ffe082" stroke="none"/>${shine(24, 12, 4, 2)}`
        + wolfHeadAt(20, 50, 0.95, '#eceff1', '#1b1424') + wolfHeadAt(44, 50, 0.95, '#cfd8dc', '#1b1424'),
    // 血之紐帶（血魔法＋眷屬）：兩顆紫色的心用一條血線連著
    bloodBond: `<g transform="translate(-6 8) scale(0.55)"><path d="${HEART_PATH}" fill="#7c4dff" stroke-width="7"/></g><g transform="translate(30 20) scale(0.55)"><path d="${HEART_PATH}" fill="#ce93d8" stroke-width="7"/></g>`
        + duoStroke('M22 30 C30 22 34 46 44 34', '#b388ff', 3) + `<path d="M32 46 C32 50 35 52 35 55 C35 58 29 58 29 55 C29 52 32 50 32 46 Z" fill="#7c4dff" stroke-width="2"/>`,
    // 蝠群護主（蝠群＋不死）：一隻蝙蝠張開翅膀擋在棺木前
    batGuard: `<path d="M22 8 L42 8 L50 22 L44 60 L20 60 L14 22 Z" fill="#5d4037"/><path d="M32 18 L32 34 M26 24 L38 24" stroke="#d1c4e9" stroke-width="3"/>`
        + `<g transform="translate(32 44) scale(1.2)"><path d="${BAT_SHAPE}" fill="#4527a0" stroke-width="3.2"/><circle cx="-3" cy="-2" r="1.8" fill="#ffd54f" stroke="none"/><circle cx="3" cy="-2" r="1.8" fill="#ffd54f" stroke="none"/></g>`,
    // 狼群初擁（狼化＋眷屬）：彎月下，被狼咬過的地方站起一個紫色眷屬
    wolfEmbrace: `<path d="M56 4 C49 4 44 9 44 16 C44 23 49 28 56 28 C52 25 50 21 50 16 C50 11 52 7 56 4 Z" fill="#fff3c4" stroke-width="2.5"/>` + ghostAt(30, 32, 0.75, '#ce93d8')
        + `<path d="M4 50 C14 44 22 46 26 52 M34 52 C40 46 50 44 60 50" stroke-width="4"/>${[[10, 50], [18, 48], [42, 48], [50, 48]].map(([x, y]) => `<path d="M${x - 3} ${y} L${x} ${y + 7} L${x + 3} ${y} Z" fill="#eceff1" stroke-width="1.6"/>`).join('')}`,
    // 誘敵深入（回馬射＋陷阱）：一支回頭的箭落在一個小陷阱上
    lureTrap: smallTrap(42, 46, 1) + duoStroke('M8 50 C4 30 20 14 40 16', '#80cbc4', 2.6) + arrow(42, 16, 44, 36, STEEL, '#80cbc4', 0.9),
    // 元素陷阱（元素箭＋陷阱）：陷阱上方冒出火、冰、雷三個元素
    elemTrap: smallTrap(32, 46, 1.05) + flameAt(12, 22, 0.32, '#ff7043', '#ffd54f')
        + duoStroke('M32 6 L32 26 M23 11 L41 21 M23 21 L41 11', '#81d4fa', 2.6) + boltAt(52, 18),
    // 鷹眼標記（長弓＋森林之友）：一根金色鷹羽插在準星上
    hawkMark: `<circle cx="32" cy="36" r="20" stroke-width="7"/><circle cx="32" cy="36" r="20" stroke="#a5d6a7" stroke-width="3"/>` + duoStroke('M32 10 L32 20 M32 52 L32 62 M6 36 L16 36 M48 36 L58 36', '#a5d6a7', 2.6)
        + placeAt(32, 36, -60, `<path d="M0 0 C6 -7 22 -7 30 0 C22 7 6 7 0 0 Z" fill="#ffd54f" stroke-width="2.4"/><path d="M-4 0 L28 0" stroke="#8d6e63" stroke-width="2"/><path d="M10 0 L14 -4 M18 0 L22 -4 M10 0 L14 4 M18 0 L22 4" stroke="#e0a82e" stroke-width="1.4"/>`),
});

// 熊掌（德魯伊的熊）：肉墊加四根腳趾，以 (x,y) 為中心
function bearPawAt(x, y, s) {
    return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="5" rx="10" ry="8" fill="#8d6e63" stroke-width="${(3 / s).toFixed(1)}"/><ellipse cx="0" cy="6" rx="5.5" ry="4" fill="#d7ccc8" stroke="none"/>`
        + `${[[-10, -6], [-4, -11], [4, -11], [10, -6]].map(([tx, ty]) => `<ellipse cx="${tx}" cy="${ty}" rx="3.6" ry="4.4" fill="#8d6e63" stroke-width="${(2.4 / s).toFixed(1)}"/>`).join('')}</g>`;
}
// 一口咬下去：深色的嘴，上下兩排白牙往中間咬
function biteAt(x, y, s) {
    const p = (dx, dy) => `${(x + dx * s).toFixed(1)} ${(y + dy * s).toFixed(1)}`;
    const teeth = (sign) => [-9, -3, 3, 9].map(t => `<path d="M${p(t - 3.2, sign * 9)} L${p(t, sign * 1.5)} L${p(t + 3.2, sign * 9)} Z" fill="#fafafa" stroke-width="2"/>`).join('');
    return `<path d="M${p(-15, 0)} C${p(-15, -12)} ${p(15, -12)} ${p(15, 0)} C${p(15, 12)} ${p(-15, 12)} ${p(-15, 0)} Z" fill="#4a148c"/>${teeth(-1)}${teeth(1)}`;
}
Object.assign(ICON_BODIES, {
    // ---- 拿掉兵種進化後補上的祝福（同一個概念一張圖） ----
    // 爆裂魔眼：眼魔射出的彈在前方炸成一朵金黃色爆光
    eyeBlast: `<path d="${starPath(42, 24, 21, 10, 9)}" fill="#ffb300"/><path d="${starPath(42, 24, 12, 6, 9)}" fill="#fff3c4" stroke="none"/>`
        + duoStroke('M24 42 L34 32', '#ffd54f', 4)
        + `<path d="M3 46 C9 36 29 36 35 46 C29 56 9 56 3 46 Z" fill="#f1ead6"/><circle cx="19" cy="46" r="6.5" fill="#ffc400"/><circle cx="19" cy="46" r="2.8" fill="${ICON_OUTLINE}" stroke="none"/>${shine(14, 42, 2.2, 1.4)}`,
    // 震波（新星）：紫色新星往右推出兩道震波弧，把一隻小怪震飛（身後拖速度線）
    novaPush: `<path d="${starPath(16, 34, 14, 7, 8)}" fill="#c06bf5"/><circle cx="16" cy="34" r="5" fill="#f6dcff"/>`
        + duoStroke('M30 18 C38 26 38 42 30 50', '#e1bee7', 4) + duoStroke('M38 12 C49 24 49 44 38 56', '#ce93d8', 3)
        + foe(54, 30, 0.38) + duoStroke('M44 22 L48 22 M44 38 L48 38', '#e1bee7', 2),
    // 黑洞新星：紫黑色的漩渦核心，外面一圈斜斜的光環，三顆光點被吸進去
    blackHole: `<ellipse cx="32" cy="34" rx="29" ry="11" transform="rotate(-18 32 34)" stroke-width="7"/><ellipse cx="32" cy="34" rx="29" ry="11" transform="rotate(-18 32 34)" stroke="#ce93d8" stroke-width="3"/>`
        + `<circle cx="32" cy="34" r="15" fill="#311b92"/><path d="M32 34 C36 28 44 30 42 36 M32 34 C28 40 20 38 22 32" stroke="#9575cd" stroke-width="2.5"/><circle cx="32" cy="34" r="4" fill="#0e0717" stroke-width="2"/>`
        + `${[[10, 10], [56, 14], [52, 58]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#f3e5f5" stroke-width="2"/>`).join('')}${shine(26, 28, 3, 1.6)}`,
    // 撲咬：狼頭往前撲，身後拖速度線，嘴邊一顆金色火花
    wolfPounce: duoStroke('M2 20 L14 20 M4 32 L16 32 M2 44 L14 44', '#cfd8dc', 3) + wolfHeadAt(36, 32, 1.75) + `<path d="${starPath(54, 50, 9, 3.5, 4)}" fill="#ffe0b2" stroke-width="2.2"/>`,
    // 熊爪橫掃：熊掌揮出三道弧形爪痕
    bearSwipe: [0, 1, 2].map(i => duoStroke(`M${16 + i * 9} ${60 - i * 2} C${28 + i * 9} ${44 - i * 4} ${42 + i * 5} ${30 - i * 4} ${54 + i * 3} ${12 + i * 5}`, '#fff3e0', 5)).join('') + bearPawAt(15, 17, 0.95),
    // 震地：熊掌往下砸在地上，地面裂開、兩道震波往兩邊擴
    bearQuake: `<ellipse cx="32" cy="52" rx="28" ry="8" fill="#6d4c41"/><path d="M32 52 L22 58 M32 52 L44 59 M32 52 L14 50 M32 52 L52 49" stroke="#3e2723" stroke-width="2.5"/>`
        + duoStroke('M8 40 C4 46 4 52 8 56', '#d7ccc8', 3) + duoStroke('M56 40 C60 46 60 52 56 56', '#d7ccc8', 3) + bearPawAt(32, 30, 1.25),
    // 狂咬：狼頭旁邊兩排咬痕疊在一起
    wolfFrenzy: wolfHeadAt(20, 30, 1.25) + biteAt(46, 22, 0.95) + biteAt(48, 46, 0.95),
    // 狂戰之血：大劍插在一顆骷髏旁，劍身捲著橘色怒火
    bloodRush: flameAt(30, 26, 0.8, '#ff9100', '#ffd54f') + placeAt(30, 6, 90, greatswordL(50)) + skullAt(48, 50, 0.42),
    // 跳彈弩：弩箭命中第一隻後沿虛線彈到下一隻
    ricochetBolt: `<path d="M24 36 L46 12 L50 44" stroke-width="7" stroke-dasharray="6 5"/><path d="M24 36 L46 12 L50 44" stroke="#90caf9" stroke-width="3.5" stroke-dasharray="6 5"/>`
        + foe(22, 42, 0.42) + foe(50, 52, 0.42) + arrow(2, 8, 20, 28, STEEL, '#90caf9', 1.1)
        + `<path d="${starPath(22, 34, 8, 3, 4)}" fill="#fff59d" stroke-width="2"/><path d="${starPath(46, 12, 7, 2.8, 4)}" fill="#fff59d" stroke-width="2"/>`,
    // 凱旋：月桂冠圍著一顆金星
    triumph: [-1, 1].map(side => `${[0, 1, 2, 3, 4].map(i => { const a = Math.PI / 2 + side * (0.5 + i * 0.42), x = 32 + Math.cos(a) * 22, y = 34 + Math.sin(a) * 22; return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="6" ry="3.2" transform="rotate(${(a * 180 / Math.PI + side * 60).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="#7cb342" stroke-width="2.2"/>`; }).join('')}`).join('')
        + `<path d="${starPath(32, 32, 14, 6, 5)}" fill="#ffd54f" stroke-width="3"/>${shine(28, 26, 3, 1.8)}`,
    // 破風箭：一支箭帶著三道旋風往右，把小怪往後推
    pushArrow: duoStroke('M4 22 C10 16 16 28 22 22 M2 34 C10 28 16 40 24 34 M4 46 C10 40 16 52 22 46', '#b2ebf2', 2.6) + arrow(14, 34, 44, 34, STEEL, '#80cbc4', 0.95) + foe(54, 30, 0.34),
    // 穿心：一支箭斜斜射穿靶心，靶心爆出一顆白光
    heartShot: `<circle cx="38" cy="30" r="22" fill="#f1ead6"/><circle cx="38" cy="30" r="14" fill="#a1887f"/><circle cx="38" cy="30" r="6" fill="#ffd54f" stroke-width="2.5"/>`
        + arrow(6, 58, 44, 24, STEEL, '#a5d6a7', 0.95) + `<path d="${starPath(38, 30, 9, 3, 4)}" fill="#ffffff" stroke-width="1.8"/>`,
    // 連環爆破：兩個捕獸夾一前一後炸開，中間一道火花把它們連起來
    chainTrap: smallTrap(16, 46, 0.8) + smallTrap(48, 22, 0.8)
        + `<path d="${starPath(16, 40, 13, 6, 8)}" fill="#ffb300" opacity="0.9"/><path d="${starPath(48, 16, 13, 6, 8)}" fill="#ffb300" opacity="0.9"/>`
        + duoStroke('M22 36 L28 32 L30 36 L42 26', '#ffe082', 2.5),
    // 回旋飛刀：一把飛刀射出去，一道彎弧箭頭繞回來
    boomerangKnife: placeAt(8, 22, 0, throwKnifeL(40)) + duoStroke('M50 26 C62 36 54 56 32 54 C20 53 12 46 12 38', '#ffd740', 3) + `<path d="M6 40 L12 32 L18 40 Z" fill="#ffd740" stroke-width="2.4"/>`,
    // 瘟疫毒霧：一團綠色毒霧，中間一顆小骷髏，上面冒毒泡
    plagueCloud: `<path d="M6 48 C2 40 8 32 16 34 C16 24 28 20 34 28 C38 20 52 22 52 32 C60 32 62 44 56 48 Z" fill="#9ccc65"/><path d="M14 44 C20 40 26 42 30 46 M36 42 C42 38 48 40 50 44" stroke="#dcedc8" stroke-width="2.4"/>`
        + skullAt(32, 40, 0.32) + `<circle cx="20" cy="16" r="4" fill="#ccff90" stroke-width="2"/><circle cx="44" cy="12" r="3" fill="#ccff90" stroke-width="2"/><circle cx="32" cy="8" r="2.4" fill="#ccff90" stroke-width="1.8"/>`,
    // 影爆：紫色影子剪影炸開，一圈影刃往外甩
    shadowBurst: `<path d="${starPath(32, 34, 30, 18, 8)}" fill="#7e57c2"/><path d="${starPath(32, 34, 20, 12, 8)}" fill="#b39ddb" stroke="none"/>`
        + `<g transform="translate(32 38) scale(0.6)"><circle cx="0" cy="-14" r="9" fill="#311b92"/><path d="M-12 22 L-12 0 C-12 -6 12 -6 12 0 L12 22 Z" fill="#311b92"/><path d="M-4 -15 L-1 -13 M4 -15 L1 -13" stroke="#ffd740" stroke-width="2.4"/></g>`,
    // 虎嘯：武僧張口大吼，三道琥珀色聲波往外擴
    tigerRoar: monkAt(16, 40, 1.4) + [0, 1, 2].map(i => duoStroke(`M${30 + i * 9} ${18 - i * 4} C${38 + i * 10} ${28} ${38 + i * 10} ${46} ${30 + i * 9} ${56 + i * 4}`, '#ffcc80', 3.5 - i * 0.6)).join(''),
    // 羅漢加持：一尊金色羅漢，旁邊一個沙漏
    arhatBless: `<circle cx="26" cy="34" r="20" fill="#ffd54f" opacity="0.35" stroke="none"/>` + `<g transform="translate(26 36) scale(1.6)"><path d="M-9 14 L-9 1 C-9 -6 9 -6 9 1 L9 14 Z" fill="#ffca28"/><circle cx="0" cy="-11" r="6.5" fill="#ffe082"/></g>`
        + `<path d="M44 8 L60 8 L60 12 C60 18 54 20 54 24 C54 28 60 30 60 36 L60 40 L44 40 L44 36 C44 30 50 28 50 24 C50 20 44 18 44 12 Z" fill="#fff8e1"/><path d="M47 37 L57 37 L52 30 Z" fill="#ffca28" stroke="none"/>`,
    // 無影步：三個腳印越來越淡，最前面一顆亮晶晶的星
    phantomStep: duoStroke('M4 60 C14 50 22 44 34 34', '#e0f7fa', 2.5)
        + `${[[12, 50, 0.3, -1], [24, 38, 0.6, 1], [38, 26, 1, -1]].map(([x, y, o, side]) => `<g opacity="${o}" transform="translate(${x + side * 4} ${y}) rotate(40)"><path d="M0 -11 C6 -11 7 -2 5 6 C4 11 -4 11 -5 6 C-7 -2 -6 -11 0 -11 Z" fill="#80deea" stroke-width="2.6"/><path d="M-2 -6 L2 -6" stroke="#e0f7fa" stroke-width="2"/></g>`).join('')}`
        + `<path d="${starPath(52, 14, 12, 4.5, 4)}" fill="#ffffff" stroke-width="2.4"/>${shine(50, 12, 2, 1.2)}`,
    // 龍拳：拳頭外面纏著一條金橘色的龍身，龍頭在拳前
    dragonFist: fistAt(30, 36, 0.62) + duoStroke('M6 54 C2 38 18 28 30 34 C42 40 56 30 50 14', '#ffb74d', 4.5)
        + `<path d="M44 10 L58 6 L54 18 Z" fill="#ffb74d" stroke-width="2.5"/><circle cx="52" cy="11" r="1.6" fill="${ICON_OUTLINE}" stroke="none"/>`,
    // 金剛不壞：金色菱形護身，裡面一尊盤坐的武僧
    diamondBody: `<path d="M32 4 L58 32 L32 60 L6 32 Z" fill="#ffca28"/><path d="M32 12 L50 32 L32 52 L14 32 Z" fill="#fff8e1" stroke-width="2.5"/>` + monkAt(32, 34, 1.1) + shine(22, 22, 3, 1.8),
    // 爆勁：一道青色氣功波打到盡頭炸開
    qiBurst: [[10, 10, 5], [22, 14, 4.5], [34, 16, 4]].map(([x, h, w]) => duoStroke(`M${x - 6} ${32 - h} Q${x + 4} 32 ${x - 6} ${32 + h}`, '#80deea', w)).join('')
        + `<path d="${starPath(48, 32, 16, 8, 10)}" fill="#80deea"/><circle cx="48" cy="32" r="6" fill="#e0f7fa" stroke-width="2.2"/>`,
    // 不滅眷屬：棺木打開，一個紫色眷屬往上站起來
    undyingThrall: `<path d="M18 30 L46 30 L50 40 L44 62 L20 62 L14 40 Z" fill="#5d4037"/><path d="M22 36 L42 36" stroke="#3e2723" stroke-width="2.5"/>`
        + ghostAt(32, 22, 0.62, '#ce93d8') + duoStroke('M54 30 L54 10 M48 16 L54 10 L60 16', '#b388ff', 2.6),
    // 無償血祭：金色高腳杯裝滿夜紫色的血，滿到溢出來
    freeBlood: `<path d="M14 10 L50 10 C50 28 42 36 32 36 C22 36 14 28 14 10 Z" fill="#ffca28"/><path d="M17 14 L47 14 C46 26 40 32 32 32 C24 32 18 26 17 14 Z" fill="#7c4dff" stroke-width="2.2"/>`
        + `<path d="M30 36 L34 36 L34 50 L30 50 Z" fill="#ffca28"/><path d="M20 56 C20 50 44 50 44 56 Z" fill="#ffca28"/>`
        + `<path d="M48 14 C52 18 52 22 50 24 C48 26 46 24 47 21 C47 19 49 18 48 14 Z" fill="#7c4dff" stroke-width="1.8"/>${shine(22, 18, 3, 1.6)}`,
    // 連咬：一隻蝙蝠，旁邊兩排咬痕
    batFrenzy: `<g transform="translate(22 26) scale(1.05)"><path d="${BAT_SHAPE}" fill="#4527a0" stroke-width="3"/><circle cx="-3" cy="-2" r="1.8" fill="#ffd54f" stroke="none"/><circle cx="3" cy="-2" r="1.8" fill="#ffd54f" stroke="none"/></g>`
        + biteAt(44, 40, 0.85) + biteAt(28, 52, 0.85),
});

const ICON_SVGS =Object.fromEntries(Object.entries(ICON_BODIES).map(([k, v]) => [k, iconSvg(v)]));

// 名字寫成「img:網址」就直接用那張圖（召喚卡用那種兵的立繪當圖示，見 game.js 的 buildSummonBlessings）
const IMG_ICON = 'img:';
function iconHtml(name, cls = 'icon') {
    if (name.startsWith(IMG_ICON)) return `<span class="${cls}" aria-hidden="true"><img class="icon-img" src="${name.slice(IMG_ICON.length)}" alt=""></span>`;
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
function getIconImage(name) {
    if (name && name.startsWith(IMG_ICON)) {
        if (!iconImages[name]) { const img = new Image(); img.src = name.slice(IMG_ICON.length); iconImages[name] = img; }
        return iconImages[name].complete ? iconImages[name] : null;
    }
    return iconImages[name] || null;
}
// 底部卡片的頭像要一個網址：沒有立繪的卡（血魔法、武僧的拳）用圖示
function iconDataUrl(name) { return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(ICON_SVGS[name] || '')}`; }
