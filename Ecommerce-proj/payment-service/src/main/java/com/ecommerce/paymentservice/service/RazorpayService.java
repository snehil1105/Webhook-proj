package com.ecommerce.paymentservice.service;

import com.ecommerce.paymentservice.entity.Payment;
import com.ecommerce.paymentservice.exception.AppException;
import com.ecommerce.paymentservice.repository.PaymentRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RazorpayService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private KafkaProducerService kafkaProducerService;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${order-service.base-url:http://localhost:9093}")
    private String orderServiceBaseUrl;

    @Value("${product-service.base-url:http://localhost:9092}")
    private String productServiceBaseUrl;

    @Value("${user-service.base-url:http://localhost:9091}")
    private String userServiceBaseUrl;

    @Value("${razorpay.key-id:rzp_test_YOUR_KEY_ID}")
    private String keyId;

    @Value("${razorpay.key-secret:YOUR_KEY_SECRET}")
    private String keySecret;

    @Value("${platform.commission-percent:10.0}")
    private double platformCommissionPercent;

    private static final Logger logger = LoggerFactory.getLogger(RazorpayService.class);

    @Transactional
    public Payment initiatePayment(UUID customerId, UUID orderId, BigDecimal amount, String authHeader) {
        String razorpayOrderId = null;
        try {
            // Group totals by seller
            Map<UUID, BigDecimal> sellerTotals = new java.util.HashMap<>();
            try {
                HttpHeaders headers = new HttpHeaders();
                if (authHeader != null) {
                    headers.set("Authorization", authHeader);
                }
                HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

                // Fetch Order
                ResponseEntity<Map> orderResponse = restTemplate.exchange(
                        orderServiceBaseUrl + "/customer/orders/" + orderId,
                        HttpMethod.GET, requestEntity, Map.class);

                if (orderResponse.getStatusCode().is2xxSuccessful() && orderResponse.getBody() != null) {
                    List<Map<String, Object>> items = (List<Map<String, Object>>) orderResponse.getBody().get("items");
                    for (Map<String, Object> item : items) {
                        UUID productId = UUID.fromString(item.get("productId").toString());
                        int qty = ((Number) item.get("quantity")).intValue();

                        // Fetch Product
                        ResponseEntity<Map> productResponse = restTemplate.exchange(
                                productServiceBaseUrl + "/public/products/" + productId,
                                HttpMethod.GET, null, Map.class);

                        if (productResponse.getStatusCode().is2xxSuccessful() && productResponse.getBody() != null) {
                            UUID retailerId = UUID.fromString(productResponse.getBody().get("retailerId").toString());
                            BigDecimal price = new BigDecimal(productResponse.getBody().get("price").toString());
                            BigDecimal lineTotal = price.multiply(BigDecimal.valueOf(qty));

                            sellerTotals.put(retailerId, sellerTotals.getOrDefault(retailerId, BigDecimal.ZERO).add(lineTotal));
                        }
                    }
                }
            } catch (Exception e) {
                logger.error("Failed to calculate seller transfers split: {}", e.getMessage());
            }

            RazorpayClient razorpayClient = new RazorpayClient(keyId, keySecret);
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amount.multiply(BigDecimal.valueOf(100)).intValue()); // paise
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", orderId.toString());

            // Build transfers array
            JSONArray transfers = new JSONArray();
            for (Map.Entry<UUID, BigDecimal> entry : sellerTotals.entrySet()) {
                UUID retailerId = entry.getKey();
                BigDecimal totalAmt = entry.getValue();

                try {
                    // Fetch seller linked account ID
                    ResponseEntity<Map> sellerResponse = restTemplate.exchange(
                            userServiceBaseUrl + "/public/sellers/" + retailerId,
                            HttpMethod.GET, null, Map.class);

                    if (sellerResponse.getStatusCode().is2xxSuccessful() && sellerResponse.getBody() != null) {
                        String razorpayAccountId = (String) sellerResponse.getBody().get("razorpayAccountId");
                        if (razorpayAccountId != null && !razorpayAccountId.trim().isEmpty()) {
                            JSONObject transfer = new JSONObject();
                            transfer.put("account", razorpayAccountId);
                            // Platform keeps configured commission
                            double multiplier = (100.0 - platformCommissionPercent) / 100.0;
                            BigDecimal sellerShare = totalAmt.multiply(BigDecimal.valueOf(multiplier));
                            transfer.put("amount", sellerShare.multiply(BigDecimal.valueOf(100)).intValue()); // paise
                            transfer.put("currency", "INR");
                            transfer.put("on_hold", false); // process immediately
                            transfers.put(transfer);
                        }
                    }
                } catch (Exception ex) {
                    logger.error("Could not fetch settlement account for retailer {}: {}", retailerId, ex.getMessage());
                }
            }

            if (transfers.length() > 0) {
                orderRequest.put("transfers", transfers);
            }

            logger.info("Creating real Razorpay Order with split transfers payload: {}", orderRequest.toString());
            Order razorpayOrder = razorpayClient.orders.create(orderRequest);
            razorpayOrderId = razorpayOrder.get("id");
        } catch (Exception e) {
            logger.error("Failed to create Razorpay order with client: {}", e.getMessage());
            throw new AppException("Razorpay order creation failed: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }

        Payment payment = Payment.builder()
                .orderId(orderId)
                .customerId(customerId)
                .razorpayOrderId(razorpayOrderId)
                .amount(amount)
                .currency("INR")
                .status(Payment.Status.CREATED)
                .build();
        return paymentRepository.save(payment);
    }

    @Transactional
    public Payment verifyPayment(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        Payment payment = paymentRepository.findByRazorpayOrderId(razorpayOrderId);
        if (payment == null) {
            throw new AppException("Payment not found for order id: " + razorpayOrderId, HttpStatus.NOT_FOUND);
        }

        // Verify signature
        boolean isValid = verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
        if (!isValid) {
            payment.setStatus(Payment.Status.FAILED);
            paymentRepository.save(payment);
            kafkaProducerService.publishPaymentFailed(payment.getOrderId(), payment.getId(), "Invalid signature");
            throw new AppException("Payment signature verification failed", HttpStatus.BAD_REQUEST);
        }

        payment.setRazorpayPaymentId(razorpayPaymentId);
        payment.setStatus(Payment.Status.SUCCESS);
        Payment saved = paymentRepository.save(payment);
        kafkaProducerService.publishPaymentSuccess(payment.getOrderId(), saved.getId(), payment.getAmount());
        return saved;
    }

    public boolean verifySignature(String orderId, String paymentId, String signature) {
        try {
            String payload = orderId + "|" + paymentId;
            return Utils.verifySignature(payload, signature, keySecret);
        } catch (Exception e) {
            logger.error("Signature verification error: {}", e.getMessage());
            return false;
        }
    }

    @Transactional
    public void handleRazorpayWebhook(JSONObject payload) {
        try {
            String event = payload.getString("event");
            if ("payment.captured".equals(event) || "payment.authorized".equals(event)) {
                JSONObject entity = payload.getJSONObject("payload")
                        .getJSONObject("payment")
                        .getJSONObject("entity");
                String razorpayOrderId = entity.getString("order_id");
                String razorpayPaymentId = entity.getString("id");
                Payment payment = paymentRepository.findByRazorpayOrderId(razorpayOrderId);
                if (payment != null && payment.getStatus() != Payment.Status.SUCCESS) {
                    payment.setRazorpayPaymentId(razorpayPaymentId);
                    payment.setStatus(Payment.Status.SUCCESS);
                    Payment saved = paymentRepository.save(payment);
                    kafkaProducerService.publishPaymentSuccess(payment.getOrderId(), saved.getId(), payment.getAmount());
                }
            } else if ("payment.failed".equals(event)) {
                JSONObject entity = payload.getJSONObject("payload")
                        .getJSONObject("payment")
                        .getJSONObject("entity");
                String razorpayOrderId = entity.getString("order_id");
                Payment payment = paymentRepository.findByRazorpayOrderId(razorpayOrderId);
                if (payment != null) {
                    payment.setStatus(Payment.Status.FAILED);
                    Payment saved = paymentRepository.save(payment);
                    kafkaProducerService.publishPaymentFailed(payment.getOrderId(), saved.getId(), "Payment failed");
                }
            } else if ("transfer.processed".equals(event)) {
                logger.info("Razorpay Route Transfer processed successfully via Webhook event: {}", payload.toString());
            }
        } catch (Exception e) {
            logger.error("Failed to handle Razorpay webhook: {}", e.getMessage());
            throw new AppException("Failed to process webhook", HttpStatus.BAD_REQUEST);
        }
    }

    public String getKeyId() {
        return keyId;
    }
}