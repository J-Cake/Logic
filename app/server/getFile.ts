import Circuit from "./Circuit";
import sql from "./sql";

export type AccessTable = { documentId: number, userId: number, dateGranted: Date, canEdit: boolean };
export type DBUser = { userId: number, email: string, password: string, joined: Date, identifier: string, userToken: string };
export type DBDocument = { ownerId: number, physicalLocation: string, documentId: number, documentTitle: string, public: boolean, documentToken: string, source: string };

export default async function getFile(userToken: string, documentToken: string): Promise<Circuit> {
    const document_owner = await sql.sql_get<DBDocument>(`Select documentId
                                                          from documents
                                                          where documentToken == ?
                                                            and ownerId == (Select userId from users where userToken == ?)`, [documentToken, userToken]);
    if (document_owner)
        return new Circuit(document_owner.documentId);

    const document_collaborator = await sql.sql_get<AccessTable>(`Select documentId, canEdit
                                                                 from access
                                                                 where documentId == (Select documentId from documents where documentToken == ?)
                                                                   and userId == (Select userId from users where userToken == ?)`, [documentToken, userToken])
    if (document_collaborator)
        return new Circuit(document_collaborator.documentId, !document_collaborator.canEdit);

    throw {err: 'user does not have access'};
}

export async function userTokenToId(token: string): Promise<number> {
    return (await sql.sql_get<DBUser>(`SELECT userId from users where userToken == ?`, [token])).userId;
}