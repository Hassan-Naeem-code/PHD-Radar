import { NotificationsBell } from "./NotificationsBell";

export function TopBar() {
  return (
    <div className="h-14 border-b bg-card flex items-center justify-end px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
      <NotificationsBell />
    </div>
  );
}
