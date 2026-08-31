package com.webhook.deliveryService.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.connection.stream.*;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class RetryScheduler {

    private final RedisTemplate<String, String> redisTemplate;
    @Value("${app.redis.stream-name}")       private String streamName;
    @Value("${app.redis.retry-stream-name}") private String retryStreamName;

    // Runs every 10 seconds (configured in application.yml via fixedDelayString)
    @Scheduled(fixedDelayString = "${app.delivery.retry-scheduler-interval-ms}")
    public void promoteReadyRetries() {
        try {
            // Read ALL messages from the retry stream (from the beginning)
            List<MapRecord<String, Object, Object>> retryMessages =
                    redisTemplate.opsForStream().read(
                            StreamReadOptions.empty().count(100),
                            StreamOffset.fromStart(retryStreamName)
                    );

            if (retryMessages == null || retryMessages.isEmpty()) return;

            int promoted = 0;
            for (MapRecord<String, Object, Object> record : retryMessages) {
                String nextRetryAtStr = (String) record.getValue().get("nextRetryAt");
                LocalDateTime nextRetryAt = LocalDateTime.parse(nextRetryAtStr);

                if (LocalDateTime.now().isAfter(nextRetryAt)) {
                    // Time to retry — move the job back to the main delivery stream
                    String jobJson = (String) record.getValue().get("job");
                    redisTemplate.opsForStream().add(
                            StreamRecords.newRecord()
                                    .in(streamName)
                                    .ofMap(Map.of("job", jobJson))
                    );

                    // Delete from retry stream — it's been promoted
                    redisTemplate.opsForStream().delete(retryStreamName, record.getId().getValue());
                    promoted++;
                }
            }

            if (promoted > 0) {
                log.info("Retry scheduler promoted {} jobs to main stream", promoted);
            }

        } catch (Exception e) {
            log.error("Retry scheduler error", e);
        }
    }
}