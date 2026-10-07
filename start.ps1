param([ValidateSet('dev','preview')][string]$Mode = 'dev')
$blogNodeCommand = Get-Command node -ErrorAction SilentlyContinue
$blogNodePath = if ($blogNodeCommand) { $blogNodeCommand.Source } else { $null }
$blogBundledNode = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
if (-not $blogNodePath -or (& $blogNodePath --version) -notmatch '^v24\.') {
    if ((Test-Path -LiteralPath $blogBundledNode) -and (& $blogBundledNode --version) -match '^v24\.') {
        $blogNodePath = $blogBundledNode
    } else {
        throw 'This project needs Node.js 24 LTS. Install or switch to Node.js 24, then run npm ci.'
    }
}
if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'node_modules/astro/bin/astro.mjs'))) {
    throw 'Dependencies are missing. Run npm ci with Node.js 24 first.'
}
$blogPreviousPath = $env:Path
try {
    $env:Path = (Split-Path $blogNodePath) + ';' + $env:Path
    $env:ASTRO_TELEMETRY_DISABLED = '1'
    Push-Location $PSScriptRoot
    & $blogNodePath (Join-Path $PSScriptRoot 'node_modules/astro/bin/astro.mjs') $Mode --host 127.0.0.1
} finally {
    Pop-Location
    $env:Path = $blogPreviousPath
}
