"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTerritories, useCreateTerritory, useUpdateTerritory, useDeleteTerritory } from "@/hooks/use-territories";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, MapPin, Trash2, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TerritoryForm } from "@/components/field-services/territory-form";
import type { ServiceTerritory } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TerritoriesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingTerritory, setEditingTerritory] = useState<ServiceTerritory | null>(null);

  const { data: territories = [], isLoading } = useTerritories();
  const { mutateAsync: deleteTerritory } = useDeleteTerritory();
  const router = useRouter();

  const handleAdd = () => {
    setEditingTerritory(null);
    setShowForm(true);
  };

  const handleEdit = (territory: ServiceTerritory) => {
    setEditingTerritory(territory);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this territory?")) {
      await deleteTerritory(id);
    }
  };

  const territoryStats = {
    total: territories.length,
    primary: territories.filter((t) => t.territoryType === "primary").length,
    secondary: territories.filter((t) => t.territoryType === "secondary").length,
    extended: territories.filter((t) => t.territoryType === "extended").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Territories</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{territoryStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Primary</CardTitle>
            <MapPin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{territoryStats.primary}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Secondary</CardTitle>
            <MapPin className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{territoryStats.secondary}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Extended</CardTitle>
            <MapPin className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{territoryStats.extended}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Territories Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Service Territories</CardTitle>
              <CardDescription>
                Define geographic coverage areas for field operations
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                Back to Resources
              </Button>
              <Button onClick={handleAdd}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Territory
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </>
            ) : territories.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No territories defined</p>
                <Button onClick={handleAdd} variant="outline" className="mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Territory
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {territories.map((territory) => (
                  <Card key={territory.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: territory.colorHex }}
                          />
                          <div>
                            <CardTitle className="text-base">{territory.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {territory.description || "No description"}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline">{territory.territoryType}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2 text-sm">
                        {territory.zipCodes && territory.zipCodes.length > 0 && (
                          <div>
                            <span className="text-muted-foreground">ZIP Codes: </span>
                            <span className="font-medium">
                              {territory.zipCodes.slice(0, 3).join(", ")}
                              {territory.zipCodes.length > 3 && ` +${territory.zipCodes.length - 3} more`}
                            </span>
                          </div>
                        )}
                        {territory.cities && territory.cities.length > 0 && (
                          <div>
                            <span className="text-muted-foreground">Cities: </span>
                            <span className="font-medium">
                              {territory.cities.slice(0, 2).join(", ")}
                              {territory.cities.length > 2 && ` +${territory.cities.length - 2} more`}
                            </span>
                          </div>
                        )}
                        {territory.counties && territory.counties.length > 0 && (
                          <div>
                            <span className="text-muted-foreground">Counties: </span>
                            <span className="font-medium">{territory.counties.join(", ")}</span>
                          </div>
                        )}
                        {territory.radiusMiles && (
                          <div>
                            <span className="text-muted-foreground">Radius: </span>
                            <span className="font-medium">{territory.radiusMiles} miles</span>
                          </div>
                        )}
                      </div>

                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Travel Fee: ${territory.travelFee || 0}</div>
                        <div>Mileage Rate: ${territory.mileageRate}/mile</div>
                        {territory.baseTravelTimeMinutes > 0 && (
                          <div>Base Travel: {territory.baseTravelTimeMinutes} min</div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEdit(territory)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(territory.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <TerritoryForm
        open={showForm}
        onOpenChange={setShowForm}
        territory={editingTerritory}
      />
    </div>
  );
}
