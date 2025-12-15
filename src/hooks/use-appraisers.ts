import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/lib/types'
import { transformUser } from '@/lib/supabase/transforms'

export function useAppraisers() {
  const supabase = createClient()

  const { data: appraisers = [], isLoading, error } = useQuery({
    queryKey: ['appraisers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name')
      
      if (error) throw error
      return (data || []).map(transformUser)
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  return {
    appraisers,
    isLoading,
    error,
  }
}

export function useAppraiser(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['appraisers', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return transformUser(data)
    },
    enabled: !!id,
  })
}

export function useCurrentUser() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.error('Auth error:', authError)
        return null
      }

      if (!user) {
        console.log('No authenticated user')
        return null
      }

      console.log('Fetching profile for user:', user.id)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Profile fetch error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        })
        throw new Error(`Failed to load profile: ${error.message || 'Unknown error'}`)
      }

      if (!data) {
        console.error('No profile data returned for user:', user.id)
        throw new Error('Profile not found')
      }

      console.log('Profile loaded successfully:', data)
      return transformUser(data)
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false, // Don't retry on failure to see errors faster
  })
}



