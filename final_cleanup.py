import os
import shutil

target_files = [
    r"c:\Users\Admin\Desktop\pooy\ESG_Wep\frontend\test_write.txt",
    r"c:\Users\Admin\Desktop\pooy\ESG_Wep\frontend\netlify.toml"
]
target_dirs = [
    r"c:\Users\Admin\Desktop\pooy\ESG_Wep\frontend\node_modules"
]

print("--- Pre-check ---")
for f in target_files:
    print(f"{f} exists: {os.path.exists(f)}")
for d in target_dirs:
    print(f"{d} exists: {os.path.exists(d)}")

print("--- Deleting ---")
for f in target_files:
    if os.path.exists(f):
        try:
            os.remove(f)
            print(f"Deleted file: {f}")
        except Exception as e:
            print(f"Failed to delete {f}: {e}")

for d in target_dirs:
    if os.path.exists(d):
        try:
            shutil.rmtree(d, ignore_errors=True)
            print(f"Deleted dir: {d}")
        except Exception as e:
            print(f"Failed to delete {d}: {e}")

print("--- Post-check ---")
for f in target_files:
    print(f"{f} exists: {os.path.exists(f)}")
for d in target_dirs:
    print(f"{d} exists: {os.path.exists(d)}")
