import { ParserError, ParserToken } from "../types";
import { UnrealClassConstant } from "./UnrealClassConstant";
import { UnrealClassEnum } from "./UnrealClassEnum";
import { UnrealClassFunction } from "./UnrealClassFunction";
import { UnrealClassVariable } from "./UnrealClassVariable";


export interface UnrealClass {
    classFirstToken?: ParserToken | null;
    classLastToken?: ParserToken | null;
    name: ParserToken | null;
    parentName: ParserToken | null;
    isAbstract: boolean;
    isNative: boolean;
    isNativeReplication: boolean;
    errors: ParserError[];
    constants: UnrealClassConstant[];
    variables: UnrealClassVariable[];
    enums: UnrealClassEnum[];
    tokens: ParserToken[];
    functions: UnrealClassFunction[];
}


