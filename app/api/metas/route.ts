import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function GET() {
    try {
        const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        const serviceAccountAuth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, serviceAccountAuth);
        await doc.loadInfo();

        // LÊ A SEGUNDA ABA DA PLANILHA (Índice 1 = Metas)
        const sheet = doc.sheetsByIndex[2];
        const rows = await sheet.getRows();

        const metas = rows.map((row) => {
            // Formata o dinheiro do 'Valor Alvo' (tira R$ e formata os pontos)
            const rawTotal = row.get('Valor Alvo') || '0';
            const totalString = String(rawTotal).replace(/[R$\s\.]/g, '').replace(',', '.');

            return {
                nome: row.get('Objetivo') || '',
                total: parseFloat(totalString) || 0,
                foto: row.get('Foto') || '',
            };
        });

        return NextResponse.json(metas);

    } catch (error) {
        console.error("Erro ao ler a aba de metas:", error);
        return NextResponse.json({ error: 'Falha ao buscar metas da planilha' }, { status: 500 });
    }
}