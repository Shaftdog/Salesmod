import { NextResponse } from "next/server";
import { ReputationService } from "@/lib/marketing/reputation-service";
import { getCurrentOrgId } from "@/lib/api/helpers";

export async function GET() {
  try {
    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [stats, platformStats, trends] = await Promise.all([
      ReputationService.getReputationStats(orgId),
      ReputationService.getPlatformStats(orgId),
      ReputationService.getSentimentTrends(orgId, 30),
    ]);

    return NextResponse.json({
      stats,
      platforms: platformStats,
      trends,
    });
  } catch (error: any) {
    console.error("Error fetching reputation stats:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch reputation stats" },
      { status: 500 }
    );
  }
}
