import { useQuery } from '@tanstack/react-query'
import { getPaymentPlans } from '../lib/paymentApi'

export function usePaymentPlans() {
  return useQuery({
    queryKey: ['payment-plans'],
    queryFn: getPaymentPlans,
    staleTime: 5 * 60 * 1000,
  })
}
