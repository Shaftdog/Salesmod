#!/usr/bin/env python3
"""Check what happened in the latest agent run"""
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
print("LATEST AGENT RUN ANALYSIS")
print("="*70)

# 1. Check latest run
cursor.execute("""
    SELECT 
        id, org_id, status, started_at, ended_at,
        mode, planned_actions, job_id, errors
    FROM agent_runs 
    ORDER BY started_at DESC 
    LIMIT 1
""")
run = cursor.fetchone()

print(f"\n🤖 Latest Run:")
print(f"   Started: {run['started_at']}")
print(f"   Ended: {run['ended_at']}")
print(f"   Planned Actions: {run['planned_actions']}")
print(f"   Job ID: {run['job_id']}")
if run['errors']:
    print(f"   Errors: {json.dumps(run['errors'], indent=2)}")

# 2. Check job status
print("\n" + "="*70)
print("JOB STATUS")
print("="*70)

cursor.execute("""
    SELECT 
        id, name, status, 
        total_tasks, completed_tasks, failed_tasks,
        cards_created, last_run_at
    FROM jobs 
    WHERE status = 'running'
    LIMIT 1
""")
job = cursor.fetchone()

if job:
    print(f"\nJob: {job['name']}")
    print(f"Total Tasks: {job['total_tasks']}")
    print(f"Completed: {job['completed_tasks']}")
    print(f"Failed: {job['failed_tasks']}")
    print(f"Cards Created: {job['cards_created']}")
    print(f"Last Run: {job['last_run_at']}")
    
    # 3. Check job tasks
    print("\n" + "="*70)
    print("JOB TASKS")
    print("="*70)
    
    cursor.execute("""
        SELECT 
            id, batch, step, kind, status,
            error_message, created_at
        FROM job_tasks
        WHERE job_id = %s
        ORDER BY batch DESC, step
        LIMIT 5
    """, (job['id'],))
    tasks = cursor.fetchall()
    
    if tasks:
        for task in tasks:
            status_icon = "✅" if task['status'] == 'done' else "❌" if task['status'] == 'error' else "⏸️"
            print(f"\n  {status_icon} Task {task['id']}")
            print(f"     Batch: {task['batch']}, Step: {task['step']}")
            print(f"     Kind: {task['kind']}")
            print(f"     Status: {task['status']}")
            if task['error_message']:
                print(f"     Error: {task['error_message']}")
    else:
        print("\n  ❌ No tasks found")
    
    # 4. Check job cards
    print("\n" + "="*70)
    print("CARDS FROM JOB")
    print("="*70)
    
    cursor.execute("""
        SELECT 
            id, type, title, state, task_id, created_at
        FROM kanban_cards
        WHERE job_id = %s
        ORDER BY created_at DESC
        LIMIT 10
    """, (job['id'],))
    cards = cursor.fetchall()
    
    if cards:
        print(f"\n  ✅ Found {len(cards)} cards from job:")
        for card in cards:
            print(f"     • {card['title'][:60]}")
            print(f"       State: {card['state']}, Task ID: {card['task_id']}")
    else:
        print("\n  ❌ No cards linked to this job")

# 5. Check cards from this run (not necessarily job-linked)
print("\n" + "="*70)
print("ALL CARDS FROM THIS RUN")
print("="*70)

cursor.execute("""
    SELECT 
        id, type, title, job_id, created_at
    FROM kanban_cards
    WHERE run_id = %s
    ORDER BY created_at DESC
""", (run['id'],))
run_cards = cursor.fetchall()

job_linked = [c for c in run_cards if c['job_id']]
non_job = [c for c in run_cards if not c['job_id']]

print(f"\n  Total cards from run: {len(run_cards)}")
print(f"    • Job-linked: {len(job_linked)}")
print(f"    • Regular (no job): {len(non_job)}")

if non_job:
    print(f"\n  Regular cards:")
    for card in non_job[:5]:
        print(f"     • {card['title'][:60]}")

cursor.close()
conn.close()



