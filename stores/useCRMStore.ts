
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Customer } from '../types';

// Initial sample customers for testing
const INITIAL_CUSTOMERS: Customer[] = [
    {
        id: 'cus-1',
        name: 'أحمد محمد',
        phone: '01012345678',
        email: 'ahmed@example.com',
        address: '15 شارع التحرير، المعادي، القاهرة',
        visits: 15,
        totalSpent: 2500,
        loyaltyTier: 'Gold',
        createdAt: new Date('2024-01-15')
    },
    {
        id: 'cus-2',
        name: 'سارة علي',
        phone: '01098765432',
        email: 'sara@example.com',
        address: '25 شارع الأهرام، الجيزة',
        visits: 8,
        totalSpent: 1200,
        loyaltyTier: 'Silver',
        createdAt: new Date('2024-03-20')
    },
    {
        id: 'cus-3',
        name: 'Mohamed Hassan',
        phone: '01155555555',
        email: 'moh@example.com',
        address: '10 Nasr City, Cairo',
        visits: 3,
        totalSpent: 450,
        loyaltyTier: 'Bronze',
        createdAt: new Date('2024-06-10')
    },
];

interface CRMState {
    customers: Customer[];
    addCustomer: (customer: Customer) => void;
    updateCustomer: (customer: Customer) => void;
    deleteCustomer: (id: string) => void;
    getCustomerByPhone: (phone: string) => Customer | undefined;
}

export const useCRMStore = create<CRMState>()(
    persist(
        (set, get) => ({
            customers: INITIAL_CUSTOMERS,

            addCustomer: (customer) => set((state) => ({
                customers: [...state.customers, customer]
            })),

            updateCustomer: (customer) => set((state) => ({
                customers: state.customers.map(c => c.id === customer.id ? customer : c)
            })),

            deleteCustomer: (id) => set((state) => ({
                customers: state.customers.filter(c => c.id !== id)
            })),

            getCustomerByPhone: (phone) => {
                return get().customers.find(c => c.phone.includes(phone));
            }
        }),
        {
            name: 'crm-storage',
        }
    )
);
