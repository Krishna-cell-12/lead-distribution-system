filepath = r'E:\My projects\Task\AquaSafe\aquasafe_engine.sci'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

exp_start = None
for i, l in enumerate(lines):
    if 'function export_report' in l:
        exp_start = i
        break

if exp_start is None:
    print("Not found!")
else:
    for i in range(exp_start, min(exp_start+200, len(lines))):
        if '"' in lines[i]:
            print(f"Line {i+1}: {lines[i].rstrip()}")

print("Scan complete.")
