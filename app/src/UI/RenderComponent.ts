import * as p5 from "p5";

import RenderObject from "../sys/components/RenderObject";
import Component from "../Logic/Component";
import CircuitManager from "../CircuitManager";
import Colour, {getColour} from "../sys/util/Colour";
import {manager, State} from "../index";
import {GenComponent} from "../ComponentFetcher";

export interface RenderProps {
    pos: [number, number],
    direction: 0 | 1 | 2 | 3,
    label: string,
    isStateful: boolean
}

export default class RenderComponent<C extends Component> extends RenderObject {

    component: C;
    props: RenderProps;

    pos: [number, number];
    size: [number, number];

    isSelected: boolean;
    buff = 6;

    constructor(component: C, props: RenderProps) {
        super();

        this.component = component;
        this.props = props;

        this.pos = [0, 0];
        this.size = [0, 0];

        this.isSelected = false;

        manager.on('click', prev => {
            if (this.isWithinBounds(prev))
                this.onClick();
        });
        manager.on("select", prev => {
            if (this.isWithinBounds(prev))
                this.isSelected = true;
        })
    }

    isWithinBounds(prev: State): boolean {
        return prev.mouse.x > this.pos[0] && prev.mouse.x < this.pos[0] + this.size[0] && prev.mouse.y > this.pos[1] && prev.mouse.y < this.pos[1] + this.size[1];
    }

    clean(): void {
    }

    render(sketch: p5): void {
        sketch.strokeWeight(1);
        sketch.stroke(getColour(this.isSelected ? Colour.Cursor : (!this.component.out.includes(false) ? Colour.Active : Colour.Blank)));

        const {gridScale: scl} = manager.setState();
        const [inputNum, outputNum] = this.component.getConnections(this.props.direction > 1);

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
    }

    protected update(sketch: p5): void {
        const [inputNum, outputNum] = this.component.getConnections();
        const {gridScale: scl, board: {padding, pos: boardPos}} = manager.setState();

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
            pos: state.componentMap[i.mapKey][0].position,
            direction: state.componentMap[i.mapKey][0].direction
        }));
    return [];
}