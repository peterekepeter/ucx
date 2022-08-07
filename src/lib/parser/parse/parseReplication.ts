import { SemanticClass as C } from "../token";
import { Token } from "../types";
import { UcParser } from "../UcParser";
import { clearModifiers } from "./clearModifiers";
import { parseNoneState } from "./parseNoneState";
import { resolveExpression } from "./resolveExpression";


export function parseReplicationBlockBegin(parser: UcParser, token: Token)
{
    parser.rootFn = parseReplicationBlockOpeningBracket;
    token.type = C.Keyword;
    clearModifiers(parser);
    parser.result.replicationBlocks.push({
        bodyFirstToken: token,
        bodyLastToken: token,
        firstToken: token,
        lastToken: token,
        statements: [],
    });
}

function parseReplicationBlockOpeningBracket(parser: UcParser, token: Token)
{
    switch (token.text){
    case '{':
        parser.lastReplicationBlock.bodyFirstToken = token;
        parser.rootFn = parseReplicationStatementBegin;
        break;
    default:
        parser.result.errors.push({
            message: 'Expected "{" after replication keyword.',
            token,
        });
        break;
    }
}

function parseReplicationStatementBegin(parser: UcParser, token: Token) 
{
    let reliable = true;
    let error = false;
    switch (token.textLower){
    case '}': 
        parser.lastReplicationBlock.lastToken = token;
        parser.lastReplicationBlock.bodyLastToken = token;
        parser.rootFn = parseNoneState;
        return; 
        
    case 'unreliable': 
        reliable = false;
        break;
    case 'reliable': 
        reliable = true;
        break;
    default: 
        error = true;
        break;
    }
    if (error){
        parser.result.errors.push({
            message: 'Expected "unreliable", "reliable" or "}".',
            token,
        });
        return;
    }
    token.type = C.Keyword;
    parser.lastReplicationBlock.statements.push({
        condition: null,
        isReliable: reliable,
        targets: []
    });
    parser.rootFn = parseReplicationStatementIf;
}

function parseReplicationStatementIf(parser: UcParser, token: Token) 
{
    switch (token.textLower){
    case 'if': 
        token.type = C.Keyword;
        parser.rootFn = parseReplicationIfOpener;
        break;
    case ';':
        parser.rootFn = parseReplicationStatementBegin;
        break;
    }
}

function parseReplicationIfOpener(parser: UcParser, token: Token) 
{
    switch (token.text){
    case '(': 
        parser.expressionTokens = [];
        parser.rootFn = parseReplicaitonIfExpression;
        parser.parenOpenCount = 1;
        break;
    }
}

function parseReplicaitonIfExpression(parser: UcParser, token: Token) 
{
    switch (token.text){
    default:
        parser.expressionTokens.push(token);
        break;
    case '(':
        parser.expressionTokens.push(token);
        parser.parenOpenCount += 1;
        break;
    case ')':  
        parser.parenOpenCount -= 1;
        if (parser.parenOpenCount > 0){
            parser.expressionTokens.push(token);
            break;
        }
        parser.lastReplicationStatement.condition = resolveExpression(parser.expressionTokens);
        parser.rootFn = parseReplicationTarget;
        break;
    }
}

function parseReplicationTarget(parser: UcParser, token: Token)
{
    if (token.text === ';') {
        parser.rootFn = parseReplicationStatementBegin;
        return;
    }
    token.type = C.Identifier;
    parser.lastReplicationStatement.targets.push(token);
    parser.rootFn = parseReplicationTargetComma;
}

function parseReplicationTargetComma(parser: UcParser, token: Token)
{
    if (token.text === ','){
        parser.rootFn = parseReplicationTarget;
    }
    if (token.text === ';') {
        parser.rootFn = parseReplicationStatementBegin;
        return;
    }
}