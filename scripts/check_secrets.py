#!/usr/bin/env python3
"""
Pre-commit Secret Detector for EasyTradez (opensource-shopify)
Scans staged changes to prevent leaking API keys, JWT service tokens, or .env files.
"""

import sys
import subprocess
import re

PATTERNS = [
    ("Google / Gemini API Key", re.compile(r"AIza[0-9A-Za-z\-_]{35}")),
    ("GitHub Personal Access Token", re.compile(r"ghp_[0-9A-Za-z]{36}")),
    ("Vercel Access Token", re.compile(r"vcp_[0-9A-Za-z]{24,}")),
    ("Cloudinary API Secret", re.compile(r"CLOUDINARY_API_SECRET\s*=\s*['\"][a-zA-Z0-9_\-]{20,}['\"]")),
    ("SlickPay Secret Key", re.compile(r"SLICKPAY_SECRET_KEY\s*=\s*['\"][a-zA-Z0-9_\-]{20,}['\"]")),
    ("Anthropic API Key", re.compile(r"sk-ant-[0-9A-Za-z\-_]{20,}")),
    ("Supabase JWT / Secret", re.compile(r"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+")),
]

IGNORE_PATTERNS = [
    "your-", "dummy", "example", "placeholder", "xxx", "REDACTED"
]

def main():
    # 1. Check staged filenames
    try:
        staged_files = subprocess.check_output(
            ["git", "diff", "--cached", "--name-only"],
            text=True,
            errors="replace"
        ).splitlines()
    except Exception as e:
        print(f"Warning: Could not get staged files: {e}")
        return 0

    blocked = False
    for filename in staged_files:
        basename = filename.split("/")[-1].split("\\")[-1]
        if basename.startswith(".env") and not basename.endswith(".example"):
            print(f"❌ [SECRET GUARD] Fichier d'environnement détecté dans le commit : {filename}")
            blocked = True

    # 2. Check staged content diff
    try:
        diff_text = subprocess.check_output(
            ["git", "diff", "--cached", "-U0"],
            text=True,
            errors="replace"
        )
    except Exception as e:
        print(f"Warning: Could not get git diff: {e}")
        return 0

    current_file = "unknown"
    for line in diff_text.splitlines():
        if line.startswith("+++ b/"):
            current_file = line[6:]
            continue

        if line.startswith("+") and not line.startswith("+++"):
            content = line[1:].strip()
            # Ignore placeholder lines
            if any(p in content.lower() for p in IGNORE_PATTERNS):
                continue

            for name, pattern in PATTERNS:
                if pattern.search(content):
                    print(f"❌ [SECRET GUARD] Secret potentiel ({name}) détecté dans {current_file} :")
                    print(f"   --> {content[:60]}...")
                    blocked = True

    if blocked:
        print("\n🚫 COMMIT REJETÉ : Supprimez les clés sensibles ou utilisez os.getenv() / des variables d'environnement.")
        sys.exit(1)

    return 0

if __name__ == "__main__":
    sys.exit(main())
