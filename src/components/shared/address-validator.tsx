"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Loader2,
  Info 
} from 'lucide-react';
import { AddressValidationResult, StandardizedAddress, getConfidenceLevel } from '@/lib/address-validation';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';

interface AddressValidatorProps {
  street: string;
  city: string;
  state: string;
  zip: string;
  onValidated: (result: AddressValidationResult) => void;
  onAcceptSuggestion: (standardized: StandardizedAddress, overrideReason?: string) => void;
  autoValidate?: boolean;
  disabled?: boolean;
  skipValidation?: boolean; // For pre-validated addresses (from property)
  className?: string;
}

export function AddressValidator({
  street,
  city,
  state,
  zip,
  onValidated,
  onAcceptSuggestion,
  autoValidate = true,
  disabled = false,
  skipValidation = false,
  className = '',
}: AddressValidatorProps) {
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<AddressValidationResult | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<'standardized' | 'original'>('standardized');
  const [overrideReason, setOverrideReason] = useState('');
  const lastValidatedAddress = useRef<string>('');

  // Debounce the address fields for auto-validation
  const debouncedStreet = useDebounce(street, 600);
  const debouncedCity = useDebounce(city, 600);
  const debouncedState = useDebounce(state, 600);
  const debouncedZip = useDebounce(zip, 600);

  const validateAddress = useCallback(async () => {
    if (!street || !city || !state || !zip) return;
    if (zip.length < 5) return; // Only validate when we have at least 5-digit ZIP
    if (disabled || skipValidation) return;

    setIsValidating(true);
    setShowSuggestions(false);

    try {
      const response = await fetch('/api/validate-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ street, city, state, zip }),
      });

      if (response.status === 429) {
        const data = await response.json();
        toast({
          title: 'Rate Limit Exceeded',
          description: `Please wait ${data.retryAfter} seconds before validating again.`,
          variant: 'destructive',
        });
        return;
      }

      if (!response.ok) {
        throw new Error('Validation service unavailable');
      }

      const result: AddressValidationResult = await response.json();
      setValidationResult(result);
      onValidated(result);

      // Show suggestions if address needs correction
      if (result.suggestions && result.suggestions.length > 0) {
        setShowSuggestions(true);
      } else if (result.isValid && result.confidence >= 0.8) {
        // Auto-accept high confidence standardization
        if (result.standardized) {
          onAcceptSuggestion(result.standardized);
        }
      }

    } catch (error) {
      console.error('Address validation error:', error);
      toast({
        title: 'Validation Failed',
        description: 'Could not validate address. You can continue anyway.',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  }, [street, city, state, zip, disabled, skipValidation, onValidated, onAcceptSuggestion, toast]);

  // Auto-validate when ZIP changes (debounced) - only trigger on ZIP change
  useEffect(() => {
    if (autoValidate && !skipValidation && debouncedZip.length >= 5) {
      // Only validate if we have all required fields and haven't already validated this exact address
      const currentAddress = `${debouncedStreet}|${debouncedCity}|${debouncedState}|${debouncedZip}`;
      
      if (currentAddress === lastValidatedAddress.current) {
        return; // Already validated this exact address
      }

      // Create a stable validation function for this effect
      const performValidation = async () => {
        if (!debouncedStreet || !debouncedCity || !debouncedState || !debouncedZip) return;
        if (debouncedZip.length < 5) return;
        if (disabled || skipValidation) return;

        // Update the ref to prevent duplicate validations
        lastValidatedAddress.current = currentAddress;

        setIsValidating(true);
        setShowSuggestions(false);

        try {
          const response = await fetch('/api/validate-address', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              street: debouncedStreet, 
              city: debouncedCity, 
              state: debouncedState, 
              zip: debouncedZip 
            }),
          });

          if (response.status === 429) {
            const data = await response.json();
            toast({
              title: 'Rate Limit Exceeded',
              description: `Please wait ${data.retryAfter} seconds before validating again.`,
              variant: 'destructive',
            });
            return;
          }

          if (!response.ok) {
            throw new Error('Validation service unavailable');
          }

          const result: AddressValidationResult = await response.json();
          setValidationResult(result);
          onValidated(result);

          // Show suggestions if address needs correction
          if (result.suggestions && result.suggestions.length > 0) {
            setShowSuggestions(true);
          } else if (result.isValid && result.confidence >= 0.8) {
            // Auto-accept high confidence standardization
            if (result.standardized) {
              onAcceptSuggestion(result.standardized);
            }
          }

        } catch (error) {
          console.error('Address validation error:', error);
          toast({
            title: 'Validation Failed',
            description: 'Could not validate address. You can continue anyway.',
            variant: 'destructive',
          });
        } finally {
          setIsValidating(false);
        }
      };

      performValidation();
    }
  }, [debouncedZip, autoValidate, skipValidation, debouncedStreet, debouncedCity, debouncedState, disabled, onValidated, onAcceptSuggestion, toast]);

  const handleAcceptSuggestion = () => {
    if (selectedSuggestion === 'standardized' && validationResult?.standardized) {
      onAcceptSuggestion(validationResult.standardized);
      setShowSuggestions(false);
    } else if (selectedSuggestion === 'original') {
      if (!overrideReason.trim()) {
        toast({
          title: 'Reason Required',
          description: 'Please provide a reason for using the original address.',
          variant: 'destructive',
        });
        return;
      }
      onAcceptSuggestion(
        {
          street,
          city,
          state,
          zip,
        },
        overrideReason
      );
      setShowSuggestions(false);
    }
  };

  const getValidationIcon = () => {
    if (skipValidation) {
      return <Info className="h-4 w-4 text-blue-600" />;
    }
    if (isValidating) {
      return <Loader2 className="h-4 w-4 animate-spin text-gray-600" />;
    }
    if (!validationResult) {
      return null;
    }
    
    if (validationResult.isValid && validationResult.confidence >= 0.8) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (validationResult.isValid && validationResult.confidence >= 0.5) {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getValidationBadge = () => {
    if (skipValidation) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Info className="h-3 w-3 mr-1" />
          Validated via Property
        </Badge>
      );
    }
    
    if (!validationResult || isValidating) return null;

    const level = getConfidenceLevel(validationResult.confidence);
    const badgeClass = 
      level === 'HIGH' ? 'bg-green-50 text-green-700 border-green-200' :
      level === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
      'bg-red-50 text-red-700 border-red-200';

    return (
      <Badge variant="outline" className={badgeClass}>
        {getValidationIcon()}
        <span className="ml-1">{level} Confidence</span>
      </Badge>
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Validation Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getValidationIcon()}
          {getValidationBadge()}
          {validationResult?.metadata?.uspsDeliverable && (
            <Badge variant="outline" className="text-xs">
              USPS Deliverable
            </Badge>
          )}
        </div>
        
        {!skipValidation && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={validateAddress}
            disabled={isValidating || disabled || !street || !city || !state || !zip}
          >
            {isValidating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {validationResult ? 'Re-validate' : 'Validate Address'}
          </Button>
        )}
      </div>

      {/* Suggestions Card */}
      {showSuggestions && validationResult?.suggestions && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-yellow-900">
                  Address Suggestions ({getConfidenceLevel(validationResult.confidence)} Confidence)
                </h4>
                <p className="text-xs text-yellow-700 mt-1">
                  Google suggests a standardized version of this address
                </p>
              </div>
            </div>

            <RadioGroup value={selectedSuggestion} onValueChange={(value: any) => setSelectedSuggestion(value)}>
              {/* Standardized suggestion */}
              {validationResult.suggestions.map((suggestion, idx) => (
                <div key={idx} className="flex items-start space-x-2 p-3 rounded-lg bg-white border border-yellow-200">
                  <RadioGroupItem value="standardized" id="suggestion-standard" className="mt-1" />
                  <Label htmlFor="suggestion-standard" className="flex-1 cursor-pointer">
                    <div className="font-medium text-sm">{suggestion.formatted}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Standardized ({getConfidenceLevel(suggestion.confidence)} confidence)
                      {validationResult.metadata?.uspsDeliverable && ' • USPS Deliverable'}
                    </div>
                  </Label>
                </div>
              ))}

              {/* Use original */}
              <div className="flex items-start space-x-2 p-3 rounded-lg bg-white border border-gray-200">
                <RadioGroupItem value="original" id="suggestion-original" className="mt-1" />
                <Label htmlFor="suggestion-original" className="flex-1 cursor-pointer">
                  <div className="font-medium text-sm">Use original address as-is</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {`${street}, ${city}, ${state} ${zip}`}
                  </div>
                  
                  {selectedSuggestion === 'original' && (
                    <div className="mt-3">
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Reason (required):
                      </label>
                      <Input
                        placeholder="e.g., New subdivision not yet in Google Maps"
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  )}
                </Label>
              </div>
            </RadioGroup>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSuggestions(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAcceptSuggestion}
                disabled={selectedSuggestion === 'original' && !overrideReason.trim()}
              >
                Apply Selected
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
