"""把 AI 生圖的洋紅色背景（#FF00FF）去掉，輸出遊戲用的透明 PNG。

用法：python tools/key-magenta.py <來源圖> <輸出.png> [flip]
  flip：左右翻面。遊戲裡的角色原圖一律朝右（朝左時由程式翻面），生出來朝左的要加這個。

只需要 Pillow。JPG 壓縮會讓背景不是純洋紅，所以用「洋紅強度 = min(R,B) − G」做軟邊，
再把邊緣殘留的洋紅反光扣掉；最後裁到剛好包住角色、最長邊縮到 MAX_SIDE。
"""
import sys
from PIL import Image

MAX_SIDE = 512
# 洋紅強度低於 KEY_LO 完全保留、高於 KEY_HI 完全透明，中間是半透明的邊
KEY_LO, KEY_HI = 70.0, 150.0
# 去反光從洋紅強度超過這個值才開始扣，保留角色本身偏紫紅的顏色
SPILL_FLOOR = 20
SPILL_STRENGTH = 0.85
# 裁切時判定「有東西」的透明度門檻，以及四周留白
TRIM_ALPHA = 24
PAD = 4


def key(src, dst, flip=False):
    im = Image.open(src).convert('RGB')
    raw = im.tobytes()
    out = bytearray(len(raw) // 3 * 4)
    for i in range(0, len(raw), 3):
        r, g, b = raw[i], raw[i + 1], raw[i + 2]
        k = min(r, b) - g
        a = 1.0 - min(1.0, max(0.0, (k - KEY_LO) / (KEY_HI - KEY_LO)))
        spill = min(max(0.0, k - SPILL_FLOOR) * (1 - a * 0.6), min(r, b))
        j = i // 3 * 4
        out[j] = int(max(0, r - spill * SPILL_STRENGTH))
        out[j + 1] = g
        out[j + 2] = int(max(0, b - spill * SPILL_STRENGTH))
        out[j + 3] = int(a * 255)
    img = Image.frombytes('RGBA', im.size, bytes(out))
    bbox = img.getchannel('A').point(lambda v: 255 if v > TRIM_ALPHA else 0).getbbox()
    img = img.crop((max(0, bbox[0] - PAD), max(0, bbox[1] - PAD), min(img.width, bbox[2] + PAD), min(img.height, bbox[3] + PAD)))
    if flip:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    img.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
    img.save(dst)
    print(dst, img.size)


if __name__ == '__main__':
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    key(sys.argv[1], sys.argv[2], len(sys.argv) > 3 and sys.argv[3] == 'flip')
