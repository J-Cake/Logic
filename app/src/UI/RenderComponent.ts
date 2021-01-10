import * as p5 from "p5";

import RenderObject from "../sys/components/RenderObject";
import Component from "../Logic/Component";
import CircuitManager from "../CircuitManager";

export interface RenderProps {
    pos: [number, number],
    label: string,
    isStateful: boolean
}

export default class RenderComponent<C extends Component> extends RenderObject {

    component: C;
    props: RenderProps;

    constructor(component: C, props: RenderProps) {
        super();

        this.component = component;
        this.props = props;

        console.log(props);
    }

    clean(): void {
    }

    render(sketch: p5): void {
        sketch.fill(255, 0, 0);
        sketch.rect(this.props.pos[0] * 100, this.props.pos[1] * 100, 50, 50);
    }

    protected update(sketch: p5): void {
    }
}

export function renderComponents(circuitManager: CircuitManager) {
    circuitManager.loading.then(function() {
        const state = circuitManager.state.setState();

        if (state)
            return state.components.map((i, a) => new RenderComponent(i, {
                isStateful: false,
                label: i.name,
                pos: state.componentMap[i.mapKey][0].position
            }));
    });
}