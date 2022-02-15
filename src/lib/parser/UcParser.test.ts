import { UcParser } from "./UcParser";
import { ucTokenizeLine } from "../tokenizer/ucTokenizeLine";
import { UnrealClassExpression, UnrealClassStatement } from "./ast/UnrealClassFunction";


test("parse basic class declration", () => { 
    parsing(`class Util expands Info;`)
        .hasClassName('Util')
        .hasParentClassName('Info')
        .isAbstract(false)
        .isNative(false)
        .hasNativeReplication(false)
        .hasNoErrors();
});

test("parse class declaration with extra decorators", () => { parsing(`
    class Actor extends Object
        abstract
        native
        nativereplication;
    `)
    .hasClassName('Actor')
    .hasParentClassName('Object')
    .isAbstract(true)
    .isNative(true)
    .hasNativeReplication(true)
    .hasNoErrors();
});

test("parse variable declaration", () => { parsing(`
    var bool bDynamicLight;
    `)
    .hasVariable(0, 'bool', 'bDynamicLight', { const: false, transient: false })
    .hasNoErrors();
});

test("parse variable declaration with decorators", () => { parsing(`
    var transient const bool bTicked;
    `)
    .hasVariable(0, 'bool', 'bTicked', { const: true, transient: true })
    .hasNoErrors();
});

test("parse config var", () => { parsing(`
    var config string Description;
    `)
    .hasVariable(0, "string", "Description", { config: true });
});

test("parse variable declaration with group", () => { parsing(`
    var(Advanced) bool		bAlwaysRelevant;
    `)
    .hasVariable(0, 'bool', 'bAlwaysRelevant', { group: 'Advanced' })
    .hasNoErrors();
});

test("parse enum declaration", () => { parsing(`
    enum ENetRole
    {
        ROLE_None,              // No role at all.
        ROLE_DumbProxy,			// Dumb proxy of this actor.
        ROLE_SimulatedProxy,	// Locally simulated proxy of this actor.
        ROLE_AutonomousProxy,	// Locally autonomous proxy of this actor.
        ROLE_Authority,			// Authoritative control over the actor.
    };`)
    .hasEnum(0, 'ENetRole', 0, 'ROLE_None')
    .hasEnum(0, 'ENetRole', 1, 'ROLE_DumbProxy')
    .hasEnum(0, 'ENetRole', 2, 'ROLE_SimulatedProxy')
    .hasEnum(0, 'ENetRole', 3, 'ROLE_AutonomousProxy')
    .hasEnum(0, 'ENetRole', 4, 'ROLE_Authority')
    .hasNoErrors();
});

test("parse variable declaration with group", () => { parsing(`
    var(Advanced) bool		bAlwaysRelevant;
    `)
    .hasVariable(0, 'bool', 'bAlwaysRelevant', { group: 'Advanced' })
    .hasNoErrors();
});

test("keyword still works even if wrongly cased", () => { parsing(`
    CONST MAX_ITEMS = 32;
    VAR int thing;
    `)
    .hasNoErrors();
});

test("parse variable declaration with group", () => { parsing(`
    const MAX_ITEMS = 32;
    `)
    .hasConstant(0, {
        name: 'MAX_ITEMS',
        value: '32'
    })
    .hasNoErrors();
});

test("parse empty function", () => { parsing(`
    function PostBeginPlay(){
        
    }
    `)
    .hasFunction(0, {
        name: 'PostBeginPlay'
    })
    .hasNoErrors();
});

test("parse empty function with local var", () => { parsing(`
    function PostBeginPlay(){
        local int i;
    }
    `)
    .hasFunction(0, {
        name: 'PostBeginPlay',
        locals: [{
            type: 'int',
            name: 'i',
        }]
    })
    .hasNoErrors();
});

test("parse function with empty function call", () => { parsing(`
    function PreBeginPlay(){
        Init();
    }`)
    .hasFunction(0, {
        name: 'PreBeginPlay',
        body: [
            {
                op: 'Init',
            }
        ]
    })
    .hasNoErrors();
});

test("parse function with log", () => { parsing(`
    function PreBeginPlay(){
        Log("Hello World!");
    }`)
    .hasFunction(0, {
        name: 'PreBeginPlay',
        body: [
            {
                op: 'Log',
                args: ['"Hello World!"']
            }
        ]
    })
    .hasNoErrors();
});

test("parse expression recovery", () => { parsing(`
    function Fn1(){ Log( } 
    function Fn2(){ Log(42 }
    function Fn3(){ Log(42) }
    function Fn4(){ Log(42); }
    `)
    .hasFunction(0, { name: "Fn1" })
    .hasFunction(1, { name: "Fn2" })
    .hasFunction(2, { name: "Fn3" })
    .hasFunction(3, { name: "Fn4" });
});

test("parse block statement", () => { parsing(`
    function PreBeginPlay(){
        {
            Init();
        }
    }
    `)
    .hasFunction(0, { 
        name: "PreBeginPlay", 
        body: [{
            body: [{
                op: "Init"
            }]
        }] 
    });
});

test("parse if statement", () => { parsing(`
    function PreBeginPlay(){
        if (bFirstRun)
        {
            Init();
        }
    }
    `)
    .hasFunction(0, { 
        name: "PreBeginPlay", 
        body: [{
            op: "if",
            args: ['bFirstRun'],
            bodyFirst: '{',
            bodyLast: '}',
            body: [{
                op: "Init"
            }]
        }] 
    });
});

test("parse two sequential if statements", () => { parsing(`
    function Timer(){
        if (bFeatureA) {}
        if (bFeatureB) {}
    }`)
    .hasFunction(0, {
        name: "Timer", 
        body: [{
            op: "if",
            args: ['bFeatureA'],
            body: []
        },{
            op: "if",
            args: ['bFeatureB'],
            body: []
        }] 
    });
});

test("parse if inside if", () => { parsing(`
    function Timer(){
        if (bFlagA) {
            if (bFlagB) {
                Log("Hi");
            }
        }
    }`)
    .hasFunction(0, { body: [{
        op: "if",
        args: ["bFlagA"],
        bodyFirst: '{',
        bodyLast: '}',
        body: [{
            op: 'if',
            args: ["bFlagB"],
            bodyFirst: '{',
            bodyLast: '}',
            body: [{
                op:'Log',
                args: ['"Hi"']
            }]
        }]
    }] });
});


test("parse if with else", () => { parsing(`
    function Timer(){
        if (bFlag) { Log("enabled"); } 
        else { Log("disabled"); }
    }`)
    .hasFunction(0, { body: [{
        op: "if",
        args: ["bFlag"],
        body: [{
            op: 'Log',
            args: ['"enabled"'],
        }]
    },{
        op: "else",
        args: [],
        body: [{
            op: 'Log',
            args: ['"disabled"'],
        }]
    }] })
    .hasNoErrors();
});

test("parse while loop", () => { parsing(`
    function Main(){
        while (True)
        {
            Log("Hello");
        }
    }
    `)
    .hasFunction(0, { 
        name: "Main", 
        body: [{
            op: "while",
            args: ['True'],
            body: [{
                op: "Log",
                args: ['"Hello"']
            }]
        }] 
    });
});

test("parse basic assignment", () => { parsing(`
    function Init(){
        Count = 4;
    }
    `)
    .hasFunction(0, { 
        body: [{
            op: "=",
            args: ['Count', "4"]
        }] 
    });
});


test("parse for loop", () => { parsing(`
    function Main(){
        for (i=0;i<10;i++)
        {
            Log("Hello");
        }
    }
    `)
    .hasFunction(0, { 
        name: "Main", 
        body: [{
            op: "for",
            args: [
                {
                    op: '=',
                    args: ['i', '0']
                },
                {
                    op: '<',
                    args: ['i', '10']
                },
                {
                    op: '++',
                    args: ['i']
                }
            ],
            body: [{
                op: "Log",
                args: ['"Hello"']
            }]
        }] 
    });
});

test("parse recovers from bad control statement", () => { parsing(`
    function F0() { if }
    function F1() { if; }
    function F2() { if( }
    function F3() { if() }
    function F4() { if(); }
    function ModifyPlayer(Pawn pawn) { }
    `)
    .hasFunction(0, { name: 'F0' })
    .hasFunction(1, { name: 'F1' })
    .hasFunction(2, { name: 'F2' })
    .hasFunction(3, { name: 'F3' })
    .hasFunction(4, { name: 'F4' })
    .hasFunction(5, { name: 'ModifyPlayer' });
});

test("parse if statement without brackets", () => { parsing(`
    function PreBeginPlay(){
        if (bFirstRun)
            Init();
    }
    `)
    .hasNoErrors()
    .hasFunction(0, { 
        name: "PreBeginPlay", 
        body: [{
            op: "if",
            args: ['bFirstRun'],
            bodyFirst: 'Init',
            bodyLast: ';',
            body: [{
                op: "Init"
            }]
        }] 
    });
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
        hasClassName: (name: string) => checkEquals(name, ast.name?.text),
        hasParentClassName: (name: string) => checkEquals(name, ast.parentName?.text),
        hasNoErrors: () => checkEmpty(ast.errors),
        isAbstract: (flag: boolean) => checkEquals(flag, ast.isAbstract, "isAbstract should be " + flag),
        isNative: (flag: boolean) => checkEquals(flag, ast.isNative, "isNative should be " + flag),
        hasNativeReplication: (flag: boolean) => checkEquals(flag, ast.isNativeReplication, "hasNativeReplication should be " + flag),
        hasVariable: (index: number, type: string, name: string, props?: { transient?: boolean, const?: boolean, group?: string, config?: boolean }) => {
            checkEquals(ast.variables[index]?.type?.text, type);
            checkEquals(ast.variables[index]?.name?.text, name);
            if (props?.transient != null) {
                checkEquals(ast.variables[index]?.isTransient, props.transient);
            }
            if (props?.const != null) {
                checkEquals(ast.variables[index]?.isConst, props.const);
            }
            if (props?.group != null) {
                checkEquals(ast.variables[index]?.group?.text, props.group);
            }
            if (props?.config != null) {
                checkEquals(ast.variables[index]?.isConfig, props.config);
            } 
            return checks;
        },
        hasEnum: (index: number, name: string, enumIndex: number, enumName: string) => {
            checkEquals(ast.enums[index].name?.text, name);
            checkEquals(ast.enums[index].enumeration[enumIndex].text, enumName);
            return checks;
        },
        hasConstant(index: number, props: { name?:string, value?:string }){
            const obj = ast.constants[index];
            checkMatches({ 
                name: obj?.name?.text, 
                value: obj?.value?.text 
            }, props);
            return checks;
        },
        hasFunction(index: number, props: { 
                name?:string,
                locals?:{
                   name?:string,
                   type?:string 
                }[],
                body?:StatementCheckObj[]
            }){
            const obj = ast.functions[index];
            checkMatches({
                name: obj?.name?.text,
                locals: obj?.locals?.map(l => ({
                    name: l.name?.text,
                    type: l.type?.text
                })),
                body: mapBodyToCheck(obj?.body) ?? []
            }, props);
            return checks;
        }
    };
    return checks;

    function checkEquals(a: any, b: any, message?: string) {
        expect(a).toBe(b);
        return checks;
    }

    function checkEmpty(container: any) {
        expect(container).toEqual([]);
        return checks;
    }

    function checkMatches(actual: object, expected: object){
        expect(actual).toMatchObject(expected);
        return checks;
    }
}
function mapBodyToCheck(body: UnrealClassStatement[]) {
    return body?.map(mapStatementToCheck) ?? [];
}

interface ExpressionCheckObj
{
    op?: string,
    args?: (string | ExpressionCheckObj)[],
}

interface StatementCheckObj extends ExpressionCheckObj
{
    bodyFirst?: string,
    bodyLast?: string,
    body?: StatementCheckObj[]
}

function mapStatementToCheck(e: UnrealClassStatement): StatementCheckObj {
    return ({
        ...mapExpressionToCheck(e),
        body: mapBodyToCheck(e.body),
        bodyFirst: e.bodyFirstToken?.text,
        bodyLast: e.bodyLastToken?.text
    });
}

function mapExpressionToCheck(e: UnrealClassExpression): ExpressionCheckObj {
    return ({
        op: e.op?.text ?? '',
        args: e.args?.map(a => "text" in a ? a.text : mapExpressionToCheck(a) )
    });
}

