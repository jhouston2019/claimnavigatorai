import os
import re

# Directories to process
TARGET_DIRS = [
    "app/resource-center-tools",
    "app/document-library",
    "app/claim-analysis-tools",
    "app/ai-tools",
    "app/claim-guides",
    "app/legal/requirements",
    "app/legal/timelines",
    "app/activation",
    "app/state-guides",
    "app/supporting-tools",
    "app/negotiation-tools",
]

NAVBAR_SCRIPT = '<script src="/assets/js/navigation-template.js"></script>'
NAVBAR_INIT = '<script>createNavigationBar();</script>'


def remove_nav_blocks(text):
    """Remove existing <nav>…</nav> blocks and commented nav references."""

    # Remove <nav>...</nav>
    text = re.sub(r"<nav[\s\S]*?</nav>", "", text, flags=re.IGNORECASE)

    # Remove commented navbars <!-- ... nav ... -->
    text = re.sub(r"<!--[\s\S]*?nav[\s\S]*?-->", "", text, flags=re.IGNORECASE)

    return text


def ensure_navbar_scripts(text):
    """Ensure canonical navbar script appears in <head> and init appears after <body>."""

    # 1. Remove old navbar script duplicates
    text = re.sub(
        r'<script[^>]*navigation-template\.js[^>]*></script>',
        "",
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(
        r'<script[^>]*createNavigationBar[^>]*></script>',
        "",
        text,
        flags=re.IGNORECASE,
    )

    # 2. Insert navbar script into <head>
    text = re.sub(
        r"</head>",
        f"    {NAVBAR_SCRIPT}\n</head>",
        text,
        flags=re.IGNORECASE,
    )

    # 3. Insert createNavigationBar() immediately after <body>
    text = re.sub(
        r"<body[^>]*>",
        lambda m: m.group(0) + "\n    " + NAVBAR_INIT + "\n",
        text,
        flags=re.IGNORECASE,
    )

    return text


def process_file(path):
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()

    original_text = text

    text = remove_nav_blocks(text)
    text = ensure_navbar_scripts(text)

    if text != original_text:
        with open(path, "w", encoding="utf-8") as f:
            f.write(text)
        print("Updated:", path)
    else:
        print("No change:", path)


def main():
    for d in TARGET_DIRS:
        if not os.path.exists(d):
            print("Directory missing:", d)
            continue

        for root, dirs, files in os.walk(d):
            for file in files:
                if file.endswith(".html"):
                    process_file(os.path.join(root, file))

    print("\n--- NAVBAR STANDARDIZATION (DEPENDENCY-FREE) COMPLETE ---")


if __name__ == "__main__":
    main()

