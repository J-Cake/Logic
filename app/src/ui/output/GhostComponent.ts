import type p5 from 'p5';

import RenderObject from "../../sys/components/RenderObject";
import {ApiComponent} from "../../Logic/io/ComponentFetcher";
import {manager, Tool} from "../../State";
import RenderComponent from "../RenderComponent";
import getColourForComponent from "./getColourForComponent";
import {getColour, transparent} from "../../sys/util/Colour";
import {Colour} from "../../Enums";
import {ActionType, performAction} from "../../sys/Action";
import Timeout = NodeJS.Timeout;

export default class GhostComponent extends RenderObject {

    floating: boolean;

    component: ApiComponent;
    token: string;

    pos: [number, number];
    size: [number, number];
    gridPos: [number, number];

    constructor(token: string) {
        super(true);

        this.token = token;
        this.component = manager.setState().circuit.state.setState().raw[token];
        this.floating = true;

        this.pos = [0, 0];
        this.size = [0, 0];
        this.gridPos = [0, 0];
    }

    drop() {
        const state = manager.setState();
        const circuit = state.circuit.state.setState();

        const Component = circuit.availableComponents[this.token];
        const component = new Component(state.circuit.getNextAvailComponentId(), {
            direction: 1,
            outputs: {},
            position: this.gridPos,
            label: '',
            flip: false,
            wires: {},
            token: this.token,
        });

        const r = new RenderComponent(component, {
            direction: 0,
            isStateful: false,
            label: '',
            pos: this.gridPos,
            flip: false,
            isMoving: true,
            colour: getColourForComponent(this.token)
        });
        const syncPos = (pos: [number, number]) => r.pos = [(pos[0] + r.buff), (pos[1] + r.buff)];
        syncPos(state.board.gridToPix(this.gridPos));

        performAction(ActionType.AddComponent)(r);
    }

    clean(): void {
    }

    render(sketch: p5): void {
        sketch.stroke(getColour(Colour.Blank));
        sketch.fill(transparent(Colour.Blank, 50))
        sketch.rect(this.pos[0], this.pos[1], this.size[0], this.size[1]);
    }

    update(sketch: p5): void {
        const mgr = manager.setState();
        const scl = mgr.pref.setState().gridSize;
        this.pos = mgr.board.quantiseCoords([mgr.mouse.x, mgr.mouse.y]);
        this.gridPos = mgr.board.coordsToGrid(this.pos);
        this.size = [
            Math.max(1, Math.min(this.component.inputLabels.length, this.component.outputLabels.length)) * scl,
            Math.max(1, Math.max(this.component.inputLabels.length, this.component.outputLabels.length)) * scl
        ];
    }
}