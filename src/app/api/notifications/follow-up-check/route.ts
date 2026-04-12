import { apiResponse, apiError } from "@/lib/errors";
import { checkFollowUpReminders } from "@/services/notifications/followUpReminder";

export async function GET() {
  try {
    const notifications = await checkFollowUpReminders();
    return apiResponse({ created: notifications.length });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}
