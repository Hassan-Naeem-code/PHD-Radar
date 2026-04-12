import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, BookOpen, ExternalLink, Star } from "lucide-react";

interface ProfessorCardProps {
  id: string;
  name: string;
  title: string | null;
  department: string | null;
  universityName: string;
  researchAreas: string[];
  hIndex: number | null;
  hasActiveFunding: boolean;
  lookingForStudents: boolean;
  overallMatchScore: number;
  fundingScore: number | null;
}

export function ProfessorCard({
  id,
  name,
  title,
  department,
  universityName,
  researchAreas,
  hIndex,
  hasActiveFunding,
  lookingForStudents,
  overallMatchScore,
  fundingScore,
}: ProfessorCardProps) {
  const scoreColor =
    overallMatchScore >= 80
      ? "text-green-600"
      : overallMatchScore >= 60
        ? "text-yellow-600"
        : "text-gray-600";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Link href={`/discover/${id}`} className="hover:underline">
              <h3 className="font-semibold text-lg truncate">{name}</h3>
            </Link>
            <p className="text-sm text-muted-foreground">
              {title && `${title}, `}{department && `${department}, `}{universityName}
            </p>
          </div>
          <div className={`text-right ${scoreColor}`}>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              <span className="text-xl font-bold">{overallMatchScore}</span>
            </div>
            <p className="text-xs text-muted-foreground">Match</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {researchAreas.slice(0, 4).map((area) => (
            <Badge key={area} variant="secondary" className="text-xs">
              {area}
            </Badge>
          ))}
          {researchAreas.length > 4 && (
            <Badge variant="secondary" className="text-xs">
              +{researchAreas.length - 4}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          {hIndex !== null && (
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" /> h-index: {hIndex}
            </span>
          )}
          {fundingScore !== null && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" /> Funding: {fundingScore}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-4">
          {hasActiveFunding && (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Funded</Badge>
          )}
          {lookingForStudents && (
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Seeking Students</Badge>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Link href={`/discover/${id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              View Profile <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </Link>
          <Button size="sm" className="flex-1">
            Save Professor
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
