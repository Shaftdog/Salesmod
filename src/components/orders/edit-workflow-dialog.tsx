"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useUpdateOrder } from "@/hooks/use-orders";
import { Order } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface EditWorkflowDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditWorkflowDialog({ order, open, onOpenChange }: EditWorkflowDialogProps) {
  const updateOrder = useUpdateOrder();
  
  // Form state
  const [scopeOfWork, setScopeOfWork] = useState(order.scopeOfWork || '');
  const [intendedUse, setIntendedUse] = useState(order.intendedUse || '');
  const [reportFormType, setReportFormType] = useState(order.reportFormType || '');
  const [additionalForms, setAdditionalForms] = useState(order.additionalForms?.join(', ') || '');
  const [billingMethod, setBillingMethod] = useState(order.billingMethod || '');
  const [salesCampaign, setSalesCampaign] = useState(order.salesCampaign || '');
  const [serviceRegion, setServiceRegion] = useState(order.serviceRegion || '');
  const [siteInfluence, setSiteInfluence] = useState(order.siteInfluence || 'none');
  const [zoningType, setZoningType] = useState(order.zoningType || 'residential');
  const [isMultiunit, setIsMultiunit] = useState(order.isMultiunit || false);
  const [multiunitType, setMultiunitType] = useState(order.multiunitType || '');
  const [isNewConstruction, setIsNewConstruction] = useState(order.isNewConstruction || false);
  const [newConstructionType, setNewConstructionType] = useState(order.newConstructionType || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const updates = {
      id: order.id,
      scopeOfWork,
      intendedUse,
      reportFormType,
      additionalForms: additionalForms ? additionalForms.split(',').map(f => f.trim()).filter(Boolean) : [],
      billingMethod,
      salesCampaign,
      serviceRegion,
      siteInfluence,
      zoningType,
      isMultiunit,
      multiunitType: isMultiunit ? multiunitType : null,
      isNewConstruction,
      newConstructionType: isNewConstruction ? newConstructionType : null,
    };

    await updateOrder.mutateAsync(updates);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Appraisal Workflow Details</DialogTitle>
          <DialogDescription>
            Update scope, forms, and workflow configuration for {order.orderNumber}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scopeOfWork">Scope of Work</Label>
                <Select value={scopeOfWork} onValueChange={setScopeOfWork}>
                  <SelectTrigger id="scopeOfWork">
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interior">Interior Appraisal</SelectItem>
                    <SelectItem value="exterior_only">Exterior Only</SelectItem>
                    <SelectItem value="desktop">Desktop Appraisal</SelectItem>
                    <SelectItem value="inspection_only">Inspection Only</SelectItem>
                    <SelectItem value="desk_review">Desk Review</SelectItem>
                    <SelectItem value="field_review">Field Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="intendedUse">Intended Use / Purpose</Label>
                <Input
                  id="intendedUse"
                  value={intendedUse}
                  onChange={(e) => setIntendedUse(e.target.value)}
                  placeholder="e.g., Refinance, Purchase, FHA"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reportFormType">Report Form Type</Label>
                <Input
                  id="reportFormType"
                  value={reportFormType}
                  onChange={(e) => setReportFormType(e.target.value)}
                  placeholder="e.g., 1004, 1073, 2055, 1025"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalForms">Additional Forms (comma separated)</Label>
                <Input
                  id="additionalForms"
                  value={additionalForms}
                  onChange={(e) => setAdditionalForms(e.target.value)}
                  placeholder="e.g., 1007, REO Addendum"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billingMethod">Billing Method</Label>
                <Select value={billingMethod} onValueChange={setBillingMethod}>
                  <SelectTrigger id="billingMethod">
                    <SelectValue placeholder="Select billing method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bill">Bill (Invoice)</SelectItem>
                    <SelectItem value="online">Online (Prepaid)</SelectItem>
                    <SelectItem value="cod">COD (Cash on Delivery)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serviceRegion">Service Region</Label>
                <Input
                  id="serviceRegion"
                  value={serviceRegion}
                  onChange={(e) => setServiceRegion(e.target.value)}
                  placeholder="e.g., ORL-SW-PRIMARY, TAMPA-NE"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salesCampaign">Sales Campaign</Label>
                <Select value={salesCampaign} onValueChange={setSalesCampaign}>
                  <SelectTrigger id="salesCampaign">
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client_selection">Client Selection</SelectItem>
                    <SelectItem value="bid_request">Bid Request</SelectItem>
                    <SelectItem value="networking">Networking</SelectItem>
                    <SelectItem value="new_client">New Client</SelectItem>
                    <SelectItem value="prospecting">Prospecting</SelectItem>
                    <SelectItem value="case_management">Case Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteInfluence">Site Influence</Label>
                <Select value={siteInfluence} onValueChange={(value) => setSiteInfluence(value as any)}>
                  <SelectTrigger id="siteInfluence">
                    <SelectValue placeholder="Select site influence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="water">Waterfront</SelectItem>
                    <SelectItem value="commercial">Commercial Adjacency</SelectItem>
                    <SelectItem value="woods">Wooded</SelectItem>
                    <SelectItem value="golf_course">Golf Course</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zoningType">Zoning Type</Label>
                <Select value={zoningType} onValueChange={(value) => setZoningType(value as any)}>
                  <SelectTrigger id="zoningType">
                    <SelectValue placeholder="Select zoning" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="planned_unit_development">Planned Unit Development</SelectItem>
                    <SelectItem value="two_unit">2 Unit</SelectItem>
                    <SelectItem value="three_unit">3 Unit</SelectItem>
                    <SelectItem value="four_unit">4 Unit</SelectItem>
                    <SelectItem value="mixed_use">Mixed Use</SelectItem>
                    <SelectItem value="agricultural">Agricultural</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isMultiunit"
                    checked={isMultiunit}
                    onCheckedChange={(checked) => setIsMultiunit(checked as boolean)}
                  />
                  <Label htmlFor="isMultiunit" className="cursor-pointer">
                    Multiunit Property
                  </Label>
                </div>
                
                {isMultiunit && (
                  <Select value={multiunitType} onValueChange={(value) => setMultiunitType(value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select multiunit type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adu_apartment_inlaw">ADU/Apartment/In-law</SelectItem>
                      <SelectItem value="two_unit">2 Units</SelectItem>
                      <SelectItem value="three_unit">3 Units</SelectItem>
                      <SelectItem value="four_unit">4 Units</SelectItem>
                      <SelectItem value="five_plus_commercial">5+ Units (Commercial)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isNewConstruction"
                    checked={isNewConstruction}
                    onCheckedChange={(checked) => setIsNewConstruction(checked as boolean)}
                  />
                  <Label htmlFor="isNewConstruction" className="cursor-pointer">
                    New Construction
                  </Label>
                </div>
                
                {isNewConstruction && (
                  <Select value={newConstructionType} onValueChange={(value) => setNewConstructionType(value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select construction type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="community_builder">Community Builder</SelectItem>
                      <SelectItem value="spec_custom">Spec/Custom</SelectItem>
                      <SelectItem value="refinance_newly_constructed">Refinance Newly Constructed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateOrder.isPending}>
              {updateOrder.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

