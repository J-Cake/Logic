# Colour Management

The Colour management system allows fast specification of themes

### details
| **File**                   | **Export**         | **Definition**                                                                                                                                   | **Description**                                                 |
|----------------------------|--------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------|
| ./src/util/Colour.ts       |`default`           | `enum Colour`                                                                                                                                    | A list of all colour types                                      |
| ./src/util/Colour.ts       |`theme`             | `enum Theme`                                                                                                                                     | A list of all available themes                                  |
| ./src/util/Colour.ts       |`rgb`               | `type rgb`                                                                                                                                       | Type Alias for [red, green, blue]                               |
| ./src/util/Colour.ts       |`rgba`              | `type rgba`                                                                                                                                      | Type Alias for [red, green, blue, alpha]                        |
| ./src/util/Colour.ts       |`interpolateColour` | `interpolateColour(frame: number, endFrame: number, colour1: rgb, colour2: rgb, interpolationType: Interpolation = Interpolation.linear) => rgb` | Function to allow smooth interpolation between defined colours  |
| ./src/util/Colour.ts       |`getColour`         | `getColour(colour: Colour, interpolation?: {duration: number, type?: Interpolation}) => rgb`                                                     | Function to resolve the colour name to usable RGB values        |
| ./src/util/Colour.ts       |`darken`            | `darken(colour: Colour, amount: number) => rgb`                                                                                                  | Resolve the colour name and darken it                           |
| ./src/util/Colour.ts       |`lighten`           | `lighten(colour: Colour, amount: number) => rgb`                                                                                                 | Resolve the colour name and lighten it                          |
| ./src/util/Colour.ts       |`transparent`       | `transparent(colour: Colour, amount: number) => rgb`                                                                                             | Resolve the colour name and add a transparency channel to it    |

## `interpolateColour(frame: number, endFrame: number, colour1: rgb, colour2: rgb, interpolationType: Interpolation = Interpolation.linear) => rgb`
Function to allow smooth interpolation between defined colours

* `frame`: The current frame of animation
* `endFrame`: The frame the transition will end on
* `colour1`: The starting colour
* `colour2`: The finishing colour
* `interpolationType`: The function of time representing a percentage through the transition. Default is `linear`.
* **returns**: A usable colour

## `getColour(colour: Colour, interpolation?: {duration: number, type?: Interpolation}) => rgb` 
Resolve a colour into a usable format

* `colour` A colour identifier
* `interpolation?` 
    * `duration`: The number of frames the the colour should be interpolated for
    * `type?`: The function of time representing a percentage through the transition. Default is `linear`.
    
* **returns**: A usable colour

## `darken(colour: Colour, amount: number) => rgb` 
Resolve a colour and darken it

* `colour` A colour identifier
* `amount` The amount of units the colour is darkened by.
    
* **returns**: A usable colour

## `lighten(colour: Colour, amount: number) => rgb` 
Resolve a colour and lighten it

* `colour` A colour identifier
* `amount` The amount of units the colour is lightened by.
    
* **returns**: A usable colour

## `transparent(colour: Colour, amount: number) => rgb` 
Resolve a colour and add a transparency channel

* `colour` A colour identifier
* `amount` The transparency value
    
* **returns**: A usable colour

# Interpolation

Colour interpolation is the process of grading between two colours with a known factor.

###details

| **File**                    | **Export**               | **Definition**                                                                        | **Description**                                                            |
|-----------------------------|--------------------      |---------------------------------------------------------------------------------------|----------------------------------------------------------------------------|
| ./src/util/interpolation.ts | `default`                | `interpolate(n: number, from: number, to: number, type: Interpolation) => number`     | A number between 0 and 1 indicating the factor to place a value in a range |
| ./src/util/interpolation.ts | `Interpolation`          | `enum Interpolation`                                                                  | The list of different interpolation methods                                |
| ./src/util/interpolation.ts | `map`                    | `(n: number, start1: number, stop1: number, start2: number, stop2: number) => number` | Take a number of known range and map it to a new range                     |
| ./src/util/interpolation.ts | `interpolationFunctions` | `Record<Interpolation, (n: number) => number>`                                        | The definitions for each interpolation method                              |
| ./src/util/interpolation.ts | `constrain`              | `(n: number, min: number, max: number) => number`                                     | Keep a value between a minimum and maximum                                 |
