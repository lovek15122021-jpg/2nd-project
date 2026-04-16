const API_BASE = './api/';
let isAdminLoggedIn = false;

// ---------------- API REQUEST ----------------
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(API_BASE + endpoint, {
            method: options.method || 'GET',
            headers: { 'Content-Type': 'application/json' },
            ...(options.body && { body: JSON.stringify(options.body) })
        });

        const text = await response.text();

        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('Non-JSON response:', text);
            return { success: false, error: 'Invalid server response' };
        }

    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: 'Network error' };
    }
}

// ---------------- LOGIN ----------------
async function adminLogin() {

    let passInput = document.getElementById('adminPass');
    if (!passInput) {
        console.error("adminPass input not found");
        return;
    }

    const password = passInput.value;

    const result = await apiRequest('admin.php', {
        method: 'POST',
        body: { password }
    });

    if (result.success) {
        isAdminLoggedIn = true;

        let adminContent = document.getElementById('adminContent');
        let loginBox = document.querySelector('.admin-login');

        if (adminContent) adminContent.style.display = 'block';
        if (loginBox) loginBox.style.display = 'none';

        loadAllData();
        showMessage('Admin Login Success! ✅', 'success');

    } else {
        showMessage(result.error || 'Wrong Password!', 'error');
    }
}

// ---------------- LOAD DATA ----------------
async function loadAllData(dateFilter = null) {
    try {
        const dateParam = dateFilter ? `?date=${dateFilter}` : '';
        const records = await apiRequest(`attendance.php${dateParam}`);
        displayRecords(records);
    } catch (error) {
        showMessage('Failed to load data!', 'error');
    }
}

// ---------------- DISPLAY ----------------
function displayRecords(records) {

    const tbody = document.getElementById('tableBody');

    if (!tbody) {
        console.error("tableBody not found");
        return;
    }

    if (!records || records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;">No records found</td></tr>`;
        return;
    }

    tbody.innerHTML = records.map(record => `
        <tr>
            <td><strong>${record.emp_id || 'N/A'}</strong></td>
            <td>${record.emp_name || 'Unknown'}</td>
            <td>${record.date || 'N/A'}</td>
            <td>${record.login_time ? new Date(record.login_time).toLocaleTimeString() : '---'}</td>
            <td>${record.logout_time ? new Date(record.logout_time).toLocaleTimeString() : '---'}</td>

            <td style="color:#2196F3;font-weight:bold;">
                ${record.manual_break_mins || 0}m
            </td>

            <td style="color:#f44336;font-weight:bold;">
                ${record.auto_idle_mins || 0}m
            </td>

            <td style="font-weight:bold;color:#28a745;">
                ${record.total_hours ? parseFloat(record.total_hours).toFixed(2) + 'h' : '0h'}
            </td>

            <td>
                <button onclick="changePassword('${record.emp_id}')">Reset</button>
                <button onclick="deleteEmployee('${record.emp_id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

// ---------------- ADD EMPLOYEE ----------------
async function addEmployee() {

    const empId = document.getElementById('newEmpId')?.value.trim().toUpperCase();
    const empName = document.getElementById('newEmpName')?.value.trim();
    const empPass = document.getElementById('newEmpPass')?.value.trim();

    if (!empId || !empName || !empPass) {
        showMessage('Fill all fields!', 'error');
        return;
    }

    const result = await apiRequest('employees.php', {
        method: 'POST',
        body: {
            admin: 'admin123',
            emp_id: empId,
            name: empName,
            password: empPass
        }
    });

    if (result.success) {
        showMessage('Employee Added!', 'success');

        document.getElementById('newEmpId').value = '';
        document.getElementById('newEmpName').value = '';
        document.getElementById('newEmpPass').value = '';

        loadAllData();
    } else {
        showMessage(result.error || 'Error', 'error');
    }
}

// ---------------- RESET PASSWORD ----------------
async function changePassword(id) {

    let newPass = prompt("Enter new password for " + id + ":");

    if (!newPass) return;

    const result = await apiRequest('update_password.php', {
        method: 'POST',
        body: { emp_id: id, password: newPass }
    });

    showMessage(result.message || 'Updated!', 'success');
}

// ---------------- DELETE ----------------
async function deleteEmployee(empId) {

    if (!confirm(`Delete ${empId}?`)) return;

    const result = await apiRequest('employees.php', {
        method: 'DELETE',
        body: { admin: 'admin123', emp_id: empId }
    });

    if (result.success) {
        showMessage('Deleted!', 'success');
        loadAllData();
    } else {
        showMessage('Delete failed!', 'error');
    }
}

// ---------------- FILTER ----------------
async function filterData() {
    const date = document.getElementById('filterDate')?.value;
    if (date) loadAllData(date);
    else showMessage("Select date!", "error");
}

// ---------------- SHOW ALL ----------------
async function showAllData() {
    let dateInput = document.getElementById('filterDate');
    if (dateInput) dateInput.value = '';
    loadAllData();
}

// ---------------- MESSAGE ----------------
function showMessage(message, type) {
    alert(`${type === 'success' ? '✅' : '❌'} ${message}`);
}

// ---------------- SAFE LOAD ----------------
document.addEventListener("DOMContentLoaded", () => {
    console.log("Admin panel loaded safely ✅");
});