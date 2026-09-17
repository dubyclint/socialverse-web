# fix-relative-imports.ps1
$ErrorActionPreference = 'Stop'

$patterns = @{
  'composables/use-wallet' = '~/services/financial/wallet/use-wallet'
  'composables/use-escrow-contract' = '~/services/financial/escrow/use-escrow-contract'
  'composables/use-pewgift' = '~/services/financial/gifts/use-pewgift'
  'stores/ads' = '~/stores/financial/ads/ads-store'
  'stores/escrowStore' = '~/stores/financial/escrow/escrow-store'
  'services/wallet' = '~/services/financial/wallet/wallet-service'
}

$files = & git ls-files '*.vue' '*.ts' '*.js'
$changed = @()

foreach ($file in $files) {
  $path = $file.Trim()
  if (-not (Test-Path $path)) { continue }
  $content = Get-Content $path -Raw -ErrorAction SilentlyContinue
  $updated = $content
  foreach ($key in $patterns.Keys) {
    # replace any prefix variations by iterating prefixes and using simple string replacement
    $prefixes = @('~/', '@/', './', '../', '')
    foreach ($prefix in $prefixes) {
      $searchSingle = "'$prefix$key'"
      $searchDouble = '"' + "$prefix$key" + '"'
      $replaceSingle = "'$($patterns[$key])'"
      $replaceDouble = '"' + "$($patterns[$key])" + '"'
      $updated = $updated.Replace($searchSingle, $replaceSingle)
      $updated = $updated.Replace($searchDouble, $replaceDouble)
    }
  }
  if ($updated -ne $content) {
    Set-Content -Path $path -Value $updated
    $changed += $path
    Write-Host "Updated imports in: $path"
  }
}

if ($changed.Count -eq 0) { Write-Host "No files changed." } else { Write-Host "Files updated: $($changed.Count)" }
