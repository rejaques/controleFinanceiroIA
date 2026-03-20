export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function GET() {
    try {
        // 1. Corrige a quebra de linha da chave privada
        const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        // 2. Configura a Autenticação
        const serviceAccountAuth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        // 3. Conecta no documento
        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, serviceAccountAuth);
        await doc.loadInfo();

        // 4. Seleciona a primeira aba
        const sheet = doc.sheetsByIndex[0];
        const rows = await sheet.getRows();

        // 5. Mapeia e corrige a formatação do dinheiro BR
        const dados = rows.map((row) => {
            const rawValor = row.get('Valor') || '0';
            let valorString = String(rawValor);

            // Remove R$, espaços e pontos de milhar. Troca vírgula por ponto.
            valorString = valorString.replace(/[R$\s\.]/g, '').replace(',', '.');

            const valorFormatado = parseFloat(valorString) || 0;

            return {
                data: row.get('Data') || '',
                tipo: row.get('Tipo') || '',
                descricao: row.get('Descrição') || row.get('Descricao') || '',
                categoria: row.get('Categoria') || '',
                valor: valorFormatado,
                formaPagamento: row.get('Forma de Pagamento') || '',
                objetivo: row.get('Objetivo') || '',
            };
        });

        return NextResponse.json(dados);

    } catch (error) {
        console.error("Erro ao ler a planilha:", error);
        return NextResponse.json({ error: 'Falha ao buscar dados da planilha' }, { status: 500 });
    }
}