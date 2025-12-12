"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserPlus, Users } from "lucide-react";
import { ResourceCard } from "@/components/production/resource-card";
import { AddResourceDialog } from "@/components/production/add-resource-dialog";
import {
  useProductionResources,
  useCreateProductionResource,
  useUpdateProductionResource,
  useDeleteProductionResource,
} from "@/hooks/use-production";
import type { ProductionResourceWithUser, ProductionResourceInput } from "@/types/production";

export default function ProductionResourcesPage() {
  const { data: resources, isLoading } = useProductionResources();
  const createResource = useCreateProductionResource();
  const updateResource = useUpdateProductionResource();
  const deleteResource = useDeleteProductionResource();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ProductionResourceWithUser | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<ProductionResourceWithUser | null>(null);

  const existingUserIds = resources?.map((r) => r.user_id) || [];

  const handleAddResource = () => {
    setEditingResource(null);
    setDialogOpen(true);
  };

  const handleEditResource = (resource: ProductionResourceWithUser) => {
    setEditingResource(resource);
    setDialogOpen(true);
  };

  const handleDeleteClick = (resource: ProductionResourceWithUser) => {
    setResourceToDelete(resource);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!resourceToDelete) return;
    await deleteResource.mutateAsync(resourceToDelete.id);
    setDeleteConfirmOpen(false);
    setResourceToDelete(null);
  };

  const handleToggleAvailability = async (
    resource: ProductionResourceWithUser,
    available: boolean
  ) => {
    await updateResource.mutateAsync({
      id: resource.id,
      is_available: available,
    });
  };

  const handleSubmit = async (data: ProductionResourceInput) => {
    if (editingResource) {
      await updateResource.mutateAsync({
        id: editingResource.id,
        ...data,
      });
    } else {
      await createResource.mutateAsync(data);
    }
  };

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Production Resources</h1>
          <p className="text-muted-foreground">
            Manage team members and their production capabilities
          </p>
        </div>
        <Button onClick={handleAddResource}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Resource
        </Button>
      </div>

      {/* Resource List */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : resources && resources.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onEdit={handleEditResource}
              onDelete={handleDeleteClick}
              onToggleAvailability={handleToggleAvailability}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
          <Users className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-medium">No Resources Yet</h3>
          <p className="mb-4 text-center text-muted-foreground">
            Add team members to the production pool to start assigning tasks.
          </p>
          <Button onClick={handleAddResource}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Your First Resource
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <AddResourceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        editingResource={editingResource}
        existingUserIds={existingUserIds}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{resourceToDelete?.user.name || resourceToDelete?.user.email}</strong> from
              the production pool? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
