
# UCX (Unreal Script Extensions)

[![Node.js CD](https://github.com/peterekepeter/ucx/actions/workflows/node.js.yml/badge.svg)](https://github.com/peterekepeter/ucx/actions/workflows/node.js.yml)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=peterekepeter_ucx&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=peterekepeter_ucx)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=peterekepeter_ucx&metric=bugs)](https://sonarcloud.io/summary/new_code?id=peterekepeter_ucx)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=peterekepeter_ucx&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=peterekepeter_ucx)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=peterekepeter_ucx&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=peterekepeter_ucx)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=peterekepeter_ucx&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=peterekepeter_ucx)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=peterekepeter_ucx&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=peterekepeter_ucx)

Dedicated language support and tooling UnrealScript, with primary focus on UT99.

## VsCode Features

### Syntax Highlighting

Syntax highlighting is done through both a textmate grammar file and
semantic token highlighting is supported on top of that to provide the 
best possible syntax higlighting that is both fast and is done with the 
symbol type as identified by the grammar.

![Image of unreal script code with syntax highlighting](./demo/syntax.png)

### Code Folding 

Defaultproperties, states, labels, replication, function inside state, 
labels inside states can be folded can all be independently. This also makes
the editor display which state you're currently editing at the top of the file
even if you're not scrolled to the beginning of the state.

![Code with some states and functions folded](./demo/folding.png)

### Code Navigation

The extension can find the definition and references for most symbols allowing
you to go to definition (`Ctrl-Click`), search through the symbols 
(`Ctrl-P @` and `Ctrl-P #` or `Ctrl-T`), find references.

![User hovering overy symbols and going to definition](./demo/navigation.gif)

### Completion

The extension will scan the current workspace and an optional library path to
provide code completion completion is supported and help with function 
singatures.

![User typing and expressions getting completed](./demo/completion.gif)

### Class hierarcy

You can browse class hierarchy just like in unrealed. Right click a 
class name and select "Show Type Hierarchy". You can also show parents of
a class for reverse direction.

![Tree view of classes expanding and collapsing](./demo/classhierarcy.gif)

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

![Shows code before formatting and after](./demo/formatting.gif)

### Diagnostics

One of the goals is to early detect issues before compilation. Syntax errors,
missing semicolons and some other checks are reported. Additional typechecking
is work in progress.

## CLI Features

 - lint command
    - runs all checks for given folder or file errors/warning messages inside 
    with file paths and syntax highlighting, great as automated check for PRs
 - build command
    - can be used build system for your unreal script projects
        - can auto generate ini file for build
        - copies files into temporary build folder
        - runs ucc build
    - language extensions
        - moves all code files into `Classes` subdir, this enables having folder 
        in sources for better project organization while flattening the structure
        so that its compatible with `ucc make`
        - basic constant folding
 - wrapper for any ucc command
    - path to UCC configured via env or cli argument
    - supports windows/linux/wine

## Installation

 - VsCode/Codium extension available
    - [Open VSX Registry](https://open-vsx.org/extension/peterekepeter/ucx)
    - [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=peterekepeter.ucx)
 - Command line tool [avaliable via npm](https://www.npmjs.com/package/ucx) 
    - requires [nodejs](https://nodejs.org/en)
    - recommended install globally `npm i -g ucx@latest` 
        - may need sudo on linux
    - recommended env var `UCC_PATH=path_to_ut99/System/UCC.exe`

**Enjoy!**
