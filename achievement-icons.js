// 成就圖示：每個成就一張向量圖，風格跟 icons.js 一樣（深色粗描邊、平塗、一點亮部）。
// 同一系列（波數、連殺、大軍、生涯）用同一個母題、越後面越隆重；不同系列各有自己的母題，一眼分得出是哪一類。
// 圖鑑那一類不在這裡：直接用那隻怪的立繪（見 game.js 的 achvIconHtml）。
// 只在畫面上的 DOM 用，不進畫布的預載（不像 ICON_SVGS 那樣全部轉成 Image）。

// 小零件都畫在以 (0,0) 為中心、約 ±28 的範圍，用 at() 擺到 64×64 的格子裡
function at(x, y, s, body, r = 0) {
    return `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">${body}</g>`;
}
const C = {
    bone: '#f1ead6', boneDark: '#cfc4a8', gold: '#ffd54f', goldDark: '#e0a82e', red: '#e5484d', blood: '#b71c1c',
    soul: '#62dbe2', soulLight: '#d6fbfb', violet: '#b388ff', violetDark: '#6a3fb5', green: '#7cb342', toxic: '#9ccc65',
    sky: '#8fd3ff', steel: '#b0bec5', steelDark: '#607d8b', wood: '#8d6e63', woodDark: '#5d4037', orange: '#ffa726',
    night: '#2c2140', ink: ICON_OUTLINE, white: '#ffffff', ember: '#ff7043', ice: '#b3e5fc',
};
const P = {
    skull: (fill = C.bone, eye = C.ink) => `<path d="M0 -24 C-14 -24 -22 -14 -22 -2 C-22 6 -18 11 -12 14 L-12 23 L12 23 L12 14 C18 11 22 6 22 -2 C22 -14 14 -24 0 -24 Z" fill="${fill}"/>
        <ellipse cx="-9" cy="-2" rx="6" ry="7" fill="${eye}" stroke="none"/><ellipse cx="9" cy="-2" rx="6" ry="7" fill="${eye}" stroke="none"/>
        <path d="M0 5 L-3.5 12 L3.5 12 Z" fill="${C.ink}" stroke="none"/><path d="M-5 23 L-5 17 M0 23 L0 17 M5 23 L5 17" stroke-width="3"/>${shine(-11, -15, 4.5, 2.6)}`,
    sword: (blade = C.steel) => `<path d="M0 -28 L5 -20 L5 6 L-5 6 L-5 -20 Z" fill="${blade}"/><path d="M0 -22 L0 2" stroke="${C.white}" stroke-width="1.5" opacity="0.7"/>
        <rect x="-11" y="6" width="22" height="5" rx="2" fill="${C.goldDark}"/><rect x="-3" y="11" width="6" height="11" fill="${C.woodDark}"/><circle cx="0" cy="25" r="4" fill="${C.goldDark}"/>`,
    crown: (fill = C.gold) => `<path d="M-22 10 L-24 -12 L-12 -2 L0 -18 L12 -2 L24 -12 L22 10 Z" fill="${fill}"/><rect x="-22" y="10" width="44" height="8" rx="2" fill="${C.goldDark}"/>
        <circle cx="0" cy="3" r="3.5" fill="${C.red}" stroke-width="2.5"/>${shine(-12, 0, 2.5, 5, 0)}`,
    shield: (fill = C.steel, rim = C.steelDark) => `<path d="M0 -26 L22 -18 C22 4 14 18 0 26 C-14 18 -22 4 -22 -18 Z" fill="${rim}"/>
        <path d="M0 -19 L15 -13 C15 2 9 12 0 18 C-9 12 -15 2 -15 -13 Z" fill="${fill}" stroke-width="2.5"/>`,
    flame: (outer = C.orange, inner = C.gold) => `<path d="M0 26 C-14 26 -20 14 -14 2 C-10 -6 -10 -14 -12 -24 C-2 -18 4 -10 4 -2 C8 -6 10 -12 9 -18 C19 -8 22 6 16 16 C12 23 7 26 0 26 Z" fill="${outer}"/>
        <path d="M0 20 C-7 20 -9 13 -6 8 C-4 4 -2 2 -1 -3 C5 1 8 7 7 12 C6 17 4 20 0 20 Z" fill="${inner}" stroke="none"/>`,
    moon: (fill = '#fff3c4') => `<path d="M8 -24 C-8 -24 -20 -12 -20 2 C-20 16 -8 26 8 26 C-2 20 -6 10 -6 1 C-6 -10 -1 -19 8 -24 Z" fill="${fill}"/>`,
    coin: (fill = C.gold) => `<circle r="14" fill="${fill}"/><circle r="9" fill="none" stroke="${C.goldDark}" stroke-width="2.5"/>${shine(-5, -6, 3, 2)}`,
    gem: (fill = C.violet) => `<path d="M0 -20 L16 -6 L0 22 L-16 -6 Z" fill="${fill}"/><path d="M-16 -6 L16 -6 M0 -20 L-6 -6 L0 22 M0 -20 L6 -6 L0 22" stroke-width="2.5"/>${shine(-7, -9, 2.5, 5, 30)}`,
    bone: (fill = C.bone) => `<path d="M-20 -4 C-26 -10 -18 -16 -14 -10 L14 -10 C18 -16 26 -10 20 -4 C26 2 18 8 14 2 L-14 2 C-18 8 -26 2 -20 -4 Z" fill="${fill}"/>`,
    soul: (fill = C.soul) => `<path d="M0 24 C-12 24 -17 14 -12 5 C-9 -1 -8 -8 -11 -17 C-2 -12 2 -6 2 0 C5 -4 6 -8 6 -13 C15 -5 17 6 13 13 C10 20 5 24 0 24 Z" fill="${fill}"/>
        <path d="M0 19 C-6 19 -8 14 -6 9 C-4 6 -2 5 -1 1 C4 4 7 8 6 13 C5 17 3 19 0 19 Z" fill="${C.soulLight}" stroke="none"/>`,
    eye: (iris = '#f06292') => `<path d="M-24 0 C-14 -16 14 -16 24 0 C14 16 -14 16 -24 0 Z" fill="${C.white}"/><circle r="9" fill="${iris}"/><circle r="4" fill="${C.ink}" stroke="none"/>${shine(-4, -5, 2.5, 1.8)}`,
    ghost: (fill = '#b2ebf2') => `<path d="M-14 22 L-14 -2 C-14 -14 -8 -22 0 -22 C8 -22 14 -14 14 -2 L14 22 L9 17 L4 22 L0 17 L-4 22 L-9 17 Z" fill="${fill}"/>
        <ellipse cx="-5" cy="-4" rx="3" ry="4" fill="${C.ink}" stroke="none"/><ellipse cx="5" cy="-4" rx="3" ry="4" fill="${C.ink}" stroke="none"/>`,
    star: (fill = C.gold, r = 22) => `<path d="${starPath(0, 0, r, r * 0.45, 5)}" fill="${fill}"/>`,
    bolt: (fill = '#fff176') => `<path d="M4 -26 L-12 4 L0 4 L-6 26 L14 -6 L2 -6 L8 -26 Z" fill="${fill}"/>`,
    heart: (fill = C.red) => `<path d="M0 22 C-20 9 -27 -4 -20 -15 C-14 -23 -4 -22 0 -14 C4 -22 14 -23 20 -15 C27 -4 20 9 0 22 Z" fill="${fill}"/>${shine(-11, -10, 4, 2.6)}`,
    drop: (fill = C.blood) => `<path d="M0 -24 C8 -10 16 0 16 9 C16 19 8 25 0 25 C-8 25 -16 19 -16 9 C-16 0 -8 -10 0 -24 Z" fill="${fill}"/>${shine(-6, 8, 3, 5, 20)}`,
    laurel: (fill = C.green) => {
        let s = `<path d="M-8 24 C-26 14 -28 -8 -16 -24" stroke-width="3.5"/><path d="M8 24 C26 14 28 -8 16 -24" stroke-width="3.5"/>`;
        for (let i = 0; i < 5; i++) {
            const t = i / 4, y = 18 - t * 38, x = -14 - Math.sin(t * Math.PI) * 10;
            s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="6" ry="3.2" transform="rotate(${-40 + t * 60} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${fill}" stroke-width="2.5"/>`;
            s += `<ellipse cx="${(-x).toFixed(1)}" cy="${y.toFixed(1)}" rx="6" ry="3.2" transform="rotate(${40 - t * 60} ${(-x).toFixed(1)} ${y.toFixed(1)})" fill="${fill}" stroke-width="2.5"/>`;
        }
        return s;
    },
    tomb: (fill = '#90a4ae') => `<path d="M-14 24 L-14 -10 C-14 -20 -7 -25 0 -25 C7 -25 14 -20 14 -10 L14 24 Z" fill="${fill}"/><path d="M0 -14 L0 4 M-6 -8 L6 -8" stroke-width="3"/>`,
    dagger: (blade = C.steel) => `<path d="M0 -24 L4 -17 L4 3 L-4 3 L-4 -17 Z" fill="${blade}"/><rect x="-8" y="3" width="16" height="4" rx="2" fill="${C.goldDark}"/><rect x="-2.5" y="7" width="5" height="10" fill="${C.woodDark}"/>`,
    chain: () => `<ellipse cx="-12" cy="0" rx="8" ry="5" fill="none" stroke="${C.steelDark}" stroke-width="4"/><ellipse cx="0" cy="0" rx="8" ry="5" fill="none" stroke="${C.steel}" stroke-width="4"/><ellipse cx="12" cy="0" rx="8" ry="5" fill="none" stroke="${C.steelDark}" stroke-width="4"/>`,
};
// 底盤：同一系列共用一種底盤形狀，顏色隨等級變
function disc(fill, r = 28) { return `<circle cx="32" cy="32" r="${r}" fill="${fill}"/>`; }
function plaque(fill) { return `<path d="M32 4 L58 16 L58 40 C58 50 46 58 32 61 C18 58 6 50 6 40 L6 16 Z" fill="${fill}"/>`; }
function rays(cx, cy, r1, r2, n, color, w = 3) {
    let d = '';
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; d += `M${(cx + Math.cos(a) * r1).toFixed(1)} ${(cy + Math.sin(a) * r1).toFixed(1)} L${(cx + Math.cos(a) * r2).toFixed(1)} ${(cy + Math.sin(a) * r2).toFixed(1)} `; }
    return `<path d="${d}" stroke="${color}" stroke-width="${w}"/>`;
}
function sparks(list, color = C.gold) { return list.map(([x, y, r]) => `<path d="${starPath(x, y, r, r * 0.35, 4)}" fill="${color}" stroke-width="2"/>`).join(''); }
function pips(n, y, color = C.gold) {
    let s = '';
    for (let i = 0; i < n; i++) { const x = 32 + (i - (n - 1) / 2) * 9; s += `<circle cx="${x}" cy="${y}" r="3.4" fill="${color}" stroke-width="2.5"/>`; }
    return s;
}

const ACHV_ICON_BODIES = {
    // ---- 征途：一路走下去的景象，從日出到最後的長夜 ----
    wave5: `${rays(32, 44, 22, 30, 9, C.gold, 3)}<path d="M12 44 A20 20 0 0 1 52 44 Z" fill="${C.orange}"/>${shine(24, 34, 4, 2.5)}
        <path d="M4 44 L60 44 L60 60 L4 60 Z" fill="${C.night}"/>${at(16, 46, 0.5, P.tomb('#90a4ae'))}${at(48, 50, 0.32, P.tomb('#78909c'))}`,
    wave10: `<path d="M8 58 C16 46 48 46 56 58 Z" fill="${C.woodDark}"/>${at(32, 30, 0.95, P.sword())}
        <path d="M34 14 L52 18 L36 24 Z" fill="${C.red}" stroke-width="3"/>`,
    wave15: `${at(30, 34, 1.05, `<circle r="24" fill="${C.wood}"/><circle r="15" fill="${C.woodDark}" stroke-width="3"/><circle r="5" fill="${C.steel}" stroke-width="2.5"/>
        <path d="M-17 -8 L-10 -4 M12 10 L18 14 M-6 16 L-2 10" stroke-width="2.5"/>`)}
        <path d="M60 6 L36 30" stroke-width="3"/><path d="M60 6 L52 6 M60 6 L60 14" stroke="${C.red}" stroke-width="4"/><path d="M57 9 L50 4 M57 9 L62 16" stroke-width="2"/>`,
    wave20: `${at(32, 30, 1.15, P.sword(), 40)}${at(32, 30, 1.15, P.sword(), -40)}${at(32, 50, 0.38, P.skull())}`,
    wave25: `<path d="M16 6 L48 6 M16 58 L48 58" stroke-width="5"/><path d="M19 8 C19 22 30 26 30 32 C30 38 19 42 19 56 L45 56 C45 42 34 38 34 32 C34 26 45 22 45 8 Z" fill="${C.ice}"/>
        <path d="M23 18 L41 18 C40 25 34 28 32 31 C30 28 24 25 23 18 Z" fill="${C.gold}" stroke="none"/><path d="M22 54 C24 46 40 46 42 54 Z" fill="${C.gold}" stroke="none"/><path d="M32 33 L32 46" stroke="${C.gold}" stroke-width="2"/>`,
    wave30: `${at(20, 46, 0.55, P.skull())}${at(44, 46, 0.55, P.skull())}${at(32, 22, 0.6, P.skull())}`,
    wave35: `<path d="M2 40 C10 30 18 30 22 38 C26 30 34 30 38 38 C42 30 50 30 54 38 C58 32 62 34 62 34 L62 62 L2 62 Z" fill="${C.blood}"/>
        <path d="M2 50 C10 44 18 44 22 50 C26 44 34 44 38 50 C42 44 50 44 54 50 L62 50" stroke="#ef5350" stroke-width="3"/>${at(32, 22, 0.62, P.skull())}`,
    wave40: `<path d="M12 22 C6 12 8 4 14 2 C14 10 18 14 22 16 Z M52 22 C58 12 56 4 50 2 C50 10 46 14 42 16 Z" fill="${C.boneDark}"/>
        <path d="M32 12 C18 12 12 22 12 32 C12 40 18 44 22 46 L24 58 L40 58 L42 46 C46 44 52 40 52 32 C52 22 46 12 32 12 Z" fill="${C.bone}"/>
        <ellipse cx="23" cy="31" rx="5" ry="6" fill="${C.toxic}" stroke-width="2.5"/><ellipse cx="41" cy="31" rx="5" ry="6" fill="${C.toxic}" stroke-width="2.5"/>
        <path d="M24 50 L28 46 L32 50 L36 46 L40 50" stroke-width="2.5"/>`,
    wave45: `${at(22, 24, 0.75, P.moon())}<rect x="38" y="34" width="12" height="24" rx="2" fill="${C.bone}"/>${at(44, 25, 0.32, P.flame())}
        ${sparks([[50, 10, 4], [10, 48, 3]], '#fff3c4')}`,
    // 速通：越快越隆重——疾行的靴子、帶翅膀的沙漏、劃破天空的彗星
    speed28: `<path d="M18 10 L34 10 L34 40 L52 46 C56 48 56 56 50 56 L18 56 Z" fill="${C.wood}"/><path d="M18 46 L52 46" stroke-width="3"/>
        <path d="M34 12 C44 6 54 10 58 18 C50 16 44 18 36 22 Z" fill="${C.bone}"/><path d="M2 24 L14 24 M4 34 L14 34 M2 44 L14 44" stroke="${C.sky}" stroke-width="3.5"/>`,
    speed24: `<path d="M24 10 L40 10 M24 54 L40 54" stroke-width="4"/><path d="M26 12 C26 24 31 27 31 32 C31 37 26 40 26 52 L38 52 C38 40 33 37 33 32 C33 27 38 24 38 12 Z" fill="${C.ice}"/>
        <path d="M28 46 C30 42 34 42 36 46 L36 50 L28 50 Z" fill="${C.gold}" stroke="none"/>
        <path d="M24 26 C12 18 4 22 2 30 C8 30 12 32 14 36 C16 32 20 30 24 32 Z M40 26 C52 18 60 22 62 30 C56 30 52 32 50 36 C48 32 44 30 40 32 Z" fill="${C.white}"/>`,
    speed20: `<path d="M6 58 C20 44 34 30 46 18" stroke="${C.sky}" stroke-width="10"/><path d="M6 58 C20 44 34 30 46 18" stroke="${C.white}" stroke-width="4"/>
        <circle cx="48" cy="16" r="11" fill="${C.gold}"/><circle cx="48" cy="16" r="5" fill="#fff8e1" stroke="none"/>${sparks([[20, 12, 4], [58, 40, 4], [30, 30, 3]], C.white)}`,
    win: `${at(32, 34, 1, P.laurel(C.gold))}${at(32, 30, 0.62, P.crown('#ef9a9a'))}<path d="M22 22 L30 34 L26 40" stroke="${C.ink}" stroke-width="2.5"/>`,

    // ---- 無盡：漩渦與虛空，越深越暗、越華麗 ----
    endless55: duoStroke('M32 32 C24 20 8 20 8 32 C8 44 24 44 32 32 C40 20 56 20 56 32 C56 44 40 44 32 32 Z', C.violet, 5),
    endless: `${disc(C.night)}<path d="M32 32 m0 -3 a3 3 0 1 1 -3 3 a6 6 0 1 1 6 6 a9 9 0 1 1 -9 -9 a12 12 0 1 1 12 12 a15 15 0 1 1 -15 -15 a18 18 0 1 1 18 18" stroke="${C.violet}" stroke-width="3.5"/>
        ${sparks([[12, 14, 3], [52, 50, 3], [50, 12, 2.5]], '#e1bee7')}`,
    endless70: `${disc(C.night)}<path d="M32 32 m-20 0 a20 20 0 1 1 20 20 a14 14 0 1 1 -14 -14" stroke="${C.violetDark}" stroke-width="3"/>${at(32, 32, 0.62, P.eye('#d500f9'))}`,
    endless80: `${disc(C.night)}<ellipse cx="32" cy="32" rx="16" ry="22" fill="#4a148c"/><ellipse cx="32" cy="32" rx="9" ry="14" fill="#12081f" stroke-width="3"/>
        <path d="M14 58 C16 54 20 54 20 58 Z M24 52 C26 48 30 48 30 52 Z" fill="${C.bone}" stroke-width="2.5"/>${sparks([[50, 14, 3.5]], '#e1bee7')}`,
    endless100: `<circle cx="32" cy="32" r="22" stroke="${C.ink}" stroke-width="12"/><circle cx="32" cy="32" r="22" stroke="${C.gold}" stroke-width="7"/>
        <path d="M45 13 C52 10 58 14 56 20 C52 18 48 18 45 13 Z" fill="${C.goldDark}"/><circle cx="51" cy="15" r="1.6" fill="${C.ink}" stroke="none"/>${at(32, 32, 0.55, P.star('#fff3c4'))}`,

    // ---- 詛咒：每一級是一張符咒，圖案就是那一條詛咒 ----
    curse1: `<path d="M18 4 L46 4 L46 60 L18 60 Z" fill="#fff8e1"/><path d="M18 4 L46 4 L46 12 L18 12 Z" fill="${C.red}" stroke-width="3"/>
        ${duoStroke('M22 22 L28 52 M30 18 L36 50 M38 22 L42 48', C.blood, 3)}`,
    curse2: `<path d="M10 18 C10 12 54 12 54 18 L54 46 C54 52 10 52 10 46 Z" fill="#fff8e1"/><path d="M16 26 L44 26 M16 34 L38 34" stroke="${C.wood}" stroke-width="2.5"/>
        ${at(36, 30, 0.9, P.dagger(), 35)}<circle cx="44" cy="44" r="5" fill="${C.blood}" stroke-width="2.5"/>`,
    curse3: `<path d="M22 26 C10 14 4 18 2 24 C8 24 10 28 8 32 C14 30 18 32 20 36 Z M42 26 C54 14 60 18 62 24 C56 24 54 28 56 32 C50 30 46 32 44 36 Z" fill="${C.blood}"/>
        ${at(32, 34, 0.7, P.skull('#ffcdd2'))}<path d="M6 46 L20 46 M4 54 L22 54 M42 46 L58 46 M42 54 L60 54" stroke="${C.sky}" stroke-width="3.5"/>`,
    curseMid: `<path d="M20 14 L44 14 L46 22 C54 28 54 52 46 58 L18 58 C10 52 10 28 18 22 Z" fill="${C.steelDark}"/><rect x="18" y="8" width="28" height="8" rx="2" fill="${C.wood}"/>
        <path d="M30 26 L26 36 L34 40 L28 52" stroke="${C.ink}" stroke-width="3"/>${at(40, 44, 0.35, P.soul('#4f8a8d'))}`,
    curse5: `${at(32, 36, 1, P.crown())}<path d="M12 26 C4 18 6 6 14 4 C12 12 16 18 20 22 Z M52 26 C60 18 58 6 50 4 C52 12 48 18 44 22 Z" fill="${C.blood}"/>`,
    curse6: `${at(32, 38, 0.95, P.skull())}<path d="M12 22 L16 6 L24 16 L32 2 L40 16 L48 6 L52 22 Z" fill="${C.goldDark}"/><path d="M12 22 L52 22" stroke-width="4"/>
        <ellipse cx="23.5" cy="36" rx="2.5" ry="3" fill="${C.red}" stroke="none"/><ellipse cx="40.5" cy="36" rx="2.5" ry="3" fill="${C.red}" stroke="none"/>`,
    curse7: `${at(32, 32, 1.05, P.heart('#ef5350'))}<path d="M30 12 L36 24 L28 32 L36 42 L32 54" stroke="${C.ink}" stroke-width="3.5"/>
        <rect x="8" y="34" width="20" height="8" rx="2" fill="#fff8e1" transform="rotate(-30 18 38)" stroke-width="2.5"/>`,
    curseMax: `<path d="${starPath(32, 32, 30, 16, 8)}" fill="#311b92"/><circle cx="32" cy="32" r="12" fill="${C.blood}"/>${at(32, 32, 0.38, P.skull('#ffcdd2', C.blood))}
        ${at(12, 52, 0.55, P.chain(), -30)}${at(52, 52, 0.55, P.chain(), 30)}`,

    // ---- 首領：各自的頭像；三個挑戰另外畫 ----
    boss_ColossusBoss: `<path d="M32 4 C14 4 4 16 4 30 C4 40 10 46 16 50 L18 60 L46 60 L48 50 C54 46 60 40 60 30 C60 16 50 4 32 4 Z" fill="#cfd8dc"/>
        <path d="M14 26 L26 24 L28 36 L16 38 Z M50 26 L38 24 L36 36 L48 38 Z" fill="${C.ink}" stroke="none"/><circle cx="21" cy="31" r="2.5" fill="#ff8a65" stroke="none"/><circle cx="43" cy="31" r="2.5" fill="#ff8a65" stroke="none"/>
        <path d="M24 10 L28 18 L24 22 M44 44 L50 40" stroke-width="2.5"/><path d="M24 52 L24 60 M32 52 L32 60 M40 52 L40 60" stroke-width="3"/>`,
    boss_PlagueBoss: `<path d="M8 50 C2 36 10 14 32 12 C54 14 62 36 56 50 C50 60 14 60 8 50 Z" fill="${C.toxic}"/>
        <circle cx="22" cy="30" r="6" fill="#fff59d"/><circle cx="22" cy="30" r="2.5" fill="${C.ink}" stroke="none"/><circle cx="40" cy="26" r="4.5" fill="#fff59d"/><circle cx="40" cy="26" r="2" fill="${C.ink}" stroke="none"/>
        <circle cx="34" cy="40" r="7" fill="#fff59d"/><circle cx="34" cy="40" r="3" fill="${C.ink}" stroke="none"/><circle cx="14" cy="10" r="4" fill="${C.toxic}" stroke-width="2.5"/><circle cx="50" cy="6" r="3" fill="${C.toxic}" stroke-width="2.5"/>`,
    boss_HunterBoss: `<path d="M8 10 L22 22 L42 22 L56 10 L54 34 C54 48 44 58 32 58 C20 58 10 48 10 34 Z" fill="#3b3366"/>
        <path d="M18 34 L28 38 L18 40 Z M46 34 L36 38 L46 40 Z" fill="#ea80fc" stroke-width="2"/><path d="M26 50 L32 54 L38 50" stroke-width="3"/><path d="M28 46 L36 46" stroke-width="3"/>`,
    boss_DragonBoss: `<path d="M10 20 C4 8 10 2 16 4 C16 12 20 16 26 18 Z M54 20 C60 8 54 2 48 4 C48 12 44 16 38 18 Z" fill="${C.boneDark}"/>
        <path d="M32 14 C18 14 14 24 14 32 L10 50 C16 56 24 52 26 48 L38 48 C40 52 48 56 54 50 L50 32 C50 24 46 14 32 14 Z" fill="${C.bone}"/>
        <ellipse cx="24" cy="30" rx="4.5" ry="5.5" fill="${C.toxic}" stroke-width="2.5"/><ellipse cx="40" cy="30" rx="4.5" ry="5.5" fill="${C.toxic}" stroke-width="2.5"/>
        <path d="M26 54 C28 62 36 62 38 54" fill="#76ff03" stroke-width="3"/>`,
    boss_LichBoss: `${at(32, 38, 0.95, P.skull('#ffcdd2', C.blood))}<path d="M10 20 L14 4 L22 14 L32 0 L42 14 L50 4 L54 20 Z" fill="${C.gold}"/><path d="M10 20 L54 20" stroke-width="4"/>
        <circle cx="32" cy="12" r="3" fill="${C.red}" stroke-width="2"/><ellipse cx="23.5" cy="36" rx="2.6" ry="3" fill="#ff5252" stroke="none"/><ellipse cx="40.5" cy="36" rx="2.6" ry="3" fill="#ff5252" stroke="none"/>`,
    bossNoHit: `${at(32, 34, 1.05, P.shield('#eceff1', C.steel))}${at(32, 32, 0.42, P.crown())}${sparks([[52, 12, 6], [12, 50, 4]], C.white)}`,
    bossBlitz: `${at(26, 40, 0.75, P.skull('#cfd8dc'))}${at(42, 22, 0.85, P.bolt())}<path d="M18 24 L24 30 M34 46 L40 52" stroke="#fff176" stroke-width="3"/>`,
    bossTotal: `<path d="M10 14 L46 14 L50 40 L14 40 Z" fill="${C.steel}"/><path d="M14 40 L50 40" stroke-width="4"/><rect x="42" y="38" width="8" height="22" rx="3" fill="${C.woodDark}"/>
        <path d="M14 18 L16 22 M20 18 L22 22 M26 18 L28 22 M32 18 L34 22 M38 18 L40 22" stroke-width="2.5"/><circle cx="22" cy="30" r="3" fill="${C.ink}" stroke="none"/>${at(24, 52, 0.3, P.crown())}`,

    // ---- 精英：被貫穿的王冠 ----
    elite500: `${at(30, 36, 0.95, P.crown())}<path d="M6 58 L54 8" stroke-width="5"/><path d="M6 58 L54 8" stroke="${C.wood}" stroke-width="2.5"/><path d="M54 8 L44 10 L52 18 Z" fill="${C.steel}" stroke-width="2.5"/><path d="M8 50 L4 58 L12 56" fill="${C.red}" stroke-width="2.5"/>`,
    elite5000: `${at(20, 50, 0.45, P.crown())}${at(44, 50, 0.45, P.crown())}${at(32, 36, 0.5, P.crown())}${at(32, 22, 0.8, P.sword('#e0e0e0'))}`,

    // ---- 大軍：骷髏越聚越多，最後變成天災 ----
    army100: `<path d="M36 6 L36 58" stroke-width="4"/><path d="M36 8 L60 12 L54 22 L60 32 L36 30 Z" fill="${C.violetDark}"/>${at(47, 19, 0.28, P.skull())}
        ${at(16, 46, 0.42, P.skull())}${at(26, 52, 0.36, P.skull())}`,
    army1: `<path d="M2 50 C10 44 16 44 22 50 C28 44 36 44 42 50 C48 44 56 44 62 50 L62 62 L2 62 Z" fill="${C.violetDark}"/>
        ${at(14, 38, 0.34, P.skull())}${at(32, 34, 0.38, P.skull())}${at(50, 38, 0.34, P.skull())}${at(23, 22, 0.3, P.skull())}${at(41, 22, 0.3, P.skull())}`,
    army1000: (() => { let s = ''; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) s += at(12 + c * 13.5 + (r % 2) * 6, 18 + r * 15, 0.24, P.skull()); return s + `<path d="M6 4 L6 60 M58 4 L58 60" stroke-width="3"/><path d="M6 4 L2 12 L10 12 Z M58 4 L54 12 L62 12 Z" fill="${C.steel}" stroke-width="2.5"/>`; })(),
    army2: `<path d="M8 6 L8 60" stroke-width="4"/><path d="M8 8 L56 8 L48 22 L56 36 L8 36 Z" fill="#4a148c"/>${at(30, 22, 0.42, P.skull('#e1bee7'))}
        ${at(20, 50, 0.3, P.skull())}${at(34, 52, 0.3, P.skull())}${at(48, 50, 0.3, P.skull())}`,
    army5000: `<path d="M10 30 C2 30 2 18 12 16 C12 6 26 2 32 10 C38 2 54 6 52 16 C62 18 62 30 54 30 Z" fill="#37474f"/>
        ${at(32, 20, 0.34, P.skull('#cfd8dc', C.red))}${at(14, 44, 0.22, P.skull())}${at(30, 54, 0.22, P.skull())}${at(48, 44, 0.22, P.skull())}
        <path d="M20 34 L18 40 M40 34 L42 42 M26 34 L24 46" stroke="${C.boneDark}" stroke-width="2.5"/>`,

    // ---- 進化：同一個兵的三階頭飾 ----
    evo_SkeletonWarrior_1: `${at(32, 36, 0.95, P.skull())}<path d="M12 28 C12 10 52 10 52 28 L46 28 L46 22 L18 22 L18 28 Z" fill="#64b5f6"/><path d="M32 12 L32 22" stroke-width="3"/>`,
    evo_SkeletonWarrior_2: `${at(32, 38, 0.9, P.skull())}<path d="M12 30 C12 12 52 12 52 30 L46 30 L46 24 L18 24 L18 30 Z" fill="${C.gold}"/>
        <path d="M32 14 C32 4 44 0 52 4 C46 6 42 10 40 16 Z" fill="${C.red}"/>`,
    evo_SkeletonWarrior_3: `<path d="M8 40 C4 54 14 62 20 60 L44 60 C50 62 60 54 56 40 Z" fill="${C.blood}"/>${at(32, 36, 0.85, P.skull())}
        <path d="M14 22 L18 6 L26 16 L32 2 L38 16 L46 6 L50 22 Z" fill="#ef5350"/><path d="M14 22 L50 22" stroke-width="4"/>`,
    evo_EyeMonster_1: `${at(28, 36, 0.85, P.eye())}${duoStroke('M38 20 L48 6 L58 18', '#f48fb1', 3)}<path d="M58 18 L52 18 L57 12 Z" fill="#f48fb1" stroke-width="2"/>`,
    evo_EyeMonster_2: `<path d="M6 32 C16 14 48 14 58 32 C48 50 16 50 6 32 Z" fill="${C.white}"/><circle cx="24" cy="32" r="8" fill="#f06292"/><circle cx="40" cy="32" r="8" fill="#f06292"/>
        <circle cx="24" cy="32" r="3.5" fill="${C.ink}" stroke="none"/><circle cx="40" cy="32" r="3.5" fill="${C.ink}" stroke="none"/>${shine(20, 28, 2, 1.5)}${shine(36, 28, 2, 1.5)}`,
    evo_EyeMonster_3: `<path d="${starPath(32, 32, 30, 18, 10)}" fill="${C.ember}"/>${at(32, 32, 0.72, P.eye('#ef5350'))}`,
    evo_Wraith_1: `${at(28, 32, 1, P.ghost('#80cbc4'))}${duoStroke('M50 14 L50 40', '#64b5f6', 3)}<path d="M44 34 L50 44 L56 34 Z" fill="#64b5f6" stroke-width="2.5"/>`,
    evo_Wraith_2: `<circle cx="32" cy="32" r="28" stroke="#4db6ac" stroke-width="3"/><circle cx="32" cy="32" r="21" stroke="#80cbc4" stroke-width="3"/>${at(32, 34, 0.75, P.ghost('#b2dfdb'))}`,
    evo_Wraith_3: `<path d="${starPath(32, 34, 30, 14, 9)}" fill="${C.red}"/>${at(32, 32, 0.8, P.ghost('#ffcdd2'))}<ellipse cx="28" cy="29" rx="2.5" ry="3.2" fill="${C.red}" stroke="none"/><ellipse cx="36" cy="29" rx="2.5" ry="3.2" fill="${C.red}" stroke="none"/>`,

    // ---- 共鳴：每段共鳴一張，畫的就是它的效果 ----
    res1_skel: `<path d="M2 50 C12 30 24 20 40 22 C34 28 34 34 40 38 C30 38 20 44 14 58 Z" fill="${C.boneDark}"/>${at(22, 40, 0.5, P.bone(), -30)}${at(36, 28, 0.45, P.bone(), -10)}${at(48, 44, 0.5, P.bone(), 20)}`,
    res_skel: `${at(32, 32, 0.8, P.skull())}<path d="M8 32 A24 24 0 0 1 48 12" stroke="${C.gold}" stroke-width="4"/><path d="M48 12 L40 10 L46 18 Z" fill="${C.gold}" stroke-width="2.5"/>
        <path d="M56 32 A24 24 0 0 1 16 52" stroke="${C.gold}" stroke-width="4"/><path d="M16 52 L24 54 L18 46 Z" fill="${C.gold}" stroke-width="2.5"/>`,
    res1_eye: `${at(32, 26, 0.8, P.eye())}${at(32, 52, 0.7, P.chain())}`,
    res_eye: `${at(32, 18, 0.42, P.eye())}${at(14, 32, 0.38, P.eye())}${at(50, 32, 0.38, P.eye())}${at(22, 48, 0.38, P.eye())}${at(42, 48, 0.38, P.eye())}${at(32, 34, 0.32, P.eye())}`,
    res1_wraith: `${disc('#004d40')}<circle cx="32" cy="32" r="22" stroke="#4db6ac" stroke-width="2.5" stroke-dasharray="6 5"/>${at(32, 33, 0.65, P.ghost('#b2dfdb'))}`,
    res_wraith: `${at(24, 34, 0.9, P.ghost('#b2dfdb'))}<ellipse cx="24" cy="38" rx="4" ry="5" fill="${C.ink}" stroke="none"/>
        <path d="M42 24 C48 28 48 38 42 42 M48 18 C58 26 58 40 48 48 M54 12 C66 24 66 42 54 54" stroke="#80cbc4" stroke-width="3"/>`,
    res1_mage: `${duoStroke('M4 60 L20 46', '#7ff0f0', 4)}${duoStroke('M18 48 L34 34', '#7ff0f0', 4)}${duoStroke('M32 34 L46 22', '#7ff0f0', 4)}
        ${at(20, 46, 0.4, P.skull('#e0f7fa', C.soul))}${at(34, 33, 0.44, P.skull('#e0f7fa', C.soul))}${at(48, 18, 0.5, P.skull('#e0f7fa', C.soul))}`,
    res_mage: `<path d="${starPath(32, 32, 28, 12, 12)}" fill="${C.violet}"/><circle cx="32" cy="32" r="9" fill="#f6dcff"/>
        <path d="M32 4 L32 -2 M8 12 L4 8 M56 12 L60 8" stroke="${C.violet}" stroke-width="3"/>${duoStroke('M50 58 L50 44 M44 50 L50 44 L56 50', '#81c784', 3)}`,
    res1_soul: `<path d="M8 12 L8 34 C8 48 20 56 32 56 C44 56 56 48 56 34 L56 12 L44 12 L44 34 C44 40 38 44 32 44 C26 44 20 40 20 34 L20 12 Z" fill="${C.red}"/>
        <rect x="8" y="8" width="12" height="8" fill="${C.steel}" stroke-width="3"/><rect x="44" y="8" width="12" height="8" fill="${C.steel}" stroke-width="3"/>${at(32, 22, 0.42, P.soul())}`,
    res_soul: `<path d="M12 58 L40 18" stroke-width="5"/><path d="M12 58 L40 18" stroke="${C.wood}" stroke-width="2.5"/><path d="M36 14 C46 6 60 12 60 26 C54 18 46 18 40 22 Z" fill="${C.steel}"/>
        ${at(20, 26, 0.32, P.soul())}${at(48, 44, 0.32, P.soul())}${at(30, 48, 0.26, P.soul())}`,
};
// 傳說收藏：金色獎章框住那張傳說祝福自己的圖示
const LEGEND_MEDAL = (inner) => `<circle cx="32" cy="32" r="28" fill="${C.goldDark}"/><circle cx="32" cy="32" r="22" fill="#3e2a12" stroke-width="3"/>${at(32, 32, 0.6, `<g transform="translate(-32 -32)">${inner}</g>`)}
    ${sparks([[54, 10, 5], [10, 54, 4]], '#fff3c4')}`;
for (const id of ['boneBurst', 'giantBones', 'ricochet', 'soulfire', 'frostNova', 'eliteHunter', 'soulSiphon', 'twinSummon', 'midas', 'deathPact']) ACHV_ICON_BODIES[`leg_${id}`] = LEGEND_MEDAL(ICON_BODIES[id]);
// 契約收藏：羊皮紙契約、蓋上那份契約的圖示當封蠟
const PACT_SCROLL = (inner) => `<path d="M12 6 L46 6 C50 6 52 10 52 14 L52 56 L18 56 C14 56 12 52 12 48 Z" fill="#fff3e0"/><path d="M18 16 L44 16 M18 24 L44 24 M18 32 L34 32" stroke="${C.wood}" stroke-width="2.5"/>
    <circle cx="42" cy="46" r="16" fill="${C.blood}"/>${at(42, 46, 0.36, `<g transform="translate(-32 -32)">${inner}</g>`)}`;
for (const [id, icon] of [['bloodPact', 'pact_blood'], ['greedPact', 'pact_greed'], ['furyPact', 'pact_fury'], ['flamePact', 'pact_flame'], ['swarmPact', 'pact_swarm'], ['stormPact', 'pact_storm']]) ACHV_ICON_BODIES[`pact_${id}`] = PACT_SCROLL(ICON_BODIES[icon]);
// 每日變異：日曆紙，中間是那一天的規則圖示
const DAILY_PAGE = (inner) => `<rect x="8" y="8" width="48" height="50" rx="5" fill="${C.bone}"/><path d="M8 20 L56 20 L56 13 C56 10 54 8 51 8 L13 8 C10 8 8 10 8 13 Z" fill="${C.red}"/>
    <path d="M20 4 L20 12 M44 4 L44 12" stroke-width="4"/>${at(32, 39, 0.5, `<g transform="translate(-32 -32)">${inner}</g>`)}`;
for (const id of ['glass', 'giants', 'eyes', 'bloodMoon', 'feast', 'bones', 'market', 'storm']) ACHV_ICON_BODIES[`daily_${id}`] = DAILY_PAGE(ICON_BODIES[`mut_${id}`]);
Object.assign(ACHV_ICON_BODIES, {
    legends: `<rect x="6" y="14" width="22" height="34" rx="3" fill="#ffe082" transform="rotate(-18 17 31)"/><rect x="36" y="14" width="22" height="34" rx="3" fill="#ffe082" transform="rotate(18 47 31)"/>
        <rect x="21" y="10" width="22" height="36" rx="3" fill="${C.gold}"/>${at(32, 28, 0.42, P.star(C.white))}${sparks([[56, 54, 4]], '#fff3c4')}`,
    legendAll: `<path d="M10 12 C20 8 28 10 32 14 C36 10 44 8 54 12 L54 54 C44 50 36 52 32 56 C28 52 20 50 10 54 Z" fill="${C.goldDark}"/><path d="M32 14 L32 56" stroke-width="3"/>
        <path d="M14 18 C20 16 26 17 29 20 L29 50 C26 47 20 46 14 48 Z M50 18 C44 16 38 17 35 20 L35 50 C38 47 44 46 50 48 Z" fill="#fff8e1" stroke-width="2.5"/>${at(22, 33, 0.3, P.star())}${at(42, 33, 0.3, P.star())}`,
    pacts: `<path d="M20 4 L50 4 L50 46 L20 46 Z" fill="#ffe0b2" transform="rotate(10 35 25)"/><path d="M14 10 L44 10 L44 52 L14 52 Z" fill="#fff3e0" transform="rotate(-6 29 31)"/>
        <path d="M10 16 L40 16 L40 58 L10 58 Z" fill="#fff8e1"/><path d="M16 26 L34 26 M16 34 L34 34" stroke="${C.wood}" stroke-width="2.5"/><circle cx="34" cy="48" r="8" fill="${C.blood}"/>
        <path d="M44 34 C52 30 58 34 58 40 C54 36 50 36 46 40 Z" fill="${C.blood}"/>`,
    pactWin: `${at(32, 36, 1, P.laurel(C.gold))}<path d="M14 22 C4 12 8 2 16 2 C14 10 18 16 24 20 Z M50 22 C60 12 56 2 48 2 C50 10 46 16 40 20 Z" fill="${C.blood}"/>${at(32, 36, 0.52, P.skull('#ffcdd2', C.blood))}`,

    // ---- 連殺：越燒越旺的火 ----
    streak100: `${at(32, 50, 0.7, P.bone(), 20)}${at(32, 50, 0.7, P.bone(), -20)}${at(32, 30, 0.75, P.flame())}`,
    streak250: `${at(32, 32, 0.95, P.flame())}${at(44, 46, 0.55, P.sword(), 30)}`,
    streak1: `${at(22, 36, 0.75, P.flame())}${at(42, 32, 0.95, P.flame(C.red, C.orange))}`,
    streak1000: `${at(32, 30, 1.1, P.flame(C.red, C.orange))}${at(32, 40, 0.5, P.skull())}`,
    streak2: `${at(32, 34, 1.15, P.flame('#d32f2f', C.orange))}${at(32, 18, 0.55, P.crown())}${at(32, 44, 0.42, P.skull())}`,
    streak5000: `${at(32, 34, 1.2, P.flame('#7b1fa2', '#ea80fc'))}<path d="M14 58 L44 10" stroke-width="5"/><path d="M14 58 L44 10" stroke="${C.woodDark}" stroke-width="2.5"/>
        <path d="M40 8 C52 2 62 12 60 24 C56 16 50 14 44 16 Z" fill="${C.steel}"/>`,

    // ---- 遺跡：三種遺跡本身 ----
    coffin1: `<path d="M22 6 L42 6 L50 20 L44 58 L20 58 L14 20 Z" fill="${C.woodDark}"/><path d="M26 6 L46 2 L56 16 L52 22 L42 6" fill="${C.wood}" stroke-width="3"/>
        <path d="M24 14 L40 14 L44 22 L40 52 L24 52 L20 22 Z" fill="#3e2723" stroke-width="2.5"/>${at(32, 34, 0.35, P.coin())}<path d="M24 26 L18 20 M40 26 L46 20" stroke="${C.gold}" stroke-width="2.5"/>`,
    coffins: `<path d="M22 4 L42 4 L50 18 L44 60 L20 60 L14 18 Z" fill="${C.wood}"/>${at(32, 30, 0.95, P.chain(), 0)}
        <rect x="26" y="36" width="12" height="11" rx="2" fill="${C.gold}"/><path d="M28 36 C28 30 36 30 36 36" stroke-width="3"/><circle cx="32" cy="41" r="1.8" fill="${C.ink}" stroke="none"/>`,
    coffin50: `<path d="M4 46 L26 40 L30 54 L8 60 Z" fill="${C.woodDark}"/><path d="M34 40 L58 44 L56 58 L32 56 Z" fill="${C.wood}"/><path d="M14 26 L38 20 L44 38 L20 44 Z" fill="${C.wood}"/>
        ${at(28, 12, 0.34, P.coin())}${at(46, 30, 0.3, P.coin())}${at(20, 54, 0.26, P.coin())}${sparks([[52, 10, 4]])}`,
    altar10: `<ellipse cx="32" cy="50" rx="24" ry="8" fill="#78909c"/><path d="M14 18 L14 44 C14 50 50 50 50 44 L50 18 Z" fill="${C.red}"/>
        <ellipse cx="32" cy="18" rx="18" ry="7" fill="#ffe0b2"/><path d="M14 24 L22 40 L32 24 L42 40 L50 24" stroke="${C.gold}" stroke-width="2.5"/>`,
    altar50: `<ellipse cx="32" cy="54" rx="26" ry="7" fill="#78909c"/><path d="M16 24 L16 48 C16 54 48 54 48 48 L48 24 Z" fill="${C.red}"/>
        <ellipse cx="32" cy="24" rx="16" ry="6" fill="#ffe0b2"/>${at(14, 14, 0.42, P.flame())}${at(50, 14, 0.42, P.flame())}
        <path d="M22 4 L30 20 M42 4 L34 20" stroke-width="4"/><circle cx="22" cy="4" r="3.5" fill="${C.bone}" stroke-width="2.5"/><circle cx="42" cy="4" r="3.5" fill="${C.bone}" stroke-width="2.5"/>`,
    spring10: `<ellipse cx="32" cy="44" rx="26" ry="14" fill="#78909c"/><ellipse cx="32" cy="40" rx="20" ry="9" fill="#4db6ac"/>${at(32, 22, 0.55, P.heart('#81c784'))}
        <circle cx="22" cy="38" r="2" fill="#e0f2f1" stroke="none"/><circle cx="40" cy="42" r="1.6" fill="#e0f2f1" stroke="none"/><path d="M12 50 C10 44 14 40 16 44" fill="${C.green}" stroke-width="2.5"/>`,
    relicTrio: `<circle cx="32" cy="32" r="28" fill="#5d4037"/><circle cx="32" cy="32" r="22" fill="#d7ccc8" stroke-width="2.5"/><path d="M32 12 L32 52 M12 32 L52 32" stroke="${C.wood}" stroke-width="2" stroke-dasharray="3 3"/>
        <circle cx="32" cy="18" r="6" fill="${C.red}" stroke-width="2.5"/><circle cx="20" cy="42" r="6" fill="#4db6ac" stroke-width="2.5"/><circle cx="44" cy="42" r="6" fill="${C.gold}" stroke-width="2.5"/>
        <path d="M32 24 L22 37 M32 24 L42 37 M26 42 L38 42" stroke="${C.blood}" stroke-width="2"/>`,

    dailyWeek: `<rect x="6" y="10" width="52" height="46" rx="5" fill="${C.bone}"/><path d="M6 22 L58 22 L58 15 C58 12 56 10 53 10 L11 10 C8 10 6 12 6 15 Z" fill="${C.red}"/>
        ${(() => { let s = ''; for (let i = 0; i < 7; i++) { const x = 12 + (i % 4) * 12, y = 30 + Math.floor(i / 4) * 13; s += `<path d="M${x - 3} ${y} L${x} ${y + 4} L${x + 6} ${y - 4}" stroke="${C.green}" stroke-width="3"/>`; } return s; })()}`,

    // ---- 生涯：累積的東西越堆越高 ----
    kills10k: `<path d="M4 58 C10 44 20 40 32 40 C44 40 54 44 60 58 Z" fill="${C.boneDark}"/>${at(20, 48, 0.5, P.bone(), -20)}${at(42, 50, 0.5, P.bone(), 25)}${at(32, 30, 0.5, P.skull())}`,
    kills100k: `<path d="M2 60 L20 30 L32 40 L44 22 L62 60 Z" fill="${C.boneDark}"/>${at(18, 50, 0.3, P.skull())}${at(34, 52, 0.3, P.skull())}${at(48, 48, 0.3, P.skull())}${at(28, 40, 0.26, P.skull())}${at(42, 34, 0.26, P.skull())}
        <path d="M44 22 L44 4" stroke-width="3"/><path d="M44 4 L58 8 L44 12 Z" fill="${C.red}" stroke-width="2.5"/>`,
    kills1m: `<path d="M14 8 L50 8 L50 40 L56 40 L56 58 L8 58 L8 40 L14 40 Z" fill="${C.boneDark}"/>${at(32, 22, 0.42, P.skull())}${at(16, 48, 0.28, P.skull())}${at(48, 48, 0.28, P.skull())}
        <path d="M20 40 L44 40" stroke-width="4"/>${at(32, 6, 0.32, P.crown())}`,
    summons1k: `${disc('#311b92', 26)}<circle cx="32" cy="32" r="20" stroke="${C.violet}" stroke-width="2.5"/><path d="${starPath(32, 32, 18, 7, 5)}" stroke="${C.violet}" stroke-width="2"/>${at(32, 34, 0.32, P.skull())}`,
    summons10k: `<ellipse cx="32" cy="50" rx="28" ry="10" fill="#311b92"/><ellipse cx="32" cy="50" rx="20" ry="6" stroke="${C.violet}" stroke-width="2.5"/>
        <path d="M24 50 L24 30 L20 18 M24 30 L28 16 M24 30 L32 18 M24 30 L36 22" stroke="${C.bone}" stroke-width="4"/><path d="M40 50 L40 36 L36 28 M40 36 L44 26 M40 36 L48 30" stroke="${C.bone}" stroke-width="3.5"/>`,
    summons100k: `<ellipse cx="32" cy="32" rx="28" ry="24" fill="#4a148c"/><ellipse cx="32" cy="32" rx="18" ry="14" fill="#12081f" stroke-width="3"/>
        ${at(24, 32, 0.25, P.skull())}${at(40, 32, 0.25, P.skull())}${at(32, 22, 0.22, P.skull())}${at(32, 42, 0.22, P.skull())}${sparks([[8, 8, 4], [56, 56, 4]], '#e1bee7')}`,
    souls100k: `<path d="M20 14 L44 14 L46 22 C56 28 56 50 46 58 L18 58 C8 50 8 28 18 22 Z" fill="#b2ebf2"/><rect x="18" y="8" width="28" height="8" rx="2" fill="${C.wood}"/>${at(32, 42, 0.55, P.soul())}`,
    souls1m: `<path d="M8 30 L56 30 L56 56 L8 56 Z" fill="${C.wood}"/><path d="M8 30 C8 16 56 16 56 30 Z" fill="${C.woodDark}"/><path d="M8 38 L56 38" stroke="${C.gold}" stroke-width="3"/>
        <rect x="27" y="32" width="10" height="10" rx="2" fill="${C.gold}"/>${at(20, 20, 0.3, P.soul())}${at(34, 14, 0.36, P.soul())}${at(48, 20, 0.3, P.soul())}`,
    souls10m: `${disc('#006064')}<path d="M32 32 C32 20 48 18 52 28 M32 32 C44 32 46 48 36 52 M32 32 C32 44 16 46 12 36 M32 32 C20 32 18 16 28 12" stroke="#80deea" stroke-width="4"/>${at(32, 32, 0.38, P.soul('#e0f7fa'))}`,
    runs10: `<path d="M8 50 L14 14 L50 10 L58 46 Z" fill="#90a4ae"/><path d="M18 20 L18 40 M23 20 L23 40 M28 20 L28 40 M33 20 L33 40 M14 36 L38 24 M40 18 L40 38 M45 18 L45 38" stroke-width="3"/>`,
    runs50: `<path d="M16 6 L48 6 M16 58 L48 58" stroke-width="5"/><path d="M19 8 C19 22 30 26 30 32 C30 38 19 42 19 56 L45 56 C45 42 34 38 34 32 C34 26 45 22 45 8 Z" fill="#cfd8dc"/>${at(32, 46, 0.3, P.skull())}${at(32, 18, 0.24, P.skull())}`,
    runs100: `<circle cx="32" cy="32" r="26" fill="${C.goldDark}"/><circle cx="32" cy="32" r="18" fill="#3e2a12" stroke-width="3"/>
        ${(() => { let s = ''; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; s += `<path d="M${(32 + Math.cos(a) * 6).toFixed(1)} ${(32 + Math.sin(a) * 6).toFixed(1)} L${(32 + Math.cos(a) * 18).toFixed(1)} ${(32 + Math.sin(a) * 18).toFixed(1)}" stroke="${C.gold}" stroke-width="3"/>`; } return s; })()}
        <circle cx="32" cy="32" r="6" fill="${C.gold}"/>${at(54, 12, 0.3, P.soul())}`,
    novas100: `<path d="${starPath(32, 32, 26, 11, 10)}" fill="#c06bf5"/><circle cx="32" cy="32" r="8" fill="#f6dcff"/>`,
    novas1000: `<circle cx="32" cy="32" r="29" stroke="#ce93d8" stroke-width="2.5"/><circle cx="32" cy="32" r="24" stroke="#ab47bc" stroke-width="2.5"/><path d="${starPath(32, 32, 22, 8, 12)}" fill="#c06bf5"/>
        <circle cx="32" cy="32" r="8" fill="${C.white}"/>${rays(32, 32, 10, 15, 8, '#f6dcff', 2)}`,

    // ---- 挑戰：每一條一個「限制」的畫面 ----
    noNova: `<path d="${starPath(32, 32, 24, 10, 10)}" fill="#7b5a8f"/><circle cx="32" cy="32" r="26" stroke="${C.red}" stroke-width="5"/>${duoStroke('M14 50 L50 14', C.red, 4)}`,
    onlySkel: `<rect x="4" y="8" width="56" height="48" rx="8" fill="${C.goldDark}"/>${at(16, 32, 0.42, P.skull())}${at(32, 32, 0.42, P.skull())}${at(48, 32, 0.42, P.skull())}`,
    onlyEye: `<rect x="4" y="8" width="56" height="48" rx="8" fill="${C.goldDark}"/>${at(16, 32, 0.32, P.eye())}${at(32, 32, 0.32, P.eye())}${at(48, 32, 0.32, P.eye())}`,
    onlyWraith: `<rect x="4" y="8" width="56" height="48" rx="8" fill="${C.goldDark}"/>${at(16, 33, 0.5, P.ghost())}${at(32, 33, 0.5, P.ghost())}${at(48, 33, 0.5, P.ghost())}`,
    noUpgrade: `<path d="M32 4 L52 26 L40 26 L40 44 L24 44 L24 26 L12 26 Z" fill="${C.gold}"/><path d="M18 30 L28 24 L32 32 L40 26 L48 32" stroke="${C.ink}" stroke-width="5"/><path d="M18 30 L28 24 L32 32 L40 26 L48 32" stroke="#3a3046" stroke-width="2"/>
        ${at(14, 54, 0.26, P.skull())}${at(26, 56, 0.26, P.skull())}${at(38, 56, 0.26, P.skull())}${at(50, 54, 0.26, P.skull())}`,
    ascetic: `<path d="M8 36 L56 36 C56 50 46 58 32 58 C18 58 8 50 8 36 Z" fill="${C.wood}"/><path d="M8 36 L56 36" stroke-width="4"/>
        ${(() => { let s = ''; for (let i = 0; i < 11; i++) { const a = Math.PI + i / 10 * Math.PI; s += `<circle cx="${(32 + Math.cos(a) * 22).toFixed(1)}" cy="${(30 + Math.sin(a) * 22).toFixed(1)}" r="3.2" fill="${C.woodDark}" stroke-width="2"/>`; } return s; })()}`,
    flawless: `<path d="M18 10 L46 10 L58 24 L32 58 L6 24 Z" fill="#b3e5fc"/><path d="M6 24 L58 24 M18 10 L26 24 L32 58 M46 10 L38 24 L32 58" stroke-width="2.5"/>${sparks([[52, 6, 5], [8, 46, 4]], C.white)}${shine(20, 18, 3, 5, 30)}`,
    steady: `<ellipse cx="32" cy="54" rx="20" ry="6" fill="#78909c"/><ellipse cx="32" cy="42" rx="16" ry="6" fill="#90a4ae"/><ellipse cx="32" cy="31" rx="12" ry="5" fill="#b0bec5"/><ellipse cx="32" cy="21" rx="8" ry="4" fill="#cfd8dc"/>
        <path d="M32 4 C28 10 28 12 32 14 C36 12 36 10 32 4 Z" fill="${C.green}" stroke-width="2.5"/>`,
    lastStand: `<path d="M4 60 L60 60 L46 44 L18 44 Z" fill="${C.woodDark}"/><path d="M28 44 L28 6" stroke-width="4"/>
        <path d="M28 8 L54 12 L46 18 L52 26 L40 24 L44 30 L28 28 Z" fill="${C.red}"/>${at(46, 50, 0.3, P.heart())}`,
    massacre: `<path d="M10 58 L10 24 L16 24 L16 18 L22 18 L22 24 L28 24 L28 18 L36 18 L36 24 L42 24 L42 18 L48 18 L48 24 L54 24 L54 58 Z" fill="#78909c"/><path d="M26 58 L26 44 C26 38 38 38 38 44 L38 58 Z" fill="#3e2723"/>
        ${at(18, 16, 0.42, P.flame())}${at(46, 12, 0.52, P.flame(C.red, C.orange))}`,
    novaBlast: `<path d="${starPath(32, 32, 20, 9, 10)}" fill="#c06bf5"/><circle cx="32" cy="32" r="7" fill="#f6dcff"/>
        ${at(8, 10, 0.24, P.skull(), -30)}${at(56, 12, 0.24, P.skull(), 30)}${at(8, 54, 0.24, P.skull(), -150)}${at(56, 52, 0.24, P.skull(), 150)}${at(32, 4, 0.2, P.skull())}`,
    speedClear: `<circle cx="30" cy="36" r="22" fill="${C.bone}"/><rect x="25" y="6" width="10" height="7" rx="2" fill="${C.steel}"/><path d="M30 36 L30 22 M30 36 L40 40" stroke-width="3.5"/>${at(50, 16, 0.5, P.bolt())}`,
    wealthy: `<path d="M16 26 C6 36 8 56 22 58 L42 58 C56 56 58 36 48 26 Z" fill="#80deea"/><path d="M22 26 L42 26 L38 18 L26 18 Z" fill="#4dd0e1"/><path d="M24 22 L40 22" stroke="${C.gold}" stroke-width="4"/>
        ${at(32, 44, 0.42, P.soul('#e0f7fa'))}${at(12, 14, 0.24, P.soul())}${at(52, 12, 0.24, P.soul())}`,
    thiefChase: `<path d="M24 22 C14 30 14 50 26 54 L44 54 C56 50 56 30 46 22 Z" fill="${C.gold}"/><path d="M28 22 L42 22 L40 14 L30 14 Z" fill="${C.goldDark}"/>
        <path d="M4 20 L14 20 M2 30 L12 30 M4 40 L12 40" stroke="${C.sky}" stroke-width="3"/><path d="M50 34 L58 28 M52 38 L60 36 M50 42 L58 44" stroke="${C.bone}" stroke-width="4"/><path d="M48 32 C52 36 52 42 48 46" stroke="${C.bone}" stroke-width="4"/>`,

    // ---- 傳承：永久強化的結晶 ----
    metaFirst: `<path d="M6 58 C18 48 46 48 58 58 Z" fill="${C.woodDark}"/>${at(32, 32, 1.05, P.gem())}<path d="M14 52 C10 44 16 40 20 46 M50 52 C54 44 48 40 44 46" fill="${C.green}" stroke-width="2.5"/>`,
    metaMax: `${at(20, 44, 0.55, P.gem())}${at(44, 44, 0.55, P.gem())}${at(32, 26, 0.85, P.gem('#d1c4e9'))}${sparks([[54, 8, 5]], '#e1bee7')}`,
    metaAll: `${at(32, 40, 0.95, P.crown('#b388ff'))}${at(32, 16, 0.5, P.gem('#ede7f6'))}${sparks([[8, 10, 4], [56, 10, 4]], '#e1bee7')}`,
});
const ACHV_ICON_SVGS = Object.fromEntries(Object.entries(ACHV_ICON_BODIES).map(([k, v]) => [k, iconSvg(v)]));
