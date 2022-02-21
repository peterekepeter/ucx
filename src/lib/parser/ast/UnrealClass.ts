import { ParserToken as Token } from "..";
import { ParserError } from "../types";
import { UnrealClassConstant } from "./UnrealClassConstant";
import { UnrealClassEnum } from "./UnrealClassEnum";
import { UnrealClassFunction } from "./UnrealClassFunction";
import { UnrealClassVariable } from "./UnrealClassVariable";


export interface UnrealClass {
    configName?: Token | null;
    classFirstToken?: Token | null;
    classLastToken?: Token | null;
    classDeclarationFirstToken?: Token;
    classDeclarationLastToken?: Token;
    name: Token | null;
    parentName: Token | null;
    isAbstract: boolean;
    isNative: boolean;
    isNativeReplication: boolean;
    errors: ParserError[];
    constants: UnrealClassConstant[];
    variables: UnrealClassVariable[];
    enums: UnrealClassEnum[];
    tokens: Token[];
    functions: UnrealClassFunction[];
    textLines: string[];
    defaultProperties: UnrealClassConstant[];
    execInstructions: UnrealExecInstruction[];
}


export interface UnrealExecInstruction {
    firstToken?: Token | null;
    lastToken?: Token | null;
}