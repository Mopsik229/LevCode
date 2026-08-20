// Замените эти значения на данные из вашего проекта Supabase (Settings -> API)
const SUPABASE_URL = 'https://vqyzzctjymrnymhwwtry.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeXp6Y3RqeW1ybnltaHd3dHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNjYxNDQsImV4cCI6MjEwMTk0MjE0NH0.ItuTXt1OIJSyIm5qLMzUmAxTJCsgwvubaZKx17-n2dE';

// Инициализация клиента Supabase
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
