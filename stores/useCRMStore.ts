
import { create } from 'zustand';
import { Customer } from '../types';

interface CRMState {
    customers: Customer[];
    addCustomer: (customer: Customer) => void;
    updateCustomer: (customer: Customer) => void;
}

export const useCRMStore = create<CRMState>((set) => ({
    customers: [],
    addCustomer: (customer) => set((state) => ({ customers: [...state.customers, customer] })),
    updateCustomer: (customer) => set((state) => ({
        customers: state.customers.map(c => c.id === customer.id ? customer : c)
    }))
}));
