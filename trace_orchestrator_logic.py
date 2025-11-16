#!/usr/bin/env python3
"""Trace the orchestrator logic step by step"""
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

# Get the job
cursor.execute("""
    SELECT id, name, org_id
    FROM jobs 
    WHERE status = 'running'
    LIMIT 1
""")
job = cursor.fetchone()

print("="*70)
print("ORCHESTRATOR LOGIC TRACE")
print("="*70)

print(f"\nJob: {job['name']} ({job['id']})")

# Step 1: Get current batch (line 603-611)
print("\n📍 Step 1: Get current batch number")
cursor.execute("""
    SELECT batch
    FROM job_tasks
    WHERE job_id = %s
    ORDER BY batch DESC
    LIMIT 1
""", (job['id'],))
latest = cursor.fetchone()

current_batch = latest['batch'] if latest else 0
print(f"   currentBatch = {current_batch}")

# Step 2: Check for pending tasks (line 614-624)
print("\n📍 Step 2: Check if current batch has pending tasks")
cursor.execute("""
    SELECT id, kind, status
    FROM job_tasks
    WHERE job_id = %s
      AND batch = %s
      AND status IN ('pending', 'running')
""", (job['id'], current_batch))
pending = cursor.fetchall()

print(f"   Found {len(pending)} pending tasks in batch {current_batch}")
for task in pending:
    print(f"     • Task {task['id']}: {task['kind']} ({task['status']})")

if len(pending) > 0:
    print(f"\n   ⚠️  WOULD SKIP: Job has pending tasks in current batch")
    print(f"   The orchestrator hits 'continue' at line 623")
    print(f"   This means it won't create a NEW batch or expand tasks")
    print(f"\n   ❌ PROBLEM IDENTIFIED!")
    print(f"   The tasks were created in a previous run but never expanded.")
    print(f"   Now they're blocking because they're still pending.")
else:
    print(f"   ✅ No pending tasks, would create next batch")

# Check when these tasks were created
if pending:
    print("\n📍 Task Creation Times")
    for task in pending:
        cursor.execute("""
            SELECT created_at
            FROM job_tasks
            WHERE id = %s
        """, (task['id'],))
        t = cursor.fetchone()
        print(f"     • Task {task['id']} created at: {t['created_at']}")

# Check the latest agent run
print("\n📍 Latest Agent Run")
cursor.execute("""
    SELECT id, started_at, ended_at, job_id
    FROM agent_runs
    WHERE org_id = %s
    ORDER BY started_at DESC
    LIMIT 1
""", (job['org_id'],))
run = cursor.fetchone()

if run:
    print(f"   Run ID: {run['id']}")
    print(f"   Started: {run['started_at']}")
    print(f"   Ended: {run['ended_at']}")
    print(f"   Job ID: {run['job_id']}")
    
    if run['job_id'] == job['id']:
        print(f"   ✅ This run was linked to our job")
    else:
        print(f"   ⚠️  This run was NOT linked to our job")

print("\n" + "="*70)
print("ROOT CAUSE")
print("="*70)
print("""
The orchestrator flow is:
1. Check if current batch has pending tasks
2. If YES: skip with 'continue' (don't process anything)
3. If NO: create next batch and expand those tasks

The problem:
- First run: batch 0 (empty) → creates batch 1 tasks → tries to expand
- Expansion must have failed or returned 0 cards silently
- Tasks remained in 'pending' state
- Second run: batch 1 has pending tasks → SKIPS (line 623 continue)
- Tasks never get processed again

Solution:
We need to either:
A) Mark the pending tasks as 'error' so they don't block
B) Fix why expansion failed the first time
C) Process pending tasks before checking if we should create new batch
""")

cursor.close()
conn.close()



