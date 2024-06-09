import { ucParseLines } from "../parser/ucParse";
import { ClassDatabase, CompletionInformation, TokenInformation } from "./ClassDatabase";
import { renderDefinitionMarkdownLines } from "./renderDefinitonMarkdownLines";

let db: ClassDatabase;

beforeEach(() => db = new ClassDatabase());

describe("ast versioning", () => {

    const uri = "MyClass.uc";

    test('getVersion returns -Infinity when uri not found', () => {
        expectVersion(uri, -Infinity);
    });
    
    test('getVersion returns version number when ast added first', () => {
        addVersion(1);
        expectVersion(uri, 1);
    });
    
    test('getVersion returns latest version', () => {
        addVersion(1);
        addVersion(2);
        expectVersion(uri,  2);
    });
    
    test('getVersion returns highest', () => {
        addVersion(1);
        addVersion(0);
        expectVersion(uri,  1);
    });

    const addVersion = (v: number) => ast(uri, v, ["class MyClass;"]);

});

describe("definitions inside single file", () => {

    const uri = "SomeClass.uc";

    beforeEach(() => {
        ast(uri, 1, [
            'class SomeClass extends Info;', // line 0
            '',
            'var config string tag;',
            '', // line 3
            'function PostBeginPlay(string name) {', // line 4
            '    local int i;',
            '    for (i=0; i<10; i+=1) Log(tag$name);', // line 6
            '    DebugPrint();', // line 7
            '}',
            '',
            'function DebugPrint() {', // line 10
            '    Log(tag);',
            '}',
        ]);
    });

    test('searching in another file resutls in missing ast', () => {
        expect(db.findToken('asdasdas', 0, 0).missingAst).toBe(true);
    });
    
    // find token
    test.each([
        [0, 1, { found: true }],
        [0, 100, { found: false }],
        [0, 1, { token: { text: 'class' } }],
        [0, 6, { token: { text: 'SomeClass' } }],
        [4, 32, { 
            token: {text: 'name'}, 
            functionScope: { name: { text: 'PostBeginPlay' }},
            uri: uri,
            ast: {},
        }],
        [6, 9, { 
            token: { text: 'i' }, 
            functionScope: { name: { text: 'PostBeginPlay' }},
        }] as [number, number, TokenInformation],
    ])("findToken at (%p:%p) results %p", (line, column, expected) => {
        expect(db.findToken(uri, line, column)).toMatchObject(expected);
    });

    // find definition
    test.each([
        [6, 9, { 
            token: { text: 'i', line: 5 }, 
            localDefinition: { type: { text: 'int' }},
        }],
        [6, 10, { // also works on last char
            token: { text: 'i', line: 5 }, 
            localDefinition: { type: { text: 'int' }},
        }],
        [7, 9, { 
            token: { text: 'DebugPrint' }, 
            fnDefinition: { name: { text: 'DebugPrint' }},
        }] as [number, number, TokenInformation],
    ] as [number, number, TokenInformation][]
    )("findLocalDefinition at (%p:%p) results %p", (line, column, expected) => {
        const token = db.findSymbolToken(uri, line, column);
        const definition = db.findLocalFileDefinition(token);
        expect(definition).toMatchObject(expected);
    });

    // markdown definition
    test.each([
        [6, 9, ['\tlocal int i']],
        [6, 35, ['\t(parameter) string name']],
        [6, 31, ['\tvar config string tag']],
        [7, 9, ['\tfunction DebugPrint()']],
        [0, 9, ['\tclass SomeClass extends Info']],
    ] as [number, number, string[]][]
    )("markdown definition at (%p:%p) is %p", (line, column, expected) => {
        const info = db.findLocalFileDefinition(db.findToken(uri, line, column));
        expect(renderDefinitionMarkdownLines(info)).toEqual(expected);
    });

});

describe("definition across files", () => {

    const uriA = "PackageName/Classes/ClassA.uc";
    const uriB = "PackageName/Classes/ClassB.uc";
    const uriCanvas = "Engine/Classes/Canvas.uc";

    beforeEach(() => {
        ast(uriA, 1, [
            'class ClassA;', // line 0
            '',
            'var int Count;',
            'static function ShowStartMessage(){}',
            'static function string Mid ( coerce string S, int i, optional int j );',
        ]);
        ast(uriCanvas, 1, [
            'class Canvas;', // line 0
            '',
            'function Reset() {}',
        ]);
        ast(uriB, 1, [
            'class ClassB extends ClassA;', // line 0
            '',
            'var ClassA other;', // line 2
            '',
            'function Timer(){',
            '   Count += 1;', // line 5
            '}',
            '',
            'function ClassA MakeCopy(ClassA other){',  // line 8
            '   local ClassA copy;',
            `   copy = new class'ClassA';`, // line 10
            '}',
            '',
            'function ClassA GetHud() {', // line 13
            '   return Spawn(Class\'PackageName.ClassA\');',
            '}',
            '',
            'function Draw(canvas canvas){', // line 17
            '   canvas.Reset();',
            '   other.Count += 1;',
            "   class'ClassA'.static.ShowStartMessage(PP);",
            "   Log(class'ClassA'.default.Count);", // line 21
            "   Log(ClassA(self).Count);", // line 22
            "   Mid(Mid(\"Some\", 1, 2), 1, 1);", // line 23
            "   default.other = None;", // line 24
            '}',
            '',
            'function Reset(Canvas canvas) {', // line 27
            '   canvas.Reset();', // line 28
            '}',
        ]);
    });

    const classDefA = { token: { text: 'ClassA' }, uri: uriA };
    const classDefB = { token: { text: 'ClassB' }, uri: uriB };
    const varDefCount = { uri: uriA, varDefinition: { name: { text: 'Count' }} };
    const paramDefCanvas = { uri:uriB, paramDefinition: { name: { text: 'canvas'} }};
    const canvasClassDef = { token: { text: 'Canvas' }, classDefinition: { name: { text: 'Canvas' }}};
    const canvasResetFnDef = { uri:uriCanvas, token: { text: 'Reset', line: 2 }, fnDefinition: { name: { text: 'Reset' }}};
    const showStartMessageFnDef = { uri: uriA, fnDefinition: { name: { text: 'ShowStartMessage' }}};

    // find definition
    test.each([
        ['self type', 0, 9, classDefB],
        ['parent type', 0, 24, classDefA],
        ['inherited variable', 5, 4, varDefCount],
        ['var type', 2, 7, classDefA],
        ['return type', 8, 13, classDefA], 
        ['parameter type', 8, 28, classDefA],
        ['local type', 9, 12, classDefA],
        ['absolute class reference', 10, 23, classDefA],
        ['absolute package.class reference', 14, 38, classDefA],
        ['function parameter reference', 17, 24, paramDefCanvas],
        ['function parameter type reference', 17, 16, canvasClassDef],
        ['member method call', 18, 12, canvasResetFnDef],
        ['member variable', 19, 11, { uri: uriA, token: { text: 'Count' }}],
        ['static keyword in expression', 20, 20, classDefA],
        ['default keyword in expression', 21, 25, classDefA],
        ['static function', 20, 31, showStartMessageFnDef],
        ['default var', 21, 30, varDefCount],
        ['typecast to class', 22, 10, classDefA],
        ['typecast to class member', 22, 23, varDefCount],
        ['standalone default keyword', 24, 7, classDefB],
        ['member fn not shadowed by local fn', 28, 11, canvasResetFnDef],
    ] as [string, number, number, TokenInformation][]
    )("findCrossFileDefinition finds %p at %p:%p", (_, line, column, expected) => {
        const token = db.findToken(uriB, line, column);
        let definition = db.findLocalFileDefinition(token);
        if (!definition.found) definition = db.findCrossFileDefinition(token);
        expect(definition).toMatchObject({...expected, found: true }); 
    });

    // find signature
    test.each([
        ['method signature', 18, 16, canvasResetFnDef],
        ['static function signature', 20, 42, showStartMessageFnDef],
        ['signature first param', 23, 7, { paramDefinition: { name: { text: 'S'}}}],
        ['signature 2nd param', 23, 20, { paramDefinition: { name: { text: 'i'}}}],
        ['signature 3rd param', 23, 23, { paramDefinition: { name: { text: 'j'}}}],
        ['signature 2nd param but after nested call', 23, 27, { paramDefinition: { name: { text: 'i'}}}],
    ] as [string, number, number, TokenInformation][]
    )("findSignature finds %p at %p:%p", (_, line, column, expected) => {
        let signature = db.findSignature(uriB, line, column);
        expect(signature).toMatchObject({ ...expected, found: true });
    });

    test('find subclasses', () => {
        expect(db.findChildClassesOf("ClassA")).toMatchObject([classDefB]);
    });

    test('find superclass', () => {
        expect(db.findParentClassOf("ClassB")).toMatchObject(classDefA);
    });

});

describe("completion", () => {
    test("empty file suggests class declaration", () => {
        const uri = '../Package/Classes/MyClass.uc';
        ast(uri, 1, ['']);
        expectCompletion(uri, 0, 0, { label: "class MyClass extends ", retrigger: true });
    });

    test("does not suggest class declaration if class declared", () => {
        const uri = '../Package/Classes/MyClass.uc';
        ast(uri, 1, ['class MyClass extends Actor;', '']);
        expectCompletionCount(uri, 1, 0, 0);
    });

    test("empty file suggests class declaration", () => {
        const uri = 'Awesome.uc';
        ast(uri, 1, ['// new class', 'class ']);
        expectCompletion(uri, 1, 6, { label: "Awesome extends ", retrigger: true });
        expectCompletion(uri, 1, 5, { label: " Awesome extends ", retrigger: true });
        expectCompletionCount(uri, 0, 0, 0);
    });

    test("after extends suggest extendable class names", () => {
        ast("MyOther.uc", 1, ['class MyOther extends Actor;']);
        ast("MyClass.uc", 1, ['class MyClass extends ']);
        expectCompletion("MyClass.uc", 1, 22, "MyOther");
        expectCompletion("MyClass.uc", 1, 22, "Actor");
    });

    describe("object member completion", () => {

        beforeEach(() => {
            ast("MyOther.uc", 1, [
                'class MyOther;',
                '',
                'function Update(){}',
            ]);
            ast("MyClass.uc", 1, [
                'class MyClass extends MyOther;',
                '',
                'var MyOther VObj;',
                '',
                'function Test(MyOther PObj) {', // line 4
                '    local MyOther LObj; LObj = PObj;',
                '',
                '    PObj.;', // line 7 char 9
                '    VObj.;', // line 8
                '    LObj.;', // line 9
                '    self.;', // line 10
                '    super.;', // line 11 char 10
                '    default.;', // line 12 char 12
                '}',
            ]);
        });

        test('through function parameter reference', () => {
            expectCompletion("MyClass.uc", 7, 9, "Update");
        });

        test('through class variable reference', () => {
            expectCompletion("MyClass.uc", 8, 9, "Update");
        });

        test('through local variable reference', () => {
            expectCompletion("MyClass.uc", 9, 9, "Update");
        });

        test('through self reference', () => {
            expectCompletion("MyClass.uc", 10, 9, "Test");
        });

        test('through super reference', () => {
            expectCompletion("MyClass.uc", 11, 10, "Update");
        });

        test('through default reference', () => {
            expectCompletion("MyClass.uc", 12, 12, "VObj");
        });
        
    });

    describe("expression completion", () => {

        beforeEach(() => {
            ast("Object.uc", 1, [
                'class Object;',
                '',
                'var float A,B;',
                '',
                'function Log(coerce string str, optional string tag){}',
            ]);
            ast("MyObject.uc", 1, [
                'class MyObject extends Object;',
                '',
                'function Test(Object Other) {', // line 2
                '    ', // line 3
                '    A = ;',
                '    Log();',
                '    Log(A,);',
                '}',
            ]);
        });

        test('suggests locally avaiable functions and variables', () => {
            expectCompletion("MyObject.uc", 3, 4, "Other"); // start of statement
            expectCompletion("MyObject.uc", 3, 4, "Test"); // start of statement
            expectCompletion("MyObject.uc", 4, 8, "B"); // after assign operator
            expectCompletion("MyObject.uc", 5, 8, "A"); // after open parenthesis
            expectCompletion("MyObject.uc", 6, 10, "A"); // after comma
        });

        test('suggests inherited avaiable functions and variables', () => {
            expectCompletion("MyObject.uc", 3, 4, "Log");
        });

    });

    describe("name completion", () => {

        beforeEach(() => {
            ast("Object.uc", 1, [
                'class Object;',
            ]);
            ast("MyObject.uc", 1, [
                'class MyObject extends Object;',
                '',
                'function Test(Object Other) {', // line 2
                "   class'';",
                "   Class'';",
                "   class'",
                "   class'MyObject'",
                '}',
            ]);
        });

        test('suggests existing classes in class reference', () => {
            expectCompletion("MyObject.uc", 3, 9, "Object");
            expectCompletion("MyObject.uc", 3, 9, "MyObject");
        });

        test('suggests existing classes in class reference even if Class is uppercase', () => {
            expectCompletion("MyObject.uc", 4, 9, "Object");
            expectCompletion("MyObject.uc", 4, 9, "MyObject");
        });

        test('suggests existing classes if name is only opened', () => {
            expectCompletion("MyObject.uc", 5, 9, "Object");
            expectCompletion("MyObject.uc", 5, 9, "MyObject");
        });


        test('does not suggest clasnames after closing quote', () => {
            expectNotCompletion("MyObject.uc", 6, 18, "MyObject");
        });


    });

    const expectCompletion = (uri: string, line: number, pos: number, expected: string|CompletionInformation) => {
        const completions = db.findCompletions(uri, line, pos);
        if (typeof expected === 'string') {
            expected = {
                label: expected
            };
        }
        let last;
        expect(completions).not.toHaveLength(0);
        for (const completion of completions) {
            last = completion;
            if (completion.label === expected.label) {
                expect(completion).toMatchObject(expected);
                return;
            }
        }
        expect(last).toMatchObject(expected);
    };

    const expectNotCompletion = (uri: string, line: number, pos: number, expected: string|CompletionInformation) => {
        const completions = db.findCompletions(uri, line, pos);
        if (typeof expected === 'string') {
            expected = {
                label: expected
            };
        }
        for (const completion of completions) {
            if (completion.label === expected.label) {
                expect(completion).not.toMatchObject(expected);
            }
        }
    };


    const expectCompletionCount = (uri: string, line: number, pos: number, expectedCount: number) => { 
        const completions = db.findCompletions(uri, line, pos);
        expect(completions).toHaveLength(expectedCount);
    };

});


describe("references", () => {
    
    describe("local variable references", () => {

        beforeEach(() => {
            ast("MyClass.uc", 1, [
                'class MyClass extends MyOther;',
                '',
                'var MyOther VObj;',
                '',
                'function Test(MyOther PObj) {', // line 4
                '    local MyOther LObj;',
                '    local int i;',
                '    LObj = PObj;', // line 7
                '    VObj = PObj;',
                '    for ( i=i; i<10; i+=1 ) Log(i);',
                '}',
                '', // line 11
                '',
                '',
                'function Test2() {', // line 14
                '    local int i, j;',
                '    Log(i);',
                '}',
            ]);
        });

        test('function parameter references', () => {
            expectReferences('MyClass.uc', 4, 25, 'PObj', [
                ["MyClass.uc", 4, 22, 'PObj'],
                ["MyClass.uc", 7, 11, 'PObj'],
                ["MyClass.uc", 8, 11, 'PObj'],
            ]);
        });

        test('local variable references', () => {
            expectReferences('MyClass.uc', 5, 20, 'LObj', [
                ["MyClass.uc", 5, 18, 'LObj'],
                ["MyClass.uc", 7, 4, 'LObj'],
            ]);
        });

        describe('single letter variables', () => {
            const refs: [string, number, number, string][] = [
                ["MyClass.uc", 6, 14, 'i'],
                ["MyClass.uc", 9, 10, 'i'],
                ["MyClass.uc", 9, 12, 'i'],
                ["MyClass.uc", 9, 15, 'i'],
                ["MyClass.uc", 9, 21, 'i'],
                ["MyClass.uc", 9, 32, 'i'],
            ];

            test('works on first char', () => {
                expectReferences('MyClass.uc', 6, 14, 'i', refs);
            });

            test('works on space after last char', () => {
                expectReferences('MyClass.uc', 6, 15, 'i', refs);
            });

            test('works on first usage', () => {
                expectReferences('MyClass.uc', 9, 10, 'i', refs);
            });

            test('works on position right after usage', () => {
                expectReferences('MyClass.uc', 9, 10, 'i', refs);
            });

            test('works on fn arg usage', () => {
                expectReferences('MyClass.uc', 9, 32, 'i', refs);
            });

            test('works on right side of operator', () => {
                expectReferences('MyClass.uc', 9, 12, 'i', refs);
            });
        });

        test('reference works when multiple vars are declared in single statement', () => {
            expectReferences('MyClass.uc', 15, 14, 'i', [
                ["MyClass.uc", 15, 14, 'i'],
                ["MyClass.uc", 16, 8, 'i'],
            ]);
        });

    });
    

    function expectReferences(uri: string, line: number, char: number, symbol: string, refs: [string, number, number, string][]) {
        expect(db.findSymbolToken(uri, line, char).token?.text).toEqual(symbol);
        const result = db.findReferences(uri, line, char);
        expect(result.map(r => [r.uri, r.token?.line, r.token?.position, r.token?.text])).toEqual(refs);
    }

});

function ast(uri: string, version: number, lines: string[]) {
    db.updateAst(uri, ucParseLines(lines), version);
}

function expectVersion(uri: string, expected: number) {
    expect(db.getVersion(uri)).toBe(expected);
}

// TODO
// hover information missing

// function ResetPawn(Pawn P) 
// {
// if ( P == None ) 
// 	return;

// if ( P.PlayerReplicationInfo.bIsSpectator ){ << here
		
// }