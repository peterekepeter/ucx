export interface ParserToken
{
    text: string;
    line: number; 
    position: number;
}

type Token = ParserToken;

export interface ParserError
{
    message: string;
    token: Token;
    debug?: string;
}

export interface UnrealClassVariable
{
    type: Token | null,
    name: Token | null,
    isTransient: boolean,
    isConst: boolean,
    group: Token | null
}

export interface UnrealClassEnum
{
    name: Token | null;
    enumeration: Token[];
}

export interface UnrealClass
{
    name: Token | null
    parentName: Token | null
    isAbstract: boolean,
    isNative: boolean,
    isNativeReplication: boolean,
    errors: ParserError[],
    variables: UnrealClassVariable[]
    enums: UnrealClassEnum[]
}

export class UcParser{

    rootState: null 
        | 'className' 
        | 'classDecorators' 
        | 'classParent'
        | 'varDeclaration'
        | 'varName'
        | 'varNext'
        | 'varGroupName'
        | 'varGroupNext'
        | 'enumDeclaration'
        | 'enumNameParsed'
        | 'enumBody'
        | 'enumBodyParsedName'
        | 'enumBodyClosed'
        = null;

    result: UnrealClass = {
        name: null,
        parentName: null, 
        isAbstract: false,
        isNative: false,
        isNativeReplication: false,
        errors: [],
        variables: [],
        enums: []
    };

    getAst() {
        return this.result;
    }

    endOfFile(token: Token) {
        if (this.rootState != null){
            this.result.errors.push({ 
                token, 
                message: this.eofErrorMessageFrom(this.rootState),
                debug: `this.rootState was ${this.rootState} expected null`
            });
        }
    }

    eofErrorMessageFrom(rootState: string): string {
        let detail = '';
        switch (rootState){
        case 'enumBody':
        case 'enumBodyParsedName':
            detail = "Forgot to close the enum?";
            break;
        }
        let message = "File ended too soon.";
        if (detail) {
            message = `${message} ${detail}`;
        }
        return message;
    }

    parse(token: Token) {
        if (isLineComment(token)){
            return;
        }
        switch(this.rootState)
        {
        case null: this.parseNullState(token); break;
        case "className": this.parseClassName(token); break;   
        case "classDecorators": this.parseClassDecorators(token); break;
        case "classParent": this.parseClassParent(token); break;
        case "varDeclaration": this.parseVarDelcaration(token); break;
        case "varGroupName": this.parseVarGroup(token); break;
        case "varGroupNext": this.parseVarGroupNext(token); break;
        case "varNext": this.parseVarNext(token); break;
        case "varName": this.parseVarName(token); break;
        case "enumDeclaration": this.parseEnumDeclaration(token); break;
        case "enumNameParsed": this.parseEnumNameParsed(token); break;
        case "enumBody": this.parseEnumBody(token); break;
        case "enumBodyParsedName": this.parseEnumBodyParedName(token); break;
        case "enumBodyClosed": this.parseEnumBodyClosed(token); break;

        default:
            this.result.errors.push({ 
                token, 
                message: "Invalid parser state reached.", 
                debug: `${this.rootState} not handled`
            });
            this.rootState = null;
            break;
        }
    }

    parseEnumBodyClosed(token: ParserToken) {
        switch(token.text){
        case ';':
            this.rootState = null;
            break;
        }
    }

    parseEnumBodyParedName(token: ParserToken) {
        switch (token.text){
        case ',':
            this.rootState = 'enumBody';
            break;
        case '}':
            this.rootState = 'enumBodyClosed';
            break;
        }
    }

    parseEnumBody(token: ParserToken) {
        if (token.text === "}") {
            this.rootState = "enumBodyClosed";
            return;
        }
        const enumResult = this.getLastEnum();
        enumResult.enumeration.push(token);
        this.rootState = 'enumBodyParsedName';
    }
    
    parseEnumNameParsed(token: ParserToken) {
        if (token.text === "{"){
            this.rootState = "enumBody";
            return;
        }
    }

    parseEnumDeclaration(token: ParserToken) {
        const result = this.getLastEnum();
        result.name = token;
        this.rootState = 'enumNameParsed';
    }

    parseVarGroupNext(token: ParserToken) {
        switch (token.text){
        case ")": 
            this.rootState = 'varDeclaration';
            break;
        default:
            this.result.errors.push({ token, message: 'Expected ")"'});
            // try to recover
            this.rootState = 'varDeclaration';
            this.parse(token);
            break;
        }
    }

    parseVarGroup(token: ParserToken) {
        const variable = this.getLastVar();
        variable.group = token;
        this.rootState = 'varGroupNext';
    }

    getLastVar() : UnrealClassVariable {
        return this.result.variables[this.result.variables.length - 1];
    }

    getLastEnum() : UnrealClassEnum {
        return this.result.enums[this.result.enums.length - 1];
    }

    parseVarNext(token: ParserToken) {
        switch(token.text){
        case ';':
            this.rootState = null;
            break;
        default:
            this.result.errors.push({token, message: 'Expecting ";" after variable name.'});
            break;
        }
    }

    parseVarDelcaration(token: ParserToken) {
        const variable = this.result.variables[this.result.variables.length - 1];
        switch (token.text){
        case 'transient': 
            variable.isTransient = true;
            break;
        case 'const':
            variable.isConst = true;
            break;
        case '(':
            this.rootState = "varGroupName";
            break;
        default:
            variable.type = token;
            this.rootState = "varName";
            break;
        }
    }
    
    parseVarName(token: ParserToken) {
        const variable = this.result.variables[this.result.variables.length - 1];
        variable.name = token;
        this.rootState = "varNext";
    }

    parseNullState(token: Token) 
    {
        switch (token.text){
        case 'class':
            this.rootState = "className";
            break;
        case 'var': 
            this.rootState= 'varDeclaration';
            this.result.variables.push({ 
                name: null, 
                type: null,
                isConst: false,
                isTransient: false,
                group: null,
            });
            break;
        case 'enum':
            this.rootState = 'enumDeclaration';
            this.result.enums.push({
                name: null,
                enumeration: [],
            });
            break;
        default:
            this.result.errors.push({ token, message: "Reached unexpected token." });
            break;
        }
    }

    parseClassName(token: Token) {
        this.result.name = token;
        this.rootState = 'classDecorators';
    }
    
    parseClassDecorators(token: Token) { 
        switch (token.text)
        {
        case 'expands':
        case 'extends':
            this.rootState = 'classParent';
            break;
            
        case 'abstract':
            this.result.isAbstract = true;
            break;

        case 'native':
            this.result.isNative = true;
            break;

        case 'nativereplication':
            this.result.isNativeReplication = true;
            break;

        case ';':
            this.rootState = null;
            break;

        case 'var':
        case 'function':
            this.result.errors.push({ token, message: `Unexpected "${token.text}", forgot a ";" after class declaration.`});
            // error recovery
            this.rootState = null;
            this.parse(token);
            break;

        default:
            this.result.errors.push({ token, message: 'Unexpected class decorator, maybe forgot a ";"'});
            break;
        }
    }

    parseClassParent(token: ParserToken) {
        this.result.parentName = token;
        this.rootState = 'classDecorators';
    }


}

function isLineComment(token: Token) {
    return token.text.startsWith("//");
}