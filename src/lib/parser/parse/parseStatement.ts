import { SemanticClass as C, SemanticClass, UcParser } from "..";
import { UnrealClassFunctionArgument, UnrealClassStatement } from "../ast/UnrealClassFunction";
import { Token } from "../types";
import { parseNoneState } from "./parseNoneState";
import { resolveExpression, resolveStatementExpression } from "./resolveExpression";


export function parseStatement(parser: UcParser, token: Token)
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
            label: parser.label,
            bodyFirstToken: null,
            bodyLastToken: null,
            argsFirstToken: null,
            argsLastToken: null,
            singleStatementBody: false,
        };
        parser.label = null;
        parser.lastCodeBlock.push(statement);
        parser.codeBlockStack.push(statement);
        break;
    case "foreach":
        parser.rootFn = parseForeach;
        parser.expressionTokens = [];
        token.type = C.Keyword;
        const foreach: UnrealClassStatement = {
            op: token,
            args: [],
            body: [],
            label: parser.label,
            bodyFirstToken: null,
            bodyLastToken: null,
            argsFirstToken: null,
            argsLastToken: null,
            singleStatementBody: false,
        };
        parser.label = null;
        parser.lastCodeBlock.push(foreach);
        parser.codeBlockStack.push(foreach);
        break;
    case "{":
        // codeblock
        const body = parser.lastCodeBlock;
        const codeBlock: UnrealClassStatement = {
            op: token,
            args: [],
            body: [],
            label: parser.label,
            bodyFirstToken: token,
            bodyLastToken: token,
            argsFirstToken: null,
            argsLastToken: null,
            singleStatementBody: false,
        };
        parser.label = null;
        body.push(codeBlock);
        parser.codeBlockStack.push(codeBlock);
        break;
    case "}":
        endCurrentStatementOrFunctionBlock(parser, token);
        break;
    case "goto":
    case "continue":
    case "break":
    case "return":
        token.type = SemanticClass.Keyword;
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
    case ":":
        if (parser.expressionTokens.length === 1){
            const labelToken = parser.expressionTokens[0];
            labelToken.type = SemanticClass.StatementLabel;
            parser.expressionTokens = [];
            parser.label = labelToken;
            parser.rootFn = parseStatement;
        }
        else {
            parser.expressionTokens.push(token);
        }
        break;
    case "}":
        const fn = parser.lastFn;
        parser.lastCodeBlock.push(resolveStatementExpressionAndApplyLabel(parser));
        fn.bodyLastToken = token;
        popSingleStatementCodeBlocks(parser, token);
        parser.rootFn = parseNoneState;
        parser.result.errors.push({ token, message: "Function ended unexpectedly."});
        break;
    case ";":
        const statement = resolveStatementExpressionAndApplyLabel(parser);
        statement.argsLastToken = token;
        parser.lastCodeBlock.push(statement);
        popSingleStatementCodeBlocks(parser, token);
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
    switch (token.textLower){
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
    case "if":
        if (parser.lastStatement.op?.textLower === 'else')
        {
            // this is an else if
            token.type = C.Keyword;
            break;
        }
    default:
        parseSingleStatementBody(parser, token);
        break;
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
        parseSingleStatementBody(parser, token);
        break;
    }
}

function parseSingleStatementBody(parser: UcParser, token: Token)
{
    parser.rootFn = parseStatement;
    // todo check last codeblock
    parser.lastStatement.bodyFirstToken = token;
    parser.lastStatement.singleStatementBody = true;
    parseStatement(parser, token);
}

function popSingleStatementCodeBlocks(parser: UcParser, token: Token){
    while (parser.codeBlockStack.length > 0)
    {
        const lastBlock = parser.codeBlockStack[parser.codeBlockStack.length - 1];
        if (!lastBlock.singleStatementBody){
            return; 
        }
        if (lastBlock.body.length > 1){
            parser.result.errors.push({
                message: 'Single statement block did not parse correctly',
                token: lastBlock.bodyLastToken ?? lastBlock.bodyFirstToken ?? token
            });
        }
        if (lastBlock.body.length >= 1){
            lastBlock.bodyLastToken = token;
            parser.codeBlockStack.pop();
        }
        else {
            return;
        }
    }
}

function resolveStatementExpressionAndApplyLabel(parser: UcParser): UnrealClassStatement {
    const result = resolveStatementExpression(parser.expressionTokens);
    parser.expressionTokens = [];
    if (parser.label){
        result.label = parser.label;
        parser.label = null;
    }
    return result;
}

function endCurrentStatementOrFunctionBlock(parser: UcParser, endingToken: Token)
{   
    if (parser.codeBlockStack.length > 0) {
        endCurrentStatementBlock(parser, endingToken);
        popSingleStatementCodeBlocks(parser, endingToken);
        parser.rootFn = parseStatement;
    }
    else if (parser.currentClassState && !parser.currentlyInStateFunction){
        // was last statement in state body
        parser.rootFn = parseNoneState;
        parseNoneState(parser, endingToken); // let state parser handle this case
    }
    else{
        // ends function
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

function parseForeach(parser: UcParser, token: Token)
{
    switch (token.text)
    {
    case '{':
        parser.lastStatement.args.push(resolveExpression(parser.expressionTokens));
        parser.rootFn = parseStatement;
        parser.lastStatement.bodyFirstToken = token;
        break;
    default:
        parser.expressionTokens.push(token);
        break;
    }
    parser.expressionTokens.push(token);
}