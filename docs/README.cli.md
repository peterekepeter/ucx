
# UCX Command Line Tool

Dedicated language support and tooling UnrealScript, with primary focus on UT99.

## Features

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
