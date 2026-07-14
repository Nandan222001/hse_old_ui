import os
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    new_content = content
    # Replace list[...] and dict[...]
    # This regex is simple, might need adjustment if brackets are nested
    new_content = re.sub(r'list\[', 'List[', new_content)
    new_content = re.sub(r'dict\[', 'Dict[', new_content)
    new_content = re.sub(r'tuple\[', 'Tuple[', new_content)
    new_content = re.sub(r'set\[', 'Set[', new_content)

    if new_content != content:
        # Check if List/Dict/Tuple/Set are imported, if not, add them
        if 'from typing import' in new_content:
            new_content = re.sub(r'from typing import (.*)', r'from typing import \1, List, Dict, Tuple, Set', new_content)
            # Clean up duplicates only on the import line
            def clean_import(m):
                words = [w.strip() for w in m.group(1).split(',')]
                unique_words = []
                for w in words:
                    if w and w not in unique_words:
                        unique_words.append(w)
                return "from typing import " + ", ".join(unique_words)
            new_content = re.sub(r'from typing import (.*)', clean_import, new_content)
        else:
            new_content = "from typing import List, Dict, Tuple, Set\n" + new_content

        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")

# Find all python files in backend/app/
for root, dirs, files in os.walk('backend/app'):
    for file in files:
        if file.endswith('.py'):
            fix_file(os.path.join(root, file))
