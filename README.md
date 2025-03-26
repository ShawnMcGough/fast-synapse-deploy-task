# Fast Synapse Deploy

## Overview
This task will deploy Azure Synapse artifacts using the publish branch.

### Major Features
 - Optimized for speed using connection pooling and multiple async requests to the Synapse API.
 - Leverages Azure CLI for authentication.
 - Supports HTTP_PROXY, HTTPS_PROXY, and NO_PROXY environment variables.
 - Can be combined with `validate` from [Microsoft task](https://marketplace.visualstudio.com/items?itemName=AzureSynapseWorkspace.synapsecicd-deploy) (see note below).

## Pre-requisites for the task
Requires [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/overview) installed on the agents.

## Not Supported 
 - Deploying ManagedPrivateEndpoints.
 - Deploying *directly* from branch other than `publish`. 
   - However, can be combined with `validate` task (see note below) to achieve same result. 
 - Incremental deployment. Hopefully not needed given the speed optimizations!

## Should I use this task?
 - If the [official Microsoft task](https://marketplace.visualstudio.com/items?itemName=AzureSynapseWorkspace.synapsecicd-deploy) doesn't meet your needs, give it a try. This task allows for more async requests, resulting in a faster deployment. 

## Combine with the Microsoft 'Validate' Task
This task can work in tandem with the Microsoft [validate](https://learn.microsoft.com/en-us/azure/synapse-analytics/cicd/continuous-integration-delivery#configure-the-deployment-task) task, which is required to address a [known issue](https://learn.microsoft.com/en-us/azure/synapse-analytics/cicd/continuous-integration-delivery#1-publish-failed-workspace-arm-file-is-more-than-20-mb) with file size limit during publish. High level, you would first use `validate` to generate the required templates, then use this task to quickly deploy from those templates. Note that a YAML pipeline is required for the Microsoft `validate` to work (classic will not work). The YAML pipeline might look like this:

```yaml
resources:
  repositories:
  - repository: <alias>
    type: git
    name: <repo-name>
    ref: <branch>
steps:
  - checkout: <alias>
  - task: Synapse workspace deployment@2
    continueOnError: true    
    inputs:
      operation: 'validate'
      ArtifactsFolder: '$(System.DefaultWorkingDirectory)'
      TargetWorkspaceName: '<your-workspace-name>'
  - task: FastSynapseDeploy@1
    displayName: 'Fast Deploy Synapse'
    inputs:
      azureSubscription: <your-subscription>
      ResourceGroup: <your-resource-group>
      Workspace: <your-workspace-name>
      TemplateFile: ExportedArtifacts/TemplateForWorkspace.json
      ParametersFile: ExportedArtifacts/TemplateParametersForWorkspace.json
```




## SYNAPSE_API_LIMIT
This task seeks to deploy artifacts as quickly as possible. To that end, it will make multiple concurrent requests to the Synapse API. Depending on usage patterns (multiple and/or frequent deployments, for example), the Synapse API might respond with `TooManyRequests [429]`. The `SYNAPSE_API_LIMIT` environment variable is used to limit the number of concurrent requests to try and mitigate this issue.  Unfortunately, the Synapse API does not implement a `retry-after` header, so the entire deploy must be terminated.

## Review Me
Please consider [leaving a review](https://marketplace.visualstudio.com/items?itemName=shawn-mcgough.fast-synapse-deploy&ssr=false#review-details). I love to hear how it is helping with deployments!
At the end of the log there is duration information:
```
Completed deploy in 00:01:16.2082239.
Completed delete in 00:00:32.3423195.
```

## Release Notes

 - 1.0.12
   - README update to include `validate` description

 - 1.0.11
   - Replace parameters fix

 - 1.0.10
   - Improved JSON parsing & retry logic
   - Dependency updates including fix for breaking change in ChainedTokenCredential
   - Reduced SYNAPSE_API_LIMIT default from unlimited to 150

 - 1.0.9
   - Initial public release








