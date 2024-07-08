import { ParserToken } from "../parser";
import { UnrealClass, UnrealClassConstant, UnrealClassExpression, UnrealClassFunction, UnrealClassFunctionArgument, UnrealClassFunctionLocal, UnrealClassVariable } from "../parser/ast";
import { resolveArrayCountExpressions } from "../parser/parse/resolveArrayCountExpressions";
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
        if (info.classDefinition) {
            return renderClassDefinition(info.classDefinition);
        }
        if (info.constDefinition) {
            return renderConstDef(info.constDefinition);
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

function renderClassDefinition(classDefinition: UnrealClass): string[] {
    const result = ['class'];
    if (classDefinition.name) result.push(' ', classDefinition.name.text);
    if (classDefinition.parentName) result.push(' extends ', classDefinition.parentName.text);
    return [`\t${result.join('')}`];
}

function renderConstDef(constDefinition: UnrealClassConstant): string[] {
    const expr = renderExpression(constDefinition.valueExpression ?? constDefinition.value);
    return [
        `\tconst ${constDefinition.name?.text} = ${expr}`
    ];
}

function renderExpression(expr: ParserToken | UnrealClassExpression | null) {
    if (!expr) {
        return '???';
    }
    if ('text' in expr) {
        return expr.text;
    }
    const result = [];
    if (expr.op?.text) {
        result.push(expr.op.text);
    }
    for (const item of expr.args) {
        if ('text' in item) {
            result.push(item.text);
        }
    }
    return result.join('');
}

