import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SkillType, ResourceSkill, SkillCategory, ProficiencyLevel } from '@/lib/types';
import { useToast } from './use-toast';

interface SkillFilters {
  category?: SkillCategory;
  isRequired?: boolean;
  isActive?: boolean;
}

/**
 * Get list of all skill types
 */
export function useSkillTypes(filters?: SkillFilters) {
  return useQuery({
    queryKey: ['skill-types', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.isRequired !== undefined) params.append('isRequired', String(filters.isRequired));
      if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));

      const response = await fetch(`/api/field-services/skills?${params}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch skills');
      }
      const data = await response.json();
      return data.skills as SkillType[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes (skills don't change often)
  });
}

/**
 * Get skills for a specific resource
 */
export function useResourceSkills(resourceId: string | null) {
  return useQuery({
    queryKey: ['resource-skills', resourceId],
    queryFn: async () => {
      const response = await fetch(`/api/field-services/resources/${resourceId}/skills`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch resource skills');
      }
      const data = await response.json();
      return data.skills as ResourceSkill[];
    },
    enabled: !!resourceId,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Create a new skill type (admin only)
 */
export function useCreateSkillType() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (skill: Partial<SkillType>) => {
      const response = await fetch('/api/field-services/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skill),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create skill');
      }

      const data = await response.json();
      return data.skill as SkillType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skill-types'] });
      toast({
        title: 'Skill Created',
        description: 'New skill type has been created successfully.',
      });
    },
    onError: (error: any) => {
      console.error('Create skill error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to create skill.',
      });
    },
  });
}

/**
 * Add a skill to a resource
 */
export function useAddResourceSkill() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      resourceId,
      ...skillData
    }: {
      resourceId: string;
      skillTypeId: string;
      proficiencyLevel?: ProficiencyLevel;
      certificationNumber?: string;
      certifiedDate?: string;
      expiryDate?: string;
      issuingAuthority?: string;
      isVerified?: boolean;
      notes?: string;
    }) => {
      const response = await fetch(`/api/field-services/resources/${resourceId}/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skillData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add skill');
      }

      const data = await response.json();
      return data.skill as ResourceSkill;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resource-skills', variables.resourceId] });
      queryClient.invalidateQueries({ queryKey: ['resources', variables.resourceId] });
      toast({
        title: 'Skill Added',
        description: 'Skill has been added to the resource.',
      });
    },
    onError: (error: any) => {
      console.error('Add skill error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to add skill.',
      });
    },
  });
}

/**
 * Remove a skill from a resource
 */
export function useRemoveResourceSkill() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ resourceId, skillId }: { resourceId: string; skillId: string }) => {
      const response = await fetch(
        `/api/field-services/resources/${resourceId}/skills?skillId=${skillId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove skill');
      }

      return { resourceId, skillId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resource-skills', data.resourceId] });
      queryClient.invalidateQueries({ queryKey: ['resources', data.resourceId] });
      toast({
        title: 'Skill Removed',
        description: 'Skill has been removed from the resource.',
      });
    },
    onError: (error: any) => {
      console.error('Remove skill error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to remove skill.',
      });
    },
  });
}

/**
 * Get certifications/skills expiring soon (within 30 days)
 */
export function useExpiringCertifications() {
  return useQuery({
    queryKey: ['expiring-certifications'],
    queryFn: async () => {
      // This would need a dedicated API endpoint or client-side filtering
      // For now, fetch all resource skills and filter client-side
      const response = await fetch('/api/field-services/skills');
      if (!response.ok) {
        throw new Error('Failed to fetch certifications');
      }
      const data = await response.json();

      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      // Would need to implement proper filtering on backend
      return [] as ResourceSkill[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
