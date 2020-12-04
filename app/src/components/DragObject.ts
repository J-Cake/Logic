import RenderObject from "./RenderObject";
import * as p5 from 'p5';

import {manager} from '../index';

export default abstract class DragObject extends RenderObject {
    isDragging: boolean;
    readonly keepOriginal: boolean; // indicates whether dragObject has finite amount

    pos: {
        x: number,
        y: number;
    };

    dragStart: {
        x: number,
        y: number
    };

    protected constructor(keepOriginal: boolean = false, skipRenderer: boolean = false) {
        super(skipRenderer);

        this.isDragging = false;
        this.keepOriginal = keepOriginal;

        this.pos = {
            x: 0,
            y: 0
        };

        this.dragStart = {
            x: 0,
            y: 0
        };

        manager.setState(prev => ({
            dragObjects: [...prev.dragObjects, this]
        }));

        manager.on("mouseDown", prev => {
            if (this.isHover(manager.setState().mouse))
                this.dragStart = prev.mouse;
        });

        manager.on("mouseUp", () => {
            if (this.isDragging) {
                const {mouse, dropObjects} = manager.setState();
                dropObjects.find(i => i.isWithinDropBounds(mouse))?.drop(this);
            }
            this.isDragging = false;
        });
    }

    protected abstract isHover(mousePos: {x: number, y: number}): boolean;

    abstract draw(sketch: p5): void;
    protected abstract tick(sketch: p5): void;

    move(pos: {x: number, y: number}) {
        this.pos = pos;
    }

    render(sketch: p5): void {
        this.draw(sketch);
    }

    update(sketch: p5): void {
        const {mouseDown, mouse} = manager.setState();
        if (mouseDown &&
            this.isHover(mouse) &&
            Math.sqrt((this.dragStart.x + sketch.mouseX) ** 2 + (this.dragStart.y + sketch.mouseY) ** 2) > 5) // Threshold for movement being considered a drag
            this.isDragging = true;

        if (this.isDragging) {
            this.pos.x = sketch.mouseX;
            this.pos.y = sketch.mouseY;
        }

        this.tick(sketch);

        // relative movement
        // this.pos.x += sketch.mouseX - sketch.pmouseX;
        // this.pos.y += sketch.mouseY - sketch.pmouseY;
    }

    clean() {

    }

}
