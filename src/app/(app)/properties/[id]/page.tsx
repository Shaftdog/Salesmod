"use client";

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useProperty, useRefreshUSPAPCache } from '@/hooks/use-properties';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  MapPin, 
  Building, 
  Calendar, 
  DollarSign, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { VerificationBadge } from '@/components/shared/verification-badge';
import dynamic from 'next/dynamic';
import { PropertyUnitsList } from '@/components/properties/property-units-list';
import { isFeeSimplePropertyType } from '@/lib/units';

// Dynamic import for PropertyMapSection to improve initial page load
const PropertyMapSection = dynamic(
  () => import('@/components/properties/property-map-section').then(mod => ({ default: mod.PropertyMapSection })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[440px] bg-muted rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground text-sm">Loading map...</p>
        </div>
      </div>
    )
  }
);

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { id } = use(params);

  const { property: data, isLoading, error } = useProperty(id);
  const refreshUSPAPMutation = useRefreshUSPAPCache();

  const handleRefreshUSPAP = async () => {
    try {
      await refreshUSPAPMutation.mutateAsync(id);
      toast({
        title: "USPAP Cache Refreshed",
        description: "Prior work count has been updated",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh USPAP cache",
        variant: "destructive",
      });
    }
  };

  const handleCreateOrder = () => {
    if (!data?.property) return;
    
    const prop = data.property;
    
    // Navigate to new order page with property data as query params
    const params = new URLSearchParams({
      propertyId: prop.id,
      propertyAddress: prop.address_line1 || '',
      propertyCity: prop.city || '',
      propertyState: prop.state || '',
      propertyZip: prop.postal_code || '',
      propertyType: prop.property_type || 'single_family',
    });
    
    router.push(`/orders/new?${params.toString()}`);
  };

  const formatAddress = (property: any) => {
    const parts = [
      property.address_line1,
      property.address_line2,
      `${property.city}, ${property.state} ${property.postal_code}`
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-gray-100 text-gray-800',
      assigned: 'bg-blue-100 text-blue-800',
      scheduled: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-orange-100 text-orange-800',
      in_review: 'bg-purple-100 text-purple-800',
      revisions: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
      case 'in_review':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">Property Not Found</h2>
              <p className="text-gray-600 mb-4">The property you're looking for doesn't exist or you don't have access to it.</p>
              <Button onClick={() => router.push('/properties')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Properties
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-32">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  const { property, orders, pagination } = data;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/properties')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{formatAddress(property)}</h1>
            <p className="text-gray-600">
              {property.city}, {property.state} {property.postal_code}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            {property.property_type.replace('_', ' ')}
          </Badge>
          <VerificationBadge 
            status={property.validation_status}
            source={property.verification_source}
            size="md"
          />
          {property.apn && (
            <Badge variant="secondary" className="text-sm">
              APN: {property.apn}
            </Badge>
          )}
          <Button
            onClick={handleCreateOrder}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Order
          </Button>
        </div>
      </div>

      {/* USPAP Prior Work Badge */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              <div>
                <h3 className="font-semibold">USPAP Prior Work (3 years)</h3>
                <p className="text-sm text-gray-600">
                  {property.priorWork3y} completed orders in the last 3 years
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge 
                variant={property.priorWork3y > 0 ? "destructive" : "secondary"}
                className="text-lg px-3 py-1"
              >
                {property.priorWork3y} orders
              </Badge>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshUSPAP}
                disabled={refreshUSPAPMutation.isPending}
              >
                {refreshUSPAPMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Recheck
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Map Section */}
      <PropertyMapSection
        latitude={property.latitude}
        longitude={property.longitude}
        address={formatAddress(property)}
        propertyId={property.id}
      />

      {/* Property Details Tabs */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          {isFeeSimplePropertyType(property.property_type) && (
            <TabsTrigger value="units">Units</TabsTrigger>
          )}
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Related Orders ({orders?.length || 0})</CardTitle>
              <CardDescription>
                Orders associated with this property
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders && orders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Completed Date</TableHead>
                      <TableHead>Fee Amount</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Link 
                            href={`/orders/${order.id}`}
                            className="font-medium text-blue-600 hover:text-blue-800"
                          >
                            {order.order_number}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            <span className="flex items-center space-x-1">
                              {getStatusIcon(order.status)}
                              <span>{order.status.replace('_', ' ')}</span>
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {order.completed_date ? formatDate(order.completed_date) : '—'}
                        </TableCell>
                        <TableCell>
                          {order.fee_amount ? formatCurrency(order.fee_amount) : '—'}
                        </TableCell>
                        <TableCell>
                          {order.props?.unit ? (
                            <Badge variant="outline">{order.props.unit}</Badge>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/orders/${order.id}`)}
                          >
                            View Order
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
                  <p className="text-gray-600">
                    No orders have been linked to this property yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Address</label>
                  <p className="text-sm">{formatAddress(property)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Property Type</label>
                  <p className="text-sm">{property.property_type.replace('_', ' ')}</p>
                </div>
                
                {property.apn && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">APN</label>
                    <p className="text-sm font-mono">{property.apn}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Country</label>
                  <p className="text-sm">{property.country}</p>
                </div>
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {property.gla && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">GLA (sq ft)</label>
                    <p className="text-sm">{property.gla.toLocaleString()}</p>
                  </div>
                )}
                
                {property.lot_size && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Lot Size (sq ft)</label>
                    <p className="text-sm">{property.lot_size.toLocaleString()}</p>
                  </div>
                )}
                
                {property.year_built && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Year Built</label>
                    <p className="text-sm">{property.year_built}</p>
                  </div>
                )}
                
                {(property.latitude && property.longitude) && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Coordinates</label>
                    <p className="text-sm font-mono">
                      {property.latitude.toFixed(6)}, {property.longitude.toFixed(6)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Created</label>
                  <p className="text-sm">{formatDate(property.created_at)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Updated</label>
                  <p className="text-sm">{formatDate(property.updated_at)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Address Hash</label>
                  <p className="text-sm font-mono text-xs break-all">{property.addr_hash}</p>
                </div>
              </CardContent>
            </Card>

            {/* Custom Properties */}
            {property.props && Object.keys(property.props).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Custom Properties</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">
                    {JSON.stringify(property.props, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Units Tab */}
        {isFeeSimplePropertyType(property.property_type) && (
          <TabsContent value="units">
            <Card>
              <CardHeader>
                <CardTitle>Property Units</CardTitle>
                <CardDescription>
                  Manage units for this {property.property_type.replace('_', ' ')} property. Each unit maintains its own USPAP compliance tracking.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PropertyUnitsList propertyId={property.id} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
