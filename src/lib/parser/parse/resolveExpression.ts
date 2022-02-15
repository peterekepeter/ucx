import { ParserToken as Token, SemanticClass } from "..";
import { UnrealClassExpression, UnrealClassStatement } from "../ast/UnrealClassFunction";

export function resolveStatementExpression(
    tokens: Token[]
): UnrealClassStatement
{
    const expression = resolveExpression(tokens);
    if ("text" in expression){
        return {
            op: expression,
            args: [],
            body:[],
            bodyFirstToken: null,
            bodyLastToken: null,
            argsFirstToken: tokens[0],
            argsLastToken: tokens[tokens.length-1]
        };
    } else {
        return {
            ...expression, 
            body: [],
            bodyFirstToken: null,
            bodyLastToken: null,
            argsFirstToken: tokens[0],
            argsLastToken: tokens[tokens.length-1]
        };
    }
}


export function resolveExpression(
    tokens: Token[]
): UnrealClassExpression | Token
{
    return resolveSubExpression(tokens, 0, tokens.length);
}

function resolveSubExpression(
    tokens: Token[], begin: number, end: number
): UnrealClassExpression | Token 
{
    // TODO: implementation not complete
    const tokenCount = end - begin;
    if (tokenCount === 1){
        return tokens[0];
    }
    if (tokenCount >= 3 &&
        tokens[begin].type === SemanticClass.Identifier &&
        tokens[begin + 1].text === '(' && 
        tokens[end - 1].text === ')')
    {
        // function call
        tokens[begin].type = SemanticClass.FunctionReference;
        return {
            op: tokens[begin],
            args: resolveCallArgs(tokens, begin + 2, end - 1),
            argsFirstToken: tokens[begin + 1],
            argsLastToken: tokens[end - 1]
        };
    }
    for (let i=begin; i<end; i++){
        if (tokens[i].type === SemanticClass.Identifier){
            tokens[i].type = SemanticClass.VariableReference;
        }
    }
    if (tokenCount === 3 && tokens[begin+1].type === SemanticClass.Operator){
        return {
            args: [tokens[begin], tokens[begin+2]],
            op: tokens[begin+1],
            argsFirstToken: tokens[begin],
            argsLastToken: tokens[begin + 2]
        };
    }
    if (tokenCount === 2){
        if (tokens[begin].type === SemanticClass.Operator){
            return {
                args: [tokens[begin + 1]],
                op: tokens[begin],
                argsFirstToken: tokens[begin + 1],
                argsLastToken: tokens[begin + 1]
            };
        } else if (tokens[begin + 1].type === SemanticClass.Operator) {
            return {
                args: [tokens[begin]],
                op: tokens[begin + 1],
                argsFirstToken: tokens[begin],
                argsLastToken: tokens[begin]
            };
        }
    }
    return {
        args: tokens.slice(begin+1, end),
        op:tokens[begin],
        argsFirstToken: tokens[begin],
        argsLastToken: tokens[end - 1],
    };
}

function resolveCallArgs(
    tokens: Token[], begin: number, end: number
): (Token | UnrealClassExpression)[] {
    return tokens.slice(begin, end);
}
