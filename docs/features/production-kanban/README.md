---
status: current
last_verified: 2025-11-25
updated_by: Claude Code
---

# Production Kanban System

A 10-stage workflow management system for tracking appraisal orders from intake to completion.

## Overview

The Production Kanban system provides:
- Visual workflow board with drag-and-drop cards
- Task templates with checklists for each stage
- Time tracking for tasks
- User assignment and workload management
- My Tasks view for personal task management

## Accessing the System

Navigate to the **Production** section in the sidebar:

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/production` | Overview metrics and stats |
| Kanban Board | `/production/board` | Visual workflow board |
| My Tasks | `/production/my-tasks` | Your assigned tasks |
| Templates | `/production/templates` | Manage task templates |

## Production Stages

Orders flow through 10 stages:

| Stage | Description |
|-------|-------------|
| **INTAKE** | New orders received, initial processing |
| **SCHEDULING** | Setup review, market analysis, file preparation |
| **SCHEDULED** | Inspection appointment scheduled |
| **INSPECTED** | Property inspection completed |
| **FINALIZATION** | Report development, quality review |
| **READY_FOR_DELIVERY** | Report complete, ready to send |
| **DELIVERED** | Report sent to client |
| **CORRECTION** | Minor corrections requested |
| **REVISION** | Major revisions requested |
| **WORKFILE** | Archived and closed |

## Production Cards

A **Production Card** represents an appraisal order moving through the workflow.

### Creating a Card
1. Go to the Kanban Board
2. Click "Create Card" or use the order form
3. Select a template
4. Assign an appraiser
5. Set due date and priority

### Card Information
- Order number and property address
- Current stage
- Assigned appraiser
- Due date
- Priority (Low, Normal, High, Urgent)
- Completion progress

### Moving Cards
- Drag and drop cards between columns
- Or click the card and use "Move to Stage"
- Required tasks must be completed before moving forward

## Tasks & Checklists

Each stage has predefined tasks from templates.

### Task Properties
- **Title**: What needs to be done
- **Description**: Additional details
- **Assigned To**: Who is responsible
- **Status**: Pending, In Progress, Completed, Blocked
- **Due Date**: When it should be done
- **Estimated Time**: Expected duration
- **Required**: Must complete before advancing stage

### Subtasks
Tasks can have subtasks for detailed checklists:
- Check off subtasks as completed
- Parent task progress shows subtask completion
- All required subtasks must be done

### Task Actions
- **Start**: Mark as in progress
- **Complete**: Mark as done
- **Block**: Mark as blocked (with reason)
- **Reassign**: Change assigned user

## Time Tracking

Track time spent on tasks:

### Stopwatch Mode
1. Click the timer icon on a task
2. Timer starts automatically
3. Click again to stop
4. Time is logged to the task

### Viewing Time
- Each task shows total time spent
- Card shows aggregate time across tasks
- Reports available for billing/analysis

## Templates

Templates define the tasks created for each stage.

### Managing Templates
1. Go to `/production/templates`
2. View, edit, duplicate, or delete templates
3. Set default template for new cards

### Template Structure
```
Template: Standard Appraisal Workflow
├── INTAKE Stage
│   ├── INTAKE (task)
│   │   ├── Check coverage area (subtask)
│   │   ├── Verify pricing (subtask)
│   │   └── ... more subtasks
│   ├── SUPERVISOR ORDER REVIEW (task)
│   └── ... more tasks
├── SCHEDULING Stage
│   └── ... tasks and subtasks
└── ... more stages
```

### Current Default Template
**Standard Appraisal Workflow**
- 30 main tasks
- 266 subtasks
- Covers all 10 stages

## My Tasks

Personal view of your assigned work.

### Filters
- **Overdue**: Past due date
- **Due Today**: Due today
- **In Progress**: Currently working on
- **All Tasks**: Everything assigned to you

### Task List
- Sorted by due date (most urgent first)
- Shows task title, stage, and card info
- Quick actions: Start, Complete, View Card

## Roles

Tasks are assigned by role:

| Role | Description |
|------|-------------|
| **Appraiser** | Performs appraisals, writes reports |
| **Reviewer** | Quality control, compliance review |
| **Admin** | Order management, scheduling, invoicing |
| **Trainee** | Learning, supervised work |

## Tips & Best Practices

### For Admins
1. Keep templates updated with current procedures
2. Set realistic estimated times
3. Mark truly required tasks as required
4. Use descriptions for complex instructions

### For Appraisers
1. Check "My Tasks" daily
2. Start timer when beginning work
3. Complete subtasks as you go
4. Mark blockers immediately with reason

### For Reviewers
1. Monitor board for stuck cards
2. Check overdue tasks regularly
3. Review completed work before advancing stage

## Troubleshooting

### Card won't move to next stage
- Check for incomplete required tasks
- Complete all required tasks first
- Blocked tasks must be unblocked

### Tasks not showing
- Verify you're logged in
- Check task assignment
- Refresh the page

### Timer not working
- Only one active timer per user
- Stop previous timer first
- Check browser permissions

## Related Documentation

- [Agent System](../agents/README.md) - Automated workflow actions
- [Orders](../orders/README.md) - Order management
- [Database Schema](../../architecture/database.md) - Data model
