# 開發工具

遊戲本身不需要這些，只在調平衡、加新圖時用。

## 自動遊玩（調難度用）

在無頭瀏覽器裡快轉打完整局，一局幾分鐘跑完。改數值、加新怪之後，用它看勝率、法師在各階段被打中幾次、每種怪掉多少靈魂。

```sh
npm i --no-save playwright       # 第一次用才需要
python -m http.server 8765       # 另開一個終端機，在 repo 根目錄跑
mkdir -p logs
for i in 1 2 3 4 5 6; do node tools/playtest.mjs http://localhost:8765/ human run$i > logs/run$i.log & done; wait
node tools/summarize.mjs logs
```

- `human`：像真人，看到預警 0.4 秒後才閃；`still`：站著不動，量「不會走位的玩家」撐到哪
- 機器人花錢、選卡都比真人有效率，**勝率會偏高**，拿來比較「改之前／改之後」，不是絕對難度
- 單局隨機性很大，至少跑 6 局再下結論
- `STUCK` 代表某一波打了超過 240 秒，會列出場上剩下的怪，通常是 bug

## 介面檢查（改了任何畫面都要跑）

用一支實際玩家手機的條件截出所有畫面：**可用畫面約 408×673**（LINE 內建瀏覽器，比一般測試的 390×780 矮很多），**系統字型放大 1.8 倍**。

```sh
node tools/ui-check.mjs http://localhost:8765/ logs/ui           # 預設就是上面那支手機的條件
FIX=0 node tools/ui-check.mjs http://localhost:8765/ logs/ui-raw # 看不補償字型放大時的樣子
```

那個瀏覽器會把字放大、框不變，而且不理會 `text-size-adjust`；遊戲啟動時用 `cancelTextZoom()`（`game.js`）量出倍率、把字級除回去。所以介面裡的字級請一律寫在 CSS 樣式表、用 px —— 寫在 JS 的行內樣式裡就不會被補償到。

## 純色去背（加新圖用）

Gemini 生圖不支援透明背景，請它畫在一種純色背景上，再用這支去背（背景色自動從四個角判斷）：

```sh
pip install pillow               # 第一次用才需要
python tools/key-chroma.py 生好的圖.jpg 新怪.png        # 角色朝右
python tools/key-chroma.py 生好的圖.jpg 新怪.png flip   # 角色朝左時翻成朝右
```

**背景挑跟角色顏色差最遠的那一種**，撞色的部分會被一起扣掉：

| 角色主色 | 背景 |
|---|---|
| 紫、紅、粉、黑紅 | 綠 `#00FF00` |
| 綠、黃、褐 | 洋紅 `#FF00FF` |
| 藍、青、白光 | 黃 `#FFFF00` 或洋紅 |
| 紫＋毒綠（兩個都有） | 青 `#00FFFF` |

輸出後加進 `game.js` 的 `OPTIONAL_ART`，並在怪物設定寫 `art` 與 `artScale`。
