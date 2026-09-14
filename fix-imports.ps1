# fix-imports.ps1
$ErrorActionPreference = 'Stop'

$replacements = @{
  "~/composables/use-wallet" = "~/services/financial/wallet/use-wallet"
  "@/composables/use-wallet" = "~/services/financial/wallet/use-wallet"
  "~/composables/use-escrow-contract" = "~/services/financial/escrow/use-escrow-contract"
  "@/composables/use-escrow-contract" = "~/services/financial/escrow/use-escrow-contract"
  "~/composables/use-pewgift" = "~/services/financial/gifts/use-pewgift"
  "@/composables/use-pewgift" = "~/services/financial/gifts/use-pewgift"
  "~/stores/ads" = "~/stores/financial/ads/ads-store"
  "@/stores/ads" = "~/stores/financial/ads/ads-store"
  "~/stores/escrowStore" = "~/stores/financial/escrow/escrow-store"
  "@/stores/escrowStore" = "~/stores/financial/escrow/escrow-store"
}

$files = & git ls-files '*.vue' '*.ts' '*.js'

foreach ($file in $files) {
  $path = $file.Trim()
  if (-not (Test-Path $path)) { continue }
  $content = Get-Content $path -Raw -ErrorAction SilentlyContinue
  $updated = $content
  foreach ($old in $replacements.Keys) {
    $new = $replacements[$old]
    $updated = $updated -replace [regex]::Escape($old), $new
  }
  if ($updated -ne $content) {
    Set-Content -Path $path -Value $updated
    Write-Host "Updated imports in: $path"
  }
}

Write-Host "Import fix pass complete."