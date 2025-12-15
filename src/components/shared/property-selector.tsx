"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, MapPin, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export interface Property {
  id: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  propertyType?: string;
}

interface PropertySelectorProps {
  value?: Property | null;
  onSelect: (property: Property | null) => void;
  onManualEntry?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function PropertySelector({
  value,
  onSelect,
  onManualEntry,
  disabled = false,
  placeholder = "Select a property...",
}: PropertySelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch properties based on search
  useEffect(() => {
    const fetchProperties = async () => {
      if (!search || search.length < 2) {
        setProperties([]);
        return;
      }

      setIsLoading(true);
      try {
        // TODO: Replace with actual API endpoint when properties endpoint is created
        // For now, this is a placeholder that will work once the API is implemented
        const response = await fetch(`/api/properties?search=${encodeURIComponent(search)}&limit=10`);

        if (response.ok) {
          const data = await response.json();
          setProperties(data.properties || data.data || []);
        } else {
          // If API doesn't exist yet, show empty state
          setProperties([]);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchProperties, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const formatAddress = (property: Property) => {
    const parts = [
      property.addressLine1,
      property.addressLine2,
      property.city,
      property.state,
      property.postalCode,
    ].filter(Boolean);
    return parts.join(", ");
  };

  return (
    <div className="space-y-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {value ? (
              <span className="flex items-center gap-2 truncate">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{formatAddress(value)}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search by address, city, or zip..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? (
                  <div className="py-6 text-center text-sm">
                    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                    <p className="mt-2">Searching...</p>
                  </div>
                ) : search.length < 2 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Type at least 2 characters to search</p>
                  </div>
                ) : (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No properties found</p>
                    {onManualEntry && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          setOpen(false);
                          onManualEntry();
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Enter Address Manually
                      </Button>
                    )}
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup>
                {properties.map((property) => (
                  <CommandItem
                    key={property.id}
                    value={property.id}
                    onSelect={() => {
                      onSelect(property);
                      setOpen(false);
                    }}
                    className="flex items-start gap-2 py-3"
                  >
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        value?.id === property.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{property.addressLine1}</div>
                      {property.addressLine2 && (
                        <div className="text-sm text-muted-foreground">
                          {property.addressLine2}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        {property.city}, {property.state} {property.postalCode}
                      </div>
                      {property.propertyType && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {property.propertyType.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>

          {onManualEntry && properties.length > 0 && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setOpen(false);
                  onManualEntry();
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Enter Address Manually
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {value && (
        <Card className="p-3 bg-muted/50">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Selected Property</span>
              </div>
              <div className="text-sm">
                <div>{value.addressLine1}</div>
                {value.addressLine2 && <div>{value.addressLine2}</div>}
                <div className="text-muted-foreground">
                  {value.city}, {value.state} {value.postalCode}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelect(null)}
              className="shrink-0"
            >
              Clear
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

/**
 * Manual property entry form - displays when user wants to enter address manually
 * instead of selecting from existing properties
 */
interface ManualPropertyEntryProps {
  values: {
    propertyAddress: string;
    propertyCity: string;
    propertyState: string;
    propertyZip: string;
  };
  onChange: (field: string, value: string) => void;
  errors?: Record<string, any>;
}

export function ManualPropertyEntry({
  values,
  onChange,
  errors,
}: ManualPropertyEntryProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="propertyAddress">
          Street Address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="propertyAddress"
          value={values.propertyAddress}
          onChange={(e) => onChange('propertyAddress', e.target.value)}
          placeholder="123 Main St"
          className={errors?.propertyAddress ? 'border-destructive' : ''}
        />
        {errors?.propertyAddress && (
          <p className="text-sm text-destructive">{errors.propertyAddress.message}</p>
        )}
      </div>

      <div className="grid grid-cols-6 gap-4">
        <div className="col-span-3 space-y-2">
          <Label htmlFor="propertyCity">
            City <span className="text-destructive">*</span>
          </Label>
          <Input
            id="propertyCity"
            value={values.propertyCity}
            onChange={(e) => onChange('propertyCity', e.target.value)}
            placeholder="Orlando"
            className={errors?.propertyCity ? 'border-destructive' : ''}
          />
          {errors?.propertyCity && (
            <p className="text-sm text-destructive">{errors.propertyCity.message}</p>
          )}
        </div>

        <div className="col-span-1 space-y-2">
          <Label htmlFor="propertyState">
            State <span className="text-destructive">*</span>
          </Label>
          <Input
            id="propertyState"
            value={values.propertyState}
            onChange={(e) => onChange('propertyState', e.target.value.toUpperCase())}
            placeholder="FL"
            maxLength={2}
            className={cn(
              "uppercase",
              errors?.propertyState && 'border-destructive'
            )}
          />
          {errors?.propertyState && (
            <p className="text-sm text-destructive">{errors.propertyState.message}</p>
          )}
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="propertyZip">
            ZIP Code <span className="text-destructive">*</span>
          </Label>
          <Input
            id="propertyZip"
            value={values.propertyZip}
            onChange={(e) => onChange('propertyZip', e.target.value)}
            placeholder="32801"
            maxLength={10}
            className={errors?.propertyZip ? 'border-destructive' : ''}
          />
          {errors?.propertyZip && (
            <p className="text-sm text-destructive">{errors.propertyZip.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
