#!/usr/bin/env python3
"""Check the job's templates"""
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

# Get the job
cursor.execute("""
    SELECT id, name, params
    FROM jobs 
    WHERE status = 'running'
    LIMIT 1
""")
job = cursor.fetchone()

print("="*70)
print("JOB TEMPLATES")
print("="*70)

templates = job['params'].get('templates', {})
print(f"\nTemplate keys (in order returned by Python):")
for i, key in enumerate(templates.keys()):
    print(f"  {i}: '{key}'")

print(f"\nTemplate details:")
for key, template in templates.items():
    print(f"\n📧 '{key}':")
    print(f"   Subject: {template.get('subject')}")
    print(f"   Body length: {len(template.get('body', ''))} chars")
    if len(template.get('body', '')) > 0:
        print(f"   Body preview: {template.get('body')[:100]}...")

# Get the task
cursor.execute("""
    SELECT id, input
    FROM job_tasks
    WHERE job_id = %s
      AND kind = 'draft_email'
    LIMIT 1
""", (job['id'],))
task = cursor.fetchone()

template_name = task['input'].get('template')
print(f"\n" + "="*70)
print(f"TASK IS USING: '{template_name}'")
print("="*70)

if template_name in templates:
    template = templates[template_name]
    print(f"✅ Template found!")
    print(f"   Subject: {template.get('subject')}")
    print(f"   Body length: {len(template.get('body', ''))} chars")
else:
    print(f"❌ Template '{template_name}' NOT FOUND in job templates!")
    print(f"   Available templates: {list(templates.keys())}")

cursor.close()
conn.close()



