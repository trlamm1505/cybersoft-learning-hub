# Run from the repo root:
#   .\Test\Day29_Security_Privacy_Final_Pass_Tran_Quoc_Nguyen\scripts\Day29_secret_scan.ps1
# Prints only file names and line numbers, never the suspicious values.
$ErrorActionPreference = 'Continue'
$pat = New-TemporaryFile
@'
AKIA[0-9A-Z]{16}
AIza[0-9A-Za-z_-]{35}
sk-[A-Za-z0-9]{20,}
ghp_[A-Za-z0-9]{36}
eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.
(password|passwd|secret|api[_-]?key|token|tokencybersoft)[ ]*[:=][ ]*["'][^"']{8,}
'@ | Set-Content -Path $pat -Encoding ascii

Write-Host "== 1. Tracked .env files (expect: nothing below)"
git ls-files | Select-String -Pattern '(^|/)\.env' | Where-Object { $_ -notmatch '\.example|\.sample' }

Write-Host "== 2. Possible secrets in tracked files (file:line only; open and review each)"
$hits = git grep -n -I -i -E -f $pat -- . ':!package-lock.json' ':!*.lock' 2>&1
if ($LASTEXITCODE -gt 1) { Write-Host "git grep ERROR:"; $hits } else {
  $hits | ForEach-Object { ($_ -split ':')[0..1] -join ':' } | Sort-Object -Unique
  Write-Host ("   matches: " + @($hits).Count)
}

Write-Host "== 3. Git history: commits touching .env files (hash + file)"
git log --all --name-only --pretty=format:'%h' -- '*.env' '.env*' | Select-String -Pattern '\S'

Write-Host "== 4. gitleaks (if installed)"
if (Get-Command gitleaks -ErrorAction SilentlyContinue) { gitleaks detect --redact --no-banner } else { Write-Host "   gitleaks not installed - skipped" }
Remove-Item $pat -ErrorAction SilentlyContinue
Write-Host "Done. Paste the output (no secret values) back to Claude."
