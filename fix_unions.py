import os
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    new_content = content
    # Replace type | None with Optional[type]
    # This might be tricky if the type is complex. 
    # For now, let's target simple cases like `int | None`, `str | None`
    new_content = re.sub(r'(\w+)\s*\|\s*None', r'Optional[\1]', new_content)
    # Replace None | type
    new_content = re.sub(r'None\s*\|\s*(\w+)', r'Optional[\1]', new_content)

    if new_content != content:
        # Check if Optional is imported, if not, add it
        if 'from typing import' in new_content:
            if 'Optional' not in new_content:
                new_content = re.sub(r'from typing import (.*)', r'from typing import \1, Optional', new_content)
        else:
            new_content = "from typing import Optional\n" + new_content

        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")

# Find all python files in backend/app/
for root, dirs, files in os.walk('backend/app'):
    for file in files:
        if file.endswith('.py'):
            fix_file(os.path.join(root, file))
