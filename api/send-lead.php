<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Ответ на Preflight OPTIONS запрос
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Получаем входные данные
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Некорректные входные данные']);
    exit;
}

$name = trim($input['name'] ?? '');
$contact = trim($input['contact'] ?? '');
$type = trim($input['type'] ?? '');
$budget = trim($input['budget'] ?? '');
$description = trim($input['description'] ?? '');

if (empty($contact)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Контактная информация обязательна']);
    exit;
}

// Конфигурация Supabase
$supabaseUrl = 'https://vqyzzctjymrnymhwwtry.supabase.co/rest/v1/leads';
$supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeXp6Y3RqeW1ybnltaHd3dHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNjYxNDQsImV4cCI6MjEwMTk0MjE0NH0.ItuTXt1OIJSyIm5qLMzUmAxTJCsgwvubaZKx17-n2dE';

$leadData = [
    'name' => $name,
    'contact' => $contact,
    'type' => $type,
    'budget' => $budget,
    'description' => $description,
    'stage' => 'new',
    'notes' => []
];

// Отправка в Supabase через cURL с сервера
$ch = curl_init($supabaseUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([$leadData]));
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'apikey: ' . $supabaseKey,
    'Authorization: Bearer ' . $supabaseKey,
    'Prefer: return=representation'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($httpCode >= 200 && $httpCode < 300) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Ошибка при сохранении заявки в базу',
        'http_code' => $httpCode,
        'details' => $response,
        'curl_error' => $curlError
    ]);
}
