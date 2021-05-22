# Canvas Application Boilerplate

This boilerplate provides a complex and powerful interface for building advanced, scalable and efficient canvas applications for the web.

It comes with three main libraries: p5.js, jquery and MouseTrap, a keybinding library.

The boilerplate uses TypeScript, Express and Browserify to enable the code to run on the client side.

## Compiling

1. Install dependencies
    ```$ pnpm i```
2. Compile TypeScript
    ```$ pnpx tsc```
3. Build
    ```$ node ./bin/build.js```
4. Start
    ```$ node ./build/app/server.js --port=<port?>```

The default port is 3500 with an optional port being specifiable.

If no source has changed and only static files need to be updated, the `--static` flag can be passed to the build script.
    ```$ node ./bin/build.js --static```
    
## Components

There are a number of prebuild components available throughout the boilerplate which allow fast prototyping of functionality. 

An inbuilt [State Manager](/doc/state.md) class allows a set of variables to be globally accessible. The manager can keep track of events as well as notifying of state change.
Note that as many instances as needed can be created, however it is easiest to use just one as managing multiple can become difficult.

A [Colour](/doc/colour.md) library allows programs to quickly and easily manipulate sets of colours and change themes. 
[Interpolation](/doc/colour.md#interpolation) systems exist also to allow smooth transitions between themes.

[Drag](/doc/drag-and-drop.md#drag) and [Drop](/doc/drag-and-drop.md#drop) support exist for interfaces that require it.


 