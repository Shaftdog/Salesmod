#!/usr/bin/env python3
"""Diagnose why the agent didn't create cards"""
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

print("="*70)
print("AGENT RUN DIAGNOSTICS")
print("="*70)

# 1. Check latest agent run
print("\n1️⃣  LATEST AGENT RUN")
print("-"*70)
cursor.execute("""
    SELECT 
        id, org_id, status, started_at, ended_at,
        mode, planned_actions, approved, sent, 
        errors, job_id
    FROM agent_runs 
    ORDER BY started_at DESC 
    LIMIT 1
""")
run = cursor.fetchone()

if run:
    print(f"Run ID: {run['id']}")
    print(f"Status: {run['status']}")
    print(f"Started: {run['started_at']}")
    print(f"Ended: {run['ended_at']}")
    print(f"Mode: {run['mode']}")
    print(f"Planned Actions: {run['planned_actions']}")
    print(f"Job ID: {run['job_id']}")
    if run['errors']:
        print(f"\n❌ ERRORS:")
        print(json.dumps(run['errors'], indent=2))
else:
    print("❌ No agent runs found")

# 2. Check job status
print("\n2️⃣  JOB STATUS")
print("-"*70)
cursor.execute("""
    SELECT 
        id, name, status, 
        total_tasks, completed_tasks, failed_tasks,
        cards_created, last_run_at,
        params->'target_filter' as target_filter
    FROM jobs 
    WHERE status = 'running'
    LIMIT 1
""")
job = cursor.fetchone()

if job:
    print(f"Job: {job['name']}")
    print(f"Status: {job['status']}")
    print(f"Total Tasks: {job['total_tasks']}")
    print(f"Completed Tasks: {job['completed_tasks']}")
    print(f"Failed Tasks: {job['failed_tasks']}")
    print(f"Cards Created: {job['cards_created']}")
    print(f"Last Run: {job['last_run_at']}")
    print(f"Target Filter: {job['target_filter']}")
    
    job_id = job['id']
else:
    print("❌ No running jobs found")
    job_id = None

# 3. Check job tasks
if job_id:
    print("\n3️⃣  JOB TASKS")
    print("-"*70)
    cursor.execute("""
        SELECT 
            id, batch, step, kind, status,
            created_at, started_at, finished_at,
            error_message, input, output
        FROM job_tasks
        WHERE job_id = %s
        ORDER BY batch, step
    """, (job_id,))
    tasks = cursor.fetchall()
    
    if tasks:
        for task in tasks:
            print(f"\nTask {task['id']}:")
            print(f"  Batch: {task['batch']}, Step: {task['step']}")
            print(f"  Kind: {task['kind']}")
            print(f"  Status: {task['status']}")
            print(f"  Created: {task['created_at']}")
            print(f"  Input: {task['input']}")
            if task['output']:
                print(f"  Output: {task['output']}")
            if task['error_message']:
                print(f"  ❌ Error: {task['error_message']}")
    else:
        print("No tasks found - agent should have created batch 1")

# 4. Check cards created
print("\n4️⃣  CARDS FROM JOB")
print("-"*70)
if job_id:
    cursor.execute("""
        SELECT 
            id, type, title, state, 
            created_at, job_id, task_id
        FROM kanban_cards
        WHERE job_id = %s
        ORDER BY created_at DESC
    """, (job_id,))
    cards = cursor.fetchall()
    
    if cards:
        print(f"Found {len(cards)} cards:")
        for card in cards:
            print(f"\n  • {card['title']}")
            print(f"    Type: {card['type']}, State: {card['state']}")
            print(f"    Task ID: {card['task_id']}")
    else:
        print("❌ No cards created for this job")
else:
    print("Skipped - no job ID")

# 5. Check all recent cards
print("\n5️⃣  ALL RECENT CARDS (last 10)")
print("-"*70)
cursor.execute("""
    SELECT 
        id, type, title, state, job_id,
        created_at
    FROM kanban_cards
    ORDER BY created_at DESC
    LIMIT 10
""")
all_cards = cursor.fetchall()

if all_cards:
    for card in all_cards:
        job_label = f" [Job: {card['job_id']}]" if card['job_id'] else " [No job]"
        print(f"  • {card['title'][:60]}{job_label}")
        print(f"    State: {card['state']}, Created: {card['created_at']}")
else:
    print("No cards found in system")

# 6. Check if agent processed jobs at all
if run:
    print("\n6️⃣  AGENT PROCESSING CHECK")
    print("-"*70)
    
    if run['job_id']:
        print(f"✅ Agent linked to job: {run['job_id']}")
    else:
        print("⚠️  Agent run not linked to any job")
        print("   This means processActiveJobs() might not have found the job")
    
    # Check what the orchestrator would have seen
    cursor.execute("""
        SELECT id, name, status, created_at
        FROM jobs
        WHERE org_id = %s
          AND status = 'running'
        ORDER BY created_at
    """, (run['org_id'],))
    
    should_have_seen = cursor.fetchall()
    print(f"\nJobs that should have been processed:")
    if should_have_seen:
        for j in should_have_seen:
            print(f"  • {j['name']} (status: {j['status']})")
    else:
        print("  None found!")

# 7. Final diagnosis
print("\n" + "="*70)
print("DIAGNOSIS")
print("="*70)

issues = []

if not run:
    issues.append("No agent run found - agent may not have run at all")
elif run['status'] == 'failed':
    issues.append(f"Agent run FAILED - check errors above")
elif run['planned_actions'] == 0:
    issues.append("Agent created 0 planned_actions (normal plan + job cards)")

if job and job['last_run_at'] is None:
    issues.append("Job's last_run_at is NULL - agent didn't process it")

if job_id and not tasks:
    issues.append("No tasks created - job planner didn't generate batch 1")

if issues:
    print("\n❌ ISSUES FOUND:\n")
    for i, issue in enumerate(issues, 1):
        print(f"{i}. {issue}")
else:
    print("\n✅ No obvious issues - need to check application logs")

cursor.close()
conn.close()



