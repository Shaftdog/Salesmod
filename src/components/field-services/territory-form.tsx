"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateTerritory, useUpdateTerritory } from "@/hooks/use-territories";
import type { ServiceTerritory } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface TerritoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  territory: ServiceTerritory | null;
}

export function TerritoryForm({ open, onOpenChange, territory }: TerritoryFormProps) {
  const { mutateAsync: createTerritory, isPending: isCreating } = useCreateTerritory();
  const { mutateAsync: updateTerritory, isPending: isUpdating } = useUpdateTerritory();

  const [zipCodesInput, setZipCodesInput] = useState("");
  const [zipCodes, setZipCodes] = useState<string[]>([]);
  const [citiesInput, setCitiesInput] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [countiesInput, setCountiesInput] = useState("");
  const [counties, setCounties] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    defaultValues: {
      name: "",
      description: "",
      territoryType: "primary",
      baseTravelTimeMinutes: 0,
      mileageRate: 0.67,
      travelFee: 0,
      isActive: true,
      colorHex: "#3b82f6",
    },
  });

  useEffect(() => {
    if (territory) {
      reset({
        name: territory.name,
        description: territory.description,
        territoryType: territory.territoryType,
        radiusMiles: territory.radiusMiles,
        centerLat: territory.centerLat,
        centerLng: territory.centerLng,
        baseTravelTimeMinutes: territory.baseTravelTimeMinutes,
        mileageRate: territory.mileageRate,
        travelFee: territory.travelFee,
        isActive: territory.isActive,
        colorHex: territory.colorHex,
      });
      setZipCodes(territory.zipCodes || []);
      setCities(territory.cities || []);
      setCounties(territory.counties || []);
    } else {
      reset({
        name: "",
        description: "",
        territoryType: "primary",
        baseTravelTimeMinutes: 0,
        mileageRate: 0.67,
        travelFee: 0,
        isActive: true,
        colorHex: "#3b82f6",
      });
      setZipCodes([]);
      setCities([]);
      setCounties([]);
    }
  }, [territory, reset]);

  const handleAddZipCode = () => {
    const cleaned = zipCodesInput.trim();
    if (cleaned && !zipCodes.includes(cleaned)) {
      setZipCodes([...zipCodes, cleaned]);
      setZipCodesInput("");
    }
  };

  const handleRemoveZipCode = (zip: string) => {
    setZipCodes(zipCodes.filter((z) => z !== zip));
  };

  const handleAddCity = () => {
    const cleaned = citiesInput.trim();
    if (cleaned && !cities.includes(cleaned)) {
      setCities([...cities, cleaned]);
      setCitiesInput("");
    }
  };

  const handleRemoveCity = (city: string) => {
    setCities(cities.filter((c) => c !== city));
  };

  const handleAddCounty = () => {
    const cleaned = countiesInput.trim();
    if (cleaned && !counties.includes(cleaned)) {
      setCounties([...counties, cleaned]);
      setCountiesInput("");
    }
  };

  const handleRemoveCounty = (county: string) => {
    setCounties(counties.filter((c) => c !== county));
  };

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        zipCodes,
        cities,
        counties,
      };

      if (territory) {
        await updateTerritory({
          id: territory.id,
          ...payload,
        });
      } else {
        await createTerritory(payload);
      }

      onOpenChange(false);
      reset();
      setZipCodes([]);
      setCities([]);
      setCounties([]);
    } catch (error) {
      console.error("Error saving territory:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{territory ? "Edit Territory" : "New Territory"}</DialogTitle>
          <DialogDescription>
            {territory
              ? "Update service territory information"
              : "Create a new service territory for field operations"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Basic Information</h3>

              <div className="space-y-2">
                <Label htmlFor="name">Territory Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Orlando Southwest"
                  {...register("name", { required: true })}
                />
                {errors.name && <p className="text-sm text-red-500">Name is required</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe this territory..."
                  {...register("description")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="territoryType">Territory Type</Label>
                  <Select
                    value={watch("territoryType")}
                    onValueChange={(value) => setValue("territoryType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="extended">Extended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="colorHex">Display Color</Label>
                  <Input
                    id="colorHex"
                    type="color"
                    {...register("colorHex")}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={watch("isActive")}
                  onCheckedChange={(checked) => setValue("isActive", checked)}
                />
                <Label htmlFor="isActive">Active Territory</Label>
              </div>
            </div>

            {/* Geographic Definition */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Geographic Coverage</h3>
              <p className="text-xs text-muted-foreground">
                Define at least one geographic boundary (ZIP codes, cities, counties, or radius)
              </p>

              {/* ZIP Codes */}
              <div className="space-y-2">
                <Label>ZIP Codes</Label>
                <div className="flex gap-2">
                  <Input
                    value={zipCodesInput}
                    onChange={(e) => setZipCodesInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddZipCode();
                      }
                    }}
                    placeholder="Enter ZIP code and press Enter"
                  />
                  <Button type="button" onClick={handleAddZipCode}>
                    Add
                  </Button>
                </div>
                {zipCodes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {zipCodes.map((zip) => (
                      <Badge key={zip} variant="secondary">
                        {zip}
                        <button
                          type="button"
                          onClick={() => handleRemoveZipCode(zip)}
                          className="ml-2"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Cities */}
              <div className="space-y-2">
                <Label>Cities</Label>
                <div className="flex gap-2">
                  <Input
                    value={citiesInput}
                    onChange={(e) => setCitiesInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCity();
                      }
                    }}
                    placeholder="Enter city name and press Enter"
                  />
                  <Button type="button" onClick={handleAddCity}>
                    Add
                  </Button>
                </div>
                {cities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {cities.map((city) => (
                      <Badge key={city} variant="secondary">
                        {city}
                        <button
                          type="button"
                          onClick={() => handleRemoveCity(city)}
                          className="ml-2"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Counties */}
              <div className="space-y-2">
                <Label>Counties</Label>
                <div className="flex gap-2">
                  <Input
                    value={countiesInput}
                    onChange={(e) => setCountiesInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCounty();
                      }
                    }}
                    placeholder="Enter county name and press Enter"
                  />
                  <Button type="button" onClick={handleAddCounty}>
                    Add
                  </Button>
                </div>
                {counties.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {counties.map((county) => (
                      <Badge key={county} variant="secondary">
                        {county}
                        <button
                          type="button"
                          onClick={() => handleRemoveCounty(county)}
                          className="ml-2"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Radius Coverage */}
              <div className="space-y-2">
                <Label>Radius Coverage (Optional)</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="radiusMiles">Radius (miles)</Label>
                    <Input
                      id="radiusMiles"
                      type="number"
                      step="0.1"
                      placeholder="50"
                      {...register("radiusMiles", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="centerLat">Center Latitude</Label>
                    <Input
                      id="centerLat"
                      type="number"
                      step="0.000001"
                      placeholder="28.5383"
                      {...register("centerLat", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="centerLng">Center Longitude</Label>
                    <Input
                      id="centerLng"
                      type="number"
                      step="0.000001"
                      placeholder="-81.3792"
                      {...register("centerLng", { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Travel & Pricing */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Travel & Pricing</h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baseTravelTimeMinutes">Base Travel Time (min)</Label>
                  <Input
                    id="baseTravelTimeMinutes"
                    type="number"
                    {...register("baseTravelTimeMinutes", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mileageRate">Mileage Rate ($/mile)</Label>
                  <Input
                    id="mileageRate"
                    type="number"
                    step="0.01"
                    {...register("mileageRate", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="travelFee">Travel Fee ($)</Label>
                  <Input
                    id="travelFee"
                    type="number"
                    step="0.01"
                    {...register("travelFee", { valueAsNumber: true })}
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isCreating || isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? "Saving..." : territory ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
