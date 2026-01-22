// Configuração do Supabase
// IMPORTANTE: Substitua estas variáveis pelas suas credenciais do Supabase

// Evitar redeclaração se o script já foi carregado
if (typeof window.supabaseClient === 'undefined') {
  const SUPABASE_URL = "https://bmvczddyxvqvapauukrd.supabase.co"; // Substitua pela URL do seu projeto
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdmN6ZGR5eHZxdmFwYXV1a3JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MzI4NDYsImV4cCI6MjA4NDUwODg0Nn0.5pnJBeooMH8ryDJIcW7N2FCnvVGScz_skdIdJdSjbyY"; // Substitua pela chave anônima do seu projeto

  // Verificar se o Supabase está configurado
  if (!SUPABASE_URL || SUPABASE_URL.includes("seu-projeto") || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes("sua-chave")) {
    console.warn("⚠️ Supabase não configurado! Configure SUPABASE_URL e SUPABASE_ANON_KEY em supabase-config.js");
  }

  // Inicializar cliente Supabase apenas se ainda não foi inicializado
  if (typeof window.supabase !== 'undefined') {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else {
    console.error("❌ Biblioteca Supabase não carregada! Verifique se o script @supabase/supabase-js está carregado antes de supabase-config.js");
  }
}
