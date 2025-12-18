"use client";

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, AlertTriangle, Building } from 'lucide-react';
import { Order } from '@/lib/types';
import { VerificationBadge } from '@/components/shared/verification-badge';

interface PropertyChipProps {
  order: Order;
  variant?: 'chip' | 'card';
  showPriorWork?: boolean;
}

export function PropertyChip({ order, variant = 'chip', showPriorWork = true }: PropertyChipProps) {
  if (!order.property) {
    return null;
  }

  const formatAddress = (property: any) => {
    const parts = [
      property.addressLine1,
      property.addressLine2,
      `${property.city}, ${property.state} ${property.postalCode}`
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  const getPriorWorkBadge = () => {
    if (!showPriorWork || !order.props?.uspap) return null;
    
    const priorWork = order.props.uspap.prior_work_3y || 0;
    
    return (
      <Badge 
        variant={priorWork > 0 ? "destructive" : "secondary"}
        className="text-xs"
      >
        <AlertTriangle className="h-3 w-3 mr-1" />
        {priorWork} prior work (3y)
      </Badge>
    );
  };

  const getUnitBadge = () => {
    if (!order.props?.unit) return null;
    
    return (
      <Badge variant="outline" className="text-xs">
        Unit {order.props.unit}
      </Badge>
    );
  };

  if (variant === 'card') {
    return (
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Property</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {formatAddress(order.property)}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    <Building className="h-3 w-3 mr-1" />
                    {order.property.propertyType.replace('_', ' ')}
                  </Badge>
                  <VerificationBadge
                    status={order.property.validationStatus as 'verified' | 'partial' | 'unverified' | 'pending' | null}
                    source={order.property.verificationSource}
                    size="sm"
                  />
                  {getUnitBadge()}
                  {getPriorWorkBadge()}
                </div>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link href={`/properties/${order.property.id}`}>
                View Property
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default chip variant
  return (
    <div className="flex items-center space-x-2">
      <MapPin className="h-4 w-4 text-blue-600" />
      <div className="flex items-center space-x-2">
        <Link 
          href={`/properties/${order.property.id}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
        >
          {formatAddress(order.property)}
        </Link>
        <VerificationBadge
          status={order.property.validationStatus as 'verified' | 'partial' | 'unverified' | 'pending' | null}
          source={order.property.verificationSource}
          size="sm"
        />
        {getUnitBadge()}
        {getPriorWorkBadge()}
      </div>
    </div>
  );
}

interface PropertyChipInlineProps {
  order: Order;
  className?: string;
  disableLink?: boolean;
}

export function PropertyChipInline({ order, className = "", disableLink = false }: PropertyChipInlineProps) {
  if (!order.property) {
    return (
      <span className={`text-sm text-gray-500 ${className}`}>
        No property linked
      </span>
    );
  }

  const formatAddress = (property: any) => {
    const parts = [
      property.addressLine1,
      property.addressLine2,
      `${property.city}, ${property.state} ${property.postalCode}`
    ].filter(Boolean);

    return parts.join(', ');
  };

  const getPriorWorkIndicator = () => {
    if (!order.props?.uspap) return null;

    const priorWork = order.props.uspap.prior_work_3y || 0;

    if (priorWork === 0) return null;

    return (
      <span className="text-xs text-red-600 font-medium">
        ({priorWork} prior work)
      </span>
    );
  };

  const getUnitIndicator = () => {
    if (!order.props?.unit) return null;

    return (
      <span className="text-xs text-gray-500">
        Unit {order.props.unit}
      </span>
    );
  };

  const addressContent = formatAddress(order.property);

  return (
    <div className={`text-sm ${className}`}>
      {disableLink ? (
        <span className="font-medium text-blue-600">
          {addressContent}
        </span>
      ) : (
        <Link
          href={`/properties/${order.property.id}`}
          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
        >
          {addressContent}
        </Link>
      )}
      <div className="flex items-center space-x-2 mt-1">
        {getUnitIndicator()}
        {getPriorWorkIndicator()}
      </div>
    </div>
  );
}
