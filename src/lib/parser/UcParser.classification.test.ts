import { SemanticClass as C, UcParser } from ".";
import { ucTokenizeLine } from "../tokenizer/ucTokenizeLine";



test("tokens for abstract class", () => parsing(`
    class MyClass extends Actor abstract;
`).hasTokens(
    ['class', C.Keyword ], 
    ['MyClass', C.ClassDeclaration], 
    ['extends', C.Keyword], 
    ['Actor', C.ClassReference],
    ['abstract', C.Keyword]    
));

test('tokens for native class', () => parsing(`
class Actor extends Object
    abstract
    native
    nativereplication;
`).hasTokens(
    ['Object', C.ClassReference],
    ['abstract', C.Keyword],
    ['native', C.Keyword],
    ['nativereplication', C.Keyword],
));

test('tokens when logging literal string', () => parsing(`
    function PreBeginPlay(){
        Log("Hello World!");
    }
`).hasTokens(
    ["Log", C.FunctionReference],
    ["(", C.None],
    ['"Hello World!"', C.LiteralString],
    [")", C.None]
));

test('tokens basic expression', () => parsing(`
    function Init(){
        x = x + 4;
    }
`).hasTokens(
    ["x", C.VariableReference],
    ["=", C.Operator],
    ["x", C.VariableReference],
    ["+", C.Operator],
    ["4", C.LiteralNumber]
));

test('tokens fn call with no params', () => parsing(`
    function PreBeginPlay(){
        Init();
    }
`).hasTokens(
    ["Init", C.FunctionReference],
    ["(", C.None],
    [")", C.None]
));

test('tokens else if recognized as keyowrds', () => parsing(`
    function PreBeginPlay(){
        if (bFeature) {} 
        else if (bAnotherFeature) {}
    }
`).hasTokens(
    ["}", C.None],
    ["else", C.Keyword],
    ["if", C.Keyword],
    ["(", C.None],
    ["bAnotherFeature", C.Identifier]
));

test('tokens static function', () => parsing(`
    static function Init() {}
`).hasTokens(
    ['static', C.Keyword],
    ['function', C.Keyword]
));

function parsing(input: string) {
    const parser = new UcParser();
    const lines = input.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        for (const token of ucTokenizeLine(lines[i])) {
            parser.parse(i, token.position, token.text);
        }
    }
    parser.endOfFile(lines.length, 0);
    const ast = parser.getAst();

    const checks = {
        hasTokens(...expected: [string, C][]){
            const actual: [string, string][] = ast.tokens.map(t => [t.text, C[t.type]]);
            const startIndex = actual.findIndex(t => t[0] === expected[0][0]);
            const actualSlice = actual.slice(startIndex, startIndex + expected.length);
            const expectedMapped = expected.map(t => [t[0], C[t[1]]]);
            expect(actualSlice).toMatchObject(expectedMapped);
        }
    };

    return checks;
}