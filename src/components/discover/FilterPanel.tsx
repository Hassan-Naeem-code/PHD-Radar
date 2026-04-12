"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";

interface Filters {
  fundingRequired?: boolean;
  country?: string;
  rankingMax?: number;
  lookingForStudents?: boolean;
}

interface FilterPanelProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal className="h-4 w-4" />
        <h3 className="font-medium text-sm">Filters</h3>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label className="text-xs">Funding Required</Label>
          <Select
            value={filters.fundingRequired?.toString() ?? "any"}
            onValueChange={(v) => {
              const val = v ?? "any";
              onFiltersChange({ ...filters, fundingRequired: val === "any" ? undefined : val === "true" });
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Country</Label>
          <Select
            value={filters.country ?? "any"}
            onValueChange={(v) => {
              const val = v ?? "any";
              onFiltersChange({ ...filters, country: val === "any" ? undefined : val });
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="CA">Canada</SelectItem>
              <SelectItem value="UK">United Kingdom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Max CS Ranking</Label>
          <Select
            value={filters.rankingMax?.toString() ?? "any"}
            onValueChange={(v) => {
              const val = v ?? "any";
              onFiltersChange({ ...filters, rankingMax: val === "any" ? undefined : parseInt(val) });
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="50">Top 50</SelectItem>
              <SelectItem value="100">Top 100</SelectItem>
              <SelectItem value="200">Top 200</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Looking for Students</Label>
          <Select
            value={filters.lookingForStudents?.toString() ?? "any"}
            onValueChange={(v) => {
              const val = v ?? "any";
              onFiltersChange({ ...filters, lookingForStudents: val === "any" ? undefined : val === "true" });
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="mt-3"
        onClick={() => onFiltersChange({})}
      >
        Clear filters
      </Button>
    </div>
  );
}
