#!/bin/bash

# SCENARIO-BASED MEMORY & CPU PROFILER
# Merekam performa selama interaksi pengguna berlangsung.

set -u

# --- KONFIGURASI ---
# Ganti sesuai aplikasi yang mau dites:
# PACKAGE_NAME="com.example.lelang_cabai"  # FLUTTER
PACKAGE_NAME="io.ionic.starter"          # IONIC

OUTPUT_DIR="scenario_logs"
mkdir -p $OUTPUT_DIR

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}⚡ SCENARIO PROFILER${NC}"
echo -e "${YELLOW}Target: $PACKAGE_NAME${NC}"

# Cek koneksi
if ! adb devices | grep -q "device$"; then
    echo -e "${RED}❌ Device not connected!${NC}"
    exit 1
fi

# Cari PID
PID=$(adb shell pidof "$PACKAGE_NAME" 2>/dev/null | tr ' ' '\n' | head -1)
if [[ -z "$PID" ]]; then
    echo -e "${RED}❌ App is not running! Silakan buka aplikasi dulu.${NC}"
    exit 1
fi
echo -e "✅ Process Found: PID $PID"

# Input Nama Skenario
echo -n "📝 Masukkan Nama Skenario (contoh: login_process): "
read SCENARIO_NAME
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CSV_FILE="$OUTPUT_DIR/${SCENARIO_NAME}_${TIMESTAMP}.csv"

echo "timestamp_ms,cpu_percent,memory_kb" > "$CSV_FILE"

echo ""
echo -e "${GREEN}=== READY TO RECORD ===${NC}"
echo "1. Siapkan jari Anda di HP."
echo "2. Tekan [ENTER] di sini untuk MULAI merekam."
echo "3. Lakukan skenario di HP (Login/Scroll/dll)."
echo "4. Tekan [ENTER] lagi di sini untuk STOP merekam."
echo "------------------------------------------------"
read -p "Tekan ENTER untuk MULAI..."

# --- RECORDING LOOP (BACKGROUND) ---
echo -e "${YELLOW}🔴 RECORDING... (Lakukan aktivitas di HP sekarang!)${NC}"

(
    while true; do
        current_time=$(date +%s%3N)
        
        # Ambil Memory (PSS Total) - Lebih akurat untuk Android
        # dumpsys meminfo agak berat, kita ambil ringkasannya saja
        mem_val=$(adb shell dumpsys meminfo "$PACKAGE_NAME" | grep -E "TOTAL:|TOTAL " | head -1 | awk '{print $2}')
        
        # Ambil CPU (via top -p PID)
        cpu_val=$(adb shell top -b -n 1 -p "$PID" | grep "$PID" | awk '{print $9}')
        
        # Validasi data kosong
        mem_val=${mem_val:-0}
        cpu_val=${cpu_val:-0}
        
        echo "$current_time,$cpu_val,$mem_val" >> "$CSV_FILE"
        
        # Sampling rate 0.5 detik (cukup untuk interaksi manual)
        sleep 0.5
    done
) &
RECORDER_PID=$!

# Tunggu user menekan ENTER untuk stop
read -p "" 

# Matikan recorder
kill $RECORDER_PID 2>/dev/null || true
echo -e "${GREEN}⏹️ STOPPED.${NC}"

# --- CALCULATE STATS ---
echo ""
echo -e "${YELLOW}📊 ANALYSIS RESULTS ($SCENARIO_NAME)${NC}"
echo "------------------------------------------------"

if [ -f "$CSV_FILE" ]; then
    # Hapus header, ambil kolom
    MEM_DATA=$(tail -n +2 "$CSV_FILE" | cut -d',' -f3 | sort -n)
    CPU_DATA=$(tail -n +2 "$CSV_FILE" | cut -d',' -f2 | sort -n)
    
    # Hitung Memory Stats
    MEM_MIN=$(echo "$MEM_DATA" | head -1)
    MEM_MAX=$(echo "$MEM_DATA" | tail -1)
    MEM_AVG=$(tail -n +2 "$CSV_FILE" | awk -F',' '{sum+=$3} END {printf "%.0f", sum/NR}')
    
    # Konversi ke MB
    MEM_MIN_MB=$(echo "scale=2; $MEM_MIN/1024" | bc)
    MEM_MAX_MB=$(echo "scale=2; $MEM_MAX/1024" | bc)
    MEM_AVG_MB=$(echo "scale=2; $MEM_AVG/1024" | bc)

    # Hitung CPU Stats
    CPU_MAX=$(echo "$CPU_DATA" | tail -1)
    CPU_AVG=$(tail -n +2 "$CSV_FILE" | awk -F',' '{sum+=$2} END {printf "%.2f", sum/NR}')

    echo -e "💾 MEMORY (PSS):"
    echo -e "   Min : ${MEM_MIN_MB} MB"
    echo -e "   Max : ${MEM_MAX_MB} MB (Peak)"
    echo -e "   Avg : ${MEM_AVG_MB} MB"
    
    echo -e "⚡ CPU:"
    echo -e "   Peak: ${CPU_MAX}%"
    echo -e "   Avg : ${CPU_AVG}%"
    
    echo "------------------------------------------------"
    echo -e "📁 Raw Data: $CSV_FILE"
else
    echo "❌ No data recorded."
fi