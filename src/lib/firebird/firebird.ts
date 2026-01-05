// src/lib/firebird/firebird.ts
import Firebird from 'node-firebird';
import { corrigirTextoCorrompido } from '../../formatters/formatar-texto-corrompido';

export const firebirdOptions: Firebird.Options = {
    host: process.env.FIREBIRD_HOST,
    port: Number(process.env.FIREBIRD_PORT),
    database: process.env.FIREBIRD_DATABASE,
    user: process.env.FIREBIRD_USER,
    password: process.env.FIREBIRD_PASSWORD,
    lowercase_keys: false,
    pageSize: 4096,
};

// Função para detectar e converter encoding de Buffer para string
function detectAndConvertEncoding(buffer: Buffer): string {
    try {
        // Tenta UTF-8 primeiro
        const utf8Text = buffer.toString('utf8');

        // Verifica se há caracteres de substituição (�) que indicam encoding errado
        if (!utf8Text.includes('�')) {
            return utf8Text;
        }

        // Se falhou, tenta ISO-8859-1 (Latin1)
        const latin1Text = buffer.toString('latin1');
        return latin1Text;
    } catch (error) {
        console.error('Erro ao converter encoding:', error);
        return buffer.toString('utf8'); // Fallback
    }
}

// Função para extrair texto limpo de HTML
function extractTextFromHtml(html: string): string {
    if (!html || !html.trim()) return '';

    // Remove tags HTML comuns
    let text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
        .replace(/<[^>]+>/g, ' ') // Remove todas as tags
        .replace(/&nbsp;/g, ' ') // Substitui &nbsp;
        .replace(/&quot;/g, '"') // Substitui &quot;
        .replace(/&apos;/g, "'") // Substitui &apos;
        .replace(/&lt;/g, '<') // Substitui &lt;
        .replace(/&gt;/g, '>') // Substitui &gt;
        .replace(/&amp;/g, '&') // Substitui &amp;
        .replace(/,\s*,/g, ',') // Remove vírgulas duplicadas
        .replace(/"\s*"/g, '"') // Remove aspas vazias duplicadas
        .replace(/,\s*"/g, ' ') // Remove vírgula antes de aspas
        .replace(/"\s*,/g, ' ') // Remove vírgula depois de aspas
        .replace(/^[,"\s]+|[,"\s]+$/g, '') // Remove vírgulas/aspas do início e fim
        .replace(/\s+/g, ' ') // Normaliza espaços
        .trim();

    return text;
}

// Função para ler BLOBs do Firebird e retornar como string
function readBlob(blobFunction: any, transaction: any): Promise<string | null> {
    return new Promise((resolve) => {
        if (!blobFunction || typeof blobFunction !== 'function') {
            resolve(null);
            return;
        }

        try {
            const chunks: Buffer[] = [];

            blobFunction((err: any, name: string, eventEmitter: any) => {
                if (err) {
                    console.error('Erro ao ler BLOB:', err);
                    resolve(null);
                    return;
                }

                if (!eventEmitter) {
                    console.error('EventEmitter não retornado');
                    resolve(null);
                    return;
                }

                eventEmitter.on('data', (chunk: Buffer) => {
                    chunks.push(chunk);
                });

                eventEmitter.on('end', () => {
                    try {
                        // Concatena todos os chunks em um único Buffer
                        const fullBuffer = Buffer.concat(chunks);

                        // Detecta e converte o encoding correto
                        const text = detectAndConvertEncoding(fullBuffer);

                        // Extrai texto limpo do HTML
                        const cleanText = extractTextFromHtml(text);

                        // Corrige encoding do texto final
                        const correctedText = corrigirTextoCorrompido(cleanText);

                        resolve(correctedText || null);
                    } catch (error) {
                        console.error('Erro ao processar buffer do BLOB:', error);
                        resolve(null);
                    }
                });

                eventEmitter.on('error', (err: any) => {
                    console.error('Erro no stream do BLOB:', err);
                    resolve(null);
                });
            });
        } catch (error) {
            console.error('Erro ao processar BLOB:', error);
            resolve(null);
        }
    });
}

// Função para processar uma linha e ler BLOBs
async function processRow(row: any, transaction: any): Promise<any> {
    const processedRow: any = {};
    const blobPromises: Array<Promise<void>> = [];

    for (const key in row) {
        const value = row[key];
        const valueType = typeof value;

        // Se for uma função (BLOB padrão)
        if (valueType === 'function') {
            const promise = readBlob(value, transaction).then((blobContent) => {
                processedRow[key] = blobContent;
            });
            blobPromises.push(promise);
        }
        // Se for object não-nulo e callable (BLOB como objeto - caso do OBS_OS)
        else if (valueType === 'object' && value !== null && value.call) {
            const promise = readBlob(value, transaction).then((blobContent) => {
                processedRow[key] = blobContent;
            });
            blobPromises.push(promise);
        }
        // Outros tipos (incluindo strings), apenas copia o valor
        else {
            processedRow[key] = value;
        }
    }

    // Aguarda todas as leituras de BLOB terminarem
    await Promise.all(blobPromises);

    return processedRow;
}

// Função para executar consultas SQL
export function queryFirebird<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
        Firebird.attach(firebirdOptions, (err, db) => {
            if (err) return reject(err);

            // Inicia uma transação para ler os BLOBs
            db.transaction(Firebird.ISOLATION_READ_COMMITTED, (err, transaction) => {
                if (err) {
                    db.detach();
                    return reject(err);
                }

                transaction.query(sql, params, async (err, result) => {
                    if (err) {
                        transaction.rollback(() => {
                            db.detach();
                        });
                        return reject(err);
                    }

                    try {
                        // Processa todas as linhas e lê os BLOBs ANTES de fechar
                        const processedResults = await Promise.all(
                            result.map((row: any) => {
                                return processRow(row, transaction);
                            })
                        );
                        // Commit e fecha a conexão
                        transaction.commit((err) => {
                            db.detach();
                            if (err) return reject(err);
                            resolve(processedResults as T[]);
                        });
                    } catch (error) {
                        console.error('[FIREBIRD] Erro ao processar:', error);
                        transaction.rollback(() => {
                            db.detach();
                        });
                        reject(error);
                    }
                });
            });
        });
    });
}

// Função para executar comandos SQL (INSERT, UPDATE, DELETE)
export function executeFirebird(sql: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
        Firebird.attach(firebirdOptions, (err, db) => {
            if (err) return reject(err);

            // Inicia uma transação para executar o comando
            db.transaction(Firebird.ISOLATION_READ_COMMITTED, (err, transaction) => {
                if (err) {
                    db.detach();
                    return reject(err);
                }

                transaction.query(sql, params, (err, result) => {
                    if (err) {
                        transaction.rollback(() => {
                            db.detach();
                        });
                        return reject(err);
                    }

                    // Commit e fecha a conexão
                    transaction.commit((err) => {
                        db.detach();
                        if (err) return reject(err);
                        resolve();
                    });
                });
            });
        });
    });
}
