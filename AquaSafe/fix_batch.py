filepath = r'E:\My projects\Task\AquaSafe\aquasafe_engine.sci'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and replace lines 908-916 (0-indexed: 907-915)
# Replace the broken batch-file section with the clean ascii(34) version
new_lines = []
i = 0
while i < len(lines):
    # Detect start of the problematic batch section
    if '// ---- Write a tiny batch file to open the HTML (no quoting issues) ----' in lines[i]:
        # Skip until we hit the shell() call (inclusive) then write the new version
        while i < len(lines) and "shell('cmd /c ' + bat_file);" not in lines[i]:
            i += 1
        i += 1  # skip the shell line too
        # Write new clean version
        new_lines.append('    // ---- Write batch file to open HTML (uses ascii(34) to avoid double-quote chars) ----\n')
        new_lines.append('    q = ascii(34);\n')
        new_lines.append("    bat_file = tempdir() + 'open_aquasafe_report.bat';\n")
        new_lines.append('    fid2 = mopen(bat_file, ' + "'wt'" + ');\n')
        new_lines.append("    // Writes: @echo off / start /B \"\" \"C:\\...\\AquaSafe_WQI_Report.html\"\n")
        new_lines.append("    mfprintf(fid2, '@echo off\\r\\nstart /B %s%s %s%s%s\\r\\n', q, q, q, report_file, q);\n")
        new_lines.append('    mclose(fid2);\n')
        new_lines.append('\n')
        new_lines.append('    shell(bat_file);\n')
        new_lines.append('\n')
    else:
        new_lines.append(lines[i])
        i += 1

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Done! Total lines: {len(new_lines)}")

# Verify
dq_found = [(i+1, l.rstrip()) for i, l in enumerate(new_lines) if '"' in l]
print(f"Lines with double-quote in file: {len(dq_found)}")
for ln, txt in dq_found:
    print(f"  Line {ln}: {txt}")
print("Zero means clean parse!" if not dq_found else "These need checking.")
