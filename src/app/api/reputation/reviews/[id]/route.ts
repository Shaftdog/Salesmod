import { NextRequest, NextResponse } from "next/server";
import { ReputationService } from "@/lib/marketing/reputation-service";
import { getCurrentOrgId } from "@/lib/api/helpers";
import { UpdateReviewSchema } from "@/types/reputation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const review = await ReputationService.getReview(id, orgId);
    return NextResponse.json(review);
  } catch (error: any) {
    console.error("Error fetching review:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch review" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const updates = UpdateReviewSchema.parse(body);

    const review = await ReputationService.updateReview(
      id,
      orgId,
      updates
    );

    return NextResponse.json(review);
  } catch (error: any) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update review" },
      { status: 500 }
    );
  }
}
