param([int]$Port=8766,[string]$Python='')
$factoryRoot=Split-Path -Parent $PSScriptRoot
if (-not $Python) {
    $factoryBundled=Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'
    if (Test-Path -LiteralPath $factoryBundled) { $Python=$factoryBundled } else { $Python='python' }
}
& $Python -m http.server $Port --bind 127.0.0.1 --directory $factoryRoot
