# PowerShell script to create first admin via API
# This calls the /api/admin/setup endpoint

$API_URL = "https://omegoo-api-clean.onrender.com"

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "   Omegoo Admin Setup" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Get admin details
$username = Read-Host "Enter admin username"
$email = Read-Host "Enter admin email"
$password = Read-Host "Enter admin password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
)

Write-Host ""
Write-Host "🔄 Creating admin..." -ForegroundColor Yellow

# Prepare request body
$body = @{
    username = $username
    email = $email
    password = $passwordPlain
} | ConvertTo-Json

try {
    # Call setup API
    $response = Invoke-RestMethod -Uri "$API_URL/api/admin/setup" `
        -Method Post `
        -Body $body `
        -ContentType "application/json"

    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "✅ Admin created successfully!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host ""
    Write-Host "👤 Username: $username" -ForegroundColor White
    Write-Host "📧 Email: $email" -ForegroundColor White
    Write-Host "🔑 Password: $passwordPlain" -ForegroundColor White
    Write-Host "👑 Role: $($response.admin.role)" -ForegroundColor White
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 You can now login to the admin panel!" -ForegroundColor Green
    Write-Host "🔗 Admin Panel: https://omegoo.vercel.app/omegoo-admin" -ForegroundColor Cyan
    Write-Host ""
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
    Write-Host "❌ Failed to create admin" -ForegroundColor Red
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
    Write-Host ""
    
    if ($statusCode -eq 403) {
        Write-Host "⚠️  Admin setup already completed!" -ForegroundColor Yellow
        Write-Host "📝 An admin user already exists in the database." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To create additional admins:" -ForegroundColor White
        Write-Host "1. Login to the admin panel with existing credentials" -ForegroundColor White
        Write-Host "2. Use the 'Manage Admins' section to create new admins" -ForegroundColor White
    }
    else {
        Write-Host "Error: $($errorBody.error)" -ForegroundColor Red
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
