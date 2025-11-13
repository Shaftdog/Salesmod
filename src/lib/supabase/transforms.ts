// Transform database snake_case to TypeScript camelCase

import type { Client, Order, User, Contact, Activity, Tag, ClientTag, Deal, Task, Case, CaseComment, PartyRole } from '@/lib/types'

export function transformClient(dbClient: any): Client {
  return {
    id: dbClient.id,
    companyName: dbClient.company_name,
    primaryContact: dbClient.primary_contact,
    email: dbClient.email,
    phone: dbClient.phone,
    address: dbClient.address,
    billingAddress: dbClient.billing_address,
    paymentTerms: dbClient.payment_terms,
    isActive: dbClient.is_active,
    primaryRoleCode: dbClient.primary_role_code,
    createdAt: dbClient.created_at,
    updatedAt: dbClient.updated_at,
    activeOrders: dbClient.active_orders,
    totalRevenue: dbClient.total_revenue,
    feeSchedule: dbClient.fee_schedule,
    preferredTurnaround: dbClient.preferred_turnaround,
    specialRequirements: dbClient.special_requirements,
    role: dbClient.party_roles ? transformPartyRole(dbClient.party_roles) : undefined,
  }
}

export function transformOrder(dbOrder: any): Order {
  return {
    id: dbOrder.id,
    orderNumber: dbOrder.order_number,
    status: dbOrder.status,
    priority: dbOrder.priority,
    orderType: dbOrder.order_type,
    propertyAddress: dbOrder.property_address,
    propertyCity: dbOrder.property_city,
    propertyState: dbOrder.property_state,
    propertyZip: dbOrder.property_zip,
    propertyType: dbOrder.property_type,
    loanNumber: dbOrder.loan_number,
    loanType: dbOrder.loan_type,
    loanAmount: dbOrder.loan_amount,
    clientId: dbOrder.client_id,
    lenderName: dbOrder.lender_name,
    loanOfficer: dbOrder.loan_officer,
    loanOfficerEmail: dbOrder.loan_officer_email,
    loanOfficerPhone: dbOrder.loan_officer_phone,
    processorName: dbOrder.processor_name,
    processorEmail: dbOrder.processor_email,
    processorPhone: dbOrder.processor_phone,
    borrowerName: dbOrder.borrower_name,
    borrowerEmail: dbOrder.borrower_email,
    borrowerPhone: dbOrder.borrower_phone,
    propertyContactName: dbOrder.property_contact_name,
    propertyContactPhone: dbOrder.property_contact_phone,
    propertyContactEmail: dbOrder.property_contact_email,
    accessInstructions: dbOrder.access_instructions,
    specialInstructions: dbOrder.special_instructions,
    dueDate: dbOrder.due_date,
    orderedDate: dbOrder.ordered_date,
    completedDate: dbOrder.completed_date,
    deliveredDate: dbOrder.delivered_date,
    feeAmount: dbOrder.fee_amount,
    techFee: dbOrder.tech_fee,
    totalAmount: dbOrder.total_amount,
    assignedTo: dbOrder.assigned_to,
    assignedDate: dbOrder.assigned_date,
    createdBy: dbOrder.created_by,
    createdAt: dbOrder.created_at,
    updatedAt: dbOrder.updated_at,
    metadata: dbOrder.metadata,
    
    // Appraisal Workflow Fields (added 2025-10-24)
    scopeOfWork: dbOrder.scope_of_work,
    intendedUse: dbOrder.intended_use,
    reportFormType: dbOrder.report_form_type,
    additionalForms: dbOrder.additional_forms,
    billingMethod: dbOrder.billing_method,
    salesCampaign: dbOrder.sales_campaign,
    serviceRegion: dbOrder.service_region,
    siteInfluence: dbOrder.site_influence,
    isMultiunit: dbOrder.is_multiunit,
    multiunitType: dbOrder.multiunit_type,
    isNewConstruction: dbOrder.is_new_construction,
    newConstructionType: dbOrder.new_construction_type,
    zoningType: dbOrder.zoning_type,
    inspectionDate: dbOrder.inspection_date,
    
    // Props and relations
    propertyId: dbOrder.property_id,
    propertyUnitId: dbOrder.property_unit_id,
    props: dbOrder.props,
    client: dbOrder.client ? transformClient(dbOrder.client) : undefined,
    assignee: dbOrder.assignee ? transformUser(dbOrder.assignee) : undefined,
  }
}

export function transformUser(dbUser: any): User {
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    avatarUrl: dbUser.avatar_url,
    role: dbUser.role,
    availability: dbUser.availability,
    geographicCoverage: dbUser.geographic_coverage,
    workload: dbUser.workload,
    rating: dbUser.rating,
  }
}

export function transformContact(dbContact: any): Contact {
  return {
    id: dbContact.id,
    clientId: dbContact.client_id,
    firstName: dbContact.first_name,
    lastName: dbContact.last_name,
    title: dbContact.title,
    email: dbContact.email,
    phone: dbContact.phone,
    mobile: dbContact.mobile,
    isPrimary: dbContact.is_primary,
    department: dbContact.department,
    notes: dbContact.notes,
    tags: dbContact.tags || [],
    primaryRoleCode: dbContact.primary_role_code,
    createdAt: dbContact.created_at,
    updatedAt: dbContact.updated_at,
    client: dbContact.client ? transformClient(dbContact.client) : undefined,
    role: dbContact.party_roles ? transformPartyRole(dbContact.party_roles) : undefined,
  }
}

export function transformActivity(dbActivity: any): Activity {
  return {
    id: dbActivity.id,
    clientId: dbActivity.client_id,
    contactId: dbActivity.contact_id,
    orderId: dbActivity.order_id,
    activityType: dbActivity.activity_type,
    subject: dbActivity.subject,
    description: dbActivity.description,
    status: dbActivity.status,
    scheduledAt: dbActivity.scheduled_at,
    completedAt: dbActivity.completed_at,
    durationMinutes: dbActivity.duration_minutes,
    outcome: dbActivity.outcome,
    createdBy: dbActivity.created_by,
    assignedTo: dbActivity.assigned_to,
    createdAt: dbActivity.created_at,
    updatedAt: dbActivity.updated_at,
    client: dbActivity.client ? transformClient(dbActivity.client) : undefined,
    contact: dbActivity.contact ? transformContact(dbActivity.contact) : undefined,
    order: dbActivity.order ? transformOrder(dbActivity.order) : undefined,
    creator: dbActivity.creator ? transformUser(dbActivity.creator) : undefined,
    assignee: dbActivity.assignee ? transformUser(dbActivity.assignee) : undefined,
  }
}

export function transformTag(dbTag: any): Tag {
  return {
    id: dbTag.id,
    name: dbTag.name,
    color: dbTag.color,
    createdAt: dbTag.created_at,
  }
}

export function transformClientTag(dbClientTag: any): ClientTag {
  return {
    clientId: dbClientTag.client_id,
    tagId: dbClientTag.tag_id,
    createdAt: dbClientTag.created_at,
    tag: dbClientTag.tag ? transformTag(dbClientTag.tag) : undefined,
  }
}

export function transformDeal(dbDeal: any): Deal {
  return {
    id: dbDeal.id,
    clientId: dbDeal.client_id,
    contactId: dbDeal.contact_id,
    title: dbDeal.title,
    description: dbDeal.description,
    value: dbDeal.value,
    probability: dbDeal.probability,
    stage: dbDeal.stage,
    expectedCloseDate: dbDeal.expected_close_date,
    actualCloseDate: dbDeal.actual_close_date,
    lostReason: dbDeal.lost_reason,
    assignedTo: dbDeal.assigned_to,
    createdBy: dbDeal.created_by,
    createdAt: dbDeal.created_at,
    updatedAt: dbDeal.updated_at,
    client: dbDeal.client ? transformClient(dbDeal.client) : undefined,
    contact: dbDeal.contact ? transformContact(dbDeal.contact) : undefined,
    assignee: dbDeal.assignee ? transformUser(dbDeal.assignee) : undefined,
    creator: dbDeal.creator ? transformUser(dbDeal.creator) : undefined,
  }
}

export function transformTask(dbTask: any): Task {
  return {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description,
    clientId: dbTask.client_id,
    contactId: dbTask.contact_id,
    orderId: dbTask.order_id,
    dealId: dbTask.deal_id,
    priority: dbTask.priority,
    status: dbTask.status,
    dueDate: dbTask.due_date,
    completedAt: dbTask.completed_at,
    assignedTo: dbTask.assigned_to,
    createdBy: dbTask.created_by,
    createdAt: dbTask.created_at,
    updatedAt: dbTask.updated_at,
    client: dbTask.client ? transformClient(dbTask.client) : undefined,
    contact: dbTask.contact ? transformContact(dbTask.contact) : undefined,
    order: dbTask.order ? transformOrder(dbTask.order) : undefined,
    deal: dbTask.deal ? transformDeal(dbTask.deal) : undefined,
    assignee: dbTask.assignee ? transformUser(dbTask.assignee) : undefined,
    creator: dbTask.creator ? transformUser(dbTask.creator) : undefined,
  }
}

export function transformCase(dbCase: any): Case {
  return {
    id: dbCase.id,
    caseNumber: dbCase.case_number,
    subject: dbCase.subject,
    description: dbCase.description,
    caseType: dbCase.case_type,
    status: dbCase.status,
    priority: dbCase.priority,
    clientId: dbCase.client_id,
    contactId: dbCase.contact_id,
    orderId: dbCase.order_id,
    assignedTo: dbCase.assigned_to,
    resolution: dbCase.resolution,
    resolvedAt: dbCase.resolved_at,
    createdBy: dbCase.created_by,
    createdAt: dbCase.created_at,
    updatedAt: dbCase.updated_at,
    closedAt: dbCase.closed_at,
    client: dbCase.client ? transformClient(dbCase.client) : undefined,
    contact: dbCase.contact ? transformContact(dbCase.contact) : undefined,
    order: dbCase.order ? transformOrder(dbCase.order) : undefined,
    assignee: dbCase.assignee ? transformUser(dbCase.assignee) : undefined,
    creator: dbCase.creator ? transformUser(dbCase.creator) : undefined,
  }
}

export function transformCaseComment(dbComment: any): CaseComment {
  return {
    id: dbComment.id,
    caseId: dbComment.case_id,
    comment: dbComment.comment,
    isInternal: dbComment.is_internal,
    createdBy: dbComment.created_by,
    createdAt: dbComment.created_at,
    creator: dbComment.creator ? transformUser(dbComment.creator) : undefined,
  }
}

export function transformPartyRole(dbRole: any): PartyRole {
  return {
    code: dbRole.code,
    label: dbRole.label,
    description: dbRole.description,
    category: dbRole.category,
    sortOrder: dbRole.sort_order,
    isActive: dbRole.is_active,
    createdAt: dbRole.created_at,
  }
}

