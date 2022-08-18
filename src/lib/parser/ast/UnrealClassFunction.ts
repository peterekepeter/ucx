import { ParserToken as Token } from "..";


export interface UnrealClassFunction {
    name: Token | null;
    locals: UnrealClassFunctionLocal[];
    body: UnrealClassStatement[];
    bodyFirstToken: Token | null;
    bodyLastToken: Token | null;
    isStatic: boolean;
    isSimulated: boolean;
    isFinal: boolean;
    isPrivate: boolean;
    isLatent: boolean;
    returnType: Token | null;
    fnArgs: UnrealClassFunctionArgument[];
    fnArgsLastToken: Token | null;
    fnArgsFirstToken: Token | null;
}

export function createEmptyUnrealClassFunction(){
    return {
        name: null,
        locals: [],
        body: [],
        bodyFirstToken: null,
        bodyLastToken: null,
        isStatic: false,
        isSimulated: false,
        isFinal: false,
        isPrivate: false,
        isLatent: false,
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
    body: UnrealClassStatement[];
    bodyFirstToken: Token | null;
    bodyLastToken: Token | null;
    label: Token | null;
    singleStatementBody: boolean;
}

export interface UnrealClassFunctionArgument {
    type: Token | null,
    name: Token | null,
    isOut: boolean;
    isOptional: boolean;
    isCoerce: boolean;
}