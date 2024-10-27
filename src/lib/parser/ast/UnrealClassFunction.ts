import { ParserToken as Token } from "..";


export interface UnrealClassFunction {
    name: Token | null;
    locals: UnrealClassFunctionLocal[];
    body: UnrealClassStatement[];
    bodyFirstToken: Token | null;
    bodyLastToken: Token | null;
    nativeIndex: number,
    operatorPrecedence: number,
    isStatic: boolean;
    isSimulated: boolean;
    isFinal: boolean;
    isPrivate: boolean;
    isExec: boolean;
    isSingular: boolean;
    isLatent: boolean;
    isNative: boolean,
    isIterator: boolean,
    isOperator: boolean,
    isPreOperator: boolean,
    isPostOperator: boolean,
    isEvent: boolean,
    returnType: Token | null;
    fnArgs: UnrealClassFunctionArgument[];
    fnArgsLastToken: Token | null;
    fnArgsFirstToken: Token | null;
}

export function createEmptyUnrealClassFunction(): UnrealClassFunction {
    return {
        name: null,
        locals: [],
        body: [],
        bodyFirstToken: null,
        bodyLastToken: null,
        nativeIndex: -1,
        operatorPrecedence: -1,
        isStatic: false,
        isSimulated: false,
        isFinal: false,
        isPrivate: false,
        isExec: false,
        isSingular: false,
        isLatent: false,
        isNative: false,
        isIterator: false,
        isOperator: false,
        isPreOperator: false,
        isPostOperator: false,
        isEvent: false,
        returnType: null,
        fnArgs: [],
        fnArgsFirstToken: null,
        fnArgsLastToken: null
    };
}

export interface UnrealClassFunctionLocal {
    type: Token | null;
    name: Token | null;
}

export interface UnrealClassExpression {
    op: Token | null;
    args: (UnrealClassExpression | Token)[];
    argsFirstToken: Token | null;
    argsLastToken: Token | null;
}

export interface UnrealClassStatement extends UnrealClassExpression {
    // FIXME: body length of 0 can denote both empty body {} and missing body
    body: UnrealClassStatement[];
    bodyFirstToken: Token | null;
    bodyLastToken: Token | null;
    singleStatementBody: boolean;
}

export interface UnrealClassFunctionArgument {
    type: Token | null,
    name: Token | null,
    template: Token | null,
    isOut: boolean;
    isOptional: boolean;
    isCoerce: boolean;
    isSkip: boolean;
    arrayCountToken: Token | null;
    arrayCountExpression: Token | UnrealClassExpression | null;
    arrayCount: number | null;
}