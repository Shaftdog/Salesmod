#!/usr/bin/env python3
"""Check current job status and tasks"""
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

# Check jobs
print("=" * 70)
print("CURRENT JOBS")
print("=" * 70)
cursor.execute("""
    SELECT 
        id, name, status, created_at, started_at,
        total_tasks, completed_tasks, failed_tasks,
        cards_created, params
    FROM jobs 
    ORDER BY created_at DESC
""")
jobs = cursor.fetchall()

if jobs:
    for job in jobs:
        print(f"\nJob ID: {job['id']}")
        print(f"  Name: {job['name']}")
        print(f"  Status: {job['status']}")
        print(f"  Created: {job['created_at']}")
        print(f"  Started: {job['started_at']}")
        print(f"  Tasks: {job['completed_tasks']}/{job['total_tasks']} completed, {job['failed_tasks']} failed")
        print(f"  Cards Created: {job['cards_created']}")
        print(f"  Params: {job['params']}")
else:
    print("\nNo jobs found")

# Check job tasks
print("\n" + "=" * 70)
print("JOB TASKS")
print("=" * 70)
cursor.execute("""
    SELECT 
        jt.id, jt.job_id, jt.step, jt.batch, jt.kind, jt.status,
        jt.input, jt.output, jt.error_message, jt.retry_count,
        j.name as job_name
    FROM job_tasks jt
    JOIN jobs j ON j.id = jt.job_id
    ORDER BY jt.created_at DESC
""")
tasks = cursor.fetchall()

if tasks:
    for task in tasks:
        print(f"\nTask ID: {task['id']}")
        print(f"  Job: {task['job_name']} ({task['job_id']})")
        print(f"  Step: {task['step']}, Batch: {task['batch']}")
        print(f"  Kind: {task['kind']}")
        print(f"  Status: {task['status']}")
        print(f"  Input: {task['input']}")
        print(f"  Output: {task['output']}")
        if task['error_message']:
            print(f"  Error: {task['error_message']}")
        print(f"  Retry Count: {task['retry_count']}")
else:
    print("\nNo job tasks found")

# Check agent_runs
print("\n" + "=" * 70)
print("RECENT AGENT RUNS")
print("=" * 70)
cursor.execute("""
    SELECT id, status, started_at, ended_at, job_id, result
    FROM agent_runs 
    ORDER BY started_at DESC 
    LIMIT 5
""")
runs = cursor.fetchall()

if runs:
    for run in runs:
        print(f"\nRun ID: {run['id']}")
        print(f"  Status: {run['status']}")
        print(f"  Started: {run['started_at']}")
        print(f"  Ended: {run['ended_at']}")
        print(f"  Job ID: {run['job_id']}")
        print(f"  Result: {run['result']}")
else:
    print("\nNo agent runs found")

cursor.close()
conn.close()



