# Fast Synapse Deploy

## Overview
This task will deploy Azure Synapse artifacts using the publish branch.

### Major Features
 - Optimized for speed using connection pooling and multiple async requests to the Synapse API
   - The [official Microsoft task](https://marketplace.visualstudio.com/items?itemName=AzureSynapseWorkspace.synapsecicd-deploy) is conservative. This task allows for more async requests, resulting in a faster deployment. 
 - Leverages Azure CLI for authentication


## Pre-requisites for the task
Requires [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/overview) installed on the agents.

## Not Supported 
 - Deploying from branch other than publish
 - Deploying ManagedPrivateEndpoints (use the official Microsoft task)
 - Incremental deployment (probably not needed given the speed)

## Release Notes
 - 1.0.3
   - Initial release