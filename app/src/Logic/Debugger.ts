import StateManager from "../sys/util/stateManager";
import Component from "./Component";
import * as $ from "jquery";
import {manager} from "../State";

export enum DebugMode {
    Change = 0,
    Input = 1,
    Output = 2,
    Update = 3,
}

export default class Debugger extends StateManager<{
    debugComponent: Component | null,
    onResume: (() => void) | null,
    debugMode: DebugMode
}> {
    constructor() {
        super({
            debugComponent: null,
            onResume: null,
            debugMode: DebugMode.Change
        });

        $("#resume").on('click', () => {
            const state = this.setState();

            if (state.debugComponent)
                state.debugComponent.breakNext = false;
            state.onResume?.();

            this.broadcast('continue');
            manager.broadcast('tick');
        });
        $("#step").on('click', () => {
            if (this.setState().debugComponent)
                this.step();
            manager.broadcast("tick");
        });

        $("#debug-type-selector span.option").on("click", (that => function (this: HTMLElement) {
            const enumIndex = $(this).data('enum')
            that.setState({debugMode: enumIndex});

            $(`#debug-type-selector span.option.selected`).removeClass('selected');
            $(`#debug-type-selector span.option[data-enum=${enumIndex}]`).addClass('selected');
        })(this));
    }

    isStopped(): boolean {
        return !!(this.setState().debugComponent);
    }

    isBreakComponent(component: Component): boolean {
        console.log(component, this.setState().debugComponent)
        return this.setState().debugComponent === component;
    }

    inspectComponent(component: Component, onResume: () => void) {
        $("#resume, #set-inputs, #step, #stop").prop('disabled', false);
        $("#status-bar").addClass("debug-stopped");

        this.setState({
            debugComponent: component,
            onResume: function (this: Debugger) {
                $("#resume, #set-inputs, #step, #stop").prop('disabled', true);
                $("#status-bar").removeClass("debug-stopped");

                onResume();

                this.setState({
                    debugComponent: null,
                    onResume: null,
                });
            }.bind(this),
        });
    }

    step() {
        const {debugComponent, onResume} = this.setState();
        if (debugComponent)
            debugComponent.breakNext = true;

        if (onResume) // should always be true, but just in case.
            onResume();

        this.broadcast('continue');
    }
}