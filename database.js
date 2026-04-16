// Database initialization
let attendanceDB = JSON.parse(localStorage.getItem('attendanceDB')) || {
    employees: {},
    records: []
};

// Admin password (change this in production)
const ADMIN_PASSWORD = 'admin123';

// Save to localStorage
function saveDB() {
    localStorage.setItem('attendanceDB', JSON.stringify(attendanceDB));
}

// Get employee data
function getEmployee(empId) {
    return attendanceDB.employees[empId] || null;
}

// Add new employee
function addEmployeeData(empId, name) {
    attendanceDB.employees[empId] = {
        name: name,
        password: '1234' // Default password
    };
    saveDB();
}

// Add attendance record
function addRecord(empId, loginTime, logoutTime = null, totalHours = 0) {
    const record = {
        empId: empId,
        empName: attendanceDB.employees[empId]?.name || 'Unknown',
        date: new Date().toISOString().split('T')[0],
        loginTime: loginTime,
        logoutTime: logoutTime,
        totalHours: totalHours
    };
    
    // Remove old record for same day if exists
    attendanceDB.records = attendanceDB.records.filter(r => 
        !(r.empId === empId && r.date === record.date)
    );
    
    attendanceDB.records.push(record);
    saveDB();
}

// Get today's record for employee
function getTodayRecord(empId) {
    const today = new Date().toISOString().split('T')[0];
    return attendanceDB.records.find(r => 
        r.empId === empId && r.date === today
    );
}

// Get all records
function getAllRecords(dateFilter = null) {
    let records = [...attendanceDB.records];
    
    if (dateFilter) {
        records = records.filter(r => r.date === dateFilter);
    }
    
    // Sort by date (newest first)
    return records.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Delete employee
function deleteEmployee(empId) {
    delete attendanceDB.employees[empId];
    attendanceDB.records = attendanceDB.records.filter(r => r.empId !== empId);
    saveDB();
}
// Add this to your database.js
function showTodayRecord() {
    const empId = document.getElementById('empId').value.trim().toUpperCase();
    if (!empId) {
        alert("Pehle Employee ID daalein!");
        return;
    }

    // Aapke code mein getTodayRecord function pehle se hai
    const record = getTodayRecord(empId);
    
    if (record) {
        alert(`Aaj ka Record:\nLogin: ${record.loginTime}\nLogout: ${record.logoutTime || 'Nahi hua'}\nHours: ${record.totalHours}`);
    } else {
        alert("Today no record!");
    }
}