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

## 洋紅去背（加新圖用）

Gemini 生圖不支援透明背景，請它畫在純洋紅（#FF00FF）背景上，再用這支去背：

```sh
pip install pillow               # 第一次用才需要
python tools/key-magenta.py 生好的圖.jpg 新怪.png        # 角色朝右
python tools/key-magenta.py 生好的圖.jpg 新怪.png flip   # 角色朝左時翻成朝右
```

角色身上不能有洋紅、粉紅、紫色，不然會被一起去掉。輸出後加進 `game.js` 的 `OPTIONAL_ART`，並在怪物設定寫 `art` 與 `artScale`。
