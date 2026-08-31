package com.webhook.deliveryService.service;

import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

@Service
public class HmacSigningService {

    private static final String ALGORITHM = "HmacSHA256";

    public String sign(String secret, String payload) {
        try {
            Mac mac = Mac.getInstance(ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(
                    secret.getBytes(StandardCharsets.UTF_8), ALGORITHM);
            mac.init(keySpec);

            byte[] hmacBytes = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));

            // Hex-encode the bytes for safe transport in an HTTP header
            return "v1=" + HexFormat.of().formatHex(hmacBytes);

        } catch (Exception e) {
            throw new RuntimeException("HMAC signing failed", e);
        }
    }
}