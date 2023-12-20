import { UnrealClassFunction, UnrealClassFunctionArgument, UnrealClassFunctionLocal, UnrealClassVariable } from "../parser/ast";
import { TokenInformation } from "./ClassDatabase";


export function renderDefinitionMarkdownLines(info: TokenInformation): string[] {
    if (!info.found) {
        return [];
    }
    if (info.token)
    {
        if (info.functionScope) {
            if (info.paramDefinition) 
            {
                return renderFunctionParameter(info.paramDefinition);
            }
            if (info.localDefinition)
            {
                return renderLocalVar(info.localDefinition);
            }
        }
        if (info.varDefinition) 
        {
            return renderVar(info.varDefinition);
        }
        if (info.fnDefinition)
        {
            return renderFn(info.fnDefinition);
        }
    }
    return [ '???' ];
}

function renderFunctionParameter(def: UnrealClassFunctionArgument): string[] {
    const result = ['(parameter)'];
    if (def.type) result.push(def.type.text);
    if (def.name) result.push(def.name.text);
    return [`\t${result.join(' ')}`];
}

function renderLocalVar(def: UnrealClassFunctionLocal): string[] {
    const result = ['local'];
    if (def.type) result.push(def.type.text);
    if (def.name) result.push(def.name.text);
    return [`\t${result.join(' ')}`];
}

function renderVar(def: UnrealClassVariable): string[] {         
    const result = ['var'];
    if (def.isConfig) result.push('config');
    if (def.type) result.push(def.type.text);
    if (def.name) result.push(def.name.text);
    return [`\t${result.join(' ')}`];
}

function renderFn(fnDefinition: UnrealClassFunction): string[] {      
    const result = ['function '];
    if (fnDefinition.name) result.push(fnDefinition.name.text);
    if (fnDefinition.fnArgs.length > 0) {
        result.push('(');
        result.push(fnDefinition.fnArgs.map(a => `${a.type?.text} ${a.name?.text}`).join(', '));
        result.push(')');
    }
    else {
        result.push('()');
    }
    return [`\t${result.join('')}`];
}

