import StateManager from "../sys/util/stateManager";
import Component from "./Component";
import * as $ from "jquery";

export default class Debugger extends StateManager<{
    debugComponent: Component | null,
    onResume: (() => void) | null,
}> {
    constructor() {
        super({
            debugComponent: null,
            onResume: null
        });

        $("#resume").on('click', () => {
            const resume = this.setState().onResume;
            if (resume)
                resume();
        })
    }

    isStopped(): boolean {
        return !!(this.setState().debugComponent);
    }

    isBreakComponent(component: Component): boolean {
        return this.setState().debugComponent === component;
    }

    inspectComponent(component: Component, onResume: () => void) {
        $("#resume, #set-inputs").prop('disabled', false);
        $("#status-bar").addClass("debug-stopped");

        this.setState({
            debugComponent: component,
            onResume: function (this: Debugger) {
                $("#resume, #set-inputs").prop('disabled', true);
                $("#status-bar").removeClass("debug-stopped");

                onResume();

                this.setState({
                    debugComponent: null,
                    onResume: null,
                });
            }.bind(this),
        });
    }
}