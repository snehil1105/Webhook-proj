package com.webhook.deliveryService.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class StreamInitializer implements ApplicationRunner {

    private final RedisTemplate<String, String> redisTemplate;

    @Value("${app.redis.stream-name}")
    private String streamName;

    @Value("${app.redis.consumer-group}")
    private String consumerGroup;

    @Override
    public void run(ApplicationArguments args) {
        try {
            redisTemplate.opsForStream()
                    .createGroup(streamName, ReadOffset.from("0"), consumerGroup);
            log.info("Consumer group '{}' created on stream '{}'", consumerGroup, streamName);
        } catch (Exception e) {
            // Group already exists — this is normal on restart, not an error
            log.info("Consumer group '{}' already exists (normal on restart)", consumerGroup);
        }
    }
}