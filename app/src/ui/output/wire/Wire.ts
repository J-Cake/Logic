import p5 from 'p5';

import {manager, Tool} from '../../../State';
import {getColour} from '../../../sys/util/Colour';
import Colour from '../../../sys/util/Themes';
import RenderComponent from '../../RenderComponent';
import {WireHandle} from './WireHandle';
import RenderObject from '../../../sys/components/RenderObject';
import {WireEditMode} from '../../../Enums';

export type ApiWire = {
    coords: [number, number][],
    startComponent: RenderComponent,
    startIndex: number,
    endComponent: RenderComponent,
    endIndex: number,
    handles?: WireHandle[]
};

export function linesAreIntersecting(line: [[number, number], [number, number]], circle: [[number, number], number]): boolean {
    const A = new p5.Vector();
    const B = new p5.Vector();

    A.set(line[0][0], line[0][1]);
    B.set(line[1][0], line[1][1]);

    const l = p5.Vector.sub(A, B).mag();

    const C = new p5.Vector();
    C.set(circle[0][0], circle[0][1]);

    const dist = (v1: p5.Vector, v2: p5.Vector) => ((v2.y - v1.y) ** 2 + (v2.x - v1.x) ** 2) ** 0.5;

    if (dist(C, A) > l + circle[1] / 2 || dist(B, A) > l + circle[1] / 2)
        return false;

    const ab = p5.Vector.sub(A, B);
    const bc = p5.Vector.sub(B, C);

    return Math.abs(Math.sin(ab.angleBetween(bc))) * bc.mag() <= circle[1] / 2;
}

export default class Wire extends RenderObject implements ApiWire {
    coords: [number, number][];
    startComponent: RenderComponent;
    startIndex: number;
    endComponent: RenderComponent;
    endIndex: number;
    handles?: WireHandle[] | undefined;
    isActive: boolean;

    constructor(wire: ApiWire) {
        super(true);

        this.coords = wire.coords;
        this.startComponent = wire.startComponent;
        this.startIndex = wire.startIndex;
        this.endComponent = wire.endComponent;
        this.endIndex = wire.endIndex;

        const {board} = manager.setState();

        // If one of the coordinates is deleted from the list, then the wire handle potentially points to the wrong coordinate,
        // where `a` retains its value, even though the list has changed.
        // Instead, rely on pass-by-reference objects, and modify the reference to the object, such that changes are applied correctly.
        this.handles = wire.coords.map(i => new WireHandle(
            board.gridToPix(i, true),
            coords => (i[0] = coords[0], i[1] = coords[1]),
            () => wire.coords.splice(wire.coords.indexOf(i))
        ));

        this.isActive = false;
    }

    static findWireByMouseCoordsByHandles(coords: [number, number]): Wire | null {
        const wires: Wire[] = manager.setState().renderedComponents.map(i => i.wires).flat();
        for (const wire of wires)
            if (wire.coords.find(i => i[0] === coords[0] && i[1] === coords[1]))
                return wire;
        return null;
    }

    /**
     * Find the wire which is colliding with the mouse
     * @param coords Mouse Coordinates
     * @returns [Wire, Wire Segment Index]
     */
    static findWireByMouseCoordsByCollision(coords: [number, number]): [Wire, number] | null {
        const wires: Wire[] = manager.setState().renderedComponents.map(i => i.wires).flat();
        const {board, pref} = manager.setState();
        const {gridSize} = pref.setState();

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
                    ], [coords, Math.floor(gridSize / 2) + 1]))
                        return [wire, wire.coords.length - coordsList.length + 1];
            }
        }

        return null;
    }

    clean(): void {
        // throw new Error("Method not implemented.");
    }

    render(sketch: p5): void {
        const isActive = this.startComponent.component.out[this.startIndex];
        const {board, tool, wireEditMode, pref} = manager.setState();
        const {gridSize} = pref.setState();
        sketch.stroke(getColour(this.endComponent ? (isActive ? Colour.Active : Colour.Blank) : Colour.Danger));
        sketch.strokeWeight(1);
        sketch.noFill();

        if (this.startComponent.outputDashesCoords[this.startIndex]) {
            sketch.beginShape();

            const start = this.startComponent.outputDashesCoords[this.startIndex];
            sketch.vertex(start[2], start[3]);

            for (const point of this.coords)
                sketch.vertex(...board.gridToPix(point, true));

            if (this.endComponent) {
                const end = this.endComponent.inputDashesCoords[this.endIndex];
                sketch.vertex(end[0], end[1]);
            }

            sketch.endShape();

            sketch.stroke(getColour(Colour.Danger));
            if (tool === Tool.Wire && wireEditMode === WireEditMode.Place) {
                const coordsList = [
                    board.coordsToGrid(this.startComponent.outputDashesCoords[this.startIndex].slice(0, 2) as [number, number]),
                    ...this.coords,
                    board.coordsToGrid(this.endComponent.inputDashesCoords[this.endIndex].slice(-2) as [number, number])
                ];

                const mouse: [number, number] = [sketch.mouseX, sketch.mouseY];
                while (coordsList.length > 1) {
                    const current = coordsList.shift();
                    const next = coordsList[0];

                    if (current)
                        if (linesAreIntersecting([
                            board.gridToPix([current[0], current[1]]),
                            board.gridToPix([next[0] + 1, next[1] + 1])
                        ], [mouse, Math.floor(gridSize / 2) + 1]))
                            sketch.line(...[...board.gridToPix(current, true), ...board.gridToPix(next, true)] as [number, number, number, number]);
                }
            }

            if (this.handles)
                for (const handle of this.handles) {
                    handle.render(sketch);
                    handle.update(sketch);
                }
        } else
            console.warn('Suspicious connection. The target or destination does not exist');
    }

    protected update(sketch: p5): void {

    }
}