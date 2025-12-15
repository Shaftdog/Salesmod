#!/usr/bin/env python3
"""Fix template syntax issues"""
import psycopg2
from psycopg2.extras import RealDictCursor, Json
import re

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
    SELECT id, name, params
    FROM jobs 
    WHERE status = 'running'
    LIMIT 1
""")
job = cursor.fetchone()

print(f"Fixing templates for job: {job['name']}")

params = job['params'].copy()
templates = params['templates'].copy()

print("\nFixing templates...")

for template_name, template in templates.items():
    body = template['body']
    
    # Fix 1: Remove "Subject:" line from body if present
    if body.startswith('Subject:'):
        # Remove first line (subject line)
        lines = body.split('\n')
        body = '\n'.join(lines[1:]).strip()
        print(f"\n  ✅ {template_name}: Removed subject from body")
    
    # Fix 2: Fix variable syntax {{}first_name}} -> {{first_name}}
    # Replace {{}xxx}} with {{xxx}}
    fixed_body = re.sub(r'\{\{\}(\w+)\}\}', r'{{\1}}', body)
    
    if fixed_body != body:
        print(f"  ✅ {template_name}: Fixed variable syntax")
        body = fixed_body
    
    # Update template
    templates[template_name]['body'] = body

# Update job params
params['templates'] = templates

cursor.execute("""
    UPDATE jobs
    SET params = %s
    WHERE id = %s
""", (Json(params), job['id']))

conn.commit()

print("\n✅ Templates fixed!")
print("\nFixed issues:")
print("  1. Removed 'Subject:' line from body")
print("  2. Fixed variable syntax: {{}first_name}} → {{first_name}}")

# Show a sample
print("\nSample (Day 0 body, first 200 chars):")
print(templates['Day 0 - Initial Contact']['body'][:200])

cursor.close()
conn.close()

