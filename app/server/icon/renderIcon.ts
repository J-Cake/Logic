export enum TokenType {
    Identifier,
    Number,
    NewLine,
    Space,
    Colon
}

export const matchers: Record<TokenType, (char: string) => boolean> = {
    [TokenType.Identifier]: char => /^[a-zA-Z$_][a-zA-Z0-9$_]*$/.test(char),
    [TokenType.Number]: char => /^[0-9]+(\.[0-9]+)?$/.test(char),
    [TokenType.NewLine]: char => /^[\n\r]+$/.test(char),
    [TokenType.Space]: char => /^ +$/.test(char),
    [TokenType.Colon]: char => char.trim() === ':'
}

export enum Functions {
    Line,
    Polygon,
    Arc,
    Ellipse
}

export type Token = {
    source: string,
    type: TokenType
}

export function lex(input: string): Token[] {
    let source = Array.from(input);
    const tokens: Token[] = [];

    while (input.length > 0) {
        const accumulator = [];
        let token: Token | null = null;

        for (const i of source) {
            accumulator.push(i);
            for (const [matcherName, matcher] of Object.entries(matchers))
                if (matcher(accumulator.join('')))
                    token = {source: accumulator.join(''), type: Number(matcherName)}
        }

        if (accumulator.length > 0)
            if (token) {
                tokens.push(token);
                source = source.slice(token.source.length);
            } else
                throw `invalid syntax '${accumulator.join('')}'`;
            else
                return tokens;
    }

    return tokens;
}

export default function renderIcon(src: string): string {
    console.log(lex(src));
    return '';
}