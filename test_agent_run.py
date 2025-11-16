#!/usr/bin/env python3
"""Test what happened in the latest agent run"""
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

# Get the latest run
cursor.execute("""
    SELECT 
        id, org_id, status, started_at, ended_at,
        mode, planned_actions, job_id, errors
    FROM agent_runs 
    ORDER BY started_at DESC 
    LIMIT 1
""")
run = cursor.fetchone()

print(f"\n🤖 Latest Agent Run:")
print(f"   ID: {run['id']}")
print(f"   Status: {run['status']}")
print(f"   Started: {run['started_at']}")
print(f"   Ended: {run['ended_at']}")
print(f"   Planned Actions: {run['planned_actions']}")
print(f"   Job ID: {run['job_id']}")

if run['errors']:
    print(f"\n❌ Errors:")
    print(json.dumps(run['errors'], indent=2))

# Check job status
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
    print(f"Status: {job['status']}")
    print(f"Total Tasks: {job['total_tasks']}")
    print(f"Completed: {job['completed_tasks']}")
    print(f"Failed: {job['failed_tasks']}")
    print(f"Cards Created: {job['cards_created']}")
    print(f"Last Run: {job['last_run_at']}")
    
    job_id = job['id']
    
    # Check if last_run_at was updated
    if job['last_run_at'] and run['started_at']:
        from datetime import datetime
        last_run = job['last_run_at']
        agent_start = run['started_at']
        
        # Check if they're close (agent processed this job)
        if isinstance(last_run, str):
            last_run = datetime.fromisoformat(last_run.replace('Z', '+00:00'))
        if isinstance(agent_start, str):
            agent_start = datetime.fromisoformat(agent_start.replace('Z', '+00:00'))
        
        diff = abs((agent_start - last_run).total_seconds())
        
        if diff < 300:  # Within 5 minutes
            print(f"\n✅ Agent DID process this job (times match)")
        else:
            print(f"\n❌ Agent did NOT process this job recently")
            print(f"   Time difference: {diff} seconds")
else:
    print("\n❌ No running jobs found")
    job_id = None

# Check job tasks
if job_id:
    print("\n" + "="*70)
    print("JOB TASKS")
    print("="*70)
    
    cursor.execute("""
        SELECT 
            id, batch, step, kind, status,
            created_at, finished_at, error_message
        FROM job_tasks
        WHERE job_id = %s
        ORDER BY batch DESC, step
        LIMIT 5
    """, (job_id,))
    tasks = cursor.fetchall()
    
    if tasks:
        print(f"\nLatest {len(tasks)} tasks:")
        for task in tasks:
            print(f"\n  • Task {task['id']}")
            print(f"    Batch: {task['batch']}, Step: {task['step']}")
            print(f"    Kind: {task['kind']}")
            print(f"    Status: {task['status']}")
            print(f"    Created: {task['created_at']}")
            if task['error_message']:
                print(f"    Error: {task['error_message']}")
    else:
        print("\n⚠️  No tasks created yet")
        print("   This means processActiveJobs() either:")
        print("   1. Didn't run at all")
        print("   2. Ran but skipped the job")
        print("   3. Failed before creating tasks")

# Check cards created by this run
print("\n" + "="*70)
print("CARDS FROM THIS RUN")
print("="*70)

cursor.execute("""
    SELECT 
        id, type, title, state, job_id,
        created_at
    FROM kanban_cards
    WHERE run_id = %s
    ORDER BY created_at DESC
    LIMIT 10
""", (run['id'],))
cards = cursor.fetchall()

print(f"\nCards created by this run: {len(cards)}")
job_cards = [c for c in cards if c['job_id']]
non_job_cards = [c for c in cards if not c['job_id']]

print(f"  • From job: {len(job_cards)}")
print(f"  • Regular (no job): {len(non_job_cards)}")

if non_job_cards:
    print(f"\n✅ Regular cards created (agent ran successfully):")
    for card in non_job_cards[:3]:
        print(f"  • {card['title'][:60]}")

if not job_cards:
    print(f"\n❌ NO job cards created")

# Check the run_id on the job
if run['job_id']:
    print(f"\n✅ Run was linked to job_id: {run['job_id']}")
    if job_id and run['job_id'] != job_id:
        print(f"   ⚠️  But that's a DIFFERENT job than our running job!")
else:
    print(f"\n❌ Run was NOT linked to any job")
    print(f"   This means processActiveJobs() found 0 active jobs")

print("\n" + "="*70)
print("DIAGNOSIS")
print("="*70)

# Diagnose
issues = []

if not run['job_id']:
    issues.append("Agent run not linked to job - processActiveJobs() didn't find it")

if job and job['last_run_at'] is None:
    issues.append("Job's last_run_at is NULL - job was never processed")

if job and job['total_tasks'] == 0:
    issues.append("No tasks created - planNextBatch() returned empty or failed")

if len(cards) > 0 and len(job_cards) == 0:
    issues.append("Agent created regular cards but no job cards - job processing was skipped")

if issues:
    print("\n❌ ISSUES FOUND:\n")
    for i, issue in enumerate(issues, 1):
        print(f"{i}. {issue}")
else:
    print("\n✅ No obvious issues")

cursor.close()
conn.close()



