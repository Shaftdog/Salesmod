#!/usr/bin/env python3
"""Check the template syntax"""
import psycopg2
from psycopg2.extras import RealDictCursor
import json

DB_CONFIG = {
    'host': 'aws-1-us-east-1.pooler.supabase.com',
    'port': 5432,
    'user': 'postgres.zqhenxhgcjxslpfezybm',
    'password': 'NsjCsuLJfBswVhdI',
    'database': 'postgres'
}

conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
cursor = conn.cursor()

# Get job
cursor.execute("""
    SELECT params
    FROM jobs 
    WHERE status = 'running'
    LIMIT 1
""")
job = cursor.fetchone()

templates = job['params']['templates']

print("="*70)
print("TEMPLATE SYNTAX CHECK")
print("="*70)

day0_template = templates.get('Day 0 - Initial Contact')

if day0_template:
    print("\nDay 0 - Initial Contact Template:")
    print(f"\nSubject: {day0_template['subject']}")
    print(f"\nBody (first 200 chars):")
    print(day0_template['body'][:200])
    
    # Check for variable syntax issues
    body = day0_template['body']
    
    print("\n" + "="*70)
    print("ISSUES FOUND:")
    print("="*70)
    
    if '{{}first_name}}' in body:
        print("\n❌ ISSUE 1: Wrong variable syntax!")
        print("   Found: {{}first_name}} (double {{ on left, single } on right)")
        print("   Should be: {{first_name}} (double on both sides)")
    
    if 'Subject:' in body:
        print("\n❌ ISSUE 2: Subject line is in the body!")
        print("   The body should not include 'Subject:' line")
    
    if '\n\n' not in body:
        print("\n❌ ISSUE 3: No paragraph breaks!")
        print("   Body needs \\n\\n for paragraph separation")
    else:
        print("\n✅ Body has paragraph breaks")

cursor.close()
conn.close()



