class Clock25Hours {
    constructor() {
        this.timeElement = document.querySelector('.time');
        this.realTimeElement = document.querySelector('.real-time');
        this.dateElements = document.querySelectorAll('.date');
        this.conversionFactor = 25/24; // 24時間を25時間に変換する係数
    }

    convert24to25(hours, minutes, seconds) {
        // 0時からの経過秒数を計算
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        
        // 25時間体系での秒数に変換
        const convertedSeconds = totalSeconds * this.conversionFactor;
        
        // 時、分、秒に分解
        const convertedHours = Math.floor(convertedSeconds / 3600);
        const remainingSeconds = convertedSeconds % 3600;
        const convertedMinutes = Math.floor(remainingSeconds / 60);
        const finalSeconds = Math.floor(remainingSeconds % 60);
        
        return {
            hours: convertedHours,
            minutes: convertedMinutes,
            seconds: finalSeconds
        };
    }

    updateClock() {
        const now = new Date();
        const converted = this.convert24to25(
            now.getHours(),
            now.getMinutes(),
            now.getSeconds()
        );

        // 25時間表示の時刻を更新
        this.timeElement.textContent = `${String(converted.hours).padStart(2, '0')}:${
            String(converted.minutes).padStart(2, '0')}:${
            String(converted.seconds).padStart(2, '0')}`;

        // 実際の時間を更新
        this.realTimeElement.textContent = `${String(now.getHours()).padStart(2, '0')}:${
            String(now.getMinutes()).padStart(2, '0')}:${
            String(now.getSeconds()).padStart(2, '0')}`;

        // 日付の表示を更新（両方の時計）
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const date = now.getDate();
        this.dateElements.forEach(element => {
            element.textContent = `${year}年${month}月${date}日`;
        });
    }

    start() {
        // 初回実行
        this.updateClock();
        // 1秒ごとに更新
        setInterval(() => this.updateClock(), 1000);
    }
}

// 時計をスタート
const clock = new Clock25Hours();
clock.start();