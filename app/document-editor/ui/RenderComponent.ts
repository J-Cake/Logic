import type p5 from 'p5';

import RenderObject from '../sys/components/RenderObject';
import CircuitManager from '../Logic/io/CircuitManager';
import {getColour, rgb, transparent} from '../sys/util/Colour';
import {manager, State, Tool} from '../';
import Colour from '../sys/util/Themes';
import Wire from './output/wire/Wire';
import {GenComponent} from '../Logic/io/ComponentFetcher';
import getColourForComponent from './output/getColourForComponent';
import {ActionType, performAction} from "../sys/Action";

export interface RenderProps {
    pos: [number, number],
    direction: 0 | 1 | 2 | 3,
    flip: boolean
    label: string,
    isStateful: boolean,
    isMoving: boolean,
    colour: rgb
}

export const midpoint = (line: [number, number, number, number]): [number, number] => [line[0] + (line[2] - line[0]) / 2, line[1] + (line[3] - line[1]) / 2];
export const getDist = (point: [number, number], mouse: [number, number]): number => ((mouse[0] - point[0]) ** 2 + (mouse[1] - point[1]) ** 2) ** 0.5;
export const constrain = (n: number, min: number, max: number): number => Math.max(Math.min(n, max), min);

export default class RenderComponent extends RenderObject {
    component: GenComponent;
    props: RenderProps;

    pos: [number, number];
    size: [number, number];

    isSelected: boolean;
    buff = Math.floor(Math.sqrt(manager.setState().pref.setState().gridSize));

    inputDashesCoords: [number, number, number, number][];
    outputDashesCoords: [number, number, number, number][];

    inputDashesGrid: [number, number, number, number][];
    outputDashesGrid: [number, number, number, number][];

    wires: Wire[];

    constructor(component: GenComponent, props: RenderProps) {
        super(true);

        this.component = component;
        this.props = props;

        this.pos = [0, 0];
        this.size = [0, 0];

        this.inputDashesCoords = [];
        this.outputDashesCoords = [];
        this.inputDashesGrid = [];
        this.outputDashesGrid = [];

        this.isSelected = false;

        this.wires = [];

        manager.on('click', prev => {
            if (this.isWithinBounds(prev))
                this.onClick();
        });

        manager.on('move', state => this.move(state));
        manager.on('board', state => this.pos = state.board.gridToPix(this.props.pos).map(i => i + this.buff) as [number, number]);

        manager.on('mouse-drop', () => {
            if (this.isSelected)
                performAction(ActionType.MoveComponent)(this)
        });
        manager.on('label_click', prev => {
            if (this.isWithinBounds(prev))
                performAction(ActionType.ChangeLabel)(this, prompt("Change label") ?? this.component.label);
        });
        manager.on('debug_click', prev => {
            if (this.isWithinBounds(prev))
                this.component.isBreakpoint = this.component.isBreakpoint !== null ? null : prev.debug.setState().debugMode;
        });

    }

    move(state: State) {
        if (this.isSelected || this.isHovering([state.mouse.x, state.mouse.y])) {
            const pref = state.pref.setState();
            const pos = state.board.gridToPix(this.props.pos);
            this.pos = [
                (pos[0] + this.buff) - Math.floor((state.dragStart.x - state.mouse.x) / pref.gridSize) * pref.gridSize,
                (pos[1] + this.buff) - Math.floor((state.dragStart.y - state.mouse.y) / pref.gridSize) * pref.gridSize
            ];
        }
    }

    isWithinBounds(prev: State): boolean {
        return this.isHovering([prev.mouse.x, prev.mouse.y]);
        // return prev.mouse.x > this.pos[0] && prev.mouse.x < this.pos[0] + this.size[0] && prev.mouse.y > this.pos[1] && prev.mouse.y < this.pos[1] + this.size[1];
    }

    isHovering(mouse: [number, number]): boolean {
        return mouse[0] > this.pos[0] && mouse[0] < this.pos[0] + this.size[0] && mouse[1] > this.pos[1] && mouse[1] < this.pos[1] + this.size[1];
    }

    /**
     * Get the terminal touching the mouse
     * @param mouse The X and Y coordinates of the mouse
     * @returns [isOutput, terminalIndex]
     */
    getTouchingTerminal(mouse: [number, number]): [boolean, number] | null {
        const scl = manager.setState().pref.setState().gridSize;
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
        const mgr = manager.setState();
        const {gridSize: scl, colouriseComponents} = mgr.pref.setState();
        const {tool, mouse} = mgr;

        this.wires = this.wires.filter(i => !i.endComponent.deleted);
        for (const i of this.wires)
            i.render(sketch);

        const colour = colouriseComponents ? this.props.colour : getColour(Colour.Blank);

        if (this.component.isBreakpoint !== null) {
            const pos = mgr.board.quantiseCoords(this.pos);
            const size = mgr.board.quantiseCoords(this.size);

            sketch.fill(transparent(this.component.halted ? Colour.Primary : Colour.Blank, 50));
            sketch.noStroke();
            sketch.rect(pos[0] + 1, pos[1] + 1, size[0] + 2 * this.buff, size[1] + 2 * this.buff);
        }

        if (!this.isSelected)
            sketch.stroke(getColour(Colour.Blank));
        else sketch.stroke(getColour(Colour.Cursor))

        sketch.fill(getColour(Colour.Background));
        sketch.rect(this.pos[0], this.pos[1], this.size[0], this.size[1]);

        sketch.strokeWeight(1);
        if (!this.isSelected)
            sketch.stroke(this.component.out.includes(true) ? getColour(Colour.Active) : getColour(Colour.Blank));
        else
            sketch.stroke(getColour(Colour.Cursor));

        const terminals = Object.values(this.component.getInputs())
            .concat(this.component.out);
        const grid = this.inputDashesGrid
            .concat(this.outputDashesGrid);

        sketch.noFill();

        for (const [a, i] of this.inputDashesCoords.concat(this.outputDashesCoords).entries()) {
            sketch.strokeWeight(1);
            if (!this.isSelected)
                sketch.stroke(getColour(terminals[a] ? Colour.Active : Colour.Blank));
            else
                sketch.stroke(getColour(Colour.Cursor));

            if (grid[a])
                sketch.line(grid[a][0], grid[a][1], grid[a][2], grid[a][3])

            if (getDist([i[0], i[1]], [mouse.x, mouse.y]) < scl / 4 && tool === Tool.Wire) {
                sketch.stroke(getColour(Colour.Cursor));
                sketch.strokeWeight(3);
            }

            sketch.line(...i);
        }

        sketch.noStroke();
        sketch.fill(getColour(Colour.Background));
        sketch.rect(this.pos[0] + 1, this.pos[1] + 1, this.size[0] - 2, this.size[1] - 2);

        sketch.fill(transparent(this.isSelected ? Colour.Cursor : colour, 50))
        sketch.rect(this.pos[0] + 1, this.pos[1] + 1, this.size[0] - 2, this.size[1] - 2);

        if (this.isSelected)
            if (this.component.out.includes(true))
                sketch.stroke(getColour(Colour.Active));
            else
                sketch.stroke(getColour(Colour.Blank));
        sketch.strokeWeight(1);
    }

    onClick() {
        this.component.activate(this);
        manager.broadcast('tick');
    }

    update(sketch: p5): void {
        this.component.updated = false;
        const mgr = manager.setState();
        const scl = mgr.pref.setState().gridSize;
        const {board} = mgr;

        const [inputNum, outputNum] = this.getConnections(false);

        const size: [number, number] = [
            Math.max(1, Math.min(inputNum, outputNum)) * scl - 2 * this.buff,
            Math.max(1, Math.max(inputNum, outputNum)) * scl - 2 * this.buff,
        ];

        const pos = this.pos;

        this.size = this.props.direction % 2 === 0 ? size : [size[1], size[0]];

        this.inputDashesCoords = [];
        this.outputDashesCoords = [];
        this.inputDashesGrid = [];
        this.outputDashesGrid = [];

        const loop = (int: number, cond: (i: number) => boolean, inc: (i: number) => number, cb: (i: number) => void) => {
            let i = int;
            while (cond(i)) {
                cb(i);
                i = inc(i);
            }
        }

        const flip = this.props.flip;
        const swap = (coords: [number, number, number, number], swap: boolean = true): [number, number, number, number] => swap ? coords : [
            coords[2],
            coords[3],
            coords[0],
            coords[1],
        ]

        if (this.props.direction % 2 === 0) {
            // Horizontal
            loop(0, i => i < Math.max(outputNum, inputNum), i => i + 1, i => {
                this.inputDashesCoords.push([
                    Math.floor(pos[0] - this.buff),
                    Math.floor(pos[1] - this.buff + scl * i + scl / 2),
                    Math.floor(pos[0]),
                    Math.floor(pos[1] - this.buff + scl * i + scl / 2),
                ]);
            });
            loop(0, o => o < Math.max(outputNum, inputNum), o => o + 1, o => {
                this.outputDashesCoords.push([
                    Math.floor(pos[0] + this.size[0]),
                    Math.floor(pos[1] - this.buff + scl * o + scl / 2),
                    Math.floor(pos[0] + this.size[0] + this.buff),
                    Math.floor(pos[1] - this.buff + scl * o + scl / 2),
                ]);
            });
            loop(0, i => i < Math.max(outputNum, inputNum), i => i + 1, i => {
                const grid = board.quantiseCoords(this.pos);
                this.inputDashesGrid.push([
                    Math.floor(pos[0]),
                    Math.max(Math.floor(grid[1] + i * scl), pos[1]),
                    Math.floor(pos[0]),
                    Math.min(Math.floor(grid[1] + (i + 1) * scl), pos[1] + this.size[1]),
                ]);
            });
            loop(0, o => o < Math.max(outputNum, inputNum), o => o + 1, o => {
                const grid = board.quantiseCoords(this.pos);
                this.outputDashesGrid.push([
                    Math.floor(pos[0] + this.size[0]),
                    Math.max(Math.floor(grid[1] + o * scl), pos[1]),
                    Math.floor(pos[0] + this.size[0]),
                    Math.min(Math.floor(grid[1] + (o + 1) * scl), pos[1] + this.size[1]),
                ]);
            });
        } else {
            // Vertical
            loop(0, o => o < Math.max(outputNum, inputNum), o => o + 1, o => {
                this.inputDashesCoords.push([
                    Math.floor(pos[0] - this.buff + scl * o + scl / 2),
                    Math.floor(pos[1] - this.buff),
                    Math.floor(pos[0] - this.buff + scl * o + scl / 2),
                    Math.floor(pos[1]),
                ]);
            });
            loop(0, i => i < Math.max(inputNum, outputNum), i => i + 1, i => {
                this.outputDashesCoords.push([
                    Math.floor(pos[0] - this.buff + scl * i + scl / 2),
                    Math.floor(pos[1] + this.size[1]),
                    Math.floor(pos[0] - this.buff + scl * i + scl / 2),
                    Math.floor(pos[1] + this.size[1] + this.buff),
                ]);
            });
            loop(0, i => i < Math.max(outputNum, inputNum), i => i + 1, i => {
                const grid = board.quantiseCoords(this.pos);
                this.inputDashesGrid.push([
                    Math.max(Math.floor(grid[0] + i * scl), pos[0]),
                    Math.floor(pos[1]),
                    Math.min(Math.floor(grid[0] + (i + 1) * scl), pos[0] + this.size[0]),
                    Math.floor(pos[1]),
                ]);
            });
            loop(0, o => o < Math.max(outputNum, inputNum), o => o + 1, o => {
                const grid = board.quantiseCoords(this.pos);
                this.outputDashesGrid.push([
                    Math.max(Math.floor(grid[0] + o * scl), pos[0]),
                    Math.floor(pos[1] + this.size[1]),
                    Math.min(Math.floor(grid[0] + (o + 1) * scl), pos[0] + this.size[0]),
                    Math.floor(pos[1] + this.size[1]),
                ]);
            });
        }

        this.inputDashesCoords = this.inputDashesCoords.map(i => swap(i, this.props.direction <= 1));
        this.inputDashesGrid = this.inputDashesGrid.map(i => swap(i, this.props.direction <= 1));
        this.outputDashesCoords = this.outputDashesCoords.map(i => swap(i, this.props.direction <= 1));
        this.outputDashesGrid = this.outputDashesGrid.map(i => swap(i, this.props.direction <= 1));

        if (this.props.direction > 1) {
            const inputCoords = this.inputDashesCoords;
            this.inputDashesCoords = this.outputDashesCoords;
            this.outputDashesCoords = inputCoords;
            const inputGrid = this.inputDashesGrid;
            this.inputDashesGrid = this.outputDashesGrid;
            this.outputDashesGrid = inputGrid;
        }

        if (flip) {
            this.inputDashesCoords = this.inputDashesCoords.slice(-this.component.inputNames.length);
            this.outputDashesCoords = this.outputDashesCoords.slice(-this.component.outputNames.length);
            this.inputDashesGrid = this.inputDashesGrid.slice(-this.component.inputNames.length);
            this.outputDashesGrid = this.outputDashesGrid.slice(-this.component.outputNames.length);
        } else {
            this.inputDashesCoords = this.inputDashesCoords.slice(0, this.component.inputNames.length);
            this.outputDashesCoords = this.outputDashesCoords.slice(0, this.component.outputNames.length);
            this.inputDashesGrid = this.inputDashesGrid.slice(0, this.component.inputNames.length);
            this.outputDashesGrid = this.outputDashesGrid.slice(0, this.component.outputNames.length);
        }

    }
}

export async function renderComponents(circuitManager: CircuitManager): Promise<RenderComponent[]> {
    await circuitManager.loading;
    const state = circuitManager.state.setState();

    if (state)
        return state.components.map(i => new RenderComponent(i, {
            isStateful: false,
            label: i.name,
            pos: state.componentMap[i.documentComponentKey][0].position,
            direction: state.componentMap[i.documentComponentKey][0].direction,
            flip: state.componentMap[i.documentComponentKey][0].flip,
            isMoving: false,
            colour: getColourForComponent(i.raw?.token)
        })).map(function (i, a, comps) {
            const raw = (i.component as GenComponent).base;
            if (raw)
                for (const [w_key, w] of Object.entries(raw.wires))
                    i.wires.push(...w.map(w => new Wire({
                        coords: w.coords,
                        startComponent: i,
                        startIndex: w.outputIndex,
                        endComponent: comps.find(i => (i.component as GenComponent).documentComponentKey === Number(w_key)) as never as RenderComponent,
                        endIndex: w.inputIndex,
                        handles: []
                    })));

            return i;
        });
    return [];
}