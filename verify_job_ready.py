#!/usr/bin/env python3
"""
Verify the job is ready for the agent to process
"""
import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'aws-1-us-east-1.pooler.supabase.com',
    'port': 5432,
    'user': 'postgres.zqhenxhgcjxslpfezybm',
    'password': 'NsjCsuLJfBswVhdI',
    'database': 'postgres'
}

def check_status():
    conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
    cursor = conn.cursor()
    
    print("="*70)
    print("JOB STATUS VERIFICATION")
    print("="*70)
    
    # Check job
    cursor.execute("""
        SELECT 
            id, name, status, 
            params->'target_filter' as target_filter,
            params->'batch_size' as batch_size,
            total_tasks, completed_tasks, cards_created
        FROM jobs 
        WHERE status = 'running'
        LIMIT 1
    """)
    job = cursor.fetchone()
    
    if not job:
        print("\n❌ NO RUNNING JOBS FOUND")
        print("   Please start the job first.")
        cursor.close()
        conn.close()
        return False
    
    print(f"\n✅ Job Running: {job['name']}")
    print(f"   ID: {job['id']}")
    print(f"   Target Filter: {job['target_filter']}")
    print(f"   Batch Size: {job['batch_size']}")
    print(f"   Cards Created: {job['cards_created']}")
    
    # Check tasks
    cursor.execute("""
        SELECT batch, step, kind, status
        FROM job_tasks
        WHERE job_id = %s
        ORDER BY batch, step
    """, (job['id'],))
    tasks = cursor.fetchall()
    
    if tasks:
        print(f"\n📝 Current Tasks ({len(tasks)}):")
        for task in tasks:
            print(f"   Batch {task['batch']}, Step {task['step']}: {task['kind']} ({task['status']})")
    else:
        print(f"\n✅ No tasks yet (ready for batch 1 generation)")
    
    # Check if there are pending tasks that would block
    cursor.execute("""
        SELECT COUNT(*) as count
        FROM job_tasks
        WHERE job_id = %s
          AND status IN ('pending', 'running')
    """, (job['id'],))
    pending = cursor.fetchone()
    
    if pending['count'] > 0:
        print(f"\n⚠️  WARNING: {pending['count']} pending/running tasks")
        print(f"   Agent will skip this job until these complete")
    else:
        print(f"\n✅ No pending tasks blocking")
    
    # Test the contact query
    cursor.execute("""
        SELECT COUNT(*) as count
        FROM contacts c
        JOIN clients cl ON c.client_id = cl.id
        WHERE c.email IS NOT NULL
          AND cl.primary_role_code = 'amc_contact'
          AND cl.is_active = true
    """)
    contacts = cursor.fetchone()
    
    print(f"\n✅ Target Contacts: {contacts['count']} AMC contacts available")
    print(f"   (Will process {job['batch_size']} per batch)")
    
    # Sample contacts
    cursor.execute("""
        SELECT c.first_name, c.last_name, c.email, cl.company_name
        FROM contacts c
        JOIN clients cl ON c.client_id = cl.id
        WHERE c.email IS NOT NULL
          AND cl.primary_role_code = 'amc_contact'
          AND cl.is_active = true
        LIMIT 3
    """)
    samples = cursor.fetchall()
    
    if samples:
        print(f"\n📧 Sample Contacts:")
        for contact in samples:
            print(f"   • {contact['first_name']} {contact['last_name']} ({contact['email']})")
            print(f"     Company: {contact['company_name']}")
    
    # Final status
    print("\n" + "="*70)
    print("READINESS CHECK")
    print("="*70)
    
    checks = []
    checks.append(("Job is running", job is not None, True))
    checks.append(("Target filter configured", job['target_filter'] is not None, True))
    checks.append(("No pending tasks blocking", pending['count'] == 0, True))
    checks.append(("Contacts available", contacts['count'] > 0, True))
    
    all_ready = all(result == expected for _, result, expected in checks)
    
    for check_name, result, expected in checks:
        status = "✅" if result == expected else "❌"
        print(f"{status} {check_name}")
    
    if all_ready:
        print("\n🎉 JOB IS READY!")
        print("\nNext steps:")
        print("  1. Trigger the agent from your UI (/agent page)")
        print("  2. Or wait for the scheduled agent run")
        print("  3. The agent will create 10 email cards automatically")
        print("  4. Cards will appear with state='suggested' for your review")
    else:
        print("\n⚠️  Job not ready - see issues above")
    
    cursor.close()
    conn.close()
    return all_ready

if __name__ == '__main__':
    check_status()



