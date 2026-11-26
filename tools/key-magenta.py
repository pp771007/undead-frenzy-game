"""把 AI 生圖的洋紅色背景（#FF00FF）去掉，輸出遊戲用的透明 PNG。

用法：python tools/key-magenta.py <來源圖> <輸出.png> [flip]
  flip：左右翻面。遊戲裡的角色原圖一律朝右（朝左時由程式翻面），生出來朝左的要加這個。

只需要 Pillow。做法是「反混色」：每個像素都看成「角色顏色 × a ＋ 背景 × (1 − a)」，
在「扣掉背景之後不再偏洋紅」的前提下，背景能扣多少就扣多少，扣掉的比例就是透明度、剩下的就是角色本身的顏色。
所以發光（氣功、泉水的光、靈狐的光暈）會留成半透明的原色光，不會變成一圈粉紅；粗描邊的反鋸齒邊緣也不會帶洋紅。
最後裁到剛好包住角色、最長邊縮到 MAX_SIDE。
"""
import sys
from PIL import Image

MAX_SIDE = 512
# 「洋紅強度」= min(R, B) − G。角色本身的顏色允許到這麼多（暖紅、膚色、褐色都在裡面），超過的部分才當成背景混進來的
SPILL_FLOOR = 20
# 背景其實不是純 #FF00FF（JPG 壓縮、生圖本身的色偏，實測約 245,5,225）：從四個角取樣當背景色
CORNER = 12
# 扣完背景後透明度低於這個的當成全透明：背景上的 JPG 雜訊
ALPHA_FLOOR = 0.12
SEARCH_STEPS = 14
# 發光（金色的氣、白色的光、青色的光暈）綠色都很高，背景的綠接近 0：混出來的綠幾乎全是光貢獻的。
# 綠色到這麼多的偏洋紅像素，透明度用「綠 ÷ 光的綠（當成滿的 255）」推，比上面那套準 ——
# 上面那套只扣到「不再偏洋紅」就停，對亮色光會扣太少，金色的氣會剩一圈粉紅。暗的描邊邊緣綠色低，照舊用上面那套
# 設 30：光暈最外圈很淡，綠只有 30～60（設 60 時羅漢的金色光環外圈留一圈粉紅）；描邊跟洋紅混出來的綠都在 20 以下，不受影響
GLOW_GREEN = 30
# 光疊在洋紅上，紅、藍都還很亮；暗紅色（戰士的戰袍、吸血鬼的背心）的藍只有 60 上下，綠卻也有 30，不加這條會被當成光吃掉變綠
GLOW_BRIGHT = 150
# 裁切時判定「有東西」的透明度門檻，以及四周留白
TRIM_ALPHA = 24
PAD = 4
# 只扣「跟背景連在一起」的地方：從圖的四邊往內漫延，顏色跟背景差在 BG_FLOOD_DIST 以內的才算背景，
# 再往外擴 EDGE_BAND 像素包住描邊的反鋸齒。其餘（角色內部）一律保留原色、不透明。
# 不加這條的話藍紫色的布（戰士的皇家藍戰袍）本身就偏洋紅，會被扣成半透明（實測六成的藍色像素變半透明）
BG_FLOOD_DIST = 110
EDGE_BAND = 3
# 手臂和身體圍出來的洞不跟圖邊相連：離背景色這麼近的像素（幾乎就是純洋紅）也當漫延的起點
BG_SEED_DIST = 45


def background_color(im):
    w, h = im.size
    px = []
    for x0, y0 in ((0, 0), (w - CORNER, 0), (0, h - CORNER), (w - CORNER, h - CORNER)):
        crop = im.crop((x0, y0, x0 + CORNER, y0 + CORNER))
        px += [crop.getpixel((x, y)) for y in range(crop.height) for x in range(crop.width)]
    return tuple(sorted(p[c] for p in px)[len(px) // 2] for c in range(3))


def unmix(r, g, b, mr, mg, mb):
    """回傳 (a, r, g, b)：背景扣到「剩下的不再偏洋紅」為止。"""
    # 紅、藍不能扣到負的；綠色不設限：背景的綠本來就接近 0，JPG 雜訊讓它在 5～20 之間跳，
    # 拿它設上限的話背景只扣得掉一半、整片留下洋紅霧（扣過頭的綠歸零就好）
    hi = min(1.0, r / mr if mr else 1.0, b / mb if mb else 1.0)
    lo = 0.0
    for _ in range(SEARCH_STEPS):
        beta = (lo + hi) / 2
        fr, fg, fb = r - beta * mr, g - beta * mg, b - beta * mb
        # 剩下的顏色（除以 1 − beta 之前）的洋紅強度，要壓到 SPILL_FLOOR × (1 − beta) 以下
        if min(fr, fb) - fg > SPILL_FLOOR * (1 - beta):
            lo = beta
        else:
            hi = beta
    beta = hi
    a = 1 - beta
    if a < ALPHA_FLOOR:
        return 0.0, 0, 0, 0
    return a, (r - beta * mr) / a, (g - beta * mg) / a, (b - beta * mb) / a


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
    from PIL import ImageFilter
    m = m.filter(ImageFilter.MaxFilter(EDGE_BAND * 2 + 1))
    return bytearray(1 if v else 0 for v in m.tobytes())


def key(src, dst, flip=False):
    im = Image.open(src).convert('RGB')
    mr, mg, mb = background_color(im)
    keyable = background_mask(im, (mr, mg, mb))
    raw = im.tobytes()
    out = bytearray(len(raw) // 3 * 4)
    for i in range(0, len(raw), 3):
        r, g, b = raw[i], raw[i + 1], raw[i + 2]
        j = i // 3 * 4
        if not keyable[i // 3] or min(r, b) - g <= SPILL_FLOOR:
            out[j:j + 4] = bytes((r, g, b, 255))
            continue
        if g >= GLOW_GREEN and min(r, b) >= GLOW_BRIGHT:
            a = min(1.0, (g - mg) / (255 - mg))
            fr, fg, fb = ((c - (1 - a) * m) / a for c, m in ((r, mr), (g, mg), (b, mb)))
        else:
            a, fr, fg, fb = unmix(r, g, b, mr, mg, mb)
        out[j:j + 4] = bytes((int(min(255, max(0, fr))), int(min(255, max(0, fg))), int(min(255, max(0, fb))), int(a * 255)))
    img = Image.frombytes('RGBA', im.size, bytes(out))
    bbox = img.getchannel('A').point(lambda v: 255 if v > TRIM_ALPHA else 0).getbbox()
    img = img.crop((max(0, bbox[0] - PAD), max(0, bbox[1] - PAD), min(img.width, bbox[2] + PAD), min(img.height, bbox[3] + PAD)))
    if flip:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    img.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
    img.save(dst)
    print(dst, img.size, 'bg', (mr, mg, mb))


if __name__ == '__main__':
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    key(sys.argv[1], sys.argv[2], len(sys.argv) > 3 and sys.argv[3] == 'flip')
