
def check_braces(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    stack = []
    for i, line in enumerate(lines):
        for j, char in enumerate(line):
            if char in '{[(':
                stack.append((char, i + 1, j + 1))
            elif char in '}])':
                if not stack:
                    print(f"Error: Unmatched '{char}' at line {i+1}, col {j+1}")
                    return
                last_char, last_line, last_col = stack.pop()
                expected = '{[('
                matching = '}])'
                if expected.index(last_char) != matching.index(char):
                    print(f"Error: Mismatched '{char}' at line {i+1}, col {j+1}. Expected closing for '{last_char}' from line {last_line}, col {last_col}")
                    return
    
    if stack:
        char, line, col = stack[0]
        print(f"Error: Unclosed '{char}' from line {line}, col {col}")
    else:
        print("Success: Braces are balanced")

check_braces('debug_syntax.js')
