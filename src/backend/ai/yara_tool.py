import sys
import json
import os
import yara

def scan_file(file_path):
    rules_dir = "/app/applet/sigma_rules" # Actually use yara_rules
    yara_dir = "/app/applet/yara_rules"
    
    if not os.path.exists(yara_dir):
        os.makedirs(yara_dir, exist_ok=True)
        dummy_rule = 'rule SuspiciousActivity { strings: $a = "Invoke-WebRequest" nocase condition: $a }'
        with open(os.path.join(yara_dir, "suspicious.yar"), "w") as f:
            f.write(dummy_rule)

    filepaths = {}
    for filename in os.listdir(yara_dir):
        if filename.endswith(".yar") or filename.endswith(".yara"):
            filepaths[filename] = os.path.join(yara_dir, filename)

    if not filepaths:
        return []

    try:
        rules = yara.compile(filepaths=filepaths)
        matches = rules.match(file_path)
        return [m.rule for m in matches]
    except Exception as e:
        return []

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps([]))
        sys.exit(0)
    
    target_file = sys.argv[1]
    matches = scan_file(target_file)
    print(json.dumps(matches))
