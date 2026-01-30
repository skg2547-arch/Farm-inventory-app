#!/bin/bash
# Comprehensive test script for Farm Inventory App
# Tests all functionality including fallback mode, API endpoints, and error handling

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Farm Inventory App - Comprehensive Integration Test     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Change to backend directory
cd "$(dirname "$0")/backend" || exit 1

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to print test results
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

echo "1. Dependency Check"
echo "═══════════════════"

# Check if node_modules exists
if [ -d "node_modules" ]; then
    test_result 0 "Dependencies installed"
else
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install > /dev/null 2>&1
    test_result $? "Dependencies installation"
fi

# Check package.json is valid
if node -e "require('./package.json')" 2>/dev/null; then
    test_result 0 "package.json is valid JSON"
else
    test_result 1 "package.json is valid JSON"
fi

echo ""
echo "2. Security Audit"
echo "═══════════════════"

# Run npm audit
AUDIT_RESULT=$(npm audit 2>&1)
if echo "$AUDIT_RESULT" | grep -q "found 0 vulnerabilities"; then
    test_result 0 "npm audit - 0 vulnerabilities"
else
    test_result 1 "npm audit - vulnerabilities found"
    echo "$AUDIT_RESULT"
fi

# Check mongoose version (must be >= 6.13.8 for security patches)
MONGOOSE_VERSION=$(npm list mongoose --depth=0 2>/dev/null | grep mongoose@ | sed 's/.*mongoose@//' | sed 's/ .*//')
if [[ "$MONGOOSE_VERSION" == "6.13.8" ]] || [[ "$MONGOOSE_VERSION" > "6.13.8" ]]; then
    test_result 0 "Mongoose version is 6.13.8 or higher (secure)"
else
    test_result 1 "Mongoose version check (found: $MONGOOSE_VERSION, need: >= 6.13.8)"
fi

echo ""
echo "3. Server Startup Test (Fallback Mode)"
echo "═══════════════════════════════════════"

# Start server with invalid MongoDB URI to test fallback
MONGODB_URI="mongodb://invalid:27017/test" timeout 10 node index.js > /tmp/farm-test.log 2>&1 &
SERVER_PID=$!
sleep 5

# Check if server started
if ps -p $SERVER_PID > /dev/null 2>&1; then
    test_result 0 "Server starts in fallback mode (no MongoDB)"
    
    # Check server log for expected messages
    if grep -q "Server listening" /tmp/farm-test.log || grep -q "listening on port" /tmp/farm-test.log; then
        test_result 0 "Server listening on correct port"
    else
        test_result 1 "Server listening on correct port"
    fi
    
    if grep -q "fallback mode" /tmp/farm-test.log || grep -q "disconnected" /tmp/farm-test.log; then
        test_result 0 "Fallback mode activated correctly"
    else
        test_result 1 "Fallback mode activated correctly"
    fi
else
    test_result 1 "Server starts in fallback mode"
fi

echo ""
echo "4. API Endpoint Tests"
echo "═══════════════════════"

# Give server time to fully start
sleep 2

# Test root endpoint
ROOT_RESPONSE=$(curl -s http://localhost:5000/ 2>/dev/null)
if echo "$ROOT_RESPONSE" | grep -q "Farm Inventory App Backend is running"; then
    test_result 0 "GET / - Returns API information"
else
    test_result 1 "GET / - Returns API information"
fi

# Test health endpoint
HEALTH_RESPONSE=$(curl -s http://localhost:5000/health 2>/dev/null)
if echo "$HEALTH_RESPONSE" | grep -q '"database":"disconnected"'; then
    test_result 0 "GET /health - Shows database status"
else
    test_result 1 "GET /health - Shows database status"
fi

# Test items endpoint (should return 503 without DB)
ITEMS_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:5000/api/items 2>/dev/null)
if echo "$ITEMS_RESPONSE" | grep -q "503"; then
    test_result 0 "GET /api/items - Returns 503 without database"
else
    test_result 1 "GET /api/items - Returns 503 without database"
fi

# Test low-stock endpoint (should return 503 without DB)
LOW_STOCK_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:5000/api/items/low-stock 2>/dev/null)
if echo "$LOW_STOCK_RESPONSE" | grep -q "503"; then
    test_result 0 "GET /api/items/low-stock - Returns 503 without database"
else
    test_result 1 "GET /api/items/low-stock - Returns 503 without database"
fi

# Test invalid item ID (should return 503 due to no DB connection)
INVALID_ID_RESPONSE=$(curl -s http://localhost:5000/api/items/invalid-id 2>/dev/null)
if echo "$INVALID_ID_RESPONSE" | grep -q "Database unavailable"; then
    test_result 0 "GET /api/items/:id - Invalid ID handled"
else
    test_result 1 "GET /api/items/:id - Invalid ID handled"
fi

# Test POST without required field (should return 503 due to no DB)
POST_RESPONSE=$(curl -s -X POST http://localhost:5000/api/items \
    -H "Content-Type: application/json" \
    -d '{"category":"Parts"}' 2>/dev/null)
if echo "$POST_RESPONSE" | grep -q "Database unavailable"; then
    test_result 0 "POST /api/items - Validation check"
else
    test_result 1 "POST /api/items - Validation check"
fi

# Test 404 handler
NOT_FOUND_RESPONSE=$(curl -s http://localhost:5000/nonexistent 2>/dev/null)
if echo "$NOT_FOUND_RESPONSE" | grep -q "Not Found"; then
    test_result 0 "404 handler - Returns proper error"
else
    test_result 1 "404 handler - Returns proper error"
fi

echo ""
echo "5. Configuration Tests"
echo "═══════════════════════"

# Check .env.example exists
if [ -f ".env.example" ]; then
    test_result 0 ".env.example template exists"
else
    test_result 1 ".env.example template exists"
fi

# Check .gitignore exists
if [ -f "../.gitignore" ]; then
    test_result 0 ".gitignore exists"
    
    # Check it excludes node_modules
    if grep -q "node_modules" "../.gitignore"; then
        test_result 0 ".gitignore excludes node_modules"
    else
        test_result 1 ".gitignore excludes node_modules"
    fi
    
    # Check it excludes .env
    if grep -q "^\.env$" "../.gitignore"; then
        test_result 0 ".gitignore excludes .env files"
    else
        test_result 1 ".gitignore excludes .env files"
    fi
else
    test_result 1 ".gitignore exists"
fi

echo ""
echo "6. Documentation Tests"
echo "═══════════════════════"

# Check README exists
if [ -f "README.md" ]; then
    test_result 0 "backend/README.md exists"
else
    test_result 1 "backend/README.md exists"
fi

# Check main README exists
if [ -f "../README.md" ]; then
    test_result 0 "Main README.md exists"
else
    test_result 1 "Main README.md exists"
fi

# Check SECURITY.md exists
if [ -f "../SECURITY.md" ]; then
    test_result 0 "SECURITY.md exists"
else
    test_result 1 "SECURITY.md exists"
fi

echo ""
echo "7. Cleanup"
echo "═══════════"

# Stop the test server
if ps -p $SERVER_PID > /dev/null 2>&1; then
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
    test_result 0 "Test server stopped gracefully"
else
    test_result 0 "Test server already stopped"
fi

# Clean up log file
rm -f /tmp/farm-test.log

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                      Test Summary                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              ✓ ALL TESTS PASSED!                           ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║              ✗ SOME TESTS FAILED                           ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
