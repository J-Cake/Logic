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

export function findWireByMouseCoordsByHandles(coords: [number, number]): Wire | null {
    const wires: Wire[] = manager.setState().renderedComponents.map(i => i.wires).flat();
    for (const wire of wires)
        if (wire.coords.find(i => i[0] === coords[0] && i[1] === coords[1]))
            return wire;
    return null;
}

export function linesAreIntersecting(line: [[number, number], [number, number]], circle: [[number, number], number]): boolean {
    const A = new p5.Vector();
    const B = new p5.Vector();

    A.set(line[0][0], line[0][1]);
    B.set(line[1][0], line[1][1]);

    const l = p5.Vector.sub(A, B).mag();

    const C = new p5.Vector();
    C.set(circle[0][0], circle[0][1]);

    const dist = (v1: p5.Vector, v2: p5.Vector) => ((v2.y - v1.y) ** 2 + (v2.x - v1.x) ** 2) ** 0.5;

    if (dist(C, A) > l || dist(B, A) > l)
        return false;

    const ab = p5.Vector.sub(A, B);
    const bc = p5.Vector.sub(B, C);

    return Math.abs(Math.sin(ab.angleBetween(bc))) * bc.mag() <= circle[1] / 2;
}

export function findWireByMouseCoordsByCollision(coords: [number, number]): [Wire, number] | null {
    const wires: Wire[] = manager.setState().renderedComponents.map(i => i.wires).flat();
    const {board} = manager.setState();

    for (const wire of wires) {
        const coordsList = [
            board.coordsToGrid(wire.startComponent.outputDashesCoords[wire.startIndex].slice(0, 2) as [number, number]),
            ...wire.coords,
            board.coordsToGrid(wire.endComponent.inputDashesCoords[wire.endIndex].slice(-2) as [number, number])
        ];

        while (coordsList.length > 1) {
            const current = coordsList.shift();
            const next = coordsList[0];

            if (current)
                if (linesAreIntersecting([
                    board.gridToPix([current[0], current[1]]),
                    board.gridToPix([next[0] + 1, next[1] + 1])
                ], [coords, WireHandle.handleSize]))
                    return [wire, wire.coords.length - coordsList.length + 1];
        }
    }

    return null;
}

export function buildWire() {
    let wire: Wire | null = null;
    const {board} = manager.setState();

    manager.on('wire_click', function (prev) {
        const [clickedWire, index] = findWireByMouseCoordsByCollision([prev.mouse.x, prev.mouse.y]) || [];
        const hasActiveHandles = clickedWire && clickedWire.handles?.some(i => i.isHovering([prev.mouse.x, prev.mouse.y]));
        const coords = board.coordsToGrid([prev.mouse.x, prev.mouse.y]);

        if (clickedWire && !prev.keys.shift && !hasActiveHandles) {
            if (typeof index === 'number' && index >= 0) {
                clickedWire.coords.splice(index, 0, coords);
                clickedWire.handles = clickedWire.coords.map((i, a) => new WireHandle(function (coords) {
                    if (clickedWire)
                        return clickedWire.coords[a] = coords;
                }, board.gridToPix(i, true)));
            }
        } else if (prev.keys.shift) {
            const mouse = prev.board.coordsToGrid([prev.mouse.x, prev.mouse.y])
            const wire: Wire | null = findWireByMouseCoordsByHandles(mouse);

            if (wire && wire.handles) {
                const index = wire.handles.findIndex(function (i) {
                    const grid = prev.board.coordsToGrid([i.pos.x, i.pos.y]);
                    return grid[0] === mouse[0] && grid[1] === mouse[1];
                });

                if (index > -1) {
                    delete wire.coords[index];
                    delete wire.handles[index];

                    wire.coords = wire.coords.filter(i => i);
                    wire.handles = wire.handles.filter(i => i);
                }
            }
        } else
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
                        console.log(wire.coords);
                        wire.handles = wire.coords.map((i, a) => new WireHandle(function (coords) {
                            if (wire)
                                return wire.coords[a] = coords;
                        }, board.gridToPix(i, true)));

                        wire.endComponent.component.addInput(
                            wire.startComponent.component,
                            wire.startComponent.component.outputNames[wire.startIndex],
                            wire.endComponent.component.inputNames[wire.endIndex]);
                        wire.startComponent.component.update();

                        wire = void wire.startComponent.wires.push(wire) || null;
                    }
                    return;
                }
            }

        if (wire)
            wire.coords.push(board.coordsToGrid([prev.mouse.x, prev.mouse.y]));
    });
}

export function renderWire(this: p5, wire: Wire, isActive: boolean = false): void {
    if (wire) {
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
                if (wire.handles)
                    for (const handle of wire.handles) {
                        handle.render(this);
                        handle.update(this);
                    }


        } else
            console.warn('Suspicious connection. The target or destination does not exist');
    }
}

export class WireHandle extends DragObject {
    static handleSize: number = 12;
    callback: (coords: [number, number]) => void;
    gridPos: [number, number];

    constructor(onMove: (coords: [number, number]) => void, startingCoords: [number, number]) {
        super(false, true);

        this.callback = onMove;

        this.pos = {x: startingCoords[0], y: startingCoords[1]};
        this.gridPos = [this.pos.x, this.pos.y];
    }

    isHovering(pos: [number, number]): boolean {
        return this.isHover({x: pos[0], y: pos[1]});
    }

    draw(sketch: p5): void {
        const {gridScale: scl, mouse, board, keys} = manager.setState();

        sketch.strokeWeight(1.5);
        sketch.stroke(getColour((keys.shift && this.isHover(mouse)) ? Colour.Active : Colour.Cursor));

        if (this.isHover(mouse))
            sketch.fill(getColour(keys.shift ? Colour.Active : Colour.Cursor));
        else
            sketch.noFill();

        if (this.isDragging)
            this.callback(board.coordsToGrid(this.gridPos));

        sketch.ellipseMode(sketch.CENTER);
        sketch.ellipse(this.gridPos[0], this.gridPos[1], WireHandle.handleSize);
    }

    protected isHover(mousePos: { x: number; y: number }): boolean {
        return ((mousePos.x - this.gridPos[0]) ** 2 + (mousePos.y - this.gridPos[1]) ** 2) ** 0.5 <= WireHandle.handleSize / 2;
    }

    protected tick(sketch: p5): void {
        const {board} = manager.setState();
        this.gridPos = board.gridToPix(board.coordsToGrid([this.pos.x, this.pos.y]), true);
    }
}