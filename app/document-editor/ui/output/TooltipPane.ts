import $ from 'jquery';
import type p5 from 'p5';

import RenderObject from '../../sys/components/RenderObject';
import {manager} from '../../';
import {getColour} from '../../sys/util/Colour';
import Colour from '../../sys/util/Themes';
import {GenComponent} from '../../Logic/io/ComponentFetcher';

export default class TooltipPane extends RenderObject {

    pos: [number, number];
    size: [number, number];
    floatingSize: [number, number];
    outlineSize: [number, number];

    isFloating: boolean = false;

    visibilityToggle: JQuery;

    isVisible: boolean;

    constructor() {
        super(true);
        this.pos = [0, 0];
        this.size = [0, 0];
        this.floatingSize = [0, 0];
        this.outlineSize = [0, 0];
        this.visibilityToggle = $("#panel-vis");

        this.isVisible = this.visibilityToggle.is(":checked");

        manager.on("click", prev => {
            if (!this.isFloating) {
                const lockBtn = [this.pos[0] + this.size[0] - 30, this.pos[1]];
                const dist = (x1: number, y1: number, x2: number, y2: number) => ((y2 - y1) ** 2 + (x2 - x1) ** 2) ** 0.5;
                if (dist(prev.mouse.x, prev.mouse.y, lockBtn[0] + 30 / 2, lockBtn[1] + 30 / 2) < 30 / 2) {
                    this.isFloating = true;
                    $("#pref").append(`<button class="redock"></button>`);
                    const stopFloat = () => this.isFloating = false
                    $(".redock").on('click', function () {
                        stopFloat();
                        $(".redock").remove();
                    });
                }
            }
        });

        $("#redock").on('click', () => this.isFloating = false);
    }

    clean(): void {
    }

    render(sketch: p5): void {
        if (this.isVisible) {
            const state = manager.setState();
            const gridScale = state.pref.setState().gridSize

            sketch.textAlign(sketch.LEFT);
            sketch.textSize(gridScale / 2);
            sketch.fill(getColour(Colour.Blank));

            if (this.isFloating)
                this.renderFloat(sketch);
            else
                this.renderPane(sketch);

        }
    }

    update(sketch: p5): void {
        const state = manager.setState();

        this.isVisible = this.visibilityToggle.is(":checked");

        this.outlineSize = [this.visibilityToggle.is(":checked") ? (this.size[0] + state.board.padding) : 0, this.size[1]];
        this.pos = [Math.floor(state.sidebarIsLeft ? state.board.padding + state.board.translate[0] : state.board.pos.x + state.board.size.w + state.board.translate[0]),
            Math.floor(state.board.pos.y + state.board.translate[1])];
        this.size = this.isFloating ? [0, 0] : [Math.floor(state.sidebarWidth * state.pref.setState().gridSize), Math.floor(state.board.size.h)];

        if (state.renderedComponents) {
            const components = state.renderedComponents.filter(i => i.isWithinBounds(state) || i.isSelected);

            if (components.length > 0) {

                sketch.textSize(18)
                const maxWidthLabel = components.map(i => sketch.textWidth(i.component.label)).reduce((a, i) => a > i ? a : i);
                this.floatingSize = [maxWidthLabel + 8, components.length * 30];
                return;
            }
        }
        this.floatingSize = [0, 0];
    }

    drawBtn(sketch: p5, opt: { padding: number, margin: number, boxHeight: number }) {
        const state = manager.setState();

        const lockBtn = [this.pos[0] + this.size[0] - opt.boxHeight, this.pos[1]];
        if (sketch.dist(state.mouse.x, state.mouse.y, lockBtn[0] + opt.boxHeight / 2, lockBtn[1] + opt.boxHeight / 2) < opt.boxHeight / 2) {
            sketch.fill(getColour(Colour.SecondaryAccent));
            sketch.ellipse(lockBtn[0] + opt.boxHeight / 2, lockBtn[1] + opt.boxHeight / 2, opt.boxHeight);
        }

        sketch.fill(getColour(Colour.Blank));
        sketch.textSize(18);
        sketch.textFont(state.iconFont);
        sketch.text('', lockBtn[0], lockBtn[1], opt.boxHeight, opt.boxHeight);
    }

    private renderPane(sketch: p5) {
        sketch.fill(getColour(Colour.Panel));
        sketch.noStroke();

        if (manager.setState().sidebarIsLeft)
            sketch.rect(this.pos[0], this.pos[1], this.size[0], this.size[1]);
        else
            sketch.rect(this.pos[0] + manager.setState().board.padding, this.pos[1], this.size[0], this.size[1]);

        const state = manager.setState();

        if (state.renderedComponents) {
            const components = state.renderedComponents.filter(i => i.isWithinBounds(state) || i.isSelected);

            sketch.textAlign(sketch.CENTER, sketch.CENTER);

            const padding = 4;
            const margin = 3 * padding;
            const boxHeight = 30;

            this.drawBtn(sketch, {
                padding,
                margin,
                boxHeight
            });

            sketch.textAlign(sketch.LEFT, sketch.CENTER);

            sketch.textFont(state.font);

            for (const [a, i] of components.entries()) {
                sketch.textSize(18);
                sketch.noStroke();
                sketch.fill(getColour(Colour.Label));
                sketch.text(i.component.label, this.pos[0] + padding, this.pos[1] + boxHeight * (a + 1) + (margin * a), this.size[0] - 2 * padding, boxHeight);
                sketch.textSize(12);
                sketch.noStroke();
                sketch.fill(getColour(Colour.Blank));
                sketch.text(`${'documentComponentKey' ? (i.component as GenComponent).documentComponentKey : i.component.name} - ${i.component.name}`, this.pos[0] + padding, this.pos[1] + boxHeight * (a + 2) + (margin * a), this.size[0] - 2 * padding);

                if (i.component.isBreakpoint) {
                    sketch.fill(getColour(Colour.SecondaryAccent))
                    sketch.ellipse(this.pos[0] + this.size[0] - margin, this.pos[1] + boxHeight * (a + 1) + (margin * a) + boxHeight / 2 - padding / 2 + 6, 2 * padding);
                }
            }
        }
    }

    private renderFloat(sketch: p5) {
        const state = manager.setState();

        if (state.renderedComponents) {
            const components = state.renderedComponents.filter(i => i.isWithinBounds(state) || i.isSelected);

            sketch.fill(getColour(Colour.Panel));
            sketch.noStroke();

            const padding = 4;
            const margin = 3 * padding;
            const boxHeight = 30;

            sketch.rect(state.mouse.x + padding, state.mouse.y + margin - padding, this.floatingSize[0], this.floatingSize[1]);

            sketch.textAlign(sketch.LEFT, "center");

            for (const [a, i] of components.entries()) {
                sketch.textSize(18);
                sketch.noStroke();
                sketch.fill(getColour(Colour.Label));
                sketch.text(i.component.label, state.mouse.x + 2 * padding, state.mouse.y + boxHeight * a + (boxHeight - 18) / 2, this.floatingSize[0], boxHeight);
            }
        }
    }
}