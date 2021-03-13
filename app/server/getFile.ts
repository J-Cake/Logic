import Circuit from "./Circuit";
import sql from "./sql";

export type AccessTable = { documentId: number, userId: number, dateGranted: Date };
export type DBUser = { userId: number, email: string, password: string, joined: Date, identifier: string, userToken: string };
export type DBDocument = { ownerId: number, physicalLocation: string, documentId: number, documentTitle: string, public: boolean, documentToken: string, source: string };

export default async function getFile(userToken: string, documentToken: string): Promise<Circuit | null> {
    const user = await (sql.sql_get<DBUser>(`Select userId
                                             from users
                                             where userToken == ?`, [userToken]));
    const file = await sql.sql_get<DBDocument[]>(`Select *
                                                  from documents
                                                  where (documentToken == ? and
                                                         ownerId == (SELECT userId from users where userToken == ?))`, [documentToken, userToken]);

    const getDoc = async () => (await sql.sql_get<DBDocument>(`Select documentId
                                                               from documents
                                                               where documentToken == ?`, [documentToken])).documentId;

    if (!file) { // If the person requesting the document is not the owner
        const fileAccessList = await sql.sql_all<AccessTable>(`SELECT *
                                                               from access
                                                               where documentId == (SELECT documentId from documents where documentToken == ?)`, [documentToken]);

        if (fileAccessList.map(i => i.userId).includes(user.userId))
            return new Circuit(await getDoc());
        else
            return null;
    } else return new Circuit(await getDoc());
}