#!/usr/bin/env python3
"""
Audit script to check which template files are missing
"""

import json
import os

# Read the metadata.json file
with open('assets/data/document-metadata.json', 'r', encoding='utf-8') as f:
    metadata = json.load(f)

# Get list of existing template files
template_dir = 'assets/templates'
existing_templates = set()
if os.path.exists(template_dir):
    for file in os.listdir(template_dir):
        if file.endswith('.txt'):
            existing_templates.add(file)

print(f"Found {len(existing_templates)} existing template files:")
for template in sorted(existing_templates):
    print(f"  OK: {template}")

print("\n" + "="*50 + "\n")

# Check which documents need templates
missing_templates = []
template_based_docs = []

for doc in metadata:
    if doc.get('templateBased', False) and 'template' in doc:
        template_based_docs.append(doc)
        template_file = doc['template']
        if template_file not in existing_templates:
            missing_templates.append({
                'id': doc['id'],
                'title': doc['title'],
                'template': template_file
            })

print(f"Found {len(template_based_docs)} template-based documents:")
for doc in template_based_docs:
    template_file = doc['template']
    status = "OK" if template_file in existing_templates else "MISSING"
    print(f"  {status}: {doc['id']} -> {template_file}")

print("\n" + "="*50 + "\n")

print("MISSING TEMPLATE FILES:")
if missing_templates:
    for missing in missing_templates:
        print(f"  MISSING: {missing['id']} ({missing['title']}) -> {missing['template']}")
else:
    print("  OK: All required template files exist")

print(f"\nSUMMARY:")
print(f"  Template-based documents: {len(template_based_docs)}")
print(f"  Missing templates: {len(missing_templates)}")
print(f"  Existing templates: {len(existing_templates)}")
