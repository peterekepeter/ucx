import { ParserToken as Token, SemanticClass, ParserToken } from "..";
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
        if ((tokens[0].textLower === 'case' || tokens[0].textLower === 'default') && tokens[tokens.length-1].text === ':')
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
    var i: number, len = tokens.length;
    var prev: ParserToken|undefined, curr: ParserToken, next: ParserToken|undefined;
    for (i = 0; i < len; i += 1){
        prev = tokens[i - 1] as ParserToken | undefined;
        curr = tokens[i];
        next = tokens[i + 1] as ParserToken | undefined;
        switch (curr.textLower){       
        case "new":    
            curr.type = SemanticClass.Keyword;
            break;
        case "super":
        case "self":
        case "static":
        case "default":
            curr.type = SemanticClass.LanguageVariable;
            break;
        }
        if (curr.type === SemanticClass.LiteralName && prev && prev.type === SemanticClass.Identifier){
            curr.type = SemanticClass.ObjectReferenceName;
            prev.type = SemanticClass.ClassReference;
        }
        else if (curr.type === SemanticClass.Operator && curr.text === '<' && prev?.textLower === "class") {
            prev.type = SemanticClass.TypeReference;
            curr.type = SemanticClass.GenericArgBegin;
        }
        else if (prev?.type === SemanticClass.GenericArgBegin) {
            curr.type = SemanticClass.ClassReference;
        }
        else if (prev?.type === SemanticClass.ClassReference && curr.text === '>')
        {
            curr.type = SemanticClass.GenericArgEnd;
        }
        else if (curr.type === SemanticClass.Identifier && next?.type !== SemanticClass.LiteralName && next?.text !== "(") {
            curr.type = SemanticClass.VariableReference;
        }
    }
    return resolveSubExpression(tokens, 0, len);
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

function resolveCallArgs(
    tokens: Token[], begin: number, end: number
): (Token | UnrealClassExpression)[] {
    var i: number, token: Token, result:(Token | UnrealClassExpression)[] = [];
    var depth = 0, arg = begin;
    for (i = begin; i < end; i += 1) {
        token = tokens[i];
        switch (token.text) {
        case '(': depth += 1; break;
        case ')': depth -= 1; break;
        case ',':
            if (depth === 0) {
                result.push(resolveSubExpression(tokens, arg, i));
                arg = i + 1;
            }
            break;
        }
    }
    if (arg < end) {
        result.push(resolveSubExpression(tokens, arg, end));
    }
    return result;
}
