import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # fix the single line try...catch...end
    content = re.sub(
        r"try;\s*([^;]+);\s*catch;\s*end",
        r"try\n        \1;\n    catch\n    end",
        content
    )

    # fix the remaining catch; end
    content = re.sub(
        r"(\s*)catch;\s*end",
        r"\1catch\n\1    // ignore\n\1end",
        content
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_file(r'E:\My projects\Task\AquaSafe\AquaSafe.sci')
fix_file(r'E:\My projects\Task\AquaSafe\aquasafe_engine.sci')
print("Fixed both files.")
