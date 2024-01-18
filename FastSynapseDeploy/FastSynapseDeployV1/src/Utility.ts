import tl = require("azure-pipelines-task-lib/task");
import os = require("os");
import path = require("path");
import { IExecSyncResult } from 'azure-pipelines-task-lib/toolrunner';
import fs = require("fs");

export class Utility {

    public static async getScriptPath(scriptLocation: string, fileExtension: string): Promise<string> {

        let tempDirectory = tl.getVariable('Agent.TempDirectory') || os.tmpdir();
        let templatePath: string = tl.getPathInput("TemplateFile", true, true);
        let parameterPath: string = tl.getPathInput("ParametersFile", true, true);
        let subscriptionId: string = tl.getVariable("subscriptionId");
        let resourceGroup: string = tl.getInput("resourceGroup", true);
        let workspace: string = tl.getInput("Workspace", true);
        let deleteArtifacts: boolean = tl.getBoolInput("DeleteArtifactsNotInTemplate", true);
        let overrideParameters: string = tl.getInput("OverrideArmParameters", false) ?? '';
        
        let inlineScript: string = `cd ${__dirname}\n`;
        if (fileExtension === 'bat') {
            inlineScript += 'SynapseDeploy.exe'
        } else {
            inlineScript += 'chmod +x SynapseDeploy\n'
            inlineScript += 'ls -la\n'
            inlineScript += './SynapseDeploy '
        }

        inlineScript += ` "${templatePath}" "${parameterPath}" ${subscriptionId} ${resourceGroup} ${workspace} ${deleteArtifacts} "${overrideParameters}"`
        console.log(inlineScript)
        let scriptPath: string = path.join(tempDirectory, `azureclitaskscript${new Date().getTime()}.${fileExtension}`);
        await Utility.createFile(scriptPath, inlineScript);
        return scriptPath;
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
