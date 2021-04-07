import CircuitManager from "./CircuitManager";
import {CircuitObj} from "../../server/Circuit";
import {manager} from "../State";
import {GenComponent, GenericComponent, wires} from "./ComponentFetcher";
import Component from "./Component";
import RenderComponent from "../UI/RenderComponent";

export default async function saveDocument(): Promise<void> {
    const mgr = manager.setState().circuit, file = await prepareForSave(mgr);
    if (mgr.circuitId) {
        if (!(await fetch(`/circuit/${mgr.circuitId}`, {
            body: JSON.stringify(file, null, 4),
            method: 'PUT',
            headers: {
                'Content-type': 'application/json'
            }
        })).ok)
            alert('There was an issue saving the file. Check the logs for more info');
    } else if (confirm('You are not signed in. Create Account?'))
        window.open('/user/signup', '_blank');
}

export async function prepareForSave(c_man: CircuitManager): Promise<CircuitObj> {
    const prevDoc: CircuitObj = c_man.state.setState().document;
    // These can be changed arbitrarily throughout the working time, meaning these will be up-to-date by the time the document needs saving.

    const content: { [id: string]: GenericComponent } = {};

    const ids: { [identifier: number]: [Component, number] } = {};

    for (const i of manager.setState().circuit.state.setState().components)
        ids[Object.keys(ids).length] = [i, Object.keys(ids).length];

    for (const component of manager.setState().renderedComponents) {

        const id = (obj => obj ? obj[1] : -1)(Object.values(ids).find(i => i[0] === component.component));
        const wires: wires = {};

        // console.log(component.component.name, component.wires);

        const findIdOfComponent = (component: Component) => (obj => obj ? obj[1] : -1)(Object.values(ids).find(i => i[0] === component));
        const findIdOfRenderComponent = (component: RenderComponent) => (obj => obj ? obj[1] : -1)(Object.values(ids).find(i => i[0] === component.component));

        for (const wire of component.wires) {
            const id = findIdOfRenderComponent(wire.endComponent)
            if (wires[id])
                wires[id].push({
                    coords: wire.coords,
                    inputIndex: wire.endIndex,
                    outputIndex: wire.startIndex
                });
            else
                wires[id] = [{
                    coords: wire.coords,
                    inputIndex: wire.endIndex,
                    outputIndex: wire.startIndex
                }];
        }

        const outputs: { [terminal: string]: [number, string][] } = {};

        for (const i in component.component.outputs)
            outputs[i] = component.component.outputs[i].map(i => [findIdOfComponent(i[0]), i[1]]);

        content[id] = {
            identifier: (component.component instanceof GenComponent && component.component.raw?.token) ? component.component.raw.token : component.component.name,
            label: component.component.label,
            direction: component.props.direction,
            flip: component.props.flip,
            position: component.props.pos,
            outputs: outputs,
            wires: wires
        };
    }

    return {
        circuitName: prevDoc.circuitName,
        components: prevDoc.components,
        content: content,
        ownerEmail: prevDoc.ownerEmail,
    }
}