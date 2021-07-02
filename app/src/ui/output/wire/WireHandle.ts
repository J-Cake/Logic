import type p5 from 'p5';

import DragObject from '../../../sys/components/DragObject';
import {manager, State, Tool} from '../../../State';
import {getColour, transparent} from '../../../sys/util/Colour';
import {Colour, WireEditMode} from '../../../Enums';
import Wire from './Wire';
import RenderObject from "../../../sys/components/RenderObject";
import {ActionType, performAction} from "../../../sys/Action";

export class WireHandle extends RenderObject {
    clean(): void {
    }

    static handleSize: number = 12;
    static handles: WireHandle[] = [];
    gridPos: [number, number];

    parentWire: Wire;

    isSelected: boolean;

    pos: [number, number];

    constructor(parentWire: Wire, startingCoords: [number, number]) {
        super(true);

        const state = manager.setState();

        this.parentWire = parentWire;
        this.pos = state.board.gridToPix(startingCoords, true);
        this.gridPos = startingCoords;

        this.isSelected = false;

        WireHandle.handles.push(this);

        manager.on('move', state => this.move(state));
        manager.on('board', state => this.pos = state.board.gridToPix(this.gridPos, true));

        manager.on('mouse-drop', () => {
            if (this.isSelected)
                performAction(ActionType.MoveWireNode)(this);
        });
    }

    static findByCoords(coords: [number, number]): WireHandle | null {
        return WireHandle.handles.find(i => i.gridPos[0] === coords[0] && i.gridPos[1] === coords[1]) ?? null;
    }

    isHovering(mouse: [number, number]): boolean {
        const board = manager.setState().board;
        const pos = board.coordsToGrid(this.pos);
        const m_pos = board.coordsToGrid(mouse);

        return m_pos[0] === pos[0] && m_pos[1] === pos[1];
    }

    move(state: State) {
        if (this.isSelected) {
            const pref = state.pref.setState();
            const pos = state.board.gridToPix(this.gridPos, true);
            this.pos = [
                pos[0] - Math.floor((state.dragStart.x - state.mouse.x) / pref.gridSize) * pref.gridSize,
                pos[1] - Math.floor((state.dragStart.y - state.mouse.y) / pref.gridSize) * pref.gridSize
            ];
        }
    }

    render(sketch: p5): void {
        const {pref} = manager.setState();

        const gridSize = pref.setState().gridSize;

        sketch.noStroke();

        sketch.fill(transparent(Colour.Cursor, 0x35));
        let rOffset = Math.floor((gridSize + 1) % 2 * 0.5);

        if (this.isSelected) {
            sketch.rectMode(sketch.CENTER);
            sketch.rect(this.pos[0] - rOffset, this.pos[1] - rOffset, gridSize + 1 + rOffset, (gridSize + 1) + rOffset);
            sketch.rectMode(sketch.CORNER);
        }
    }

    update(sketch: p5): void {

    }
}