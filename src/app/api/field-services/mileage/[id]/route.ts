import { NextRequest } from 'next/server';
import { transformMileageLog } from '@/lib/supabase/transforms';
import {
  getApiContext,
  handleApiError,
  successResponse,
  noContentResponse,
  createAuditLog,
  isValidUUID,
  ApiError,
} from '@/lib/api-utils';
import { updateMileageLogSchema } from '@/lib/validations/field-services';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getApiContext(request);
    const { supabase, requestId } = context;

    const { id } = await params;

    if (!isValidUUID(id)) {
      throw new ApiError('Invalid mileage log ID', 400, 'INVALID_ID', requestId);
    }

    const { data: log, error } = await supabase
      .from('mileage_logs')
      .select(`
        *,
        resource:bookable_resources!mileage_logs_resource_id_fkey(
          id,
          resource_type,
          profiles(id, name, email, avatar_url)
        ),
        booking:bookings!mileage_logs_booking_id_fkey(
          id,
          booking_number,
          property_address
        ),
        vehicle:equipment_catalog!mileage_logs_vehicle_id_fkey(
          id,
          make,
          model
        )
      `)
      .eq('id', id)
      .single();

    if (error || !log) {
      throw new ApiError('Mileage log not found', 404, 'NOT_FOUND', requestId);
    }

    return successResponse({ mileageLog: transformMileageLog(log) });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getApiContext(request);
    const { supabase, requestId } = context;

    const { id } = await params;

    if (!isValidUUID(id)) {
      throw new ApiError('Invalid mileage log ID', 400, 'INVALID_ID', requestId);
    }

    const body = await request.json();
    const validated = updateMileageLogSchema.parse(body);

    const updateData: any = {};
    if (validated.distanceMiles !== undefined) updateData.distance_miles = validated.distanceMiles;
    if (validated.purpose !== undefined) updateData.purpose = validated.purpose;
    if (validated.isBillable !== undefined) updateData.is_billable = validated.isBillable;
    if (validated.notes !== undefined) updateData.notes = validated.notes;
    if (validated.isReimbursed !== undefined) updateData.is_reimbursed = validated.isReimbursed;
    if (validated.reimbursedDate !== undefined) updateData.reimbursed_date = validated.reimbursedDate;

    const { data: log, error } = await supabase
      .from('mileage_logs')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        resource:bookable_resources!mileage_logs_resource_id_fkey(
          id,
          resource_type,
          profiles(id, name, email, avatar_url)
        )
      `)
      .single();

    if (error) throw error;

    // Audit log
    await createAuditLog(
      context,
      'mileage_log.updated',
      'mileage_log',
      log.id,
      undefined,
      updateData
    );

    return successResponse(
      { mileageLog: transformMileageLog(log) },
      'Mileage log updated'
    );
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getApiContext(request);
    const { supabase, requestId } = context;

    const { id } = await params;

    if (!isValidUUID(id)) {
      throw new ApiError('Invalid mileage log ID', 400, 'INVALID_ID', requestId);
    }

    const { error } = await supabase
      .from('mileage_logs')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Audit log
    await createAuditLog(
      context,
      'mileage_log.deleted',
      'mileage_log',
      id
    );

    return noContentResponse();
  } catch (error: any) {
    return handleApiError(error);
  }
}
