import { Utility } from './Utility';
import tl = require("azure-pipelines-task-lib/task");

export class ScriptTypeFactory {
    public static getSriptType(): ScriptType {
        // Return a unified ScriptType that works cross-platform
        return new SynapseDeploy();
    }
}

export abstract class ScriptType {

    public abstract getTool(): Promise<any>;

    public async cleanUp(): Promise<void> {
        // No cleanup needed when using direct tool execution
    }
}

export class SynapseDeploy extends ScriptType {

    public async getTool(): Promise<any> {
        // Use the cross-platform ToolRunner approach
        return await Utility.getSynapseDeployTool();
    }
}