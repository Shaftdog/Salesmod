import { NextRequest, NextResponse } from "next/server";
import { ReputationService } from "@/lib/marketing/reputation-service";
import { getCurrentOrgId } from "@/lib/api/helpers";
import { ReviewFiltersSchema } from "@/types/reputation";

export async function GET(request: NextRequest) {
  try {
    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const filters = ReviewFiltersSchema.parse({
      platform_id: searchParams.get("platform_id") || undefined,
      rating: searchParams.get("rating") ? parseInt(searchParams.get("rating")!) : undefined,
      sentiment: searchParams.get("sentiment") || undefined,
      is_flagged: searchParams.get("is_flagged") === "true" ? true : undefined,
      escalated_to: searchParams.get("escalated_to") || undefined,
      start_date: searchParams.get("start_date") || undefined,
      end_date: searchParams.get("end_date") || undefined,
      search: searchParams.get("search") || undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50,
      offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0,
    });

    const result = await ReputationService.listReviews(orgId, filters);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
