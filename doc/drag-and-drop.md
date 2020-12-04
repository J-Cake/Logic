# Drag

An abstract class representing objects that can be picked up by the used and dropped on a `DropObject` class

### details
| **File**                       | **Export**         | **Definition**                             | **Description**                        |
|--------------------------------|--------------------|--------------------------------------------|----------------------------------------|
| ./src/components/DragObject.ts |`default`           | `abstract DragObject extends RenderObject` | A class representing draggable objects |

## `abstract DragObject extends RenderObject`

* *`protected constructor(keepOriginal: boolean = false, skipRenderer: boolean = false)`*

    * `keepOriginal`: Indicates whether the object represents a source of many objects. If false, only one object exists and none are created. Default is false
    * `skipRenderer`: Indicates whether the object is rendered manually. Default is false
    * **returns**: DragObject
    
* `protected abstract isHover(mousePos: {x: number, y: number}) => boolean` Check if the mouse cursor falls within bounds of the object
    * `mousePos`: `{x, y}` The `x` and `y` coordinates of the mouse cursor respectively.
    * **returns**: Whether the mouse is within bounds

* `abstract draw(sketch: p5) => void` The overridable function to perform drawing every cycle
    * `sketch` The container of the drawing tools. For reference see (p5.js)[https://p5js.org/reference]
    
* `abstract tick(sketch: p5) => void` The overridable function to perform calculation every cycle
    * `sketch` The container of the drawing tools. For reference see (p5.js)[https://p5js.org/reference]
    
* `move(pos: {x: number, y: number}) => void` Update a moving object
    * `pos` The location to move the object to.
    
* `render(sketch: p5) => void` Function that draws the object.
    * `sketch` The container of the drawing tools. For reference see (p5.js)[https://p5js.org/reference]
    
* `update(sketch: p5) => void` Function that recalculates things.
    * `sketch` The container of the drawing tools. For reference see (p5.js)[https://p5js.org/reference]
    
* `clean() => void` Perform any cleanup work

# Drop

An abstract class representing objects that can be picked up by the used and dropped on a `DropObject` class

### details
| **File**                       | **Export**         | **Definition**                             | **Description**                      |
|--------------------------------|--------------------|--------------------------------------------|--------------------------------------|
| ./src/components/DropObject.ts |`default`           | `abstract DropObject extends RenderObject` | A class representing a drop location |

## `abstract DropObject extends RenderObject`

* *`protected constructor()`*
    * **returns**: DragObject
    
* `protected abstract onDrop(object: DragObject) => void` Handler for the drop event
    * `object`: The object that was dropped
    
* `drop(object DragObject) => void` Drop an object
    * `object`: The object to drop
    
* `protected abstract isWithinBounds(pos: {x: number, y: number}) => boolean` Check if the mouse cursor falls within bounds of the object
    * `mousePos`: `{x, y}` The `x` and `y` coordinates of the mouse cursor respectively.
    * **returns**: Whether the mouse is within bounds

* `abstract draw(sketch: p5) => void` The overridable function to perform drawing every cycle
    * `sketch` The container of the drawing tools. For reference see (p5.js)[https://p5js.org/reference]
    
* `abstract tick(sketch: p5) => void` The overridable function to perform calculation every cycle
    * `sketch` The container of the drawing tools. For reference see (p5.js)[https://p5js.org/reference]
    
* `render(sketch: p5) => void` Function that draws the object.
    * `sketch` The container of the drawing tools. For reference see (p5.js)[https://p5js.org/reference]
    
* `update(sketch: p5) => void` Function that recalculates things.
    * `sketch` The container of the drawing tools. For reference see (p5.js)[https://p5js.org/reference]
    
* `clean() => void` Perform any cleanup work