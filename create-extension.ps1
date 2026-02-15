cd FastSynapseDeploy\FastSynapseDeployV1\
npm update
tsc
cd ..\..\
cd FastSynapseDeploy\FastSynapseDeployV2\
npm update
tsc
cd ..\..\
cd FastSynapseDeploy\FastSynapseDeployV3\
npm update
tsc
cd ..\..\

# load and increment the patch version of the extension
$manifest = Get-Content vss-extension.json -raw | ConvertFrom-Json
$patch = $manifest.version.Split(".")
$patch[2] = [int]$patch[2] + 1
$manifest.version = $patch -join "."

Write-Host "Extension version: $($manifest.version)"

$manifest | ConvertTo-Json -depth 10 | Set-Content vss-extension.json

# load and increment the patch version of the task
$task = Get-Content .\FastSynapseDeploy\FastSynapseDeployV3\task.json -raw | ConvertFrom-Json
$task.version.Patch = [int]$task.version.Patch + 1
Write-Host "FastSynapseDeployV3 Task version: $($task.version.Major).$($task.version.Minor).$($task.version.Patch)"
$task | ConvertTo-Json -depth 10 | Set-Content .\FastSynapseDeploy\FastSynapseDeployV3\task.json

$originalTask3 = $task | ConvertTo-Json -depth 10

tfx extension create --manifest-globs vss-extension.json

# create the development version of the extension
$manifest.id = "fast-synapse-deploy-dev"
$manifest.name = "[DEV] Fast Synapse Deploy"
$manifest.public = $false
$manifest | ConvertTo-Json -depth 10 | Set-Content vss-extension-dev.json

# create the development version of the tasks
$task1 = Get-Content .\FastSynapseDeploy\FastSynapseDeployV1\task.json -raw | ConvertFrom-Json
$originalTask1 = $task1 | ConvertTo-Json -depth 10
$task1.id  = "fffaecb6-f328-4155-be1e-6c16ca261076"
$task1.friendlyName = "[DEV] Fast Synapse Deploy"
$task1 | ConvertTo-Json -depth 10 | Set-Content .\FastSynapseDeploy\FastSynapseDeployV1\task.json

$task2 = Get-Content .\FastSynapseDeploy\FastSynapseDeployV2\task.json -raw | ConvertFrom-Json
$originalTask2 = $task2 | ConvertTo-Json -depth 10
$task2.id  = $task1.id
$task2.friendlyName = "[DEV] Fast Synapse Deploy"
$task2.version.Minor = 2
Write-Host "[DEV] FastSynapseDeployV2 Task version: $($task2.version.Major).$($task2.version.Minor).$($task2.version.Patch)"
$task2 | ConvertTo-Json -depth 10 | Set-Content .\FastSynapseDeploy\FastSynapseDeployV2\task.json

$task3 = Get-Content .\FastSynapseDeploy\FastSynapseDeployV3\task.json -raw | ConvertFrom-Json
$originalTask3 = $task3 | ConvertTo-Json -depth 10
$task3.id  = $task1.id
$task3.friendlyName = "[DEV] Fast Synapse Deploy"
Write-Host "[DEV] FastSynapseDeployV3 Task version: $($task3.version.Major).$($task3.version.Minor).$($task3.version.Patch)"
$task3 | ConvertTo-Json -depth 10 | Set-Content .\FastSynapseDeploy\FastSynapseDeployV3\task.json

tfx extension create --manifest-globs vss-extension-dev.json

# restore the original task with the incremented version
$originalTask1 | Set-Content .\FastSynapseDeploy\FastSynapseDeployV1\task.json
$originalTask2 | Set-Content .\FastSynapseDeploy\FastSynapseDeployV2\task.json
$originalTask3 | Set-Content .\FastSynapseDeploy\FastSynapseDeployV3\task.json
