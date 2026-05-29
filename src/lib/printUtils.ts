
export const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const formatCNPJ = (cnpj: string) => {
    if (!cnpj) return '---';
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
};

export const numberToWords = (value: number) => {
    const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
    const dezena_10 = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
    const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
    const centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

    const formatPart = (n: number) => {
        if (n === 0) return "";
        if (n === 100) return "cem";

        let res = "";
        const c = Math.floor(n / 100);
        const d = Math.floor((n % 100) / 10);
        const u = n % 10;

        if (c > 0) res += centenas[c];
        
        if (d === 1) {
            if (res) res += " e ";
            res += dezena_10[u];
            return res;
        }

        if (d > 1) {
            if (res) res += " e ";
            res += dezenas[d];
        }

        if (u > 0) {
            if (res) res += " e ";
            res += unidades[u];
        }

        return res;
    };

    if (value === 0) return "zero reais";

    const integerPart = Math.floor(value);
    const decimalPart = Math.round((value - integerPart) * 100);

    let result = "";

    if (integerPart > 0) {
        // Handling thousands
        const getThousands = (val: number) => {
            if (val < 1000) return formatPart(val);
            const mil = Math.floor(val / 1000);
            const rest = val % 1000;
            let str = (mil === 1 ? "mil" : formatPart(mil) + " mil");
            if (rest > 0) {
                if (rest < 100 || rest % 100 === 0) str += " e ";
                else str += " ";
                str += formatPart(rest);
            }
            return str;
        };

        if (integerPart >= 1000000) {
            const milhao = Math.floor(integerPart / 1000000);
            const restM = integerPart % 1000000;
            result += (milhao === 1 ? "um milhão" : formatPart(milhao) + " milhões");
            if (restM > 0) {
                if (restM < 1000) result += " e ";
                else result += ", ";
                result += getThousands(restM);
            }
        } else {
            result = getThousands(integerPart);
        }
        result += integerPart === 1 ? " real" : " reais";
    }

    if (decimalPart > 0) {
        if (result) result += " e ";
        result += formatPart(decimalPart);
        result += decimalPart === 1 ? " centavo" : " centavos";
    }

    return result.toLowerCase();
};

export const printDocument = (html: string, title?: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(html);
        if (title) {
            printWindow.document.title = title;
        }
        printWindow.document.close();
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 500);
    }
};

const HOLIDAYS = [
    '01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '12-25'
];

export const subtractBusinessDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    let count = 0;
    while (count < days) {
        result.setDate(result.getDate() - 1);
        const dayOfWeek = result.getDay();
        const month = String(result.getMonth() + 1).padStart(2, '0');
        const day = String(result.getDate()).padStart(2, '0');
        const dateString = `${month}-${day}`;

        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !HOLIDAYS.includes(dateString)) {
            count++;
        }
    }
    return result;
};

export const getSchoolDayBefore = (date: Date, daysToSubtract: number = 2): Date => {
    return subtractBusinessDays(date, daysToSubtract);
};

export const getSchoolInitials = (schoolName: string = '') => {
    if (!schoolName) return '';
    return schoolName
        .split(' ')
        .map(word => word.trim())
        .filter(word => {
            const clean = word.replace(/[^a-zA-Z]/g, '');
            const lower = clean.toLowerCase();
            if (lower === 'de' || lower === 'da' || lower === 'do' || lower === 'e' || lower === 'para') {
                return false;
            }
            return word.length > 0;
        })
        .map(word => word.charAt(0).toUpperCase())
        .join('');
};

export const getContractPrintTitle = (process: any) => {
    let entry = process.financial_entries || process.financial_entry;
    if (Array.isArray(entry)) entry = entry[0];
    const school = entry?.schools || entry?.school;
    const contract = process.contract;

    if (!contract && !entry) return 'CONTRATO';

    const isAditivo = contract?.terms_json?.is_aditivo || entry?.terms_json?.is_aditivo;
    const baseType = isAditivo ? 'ADITIVO' : 'CONTRATO';

    const category = (contract?.category || entry?.category || 'SERVIÇOS').toUpperCase();

    const rawNumber = contract?.contract_number || 'SEM_NUMERO';
    const contractNum = rawNumber.replace(/[\/\\?%*:|"<>. ]/g, '_');

    const startDateStr = contract?.start_date || entry?.date || new Date().toISOString().split('T')[0];
    let dateText = '00.00.0000';
    try {
        const parts = startDateStr.split('-');
        if (parts.length === 3) {
            dateText = `${parts[2]}.${parts[1]}.${parts[0]}`;
        } else {
            const d = new Date(startDateStr);
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            dateText = `${dd}.${mm}.${yyyy}`;
        }
    } catch (e) {
        // Fallback
    }

    const schoolName = school?.name || '';
    const initials = getSchoolInitials(schoolName);

    return `${baseType} - ${category} - ${contractNum} - ${dateText} - ${initials}`;
};

export const numberToWordsPure = (value: number): string => {
    const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
    const dezena_10 = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
    const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
    const centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

    if (value === 0) return "zero";
    if (value === 100) return "cem";

    let res = "";
    const c = Math.floor(value / 100);
    const d = Math.floor((value % 100) / 10);
    const u = value % 10;

    if (c > 0) res += centenas[c];
    
    if (d === 1) {
        if (res) res += " e ";
        res += dezena_10[u];
        return res.toLowerCase();
    }

    if (d > 1) {
        if (res) res += " e ";
        res += dezenas[d];
    }

    if (u > 0) {
        if (res) res += " e ";
        res += unidades[u];
    }

    return res.toLowerCase();
};

