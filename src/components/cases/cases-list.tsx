"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CaseCard } from "./case-card";
import { CaseForm } from "./case-form";
import { useCases, useCreateCase, useUpdateCase } from "@/hooks/use-cases";
import { useClients } from "@/hooks/use-clients";
import { useOrders } from "@/hooks/use-orders";
import { useCurrentUser } from "@/hooks/use-appraisers";
import type { Case } from "@/lib/types";
import { Plus, Search, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { caseStatuses, casePriorities, caseTypes } from "@/lib/types";

type CasesListProps = {
  clientId?: string;
  orderId?: string;
};

export function CasesList({ clientId, orderId }: CasesListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Fetch data
  const { data: cases = [], isLoading } = useCases({ clientId, orderId });
  const { clients = [] } = useClients();
  const { orders = [] } = useOrders();
  const { data: currentUser } = useCurrentUser();
  const createCase = useCreateCase();
  const updateCase = useUpdateCase();

  // Debug logging
  console.log('[CasesList] clients count:', clients.length);
  console.log('[CasesList] orders count:', orders.length);
  console.log('[CasesList] clients sample:', clients[0]);
  console.log('[CasesList] orders sample:', orders[0]);

  const handleSubmit = async (data: any) => {
    if (!currentUser) return;
    
    if (editingCase) {
      await updateCase.mutateAsync({
        id: editingCase.id,
        ...data,
      });
    } else {
      await createCase.mutateAsync({
        ...data,
        created_by: currentUser.id,
      });
    }
    setEditingCase(undefined);
  };

  const handleEdit = (caseItem: Case) => {
    setEditingCase(caseItem);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCase(undefined);
  };

  // Filter cases
  const filteredCases = cases.filter((caseItem) => {
    const matchesSearch = caseItem.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         caseItem.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (caseItem.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    const matchesStatus = statusFilter === "all" || caseItem.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || caseItem.priority === priorityFilter;
    const matchesType = typeFilter === "all" || caseItem.caseType === typeFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  // Helper function to format case type for display
  const formatCaseType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Cases</h2>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Case
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {caseStatuses.map((status) => (
              <SelectItem key={status} value={status} className="capitalize">
                {status.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {casePriorities.map((priority) => (
              <SelectItem key={priority} value={priority} className="capitalize">
                {priority}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {caseTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {formatCaseType(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredCases.length} of {cases.length} cases
      </div>

      {/* Cases Grid */}
      {filteredCases.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== "all" || priorityFilter !== "all" || typeFilter !== "all" 
              ? "No cases match your filters"
              : "No cases yet. Create your first case to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCases.map((caseItem) => (
            <CaseCard key={caseItem.id} case={caseItem} onEdit={handleEdit} />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <CaseForm
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        onSubmit={handleSubmit}
        case={editingCase}
        clients={clients}
        orders={orders}
        isLoading={createCase.isPending || updateCase.isPending}
      />
    </div>
  );
}

