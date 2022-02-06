import { ParserToken, SemanticClass } from "..";
import { UnrealClassExpression } from "../ast/UnrealClassFunction";



export function resolveExpression(tokens: ParserToken[]): UnrealClassExpression
{
    return resolveSubExpression(tokens, 0, tokens.length);
}

function resolveSubExpression(tokens: ParserToken[], begin: number, end: number): UnrealClassExpression {
    const tokenCount = end - begin;
    if (tokenCount > 3 &&
        tokens[begin].classification === SemanticClass.Identifier &&
        tokens[begin + 1].text === '(' && 
        tokens[end - 1].text === ')')
    {
        // function call
        tokens[begin].classification = SemanticClass.FunctionReference;
        return {
            op: tokens[begin],
            args: resolveCallArgs(tokens, begin + 2, end - 1)
        };
    }
    for (let i=begin; i<end; i++){
        if (tokens[i].classification === SemanticClass.Identifier){
            tokens[i].classification = SemanticClass.VariableReference;
        }
    }
    return {
        args: tokens.slice(begin+1, end),
        op:tokens[begin]
    };
}

function resolveCallArgs(tokens: ParserToken[], begin: number, end: number): (ParserToken | UnrealClassExpression)[] {
    return tokens.slice(begin, end);
}
