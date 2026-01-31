# #!/bin/bash

# PACKAGE_NAME="io.ionic.starter"
# LOG_FILE="performance_$(date +%Y%m%d_%H%M%S).log"

# echo "=== QUICK PERFORMANCE TEST ==="

# # Build dan install
# echo "1. Building and installing..."
# ionic build
# npx cap sync android
# cd android
# ./gradlew assembleDebug
# cd ..
# adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# # Setup monitoring
# echo "2. Starting test..."
# adb logcat -c
# adb shell am force-stop $PACKAGE_NAME
# sleep 2

# # Start logging
# adb logcat -v time | grep "IONIC_PERFORMANCE" > $LOG_FILE &
# LOGCAT_PID=$!

# # Launch app
# echo "3. Launching app..."
# START_TIME=$(date +%s%3N)
# adb shell am start -n $PACKAGE_NAME/.MainActivity

# # Wait for TTI
# echo "4. Monitoring startup..."
# for i in {1..20}; do
#     if grep -q "TTI_COMPLETE" $LOG_FILE 2>/dev/null; then
#         END_TIME=$(date +%s%3N)
#         TTI=$((END_TIME - START_TIME))
#         echo "✅ TTI: ${TTI}ms"
#         break
#     fi
#     sleep 1
# done

# # Stop logging
# sleep 5
# kill $LOGCAT_PID

# echo "5. Results saved to: $LOG_FILE"
# echo "=== TEST COMPLETE ==="

#!/bin/bash

# Enhanced Ionic Angular Performance Test - More Reliable & Robust
# set -euo pipefail  # Exit on error, undefined var, and pipefail

# # Configuration
# PACKAGE_NAME="io.ionic.starter"
# BASE_LOG_FILE="enhanced_ionic_test_$(date +%Y%m%d_%H%M%S)"
# ITERATIONS=10

# # Colors for output
# RED='\033[0;31m'
# GREEN='\033[0;32m'
# YELLOW='\033[1;33m'
# BLUE='\033[0;34m'
# NC='\033[0m' # No Color

# echo -e "${GREEN}⚡ ENHANCED IONIC PERFORMANCE TEST - 10 ITERATIONS${NC}"

# # Check if required tools exist
# if ! command -v ionic &> /dev/null; then
#     echo -e "${RED}❌ ionic command not found. Please install Ionic CLI.${NC}" >&2
#     exit 1
# fi

# if ! command -v adb &> /dev/null; then
#     echo -e "${RED}❌ adb command not found. Please install Android SDK Platform Tools.${NC}" >&2
#     exit 1
# fi

# if ! adb devices | grep -q "device$"; then
#     echo -e "${RED}❌ No Android device connected via ADB.${NC}" >&2
#     exit 1
# fi

# # Build and install (only once)
# echo -e "${YELLOW}1. Building and installing...${NC}"
# ionic build --prod 
# npx cap sync android 
# cd android && ./gradlew assembleDebug && cd ..
# adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# # Arrays to store results
# declare -a TTI_RESULTS
# declare -a INIT_RESULTS
# declare -a ITERATION_STATUS

# for i in $(seq 1 $ITERATIONS); do
#     echo ""
#     echo -e "${YELLOW}🔄 Iteration $i/$ITERATIONS${NC}"
    
#     LOG_FILE="${BASE_LOG_FILE}_iter${i}.log"
    
#     # Test
#     echo -e "${GREEN}2. Testing...${NC}"
#     adb logcat -c
#     adb shell am force-stop $PACKAGE_NAME
#     sleep 2

#     echo "Starting log capture..."
#     adb logcat -v time | grep --line-buffered "IONIC_PERFORMANCE" > $LOG_FILE &
#     LOGCAT_PID=$!

#     adb shell am start -n $PACKAGE_NAME/.MainActivity

#     echo -e "${GREEN}3. Monitoring...${NC}"
#     sleep 5

#     kill $LOGCAT_PID 2>/dev/null || true

#     echo -e "4. Results for iteration $i:"
#     echo "============"
#     grep -E "(TTI_COMPLETE|DURATION_APP_INITIALIZATION)" $LOG_FILE || echo "No metrics found"

#     # TTI Calculation
#     echo "=== TTI CALCULATION ==="
#     START_LINE=$(grep "APP_CONSTRUCTOR_START" $LOG_FILE 2>/dev/null | head -1)
#     TTI_LINE=$(grep "TTI_COMPLETE" $LOG_FILE 2>/dev/null | head -1)

#     if [[ -n "$START_LINE" ]] && [[ -n "$TTI_LINE" ]]; then
#         # Extract the LAST 13-digit number from each line (the actual timestamp)
#         START_TIME=$(echo "$START_LINE" | grep -oE '[0-9]{13}' | head -1)
#         TTI_TIME=$(echo "$TTI_LINE" | grep -oE '[0-9]{13}' | head -1)
        
#         echo "Start time: $START_TIME"
#         echo "TTI time: $TTI_TIME"
        
#         if [[ -n "$START_TIME" ]] && [[ -n "$TTI_TIME" ]] && [[ $START_TIME -gt 0 ]] && [[ $TTI_TIME -gt 0 ]]; then
#             TTI=$((TTI_TIME - START_TIME))
#             echo -e "${GREEN}🎯 TTI: ${TTI}ms${NC}"
#             TTI_RESULTS+=($TTI)
#             ITERATION_STATUS+=("SUCCESS")
            
#             # Additional performance metrics
#             DURATION_APP_INIT=$(grep "DURATION_APP_INITIALIZATION" $LOG_FILE | head -1 | awk -F' - ' '{print $NF}' | awk '{gsub(/ms/,""); print}')
#             if [[ -n "$DURATION_APP_INIT" ]]; then
#                 echo -e "📱 App Initialization: ${DURATION_APP_INIT}ms"
#                 INIT_RESULTS+=($DURATION_APP_INIT)
#             fi
#         else
#             echo -e "${RED}❌ Invalid timestamps found${NC}"
#             TTI_RESULTS+=("FAIL")
#             INIT_RESULTS+=("FAIL")
#             ITERATION_STATUS+=("PARSE_ERROR")
#         fi
#     else
#         echo -e "${RED}❌ Missing required logs for TTI calculation${NC}"
#         TTI_RESULTS+=("FAIL")
#         INIT_RESULTS+=("FAIL")
#         ITERATION_STATUS+=("MISSING_LOGS")
#     fi

#     echo -e "📁 Log: $LOG_FILE"
    
#     # Small delay between iterations
#     if [ $i -lt $ITERATIONS ]; then
#         echo -e "⏳ Waiting 2 seconds before next iteration..."
#         # Force stop app to ensure clean start for next iteration
#         adb shell am force-stop $PACKAGE_NAME
#         sleep 2
#     fi
# done
#         adb shell am force-stop $PACKAGE_NAME


# # Calculate statistics
# echo ""
# echo -e "${GREEN}📊 FINAL RESULTS AFTER $ITERATIONS ITERATIONS${NC}"
# echo "=========================================="

# # TTI Statistics
# echo "🎯 TTI Results: ${TTI_RESULTS[@]}"

# SUCCESSFUL_TTI=()
# for result in "${TTI_RESULTS[@]}"; do
#     if [[ $result =~ ^[0-9]+$ ]]; then
#         SUCCESSFUL_TTI+=($result)
#     fi
# done

# if [ ${#SUCCESSFUL_TTI[@]} -gt 0 ]; then
#     # Calculate min, max, average
#     MIN_TTI=${SUCCESSFUL_TTI[0]}
#     MAX_TTI=${SUCCESSFUL_TTI[0]}
#     SUM_TTI=0
    
#     for tti in "${SUCCESSFUL_TTI[@]}"; do
#         if [ $tti -lt $MIN_TTI ]; then MIN_TTI=$tti; fi
#         if [ $tti -gt $MAX_TTI ]; then MAX_TTI=$tti; fi
#         SUM_TTI=$((SUM_TTI + tti))
#     done
    
#     AVG_TTI=$((SUM_TTI / ${#SUCCESSFUL_TTI[@]}))
    
#     echo -e "${GREEN}✅ Successful TTI measurements: ${#SUCCESSFUL_TTI[@]}/$ITERATIONS${NC}"
#     echo -e "${GREEN}📈 TTI Min: ${MIN_TTI}ms${NC}"
#     echo -e "${GREEN}📈 TTI Max: ${MAX_TTI}ms${NC}" 
#     echo -e "${GREEN}📈 TTI Average: ${AVG_TTI}ms${NC}"
# else
#     echo -e "${RED}❌ No successful TTI measurements${NC}"
# fi

# # Init Statistics
# echo ""
# echo "📱 APP INITIALIZATION Results: ${INIT_RESULTS[@]}"

# SUCCESSFUL_INIT=()
# for result in "${INIT_RESULTS[@]}"; do
#     if [[ $result =~ ^[0-9]+$ ]]; then
#         SUCCESSFUL_INIT+=($result)
#     fi
# done

# if [ ${#SUCCESSFUL_INIT[@]} -gt 0 ]; then
#     MIN_INIT=${SUCCESSFUL_INIT[0]}
#     MAX_INIT=${SUCCESSFUL_INIT[0]}
#     SUM_INIT=0
    
#     for init in "${SUCCESSFUL_INIT[@]}"; do
#         if [ $init -lt $MIN_INIT ]; then MIN_INIT=$init; fi
#         if [ $init -gt $MAX_INIT ]; then MAX_INIT=$init; fi
#         SUM_INIT=$((SUM_INIT + init))
#     done
    
#     AVG_INIT=$((SUM_INIT / ${#SUCCESSFUL_INIT[@]}))
    
#     echo -e "${GREEN}✅ Successful Init measurements: ${#SUCCESSFUL_INIT[@]}/$ITERATIONS${NC}"
#     echo -e "${GREEN}📈 Init Min: ${MIN_INIT}ms${NC}"
#     echo -e "${GREEN}📈 Init Max: ${MAX_INIT}ms${NC}"
#     echo -e "${GREEN}📈 Init Average: ${AVG_INIT}ms${NC}"
# fi

# # Iteration status summary
# echo ""
# echo -e "${BLUE}📋 Iteration Status Summary:${NC}"
# for i in "${!ITERATION_STATUS[@]}"; do
#     status="${ITERATION_STATUS[$i]}"
#     case $status in
#         "SUCCESS") echo -e "   $((i+1)): ✅ $status" ;;
#         *) echo -e "   $((i+1)): ❌ $status" ;;
#     esac
# done

# echo ""
# echo -e "${GREEN}📁 All logs saved with prefix: $BASE_LOG_FILE${NC}"






set -euo pipefail  # Exit on error, undefined var, and pipefail

# Configuration
PACKAGE_NAME="io.ionic.starter"
BASE_LOG_FILE="enhanced_ionic_test_$(date +%Y%m%d_%H%M%S)"
ITERATIONS=10
MONITOR_DURATION=10  # Duration to monitor CPU/Memory in seconds

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}⚡ ENHANCED IONIC PERFORMANCE TEST - 10 ITERATIONS${NC}"

# Check if required tools exist
if ! command -v ionic &> /dev/null; then
    echo -e "${RED}❌ ionic command not found. Please install Ionic CLI.${NC}" >&2
    exit 1
fi

if ! command -v adb &> /dev/null; then
    echo -e "${RED}❌ adb command not found. Please install Android SDK Platform Tools.${NC}" >&2
    exit 1
fi

if ! adb devices | grep -q "device$"; then
    echo -e "${RED}❌ No Android device connected via ADB.${NC}" >&2
    exit 1
fi

# Build and install (only once)
echo -e "${YELLOW}1. Building and installing...${NC}"
ionic build --prod 
npx cap sync android 
cd android && ./gradlew assembleDebug && cd ..
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Arrays to store results
declare -a TTI_RESULTS
declare -a INIT_RESULTS
declare -a CPU_PEAK_RESULTS
declare -a MEMORY_PEAK_RESULTS
declare -a ITERATION_STATUS

# Function to get CPU usage
get_cpu_usage() {
    local package=$1
    local cpu_usage=$(adb shell top -n 1 -b | grep "$package" | head -1 | awk '{print $9}' 2>/dev/null || echo "0")
    echo "$cpu_usage"
}

# Function to get Memory usage
get_memory_usage() {
    local package=$1
    local memory_info=$(adb shell dumpsys meminfo "$package" | grep -E "TOTAL|TOTAL:" | head -1 | awk '{print $2}' 2>/dev/null || echo "0")
    echo "$memory_info"
}

for i in $(seq 1 $ITERATIONS); do
    echo ""
    echo -e "${YELLOW}🔄 Iteration $i/$ITERATIONS${NC}"
    
    LOG_FILE="${BASE_LOG_FILE}_iter${i}.log"
    CPU_MEM_LOG_FILE="${BASE_LOG_FILE}_cpu_mem_iter${i}.csv"
    
    # Create CSV header
    echo "timestamp,cpu_percent,memory_kb" > "$CPU_MEM_LOG_FILE"
    
    # Test
    echo -e "${GREEN}2. Testing...${NC}"
    adb logcat -c
    adb shell am force-stop $PACKAGE_NAME
    sleep 2

    echo "Starting log capture..."
    adb logcat -v time | grep --line-buffered "IONIC_PERFORMANCE" > $LOG_FILE &
    LOGCAT_PID=$!

    # Start CPU/Memory monitoring in background
    echo "Starting CPU/Memory monitoring..."
    (
        end_time=$((SECONDS + MONITOR_DURATION))
        while [ $SECONDS -lt $end_time ]; do
            timestamp=$(date +%s)
            cpu_usage=$(get_cpu_usage "$PACKAGE_NAME")
            memory_usage=$(get_memory_usage "$PACKAGE_NAME")
            echo "$timestamp,$cpu_usage,$memory_usage" >> "$CPU_MEM_LOG_FILE"
            sleep 1
        done
    ) &
    MONITOR_PID=$!

    # Launch app
    adb shell am start -n $PACKAGE_NAME/.MainActivity

    echo -e "${GREEN}3. Monitoring CPU/Memory for ${MONITOR_DURATION}s...${NC}"
    
    # Wait for monitoring to complete
    wait $MONITOR_PID

    # Stop logcat
    kill $LOGCAT_PID 2>/dev/null || true

    echo -e "4. Results for iteration $i:"
    echo "============"
    grep -E "(TTI_COMPLETE|DURATION_APP_INITIALIZATION)" $LOG_FILE || echo "No metrics found"

    # TTI Calculation
    echo "=== TTI CALCULATION ==="
    START_LINE=$(grep "APP_CONSTRUCTOR_START" $LOG_FILE 2>/dev/null | head -1)
    TTI_LINE=$(grep "TTI_COMPLETE" $LOG_FILE 2>/dev/null | head -1)

    if [[ -n "$START_LINE" ]] && [[ -n "$TTI_LINE" ]]; then
        # Extract the LAST 13-digit number from each line (the actual timestamp)
        START_TIME=$(echo "$START_LINE" | grep -oE '[0-9]{13}' | head -1)
        TTI_TIME=$(echo "$TTI_LINE" | grep -oE '[0-9]{13}' | head -1)
        
        echo "Start time: $START_TIME"
        echo "TTI time: $TTI_TIME"
        
        if [[ -n "$START_TIME" ]] && [[ -n "$TTI_TIME" ]] && [[ $START_TIME -gt 0 ]] && [[ $TTI_TIME -gt 0 ]]; then
            TTI=$((TTI_TIME - START_TIME))
            echo -e "${GREEN}🎯 TTI: ${TTI}ms${NC}"
            TTI_RESULTS+=($TTI)
            ITERATION_STATUS+=("SUCCESS")
            
            # Additional performance metrics
            DURATION_APP_INIT=$(grep "DURATION_APP_INITIALIZATION" $LOG_FILE | head -1 | awk -F' - ' '{print $NF}' | awk '{gsub(/ms/,""); print}')
            if [[ -n "$DURATION_APP_INIT" ]]; then
                echo -e "📱 App Initialization: ${DURATION_APP_INIT}ms"
                INIT_RESULTS+=($DURATION_APP_INIT)
            fi
        else
            echo -e "${RED}❌ Invalid timestamps found${NC}"
            TTI_RESULTS+=("FAIL")
            INIT_RESULTS+=("FAIL")
            ITERATION_STATUS+=("PARSE_ERROR")
        fi
    else
        echo -e "${RED}❌ Missing required logs for TTI calculation${NC}"
        TTI_RESULTS+=("FAIL")
        INIT_RESULTS+=("FAIL")
        ITERATION_STATUS+=("MISSING_LOGS")
    fi

    # CPU & Memory Analysis
    echo "=== CPU & MEMORY ANALYSIS ==="
    if [ -f "$CPU_MEM_LOG_FILE" ]; then
        # Skip header and extract data
        CPU_VALUES=$(tail -n +2 "$CPU_MEM_LOG_FILE" | cut -d',' -f2 | sort -nr)
        MEMORY_VALUES=$(tail -n +2 "$CPU_MEM_LOG_FILE" | cut -d',' -f3 | sort -nr)
        
        # Get peak values (first line after sort -nr)
        CPU_PEAK=$(echo "$CPU_VALUES" | head -1)
        MEMORY_PEAK=$(echo "$MEMORY_VALUES" | head -1)
        
        # Calculate averages
        CPU_AVG=$(echo "$CPU_VALUES" | awk '{sum+=$1} END {print sum/NR}')
        MEMORY_AVG=$(echo "$MEMORY_VALUES" | awk '{sum+=$1} END {print sum/NR}')
        
        echo -e "${BLUE}⚡ CPU Peak: ${CPU_PEAK}%${NC}"
        echo -e "${BLUE}⚡ CPU Average: ${CPU_AVG}%${NC}"
        echo -e "${BLUE}💾 Memory Peak: ${MEMORY_PEAK} KB${NC}"
        echo -e "${BLUE}💾 Memory Average: ${MEMORY_AVG} KB${NC}"
        
        CPU_PEAK_RESULTS+=($CPU_PEAK)
        MEMORY_PEAK_RESULTS+=($MEMORY_PEAK)
    else
        echo -e "${RED}❌ CPU/Memory log file not found${NC}"
        CPU_PEAK_RESULTS+=("FAIL")
        MEMORY_PEAK_RESULTS+=("FAIL")
    fi

    echo -e "📁 Log: $LOG_FILE"
    echo -e "📁 CPU/Mem CSV: $CPU_MEM_LOG_FILE"
    
    # Small delay between iterations
    if [ $i -lt $ITERATIONS ]; then
        echo -e "⏳ Waiting 2 seconds before next iteration..."
        # Force stop app to ensure clean start for next iteration
        adb shell am force-stop $PACKAGE_NAME
        sleep 2
    fi
done

adb shell am force-stop $PACKAGE_NAME

# Calculate statistics
echo ""
echo -e "${GREEN}📊 FINAL RESULTS AFTER $ITERATIONS ITERATIONS${NC}"
echo "=========================================="

# [Keep your existing TTI and Init statistics code...]

# Add CPU Statistics
echo ""
echo "⚡ CPU PEAK Results: ${CPU_PEAK_RESULTS[@]}"

SUCCESSFUL_CPU=()
for result in "${CPU_PEAK_RESULTS[@]}"; do
    if [[ $result =~ ^[0-9]+$ ]] || [[ $result =~ ^[0-9]+\.[0-9]+$ ]]; then
        SUCCESSFUL_CPU+=($result)
    fi
done

if [ ${#SUCCESSFUL_CPU[@]} -gt 0 ]; then
    MIN_CPU=${SUCCESSFUL_CPU[0]}
    MAX_CPU=${SUCCESSFUL_CPU[0]}
    SUM_CPU=0
    
    for cpu in "${SUCCESSFUL_CPU[@]}"; do
        if (( $(echo "$cpu < $MIN_CPU" | bc -l) )); then MIN_CPU=$cpu; fi
        if (( $(echo "$cpu > $MAX_CPU" | bc -l) )); then MAX_CPU=$cpu; fi
        SUM_CPU=$(echo "$SUM_CPU + $cpu" | bc -l)
    done
    
    AVG_CPU=$(echo "scale=2; $SUM_CPU / ${#SUCCESSFUL_CPU[@]}" | bc -l)
    
    echo -e "${GREEN}✅ Successful CPU measurements: ${#SUCCESSFUL_CPU[@]}/$ITERATIONS${NC}"
    echo -e "${GREEN}📈 CPU Peak Min: ${MIN_CPU}%${NC}"
    echo -e "${GREEN}📈 CPU Peak Max: ${MAX_CPU}%${NC}" 
    echo -e "${GREEN}📈 CPU Peak Average: ${AVG_CPU}%${NC}"
else
    echo -e "${RED}❌ No successful CPU measurements${NC}"
fi

# Add Memory Statistics
echo ""
echo "💾 MEMORY PEAK Results: ${MEMORY_PEAK_RESULTS[@]}"

SUCCESSFUL_MEMORY=()
for result in "${MEMORY_PEAK_RESULTS[@]}"; do
    if [[ $result =~ ^[0-9]+$ ]]; then
        SUCCESSFUL_MEMORY+=($result)
    fi
done

if [ ${#SUCCESSFUL_MEMORY[@]} -gt 0 ]; then
    MIN_MEMORY=${SUCCESSFUL_MEMORY[0]}
    MAX_MEMORY=${SUCCESSFUL_MEMORY[0]}
    SUM_MEMORY=0
    
    for memory in "${SUCCESSFUL_MEMORY[@]}"; do
        if [ $memory -lt $MIN_MEMORY ]; then MIN_MEMORY=$memory; fi
        if [ $memory -gt $MAX_MEMORY ]; then MAX_MEMORY=$memory; fi
        SUM_MEMORY=$((SUM_MEMORY + memory))
    done
    
    AVG_MEMORY=$((SUM_MEMORY / ${#SUCCESSFUL_MEMORY[@]}))
    
    # Convert KB to MB for readability
    MIN_MEMORY_MB=$(echo "scale=2; $MIN_MEMORY / 1024" | bc -l)
    MAX_MEMORY_MB=$(echo "scale=2; $MAX_MEMORY / 1024" | bc -l)
    AVG_MEMORY_MB=$(echo "scale=2; $AVG_MEMORY / 1024" | bc -l)
    
    echo -e "${GREEN}✅ Successful Memory measurements: ${#SUCCESSFUL_MEMORY[@]}/$ITERATIONS${NC}"
    echo -e "${GREEN}📈 Memory Peak Min: ${MIN_MEMORY} KB (${MIN_MEMORY_MB} MB)${NC}"
    echo -e "${GREEN}📈 Memory Peak Max: ${MAX_MEMORY} KB (${MAX_MEMORY_MB} MB)${NC}"
    echo -e "${GREEN}📈 Memory Peak Average: ${AVG_MEMORY} KB (${AVG_MEMORY_MB} MB)${NC}"
else
    echo -e "${RED}❌ No successful Memory measurements${NC}"
fi

# [Keep your existing iteration status summary...]

echo ""
echo -e "${GREEN}📁 All logs saved with prefix: $BASE_LOG_FILE${NC}"