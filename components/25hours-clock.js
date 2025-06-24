class CustomHoursClock {
    constructor(options = {}) {
        this.timeElement = options.timeElement || document.querySelector('.time');
        this.realTimeElement = options.realTimeElement || document.querySelector('.real-time');
        this.dateElements = options.dateElements || document.querySelectorAll('.date');
        this.customHoursInput = options.customHoursInput || document.getElementById('custom-hours');
        this.startTimeInput = options.startTimeInput || document.getElementById('start-time');
        this.endTimeInput = options.endTimeInput || document.getElementById('end-time');
        
        // 初期設定
        this.updateTimeRange();
        this.updateConversionFactor();
        
        if (this.customHoursInput) {
            this.setupCollapsibleSections();
            
            // イベントリスナーの設定
            this.customHoursInput.addEventListener('input', () => {
                this.updateCustomTimeTitle(); // 表示の即時更新
            });

            this.customHoursInput.addEventListener('change', () => {
                this.updateConversionFactor(); // 値の確定時に時間変換係数を更新
            });

            // 初期表示を設定
            this.updateCustomTimeTitle();

            this.startTimeInput.addEventListener('change', () => {
                this.updateTimeRange();
            });

            this.endTimeInput.addEventListener('change', () => {
                this.updateTimeRange();
            });
        }
    }

    updateTimeRange() {
        if (!this.startTimeInput || !this.endTimeInput) {
            // デフォルト値：0:00-24:00 (24時間全体)
            this.startSeconds = 0;
            this.endSeconds = 24 * 3600;
            this.rangeSeconds = 24 * 3600;
            this.updateConversionFactor();
            return;
        }
        
        // 開始時刻と終了時刻を解析
        const [startHours, startMinutes] = this.startTimeInput.value.split(':').map(Number);
        const [endHours, endMinutes] = this.endTimeInput.value.split(':').map(Number);

        this.startSeconds = startHours * 3600 + startMinutes * 60;
        this.endSeconds = endHours * 3600 + endMinutes * 60;

        // 終了時刻が開始時刻より前の場合、24時間を加算
        if (this.endSeconds <= this.startSeconds) {
            this.endSeconds += 24 * 3600;
        }

        // 範囲の長さを計算（秒）
        this.rangeSeconds = this.endSeconds - this.startSeconds;
        this.updateConversionFactor();
    }

    updateConversionFactor() {
        if (!this.customHoursInput) {
            // デフォルト値：25時間制
            this.conversionFactor = 1 / (this.rangeSeconds / 3600);
            return;
        }
        
        const customHours = parseFloat(this.customHoursInput.value);
        if (customHours >= 24 && customHours <= 48) {
            // 選択された時間範囲を新しい時間制に変換するための係数を計算
            this.conversionFactor = (customHours - 24) / (this.rangeSeconds / 3600);
        } else {
            this.customHoursInput.value = '25';
            this.conversionFactor = 1 / (this.rangeSeconds / 3600);
        }
    }

    convert24toCustom(hours, minutes, seconds) {
        // 現在時刻の0時からの経過秒数を計算
        const currentSeconds = hours * 3600 + minutes * 60 + seconds;
        
        // 選択範囲内かどうかをチェック
        let targetSeconds = currentSeconds;
        if (currentSeconds < this.startSeconds) {
            targetSeconds += 24 * 3600;
        }

        if (targetSeconds >= this.startSeconds && targetSeconds <= this.endSeconds) {
            // 選択範囲内の場合、新しい時間制に変換
            const relativeSeconds = targetSeconds - this.startSeconds;
            const convertedSeconds = relativeSeconds * (1 + this.conversionFactor);
            
            // 基準時刻（開始時刻）に変換後の時間を加算
            const baseHours = Math.floor(this.startSeconds / 3600);
            const totalSeconds = baseHours * 3600 + convertedSeconds;
            
            // 時、分、秒に分解
            const convertedHours = Math.floor(totalSeconds / 3600);
            const remainingSeconds = totalSeconds % 3600;
            const convertedMinutes = Math.floor(remainingSeconds / 60);
            const finalSeconds = Math.floor(remainingSeconds % 60);
            
            return {
                hours: convertedHours,
                minutes: convertedMinutes,
                seconds: finalSeconds,
                inRange: true
            };
        }
        
        // 選択範囲外の場合、元の時間をそのまま返す
        return {
            hours,
            minutes,
            seconds,
            inRange: false
        };
    }

    updateClock() {
        const now = new Date();
        const converted = this.convert24toCustom(
            now.getHours(),
            now.getMinutes(),
            now.getSeconds()
        );

        // カスタム時間の表示を更新（範囲外の場合は通常の時間を表示）
        if (this.timeElement) {
            this.timeElement.textContent = `${String(converted.hours).padStart(2, '0')}:${
                String(converted.minutes).padStart(2, '0')}:${
                String(converted.seconds).padStart(2, '0')}`;
            
            // 範囲内/外で表示色を変更
            this.timeElement.style.color = converted.inRange ? '#00ff00' : '#ffffff';
        }

        // 実際の時間を更新
        if (this.realTimeElement) {
            this.realTimeElement.textContent = `${String(now.getHours()).padStart(2, '0')}:${
                String(now.getMinutes()).padStart(2, '0')}:${
                String(now.getSeconds()).padStart(2, '0')}`;
        }

        // 日付の表示を更新
        if (this.dateElements) {
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const date = now.getDate();
            this.dateElements.forEach(element => {
                element.textContent = `${year}年${month}月${date}日`;
            });
        }
    }

    updateCustomTimeTitle() {
        const titleElement = document.getElementById('custom-time-title');
        if (titleElement) {
            const hours = parseFloat(this.customHoursInput.value);
            titleElement.textContent = `${hours}時間表示`;
        }
    }

    setupCollapsibleSections() {
        // 全ての折りたたみセクションを取得
        const sections = document.querySelectorAll('.collapsible-section');
        
        sections.forEach(section => {
            const header = section.querySelector('.section-header');
            const content = section.querySelector('.section-content');
            const button = section.querySelector('.toggle-button');
            const title = section.querySelector('h2').textContent;
            
            // ヘッダーまたはボタンクリックで開閉
            const toggleSection = () => {
                content.classList.toggle('collapsed');
                button.classList.toggle('collapsed');
                localStorage.setItem(`section-${title}`, content.classList.contains('collapsed'));
            };
            
            header.addEventListener('click', toggleSection);

            // 初期状態を設定（LocalStorageの状態は無視）
            if (title === '設定') {
                // 設定セクションは折りたたむ
                content.classList.add('collapsed');
                button.classList.add('collapsed');
                localStorage.setItem(`section-${title}`, 'true');
            } else {
                // その他のセクションは展開
                content.classList.remove('collapsed');
                button.classList.remove('collapsed');
                localStorage.setItem(`section-${title}`, 'false');
            }
        });
    }

    start() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }
}

// カスタム時間時計をスタート
if (typeof window !== 'undefined') {
    window.CustomHoursClock = CustomHoursClock;
    
    // 設定要素が存在する場合のみ自動初期化
    if (document.getElementById('custom-hours')) {
        const clock = new CustomHoursClock();
        clock.start();
    }
}