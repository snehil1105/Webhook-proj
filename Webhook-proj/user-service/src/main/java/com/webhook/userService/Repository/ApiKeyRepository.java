package com.webhook.userService.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.webhook.userService.entity.ApiKey;

public interface ApiKeyRepository extends JpaRepository<ApiKey, UUID>{

    Optional<ApiKey> findByKeyHashAndIsActiveTrue(String keyHash);
    List<ApiKey> findByUserIdAndIsActiveTrue(UUID id);

}
