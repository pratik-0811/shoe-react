import React, { useState, useEffect } from 'react';
import { Plus, Edit, Edit2, Trash2, MapPin, Home, Building, MoreHorizontal, Check, X, Star, Phone, AlertCircle } from 'lucide-react';
import { Address } from '../types';
import addressService from '../services/addressService';
import Toast from './Toast';

interface AddressManagementProps {
  onAddressSelect?: (address: Address) => void;
  onClose?: () => void;
  selectedShippingId?: string;
  selectedBillingId?: string;
  selectedAddressId?: string;
  showSelection?: boolean;
  showOnlyAddButton?: boolean;
}

const AddressManagement: React.FC<AddressManagementProps> = ({
  onAddressSelect,
  onClose,
  selectedShippingId,
  selectedBillingId,
  selectedAddressId,
  showSelection = false,
  showOnlyAddButton, // This prop was unused in your original logic, but kept here for completeness.
}) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState<Omit<Address, '_id' | 'createdAt' | 'updatedAt'>>({
    type: 'home',
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    phone: '',
    isDefault: false
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const userAddresses = await addressService.getUserAddresses();
      setAddresses(userAddresses);
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      type: 'home',
      fullName: '',
      addressLine1: '',
      addressLine2: '',
      landmark: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      phone: '',
      isDefault: false
    });
    setFormErrors({});
    setEditingAddress(null);
    setShowAddForm(false);
    setIsSubmitting(false);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (formData.fullName.length < 2) {
      errors.fullName = 'Full name must be at least 2 characters';
    }
    
    if (!formData.addressLine1.trim()) {
      errors.addressLine1 = 'Address line 1 is required';
    } else if (formData.addressLine1.length < 5) {
      errors.addressLine1 = 'Please enter a complete address';
    }
    
    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }
    
    if (!formData.state.trim()) {
      errors.state = 'State is required';
    }
    
    if (!formData.postalCode.trim()) {
      errors.postalCode = 'Postal code is required';
    } else if (formData.postalCode.trim().length < 3 || formData.postalCode.trim().length > 20) {
      errors.postalCode = 'Postal code must be between 3 and 20 characters';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[+]?[0-9]{10,15}$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number (10-15 digits)';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setToast({ message: 'Please fix the errors below', type: 'error' });
      return;
    }
    
    setIsSubmitting(true);

    try {
      if (editingAddress) {
        const updatedAddress = await addressService.updateAddress(editingAddress._id!, formData);
        setAddresses(prev => prev.map(addr => 
          addr._id === editingAddress._id ? updatedAddress : addr
        ));
        setToast({ message: 'Address updated successfully', type: 'success' });
      } else {
        const newAddress = await addressService.createAddress(formData);
        setAddresses(prev => [...prev, newAddress]);
        setToast({ message: 'Address added successfully', type: 'success' });
      }
      resetForm();
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (address: Address) => {
    setFormData({
      type: address.type,
      fullName: address.fullName,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      landmark: address.landmark || '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone,
      isDefault: address.isDefault
    });
    setEditingAddress(address);
    setShowAddForm(true);
  };

  const handleDelete = async (addressId: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      await addressService.deleteAddress(addressId);
      setAddresses(prev => prev.filter(addr => addr._id !== addressId));
      setToast({ message: 'Address deleted successfully', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const updatedAddress = await addressService.setDefaultAddress(addressId);
      setAddresses(prev => prev.map(addr => ({
        ...addr,
        isDefault: addr._id === addressId
      })));
      setToast({ message: 'Default address updated', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home':
        return <Home className="w-5 h-5" />;
      case 'office':
        return <Building className="w-5 h-5" />;
      default:
        return <MapPin className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // This is the main return block, which renders the entire component UI.
  // The onClose prop is used to determine if the component should be rendered as a modal.
  if (onClose) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Address Management</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-xl transition-all duration-200 hover:scale-110"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-y-auto max-h-[calc(95vh-80px)] p-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
            {toast && (
              <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(null)}
              />
            )}

            <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10"></div>
              <div className="relative px-8 py-10">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                        {showSelection ? 'Select Delivery Address' : 'Address Management'}
                      </h1>
                    </div>
                    <p className="text-gray-600 text-lg max-w-2xl leading-relaxed">
                      {showSelection 
                        ? 'Choose your preferred delivery location from your saved addresses' 
                        : `Manage your delivery locations with ease. You currently have ${addresses.length} saved address${addresses.length !== 1 ? 'es' : ''}.`
                      }
                    </p>
                    {!showSelection && addresses.length > 0 && (
                      <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span>{addresses.filter(a => a.isDefault).length} default address</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>{addresses.length} total addresses</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="group relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-8 py-4 rounded-2xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 flex items-center gap-3 shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold text-lg overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Add New Address</span>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
              {addresses.map((address) => (
                <div
                  key={address._id}
                  className={`group relative overflow-hidden transition-all duration-500 transform hover:scale-[1.02] ${
                    showSelection && selectedAddressId === address._id
                      ? 'bg-gradient-to-br from-blue-50/90 to-indigo-50/90 backdrop-blur-xl border-2 border-blue-400/50 shadow-2xl shadow-blue-500/20 ring-4 ring-blue-200/30 scale-[1.02]'
                      : 'bg-white/70 backdrop-blur-xl border border-gray-200/50 hover:border-blue-300/50 hover:shadow-xl hover:shadow-blue-500/10'
                  } rounded-3xl p-6 lg:p-8 ${
                    showSelection ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => showSelection && onAddressSelect?.(address)}
                >
                  {address.isDefault && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white text-xs px-4 py-2 rounded-3xl shadow-xl border-2 border-white/50 backdrop-blur-sm flex items-center gap-2 animate-pulse">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-semibold">Default</span>
                    </div>
                  )}

                  {showSelection && selectedAddressId === address._id && (
                    <div className="absolute top-2 left-2 z-50 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white rounded-2xl p-2 shadow-xl border-2 border-white/50 backdrop-blur-sm animate-bounce">
                      <Check className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex items-center flex-col gap-5">
                    <div className="flex-shrink-0">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm border border-white/20 ${
                        address.type === 'home' ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/30 text-blue-600' :
                        address.type === 'office' ? 'bg-gradient-to-br from-purple-500/20 to-purple-600/30 text-purple-600' :
                        'bg-gradient-to-br from-gray-500/20 to-gray-600/30 text-gray-600'
                      }`}>
                        {getAddressIcon(address.type)}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap justify-center">
                      <div className="flex w-full justify-center gap-3">
                        <div className="w-full text-center">
                          <h3 className="font-bold text-gray-900 text-xl mb-2 leading-tight">{address.fullName}</h3>
                          <span className={`inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-xl capitalize shadow-sm ${
                            address.type === 'home' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-200/50' :
                            address.type === 'office' ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-200/50' :
                            'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-200/50'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${
                              address.type === 'home' ? 'bg-blue-500' :
                              address.type === 'office' ? 'bg-purple-500' :
                              'bg-gray-500'
                            }`}></div>
                            {address.type}
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50/50 backdrop-blur-sm rounded-2xl p-4 space-y-3 border border-gray-100/50">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="space-y-2">
                            <p className="text-gray-800 font-medium leading-relaxed">
                              {address.addressLine1}
                              {address.addressLine2 && <><br />{address.addressLine2}</>}
                              {address.landmark && <><br />Near: {address.landmark}</>}
                            </p>
                            <p className="text-gray-600 text-sm">
                              {address.city}, {address.state} {address.postalCode}
                            </p>
                            <p className="text-gray-500 text-sm font-medium">
                              {address.country}
                            </p>
                          </div>
                        </div>
                        
                        {address.phone && (
                          <div className="flex items-center gap-3 pt-2 border-t border-gray-200/50">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 text-sm font-medium">{address.phone}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(address);
                          }}
                          className="group flex-1 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 hover:from-blue-100 hover:to-blue-200 px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 border border-blue-200/50 hover:border-blue-300/50 shadow-sm hover:shadow-md"
                        >
                          <Edit className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                          <span>Edit</span>
                        </button>
                        
                        {!address.isDefault && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetDefault(address._id!);
                            }}
                            className="group flex-1 bg-gradient-to-r from-emerald-50 to-green-100 text-emerald-700 hover:from-emerald-100 hover:to-green-200 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 border border-emerald-200/50 hover:border-emerald-300/50 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                          >
                            <Star className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                            <span>Set Default</span>
                          </button>
                        )}
                        
                        {!showSelection && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(address._id!);
                            }}
                            className="group bg-gradient-to-r from-red-50 to-red-100 text-red-700 hover:from-red-100 hover:to-red-200 px-4 py-3 rounded-xl transition-all duration-300 border border-red-200/50 hover:border-red-300/50 shadow-sm hover:shadow-md"
                          >
                            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                          </button>
                        )}
                      </div>  
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {addresses.length === 0 && (
              <div className="text-center py-20">
                <div className="relative mx-auto mb-8">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto shadow-2xl border-4 border-white/50 backdrop-blur-sm">
                    <MapPin className="w-16 h-16 text-blue-600" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-4">
                  No addresses saved yet
                </h3>
                <p className="text-gray-600 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
                  Create your first address to streamline your checkout experience. Save multiple locations for home, office, or anywhere you need deliveries.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="group bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-10 py-5 rounded-2xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold text-lg flex items-center gap-4 transform hover:scale-105"
                  >
                    <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Add Your First Address</span>
                    <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {showAddForm && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </h3>
                    <p className="text-blue-100 text-sm mt-1">
                      {editingAddress ? 'Update your address details' : 'Fill in the details below'}
                    </p>
                  </div>
                  <button
                    onClick={resetForm}
                    className="text-white hover:bg-white/20 p-2.5 rounded-xl transition-all duration-200 hover:scale-110"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 md:p-8 overflow-y-auto max-h-[calc(95vh-90px)]">
                  <form onSubmit={handleSubmit} className="space-y-7">
                  
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Address Type
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => handleInputChange('type', 'home')}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                            formData.type === 'home'
                              ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                              : 'border-gray-200 hover:border-blue-300 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <Home className="w-6 h-6" />
                          <span className="text-sm font-medium">Home</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleInputChange('type', 'office')}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                            formData.type === 'office'
                              ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md'
                              : 'border-gray-200 hover:border-purple-300 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <Building className="w-6 h-6" />
                          <span className="text-sm font-medium">Office</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleInputChange('type', 'other')}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                            formData.type === 'other'
                              ? 'border-gray-500 bg-gray-50 text-gray-700 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <MapPin className="w-6 h-6" />
                          <span className="text-sm font-medium">Other</span>
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => {
                          handleInputChange('fullName', e.target.value);
                          if (formErrors.fullName) {
                            setFormErrors(prev => ({ ...prev, fullName: '' }));
                          }
                        }}
                        className={`w-full px-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 font-medium ${
                          formErrors.fullName 
                            ? 'border-red-300 focus:ring-red-100 focus:border-red-500 bg-red-50' 
                            : 'border-gray-200 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300'
                        }`}
                        placeholder="Enter your full name"
                        required
                      />
                      {formErrors.fullName && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5 bg-red-50 px-3 py-2 rounded-lg">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {formErrors.fullName}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        value={formData.addressLine1}
                        onChange={(e) => {
                          handleInputChange('addressLine1', e.target.value);
                          if (formErrors.addressLine1) {
                            setFormErrors(prev => ({ ...prev, addressLine1: '' }));
                          }
                        }}
                        className={`w-full px-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 font-medium ${
                          formErrors.addressLine1 
                            ? 'border-red-300 focus:ring-red-100 focus:border-red-500 bg-red-50' 
                            : 'border-gray-200 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300'
                        }`}
                        placeholder="House/Flat/Office No, Building Name"
                        required
                      />
                      {formErrors.addressLine1 && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5 bg-red-50 px-3 py-2 rounded-lg">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {formErrors.addressLine1}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Address Line 2 (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.addressLine2}
                        onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                        className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300 transition-all duration-200 font-medium"
                        placeholder="Street Name, Area"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.landmark}
                        onChange={(e) => handleInputChange('landmark', e.target.value)}
                        className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300 transition-all duration-200 font-medium"
                        placeholder="Near famous place, monument, etc."
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          City
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => {
                            handleInputChange('city', e.target.value);
                            if (formErrors.city) {
                              setFormErrors(prev => ({ ...prev, city: '' }));
                            }
                          }}
                          className={`w-full px-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 font-medium ${
                            formErrors.city 
                              ? 'border-red-300 focus:ring-red-100 focus:border-red-500 bg-red-50' 
                              : 'border-gray-200 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300'
                          }`}
                          placeholder="Enter city"
                          required
                        />
                        {formErrors.city && (
                          <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5 bg-red-50 px-3 py-2 rounded-lg">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {formErrors.city}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          State
                        </label>
                        <input
                          type="text"
                          value={formData.state}
                          onChange={(e) => {
                            handleInputChange('state', e.target.value);
                            if (formErrors.state) {
                              setFormErrors(prev => ({ ...prev, state: '' }));
                            }
                          }}
                          className={`w-full px-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 font-medium ${
                            formErrors.state 
                              ? 'border-red-300 focus:ring-red-100 focus:border-red-500 bg-red-50' 
                              : 'border-gray-200 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300'
                          }`}
                          placeholder="Enter state"
                          required
                        />
                        {formErrors.state && (
                          <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5 bg-red-50 px-3 py-2 rounded-lg">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {formErrors.state}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          value={formData.postalCode}
                          onChange={(e) => {
                            handleInputChange('postalCode', e.target.value);
                            if (formErrors.postalCode) {
                              setFormErrors(prev => ({ ...prev, postalCode: '' }));
                            }
                          }}
                          className={`w-full px-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 font-medium ${
                            formErrors.postalCode 
                              ? 'border-red-300 focus:ring-red-100 focus:border-red-500 bg-red-50' 
                              : 'border-gray-200 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300'
                          }`}
                          placeholder="Enter postal code"
                          required
                        />
                        {formErrors.postalCode && (
                          <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5 bg-red-50 px-3 py-2 rounded-lg">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {formErrors.postalCode}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Country
                        </label>
                        <select
                          value={formData.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                          className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300 transition-all duration-200 font-medium"
                        >
                          <option value="India">India</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => {
                            handleInputChange('phone', e.target.value);
                            if (formErrors.phone) {
                              setFormErrors(prev => ({ ...prev, phone: '' }));
                            }
                          }}
                          className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 font-medium ${
                            formErrors.phone 
                              ? 'border-red-300 focus:ring-red-100 focus:border-red-500 bg-red-50' 
                              : 'border-gray-200 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300'
                          }`}
                          placeholder="Enter phone number"
                          required
                        />
                      </div>
                      {formErrors.phone && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5 bg-red-50 px-3 py-2 rounded-lg">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {formErrors.phone}
                        </p>
                      )}
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-100/50">
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          id="isDefault"
                          checked={formData.isDefault}
                          onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                          className="w-6 h-6 text-blue-600 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-100 transition-all duration-200 mt-0.5"
                        />
                        <div className="flex-1">
                          <label htmlFor="isDefault" className="text-base font-bold text-gray-900 cursor-pointer flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500" />
                            Set as default address
                          </label>
                          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                            This address will be automatically selected during checkout for faster ordering
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 pt-8">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="group flex-1 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white py-5 px-8 rounded-2xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transform hover:scale-[1.02] relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        {isSubmitting ? (
                          <>
                            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Saving Address...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                            <span>{editingAddress ? 'Update Address' : 'Save Address'}</span>
                            <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        disabled={isSubmitting}
                        className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 py-5 px-8 rounded-2xl hover:from-gray-200 hover:to-gray-300 font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 border border-gray-300/50"
                      >
                        <X className="w-5 h-5" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // The main component view when not in a modal
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10"></div>
          <div className="relative px-8 py-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                    {showSelection ? 'Select Delivery Address' : 'Address Management'}
                  </h1>
                </div>
                <p className="text-gray-600 text-lg max-w-2xl leading-relaxed">
                  {showSelection 
                    ? 'Choose your preferred delivery location from your saved addresses' 
                    : `Manage your delivery locations with ease. You currently have ${addresses.length} saved address${addresses.length !== 1 ? 'es' : ''}.`
                  }
                </p>
                {!showSelection && addresses.length > 0 && (
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>{addresses.filter(a => a.isDefault).length} default address</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>{addresses.length} total addresses</span>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowAddForm(true)}
                className="group relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-8 py-4 rounded-2xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 flex items-center gap-3 shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold text-lg overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                <span>Add New Address</span>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
              </button>
            </div>
          </div>
        </div>

        {addresses.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
              <MapPin className="w-16 h-16 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No addresses yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Add your first delivery address to get started with seamless shopping.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl hover:from-blue-700 hover:to-indigo-700 flex items-center gap-3 mx-auto shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold"
            >
              <Plus className="w-5 h-5" />
              Add Your First Address
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {addresses.map((address) => (
              <div
                key={address._id}
                className={`group relative overflow-hidden transition-all duration-500 transform hover:scale-[1.02] ${
                  showSelection && selectedAddressId === address._id
                    ? 'bg-gradient-to-br from-blue-50/90 to-indigo-50/90 backdrop-blur-xl border-2 border-blue-400/50 shadow-2xl shadow-blue-500/20 ring-4 ring-blue-200/30 scale-[1.02]'
                    : 'bg-white/70 backdrop-blur-xl border border-gray-200/50 hover:border-blue-300/50 hover:shadow-xl hover:shadow-blue-500/10'
                } rounded-3xl p-6 lg:p-8 ${
                  showSelection ? 'cursor-pointer' : ''
                }`}
                onClick={() => showSelection && onAddressSelect?.(address)}
              >
                {/* Re-using the address card content from the modal view for consistency */}
                {address.isDefault && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white text-xs px-4 py-2 rounded-2xl shadow-xl border-2 border-white/50 backdrop-blur-sm flex items-center gap-2 animate-pulse">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-semibold">Default</span>
                  </div>
                )}
                {showSelection && selectedAddressId === address._id && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white rounded-2xl p-3 shadow-xl border-2 border-white/50 backdrop-blur-sm animate-bounce">
                    <Check className="w-5 h-5" />
                  </div>
                )}
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm border border-white/20 ${
                      address.type === 'home' ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/30 text-blue-600' :
                      address.type === 'office' ? 'bg-gradient-to-br from-purple-500/20 to-purple-600/30 text-purple-600' :
                      'bg-gradient-to-br from-gray-500/20 to-gray-600/30 text-gray-600'
                    }`}>
                      {getAddressIcon(address.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-xl mb-2 leading-tight">{address.fullName}</h3>
                        <span className={`inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-xl capitalize shadow-sm ${
                          address.type === 'home' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-200/50' :
                          address.type === 'office' ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-200/50' :
                          'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-200/50'
                        }`}>
                          
                          {address.type}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50/50 backdrop-blur-sm rounded-2xl p-4 space-y-3 border border-gray-100/50">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="space-y-2">
                          <p className="text-gray-800 font-medium leading-relaxed">
                            {address.addressLine1}
                            {address.addressLine2 && <><br />{address.addressLine2}</>}
                            {address.landmark && <><br />Near: {address.landmark}</>}
                          </p>
                          <p className="text-gray-600 text-sm">
                            {address.city}, {address.state} {address.postalCode}
                          </p>
                          <p className="text-gray-500 text-sm font-medium">
                            {address.country}
                          </p>
                        </div>
                      </div>
                      
                      {address.phone && (
                        <div className="flex items-center gap-3 pt-2 border-t border-gray-200/50">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 text-sm font-medium">{address.phone}</span>
                        </div>
                      )}
                    </div>
                    
                    {!showSelection && (
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(address);
                          }}
                          className="group flex-1 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 hover:from-blue-100 hover:to-blue-200 px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 border border-blue-200/50 hover:border-blue-300/50 shadow-sm hover:shadow-md"
                        >
                          <Edit className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                          <span>Edit</span>
                        </button>
                        
                        {!address.isDefault && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetDefault(address._id!);
                            }}
                            className="group flex-1 bg-gradient-to-r from-emerald-50 to-green-100 text-emerald-700 hover:from-emerald-100 hover:to-green-200 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 border border-emerald-200/50 hover:border-emerald-300/50 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                          >
                            <Star className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                            <span>Set Default</span>
                          </button>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(address._id!);
                          }}
                          className="group bg-gradient-to-r from-red-50 to-red-100 text-red-700 hover:from-red-100 hover:to-red-200 px-4 py-3 rounded-xl transition-all duration-300 border border-red-200/50 hover:border-red-300/50 shadow-sm hover:shadow-md"
                        >
                          <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                        </button>
                      </div>
                    )}  
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressManagement;