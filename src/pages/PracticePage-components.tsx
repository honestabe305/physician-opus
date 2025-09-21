// Additional components for PracticePage - Physician Management Dialog
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  MapPin,
  Plus,
  XCircle,
  Loader2,
} from "lucide-react";
import type { SelectPhysician } from "../../shared/schema";

// Physician Management Dialog Content Component
interface PhysicianManagementDialogContentProps {
  practiceId: string | null;
  physicians: SelectPhysician[];
  practiceMap: Map<string, string>;
  selectedPhysicians: Set<string>;
  setSelectedPhysicians: (physicians: Set<string>) => void;
  locationFilter: string;
  setLocationFilter: (filter: string) => void;
  onBulkAssign: (physicianIds: string[]) => void;
  onBulkUnassign: (physicianIds: string[]) => void;
  isAssigning: boolean;
  isUnassigning: boolean;
}

export function PhysicianManagementDialogContent({
  practiceId,
  physicians,
  practiceMap,
  selectedPhysicians,
  setSelectedPhysicians,
  locationFilter,
  setLocationFilter,
  onBulkAssign,
  onBulkUnassign,
  isAssigning,
  isUnassigning
}: PhysicianManagementDialogContentProps) {
  
  // Split physicians into assigned and available
  const assignedPhysicians = physicians.filter(p => p.practiceId === practiceId);
  const availablePhysicians = physicians.filter(p => {
    const isAvailable = p.practiceId !== practiceId;
    const matchesLocation = !locationFilter || 
      (p.homeAddress && p.homeAddress.toLowerCase().includes(locationFilter.toLowerCase()));
    return isAvailable && matchesLocation;
  });

  const handlePhysicianToggle = (physicianId: string) => {
    const newSelected = new Set(selectedPhysicians);
    if (newSelected.has(physicianId)) {
      newSelected.delete(physicianId);
    } else {
      newSelected.add(physicianId);
    }
    setSelectedPhysicians(newSelected);
  };

  const handleSelectAll = (physicianList: SelectPhysician[]) => {
    const newSelected = new Set(selectedPhysicians);
    physicianList.forEach(p => newSelected.add(p.id));
    setSelectedPhysicians(newSelected);
  };

  const handleDeselectAll = () => {
    setSelectedPhysicians(new Set());
  };

  const selectedAssignedCount = assignedPhysicians.filter(p => selectedPhysicians.has(p.id)).length;
  const selectedAvailableCount = availablePhysicians.filter(p => selectedPhysicians.has(p.id)).length;

  return (
    <div className="flex-1 overflow-hidden flex flex-col space-y-4">
      {/* Location Filter */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2 flex-1">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by location (state, city, etc.)"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="max-w-sm"
            data-testid="input-location-filter"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSelectAll(availablePhysicians)}
            data-testid="button-select-all-available"
          >
            Select All Available
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSelectAll(assignedPhysicians)}
            data-testid="button-select-all-assigned"
          >
            Select All Assigned
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeselectAll}
            data-testid="button-deselect-all"
          >
            Deselect All
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 p-4 bg-primary/5 rounded-lg">
        <div className="flex-1 text-sm text-muted-foreground">
          Selected: {selectedPhysicians.size} physicians
          {selectedAvailableCount > 0 && ` (${selectedAvailableCount} available)`}
          {selectedAssignedCount > 0 && ` (${selectedAssignedCount} assigned)`}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => onBulkAssign(Array.from(selectedPhysicians).filter(id => 
              availablePhysicians.some(p => p.id === id)
            ))}
            disabled={selectedAvailableCount === 0 || isAssigning}
            data-testid="button-bulk-assign"
          >
            {isAssigning ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Assign Selected ({selectedAvailableCount})
          </Button>
          <Button
            variant="destructive"
            onClick={() => onBulkUnassign(Array.from(selectedPhysicians).filter(id => 
              assignedPhysicians.some(p => p.id === id)
            ))}
            disabled={selectedAssignedCount === 0 || isUnassigning}
            data-testid="button-bulk-unassign"
          >
            {isUnassigning ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            Unassign Selected ({selectedAssignedCount})
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="available" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="available" data-testid="tab-available-physicians">
              Available Physicians ({availablePhysicians.length})
            </TabsTrigger>
            <TabsTrigger value="assigned" data-testid="tab-assigned-physicians">
              Assigned Physicians ({assignedPhysicians.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="available" className="flex-1 overflow-hidden">
            <PhysicianList
              physicians={availablePhysicians}
              selectedPhysicians={selectedPhysicians}
              onPhysicianToggle={handlePhysicianToggle}
              practiceMap={practiceMap}
              showPractice={true}
            />
          </TabsContent>
          
          <TabsContent value="assigned" className="flex-1 overflow-hidden">
            <PhysicianList
              physicians={assignedPhysicians}
              selectedPhysicians={selectedPhysicians}
              onPhysicianToggle={handlePhysicianToggle}
              practiceMap={practiceMap}
              showPractice={false}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Physician List Component for the dialog
interface PhysicianListProps {
  physicians: SelectPhysician[];
  selectedPhysicians: Set<string>;
  onPhysicianToggle: (physicianId: string) => void;
  practiceMap: Map<string, string>;
  showPractice: boolean;
}

export function PhysicianList({ physicians, selectedPhysicians, onPhysicianToggle, practiceMap, showPractice }: PhysicianListProps) {
  if (physicians.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        No physicians found
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Select</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>NPI</TableHead>
            {showPractice && <TableHead>Current Practice</TableHead>}
            <TableHead>Location</TableHead>
            <TableHead>Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {physicians.map((physician) => (
            <TableRow key={physician.id}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedPhysicians.has(physician.id)}
                  onChange={() => onPhysicianToggle(physician.id)}
                  data-testid={`checkbox-physician-${physician.id}`}
                  className="h-4 w-4"
                />
              </TableCell>
              <TableCell className="font-medium">{physician.fullLegalName}</TableCell>
              <TableCell className="font-mono text-sm">{physician.npi || 'N/A'}</TableCell>
              {showPractice && (
                <TableCell>
                  {physician.practiceId ? (
                    <span className="text-sm">{practiceMap.get(physician.practiceId) || 'Unknown'}</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">None</span>
                  )}
                </TableCell>
              )}
              <TableCell className="text-sm">
                {physician.homeAddress ? (
                  <span className="line-clamp-1">{physician.homeAddress}</span>
                ) : (
                  <span className="text-muted-foreground">No address</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {physician.clinicianType || 'N/A'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}