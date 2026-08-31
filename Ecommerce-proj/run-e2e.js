const fs = require('fs');

const base = 'http://localhost:9090';
const results = [];

async function invokeStep(name, method, url, body = undefined, headers = {}) {
  const opts = { method, headers: { ...headers } };
  if (body !== undefined && body !== null) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  const text = await res.text();
  let parsed = null;
  try { parsed = text ? JSON.parse(text) : null; } catch {}
  results.push({ Name: name, Method: method, Url: url, StatusCode: res.status, Passed: res.ok, Response: text });
  console.log(`${res.ok ? 'PASS' : 'FAIL'} [${res.status}] ${name}`);
  if (!res.ok) {
    if (text) console.log(text);
    throw new Error(`Step failed: ${name}`);
  }
  if (text) console.log(text);
  return parsed;
}

(async () => {
  const password = 'password123';
  const unique = Date.now();
  const retailerEmail = `retailer+${unique}@shop.com`;
  const customerEmail = `buyer+${unique}@example.com`;

  await invokeStep('Business Registration', 'POST', `${base}/business/auth/register`, {
    email: retailerEmail,
    password,
    name: 'Shop Owner',
    role: 'RETAILER'
  });

  const retailerLogin = await invokeStep('Business Login', 'POST', `${base}/business/auth/login`, {
    email: retailerEmail,
    password
  });
  const retailerJwt = String(retailerLogin.token || '').replace(/^Bearer\s+/, '');
  const retailerHeaders = { Authorization: `Bearer ${retailerJwt}` };

  await invokeStep('Customer Registration', 'POST', `${base}/customer/auth/register`, {
    email: customerEmail,
    password,
    name: 'Happy Buyer',
    role: 'CUSTOMER'
  });

  const customerLogin = await invokeStep('Customer Login', 'POST', `${base}/customer/auth/login`, {
    email: customerEmail,
    password
  });
  const customerJwt = String(customerLogin.token || '').replace(/^Bearer\s+/, '');
  const customerHeaders = { Authorization: `Bearer ${customerJwt}` };

  const product1 = await invokeStep('Product Create 1', 'POST', `${base}/business/products`, {
    name: `Wireless Headphones ${unique}`,
    description: 'Noise cancelling over-ear headphones',
    price: 4999.00,
    stockQuantity: 50,
    category: 'Electronics'
  }, retailerHeaders);
  const productId = product1.id;

  await invokeStep('Product Create 2', 'POST', `${base}/business/products`, {
    name: `Cotton T-Shirt ${unique}`,
    description: 'Comfortable summer t-shirt',
    price: 499.00,
    stockQuantity: 200,
    category: 'Clothing'
  }, retailerHeaders);

  await invokeStep('Product Create 3', 'POST', `${base}/business/products`, {
    name: `Spring Boot in Action ${unique}`,
    description: 'Learn Spring Boot 3',
    price: 899.00,
    stockQuantity: 100,
    category: 'Books'
  }, retailerHeaders);

  await invokeStep('Product List Mine', 'GET', `${base}/business/products/mine`, undefined, retailerHeaders);
  await invokeStep('Product List Public', 'GET', `${base}/public/products`);
  await invokeStep('Product Search', 'GET', `${base}/public/products/search?q=Electronics`);
  await invokeStep('Product Detail', 'GET', `${base}/public/products/${productId}`);

  const order = await invokeStep('Order Create', 'POST', `${base}/customer/orders`, {
    items: [{ productId, quantity: 2 }]
  }, customerHeaders);
  const orderId = order.id;

  await invokeStep('Order List Customer', 'GET', `${base}/customer/orders`, undefined, customerHeaders);
  await invokeStep('Order Detail', 'GET', `${base}/customer/orders/${orderId}`, undefined, customerHeaders);
  await invokeStep('Order List Retailer Incoming', 'GET', `${base}/business/orders/incoming`, undefined, retailerHeaders);

  const payment = await invokeStep('Payment Initiate', 'POST', `${base}/customer/payments/initiate`, {
    orderId,
    amount: 9998.00
  }, customerHeaders);
  const razorpayOrderId = payment.razorpayOrderId;

  try {
    await invokeStep('Payment Verify', 'POST', `${base}/customer/payments/verify`, {
      razorpayOrderId,
      razorpayPaymentId: 'pay_test_e2e',
      razorpaySignature: 'placeholder'
    }, customerHeaders);
  } catch {
    console.log('Payment Verify failed; continuing to webhook simulation for applicability check.');
  }

  try {
    await invokeStep('Payment Webhook Captured', 'POST', `${base}/public/payments/razorpay-webhook`, {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_e2e',
            order_id: razorpayOrderId,
            status: 'captured'
          }
        }
      }
    });
  } catch {
    console.log('Payment webhook failed.');
  }

  await invokeStep('Retailer Ship Order', 'PUT', `${base}/business/orders/${orderId}/ship`, undefined, retailerHeaders);
  const stockAfterOrder = await invokeStep('Inventory/Product Stock After Order Event', 'GET', `${base}/public/products/${productId}`);
  await invokeStep('Inventory/Manual Stock Update', 'PUT', `${base}/business/products/${productId}/stock?stockQuantity=75`, undefined, retailerHeaders);
  const stockAfterManual = await invokeStep('Inventory/Product Stock After Manual Update', 'GET', `${base}/public/products/${productId}`);

  try { await invokeStep('Webhook Dashboard Stats', 'GET', 'http://localhost:8085/api/dashboard/stats'); } catch { console.log('Dashboard stats failed.'); }
  try { await invokeStep('Webhook Dashboard Events Delivery Placeholder', 'GET', 'http://localhost:8085/api/dashboard/events/placeholder/deliveries'); } catch { console.log('Dashboard event delivery placeholder failed.'); }

  const summary = {
    retailerJwtPresent: !!retailerJwt,
    customerJwtPresent: !!customerJwt,
    productId,
    orderId,
    razorpayOrderId,
    stockAfterOrder: stockAfterOrder.stockQuantity,
    stockAfterManual: stockAfterManual.stockQuantity,
    results
  };
  fs.writeFileSync('e2e-results.json', JSON.stringify(summary, null, 2));
  console.log('Wrote e2e-results.json');
  if (results.some(r => !r.Passed)) process.exit(2);
})().catch(err => {
  console.error(err.stack || err.message || String(err));
  process.exit(1);
});
