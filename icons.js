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
const HEART_PATH = 'M32 54 C12 41 5 28 12 17 C18 9 28 10 32 18 C36 10 46 9 52 17 C59 28 52 41 32 54 Z';

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
    trophy: `<path d="M18 10 L46 10 L46 24 C46 34 40 40 32 40 C24 40 18 34 18 24 Z" fill="#ffd54f"/>
        <path d="M18 15 C8 15 8 29 19 30 M46 15 C56 15 56 29 45 30" stroke-width="4"/>
        <rect x="27" y="40" width="10" height="8" fill="#e0a82e"/><rect x="18" y="48" width="28" height="8" rx="2" fill="#e0a82e"/>${shine(25, 18, 3, 6, 0)}`,
    crystal: `<path d="M32 6 L50 24 L32 58 L14 24 Z" fill="#b388ff"/><path d="M14 24 L50 24 M32 6 L26 24 L32 58 M32 6 L38 24 L32 58" stroke-width="2.5"/>${shine(24, 18, 3, 6, 30)}`,
    gear: `<path d="${starPath(32, 32, 26, 20, 8)}" fill="#b0bec5"/><circle cx="32" cy="32" r="8" fill="#37474f"/>`,
    music: `<path d="M24 46 L24 14 L50 8 L50 40" stroke-width="5" stroke="${ICON_OUTLINE}"/><path d="M24 14 L50 8" stroke-width="7"/>
        <ellipse cx="18" cy="47" rx="8" ry="6" fill="#f1ead6" transform="rotate(-20 18 47)"/><ellipse cx="44" cy="41" rx="8" ry="6" fill="#f1ead6" transform="rotate(-20 44 41)"/>`,
    speaker: `<path d="M10 24 L22 24 L36 12 L36 52 L22 40 L10 40 Z" fill="#f1ead6"/>${duoStroke('M44 22 C49 27 49 37 44 42', '#f1ead6', 4)}${duoStroke('M50 15 C59 24 59 40 50 49', '#f1ead6', 4)}`,
    reroll: duoStroke('M48 26 C44 16 34 11 24 15 C17 18 13 24 13 31', '#8fd3ff') + `<path d="M50 12 L49 28 L36 23 Z" fill="#8fd3ff"/>` +
        duoStroke('M16 38 C20 48 30 53 40 49 C47 46 51 40 51 33', '#8fd3ff') + `<path d="M14 52 L15 36 L28 41 Z" fill="#8fd3ff"/>`,
    lock: `<path d="M20 28 L20 20 C20 12 25 8 32 8 C39 8 44 12 44 20 L44 28" stroke-width="10"/><path d="M20 28 L20 20 C20 12 25 8 32 8 C39 8 44 12 44 20 L44 28" stroke="#90a4ae" stroke-width="5"/>
        <rect x="13" y="27" width="38" height="29" rx="5" fill="#ffca28"/><circle cx="32" cy="39" r="4" fill="${ICON_OUTLINE}" stroke="none"/><path d="M32 41 L32 48" stroke-width="4"/>`,
    arrowUp: `<path d="M32 7 L55 32 L42 32 L42 57 L22 57 L22 32 L9 32 Z" fill="#9ccc65"/>${shine(30, 18, 3, 5, 0)}`,
    summon: `<circle cx="32" cy="32" r="25" fill="#7e57c2"/><circle cx="32" cy="32" r="17" stroke="#d1c4e9" stroke-width="2.5"/><path d="M32 20 L32 44 M20 32 L44 32" stroke-width="10"/><path d="M32 20 L32 44 M20 32 L44 32" stroke="#f3e5f5" stroke-width="5"/>`,
    home: `<path d="M8 32 L32 10 L56 32 L49 32 L49 55 L15 55 L15 32 Z" fill="#f1ead6"/><rect x="27" y="38" width="10" height="17" fill="#8d6e63"/>`,
    warning: `<path d="M32 7 L59 54 L5 54 Z" fill="#ff5252"/><path d="M32 22 L32 38" stroke="#fff" stroke-width="6"/><circle cx="32" cy="46" r="3.5" fill="#fff" stroke="none"/>`,
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
    raiseDead: `<path d="M22 6 L42 6 L50 18 L44 58 L20 58 L14 18 Z" fill="#8d6e63"/><path d="M32 16 L32 44 M24 25 L40 25" stroke-width="8"/><path d="M32 16 L32 44 M24 25 L40 25" stroke="#d7ccc8" stroke-width="4"/>`,
    soulHarvest: `<path d="M14 58 L40 10" stroke-width="9"/><path d="M14 58 L40 10" stroke="#8d6e63" stroke-width="5"/>
        <path d="M38 12 C48 8 58 14 60 26 C54 20 46 18 36 20 Z" fill="#cfd8dc"/>
        <path d="M14 40 C8 40 6 34 9 30 C10 28 10 26 9 23 C14 25 16 28 16 31 C17 29 18 28 18 26 C22 30 22 36 20 38 C19 40 17 40 14 40 Z" fill="#62dbe2" stroke-width="3"/>`,
    magnet: duoStroke('M18 14 L18 34 C18 44 24 50 32 50 C40 50 46 44 46 34 L46 14', '#e5484d', 9) +
        `<rect x="10" y="8" width="16" height="11" fill="#cfd8dc" stroke-width="3.5"/><rect x="38" y="8" width="16" height="11" fill="#cfd8dc" stroke-width="3.5"/>`,
    vitality: `<path d="${HEART_PATH}" fill="#e5484d" transform="translate(-2 2) scale(0.9)"/><circle cx="46" cy="44" r="13" fill="#9ccc65"/>
        <path d="M46 37 L46 51 M39 44 L53 44" stroke="#fff" stroke-width="4.5"/>${shine(18, 22, 4.5, 3)}`,
    novaPower: `<path d="${starPath(32, 32, 28, 13, 10)}" fill="#c06bf5"/><circle cx="32" cy="32" r="9" fill="#f6dcff"/>
        <path d="M50 40 L50 58 M41 49 L59 49" stroke-width="9"/><path d="M50 40 L50 58 M41 49 L59 49" stroke="#ffd54f" stroke-width="4.5"/>`,
    pact: `<rect x="14" y="10" width="34" height="44" rx="3" fill="#f3e5c0"/><path d="M10 10 L52 10 M10 54 L52 54" stroke-width="7"/><path d="M10 10 L52 10 M10 54 L52 54" stroke="#c9a15c" stroke-width="3.5"/>
        <path d="M20 21 L42 21 M20 28 L38 28 M20 35 L34 35" stroke="#a1887f" stroke-width="2.5"/><circle cx="40" cy="44" r="7" fill="#c62828" stroke-width="3"/>`,
    lifesteal: `<path d="M32 6 C40 20 50 30 50 40 C50 50 42 57 32 57 C22 57 14 50 14 40 C14 30 24 20 32 6 Z" fill="#c62828"/>${shine(24, 38, 3, 6, 15)}
        <path d="M23 30 L27 43 L31 30 Z" fill="#f1ead6" stroke-width="2.5"/><path d="M33 30 L37 43 L41 30 Z" fill="#f1ead6" stroke-width="2.5"/>`,
};

const ICON_SVGS = Object.fromEntries(Object.entries(ICON_BODIES).map(([k, v]) => [k, iconSvg(v)]));

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
