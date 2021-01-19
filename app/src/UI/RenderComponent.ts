import * as p5 from "p5";

import RenderObject from "../sys/components/RenderObject";
import Component from "../Logic/Component";
import CircuitManager from "../CircuitManager";
import {getColour} from "../sys/util/Colour";
import {manager, State} from "../index";
import {GenComponent} from "../ComponentFetcher";
import Colour from "../sys/util/Themes";

export interface RenderProps {
    pos: [number, number],
    direction: 0 | 1 | 2 | 3,
    label: string,
    isStateful: boolean,
    isMoving: boolean
}

export default class RenderComponent<C extends Component> extends RenderObject {

    component: C;
    props: RenderProps;

    pos: [number, number];
    size: [number, number];

    isSelected: boolean;
    buff = 6;

    mousePos: [number, number];

    constructor(component: C, props: RenderProps) {
        super();

        this.component = component;
        this.props = props;

        this.pos = [0, 0];
        this.size = [0, 0];

        this.mousePos = [0, 0];

        this.isSelected = false;

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

    clean(): void {
    }

    getConnections(flip: boolean): [number, number] {
        return flip ? [this.component.outputNames.length, this.component.inputNames.length] : [this.component.inputNames.length, this.component.outputNames.length];
    }

    render(sketch: p5): void {
        sketch.strokeWeight(1);
        sketch.stroke(getColour(this.isSelected ? Colour.Cursor : (!this.component.out.includes(false) ? Colour.Active : Colour.Blank)));

        const {gridScale: scl} = manager.setState();
        const [inputNum, outputNum] = this.getConnections(this.props.direction > 1);

        if (this.props.direction % 2 === 0) {
            for (let i = 0; i < inputNum; i++)
                sketch.line(
                    this.pos[0] - this.buff,
                    this.pos[1] - this.buff + scl * i + scl / 2 + 0.5,
                    this.pos[0] + 0,
                    this.pos[1] - this.buff + scl * i + scl / 2 + 0.5);
            for (let o = 0; o < outputNum; o++)
                sketch.line(
                    this.pos[0] + this.size[0],
                    this.pos[1] - this.buff + scl * o + scl / 2 + 0.5,
                    this.pos[0] + this.size[0] + this.buff,
                    this.pos[1] - this.buff + scl * o + scl / 2 + 0.5);
        } else {
            for (let i = 0; i < outputNum; i++)
                sketch.line(
                    this.pos[0] - this.buff + scl * i + scl / 2 + 0.5,
                    this.pos[1] - this.buff,
                    this.pos[0] - this.buff + scl * i + scl / 2 + 0.5,
                    this.pos[1] + 0);
            for (let o = 0; o < inputNum; o++)
                sketch.line(
                    this.pos[0] - this.buff + scl * o + scl / 2 + 0.5,
                    this.pos[1] + this.size[1],
                    this.pos[0] - this.buff + scl * o + scl / 2 + 0.5,
                    this.pos[1] + this.size[1] + this.buff);
        }

        sketch.fill(getColour(Colour.Panel));
        sketch.rect(this.pos[0], this.pos[1], this.size[0], this.size[1]);

        if (this.isWithinBounds(manager.setState())) {
            sketch.textAlign(sketch.CENTER);
            const fontSize = 14;
            sketch.textSize(fontSize);
            sketch.noStroke();

            const name = this.props.label || this.component.name;
            const strWidth = sketch.textWidth(name);
            const strHeight = fontSize * 1.25;
            const coords: [number, number, number, number] = [this.pos[0] + this.size[0] / 2 - strWidth / 2, this.pos[1] + this.size[1] / 2 - (strHeight / 2) + 0.5, strWidth, strHeight];

            sketch.fill(getColour(Colour.Panel));
            sketch.rect(...coords);

            sketch.fill(getColour(Colour.Label));
            sketch.text(name, ...coords);
        }
    }

    protected update(sketch: p5): void {
        const [inputNum, outputNum] = this.getConnections(false);
        const {gridScale: scl, board} = manager.setState();

        const {padding, pos: boardPos} = board;

        this.mousePos = [this.mousePos[0] + (sketch.mouseX - sketch.pmouseX), this.mousePos[1] + (sketch.mouseY - sketch.pmouseY)];

        if (this.props.isMoving)
            this.props.pos = board.getMouseGridCoords(this.mousePos);
        else
            this.mousePos = this.pos;

        const pos: [number, number] = [this.props.pos[0] * scl + 0.5 + this.buff + boardPos.x, this.props.pos[1] * scl + padding + 0.5 + this.buff];
        const size: [number, number] = [Math.max(1, Math.min(inputNum, outputNum)) * scl - 2 * this.buff, Math.max(inputNum, outputNum, 1) * scl - 2 * this.buff];

        this.pos = pos;
        this.size = this.props.direction % 2 === 0 ? size : [size[1], size[0]];
    }

    onClick() {
        this.component.activate(this);
    }
}

export async function renderComponents(circuitManager: CircuitManager): Promise<RenderComponent<GenComponent>[]> {
    await circuitManager.loading;
    const state = circuitManager.state.setState();

    if (state)
        return state.components.map((i, a) => new RenderComponent(i, {
            isStateful: false,
            label: i.name,
            pos: state.componentMap[i.documentComponentKey][0].position,
            direction: state.componentMap[i.documentComponentKey][0].direction,
            isMoving: false
        }));
    return [];
}