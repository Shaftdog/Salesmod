"use client";

/**
 * User Registration Form Component
 *
 * Multi-step registration flow with tenant creation
 * Requirements: FR-1.1
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const tenantTypes = [
  { value: 'lender', label: 'Mortgage Lender' },
  { value: 'investor', label: 'Real Estate Investor' },
  { value: 'amc', label: 'Appraisal Management Company (AMC)' },
  { value: 'attorney', label: 'Attorney / Law Firm' },
  { value: 'accountant', label: 'Accountant / CPA Firm' },
  { value: 'internal', label: 'Appraisal Company (Internal Use)' },
];

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
      tenantName: '',
      tenantType: 'lender',
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle validation errors
        if (result.details) {
          result.details.forEach((error: any) => {
            form.setError(error.path[0] as any, {
              message: error.message,
            });
          });
          throw new Error('Please fix the errors above');
        }

        throw new Error(result.error || 'Registration failed');
      }

      // Success
      toast({
        title: 'Account Created! 🎉',
        description: result.message || 'Please check your email to verify your account.',
      });

      // Clear form
      form.reset();

      // Callback
      if (onSuccess) {
        onSuccess();
      } else if (onSwitchToLogin) {
        // Auto-switch to login after 2 seconds
        setTimeout(() => {
          onSwitchToLogin();
        }, 2000);
      }

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="John Doe"
          {...form.register('name')}
          disabled={isLoading}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@company.com"
          {...form.register('email')}
          disabled={isLoading}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...form.register('password')}
          disabled={isLoading}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          At least 8 characters, 1 uppercase, 1 number
        </p>
      </div>

      {/* Company Name */}
      <div className="space-y-2">
        <Label htmlFor="tenantName">Company Name</Label>
        <Input
          id="tenantName"
          type="text"
          placeholder="Acme Lending LLC"
          {...form.register('tenantName')}
          disabled={isLoading}
        />
        {form.formState.errors.tenantName && (
          <p className="text-sm text-destructive">
            {form.formState.errors.tenantName.message}
          </p>
        )}
      </div>

      {/* Company Type */}
      <div className="space-y-2">
        <Label htmlFor="tenantType">Company Type</Label>
        <Select
          onValueChange={(value) => form.setValue('tenantType', value as any)}
          defaultValue={form.watch('tenantType')}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your company type" />
          </SelectTrigger>
          <SelectContent>
            {tenantTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.tenantType && (
          <p className="text-sm text-destructive">
            {form.formState.errors.tenantType.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Account
      </Button>

      {/* Switch to Login */}
      {onSwitchToLogin && (
        <div className="text-center text-sm">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-primary underline-offset-4 hover:underline"
            disabled={isLoading}
          >
            Sign In
          </button>
        </div>
      )}
    </form>
  );
}
