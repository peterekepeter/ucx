import { UnrealClass } from "./ast/UnrealClass";
import { UnrealExecInstruction } from "./ast/UnrealExecInstruction";
import { UnrealClassState } from "./ast/UnrealClassState";
import { UnrealClassFunction, UnrealClassFunctionLocal, UnrealClassStatement } from "./ast/UnrealClassFunction";
import { UnrealClassConstant, UnrealDefaultProperty } from "./ast/UnrealClassConstant";
import { UnrealClassEnum } from "./ast/UnrealClassEnum";
import { UnrealClassVariable } from "./ast/UnrealClassVariable";
import { parseEnumBody, parseEnumBodyClosed } from "./parse/parseEnum";
import { isParsingClassFn } from "./parse/parseClass";
import { ParserFn, Token } from "./types";
import { LazyParserToken, ParserToken, SemanticClass } from "./token";
import { parseNoneState } from "./parse/parseNoneState";
import { resolveArrayCountExpressions } from "./parse/resolveArrayCountExpressions";
import { UnrealClassStruct } from "./ast/UnrealClassStruct";


export class UcParser{

    rootFn: ParserFn = parseNoneState;

    result: UnrealClass = {
        name: null,
        parentName: null, 
        isAbstract: false,
        isNative: false,
        isNativeReplication: false,
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
    };
    
    expressionTokens: Token[] = [];
    codeBlockStack: UnrealClassStatement[] = [];
    parenOpenCount = 0;
    modifiers: Token[] = [];
    fnArgTokens: Token[] = [];
    isMultilineComment = false;
    currentClassState: UnrealClassState | null = null;
    label: Token | null = null;
    currentlyInStateFunction: boolean = false;

    getAst() {
        return this.result;
    }

    endOfFile(line: number, position: number) {
        const index = this.result.tokens.length;
        const token = new LazyParserToken(line, position, '', index);
        if (this.rootFn !== parseNoneState){
            this.result.errors.push({ 
                token, 
                message: this.eofErrorMessageFrom(this.rootFn)
            });
        }
        if (this.result.classFirstToken){
            this.result.classLastToken = token;
        }
        this.result.tokens.push(token);
        resolveArrayCountExpressions(this.result);
    }

    eofErrorMessageFrom(fn: ParserFn): string {
        let detail = '';
        if (isParsingClassFn(fn)){
            detail = "Forgot to finish class declaration.";
        }
        switch (fn){
        case parseEnumBody:
        case parseEnumBodyClosed:
            detail = "Forgot to close the enum?";
            break;
        }
        let message = "File ended too soon.";
        if (detail) {
            message = `${message} ${detail}`;
        }
        return message;
    }

    parse(line: number, position: number, text: string) {
        const index = this.result.tokens.length;
        const token = new LazyParserToken(line, position, text, index);
        this.parseToken(token);
        this.result.tokens.push(token);
    }

    parseToken(token: ParserToken){
        if (isLineComment(token)){
            token.type = SemanticClass.Comment;
            return;
        }
        
        if (isMultilineCommentStart(token)){
            this.isMultilineComment = true;
        }
        
        if (this.isMultilineComment) {
            token.type = SemanticClass.Comment;
            if (isMultilineCommentEnd(token))
            {
                this.isMultilineComment = false;
            }
            return;
        }
        
        this.rootFn(this, token);
    }

    get lastVar() : UnrealClassVariable {
        return this.result.variables[this.result.variables.length - 1];
    }

    get lastEnum() : UnrealClassEnum {
        return this.result.enums[this.result.enums.length - 1];
    }

    get lastConst() : UnrealClassConstant {
        return this.result.constants[this.result.constants.length - 1];
    }

    get lastFn() : UnrealClassFunction {
        const functions = this.currentClassState 
            ? this.currentClassState.functions
            : this.result.functions;
        return functions[functions.length - 1];
    }

    get lastFnLocal(): UnrealClassFunctionLocal {
        const fn = this.lastFn;
        return fn.locals[fn.locals.length - 1];
    }

    get lastCodeBlock() : UnrealClassStatement[] {
        if (this.codeBlockStack.length > 0){
            const last = this.codeBlockStack.length - 1;
            return this.codeBlockStack[last].body;
        }
        if (this.currentClassState){
            return this.currentClassState.body;
        }
        const fn = this.lastFn;
        return fn.body;
    }

    get lastStatement() : UnrealClassStatement {
        const body = this.lastCodeBlock;
        if (body.length === 0 && this.codeBlockStack.length > 0){
            const last = this.codeBlockStack.length - 1;
            return this.codeBlockStack[last];
        }
        return body[body.length - 1];
    }

    get lastDefaultProperty(): UnrealDefaultProperty {
        const list = this.result.defaultProperties;
        return list[list.length - 1];
    }

    get lastExec(): UnrealExecInstruction {
        const list = this.result.execInstructions;
        return list[list.length - 1];
    }

    get lastState(): UnrealClassState {
        const list = this.result.states;
        return list[list.length - 1];
    }

    get lastStruct(): UnrealClassStruct {
        const list = this.result.structs;
        return list[list.length - 1];
    }

    get lastStructMember(): UnrealClassVariable {
        const list = this.lastStruct.members;
        return list[list.length - 1];
    }

}



function isLineComment(token: Token) {
    return token.text.startsWith("//");
}

function isMultilineCommentStart(token: Token){
    return token.text.startsWith("/*");
}

function isMultilineCommentEnd(token: Token){
    return token.text.endsWith("*/");
}