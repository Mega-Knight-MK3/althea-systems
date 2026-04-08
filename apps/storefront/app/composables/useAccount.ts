import type { AuthUser } from './useAuth'

export interface Address {
  id: number
  type: 'billing' | 'shipping'
  fullName: string
  street: string
  line2: string | null
  city: string
  region: string | null
  postalCode: string
  country: string
  phone: string | null
  isDefault: boolean
}

export interface PaymentMethod {
  id: number
  type: string
  brand: string | null
  lastFour: string
  expMonth: number | null
  expYear: number | null
  isDefault: boolean
  stripePaymentMethodId: string
}

export interface AddressInput {
  type: 'billing' | 'shipping'
  fullName: string
  street: string
  line2?: string | null
  city: string
  region?: string | null
  postalCode: string
  country: string
  phone?: string | null
  isDefault?: boolean
}

export interface PaymentMethodInput {
  stripePaymentMethodId: string
  type?: string
  brand?: string | null
  lastFour: string
  expMonth?: number
  expYear?: number
  isDefault?: boolean
}

export function useAccountApi() {
  const api = useApi()

  return {
    getProfile: () => api<{ user: AuthUser }>('/account'),
    updateProfile: (payload: Partial<{ fullName: string | null; phone: string | null }>) =>
      api<{ user: AuthUser }>('/account', { method: 'PATCH', body: payload }),
    changeEmail: (payload: { email: string; currentPassword: string }) =>
      api<{ message: string }>('/account/email', { method: 'POST', body: payload }),
    changePassword: (payload: { currentPassword: string; newPassword: string }) =>
      api<{ message: string }>('/account/password', { method: 'POST', body: payload }),
    deactivate: () => api('/account/deactivate', { method: 'POST' }),

    listAddresses: () => api<Address[]>('/account/addresses'),
    createAddress: (payload: AddressInput) =>
      api<Address>('/account/addresses', { method: 'POST', body: payload }),
    updateAddress: (id: number, payload: Partial<AddressInput>) =>
      api<Address>(`/account/addresses/${id}`, { method: 'PATCH', body: payload }),
    deleteAddress: (id: number) =>
      api(`/account/addresses/${id}`, { method: 'DELETE' }),

    listPaymentMethods: () => api<PaymentMethod[]>('/account/payment-methods'),
    createPaymentMethod: (payload: PaymentMethodInput) =>
      api<PaymentMethod>('/account/payment-methods', { method: 'POST', body: payload }),
    setDefaultPaymentMethod: (id: number) =>
      api<PaymentMethod>(`/account/payment-methods/${id}`, {
        method: 'PATCH',
        body: { isDefault: true },
      }),
    deletePaymentMethod: (id: number) =>
      api(`/account/payment-methods/${id}`, { method: 'DELETE' }),
  }
}
