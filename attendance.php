<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

date_default_timezone_set('Asia/Kolkata');
error_reporting(0);

// ---------------- DB CONNECTION ----------------
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "attendance_system";

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => "Database Connection Failed"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// ---------------- POST ----------------
if ($method === 'POST') {

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        echo json_encode(["success" => false, "error" => "No JSON input"]);
        exit;
    }

    $emp_id = strtoupper(trim($input['emp_id'] ?? ''));
    $pass   = trim($input['password'] ?? '');
    $action = $input['action'] ?? '';
    $type   = $input['type'] ?? 'manual';

    $today = date('Y-m-d');
    $now   = date('Y-m-d H:i:s');

    // ---------------- LOGIN ----------------
    if ($action === 'login') {

        $stmt = $pdo->prepare("SELECT name, password FROM employees WHERE emp_id = ?");
        $stmt->execute([$emp_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($pass, $user['password'])) {

            $check = $pdo->prepare("SELECT id FROM attendance WHERE emp_id = ? AND date = ? AND logout_time IS NULL");
            $check->execute([$emp_id, $today]);

            if ($check->rowCount() == 0) {

                $ins = $pdo->prepare("INSERT INTO attendance 
                (emp_id, emp_name, date, login_time, total_hours, manual_break_mins, auto_idle_mins) 
                VALUES (?, ?, ?, ?, '0.00', 0, 0)");

                $ins->execute([$emp_id, $user['name'], $today, $now]);

                echo json_encode(["success" => true, "message" => "Login Successful"]);

            } else {
                echo json_encode(["success" => true, "message" => "Already Logged In"]);
            }

        } else {
            echo json_encode(["success" => false, "error" => "Invalid ID or Password"]);
        }
    }

    // ---------------- START BREAK ----------------
    elseif ($action === 'start_break') {

        // 🔥 prevent duplicate start
        $check = $pdo->prepare("SELECT break_start FROM attendance 
            WHERE emp_id = ? AND date = ? AND logout_time IS NULL");
        $check->execute([$emp_id, $today]);
        $row = $check->fetch(PDO::FETCH_ASSOC);

        if ($row && $row['break_start'] != NULL) {
            echo json_encode(["success" => true, "message" => "Already in break"]);
            exit;
        }

        $upd = $pdo->prepare("UPDATE attendance 
            SET break_start = ? 
            WHERE emp_id = ? AND date = ? AND logout_time IS NULL");

        $upd->execute([$now, $emp_id, $today]);

        echo json_encode(["success" => true, "message" => "Break Started"]);
    }

    // ---------------- END BREAK ----------------
    elseif ($action === 'end_break') {

        $column = ($type === 'auto') ? 'auto_idle_mins' : 'manual_break_mins';

        $upd = $pdo->prepare("UPDATE attendance SET 
            $column = $column + TIMESTAMPDIFF(MINUTE, break_start, ?),
            break_start = NULL,
            break_end = ?
            WHERE emp_id = ? AND date = ? AND logout_time IS NULL AND break_start IS NOT NULL");

        $upd->execute([$now, $now, $emp_id, $today]);

        echo json_encode([
            "success" => true,
            "message" => ($type === 'auto') ? "Idle Added" : "Break Ended"
        ]);
    }

    // ---------------- LOGOUT ----------------
    elseif ($action === 'logout') {

        $upd = $pdo->prepare("UPDATE attendance SET 
            logout_time = ?, 
            total_hours = ROUND(
                (TIMESTAMPDIFF(MINUTE, login_time, ?) - (manual_break_mins + auto_idle_mins)) / 60, 
            2)
            WHERE emp_id = ? AND date = ? AND logout_time IS NULL");

        $upd->execute([$now, $now, $emp_id, $today]);

        echo json_encode(["success" => true, "message" => "Logout Successful"]);
    }

    else {
        echo json_encode(["success" => false, "error" => "Invalid action"]);
    }

    exit;
}

// ---------------- GET ----------------
if ($method === 'GET') {
    try {
        if (ob_get_length()) ob_clean();

        $stmt = $pdo->query("SELECT * FROM attendance ORDER BY login_time DESC");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($data ? $data : []);

    } catch (Exception $e) {
        echo json_encode(["error" => "Fetch failed"]);
    }
    exit;
}

echo json_encode(["error" => "Invalid request method"]);
?>