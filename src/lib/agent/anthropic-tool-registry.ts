import Anthropic from '@anthropic-ai/sdk';

/**
 * Complete tool registry for Anthropic SDK
 * Mirrors the tools defined in tools.ts but in Anthropic SDK format
 */
export const anthropicTools: Anthropic.Messages.Tool[] = [
  // ===== Search & Query Tools =====
  {
    name: 'searchClients',
    description: 'Search for clients by name, email, or other criteria. Use this when you need to find a client UUID.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term (company name, email, etc.)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'searchContacts',
    description: 'Search for individual contacts by name, email, title, or other criteria.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term (first name, last name, email, title, etc.)',
        },
        clientId: {
          type: 'string',
          description: 'Optional: filter by specific client UUID',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'getAllCards',
    description: 'Get all current Kanban cards across all states. Use this to see the complete state of the Kanban board.',
    input_schema: {
      type: 'object',
      properties: {
        includeCompleted: {
          type: 'boolean',
          description: 'Include completed and rejected cards (default: false)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of cards to return (default: 50)',
        },
      },
    },
  },
  {
    name: 'getPendingCards',
    description: 'Get pending action cards that need review or approval.',
    input_schema: {
      type: 'object',
      properties: {
        state: {
          type: 'string',
          enum: ['suggested', 'in_review', 'approved'],
          description: 'Filter by specific state (optional)',
        },
      },
    },
  },
  {
    name: 'getClientActivity',
    description: 'Get recent activity and interaction history for a specific client.',
    input_schema: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'Client UUID',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of activities to return (default: 10)',
        },
      },
      required: ['clientId'],
    },
  },

  // ===== Contact Management =====
  {
    name: 'createContact',
    description: 'Create a new contact for a client. You MUST have the client UUID - use searchClients first if you only have a company name.',
    input_schema: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'Client UUID to associate contact with',
        },
        firstName: {
          type: 'string',
          description: 'Contact first name',
        },
        lastName: {
          type: 'string',
          description: 'Contact last name',
        },
        email: {
          type: 'string',
          description: 'Contact email address',
        },
        phone: {
          type: 'string',
          description: 'Office phone number',
        },
        mobile: {
          type: 'string',
          description: 'Mobile phone number',
        },
        title: {
          type: 'string',
          description: 'Job title',
        },
        department: {
          type: 'string',
          description: 'Department',
        },
        isPrimary: {
          type: 'boolean',
          description: 'Is this the primary contact?',
        },
        notes: {
          type: 'string',
          description: 'Additional notes',
        },
      },
      required: ['clientId', 'firstName', 'lastName'],
    },
  },
  {
    name: 'deleteContact',
    description: 'Delete a contact from the system.',
    input_schema: {
      type: 'object',
      properties: {
        contactId: {
          type: 'string',
          description: 'Contact UUID to delete',
        },
      },
      required: ['contactId'],
    },
  },

  // ===== Client Management =====
  {
    name: 'createClient',
    description: 'Create a new client/customer in the system.',
    input_schema: {
      type: 'object',
      properties: {
        companyName: {
          type: 'string',
          description: 'Company or organization name',
        },
        primaryContact: {
          type: 'string',
          description: 'Name of the primary contact person',
        },
        email: {
          type: 'string',
          description: 'Primary email address',
        },
        phone: {
          type: 'string',
          description: 'Primary phone number',
        },
        address: {
          type: 'string',
          description: 'Physical address',
        },
        billingAddress: {
          type: 'string',
          description: 'Billing address (optional)',
        },
        paymentTerms: {
          type: 'number',
          description: 'Payment terms in days (default: 30)',
        },
        preferredTurnaround: {
          type: 'number',
          description: 'Preferred turnaround time in days',
        },
        specialRequirements: {
          type: 'string',
          description: 'Special requirements or notes',
        },
      },
      required: ['companyName', 'primaryContact', 'email', 'phone', 'address'],
    },
  },
  {
    name: 'deleteClient',
    description: 'Delete a client from the system. WARNING: This affects related contacts, orders, and activities.',
    input_schema: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'Client UUID to delete',
        },
      },
      required: ['clientId'],
    },
  },

  // ===== Property Management =====
  {
    name: 'createProperty',
    description: 'Create a new property in the system. Properties represent physical buildings/locations.',
    input_schema: {
      type: 'object',
      properties: {
        addressLine1: {
          type: 'string',
          description: 'Street address (e.g., "123 Main St")',
        },
        addressLine2: {
          type: 'string',
          description: 'Unit, suite, or apartment number',
        },
        city: {
          type: 'string',
          description: 'City name',
        },
        state: {
          type: 'string',
          description: 'Two-letter state code (e.g., "CA", "FL")',
        },
        postalCode: {
          type: 'string',
          description: 'ZIP code',
        },
        propertyType: {
          type: 'string',
          enum: ['single_family', 'condo', 'multi_family', 'commercial', 'land', 'manufactured'],
          description: 'Type of property',
        },
        apn: {
          type: 'string',
          description: 'Assessor Parcel Number',
        },
        yearBuilt: {
          type: 'number',
          description: 'Year the property was built',
        },
        gla: {
          type: 'number',
          description: 'Gross Living Area in square feet',
        },
        lotSize: {
          type: 'number',
          description: 'Lot size in square feet or acres',
        },
      },
      required: ['addressLine1', 'city', 'state', 'postalCode', 'propertyType'],
    },
  },
  {
    name: 'deleteProperty',
    description: 'Delete a property from the system.',
    input_schema: {
      type: 'object',
      properties: {
        propertyId: {
          type: 'string',
          description: 'Property UUID to delete',
        },
      },
      required: ['propertyId'],
    },
  },

  // ===== Order Management =====
  {
    name: 'createOrder',
    description: 'Create a new appraisal order in the system.',
    input_schema: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'UUID of the client placing the order',
        },
        orderNumber: {
          type: 'string',
          description: 'Unique order number/reference',
        },
        propertyAddress: {
          type: 'string',
          description: 'Property address',
        },
        propertyCity: {
          type: 'string',
          description: 'Property city',
        },
        propertyState: {
          type: 'string',
          description: 'Property state',
        },
        propertyZip: {
          type: 'string',
          description: 'Property ZIP code',
        },
        propertyType: {
          type: 'string',
          description: 'Type of property',
        },
        orderType: {
          type: 'string',
          description: 'Type of appraisal order',
        },
        borrowerName: {
          type: 'string',
          description: 'Name of the borrower',
        },
        dueDate: {
          type: 'string',
          description: 'Due date in ISO format (YYYY-MM-DD)',
        },
        feeAmount: {
          type: 'number',
          description: 'Fee amount for this order',
        },
        priority: {
          type: 'string',
          enum: ['low', 'normal', 'high', 'urgent'],
          description: 'Order priority',
        },
        notes: {
          type: 'string',
          description: 'Additional notes or instructions',
        },
      },
      required: ['clientId', 'orderNumber', 'propertyAddress', 'propertyType', 'orderType'],
    },
  },
  {
    name: 'deleteOrder',
    description: 'Delete an order from the system. WARNING: This may affect related properties and activities.',
    input_schema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'Order UUID to delete',
        },
      },
      required: ['orderId'],
    },
  },

  // ===== Card Management =====
  {
    name: 'createCard',
    description: 'Create a new action card on the Kanban board. For send_email type, MUST include emailDraft with to, subject, and body.',
    input_schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['send_email', 'create_task', 'create_deal', 'follow_up', 'research'],
          description: 'Type of action',
        },
        clientId: {
          type: 'string',
          description: 'UUID of the client (optional for general strategic cards)',
        },
        title: {
          type: 'string',
          description: 'Brief title for the action',
        },
        rationale: {
          type: 'string',
          description: 'Why this action is recommended (business reasoning)',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Priority level',
        },
        emailDraft: {
          type: 'object',
          description: 'REQUIRED for send_email type',
          properties: {
            to: {
              type: 'string',
              description: 'Recipient email address',
            },
            subject: {
              type: 'string',
              description: 'Email subject line',
            },
            body: {
              type: 'string',
              description: 'Complete HTML email body',
            },
            replyTo: {
              type: 'string',
              description: 'Reply-to email address',
            },
          },
        },
        taskDetails: {
          type: 'object',
          description: 'Details for task type cards',
          properties: {
            description: {
              type: 'string',
            },
            dueDate: {
              type: 'string',
            },
          },
        },
      },
      required: ['type', 'title', 'rationale'],
    },
  },
  {
    name: 'updateCard',
    description: 'Update an existing action card. Change priority, state, title, or rationale.',
    input_schema: {
      type: 'object',
      properties: {
        cardId: {
          type: 'string',
          description: 'Card UUID to update',
        },
        state: {
          type: 'string',
          enum: ['suggested', 'in_review', 'approved', 'rejected', 'completed'],
          description: 'New state for the card',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'New priority',
        },
        title: {
          type: 'string',
          description: 'New title',
        },
        rationale: {
          type: 'string',
          description: 'Updated rationale',
        },
      },
      required: ['cardId'],
    },
  },
  {
    name: 'deleteCard',
    description: 'Delete one or more action cards from the Kanban board. Can match by ID, priority, type, or title.',
    input_schema: {
      type: 'object',
      properties: {
        cardId: {
          type: 'string',
          description: 'Specific card UUID to delete',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Delete all cards with this priority',
        },
        type: {
          type: 'string',
          enum: ['send_email', 'create_task', 'create_deal', 'follow_up', 'research'],
          description: 'Delete all cards of this type',
        },
        titleMatch: {
          type: 'string',
          description: 'Delete cards with titles containing this text',
        },
        clientId: {
          type: 'string',
          description: 'Delete cards associated with this client',
        },
      },
    },
  },

  // ===== Deal/Opportunity Management =====
  {
    name: 'deleteOpportunity',
    description: 'Delete an opportunity or deal from the system.',
    input_schema: {
      type: 'object',
      properties: {
        opportunityId: {
          type: 'string',
          description: 'Opportunity/Deal UUID to delete',
        },
      },
      required: ['opportunityId'],
    },
  },

  // ===== Activity & Task Management =====
  {
    name: 'createActivity',
    description: 'Log a completed activity like a call, email, meeting, or note.',
    input_schema: {
      type: 'object',
      properties: {
        activityType: {
          type: 'string',
          enum: ['call', 'email', 'meeting', 'note', 'task'],
          description: 'Type of activity',
        },
        subject: {
          type: 'string',
          description: 'Brief subject of the activity',
        },
        description: {
          type: 'string',
          description: 'Detailed notes about the activity',
        },
        clientId: {
          type: 'string',
          description: 'Related client UUID',
        },
        contactId: {
          type: 'string',
          description: 'Related contact UUID',
        },
        orderId: {
          type: 'string',
          description: 'Related order UUID',
        },
        outcome: {
          type: 'string',
          description: 'Outcome or result of the activity',
        },
        scheduledAt: {
          type: 'string',
          description: 'When the activity occurred (ISO date string)',
        },
      },
      required: ['activityType', 'subject'],
    },
  },
  {
    name: 'deleteTask',
    description: 'Delete a task or activity from the system.',
    input_schema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Task/Activity UUID to delete',
        },
      },
      required: ['taskId'],
    },
  },

  // ===== File Operations =====
  {
    name: 'readFile',
    description: 'Read the contents of a file from the codebase.',
    input_schema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Relative path from project root (e.g., "src/app/page.tsx")',
        },
      },
      required: ['filePath'],
    },
  },
  {
    name: 'writeFile',
    description: 'Create a new file or overwrite an existing file in the codebase.',
    input_schema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Relative path from project root',
        },
        content: {
          type: 'string',
          description: 'The complete file content to write',
        },
        createDirs: {
          type: 'boolean',
          description: 'Create parent directories if they don\'t exist (default: true)',
        },
      },
      required: ['filePath', 'content'],
    },
  },
  {
    name: 'editFile',
    description: 'Edit an existing file by replacing specific text.',
    input_schema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Relative path from project root',
        },
        oldText: {
          type: 'string',
          description: 'The exact text to find and replace',
        },
        newText: {
          type: 'string',
          description: 'The new text to replace it with',
        },
        replaceAll: {
          type: 'boolean',
          description: 'Replace all occurrences (default: false)',
        },
      },
      required: ['filePath', 'oldText', 'newText'],
    },
  },
  {
    name: 'listFiles',
    description: 'List files in the codebase matching a glob pattern.',
    input_schema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Glob pattern (e.g., "src/**/*.tsx", "*.json")',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return (default: 50)',
        },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'searchCode',
    description: 'Search for text or code patterns across the codebase using grep.',
    input_schema: {
      type: 'object',
      properties: {
        searchTerm: {
          type: 'string',
          description: 'Text or regex pattern to search for',
        },
        filePattern: {
          type: 'string',
          description: 'Limit search to files matching pattern (e.g., "*.ts")',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results (default: 20)',
        },
        caseSensitive: {
          type: 'boolean',
          description: 'Case sensitive search (default: false)',
        },
      },
      required: ['searchTerm'],
    },
  },
  {
    name: 'runCommand',
    description: 'Execute a shell command in the project directory. Use for tests, builds, npm scripts, git operations, etc.',
    input_schema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Shell command to execute (e.g., "npm test", "git status")',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds (default: 30000)',
        },
      },
      required: ['command'],
    },
  },

  // ===== Card Review Specialized Tools =====
  {
    name: 'storeRejectionFeedback',
    description: 'Store user feedback about why a card was rejected. Creates permanent memory for the agent to learn from.',
    input_schema: {
      type: 'object',
      properties: {
        cardId: {
          type: 'string',
          description: 'ID of the card being reviewed',
        },
        reason: {
          type: 'string',
          description: 'Why the user rejected the card',
        },
        rule: {
          type: 'string',
          description: 'Optional rule to avoid similar cards in the future',
        },
        cardType: {
          type: 'string',
          description: 'Type of card (send_email, create_task, etc.)',
        },
      },
      required: ['cardId', 'reason'],
    },
  },
  {
    name: 'reviseCard',
    description: 'Create an improved version of a card based on user feedback. Creates new suggested card with improvements.',
    input_schema: {
      type: 'object',
      properties: {
        cardId: {
          type: 'string',
          description: 'ID of the card to revise',
        },
        changes: {
          type: 'object',
          description: 'Changes to apply',
          properties: {
            title: {
              type: 'string',
              description: 'New title',
            },
            subject: {
              type: 'string',
              description: 'New email subject (for email cards)',
            },
            body: {
              type: 'string',
              description: 'New email body (for email cards)',
            },
            rationale: {
              type: 'string',
              description: 'Updated rationale',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'New priority',
            },
          },
        },
        improvementNote: {
          type: 'string',
          description: 'Note describing what was improved',
        },
      },
      required: ['cardId', 'changes'],
    },
  },
  {
    name: 'detectPatternAndSuggest',
    description: 'Analyze rejection patterns across multiple cards and suggest improvements.',
    input_schema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of recent rejections to analyze (default: 20)',
        },
      },
    },
  },
  {
    name: 'analyzeRejectionTrends',
    description: 'Generate a trend report of recent rejections showing temporal patterns and category breakdowns.',
    input_schema: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Number of days to analyze (default: 30)',
        },
      },
    },
  },
  {
    name: 'researchContact',
    description: 'Research a contact to gather additional context including interaction history and past communications.',
    input_schema: {
      type: 'object',
      properties: {
        contactId: {
          type: 'string',
          description: 'Contact UUID to research',
        },
        includeActivities: {
          type: 'boolean',
          description: 'Include activity history (default: true)',
        },
        storeFindings: {
          type: 'boolean',
          description: 'Store research findings in agent memory (default: true)',
        },
      },
      required: ['contactId'],
    },
  },
  {
    name: 'suggestSmartRule',
    description: 'Automatically analyze rejection reason and suggest specific, actionable rules with regex patterns.',
    input_schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'User\'s rejection reason',
        },
        cardType: {
          type: 'string',
          description: 'Type of card that was rejected',
        },
        cardTitle: {
          type: 'string',
          description: 'Title of the rejected card',
        },
      },
      required: ['reason'],
    },
  },
  {
    name: 'detectSimilarFeedback',
    description: 'Check if similar feedback already exists to prevent duplicates.',
    input_schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Rejection reason to check for similarity',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of similar items to return (default: 5)',
        },
      },
      required: ['reason'],
    },
  },
  {
    name: 'findSimilarCards',
    description: 'Find other pending cards with the same issue. Supports placeholder names, email domains, timing, targeting, and content quality issues.',
    input_schema: {
      type: 'object',
      properties: {
        issueType: {
          type: 'string',
          enum: ['placeholder_name', 'email_domain', 'timing', 'targeting', 'content_quality'],
          description: 'Type of issue to search for',
        },
        pattern: {
          type: 'string',
          description: 'Pattern to match (e.g., email domain, placeholder text)',
        },
        limit: {
          type: 'number',
          description: 'Maximum cards to return (default: 20)',
        },
      },
      required: ['issueType'],
    },
  },
  {
    name: 'batchApplyFeedback',
    description: 'Apply feedback to multiple cards at once. Can reject or delete up to 20 cards in one operation.',
    input_schema: {
      type: 'object',
      properties: {
        cardIds: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Array of card IDs to process',
        },
        action: {
          type: 'string',
          enum: ['reject', 'delete'],
          description: 'Action to apply to all cards',
        },
        reason: {
          type: 'string',
          description: 'Reason for the batch action',
        },
        rule: {
          type: 'string',
          description: 'Optional rule to store with the feedback',
        },
      },
      required: ['cardIds', 'action', 'reason'],
    },
  },
];
