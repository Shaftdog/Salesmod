#!/usr/bin/env python3
"""Fix the job's target_filter to use correct field names"""
import psycopg2
import json
from psycopg2.extras import RealDictCursor, Json

DB_CONFIG = {
    'host': 'aws-1-us-east-1.pooler.supabase.com',
    'port': 5432,
    'user': 'postgres.zqhenxhgcjxslpfezybm',
    'password': 'NsjCsuLJfBswVhdI',
    'database': 'postgres'
}

conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
cursor = conn.cursor()

# Get the running job
cursor.execute("""
    SELECT id, name, params
    FROM jobs 
    WHERE status = 'running'
    LIMIT 1
""")
job = cursor.fetchone()

print(f"Job: {job['name']}")
print(f"Current target_filter: {job['params'].get('target_filter')}")

# Update the params with correct target_filter
params = job['params'].copy()
params['target_filter'] = {
    'primary_role_code': 'amc_contact',  # Match AMC contacts
    'is_active': True                     # Only active clients
}

print(f"\nUpdating to:")
print(f"  primary_role_code: amc_contact")
print(f"  is_active: True")

# Update the job
cursor.execute("""
    UPDATE jobs
    SET params = %s
    WHERE id = %s
""", (Json(params), job['id']))

conn.commit()

# Verify
cursor.execute("""
    SELECT id, name, params
    FROM jobs 
    WHERE id = %s
""", (job['id'],))

updated_job = cursor.fetchone()
print(f"\n✅ Job updated!")
print(f"New target_filter: {updated_job['params'].get('target_filter')}")

# Test the query to see how many contacts will be found
cursor.execute("""
    SELECT COUNT(*) as count
    FROM contacts c
    JOIN clients cl ON c.client_id = cl.id
    WHERE c.email IS NOT NULL
      AND cl.primary_role_code = 'amc_contact'
      AND cl.is_active = true
""")

result = cursor.fetchone()
print(f"\n📧 Found {result['count']} contacts matching the filter")
print(f"   (Job will process {params.get('batch_size', 10)} per batch)")

cursor.close()
conn.close()



