import { ParserToken as Token } from "..";



export interface UnrealExecInstruction {
    firstToken?: Token | null;
    lastToken?: Token | null;
}
