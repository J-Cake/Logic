import {manager} from "../../State";
import * as $ from "jquery";
import saveDocument from "../../Logic/io/DocumentWriter";
import {Dialog, setVisible} from "../../menus/DialogManager";
import {DebugMode, WireEditMode} from "../../Enums";
import Debugger from "../../Logic/Debugger";
import {setWireMode} from "../output/wire/wireController";

export enum Action {
    Enter,
    Delete,
    UpdateComponent,
    Close,

    PointerTool,
    SelectTool,
    MoveTool,
    WireTool,
    DebugTool,
    LabelTool,

    WireTool_WireMode_Move,
    WireTool_WireMode_Place,
    WireTool_WireMode_Remove,
    WireTool_WireMode_Select,

    DebugTool_DebugMode_Change,
    DebugTool_DebugMode_Input,
    DebugTool_DebugMode_Output,
    DebugTool_DebugMode_Update,

    Save,
    Cut,
    Copy,
    Paste,
    Undo,
    Redo,

    SelectAll,
    SelectNone,

    Debugger_Step,
    Debugger_Resume,

    OpenComponentMenu,
    OpenImportMenu,

    Flip,
    Rotate_Clockwise,
    Rotate_Counterclockwise,

    ViewDocument,
    Help
}

export const actionMap: Record<Action, () => void> = {
    [Action.Enter]: () => manager.broadcast("enter"),
    [Action.Delete]: () => manager.setState().circuit.deleteSelected(),
    [Action.UpdateComponent]: () => manager.setState().renderedComponents.forEach(i => i.isSelected ? i.onClick() : null),
    [Action.Close]: () => window.location.href = "/dashboard#own",

    [Action.PointerTool]: () => $("#pointer").prop('checked', true),
    [Action.SelectTool]: () => $("#select").prop('checked', true),
    [Action.MoveTool]: () => $("#move").prop('checked', true),
    [Action.WireTool]: () => $("#wire").prop('checked', true),
    [Action.DebugTool]: () => $("#debug").prop('checked', true),
    [Action.LabelTool]: () => $("#label").prop('checked', true),

    [Action.WireTool_WireMode_Move]: () => setWireMode(WireEditMode.Move),
    [Action.WireTool_WireMode_Place]: () => setWireMode(WireEditMode.Place),
    [Action.WireTool_WireMode_Remove]: () => setWireMode(WireEditMode.Remove),
    [Action.WireTool_WireMode_Select]: () => setWireMode(WireEditMode.Select),

    [Action.DebugTool_DebugMode_Change]: () => Debugger.setDebugMode(DebugMode.Change),
    [Action.DebugTool_DebugMode_Input]: () => Debugger.setDebugMode(DebugMode.Input),
    [Action.DebugTool_DebugMode_Output]: () => Debugger.setDebugMode(DebugMode.Output),
    [Action.DebugTool_DebugMode_Update]: () => Debugger.setDebugMode(DebugMode.Update),

    [Action.SelectAll]: () => manager.setState().renderedComponents.forEach(i => {
        i.isSelected = true;
        i.wires.forEach(i => i.handles?.forEach(i => i.isSelected = true));
    }),
    [Action.SelectNone]: () => manager.setState().renderedComponents.forEach(i => {
        i.isSelected = false;
        i.wires.forEach(i => i.handles?.forEach(i => i.isSelected = false));
    }),

    [Action.Save]: () => saveDocument(),
    [Action.Cut]: () => void 0,
    [Action.Copy]: () => void 0,
    [Action.Paste]: () => void 0,
    [Action.Undo]: () => void 0,
    [Action.Redo]: () => void 0,

    [Action.Debugger_Step]: () => manager.setState().debug.stepAction(),
    [Action.Debugger_Resume]: () => manager.setState().debug.resumeAction(),

    [Action.OpenComponentMenu]: () => setVisible(Dialog.ComponentView, true),
    [Action.OpenImportMenu]: () => setVisible(Dialog.ComponentFinder, true),

    [Action.Flip]: function () {
        const prev = manager.setState();
        for (const i of prev.renderedComponents.filter(i => i.isSelected))
            i.props.flip = !i.props.flip;
    },
    [Action.Rotate_Clockwise]: function () {
        const prev = manager.setState();
        for (const i of prev.renderedComponents.filter(i => i.isSelected))
            i.props.direction = ({
                [0]: 3,
                [1]: 0,
                [2]: 1,
                [3]: 2,
            } as Record<0 | 1 | 2 | 3, 0 | 1 | 2 | 3>)[i.props.direction];
    },
    [Action.Rotate_Counterclockwise]: function () {
        const prev = manager.setState();
        for (const i of prev.renderedComponents.filter(i => i.isSelected))
            i.props.direction = ({
                [0]: 1,
                [1]: 2,
                [2]: 3,
                [3]: 0,
            } as Record<0 | 1 | 2 | 3, 0 | 1 | 2 | 3>)[i.props.direction];
    },

    [Action.ViewDocument]: () => void 0,
    [Action.Help]: () => void 0,
}

export const triggerAction = (action: Action) => actionMap[action]?.();