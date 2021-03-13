import * as path from 'path';

import sql from "./sql";
import {DBDocument} from "./getFile";
import {rootFn} from "./utils";
import {GenericComponent} from "../src/Logic/ComponentFetcher";
import * as FS from "./FS";

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
        const {source} = await sql.sql_get<Partial<DBDocument>>(`SELECT source
                                                                 from documents
                                                                 where documentId == ?`, [this.docId]);

        if (source)
            try {
                this.info = JSON.parse(source)
            } catch (err) {
                throw {err: 'Document is corrupt and was not able to be read'}
            }
        else
            throw {err: 'Unable to read file. Location was not found'};
    }

    async writeContents(circuit: CircuitObj): Promise<void> {
            try {
                await sql.sql_query(`UPDATE documents
                                     SET edited = ?,
                                         source = ?
                                     where documentId == ?`, [new Date().getTime(), JSON.stringify(circuit), this.docId]);
                console.log("Saving Completed", this.docId);
            } catch (err) {
                throw {err: 'write failed'};
            }
    }
}