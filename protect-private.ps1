param([ValidateSet('generate','custom')][string]$Mode = 'generate')
$blogNodeCommand = Get-Command node -ErrorAction SilentlyContinue
$blogNodePath = if ($blogNodeCommand) { $blogNodeCommand.Source } else { $null }
$blogBundledNode = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
if (-not $blogNodePath -or (& $blogNodePath --version) -notmatch '^v24\.') {
    if ((Test-Path -LiteralPath $blogBundledNode) -and (& $blogBundledNode --version) -match '^v24\.') { $blogNodePath = $blogBundledNode }
    else { throw 'This tool needs Node.js 24. Install or switch to Node.js 24 first.' }
}
$blogPassphrase = $null
$blogSecureFirst = $null
$blogSecureSecond = $null
$blogPreviousEncoding = $OutputEncoding
try {
    if ($Mode -eq 'generate') {
        $blogPassphrase = & $blogNodePath -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('base64url'))"
        Write-Host 'Save this unique vault passphrase in your password manager. It is shown only in this local terminal.'
        Write-Host $blogPassphrase -ForegroundColor Yellow
        $blogSaved = Read-Host 'After saving it, type YES to encrypt your private documents'
        if ($blogSaved -ne 'YES') { Write-Host 'No documents were encrypted.'; return }
        $blogSecureFirst = Read-Host 'Paste the saved passphrase to confirm it before encryption' -AsSecureString
        $blogConfirmation = [System.Net.NetworkCredential]::new('', $blogSecureFirst).Password
        if ($blogPassphrase -cne $blogConfirmation) { throw 'The saved passphrase does not match. No documents were encrypted.' }
        $blogConfirmation = $null
    } else {
        $blogSecureFirst = Read-Host 'Enter a unique vault passphrase (at least 20 characters)' -AsSecureString
        $blogSecureSecond = Read-Host 'Confirm the passphrase' -AsSecureString
        $blogPassphrase = [System.Net.NetworkCredential]::new('', $blogSecureFirst).Password
        $blogConfirmation = [System.Net.NetworkCredential]::new('', $blogSecureSecond).Password
        if ($blogPassphrase -cne $blogConfirmation) { throw 'Passphrases do not match.' }
        $blogConfirmation = $null
    }
    $OutputEncoding = [Text.UTF8Encoding]::new($false)
    $blogPassphrase | & $blogNodePath (Join-Path $PSScriptRoot 'scripts/pack-vault.mjs') --password-stdin
    if ($LASTEXITCODE -ne 0) { throw 'Vault encryption failed.' }
} finally {
    $blogPassphrase = $null
    $blogConfirmation = $null
    if ($blogSecureFirst) { $blogSecureFirst.Dispose() }
    if ($blogSecureSecond) { $blogSecureSecond.Dispose() }
    $OutputEncoding = $blogPreviousEncoding
}
