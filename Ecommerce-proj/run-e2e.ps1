param(
  [switch]$VerboseOutput
)
$ErrorActionPreference = 'Stop'
$base = 'http://localhost:9090'
$results = New-Object System.Collections.Generic.List[object]

function Invoke-Step {
  param(
    [string]$Name,
    [string]$Method,
    [string]$Url,
    [object]$Body = $null,
    [hashtable]$Headers = @{}
  )
  $jsonBody = $null
  if ($null -ne $Body) { $jsonBody = $Body | ConvertTo-Json -Depth 20 }
  try {
    $params = @{ Method=$Method; Uri=$Url; Headers=$Headers; TimeoutSec=60 }
    if ($null -ne $jsonBody) { $params.ContentType = 'application/json'; $params.Body = $jsonBody }
    $response = Invoke-WebRequest @params
    $text = $response.Content
    $parsed = $null
    if ($text) { try { $parsed = $text | ConvertFrom-Json } catch {} }
    $script:results.Add([pscustomobject]@{ Name=$Name; Method=$Method; Url=$Url; StatusCode=[int]$response.StatusCode; Passed=$true; Response=$text }) | Out-Null
    Write-Host "PASS [$($response.StatusCode)] $Name"
    if ($VerboseOutput -and $text) { Write-Host $text }
    return $parsed
  } catch {
    $status = $null; $bodyText = $null
    if ($_.Exception.Response) {
      $status = [int]$_.Exception.Response.StatusCode
      try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $bodyText = $reader.ReadToEnd()
      } catch { $bodyText = $_.Exception.Message }
    } else { $bodyText = $_.Exception.Message }
    $script:results.Add([pscustomobject]@{ Name=$Name; Method=$Method; Url=$Url; StatusCode=$status; Passed=$false; Response=$bodyText }) | Out-Null
    Write-Host "FAIL [$status] $Name"
    if ($bodyText) { Write-Host $bodyText }
    throw "Step failed: $Name"
  }
}

$password = 'password123'
$unique = [DateTimeOffset]::Now.ToUnixTimeSeconds()
$retailerEmail = "retailer+$unique@shop.com"
$customerEmail = "buyer+$unique@example.com"

$retailerReg = Invoke-Step 'Business Registration' POST "$base/business/auth/register" @{ email=$retailerEmail; password=$password; name='Shop Owner'; role='RETAILER' }
$retailerLogin = Invoke-Step 'Business Login' POST "$base/business/auth/login" @{ email=$retailerEmail; password=$password }
$retailerJwt = ($retailerLogin.token -replace '^Bearer\s+', '')
$retailerHeaders = @{ Authorization = "Bearer $retailerJwt" }

$customerReg = Invoke-Step 'Customer Registration' POST "$base/customer/auth/register" @{ email=$customerEmail; password=$password; name='Happy Buyer'; role='CUSTOMER' }
$customerLogin = Invoke-Step 'Customer Login' POST "$base/customer/auth/login" @{ email=$customerEmail; password=$password }
$customerJwt = ($customerLogin.token -replace '^Bearer\s+', '')
$customerHeaders = @{ Authorization = "Bearer $customerJwt" }

$product1 = Invoke-Step 'Product Create 1' POST "$base/business/products" @{ name="Wireless Headphones $unique"; description='Noise cancelling over-ear headphones'; price=4999.00; stockQuantity=50; category='Electronics' } $retailerHeaders
$productId = $product1.id
$product2 = Invoke-Step 'Product Create 2' POST "$base/business/products" @{ name="Cotton T-Shirt $unique"; description='Comfortable summer t-shirt'; price=499.00; stockQuantity=200; category='Clothing' } $retailerHeaders
$product3 = Invoke-Step 'Product Create 3' POST "$base/business/products" @{ name="Spring Boot in Action $unique"; description='Learn Spring Boot 3'; price=899.00; stockQuantity=100; category='Books' } $retailerHeaders

$mine = Invoke-Step 'Product List Mine' GET "$base/business/products/mine" $null $retailerHeaders
$publicList = Invoke-Step 'Product List Public' GET "$base/public/products"
$search = Invoke-Step 'Product Search' GET "$base/public/products/search?q=Electronics"
$detail = Invoke-Step 'Product Detail' GET "$base/public/products/$productId"

$order = Invoke-Step 'Order Create' POST "$base/customer/orders" @{ items=@(@{ productId=$productId; quantity=2 }) } $customerHeaders
$orderId = $order.id
$orderList = Invoke-Step 'Order List Customer' GET "$base/customer/orders" $null $customerHeaders
$orderDetail = Invoke-Step 'Order Detail' GET "$base/customer/orders/$orderId" $null $customerHeaders
$retailerIncoming = Invoke-Step 'Order List Retailer Incoming' GET "$base/business/orders/incoming" $null $retailerHeaders

$payment = Invoke-Step 'Payment Initiate' POST "$base/customer/payments/initiate" @{ orderId=$orderId; amount=9998.00 } $customerHeaders
$razorpayOrderId = $payment.razorpayOrderId

try {
  $verify = Invoke-Step 'Payment Verify' POST "$base/customer/payments/verify" @{ razorpayOrderId=$razorpayOrderId; razorpayPaymentId='pay_test_e2e'; razorpaySignature='placeholder' } $customerHeaders
} catch {
  Write-Host 'Payment Verify failed; continuing to webhook simulation for applicability check.'
}

try {
  $webhook = Invoke-Step 'Payment Webhook Captured' POST "$base/public/payments/razorpay-webhook" @{ event='payment.captured'; payload=@{ payment=@{ entity=@{ id='pay_test_e2e'; order_id=$razorpayOrderId; status='captured' } } } }
} catch {
  Write-Host 'Payment webhook failed.'
}

$shipped = Invoke-Step 'Retailer Ship Order' PUT "$base/business/orders/$orderId/ship" $null $retailerHeaders
$stockAfterOrder = Invoke-Step 'Inventory/Product Stock After Order Event' GET "$base/public/products/$productId"
$stockUpdate = Invoke-Step 'Inventory/Manual Stock Update' PUT "$base/business/products/$productId/stock?stockQuantity=75" $null $retailerHeaders
$stockAfterManual = Invoke-Step 'Inventory/Product Stock After Manual Update' GET "$base/public/products/$productId"

try { Invoke-Step 'Webhook Dashboard Stats' GET 'http://localhost:8085/api/dashboard/stats' | Out-Null } catch { Write-Host 'Dashboard stats failed.' }
try { Invoke-Step 'Webhook Dashboard Events Delivery Placeholder' GET 'http://localhost:8085/api/dashboard/events/placeholder/deliveries' | Out-Null } catch { Write-Host 'Dashboard event delivery placeholder failed.' }

$summary = [pscustomobject]@{
  retailerJwtPresent = [bool]$retailerJwt
  customerJwtPresent = [bool]$customerJwt
  productId = $productId
  orderId = $orderId
  razorpayOrderId = $razorpayOrderId
  stockAfterOrder = $stockAfterOrder.stockQuantity
  stockAfterManual = $stockAfterManual.stockQuantity
  results = $results
}
$summary | ConvertTo-Json -Depth 20 | Set-Content -Path '.\e2e-results.json' -Encoding UTF8
Write-Host 'Wrote e2e-results.json'
if (($results | Where-Object { -not $_.Passed }).Count -gt 0) { exit 2 }
