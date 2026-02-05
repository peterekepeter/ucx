
# UCX VsCode Extension

[![Node.js CD](https://github.com/peterekepeter/ucx/actions/workflows/node.js.yml/badge.svg)](https://github.com/peterekepeter/ucx/actions/workflows/node.js.yml)

Dedicated language support and tooling for the UnrealScript language with 
primary focus on UT99 (Unreal Engine 1). The primary goal is to be able to 
work and maintain large UnrealScript projects by bringing modern IDE features
to an old programming language.

## VsCode Features

### Syntax Highlighting

Syntax highlighting is done through both a textmate grammar file and
semantic token highlighting is supported on top of that to provide the 
best possible syntax higlighting that is both fast and is done with the 
symbol type as identified by the grammar.

![Image of unreal script code with syntax highlighting](https://raw.githubusercontent.com/peterekepeter/ucx/refs/heads/master/docs/demo/syntax.png)

### Code Folding 

Defaultproperties, states, labels, replication, function inside state, 
labels inside states can be folded can all be independently. This also makes
the editor display which state you're currently editing at the top of the file
even if you're not scrolled to the beginning of the state.

![Code with some states and functions folded](https://raw.githubusercontent.com/peterekepeter/ucx/refs/heads/master/docs/demo/folding.png)

### Code Navigation

The extension can find the definition and references for most symbols allowing
you to go to definition (`Ctrl-Click`), search through the symbols 
(`Ctrl-P @` and `Ctrl-P #` or `Ctrl-T`), find references.

![User hovering overy symbols and going to definition](https://raw.githubusercontent.com/peterekepeter/ucx/refs/heads/master/docs/demo/navigation.gif)

### Completion

The extension will scan the current workspace and an optional library path to
provide code completion completion is supported in most situations.

![User typing and expressions getting completed](https://raw.githubusercontent.com/peterekepeter/ucx/refs/heads/master/docs/demo/completion.gif)

### Class hierarcy

You can browse class hierarchy just like in unrealed. Right click a 
class name and select "Show Type Hierarchy". You can also show parents of
a class for reverse direction.

![Tree view of classes expanding and collapsing](https://raw.githubusercontent.com/peterekepeter/ucx/refs/heads/master/docs/demo/classhierarcy.gif)

### Formatting

This extension supports code formatting. Documents or just selected regions
or changed code can be formatted depending on user configuration. 

The following features are supported and can be enabled/disable in user 
configuration if they are not needed.
- automatic indentation
- operator spacing
- keyword casing
- other spacing / newline rules
- remove redundant default properties
- semicolon completion

![Shows code before formatting and after](https://raw.githubusercontent.com/peterekepeter/ucx/refs/heads/master/docs/demo/formatting.gif)

### Diagnostics

One of the goals is to early detect issues before compilation. Syntax errors,
missing semicolons and some other checks are reported. Additional typechecking
is work in progress.

- unused local variable are detected and reported as warnings
- function with missing return expression is also a warning
- when trying to use invalid chars inside name you get an error
- and more...

### Other IDE features/limitations

- rename symbols is supported but works well only for simple cases, for 
local variable definitions for example it works perfectly

- find definition works but can struggle on complex or rare use cases

- variable completion works for the most part but it does not check for type

- color picker is provided when defining color in default properties when
the color struct is detected

- find all references only works for simple cases but may have duplicates 
or missed references for now so I still find myself using grep


**Enjoy!**
