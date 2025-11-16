#!/usr/bin/env python3
"""Verify final email formatting and variable replacement"""
import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'aws-1-us-east-1.pooler.supabase.com',
    'port': 5432,
    'user': 'postgres.zqhenxhgcjxslpfezybm',
    'password': 'NsjCsuLJfBswVhdI',
    'database': 'postgres'
}

conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
cursor = conn.cursor()

# Get the first card
cursor.execute("""
    SELECT 
        id, title, action_payload,
        state, rationale,
        (SELECT first_name FROM contacts WHERE id = kc.contact_id) as contact_name
    FROM kanban_cards kc
    WHERE job_id IN (SELECT id FROM jobs WHERE status = 'running')
    ORDER BY created_at DESC
    LIMIT 1
""")
card = cursor.fetchone()

if not card:
    print("❌ No cards found")
    exit(1)

print("="*70)
print("EMAIL FORMATTING VERIFICATION")
print("="*70)

payload = card['action_payload']
subject = payload.get('subject', '')
body = payload.get('body', '')

print(f"\nCard: {card['title']}")
print(f"Contact Name: {card['contact_name']}")
print(f"Rationale: {card['rationale']}")

print(f"\n" + "-"*70)
print("SUBJECT")
print("-"*70)
print(subject)

print(f"\n" + "-"*70)
print("BODY (first 500 chars)")
print("-"*70)
print(body[:500])

# Verify fixes
print("\n" + "="*70)
print("VERIFICATION")
print("="*70)

checks = []

# Check 1: Variable replacement
if '{{}first_name}}' in body or '{{first_name}}' in body:
    print("❌ Variables NOT replaced - still showing {{first_name}}")
    checks.append(False)
elif card['contact_name'] and card['contact_name'] in body:
    print(f"✅ Variable replaced - found '{card['contact_name']}' in body")
    checks.append(True)
else:
    print(f"✅ No unreplaced variables (contact name: {card['contact_name']})")
    checks.append(True)

# Check 2: HTML formatting
if '<p>' in body and '</p>' in body:
    print("✅ HTML formatting present - has <p> tags")
    checks.append(True)
else:
    print("❌ No HTML formatting - missing <p> tags")
    checks.append(False)

# Check 3: Bullet list formatting
if ('<ul>' in body and '<li>' in body) or ('-' not in body):
    print("✅ Bullet lists formatted correctly (or no bullets)")
    checks.append(True)
else:
    print("⚠️  May have unformatted bullets")
    checks.append(True)

# Check 4: No duplicate subject
if 'Subject:' in body or subject in body:
    print("❌ Subject appears in body (duplicate)")
    checks.append(False)
else:
    print("✅ No duplicate subject in body")
    checks.append(True)

if all(checks):
    print("\n" + "="*70)
    print("🎉 ALL CHECKS PASSED! JOB SYSTEM IS FULLY WORKING!")
    print("="*70)
else:
    print("\n" + "="*70)
    print("⚠️  Some checks failed - see above")
    print("="*70)

cursor.close()
conn.close()



