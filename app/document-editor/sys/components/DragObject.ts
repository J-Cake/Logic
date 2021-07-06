import RenderObject from './RenderObject';
import type p5 from 'p5';

import {manager} from '../../';

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

    abstract draw(sketch: p5): void;

    move(pos: { x: number, y: number }) {
        this.pos = pos;
    }

    render(sketch: p5): void {
        this.draw(sketch);
    }

    update(sketch: p5): void {
        const {mouseDown, mouse, p_mouse} = manager.setState();
        if (mouseDown && this.isHover(mouse) &&
            Math.sqrt((this.dragStart.x + mouse.x) ** 2 + (this.dragStart.y + mouse.x) ** 2) > 5) // Threshold for movement being considered a drag
            this.isDragging = true;

        // if (this.isDragging) {
        //     this.pos.x = sketch.mouseX;
        //     this.pos.y = sketch.mouseY;
        // }

        // relative movement
        if (this.isDragging) {
            this.pos.x += mouse.x - p_mouse.x;
            this.pos.y += mouse.y - p_mouse.y;
        }

        this.tick(sketch);
    }

    clean() {

    }

    protected abstract isHover(mousePos: { x: number, y: number }): boolean;

    protected abstract tick(sketch: p5): void;

}
