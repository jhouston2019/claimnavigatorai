import os
import re

TARGET_DIRS = [
    "app/document-library",
    "app/claim-analysis-tools",
    "app/claim-guides",
    "app/legal/requirements",
    "app/legal/timelines",
    "app/activation",
    "app/state-guides",
]

CANONICAL_HERO = """
<section class="hero-section hero-navy">
  <div class="hero-content">
    <h1>{TITLE}</h1>
    <p class="subtitle">{SUBTITLE}</p>
  </div>
</section>
"""

def remove_existing_hero(text):
    text = re.sub(
        r"<section[^>]*?(hero|banner|page-hero|header)[\s\S]*?</section>",
        "",
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(
        r"<header[\s\S]*?</header>",
        "",
        text,
        flags=re.IGNORECASE,
    )
    return text

def extract_title(text):
    m = re.search(r"<h1[^>]*>(.*?)</h1>", text, flags=re.IGNORECASE | re.DOTALL)
    if m:
        return re.sub(r"\s+", " ", m.group(1).strip())
    return "Untitled Page"

def extract_subtitle(text):
    pattern = r"<h1[^>]*>[\s\S]*?</h1>\s*<p[^>]*>(.*?)</p>"
    m = re.search(pattern, text, flags=re.IGNORECASE | re.DOTALL)
    if m:
        cleaned = re.sub(r"\s+", " ", m.group(1).strip())
        if cleaned:
            return cleaned
    return "Clear guidance for this step of your claim."

def insert_hero(text, title, subtitle):
    hero_html = CANONICAL_HERO.format(TITLE=title, SUBTITLE=subtitle).strip()
    return re.sub(
        r"(<script>\s*createNavigationBar\(\);\s*</script>)",
        r"\1\n" + hero_html + "\n",
        text,
        flags=re.IGNORECASE,
    )

def process_file(path):
    with open(path, "r", encoding="utf-8") as f:
        original = f.read()

    updated = remove_existing_hero(original)
    title = extract_title(updated)
    subtitle = extract_subtitle(updated)
    updated = insert_hero(updated, title, subtitle)

    if updated != original:
        with open(path, "w", encoding="utf-8") as f:
            f.write(updated)
        print("Updated:", path)
    else:
        print("No change:", path)

def main():
    for d in TARGET_DIRS:
        if not os.path.exists(d):
            print("Directory missing:", d)
            continue

        for root, _, files in os.walk(d):
            for file in files:
                if file.endswith(".html"):
                    process_file(os.path.join(root, file))

    print("\n--- PHASE B: HERO STANDARDIZATION COMPLETE ---")

if __name__ == "__main__":
    main()
