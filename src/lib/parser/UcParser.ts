import { UnrealClass } from "./ast/UnrealClass";
import { UnrealClassFunction, UnrealClassFunctionLocal, UnrealClassStatement } from "./ast/UnrealClassFunction";
import { UnrealClassConstant } from "./ast/UnrealClassConstant";
import { UnrealClassEnum } from "./ast/UnrealClassEnum";
import { UnrealClassVariable } from "./ast/UnrealClassVariable";
import { parseVarDeclaration } from "./parse/parseVar";
import { parseEnumBody, parseEnumBodyClosed, parseEnumDeclaration } from "./parse/parseEnum";
import { parseConstDeclaration } from "./parse/parseConst";
import { isParsingClassFn, parseClassName } from "./parse/parseClass";
import { ParserToken, SemanticClass, ParserFn, Token } from "./types";
import { parseFnDeclaration } from "./parse/parseFunction";


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
        enums: [],
        tokens: [],
        constants: [],
        functions: [],
    };
    
    opIdentifier: Token | null = null;
    innerBody: UnrealClassStatement[] | null = null;

    getAst() {
        return this.result;
    }

    endOfFile(line: number, position: number) {
        const token :ParserToken = {
            line, position, text:'', classification: SemanticClass.None
        };
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
        const token: Token = {
            classification: SemanticClass.None,
            line,
            position,
            text
        };
        this.parseToken(token);
        this.result.tokens.push(token);
    }

    parseToken(token: ParserToken){
        if (isLineComment(token)){
            token.classification = SemanticClass.Comment;
            return;
        }
        else {
            this.rootFn(this, token);
        }
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
        return this.result.functions[this.result.functions.length - 1];
    }

    get lastFnLocal(): UnrealClassFunctionLocal {
        const fn = this.lastFn;
        return fn.locals[fn.locals.length - 1];
    }

    get currentFnBody() : UnrealClassStatement[] {
        if (this.innerBody){
            return this.innerBody;
        }
        const fn = this.lastFn;
        return fn.body;
    }

}

function isLineComment(token: Token) {
    return token.text.startsWith("//");
}

export function parseNoneState(parser: UcParser, token: Token) 
{
    switch (token.text.toLocaleLowerCase()){

    case 'class':
        parser.rootFn = parseClassName;
        parser.result.classFirstToken = token;
        token.classification = SemanticClass.Keyword;
        break;

    case 'var': 
        parser.rootFn = parseVarDeclaration;
        parser.result.variables.push({ 
            name: null, 
            type: null,
            isConst: false,
            isTransient: false,
            group: null,
            isConfig: false,
        });
        token.classification = SemanticClass.Keyword;
        break;

    case 'enum':
        parser.rootFn = parseEnumDeclaration;
        parser.result.enums.push({
            name: null,
            firstToken: token,
            lastToken: token,
            enumeration: [],
        });
        token.classification = SemanticClass.Keyword;
        break;
        
    case 'const':
        parser.rootFn = parseConstDeclaration;
        parser.result.constants.push({
            name: null, 
            value: null
        });
        token.classification = SemanticClass.Keyword;
        break;

    case 'function':
        parser.rootFn = parseFnDeclaration;
        parser.result.functions.push({
            name: null,
            locals: [],
            body: []
        });
        token.classification = SemanticClass.Keyword;
        break;

    default:
        parser.result.errors.push({ token, message: "Reached unexpected token." });
        break;
    }
}

