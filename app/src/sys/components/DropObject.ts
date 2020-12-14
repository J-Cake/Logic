import * as p5 from 'p5';
import RenderObject from "./RenderObject";
import {manager} from "../../index";
import DragObject from "./DragObject";

export default abstract class DropObject extends RenderObject {
    dropItem: DragObject | null;

    protected abstract onDrop(object: DragObject): void;
    abstract isWithinDropBounds(pos: {x: number, y: number}): boolean;

    drop(object: DragObject): void {
        this.dropItem = object;
        this.onDrop(object);
    }

    protected constructor() {
        super();

        this.dropItem = null;

        manager.setState(prev => ({
            dropObjects: [...prev.dropObjects, this]
        }));
    }

    abstract draw(sketch: p5): void;
    abstract tick(sketch: p5): void;

    render(sketch: p5): void {
        if (this.dropItem)
            this.dropItem.render(sketch);
        this.draw(sketch);
    }

    protected update(sketch: p5): void {
        this.tick(sketch);
    }

    clean() {

    }

}
