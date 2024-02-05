import { Token } from "../types";
import { UnrealClassExpression } from "./UnrealClassFunction";

export interface UnrealClassReplicationBlock
{
    firstToken: Token;
    lastToken: Token;
    bodyFirstToken: Token;
    bodyLastToken: Token;
    statements: UnrealClassReplicationStatement[];
}

export interface UnrealClassReplicationStatement
{
    firstToken: Token;
    lastToken: Token;
    isReliable: boolean;
    condition: Token | UnrealClassExpression | null;
    targets: Token[];
}
