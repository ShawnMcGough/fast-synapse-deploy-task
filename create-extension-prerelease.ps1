
$manifest = Get-Content vss-extension.json -raw | ConvertFrom-Json
$task = Get-Content .\FastSynapseDeploy\FastSynapseDeployV1\task.json -raw | ConvertFrom-Json

$origingalTask = $task | ConvertTo-Json -depth 10

# create the public prerelease version of the extension
$manifest.id = "fast-synapse-deploy-prerelease"
$manifest.name = "Fast Synapse Deploy (Prerelease)"
$manifest | ConvertTo-Json -depth 10 | Set-Content vss-extension-prerelease.json

# create the prerelease version of the task
$task.id  = "edb8535e-7596-4364-8fe5-5bfa917a093b"
$task.friendlyName = "Fast Synapse Deploy (Prerelease)"
$task | ConvertTo-Json -depth 10 | Set-Content .\FastSynapseDeploy\FastSynapseDeployV1\task.json

# update the README.md to indicate that this is a prerelease version
$readme = Get-Content README.md

$originalReadme = $readme | Out-String

# on line 2, add text to indicate that this is a prerelease version
$readme = $readme.Insert(2, "
> [!CAUTION]
> Prerelease version, not intended for production.")
$readme = $readme -replace "Fast Synapse Deploy", "Fast Synapse Deploy (Prerelease)"

$readme | Set-Content README.md

tfx extension create --manifest-globs vss-extension-prerelease.json

# restore the original task
$origingalTask | Set-Content .\FastSynapseDeploy\FastSynapseDeployV1\task.json

# restore the original readme
$originalReadme | Set-Content README.md