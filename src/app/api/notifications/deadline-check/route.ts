import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/errors";
import { checkDeadlineAlerts } from "@/services/notifications/deadlineAlert";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return Response.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Invalid cron secret" } },
        { status: 401 }
      );
    }

    const notifications = await checkDeadlineAlerts();
    return apiResponse({ created: notifications.length });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}
