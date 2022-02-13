import { ALL_AST_RULES } from ".";
import { LintResult } from "../LintResult";
import { UcParser, ucTokenizeLine } from "../../";

test('linting indent class declaration', () => {
    linting([
        'class Test',
        'extends Object;'
    ]).hasResult({
        line: 1,
        position: 0,
        originalText: '',
        fixedText: '\t'
    });
});

test('linting indent var declaration', () => {
    linting([
        'var config string',
        'Description',
        ';'
    ]).hasResult({
        line: 1,
        position: 0,
        originalText: '',
        fixedText: '\t'
    });
});

test('linting indent function body', () => {
    linting([
        'function Init() {',
        'Count = 0;',
        '}'
    ]).hasResult({
        line: 1,
        position: 0,
        originalText: '',
        fixedText: '\t'
    });
});

test('linting indent codeblock in function', () => {
    linting([
        'function Init() {',
        'if (bFirstRun)',
        '{',
        'Count = 0;',
        '}',
        '}'
    ]).hasResult({
        line: 2,
        fixedText: '\t'
    }).hasResult({
        line: 3,
        fixedText: '\t\t'
    }).hasResult({
        line: 4,
        fixedText: '\t'
    });
});

// needs parser support for begin end tokens
test('linting indent if inside if', () => {
    linting([
        'function Init() {',
        'if (bVerify) {',
        'if (bEnabled) {',
        'Count = 0;',
        '}',
        '}',
        '}'
    ]).hasResult({ line: 1, fixedText: '\t'
    }).hasResult({ line: 2, fixedText: '\t\t'
    }).hasResult({ line: 3, fixedText: '\t\t\t'
    });
});


function linting(lines: string[]) {
    const parser = new UcParser();
    for (let i = 0; i < lines.length; i++) {
        for (const token of ucTokenizeLine(lines[i])) {
            parser.parse(i, token.position, token.text);
        }
    }
    parser.endOfFile(lines.length, 0);
    const ast = parser.getAst();
    ast.textLines = lines;

    let results: LintResult[] = [];
    for (const rule of ALL_AST_RULES){
        const result = rule.lint(ast);
        if (result){
            results = [...results, ...result];
        }
    }

    const checks = {
        hasResult(obj: LintResult){
            let bestMatch: LintResult | null = null;
            let bestScore = 0;
            for (const result of results){
                let score = 
                    Number(result.line === obj.line) +
                    Number(result.position === obj.position) +
                    Number(result.length === obj.length) +
                    Number(result.message === obj.message) +
                    Number(result.originalText === obj.originalText) +
                    Number(result.fixedText === obj.fixedText) +
                    Number(result.severity === obj.severity);
                if (score > bestScore){
                    bestScore = score;
                    bestMatch = result;
                }
            }
            expect(bestMatch).toMatchObject(obj);
            return checks;
        }
    };

    return checks;
}