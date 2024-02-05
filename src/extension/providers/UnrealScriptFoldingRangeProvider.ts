import { db } from "..";
import { UnrealClass } from "../../lib";
import { SemanticClass, ParserToken as Token } from "../../lib/parser";
import { UnrealClassFunction, UnrealClassStatement, UnrealExecInstruction } from "../../lib/parser/ast";
import { vscode } from "../vscode";

type FoldingRanges = vscode.FoldingRange[];
type ProviderInterface = vscode.FoldingRangeProvider;

export class UnrealScriptFoldingRangeProvider implements ProviderInterface {
    
    onDidChangeFoldingRanges?: vscode.Event<void> | undefined;

    async provideFoldingRanges(
        document: vscode.TextDocument, 
        _unused: vscode.FoldingContext, 
        token: vscode.CancellationToken,
    ): Promise<FoldingRanges> 
    {
        const output = new Array<vscode.FoldingRange>();
        const ast = await db.updateDocumentAndGetAst(document, token);
        if (token.isCancellationRequested) return output;
        this.foldAst(ast, output);
        return output;
    }

    private foldAst(ast: UnrealClass, result: FoldingRanges) {

        // fold exec
        if (ast.execInstructions.length > 1) {
            const first = ast.execInstructions[0];
            const last = ast.execInstructions[ast.execInstructions.length - 1];
            if (first.firstToken && last.lastToken) {
                result.push(this.fold(
                    first.firstToken, 
                    last.lastToken, 
                    vscode.FoldingRangeKind.Imports
                ));
            }
        }

        // fold comments
        let firstComment: Token | null = null;
        let lastComment: Token | null = null;
        for (const token of ast.tokens) {
            if (token.type === SemanticClass.Comment) {
                if (firstComment && lastComment && token.line - lastComment.line >= 2) {
                    // do not fold disjointed comments together
                    if (lastComment.line !== firstComment.line) {
                        result.push(this.fold(
                            firstComment, 
                            lastComment, 
                            vscode.FoldingRangeKind.Comment,
                        ));
                    }
                    firstComment = token;
                    lastComment = token;
                }
                else if (!firstComment) {
                    firstComment = token;
                }
                lastComment = token;
            }
            else if (firstComment && lastComment) {
                if (lastComment.line !== firstComment.line) {
                    result.push(this.fold(
                        firstComment, 
                        lastComment, 
                        vscode.FoldingRangeKind.Comment,
                    ));
                }
                firstComment = null;
                lastComment = null;
            }
        }
        
        // fold states
        for (const state of ast.states) {
            if (state.bodyFirstToken && state.bodyLastToken) {
                result.push(new vscode.FoldingRange(
                    (state.name ?? state.bodyFirstToken).line, 
                    state.bodyLastToken.line,
                ));
            }

            this.foldFunctions(state.functions, result);
            this.foldStatements(state.body, result);
        }

        this.foldFunctions(ast.functions, result);

        // fold defauilt properties block
        if (ast.defaultPropertiesFirstToken && ast.defaultPropertiesLastToken) {
            result.push(this.fold(
                ast.defaultPropertiesKeyword ?? ast.defaultPropertiesFirstToken, 
                ast.defaultPropertiesLastToken
            ));

            // group fold array default properties
            if (ast.defaultProperties.length > 1)
            {
                let groupFirst = ast.defaultProperties[0];
                let groupLast = groupFirst;
                let groupCount = 0;
                for (const property of ast.defaultProperties) {
                    if (groupLast.name?.text === property.name?.text) {
                        groupCount += 1;
                        groupLast = property;
                    }
                    else {
                        if (groupCount >= 2 && groupFirst.name && groupLast.name) {
                            result.push(this.fold(
                                groupFirst.name,
                                groupLast.name,
                            ));
                        }
                        groupFirst = groupLast = property;
                        groupCount = 0;
                    }
                }
            }
        }

        // fold repliucation blocks
        for (const block of ast.replicationBlocks) {
            result.push(this.fold(
                block.firstToken ?? block.bodyFirstToken,
                block.bodyLastToken
            ));
            for (const statement of block.statements) {
                result.push(this.fold(
                    statement.firstToken, 
                    statement.lastToken
                ));
            }
        }
        
        // fold struct declarations
        for (const struct of ast.structs) {
            result.push(this.fold(
                struct.firstToken,
                struct.lastToken,
            ));
        }

        // fold enum declarations
        for (const enumeration of ast.enums) {
            result.push(this.fold(
                enumeration.firstToken,
                enumeration.lastToken,
            ));
        }
    }

    private foldFunctions(list: UnrealClassFunction[], result: FoldingRanges) {
        for (const fn of list) {
            if (fn.bodyFirstToken && fn.bodyLastToken) {
                result.push(this.fold(
                    fn.name ?? fn.bodyFirstToken, 
                    fn.bodyLastToken
                ));
                this.foldStatements(fn.body, result);
            }
        }
    }

    private foldStatements(list: UnrealClassStatement[], result: FoldingRanges) {
        let label: UnrealClassStatement | null = null;
        let prevStatement: UnrealClassStatement | null = null;
        for (const statement of list) {

            if (statement.op?.text === ':') {
                this.foldLabelledBlock(label, prevStatement, result);
                label = statement;
            }
            prevStatement = statement;

            if (!statement.singleStatementBody 
                && statement.bodyFirstToken 
                && statement.bodyLastToken) 
            {
                result.push(this.fold(
                    statement.op ?? statement.bodyFirstToken,
                    statement.bodyLastToken,
                ));
                this.foldStatements(statement.body, result);
            }
        }

        if (label) {
            this.foldLabelledBlock(label, prevStatement, result);
        }
    }

    private foldLabelledBlock(
        label: UnrealClassStatement | null, 
        blockLastStatement: UnrealClassStatement | null, 
        result: FoldingRanges
    ) {
        let prevToken = blockLastStatement?.bodyLastToken ?? 
            blockLastStatement?.argsLastToken ?? 
            blockLastStatement?.op;
        if (label && label.op && prevToken){
            result.push(this.fold(
                label.op,
                prevToken,
            ));
        }
    }

    private fold(
        from: Token, to: Token, kind?: vscode.FoldingRangeKind
    ): vscode.FoldingRange {
        return new vscode.FoldingRange(from.line,to.line,kind);
    }


}