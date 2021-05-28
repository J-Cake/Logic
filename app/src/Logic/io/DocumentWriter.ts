import CircuitManager from './CircuitManager';
import {CircuitObj} from '../../../../server/App/Document/Document';
import {manager} from '../../State';
import {GenComponent, GenericComponent, wires} from './ComponentFetcher';
import Component from '../Component';
import RenderComponent from '../../ui/RenderComponent';
import {attempt} from "../../../util";
import {saveDocument} from "../../sys/API/circuit";

export default async function save(): Promise<void> {
    const mgr = manager.setState().circuit;
    const file = await prepareForSave(mgr);

    if (mgr.circuitId)
        await saveDocument(mgr.circuitId, file);
    // alert('There was an issue saving the file. Check the logs for more info');
    else if (confirm('You are not signed in. Create Account?'))
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

        if ((component.component as GenComponent).raw?.token)
            content[id] = {
                token: (component.component as GenComponent).raw?.token ?? '',
                label: component.component.label,
                direction: component.props.direction,
                flip: component.props.flip,
                position: component.props.pos,
                outputs: outputs,
                wires: wires
            };
        else
            throw {
                msg: `There was an error saving the document. Unknown component found.`,
                component: component
            };
    }

    return {
        circuitName: prevDoc.circuitName,
        components: Object.keys(c_man.state.setState().availableComponents),
        content: content,
        ownerEmail: prevDoc.ownerEmail,
    }
}