#!/bin/bash

# Enhanced Ionic Performance Test - V4 (Matches Flutter Logic)
set -u # Exit on undefined var only

# Configuration
PACKAGE_NAME="io.ionic.starter"
BASE_LOG_FILE="ionic_perf_test_$(date +%Y%m%d_%H%M%S)"
ITERATIONS=10
MONITOR_DURATION=8   # Disamakan dengan Flutter V4
SAMPLING_RATE=0.25   # Disamakan dengan Flutter V4 (4x per detik)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}⚡ IONIC PERFORMANCE TEST (V4 - STABLE)${NC}"
echo -e "${GREEN}Package: $PACKAGE_NAME${NC}"

# Check tools
if ! command -v ionic &> /dev/null; then echo -e "${RED}❌ ionic not found${NC}"; exit 1; fi
if ! command -v adb &> /dev/null; then echo -e "${RED}❌ adb not found${NC}"; exit 1; fi

# --- HELPER FUNCTIONS ---
get_cpu_usage_by_pid() {
    local pid=$1
    # Ambil kolom 9 (CPU) dari top berdasarkan PID
    local cpu_val=$(adb shell top -b -n 1 -p "$pid" | grep "$pid" | awk '{print $9}' | head -1)
    if [[ -z "$cpu_val" ]]; then echo "0"; else echo "$cpu_val"; fi
}

get_memory_usage() {
    local package=$1
    local memory_info=$(adb shell dumpsys meminfo "$package" | grep -E "TOTAL|TOTAL:" | head -1 | awk '{print $2}' 2>/dev/null || echo "0")
    echo "$memory_info"
}

# Build (Optional - Uncomment jika butuh build ulang)
# echo -e "${YELLOW}Building & Installing...${NC}"
# ionic build --prod
# npx cap sync android
# cd android && ./gradlew assembleDebug && cd ..
# adb install -r android/app/build/outputs/apk/debug/app-debug.apk

declare -a TTI_RESULTS
declare -a CPU_PEAK_RESULTS
declare -a MEMORY_PEAK_RESULTS

for i in $(seq 1 $ITERATIONS); do
    echo ""
    echo -e "${YELLOW}🔄 Iteration $i/$ITERATIONS${NC}"
    
    LOG_FILE="${BASE_LOG_FILE}_iter${i}.log"
    CPU_MEM_LOG_FILE="${BASE_LOG_FILE}_cpu_mem_iter${i}.csv"
    echo "timestamp,cpu_percent,memory_kb" > "$CPU_MEM_LOG_FILE"
    
    # 1. Kill & Clear (Kasih waktu napas 3 detik - Sama dengan Flutter)
    adb shell am force-stop "$PACKAGE_NAME"
    sleep 3
    adb logcat -c

    # 2. Start Logcat Background
    adb logcat -v time | grep --line-buffered "IONIC_PERFORMANCE" > "$LOG_FILE" &
    LOGCAT_PID=$!

    # 3. Launch App
    echo -e "${GREEN}   Starting app...${NC}"
    adb shell am start -n "$PACKAGE_NAME/.MainActivity" > /dev/null 2>&1

    # 4. Wait for PID (Max 5 detik - Sama dengan Flutter)
    TARGET_PID=""
    echo -ne "   🔍 Finding PID... "
    for attempt in {1..25}; do 
        TARGET_PID=$(adb shell pidof "$PACKAGE_NAME" 2>/dev/null | tr ' ' '\n' | head -1)
        if [[ -n "$TARGET_PID" ]]; then
            echo -e "${GREEN}Found: $TARGET_PID${NC}"
            break
        fi
        sleep 0.2
    done

    if [[ -z "$TARGET_PID" ]]; then
        echo -e "${RED}❌ PID Not Found! Skip monitoring.${NC}"
    else
        # 5. Monitoring Loop (Background)
        (
            end_time=$(($(date +%s) + MONITOR_DURATION))
            while [ $(date +%s) -lt $end_time ]; do
                timestamp=$(date +%s%3N)
                
                # Ambil metrics pakai PID (Lebih Akurat)
                cpu=$(get_cpu_usage_by_pid "$TARGET_PID")
                mem=$(get_memory_usage "$PACKAGE_NAME")
                
                cpu=${cpu:-0}
                mem=${mem:-0}

                echo "$timestamp,$cpu,$mem" >> "$CPU_MEM_LOG_FILE"
                
                # High Speed Sampling (0.25s)
                sleep $SAMPLING_RATE
            done
        ) &
        MONITOR_PID=$!
        
        echo -e "   ⏳ Monitoring for ${MONITOR_DURATION}s..."
        wait $MONITOR_PID
    fi

    # 6. Cleanup
    kill $LOGCAT_PID 2>/dev/null || true

    # 7. Calculate Results
    # TTI Parsing (Logika khusus log Ionic)
    START_LINE=$(grep "APP_CONSTRUCTOR_START" "$LOG_FILE" 2>/dev/null | head -1)
    TTI_LINE=$(grep "TTI_COMPLETE" "$LOG_FILE" 2>/dev/null | head -1)

    if [[ -n "$START_LINE" ]] && [[ -n "$TTI_LINE" ]]; then
        # Ambil angka timestamp terakhir di baris log
        START_TIME=$(echo "$START_LINE" | grep -o '[0-9]*$' | head -1)
        TTI_TIME=$(echo "$TTI_LINE" | grep -o '[0-9]*$' | head -1)
        
        if [[ -n "$START_TIME" ]] && [[ -n "$TTI_TIME" ]]; then
            TTI=$((TTI_TIME - START_TIME))
            echo -e "   🎯 TTI: ${TTI}ms"
            TTI_RESULTS+=($TTI)
        fi
    fi

    # Resource Stats from CSV
    if [ -f "$CPU_MEM_LOG_FILE" ]; then
        CPU_PEAK=$(tail -n +2 "$CPU_MEM_LOG_FILE" | cut -d',' -f2 | sort -nr | head -1)
        MEM_PEAK=$(tail -n +2 "$CPU_MEM_LOG_FILE" | cut -d',' -f3 | sort -nr | head -1)
        
        CPU_PEAK=${CPU_PEAK:-0}
        MEM_PEAK=${MEM_PEAK:-0}

        echo -e "   ⚡ CPU Peak: ${CPU_PEAK}%"
        echo -e "   💾 Mem Peak: ${MEM_PEAK} KB"
        
        CPU_PEAK_RESULTS+=($CPU_PEAK)
        MEMORY_PEAK_RESULTS+=($MEM_PEAK)
    fi
done

# --- FINAL STATISTICS (Python logic agar sama dengan Flutter) ---
calc_stats() {
    local arr=("$@")
    if [ ${#arr[@]} -eq 0 ]; then echo "No data"; return; fi
    local min=${arr[0]}
    local max=${arr[0]}
    local sum=0
    for n in "${arr[@]}"; do
        is_smaller=$(python3 -c "print(1 if $n < $min else 0)")
        is_larger=$(python3 -c "print(1 if $n > $max else 0)")
        
        if [ "$is_smaller" -eq 1 ]; then min=$n; fi
        if [ "$is_larger" -eq 1 ]; then max=$n; fi
        
        sum=$(python3 -c "print($sum + $n)")
    done
    local avg=$(python3 -c "print('{:.2f}'.format($sum / ${#arr[@]}))")
    echo "Min: $min | Max: $max | Avg: $avg"
}

echo ""
echo -e "${GREEN}📊 FINAL RESULTS${NC}"
echo "=========================================="
echo "✅ TTI Stats:    $(calc_stats "${TTI_RESULTS[@]}") ms"
echo "⚡ CPU Stats:    $(calc_stats "${CPU_PEAK_RESULTS[@]}") %"
echo "💾 Memory Stats: $(calc_stats "${MEMORY_PEAK_RESULTS[@]}") KB"
echo ""
echo -e "${GREEN}📁 Logs prefix: $BASE_LOG_FILE${NC}"