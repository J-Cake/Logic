import AddComponent from "./actions/AddComponent";
import RemoveComponents from "./actions/RemoveComponents";
import MoveComponent from "./actions/MoveComponent";
import ConnectComponent from "./actions/ConnectComponent";
import DisconnectComponent from "./actions/DisconnectComponent";
import AddWireNode from "./actions/AddWireNode";
import RemoveWireNode from "./actions/RemoveWireNode";
import MoveWireNode from "./actions/MoveWireNode";
import ChangeLabel from "./actions/ChangeLabel";
import RotateComponent from "./actions/RotateComponent";
import FlipComponent from "./actions/FlipComponent";
import {manager, State} from "../State";

export enum ActionType {
    AddComponent,
    RemoveComponents,
    MoveComponent,
    ConnectComponent,
    DisconnectComponent,

    AddWireNode,
    RemoveWireNode,
    MoveWireNode,

    ChangeLabel,
    RotateComponent,
    FlipComponent,
}

export type Action<T extends ActionType = ActionType> = {
    type: T,

    performAction(state: State): void,

    undo(state: State): void,
    redo(state: State): void
}

// Ew
type Param<T extends ActionType> = T extends ActionType.AddComponent ? typeof AddComponent :
    T extends ActionType.RemoveComponents ? typeof RemoveComponents :
    T extends ActionType.MoveComponent ? typeof MoveComponent :
    T extends ActionType.ConnectComponent ? typeof ConnectComponent :
    T extends ActionType.DisconnectComponent ? typeof DisconnectComponent :
    T extends ActionType.AddWireNode ? typeof AddWireNode :
    T extends ActionType.RemoveWireNode ? typeof RemoveWireNode :
    T extends ActionType.MoveWireNode ? typeof MoveWireNode :
    T extends ActionType.ChangeLabel ? typeof ChangeLabel :
    T extends ActionType.RotateComponent ? typeof RotateComponent :
    T extends ActionType.FlipComponent ? typeof FlipComponent : null;

const actionMap: { readonly [K in ActionType]: Param<K> & Function } = {
    [ActionType.AddComponent]: AddComponent, // Done
    [ActionType.RemoveComponents]: RemoveComponents, //
    [ActionType.MoveComponent]: MoveComponent, // Done
    [ActionType.ConnectComponent]: ConnectComponent, // Done
    [ActionType.DisconnectComponent]: DisconnectComponent, // Done

    [ActionType.AddWireNode]: AddWireNode, // Done
    [ActionType.RemoveWireNode]: RemoveWireNode, // Done
    [ActionType.MoveWireNode]: MoveWireNode, // Done

    [ActionType.ChangeLabel]: ChangeLabel, // Done
    [ActionType.RotateComponent]: RotateComponent, // Done
    [ActionType.FlipComponent]: FlipComponent //
} as const;

/**
 * Performs and manages a reversible action
 * @param action The type of action to perform.
 */
export function performAction<T extends ActionType>(action: T): (...x: Parameters<typeof actionMap[T]>) => void {
    return function (...x: Parameters<typeof actionMap[T]>): void {
        const state = manager.setState();
        const actionUnit: Action<T> = actionMap[action].call(null, ...x);

        state.history.push(actionUnit);

        actionUnit.performAction(state);
    }
}