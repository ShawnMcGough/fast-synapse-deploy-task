import path = require("path");
import tl = require("azure-pipelines-task-lib/task");
import fs = require("fs");
import { Utility } from "./src/Utility";
import { getSystemAccessToken } from 'azure-pipelines-tasks-artifacts-common/webapi';
import { getHandlerFromToken, WebApi } from "azure-devops-node-api";
import { ITaskApi } from "azure-devops-node-api/TaskApi";

const FAIL_ON_STDERR: string = "FAIL_ON_STDERR";

export class azureclitask {

    public static async runMain(): Promise<void> {
        var toolExecutionError = null;
        var exitCode: number = 0;
        try{

            Utility.throwIfError(tl.execSync("az", "--version"));

            var failOnStdErr: boolean = true;

            this.setConfigDirectory();
            this.setAzureCloudBasedOnServiceEndpoint();
            var connectedService: string = tl.getInput("connectedServiceNameARM", true);

            // login
            await this.loginAzureRM(connectedService);

            var tool: any = await Utility.getSynapseDeployTool();

            let errLinesCount: number = 0;
            let aggregatedErrorLines: string[] = [];
            tool.on('errline', (errorLine: string) => {
                if (errLinesCount < 10) {
                    aggregatedErrorLines.push(errorLine);
                }
                errLinesCount++;
            });

            exitCode = await tool.exec({
                failOnStdErr: false,
                ignoreReturnCode: true
                });


            if (failOnStdErr && aggregatedErrorLines.length > 0) {
                let error = FAIL_ON_STDERR;
                tl.error(aggregatedErrorLines.join("\n"));
                throw error;
            }
        }
        catch (err) {
            toolExecutionError = err;
            if (err.stderr) {
                toolExecutionError = err.stderr;
            }
        }
        finally {
            if (this.cliPasswordPath) {
                tl.debug('Removing spn certificate file');
                tl.rmRF(this.cliPasswordPath);
            }

            //set the task result to either succeeded or failed based on error was thrown or not
            if(toolExecutionError === FAIL_ON_STDERR) {
                tl.setResult(tl.TaskResult.Failed, "ScriptFailedStdErr");
            } else if (toolExecutionError) {
                tl.setResult(tl.TaskResult.Failed, "ScriptFailed", toolExecutionError);
            } else if (exitCode != 0){
                tl.setResult(tl.TaskResult.Failed, "ScriptFailedWithExitCode " +  exitCode);
            }
            else {
                tl.setResult(tl.TaskResult.Succeeded, "ScriptReturnCode 0");
            }

            //Logout of Azure if logged in
            if (this.isLoggedIn) {
                this.logoutAzure();
            }
        }
    }

    private static isLoggedIn: boolean = false;
    private static cliPasswordPath: string = null;
    private static servicePrincipalId: string = null;
    private static servicePrincipalKey: string = null;
    private static federatedToken: string = null;
    private static tenantId: string = null;

    private static async loginAzureRM(connectedService: string):Promise<void> {
        var authScheme: string = tl.getEndpointAuthorizationScheme(connectedService, true);
        var subscriptionID: string = tl.getEndpointDataParameter(connectedService, "SubscriptionID", true);

        tl.setVariable("SubscriptionId", subscriptionID);
        if (authScheme.toLowerCase() == "workloadidentityfederation") {
            var servicePrincipalId: string = tl.getEndpointAuthorizationParameter(connectedService, "serviceprincipalid", false);
            var tenantId: string = tl.getEndpointAuthorizationParameter(connectedService, "tenantid", false);

            const federatedToken = await this.getIdToken(connectedService);
            tl.setSecret(federatedToken);
            const args = `login --service-principal -u "${servicePrincipalId}" --tenant "${tenantId}" --allow-no-subscriptions --federated-token "${federatedToken}"`;

            //login using OpenID Connect federation
            Utility.throwIfError(tl.execSync("az", args), "LoginFailed");

             this.servicePrincipalId = servicePrincipalId;
             this.federatedToken = federatedToken;
             this.tenantId = tenantId;
        }
        else if (authScheme.toLowerCase() == "serviceprincipal") {
            let authType: string = tl.getEndpointAuthorizationParameter(connectedService, 'authenticationType', true);
            let cliPassword: string = null;
            var servicePrincipalId: string = tl.getEndpointAuthorizationParameter(connectedService, "serviceprincipalid", false);
            var tenantId: string = tl.getEndpointAuthorizationParameter(connectedService, "tenantid", false);

            this.servicePrincipalId = servicePrincipalId;
            this.tenantId = tenantId;

            if (authType == "spnCertificate") {
                tl.debug('certificate based endpoint');
                let certificateContent: string = tl.getEndpointAuthorizationParameter(connectedService, "servicePrincipalCertificate", false);
                cliPassword = path.join(tl.getVariable('Agent.TempDirectory') || tl.getVariable('system.DefaultWorkingDirectory'), 'spnCert.pem');
                fs.writeFileSync(cliPassword, certificateContent);
                this.cliPasswordPath = cliPassword;
            }
            else {
                tl.debug('key based endpoint');
                cliPassword = tl.getEndpointAuthorizationParameter(connectedService, "serviceprincipalkey", false);
                this.servicePrincipalKey = cliPassword;
            }

            let escapedCliPassword = cliPassword.replace(/"/g, '\\"');
            tl.setSecret(escapedCliPassword.replace(/\\/g, '\"'));
            //login using spn
            Utility.throwIfError(tl.execSync("az", `login --service-principal -u "${servicePrincipalId}" --password="${escapedCliPassword}" --tenant "${tenantId}" --allow-no-subscriptions`), "LoginFailed");
        }
        else if(authScheme.toLowerCase() == "managedserviceidentity") {
            //login using msi
            Utility.throwIfError(tl.execSync("az", "login --identity"), "MSILoginFailed");
        }
        else {
            throw 'AuthSchemeNotSupported ' + authScheme;
        }

        this.isLoggedIn = true;
        if (!!subscriptionID) {
            //set the subscription imported to the current subscription
            Utility.throwIfError(tl.execSync("az", "account set --subscription \"" + subscriptionID + "\""), "ErrorInSettingUpSubscription");
        }
    }

    private static setConfigDirectory(): void {
        if (tl.getBoolInput("useGlobalConfig")) {
            return;
        }

        if (!!tl.getVariable('Agent.TempDirectory')) {
            var azCliConfigPath = path.join(tl.getVariable('Agent.TempDirectory'), ".azclitask");
            console.log('SettingAzureConfigDir ' + azCliConfigPath);
            process.env['AZURE_CONFIG_DIR'] = azCliConfigPath;
        } else {
            console.warn('GlobalCliConfigAgentVersionWarning');
        }
    }

    private static setAzureCloudBasedOnServiceEndpoint(): void {
        var connectedService: string = tl.getInput("connectedServiceNameARM", true);
        var environment = tl.getEndpointDataParameter(connectedService, 'environment', true);
        if (!!environment) {
            console.log('SettingAzureCloud ' + environment);
            Utility.throwIfError(tl.execSync("az", "cloud set -n " + environment));
        }
    }

    private static logoutAzure() {
        try {
            tl.execSync("az", " account clear");
        }
        catch (err) {
            // task should not fail if logout doesn`t occur
            tl.warning("FailedToLogout");
        }
    }

    private static async getIdToken(connectedService: string) : Promise<string> {
        const jobId = tl.getVariable("System.JobId");
        const planId = tl.getVariable("System.PlanId");
        const projectId = tl.getVariable("System.TeamProjectId");
        const hub = tl.getVariable("System.HostType");
        const uri = tl.getVariable("System.CollectionUri");
        const token = getSystemAccessToken();

        const authHandler = getHandlerFromToken(token);
        const connection = new WebApi(uri, authHandler);
        const api: ITaskApi = await connection.getTaskApi();
        const response = await api.createOidcToken({}, projectId, hub, planId, jobId, connectedService);
        if (response == null) {
            return null;
        }

        return response.oidcToken;
    }
}

tl.setResourcePath(path.join(__dirname, "task.json"));

if (!Utility.checkIfAzurePythonSdkIsInstalled()) {
    tl.setResult(tl.TaskResult.Failed, "AzureSDKNotFound");
}

azureclitask.runMain();
