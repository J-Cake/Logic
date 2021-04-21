import $ from 'jquery'
import {Action, triggerAction} from './Action';
import bindWireMode from '../output/wire/wireController';

export const buttons: Record<Action, JQuery[]> = {
    [Action.Enter]: [],
    [Action.Delete]: [$("#remove-component")],
    [Action.UpdateComponent]: [],
    [Action.Close]: [$("button#close")],

    [Action.PointerTool]: [$("#pointer")],
    [Action.SelectTool]: [$("#select")],
    [Action.MoveTool]: [$("#move")],
    [Action.WireTool]: [$("#wire")],
    [Action.DebugTool]: [$("#debug")],
    [Action.LabelTool]: [$("#label")],

    [Action.WireTool_WireMode_Move]: [],
    [Action.WireTool_WireMode_Place]: [],
    [Action.WireTool_WireMode_Remove]: [],
    [Action.WireTool_WireMode_Select]: [],

    [Action.DebugTool_DebugMode_Change]: [],
    [Action.DebugTool_DebugMode_Input]: [],
    [Action.DebugTool_DebugMode_Output]: [],
    [Action.DebugTool_DebugMode_Update]: [],

    [Action.SelectAll]: [],
    [Action.SelectNone]: [],

    [Action.Save]: [$("button#save")],
    [Action.Cut]: [$("button#cut")],
    [Action.Copy]: [$("button#copy")],
    [Action.Paste]: [$("button#paste")],
    [Action.Undo]: [$("button#undo")],
    [Action.Redo]: [$("button#redo")],

    [Action.Debugger_Step]: [$("button#step")],
    [Action.Debugger_Resume]: [$("button#resume")],

    [Action.OpenComponentMenu]: [$("input#add-component+label")],
    [Action.OpenImportMenu]: [$("input#import-component+label")],

    [Action.Flip]: [$("button#flip")],
    [Action.Rotate_Clockwise]: [$("button#rotate-right")],
    [Action.Rotate_Counterclockwise]: [$("button#rotate-left")],

    [Action.ViewDocument]: [$("button#view")],
    [Action.Help]: [$("button#help")],

    [Action.Pan_Up]: [],
    [Action.Pan_Down]: [],
    [Action.Pan_Left]: [],
    [Action.Pan_Right]: [],
}

export default function bind() {
    for (const [a, i] of Object.entries(buttons))
        for (const j of i)
            j.on('click', () => triggerAction(Number(a) as Action));

    // Do other button initiation here
    bindWireMode();
}