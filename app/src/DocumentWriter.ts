import CircuitManager from "./CircuitManager";
import {CircuitObj} from "../server/Circuit";
import {manager} from "./State";
import {GenComponent, GenericComponent, wires} from "./ComponentFetcher";
import Component from "./Logic/Component";
import RenderComponent from "./UI/RenderComponent";

export default async function saveDocument(): Promise<void> {
    const mgr = manager.setState().circuit, file = await prepareForSave(mgr);
    console.log(file);
    if (!(await fetch(`/circuit/raw/${mgr.circuitId}`, {
        body: JSON.stringify(file, null, 4),
        method: 'PUT',
        headers: {
            'Content-type': 'application/json'
        }
    })).ok)
        alert ('There was an issue saving the file. Check the logs for more info');
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

        const findIdOfComponent = (component: RenderComponent) => (obj => obj ? obj[1] : -1)(Object.values(ids).find(i => i[0] === component.component));

        for (const wire of component.wires)
            wires[findIdOfComponent(wire.endComponent)] = {
                coords: wire.coords,
                inputIndex: wire.endIndex,
                outputIndex: wire.startIndex
            };

        const comp: GenericComponent = {
            identifier: (component.component instanceof GenComponent && component.component.raw?.token) ? component.component.raw.token : component.component.name,
            direction: component.props.direction,
            position: component.props.pos,
            outputs: component.component.outputs.map(i => Object.values(ids).find(j => j[0] === i)).map(i => i ? i[1] : -1),
            wires: wires
        };

        if (id === -1 || comp.outputs.includes(-1))
            throw {
                Err: 'An error occurred saving the document',
                Description: 'There was one or more components whose connections were invalidly configured.'
            }

        content[id] = comp;
    }

    return {
        circuitName: prevDoc.circuitName,
        components: prevDoc.components,
        content: content,
        ownerEmail: prevDoc.ownerEmail,
    }
}