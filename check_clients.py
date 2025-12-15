#!/usr/bin/env python3
"""Check what clients and contacts exist"""
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
    SELECT id, name, params
    FROM jobs 
    WHERE status = 'running'
    LIMIT 1
""")
job = cursor.fetchone()

print("="*70)
print("JOB DETAILS")
print("="*70)
print(f"Name: {job['name']}")
print(f"Target group: {job['params'].get('target_group')}")
print(f"Target filter: {job['params'].get('target_filter')}")
print(f"Batch size: {job['params'].get('batch_size')}")

# Check clients
print("\n" + "="*70)
print("CLIENTS")
print("="*70)
cursor.execute("""
    SELECT id, company_name, client_type, state, active
    FROM clients
    ORDER BY company_name
    LIMIT 20
""")
clients = cursor.fetchall()

print(f"\nFound {len(clients)} clients:\n")
for client in clients:
    print(f"  • {client['company_name']}")
    print(f"    Type: {client['client_type']}, State: {client['state']}, Active: {client['active']}")

# Check distinct client types
cursor.execute("""
    SELECT DISTINCT client_type
    FROM clients
    ORDER BY client_type
""")
types = cursor.fetchall()
print(f"\nDistinct client types: {[t['client_type'] for t in types]}")

# Check contacts
print("\n" + "="*70)
print("CONTACTS WITH EMAIL")
print("="*70)
cursor.execute("""
    SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        cl.company_name,
        cl.client_type
    FROM contacts c
    JOIN clients cl ON c.client_id = cl.id
    WHERE c.email IS NOT NULL
    ORDER BY cl.company_name
    LIMIT 20
""")
contacts = cursor.fetchall()

print(f"\nFound {len(contacts)} contacts with emails:\n")
for contact in contacts:
    print(f"  • {contact['first_name']} {contact['last_name']} ({contact['email']})")
    print(f"    Company: {contact['company_name']} (Type: {contact['client_type']})")

cursor.close()
conn.close()



