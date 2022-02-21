import { SemanticClass, UcParser } from "..";
import { Token } from "../types";
import { parseNoneState } from "./parseNoneState";


export function parseExec(parser: UcParser, token: Token) {
    const exec = parser.lastExec;
    if (exec.firstToken?.line === token.line){
        exec.lastToken = token;
        token.type = SemanticClass.ExecInstruction;
    }
    else {
        parser.rootFn = parseNoneState;
        parseNoneState(parser, token);
        return;
    }
}