import subprocess
import time
import re
import sys

# --- KONFIGURASI IONIC ---
PACKAGE_NAME = "io.ionic.starter" 
ITERATIONS = 10
SCROLL_COUNT = 8
SWIPE_DURATION = 400 
WAIT_LOAD = 8        

def run_adb_cmd(args_list):
    try:
        result = subprocess.check_output(args_list, stderr=subprocess.STDOUT)
        return result.decode('utf-8').strip()
    except subprocess.CalledProcessError as e:
        return "ERROR"
    except FileNotFoundError:
        return "ERROR"

def get_safe_swipe_coords():
    output = run_adb_cmd(["adb", "shell", "wm", "size"])
    match = re.search(r'(\d+)x(\d+)', output)
    if match:
        w, h = int(match.group(1)), int(match.group(2))
        cx = w // 2
        start_y = int(h * 0.60)
        end_y = int(h * 0.20)
        return cx, start_y, end_y
    return 500, 1000, 300

def parse_fps(raw_data):
    lines = raw_data.strip().split('\n')
    if len(lines) < 2: return 0, 0, 0
    
    timestamps = []
    for line in lines[1:]: 
        parts = line.split()
        if len(parts) >= 2:
            try:
                t = int(parts[1])
                if t > 0 and t < 9223372036854775807: 
                    timestamps.append(t)
            except ValueError:
                continue

    count = len(timestamps)
    if count < 5: return 0, 0, 0 
    
    start_time = timestamps[0]
    end_time = timestamps[-1]
    duration_ns = end_time - start_time
    duration_sec = duration_ns / 1_000_000_000.0
    
    if duration_sec <= 0: return 0, 0, 0
    fps = count / duration_sec
    return count, duration_sec, fps

def find_active_layer(cx, sy, previous_name_hint=None):
    """
    V16 Logic:
    1. Jika ada hint (nama layer dari iterasi sebelumnya tanpa ID), cari itu dulu.
    2. Jika tidak ada, lakukan scan full.
    """
    raw_output = run_adb_cmd(["adb", "shell", "dumpsys", "SurfaceFlinger", "--list"])
    all_layers = raw_output.split('\n')
    
    # 1. FAST PATH: Cari berdasarkan hint (Nama paket tanpa ID)
    if previous_name_hint:
        # Bersihkan ID dari hint (misal: "com.app#123" -> "com.app")
        clean_hint = previous_name_hint.split('#')[0]
        for layer in all_layers:
            layer = layer.strip()
            # Jika nama depannya cocok, langsung ambil (ID-nya pasti baru)
            if layer.startswith(clean_hint):
                return layer

    # 2. SLOW PATH: Full Scan
    print("   🕵️  Scanning active layers...")
    candidates = []
    blacklist = [
        "StatusBar", "NavigationBar", "ImageWallpaper", "Background", 
        "InputSink", "ActivityRecord", "Snapshot", "Screenshot",
        "GestureStub", "InputMethod", "Magnifier", "Dimmer", 
        "PointerLocation", "Sprite", "IME", "Keyboard" 
    ]
    
    for layer in all_layers:
        layer = layer.strip()
        if not layer: continue
        if any(x in layer for x in blacklist): continue
        candidates.append(layer)
        
    # Pancing data
    run_adb_cmd(["adb", "shell", "input", "swipe", str(cx), str(sy), str(cx), str(sy-100), "100"])
    time.sleep(1)

    best_layer = None
    max_score = 0
    
    for layer in candidates:
        layer_arg = f'"{layer}"'
        raw_data = run_adb_cmd(["adb", "shell", "dumpsys", "SurfaceFlinger", "--latency", layer_arg])
        
        lines = raw_data.strip().split('\n')
        frame_count = 0
        if len(lines) > 2:
            for l in lines[1:]:
                parts = l.split()
                if len(parts) >= 2 and parts[1] != "0":
                    frame_count += 1
        
        if frame_count > 0:
            score = frame_count
            if PACKAGE_NAME in layer: score += 1000 
            if "SurfaceView" in layer: score += 500
            if "MainActivity" in layer: score += 200
            
            if score > max_score:
                max_score = score
                best_layer = layer
    
    return best_layer

# --- MAIN PROGRAM ---
print(f"⚡ IONIC FPS TESTER (V16 - Dynamic ID Refresh)")
print(f"🎯 App: {PACKAGE_NAME}")

cx, sy, ey = get_safe_swipe_coords()
print(f"📱 Safe Scroll Zone: X={cx}, Y={sy} -> {ey}")

LAST_KNOWN_LAYER_NAME = None # Simpan nama tanpa ID

for i in range(1, ITERATIONS + 1):
    print(f"\n🔄 Iteration {i}/{ITERATIONS}")
    run_adb_cmd(["adb", "shell", "am", "force-stop", PACKAGE_NAME])
    time.sleep(1)
    run_adb_cmd(["adb", "shell", "am", "start", "-n", f"{PACKAGE_NAME}/.MainActivity"])
    print(f"   ⏳ Waiting Hydration ({WAIT_LOAD}s)...")
    time.sleep(WAIT_LOAD)
    # SAFETY: Matikan keyboard
    run_adb_cmd(["adb", "shell", "input", "keyevent", "111"]) 
    # SELALU CARI LAYER BARU (Tapi pakai hint biar cepat)
    target_layer = find_active_layer(cx, sy, LAST_KNOWN_LAYER_NAME)
    if target_layer:
        print(f"   🔍 Active Layer: {target_layer}")
        # Simpan nama layernya saja untuk hint iterasi berikutnya
        LAST_KNOWN_LAYER_NAME = target_layer
    else:
        print("   ❌ ERROR: Tidak ada layer aplikasi yang aktif.")
        continue
    layer_arg = f'"{target_layer}"' 
    # Clear Buffer
    run_adb_cmd(["adb", "shell", "input", "tap", str(cx), str(sy)])
    run_adb_cmd(["adb", "shell", "dumpsys", "SurfaceFlinger", "--latency-clear", layer_arg])
    time.sleep(1)
    print(f"   👇 Scrolling {SCROLL_COUNT}x (Safe Zone)...")
    for _ in range(SCROLL_COUNT):
        run_adb_cmd(["adb", "shell", "input", "swipe", str(cx), str(sy), str(cx), str(ey), str(SWIPE_DURATION)])
        time.sleep(0.1)  
    print("   💾 Calculating...")
    raw_data = run_adb_cmd(["adb", "shell", "dumpsys", "SurfaceFlinger", "--latency", layer_arg])
    count, duration, fps = parse_fps(raw_data)
    if count > 0:
        print(f"   📊 Frames: {count}")
        print(f"   ⏱️ Duration: {duration:.4f}s")
        print(f"   🚀 FPS: {fps:.2f} FPS")
    else:
        print(f"   ⚠️ FPS: 0.00 (Retry...)")

print("\n🎉 DONE!")