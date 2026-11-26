"""把 AI 生圖的純色背景（洋紅、綠、藍、黃、青、紅）去掉，輸出遊戲用的透明 PNG。

用法：python tools/key-chroma.py <來源圖> <輸出.png> [flip]
  flip：左右翻面。遊戲裡的角色原圖一律朝右（朝左時由程式翻面），生出來朝左的要加這個。

背景色從四個角自動取樣，不用指定。背景要挑「跟角色顏色差最遠」的那一種：
  紫、紅、粉的角色用綠背景 #00FF00；綠、黃的角色用洋紅 #FF00FF；藍、青的角色用黃 #FFFF00 或洋紅。
  跟角色撞色的背景會連角色一起被扣掉（紫色角色放洋紅背景，衣服會被挖空）。

只需要 Pillow。做法是「反混色」：每個像素都看成「角色顏色 × a ＋ 背景 × (1 − a)」，
在「扣掉背景之後不再偏背景色」的前提下，背景能扣多少就扣多少，扣掉的比例就是透明度、剩下的就是角色本身的顏色。
所以發光會留成半透明的原色光，不會變成一圈背景色；粗描邊的反鋸齒邊緣也不會帶背景色。
「偏背景色的程度」＝背景的亮通道（> 128 的那幾個）裡最小的，減掉暗通道裡最大的：
洋紅是 min(R, B) − G、綠是 G − max(R, B)、黃是 min(R, G) − B。
最後裁到剛好包住角色、最長邊縮到 MAX_SIDE。
"""
import sys
from PIL import Image, ImageFilter

MAX_SIDE = 512
# 角色本身的顏色允許偏背景色到這麼多（暖紅、膚色、褐色都在裡面），超過的部分才當成背景混進來的
SPILL_FLOOR = 20
# 背景其實不是純色（JPG 壓縮、生圖本身的色偏，洋紅實測約 245,5,225）：從四個角取樣當背景色
CORNER = 12
# 扣完背景後透明度低於這個的當成全透明：背景上的 JPG 雜訊
ALPHA_FLOOR = 0.12
SEARCH_STEPS = 14
# 發光（金色的氣、白色的光、青色的光暈）在背景的暗通道上都很高，背景的暗通道接近 0：混出來的暗通道幾乎全是光貢獻的。
# 暗通道到這麼多的偏背景色像素，透明度用「暗通道 ÷ 光的暗通道（當成滿的 255）」推，比反混色準 ——
# 反混色只扣到「不再偏背景色」就停，對亮色光會扣太少，金色的氣會剩一圈背景色。暗的描邊邊緣暗通道低，照舊反混色
# 設 30：光暈最外圈很淡，只有 30～60（設 60 時羅漢的金色光環外圈留一圈粉紅）；描邊跟背景混出來的都在 20 以下，不受影響
GLOW_LOW = 30
# 光疊在背景上，亮通道都還很亮；暗紅色（戰士的戰袍、吸血鬼的背心）在洋紅背景下亮通道只有 60 上下，
# 暗通道卻也有 30，不加這條會被當成光吃掉
GLOW_BRIGHT = 150
# 裁切時判定「有東西」的透明度門檻，以及四周留白
TRIM_ALPHA = 24
PAD = 4
# 亮／暗通道的分界
CHANNEL_SPLIT = 128
# 只扣「跟背景連在一起」的地方：從圖的四邊往內漫延，顏色跟背景差在 BG_FLOOD_DIST 以內的才算背景，
# 再往外擴 EDGE_BAND 像素包住描邊的反鋸齒。其餘（角色內部）一律保留原色、不透明。
# 不加這條的話偏背景色的布（戰士的皇家藍戰袍放在洋紅背景上）會被扣成半透明（實測六成的藍色像素變半透明）
BG_FLOOD_DIST = 110
EDGE_BAND = 3
# 手臂和身體圍出來的洞不跟圖邊相連：離背景色這麼近的像素（幾乎就是純背景色）也當漫延的起點
BG_SEED_DIST = 45


def background_color(im):
    w, h = im.size
    px = []
    for x0, y0 in ((0, 0), (w - CORNER, 0), (0, h - CORNER), (w - CORNER, h - CORNER)):
        crop = im.crop((x0, y0, x0 + CORNER, y0 + CORNER))
        px += [crop.getpixel((x, y)) for y in range(crop.height) for x in range(crop.width)]
    return tuple(sorted(p[c] for p in px)[len(px) // 2] for c in range(3))


def split_channels(bg):
    hi = [c for c in range(3) if bg[c] > CHANNEL_SPLIT]
    lo = [c for c in range(3) if bg[c] <= CHANNEL_SPLIT]
    if not hi or not lo:
        sys.exit(f'背景色 {bg} 不是純色（洋紅、綠、藍、黃、青、紅），沒辦法去背')
    return hi, lo


def spill(px, hi, lo):
    return min(px[c] for c in hi) - max(px[c] for c in lo)


def unmix(px, bg, hi, lo):
    """回傳 (a, 顏色)：背景扣到「剩下的不再偏背景色」為止。"""
    # 亮通道不能扣到負的；暗通道不設限：背景的暗通道本來就接近 0，JPG 雜訊讓它在 5～20 之間跳，
    # 拿它設上限的話背景只扣得掉一半、整片留下一層霧（扣過頭的歸零就好）
    top = min([1.0] + [px[c] / bg[c] for c in hi if bg[c]])
    low = 0.0
    for _ in range(SEARCH_STEPS):
        beta = (low + top) / 2
        f = [px[c] - beta * bg[c] for c in range(3)]
        # 剩下的顏色（除以 1 − beta 之前）偏背景色的程度，要壓到 SPILL_FLOOR × (1 − beta) 以下
        if spill(f, hi, lo) > SPILL_FLOOR * (1 - beta):
            low = beta
        else:
            top = beta
    beta = top
    a = 1 - beta
    if a < ALPHA_FLOOR:
        return 0.0, (0, 0, 0)
    return a, tuple((px[c] - beta * bg[c]) / a for c in range(3))


def background_mask(im, bg):
    """跟圖邊連通、顏色接近背景的區域，往外擴 EDGE_BAND 像素。回傳 bytearray（1 = 可以扣）。"""
    w, h = im.size
    raw = im.tobytes()
    lim = BG_FLOOD_DIST * BG_FLOOD_DIST
    seed_lim = BG_SEED_DIST * BG_SEED_DIST
    near = bytearray(w * h)
    stack = [x for x in range(w)] + [(h - 1) * w + x for x in range(w)] + [y * w for y in range(h)] + [y * w + w - 1 for y in range(h)]
    for k in range(w * h):
        i = k * 3
        dr, dg, db = raw[i] - bg[0], raw[i + 1] - bg[1], raw[i + 2] - bg[2]
        d = dr * dr + dg * dg + db * db
        near[k] = d < lim
        if d < seed_lim:
            stack.append(k)
    seen = bytearray(w * h)
    while stack:
        k = stack.pop()
        if seen[k] or not near[k]:
            continue
        seen[k] = 1
        x, y = k % w, k // w
        if x > 0: stack.append(k - 1)
        if x < w - 1: stack.append(k + 1)
        if y > 0: stack.append(k - w)
        if y < h - 1: stack.append(k + w)
    m = Image.frombytes('L', (w, h), bytes(v * 255 for v in seen))
    m = m.filter(ImageFilter.MaxFilter(EDGE_BAND * 2 + 1))
    return bytearray(1 if v else 0 for v in m.tobytes())


def key(src, dst, flip=False):
    im = Image.open(src).convert('RGB')
    bg = background_color(im)
    hi, lo = split_channels(bg)
    keyable = background_mask(im, bg)
    raw = im.tobytes()
    out = bytearray(len(raw) // 3 * 4)
    for i in range(0, len(raw), 3):
        px = (raw[i], raw[i + 1], raw[i + 2])
        j = i // 3 * 4
        if not keyable[i // 3] or spill(px, hi, lo) <= SPILL_FLOOR:
            out[j:j + 4] = bytes((*px, 255))
            continue
        lo_v = max(px[c] for c in lo)
        lo_bg = max(bg[c] for c in lo)
        if lo_v >= GLOW_LOW and min(px[c] for c in hi) >= GLOW_BRIGHT:
            a = min(1.0, (lo_v - lo_bg) / (255 - lo_bg))
            col = tuple((px[c] - (1 - a) * bg[c]) / a for c in range(3)) if a > 0 else (0, 0, 0)
        else:
            a, col = unmix(px, bg, hi, lo)
        out[j:j + 4] = bytes((*(int(min(255, max(0, v))) for v in col), int(a * 255)))
    img = Image.frombytes('RGBA', im.size, bytes(out))
    bbox = img.getchannel('A').point(lambda v: 255 if v > TRIM_ALPHA else 0).getbbox()
    img = img.crop((max(0, bbox[0] - PAD), max(0, bbox[1] - PAD), min(img.width, bbox[2] + PAD), min(img.height, bbox[3] + PAD)))
    if flip:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    img.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
    img.save(dst)
    print(dst, img.size, 'bg', bg)


if __name__ == '__main__':
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    key(sys.argv[1], sys.argv[2], len(sys.argv) > 3 and sys.argv[3] == 'flip')
