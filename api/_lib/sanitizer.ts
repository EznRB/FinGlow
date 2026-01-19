// ============================================================================
// Data Sanitization Utilities
// Removes sensitive personal information before sending to AI
// ============================================================================

// Patterns for sensitive field names
const SENSITIVE_FIELD_PATTERNS = [
    /cpf/i,
    /cnpj/i,
    /rg\b/i,
    /nome/i,
    /name/i,
    /titular/i,
    /benefici[aá]rio/i,
    /pagador/i,
    /account.*holder/i,
    /beneficiary/i,
    /pix/i,
    /chave/i,
    /phone/i,
    /telefone/i,
    /celular/i,
    /endereco/i,
    /address/i,
    /email/i,
    /conta/i,
    /agencia/i,
    /agency/i,
    /branch/i,
];

// Regex patterns for sensitive data in text
const CPF_PATTERN = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g;
const CNPJ_PATTERN = /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g;
const EMAIL_PATTERN = /[\w.-]+@[\w.-]+\.\w+/g;
const PHONE_PATTERN = /\(?\d{2}\)?[\s.-]?\d{4,5}[-.]?\d{4}/g;
const PIX_KEY_PATTERN = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi;

/**
 * Sanitizes financial data by removing personal information
 */
export function sanitizeFinancialData(data: any[]): any[] {
    return data.map(row => {
        const sanitized = { ...row };

        Object.keys(sanitized).forEach(key => {
            const isSensitiveField = SENSITIVE_FIELD_PATTERNS.some(pattern => pattern.test(key));

            if (isSensitiveField) {
                if (typeof sanitized[key] === 'string') {
                    sanitized[key] = maskSensitiveText(sanitized[key]);
                } else {
                    sanitized[key] = '[REDACTED]';
                }
            } else if (typeof sanitized[key] === 'string') {
                // Also sanitize sensitive data that might appear in other fields
                sanitized[key] = sanitizeTextContent(sanitized[key]);
            }
        });

        return sanitized;
    });
}

/**
 * Masks sensitive text (names, emails, etc.)
 */
function maskSensitiveText(text: string): string {
    if (!text || typeof text !== 'string') return '[REDACTED]';

    // Check if it's an email
    if (EMAIL_PATTERN.test(text)) {
        const [username] = text.split('@');
        if (username.length > 2) {
            return username.charAt(0) + '*'.repeat(Math.min(username.length - 2, 5)) + '@***';
        }
        return '***@***';
    }

    // Check if it's a name (multiple words)
    const words = text.trim().split(/\s+/);
    if (words.length > 1) {
        return words.map(word => {
            if (word.length > 2) {
                return word.charAt(0) + '*'.repeat(Math.min(word.length - 1, 5));
            }
            return '**';
        }).join(' ');
    }

    // Single word - just mask it
    if (text.length > 2) {
        return text.charAt(0) + '*'.repeat(Math.min(text.length - 1, 8));
    }

    return '[REDACTED]';
}

/**
 * Sanitizes text content by masking embedded sensitive data
 */
function sanitizeTextContent(text: string): string {
    if (!text || typeof text !== 'string') return text;

    let sanitized = text;

    // Mask CPFs
    sanitized = sanitized.replace(CPF_PATTERN, '***.***.***-**');

    // Mask CNPJs
    sanitized = sanitized.replace(CNPJ_PATTERN, '**.***.***/****-**');

    // Mask emails
    sanitized = sanitized.replace(EMAIL_PATTERN, '[EMAIL]');

    // Mask phone numbers
    sanitized = sanitized.replace(PHONE_PATTERN, '[PHONE]');

    // Mask PIX keys (UUIDs)
    sanitized = sanitized.replace(PIX_KEY_PATTERN, '[PIX_KEY]');

    return sanitized;
}

/**
 * Validates CSV structure for required fields
 */
export function validateCSVStructure(data: any[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(data) || data.length === 0) {
        return { valid: false, errors: ['No data provided or empty CSV'] };
    }

    // Check for minimum required fields
    const firstRow = data[0];
    const requiredFields = ['date', 'amount', 'description'];
    const fieldAliases: Record<string, string[]> = {
        date: ['date', 'data', 'dt', 'datetime', 'date_time'],
        amount: ['amount', 'valor', 'value', 'quantia', 'saldo', 'total'],
        description: ['description', 'descricao', 'desc', 'memo', 'nome', 'estabelecimento', 'merchant'],
    };

    const foundFields: Record<string, string> = {};

    requiredFields.forEach(field => {
        const aliases = fieldAliases[field] || [field];
        const matchingKey = Object.keys(firstRow).find(key =>
            aliases.some(alias => key.toLowerCase().includes(alias))
        );

        if (matchingKey) {
            foundFields[field] = matchingKey;
        } else {
            errors.push(`Missing required field: ${field}`);
        }
    });

    // Validate amount values
    if (foundFields.amount) {
        data.forEach((row, index) => {
            const amount = row[foundFields.amount];
            if (amount === undefined || amount === null || (typeof amount !== 'number' && isNaN(parseFloat(amount)))) {
                errors.push(`Invalid amount in row ${index + 1}`);
            }
        });
    }

    // Limit number of rows
    if (data.length > 10000) {
        errors.push('Too many rows. Maximum allowed is 10,000 transactions.');
    }

    return {
        valid: errors.length === 0,
        errors: errors.slice(0, 10) // Limit error messages
    };
}

/**
 * Normalizes CSV data to standard format
 */
export function normalizeCSVData(data: any[]): any[] {
    const firstRow = data[0];

    // Find field mappings
    const dateKey = Object.keys(firstRow).find(k =>
        ['date', 'data', 'dt', 'datetime'].some(a => k.toLowerCase().includes(a))
    );
    const amountKey = Object.keys(firstRow).find(k =>
        ['amount', 'valor', 'value', 'quantia', 'total'].some(a => k.toLowerCase().includes(a))
    );
    const descriptionKey = Object.keys(firstRow).find(k =>
        ['description', 'descricao', 'desc', 'memo', 'estabelecimento', 'merchant'].some(a => k.toLowerCase().includes(a))
    );
    const categoryKey = Object.keys(firstRow).find(k =>
        ['category', 'categoria', 'tipo', 'type'].some(a => k.toLowerCase().includes(a))
    );

    return data.map(row => ({
        date: dateKey ? row[dateKey] : null,
        amount: amountKey ? parseFloat(row[amountKey]) || 0 : 0,
        description: descriptionKey ? String(row[descriptionKey] || '') : '',
        category: categoryKey ? row[categoryKey] : undefined,
        ...row,
    }));
}
