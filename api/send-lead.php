<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Некорректные входные данные']);
    exit;
}

if (!empty($input['website'])) {
    echo json_encode(['success' => true]);
    exit;
}

$name = isset($input['name']) ? trim($input['name']) : '';
$contact = isset($input['contact']) ? trim($input['contact']) : '';
$type = isset($input['type']) ? trim($input['type']) : '';
$budget = isset($input['budget']) ? trim($input['budget']) : '';
$description = isset($input['description']) ? trim($input['description']) : '';

if (empty($contact)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Контактная информация обязательна']);
    exit;
}

$envUrl = getenv('SUPABASE_URL');
$supabaseUrl = $envUrl ? $envUrl : 'https://vqyzzctjymrnymhwwtry.supabase.co/rest/v1/leads';

$envKey = getenv('SUPABASE_KEY');
$supabaseKey = $envKey ? $envKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeXp6Y3RqeW1ybnltaHd3dHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNjYxNDQsImV4cCI6MjEwMTk0MjE0NH0.ItuTXt1OIJSyIm5qLMzUmAxTJCsgwvubaZKx17-n2dE';

$leadData = [
    'name' => $name,
    'contact' => $contact,
    'type' => $type,
    'budget' => $budget,
    'description' => $description,
    'stage' => 'new',
    'notes' => []
];

$ch = curl_init($supabaseUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([$leadData]));
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'apikey: ' . $supabaseKey,
    'Authorization: Bearer ' . $supabaseKey,
    'Prefer: return=minimal'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($httpCode >= 200 && $httpCode < 300) {
    echo json_encode(['success' => true]);
} else {
    error_log("Supabase lead error [HTTP $httpCode]: $curlError | $response");
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Ошибка при сохранении заявки. Пожалуйста, свяжитесь с нами напрямую.'
    ]);
}
