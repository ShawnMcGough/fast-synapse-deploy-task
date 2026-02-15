import tl = require("azure-pipelines-task-lib/task");
import path = require("path");
import { IExecSyncResult } from 'azure-pipelines-task-lib/toolrunner';
import fs = require("fs");

export class Utility {

    public static async getSynapseDeployTool(): Promise<any> {
        let templatePath: string = tl.getPathInput("TemplateFile", true, true);
        let parameterPath: string = tl.getPathInput("ParametersFile", true, true);
        let subscriptionId: string = tl.getVariable("subscriptionId");
        let resourceGroup: string = tl.getInput("resourceGroup", true);
        let workspace: string = tl.getInput("Workspace", true);
        let deleteArtifacts: boolean = tl.getBoolInput("DeleteArtifactsNotInTemplate", true);
        let overrideParameters: string = tl.getInput("OverrideArmParameters", false) ?? '';
        let hashCheck: boolean = tl.getBoolInput("hashCheck", false);
        let selective: boolean = tl.getBoolInput("selective", false);
        let dryRun: boolean = tl.getBoolInput("dryRun", false);
        
        // Determine the executable name based on the platform
        let isWindows: boolean = tl.getVariable('Agent.OS') === 'Windows_NT';
        let executableName: string = isWindows ? 'SynapseDeploy.exe' : 'SynapseDeploy';
        let executablePath: string = path.join(__dirname, executableName);
        
        // On Linux/Mac, ensure the binary has execute permissions
        if (!isWindows && fs.existsSync(executablePath)) {
            try {
                fs.chmodSync(executablePath, '755');
                console.log(`Set execute permissions on ${executablePath}`);
            } catch (err) {
                console.warn(`Could not set execute permissions: ${err}`);
            }
        }
        
        console.log(`Executing: ${executablePath}`);
        console.log(`Template: ${templatePath}`);
        console.log(`Parameters: ${parameterPath}`);
        console.log(`Subscription: ${subscriptionId}`);
        console.log(`Resource Group: ${resourceGroup}`);
        console.log(`Workspace: ${workspace}`);
        console.log(`Delete Artifacts: ${deleteArtifacts}`);
        console.log(`Override Parameters: ${overrideParameters}`);
        console.log(`Hash Check: ${hashCheck}`);
        console.log(`Selective: ${selective}`);
        console.log(`Dry Run: ${dryRun}`);

        // Create the ToolRunner with properly escaped arguments
        let tool = tl.tool(executablePath);
        if (hashCheck) {
            tool.arg('--hash-check');
        }
        if (selective) {
            tool.arg('--selective');
        }
        if (dryRun) {
            tool.arg('--dry-run');
        }        
        tool.arg(templatePath);
        tool.arg(parameterPath);
        tool.arg(subscriptionId);
        tool.arg(resourceGroup);
        tool.arg(workspace);
        tool.arg(deleteArtifacts.toString());
        tool.arg(overrideParameters); // ToolRunner automatically escapes special characters including quotes

        
        return tool;
    }

    public static checkIfAzurePythonSdkIsInstalled() {
        return !!tl.which("az", false);
    }

    public static throwIfError(resultOfToolExecution: IExecSyncResult, errormsg?: string): void {
        if (resultOfToolExecution.code != 0) {
            tl.error("Error Code: [" + resultOfToolExecution.code + "]");
            if (errormsg) {
                tl.error("Error: " + errormsg);
            }
            throw resultOfToolExecution;
        }
    }

    public static async createFile(filePath: string, data: string, options?: any): Promise<void> {
        try {
            console.log('created file at path: ' + filePath);
            fs.writeFileSync(filePath, data, options);
        }
        catch (err) {
            Utility.deleteFile(filePath);
            throw err;
        }
    }

    public static checkIfFileExists(filePath: string, fileExtensions: string[]): boolean {
        let matchingFiles: string[] = fileExtensions.filter((fileExtension: string) => {
            if (tl.stats(filePath).isFile() && filePath.toUpperCase().match(new RegExp(`\.${fileExtension.toUpperCase()}$`))) {
                return true;
            }
        });
        if (matchingFiles.length > 0) {
            return true;
        }
        return false;
    }

    public static async deleteFile(filePath: string): Promise<void> {
        if (fs.existsSync(filePath)) {
            try {
                //delete the publishsetting file created earlier
                fs.unlinkSync(filePath);
            }
            catch (err) {
                //error while deleting should not result in task failure
                console.error(err.toString());
            }
        }
    }
}
