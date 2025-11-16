#!/usr/bin/env python3
"""Check the actual schema"""
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

# Check clients schema
print("="*70)
print("CLIENTS TABLE COLUMNS")
print("="*70)
cursor.execute("""
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'clients'
    ORDER BY ordinal_position
""")
columns = cursor.fetchall()

for col in columns:
    print(f"  {col['column_name']:<30} {col['data_type']}")

# Get some sample clients
print("\n" + "="*70)
print("SAMPLE CLIENTS")
print("="*70)
cursor.execute("""
    SELECT *
    FROM clients
    LIMIT 5
""")
clients = cursor.fetchall()

if clients:
    for client in clients:
        print(f"\nClient: {client.get('company_name') or client.get('name') or 'N/A'}")
        for key, value in client.items():
            if value is not None:
                print(f"  {key}: {value}")
else:
    print("No clients found")

# Check contacts schema
print("\n" + "="*70)
print("CONTACTS TABLE COLUMNS")
print("="*70)
cursor.execute("""
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'contacts'
    ORDER BY ordinal_position
""")
columns = cursor.fetchall()

for col in columns:
    print(f"  {col['column_name']:<30} {col['data_type']}")

# Get sample contacts with emails
print("\n" + "="*70)
print("SAMPLE CONTACTS WITH EMAILS")
print("="*70)
cursor.execute("""
    SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.client_id
    FROM contacts c
    WHERE c.email IS NOT NULL
    LIMIT 10
""")
contacts = cursor.fetchall()

print(f"\nFound {len(contacts)} contacts with emails\n")
for contact in contacts:
    print(f"  • {contact['first_name']} {contact['last_name']}")
    print(f"    Email: {contact['email']}")
    print(f"    Client ID: {contact['client_id']}")

cursor.close()
conn.close()



