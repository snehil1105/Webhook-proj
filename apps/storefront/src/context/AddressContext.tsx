import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ShippingAddress {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

interface AddressContextType {
  addresses: ShippingAddress[];
  defaultAddress: ShippingAddress | null;
  selectedAddress: ShippingAddress | null;
  addAddress: (addr: Omit<ShippingAddress, 'id' | 'isDefault'>) => void;
  setDefaultAddress: (id: string) => void;
  setSelectedAddress: (id: string) => void;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const AddressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [addresses, setAddresses] = useState<ShippingAddress[]>(() => {
    const stored = localStorage.getItem('customer_shipping_addresses');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 'addr_1',
        name: 'Default Address',
        street: '123 Design Studio Avenue, Apt 4B',
        city: 'New York',
        state: 'NY',
        zipCode: '10012',
        isDefault: true
      }
    ];
  });

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(() => {
    return localStorage.getItem('customer_selected_address_id');
  });

  useEffect(() => {
    localStorage.setItem('customer_shipping_addresses', JSON.stringify(addresses));
  }, [addresses]);

  useEffect(() => {
    if (selectedAddressId) {
      localStorage.setItem('customer_selected_address_id', selectedAddressId);
    } else {
      localStorage.removeItem('customer_selected_address_id');
    }
  }, [selectedAddressId]);

  const defaultAddress = addresses.find(a => a.isDefault) || addresses[0] || null;
  
  const selectedAddress = addresses.find(a => a.id === selectedAddressId) || defaultAddress;

  const addAddress = (addr: Omit<ShippingAddress, 'id' | 'isDefault'>) => {
    const newAddr: ShippingAddress = {
      ...addr,
      id: 'addr_' + Date.now(),
      isDefault: addresses.length === 0
    };
    setAddresses(prev => [...prev, newAddr]);
  };

  const setDefaultAddress = (id: string) => {
    setAddresses(prev => prev.map(a => ({
      ...a,
      isDefault: a.id === id
    })));
  };

  const setSelectedAddress = (id: string) => {
    setSelectedAddressId(id);
  };

  return (
    <AddressContext.Provider value={{
      addresses,
      defaultAddress,
      selectedAddress,
      addAddress,
      setDefaultAddress,
      setSelectedAddress
    }}>
      {children}
    </AddressContext.Provider>
  );
};

export const useAddresses = () => {
  const context = useContext(AddressContext);
  if (!context) {
    throw new Error('useAddresses must be used within an AddressProvider');
  }
  return context;
};
