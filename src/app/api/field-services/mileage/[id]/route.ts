import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformMileageLog } from '@/lib/supabase/transforms';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

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

    if (error) {
      return NextResponse.json({ error: 'Mileage log not found' }, { status: 404 });
    }

    return NextResponse.json({ mileageLog: transformMileageLog(log) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const updateData: any = {};
    if (body.distanceMiles !== undefined) updateData.distance_miles = body.distanceMiles;
    if (body.purpose !== undefined) updateData.purpose = body.purpose;
    if (body.isBillable !== undefined) updateData.is_billable = body.isBillable;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.isReimbursed !== undefined) updateData.is_reimbursed = body.isReimbursed;
    if (body.reimbursedDate !== undefined) updateData.reimbursed_date = body.reimbursedDate;

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

    if (error) {
      return NextResponse.json({ error: 'Failed to update mileage log' }, { status: 500 });
    }

    return NextResponse.json({
      mileageLog: transformMileageLog(log),
      message: 'Mileage log updated'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { error } = await supabase
      .from('mileage_logs')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete mileage log' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Mileage log deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
