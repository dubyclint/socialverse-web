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
Write-Host 'Planned git mv operations (dry-run):'
foreach ($k in $mappings.Keys) {
  Write-Host "[DRY] git mv -f '$k' '$($mappings[$k])'"
}

Write-Host "\nPlanned sed replacements (dry-run):"
$replacements = @(
  "s|~/composables/use-wallet|~/services/financial/wallet/use-wallet|g",
  "s|~/composables/use-escrow-contract|~/services/financial/escrow/use-escrow-contract|g",
  "s|~/composables/use-pewgift|~/services/financial/gifts/use-pewgift|g",
  "s|~/stores/ads|~/stores/financial/ads/ads-store|g",
  "s|~/stores/escrowStore|~/stores/financial/escrow/escrow-store|g"
)
foreach ($r in $replacements) {
  Write-Host "[DRY] sed -i \"$r\" $(git ls-files '*.vue' '*.ts' '*.js')"
}
