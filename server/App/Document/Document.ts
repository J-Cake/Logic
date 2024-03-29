import path from 'path';

import _ from 'lodash';

import sql from '../../util/sql';
import {DBDocument} from './getFile';
import {ApiComponent, GenericComponent} from '../../../app/document-editor/Logic/io/ComponentFetcher';
import {readFile} from '../../util/files';
import {rootFn} from '../../util/utils';


export interface CircuitObj {
    circuitName: string,
    content: { [id: number]: GenericComponent },
    components: string[], // List of component tokens
    ownerEmail: string,
}

export default class Document implements CircuitObj {
    info: CircuitObj;
    collaborators: number[]; // UserIDs
    private readonly docId: number;
    private readonly readOnly: boolean;

    constructor(documentId: number, readOnly: boolean = false) {
        this.docId = documentId;
        this.info = {circuitName: "", components: [], content: {}, ownerEmail: ""};

        this.readOnly = readOnly

        this.collaborators = [];

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

    async componentIdStringToNames(): Promise<{ [token: string]: string }> {
        const comps: ApiComponent[] = (await Promise.all(this.components.map(async i => JSON.parse(i.startsWith('$') ?
            await readFile(path.join(await rootFn(), 'lib', 'components', i.slice(1) + ".json")) : // Standard Component
            (await sql.sql_get<{ source: string }>(`SELECT source
                                                    from components
                                                    where "componentToken" = $1`, [i])).source)))).map((i, a) => ({
            ...i,
            token: this.components[a]
        }));
        return _.mapValues(_.keyBy(comps, 'token'), i => i.name);
    }

    async isOwner(userId: number): Promise<boolean> {
        return !!await sql.sql_get(`select "documentId"
                                    from documents
                                    where "ownerId" = $1`, [userId]);
    }

    async fetchInfo(): Promise<CircuitObj> {
        const {source} = await sql.sql_get<Partial<DBDocument>>(`SELECT source
                                                                 from documents
                                                                 where "documentId" = $1`, [this.docId]);

        this.collaborators = (await sql.sql_all<{ userId: number }>(`SELECT "userId"
                                                from access
                                                where "documentId" = $1`, [this.docId])).map(i => i.userId);

        if (source)
            try {
                return this.info = JSON.parse(source);
            } catch (err) {
                console.error(err);
                throw 'Document is corrupt and was not able to be read'
            }
        else
            throw 'Unable to read file. Location was not found';
    }

    async writeContents(circuit: CircuitObj): Promise<void> {
        if (!this.readOnly)
            try {
                await sql.sql_query(`UPDATE documents
                                     SET edited = DEFAULT,
                                         source = $1
                                     where "documentId" = $2`, [JSON.stringify(circuit), this.docId]);
            } catch (err) {
                throw 'write failed';
            }
        else throw 'write not permitted';
    }

    async removeCollaborator(actorId: number, userId: number): Promise<void> {
        if (actorId === userId || (!this.readOnly && await this.isOwner(actorId)))
            await sql.sql_query(`DELETE
                                 from access
                                 where "documentId" = $1
                                   and "userId" = $2`, [this.docId, userId]);
        else throw 'write not permitted';
    }

    async addCollaborator(actorId: number, userId: number, canEdit: boolean = false): Promise<boolean> {
        if (!this.readOnly && await this.isOwner(actorId)) {
            await sql.sql_query(`insert into access ("documentId", "userId")
                                 select $1 as "documentId", $2 as userId except
                                 select "documentId", "userId"
                                 from access
                                 where "documentId" = $1
                                   and "userId" = $2;`, [this.docId, userId]);
            await this.changeAccess(actorId, userId, canEdit);
        } else throw 'write not permitted';
        return canEdit;
    }

    async delete(userId: number): Promise<void> {
        if (!this.readOnly && await this.isOwner(userId))
            await sql.sql_query(`DELETE
                                 from documents
                                 where "documentId" = $1`, [this.docId]);
        else throw 'write not permitted';
    }

    async changeAccess(actorId: number, userId: number, canEdit: boolean): Promise<boolean> {
        if (!this.readOnly && await this.isOwner(actorId))
            await sql.sql_query(`update access
                                 set "canEdit" = $1
                                 where "userId" = $2
                                   and "documentId" = $3`, [canEdit, userId, this.docId]);
        else throw 'write not permitted';
        return canEdit;
    }

    async changeDocumentName(userId: number, name: string): Promise<void> {
        if (!this.readOnly && await this.isOwner(userId))
            await sql.sql_query(`update documents
                                 set "documentTitle" = $1
                                 where "documentId" = $2`, [name, this.docId]);
        else throw 'write not permitted';
    }

    async changeVisibility(userId: number, isPublic: boolean): Promise<void> {
        if (!this.readOnly && await this.isOwner(userId))
            await sql.sql_query(`update documents
                                 set public = $1
                                 where "documentId" = $2`, [isPublic, this.docId]);
        else throw'write not permitted';
    }
}