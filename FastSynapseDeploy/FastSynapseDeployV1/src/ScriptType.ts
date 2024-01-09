import { Utility } from './Utility';
import tl = require("azure-pipelines-task-lib/task");

export class ScriptTypeFactory {
    public static getSriptType(): ScriptType {

        let scriptType: string = tl.getVariable('Agent.OS') === 'Windows_NT' ? 'batch' : 'bash';
        let scriptLocation: string = 'inlinescript';

        let scriptArguments: string = tl.getInput("scriptArguments", false);
        switch(scriptType){
            case 'bash':
                return new Bash(scriptLocation, scriptArguments);
            case 'batch':
            default:
                return new Batch(scriptLocation, scriptArguments);
        }
    }
}

export abstract class ScriptType {

    protected _scriptLocation: string;
    protected _scriptArguments: string;
    protected _scriptPath: string;

    constructor(scriptLocation: string, scriptArguments: string) {
        this._scriptLocation = scriptLocation;
        this._scriptArguments = scriptArguments;
    }

    public abstract getTool(): Promise<any>;

    public async cleanUp(): Promise<void> {
        if(this._scriptLocation.toLowerCase() === 'inlinescript') {
            await Utility.deleteFile(this._scriptPath);
        }
    }
}

export class Bash extends ScriptType {

    public async getTool(): Promise<any> {
        this._scriptPath = await Utility.getScriptPath(this._scriptLocation, 'sh');
        let tool: any = tl.tool(tl.which("bash", true));
        tool.arg(this._scriptPath);
        tool.line(this._scriptArguments); // additional scriptArguments should always call line. line() parses quoted arg strings
        return tool;
    }
}

export class Batch extends ScriptType {

    public async getTool(): Promise<any> {
        this._scriptPath = await Utility.getScriptPath(this._scriptLocation, 'bat');
        let tool: any = tl.tool(tl.which(this._scriptPath, true));
        tool.line(this._scriptArguments); // additional scriptArguments should always call line. line() parses quoted arg strings
        return tool;
    }
}