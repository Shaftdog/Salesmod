"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useResource, useUpdateResource, useToggleResourceBookable } from "@/hooks/use-resources";
import { useResourceSkills, useAddResourceSkill, useRemoveResourceSkill, useSkillTypes } from "@/hooks/use-skills";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Phone, MapPin, Shield, Award, Calendar, Settings, Plus } from "lucide-react";
import { AddSkillDialog } from "@/components/field-services/add-skill-dialog";
import { ResourceForm } from "@/components/field-services/resource-form";
import { usePrimaryTerritories } from "@/hooks/use-territories";
import { format } from "date-fns";

export default function ResourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const resourceId = params.id as string;

  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddSkill, setShowAddSkill] = useState(false);

  const { data: resource, isLoading } = useResource(resourceId);
  const { data: skills = [] } = useResourceSkills(resourceId);
  const { data: skillTypes = [] } = useSkillTypes();
  const { data: territories = [] } = usePrimaryTerritories();
  const { mutateAsync: toggleBookable } = useToggleResourceBookable();
  const { mutateAsync: removeSkill } = useRemoveResourceSkill();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Resource not found</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const handleToggleBookable = async () => {
    await toggleBookable({
      id: resource.id,
      isBookable: !resource.isBookable,
    });
  };

  const handleRemoveSkill = async (skillId: string) => {
    if (confirm("Remove this skill from the resource?")) {
      await removeSkill({ resourceId: resource.id, skillId });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Resources
        </Button>
        <div className="flex gap-2">
          <Button
            variant={resource.isBookable ? "destructive" : "default"}
            onClick={handleToggleBookable}
          >
            {resource.isBookable ? "Disable Booking" : "Enable Booking"}
          </Button>
          <Button onClick={() => setShowEditForm(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Edit Resource
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={resource.profile?.avatarUrl} />
              <AvatarFallback className="text-2xl">
                {resource.profile?.name?.[0] || "R"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-2xl">{resource.profile?.name || "Unknown"}</CardTitle>
                <Badge variant={resource.isBookable ? "default" : "secondary"} className="text-sm">
                  {resource.isBookable ? "Bookable" : "Unavailable"}
                </Badge>
                <Badge variant="outline" className="text-sm">{resource.resourceType}</Badge>
                {resource.employmentType && (
                  <Badge variant="outline" className="text-sm">{resource.employmentType}</Badge>
                )}
              </div>
              <CardDescription className="text-base">{resource.profile?.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Contact Method</div>
              <div className="font-medium capitalize">{resource.preferredContactMethod}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Max Daily Appointments</div>
              <div className="font-medium">{resource.maxDailyAppointments}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Completed Inspections</div>
              <div className="font-medium">{resource.totalInspectionsCompleted}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Avg Duration</div>
              <div className="font-medium">
                {resource.avgInspectionDurationMinutes || 0} min
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills & Certifications</TabsTrigger>
          <TabsTrigger value="license">License & Insurance</TabsTrigger>
          <TabsTrigger value="compensation">Compensation</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Territory Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Territory Coverage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {resource.primaryTerritory ? (
                  <>
                    <div>
                      <div className="text-sm text-muted-foreground">Primary Territory</div>
                      <div className="font-medium flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: resource.primaryTerritory.colorHex }}
                        />
                        {resource.primaryTerritory.name}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Type</div>
                      <Badge variant="outline">{resource.primaryTerritory.territoryType}</Badge>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No territory assigned</p>
                )}
              </CardContent>
            </Card>

            {/* Capacity Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Capacity & Scheduling
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Max Appointments/Day</div>
                  <div className="font-medium">{resource.maxDailyAppointments}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Max Weekly Hours</div>
                  <div className="font-medium">{resource.maxWeeklyHours} hours</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Booking Buffer</div>
                  <div className="font-medium">{resource.bookingBufferMinutes} minutes</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Timezone</div>
                  <div className="font-medium">{resource.timezone}</div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            {resource.emergencyContactName && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Name</div>
                    <div className="font-medium">{resource.emergencyContactName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div className="font-medium">{resource.emergencyContactPhone}</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Skills & Certifications
                  </CardTitle>
                  <CardDescription>
                    Manage skills, certifications, and proficiency levels
                  </CardDescription>
                </div>
                <Button onClick={() => setShowAddSkill(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Skill
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {skills.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No skills assigned yet</p>
                  <Button onClick={() => setShowAddSkill(true)} variant="outline" className="mt-4">
                    Add First Skill
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-medium">{skill.skillType?.name}</h4>
                          <Badge variant="outline">{skill.proficiencyLevel}</Badge>
                          {skill.skillType?.category && (
                            <Badge variant="secondary">{skill.skillType.category}</Badge>
                          )}
                          {skill.isVerified && (
                            <Badge variant="default" className="bg-green-600">Verified</Badge>
                          )}
                        </div>
                        {skill.skillType?.description && (
                          <p className="text-sm text-muted-foreground">
                            {skill.skillType.description}
                          </p>
                        )}
                        {skill.certificationNumber && (
                          <div className="mt-2 text-sm">
                            <span className="text-muted-foreground">Cert #: </span>
                            <span className="font-mono">{skill.certificationNumber}</span>
                          </div>
                        )}
                        {skill.expiryDate && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Expires: </span>
                            <span className={new Date(skill.expiryDate) < new Date() ? "text-red-600 font-medium" : ""}>
                              {format(new Date(skill.expiryDate), "MMM dd, yyyy")}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSkill(skill.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* License & Insurance Tab */}
        <TabsContent value="license" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  License Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {resource.licenseNumber ? (
                  <>
                    <div>
                      <div className="text-sm text-muted-foreground">License Number</div>
                      <div className="font-mono font-medium">{resource.licenseNumber}</div>
                    </div>
                    {resource.licenseState && (
                      <div>
                        <div className="text-sm text-muted-foreground">State</div>
                        <div className="font-medium">{resource.licenseState}</div>
                      </div>
                    )}
                    {resource.licenseExpiry && (
                      <div>
                        <div className="text-sm text-muted-foreground">Expiry Date</div>
                        <div className={new Date(resource.licenseExpiry) < new Date() ? "text-red-600 font-medium" : "font-medium"}>
                          {format(new Date(resource.licenseExpiry), "MMM dd, yyyy")}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No license information on file</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Errors & Omissions Insurance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {resource.errorsAndOmissionsCarrier ? (
                  <>
                    <div>
                      <div className="text-sm text-muted-foreground">Carrier</div>
                      <div className="font-medium">{resource.errorsAndOmissionsCarrier}</div>
                    </div>
                    {resource.errorsAndOmissionsAmount && (
                      <div>
                        <div className="text-sm text-muted-foreground">Coverage Amount</div>
                        <div className="font-medium">
                          ${resource.errorsAndOmissionsAmount.toLocaleString()}
                        </div>
                      </div>
                    )}
                    {resource.errorsAndOmissionsExpiry && (
                      <div>
                        <div className="text-sm text-muted-foreground">Expiry Date</div>
                        <div className={new Date(resource.errorsAndOmissionsExpiry) < new Date() ? "text-red-600 font-medium" : "font-medium"}>
                          {format(new Date(resource.errorsAndOmissionsExpiry), "MMM dd, yyyy")}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No E&O insurance on file</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compensation Tab */}
        <TabsContent value="compensation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Compensation Structure</CardTitle>
              <CardDescription>
                {resource.employmentType === "staff" ? "Hourly rates and overtime" : "Per-inspection rates and splits"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {resource.employmentType === "staff" ? (
                  <>
                    {resource.hourlyRate && (
                      <div>
                        <div className="text-sm text-muted-foreground">Hourly Rate</div>
                        <div className="text-2xl font-bold">${resource.hourlyRate.toFixed(2)}/hr</div>
                      </div>
                    )}
                    {resource.overtimeRate && (
                      <div>
                        <div className="text-sm text-muted-foreground">Overtime Rate</div>
                        <div className="text-2xl font-bold">${resource.overtimeRate.toFixed(2)}/hr</div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {resource.perInspectionRate && (
                      <div>
                        <div className="text-sm text-muted-foreground">Per Inspection</div>
                        <div className="text-2xl font-bold">${resource.perInspectionRate.toFixed(2)}</div>
                      </div>
                    )}
                    {resource.splitPercentage && (
                      <div>
                        <div className="text-sm text-muted-foreground">Revenue Split</div>
                        <div className="text-2xl font-bold">{resource.splitPercentage}%</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Form Dialog */}
      <ResourceForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        resource={resource}
        territories={territories}
        skillTypes={skillTypes}
      />

      {/* Add Skill Dialog */}
      <AddSkillDialog
        open={showAddSkill}
        onOpenChange={setShowAddSkill}
        resourceId={resource.id}
        availableSkills={skillTypes.filter(
          (st) => !skills.find((s) => s.skillTypeId === st.id)
        )}
      />
    </div>
  );
}
