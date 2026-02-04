import os
import shutil

files_to_remove = [
    r"c:\Users\Admin\Desktop\pooy\ESG_Wep\frontend\netlify.toml",
    r"c:\Users\Admin\Desktop\pooy\ESG_Wep\frontend\test_write.txt",
    r"c:\Users\Admin\Desktop\pooy\ESG_Wep\backend\debug_api.py",
    r"c:\Users\Admin\Desktop\pooy\ESG_Wep\backend\market_chart.png",
    r"c:\Users\Admin\Desktop\pooy\ESG_Wep\backend\market_report.md"
]

dirs_to_remove = [
    r"c:\Users\Admin\Desktop\pooy\ESG_Wep\frontend\node_modules",
    r"c:\Users\Admin\Desktop\pooy\ESG_Wep\frontend\dist"
]

print("Starting cleanup...")

for f in files_to_remove:
    try:
        if os.path.exists(f):
            os.remove(f)
            print(f"Deleted: {f}")
        else:
            print(f"Not found: {f}")
    except Exception as e:
        print(f"Error deleting {f}: {e}")

for d in dirs_to_remove:
    try:
        if os.path.exists(d):
            shutil.rmtree(d)
            print(f"Deleted directory: {d}")
        else:
            print(f"Not found directory: {d}")
    except Exception as e:
        print(f"Error deleting directory {d}: {e}")

# Clean __pycache__
backend_dir = r"c:\Users\Admin\Desktop\pooy\ESG_Wep\backend"
for root, dirs, files in os.walk(backend_dir):
    for d in dirs:
        if d == "__pycache__":
            path = os.path.join(root, d)
            try:
                shutil.rmtree(path)
                print(f"Deleted cache: {path}")
            except Exception as e:
                print(f"Error deleting cache {path}: {e}")

print("Cleanup complete.")
