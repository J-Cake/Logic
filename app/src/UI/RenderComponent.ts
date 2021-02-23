import * as p5 from "p5";

import RenderObject from "../sys/components/RenderObject";
import Component from "../Logic/Component";
import CircuitManager from "../Logic/CircuitManager";
import {getColour} from "../sys/util/Colour";
import {manager, State, Tool} from "../index";
import Colour from "../sys/util/Themes";
import {renderWire, Wire, WireHandle} from "./Wire";
import {GenComponent} from "../Logic/ComponentFetcher";

export interface RenderProps {
    pos: [number, number],
    direction: 0 | 1 | 2 | 3,
    flip: boolean
    label: string,
    isStateful: boolean,
    isMoving: boolean,
}

export const midpoint = (line: [number, number, number, number]): [number, number] => [line[0] + (line[2] - line[0]) / 2, line[1] + (line[3] - line[1]) / 2];
export const getDist = (point: [number, number], mouse: [number, number]): number => ((mouse[0] - point[0]) ** 2 + (mouse[1] - point[1]) ** 2) ** 0.5;


export default class RenderComponent extends RenderObject {
    component: Component;
    props: RenderProps;

    pos: [number, number];
    size: [number, number];

    isSelected: boolean;
    buff = 6;

    mousePos: [number, number];

    inputDashesCoords: [number, number, number, number][];
    outputDashesCoords: [number, number, number, number][];

    wires: Wire[];

    constructor(component: Component, props: RenderProps) {
        super();

        this.component = component;
        this.props = props;

        this.pos = [0, 0];
        this.size = [0, 0];

        this.mousePos = [0, 0];

        this.inputDashesCoords = [];
        this.outputDashesCoords = [];

        this.isSelected = false;

        this.wires = [];

        manager.on('click', prev => {
            if (this.isWithinBounds(prev))
                this.onClick();
        });
        manager.on("select", prev => {
            if (this.isWithinBounds(prev))
                this.isSelected = true;
        });
        manager.on('mouse-drop', prev => {
            this.props.isMoving = false;
        });
        manager.on('mouse-grab', prev => {
            if (this.isWithinBounds(prev) || this.isSelected)
                this.props.isMoving = true;
        });
    }

    isWithinBounds(prev: State): boolean {
        return prev.mouse.x > this.pos[0] && prev.mouse.x < this.pos[0] + this.size[0] && prev.mouse.y > this.pos[1] && prev.mouse.y < this.pos[1] + this.size[1];
    }

    // returns: isOutput: boolean, terminalIndex: number
    getTouchingTerminal(mouse: [number, number]): [boolean, number] | null {
        const scl = manager.setState().gridScale;
        const touchingOutputs: number = this.outputDashesCoords.findIndex(i => getDist([i[0], i[1]], mouse) < scl / 4);
        const touchingInputs: number = this.inputDashesCoords.findIndex(i => getDist([i[0], i[1]], mouse) < scl / 4);

        return touchingOutputs > -1 ? [true, touchingOutputs] : (touchingInputs > -1 ? [false, touchingInputs] : null);
    }

    clean(): void {
    }

    getConnections(flip: boolean): [number, number] {
        return flip ? [this.component.outputNames.length, this.component.inputNames.length] : [this.component.inputNames.length, this.component.outputNames.length];
    }

    render(sketch: p5): void {
        // console.log(this.wires)
        this.wires = this.wires.filter(i => !i.endComponent.deleted);
        for (const i of this.wires)
            renderWire.bind(sketch)(i, this.component.out[i.startIndex]);

        sketch.strokeWeight(1);
        sketch.stroke(getColour(this.isSelected ? Colour.Cursor : (this.component.out.includes(true) ? Colour.Active : Colour.Blank)));

        const {gridScale: scl, tool, pref, mouse} = manager.setState();

        for (const i of this.inputDashesCoords.concat(this.outputDashesCoords)) {
            sketch.stroke(getColour(this.isSelected ? Colour.Cursor : (this.component.out.includes(true) ? Colour.Active : Colour.Blank)));
            sketch.strokeWeight(1);
            if (getDist([i[0], i[1]], [mouse.x, mouse.y]) < scl / 4 && tool === Tool.Wire) {
                sketch.stroke(getColour(Colour.Cursor));
                sketch.strokeWeight(3);
            }

            sketch.line(...i);
        }

        sketch.stroke(getColour(this.isSelected ? Colour.Cursor : (this.component.out.includes(true) ? Colour.Active : Colour.Blank)));
        sketch.strokeWeight(1);

        // sketch.fill(getColour(Colour.Panel));
        sketch.fill(getColour(Colour.Background));
        sketch.rect(this.pos[0], this.pos[1], this.size[0], this.size[1]);

        if ((pref.setState().showLabels && !this.isWithinBounds(manager.setState())) || (!pref.setState().showLabels && this.isWithinBounds(manager.setState()))) {
            sketch.noStroke();
            sketch.textAlign(sketch.CENTER);
            const fontSize = 14;
            sketch.textSize(fontSize);

            // const name = this.props.label || this.component.name;
            const name = this.component.name;
            const strWidth = sketch.textWidth(name) + 12;
            const strHeight = fontSize * 1.25;
            const coords: [number, number, number, number] = [this.pos[0] + this.size[0] / 2 - strWidth / 2, this.pos[1] + this.size[1] / 2 - (strHeight / 2) + 0.5, strWidth, strHeight];

            sketch.fill(getColour(Colour.Background));
            sketch.rect(...coords);

            sketch.fill(getColour(Colour.Label));
            sketch.text(name, ...coords);
        }
    }

    onClick() {
        this.component.activate(this);
    }

    protected update(sketch: p5): void {
        this.component.updated = false;

        const [inputNum, outputNum] = this.getConnections(this.props.direction > 1);
        const {gridScale: scl, board, mouse, p_mouse} = manager.setState();

        const {padding, pos: boardPos} = board;

        this.mousePos = [this.mousePos[0] + (mouse.x - p_mouse.x), this.mousePos[1] + (mouse.y - p_mouse.y)];

        if (this.props.isMoving)
            this.props.pos = board.coordsToGrid(this.mousePos);
        else
            this.mousePos = this.pos;

        const pos: [number, number] = [this.props.pos[0] * scl + 0.5 + this.buff + boardPos.x, this.props.pos[1] * scl + padding + 0.5 + this.buff];
        const size: [number, number] = [Math.max(1, Math.min(inputNum, outputNum)) * scl - 2 * this.buff, Math.max(inputNum, outputNum, 1) * scl - 2 * this.buff];

        this.pos = pos;
        this.size = this.props.direction % 2 === 0 ? size : [size[1], size[0]];

        this.inputDashesCoords = [];
        this.outputDashesCoords = [];

        const loop = (int: number, cond: (i: number) => boolean, inc: (i: number) => number, cb: (i: number) => void) => {
            let i = int;
            while (cond(i)) {
                cb(i);
                i = inc(i);
            }
        }

        const flip = this.props.flip;

        if (this.props.direction % 2 === 0) {
            loop(0, i => i < Math.max(inputNum, outputNum), i => i + 1, i => this.inputDashesCoords.push([
                this.pos[0] - this.buff,
                this.pos[1] - this.buff + scl * i + scl / 2 + 0.5,
                this.pos[0],
                this.pos[1] - this.buff + scl * i + scl / 2 + 0.5]));
            loop(0, o => o < Math.max(outputNum, inputNum), o => o + 1, o => this.outputDashesCoords.push([
                this.pos[0] + this.size[0],
                this.pos[1] - this.buff + scl * o + scl / 2 + 0.5,
                this.pos[0] + this.size[0] + this.buff,
                this.pos[1] - this.buff + scl * o + scl / 2 + 0.5]));
        } else {
            loop(0, o => o < Math.max(outputNum, inputNum), o => o + 1, o => this.inputDashesCoords.push([
                this.pos[0] - this.buff + scl * o + scl / 2 + 0.5,
                this.pos[1] - this.buff,
                this.pos[0] - this.buff + scl * o + scl / 2 + 0.5,
                this.pos[1]]));
            loop(0, i => i < Math.max(inputNum, outputNum), i => i + 1, i => this.outputDashesCoords.push([
                this.pos[0] - this.buff + scl * i + scl / 2 + 0.5,
                this.pos[1] + this.size[1],
                this.pos[0] - this.buff + scl * i + scl / 2 + 0.5,
                this.pos[1] + this.size[1] + this.buff]));
        }

        if (flip) {
            this.inputDashesCoords = this.inputDashesCoords.slice(-this.component.inputNames.length);
            this.outputDashesCoords = this.outputDashesCoords.slice(-this.component.outputNames.length);
        } else {
            this.inputDashesCoords = this.inputDashesCoords.slice(0, this.component.inputNames.length);
            this.outputDashesCoords = this.outputDashesCoords.slice(0, this.component.outputNames.length);
        }

    }
}

export async function renderComponents(circuitManager: CircuitManager): Promise<RenderComponent[]> {
    await circuitManager.loading;
    const state = circuitManager.state.setState();
    const board = manager.setState().board;

    if (state)
        return state.components.map((i, a) => new RenderComponent(i, {
            isStateful: false,
            label: i.name,
            pos: state.componentMap[i.documentComponentKey][0].position,
            direction: state.componentMap[i.documentComponentKey][0].direction,
            flip: state.componentMap[i.documentComponentKey][0].flip,
            isMoving: false,
        })).map(function (i, a, comps) {
            const raw = (i.component as GenComponent).base;
            if (raw)
                for (const [w_key, w] of Object.entries(raw.wires))
                    i.wires.push(...w.map(w => ({
                        coords: w.coords,
                        handles: w.coords.map((i, a) => new WireHandle((coords) => w.coords[a] = coords, board.gridToPix(i, true))),
                        startComponent: i,
                        startIndex: w.outputIndex,
                        endComponent: comps.find(i => (i.component as GenComponent).documentComponentKey === Number(w_key)) as never as RenderComponent,
                        endIndex: w.inputIndex
                    })));

            return i;
        });
    return [];
}