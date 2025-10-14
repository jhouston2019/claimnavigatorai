#!/usr/bin/env python3
"""
Audit script to compare document types in index.html with metadata.json
"""

import json
import re

# Read the index.html file
with open('app/resource-center/document-generator/index.html', 'r', encoding='utf-8') as f:
    index_content = f.read()

# Extract all document types from index.html
type_pattern = r'type=([^"]+)'
document_types = re.findall(type_pattern, index_content)

print(f"Found {len(document_types)} document types in index.html:")
for doc_type in sorted(set(document_types)):
    print(f"  - {doc_type}")

print("\n" + "="*50 + "\n")

# Read the metadata.json file
with open('assets/data/document-metadata.json', 'r', encoding='utf-8') as f:
    metadata = json.load(f)

# Extract IDs from metadata
metadata_ids = [doc['id'] for doc in metadata]

print(f"Found {len(metadata_ids)} document types in metadata.json:")
for doc_id in sorted(metadata_ids):
    print(f"  - {doc_id}")

print("\n" + "="*50 + "\n")

# Find missing documents
index_types = set(document_types)
metadata_types = set(metadata_ids)

missing_from_metadata = index_types - metadata_types
missing_from_index = metadata_types - index_types

print("DOCUMENTS IN INDEX BUT MISSING FROM METADATA:")
if missing_from_metadata:
    for doc_type in sorted(missing_from_metadata):
        print(f"  MISSING: {doc_type}")
else:
    print("  OK: All index documents have metadata entries")

print("\nDOCUMENTS IN METADATA BUT MISSING FROM INDEX:")
if missing_from_index:
    for doc_type in sorted(missing_from_index):
        print(f"  EXTRA: {doc_type}")
else:
    print("  OK: All metadata documents are in index")

print(f"\nSUMMARY:")
print(f"  Total in index: {len(index_types)}")
print(f"  Total in metadata: {len(metadata_types)}")
print(f"  Missing from metadata: {len(missing_from_metadata)}")
print(f"  Missing from index: {len(missing_from_index)}")
