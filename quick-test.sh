# #!/bin/bash

# # Simple Ionic Performance Test

# set -e

# PACKAGE_NAME="io.ionic.starter"
# LOG_FILE="quick_test_$(date +%Y%m%d_%H%M%S).log"

# echo "⚡ SIMPLE IONIC PERFORMANCE TEST"

# # Build and install
# echo "1. Building..."
# ionic build --prod 
# npx cap sync android 
# cd android && ./gradlew assembleDebug && cd ..
# adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# # Test
# echo "2. Testing..."
# adb logcat -c
# adb shell am force-stop $PACKAGE_NAME
# sleep 2

# adb logcat -v time | grep --line-buffered "IONIC_PERFORMANCE" > $LOG_FILE &
# LOGCAT_PID=$!

# adb shell am start -n $PACKAGE_NAME/.MainActivity

# echo "3. Monitoring..."
# sleep 10

# kill $LOGCAT_PID 2>/dev/null || true

# echo "4. Results:"
# echo "============"

# # Simple extraction using awk
# START_TIME=$(awk '/APP_CONSTRUCTOR_START/ {print $NF}' $LOG_FILE 2>/dev/null | head -1)
# TTI_TIME=$(awk '/TTI_COMPLETE/ {print $NF}' $LOG_FILE 2>/dev/null | head -1)

# echo "Start timestamp: $START_TIME"
# echo "TTI timestamp: $TTI_TIME"

# if [ ! -z "$START_TIME" ] && [ ! -z "$TTI_TIME" ]; then
#     TTI=$((TTI_TIME - START_TIME))
#     echo "🎯 TTI: ${TTI}ms"
# else
#     echo "❌ Could not calculate TTI"
# fi

# # Show all performance metrics
# echo ""
# echo "📊 All Performance Metrics:"
# grep "IONIC_PERFORMANCE" $LOG_FILE

# echo "📁 Log: $LOG_FILE"

#!/bin/bash

# Quick Ionic Performance Test - 10 ITERATIONS

set -e

PACKAGE_NAME="io.ionic.starter"
BASE_LOG_FILE="quick_test_$(date +%Y%m%d_%H%M%S)"
ITERATIONS=10

echo "⚡ QUICK IONIC PERFORMANCE TEST - 10 ITERATIONS"

# Build and install (only once)
echo "1. Building and installing..."
ionic build --prod 
npx cap sync android 
cd android && ./gradlew assembleDebug && cd ..
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Arrays to store results
declare -a TTI_RESULTS
declare -a INIT_RESULTS

for i in $(seq 1 $ITERATIONS); do
    echo ""
    echo "🔄 Iteration $i/$ITERATIONS"
    
    LOG_FILE="${BASE_LOG_FILE}_iter${i}.log"
    
    # Test
    echo "2. Testing..."
    adb logcat -c
    adb shell am force-stop $PACKAGE_NAME
    sleep 2

    echo "Starting log capture..."
    adb logcat -v time | grep --line-buffered "IONIC_PERFORMANCE" > $LOG_FILE &
    LOGCAT_PID=$!

    adb shell am start -n $PACKAGE_NAME/.MainActivity

    echo "3. Monitoring..."
    sleep 10

    kill $LOGCAT_PID 2>/dev/null || true

    echo "4. Results for iteration $i:"
    echo "============"
    grep -E "(TTI_COMPLETE|DURATION_APP_INITIALIZATION)" $LOG_FILE || echo "No metrics found"

    # TTI Calculation
    echo "=== TTI CALCULATION ==="
    START_LINE=$(grep "APP_CONSTRUCTOR_START" $LOG_FILE 2>/dev/null | head -1)
    TTI_LINE=$(grep "TTI_COMPLETE" $LOG_FILE 2>/dev/null | head -1)

    if [ ! -z "$START_LINE" ] && [ ! -z "$TTI_LINE" ]; then
        # Extract the LAST number from each line (the actual timestamp)
        START_TIME=$(echo "$START_LINE" | grep -o '[0-9]*$')
        TTI_TIME=$(echo "$TTI_LINE" | grep -o '[0-9]*$')
        
        echo "Start time: $START_TIME"
        echo "TTI time: $TTI_TIME"
        
        if [ ! -z "$START_TIME" ] && [ ! -z "$TTI_TIME" ] && [ "$START_TIME" -gt 0 ] && [ "$TTI_TIME" -gt 0 ]; then
            TTI=$((TTI_TIME - START_TIME))
            echo "🎯 TTI: ${TTI}ms"
            TTI_RESULTS+=($TTI)
            
            # Additional performance metrics
            DURATION_APP_INIT=$(grep "DURATION_APP_INITIALIZATION" $LOG_FILE | head -1 | awk -F' - ' '{print $NF}' | awk '{gsub(/ms/,""); print}')
            if [ ! -z "$DURATION_APP_INIT" ]; then
                echo "📱 App Initialization: ${DURATION_APP_INIT}ms"
                INIT_RESULTS+=($DURATION_APP_INIT)
            fi
        else
            echo "❌ Invalid timestamps found"
            TTI_RESULTS+=("FAIL")
            INIT_RESULTS+=("FAIL")
        fi
    else
        echo "❌ Missing required logs for TTI calculation"
        TTI_RESULTS+=("FAIL")
        INIT_RESULTS+=("FAIL")
    fi

    echo "📁 Log: $LOG_FILE"
    
    # Small delay between iterations
    if [ $i -lt $ITERATIONS ]; then
        echo "⏳ Waiting 3 seconds before next iteration..."
        sleep 3
    fi
done

# Calculate statistics
echo ""
echo "📊 FINAL RESULTS AFTER $ITERATIONS ITERATIONS"
echo "=========================================="

# TTI Statistics
echo "🎯 TTI Results: ${TTI_RESULTS[@]}"

SUCCESSFUL_TTI=()
for result in "${TTI_RESULTS[@]}"; do
    if [[ $result =~ ^[0-9]+$ ]]; then
        SUCCESSFUL_TTI+=($result)
    fi
done

if [ ${#SUCCESSFUL_TTI[@]} -gt 0 ]; then
    # Calculate min, max, average
    MIN_TTI=${SUCCESSFUL_TTI[0]}
    MAX_TTI=${SUCCESSFUL_TTI[0]}
    SUM_TTI=0
    
    for tti in "${SUCCESSFUL_TTI[@]}"; do
        if [ $tti -lt $MIN_TTI ]; then MIN_TTI=$tti; fi
        if [ $tti -gt $MAX_TTI ]; then MAX_TTI=$tti; fi
        SUM_TTI=$((SUM_TTI + tti))
    done
    
    AVG_TTI=$((SUM_TTI / ${#SUCCESSFUL_TTI[@]}))
    
    echo "✅ Successful TTI measurements: ${#SUCCESSFUL_TTI[@]}/$ITERATIONS"
    echo "📈 TTI Min: ${MIN_TTI}ms"
    echo "📈 TTI Max: ${MAX_TTI}ms" 
    echo "📈 TTI Average: ${AVG_TTI}ms"
else
    echo "❌ No successful TTI measurements"
fi

# Init Statistics
echo ""
echo "📱 APP INITIALIZATION Results: ${INIT_RESULTS[@]}"

SUCCESSFUL_INIT=()
for result in "${INIT_RESULTS[@]}"; do
    if [[ $result =~ ^[0-9]+$ ]]; then
        SUCCESSFUL_INIT+=($result)
    fi
done

if [ ${#SUCCESSFUL_INIT[@]} -gt 0 ]; then
    MIN_INIT=${SUCCESSFUL_INIT[0]}
    MAX_INIT=${SUCCESSFUL_INIT[0]}
    SUM_INIT=0
    
    for init in "${SUCCESSFUL_INIT[@]}"; do
        if [ $init -lt $MIN_INIT ]; then MIN_INIT=$init; fi
        if [ $init -gt $MAX_INIT ]; then MAX_INIT=$init; fi
        SUM_INIT=$((SUM_INIT + init))
    done
    
    AVG_INIT=$((SUM_INIT / ${#SUCCESSFUL_INIT[@]}))
    
    echo "✅ Successful Init measurements: ${#SUCCESSFUL_INIT[@]}/$ITERATIONS"
    echo "📈 Init Min: ${MIN_INIT}ms"
    echo "📈 Init Max: ${MAX_INIT}ms"
    echo "📈 Init Average: ${AVG_INIT}ms"
fi

echo ""
echo "📁 All logs saved with prefix: $BASE_LOG_FILE"