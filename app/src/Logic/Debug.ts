import Component from "./Component";
import StateManager from "../sys/util/stateManager";

export interface Debug {
    breakComponent: Component[],
    currentComponent: Component
}

const manager: StateManager<Debug> = new StateManager<Debug>({});

export default manager;