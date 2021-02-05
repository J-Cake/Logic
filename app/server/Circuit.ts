import * as fs from 'fs';
import * as path from 'path';

import sql from "./sql";
import {DBDocument} from "./getFile";
import {rootFn} from "./utils";
import {GenericComponent} from "../src/ComponentFetcher";

export interface CircuitObj {
    circuitName: string,
    content: { [id: number]: GenericComponent },
    components: string[],
    ownerEmail: string,
}

export default class Circuit implements CircuitObj {
    info: CircuitObj;
    private readonly docId: number;

    constructor(documentId: number) {
        this.docId = documentId;
        this.info = {circuitName: "", components: [], content: {}, ownerEmail: ""};

        void this.fetchInfo(); // ignore promise
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