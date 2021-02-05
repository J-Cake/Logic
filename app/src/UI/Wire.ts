import * as p5 from "p5";

import {manager, Tool} from "../State";
import {getColour} from "../sys/util/Colour";
import Colour from "../sys/util/Themes";
import RenderComponent from "./RenderComponent";
import DragObject from "../sys/components/DragObject";

export type Wire = {
    coords: [number, number][],
    startComponent: RenderComponent,
    startIndex: number,
    endComponent: RenderComponent,
    endIndex: number,
    handles?: WireHandle[]
};

export function buildWire() {
    let wire: Wire | null = null;
    const {board} = manager.setState();

    manager.on('wire_click', function (prev) {
        for (const i of prev.renderedComponents) {
            const terminal = i.getTouchingTerminal([prev.mouse.x, prev.mouse.y]);

            if (terminal) {
                if (i[terminal[0] ? 'outputDashesCoords' : 'inputDashesCoords'][terminal[1]])
                    if (wire)
                        if (!terminal[0]) {
                            wire.endComponent = i;
                            wire.endIndex = terminal[1];
                        } else {
                            wire.startComponent = i;
                            wire.startIndex = terminal[1];
                        }
                    else if (terminal[0])
                        wire = {
                            coords: [],
                            startComponent: i,
                            startIndex: terminal[1],
                            endComponent: null as never as RenderComponent,
                            endIndex: 0
                        }
                    else
                        wire = {
                            coords: [],
                            endComponent: i,
                            endIndex: terminal[1],
                            startComponent: null as never as RenderComponent,
                            startIndex: 0
                        }
                if (wire && wire.startComponent && wire.endComponent) {
                    wire.endComponent.component.addInput(wire.startComponent.component);
                    wire.startComponent.component.update();

                    wire = void wire.startComponent.wires.push(wire) || null;
                }
                return;
            }
        }

        if (wire)
            wire.coords.push(board.getMouseGridCoords([prev.mouse.x, prev.mouse.y]));
    });
}

export function renderWire(this: p5, wire: Wire, isActive: boolean = false): void {
    const {board, tool} = manager.setState();
    this.stroke(getColour(isActive ? Colour.Active : Colour.Blank));
    this.strokeWeight(1);
    this.noFill();

    if (wire.startComponent.outputDashesCoords[wire.startIndex] && wire.endComponent.inputDashesCoords[wire.endIndex]) {
        this.beginShape();

        const start = wire.startComponent.outputDashesCoords[wire.startIndex];
        this.vertex(start[2], start[3]);

        for (const point of wire.coords)
            this.vertex(...board.gridToPix(point, true));

        const end = wire.endComponent.inputDashesCoords[wire.endIndex];
        this.vertex(end[0], end[1]);

        this.endShape();

        if (tool === Tool.Wire)
            if (wire.handles?.length === wire.coords.length) {
                for (const handle of wire.handles) {
                    handle.render(this);
                    handle.update(this);
                }
            } else
                wire.handles = new Array(wire.coords.length)
                    .fill(null)
                    .map((i, a) =>
                        new WireHandle((coords) => wire.coords[a] = coords, board.gridToPix(wire.coords[a], true)));


    } else
        console.warn('Suspicious connection. The target or destination does not exist');
}

export class WireHandle extends DragObject {
    callback: (coords: [number, number]) => void;

    gridPos: [number, number];

    constructor(onMove: (coords: [number, number]) => void, startingCoords: [number, number]) {
        super(false, true);

        this.callback = onMove;

        this.pos = {x: startingCoords[0], y: startingCoords[1]};
        this.gridPos = [this.pos.x, this.pos.y];
    }

    draw(sketch: p5): void {
        const {gridScale: scl, mouse, board} = manager.setState();

        sketch.strokeWeight(1.5);
        sketch.stroke(getColour(Colour.Cursor));

        if (this.isHover(mouse))
            sketch.fill(getColour(Colour.Cursor));
        else
            sketch.noFill();

        if (this.isDragging)
            this.callback(board.getMouseGridCoords(this.gridPos));

        sketch.ellipseMode(sketch.CENTER);
        sketch.ellipse(this.gridPos[0], this.gridPos[1], 5);
    }

    protected isHover(mousePos: { x: number; y: number }): boolean {
        return ((mousePos.x - this.gridPos[0]) ** 2 + (mousePos.y - this.gridPos[1]) ** 2) ** 0.5 < 5;
    }

    protected tick(sketch: p5): void {
        const {board} = manager.setState();
        this.gridPos = board.gridToPix(board.getMouseGridCoords([this.pos.x, this.pos.y]), true);
    }
}