import re

filepath = r'E:\My projects\Task\AquaSafe\aquasafe_engine.sci'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the catch; end syntax error
content = re.sub(
    r"catch;\s*end",
    r"catch\n        // ignore\n    end",
    content
)

# Fix any try; ... catch; end
content = re.sub(
    r"try;\s*([^;]+);\s*catch\n        // ignore\n    end",
    r"try\n        \1;\n    catch\n        // ignore\n    end",
    content
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed catch end syntax again.")
