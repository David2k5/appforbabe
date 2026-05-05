// -------------- DANH SÁCH CÁC CÔNG VIỆC MẶC ĐỊNH ----------
const TASKS = [
    { id: "eat", emoji: "🍚", name: "Ăn cơm / Ăn gì đó", hour: 12, minute: 0, label: "12:00 trưa" },
    { id: "eat2", emoji: "🍜", name: "Ăn tối đủ chất", hour: 19, minute: 0, label: "19:00 tối" },
    { id: "drink", emoji: "💧", name: "Uống nước", hour: 9, minute: 30, label: "09:30 sáng" },
    { id: "drink2", emoji: "🥤", name: "Uống nước chiều", hour: 15, minute: 0, label: "15:00 chiều" },
    { id: "bath", emoji: "🛁", name: "Tắm rửa thơm tho", hour: 21, minute: 0, label: "21:00 tối" },
    { id: "sleep", emoji: "🌙", name: "Đi ngủ sớm (trước 24h)", hour: 23, minute: 45, label: "23:45 - chuẩn bị ngủ", sleepMode: true },
    { id: "lunch", emoji: "🥗", name: "Ăn trưa", hour: 12, minute: 30, label: "12:30 trưa" }
];

let currentDateKey = "";
let completedStatus = {};
let intervalTimer = null;
let toastTimeout = null;

// Helper lấy key cho hôm nay
function getTodayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Lưu trạng thái hiện tại vào localStorage
function saveStatus() {
    if (!currentDateKey) return;
    const storageKey = `ny_reminder_${currentDateKey}`;
    localStorage.setItem(storageKey, JSON.stringify(completedStatus));
}

// Load dữ liệu theo ngày
function loadStatusForToday() {
    const today = getTodayKey();
    currentDateKey = today;
    const storageKey = `ny_reminder_${today}`;
    const raw = localStorage.getItem(storageKey);
    const defaultStatus = {};
    TASKS.forEach(task => { defaultStatus[task.id] = false; });

    if (raw) {
        try {
            const saved = JSON.parse(raw);
            TASKS.forEach(task => {
                if (typeof saved[task.id] === 'boolean') {
                    defaultStatus[task.id] = saved[task.id];
                }
            });
            completedStatus = defaultStatus;
        } catch (e) { completedStatus = { ...defaultStatus }; }
    } else {
        completedStatus = { ...defaultStatus };
    }
    saveStatus();
}

// Reset tất cả task trong ngày
function resetAllTasks() {
    TASKS.forEach(task => { completedStatus[task.id] = false; });
    saveStatus();
    renderReminders();
    updateDynamicMessage();
    showFloatyMessage("✨ Đã đặt lại toàn bộ việc hôm nay, cố gắng hoàn thành nha bé yêu ✨");
}

// Reset sang ngày mới
function resetNewDay() {
    const todayKey = getTodayKey();
    TASKS.forEach(task => { completedStatus[task.id] = false; });
    currentDateKey = todayKey;
    saveStatus();
    renderReminders();
    updateDynamicMessage();
    showFloatyMessage("🌸 Đã bắt đầu một ngày mới đầy yêu thương! Hãy chăm sóc bản thân nhé 🌸");
}

// Toggle hoàn thành task
function toggleTask(taskId) {
    if (completedStatus.hasOwnProperty(taskId)) {
        completedStatus[taskId] = !completedStatus[taskId];
        saveStatus();
        renderReminders();
        updateDynamicMessage();

        const taskElem = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElem) {
            taskElem.style.transform = "scale(0.99)";
            setTimeout(() => { if (taskElem) taskElem.style.transform = ""; }, 150);
        }

        const task = TASKS.find(t => t.id === taskId);
        if (completedStatus[taskId]) {
            showFloatyMessage(`💖 Làm tốt lắm! Đã ${task.emoji} ${task.name} , thương bé! 💖`);
        } else {
            showFloatyMessage("⏰ Đã bỏ tick, nhớ làm nghennn!");
        }
    }
}

// Hiển thị thông báo tạm thời
function showFloatyMessage(msg) {
    const msgDiv = document.getElementById("dynamicMsg");
    if (!msgDiv) return;
    const originalText = msgDiv.innerText;
    msgDiv.style.transition = "0.1s";
    msgDiv.innerText = msg;
    msgDiv.style.background = "#fff0f5";
    msgDiv.style.fontWeight = "bold";
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        if (msgDiv) updateDynamicMessage();
    }, 2500);
}

// Cập nhật lời nhắc động
function updateDynamicMessage() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTotalMin = currentHour * 60 + currentMin;

    let upcomingTask = null;
    let smallestDiff = Infinity;

    TASKS.forEach(task => {
        if (completedStatus[task.id]) return;
        const taskTotalMin = task.hour * 60 + task.minute;
        let diff = taskTotalMin - currentTotalMin;
        if (diff < 0) diff = -1;
        if (diff < smallestDiff) {
            smallestDiff = diff;
            upcomingTask = task;
        }
    });

    const msgBox = document.getElementById("dynamicMsg");
    if (!msgBox) return;

    if (!upcomingTask) {
        msgBox.innerHTML = "🎉 Hôm nay e đã hoàn thành xuất sắc mọi việc! Thưởng cho e một nụ hôn gió 💋💕";
        return;
    }

    const taskName = `${upcomingTask.emoji} ${upcomingTask.name}`;
    const timeStr = upcomingTask.label;

    if (smallestDiff === -1) {
        msgBox.innerHTML = `⏰ E ơi, đã quá giờ ${timeStr} rồi! Nhớ ${taskName} ngay nhé. Yêu e nhiều! 🥺❤️`;
    } else {
        msgBox.innerHTML = `🌸 Sắp đến ${timeStr} rồi, hãy chuẩn bị ${taskName} nè. A luôn nhắc cho e vì thương e lắm! 🌸`;
    }
}

// Hiển thị danh sách reminders
function renderReminders() {
    const container = document.getElementById("remindersList");
    if (!container) return;
    container.innerHTML = "";

    TASKS.forEach(task => {
        const isCompleted = completedStatus[task.id] || false;
        const itemDiv = document.createElement("div");
        let colorClass = 'eat';
        if (task.id.includes('drink')) colorClass = 'drink';
        else if (task.id.includes('bath')) colorClass = 'bath';
        else if (task.id.includes('sleep')) colorClass = 'sleep';
        else colorClass = 'eat';

        itemDiv.className = `reminder-item ${colorClass}`;
        if (isCompleted) itemDiv.classList.add("completed");
        itemDiv.setAttribute("data-task-id", task.id);

        const infoDiv = document.createElement("div");
        infoDiv.className = "task-info";
        infoDiv.innerHTML = `
            <div class="task-name">
                <span>${task.emoji}</span>
                <span>${task.name}</span>
            </div>
            <div class="task-time">⏰ ${task.label}</div>
        `;

        const statusDiv = document.createElement("div");
        statusDiv.className = "status-badge";
        statusDiv.innerHTML = isCompleted ? "✅ Đã làm ❤️" : "⭕ Chưa làm";

        const btn = document.createElement("button");
        btn.innerText = isCompleted ? "🔄 Bỏ?" : "✔️ Làm rồi!";
        btn.className = "btn-check";
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleTask(task.id);
        });

        const rightWrapper = document.createElement("div");
        rightWrapper.style.display = "flex";
        rightWrapper.style.alignItems = "center";
        rightWrapper.style.gap = "12px";
        rightWrapper.appendChild(statusDiv);
        rightWrapper.appendChild(btn);

        itemDiv.appendChild(infoDiv);
        itemDiv.appendChild(rightWrapper);
        container.appendChild(itemDiv);
    });
}

// Cập nhật đồng hồ và kiểm tra đổi ngày
function updateClockAndCheck() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;
    const timeElem = document.getElementById("currentTime");
    if (timeElem) timeElem.innerText = timeString;

    const dateElem = document.getElementById("currentDate");
    if (dateElem) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElem.innerText = now.toLocaleDateString('vi-VN', options);
    }

    updateDynamicMessage();

    const todayKey = getTodayKey();
    if (currentDateKey !== todayKey) {
        loadStatusForToday();
        renderReminders();
        updateDynamicMessage();
        showFloatyMessage("🌞 Chúc mừng ngày mới! Hãy cùng hoàn thành những việc nhỏ xinh hôm nay nhé ❤️");
    }
}

// Khởi tạo
function init() {
    loadStatusForToday();
    renderReminders();
    updateClockAndCheck();
    if (intervalTimer) clearInterval(intervalTimer);
    intervalTimer = setInterval(updateClockAndCheck, 1000);

    const resetBtn = document.getElementById("resetAllTasksBtn");
    if (resetBtn) resetBtn.addEventListener("click", resetAllTasks);
    const newDayBtn = document.getElementById("resetAllBtn");
    if (newDayBtn) newDayBtn.addEventListener("click", resetNewDay);
}

// Bắt đầu khi trang tải xong
document.addEventListener('DOMContentLoaded', init);
// ========== PHẦN PWA & NOTIFICATION ==========

// Biến lưu trạng thái cài đặt app
let deferredPrompt = null;
let isAppInstalled = false;

// Đăng ký Service Worker và xử lý PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('✅ Service Worker đăng ký thành công:', registration);

                // Kiểm tra xem app đã được cài đặt chưa
                if (registration.installing) {
                    console.log('Service Worker đang cài đặt');
                } else if (registration.waiting) {
                    console.log('Service Worker đang chờ');
                } else if (registration.active) {
                    console.log('Service Worker đã active');
                    showOfflineReady();
                }
            })
            .catch(error => {
                console.log('❌ Lỗi Service Worker:', error);
            });
    });
}

// Hiển thị thông báo đã sẵn sàng offline
function showOfflineReady() {
    const msgDiv = document.getElementById('dynamicMsg');
    if (msgDiv && !isAppInstalled) {
        const originalMsg = msgDiv.innerHTML;
        setTimeout(() => {
            msgDiv.innerHTML = '✅ Đã sẵn sàng hoạt động offline! Cài app ngay để nhận thông báo 💖';
            setTimeout(() => {
                if (msgDiv.innerHTML.includes('sẵn sàng')) {
                    msgDiv.innerHTML = originalMsg;
                }
            }, 3000);
        }, 1000);
    }
}

// Xử lý cài đặt app
window.addEventListener('beforeinstallprompt', (e) => {
    // Chặn sự kiện mặc định
    e.preventDefault();
    // Lưu lại event để dùng sau
    deferredPrompt = e;

    // Hiển thị banner cài đặt
    const installBanner = document.getElementById('installBanner');
    if (installBanner) {
        installBanner.style.display = 'block';
    }

    console.log('✅ Có thể cài đặt app');
});

// Xử lý khi người dùng click nút cài đặt
const installBtn = document.getElementById('installBtn');
if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) {
            alert('Trình duyệt không hỗ trợ cài đặt app hoặc đã được cài rồi!');
            return;
        }

        // Hiển thị prompt cài đặt
        deferredPrompt.prompt();

        // Đợi người dùng chọn
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Kết quả cài đặt: ${outcome}`);

        if (outcome === 'accepted') {
            isAppInstalled = true;
            const installBanner = document.getElementById('installBanner');
            if (installBanner) installBanner.style.display = 'none';
            showFloatyMessage('🎉 Cảm ơn bạn đã cài app! Sẽ nhắc nhở đúng giờ nhé!');
        }

        // Xóa deferredPrompt để không dùng lại
        deferredPrompt = null;
    });
}

// Phát hiện khi app đã được cài đặt
window.addEventListener('appinstalled', (evt) => {
    console.log('✅ App đã được cài đặt thành công!');
    isAppInstalled = true;
    const installBanner = document.getElementById('installBanner');
    if (installBanner) installBanner.style.display = 'none';
});

// ========== PHẦN THÔNG BÁO ĐẨY (PUSH NOTIFICATION) ==========

// Yêu cầu quyền gửi thông báo
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('Trình duyệt không hỗ trợ thông báo');
        return false;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        console.log('✅ Đã được phép gửi thông báo');
        showFloatyMessage('🔔 Thông báo đã bật! App sẽ nhắc bạn đúng giờ');
        return true;
    } else {
        console.log('❌ Chưa được phép gửi thông báo');
        return false;
    }
}

// Kiểm tra và gửi thông báo đúng giờ
let lastNotified = {}; // Tránh gửi trùng lặp

function checkAndSendNotification() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentKey = `${hours}:${minutes}`;

    // Chỉ gửi thông báo nếu được phép
    if (Notification.permission !== 'granted') return;

    TASKS.forEach(task => {
        const taskTime = `${task.hour}:${task.minute}`;
        const notificationKey = `${task.id}_${currentKey}`;

        // Kiểm tra đến giờ và chưa hoàn thành, chưa gửi thông báo trong phút này
        if (taskTime === currentKey && !completedStatus[task.id] && !lastNotified[notificationKey]) {
            // Gửi thông báo
            new Notification(`💖 ${task.emoji} Nhắc nhỏ xíu 💖`, {
                body: `Đến giờ ${task.name} rồi! Nhớ làm nghen, thương bạn lắm! 🥺`,
                icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23ffd9e8"/%3E%3Ctext x="50" y="67" font-size="50" text-anchor="middle" fill="%23e85d8f"%3E💖%3C/text%3E%3C/svg%3E',
                badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23ffd9e8"/%3E%3Ctext x="50" y="67" font-size="50" text-anchor="middle" fill="%23e85d8f"%3E💖%3C/text%3E%3C/svg%3E',
                vibrate: [200, 100, 200],
                tag: `reminder_${task.id}`,
                requireInteraction: true,
                silent: false
            });

            // Đánh dấu đã gửi
            lastNotified[notificationKey] = true;

            // Xóa dấu sau 1 phút
            setTimeout(() => {
                delete lastNotified[notificationKey];
            }, 60000);

            console.log(`📢 Đã gửi thông báo: ${task.name}`);
        }
    });
}

// Hàm yêu cầu permission và bắt đầu kiểm tra
function initNotifications() {
    // Tự động xin quyền khi người dùng tương tác lần đầu
    const requestOnInteraction = () => {
        requestNotificationPermission();
        document.removeEventListener('click', requestOnInteraction);
        document.removeEventListener('touchstart', requestOnInteraction);
    };

    document.addEventListener('click', requestOnInteraction);
    document.addEventListener('touchstart', requestOnInteraction);

    // Bắt đầu kiểm tra thông báo mỗi 30 giây
    setInterval(checkAndSendNotification, 30000);

    // Kiểm tra ngay khi load trang
    setTimeout(() => {
        checkAndSendNotification();
    }, 5000);
}

// Khởi tạo notification sau khi trang load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotifications);
} else {
    initNotifications();
}

// Kiểm tra xem có đang mở bằng app không
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
    console.log('🎉 App đang chạy ở chế độ standalone (đã cài đặt)');
    document.body.classList.add('app-mode');
}
Notification.requestPermission().then(perm => console.log(perm));
new Notification("Test", { body: "Thông báo hoạt động tốt!" });
