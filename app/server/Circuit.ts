import * as fs from 'fs';
import * as path from 'path';

import sql from "./sql";
import {DBDocument} from "./getFile";
import {rootFn} from "./utils";
import {GenericComponent} from "../src/ComponentFetcher";

export interface CircuitObj {
    circuitName: string,
    content: { [id: string]: GenericComponent },
    components: string[],
    ownerEmail: string,
    wires: [number, number][][]
}

export default class Circuit implements CircuitObj {
    info: CircuitObj;
    private readonly docId: number;

    constructor(documentId: number) {
        this.docId = documentId;
        this.info = {circuitName: "", components: [], content: {}, ownerEmail: "", wires: []};

        void this.fetchInfo(); // ignore promise
    }

    get wires() {
        return this.info.wires;
    }

    get circuitName() {
        return this.info.circuitName;
    }

    get components() {
        return this.info.components
    };

    get content() {
        return this.info.content;
    }

    get ownerEmail() {
        return this.info.ownerEmail;
    }

    async fetchInfo() {
        const {physicalLocation} = await sql.sql_get<Partial<DBDocument>>(`SELECT physicalLocation
                                                                           from documents
                                                                           where documentId == ?`, [this.docId]);

        if (physicalLocation)
            this.info = JSON.parse(fs.readFileSync(path.join(rootFn(process.cwd()), 'Data', 'documents', physicalLocation)).toString()) as CircuitObj;
    }

    async writeContents(circuit: CircuitObj): Promise<void> {
        const {physicalLocation} = await sql.sql_get<Partial<DBDocument>>(`SELECT physicalLocation
                                                                           from documents
                                                                           where documentId == ?`, [this.docId]);

        if (physicalLocation)
            fs.writeFileSync(path.join(rootFn(process.cwd()), 'Data', 'documents', physicalLocation), JSON.stringify(circuit, null, 4));
    }
}