import sql from "./sql";

export default async function searchComponents(query: string): Promise<string[]> {
    const tok = (await sql.sql_all<{componentToken: string}>(`SELECT componentToken
                               from components
                               where componentName like ?`, [`%${query}%`]));

    return tok.map(i => i.componentToken);
}