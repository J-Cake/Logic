import sql from "./sql";
import {DBDocument} from "./getFile";
import {GenericComponent} from "../src/Logic/ComponentFetcher";

export interface CircuitObj {
    circuitName: string,
    content: { [id: number]: GenericComponent },
    components: string[],
    ownerEmail: string,
}

export default class Circuit implements CircuitObj {
    info: CircuitObj;
    private readonly docId: number;
    private readonly readOnly: boolean;

    constructor(documentId: number, readOnly: boolean = false) {
        this.docId = documentId;
        this.info = {circuitName: "", components: [], content: {}, ownerEmail: ""};

        this.readOnly = readOnly

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

    async isOwner(userId: number): Promise<boolean> {
        return !!await sql.sql_get(`select documentId
                                    from documents
                                    where ownerId == ?`, [userId]);
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
        if (!this.readOnly)
            try {
                await sql.sql_query(`UPDATE documents
                                     SET edited = ?,
                                         source = ?
                                     where documentId == ?`, [new Date().getTime(), JSON.stringify(circuit), this.docId]);
            } catch (err) {
                throw {err: 'write failed'};
            }
        else throw {err: 'write not permitted'};
    }

    async removeCollaborator(actorId: number, userId: number): Promise<void> {
        console.log(actorId, userId);
        if (actorId === userId || (!this.readOnly && await this.isOwner(actorId)))
            await sql.sql_query(`DELETE
                                 from access
                                 where documentId == ?1
                                   and userId == ?2`, [this.docId, userId]);
        else throw {err: 'write not permitted'};
    }

    async addCollaborator(actorId: number, userId: number): Promise<void> {
        if (!this.readOnly && await this.isOwner(actorId))
            await sql.sql_query(`insert into access (documentId, userId)
                                 select ?1 as documentId, ?2 as userId except
                                 select documentId, userId
                                 from access
                                 where documentId == ?1
                                   and userId == ?2`, [this.docId, userId])
        else throw {err: 'write not permitted'};
    }

    async delete(userId: number): Promise<void> {
        if (!this.readOnly && await this.isOwner(userId))
            await sql.sql_query(`DELETE
                                 from documents
                                 where documentId == ?`, [this.docId]);
        else throw {err: 'write not permitted'};
    }

    async changeAccess(actorId: number, userId: number, canEdit: boolean): Promise<void> {
        if (!this.readOnly && await this.isOwner(actorId))
            await sql.sql_query(`update access
                                 set canEdit = ?
                                 where userId == ?
                                   and documentId == ?`, [canEdit, userId, this.docId]);
        else throw {err: 'write not permitted'};
    }

    async changeDocumentName(userId: number, name: string): Promise<void> {
        if (!this.readOnly && await this.isOwner(userId))
            await sql.sql_query(`update documents
                                 set documentTitle = ?
                                 where documentId == ?`, [name, this.docId]);
        else throw {err: 'write not permitted'};
    }

    async changeVisibility(userId: number, isPublic: boolean): Promise<void> {
        if (!this.readOnly && await this.isOwner(userId))
            await sql.sql_query(`update documents
                                 set public = ?
                                 where documentId == ?`, [isPublic, this.docId]);
        else throw {err: 'write not permitted'};
    }
}