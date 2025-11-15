# 🧪 CRM Phase 1 - Testing Guide

## ⚠️ **IMPORTANT: Run Migration First!**

Before testing, you MUST run the CRM migration:

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/zqhenxhgcjxslpfezybm/sql)
2. Click "+ New query"
3. Open `supabase-crm-migration.sql` in your IDE
4. Copy ALL the SQL
5. Paste into Supabase and click "Run"
6. Wait for "Success" message

---

## 🧪 **Test 1: Enhanced Client Detail Page**

### What to Test:
The client detail page now has tabs for Contacts, Activities, and Orders

### Steps:
1. Go to [http://localhost:9002/clients](http://localhost:9002/clients)
2. Click on "Acme Real Estate" card
3. **Expected:** You should see:
   - ✅ 4 stat cards at top (Active Orders, Revenue, Contacts, Activities)
   - ✅ Client info card with tag selector
   - ✅ Tabs: Contacts | Activity | Orders

**Screenshot this page - you should see the new layout!**

---

## 🧪 **Test 2: Add a Contact**

### Steps:
1. On the client detail page, make sure you're on "Contacts" tab
2. Click "Add Contact" button
3. Fill out the form:
   - First Name: Sara
   - Last Name: Johnson
   - Title: Senior Loan Officer
   - Email: sara.johnson@acmerealestate.com
   - Phone: (415) 555-7890
   - Department: Residential Lending
   - ✅ Check "Primary Contact"
4. Click "Add Contact"

**Expected Result:**
- ✅ Contact card appears
- ✅ Shows star badge for "Primary"
- ✅ Email and phone are clickable links
- ✅ Success toast notification

---

## 🧪 **Test 3: Add More Contacts**

Add 2-3 more contacts to test the full experience:

**Contact 2:**
- Name: Mike Chen
- Title: Branch Manager
- Email: mike.chen@acmerealestate.com
- Phone: (415) 555-7891
- Department: Management

**Contact 3:**
- Name: Lisa Brown
- Title: Processor
- Email: lisa.brown@acmerealestate.com
- Phone: (415) 555-7892
- Department: Processing

**Expected:** Multiple contact cards displayed

---

## 🧪 **Test 4: Log an Activity**

### Steps:
1. Click the "Activity" tab
2. Click "Log Activity" button
3. Fill out:
   - Activity Type: **Call**
   - Status: **Completed**
   - Subject: "Quarterly review call"
   - Description: "Discussed current order volume and upcoming needs"
   - Duration: 15 (minutes)
   - Outcome: "Positive - expect 10% increase next quarter"
4. Click "Log Activity"

**Expected Result:**
- ✅ Activity appears in timeline
- ✅ Blue phone icon
- ✅ Shows your name and timestamp
- ✅ All details visible

---

## 🧪 **Test 5: Log Different Activity Types**

Test each activity type to see different icons/colors:

1. **Email** (Green) - "Sent proposal for new service tier"
2. **Meeting** (Purple) - "Lunch meeting with branch manager"
3. **Note** (Yellow) - "Client prefers rush orders, willing to pay premium"

**Expected:** Timeline shows all activities with different colored icons

---

## 🧪 **Test 6: Add Tags**

### Steps:
1. Scroll to "Client Information" card
2. Under "Tags" section, click "Add Tag"
3. Select "VIP" from the dropdown
4. Click another tag: "High Volume"
5. Tag badges appear

**Expected Result:**
- ✅ Colored tag badges appear
- ✅ Can remove tags by clicking X
- ✅ Dropdown shows only unselected tags

---

## 🧪 **Test 7: Tags on Client Card**

### Steps:
1. Go back to [http://localhost:9002/clients](http://localhost:9002/clients)
2. Look at the "Acme Real Estate" card

**Expected Result:**
- ✅ Tags appear below the email/phone
- ✅ Shows first 3 tags
- ✅ If more than 3: "+X more" indicator

---

## 🧪 **Test 8: Auto-Activity Logging**

### Steps:
1. Create a NEW order for "Acme Real Estate"
2. Fill out the order form completely
3. Submit the order
4. Go back to Acme Real Estate client detail
5. Click "Activity" tab

**Expected Result:**
- ✅ New activity auto-logged
- ✅ Type: "note"
- ✅ Subject: "New order created: APR-2025-XXXX"
- ✅ Description includes property address and fee
- ✅ Timestamp is when order was created

---

## 🧪 **Test 9: Orders Tab**

### Steps:
1. On client detail page, click "Orders" tab

**Expected Result:**
- ✅ Shows all orders for this client
- ✅ Same orders table as main orders page
- ✅ Filtered to just this client

---

## 🧪 **Test 10: Navigation & Stats**

### Steps:
1. Add 2-3 contacts
2. Log 3-4 activities
3. Look at the stat cards at top

**Expected Result:**
- ✅ "Contacts" count updates
- ✅ "Activities" count updates  
- ✅ Stats are real-time

---

## ✅ **Success Checklist**

After testing, you should have:
- [ ] Created at least 2-3 contacts per client
- [ ] Logged 3-4 different activity types
- [ ] Added 2-3 tags to the client
- [ ] Verified auto-activity logging works
- [ ] Seen the enhanced client detail page
- [ ] Confirmed stats update in real-time
- [ ] Tested adding/removing tags
- [ ] Verified contacts show on detail page

---

## 📸 **What to Look For**

### Enhanced Client Detail Page Should Have:
```
Top Section:
- Client name and primary contact
- "+ New Order" button

Stats Row (4 cards):
- Active Orders: X
- Total Revenue: $X,XXX
- Contacts: X  
- Activities: X

Client Info Card:
- Email, Phone, Address, Payment Terms
- Tags section with "Add Tag" button

Tabs:
- Contacts (with Add Contact button)
- Activity (with Log Activity button)
- Orders (filtered list)
```

### Activity Timeline Should Show:
- Colored icon for each activity type
- Subject line (bold)
- Description
- Duration and outcome (if provided)
- Creator name and timestamp
- Vertical line connecting activities

### Contact Cards Should Show:
- Full name with "Primary" star badge (if applicable)
- Title and department
- Clickable email and phone links
- Edit/Delete dropdown menu

---

## 🐛 **Common Issues**

### "No contacts/activities showing"
→ Make sure you ran the CRM migration SQL!

### "Can't add contacts"
→ Check browser console for RLS errors

### Tags not working
→ Verify migration created default tags

### Auto-activity not logging
→ This only works for NEW orders after migration

---

## 🎉 **When Everything Works**

You'll have a professional CRM where you can:
- ✅ Track multiple people at each lender
- ✅ See complete interaction history
- ✅ Categorize clients with tags
- ✅ Auto-log order activities
- ✅ Get a 360° view of each relationship

**Test it now and let me know how it goes!** 🚀

