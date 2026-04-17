import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  const btn = action ? (
    <Button
      onClick={action.onClick}
      className="mt-4"
    >
      {action.label}
    </Button>
  ) : null;

  return (
    <Card>
      <CardContent className="py-16 text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-base mt-4">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>
        {action?.href ? (
          <Link href={action.href} className="inline-block">
            {btn}
          </Link>
        ) : btn}
      </CardContent>
    </Card>
  );
}
