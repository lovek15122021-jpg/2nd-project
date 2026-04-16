<?php
$host = 'localhost';
$username = 'root';
$password = '';
$dbname = 'attendance_system';

echo "Testing connection...<br>";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    echo "✅ Database Connected!";
} catch(Exception $e) {
    echo "❌ Error: " . $e->getMessage();
}
?>