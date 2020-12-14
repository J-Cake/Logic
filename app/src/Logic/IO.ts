import Component from "./Component";

export class Input extends Component {

    label: string = "";

    private _on: boolean = false;

    set on(value: boolean) {
        this._on = value;
        this.update();
    }

    computeOutputs(inputs: boolean[]): boolean[] {
        return [this.on];
    }

}

export class Output extends Component {

    label: string = "";

    computeOutputs(inputs: boolean[]): boolean[] {
        return [];
    }

}