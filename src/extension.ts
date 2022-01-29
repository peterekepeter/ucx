// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { LintResult } from './lib/LintResult';
import { ALL_RULES } from './lib/rules';
import { KeywordFormatRule } from './lib/rules/KeywordFormatRule';
import { ucTokenizeLine } from './lib/tokenizer/ucTokenizeLine';
import { TokenBasedLinter } from './lib/TokenBasedLinter';
import { ParserToken, SemanticClass, UcParser } from './lib/parser';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Extension "uclint" is now active!');

    const tokenRules = ALL_RULES;

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('uclint.helloWorld', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World from uclint!');
    });
    context.subscriptions.push(disposable);

    // formatter implemented using API
    vscode.languages.registerDocumentFormattingEditProvider('unrealscript', {
        provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
            const edits = new Array<vscode.TextEdit>();
            processFormattingRules(document, edits, tokenRules);
            insertSemicolonEndOfLine(document, edits);
            return edits;
        }
    });

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
    const TOKEN_TYPE_TYPE = standardTokenTypes.indexOf('type');
    const TOKEN_TYPE_OPERATOR = standardTokenTypes.indexOf('operator');
    const TOKEN_TYPE_STRING = standardTokenTypes.indexOf('string');
    const TOKEN_TYPE_NUMBER = standardTokenTypes.indexOf('number');
    const TOKEN_TYPE_FUNCTION = standardTokenTypes.indexOf('method');

    const TOKEN_MODIFIER_DECLARATION = standardModifiers.indexOf('declaration');
    const TOKEN_MODIFIER_READONLY = standardModifiers.indexOf('readonly');
    
    const legend = new vscode.SemanticTokensLegend(standardTokenTypes, standardModifiers);

    vscode.languages.registerDocumentSemanticTokensProvider('unrealscript', {
        provideDocumentSemanticTokens(document, cancellation) {     
            const ast = getAst(document, cancellation);
            const tokensBuilder = new vscode.SemanticTokensBuilder(legend);
            // on line 1, characters 1-5 are a class declaration
            for (const token of ast.tokens){
                let type: number | undefined;
                let modifier: number | undefined = undefined;
                switch(token.classification){
                case SemanticClass.Comment: 
                    type = TOKEN_TYPE_COMMENT; 
                    break;
                case SemanticClass.Keyword: 
                    type = TOKEN_TYPE_KEYWORD; 
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
                case SemanticClass.AssignmentOperator:
                    type = TOKEN_TYPE_OPERATOR;
                    break;
                case SemanticClass.ClassConstant:
                    type = TOKEN_TYPE_PROPERTY;
                    modifier = TOKEN_MODIFIER_READONLY;
                    break;
                case SemanticClass.LiteralName:
                case SemanticClass.LiteralString:
                    type = TOKEN_TYPE_STRING;
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
                }
                if (type !== undefined){
                    tokensBuilder.push(
                        token.line, token.position, token.text.length, type, modifier
                    );
                }
            }
            return tokensBuilder.build();
        }
    }, legend);

    vscode.languages.registerDocumentSymbolProvider('unrealscript', {
        provideDocumentSymbols(document, cancellation){
            const ast = getAst(document, cancellation);
            const result: vscode.SymbolInformation[] = []; 
            let classContainer = '';
            if (ast.name && ast.classFirstToken && ast.classLastToken){
                result.push(new vscode.SymbolInformation(
                    ast.name.text,
                    vscode.SymbolKind.Class,
                    "",
                    new vscode.Location(
                        document.uri, 
                        rangeFromTokens(ast.classFirstToken, ast.classLastToken)
                    )
                ));
                classContainer = ast.name.text;
            }
            for (const enumDeclaration of ast.enums){
                if (!enumDeclaration.name){
                    return;
                }
                const enumName = enumDeclaration.name;
                result.push(new vscode.SymbolInformation(
                    enumDeclaration.name.text,
                    vscode.SymbolKind.Enum,
                    classContainer,
                    new vscode.Location(
                        document.uri,
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
                            document.uri,
                            rangeFromTokens(enumItem, enumItem)
                        )
                    ));
                }
            }
            for (const varDeclaration of ast.variables){
                if (!varDeclaration.name){
                    continue;
                }
                result.push(new vscode.SymbolInformation(
                    varDeclaration.name.text,
                    vscode.SymbolKind.Variable,
                    classContainer,
                    new vscode.Location(
                        document.uri,
                        rangeFromTokens(varDeclaration.name, varDeclaration.name)
                    )
                ));
            }
            return result;
        }
    });

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

    const diagnosticCollection = vscode.languages.createDiagnosticCollection('uclint');
    context.subscriptions.push(diagnosticCollection);

    vscode.workspace.onDidChangeTextDocument(event => { 
        console.log('change!');
        if (event.document.languageId === 'unrealscript'){
            const diagnositcs = [...getDiagnostics(event.document, tokenRules)];
            diagnosticCollection.set(event.document.uri, diagnositcs);
        }
    });

}

// this method is called when your extension is deactivated
export function deactivate() {}

function* getDiagnostics(document: vscode.TextDocument, tokenRules: TokenBasedLinter[]): Iterable<vscode.Diagnostic> {
    for (const lintResult of processLinterRules(document, tokenRules)){
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
                source: 'uclint'
            };
        }
    }
}

function* processLinterRules(document: vscode.TextDocument, tokenRules: TokenBasedLinter[]): Iterable<LintResult> {
    const parser = new UcParser();
    for (let lineIndex=0; lineIndex < document.lineCount; lineIndex++){
        const line = document.lineAt(lineIndex);
        const lineTokens = ucTokenizeLine(line.text);
        for (const token of lineTokens){
            for (const rule of tokenRules){
                const lintResults = rule.nextToken(lineIndex, token.position, token.text, line.text);
                if (!lintResults){
                    continue;
                }
                for (const result of lintResults){
                    yield result;
                }
            }
            parser.parse(lineIndex, token.position, token.text);
        }
    }
    parser.endOfFile(document.lineCount, 0);
    const ast = parser.getAst();
    for (const parseError of ast.errors){
        yield {
            message: parseError.message,
            line: parseError.token.line,
            position: parseError.token.position,
            length: parseError.token.text.length,
            originalText: parseError.token.text,
            severity: 'error'
        };
    }
}

function processFormattingRules(document: vscode.TextDocument, edits: vscode.TextEdit[], tokenRules: TokenBasedLinter[]){
    for (const result of processLinterRules(document,  tokenRules)){
        if (result.fixedText == null || result.position == null || result.line == null || result.length == null){
            continue;
        }
        if (result.length === 0) {
            const position = new vscode.Position(result.line, result.position);
            edits.push(vscode.TextEdit.insert(position, result.fixedText));
        } else if (result.fixedText === '') {
            const start = new vscode.Position(result.line, result.position);
            const end = new vscode.Position(result.line, result.position + result.length);
            edits.push(vscode.TextEdit.delete(new vscode.Range(start, end)));
        } else {
            const start = new vscode.Position(result.line, result.position);
            const end = new vscode.Position(result.line, result.position + result.length);
            edits.push(vscode.TextEdit.replace(new vscode.Range(start, end), result.fixedText));
        } 
    }
}

function insertSemicolonEndOfLine(document: vscode.TextDocument, edits: vscode.TextEdit[]) {
    const lineStartExclude = [
        "if", "else", "for",  "while", "function", "event", "#", "//", "{", "}",
        "switch", "Switch",
        "If", "Else", "For",  "While", "Function", "Event" // sources have these keywords starting with uppercase letter
    ];
    for (let i=0; i < document.lineCount; i++){
        const line = document.lineAt(i);

        if (line.isEmptyOrWhitespace){
            continue;
        }
        const text = line.text;
        if (text.includes(";")){
            continue;
        }
        let excludeLine = false;
        for (const exludeStartToken of lineStartExclude){
            if (text.startsWith(exludeStartToken, line.firstNonWhitespaceCharacterIndex)){
                excludeLine = true;
                break;
            }
        }
        if (excludeLine){
            continue;
        }
	
        const isAssignment = text.match(/^\s*[a-z_]+\s*=\s*/i) !== null;
        const isFunctionCall = text.match(/^\s*[a-z_]+\s*\(.*?\)/i) !== null;
        const isDeclaration = text.match(/^\s*(var|const|class|local).*?\s[a-z_]+\s+[a-z_]+/i) !== null;

        if (isAssignment || isFunctionCall || isDeclaration) {
            let column = line.range.end.character - 1;
            const commentIndex = text.indexOf("//");
            if (commentIndex > 0) {
                column = commentIndex - 1;
            }
            while (column > 0 && text.charAt(column) === ' '){
                column--;
            }
            const position = new vscode.Position(i, column + 1);
            edits.push(vscode.TextEdit.insert(position, ";"));
        }
    }
}

function getAst(document: vscode.TextDocument, cancellation: vscode.CancellationToken) {
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

