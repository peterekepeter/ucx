import { ParserToken as Token } from "..";
import { ParserError } from "../types";
import { UnrealClassConstant, UnrealDefaultProperty } from "./UnrealClassConstant";
import { UnrealClassEnum } from "./UnrealClassEnum";
import { UnrealClassFunction } from "./UnrealClassFunction";
import { UnrealClassReplicationBlock } from "./UnrealClassReplication";
import { UnrealClassState } from "./UnrealClassState";
import { UnrealClassStruct } from "./UnrealClassStruct";
import { UnrealClassVariable } from "./UnrealClassVariable";
import { UnrealExecInstruction } from "./UnrealExecInstruction";


export interface UnrealClass {
    fileName?: string;
    configName?: Token | null;
    classFirstToken?: Token | null;
    classLastToken?: Token | null;
    classDeclarationFirstToken?: Token;
    classDeclarationLastToken?: Token;
    name: Token | null;
    parentName: Token | null;
    isAbstract: boolean;
    isNative: boolean;
    isNoExport: boolean;
    isTransient: boolean;
    isSafeReplace: boolean;
    isNativeReplication: boolean;
    isPerObjectConfig: boolean;
    errors: ParserError[];
    constants: UnrealClassConstant[];
    variables: UnrealClassVariable[];
    structs: UnrealClassStruct[];
    enums: UnrealClassEnum[];
    tokens: Token[];
    functions: UnrealClassFunction[];
    textLines: string[];
    defaultProperties: UnrealDefaultProperty[];
    defaultPropertiesFirstToken?: Token | null;
    defaultPropertiesLastToken?: Token | null;
    execInstructions: UnrealExecInstruction[];
    states: UnrealClassState[];
    replicationBlocks: UnrealClassReplicationBlock[];
}

export function createDefaultUnrealClass(): UnrealClass {
    return {
        name: null,
        parentName: null, 
        isAbstract: false,
        isNoExport: false,
        isSafeReplace: false,
        isTransient: false,
        isNative: false,
        isNativeReplication: false,
        isPerObjectConfig: false,
        errors: [],
        variables: [],
        execInstructions: [],
        enums: [],
        tokens: [],
        constants: [],
        functions: [],
        textLines: [],
        structs: [],
        defaultProperties: [],
        states:[],
        replicationBlocks: [],
    };
}
