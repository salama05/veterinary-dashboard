$baseUrl = "http://localhost:5000/api"
$ErrorActionPreference = "Stop"

# Load .env file if it exists
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([^#=]+)\s*=\s*(.*)') {
            [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
}

$adminUsername = $env:ADMIN_USERNAME
$adminPassword = $env:ADMIN_PASSWORD
$testPassword = $env:TEST_PASSWORD

if (-not $adminUsername -or -not $adminPassword) {
    Write-Host "Error: ADMIN_USERNAME or ADMIN_PASSWORD not set in environment or .env file." -ForegroundColor Red
    exit
}

function Request-API {
    param (
        [string]$Method,
        [string]$Uri,
        [string]$Token = "",
        [hashtable]$Body = @{}
    )
    $headers = @{}
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    
    try {
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Method $Method -Uri "$baseUrl$Uri" -Headers $headers
        } else {
            $response = Invoke-RestMethod -Method $Method -Uri "$baseUrl$Uri" -Headers $headers -ContentType "application/json" -Body ($Body | ConvertTo-Json)
        }
        return $response
    } catch {
        Write-Host "Error calling $Uri : $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader $_.Exception.Response.GetResponseStream()
            Write-Host "Response Body: $($reader.ReadToEnd())" -ForegroundColor Red
        }
        return $null
    }
}

Write-Host "`n--- STARTING MULTI-TENANCY VERIFICATION ---`n" -ForegroundColor Cyan

# 1. Login as Admin
Write-Host "1. Logging in as '$adminUsername'..." -NoNewline
$adminLogin = Request-API -Method "POST" -Uri "/auth/login" -Body @{ username=$adminUsername; password=$adminPassword }
$tokenAdmin = $adminLogin.token
if (-not $tokenAdmin) { Write-Host "FAILED" -ForegroundColor Red; exit }
Write-Host "SUCCESS (ClinicId: $($adminLogin.clinicId))" -ForegroundColor Green

# 2. Count Admin Products
Write-Host "2. Counting Admin products..." -NoNewline
$adminProducts = Request-API -Method "GET" -Uri "/products" -Token $tokenAdmin
$adminCountInitial = $adminProducts.count
if ($null -eq $adminCountInitial) { $adminCountInitial = $adminProducts.products.count } # Handle potential pagination wrapper
if ($null -eq $adminCountInitial) { $adminCountInitial = 0 }
Write-Host "Count: $adminCountInitial" -ForegroundColor Yellow

# 3. Register New Clinic User
$newUsername = "clinic_" + (Get-Random)
Write-Host "3. Registering new clinic '$newUsername'..." -NoNewline
$newClinic = Request-API -Method "POST" -Uri "/auth/register" -Body @{ username=$newUsername; password=($testPassword -or "password123"); role="admin" }
$tokenNew = $newClinic.token
if (-not $tokenNew) { Write-Host "FAILED" -ForegroundColor Red; exit }
Write-Host "SUCCESS (ClinicId: $($newClinic.clinicId))" -ForegroundColor Green

# 4. Check New Clinic Products (Should be 0)
Write-Host "4. Checking new clinic products (Expect 0)..." -NoNewline
$newProducts = Request-API -Method "GET" -Uri "/products" -Token $tokenNew
$newCount = $newProducts.count
if ($null -eq $newCount) { $newCount = 0 }
if ($newCount -eq 0) {
    Write-Host "SUCCESS (Count: 0)" -ForegroundColor Green
} else {
    Write-Host "FAILED (Count: $newCount)" -ForegroundColor Red
}

# 5. Add Product to New Clinic
Write-Host "5. Adding product 'TestProd' to new clinic..." -NoNewline
$newProd = Request-API -Method "POST" -Uri "/products" -Token $tokenNew -Body @{ name="TestProd"; price=100; minLimit=5 }
if ($newProd._id) {
    Write-Host "SUCCESS" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red
}

# 6. Verify New Clinic sees 1 product
Write-Host "6. Verifying new clinic sees the product..." -NoNewline
$newProductsAfter = Request-API -Method "GET" -Uri "/products" -Token $tokenNew
$newCountAfter = @($newProductsAfter).Count
if ($newCountAfter -eq 1) {
    Write-Host "SUCCESS (Count: 1)" -ForegroundColor Green
} else {
    Write-Host "FAILED (Count: $newCountAfter)" -ForegroundColor Red
}

# 7. Verify Admin still sees original count (ISOLATION CHECK)
Write-Host "7. Verifying Admin still sees original count (ISOLATION CHECK)..." -NoNewline
$adminProductsAfter = Request-API -Method "GET" -Uri "/products" -Token $tokenAdmin
$adminCountAfter = $adminProductsAfter.count
if ($null -eq $adminCountAfter) { $adminCountAfter = 0 }

if ($adminCountAfter -eq $adminCountInitial) {
    Write-Host "SUCCESS (Admin Count: $adminCountAfter)" -ForegroundColor Green
} else {
    Write-Host "FAILED (Admin Count changed to $adminCountAfter)" -ForegroundColor Red
}

Write-Host "`n--- VERIFICATION COMPLETE ---`n" -ForegroundColor Cyan
