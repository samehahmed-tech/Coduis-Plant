// CRM Store - Connected to Database API (Production Ready)
import { create } from 'zustand';
import { Customer } from '../types';
import { customersApi } from '../services/api';
import { localDb } from '../db/localDb';
import { syncService } from '../services/syncService';

interface CRMState {
    customers: Customer[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchCustomers: () => Promise<void>;
    addCustomer: (customer: Partial<Customer>) => Promise<Customer>;
    updateCustomer: (customer: Customer) => Promise<void>;
    deleteCustomer: (id: string) => Promise<void>;
    getCustomerByPhone: (phone: string) => Promise<Customer | null>;
    searchCustomers: (query: string) => Promise<Customer[]>;

    // Local state helpers
    setCustomers: (customers: Customer[]) => void;
    clearError: () => void;
}

import { persist } from 'zustand/middleware';

export const useCRMStore = create<CRMState>()(
    persist(
        (set, get) => ({
            customers: [], // Empty - loads from database
            isLoading: false,
            error: null,

            fetchCustomers: async () => {
                set({ isLoading: true, error: null });
                try {
                    if (navigator.onLine) {
                        const data = await customersApi.getAll();
                        const customers = data.map((c: any) => ({
                            id: c.id,
                            name: c.name,
                            phone: c.phone,
                            email: c.email,
                            address: c.address,
                            area: c.area,
                            building: c.building,
                            floor: c.floor,
                            apartment: c.apartment,
                            landmark: c.landmark,
                            notes: c.notes,
                            visits: c.visits || 0,
                            totalSpent: c.total_spent || 0,
                            loyaltyTier: c.loyalty_tier || 'Bronze',
                            createdAt: c.created_at ? new Date(c.created_at) : new Date(),
                        }));
                        set({ customers, isLoading: false });
                        await localDb.customers.bulkPut(customers.map(c => ({ ...c, updatedAt: Date.now() })));
                    } else {
                        const cached = await localDb.customers.toArray();
                        set({ customers: cached as Customer[], isLoading: false });
                    }
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    console.error('Failed to fetch customers:', error);
                }
            },

            addCustomer: async (customerData) => {
                set({ isLoading: true, error: null });
                try {
                    const id = `cus-${Date.now()}`;
                    let customer: Customer;
                    if (navigator.onLine) {
                        const result = await customersApi.create({ id, ...customerData });
                        customer = {
                            id: result.id,
                            name: result.name,
                            phone: result.phone,
                            email: result.email,
                            address: result.address,
                            visits: result.visits || 0,
                            totalSpent: result.total_spent || 0,
                            loyaltyTier: result.loyalty_tier || 'Bronze',
                            createdAt: new Date(result.created_at),
                        };
                    } else {
                        customer = {
                            id,
                            name: customerData.name || '',
                            phone: customerData.phone || '',
                            email: customerData.email,
                            address: customerData.address,
                            area: customerData.area,
                            building: customerData.building,
                            floor: customerData.floor,
                            apartment: customerData.apartment,
                            landmark: customerData.landmark,
                            notes: customerData.notes,
                            visits: 0,
                            totalSpent: 0,
                            loyaltyTier: 'Bronze',
                            createdAt: new Date(),
                        };
                        await syncService.queue('customer', 'CREATE', { id, ...customerData });
                    }
                    set((state) => ({
                        customers: [customer, ...state.customers],
                        isLoading: false
                    }));
                    await localDb.customers.put({ ...customer, updatedAt: Date.now() });
                    return customer;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            updateCustomer: async (customer) => {
                set({ isLoading: true, error: null });
                try {
                    const payload = {
                        name: customer.name,
                        phone: customer.phone,
                        email: customer.email,
                        address: customer.address,
                        loyalty_tier: customer.loyaltyTier,
                        visits: customer.visits,
                        total_spent: customer.totalSpent,
                    };
                    if (navigator.onLine) {
                        await customersApi.update(customer.id, payload);
                    } else {
                        await syncService.queue('customer', 'UPDATE', { id: customer.id, ...payload });
                    }
                    set((state) => ({
                        customers: state.customers.map(c => c.id === customer.id ? customer : c),
                        isLoading: false
                    }));
                    await localDb.customers.put({ ...customer, updatedAt: Date.now() });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            deleteCustomer: async (id) => {
                set({ isLoading: true, error: null });
                try {
                    if (navigator.onLine) {
                        await customersApi.delete(id);
                    } else {
                        await syncService.queue('customer', 'DELETE', { id });
                    }
                    set((state) => ({
                        customers: state.customers.filter(c => c.id !== id),
                        isLoading: false
                    }));
                    await localDb.customers.delete(id);
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            getCustomerByPhone: async (phone) => {
                try {
                    // First check local state
                    const local = get().customers.find(c => c.phone === phone);
                    if (local) return local;

                    if (!navigator.onLine) {
                        const cached = await localDb.customers.where('phone').equals(phone).first();
                        return cached ? (cached as Customer) : null;
                    }

                    // Then check API
                    const result = await customersApi.getByPhone(phone);
                    return {
                        id: result.id,
                        name: result.name,
                        phone: result.phone,
                        email: result.email,
                        address: result.address,
                        visits: result.visits || 0,
                        totalSpent: result.total_spent || 0,
                        loyaltyTier: result.loyalty_tier || 'Bronze',
                    } as Customer;
                } catch (error: any) {
                    if (error.message.includes('not found')) return null;
                    throw error;
                }
            },

            searchCustomers: async (query) => {
                try {
                    if (navigator.onLine) {
                        const data = await customersApi.getAll({ search: query });
                        return data.map((c: any) => ({
                            id: c.id,
                            name: c.name,
                            phone: c.phone,
                            address: c.address,
                            loyaltyTier: c.loyalty_tier,
                        })) as Customer[];
                    }

                    const cached = await localDb.customers.toArray();
                    const q = query.toLowerCase();
                    return cached.filter((c: any) =>
                        (c.name || '').toLowerCase().includes(q) ||
                        (c.phone || '').toLowerCase().includes(q)
                    ) as Customer[];
                } catch (error: any) {
                    console.error('Search failed:', error);
                    return [];
                }
            },

            setCustomers: (customers) => set({ customers }),
            clearError: () => set({ error: null }),
        }),
        { name: 'crm-storage' }
    )
);
