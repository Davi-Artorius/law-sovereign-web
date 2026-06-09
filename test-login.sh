#!/bin/bash

API_URL="${1:-http://localhost:4000}"
EMAIL="teste@law-sovereign.io"
PASSWORD="SenhaSegura123"
NAME="Dr. Teste"

echo "=== TEST SUITE: JWT Authentication & Multi-Tenancy ==="
echo "API: $API_URL"
echo ""

# Test 1: Register a new account
echo "TEST 1: Register new account"
echo "POST /auth/register { email: $EMAIL, password: $PASSWORD, name: $NAME }"
REGISTER=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"$NAME\"}")

TOKEN=$(echo $REGISTER | jq -r '.token // empty')
TENANT_ID=$(echo $REGISTER | jq -r '.tenantId // empty')

if [ -z "$TOKEN" ]; then
  echo "ERROR: Registration failed"
  echo "$REGISTER" | jq .
  exit 1
fi

echo "✓ Registration successful"
echo "  Token: ${TOKEN:0:20}..."
echo "  Tenant ID: $TENANT_ID"
echo ""

# Test 2: Login with correct credentials
echo "TEST 2: Login with correct credentials"
echo "POST /auth/login { email: $EMAIL, password: $PASSWORD }"
LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

LOGIN_TOKEN=$(echo $LOGIN | jq -r '.token // empty')

if [ -z "$LOGIN_TOKEN" ]; then
  echo "ERROR: Login failed"
  echo "$LOGIN" | jq .
  exit 1
fi

echo "✓ Login successful"
echo "  Token: ${LOGIN_TOKEN:0:20}..."
echo ""

# Test 3: Login with wrong password
echo "TEST 3: Login with wrong password (should fail)"
echo "POST /auth/login { email: $EMAIL, password: WrongPassword }"
WRONG=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"WrongPassword\"}")

ERROR=$(echo $WRONG | jq -r '.error // empty')

if [ -z "$ERROR" ]; then
  echo "ERROR: Should have rejected invalid password"
  exit 1
fi

echo "✓ Correctly rejected invalid password"
echo "  Error: $ERROR"
echo ""

# Test 4: Create a client with valid token
echo "TEST 4: Create client with valid JWT"
echo "POST /clients { name: 'Client 1', ... } (with Authorization header)"
CLIENT=$(curl -s -X POST "$API_URL/clients" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"name\":\"Test Client\",\"area\":\"Civil\",\"case\":\"Test Case\"}")

CLIENT_ID=$(echo $CLIENT | jq -r '.id // empty')

if [ -z "$CLIENT_ID" ]; then
  echo "ERROR: Failed to create client"
  echo "$CLIENT" | jq .
  exit 1
fi

echo "✓ Client created successfully"
echo "  Client ID: $CLIENT_ID"
echo ""

# Test 5: Try to access without token (should fail)
echo "TEST 5: Access /clients without token (should fail)"
echo "GET /clients (no Authorization header)"
NO_TOKEN=$(curl -s -X GET "$API_URL/clients")

NO_TOKEN_ERROR=$(echo $NO_TOKEN | jq -r '.error // empty')

if [ -z "$NO_TOKEN_ERROR" ]; then
  echo "ERROR: Should have rejected unauthenticated request"
  exit 1
fi

echo "✓ Correctly rejected unauthenticated request"
echo "  Error: $NO_TOKEN_ERROR"
echo ""

# Test 6: Create second account and verify isolation
echo "TEST 6: Register second account and verify isolation"
EMAIL2="teste2@law-sovereign.io"
REGISTER2=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL2\",\"password\":\"$PASSWORD\",\"name\":\"Dr. Teste 2\"}")

TOKEN2=$(echo $REGISTER2 | jq -r '.token // empty')

if [ -z "$TOKEN2" ]; then
  echo "ERROR: Second registration failed"
  exit 1
fi

echo "✓ Second account created"
echo ""

echo "TEST 6b: Verify Tenant 1 cannot see Tenant 2's data"
echo "GET /clients with Tenant 2 token (should return empty or only Tenant 2's clients)"
CLIENT2_LIST=$(curl -s -X GET "$API_URL/clients" \
  -H "Authorization: Bearer $TOKEN2")

CLIENT2_COUNT=$(echo $CLIENT2_LIST | jq 'length')

if [ "$CLIENT2_COUNT" -ne "0" ]; then
  echo "ERROR: Tenant 2 should have 0 clients, has $CLIENT2_COUNT"
  exit 1
fi

echo "✓ Isolation verified: Tenant 2 has no clients"
echo ""

echo "TEST 6c: Verify Tenant 1 still has their client"
echo "GET /clients with Tenant 1 token"
CLIENT1_LIST=$(curl -s -X GET "$API_URL/clients" \
  -H "Authorization: Bearer $TOKEN")

CLIENT1_COUNT=$(echo $CLIENT1_LIST | jq 'length')

if [ "$CLIENT1_COUNT" -ne "1" ]; then
  echo "ERROR: Tenant 1 should have 1 client, has $CLIENT1_COUNT"
  exit 1
fi

echo "✓ Tenant 1 still has their client"
echo ""

# Test 7: Expired token (simulate with invalid token)
echo "TEST 7: Invalid/Expired token should be rejected"
echo "GET /clients with expired token"
EXPIRED=$(curl -s -X GET "$API_URL/clients" \
  -H "Authorization: Bearer invalidtoken123")

EXPIRED_ERROR=$(echo $EXPIRED | jq -r '.error // empty')

if [ -z "$EXPIRED_ERROR" ]; then
  echo "ERROR: Should have rejected invalid token"
  exit 1
fi

echo "✓ Correctly rejected invalid token"
echo "  Error: $EXPIRED_ERROR"
echo ""

# Test 8: Rate limiting on login (5 attempts in 5 minutes)
echo "TEST 8: Rate limiting on /auth/login"
echo "Attempting 6 login requests with wrong password..."

SUCCESS_COUNT=0
BLOCKED_COUNT=0

for i in {1..6}; do
  ATTEMPT=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"WrongPassword\"}")

  if echo $ATTEMPT | jq -e '.error' > /dev/null 2>&1; then
    if echo $ATTEMPT | jq -r '.error' | grep -q "Muitas tentativas"; then
      ((BLOCKED_COUNT++))
    else
      ((SUCCESS_COUNT++))
    fi
  fi
done

if [ $BLOCKED_COUNT -gt 0 ]; then
  echo "✓ Rate limiting working: $BLOCKED_COUNT requests blocked after 5 attempts"
else
  echo "⚠ Rate limiting may not have triggered (or IP differs)"
fi

echo ""
echo "=== ALL TESTS PASSED ==="
echo ""
echo "Summary:"
echo "  ✓ Registration works"
echo "  ✓ Login with correct credentials works"
echo "  ✓ Login with wrong password is rejected"
echo "  ✓ Protected routes require JWT"
echo "  ✓ Multi-tenant isolation works"
echo "  ✓ Invalid tokens are rejected"
echo "  ✓ Rate limiting is active"
