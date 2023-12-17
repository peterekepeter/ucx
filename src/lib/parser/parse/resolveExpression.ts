import { ParserToken as Token, SemanticClass } from "..";
import { UnrealClassExpression, UnrealClassStatement } from "../ast/UnrealClassFunction";

export function resolveStatementExpression(
    tokens: Token[]
): UnrealClassStatement
{
    if (tokens.length === 2){
        if (tokens[0].textLower === 'goto'){
            tokens[1].type = SemanticClass.StatementLabel;
            return {
                op: tokens[0],
                args: [tokens[1]],
                body: [],
                bodyFirstToken: null,
                bodyLastToken: null,
                argsFirstToken: tokens[1],
                argsLastToken: tokens[1],
                singleStatementBody: false,
            };
        }
        else if (tokens[1].text === ':' && tokens[0].type !== SemanticClass.Keyword) {
            tokens[0].type = SemanticClass.StatementLabel;
            return {
                op: tokens[1],
                args: [tokens[0]],
                body: [],
                bodyFirstToken: null,
                bodyLastToken: null,
                argsFirstToken: tokens[0],
                argsLastToken: tokens[0],
                singleStatementBody: false,
            };
        }
    }
    if (tokens.length >= 2) {
        if (tokens[0].textLower === 'case' && tokens[tokens.length-1].text === ':')
        {
            return {
                op: tokens[tokens.length-1],
                args: [tokens[0], resolveExpression(tokens.slice(1, tokens.length - 1))],
                argsFirstToken: tokens[1],
                argsLastToken: tokens[tokens.length-1],
                body: [],
                bodyFirstToken: null, 
                bodyLastToken: null,
                singleStatementBody: false,
            };
        }
    }
    const expression = resolveExpression(tokens);
    if ("text" in expression){
        return {
            op: expression,
            args: [],
            body:[],
            bodyFirstToken: null,
            bodyLastToken: null,
            argsFirstToken: tokens[0],
            argsLastToken: tokens[tokens.length-1],
            singleStatementBody: false,
        };
    } else {
        return {
            ...expression, 
            body: [],
            bodyFirstToken: null,
            bodyLastToken: null,
            argsFirstToken: tokens[0],
            argsLastToken: tokens[tokens.length-1],
            singleStatementBody: false,
        };
    }
}


export function resolveExpression(
    tokens: Token[]
): UnrealClassExpression | Token
{
    for (let i=0; i<tokens.length; i++){
        classifyExpressionToken(tokens[i]);
    }
    for (let i=1; i<tokens.length; i++){
        const prev = tokens[i-1];
        const next = tokens[i];
        if (next.type === SemanticClass.LiteralName && prev.type === SemanticClass.Identifier){
            next.type = SemanticClass.ObjectReferenceName;
            prev.type = SemanticClass.ClassReference;
        }
    }
    return resolveSubExpression(tokens, 0, tokens.length);
}

function resolveSubExpression(
    tokens: Token[], begin: number, end: number
): UnrealClassExpression | Token 
{
    // TODO: implementation not complete
    const tokenCount = end - begin;
    if (tokenCount === 1){
        return tokens[begin];
    }
    // detect return
    if (tokenCount >= 2 && 
        tokens[begin].textLower === 'return')
    {
        return {
            op: tokens[begin],
            argsFirstToken: tokens[begin + 1],
            argsLastToken: tokens[end - 1],
            args: [resolveSubExpression(tokens, begin + 1, end)]
        };
    }


    // detect 2 arg operators
    let level = 0;
    let bestRating = 0;
    let bestIndex = -1;
    for (let i=begin; i<end; i+=1){
        if (tokens[i].text === '('){
            level += 1;
        }
        else if (tokens[i].text === ')')
        {
            level -= 1;
        }
        if (level === 0){
            switch (tokens[i].text){
            case '&&':
            case '||':
                if (bestRating < 200){
                    bestRating = 200;
                    bestIndex = i;
                }
                break;
            case '<':
            case '>':
            case '<=':
            case '>=':
                if (bestRating < 100){
                    bestRating = 100;
                    bestIndex = i;
                }
                break;
            }
            
        }
    }
    if (bestIndex !== -1){
        return {
            op: tokens[bestIndex],
            argsFirstToken: tokens[begin],
            argsLastToken: tokens[end],
            args: [
                resolveSubExpression(tokens, begin, bestIndex),
                resolveSubExpression(tokens, bestIndex + 1, end)
            ]
        };
    }

    // unwrap extra parenthesis
    if (tokenCount >= 2 &&
        tokens[begin].text === '(' &&
        tokens[end-1].text === ')')
    {
        return resolveSubExpression(tokens, begin+1, end-1);
    }

    // detect function call
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
            if (i+1<end && tokens[i+1].text === '(')
            {
                tokens[i].type = SemanticClass.FunctionReference;
            }
            else {
                tokens[i].type = SemanticClass.VariableReference;
            }
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

    // dumb default
    return {
        args: tokens.slice(begin+1, end),
        op:tokens[begin],
        argsFirstToken: tokens[begin],
        argsLastToken: tokens[end - 1],
    };
}

function classifyExpressionToken(token: Token){
    switch (token.textLower){
    case "super":
    case "self":
    case "new":
        token.type = SemanticClass.Keyword;
        break;
    }
}

function resolveCallArgs(
    tokens: Token[], begin: number, end: number
): (Token | UnrealClassExpression)[] {
    return tokens.slice(begin, end);
}
