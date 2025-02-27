# 25時間時計アプリケーション

## 概要
このアプリケーションは、通常の24時間表示と25時間表示の時計を同時に表示するウェブアプリケーションです。25時間表示は、24時間を25時間に変換して表示する特殊な時間表示方式です。

## 使用方法
1. `index.html` をウェブブラウザで開くだけで使用できます
2. 画面に2つの時計が表示されます：
   - 左側：25時間表示の時計
   - 右側：通常の24時間表示の時計
3. 両方の時計は自動的に1秒ごとに更新されます

## 25時間表示の仕組み

### 変換方式
24時間から25時間への変換は以下の手順で行われます：

1. 現在時刻を0時からの経過秒数に変換
2. 変換係数（25/24）を掛けて25時間体系の秒数に変換
3. 変換された秒数から時、分、秒を計算

### 計算例
例えば、24時間表示で12:00:00の場合：
- 経過秒数：12時間 = 43,200秒
- 25時間体系での秒数：43,200 × (25/24) = 45,000秒
- 25時間表示では12.5時（12:30:00）となります

## 技術仕様

### フロントエンド実装
- **HTML**: モダンなHTML5を使用
- **CSS**: レスポンシブデザイン対応
  - ダークテーマ
  - Flexboxによるレイアウト
  - モバイル対応（768px以下で縦並びに変更）
- **JavaScript**: 
  - クラスベースの実装
  - setIntervalによる1秒ごとの自動更新

### コアロジック
```javascript
conversionFactor = 25/24; // 変換係数

// 24時間から25時間への変換関数
convert24to25(hours, minutes, seconds) {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const convertedSeconds = totalSeconds * this.conversionFactor;
    
    const convertedHours = Math.floor(convertedSeconds / 3600);
    const remainingSeconds = convertedSeconds % 3600;
    const convertedMinutes = Math.floor(remainingSeconds / 60);
    const finalSeconds = Math.floor(remainingSeconds % 60);
    
    return { hours, minutes, seconds };
}
```

## デザイン特徴
- ダークモード：目に優しい配色
- 大きな時刻表示：視認性の高いデザイン
- レスポンシブ対応：様々なデバイスでの利用が可能
- ミニマルなUI：必要な情報のみをシンプルに表示

## ブラウザ対応
- モダンなウェブブラウザ（Chrome, Firefox, Safari, Edge）で動作
- ES6以降のJavaScript機能を使用しているため、最新のブラウザの使用を推奨