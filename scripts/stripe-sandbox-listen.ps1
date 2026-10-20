# Forwards Stripe SANDBOX webhooks to the local dev server.
#   powershell -File scripts/stripe-sandbox-listen.ps1
# Reads the sandbox key from .env.development.local (never prints it), saves the
# webhook signing secret into that file, then keeps forwarding until stopped.
$ErrorActionPreference = "Stop"
$file = ".env.development.local"
$key = (Select-String -Path $file -Pattern '^STRIPE_SECRET_KEY=(.*)$').Matches[0].Groups[1].Value.Trim()
if (-not $key.StartsWith("sk_test_")) { Write-Error "Sandbox key (sk_test_) missing from $file"; exit 1 }

$stripe = (Get-Command stripe -ErrorAction SilentlyContinue).Source
if (-not $stripe) { $stripe = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Stripe.StripeCli*\stripe.exe" | Select-Object -First 1 -ExpandProperty FullName }

$secret = (& $stripe listen --api-key $key --print-secret).Trim()
if (-not $secret.StartsWith("whsec_")) { Write-Error "Couldn't get a webhook secret from the Stripe CLI"; exit 1 }
$text = Get-Content $file -Raw
$text = [regex]::Replace($text, '(?m)^STRIPE_WEBHOOK_SECRET=.*$', "STRIPE_WEBHOOK_SECRET=$secret")
[IO.File]::WriteAllText((Resolve-Path $file), $text)
Write-Output "Webhook secret saved to $file. Forwarding sandbox events to localhost:3000..."

& $stripe listen --api-key $key --forward-to localhost:3000/api/stripe-webhook --events checkout.session.completed,customer.subscription.updated,customer.subscription.deleted
