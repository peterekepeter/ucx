// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ucTokenizeLine } from './lib/tokenizer/ucTokenizeLine';
import { ParserToken, SemanticClass, UcParser, UnrealClass } from './lib/parser';
import { LintResult } from './lib/lint/LintResult';
import { FullLinterConfig } from './lib/lint/buildFullLinter';
import { lintAst } from './lib/lint';
import { DEFAULT_AST_LINTER_CONFIGURATION as DEFAULT_A } from './lib/lint/ast-rules';
import { parseIndentationType } from './lib/lint/indentation';
import { DEFAULT_TOKEN_BASED_LINTER_CONFIGURATION as DEFAULT_T } from './lib/lint/token-rules';
import { UnrealDefaultProperty } from './lib/parser/ast';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Extension "ucx" is now active!');

    const disposables = context.subscriptions;

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    disposables.push(vscode.commands.registerCommand('ucx.helloWorld', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World from ucx!');
    }));

    // formatter implemented using API
    disposables.push(vscode.languages.registerDocumentFormattingEditProvider('unrealscript', {
        provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
            const vscodeConfig = vscode.workspace.getConfiguration("ucx");
            const config = parseConfiguration(vscodeConfig);
            const edits = new Array<vscode.TextEdit>();
            processFormattingRules(document, edits, config);
            return edits;
        }
    }));

    // https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide
    const standardTokenTypes = [
        'namespace', // 	For identifiers that declare or reference a namespace, module, or package.
        'class', // 	For identifiers that declare or reference a class type.
        'enum', // 	For identifiers that declare or reference an enumeration type.
        'interface', // 	For identifiers that declare or reference an interface type.
        'struct', // 	For identifiers that declare or reference a struct type.
        'typeParameter', // 	For identifiers that declare or reference a type parameter.
        'type', // 	For identifiers that declare or reference a type that is not covered above.
        'parameter', // 	For identifiers that declare or reference a function or method parameters.
        'variable', // 	For identifiers that declare or reference a local or global variable.
        'property', // 	For identifiers that declare or reference a member property, member field, or member variable.
        'enumMember', // 	For identifiers that declare or reference an enumeration property, constant, or member.
        'decorator', // 	For identifiers that declare or reference decorators and annotations.
        'event', // 	For identifiers that declare an event property.
        'function', // 	For identifiers that declare a function.
        'method', // 	For identifiers that declare a member function or method.
        'macro', // 	For identifiers that declare a macro.
        'label', // 	For identifiers that declare a label.
        'comment', // 	For tokens that represent a comment.
        'string', // 	For tokens that represent a string literal.
        'keyword', // 	For tokens that represent a language keyword.
        'number', // 	For tokens that represent a number literal.
        'regexp', // 	For tokens that represent a regular expression literal.
        'operator', // 	For tokens that represent an operator.
    ];

    const standardModifiers = [
        'declaration', //   For declarations of symbols.
        'definition', //    For definitions of symbols, for example, in header files.
        'readonly', //  For readonly variables and member fields (constants).
        'static', //    For class members (static members).
        'deprecated', //    For symbols that should no longer be used.
        'abstract', //  For types and member functions that are abstract.
        'async', // For functions that are marked async.
        'modification', //  For variable references where the variable is assigned to.
        'documentation', // For occurrences of symbols in documentation.
        'defaultLibrary', //    For symbols that are part of the standard library.
    ];

    const TOKEN_TYPE_KEYWORD = standardTokenTypes.indexOf('keyword');
    const TOKEN_TYPE_COMMENT = standardTokenTypes.indexOf('comment');
    const TOKEN_TYPE_VARIABLE = standardTokenTypes.indexOf('variable');
    const TOKEN_TYPE_PROPERTY = standardTokenTypes.indexOf('property');
    const TOKEN_TYPE_ENUM_MEMBER = standardTokenTypes.indexOf('enumMember');
    const TOKEN_TYPE_ENUM = standardTokenTypes.indexOf('enum');
    const TOKEN_TYPE_CLASS = standardTokenTypes.indexOf('class');
    const TOKEN_TYPE_STRUCT = standardTokenTypes.indexOf('struct');
    const TOKEN_TYPE_TYPE = standardTokenTypes.indexOf('type');
    const TOKEN_TYPE_OPERATOR = standardTokenTypes.indexOf('operator');
    const TOKEN_TYPE_STRING = standardTokenTypes.indexOf('string');
    const TOKEN_TYPE_NUMBER = standardTokenTypes.indexOf('number');
    const TOKEN_TYPE_FUNCTION = standardTokenTypes.indexOf('method');
    const TOKEN_TYPE_MACRO = standardTokenTypes.indexOf('macro');
    const TOKEN_TYPE_LABEL = standardTokenTypes.indexOf('label');

    const TOKEN_MODIFIER_DECLARATION = standardModifiers.indexOf('declaration');
    const TOKEN_MODIFIER_READONLY = standardModifiers.indexOf('readonly');
    
    const legend = new vscode.SemanticTokensLegend(standardTokenTypes, standardModifiers);

    disposables.push(vscode.languages.registerDocumentSemanticTokensProvider('unrealscript', {
        provideDocumentSemanticTokens(document, cancellation) {     
            const ast = getAst(document, cancellation);
            const tokensBuilder = new vscode.SemanticTokensBuilder(legend);
            // on line 1, characters 1-5 are a class declaration
            for (const token of ast.tokens){
                let type: number | undefined = undefined;
                let modifier: number | undefined = undefined;
                switch(token.type){
                case SemanticClass.Comment: 
                    type = TOKEN_TYPE_COMMENT; 
                    break;
                case SemanticClass.ModifierKeyword:
                case SemanticClass.Keyword: 
                    type = TOKEN_TYPE_KEYWORD; 
                    break;
                case SemanticClass.StructMember:
                case SemanticClass.StructMemberDeclaration:
                    type = TOKEN_TYPE_PROPERTY;
                    modifier = TOKEN_MODIFIER_DECLARATION;
                    break;
                case SemanticClass.ClassVariable: 
                    type = TOKEN_TYPE_PROPERTY; 
                    break;
                case SemanticClass.EnumMember: 
                    type = TOKEN_TYPE_ENUM_MEMBER; 
                    break;
                case SemanticClass.EnumDeclaration: 
                    type = TOKEN_TYPE_ENUM; 
                    modifier = TOKEN_MODIFIER_DECLARATION;
                    break;
                case SemanticClass.StructDeclaration:
                    type = TOKEN_TYPE_STRUCT; 
                    modifier = TOKEN_MODIFIER_DECLARATION;
                    break;
                case SemanticClass.ClassDeclaration: 
                    type = TOKEN_TYPE_CLASS; 
                    modifier = TOKEN_MODIFIER_DECLARATION;
                    break;
                case SemanticClass.ClassReference: 
                    type = TOKEN_TYPE_CLASS; 
                    break;
                case SemanticClass.TypeReference:
                    type = TOKEN_TYPE_TYPE;
                    break;
                case SemanticClass.Operator:
                case SemanticClass.AssignmentOperator:
                    type = TOKEN_TYPE_OPERATOR;
                    break;
                case SemanticClass.ClassConstant:
                    type = TOKEN_TYPE_PROPERTY;
                    modifier = TOKEN_MODIFIER_READONLY;
                    break;
                case SemanticClass.ObjectReferenceName:
                    type = TOKEN_TYPE_STRING;
                    break;
                case SemanticClass.LiteralName:
                    type = TOKEN_TYPE_STRING;
                    break;
                case SemanticClass.LiteralString:
                    // skip, tmGrammer has better highlight for escapes
                    // type = TOKEN_TYPE_STRING;
                    break;
                case SemanticClass.LiteralNumber:
                    type = TOKEN_TYPE_NUMBER;
                    break;
                case SemanticClass.FunctionDeclaration:
                    modifier = TOKEN_MODIFIER_DECLARATION;
                case SemanticClass.FunctionReference:
                    type = TOKEN_TYPE_FUNCTION;
                    break;
                case SemanticClass.LocalVariable:
                    type = TOKEN_TYPE_VARIABLE;
                    break;
                case SemanticClass.VariableReference:
                    type = TOKEN_TYPE_VARIABLE;
                    break;
                case SemanticClass.ExecInstruction:
                    // skip this until tmGrammar has proper syntax
                    // type = TOKEN_TYPE_MACRO;
                    break;
                case SemanticClass.LanguageConstant:
                    // skip for now, tmGrammar identifies this type of constant
                    // type = TOKEN_TYPE_KEYWORD;
                    break;
                case SemanticClass.StatementLabel:
                    type = TOKEN_TYPE_LABEL;
                    break;
                }
                if (type !== undefined){
                    tokensBuilder.push(
                        token.line, token.position, token.text.length, type, modifier
                    );
                }
            }
            return tokensBuilder.build();
        }
    }, legend));

    disposables.push(vscode.languages.registerDocumentSymbolProvider('unrealscript', {
        provideDocumentSymbols(document, cancellation){
            const ast = getAst(document, cancellation);
            return getSymbolsFromAst(ast, document.uri);
        }
    }));

    disposables.push(vscode.languages.registerDefinitionProvider('unrealscript', {
        provideDefinition(document, position, cancellation) {
            const ast = getAst(document, cancellation);
            const line = position.line;
            const character = position.character;
            var target: ParserToken | null = null;
            for (const token of ast.tokens){
                if (token.line === line && 
                    token.position <= character && 
                    character <= token.position + token.text.length)
                {
                    target = token;
                    break;
                }
            }
            if (!target) {
                return null;
            }
            for (const variable of ast.variables){
                if (variable.name?.textLower === target.textLower){
                    return { 
                        range: rangeFromToken(variable.name),
                        uri: document.uri
                    };
                }
            }
            for (const fn of ast.functions) {
                if (fn.name?.textLower === target.textLower) {
                    return {
                        range: rangeFromToken(fn.name),
                        uri: document.uri
                    };
                }
            }
            return null;
        },
    }));

    const symbolCache = new class SymbolCache {
        store: Record<string, { 
            symbolsVersion: number;
            symbols: vscode.SymbolInformation[]; 
        }> = {};

        getSymbols(key: string, fileVersion: number) {
            const entry = this.store[key];
            if (!entry || entry.symbolsVersion < fileVersion) 
                return null;
            return entry.symbols;
        }

        putSymbols(key: string, symbolsVersion: number, symbols: vscode.SymbolInformation[]) {
            const entry = this.store[key];
            this.store[key] = { ...entry, symbols, symbolsVersion };
        }
    };

    disposables.push(vscode.languages.registerWorkspaceSymbolProvider({
        async provideWorkspaceSymbols(query, token){
            const regex = new RegExp(query.split('').join('.*?'), 'i');
            const files = await vscode.workspace.findFiles("**/*.uc");
            const results = new Array<Array<vscode.SymbolInformation>>();
            for (const file of files)
            {
                if (token.isCancellationRequested) {
                    return results.flat();
                }
                const stats = await vscode.workspace.fs.stat(file);
                const fileVersion = stats.mtime;
                const cacheKey = file.toString();
                const cached = symbolCache.getSymbols(cacheKey, fileVersion);
                if (cached) {
                    results.push(cached.filter(c => regex.test(c.name)));
                }
                else {
                    const array = await vscode.workspace.fs.readFile(file);
                    const str = Buffer.from(array).toString('utf8');
                    const ast = getAst(str, token);
                    const symbols = getSymbolsFromAst(ast, file);
                    symbolCache.putSymbols(cacheKey, fileVersion, symbols);
                    results.push(symbols.filter(c => regex.test(c.name)));
                }
            }
            const result = results.flat();
            return result;
        },
    }));

    function getSymbolsFromAst(ast: UnrealClass, uri: vscode.Uri): vscode.SymbolInformation[] {
        const result: vscode.SymbolInformation[] = []; 
        let mainContainer = '';
        if (ast.name) {
            result.push(new vscode.SymbolInformation(
                ast.name.text,
                vscode.SymbolKind.Class,
                "",
                new vscode.Location(uri, 
                    rangeFromTokens(
                        ast.classDeclarationFirstToken ?? ast.name, 
                        ast.classDeclarationLastToken ?? ast.name
                    ))
            ));
        }
        for (const constant of ast.constants) {
            if (!constant.name) { continue };
            result.push(new vscode.SymbolInformation(
                constant.name.text,
                vscode.SymbolKind.Constant,
                mainContainer,
                new vscode.Location(uri, rangeFromTokens(constant.name, constant.name))
            ));
        }
        for (const struct of ast.structs) {
            if (!struct.name) { continue };
            const structName = struct.name.text;
            result.push(new vscode.SymbolInformation(
                structName,
                vscode.SymbolKind.Struct,
                mainContainer,
                new vscode.Location(uri, rangeFromTokens(
                    struct.name, struct.bodyLastToken ?? struct.name))
            ));
            for (const member of struct.members) {
                if (!member.name) { continue };
                result.push(new vscode.SymbolInformation(
                    member.name.text,
                    vscode.SymbolKind.Variable,
                    structName,
                    new vscode.Location(uri, rangeFromTokens(
                        member.firstToken ?? member.name, 
                        member.lastToken ?? member.name,
                    ))
                ));
            }
        }
        for (const enumDeclaration of ast.enums){
            if (!enumDeclaration.name) { continue };
            const enumName = enumDeclaration.name;
            result.push(new vscode.SymbolInformation(
                enumDeclaration.name.text,
                vscode.SymbolKind.Enum,
                mainContainer,
                new vscode.Location(
                    uri,
                    rangeFromTokens(
                        enumDeclaration.firstToken, 
                        enumDeclaration.lastToken)
                )
            ));
            for (const enumItem of enumDeclaration.enumeration){
                result.push(new vscode.SymbolInformation(
                    enumItem.text,
                    vscode.SymbolKind.EnumMember,
                    enumName.text, 
                    new vscode.Location(
                        uri,
                        rangeFromTokens(enumItem, enumItem)
                    )
                ));
            }
        }
        for (const varDeclaration of ast.variables){
            if (!varDeclaration.name) { continue };
            result.push(new vscode.SymbolInformation(
                varDeclaration.name.text,
                vscode.SymbolKind.Variable,
                mainContainer,
                new vscode.Location(
                    uri,
                    rangeFromTokens(varDeclaration.name, varDeclaration.name)
                )
            ));
        }
        for (const fnDecl of ast.functions) {
            if (!fnDecl.name) { continue };
            result.push(new vscode.SymbolInformation(
                fnDecl.name.text,
                vscode.SymbolKind.Function,
                mainContainer,
                new vscode.Location(
                    uri,
                    rangeFromTokens(
                        fnDecl.name,
                        fnDecl.bodyLastToken ?? fnDecl.fnArgsLastToken ?? fnDecl.name)
                )
            ));
        }
        for (const state of ast.states) {
            const stateNameToken = state.name;
            if (!stateNameToken) { continue };
            const stateName = stateNameToken.text;
            result.push(new vscode.SymbolInformation(
                stateName,
                vscode.SymbolKind.Class,
                mainContainer,
                new vscode.Location(
                    uri,
                    rangeFromTokens(
                        stateNameToken,
                        state.bodyLastToken ?? stateNameToken,
                    )
                )
            ));
            for (const fnDecl of state.functions) {
                if (!fnDecl.name) { continue };
                result.push(new vscode.SymbolInformation(
                    fnDecl.name.text,
                    vscode.SymbolKind.Function,
                    stateName,
                    new vscode.Location(
                        uri, 
                        rangeFromTokens(
                            fnDecl.name, fnDecl.bodyLastToken ?? fnDecl.fnArgsLastToken ?? fnDecl.name
                        )
                    )
                ));
            }
        }
        if (ast.defaultPropertiesFirstToken && ast.defaultPropertiesLastToken) {
            const section = 'defaultproperties';
            result.push(new vscode.SymbolInformation( 
                section,
                vscode.SymbolKind.Namespace,
                mainContainer,
                new vscode.Location(
                    uri,
                    rangeFromTokens(
                        ast.defaultPropertiesFirstToken,
                        ast.defaultPropertiesLastToken
                    )
                )
            ));
            if (ast.defaultProperties.length > 0) {
                let consecutiveFirstProp: UnrealDefaultProperty = ast.defaultProperties[0];
                let consecutiveLastProp: UnrealDefaultProperty = ast.defaultProperties[0];
                const emit = () => { 
                    if (consecutiveFirstProp.name)
                    {
                        result.push(new vscode.SymbolInformation( 
                            consecutiveFirstProp.name.text,
                            vscode.SymbolKind.Constant,
                            section,
                            new vscode.Location(
                                uri,
                                rangeFromTokens(
                                    consecutiveFirstProp.name,
                                    consecutiveLastProp.name ?? consecutiveFirstProp.name,
                                )
                            )
                        ));
                    }
                };

                for (const defprop of ast.defaultProperties) {
                    if (!defprop.name) { continue };
                    if (consecutiveLastProp.name?.text === defprop.name?.text) {
                        consecutiveLastProp = defprop;
                        continue; 
                    }
                    else {
                        emit();
                        consecutiveFirstProp = defprop;
                        consecutiveLastProp = defprop;
                    }
                }

                emit();

            }
        }
        for (const replication of ast.replicationBlocks) {
            const section = 'replication';
            result.push(new vscode.SymbolInformation(
                section,
                vscode.SymbolKind.Namespace,
                mainContainer,
                new vscode.Location(uri, rangeFromTokens(
                    replication.firstToken,
                    replication.lastToken
                ))
            ));
            for (const statement of replication.statements) {
                for (const target of statement.targets) {
                    result.push(new vscode.SymbolInformation(
                        target.text,
                        vscode.SymbolKind.Null,
                        section,
                        new vscode.Location(uri, rangeFromToken(target))
                    ));
                }
            }
        }
        return result;
    }

    function rangeFromToken(a: ParserToken): vscode.Range {
        return rangeFromTokens(a,a);
    }

    function rangeFromTokens(a: ParserToken,b: ParserToken): vscode.Range{
        return new vscode.Range(
            firstPositionFromToken(a),
            lastPositionFromToken(b)
        );
    }

    function firstPositionFromToken(a: ParserToken): vscode.Position {
        return new vscode.Position(a.line, a.position);
    }
    
    function lastPositionFromToken(a: ParserToken): vscode.Position {
        return new vscode.Position(a.line, a.position + a.text.length);
    }

    const diagnosticCollection = vscode.languages.createDiagnosticCollection('ucx');
    context.subscriptions.push(diagnosticCollection);

    disposables.push(vscode.workspace.onDidChangeTextDocument(event => { 
        if (event.document.languageId === 'unrealscript'){
            const vscodeConfig = vscode.workspace.getConfiguration("ucx");
            const config = parseConfiguration(vscodeConfig);
            const diagnositcs = [...getDiagnostics(event.document, config)];
            diagnosticCollection.set(event.document.uri, diagnositcs);

            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document === event.document && config.overrideEditorIndentationStyle) {
                editor.options = getEditorOptions(config);
            }
        }
    }));

}

// this method is called when your extension is deactivated
export function deactivate() {}

function* getDiagnostics(document: vscode.TextDocument, config: ExtensionConfiguration): Iterable<vscode.Diagnostic> {
    

    for (const lintResult of processLinterRules(document, config)){
        if (!config.showErrors && lintResult.severity === 'error') {
            continue;
        }
        if (!config.showWarnings && lintResult.severity !== 'error') {
            continue;
        }
        if (lintResult.message != null && 
            lintResult.line != null &&
            lintResult.position != null &&
            lintResult.length != null)
        {
            const begin  = new vscode.Position(lintResult.line, lintResult.position);
            const end = new vscode.Position(lintResult.line, lintResult.position + lintResult.length);
            yield {
                message: lintResult.message,
                range: new vscode.Range(begin, end),
                severity: lintResult.severity === 'error' 
                    ? vscode.DiagnosticSeverity.Error
                    : vscode.DiagnosticSeverity.Warning,
                source: 'ucx'
            };
        }
    }
}

function processLinterRules(document: vscode.TextDocument, config: ExtensionConfiguration): Iterable<LintResult> {
    const ast = getVsCodeDocumentAst(document);
    return lintAst(ast, config.linterConfiguration);
}

function getVsCodeDocumentAst(document: vscode.TextDocument): UnrealClass {
    const parser = new UcParser();
    const lines = new Array<string>(document.lineCount);
    for (let lineIndex=0; lineIndex < document.lineCount; lineIndex++){
        const line = document.lineAt(lineIndex);
        lines[lineIndex] = line.text;
        const lineTokens = ucTokenizeLine(line.text);
        for (const token of lineTokens){
            parser.parse(lineIndex, token.position, token.text);
        }
    }
    parser.endOfFile(document.lineCount, 0);
    const ast = parser.getAst();
    ast.fileName = document.fileName;
    ast.textLines = lines;
    return ast;
}

function processFormattingRules(document: vscode.TextDocument, edits: vscode.TextEdit[], configuration: ExtensionConfiguration){
    for (const result of processLinterRules(document, configuration)){
        if (result.fixedText == null || result.position == null || result.line == null || result.length == null){
            continue;
        }
        if (result.length === 0) {
            const position = new vscode.Position(result.line, result.position);
            edits.push(vscode.TextEdit.insert(position, result.fixedText));
        } else if (result.fixedText === '') {
            let start = new vscode.Position(result.line, result.position);
            let end = new vscode.Position(result.line, result.position + result.length);
            const lineText = document.lineAt(result.line).text;
            if (end.character >= lineText.length){
                end = new vscode.Position(result.line + 1, 0);
                // cannot touch whitespace befer the default prop it can interfere with indent change
                // if (isWhitepace(lineText.substring(0, result.position))){
                //     start = new vscode.Position(result.line, 0);
                // }
            }
            edits.push(vscode.TextEdit.delete(new vscode.Range(start, end)));
        } else {
            const start = new vscode.Position(result.line, result.position);
            const end = new vscode.Position(result.line, result.position + result.length);
            edits.push(vscode.TextEdit.replace(new vscode.Range(start, end), result.fixedText));
        } 
    }
}

function getAst(document: vscode.TextDocument | string, cancellation: vscode.CancellationToken) {
    if (typeof document === 'string') {
        return getAstFromString(document);
    } else {
        return getAstFromDocument(document, cancellation);
    }
}

function getAstFromDocument(document: vscode.TextDocument, cancellation: vscode.CancellationToken) {
    const parser = new UcParser();
    for (let lineIndex=0; lineIndex < document.lineCount; lineIndex++){
        const line = document.lineAt(lineIndex);
        const lineTokens = ucTokenizeLine(line.text);
        for (const token of lineTokens) {
            parser.parse(lineIndex, token.position, token.text);
        }
        if (cancellation.isCancellationRequested){
            return parser.getAst();
        }
    }
    parser.endOfFile(document.lineCount, 0);
    return parser.getAst();
}

function getAstFromString(input: string) : UnrealClass {
    const parser = new UcParser();
    const lines = input.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        for (const token of ucTokenizeLine(lines[i])) {
            parser.parse(i, token.position, token.text);
        }
    }
    parser.endOfFile(lines.length, 0);
    return parser.result;
}

type ExtensionConfiguration =
{
    showErrors: boolean,
    showWarnings: boolean,
    overrideEditorIndentationStyle: boolean,
    linterConfiguration: FullLinterConfig,
};

function parseConfiguration(cfg: vscode.WorkspaceConfiguration): ExtensionConfiguration {
    return {
        showErrors: 
            cfg.get('showErrors') ?? true,
        showWarnings: 
            cfg.get('showWarnings') ?? true,
        overrideEditorIndentationStyle: 
            cfg.get('overrideEditorIndentationStyle') ?? true,
        linterConfiguration: {
            linterEnabled: 
                cfg.get('linter.enabled') ?? DEFAULT_A.linterEnabled,
            classNamingRule: 
                cfg.get('linter.classNamingRule.enabled') ?? DEFAULT_A.classNamingRule,
            controlConditionSpacing: 
                cfg.get('linter.controlConditionSpacing.enabled') ?? DEFAULT_A.controlConditionSpacing,
            emptyLineBeforeFunctionEnabled:
                cfg.get('linter.emptyLineBeforeFunction.enabled') ?? DEFAULT_A.emptyLineBeforeFunctionEnabled,
            indentEnabled:
                cfg.get('linter.indentation.enabled') ?? DEFAULT_A.indentEnabled,
            indentType:
                parseIndentationType(cfg.get<string>('linter.indentation.style')) ?? DEFAULT_A.indentType,
            operatorSpacingEnabled:
                cfg.get('linter.operatorSpacing.enabled') ?? DEFAULT_A.operatorSpacingEnabled,
            redundantDefaultValue:
                cfg.get('linter.redundantDefaultValue.enabled') ?? DEFAULT_A.redundantDefaultValue,
            semicolorFixEnabled:
                cfg.get('linter.semicolonFix.enabled') ?? DEFAULT_A.semicolorFixEnabled,
            enableBracketSpacingRule:
                cfg.get('linter.bracketSpacingRule.enabled') ?? DEFAULT_T.enableBracketSpacingRule,
            enableValidateStringRule:
                cfg.get('linter.validateStringRule.enabled') ?? DEFAULT_T.enableKeywordCasingRule,
            enableValidateNamesRule:
                cfg.get('linter.validateNamesRule.enabled') ?? DEFAULT_T.enableValidateNamesRule,
            enableKeywordCasingRule:
                cfg.get('linter.keywordCasingRule.enabled') ?? DEFAULT_T.enableValidateStringRule,
        }
    };
}

function getEditorOptions(config: ExtensionConfiguration): vscode.TextEditorOptions {
    const indentType = config.linterConfiguration.indentType;
    switch (indentType)
    {
    case '\t': 
        return { insertSpaces: false };
    default: 
        return { insertSpaces: true, tabSize: indentType.length };
    }
}
