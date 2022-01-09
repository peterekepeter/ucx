// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ALL_RULES } from './rules';
import { KeywordFormatRule } from './rules/KeywordFormatRule';
import { ucTokenizeLine } from './test/ucTokenize';
import { TokenBasedLinter } from './TokenBasedLinter';

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

	// formatter implemented using API
	vscode.languages.registerDocumentFormattingEditProvider('unrealscript', {
		provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
			const edits = new Array<vscode.TextEdit>();
			processTokenRules(document, edits, tokenRules);
			insertSemicolonEndOfLine(document, edits);
			return edits;
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

function processTokenRules(document: vscode.TextDocument, edits: vscode.TextEdit[], tokenRules: TokenBasedLinter[]){
	for (let lineIndex=0; lineIndex < document.lineCount; lineIndex++){
		const line = document.lineAt(lineIndex);
		const lineTokens = ucTokenizeLine(line.text);
		for (const token of lineTokens){
			for (const rule of tokenRules){
				const lintResults = rule.nextToken(lineIndex, token.position, token.text);
				if (!lintResults){
					continue;
				}
				for (const result of lintResults){
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
		}
	}
}

function insertSemicolonEndOfLine(document: vscode.TextDocument, edits: vscode.TextEdit[]) {
	const lineStartExclude = [
		"if", "else", "for", "{", "}", "while", "function", "event", "#", "//"
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

