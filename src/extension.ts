// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { LintResult } from './lib/LintResult';
import { ALL_RULES } from './lib/rules';
import { KeywordFormatRule } from './lib/rules/KeywordFormatRule';
import { ucTokenizeLine } from './lib/ucTokenize';
import { TokenBasedLinter } from './lib/TokenBasedLinter';
import { ParserToken, UcParser } from './lib/UcParser';

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

    vscode.languages.registerDocumentSymbolProvider('unrealscript', {
        provideDocumentSymbols(document, cancellation){
            const parser = new UcParser();
            for (let lineIndex=0; lineIndex < document.lineCount; lineIndex++){
                const line = document.lineAt(lineIndex);
                const lineTokens = ucTokenizeLine(line.text);
                for (const token of lineTokens) {
                    parser.parse({ ...token, line: lineIndex });
                }
                if (cancellation.isCancellationRequested){
                    return [];
                }
            }
            parser.endOfFile({ text: '', line: document.lineCount, position: 0 });
            const ast = parser.getAst();
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
            parser.parse({ ...token, line: lineIndex });
        }
    }
    parser.endOfFile({ text: '', line: document.lineCount, position: 0 });
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

