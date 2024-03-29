
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

 - language:
    - goto definition (`Ctrl-Click`)
    - find symbols (`Ctrl-P @` and `Ctrl-P #` or `Ctrl-T`)
    - folding support for defaultproperties, states, labels, replication
    - completion support for methods (partially working)
    - function signature support
    - class hierarcy: (right click on class & select Show Type Hierarchy)
 - formatter:
    - automatic indentation
    - operator spacing
    - keyword casing
    - other spacing / newline rules
    - remove redundant default properties
 - diagnostics:
    - detect syntax parse errors
    - semicolon completion
 - highlight:
    - textmate grammar
    - semantic syntax highlighting

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
