// Transform database snake_case to TypeScript camelCase

import type {
  Client,
  Order,
  User,
  Contact,
  Activity,
  Tag,
  ClientTag,
  Deal,
  Task,
  Case,
  CaseComment,
  PartyRole,
  SkillType,
  ServiceTerritory,
  BookableResource,
  ResourceSkill,
  ResourceAvailability,
  Equipment,
  EquipmentAssignment,
  Booking,
  BookingConflict,
  TimeEntry,
  RoutePlan,
  MileageLog,
  GpsTracking,
  RouteWaypoint,
  OfflineSyncQueue
} from '@/lib/types'

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
    dealId: dbActivity.deal_id,
    gmailMessageId: dbActivity.gmail_message_id,
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
    deal: dbActivity.deal ? transformDeal(dbActivity.deal) : undefined,
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

// =============================================
// FIELD SERVICES TRANSFORMS
// =============================================

export function transformSkillType(dbSkill: any): SkillType {
  return {
    id: dbSkill.id,
    name: dbSkill.name,
    description: dbSkill.description,
    category: dbSkill.category,
    isRequired: dbSkill.is_required,
    isActive: dbSkill.is_active,
    metadata: dbSkill.metadata,
    createdAt: dbSkill.created_at,
    updatedAt: dbSkill.updated_at,
  }
}

export function transformServiceTerritory(dbTerritory: any): ServiceTerritory {
  return {
    id: dbTerritory.id,
    orgId: dbTerritory.org_id,
    name: dbTerritory.name,
    description: dbTerritory.description,
    territoryType: dbTerritory.territory_type,
    zipCodes: dbTerritory.zip_codes,
    counties: dbTerritory.counties,
    cities: dbTerritory.cities,
    radiusMiles: dbTerritory.radius_miles,
    centerLat: dbTerritory.center_lat,
    centerLng: dbTerritory.center_lng,
    boundaryPolygon: dbTerritory.boundary_polygon,
    baseTravelTimeMinutes: dbTerritory.base_travel_time_minutes,
    mileageRate: dbTerritory.mileage_rate,
    travelFee: dbTerritory.travel_fee,
    isActive: dbTerritory.is_active,
    colorHex: dbTerritory.color_hex,
    metadata: dbTerritory.metadata,
    createdAt: dbTerritory.created_at,
    updatedAt: dbTerritory.updated_at,
  }
}

export function transformBookableResource(dbResource: any): BookableResource {
  return {
    id: dbResource.id,
    resourceType: dbResource.resource_type,
    employmentType: dbResource.employment_type,
    isBookable: dbResource.is_bookable,
    bookingBufferMinutes: dbResource.booking_buffer_minutes,
    maxDailyAppointments: dbResource.max_daily_appointments,
    maxWeeklyHours: dbResource.max_weekly_hours,
    primaryTerritoryId: dbResource.primary_territory_id,
    serviceTerritoryIds: dbResource.service_territory_ids,
    hourlyRate: dbResource.hourly_rate,
    overtimeRate: dbResource.overtime_rate,
    perInspectionRate: dbResource.per_inspection_rate,
    splitPercentage: dbResource.split_percentage,
    assignedEquipmentIds: dbResource.assigned_equipment_ids,
    licenseNumber: dbResource.license_number,
    licenseState: dbResource.license_state,
    licenseExpiry: dbResource.license_expiry,
    errorsAndOmissionsCarrier: dbResource.errors_and_omissions_carrier,
    errorsAndOmissionsExpiry: dbResource.errors_and_omissions_expiry,
    errorsAndOmissionsAmount: dbResource.errors_and_omissions_amount,
    emergencyContactName: dbResource.emergency_contact_name,
    emergencyContactPhone: dbResource.emergency_contact_phone,
    preferredContactMethod: dbResource.preferred_contact_method,
    avgInspectionDurationMinutes: dbResource.avg_inspection_duration_minutes,
    avgDriveTimeMinutes: dbResource.avg_drive_time_minutes,
    completionRate: dbResource.completion_rate,
    avgCustomerRating: dbResource.avg_customer_rating,
    totalInspectionsCompleted: dbResource.total_inspections_completed,
    defaultWorkingHours: dbResource.default_working_hours,
    timezone: dbResource.timezone,
    metadata: dbResource.metadata,
    createdAt: dbResource.created_at,
    updatedAt: dbResource.updated_at,
    profile: dbResource.profiles ? transformUser(dbResource.profiles) : undefined,
    primaryTerritory: dbResource.primary_territory ? transformServiceTerritory(dbResource.primary_territory) : undefined,
    skills: dbResource.resource_skills ? dbResource.resource_skills.map(transformResourceSkill) : undefined,
    availability: dbResource.resource_availability ? dbResource.resource_availability.map(transformResourceAvailability) : undefined,
  }
}

export function transformResourceSkill(dbSkill: any): ResourceSkill {
  return {
    id: dbSkill.id,
    resourceId: dbSkill.resource_id,
    skillTypeId: dbSkill.skill_type_id,
    proficiencyLevel: dbSkill.proficiency_level,
    certificationNumber: dbSkill.certification_number,
    certifiedDate: dbSkill.certified_date,
    expiryDate: dbSkill.expiry_date,
    issuingAuthority: dbSkill.issuing_authority,
    isVerified: dbSkill.is_verified,
    verifiedBy: dbSkill.verified_by,
    verifiedAt: dbSkill.verified_at,
    notes: dbSkill.notes,
    createdAt: dbSkill.created_at,
    updatedAt: dbSkill.updated_at,
    skillType: dbSkill.skill_types ? transformSkillType(dbSkill.skill_types) : undefined,
    resource: dbSkill.bookable_resources ? transformBookableResource(dbSkill.bookable_resources) : undefined,
    verifier: dbSkill.verifier ? transformUser(dbSkill.verifier) : undefined,
  }
}

export function transformResourceAvailability(dbAvailability: any): ResourceAvailability {
  return {
    id: dbAvailability.id,
    resourceId: dbAvailability.resource_id,
    availabilityType: dbAvailability.availability_type,
    startDatetime: dbAvailability.start_datetime,
    endDatetime: dbAvailability.end_datetime,
    isAvailable: dbAvailability.is_available,
    isRecurring: dbAvailability.is_recurring,
    recurrenceRule: dbAvailability.recurrence_rule,
    recurrenceEndDate: dbAvailability.recurrence_end_date,
    reason: dbAvailability.reason,
    notes: dbAvailability.notes,
    isAllDay: dbAvailability.is_all_day,
    status: dbAvailability.status,
    approvedBy: dbAvailability.approved_by,
    approvedAt: dbAvailability.approved_at,
    createdBy: dbAvailability.created_by,
    createdAt: dbAvailability.created_at,
    updatedAt: dbAvailability.updated_at,
    resource: dbAvailability.bookable_resources ? transformBookableResource(dbAvailability.bookable_resources) : undefined,
    approver: dbAvailability.approver ? transformUser(dbAvailability.approver) : undefined,
    creator: dbAvailability.creator ? transformUser(dbAvailability.creator) : undefined,
  }
}

export function transformEquipment(dbEquipment: any): Equipment {
  return {
    id: dbEquipment.id,
    orgId: dbEquipment.org_id,
    name: dbEquipment.name,
    equipmentType: dbEquipment.equipment_type,
    serialNumber: dbEquipment.serial_number,
    assetTag: dbEquipment.asset_tag,
    make: dbEquipment.make,
    model: dbEquipment.model,
    purchaseDate: dbEquipment.purchase_date,
    purchasePrice: dbEquipment.purchase_price,
    currentValue: dbEquipment.current_value,
    depreciationSchedule: dbEquipment.depreciation_schedule,
    status: dbEquipment.status,
    assignedTo: dbEquipment.assigned_to,
    assignedDate: dbEquipment.assigned_date,
    location: dbEquipment.location,
    lastMaintenanceDate: dbEquipment.last_maintenance_date,
    nextMaintenanceDate: dbEquipment.next_maintenance_date,
    maintenanceIntervalDays: dbEquipment.maintenance_interval_days,
    maintenanceNotes: dbEquipment.maintenance_notes,
    warrantyExpiry: dbEquipment.warranty_expiry,
    insurancePolicy: dbEquipment.insurance_policy,
    insuranceExpiry: dbEquipment.insurance_expiry,
    isActive: dbEquipment.is_active,
    metadata: dbEquipment.metadata,
    createdAt: dbEquipment.created_at,
    updatedAt: dbEquipment.updated_at,
    assignedResource: dbEquipment.assigned_resource ? transformBookableResource(dbEquipment.assigned_resource) : undefined,
  }
}

export function transformEquipmentAssignment(dbAssignment: any): EquipmentAssignment {
  return {
    id: dbAssignment.id,
    equipmentId: dbAssignment.equipment_id,
    resourceId: dbAssignment.resource_id,
    assignedDate: dbAssignment.assigned_date,
    expectedReturnDate: dbAssignment.expected_return_date,
    actualReturnDate: dbAssignment.actual_return_date,
    conditionAtCheckout: dbAssignment.condition_at_checkout,
    conditionAtReturn: dbAssignment.condition_at_return,
    checkoutNotes: dbAssignment.checkout_notes,
    returnNotes: dbAssignment.return_notes,
    damageReported: dbAssignment.damage_reported,
    damageDescription: dbAssignment.damage_description,
    damageCost: dbAssignment.damage_cost,
    assignedBy: dbAssignment.assigned_by,
    returnedTo: dbAssignment.returned_to,
    createdAt: dbAssignment.created_at,
    updatedAt: dbAssignment.updated_at,
    equipment: dbAssignment.equipment_catalog ? transformEquipment(dbAssignment.equipment_catalog) : undefined,
    resource: dbAssignment.resource ? transformBookableResource(dbAssignment.resource) : undefined,
    assigner: dbAssignment.assigner ? transformUser(dbAssignment.assigner) : undefined,
    receiver: dbAssignment.receiver ? transformUser(dbAssignment.receiver) : undefined,
  }
}

// =============================================
// PHASE 2: SCHEDULING & DISPATCH TRANSFORMS
// =============================================

export function transformBooking(dbBooking: any): Booking {
  return {
    id: dbBooking.id,
    orgId: dbBooking.org_id,
    orderId: dbBooking.order_id,
    resourceId: dbBooking.resource_id,
    territoryId: dbBooking.territory_id,
    bookingNumber: dbBooking.booking_number,
    bookingType: dbBooking.booking_type,
    scheduledStart: dbBooking.scheduled_start,
    scheduledEnd: dbBooking.scheduled_end,
    actualStart: dbBooking.actual_start,
    actualEnd: dbBooking.actual_end,
    durationMinutes: dbBooking.duration_minutes,
    actualDurationMinutes: dbBooking.actual_duration_minutes,
    status: dbBooking.status,
    propertyAddress: dbBooking.property_address,
    propertyCity: dbBooking.property_city,
    propertyState: dbBooking.property_state,
    propertyZip: dbBooking.property_zip,
    latitude: dbBooking.latitude,
    longitude: dbBooking.longitude,
    accessInstructions: dbBooking.access_instructions,
    specialInstructions: dbBooking.special_instructions,
    contactName: dbBooking.contact_name,
    contactPhone: dbBooking.contact_phone,
    contactEmail: dbBooking.contact_email,
    estimatedTravelTimeMinutes: dbBooking.estimated_travel_time_minutes,
    actualTravelTimeMinutes: dbBooking.actual_travel_time_minutes,
    estimatedMileage: dbBooking.estimated_mileage,
    actualMileage: dbBooking.actual_mileage,
    routeData: dbBooking.route_data,
    originalBookingId: dbBooking.original_booking_id,
    rescheduledBookingId: dbBooking.rescheduled_booking_id,
    rescheduleReason: dbBooking.reschedule_reason,
    rescheduleCount: dbBooking.reschedule_count,
    cancelledAt: dbBooking.cancelled_at,
    cancelledBy: dbBooking.cancelled_by,
    cancellationReason: dbBooking.cancellation_reason,
    completedAt: dbBooking.completed_at,
    completionNotes: dbBooking.completion_notes,
    customerSignature: dbBooking.customer_signature,
    customerRating: dbBooking.customer_rating,
    customerFeedback: dbBooking.customer_feedback,
    confirmationSentAt: dbBooking.confirmation_sent_at,
    reminderSentAt: dbBooking.reminder_sent_at,
    reminderCount: dbBooking.reminder_count,
    assignedBy: dbBooking.assigned_by,
    assignedAt: dbBooking.assigned_at,
    autoAssigned: dbBooking.auto_assigned,
    metadata: dbBooking.metadata,
    createdAt: dbBooking.created_at,
    updatedAt: dbBooking.updated_at,
    order: dbBooking.orders ? transformOrder(dbBooking.orders) : undefined,
    resource: dbBooking.bookable_resources ? transformBookableResource(dbBooking.bookable_resources) : undefined,
    territory: dbBooking.service_territories ? transformServiceTerritory(dbBooking.service_territories) : undefined,
    assigner: dbBooking.assigner ? transformUser(dbBooking.assigner) : undefined,
    canceller: dbBooking.canceller ? transformUser(dbBooking.canceller) : undefined,
    originalBooking: dbBooking.original_booking ? transformBooking(dbBooking.original_booking) : undefined,
    rescheduledBooking: dbBooking.rescheduled_booking ? transformBooking(dbBooking.rescheduled_booking) : undefined,
  }
}

export function transformBookingConflict(dbConflict: any): BookingConflict {
  return {
    id: dbConflict.id,
    bookingId1: dbConflict.booking_id_1,
    bookingId2: dbConflict.booking_id_2,
    conflictType: dbConflict.conflict_type,
    severity: dbConflict.severity,
    overlapMinutes: dbConflict.overlap_minutes,
    requiredTravelMinutes: dbConflict.required_travel_minutes,
    details: dbConflict.details,
    resolved: dbConflict.resolved,
    resolvedAt: dbConflict.resolved_at,
    resolvedBy: dbConflict.resolved_by,
    resolutionNotes: dbConflict.resolution_notes,
    createdAt: dbConflict.created_at,
    booking1: dbConflict.booking_1 ? transformBooking(dbConflict.booking_1) : undefined,
    booking2: dbConflict.booking_2 ? transformBooking(dbConflict.booking_2) : undefined,
    resolver: dbConflict.resolver ? transformUser(dbConflict.resolver) : undefined,
  }
}

export function transformTimeEntry(dbEntry: any): TimeEntry {
  return {
    id: dbEntry.id,
    bookingId: dbEntry.booking_id,
    resourceId: dbEntry.resource_id,
    entryType: dbEntry.entry_type,
    timestamp: dbEntry.timestamp,
    latitude: dbEntry.latitude,
    longitude: dbEntry.longitude,
    locationAccuracyMeters: dbEntry.location_accuracy_meters,
    deviceType: dbEntry.device_type,
    deviceId: dbEntry.device_id,
    ipAddress: dbEntry.ip_address,
    notes: dbEntry.notes,
    metadata: dbEntry.metadata,
    createdAt: dbEntry.created_at,
    booking: dbEntry.bookings ? transformBooking(dbEntry.bookings) : undefined,
    resource: dbEntry.bookable_resources ? transformBookableResource(dbEntry.bookable_resources) : undefined,
  }
}

export function transformRoutePlan(dbPlan: any): RoutePlan {
  return {
    id: dbPlan.id,
    resourceId: dbPlan.resource_id,
    planDate: dbPlan.plan_date,
    optimizationStatus: dbPlan.optimization_status,
    optimizedAt: dbPlan.optimized_at,
    totalDistanceMiles: dbPlan.total_distance_miles,
    totalDriveTimeMinutes: dbPlan.total_drive_time_minutes,
    totalOnSiteTimeMinutes: dbPlan.total_on_site_time_minutes,
    totalBreaksMinutes: dbPlan.total_breaks_minutes,
    bookingIds: dbPlan.booking_ids,
    waypoints: dbPlan.waypoints,
    routePolyline: dbPlan.route_polyline,
    routeData: dbPlan.route_data,
    metadata: dbPlan.metadata,
    createdAt: dbPlan.created_at,
    updatedAt: dbPlan.updated_at,
    resource: dbPlan.bookable_resources ? transformBookableResource(dbPlan.bookable_resources) : undefined,
    bookings: dbPlan.bookings ? dbPlan.bookings.map(transformBooking) : undefined,
  }
}

// Phase 4 Transforms

export function transformMileageLog(dbLog: any): MileageLog {
  return {
    id: dbLog.id,
    orgId: dbLog.org_id,
    resourceId: dbLog.resource_id,
    bookingId: dbLog.booking_id,
    routePlanId: dbLog.route_plan_id,
    logDate: dbLog.log_date,
    startTime: dbLog.start_time,
    endTime: dbLog.end_time,
    startLocation: dbLog.start_location,
    endLocation: dbLog.end_location,
    startCoordinates: dbLog.start_coordinates,
    endCoordinates: dbLog.end_coordinates,
    distanceMiles: dbLog.distance_miles,
    distanceKm: dbLog.distance_km,
    purpose: dbLog.purpose,
    isBillable: dbLog.is_billable,
    vehicleId: dbLog.vehicle_id,
    odometerStart: dbLog.odometer_start,
    odometerEnd: dbLog.odometer_end,
    ratePerMile: dbLog.rate_per_mile,
    reimbursementAmount: dbLog.reimbursement_amount,
    isReimbursed: dbLog.is_reimbursed,
    reimbursedDate: dbLog.reimbursed_date,
    notes: dbLog.notes,
    createdAt: dbLog.created_at,
    updatedAt: dbLog.updated_at,
    resource: dbLog.bookable_resources ? transformBookableResource(dbLog.bookable_resources) : undefined,
    booking: dbLog.bookings ? transformBooking(dbLog.bookings) : undefined,
    routePlan: dbLog.route_plans ? transformRoutePlan(dbLog.route_plans) : undefined,
    vehicle: dbLog.equipment_catalog ? transformEquipment(dbLog.equipment_catalog) : undefined,
  }
}

export function transformGpsTracking(dbGps: any): GpsTracking {
  return {
    id: dbGps.id,
    resourceId: dbGps.resource_id,
    bookingId: dbGps.booking_id,
    timestamp: dbGps.timestamp,
    coordinates: dbGps.coordinates,
    speed: dbGps.speed,
    heading: dbGps.heading,
    altitude: dbGps.altitude,
    batteryLevel: dbGps.battery_level,
    isOnline: dbGps.is_online,
    createdAt: dbGps.created_at,
    resource: dbGps.bookable_resources ? transformBookableResource(dbGps.bookable_resources) : undefined,
    booking: dbGps.bookings ? transformBooking(dbGps.bookings) : undefined,
  }
}

export function transformRouteWaypoint(dbWaypoint: any): RouteWaypoint {
  return {
    id: dbWaypoint.id,
    routePlanId: dbWaypoint.route_plan_id,
    bookingId: dbWaypoint.booking_id,
    sequenceOrder: dbWaypoint.sequence_order,
    locationName: dbWaypoint.location_name,
    address: dbWaypoint.address,
    coordinates: dbWaypoint.coordinates,
    arrivalTime: dbWaypoint.arrival_time,
    departureTime: dbWaypoint.departure_time,
    durationMinutes: dbWaypoint.duration_minutes,
    distanceFromPrevious: dbWaypoint.distance_from_previous,
    travelTimeMinutes: dbWaypoint.travel_time_minutes,
    isCompleted: dbWaypoint.is_completed,
    completedAt: dbWaypoint.completed_at,
    notes: dbWaypoint.notes,
    createdAt: dbWaypoint.created_at,
    updatedAt: dbWaypoint.updated_at,
    routePlan: dbWaypoint.route_plans ? transformRoutePlan(dbWaypoint.route_plans) : undefined,
    booking: dbWaypoint.bookings ? transformBooking(dbWaypoint.bookings) : undefined,
  }
}

export function transformOfflineSyncQueue(dbSync: any): OfflineSyncQueue {
  return {
    id: dbSync.id,
    resourceId: dbSync.resource_id,
    entityType: dbSync.entity_type,
    entityId: dbSync.entity_id,
    operation: dbSync.operation,
    data: dbSync.data,
    isSynced: dbSync.is_synced,
    syncedAt: dbSync.synced_at,
    syncError: dbSync.sync_error,
    createdAt: dbSync.created_at,
    deviceId: dbSync.device_id,
    resource: dbSync.bookable_resources ? transformBookableResource(dbSync.bookable_resources) : undefined,
  }
}
