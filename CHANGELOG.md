# Change Log

### v0.19.3
- Fixed spacing after subtract operator when parenthesis on left side

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
