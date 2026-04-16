<?php
// Errors ko screen par aane se rokein
error_reporting(0); 
header('Content-Type: application/json');

// Aapki database connection file ko load karein
require 'config.php';

// Frontend (admin-script.js) 
$data = json_decode(file_get_contents('php://input'), true);

if (isset($data['emp_id']) && isset($data['password'])) {
    $emp_id = $data['emp_id'];
    $new_password = $data['password'];

    try {
        // Database mein password update karne ki query
        $stmt = $pdo->prepare("UPDATE employees SET password = ? WHERE emp_id = ?");
        $stmt->execute([$new_password, $emp_id]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Password successfully updated! ✅']);
        } else {
            echo json_encode(['success' => false, 'error' => 'Employee ID not found or same password.']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid data provided.']);
}
exit;
?>