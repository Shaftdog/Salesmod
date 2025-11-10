"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useResources, useSaveResource, useUpdateResource, useToggleResourceBookable } from "@/hooks/use-resources";
import { usePrimaryTerritories } from "@/hooks/use-territories";
import { useSkillTypes } from "@/hooks/use-skills";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Users, UserCheck, UserX, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ResourceForm } from "@/components/field-services/resource-form";
import type { BookableResource, ResourceType } from "@/lib/types";
import Link from "next/link";

export default function ResourcesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState<BookableResource | null>(null);
  const [filterType, setFilterType] = useState<ResourceType | "all">("all");
  const [filterBookable, setFilterBookable] = useState<"all" | "bookable" | "unavailable">("all");

  const { data: allResources = [], isLoading } = useResources({
    resourceType: filterType === "all" ? undefined : filterType,
  });
  const { data: territories = [] } = usePrimaryTerritories();
  const { data: skillTypes = [] } = useSkillTypes();
  const { mutateAsync: toggleBookable } = useToggleResourceBookable();

  // Apply bookable filter
  const filteredResources = allResources.filter((resource) => {
    if (filterBookable === "bookable") return resource.isBookable;
    if (filterBookable === "unavailable") return !resource.isBookable;
    return true;
  });

  const handleAdd = () => {
    setEditingResource(null);
    setShowForm(true);
  };

  const handleEdit = (resource: BookableResource) => {
    setEditingResource(resource);
    setShowForm(true);
  };

  const handleToggleBookable = async (resource: BookableResource) => {
    await toggleBookable({
      id: resource.id,
      isBookable: !resource.isBookable,
    });
  };

  const stats = {
    total: allResources.length,
    bookable: allResources.filter((r) => r.isBookable).length,
    appraisers: allResources.filter((r) => r.resourceType === "appraiser").length,
    staff: allResources.filter((r) => r.employmentType === "staff").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookable</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bookable}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appraisers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.appraisers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.staff}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Resources Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Field Resources</CardTitle>
              <CardDescription>
                Manage appraisers, equipment, and field service resources
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/field-services/territories">
                  <Settings className="mr-2 h-4 w-4" />
                  Territories
                </Link>
              </Button>
              <Button onClick={handleAdd}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Resource
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={filterBookable} onValueChange={(v) => setFilterBookable(v as any)} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Resources</TabsTrigger>
              <TabsTrigger value="bookable">Bookable</TabsTrigger>
              <TabsTrigger value="unavailable">Unavailable</TabsTrigger>
            </TabsList>

            {/* Filter by Resource Type */}
            <div className="flex gap-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
              >
                All Types
              </Button>
              <Button
                variant={filterType === "appraiser" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("appraiser")}
              >
                Appraisers
              </Button>
              <Button
                variant={filterType === "equipment" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("equipment")}
              >
                Equipment
              </Button>
              <Button
                variant={filterType === "vehicle" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("vehicle")}
              >
                Vehicles
              </Button>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <>
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </>
              ) : filteredResources.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <UserX className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No resources found</p>
                  <Button onClick={handleAdd} variant="outline" className="mt-4">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Resource
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredResources.map((resource) => (
                    <Card key={resource.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={resource.profile?.avatarUrl} />
                              <AvatarFallback>
                                {resource.profile?.name?.[0] || "R"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-base">
                                {resource.profile?.name || "Unknown"}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {resource.profile?.email}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant={resource.isBookable ? "default" : "secondary"}>
                            {resource.isBookable ? "Bookable" : "Unavailable"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{resource.resourceType}</Badge>
                          {resource.employmentType && (
                            <Badge variant="outline">{resource.employmentType}</Badge>
                          )}
                        </div>

                        {resource.primaryTerritory && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Territory: </span>
                            <span className="font-medium">{resource.primaryTerritory.name}</span>
                          </div>
                        )}

                        <div className="text-sm text-muted-foreground">
                          <div>Max {resource.maxDailyAppointments} appointments/day</div>
                          <div>{resource.totalInspectionsCompleted} completed inspections</div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleEdit(resource)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant={resource.isBookable ? "destructive" : "default"}
                            size="sm"
                            className="flex-1"
                            onClick={() => handleToggleBookable(resource)}
                          >
                            {resource.isBookable ? "Disable" : "Enable"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      <ResourceForm
        open={showForm}
        onOpenChange={setShowForm}
        resource={editingResource}
        territories={territories}
        skillTypes={skillTypes}
      />
    </div>
  );
}
