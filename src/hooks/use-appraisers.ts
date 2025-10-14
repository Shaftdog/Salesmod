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
      
      if (authError || !user) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) throw error
      return transformUser(data)
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}



