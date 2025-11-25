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
      // Fetch ALL orders - Supabase has default limits, so we need to explicitly handle large datasets
      let allOrders: any[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            client:clients(*),
            assignee:profiles!orders_assigned_to_fkey(*)
          `)
          .order('created_at', { ascending: false })
          .range(from, from + batchSize - 1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allOrders = [...allOrders, ...data];
          from += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }
      
      return allOrders.map(transformOrder);
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

      if (error) {
        console.error('Supabase order insert error:', error.message, error.code, error.details, error.hint)
        throw new Error(error.message || 'Failed to create order')
      }
      
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
    onError: (error: any) => {
      console.error('Create order error:', error?.message || error?.code || JSON.stringify(error))
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to create order. Please try again.",
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

export function useUpdateOrder() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      // Convert camelCase to snake_case for database
      const dbUpdates: any = {}
      if (updates.status) dbUpdates.status = updates.status
      if (updates.assignedTo) dbUpdates.assigned_to = updates.assignedTo
      if (updates.propertyAddress) dbUpdates.property_address = updates.propertyAddress
      if (updates.propertyCity) dbUpdates.property_city = updates.propertyCity
      if (updates.propertyState) dbUpdates.property_state = updates.propertyState
      if (updates.propertyZip) dbUpdates.property_zip = updates.propertyZip
      if (updates.propertyType) dbUpdates.property_type = updates.propertyType
      
      // Appraisal Workflow Fields
      if (updates.scopeOfWork !== undefined) dbUpdates.scope_of_work = updates.scopeOfWork
      if (updates.intendedUse !== undefined) dbUpdates.intended_use = updates.intendedUse
      if (updates.reportFormType !== undefined) dbUpdates.report_form_type = updates.reportFormType
      if (updates.additionalForms !== undefined) dbUpdates.additional_forms = updates.additionalForms
      if (updates.billingMethod !== undefined) dbUpdates.billing_method = updates.billingMethod
      if (updates.salesCampaign !== undefined) dbUpdates.sales_campaign = updates.salesCampaign
      if (updates.serviceRegion !== undefined) dbUpdates.service_region = updates.serviceRegion
      if (updates.siteInfluence !== undefined) dbUpdates.site_influence = updates.siteInfluence
      if (updates.isMultiunit !== undefined) dbUpdates.is_multiunit = updates.isMultiunit
      if (updates.multiunitType !== undefined) dbUpdates.multiunit_type = updates.multiunitType
      if (updates.isNewConstruction !== undefined) dbUpdates.is_new_construction = updates.isNewConstruction
      if (updates.newConstructionType !== undefined) dbUpdates.new_construction_type = updates.newConstructionType
      if (updates.zoningType !== undefined) dbUpdates.zoning_type = updates.zoningType
      if (updates.inspectionDate !== undefined) dbUpdates.inspection_date = updates.inspectionDate

      const { data, error } = await supabase
        .from('orders')
        .update(dbUpdates)
        .eq('id', id)
        .select(`
          *,
          client:clients(*),
          assignee:profiles!orders_assigned_to_fkey(*)
        `)
        .single()
      
      if (error) throw error
      
      // If order was completed and has a property_id, refresh USPAP cache
      if (updates.status === 'completed' && data.property_id) {
        try {
          const { data: priorWork } = await supabase.rpc('property_prior_work_count', {
            _property_id: data.property_id
          });
          
          const updatedProps = {
            ...(data.props || {}),
            uspap: {
              prior_work_3y: priorWork || 0,
              as_of: new Date().toISOString()
            }
          };
          
          await supabase
            .from('orders')
            .update({ props: updatedProps })
            .eq('id', id);
        } catch (uspapError) {
          console.warn('Failed to refresh USPAP cache for order', id, uspapError);
        }
      }
      
      return transformOrder(data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders', variables.id] })
      // Also invalidate properties queries since USPAP cache was updated
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['property'] })
    },
  })
}



