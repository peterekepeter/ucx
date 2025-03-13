# Change Log

### v0.24.4
- Fix missing completion for constants names
- Fix completion for inherited symbols when accessing as object member

### v0.24.3
- Provide completion for method overrides

### v0.24.2
- Fix duplicate completion items showing up

### v0.24.0
- Improve type completion for var and local declaration
- Render optional and coerce parameter decorators
- Use Actor in foreach allactors snippet instead of PlayerStart

### v0.23.0
- Adds parser and formatter support for generic types

### v0.22.3
- Hover on var tooltip includes classname where the var is declared

### v0.22.2
- Improve function highlight text
- Do not issue missing return warning for function prototypes

### v0.22.1
- Unused locals check report vars when they are only written or read
- Added find references support for goto labels
- Can format selected text range
- Ctrl+Click on symbol def takes you to reference 

### v0.21.12
- Fix find class variable references not returning results
- Fix find struct references not returning struct declaration

### v0.21.11
- Fix class reference when typecasting to class
- Fix class references from defaultproperties
- Fix rename symbol when using class'Name' syntax
- Find reference triggers workspace parse for non local symbols
- Fix class reference in extends syntax

### v0.21.10
- Fix lookup lookup for state only functions

### v0.21.9
- Fix var references for struct types
- Adds hover information for struct types
- Fix local var references for struct types

### v0.21.8
- Fix find function references returns results
- Fix find class references returns results

### v0.21.7
- Fix unused local check when referenced by lvalue
- Fix VsCode render unused variables

### v0.21.6
- Fix render const definition on hover
- Fix lookup default and static member on current class

### v0.21.5
- Fix find reference for constants in same file
- Fix lookup member constant
- Fix parsing local arrays

### v0.21.4
- Fix bad lookup when local symbol same as member of other class

### v0.21.3
- Fix standalone default keyword points to current class

### v0.21.2
- Fix easier to click on single character variables
- Fix parsing of multiple local variable definitions in a single statement

### v0.21.1
- Fix wrongly reported unused var when used in for loop

### v0.21.0
- Added check for unused local variable references
- Added check for return statements inside functions

### v0.20.0
- Added support for find all references, currently works for function locals
- Added support for rename, currently works for function locals

### v0.19.5
- Provides name completion for class names

### v0.19.4
- Fix missing completion in expressions

### v0.19.3
- Fix spacing after subtract operator when parenthesis on left side

### v0.19.2
- Improved completion queries

### v0.19.1
- Fixes operator spacing for increment/decrement operators
- Fixes signature helper for nested function calls
- Adds comma as signature helper trigger character (previsoly open paren only)

### v0.19.0
- Better distinction between function types in symbol provider.
- Library is now included into symbol search (can be disabled)
- CLI: Improved log handling quiet/verbose modes.
- CLI: Unique package build names disabled by default.

### v0.18.0
- Adds support for function signature helper when calling functions

### v0.17.0
- You can search for parent/child class references for given class
- Fix performance issue when failing to find definition, library is now cached

### v0.16.0
- Added support for folding multi-line comments, replication statements,
arrays of defaultproperties, labelled statement blocks
- Improves folding for functions, by folding on function declaration line

### v0.15.1
- Fix critical bug which introduce space when formatting closing parens for control structures.

### v0.15.0
- Basic function member completion provider triggered by pressing `.`
- Can disable package name mangling via `--no-package-mangle`

### v0.14.9
- Fix lookup class definition in a typecast
- Fix lookup members of a typecast

### v0.14.8
- Semicolon detect and fix is no longer considered experimental and is enabled by default
- Fix lookup for default variables

### v0.14.7
- Fix lookup for static functions
- Fix static and default parsed as keyword inside expressions

### v0.14.6
- Find variable or function member definition

### v0.14.5
- Fix stop scanning workspace/library symbols only after a full scan is run
- Fix lookup when param and type has same text
- Fix lookup class names with package specifier

### v0.14.4
- Only scan workspace and library folders once

### v0.14.3
- Improved custom typename lookup. Should be able to resolve most typenames.

### v0.14.2
- Improved find defintion for inherited variables and function
- Added configurable library path where class definitions can be loaded from

### v0.14.1
- Added support for displaying definition on mouse hover (works partially)
- Improved find definition for function and variables inside current file
- Improved find definition for parent class

### v0.13.4
- Fixes indentation of switch case with multiple stements and label indent
- Does not warn when class name contains underscore 
- Fixes semicolon autofix for return, break and continue statements

### v0.13.0
- Added support for workspace symbol provider. This enables usage of "Goto
  Symbol in Workspace" `Ctrl-T` or `Ctrl-P #` to quicky naviage to any 
  symbol from the workspace.

### v0.12.0
- Added support for document symbol provider

### v0.11.0
- added new option to override editor indentation style based on linter config

### v0.10.2
- better multiline variable declaration and multiline expressions
- better operator spacing (fixed varios edge cases)
- adds support for linter feature configuration support inside vscode

### v0.9.7
- parser supports full 451b, 469b sources (no crash or error)
