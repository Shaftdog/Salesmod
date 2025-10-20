"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProperties } from '@/hooks/use-properties';
import { PropertyFilters } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Building, Calendar, DollarSign, RefreshCw, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBackfillProperties, useBackfillStatus } from '@/hooks/use-properties';
import { AddPropertyDialog } from '@/components/properties/add-property-dialog';
import { VerificationBadge } from '@/components/shared/verification-badge';
import { usePropertyUnits } from '@/hooks/use-property-units';
import { ChevronRight, ChevronDown } from 'lucide-react';

export default function PropertiesPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [filters, setFilters] = useState<PropertyFilters>({
    page: 1,
    limit: 50
  });
  const [expandedProperties, setExpandedProperties] = useState<Set<string>>(new Set());

  const { data, isLoading, error} = useProperties(filters);
  const backfillMutation = useBackfillProperties();
  const { data: backfillStatus } = useBackfillStatus();
  
  const toggleExpanded = (propertyId: string) => {
    setExpandedProperties(prev => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
      } else {
        newSet.add(propertyId);
      }
      return newSet;
    });
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value || undefined, page: 1 }));
  };

  const handleFilterChange = (key: keyof PropertyFilters, value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value || undefined, 
      page: 1 
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleBackfill = async () => {
    try {
      const result = await backfillMutation.mutateAsync({
        pageSize: 1000,
        dryRun: false
      });
      
      toast({
        title: "Backfill Completed",
        description: `Created ${result.result.propertiesCreated} properties, linked ${result.result.ordersLinked} orders`,
      });
    } catch (error) {
      toast({
        title: "Backfill Failed",
        description: "Failed to backfill properties",
        variant: "destructive",
      });
    }
  };

  const formatAddress = (property: any) => {
    const parts = [
      property.address_line1,
      property.address_line2,
      `${property.city}, ${property.state} ${property.postal_code}`
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  const getPropertyTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      single_family: 'bg-blue-100 text-blue-800',
      condo: 'bg-green-100 text-green-800',
      multi_family: 'bg-purple-100 text-purple-800',
      commercial: 'bg-orange-100 text-orange-800',
      land: 'bg-gray-100 text-gray-800',
      manufactured: 'bg-yellow-100 text-yellow-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Properties</h2>
              <p className="text-gray-600">Failed to load properties. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Properties</h1>
          <p className="text-gray-600">Manage and view property information with USPAP compliance</p>
        </div>
        
        <div className="flex gap-2">
          <AddPropertyDialog />
          <Button
            onClick={handleBackfill}
            disabled={backfillMutation.isPending}
            variant="outline"
            size="sm"
          >
            {backfillMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Backfill Properties
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {backfillStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Properties</p>
                  <p className="text-2xl font-bold">{backfillStatus.statistics.totalProperties}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <MapPin className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Linked Orders</p>
                  <p className="text-2xl font-bold">{backfillStatus.statistics.linkedOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Unlinked Orders</p>
                  <p className="text-2xl font-bold">{backfillStatus.statistics.unlinkedOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold">{backfillStatus.statistics.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Properties</CardTitle>
          <CardDescription>Find properties by address, location, or type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search addresses..."
                value={filters.search || ''}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Input
              placeholder="City"
              value={filters.city || ''}
              onChange={(e) => handleFilterChange('city', e.target.value)}
            />
            
            <Input
              placeholder="State"
              value={filters.state || ''}
              onChange={(e) => handleFilterChange('state', e.target.value)}
              maxLength={2}
            />
            
            <Input
              placeholder="ZIP Code"
              value={filters.zip || ''}
              onChange={(e) => handleFilterChange('zip', e.target.value)}
            />
            
            <Select
              value={filters.propertyType || 'all'}
              onValueChange={(value) => handleFilterChange('propertyType', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="single_family">Single Family</SelectItem>
                <SelectItem value="condo">Condo</SelectItem>
                <SelectItem value="multi_family">Multi Family</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="land">Land</SelectItem>
                <SelectItem value="manufactured">Manufactured</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle>Properties ({data?.total || 0})</CardTitle>
          <CardDescription>
            {data?.total || 0} properties found
            {filters.search && ` matching "${filters.search}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prior Work (3y)</TableHead>
                    <TableHead>APN</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.properties?.map((property: any) => (
                    <PropertyRowWithUnits
                      key={property.id}
                      property={property}
                      isExpanded={expandedProperties.has(property.id)}
                      onToggleExpanded={() => toggleExpanded(property.id)}
                      formatAddress={formatAddress}
                      getPropertyTypeColor={getPropertyTypeColor}
                      router={router}
                    />
                  ))}
                </TableBody>
              </Table>

              {data?.properties?.length === 0 && (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties Found</h3>
                  <p className="text-gray-600">
                    {filters.search || filters.city || filters.state || filters.zip || filters.propertyType
                      ? "Try adjusting your search criteria"
                      : "No properties have been created yet. Import orders to automatically create properties."
                    }
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(filters.page! - 1)}
            disabled={filters.page === 1}
          >
            Previous
          </Button>
          
          <span className="text-sm text-gray-600">
            Page {filters.page} of {data.totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(filters.page! + 1)}
            disabled={filters.page === data.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// Property row with expandable units
function PropertyRowWithUnits({
  property,
  isExpanded,
  onToggleExpanded,
  formatAddress,
  getPropertyTypeColor,
  router,
}: {
  property: any;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  formatAddress: (property: any) => string;
  getPropertyTypeColor: (type: string) => string;
  router: any;
}) {
  const { data: units = [], isLoading: unitsLoading } = usePropertyUnits(
    isExpanded ? property.id : undefined
  );
  
  const hasUnits = ['condo', 'multi_family', 'townhouse'].includes(property.property_type);
  
  return (
    <>
      {/* Main property row */}
      <TableRow>
        <TableCell>
          {hasUnits && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onToggleExpanded}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
        </TableCell>
        <TableCell>
          <div>
            <div className="font-medium">{formatAddress(property)}</div>
            <div className="text-sm text-gray-500">
              {property.city}, {property.state} {property.postal_code}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge className={getPropertyTypeColor(property.property_type)}>
            {property.property_type.replace('_', ' ')}
          </Badge>
        </TableCell>
        <TableCell>
          <VerificationBadge 
            status={property.validation_status}
            source={property.verification_source}
            size="sm"
          />
        </TableCell>
        <TableCell>
          <Badge variant={property.priorWork3y > 0 ? "destructive" : "secondary"}>
            {property.priorWork3y} orders
          </Badge>
        </TableCell>
        <TableCell>
          {property.apn ? (
            <span className="text-sm font-mono">{property.apn}</span>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </TableCell>
        <TableCell>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/properties/${property.id}`)}
          >
            View Details
          </Button>
        </TableCell>
      </TableRow>
      
      {/* Expanded unit rows */}
      {isExpanded && (
        <>
          {unitsLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="bg-muted/30">
                <div className="flex items-center justify-center py-4">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Loading units...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : units.length > 0 ? (
            units.map((unit: any) => (
              <TableRow key={unit.id} className="bg-muted/30">
                <TableCell></TableCell>
                <TableCell className="pl-8">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">Unit {unit.unitIdentifier}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {unit.unitType && (
                    <Badge variant="outline" className="text-xs">
                      {unit.unitType}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>—</TableCell>
                <TableCell>
                  <Badge variant={unit.priorWork3y > 0 ? "destructive" : "secondary"} className="text-xs">
                    {unit.priorWork3y || 0}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {unit.orderCount || 0} orders
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/properties/${property.id}?tab=units&unitId=${unit.id}`)}
                    className="text-xs"
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="bg-muted/30">
                <div className="text-center py-4">
                  <span className="text-sm text-muted-foreground">No units found for this property</span>
                </div>
              </TableCell>
            </TableRow>
          )}
        </>
      )}
    </>
  );
}
