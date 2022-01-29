import { ParserError } from "../ParserError";
import { ParserToken } from "../ParserToken";
import { UnrealClassConstant } from "./UnrealClassConstant";
import { UnrealClassEnum } from "./UnrealClassEnum";
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
}
