
import re

with open('templates/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the last script block which contains the main logic
scripts = re.findall(r'<script>(.*?)</script>', content, re.DOTALL)
if scripts:
    last_script = scripts[-1]
    with open('debug_syntax.js', 'w', encoding='utf-8') as out:
        out.write(last_script)
    print("Extracted JS to debug_syntax.js")
else:
    print("No script tags found")
