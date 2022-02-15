import { SemanticClass as C, UcParser } from "..";
import { UnrealClassStatement } from "../ast/UnrealClassFunction";
import { Token } from "../types";
import { parseNoneState } from "./parseNoneState";
import { resolveExpression, resolveStatementExpression } from "./resolveExpression";


export function parseFnDeclaration(parser: UcParser, token: Token){
    const fn = parser.lastFn;
    fn.name = token;
    token.type = C.FunctionDeclaration;
    parser.rootFn = parseFnParamBegin;
}

function parseFnParamBegin(parser:UcParser, token:Token){
    let message = '';
    switch (token.text){
    case "(":
        parser.rootFn = parseFnParams;
        break;
    default: 
        message = "Expected function parameters '('";
        parser.result.errors.push({ token, message });
        break;
    }
}

function parseFnParams(parser: UcParser, token: Token)
{
    let message = '';
    switch (token.text){
    case ")":
        parser.rootFn = parseFnAfterParameters;
        break;
    default: 
        message = "Expected function pameter or closing parentheis ')'";
        parser.result.errors.push({ token, message });
        break;
    }
}

function parseFnAfterParameters(parser: UcParser, token: Token)
{
    const fn = parser.lastFn;
    switch (token.text){
    case "{":
        fn.bodyFirstToken = token;
        fn.bodyLastToken = token;
        parser.rootFn = parseStatement;
        break;
    case ";":
        // missing body, don't set body tokens
        parser.rootFn = parseNoneState;
        break;
    }
}

function parseStatement(parser: UcParser, token: Token)
{
    switch(token.textLower)
    {
    case "local":
        parser.rootFn = parseFnLocalDeclaration;
        token.type = C.Keyword;
        break;
    case "else":
    case "for":
    case "while":
    case "if":
        parser.rootFn = parseControlStatement;
        token.type = C.Keyword;
        const statement: UnrealClassStatement = {
            op: token,
            args: [],
            body: [],
            bodyFirstToken: null,
            bodyLastToken: null,
            argsFirstToken: null,
            argsLastToken: null
        };
        parser.lastCodeBlock.push(statement);
        parser.codeBlockStack.push(statement);
        break;
    case "{":
        // codeblock
        const body = parser.lastCodeBlock;
        const codeBlock: UnrealClassStatement = {
            op: token,
            args: [],
            body: [],
            bodyFirstToken: token,
            bodyLastToken: token,
            argsFirstToken: null,
            argsLastToken: null
        };
        body.push(codeBlock);
        parser.codeBlockStack.push(codeBlock);
        break;
    case "}":
        endCurrentStatementOrFunctionBlock(parser, token);
        break;
    default:
        // default to expression
        parser.expressionTokens = [];
        parser.rootFn = parseExpression;
        parser.parseToken(token);
        break;
    }
}


function parseFnLocalDeclaration(parser: UcParser, token: Token)
{
    const fn = parser.lastFn;
    fn.locals.push({
        type: token,
        name: null
    });
    parser.rootFn = parseFnLocalVar;
    token.type = C.TypeReference;
}

function parseFnLocalVar(parser: UcParser, token: Token)
{
    switch(token.text)
    {
    case ';':
        parser.rootFn = parseStatement;
        break;
    default:
        const local = parser.lastFnLocal;
        local.name = token;
        token.type = C.LocalVariable;
        break;
    }
}

function parseExpression(parser: UcParser, token: Token)
{
    switch (token.text)
    {
    case "}":
        const fn = parser.lastFn;
        parser.lastCodeBlock.push(resolveStatementExpression(parser.expressionTokens));
        parser.expressionTokens = [];
        fn.bodyLastToken = token;
        parser.rootFn = parseNoneState;
        parser.result.errors.push({ token, message: "Function ended unexpectedly."});
        break;
    case ";":
        parser.lastCodeBlock.push(resolveStatementExpression(parser.expressionTokens));
        parser.expressionTokens = [];
        parser.rootFn = parseStatement;
        break;
    default:
        parser.expressionTokens.push(token);
        break;
    }
}

/**
 * After keyword for, while, if
 */
function parseControlStatement(parser: UcParser, token: Token)
{
    let message = "Error";
    switch (token.text){
    case "{":
        parser.rootFn = parseStatement;
        parser.lastStatement.bodyFirstToken = token;
        break;
    case "(":
        parser.expressionTokens = [];
        parser.lastStatement.argsFirstToken = token;
        parser.rootFn = parseControlCondition;
        parser.parenOpenCount = 1;
        break;
    case ";":
        endCurrentStatementBlock(parser, token);
        parser.rootFn = parseStatement;
        break;
    case "}":
        // end current control statement
        endCurrentStatementBlock(parser, token);
        // } will also close enclosing scope
        endCurrentStatementOrFunctionBlock(parser, token);
        break;
    default:
        message = "Expected '(' or '{' after keyword.";
        parser.result.errors.push({ token, message });
    }
}

function parseControlCondition(parser: UcParser, token: Token)
{
    switch (token.text){
    case ")":
        parser.parenOpenCount--;
        if (parser.parenOpenCount !== 0){
            parser.expressionTokens.push(token);
            break;
        }
        parser.rootFn = parseAfterControlCondition;
        parser.lastStatement.argsLastToken = token;
        // intentionally let through
    case ";":
        const st = parser.lastStatement;
        if (!st){
            console.error("missing last statement????");
            break;
        }
        parser.lastStatement.args.push(resolveExpression(parser.expressionTokens));
        parser.expressionTokens = [];
        st.argsLastToken = token;
        break;
    case "}":
        parser.lastStatement.argsLastToken = token;
        // end current control statement
        endCurrentStatementBlock(parser, token);
        // } will also close enclosing scope
        endCurrentStatementOrFunctionBlock(parser, token);
        break;
    case "(":
        parser.parenOpenCount++;
        // intentionally let through
    default:
        parser.expressionTokens.push(token);
        break;
    }
}

function parseAfterControlCondition(parser: UcParser, token: Token)
{
    switch (token.text){
    case ";":
        endCurrentStatementBlock(parser, token);
        parser.rootFn = parseStatement;
        break;
    case "}":
        // end current control statement
        endCurrentStatementBlock(parser, token);
        // } will also close enclosing scope
        endCurrentStatementOrFunctionBlock(parser, token);
        break;
    case "{":
        parser.rootFn = parseStatement;
        parser.lastStatement.bodyFirstToken = token;
        break;
    default:
        parser.rootFn = parseSingleStatementBody;
        parser.lastStatement.bodyFirstToken = token;
        parseSingleStatementBody(parser, token);
        break;
    }
}

function parseSingleStatementBody(parser: UcParser, token: Token)
{
    switch (token.text){
    case ";":
        parser.lastStatement.body.push(resolveStatementExpression(parser.expressionTokens));
        parser.lastStatement.bodyLastToken = token;
        parser.expressionTokens = [];
        endCurrentStatementBlock(parser, token);
        parser.rootFn = parseStatement;
        break;
    case "}":
        parser.lastStatement.body.push(resolveStatementExpression(parser.expressionTokens));
        parser.lastStatement.bodyLastToken = token;
        parser.expressionTokens = [];
        endCurrentStatementBlock(parser, token);
        // } will also close enclosing scope
        endCurrentStatementOrFunctionBlock(parser, token);
        break;
    default:
        parser.expressionTokens.push(token);
        break;
    }
}

function endCurrentStatementOrFunctionBlock(parser: UcParser, endingToken: Token)
{   
    if (parser.codeBlockStack.length > 0) {
        endCurrentStatementBlock(parser, endingToken);
        parser.rootFn = parseStatement;
    }
    else {
        const fn = parser.lastFn;
        fn.bodyLastToken = endingToken;
        parser.rootFn = parseNoneState;
    }
}

function endCurrentStatementBlock(parser: UcParser, endingToken: Token){
    const popped = parser.codeBlockStack.pop();
    if (!popped){
        parser.result.errors.push({
            token: endingToken, 
            message: 'Failed to close statement',
        });
        return;
    }
    popped.bodyLastToken = endingToken;
    if (!popped.bodyFirstToken) {
        popped.bodyFirstToken = endingToken;
    }
}