import api from './api';
import { Address } from '../types';

interface AddressResponse {
  success: boolean;
  data: Address[];
  message?: string;
}

interface SingleAddressResponse {
  success: boolean;
  data: Address;
  message?: string;
}

class AddressService {
  // Get all addresses for the current user
  async getUserAddresses(): Promise<Address[]> {
    try {
      const response = await api.get<AddressResponse>('/addresses');
      return response.data.data || [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch addresses');
    }
  }

  // Get a specific address by ID
  async getAddressById(addressId: string): Promise<Address> {
    try {
      const response = await api.get<SingleAddressResponse>(`/addresses/${addressId}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch address');
    }
  }

  // Create a new address
  async createAddress(addressData: Omit<Address, '_id' | 'createdAt' | 'updatedAt'>): Promise<Address> {
    try {
      const response = await api.post<SingleAddressResponse>('/addresses', addressData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create address');
    }
  }

  // Update an existing address
  async updateAddress(addressId: string, addressData: Partial<Address>): Promise<Address> {
    try {
      const response = await api.put<SingleAddressResponse>(`/addresses/${addressId}`, addressData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update address');
    }
  }

  // Delete an address
  async deleteAddress(addressId: string): Promise<void> {
    try {
      await api.delete(`/addresses/${addressId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete address');
    }
  }

  // Set an address as default
  async setDefaultAddress(addressId: string): Promise<Address> {
    try {
      const response = await api.patch<SingleAddressResponse>(`/addresses/${addressId}/default`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to set default address');
    }
  }

  // Get the default address
  async getDefaultAddress(): Promise<Address | null> {
    try {
      const addresses = await this.getUserAddresses();
      return addresses.find(address => address.isDefault) || null;
    } catch (error: any) {
      throw new Error('Failed to fetch default address');
    }
  }

  // Validate address data
  validateAddress(address: Partial<Address>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!address.name?.trim()) {
      errors.push('Address name is required');
    }

    if (!address.street?.trim()) {
      errors.push('Street address is required');
    }

    if (!address.city?.trim()) {
      errors.push('City is required');
    }

    if (!address.state?.trim()) {
      errors.push('State is required');
    }

    if (!address.zipCode?.trim()) {
      errors.push('ZIP code is required');
    }

    if (!address.country?.trim()) {
      errors.push('Country is required');
    }

    if (!address.type) {
      errors.push('Address type is required');
    }

    // Validate ZIP code format (basic validation)
    if (address.zipCode && !/^\d{5,6}$/.test(address.zipCode)) {
      errors.push('ZIP code must be 5-6 digits');
    }

    // Validate phone number if provided
    if (address.phone && !/^[+]?[\d\s\-\(\)]{10,15}$/.test(address.phone)) {
      errors.push('Invalid phone number format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

const addressService = new AddressService();
export default addressService;