import { createClient } from '@/lib/supabase/server';

export interface Webinar {
  id: string;
  orgId: string;
  campaignId?: string;
  title: string;
  description?: string;
  presenterName?: string;
  presenterTitle?: string;
  scheduledAt: string;
  durationMinutes: number;
  timezone: string;
  webinarUrl?: string;
  recordingUrl?: string;
  maxAttendees?: number;
  registrationDeadline?: string;
  status: 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';
  targetRoleCodes?: string[];
  targetRoleCategories?: string[];
  includeTags?: string[];
  minLeadScore?: number;
  sendConfirmationEmail: boolean;
  sendReminderEmail: boolean;
  reminderHoursBefore: number;
  sendFollowupEmail: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebinarRegistration {
  id: string;
  webinarId: string;
  contactId: string;
  registeredAt: string;
  registrationSource?: string;
  confirmationSentAt?: string;
  reminderSentAt?: string;
  attended: boolean;
  attendedAt?: string;
  attendanceDurationMinutes?: number;
  followupSentAt?: string;
  questionsAnswers?: Record<string, any>;
  createdAt: string;
}

export interface CreateWebinarInput {
  title: string;
  description?: string;
  presenterName?: string;
  presenterTitle?: string;
  scheduledAt: string;
  durationMinutes?: number;
  timezone?: string;
  webinarUrl?: string;
  maxAttendees?: number;
  registrationDeadline?: string;
  campaignId?: string;
  targetRoleCodes?: string[];
  targetRoleCategories?: string[];
  includeTags?: string[];
  minLeadScore?: number;
  sendConfirmationEmail?: boolean;
  sendReminderEmail?: boolean;
  reminderHoursBefore?: number;
  sendFollowupEmail?: boolean;
}

export interface UpdateWebinarInput extends Partial<CreateWebinarInput> {
  status?: 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';
  recordingUrl?: string;
}

/**
 * List webinars for an organization
 */
export async function listWebinars(
  orgId: string,
  filters?: {
    status?: string;
    campaignId?: string;
    upcoming?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<Webinar[]> {
  const supabase = await createClient();

  let query = supabase
    .from('webinars')
    .select('*')
    .eq('org_id', orgId)
    .order('scheduled_at', { ascending: true });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.campaignId) {
    query = query.eq('campaign_id', filters.campaignId);
  }

  if (filters?.upcoming) {
    query = query.gte('scheduled_at', new Date().toISOString());
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error listing webinars:', error);
    throw error;
  }

  return (data || []).map(mapToWebinar);
}

/**
 * Get a single webinar by ID
 */
export async function getWebinar(webinarId: string): Promise<Webinar | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('webinars')
    .select('*')
    .eq('id', webinarId)
    .single();

  if (error) {
    console.error('Error getting webinar:', error);
    return null;
  }

  return data ? mapToWebinar(data) : null;
}

/**
 * Create a new webinar
 */
export async function createWebinar(
  orgId: string,
  userId: string,
  input: CreateWebinarInput
): Promise<Webinar | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('webinars')
    .insert({
      org_id: orgId,
      campaign_id: input.campaignId,
      title: input.title,
      description: input.description,
      presenter_name: input.presenterName,
      presenter_title: input.presenterTitle,
      scheduled_at: input.scheduledAt,
      duration_minutes: input.durationMinutes || 60,
      timezone: input.timezone || 'UTC',
      webinar_url: input.webinarUrl,
      max_attendees: input.maxAttendees,
      registration_deadline: input.registrationDeadline,
      target_role_codes: input.targetRoleCodes,
      target_role_categories: input.targetRoleCategories,
      include_tags: input.includeTags,
      min_lead_score: input.minLeadScore,
      send_confirmation_email: input.sendConfirmationEmail ?? true,
      send_reminder_email: input.sendReminderEmail ?? true,
      reminder_hours_before: input.reminderHoursBefore ?? 24,
      send_followup_email: input.sendFollowupEmail ?? true,
      status: 'draft',
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating webinar:', error);
    throw error;
  }

  return data ? mapToWebinar(data) : null;
}

/**
 * Update a webinar
 */
export async function updateWebinar(
  webinarId: string,
  input: UpdateWebinarInput
): Promise<Webinar | null> {
  const supabase = await createClient();

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.presenterName !== undefined) updateData.presenter_name = input.presenterName;
  if (input.presenterTitle !== undefined) updateData.presenter_title = input.presenterTitle;
  if (input.scheduledAt !== undefined) updateData.scheduled_at = input.scheduledAt;
  if (input.durationMinutes !== undefined) updateData.duration_minutes = input.durationMinutes;
  if (input.timezone !== undefined) updateData.timezone = input.timezone;
  if (input.webinarUrl !== undefined) updateData.webinar_url = input.webinarUrl;
  if (input.recordingUrl !== undefined) updateData.recording_url = input.recordingUrl;
  if (input.maxAttendees !== undefined) updateData.max_attendees = input.maxAttendees;
  if (input.registrationDeadline !== undefined) updateData.registration_deadline = input.registrationDeadline;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.targetRoleCodes !== undefined) updateData.target_role_codes = input.targetRoleCodes;
  if (input.targetRoleCategories !== undefined) updateData.target_role_categories = input.targetRoleCategories;
  if (input.includeTags !== undefined) updateData.include_tags = input.includeTags;
  if (input.minLeadScore !== undefined) updateData.min_lead_score = input.minLeadScore;
  if (input.sendConfirmationEmail !== undefined) updateData.send_confirmation_email = input.sendConfirmationEmail;
  if (input.sendReminderEmail !== undefined) updateData.send_reminder_email = input.sendReminderEmail;
  if (input.reminderHoursBefore !== undefined) updateData.reminder_hours_before = input.reminderHoursBefore;
  if (input.sendFollowupEmail !== undefined) updateData.send_followup_email = input.sendFollowupEmail;

  const { data, error } = await supabase
    .from('webinars')
    .update(updateData)
    .eq('id', webinarId)
    .select()
    .single();

  if (error) {
    console.error('Error updating webinar:', error);
    throw error;
  }

  return data ? mapToWebinar(data) : null;
}

/**
 * Delete a webinar
 */
export async function deleteWebinar(webinarId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('webinars')
    .delete()
    .eq('id', webinarId);

  if (error) {
    console.error('Error deleting webinar:', error);
    return false;
  }

  return true;
}

/**
 * Register a contact for a webinar
 */
export async function registerForWebinar(
  webinarId: string,
  contactId: string,
  source?: string,
  questionsAnswers?: Record<string, any>
): Promise<WebinarRegistration | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('webinar_registrations')
    .insert({
      webinar_id: webinarId,
      contact_id: contactId,
      registration_source: source || 'manual',
      questions_answers: questionsAnswers,
    })
    .select()
    .single();

  if (error) {
    console.error('Error registering for webinar:', error);
    throw error;
  }

  return data ? mapToWebinarRegistration(data) : null;
}

/**
 * Get registrations for a webinar
 */
export async function getWebinarRegistrations(
  webinarId: string
): Promise<WebinarRegistration[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('webinar_registrations')
    .select('*')
    .eq('webinar_id', webinarId)
    .order('registered_at', { ascending: false });

  if (error) {
    console.error('Error getting webinar registrations:', error);
    throw error;
  }

  return (data || []).map(mapToWebinarRegistration);
}

/**
 * Mark attendance for a registration
 */
export async function markAttendance(
  registrationId: string,
  attended: boolean,
  durationMinutes?: number
): Promise<WebinarRegistration | null> {
  const supabase = await createClient();

  const updateData: any = {
    attended,
  };

  if (attended) {
    updateData.attended_at = new Date().toISOString();
    if (durationMinutes) {
      updateData.attendance_duration_minutes = durationMinutes;
    }
  } else {
    updateData.attended_at = null;
    updateData.attendance_duration_minutes = null;
  }

  const { data, error } = await supabase
    .from('webinar_registrations')
    .update(updateData)
    .eq('id', registrationId)
    .select()
    .single();

  if (error) {
    console.error('Error marking attendance:', error);
    throw error;
  }

  return data ? mapToWebinarRegistration(data) : null;
}

/**
 * Get webinar statistics
 */
export async function getWebinarStats(webinarId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('webinar_registrations')
    .select('*')
    .eq('webinar_id', webinarId);

  if (error) {
    console.error('Error getting webinar stats:', error);
    return {
      totalRegistrations: 0,
      totalAttended: 0,
      attendanceRate: 0,
      avgDuration: 0,
    };
  }

  const registrations = data || [];
  const attended = registrations.filter((r) => r.attended);
  const durations = attended
    .filter((r) => r.attendance_duration_minutes)
    .map((r) => r.attendance_duration_minutes);

  return {
    totalRegistrations: registrations.length,
    totalAttended: attended.length,
    attendanceRate: registrations.length > 0 ? (attended.length / registrations.length) * 100 : 0,
    avgDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
  };
}

// Helper functions
function mapToWebinar(row: any): Webinar {
  return {
    id: row.id,
    orgId: row.org_id,
    campaignId: row.campaign_id,
    title: row.title,
    description: row.description,
    presenterName: row.presenter_name,
    presenterTitle: row.presenter_title,
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes,
    timezone: row.timezone,
    webinarUrl: row.webinar_url,
    recordingUrl: row.recording_url,
    maxAttendees: row.max_attendees,
    registrationDeadline: row.registration_deadline,
    status: row.status,
    targetRoleCodes: row.target_role_codes,
    targetRoleCategories: row.target_role_categories,
    includeTags: row.include_tags,
    minLeadScore: row.min_lead_score,
    sendConfirmationEmail: row.send_confirmation_email,
    sendReminderEmail: row.send_reminder_email,
    reminderHoursBefore: row.reminder_hours_before,
    sendFollowupEmail: row.send_followup_email,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapToWebinarRegistration(row: any): WebinarRegistration {
  return {
    id: row.id,
    webinarId: row.webinar_id,
    contactId: row.contact_id,
    registeredAt: row.registered_at,
    registrationSource: row.registration_source,
    confirmationSentAt: row.confirmation_sent_at,
    reminderSentAt: row.reminder_sent_at,
    attended: row.attended,
    attendedAt: row.attended_at,
    attendanceDurationMinutes: row.attendance_duration_minutes,
    followupSentAt: row.followup_sent_at,
    questionsAnswers: row.questions_answers,
    createdAt: row.created_at,
  };
}
