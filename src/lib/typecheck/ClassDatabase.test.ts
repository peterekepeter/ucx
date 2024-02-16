import { ucParseLines } from "../parser/ucParse";
import { ClassDatabase, TokenInformation } from "./ClassDatabase";
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
        [7, 9, { 
            token: { text: 'DebugPrint' }, 
            fnDefinition: { name: { text: 'DebugPrint' }},
        }] as [number, number, TokenInformation],
    ] as [number, number, TokenInformation][]
    )("findLocalDefinition at (%p:%p) results %p", (line, column, expected) => {
        const token = db.findToken(uri, line, column);
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
            'static function ShowStartMessage(){}'
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
            "   Log(ClassA(self).Count)",
            '}',
        ]);
    });

    const classDefA = { token: { text: 'ClassA' }, uri: uriA };
    const classDefB = { token: { text: 'ClassB' }, uri: uriB };
    const varDefCount = { uri: uriA, varDefinition: { name: { text: 'Count' }} };
    const paramDefCanvas = { uri:uriB, paramDefinition: { name: { text: 'canvas'} }};
    const canvasClassDef = { token: { text: 'Canvas' }, classDefinition: { name: { text: 'Canvas' }}};
    const resetFnDef = { uri:uriCanvas, token: { text: 'Reset', line: 2 }, fnDefinition: { name: { text: 'Reset' }}};
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
        ['member method call', 18, 12, resetFnDef],
        ['member variable', 19, 11, { uri: uriA, token: { text: 'Count' }}],
        ['static keyword in expression', 20, 20, classDefA],
        ['default keyword in expression', 21, 25, classDefA],
        ['static function', 20, 31, showStartMessageFnDef],
        ['default var', 21, 30, varDefCount],
        ['typecast to class', 22, 10, classDefA],
        ['typecast to class member', 22, 23, varDefCount],
    ] as [string, number, number, TokenInformation][]
    )("findCrossFileDefinition finds %p at %p:%p", (_, line, column, expected) => {
        const token = db.findToken(uriB, line, column);
        let definition = db.findLocalFileDefinition(token);
        if (!definition.found) definition = db.findCrossFileDefinition(token);
        expect(definition).toMatchObject({...expected, found: true }); 
    });

    // find signature
    test.each([
        ['method signature', 18, 16, resetFnDef],
        ['static function signature', 20, 42, showStartMessageFnDef],
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