import { ParserToken } from "../parser";
import { UnrealClass, UnrealClassConstant, UnrealClassExpression, UnrealClassFunction, UnrealClassFunctionArgument, UnrealClassFunctionLocal, UnrealClassState, UnrealClassStruct, UnrealClassVariable } from "../parser/ast";
import { resolveArrayCountExpressions } from "../parser/parse/resolveArrayCountExpressions";
import { TokenInformation } from "./ClassDatabase";


export function renderDefinitionMarkdownLines(info: TokenInformation): string[] {
    if (!info.found) {
        return [];
    }
    if (info.token)
    {
        if (info.ast) {
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
                return renderVar(info.ast, info.varDefinition);
            }
            if (info.fnDefinition)
            {
                return renderFnWrapper(info.ast, info, info.fnDefinition);
            }
            if (info.classDefinition) {
                return renderClassDefinition(info.classDefinition);
            }
            if (info.constDefinition) {
                return renderConstDef(info.constDefinition);
            }
            if (info.structDefinition) {
                return renderStructDef(info.structDefinition);
            }
        }
    }
    return [ '???' ];
}

function renderFunctionParameter(def: UnrealClassFunctionArgument): string[] {
    const result = ['(parameter) '];
    renderFunctionParameterIntoResult(def, result);
    return [`\t${result.join('')}`];
}

function renderFunctionParameterIntoResult(def: UnrealClassFunctionArgument, result: string[]) {
    if (def.isSkip) result.push('skip ');
    if (def.isOut) result.push('out ');
    if (def.isOptional) result.push('optional ');
    if (def.isCoerce) result.push('coerce ');
    if (def.type) result.push(def.type.text, ' ');
    if (def.name) result.push(def.name.text);
}

function renderLocalVar(def: UnrealClassFunctionLocal): string[] {
    const result = ['local'];
    if (def.type) result.push(def.type.text);
    if (def.name) result.push(def.name.text);
    return [`\t${result.join(' ')}`];
}

function renderVar(ast: UnrealClass, def: UnrealClassVariable): string[] {         
    const result = ['var '];
    if (def.isConfig) result.push('config ');
    if (def.type) result.push(def.type.text, ' ');
    if (ast?.name) result.push(ast.name.text, '.');
    if (def.name) result.push(def.name.text);
    return [`\t${result.join('')}`];
}

function renderFnWrapper(ast: UnrealClass, info: TokenInformation|undefined, fn: UnrealClassFunction): string[] {
    let result: string[] = [];
    for (let n = info; n != null; n = n.overload){
        result = [...result, ...renderFn(n.ast ?? ast, n.stateScope, n.fnDefinition ?? fn)];
    }
    return result;
}

function renderFn(ast: UnrealClass, state: UnrealClassState | undefined, def: UnrealClassFunction): string[] {    
    const result: string[] = [];
    if (def.isNative) {
        if (def.nativeIndex >= 0) {
            result.push('native(', def.nativeIndex.toString(), ') ');
        }
        else {
            result.push('native ');
        }
    }
    if (def.isStatic) result.push('static ');
    if (def.isFinal) result.push('final ');
    if (def.isLatent) result.push('latent ');
    if (def.isOperator) {
        if (def.isPreOperator) {
            result.push('preoperator');
        }
        else if (def.isPostOperator) {
            result.push('postoperator');
        }
        else
        {
            result.push('operator');
        }
        if (def.operatorPrecedence !== -1) {
            result.push('(', def.operatorPrecedence.toString(), ') ');
        }
        else {
            result.push(' ');
        }
    }
    else {
        result.push(def.isEvent ? 'event ': 'function ');
    }
    if (def.returnType) result.push(def.returnType.text, ' ');
    if (ast.name) result.push(ast.name.text, '.');
    if (state?.name) result.push(state.name.text, '.');
    if (def.name) result.push(def.name.text);
    if (def.fnArgs.length > 0) {
        let separator = ('(');
        for (const a of def.fnArgs) {
            result.push(separator);
            renderFunctionParameterIntoResult(a, result);
            separator = ', ';
        }
        
        result.push(')');
    }
    else {
        result.push('()');
    }
    return [`\t${result.join('')};`];
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

function renderStructDef(structDefinition: UnrealClassStruct): string[] {
    const result = [
        `\tstruct ${structDefinition.name?.text ?? '???'}`,
    ];
    if (structDefinition.parentName) {
        result[0] += ` extends ${structDefinition.parentName?.text}`;
    }

    return result;
}

