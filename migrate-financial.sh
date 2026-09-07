#!/usr/bin/env bash
set -euo pipefail

DRY_RUN=${DRY_RUN:-1}   # default to dry-run. Set DRY_RUN=0 to actually move
REPO_ROOT="$(pwd)"

echo "=== Financial domain migration (dry_run=$DRY_RUN) ==="
# Create directories to ensure structure exists
DIRS=(
  "services/financial/wallet"
  "services/financial/escrow"
  "services/financial/gifts"
  "services/financial/ads"
  "services/financial/p2p"
  "stores/financial/wallet"
  "stores/financial/escrow"
  "stores/financial/gifts"
  "stores/financial/ads"
  "stores/financial/p2p"
  "components/financial/wallet"
  "components/financial/escrow"
  "components/financial/gifts"
  "components/financial/ads"
  "components/financial/p2p"
  "server/api/financial/wallet"
  "server/api/financial/escrow"
  "server/api/financial/gifts"
  "server/api/financial/ads"
  "server/api/financial/p2p"
)
for d in "${DIRS[@]}"; do
  if [ $DRY_RUN -eq 1 ]; then
    echo "[DRY] mkdir -p \"$d\""
  else
    mkdir -p "$d"
  fi
done

# Mapping: old -> new
declare -A MAPPINGS=(
  ["services/wallet.ts"]="services/financial/wallet/wallet-service.ts"
  ["composables/use-wallet.ts"]="services/financial/wallet/use-wallet.ts"
  ["composables/use-escrow-contract.ts"]="services/financial/escrow/use-escrow-contract.ts"
  ["composables/use-pewgift.ts"]="services/financial/gifts/use-pewgift.ts"
  ["stores/ads.ts"]="stores/financial/ads/ads-store.ts"
  ["stores/escrowStore.ts"]="stores/financial/escrow/escrow-store.ts"
  ["components/wallet-overview.vue"]="components/financial/wallet/wallet-overview.vue"
  ["components/wallet-lock-toggle.vue"]="components/financial/wallet/wallet-lock-toggle.vue"
  ["components/escrow-form.vue"]="components/financial/escrow/escrow-form.vue"
  ["components/escrow-message.vue"]="components/financial/escrow/escrow-message.vue"
  ["components/escrow-pending-table.vue"]="components/financial/escrow/escrow-pending-table.vue"
  ["components/escrow-status.vue"]="components/financial/escrow/escrow-status.vue"
  ["components/pewgift-button.vue"]="components/financial/gifts/pewgift-button.vue"
  ["components/pewgift-picker.vue"]="components/financial/gifts/pewgift-picker.vue"
  ["components/pewgift-summary.vue"]="components/financial/gifts/pewgift-summary.vue"
  ["components/pewgift-history.vue"]="components/financial/gifts/pewgift-history.vue"
  ["components/ad-submission-form.vue"]="components/financial/ads/ad-submission-form.vue"
  ["components/ad-preview-simulator.vue"]="components/financial/ads/ad-preview-simulator.vue"
  ["components/ad-payment-panel.vue"]="components/financial/ads/ad-payment-panel.vue"
  ["components/ui/ad-slot.vue"]="components/financial/ads/ad-slot.vue"
  ["components/live-ad-metrics.vue"]="components/financial/ads/live-ad-metrics.vue"
  ["components/p2p-trade-form.vue"]="components/financial/p2p/p2p-trade-form.vue"
  ["server/controllers/wallet-controller.ts"]="server/api/financial/wallet/wallet-controller.ts"
  ["server/controllers/escrow-controller.ts"]="server/api/financial/escrow/escrow-controller.ts"
  ["server/controllers/pewgift-controller.ts"]="server/api/financial/gifts/pewgift-controller.ts"
)

echo
echo "Planned git mv operations:"
for old in "${!MAPPINGS[@]}"; do
  new="${MAPPINGS[$old]}"
  if [ $DRY_RUN -eq 1 ]; then
    echo "[DRY] git mv -f \"$old\" \"$new\""
  else
    if [ -f "$old" ]; then
      git mv -f "$old" "$new"
      echo "Moved: $old -> $new"
    else
      echo "SKIP (not found): $old"
    fi
  fi
done

# Import path replacements (tilde alias and relative)
REPLACEMENTS=(
  "s|~/composables/use-wallet|~/services/financial/wallet/use-wallet|g"
  "s|~/composables/use-escrow-contract|~/services/financial/escrow/use-escrow-contract|g"
  "s|~/composables/use-pewgift|~/services/financial/gifts/use-pewgift|g"
  "s|~/stores/ads|~/stores/financial/ads/ads-store|g"
  "s|~/stores/escrowStore|~/stores/financial/escrow/escrow-store|g"
)

echo
echo "Planned import replacements in .vue/.ts/.js files (tilde imports & relative imports):"
for rep in "${REPLACEMENTS[@]}"; do
  if [ $DRY_RUN -eq 1 ]; then
    echo "[DRY] sed -i \"$rep\" \$(git ls-files '*.vue' '*.ts' '*.js')"
  else
    git ls-files '*.vue' '*.ts' '*.js' | xargs -r sed -i "$rep"
  fi
done

echo
if [ $DRY_RUN -eq 1 ]; then
  echo "DRY RUN complete. To apply the moves, re-run with DRY_RUN=0." 
  exit 0
fi

# After moves and replacements, run typecheck
echo "Running typecheck (npx nuxi typecheck)..."
npx nuxi typecheck || {
  echo "Typecheck failed: inspect errors above and fix import paths if needed."
  exit 1
}

echo "Staging changes..."
git add -A
git commit -m "feat(financial): consolidate financial domain into services/financial" || true
echo "Migration complete. Please push changes (git push)."
