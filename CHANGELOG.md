# Change Log

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
