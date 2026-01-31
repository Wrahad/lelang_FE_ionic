#!/bin/bash

# ==========================================
# IONIC TTI BENCHMARK - LOGCAT METHOD v2
# ==========================================
# Mengukur Real TTI dari native Android timestamp
# Lebih akurat karena mengukur dari onCreate() sampai UI ready
# ==========================================

set -euo pipefail

# --- KONFIGURASI ---
PACKAGE_NAME="io.ionic.starter"
APP_ACTIVITY=".MainActivity"
OUTPUT_FILE="tti_benchmark_logcat_results.csv"
ITERATIONS=10
COOLDOWN_SEC=10
TIMEOUT_SEC=15

# Warna terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# --- FUNCTIONS ---
print_header() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  ${BOLD}IONIC TTI BENCHMARK (LOGCAT v2)${NC}                 ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  Package: ${PACKAGE_NAME}                    ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  Iterations: ${ITERATIONS}                                     ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
}

check_device() {
    if ! adb get-state 1>/dev/null 2>&1; then
        echo -e "${RED}❌ Error: No Android device connected${NC}"
        echo "   Please connect your device and enable USB debugging"
        exit 1
    fi
    
    DEVICE_MODEL=$(adb shell getprop ro.product.model | tr -d '\r')
    ANDROID_VERSION=$(adb shell getprop ro.build.version.release | tr -d '\r')
    echo -e "${GREEN}✓ Device: ${DEVICE_MODEL} (Android ${ANDROID_VERSION})${NC}"
}

# Fungsi untuk parse timestamp dari logcat format: 12-21 13:58:55.760
parse_timestamp_ms() {
    local logline="$1"
    # Extract: HH:MM:SS.mmm dari logcat
    local time_part=$(echo "$logline" | awk '{print $2}')
    
    # Parse hours, minutes, seconds, milliseconds
    local hours=$(echo "$time_part" | cut -d: -f1)
    local mins=$(echo "$time_part" | cut -d: -f2)
    local secs_ms=$(echo "$time_part" | cut -d: -f3)
    local secs=$(echo "$secs_ms" | cut -d. -f1)
    local ms=$(echo "$secs_ms" | cut -d. -f2)
    
    # Remove leading zeros
    hours=$((10#$hours))
    mins=$((10#$mins))
    secs=$((10#$secs))
    ms=$((10#$ms))
    
    # Convert to milliseconds
    echo $(( (hours * 3600000) + (mins * 60000) + (secs * 1000) + ms ))
}

# --- MAIN ---
print_header
check_device

# Inisialisasi output file
echo "iteration,tti_ms,status" > "$OUTPUT_FILE"
echo ""

declare -a TTI_RESULTS=()
SUCCESS_COUNT=0

for i in $(seq 1 $ITERATIONS); do
    echo -e "${YELLOW}━━━ Iteration $i/$ITERATIONS ━━━${NC}"
    # 1. Force stop app (sama dengan Flutter)
    adb shell am force-stop "$PACKAGE_NAME" 2>/dev/null
    # 2. Clear logcat buffer (diperlukan untuk method logcat)
    adb logcat -c
    # 3. Cooldown - SAMA dengan Flutter (10 detik)
    echo "   ⏳ Cooldown ${COOLDOWN_SEC}s for Cold Start..."
    sleep "$COOLDOWN_SEC"
    # 4. Launch app
    echo "   🚀 Launching app..."
    adb shell am start -n "$PACKAGE_NAME/$APP_ACTIVITY" >/dev/null 2>&1
    # 5. Wait for TTI marker dengan timeout
    echo "   ⏱️  Waiting for TTI marker..."
    TTI=""
    ELAPSED=0
    while [[ $ELAPSED -lt $TIMEOUT_SEC ]]; do
        # Ambil log dengan grep untuk tag IonicTTI
        LOGCAT_OUTPUT=$(adb logcat -d 2>/dev/null | grep "IonicTTI" || true)
        # Cari BENCHMARK_TTI_DURATION yang sudah dihitung di native
        TTI_LINE=$(echo "$LOGCAT_OUTPUT" | grep "BENCHMARK_TTI_DURATION:" | tail -1 || true)
        if [[ -n "$TTI_LINE" ]]; then
            # Extract TTI value: "BENCHMARK_TTI_DURATION:1234" -> 1234
            TTI=$(echo "$TTI_LINE" | grep -oE "BENCHMARK_TTI_DURATION:[0-9]+" | cut -d: -f2)
            if [[ -n "$TTI" ]]; then
                break
            fi
        fi
        sleep 0.5
        ELAPSED=$((ELAPSED + 1))
    done
    # 6. Record TTI
    if [[ -n "$TTI" && "$TTI" =~ ^[0-9]+$ ]]; then
        # Sanity check (TTI should be positive and reasonable)
        if [[ $TTI -gt 0 && $TTI -lt 30000 ]]; then
            echo -e "   ${GREEN}✓ Native TTI: ${BOLD}${TTI}ms${NC}"
            echo "$i,$TTI,success" >> "$OUTPUT_FILE"
            TTI_RESULTS+=("$TTI")
            ((SUCCESS_COUNT++))
        else
            echo -e "   ${RED}✗ Invalid TTI value: ${TTI}ms${NC}"
            echo "$i,$TTI,invalid" >> "$OUTPUT_FILE"
        fi
    else
        echo -e "   ${RED}✗ Timeout - TTI marker not found${NC}"
        echo "$i,0,timeout" >> "$OUTPUT_FILE"
    fi
    # Tahan 3 detik agar UI login terlihat sebelum close
    echo "   👁️  Viewing UI for 3s..."
    sleep 3
done

# --- STATISTIK ---
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${BOLD}RESULTS${NC}                                           ${CYAN}║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════╝${NC}"

if [[ $SUCCESS_COUNT -gt 0 ]]; then
    # Calculate statistics
    SUM=0
    MIN=${TTI_RESULTS[0]}
    MAX=${TTI_RESULTS[0]}
    
    for val in "${TTI_RESULTS[@]}"; do
        SUM=$((SUM + val))
        if [[ $val -lt $MIN ]]; then MIN=$val; fi
        if [[ $val -gt $MAX ]]; then MAX=$val; fi
    done
    
    AVG=$((SUM / SUCCESS_COUNT))
    
    echo ""
    echo -e "   📊 ${BOLD}Statistics (${SUCCESS_COUNT}/${ITERATIONS} successful):${NC}"
    echo -e "   ├─ Min TTI:  ${GREEN}${MIN}ms${NC}"
    echo -e "   ├─ Max TTI:  ${RED}${MAX}ms${NC}"
    echo -e "   ├─ Avg TTI:  ${CYAN}${BOLD}${AVG}ms${NC}"
    echo -e "   └─ Range:    $((MAX - MIN))ms"
    echo ""
    echo -e "   📁 Results saved to: ${OUTPUT_FILE}"
    
    # Show all values
    echo ""
    echo -e "   📈 All TTI values: ${TTI_RESULTS[*]}"
else
    echo -e "   ${RED}No successful measurements!${NC}"
    echo "   Check if the app is properly installed and markers are working."
fi

echo ""
echo -e "${GREEN}✅ Benchmark complete!${NC}"
echo ""
