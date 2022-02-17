import { ParserToken as Token } from "..";


export interface UnrealClassFunction {
    name: Token | null;
    locals: UnrealClassFunctionLocal[];
    body: UnrealClassStatement[];
    bodyFirstToken: Token | null;
    bodyLastToken: Token | null;
    isStatic?: boolean;
    returnType: Token | null;
    fnArgs: UnrealClassFunctionArgument[];
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
}

export interface UnrealClassFunctionArgument {
    type: Token | null,
    name: Token | null,
    isOut: boolean;
}