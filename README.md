# Fast Synapse Deploy

## Overview
This task will deploy Azure Synapse artifacts using the publish branch.

### Major Features
 - Optimized for speed using connection pooling and multiple async requests to the Synapse API.
 - Leverages Azure CLI for authentication.
 - Supports HTTP_PROXY, HTTPS_PROXY, and NO_PROXY environment variables.

## Pre-requisites for the task
Requires [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/overview) installed on the agents.

## Not Supported 
 - Deploying from branch other than publish (requires arm template file & parameters file)
 - Deploying ManagedPrivateEndpoints (use the official Microsoft task)
 - Incremental deployment (probably not needed given the speed optimizations)

## Should I use this task?
 - If the [official Microsoft task](https://marketplace.visualstudio.com/items?itemName=AzureSynapseWorkspace.synapsecicd-deploy) doesn't meet your needs, give it a try. This task allows for more async requests, resulting in a faster deployment. 


## Release Notes
 - 1.0.9
   - Initial public release