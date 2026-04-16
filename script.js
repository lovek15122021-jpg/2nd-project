const API_BASE = './api/';
let currentUser = null;
let loginTime = null;
let isUserIdle = false;
let idleTimer;
let isManualBreak = false;

const IDLE_LIMIT = 5 * 60 * 1000;

// ---------------- INIT ----------------
document.addEventListener('DOMContentLoaded', () => {

    let form = document.getElementById('loginForm');
    if (form) form.addEventListener('submit', handleLogin);

    let logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    let startBtn = document.getElementById('startBreakBtn');
    if (startBtn) startBtn.addEventListener('click', () => handleBreak('start_break', 'manual'));

    let endBtn = document.getElementById('endBreakBtn');
    if (endBtn) endBtn.addEventListener('click', () => handleBreak('end_break', 'manual'));

    checkLoginStatus();
    updateStatus();
    setInterval(updateStatus, 1000);
});

// ---------------- API ----------------
async function apiRequest(endpoint, options = {}) {
    try {
        let headers = {};
        let body = null;

        if (options.method === 'POST') {
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify(options.body);
        }

        const res = await fetch(API_BASE + endpoint, {
            method: options.method || 'GET',
            headers,
            body
        });

        const text = await res.text();

        if (text.includes('<html') || text.includes('Warning')) {
            throw new Error('Server Error');
        }

        return JSON.parse(text);

    } catch (err) {
        console.error(err);
        return { success: false, error: err.message };
    }
}

// ---------------- LOGIN ----------------
async function handleLogin(e) {
    if (e) e.preventDefault();

    let empInput = document.getElementById('empId');
    let passInput = document.getElementById('password');

    let empId = empInput ? empInput.value.trim().toUpperCase() : '';
    let password = passInput ? passInput.value : '';

    if (!empId || !password) {
        alert("Enter ID & Password");
        return;
    }

    const res = await apiRequest('attendance.php', {
        method: 'POST',
        body: { emp_id: empId, password: password, action: 'login' }
    });

    if (res.success) {
        currentUser = empId;
        loginTime = new Date();
        localStorage.setItem('currentEmpId', empId);
        showLoggedInState();
    } else {
        alert(res.error || 'Login failed');
    }
}

// ---------------- LOGOUT ----------------
async function handleLogout() {

    if (!currentUser) return;

    await apiRequest('attendance.php', {
        method: 'POST',
        body: { emp_id: currentUser, action: 'logout' }
    });

    localStorage.removeItem('currentEmpId');
    location.reload();
}

// ---------------- BREAK ----------------
async function handleBreak(action, type = 'manual') {

    const empId = currentUser;
    if (!empId) return;

    if (type === 'manual') {
        isManualBreak = (action === 'start_break');
    }

    await apiRequest('attendance.php', {
        method: 'POST',
        body: { emp_id: empId, action, type }
    });

    let startBtn = document.getElementById('startBreakBtn');
    let endBtn = document.getElementById('endBreakBtn');

    if (type === 'manual') {

        if (action === 'start_break') {
            if (startBtn) startBtn.style.display = 'none';
            if (endBtn) endBtn.style.display = 'block';
        } else {
            if (startBtn) startBtn.style.display = 'block';
            if (endBtn) endBtn.style.display = 'none';
        }
    }

    showTodayRecord();
}

// ---------------- IDLE ----------------
function setupIdleTracking() {

    ['mousemove','keydown','click','scroll'].forEach(e => {
        window.addEventListener(e, resetIdleTimer);
    });

    startIdleTimer();
}

function resetIdleTimer() {

    if (isUserIdle && currentUser && !isManualBreak) {
        isUserIdle = false;
        handleBreak('end_break', 'auto');
    }

    clearTimeout(idleTimer);
    startIdleTimer();
}

function startIdleTimer() {

    if (!currentUser) return;

    idleTimer = setTimeout(() => {

        if (isManualBreak) return;

        if (!isUserIdle) {
            isUserIdle = true;
            handleBreak('start_break', 'auto');
        }

    }, IDLE_LIMIT);
}

// ---------------- UI ----------------
function showLoggedInState() {

    let loginBtn = document.getElementById('loginBtn');
    let logoutBtn = document.getElementById('logoutBtn');
    let todayRecord = document.getElementById('todayRecord');
    let startBtn = document.getElementById('startBreakBtn');
    let endBtn = document.getElementById('endBreakBtn');

    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'block';
    if (todayRecord) todayRecord.style.display = 'block';

    if (startBtn) startBtn.style.display = 'block';
    if (endBtn) endBtn.style.display = 'none';

    setupIdleTracking();
    showTodayRecord();
}

// ---------------- RECORD ----------------
async function showTodayRecord() {

    let box = document.getElementById('todayData');
    if (!box || !currentUser) return;

    const today = new Date().toISOString().split('T')[0];

    const data = await apiRequest(`attendance.php?date=${today}&emp_id=${currentUser}`);

    if (Array.isArray(data) && data.length) {

        const r = data[0];

        box.innerHTML = `
            <p>🕒 ${new Date(r.login_time).toLocaleTimeString()}</p>
            <p>☕ ${r.manual_break_mins || 0} mins</p>
            <p>🤖 ${r.auto_idle_mins || 0} mins</p>
            <p>📊 ${r.total_hours}h</p>
        `;
    }
}

// ---------------- STATUS ----------------
function updateStatus() {

    let t = document.getElementById('statusText');
    let time = document.getElementById('statusTime');

    if (!t || !time) return;

    if (currentUser) {
        t.innerHTML = isUserIdle
            ? `<span style="color:orange;">Idle</span>`
            : `<span style="color:green;">Working (${currentUser})</span>`;
        time.textContent = new Date().toLocaleTimeString();
    } else {
        t.textContent = 'Please Login';
    }
}

// ---------------- SESSION ----------------
async function checkLoginStatus() {

    const empId = localStorage.getItem('currentEmpId');
    if (!empId) return;

    currentUser = empId;
    showLoggedInState();
}