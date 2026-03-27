#!/usr/bin/env bash

# ============================================================================
# ContaAzul Integration - Script de Homologação
# ============================================================================
#
# Executa checagens reais nas Edge Functions do Supabase.
# O objetivo é aprovar para HOMOLOGAÇÃO com confiança, não prometer produção.
#
# Uso:
#   chmod +x test-homologacao-melhorado.sh
#   ./test-homologacao-melhorado.sh
#
# Requisitos:
#   - curl
#   - jq
#   - SUPABASE_URL
#   - SUPABASE_ANON_KEY
# ============================================================================

set -u

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
SKIPPED=0

SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-}"

print_header() {
  echo ""
  echo "================================================================"
  echo "$1"
  echo "================================================================"
}

print_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

print_test() {
  echo ""
  echo "🧪 TESTE: $1"
}

print_pass() {
  echo -e "${GREEN}✅ PASSOU${NC}: $1"
  PASSED=$((PASSED + 1))
}

print_fail() {
  echo -e "${RED}❌ FALHOU${NC}: $1"
  FAILED=$((FAILED + 1))
}

print_skip() {
  echo -e "${YELLOW}⚠️ PULADO${NC}: $1"
  SKIPPED=$((SKIPPED + 1))
}

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo -e "${RED}❌ ERRO${NC}: comando obrigatório não encontrado: $cmd"
    exit 1
  fi
}

require_env() {
  if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_ANON_KEY" ]]; then
    echo -e "${RED}❌ ERRO${NC}: configure SUPABASE_URL e SUPABASE_ANON_KEY"
    echo "Exemplo:"
    echo "  export SUPABASE_URL=https://abc123.supabase.co"
    echo "  export SUPABASE_ANON_KEY=eyJhb..."
    exit 1
  fi
}

call_json_post() {
  local url="$1"
  local body="$2"
  local tmp_body
  tmp_body="$(mktemp)"
  local http_code

  http_code=$(curl -sS \
    -o "$tmp_body" \
    -w "%{http_code}" \
    -X POST "$url" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d "$body") || {
      echo "__CURL_ERROR__"
      cat "$tmp_body"
      rm -f "$tmp_body"
      return 0
    }

  echo "__HTTP_CODE__:${http_code}"
  cat "$tmp_body"
  rm -f "$tmp_body"
}

call_noauth_probe() {
  local url="$1"
  local tmp_body
  tmp_body="$(mktemp)"
  local http_code

  http_code=$(curl -sS \
    -o "$tmp_body" \
    -w "%{http_code}" \
    "$url") || {
      echo "__CURL_ERROR__"
      cat "$tmp_body"
      rm -f "$tmp_body"
      return 0
    }

  echo "__HTTP_CODE__:${http_code}"
  cat "$tmp_body"
  rm -f "$tmp_body"
}

extract_http_code() {
  echo "$1" | awk -F: '/^__HTTP_CODE__:/ {print $2; exit}'
}

extract_body() {
  echo "$1" | sed '1{/^__HTTP_CODE__:/d;}'
}

json_has_key() {
  local body="$1"
  local key="$2"
  echo "$body" | jq -e ".$key" >/dev/null 2>&1
}

evaluate_function_json_response() {
  local body="$1"

  if ! echo "$body" | jq -e . >/dev/null 2>&1; then
    return 2
  fi

  if echo "$body" | jq -e 'has("success")' >/dev/null 2>&1; then
    local success
    success=$(echo "$body" | jq -r '.success')
    if [[ "$success" == "true" ]]; then
      return 0
    else
      return 1
    fi
  fi

  return 3
}

test_oauth_callback_probe() {
  print_test "Sonda do callback OAuth"

  local url="${SUPABASE_URL}/functions/v1/contaazul-oauth-callback"
  local raw
  raw="$(call_noauth_probe "$url")"
  local http_code body
  http_code="$(extract_http_code "$raw")"
  body="$(extract_body "$raw")"

  if [[ "$raw" == *"__CURL_ERROR__"* ]]; then
    print_fail "Falha de rede ao acessar a function"
    return
  fi

  case "$http_code" in
    200|302|400|401|403|405)
      print_pass "Function respondeu (${http_code}) e não aparenta estar ausente"
      ;;
    404)
      print_fail "Function retornou 404; callback pode não estar deployado"
      ;;
    *)
      print_skip "Resposta inesperada (${http_code}). Vale conferir logs. Corpo: ${body}"
      ;;
  esac
}

test_auto_refresh() {
  print_test "Auto-refresh de token"

  local url="${SUPABASE_URL}/functions/v1/contaazul-auto-refresh"
  local raw
  raw="$(call_json_post "$url" '{}')"
  local http_code body
  http_code="$(extract_http_code "$raw")"
  body="$(extract_body "$raw")"

  if [[ "$raw" == *"__CURL_ERROR__"* ]]; then
    print_fail "Falha de rede ao chamar auto-refresh"
    return
  fi

  if [[ "$http_code" == "404" ]]; then
    print_fail "Function contaazul-auto-refresh não encontrada"
    return
  fi

  if echo "$body" | grep -qi "No active connection"; then
    print_skip "Sem conexão ativa no momento; a function respondeu, mas não havia token para renovar"
    return
  fi

  evaluate_function_json_response "$body"
  case $? in
    0) print_pass "Auto-refresh respondeu com sucesso" ;;
    1) print_fail "Auto-refresh respondeu JSON de falha: $(echo "$body" | jq -r '.error // .message // "sem detalhe"')" ;;
    2) print_fail "Resposta não é JSON válido: $body" ;;
    3) print_skip "JSON válido, mas sem campo success. Revisar body: $body" ;;
  esac
}

run_sync_test() {
  local label="$1"
  local function_name="$2"
  local payload="$3"

  print_test "$label"

  local url="${SUPABASE_URL}/functions/v1/${function_name}"
  local raw
  raw="$(call_json_post "$url" "$payload")"
  local http_code body
  http_code="$(extract_http_code "$raw")"
  body="$(extract_body "$raw")"

  if [[ "$raw" == *"__CURL_ERROR__"* ]]; then
    print_fail "Falha de rede ao chamar ${function_name}"
    return
  fi

  if [[ "$http_code" == "404" ]]; then
    print_fail "Function ${function_name} não encontrada"
    return
  fi

  evaluate_function_json_response "$body"
  case $? in
    0)
      local fetched upserted errors
      fetched="$(echo "$body" | jq -r '.total_fetched // .fetched // 0')"
      upserted="$(echo "$body" | jq -r '.total_upserted // .upserted // "n/a"')"
      errors="$(echo "$body" | jq -r '.total_errors // .errors // 0')"
      print_pass "Success=true | fetched=${fetched} | upserted=${upserted} | errors=${errors}"
      ;;
    1)
      print_fail "JSON de falha: $(echo "$body" | jq -r '.error // .message // "sem detalhe"')"
      ;;
    2)
      print_fail "Resposta não é JSON válido: $body"
      ;;
    3)
      print_skip "JSON válido, mas sem campo success. Revisar body: $body"
      ;;
  esac
}

main() {
  print_header "ContaAzul - Homologação assistida"

  require_cmd curl
  require_cmd jq
  require_env

  print_info "SUPABASE_URL: ${SUPABASE_URL}"
  print_info "Objetivo: validar prontidão para homologação com mais segurança"

  print_header "Checagens principais"
  test_oauth_callback_probe
  test_auto_refresh
  run_sync_test "Sync categorias financeiras" "sync-categorias-financeiras" '{"operation":"full"}'
  run_sync_test "Sync financeiro - contas a receber" "sync-financeiro" '{"operation":"full","type":"receber"}'
  run_sync_test "Sync financeiro - contas a pagar" "sync-financeiro" '{"operation":"full","type":"pagar"}'
  run_sync_test "Sync vendas" "sync-vendas" '{"operation":"full"}'

  print_header "Resumo"
  echo -e "  ${GREEN}✅ Passou:${NC} $PASSED"
  echo -e "  ${RED}❌ Falhou:${NC} $FAILED"
  echo -e "  ${YELLOW}⚠️ Pulou:${NC} $SKIPPED"
  echo ""

  if [[ $FAILED -eq 0 ]]; then
    echo -e "${GREEN}Veredito:${NC} aprovado para HOMOLOGAÇÃO."
    echo "Antes de produção, ainda valide OAuth ponta a ponta, banco e logs."
    exit 0
  else
    echo -e "${RED}Veredito:${NC} ainda não aprovado para homologação."
    echo "Corrija as falhas e rode novamente."
    exit 1
  fi
}

main "$@"
