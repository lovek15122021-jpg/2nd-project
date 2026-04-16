<?php 
// JSON response ke liye clean output
error_reporting(0);
header('Content-Type: application/json');

require 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// Input validation helper
function getInput($key, $default = null) {
    global $input;
    return isset($input[$key]) ? trim($input[$key]) : $default;
}

// ------------------ GET ------------------
if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT emp_id, name FROM employees ORDER BY name");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        echo json_encode(['error' => 'Failed to fetch data']);
    }
    exit;
}

// ------------------ ADMIN AUTH ------------------
$admin = getInput('admin');

if ($admin !== 'admin123') {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized access']);
    exit;
}

// ------------------ POST (ADD EMPLOYEE) ------------------
if ($method === 'POST') {

    $emp_id = strtoupper(getInput('emp_id'));
    $name = getInput('name');
    $password = getInput('password', '1234');

    // Basic validation
    if (!$emp_id || !$name) {
        echo json_encode(['error' => 'emp_id and name required']);
        exit;
    }

    // Password hash (IMPORTANT)
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    try {
        $stmt = $pdo->prepare("INSERT INTO employees (emp_id, name, password) VALUES (?, ?, ?)");
        $stmt->execute([$emp_id, $name, $hashedPassword]);

        echo json_encode(['success' => true]);

    } catch (PDOException $e) {
        echo json_encode(['error' => 'Employee ID already exists']);
    }

    exit;
}

// ------------------ DELETE ------------------
if ($method === 'DELETE') {

    $emp_id = getInput('emp_id');

    if (!$emp_id) {
        echo json_encode(['error' => 'emp_id required']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM employees WHERE emp_id = ?");
        $stmt->execute([$emp_id]);

        echo json_encode(['success' => true]);

    } catch (PDOException $e) {
        echo json_encode(['error' => 'Delete failed']);
    }

    exit;
}

// ------------------ INVALID METHOD ------------------
http_response_code(405);
echo json_encode(['error' => 'Invalid request method']);
?>