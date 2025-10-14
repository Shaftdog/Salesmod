import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/lib/types'
import { useToast } from './use-toast'
import { transformOrder } from '@/lib/supabase/transforms'

export function useOrders() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          client:clients(*),
          assignee:profiles!orders_assigned_to_fkey(*)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return (data || []).map(transformOrder)
    },
    staleTime: 1000 * 60, // 1 minute
  })

  const createOrderMutation = useMutation({
    mutationFn: async (order: any) => {
      const { data, error } = await supabase
        .from('orders')
        .insert(order)
        .select(`
          *,
          client:clients(*),
          assignee:profiles!orders_assigned_to_fkey(*)
        `)
        .single()
      
      if (error) throw error
      
      const newOrder = transformOrder(data)
      
      // Auto-log activity for new order
      try {
        await supabase.from('activities').insert({
          client_id: order.client_id,
          order_id: newOrder.id,
          activity_type: 'note',
          subject: `New order created: ${newOrder.orderNumber}`,
          description: `Order for ${order.property_address}, ${order.property_city}, ${order.property_state}. Fee: $${order.fee_amount}`,
          status: 'completed',
          completed_at: new Date().toISOString(),
          created_by: order.created_by,
        });
      } catch (activityError) {
        console.error('Failed to auto-log activity:', activityError);
        // Don't fail the order creation if activity logging fails
      }
      
      return newOrder
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      toast({
        title: "Order Created",
        description: "The new order has been successfully created.",
      })
    },
    onError: (error) => {
      console.error('Create order error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create order. Please try again.",
      })
    },
  })

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          client:clients(*),
          assignee:profiles!orders_assigned_to_fkey(*)
        `)
        .single()
      
      if (error) throw error
      return transformOrder(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast({
        title: "Order Updated",
        description: "The order has been successfully updated.",
      })
    },
    onError: (error) => {
      console.error('Update order error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order. Please try again.",
      })
    },
  })

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast({
        title: "Order Deleted",
        description: "The order has been successfully deleted.",
      })
    },
    onError: (error) => {
      console.error('Delete order error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete order. Please try again.",
      })
    },
  })

  return {
    orders,
    isLoading,
    error,
    createOrder: createOrderMutation.mutateAsync,
    updateOrder: updateOrderMutation.mutateAsync,
    deleteOrder: deleteOrderMutation.mutateAsync,
    isCreating: createOrderMutation.isPending,
    isUpdating: updateOrderMutation.isPending,
    isDeleting: deleteOrderMutation.isPending,
  }
}

export function useOrder(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['orders', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          client:clients(*),
          assignee:profiles!orders_assigned_to_fkey(*)
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      return transformOrder(data)
    },
    enabled: !!id,
  })
}



