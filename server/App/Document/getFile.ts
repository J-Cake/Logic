import Document from './Document';
import sql from '../../util/sql';
import {Preferences} from '../../../app/src/Enums';

export type AccessTable = { documentId: number, userId: number, dateGranted: Date, canEdit: boolean };
export type DBUser = { userId: number, email: string, password: string, joined: Date, identifier: string, userToken: string };
export type DBDocument = { ownerId: number, physicalLocation: string, documentId: number, documentTitle: string, public: boolean, documentToken: string, source: string };
export type DBPreferenceMap = Preferences;

export default async function getFile(userToken: string, documentToken: string): Promise<Document> {
    const document_owner = await sql.sql_get<DBDocument>(`Select "documentId"
                                                          from documents
                                                          where "documentToken" = $1
                                                            and ("ownerId" = (Select "userId" from users where "userToken" = $2)
                                                              or public is true)`, [documentToken, userToken]);
    if (document_owner)
        return new Document(document_owner.documentId);

    const document_collaborator = await sql.sql_get<AccessTable>(`Select "documentId", "canEdit"
                                                                  from access
                                                                  where "documentId" =
                                                                        (Select "documentId" from documents where "documentToken" = $1)
                                                                    and "userId" = (Select "userId" from users where "userToken" = $2)`, [documentToken, userToken])
    if (document_collaborator)
        return new Document(document_collaborator.documentId, !document_collaborator.canEdit);

    throw 'user does not have access';
}

export async function userTokenToId(token: string): Promise<number> {
    return (await sql.sql_get<DBUser>(`SELECT "userId"
                                       from users
                                       where "userToken" = $1`, [token])).userId;
}