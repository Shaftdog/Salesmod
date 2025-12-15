#!/usr/bin/env python3
"""Test why expandTaskToCards returned 0 cards"""
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
print("TESTING CONTACT QUERY")
print("="*70)

# Get the job
cursor.execute("""
    SELECT id, params
    FROM jobs 
    WHERE status = 'running'
    LIMIT 1
""")
job = cursor.fetchone()

# Get the draft_email task
cursor.execute("""
    SELECT id, input
    FROM job_tasks
    WHERE job_id = %s
      AND kind = 'draft_email'
      AND status = 'pending'
    LIMIT 1
""", (job['id'],))
task = cursor.fetchone()

print(f"\nTask Input: {task['input']}")
print(f"Target Filter: {task['input'].get('target_filter')}")

# Simulate what expandTaskToCards does
target_filter = task['input'].get('target_filter', {})
contact_ids = task['input'].get('contact_ids', [])

print(f"\n--- Simulating expandTaskToCards Query ---")

if contact_ids and len(contact_ids) > 0:
    print(f"Using explicit contact_ids: {contact_ids}")
    cursor.execute("""
        SELECT 
            c.id,
            c.first_name,
            c.last_name,
            c.email,
            c.client_id,
            cl.company_name
        FROM contacts c
        JOIN clients cl ON c.client_id = cl.id
        WHERE c.id = ANY(%s)
          AND c.email IS NOT NULL
    """, (contact_ids,))
else:
    print("Using target_filter query")
    
    # Build query based on filter
    query = """
        SELECT 
            c.id,
            c.first_name,
            c.last_name,
            c.email,
            c.client_id,
            cl.company_name
        FROM contacts c
        JOIN clients cl ON c.client_id = cl.id
        WHERE c.email IS NOT NULL
    """
    
    conditions = []
    params = []
    
    if target_filter.get('client_type'):
        conditions.append("cl.client_type = %s")
        params.append(target_filter['client_type'])
    
    if target_filter.get('primary_role_code'):
        conditions.append("cl.primary_role_code = %s")
        params.append(target_filter['primary_role_code'])
    
    if target_filter.get('is_active') is not None:
        conditions.append("cl.is_active = %s")
        params.append(target_filter['is_active'])
    
    if conditions:
        query += " AND " + " AND ".join(conditions)
    
    # Add limit
    batch_size = job['params'].get('batch_size', 10)
    query += f" LIMIT {batch_size}"
    
    print(f"\nQuery:\n{query}")
    print(f"Params: {params}")
    
    cursor.execute(query, params)

contacts = cursor.fetchall()

print(f"\n✅ Query returned {len(contacts)} contacts")

if len(contacts) == 0:
    print("\n❌ PROBLEM: Query returned 0 contacts!")
    print("\nDebugging: Let's check each condition separately...")
    
    # Check without any filter
    cursor.execute("""
        SELECT COUNT(*) as count
        FROM contacts c
        WHERE c.email IS NOT NULL
    """)
    total = cursor.fetchone()
    print(f"  • Total contacts with email: {total['count']}")
    
    # Check with join
    cursor.execute("""
        SELECT COUNT(*) as count
        FROM contacts c
        JOIN clients cl ON c.client_id = cl.id
        WHERE c.email IS NOT NULL
    """)
    with_join = cursor.fetchone()
    print(f"  • With client join: {with_join['count']}")
    
    # Check with primary_role_code
    if target_filter.get('primary_role_code'):
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM contacts c
            JOIN clients cl ON c.client_id = cl.id
            WHERE c.email IS NOT NULL
              AND cl.primary_role_code = %s
        """, (target_filter['primary_role_code'],))
        with_role = cursor.fetchone()
        print(f"  • With primary_role_code = '{target_filter['primary_role_code']}': {with_role['count']}")
    
    # Check with is_active
    if target_filter.get('is_active') is not None:
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM contacts c
            JOIN clients cl ON c.client_id = cl.id
            WHERE c.email IS NOT NULL
              AND cl.primary_role_code = %s
              AND cl.is_active = %s
        """, (target_filter['primary_role_code'], target_filter['is_active']))
        with_active = cursor.fetchone()
        print(f"  • With is_active = {target_filter['is_active']}: {with_active['count']}")

else:
    print(f"\n✅ SUCCESS: Would create {len(contacts)} email cards")
    print("\nSample contacts:")
    for i, contact in enumerate(contacts[:3], 1):
        print(f"  {i}. {contact['first_name']} {contact['last_name']} ({contact['email']})")
        print(f"     Company: {contact['company_name']}")

cursor.close()
conn.close()



