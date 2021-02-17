# Building LogicX

LogicX is a project of decent size, but nothing extreme. 
It requires a simple set of tools, consisting mostly of standard build-chain tools. 

## Notes:
* This document uses the `$` and `#` notations to signify access-levels in CLI shells.
`$` represents a shell with user-level access, while a `#` represents a command executed under the root user, **or** with `sudo`. (Under Administrator terminal for Windows systems)
* This document uses the `pnpm` package manager for cleanliness reasons, as the utility is more lightweight and produces less output than npm, note however that their syntax is interchangeable.


## Prerequisites

* [NodeJS](https://nodejs.org) > 14.0
* [NPM](https://npmjs.com) (Any package manager capable of building native modules works also)
* [SQLite3](https://npmjs.com/package/sqlite3) 
* [Git](https://git-scm.com) (or any GUI/CLI client capable of cloning repositories)
* Any directory with full write access (execute access is optional, but recommended)

### SQLite3
From personal experience, SQLite3 can be tedious to initialise, configure and generally get running stably, 
but a simple thing to note is that for linux systems, the installation can be heavily simplified with a package from the repositories.

1) ```# apt-get install sqlite3```

### Clone the code

To get started, it is a good idea to clone the repository first, that way, 
updates can be synchronised easily with local versions.
Of course, if you do not wish to obtain version updates, 
this step can be replaced by simply downloading a zipped version of the repository from [GitHub](https://github.com/J-Cake/Logic/)

1) ```$ cd ~/<some accessible folder>``` 
2) ```$ git clone https://github.com/J-Cake/Logic```
3) ```$ cd ./Logic```

## Building
Once the repository has been cloned, the project dependencies can be installed. This is done through the package manager.
Ensure the following commands are executed from within the project. 

> Each command **must** be executed from the project root as the build script uses the PWD as reference to output files
> 
1) ```# pnpm install``` (This requires sudo as the binding libraries for BCrypt and SQLite3 require it for building)
2) ```# pnpm install typescript -g```
3) ```$ pnpx tsc```
4) ```$ node ./bin/build```
5) ```$ node ./bin/configuredb.js```
6) ```$ node ./build/app/server/HTTP/index.js 2560```
7) Go to [http://localhost:2560](http://localhost:2560) to view the project.

### Conveniences

The build script is capable of building smaller components at a time. For instance, the main application can be built separately from the componentMenu
This is done by passing the `--components` flag a comma-separated list of components. 
A list of available components can be found with `node ./bin/build --no-build`, where the list of each component is prefixed with *Skipping component*

If you do not want to build any modules, and instead only updated static files, this can be accounted for, by passing the `--static` flag to the build script.

The server can also be bundled, although this is only necessary in situations where the application needs embedding or to take up as little space as possible. This is done by passing `--components=server` the same way as before.

By passing the `--dev` option to the build script, the application modules are built in development mode, enabling source-maps, and disabling minification.

Similarly, through the `--dev` option to the server (`/build/app/server/HTTP/index.js`), the server starts in dev mode, allowing for live-reloading with a HTTP request to [/api/reload-local](http://localhost:2560/api/reload-local)