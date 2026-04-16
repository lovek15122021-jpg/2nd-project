<?php
// Errors 
error_reporting(0); 
header('Content-Type: application/json');

// Database connection load karein
require 'config.php';

// Frontend se aaya hua data read karein
$input = json_decode(file_get_contents('php://input'), true);

if (isset($input['password'])) {
    $adminPassword = $input['password'];

    // Sahi password check karein
    if ($adminPassword === 'admin123') {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Wrong Password!']);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'No password provided']);
}
exit;
?>