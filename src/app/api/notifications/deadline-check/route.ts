import { apiResponse, apiError } from "@/lib/errors";
import { checkDeadlineAlerts } from "@/services/notifications/deadlineAlert";

export async function GET() {
  try {
    const notifications = await checkDeadlineAlerts();
    return apiResponse({ created: notifications.length });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}
