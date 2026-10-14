param([string]$Python = '')
$ErrorActionPreference = 'Stop'
$factoryRoot = Split-Path -Parent $PSScriptRoot
if (-not $Python) {
    $bundledPython = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'
    if (Test-Path -LiteralPath $bundledPython) { $Python = $bundledPython } else { $Python = 'python' }
}
Push-Location -LiteralPath $factoryRoot
try {
    & $Python 11_tools/factory.py build
    if ($LASTEXITCODE) { throw 'Production failed' }
    & $Python 11_tools/qa.py
    if ($LASTEXITCODE) { throw 'Initial QA failed' }
    & $Python 11_tools/review.py
    if ($LASTEXITCODE) { throw 'Visual approval hashes differ; inspect changed assets' }
    & $Python 11_tools/previews.py
    if ($LASTEXITCODE) { throw 'Previews failed' }
    & $Python 11_tools/qa.py
    if ($LASTEXITCODE) { throw 'Final QA failed' }
    & $Python 11_tools/viewer.py
    & $Python 11_tools/report.py
    & $Python 11_tools/release.py
    if ($LASTEXITCODE) { throw 'Release failed' }
    & $Python 11_tools/report.py
} finally { Pop-Location }
