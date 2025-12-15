#!/usr/bin/env python3
"""Start the pending job"""
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

# Get the pending job
cursor.execute("""
    SELECT id, name, status, org_id
    FROM jobs 
    WHERE status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1
""")
job = cursor.fetchone()

if not job:
    print("No pending jobs found")
else:
    print(f"Found job: {job['name']}")
    print(f"  ID: {job['id']}")
    print(f"  Current status: {job['status']}")
    
    # Use the transition_job_status function to start it
    cursor.execute("""
        SELECT transition_job_status(%s::uuid, 'running')
    """, (job['id'],))
    
    conn.commit()
    
    # Verify it's running
    cursor.execute("""
        SELECT id, name, status, started_at
        FROM jobs 
        WHERE id = %s
    """, (job['id'],))
    
    updated_job = cursor.fetchone()
    print(f"\n✅ Job started!")
    print(f"  Status: {updated_job['status']}")
    print(f"  Started at: {updated_job['started_at']}")
    print(f"\nThe agent will process this job on its next run.")

cursor.close()
conn.close()



