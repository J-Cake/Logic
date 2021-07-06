import _ from 'lodash';

import {GenComponent} from '../Logic/io/ComponentFetcher';
import RenderComponent from '../ui/RenderComponent';

/// <reference path="/plugin.d.ts" />

export type SanitisedRenderer = SanitisedRenderComponent;
export type SanitisedComp = SanitisedRenderComponent;

export function sanitiseComponent(component: GenComponent): SanitisedComponent {
    return {
        inputNames: component.inputNames,
        outputNames: component.outputNames,
        label: component.label,
        out: component.out,
        token: component.raw?.token ?? '',
        compute: component.computeOutputs,
        getInputs: component.getInputs,
        update: component.update,
        getInputList: () => _.mapValues(component.inputs, i => [sanitiseComponent(i[0] as GenComponent), i[1]] as [SanitisedComponent, string]),
        getOutputList: () => _.mapValues(component.outputs, i => i.map(i => [sanitiseComponent(i[0] as GenComponent), i[1]] as [SanitisedComponent, string])),
    }
}

export function sanitiseRenderComponent(renderComponent: RenderComponent): SanitisedRenderComponent {
    return {
        component: sanitiseComponent(renderComponent.component as GenComponent),
        isSelected: false,
        pos: [0, 0],
        props: {
            pos: renderComponent.props.pos,
            direction: renderComponent.props.direction,
            flip: renderComponent.props.flip,
            label: renderComponent.props.label,
        },
        size: [0, 0],
        wires: [],
        getTerminal: renderComponent.getTouchingTerminal,
        isHovering: renderComponent.isHovering
    }
}