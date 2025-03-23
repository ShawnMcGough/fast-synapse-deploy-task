# load and decrement the patch version of the extension
$manifest = Get-Content vss-extension.json -raw | ConvertFrom-Json
$patch = $manifest.version.Split(".")
$patch[2] = [int]$patch[2] - 1
$manifest.version = $patch -join "."

$manifest | ConvertTo-Json -depth 10 | Set-Content vss-extension.json

# decrement the patch version of the task
$task = Get-Content .\FastSynapseDeploy\FastSynapseDeployV1\task.json -raw | ConvertFrom-Json
$task.version.Patch = [int]$task.version.Patch - 1
$task | ConvertTo-Json -depth 10 | Set-Content .\FastSynapseDeploy\FastSynapseDeployV1\task.json
