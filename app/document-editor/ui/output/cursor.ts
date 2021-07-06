import type p5 from 'p5';
import _ from 'lodash';

import RenderObject from '../../sys/components/RenderObject';
import {manager, State, Tool} from '../../';
import {getColour, transparent} from '../../sys/util/Colour';
import Colour from '../../sys/util/Themes';
import {WireHandle} from "./wire/WireHandle";
import GhostComponent from "./GhostComponent";

export default class Cursor extends RenderObject {

    pos: [number, number];
    size: [number, number];

    ghost?: GhostComponent;
    listener?: number;

    public constructor() {
        super(true);

        this.pos = [0, 0];
        this.size = [0, 0];

        manager.on('mouseUp', function (this: Cursor, prev: State) {
            if (prev.tool === Tool.Select)
                if (this.getDistance() > 10) {
                    const bounds = [
                        ...prev.board.coordsToGrid([Math.min(this.pos[0], this.pos[0] + this.size[0]), Math.min(this.pos[1], this.pos[1] + this.size[1])]),
                        ...prev.board.coordsToGrid([Math.max(this.pos[0], this.pos[0] + this.size[0]), Math.max(this.pos[1], this.pos[1] + this.size[1])])
                    ];

                    const between = (coords: [number, number]): boolean =>
                        coords[0] >= bounds[0] &&
                        coords[0] <= bounds[2] &&
                        coords[1] >= bounds[1] &&
                        coords[1] <= bounds[3];

                    const selected = _.partition(prev.renderedComponents, i => i && between(i?.props.pos));

                    for (const i of selected[0])
                        i.isSelected = !i.isSelected;

                    for (const i of selected[1])
                        if (i)
                            if (!prev.keys.shift)
                                i.isSelected = false;

                    for (const j of WireHandle.handles)
                        if (between(j.gridPos))
                            j.isSelected = !j.isSelected;
                        else if (!prev.keys.shift)
                            j.isSelected = false;

                } else {
                    const mouse: [number, number] = [prev.mouse.x, prev.mouse.y];
                    const selected = _.partition(prev.renderedComponents, i => i.isHovering(mouse));

                    for (const i of selected[0])
                        i.isSelected = !i.isSelected;

                    for (const i of selected[1])
                        if (!prev.keys.shift)
                            i.isSelected = false;

                    for (const j of WireHandle.handles)
                        if (j.isHovering(mouse))
                            j.isSelected = !j.isSelected;
                        else if (!prev.keys.shift)
                            j.isSelected = false;
                }
        }.bind(this));
    }

    showGhostComponent(token: string) {
        const drop = () => {
            this.ghost?.drop();

            if (this.listener)
                manager.off(this.listener);

            delete this.ghost;
        }

        setTimeout(() => this.listener = manager.on('mouseUp', () => drop()), 50);

        this.ghost = new GhostComponent(token);
        manager.setState(prev => ({
            actionStack: [...prev.actionStack, () => delete this.ghost]
        }));
    }

    getDistance(): number {
        const state = manager.setState();
        return Math.sqrt((state.dragStart.x - state.mouse.x) ** 2 + (state.dragStart.y - state.mouse.y) ** 2);
    }

    render(sketch: p5): void {
        const state = manager.setState();
        if (state.tool === Tool.Select)
            if (state.mouse.pressed && this.getDistance() > 10) { // we don't need to check for drag objects because the select tool does not drag objects
                sketch.fill(transparent(Colour.Cursor, 60));
                sketch.stroke(getColour(Colour.Cursor));
                sketch.strokeWeight(1);
                sketch.rect(this.pos[0], this.pos[1], this.size[0], this.size[1]);
            }

        if (this.ghost)
            this.ghost.render(sketch)
    }

    update(sketch: p5): void {
        const state = manager.setState();
        this.pos = [Math.floor(Math.min(state.dragStart.x, state.mouse.x)), Math.floor(Math.min(state.dragStart.y, state.mouse.y))];
        this.size = [Math.floor(Math.abs(Math.max(state.dragStart.x, state.mouse.x) - Math.min(state.dragStart.x, state.mouse.x))),
            Math.floor(Math.abs(Math.max(state.dragStart.y, state.mouse.y) - Math.min(state.dragStart.y, state.mouse.y)))];

        if (this.ghost)
            this.ghost.update(sketch)
    }

    clean(): void {
    }
}