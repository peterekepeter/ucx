
# UCX (Unreal Script Extensions)

[![Node.js CD](https://github.com/peterekepeter/ucx/actions/workflows/node.js.yml/badge.svg)](https://github.com/peterekepeter/ucx/actions/workflows/node.js.yml)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=peterekepeter_ucx&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=peterekepeter_ucx)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=peterekepeter_ucx&metric=bugs)](https://sonarcloud.io/summary/new_code?id=peterekepeter_ucx)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=peterekepeter_ucx&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=peterekepeter_ucx)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=peterekepeter_ucx&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=peterekepeter_ucx)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=peterekepeter_ucx&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=peterekepeter_ucx)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=peterekepeter_ucx&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=peterekepeter_ucx)

Provides language support for UT99 unreal script. Is it a VsCode extension? 
Or does it extend the language itself? The answer is YES!

## Installation

> 🚧 Work in progress. Many features are still experimental! USE AT YOUR OWN RISK!

 - VsCode/Codium extension available
    - [Open VSX Registry](https://open-vsx.org/extension/peterekepeter/ucx)
    - [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=peterekepeter.ucx)
 - Command line tool [avaliable via npm](https://www.npmjs.com/package/ucx) 
    - requires [nodejs](https://nodejs.org/en)
    - recommended install globally `npm i -g ucx@latest` 
        - may need sudo on linux
    - recommended env var `UCC_PATH=path_to_ut99/System/UCC.exe`

## VsCode Features

 - syntax highlight
    - textmate grammar
    - semantic syntax highlighting
 - language support
    - partialy working find definition
    - find document or workspace symbols (`Ctrl-P @` and `Ctrl-P #`)
 - formatter support
    - automatic indentation
    - operator spacing
    - keyword casing
    - other spacing / newline rules
 - early detection / fix of problems
    - remove redundant default properties
    - (experimental) partially working automatic semicolon completion

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

**Enjoy!**
