import DragObject from "../../../sys/components/DragObject";
import * as p5 from "p5";
import {manager, Tool} from "../../../State";
import {getColour, transparent} from "../../../sys/util/Colour";
import {Colour, WireEditMode} from "../../../Enums";
import Wire from "./Wire";

export class WireHandle extends DragObject {
    static handleSize: number = 12;
    gridPos: [number, number];

    mousePos: [number, number];

    onMove: (coords: [number, number]) => void;
    onDelete: () => void;

    isSelected: boolean;
    isMoving: boolean;

    constructor(startingCoords: [number, number], onMove: (coords: [number, number]) => void, onDelete: () => void) {
        super(false, true);

        this.pos = {x: startingCoords[0], y: startingCoords[1]};
        this.mousePos = [0, 0];
        this.gridPos = [this.pos.x, this.pos.y];

        this.isSelected = false;
        this.isMoving = false;

        this.onMove = onMove;
        this.onDelete = onDelete;

        manager.on('mouseUp', state => {
            const gridSize = state.pref.setState().gridSize;
            this.pos.x = Math.floor(this.pos.x / gridSize) * gridSize + Math.floor(gridSize / 4) - 1;
            this.pos.y = Math.floor(this.pos.y / gridSize) * gridSize + Math.floor(gridSize / 4) - 1;
        });

        manager.on('wire_click', async state => {
            if (state.wireEditMode === WireEditMode.Select)
                if (this.isHovering([state.mouse.x, state.mouse.y]))
                    if (state.keys.shift)
                        this.isSelected = !this.isSelected;
                    else
                        this.isSelected = true;
                else if (!state.keys.shift)
                    this.isSelected = false;

            await manager.broadcast('tick');
        });

        manager.on("select", prev => {
            if (this.isHovering([prev.mouse.x, prev.mouse.y]))
                if (prev.keys.shift)
                    this.isSelected = !this.isSelected;
                else
                    this.isSelected = true;
            else if (!prev.keys.shift)
                this.isSelected = false;
        });

        manager.on('mouse-drop', () => {
            this.isMoving = false;
        });
        manager.on('mouse-grab', () => {
            if (this.isSelected)
                this.isMoving = true;
        });
    }

    static findByCoords(coords: [number, number]): [Wire, WireHandle] | null {
        const wires = manager.setState().renderedComponents.map(i => i.wires).flat() as Wire[];
        for (const i of wires) {
            const handle = i.handles?.find(i => i.isHovering(coords));
            if (handle)
                return [i, handle];
        }

        return null;
    }

    isHovering(pos: [number, number]): boolean {
        return ((pos[0] - this.gridPos[0]) ** 2 + (pos[1] - this.gridPos[1]) ** 2) ** 0.5 <= WireHandle.handleSize / 2;
    }

    draw(sketch: p5): void {
        const {mouse, pref, tool} = manager.setState();

        const gridSize = pref.setState().gridSize;

        sketch.noStroke();

        sketch.fill(transparent(Colour.Cursor, 0x35));
        const pos = [
            Math.floor(this.pos.x / gridSize) * gridSize + Math.floor(gridSize / 4) - 1,
            Math.floor(this.pos.y / gridSize) * gridSize + Math.floor(gridSize / 4) - 1
        ];
        let rOffset = (gridSize + 1) % 2 * 0.5;

        if (this.isDragging) {
            sketch.rectMode(sketch.CENTER);
            sketch.rect(Math.floor(pos[0]) - rOffset, Math.floor(pos[1]) - rOffset, gridSize + 1 + rOffset, (gridSize + 1) + rOffset);
            sketch.rectMode(sketch.CORNER);
        }

        sketch.ellipseMode(sketch.CORNER);
        sketch.fill(tool === Tool.Wire ?
            getColour(this.isSelected ? Colour.Danger : (this.isHover(mouse) ? Colour.Active : Colour.Cursor)) :
            transparent(this.isSelected ? Colour.Danger : Colour.Cursor, 40));
        sketch.ellipse(Math.floor(this.pos.x - gridSize / 4) + rOffset, Math.floor(this.pos.y - gridSize / 4) + rOffset, Math.floor(gridSize / 2) + 1 + rOffset, Math.floor(gridSize / 2) + 1 + rOffset);
    }

    protected isHover(mousePos: { x: number; y: number }): boolean {
        const {tool, wireEditMode, dragObjects} = manager.setState();

        if (!dragObjects.filter(i => i !== this).some(i => i.isDragging))
            return tool === Tool.Wire && wireEditMode === WireEditMode.Move ? this.isHovering([mousePos.x, mousePos.y]) : false;
        return false;
    }

    protected tick(sketch: p5): void {
        const {board, mouse, p_mouse, pref} = manager.setState();
        const {gridSize} = pref.setState();

        if (mouse.pressed)
            this.onMove(board.coordsToGrid(this.gridPos = board.gridToPix(board.coordsToGrid([this.pos.x, this.pos.y]), true)));

        this.mousePos = [this.mousePos[0] + (mouse.x - p_mouse.x), this.mousePos[1] + (mouse.y - p_mouse.y)];

        if (this.isMoving) {
            this.pos.x = Math.floor(this.mousePos[0] / gridSize) * gridSize + gridSize / 4 - 1;
            this.pos.y = Math.floor(this.mousePos[1] / gridSize) * gridSize + gridSize / 4 - 1;
        } else
            this.mousePos = [this.pos.x, this.pos.y];

    }
}