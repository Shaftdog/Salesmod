#!/usr/bin/env python3
"""Check which template was used for the latest cards"""
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

# Get job
cursor.execute("""
    SELECT id, name, cards_created
    FROM jobs 
    WHERE status = 'running'
    LIMIT 1
""")
job = cursor.fetchone()

print("="*70)
print(f"JOB: {job['name']}")
print("="*70)
print(f"Cards Created: {job['cards_created']}")

# Get latest cards
cursor.execute("""
    SELECT 
        id, title, rationale, 
        action_payload->>'subject' as subject,
        created_at
    FROM kanban_cards
    WHERE job_id = %s
    ORDER BY created_at DESC
    LIMIT 10
""", (job['id'],))
cards = cursor.fetchall()

if cards:
    print(f"\n✅ Found {len(cards)} cards!")
    print(f"\nFirst card:")
    print(f"  Title: {cards[0]['title']}")
    print(f"  Subject: {cards[0]['subject']}")
    print(f"  Rationale: {cards[0]['rationale']}")
    
    # Check which template was used
    rationale = cards[0]['rationale']
    if 'Day 0' in rationale or 'Initial Contact' in rationale:
        print(f"\n🎉 SUCCESS! Using Day 0 template ✅")
    elif 'Day 4' in rationale or 'Follow-up' in rationale:
        print(f"\n❌ WRONG! Still using Day 4 template")
    else:
        print(f"\n⚠️  Unknown template: {rationale}")
    
    print(f"\nAll card subjects:")
    for i, card in enumerate(cards, 1):
        print(f"  {i}. {card['subject']}")
else:
    print(f"\n❌ No cards found")

cursor.close()
conn.close()



