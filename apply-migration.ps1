# apply-migration.ps1
# Applies the financial domain migration (non-dry run).
$ErrorActionPreference = 'Stop'

Write-Host "Applying financial domain migration..."

$dirs = @(
  'services/financial/wallet',
  'services/financial/escrow',
  'services/financial/gifts',
  'services/financial/ads',
  'services/financial/p2p',
  'stores/financial/wallet',
  'stores/financial/escrow',
  'stores/financial/gifts',
  'stores/financial/ads',
  'stores/financial/p2p',
  'components/financial/wallet',
  'components/financial/escrow',
  'components/financial/gifts',
  'components/financial/ads',
  'components/financial/p2p',
  'server/api/financial/wallet',
  'server/api/financial/escrow',
  'server/api/financial/gifts',
  'server/api/financial/ads',
  'server/api/financial/p2p'
)

foreach ($d in $dirs) {
  if (-not (Test-Path $d)) {
    New-Item -ItemType Directory -Path $d -Force | Out-Null
    Write-Host "Created dir: $d"
  }
}

$mappings = @{
  'services/wallet.ts' = 'services/financial/wallet/wallet-service.ts'
  'composables/use-wallet.ts' = 'services/financial/wallet/use-wallet.ts'
  'composables/use-escrow-contract.ts' = 'services/financial/escrow/use-escrow-contract.ts'
  'composables/use-pewgift.ts' = 'services/financial/gifts/use-pewgift.ts'
  'stores/ads.ts' = 'stores/financial/ads/ads-store.ts'
  'stores/escrowStore.ts' = 'stores/financial/escrow/escrow-store.ts'
  'components/wallet-overview.vue' = 'components/financial/wallet/wallet-overview.vue'
  'components/wallet-lock-toggle.vue' = 'components/financial/wallet/wallet-lock-toggle.vue'
  'components/escrow-form.vue' = 'components/financial/escrow/escrow-form.vue'
  'components/escrow-message.vue' = 'components/financial/escrow/escrow-message.vue'
  'components/escrow-pending-table.vue' = 'components/financial/escrow/escrow-pending-table.vue'
  'components/escrow-status.vue' = 'components/financial/escrow/escrow-status.vue'
  'components/pewgift-button.vue' = 'components/financial/gifts/pewgift-button.vue'
  'components/pewgift-picker.vue' = 'components/financial/gifts/pewgift-picker.vue'
  'components/pewgift-summary.vue' = 'components/financial/gifts/pewgift-summary.vue'
  'components/pewgift-history.vue' = 'components/financial/gifts/pewgift-history.vue'
  'components/ad-submission-form.vue' = 'components/financial/ads/ad-submission-form.vue'
  'components/ad-preview-simulator.vue' = 'components/financial/ads/ad-preview-simulator.vue'
  'components/ad-payment-panel.vue' = 'components/financial/ads/ad-payment-panel.vue'
  'components/ui/ad-slot.vue' = 'components/financial/ads/ad-slot.vue'
  'components/live-ad-metrics.vue' = 'components/financial/ads/live-ad-metrics.vue'
  'components/p2p-trade-form.vue' = 'components/financial/p2p/p2p-trade-form.vue'
  'server/controllers/wallet-controller.ts' = 'server/api/financial/wallet/wallet-controller.ts'
  'server/controllers/escrow-controller.ts' = 'server/api/financial/escrow/escrow-controller.ts'
  'server/controllers/pewgift-controller.ts' = 'server/api/financial/gifts/pewgift-controller.ts'
}

# Perform git mv for each mapping if source exists
foreach ($old in $mappings.Keys) {
  $new = $mappings[$old]
  if (Test-Path $old) {
    Write-Host "Moving: $old -> $new"
    git mv -f $old $new
  } else {
    Write-Host "SKIP (not found): $old"
  }
}

# Replacement rules (tilde imports)
$replacements = @{
  '~/composables/use-wallet' = '~/services/financial/wallet/use-wallet'
  '~/composables/use-escrow-contract' = '~/services/financial/escrow/use-escrow-contract'
  '~/composables/use-pewgift' = '~/services/financial/gifts/use-pewgift'
  '~/stores/ads' = '~/stores/financial/ads/ads-store'
  '~/stores/escrowStore' = '~/stores/financial/escrow/escrow-store'
}

# Get tracked files to update
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

# Run typecheck
Write-Host "Running typecheck (this may take a while)..."
$tsExit = & npx -y nuxi typecheck
if ($LASTEXITCODE -ne 0) {
  Write-Host "Typecheck failed. Please inspect errors above."
  exit $LASTEXITCODE
}

# Stage and commit
Write-Host "Staging changes..."
& git add -A
& git commit -m 'feat(financial): consolidate financial domain into services/financial'
if ($LASTEXITCODE -ne 0) { Write-Host 'Commit may have failed or no changes to commit.' }

# Push
Write-Host 'Pushing to origin/main...'
& git push origin main

Write-Host 'Migration applied and pushed.'
