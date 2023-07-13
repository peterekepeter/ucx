import { UcParser } from "./UcParser";
import { ucTokenizeLine } from "../tokenizer/ucTokenizeLine";
import { UnrealClassExpression, UnrealClassStatement } from "./ast/UnrealClassFunction";
import { SemanticClass as C } from ".";


test("parse basic class declration", () => { 
    parsing(`class Util expands Info;`)
        .hasClassName('Util')
        .hasParentClassName('Info')
        .isAbstract(false)
        .isNative(false)
        .isNoExport(false)
        .isTransient(false)
        .isSafeReplace(false)
        .hasNativeReplication(false)
        .hasPerObjectConfig(false)
        .hasNoErrors();
});

test("parse class declaration with extra decorators", () => { parsing(`
    class Actor extends Object
        abstract
        native
        nativereplication
        perobjectconfig;
    `)
    .hasClassName('Actor')
    .hasParentClassName('Object')
    .isAbstract(true)
    .isNative(true)
    .hasNativeReplication(true)
    .hasPerObjectConfig(true)
    .hasNoErrors();
});


test("parse class declaration with noexport", () => { 
    parsing(`class Object native noexport;`)
        .hasNoErrors()
        .hasClassName('Object')
        .hasParentClassName(null)
        .isNoExport(true)
        .isNative(true);
});

test("parse class declaration with noexport", () => { 
    parsing(`class InternetInfo extends Info native transient;`)
        .hasNoErrors()
        .hasClassName('InternetInfo')
        .isTransient(true);
});

test("parse class declaration with safereplace", () => { 
    parsing(`class Texture extends Bitmap safereplace native noexport;`)
        .hasNoErrors()
        .hasClassName('Texture')
        .hasParentClassName('Bitmap')
        .isSafeReplace(true)
        .isNative(true);
});

test("parse class declaration with intrinsic", () => { parsing(`
        class Line expands Actor intrinsic;
    `)
    .hasNoErrors()
    .hasClassName('Line')
;});

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

test("parse variable with travel decorator", () => { parsing(`
    var travel int               CTFRank;
    var int               NotTravel;
    `)
    .hasVariable(0, 'int', 'CTFRank', { travel: true })
    .hasVariable(1, 'int', 'NotTravel', { travel: false })
    .hasNoErrors();}
);

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

test("parse const delcaration with vector", () => { parsing(`
    const Lotus=vect(1,2,3);
    `)
    .hasNoErrors()
    .hasConstant(0, { name:'Lotus', expr: { op: 'vect' } })
;});

test("parse variable declaration with private/const/editconst modifiers", () => { parsing(`
    var native private const int ObjectInternal[6];
    var native const object Outer;
    var native const int ObjectFlags;
    var(Object) native const editconst name Name;
    var(Object) native const editconst class Class;
    `)
    .hasTokens(['var', C.Keyword], ['native', C.ModifierKeyword], ['private', C.ModifierKeyword], ['const', C.ModifierKeyword], ['int', C.TypeReference], ['ObjectInternal', C.ClassVariable])
    .hasTokens(['editconst', C.ModifierKeyword], ['name', C.TypeReference], ['Name', C.ClassVariable])
    .hasVariable(0, 'int', 'ObjectInternal')
    .hasVariable(1, 'object', 'Outer')
    .hasVariable(2, 'int', 'ObjectFlags')
    .hasVariable(3, 'name', 'Name')
    .hasVariable(4, 'class', 'Class')
    .hasNoErrors();
});

test("parse operator declarations", () => { parsing(`
    native(161) static final operator(34) int  += ( out int A, int B );
    native(162) static final operator(34) int  -= ( out int A, int B );
    native(163) static final preoperator  int  ++ ( out int A );
    native(164) static final preoperator  int  -- ( out int A );
    native(165) static final postoperator int  ++ ( out int A );
    native(166) static final postoperator int  -- ( out int A );
    `)
    .hasNoErrors()
    .hasFunction(0, { name: '+=', returns: 'int' })
    .hasFunction(1, { name: '-=', returns: 'int' })
    .hasFunction(2, { name: '++', returns: 'int' })
    .hasFunction(3, { name: '--', returns: 'int' })
    .hasFunction(4, { name: '++', returns: 'int' })
    .hasFunction(5, { name: '--', returns: 'int' })
;});

test("parse operator with skip-able parameters", () => { parsing(`
    native(132) static final operator(32) bool  || ( bool A, skip bool B );
    `)
    .hasNoErrors()
    .hasFunction(0, { name: '||', returns: 'bool', fnArgs: [{
        name: 'A',
        isSkip: false,
    }, {
        name: 'B',
        isSkip: true,
    }] })
;});

test("parse iterator function", () => { parsing(`
    native(304) final iterator function AllActors( class<actor> BaseClass, out actor Actor, optional name MatchTag );
    `)
    .hasNoErrors()
    .hasFunction(0, { name: 'AllActors', iterator: true })
;});

test("parse empty function", () => { parsing(`
    function PostBeginPlay(){
        
    }
    `)
    .hasFunction(0, {
        name: 'PostBeginPlay',
        isFinal: false,
        isSimulated: false,
        isStatic: false,
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
        ],
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


test("parse if statement with nonstadard casing", () => { parsing(`
    function PreBeginPlay(){
        If (bFirstRun)
        {
            Init();
        }
    }
    `)
    .hasFunction(0, { 
        name: "PreBeginPlay", 
        body: [{
            op: "If",
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


test("parse if else without brackets", () => { parsing(`
    function PreBeginPlay(){
        if (bFirstRun)
            Init();
        else
            Log("Ok");
    }
    `)
    .hasNoErrors()
    .hasFunction(0, { 
        name: "PreBeginPlay", 
        body: [{
            op: "if",
        },{
            op: "else",
            args: [],
            bodyFirst: 'Log',
            bodyLast: ';',
            body: [{
                op: "Log",
                args: ['"Ok"']
            }]
        }] 
    });
});


test("parse if statement with function call in condition", () => { parsing(`
    function Init(){
        if (CheckSomething()){
            SaveConfig();
        }
    }
    `)
    .hasFunction(0, {
        body: [{
            op: "if",
            args: [{
                op: "CheckSomething",
                args: [],
            }],
            body:[{
                op: "SaveConfig",
                args: [],
            }]
        }]
    })
    .hasNoErrors();
});


test("parse else if statement", () => { parsing(`
    function Init(){
        if (OptionA) { Log("A"); }
        else if (OptionB) { Log("B"); }
        else { Log("None"); }
    }`)
    .hasFunction(0, {
        name:"Init"
    })
    .hasNoErrors();
});


test("parse switch statement", () => { parsing(`
function Init() {
	switch (E)
	{
		case 2:
            Log("2");
            break;
    }
}`)
    .hasFunction(0, {
        name:"Init",
        body: [{
            op: "switch",
            args: ["E"],
            // TODO switch body AST
        }]
    })
    .hasTokens(["switch", C.Keyword])
    .hasTokens(["case", C.Keyword])
    .hasTokens(["break", C.Keyword])
    .hasNoErrors();
});


test("parse static function", () => { parsing(`
    static function Hello(){
        Log("Hello World!");
    }
    `)
    .hasFunction(0, { name: "Hello", isStatic: true })
    .hasNoErrors();
;
});

test('parse latent function declaration', () => { parsing(`
    native(256) final latent function Sleep( float Seconds );
    `)
    .hasNoErrors()
    .hasFunction(0, { name: "Sleep", isLatent: true }); //todo assert latent
});


test("parse function return type", () => { parsing(`
    function bool IsAlive() {}
    `)
    .hasFunction(0,{
        name: 'IsAlive',
        returns: 'bool',
    });
});


test("parse function return", () => { parsing(`
    function int GetNumber(){
        return 42;
    }`)
    .hasFunction(0, {
        body: [{
            op: 'return',
            args: ['42']
        }]
    });
});


test("parse function argument", () => { parsing(`
    function int DoubleIt(int num){
        return num*2;
    }`)
    .hasFunction(0, {
        fnArgs:[{
            type: 'int', 
            name: 'num',
            isOptional: false,
            isOut: false,
            isCoerce: false,
        }]
    });
});


test("parse function argument out", () => { parsing(`
    function DoubleIt(int num, out int result) {
        result = num * 2;
    }`)
    .hasFunction(0, {
        fnArgs: [{
            type: 'int',
            name: 'num',
        }, {
            type: 'int',
            name: 'result',
            isOut: true,
        }]
    });
});

test("parse function argument array", () => { parsing(`
    native function bool SendBinary( IpAddr Addr, int Count, byte B[255] );
    `)
    .hasFunction(0, {
        name: 'SendBinary',
        fnArgs: [{
            type: 'IpAddr',
            name: 'Addr',
        }, {
            type: 'int',
            name: 'Count',
        }, {
            type: 'byte',
            array: 255,
            name: 'B',
        }]
    })
;});

test("parse variable with array", () => { parsing(`
    var string Items[32];
    `)
    .hasVariable(0, 'string', 'Items', {
        array: 32,
    });
});


test("parse config variable with array", () => { parsing(`
    var config string A;
    var config string M[8192];

    defaultproperties
    {
        A=""
        M(0)=""
    }
    `)
    .hasNoErrors()
    .hasVariable(0, 'string', 'A', { array: undefined, config: true, })
    .hasVariable(1, 'string', 'M', { array: 8192, config: true, })
    .hasDefaultProperty(0, { name: 'A', value: '""', arrayIndex: undefined })
    .hasDefaultProperty(1, { name: 'M', value: '""', arrayIndex: "0" });
});


test("parse default properties section", () => { parsing(`
    defaultproperties {
        Description="Your description here!"
        DamageModifier=1.0
    }
    `)
    .hasNoErrors()
    .hasDefaultProperty(0, { name: "Description", value: '"Your description here!"' })
    .hasDefaultProperty(1, { name: "DamageModifier", value: "1.0" });
});


test("parse default properties section with negative value", () => { parsing(`
    defaultproperties {
        PlayerID=-1

        DamageModifier=1.0
    }
    `)
    .hasNoErrors()
    .hasDefaultProperty(0, { name: "PlayerID", value: '-1' })
    .hasDefaultProperty(1, { name: "DamageModifier", value: "1.0" });
});


test("parse defaultproperties empty string", () => { parsing(`
    defaultproperties {
        PrefixDictionary=""
    }
    `)
    .hasNoErrors()
    .hasDefaultProperty(0, { name: "PrefixDictionary", value: '""' })
;});

test("parse defaultproperties with missing value", () => { parsing(`
    defaultproperties {
        ReducedDamageType=
        ReducedDamagePct=0.500000
    }`)
    .hasNoErrors()
    .hasDefaultProperty(0, { name: "ReducedDamageType" })
    .hasDefaultProperty(1, { name: "ReducedDamagePct", value: "0.500000" })
;});


test("parse defaultproperties with unfinished name", () => { parsing(`
    defaultproperties {
        ReducedDamageType='
        ReducedDamagePct=0.500000
    }`)
    .hasNoErrors()
    .hasDefaultProperty(0, { name: "ReducedDamageType" })
    .hasDefaultProperty(1, { name: "ReducedDamagePct", value: "0.500000" })
;});

test("parse default property with semicolon is not an error", () => { parsing(`
    defaultproperties {
        Misc=Class'Engine.GameInfo';
        Other=Texture'SomePack.DirtTex0';
    }`)
    .hasNoErrors()
    .hasDefaultProperty(0, { 
        name: 'Misc', 
        value: { op: 'Class', args:["'Engine.GameInfo'"] }
    })
    .hasDefaultProperty(1, { 
        name: 'Other', 
        value: { op: 'Texture', args:["'SomePack.DirtTex0'"] }
    })
;});

test("parse event as function", () => { parsing(`
    event ActorEntered( actor Other )
    {
        Log("entered");
    }`)
    .hasNoErrors()
    .hasFunction(0, { name:"ActorEntered" });
});


test("parse multiline comment", () => { parsing(`
    function Update(){
        if ( self.bWaterZone )
        {
            PP.SetPhysics(PHYS_Swimming);
        }
        /*else
        {
            PP.SetPhysics(PHYS_Falling);
        }*/
    }`)
    .hasNoErrors();
});


test("parse class custom config", () => { parsing(`
    class CustomZone expands ZoneInfo config(MyConfig);
    `)
    .hasNoErrors()
    .hasClassConfig('MyConfig');
});

test("parse class with config keyword but no parameter", () => { parsing(`
    class CustomZone expands ZoneInfo config;
    `)
    .hasNoErrors();
});

test("parse exec instruction", () => { parsing(`
    #exec Texture Import File=Textures\NuRaRulesBG.pcx Name=NuRaRulesBG Group=Windows Mips=On Flags=2
    class XClass;
    `)
    .hasNoErrors();
});


test("parse localized string", () => { parsing(`
        var localized string TimeMessage[16];
    `)
    .hasNoErrors()
    .hasVariable(0, "string", "TimeMessage", {
        array: 16,
        localized: true
    })
    .hasTokens(['var', C.Keyword], ['localized', C.ModifierKeyword]);
});


test("parse simulated function", () => { parsing(`
    static simulated function ClientReceive() { }
    `)
    .hasNoErrors()
    .hasFunction(0, { name: "ClientReceive", isSimulated: true })
    .hasTokens(['static', C.Keyword], ['simulated', C.Keyword], ['function', C.Keyword]);
});


test("parse exec function", () => { parsing(`
    exec function Fire( optional float F ) {}
    function NotExec( optional float F ) {}
    `)
    .hasNoErrors()
    .hasFunction(0, { name: "Fire", isExec: true })
    .hasFunction(1, { name: "NotExec", isExec: false })
    .hasTokens(['exec', C.Keyword], ['function', C.Keyword], ['Fire', C.FunctionDeclaration]);
});

test("parse optional function parameter", () => { parsing(`
    function PrintError(optional string message){}
    `)
    .hasNoErrors()
    .hasFunction(0, { name: "PrintError", fnArgs: [ {name: 'message', type:'string', isOptional: true }] });
});


test("parse coerce function parameter", () => { parsing(`
    function PrintError(coerce string message){}
    `)
    .hasNoErrors()
    .hasFunction(0, { name: "PrintError", fnArgs: [ {name: 'message', type:'string', isCoerce: true }] });
});


test("parse default property for array type", () => { parsing(`
    defaultproperties
    {
        TimeMessage(14)="10 seconds left!"
    }`)
    .hasNoErrors()
    .hasDefaultProperty(0, { name: "TimeMessage", arrayIndex: "14" });
});


test("parse default property for array type with sound reference", () => { parsing(`
    defaultproperties
    {
        TimeSound(4)=Sound'Announcer.(All).cd1min'
    }`)
    .hasNoErrors()
    .hasDefaultProperty(0, { 
        name: "TimeSound", 
        arrayIndex: "4", 
        value: { op:'Sound', args: ["'Announcer.(All).cd1min'"] } 
    });
});


test("parse default property boolean value", () => { parsing(`
    defaultproperties
    {
        bEnabled=True
    }`)
    .hasNoErrors()
    .hasDefaultProperty(0, { 
        name: "bEnabled", 
        value: "True"
    });
});


test("parse default property with struct is not error", () => { parsing(`
    defaultproperties
    {
        DrawColor=(G=255,B=160) 
    }`)
    .hasNoErrors()
    .hasDefaultProperty(0, { 
        name: "DrawColor", 
        value: {
            op: '('
        }
    });
});

test("parse default property with enum value", () => { parsing(`
    defaultproperties
    {
        Role=ROLE_Authority
        RemoteRole=ROLE_DumbProxy
    }`)
    .hasNoErrors()
    .hasDefaultProperty(0, { 
        name: "Role", 
        value: 'ROLE_Authority',
    })
    .hasDefaultProperty(1, { 
        name: "RemoteRole", 
        value: 'ROLE_DumbProxy',
    });
});


test("parse multiple class variables", () => { parsing(`
    var int First, Second, Third;
    `)
    .hasNoErrors()
    .hasVariable(0, "int", "First")
    .hasVariable(1, "int", "Second")
    .hasVariable(2, "int", "Third")
    .hasTokens(
        ['First', C.ClassVariable],
        [',', C.None],
        ['Second', C.ClassVariable],
        [',', C.None],
        ['Third', C.ClassVariable]
    );
});


test("parse function with final modifier", () => { parsing(`
    final function float Init() { }
    `)
    .hasNoErrors()
    .hasFunction(0, { name: 'Init', isFinal: true });
});


test("parse foreach", () =>{ parsing(`
    function Timer(){
        local Projectile A;

        foreach AllActors( class 'Projectile', A )
        {
            Log(A);
        }
    }`)
    .hasNoErrors()
    .hasTokens(['foreach', C.Keyword])
    .hasFunction(0, {
        body: [
            {
                bodyFirst: '{',
                bodyLast: '}',
                op:'foreach', body: [ { op: 'Log' }]
            }
        ]
    });
});

test("parse single statement foreach", () =>{ parsing(`
    function Timer(){
        local Projectile A;

        foreach AllActors( class 'Projectile', A )
            Log(A);
    }`)
    .hasNoErrors()
    .hasTokens(['foreach', C.Keyword])
    .hasFunction(0, {
        body: [
            {
                bodyFirst: 'Log',
                bodyLast: ';',
                op:'foreach', body: [ { op: 'Log' }],
                args: [{ op:'AllActors' }]
            }
        ]
    });
});

test("parse type variable", () => { parsing(`
    var class<actor> EnterActor;
    `)
    .hasNoErrors()
    .hasVariable(0, 'class', 'EnterActor', {
        template: 'actor',
    })
    .hasTokens(['var',C.Keyword], ['class', C.TypeReference], ['<', C.None], ['actor', C.ClassReference], ['>', C.None]);
});

test("parse class type in function parameter declaration", () => { parsing(`
    function Test(class<Weapon> weapon)
    {
    }`)
    .hasNoErrors()
    .hasFunction(0, {
        name: 'Test',
        fnArgs: [{
            name: 'weapon',
            type: 'class',
            template: 'Weapon',
        }]
    })
;});


test("parse globalconfig var", () => { parsing(`
    var globalconfig int FragLimit;
    `)
    .hasNoErrors()
    .hasVariable(0, 'int', 'FragLimit', { config: true });
});


test("parse var with empty group", () => { parsing(`
    var () string	ListFactories[10];
    `)
    .hasNoErrors();
});


test("parse localized var", () => { parsing(`
    var Localized String ColorCol[11];
    `)
    .hasNoErrors();
});

test("parse input var", () => { parsing(`
    var input float aMouseX, aMouseY;
    var float v;
    `)
    .hasNoErrors()
    .hasVariable(0, 'float', 'aMouseX', { isInput: true })
    .hasVariable(2, 'float', 'v', { isInput: false })
;});

test("parse var with inline struct declaration", () => { parsing(`
    var struct BeaconInfo
    {
        var IpAddr      Addr;
        var float       Time;
        var string      Text;
    } Beacons[32];`)
    .hasStruct(0, { name: 'BeaconInfo' })
    .hasVariable(0, 'BeaconInfo', 'Beacons', { array: 32 })
    .hasNoErrors();
;});


test("parse empty state", () => { parsing(`
    state MyState {}`)
    .hasNoErrors()
    .hasTokens(
        ['state', C.Keyword],
        ['MyState', C.StateDeclaration]
    )
    .hasState(0, { name:'MyState' });
});


test("parse state functions does not crash", () => { parsing(`
    state Idle
    {
        function AnimEnd()
        {
            PlayIdleAnim();
        }
    }
`).hasNoErrors()
    .hasState(0, { 
        name:'Idle', 
        functions: [{
            name: 'AnimEnd'
        }]
    });
});


test("parse state with simulated function", () => { parsing(`
    state ClientFiring
    {
        simulated function bool ClientAltFire(float Value)
        {
        }
    }
`).hasNoErrors()
    .hasState(0, {
        name: "ClientFiring",
        functions: [{
            name: 'ClientAltFire'
        }]
    });}
);

test("parse state with singular function", () => { parsing(`
    state SomeState
    {
        singular event BaseChange()
        {
        }
    }
`).hasNoErrors()
    .hasState(0, {
        name: "SomeState",
        functions: [{
            name: 'BaseChange'
        }]
    });}
);

test("parse state with single ignore", () => { parsing(`
    state NormalFire
    {
        ignores Fire;
    }
`).hasNoErrors()
    .hasState(0, { 
        name: "NormalFire", 
        ignores: ["Fire"] 
    })
    .hasTokens(['ignores', C.Keyword], ['Fire', C.FunctionReference]);
;});

test("parse state with multiple ignores separated by comma", () => { parsing(`
    state NormalFire
    {
        ignores Fire, AltFire, AnimEnd;
    }
`).hasNoErrors()
    .hasState(0, { 
        name: "NormalFire", 
        ignores: ["Fire", "AltFire", "AnimEnd"] 
    })
;});

test("parse state() with local var inside state function", () => { parsing(`
    state() StandOpenTimed
    {
        function Attach( actor Other )
        {
            local pawn  P;
        }
    }`)
    .hasNoErrors()
;});

test("parse state with latent instructions", () => { parsing(`
    auto state MyState
    {
    Begin:
        Log( "MyState has just begun!" );
        Sleep( 2.0 );
        Log( "MyState has finished sleeping" );
        goto('Begin');
    }`)
    .hasNoErrors()
    .hasTokens(['Log', C.FunctionReference], ['(', C.None], ['"MyState has just begun!"', C.LiteralString])
;
});

test("parse state extends state", () => { parsing(`
    state EEDDAA extends DDAA
    {
            function f();
    }
    state DDAA {}`)
    .hasTokens(
        ['state', C.Keyword],
        ['EEDDAA', C.StateDeclaration],
        ['extends', C.Keyword],
        ['DDAA', C.StateReference]
    )
    .hasNoErrors()
    .hasState(0, { name: 'EEDDAA', parentState: 'DDAA' })
    .hasState(1, { name: 'DDAA' })
;});

test("parse new object syntax", () => { parsing(`
    function F(){
        r1 = new class'NodeReplacer';
    }`)
    .hasNoErrors()
    .hasTokens(['r1', C.VariableReference], ['=', C.Operator], ['new', C.Keyword]);
    // TODO assert AST syntax
});

test("parse new object syntax with arguments", () => { parsing(`
    function F(){
        ClientConf = new (class'UcxConfig', 'UcxConfig') class'UcxConfig';
    }
    `)
    .hasNoErrors()
    .hasTokens(
        ['ClientConf', C.VariableReference], 
        ['=', C.Operator], 
        ['new', C.Keyword], 
        ['(', C.None],
        ['class', C.ClassReference],
        ["'UcxConfig'", C.ObjectReferenceName],
        [',', C.None],
        ["'UcxConfig'", C.LiteralName],
        [')', C.None],
        ['class', C.ClassReference],
        ["'UcxConfig'", C.ObjectReferenceName],
    );
    // TODO assert AST syntax
});

test('parse all variant of new() syntax', () => { parsing(`
    function BeginPlay()
    {
        to = new class'TestObj';
        to = new()class'TestObj';
        to = new(self)class'TestObj';
        to = new(self,'')class'TestObj';
        to = new(self,'',0)class'TestObj';
    }`)
    .hasNoErrors()
    .hasFunction(0, { name: "BeginPlay", body: [
        {}, // new class'TestObj';
        {}, // new()class'TestObj';
        {}, // new(self)class'TestObj';
        {}, // new(self,'')class'TestObj';
        {}, // new(self,'',0)class'TestObj';
    ] })
;});

test("parse super call", () => { parsing(`
    function F(){
        super.F();
    }`)
    .hasNoErrors()
    .hasTokens(['super', C.Keyword], ['.', C.None], ['F', C.FunctionReference]);
});


test("parse self call", () => { parsing(`
    function F(){
        self.G();
    }`)
    .hasNoErrors()
    .hasTokens(['self', C.Keyword], ['.', C.None], ['G', C.FunctionReference]);
});


test("parse native function declaration", () => { parsing(`
    native(1718) final function bool AddToPackageMap( optional string PkgName );
    `)
    .hasNoErrors()
    .hasFunction(0, { name: 'AddToPackageMap', native: true })
;});


test("struct parsing", () => { parsing(`
    struct PointRegion
    {
        var zoneinfo Zone;       // Zone.
        var int      iLeaf;      // Bsp leaf.
        var byte     ZoneNumber; // Zone number.
    };`)
    .hasNoErrors()
    .hasStruct(0, {
        name: 'PointRegion',
        members: [{
            name: 'Zone',
            type: 'zoneinfo',
        },{
            name: 'iLeaf',
            type: 'int',
        },{
            name: 'ZoneNumber',
            type: 'byte',
        }]
    })
    .hasTokens(['struct', C.Keyword], ['PointRegion', C.StructDeclaration])
    .hasTokens(['var', C.Keyword], ['zoneinfo', C.TypeReference], ['Zone', C.StructMemberDeclaration])
;});


test('parse struct extending another struct', () => { parsing(`
    // A plane definition in 3d space.
    struct Plane extends Vector
    {
        var() config float W;
    };`)
    .hasNoErrors()
    // todo assert parent
;});

test('parse struct where member has inline enum definition', () => { parsing(`
    struct Scale
    {
        var() config vector Scale;
        var() config float SheerRate;
        var() config enum ESheerAxis
        {
            SHEER_None,
            SHEER_XY,
            SHEER_XZ,
            SHEER_YX,
            SHEER_YZ,
            SHEER_ZX,
            SHEER_ZY,
        } SheerAxis;
    };`)
    .hasNoErrors()
    .hasStruct(0, { name: 'Scale', members: [
        { name: 'Scale' },
        { name: 'SheerRate' },
        { name: 'SheerAxis', type: 'ESheerAxis' }
    ]})
;});


test('parse array declaration with parse array count expression', () => { parsing(`
    var string GameModeName[ArrayCount(RuleList)];
`).hasNoErrors()
    .hasVariable(0, 'string', 'GameModeName', {
        arrayExpression: {
            op: 'ArrayCount',
            args: ['RuleList']
        }
    });});


test('parse resolves array count expression', () => { parsing(`
        var string RuleList[512];
        var string GameModeName[ArrayCount(RuleList)];
    `)
    .hasNoErrors()
    .hasVariable(0, 'string', 'RuleList', { array: 512 })
    .hasVariable(1, 'string', 'GameModeName', { array: 512 });
});
    

test('parse return expression result', () => { parsing(`
function bool Test() {
    return i < j;
}
`).hasNoErrors()
    .hasFunction(0, {
        body: [{
            op: 'return',
            args: [{
                op: '<',
                args: [
                    'i',
                    'j',
                ]
            }]
        }]
    });
});


test('parse complex boolean && expression', () => { parsing(`
function bool Test() {
    return (i < j) && (i < ArrayCount(Items));
}
`).hasNoErrors()
    .hasFunction(0, {
        body: [{
            op: 'return',
            args: [{
                op: '&&',
                args: [{
                    op: '<',
                    args: [ 'i', 'j' ]
                },
                {
                    op: '<',
                    args: [
                        'i',
                        {
                            op: 'ArrayCount',
                            args: [ 'Items' ]
                        },
                    ]
                },]
            }]
        }]
    });
});

test('parse return array count', () => { parsing(`
function bool Test() {
    return ArrayCount(TestArray);
}
`).hasNoErrors()
    .hasFunction(0, {
        body: [{
            op: 'return',
            args: [{
                op: 'ArrayCount',
                args: [
                    'TestArray',
                ]
            }]
        }]
    });
});


test('parse complex return complex expression parsed correctly', () => { parsing(`
function bool Test() {
    return i < ArrayCount(RuleList);
}
`).hasNoErrors()
    .hasFunction(0, {
        body: [{
            op: 'return',
            args: [{
                op: '<',
                args: [
                    'i',
                    { 
                        op: 'ArrayCount',
                        args:['RuleList']
                    }
                ]
            }]
        }]
    });
});


test('parse function return call result', () => { parsing(`
function bool Test() {
    return OtherTest(42);
}
`).hasNoErrors()
    .hasFunction(0, {
        body: [{
            op: 'return',
            args: [{
                op: 'OtherTest',
                args: [
                    '42'
                ]
            }]
        }]
    });
});


test('parse labels in function body', () => { parsing(`
function Test() {
    RESET:
    Value=0;
}
`).hasNoErrors()
    .hasFunction(0, {
        body: [{
            op: '=',
            label: 'RESET',
            args: ['Value', '0']
        }]
    })
    .hasTokens(['RESET', C.StatementLabel]);
});

test('parse labelled control statements', () => { parsing(`
function Test() {
    RESET:
    while(true) { L001: break; }
}`)
    .hasNoErrors()
    .hasTokens(['while', C.Keyword])
    .hasFunction(0, {
        body: [{
            label: 'RESET',
            op: 'while',
            args: ['true'],
            body: [{
                label: 'L001',
                op: 'break'
            }]
        }]
    });
});

test('parse for inside if without brackets', () => {parsing(`
    function Test(){
        position="before";
        if(bActive)
            while(true)
                break;
        position="after";
         
    }`)
    .hasTokens(['if', C.Keyword])
    .hasTokens(['while', C.Keyword])
    .hasTokens(['break', C.Keyword])
    .hasFunction(0, {
        body:[
            { op:'=', args:['position', '"before"'] },
            { op:'if', args:['bActive'], body: [
                { op:'while', args:['true'], body: [
                    { op: 'break' }
                ]}
            ]},
            { op:'=', args:['position', '"after"'] },
        ]
    });
});


test('parse goto loop has correct tokens', () => {parsing(`
    function Test(){
        LOOP:
        Log("hello");
        goto LOOP;
    }`)
    .hasTokens(['LOOP', C.StatementLabel], [':', C.None])
    .hasTokens(['goto', C.Keyword], ['LOOP', C.StatementLabel], [';', C.None])
;});


test('parse while, break and continue has correct tokens', () => {parsing(`
    function Test(){
        while (true) {
            if (i > 10) {
                i--;
                continue;
            }
            else {
                break;
            }
        }
    }`)
    .hasTokens(['while', C.Keyword], ['(', C.None])
    .hasTokens(['break', C.Keyword], [';', C.None])
    .hasTokens(['continue', C.Keyword], [';', C.None])
;});


test('parse block statement termination also terminates single statement block', () => {parsing(`
    function Test(){
        while (true)
            if (bActive){
                DoStuff();
            }
        if (bOther)
            DoOtherStuff();
    }`)
    .hasFunction(0, { body: [
        { op: 'while', args: ['true'], body: [
            { op: 'if', args: ['bActive'], body: [
                { op: 'DoStuff' }
            ]}
        ]},
        { op: 'if', args: ['bOther'], body: [
            { op: 'DoOtherStuff' }
        ]}
    ]})
;});

test('parse single statement if with empty statement for', () => { parsing(`
    function Test(){
        i = 0;
        if(i == -1)
            for(i = 0; i<50 && Level.Game.IPPolicies[i] != ""; i++);
        Log(""$i);
    }
    `)
    .hasNoErrors()
;});

test('parse do until loop', () => { parsing(`
    function Test(){
        log("test");
        do {
            i++;
            log("iteration "$i);
            if(i==7||i==9||i>18)
                continue;
            log("...");
        } until( i>20 );
    }`)
    .hasNoErrors()
    .hasFunction(0, { name: "Test", body: [
        { op:'log' },
        { op:'do' },
        { op:'until' },
    ] })
;});


test('parse splits statements without relying on semicolon', () => {parsing(`
    function Test(){
        Log("hello")
        Log("world")
    }`)
    .hasFunction(0, { body: [
        { op: 'Log', args: ['"hello"'] },
        { op: 'Log', args: ['"world"'] },
    ]})
;});

test('parse splits assignment statements without relying on semicolon', () => {parsing(`
    function Test(){
        A = 1
        B = 3
    }`)
    .hasFunction(0, { body: [
        { op: '=', args: ['A', '1'] },
        { op: '=', args: ['B', '3'] },
    ]})
;});


test('parse private function', () => {parsing(`
    function private DoSomething(string arg){}
    private function AnotherOne() {}
    function NotPrivateFunction() {}`)
    .hasTokens(
        ['function', C.Keyword], 
        ['private', C.Keyword], 
        ['DoSomething', C.FunctionDeclaration])
    .hasFunction(0, {
        name: 'DoSomething',
        isPrivate: true,
    })
    .hasFunction(1, {
        name: 'AnotherOne',
        isPrivate: true,
    })
    .hasFunction(2, {
        name: 'NotPrivateFunction',
        isPrivate: false,
    });
});

test('parse singular function', () => {parsing(`
    singular function Bump(){}
    function NotSingular(){}`)
    .hasTokens(
        ['singular', C.Keyword], 
        ['function', C.Keyword], 
        ['Bump', C.FunctionDeclaration])
    .hasFunction(0, {
        name: 'Bump',
        isSingular: true,
    })
    .hasFunction(1, {
        name: 'NotSingular',
        isSingular: false,
    })
;});

test('parse variable declaration combined with enum', () => { parsing(`
    var(Display) enum ERenderStyle
    {
        STY_None,
        STY_Normal,
        STY_Masked,
        STY_Translucent,
        STY_Modulated,
    } Style;
    `)
    .hasNoErrors()
    .hasVariable(0, 'ERenderStyle', 'Style')
    .hasEnum(0, 'ERenderStyle', 0, 'STY_None')
    .hasEnum(0, 'ERenderStyle', 1, 'STY_Normal')
    // todo assert parsed var and enum
;});

test('parse variable declaration with export modifier', () => { parsing(`
    var const export model  Brush;
    `)
    .hasNoErrors()
    .hasVariable(0, 'model', 'Brush', { export: true }); 
});

test('parse replication statement', () => { parsing(`
    replication
    {
        unreliable if( Role==ROLE_Authority )
		    bHidden, bOnlyOwnerSee;

        reliable if( Role<ROLE_Authority )
            BroadcastMessage, BroadcastLocalizedMessage;
    }`)
    .hasNoErrors()
    .hasTokens(['replication', C.Keyword])
    .hasTokens(['reliable', C.Keyword], ['if', C.Keyword])
    .hasTokens(['unreliable', C.Keyword], ['if', C.Keyword])
    .hasReplication(0, 0, {
        isReliable: false, 
        condition: {
            op: '==',
            args: ['Role', 'ROLE_Authority']
        },
        targets: ['bHidden', 'bOnlyOwnerSee'],
    })
    .hasReplication(0, 1, {
        isReliable: true, 
        condition: {
            op: '<',
            args: ['Role', 'ROLE_Authority']
        },
        targets: ['BroadcastMessage', 'BroadcastLocalizedMessage'],
    });
});

test('parse replication statement with extra parenthesis in condition', () => { parsing(`
    replication
    {
        unreliable if( (Role==ROLE_Authority) && bSomething )
		    bHidden, bOnlyOwnerSee;
    }`)
    .hasNoErrors()
    .hasReplication(0, 0, {
        isReliable: false, 
        targets: ['bHidden', 'bOnlyOwnerSee'],
    });
});

interface ParserTestChecks
{
    hasClassName(name: string): ParserTestChecks
    hasParentClassName(name: string | null): ParserTestChecks
    hasClassConfig(name: string): ParserTestChecks
    hasNoErrors(): ParserTestChecks
    isAbstract(flag: boolean): ParserTestChecks
    isNative(flag: boolean): ParserTestChecks
    isTransient(flag: boolean): ParserTestChecks
    isSafeReplace(flag: boolean): ParserTestChecks
    isNoExport(flag: boolean): ParserTestChecks
    hasNativeReplication(flag: boolean): ParserTestChecks
    hasPerObjectConfig(flag: boolean): ParserTestChecks
    hasVariable(index: number, type: string, name: string, props?: { 
        transient?: boolean, 
        const?: boolean, 
        group?: string, 
        config?: boolean, 
        array?:number, 
        travel?:boolean,
        localized?:boolean,
        isInput?: boolean,
        export?: boolean,
        template?:string,
        arrayExpression?:ExpressionCheckObj
    }): ParserTestChecks
    hasEnum(index: number, name: string, enumIndex: number, enumName: string): ParserTestChecks
    hasConstant(index: number, props: { 
        name?:string, 
        value?:string,
        expr?: ExpressionCheckObj,
    }): ParserTestChecks
    hasFunction(index: number, props: { 
        name?:string,
        locals?:{
           name?:string,
           type?:string 
        }[],
        body?:StatementCheckObj[],
        isStatic?: boolean,
        isSimulated?: boolean,
        isFinal?: boolean
        isPrivate?: boolean,
        isExec?: boolean,
        isSingular?: boolean,
        isLatent?: boolean,
        native?: boolean,
        iterator?: boolean,
        returns?: string,
        fnArgs?: { 
            type?: string,
            template?: string,
            name?: string,
            array?: number,
            isOut?: boolean,
            isOptional?: boolean,
            isCoerce?: boolean,
            isSkip?: boolean,
        }[]
    }): ParserTestChecks,
    hasDefaultProperty(index: number, props: { name?: string, value?: ExpressionCheckObj | string, arrayIndex?: string }): ParserTestChecks
    hasTokens(...expected: [string, C][]): ParserTestChecks,
    hasReplication(bodyIndex: number, statementIndex: number, props: { isReliable?: boolean, condition?: ExpressionCheckObj, targets?: string[] }): ParserTestChecks,
    hasState(index: number, props: { 
        name?:string,
        functions?: { name: string }[],
        ignores?: string[],
        parentState?: string,
    }): ParserTestChecks
    hasStruct(index: number, props: {
        name?: string,
        members?: {
            name?: string,
            type?: string,
        }[],
    }): ParserTestChecks
}

function parsing(input: string): ParserTestChecks {
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
        hasParentClassName: (name: string) => checkEquals(name, ast.parentName?.text ?? null),
        hasClassConfig: (name: string) => checkEquals(name, ast.configName?.text),
        hasNoErrors: () => checkEmpty(ast.errors),
        isAbstract: (flag: boolean) => checkEquals(flag, ast.isAbstract, "isAbstract should be " + flag),
        isNative: (flag: boolean) => checkEquals(flag, ast.isNative, "isNative should be " + flag),
        isNoExport: (flag: boolean) => checkEquals(flag, ast.isNoExport, "isNoExport should be " + flag),
        isTransient: (flag: boolean) => checkEquals(flag, ast.isTransient, "isTransient should be " + flag),
        isSafeReplace: (flag: boolean) => checkEquals(flag, ast.isSafeReplace, "isSafeReplace should be " + flag),
        hasNativeReplication: (flag: boolean) => checkEquals(flag, ast.isNativeReplication, "hasNativeReplication should be " + flag),
        hasPerObjectConfig: (flag: boolean) => checkEquals(flag, ast.isPerObjectConfig, "isPerObjectConfig should be " + flag),
        hasVariable: (index: number, type: string, name: string, props?: { transient?: boolean, const?: boolean, group?: string, config?: boolean, array?:number, localized?:boolean, isInput?:boolean, travel?:boolean, export?:boolean, template?:string, arrayExpression?:ExpressionCheckObj }) => {
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
            if (props?.array != null){
                checkEquals(ast.variables[index]?.arrayCount, props.array);
            }
            if (props?.export != null){
                checkEquals(ast.variables[index]?.isExport, props.export);
            }
            if (props?.localized != null){
                checkEquals(ast.variables[index]?.localized, props.localized);
            }
            if (props?.travel != null){
                checkEquals(ast.variables[index]?.isTravel, props.travel);
            }
            if (props?.isInput != null){
                checkEquals(ast.variables[index]?.isInput, props.isInput);
            }
            if (props?.template != null){
                checkEquals(ast.variables[index]?.template?.text, props.template);
            }
            if (props?.arrayExpression != null){
                const expr = ast.variables[index]?.arrayCountExpression;
                const actual = expr && 'op' in expr ? mapExpressionToCheck(expr) : {};
                checkMatches(actual, props.arrayExpression);
            }
            return checks;
        },
        hasEnum: (index: number, name: string, enumIndex: number, enumName: string) => {
            checkEquals(ast.enums[index].name?.text, name);
            checkEquals(ast.enums[index].enumeration[enumIndex].text, enumName);
            return checks;
        },
        hasConstant(index: number, props: { name?:string, value?:string, expr?:ExpressionCheckObj }){
            const obj = ast.constants[index];
            const expr = obj?.valueExpression;
            checkMatches({ 
                name: obj?.name?.text, 
                value: obj?.value?.text,
                expr: !expr || 'text' in expr ? expr : mapExpressionToCheck(expr),
            }, props);
            return checks;
        },
        hasFunction(index: number, props: { 
                name?:string,
                locals?:{
                   name?:string,
                   type?:string 
                }[],
                body?:StatementCheckObj[],
                isStatic?: boolean,
                isSimulated?: boolean,
                isFinal?: boolean,
                isExec?: boolean,
                isLatent?: boolean,
                native?: boolean,
                iterator?: boolean,
                returns?: string,
                fnArgs?: { 
                    type?: string,
                    name?: string,
                    array?: number,
                    isOut?: boolean,
                    isOptional?: boolean,
                    isCoerce?: boolean,
                    isSkip?: boolean,
                }[]
            }){
            const obj = ast.functions[index];
            checkMatches({
                name: obj?.name?.text,
                locals: obj?.locals?.map(l => ({
                    name: l.name?.text,
                    type: l.type?.text,
                })),
                body: mapBodyToCheck(obj?.body) ?? [],
                isStatic: obj.isStatic,
                isFinal: obj.isFinal,
                isSimulated: obj.isSimulated,
                isPrivate: obj.isPrivate,
                isExec: obj.isExec,
                isSingular: obj.isSingular,
                isLatent: obj.isLatent,
                native: obj.isNative,
                iterator: obj.isIterator,
                returns: obj.returnType?.text,
                fnArgs: obj.fnArgs.map(a => ({ 
                    name:a.name?.text,
                    type: a.type?.text,
                    template: a.template?.text,
                    array: a.arrayCount,
                    isOut: a.isOut, 
                    isOptional: a.isOptional,
                    isCoerce: a.isCoerce,
                    isSkip: a.isSkip,
                }))
            }, props);
            return checks;
        },
        hasDefaultProperty(index: number, props: { name?: string, value?: ExpressionCheckObj | string, arrayIndex?: string }){
            const obj = ast.defaultProperties[index];
            const v = obj?.value;
            checkMatches({
                name: obj?.name?.text,
                value: v ? ('text' in v) ? v.text : mapExpressionToCheck(v) : null,
                arrayIndex: obj?.arrayIndex?.text,
            }, props);
            return checks;
        },
        hasTokens(...expected: [string, C][]){
            const actual: [string, string][] = ast.tokens.map(t => [t.text, C[t.type]]);
            const startIndex = actual.findIndex(t => t[0] === expected[0][0]);
            const actualSlice = actual.slice(startIndex, startIndex + expected.length);
            const expectedMapped = expected.map(t => [t[0], C[t[1]]]);
            expect(actualSlice).toMatchObject(expectedMapped);
            return checks;
        },
        hasReplication(blockIndex: number, statementIndex: number, props: { isReliable?: boolean, condition?: ExpressionCheckObj, targets?: string[] }){
            // TODO
            const statement = ast.replicationBlocks[blockIndex]?.statements[statementIndex];
            const condition = statement?.condition;
            const actual = {
                isReliable: statement?.isReliable,
                targets: statement?.targets.map(t => t.text),
                condition: condition == null ? null : 'op' in condition ? mapExpressionToCheck(condition) : condition
            };
            expect(actual).toMatchObject(props);
            return checks;
        },
        hasState(index: number, props: { name?:string, ignores?: string[], functions?: { name: string }[], parentState?: string }){
            const obj = ast.states[index];
            expect({ 
                name: obj?.name?.text, 
                functions: obj?.functions?.map(f => ({
                    name: f.name?.text
                })),
                ignores: obj?.ignores?.map(i => i.text),
                parentState: obj?.parentStateName?.text,
            } as typeof props).toMatchObject(props);
            return checks;
        },
        hasStruct(index: number, props: { 
            name?: string,
            members?: {
                name?: string,
                type?: string,
            }[],
         }){
            const obj = ast.structs[index];
            expect({ 
                name: obj?.name?.text,
                members: obj?.members.map(m => ({
                    name: m.name?.text,
                    type: m.type?.text,
                }))
            } as typeof props).toMatchObject(props);
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
    label?: string,
    body?: StatementCheckObj[]
}

function mapStatementToCheck(e: UnrealClassStatement): StatementCheckObj {
    return ({
        ...mapExpressionToCheck(e),
        body: mapBodyToCheck(e.body),
        label: e.label?.text,
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

