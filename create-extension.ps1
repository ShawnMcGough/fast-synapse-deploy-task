$manifest = Get-Content vss-extension.json -raw | ConvertFrom-Json
$patch = $manifest.version.Split(".")
$patch[2] = [int]$patch[2] + 1
$manifest.version = $patch -join "."

$manifest | ConvertTo-Json -depth 10 | Set-Content vss-extension.json

tfx extension create --manifest-globs vss-extension.json