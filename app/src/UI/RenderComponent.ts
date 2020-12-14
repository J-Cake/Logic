import * as p5 from "p5";

import RenderObject from "../sys/components/RenderObject";
import Component from "../Logic/Component";

export default class RenderComponent<C extends Component> extends RenderObject {

    clean(): void {
    }

    render(sketch: p5): void {
    }

    protected update(sketch: p5): void {
    }
}