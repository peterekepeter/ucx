
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

enum ParserState
{
    None,
    ClassName,
    ClassDecorators,
    ClassParent,
    VarDeclaration,
    VarName,
    VarNext,
    VarGroupName,
    VarGroupNext,
    EnumDeclaration,
    EnumNameParsed,
    EnumBody,
    EnumBodyParsedName,
    EnumBodyClosed,
    ConstDeclaration,
    ConstParsedName,
    ConstExpectValue,
    ConstParsedValue,
}

export class UcParser{

    rootState = ParserState.None;

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
        if (this.rootState !== ParserState.None){
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

    eofErrorMessageFrom(rootState: ParserState): string {
        let detail = '';
        switch (rootState){
        case ParserState.ClassName:
        case ParserState.ClassParent:
        case ParserState.ClassDecorators:
            detail = "Forgot to finish class declaration.";
            break;
        case ParserState.EnumBody:
        case ParserState.EnumBodyParsedName:
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
        case ParserState.None: this.parseNoneState(token); break;
        case ParserState.ClassName: this.parseClassName(token); break;   
        case ParserState.ClassDecorators: this.parseClassDecorators(token); break;
        case ParserState.ClassParent: this.parseClassParent(token); break;
        case ParserState.VarDeclaration: this.parseVarDeclaration(token); break;
        case ParserState.VarGroupName: this.parseVarGroup(token); break;
        case ParserState.VarGroupNext: this.parseVarGroupNext(token); break;
        case ParserState.VarNext: this.parseVarNext(token); break;
        case ParserState.VarName: this.parseVarName(token); break;
        case ParserState.EnumDeclaration: this.parseEnumDeclaration(token); break;
        case ParserState.EnumNameParsed: this.parseEnumNameParsed(token); break;
        case ParserState.EnumBody: this.parseEnumBody(token); break;
        case ParserState.EnumBodyParsedName: this.parseEnumBodyParedName(token); break;
        case ParserState.EnumBodyClosed: this.parseEnumBodyClosed(token); break;
        case ParserState.ConstDeclaration: this.parseConstDeclaration(token); break;
        case ParserState.ConstParsedName: this.parseConstParsedName(token); break;
        case ParserState.ConstExpectValue: this.parseConstExpectValue(token); break;
        case ParserState.ConstParsedValue: this.parseConstParsedValue(token); break;
        default:
            this.result.errors.push({ 
                token, 
                message: "Invalid parser state reached.", 
                debug: `${this.rootState} not handled`
            });
            this.rootState = ParserState.None;
            this.parseToken(token);
            break;
        }
    }

    parseConstParsedValue(token: ParserToken) {
        if (token.text === ';'){
            this.rootState = ParserState.None;
        } else {
            this.result.errors.push({ token, message: 'Expected ";" after constant declaration.' })
            this.rootState = ParserState.None;
            this.parseToken(token);
        }
    }

    parseConstExpectValue(token: ParserToken) {
        switch(token.text){
        case ';':
            this.result.errors.push({ token, message: 'Expecting constant value.' });
            this.rootState = ParserState.None;
            break;
        default:
            const constant = this.getLastConst();
            constant.value = token;
            const expressionType = getExpressionTokenType(token);
            token.classification = expressionType;
            this.rootState = ParserState.ConstParsedValue;
            break;
        }
    }

    parseConstParsedName(token: ParserToken) {
        switch (token.text)
        {
        case '=':
            this.rootState = ParserState.ConstExpectValue;
            token.classification = SemanticClass.AssignmentOperator;
            break;
        default:
            this.result.errors.push({ token, message: `Expecting "=" operator.` });
            this.rootState = ParserState.None;
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
            this.rootState = ParserState.None;
            break;
        default:
            const constant = this.getLastConst();
            token.classification = SemanticClass.ClassConstant;
            constant.name = token;
            this.rootState = ParserState.ConstParsedName;
            break;
        }
    }

    private parseEnumBodyClosed(token: ParserToken) {
        switch(token.text){
        case ';':
            this.rootState = ParserState.None;
            break;
        }
    }

    private parseEnumBodyParedName(token: ParserToken) {
        this.getLastEnum().lastToken = token;
        switch (token.text){
        case ',':
            this.rootState = ParserState.EnumBody;
            break;
        case '}':
            this.rootState = ParserState.EnumBodyClosed;
            break;
        }
    }

    private parseEnumBody(token: ParserToken) {
        if (token.text === "}") {
            this.rootState = ParserState.EnumBodyClosed;
            return;
        }
        const enumResult = this.getLastEnum();
        enumResult.enumeration.push(token);
        token.classification = SemanticClass.EnumMember,
        this.rootState = ParserState.EnumBodyParsedName;
    }
    
    private parseEnumNameParsed(token: ParserToken) {
        if (token.text === "{"){
            this.rootState = ParserState.EnumBody;
            return;
        }
    }

    private parseEnumDeclaration(token: ParserToken) {
        const result = this.getLastEnum();
        result.name = token;
        this.rootState = ParserState.EnumNameParsed;
        token.classification = SemanticClass.EnumDeclaration;
    }

    private parseVarGroupNext(token: ParserToken) {
        switch (token.text){
        case ")": 
            this.rootState = ParserState.VarDeclaration;
            break;
        default:
            this.result.errors.push({ token, message: 'Expected ")"'});
            // try to recover
            this.rootState = ParserState.VarDeclaration;
            this.parseToken(token);
            break;
        }
    }

    private parseVarGroup(token: ParserToken) {
        const variable = this.getLastVar();
        variable.group = token;
        this.rootState = ParserState.VarGroupNext;
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
            this.rootState = ParserState.None;
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
            this.rootState = ParserState.VarGroupName;
            break;
        default:
            variable.type = token;
            token.classification = SemanticClass.TypeReference;
            this.rootState = ParserState.VarName;
            break;
        }
    }
    
    private parseVarName(token: ParserToken) {
        const variable = this.result.variables[this.result.variables.length - 1];
        token.classification = SemanticClass.ClassVariable;
        variable.name = token;
        this.rootState = ParserState.VarNext;
    }

    private parseNoneState(token: Token) 
    {
        switch (token.text.toLocaleLowerCase()){
        case 'class':
            this.rootState = ParserState.ClassName;
            this.result.classFirstToken = token;
            token.classification = SemanticClass.Keyword;
            break;
        case 'var': 
            this.rootState= ParserState.VarDeclaration;
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
            this.rootState = ParserState.EnumDeclaration;
            this.result.enums.push({
                name: null,
                firstToken: token,
                lastToken: token,
                enumeration: [],
            });
            token.classification = SemanticClass.Keyword;
            break;
        case 'const':
            this.rootState = ParserState.ConstDeclaration;
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
        this.rootState = ParserState.ClassDecorators;
        token.classification = SemanticClass.ClassDeclaration;
    }
    
    private parseClassDecorators(token: Token) { 
        switch (token.text)
        {
        case 'expands':
        case 'extends':
            this.rootState = ParserState.ClassParent;
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
            this.rootState = ParserState.None;
            break;

        case 'var':
        case 'function':
            this.result.errors.push({ token, message: `Unexpected "${token.text}", forgot a ";" after class declaration.`});
            // error recovery
            this.rootState = ParserState.None;
            this.parseToken(token);
            break;

        default:
            this.result.errors.push({ token, message: 'Unexpected class decorator, maybe forgot a ";"'});
            break;
        }
    }

    private parseClassParent(token: ParserToken) {
        this.result.parentName = token;
        this.rootState = ParserState.ClassDecorators;
        token.classification = SemanticClass.ClassReference;
    }


}

function isLineComment(token: Token) {
    return token.text.startsWith("//");
}