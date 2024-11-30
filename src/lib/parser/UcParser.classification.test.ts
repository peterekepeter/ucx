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

test('return statement detects return as keyword', () => parsing(`
    static function int Init() {
        return 42;
    }
`).hasTokens(
    ['return', C.Keyword],
    ['42', C.LiteralNumber]
));

test('function parameters', () => parsing(`
    function int Test(int a, int b) { }
`).hasTokens(
    ['(', C.None],
    ['int', C.TypeReference],
    ['a', C.LocalVariable],
    [',', C.None],
    ['int', C.TypeReference],
    ['b', C.LocalVariable],
    [')', C.None]
));

test('function parameters out modifier detected as keyword', () => parsing(`
    function int Test(out int a) { }
`).hasTokens(
    ['(', C.None],
    ['out', C.Keyword],
    ['int', C.TypeReference],
    ['a', C.LocalVariable]
));


test('tokens for default properites', () => parsing(`
defaultproperties {
    Description="Your description here!"
    DamageModifier=1.0
}`).hasTokens(
    ['defaultproperties', C.Keyword],
    ['{', C.None],
    ['Description', C.ClassVariable],
    ['=', C.Operator],
    ['"Your description here!"', C.LiteralString],
    ['DamageModifier', C.ClassVariable],
    ['=', C.Operator],
    ['1.0', C.LiteralNumber],
    ['}', C.None],
));


test('semicolon at end of statement is not an operator', () => parsing(`
    function Init(){
        x = x + 4;
    }
`).hasTokens(
    ["4", C.LiteralNumber],
    [";", C.None]
));

test('inline comment', () => parsing(`
    function Init(){
        x = x /*+ 4*/;
    }
`).hasTokens(
    ["x", C.VariableReference],
    ["=", C.Operator],
    ["x", C.VariableReference],
    ["/*", C.Comment],
    ["+", C.Comment],
    ["4", C.Comment],
    ["*/", C.Comment],
    [";", C.None]
));


test('new operator', () => parsing(`
    function Init(){
        x = new class'Test';
    }
`).hasTokens(
    ["x", C.VariableReference],
    ["=", C.Operator],
    ["new", C.Keyword],
    ["class", C.ClassReference],
    ["'Test'", C.ObjectReferenceName],
    [";", C.None],
));


test('exec', () => parsing(`
    #exec Texture Import File=Textures\NuRaRulesBG.pcx Name=NuRaRulesBG Group=Windows Mips=On Flags=2
    class XClass;
`).hasTokens(
    ['#exec Texture Import File=Textures\NuRaRulesBG.pcx Name=NuRaRulesBG Group=Windows Mips=On Flags=2', C.ExecInstruction],
    ['class', C.Keyword],
    ['XClass', C.ClassDeclaration]
));


test('default property with object reference', () => parsing(`
    defaultproperties {
        CustomSound=Sound'Package.sound'
    }
`).hasTokens(
    ['defaultproperties', C.Keyword],
    ['{', C.None],
    ['CustomSound', C.ClassVariable],
    ['=', C.Operator],
    ['Sound', C.ClassReference],
    ["'Package.sound'", C.ObjectReferenceName],
));

test('generic type parsing', () => {
    const ast = parsing(`
        var class<Weapon> C;
        function f(Actor obj) { 
            local class<Weapon> W; 
            W=class<Weapon>(obj);
            C=W;
        }
    `);
    ast.hasTokens(
        ['var', C.Keyword],
        ['class', C.TypeReference],
        ['<', C.GenericArgBegin],
        ['Weapon', C.ClassReference],
        ['>', C.GenericArgEnd],
        ['C', C.ClassVariable]
    );
    ast.hasTokens(
        ['local', C.Keyword],
        ['class', C.TypeReference],
        ['<', C.GenericArgBegin],
        ['Weapon', C.ClassReference],
        ['>', C.GenericArgEnd],
        ['W', C.LocalVariable],
        [';', C.None],
        ['W', C.VariableReference],
        ['=', C.Operator],
        ['class', C.TypeReference],
        ['<', C.GenericArgBegin],
        ['Weapon', C.ClassReference],
        ['>', C.GenericArgEnd],
        ['(', C.None]
    );
});


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