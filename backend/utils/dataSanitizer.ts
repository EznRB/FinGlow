export function sanitizeFinancialData(data: any[]): any[] {
    return data.map(row => {
        const sanitized = { ...row };
        
        const sensitivePatterns = [
            /cpf/i,
            /nome/i,
            /rg/i,
            /cnpj/i,
            /titular/i,
            /beneficiário/i,
            /pagador/i,
            /account.*holder/i,
            /account.*name/i,
            /beneficiary/i
        ];
        
        Object.keys(sanitized).forEach(key => {
            const isSensitive = sensitivePatterns.some(pattern => pattern.test(key));
            
            if (isSensitive) {
                if (typeof sanitized[key] === 'string') {
                    sanitized[key] = sanitizePersonalName(sanitized[key]);
                } else {
                    sanitized[key] = '[REDACTED]';
                }
            }
        });
        
        return sanitized;
    });
}

function sanitizePersonalName(text: string): string {
    if (!text || typeof text !== 'string') return '[REDACTED]';
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailPattern.test(text)) {
        const [username] = text.split('@');
        if (username.length > 2) {
            const masked = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
            return masked + '@[REDACTED]';
        }
        return text;
    }
    
    const nameWords = text.split(' ');
    if (nameWords.length > 1) {
        return nameWords.map(word => {
            if (word.length > 2) {
                return word.charAt(0) + '*'.repeat(word.length - 1);
            }
            return word;
        }).join(' ');
    }
    
    return '[REDACTED]';
}

export function validateCSVStructure(data: any[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!Array.isArray(data) || data.length === 0) {
        return { valid: false, errors: ['No data provided or empty CSV'] };
    }
    
    const requiredFields = ['date', 'amount', 'description'];
    const firstRow = data[0];
    
    requiredFields.forEach(field => {
        if (!(field in firstRow)) {
            errors.push(`Missing required field: ${field}`);
        }
    });
    
    data.forEach((row, index) => {
        if (!row.amount || isNaN(parseFloat(row.amount))) {
            errors.push(`Invalid amount in row ${index + 1}`);
        }
    });
    
    return { valid: errors.length === 0, errors };
}