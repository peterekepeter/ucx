
export enum SemanticClass {
    None,
    Keyword,
    Comment,
    ClassDeclaration,
    EnumDeclaration,
    ClassReference,
    ClassVariable,
    LocalVariable,
    EnumMember,
    TypeReference,
    AssignmentOperator,
    ClassConstant,
    LiteralString,
    LiteralName,
    LiteralNumber,
    Identifier,
}

export interface ParserToken
{
    text: string;
    line: number; 
    position: number;
    classification: SemanticClass
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
    group: Token | null,
    isConfig: boolean
}

export interface UnrealClassEnum
{
    name: Token | null;
    enumeration: Token[];
    firstToken: Token;
    lastToken: Token;
}

export interface UnrealClassConstant
{
    name: Token | null;
    value: Token | null;
}

export interface UnrealClass
{
    classFirstToken?: Token | null;
    classLastToken?: Token | null;
    name: Token | null
    parentName: Token | null
    isAbstract: boolean,
    isNative: boolean,
    isNativeReplication: boolean,
    errors: ParserError[],
    constants: UnrealClassConstant[]
    variables: UnrealClassVariable[]
    enums: UnrealClassEnum[]
    tokens: ParserToken[]
}

function getExpressionTokenType(token: Token) : SemanticClass
{
    const text = token.text;
    if (text.startsWith('"'))
    {
        return SemanticClass.LiteralString;
    }
    else if (text.startsWith("'"))
    {
        return SemanticClass.LiteralName;
    }
    else if (/^[0-9]/.test(text)) 
    {
        return SemanticClass.LiteralNumber;   
    }
    else if (/^[a-z_]/i) 
    {
        return SemanticClass.Identifier;
    }
    else 
    {
        return SemanticClass.None;
    }
}

type ParserRootStates = null 
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
    | 'constDeclaration'
    | 'constParsedName'
    | 'constExpectValue'
    | 'constParsedValue'
    ;

export class UcParser{

    rootState: ParserRootStates = null;

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
        constants: []
    };

    getAst() {
        return this.result;
    }

    endOfFile(line: number, position: number) {
        const token :ParserToken = {
            line, position, text:'', classification: SemanticClass.None
        };
        if (this.rootState != null){
            this.result.errors.push({ 
                token, 
                message: this.eofErrorMessageFrom(this.rootState),
                debug: `this.rootState was ${this.rootState} expected null`
            });
        }
        if (this.result.classFirstToken){
            this.result.classLastToken = token;
        }
        this.result.tokens.push(token);
    }

    eofErrorMessageFrom(rootState: ParserRootStates): string {
        let detail = '';
        switch (rootState){
        case 'className':
        case 'classParent':
        case 'classDecorators':
            detail = "Forgot to finish class declaration.";
            break;
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

    private parseToken(token: ParserToken){
        if (isLineComment(token)){
            token.classification = SemanticClass.Comment;
            return;
        }
        switch(this.rootState)
        {
        case null: this.parseNullState(token); break;
        case "className": this.parseClassName(token); break;   
        case "classDecorators": this.parseClassDecorators(token); break;
        case "classParent": this.parseClassParent(token); break;
        case "varDeclaration": this.parseVarDeclaration(token); break;
        case "varGroupName": this.parseVarGroup(token); break;
        case "varGroupNext": this.parseVarGroupNext(token); break;
        case "varNext": this.parseVarNext(token); break;
        case "varName": this.parseVarName(token); break;
        case "enumDeclaration": this.parseEnumDeclaration(token); break;
        case "enumNameParsed": this.parseEnumNameParsed(token); break;
        case "enumBody": this.parseEnumBody(token); break;
        case "enumBodyParsedName": this.parseEnumBodyParedName(token); break;
        case "enumBodyClosed": this.parseEnumBodyClosed(token); break;
        case "constDeclaration": this.parseConstDeclaration(token); break;
        case "constParsedName": this.parseConstParsedName(token); break;
        case "constExpectValue": this.parseConstExpectValue(token); break;
        case "constParsedValue": this.parseConstParsedValue(token); break;
        default:
            this.result.errors.push({ 
                token, 
                message: "Invalid parser state reached.", 
                debug: `${this.rootState} not handled`
            });
            this.rootState = null;
            this.parseToken(token);
            break;
        }
    }

    parseConstParsedValue(token: ParserToken) {
        if (token.text === ';'){
            this.rootState = null;
        } else {
            this.result.errors.push({ token, message: 'Expected ";" after constant declaration.' })
            this.rootState = null;
            this.parseToken(token);
        }
    }

    parseConstExpectValue(token: ParserToken) {
        switch(token.text){
        case ';':
            this.result.errors.push({ token, message: 'Expecting constant value.' });
            this.rootState = null;
            break;
        default:
            const constant = this.getLastConst();
            constant.value = token;
            const expressionType = getExpressionTokenType(token);
            token.classification = expressionType;
            this.rootState = 'constParsedValue';
            break;
        }
    }

    parseConstParsedName(token: ParserToken) {
        switch (token.text)
        {
        case '=':
            this.rootState = 'constExpectValue';
            token.classification = SemanticClass.AssignmentOperator;
            break;
        default:
            this.result.errors.push({ token, message: `Expecting "=" operator.` });
            this.rootState = null;
            break;
        }
    }
    parseConstDeclaration(token: ParserToken) {
        switch (token.text) {
        case ';':
            this.result.errors.push({ 
                token, 
                message: "Expected constant name."
            });
            this.rootState = null;
            break;
        default:
            const constant = this.getLastConst();
            token.classification = SemanticClass.ClassConstant;
            constant.name = token;
            this.rootState = "constParsedName";
            break;
        }
    }

    private parseEnumBodyClosed(token: ParserToken) {
        switch(token.text){
        case ';':
            this.rootState = null;
            break;
        }
    }

    private parseEnumBodyParedName(token: ParserToken) {
        this.getLastEnum().lastToken = token;
        switch (token.text){
        case ',':
            this.rootState = 'enumBody';
            break;
        case '}':
            this.rootState = 'enumBodyClosed';
            break;
        }
    }

    private parseEnumBody(token: ParserToken) {
        if (token.text === "}") {
            this.rootState = "enumBodyClosed";
            return;
        }
        const enumResult = this.getLastEnum();
        enumResult.enumeration.push(token);
        token.classification = SemanticClass.EnumMember,
        this.rootState = 'enumBodyParsedName';
    }
    
    private parseEnumNameParsed(token: ParserToken) {
        if (token.text === "{"){
            this.rootState = "enumBody";
            return;
        }
    }

    private parseEnumDeclaration(token: ParserToken) {
        const result = this.getLastEnum();
        result.name = token;
        this.rootState = 'enumNameParsed';
        token.classification = SemanticClass.EnumDeclaration;
    }

    private parseVarGroupNext(token: ParserToken) {
        switch (token.text){
        case ")": 
            this.rootState = 'varDeclaration';
            break;
        default:
            this.result.errors.push({ token, message: 'Expected ")"'});
            // try to recover
            this.rootState = 'varDeclaration';
            this.parseToken(token);
            break;
        }
    }

    private parseVarGroup(token: ParserToken) {
        const variable = this.getLastVar();
        variable.group = token;
        this.rootState = 'varGroupNext';
    }

    private getLastVar() : UnrealClassVariable {
        return this.result.variables[this.result.variables.length - 1];
    }

    private getLastEnum() : UnrealClassEnum {
        return this.result.enums[this.result.enums.length - 1];
    }

    private getLastConst() : UnrealClassConstant {
        return this.result.constants[this.result.constants.length - 1];
    }

    private parseVarNext(token: ParserToken) {
        switch(token.text){
        case ';':
            this.rootState = null;
            break;
        default:
            this.result.errors.push({token, message: 'Expecting ";" after variable name.'});
            break;
        }
    }

    private parseVarDeclaration(token: ParserToken) {
        const variable = this.result.variables[this.result.variables.length - 1];
        switch (token.text){
        case 'transient': 
            variable.isTransient = true;
            token.classification = SemanticClass.Keyword;
            break;
        case 'const':
            variable.isConst = true;
            token.classification = SemanticClass.Keyword;
            break;
        case 'config':
            variable.isConfig = true;
            token.classification = SemanticClass.Keyword;
            break;
        case '(':
            this.rootState = "varGroupName";
            break;
        default:
            variable.type = token;
            token.classification = SemanticClass.TypeReference;
            this.rootState = "varName";
            break;
        }
    }
    
    private parseVarName(token: ParserToken) {
        const variable = this.result.variables[this.result.variables.length - 1];
        token.classification = SemanticClass.ClassVariable;
        variable.name = token;
        this.rootState = "varNext";
    }

    private parseNullState(token: Token) 
    {
        switch (token.text.toLocaleLowerCase()){
        case 'class':
            this.rootState = "className";
            this.result.classFirstToken = token;
            token.classification = SemanticClass.Keyword;
            break;
        case 'var': 
            this.rootState= 'varDeclaration';
            this.result.variables.push({ 
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
            this.rootState = 'enumDeclaration';
            this.result.enums.push({
                name: null,
                firstToken: token,
                lastToken: token,
                enumeration: [],
            });
            token.classification = SemanticClass.Keyword;
            break;
        case 'const':
            this.rootState = 'constDeclaration';
            this.result.constants.push({
                name: null, 
                value: null
            });
            token.classification = SemanticClass.Keyword;
            break;
        default:
            this.result.errors.push({ token, message: "Reached unexpected token." });
            break;
        }
    }

    private parseClassName(token: Token) {
        this.result.name = token;
        this.rootState = 'classDecorators';
        token.classification = SemanticClass.ClassDeclaration;
    }
    
    private parseClassDecorators(token: Token) { 
        switch (token.text)
        {
        case 'expands':
        case 'extends':
            this.rootState = 'classParent';
            token.classification = SemanticClass.Keyword;
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
            this.parseToken(token);
            break;

        default:
            this.result.errors.push({ token, message: 'Unexpected class decorator, maybe forgot a ";"'});
            break;
        }
    }

    private parseClassParent(token: ParserToken) {
        this.result.parentName = token;
        this.rootState = 'classDecorators';
        token.classification = SemanticClass.ClassReference;
    }


}

function isLineComment(token: Token) {
    return token.text.startsWith("//");
}