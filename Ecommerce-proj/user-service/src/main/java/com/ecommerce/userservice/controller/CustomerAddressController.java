package com.ecommerce.userservice.controller;

import com.ecommerce.userservice.entity.CustomerAddress;
import com.ecommerce.userservice.repository.CustomerAddressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class CustomerAddressController {

    @Autowired
    private CustomerAddressRepository customerAddressRepository;

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new RuntimeException("No authenticated user");
        }
        return UUID.fromString(authentication.getPrincipal().toString());
    }

    @GetMapping("/customer/addresses")
    public ResponseEntity<List<CustomerAddress>> getAddresses() {
        UUID customerId = getCurrentUserId();
        List<CustomerAddress> addresses = customerAddressRepository.findByCustomerId(customerId);
        return ResponseEntity.ok(addresses);
    }

    @PostMapping("/customer/addresses")
    @Transactional
    public ResponseEntity<CustomerAddress> createAddress(@RequestBody CustomerAddress address) {
        UUID customerId = getCurrentUserId();
        address.setCustomerId(customerId);

        // If this address is set as default, unset any other default addresses first
        if (address.isDefault()) {
            Optional<CustomerAddress> existingDefault = customerAddressRepository.findByCustomerIdAndIsDefaultTrue(customerId);
            existingDefault.ifPresent(addr -> {
                addr.setDefault(false);
                customerAddressRepository.save(addr);
            });
        }

        // If it's the very first address, default it to true
        List<CustomerAddress> existing = customerAddressRepository.findByCustomerId(customerId);
        if (existing.isEmpty()) {
            address.setDefault(true);
        }

        CustomerAddress saved = customerAddressRepository.save(address);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/customer/addresses/{id}")
    @Transactional
    public ResponseEntity<Void> deleteAddress(@PathVariable UUID id) {
        UUID customerId = getCurrentUserId();
        Optional<CustomerAddress> opt = customerAddressRepository.findById(id);
        if (opt.isPresent()) {
            CustomerAddress address = opt.get();
            if (address.getCustomerId().equals(customerId)) {
                customerAddressRepository.delete(address);
                
                // If we deleted the default address, and other addresses exist, set one of them as default
                if (address.isDefault()) {
                    List<CustomerAddress> remaining = customerAddressRepository.findByCustomerId(customerId);
                    if (!remaining.isEmpty()) {
                        CustomerAddress firstRemaining = remaining.get(0);
                        firstRemaining.setDefault(true);
                        customerAddressRepository.save(firstRemaining);
                    }
                }
            }
        }
        return ResponseEntity.noContent().build();
    }
}
