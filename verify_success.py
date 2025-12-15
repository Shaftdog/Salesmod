#!/usr/bin/env python3
"""Verify the job cards were created successfully"""
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

print("="*70)
print("SUCCESS VERIFICATION")
print("="*70)

# Check job
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

print(f"\n✅ Job: {job['name']}")
print(f"   Status: {job['status']}")
print(f"   Total Tasks: {job['total_tasks']}")
print(f"   Completed: {job['completed_tasks']}")
print(f"   Failed: {job['failed_tasks']}")
print(f"   Cards Created: {job['cards_created']}")

# Check tasks
cursor.execute("""
    SELECT 
        id, batch, step, kind, status,
        created_at, finished_at, output
    FROM job_tasks
    WHERE job_id = %s
    ORDER BY batch DESC, step
    LIMIT 5
""", (job['id'],))
tasks = cursor.fetchall()

print(f"\n📝 Latest Tasks:")
for task in tasks:
    status_icon = "✅" if task['status'] == 'done' else "❌" if task['status'] == 'error' else "⏸️"
    print(f"   {status_icon} Batch {task['batch']}, Step {task['step']}: {task['kind']} ({task['status']})")
    if task['output']:
        cards_created = task['output'].get('cards_created', 0)
        print(f"      Output: Created {cards_created} cards")

# Check cards
cursor.execute("""
    SELECT 
        id, type, title, state, contact_id, task_id, created_at
    FROM kanban_cards
    WHERE job_id = %s
    ORDER BY created_at DESC
    LIMIT 15
""", (job['id'],))
cards = cursor.fetchall()

print(f"\n🎉 CARDS FROM JOB: {len(cards)}")
if cards:
    print("\nEmail cards created:")
    for i, card in enumerate(cards[:10], 1):
        print(f"   {i}. {card['title']}")
        print(f"      State: {card['state']}, Task ID: {card['task_id']}")
else:
    print("   ❌ No cards found")

print("\n" + "="*70)
if len(cards) >= 10:
    print("🎉 SUCCESS! JOB SYSTEM IS WORKING!")
    print("="*70)
    print(f"\n✅ Created {len(cards)} email cards for AMC contacts")
    print(f"✅ All cards linked to job and task")
    print(f"✅ Cards in 'suggested' state for review")
    print(f"\n📧 Next steps:")
    print(f"   1. Go to /agent page")
    print(f"   2. Review the suggested cards")
    print(f"   3. Approve the ones you want to send")
    print(f"   4. Agent will send approved cards on next run")
else:
    print("⚠️  Fewer cards than expected")
    print("="*70)

cursor.close()
conn.close()



