import React from 'react';

interface CurrencyInputProps {
    value: number;
    onChange: (value: number) => void;
    className?: string;
    placeholder?: string;
    autoFocus?: boolean;
}

/**
 * Professional Brazilian Real currency input.
 * - Uses text mode for full control over formatting
 * - Supports comma as decimal separator (pt-BR)
 * - Supports paste from any source (Excel, PDF, etc.)
 * - Formats display as "1.234,56" while storing raw number
 * - Allows negative values with leading minus
 */
const CurrencyInput: React.FC<CurrencyInputProps> = ({
    value,
    onChange,
    className = '',
    placeholder = '0,00',
    autoFocus = false,
}) => {
    const [displayValue, setDisplayValue] = React.useState('');
    const [isFocused, setIsFocused] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Sync external value → display (only when not focused, to avoid cursor jump)
    React.useEffect(() => {
        if (!isFocused) {
            if (value === 0 || value === null || value === undefined || isNaN(value)) {
                setDisplayValue('');
            } else {
                setDisplayValue(formatForDisplay(value));
            }
        }
    }, [value, isFocused]);

    function formatForDisplay(num: number): string {
        const abs = Math.abs(num);
        const formatted = abs.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return num < 0 ? `-${formatted}` : formatted;
    }

    function parseInput(raw: string): number {
        if (!raw || raw === '-') return 0;

        let cleaned = raw.trim();

        // Detect if the value uses dot as decimal (e.g., "1234.56" or "1,234.56")
        // vs comma as decimal (e.g., "1234,56" or "1.234,56")
        const lastDot = cleaned.lastIndexOf('.');
        const lastComma = cleaned.lastIndexOf(',');

        if (lastDot > lastComma) {
            // Dot is the decimal separator (en-US format): "1,234.56"
            cleaned = cleaned.replace(/[^\d.\-]/g, '');
        } else if (lastComma > lastDot) {
            // Comma is the decimal separator (pt-BR format): "1.234,56"
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
            cleaned = cleaned.replace(/[^\d.\-]/g, '');
        } else {
            // No decimal separator found
            cleaned = cleaned.replace(/[^\d\-]/g, '');
        }

        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }

    function sanitizeTyping(raw: string): string {
        // Allow: digits, comma, dot, minus (at start only)
        let s = raw.replace(/[^\d,.\-]/g, '');

        // Only allow one minus at the start
        const isNegative = s.startsWith('-');
        s = s.replace(/-/g, '');
        if (isNegative) s = '-' + s;

        // Replace dot with comma for consistency (user types "." → shows ",")
        s = s.replace(/\./g, ',');

        // Allow only one comma
        const parts = s.split(',');
        if (parts.length > 2) {
            s = parts[0] + ',' + parts.slice(1).join('');
        }

        // Limit decimal places to 2
        if (parts.length === 2 && parts[1].length > 2) {
            s = parts[0] + ',' + parts[1].slice(0, 2);
        }

        return s;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const sanitized = sanitizeTyping(raw);
        setDisplayValue(sanitized);

        const num = parseInput(sanitized);
        onChange(num);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text');
        const num = parseInput(pasted);

        if (num !== 0 || pasted.trim() === '0' || pasted.trim() === '0,00' || pasted.trim() === '0.00') {
            setDisplayValue(formatForDisplay(num));
            onChange(num);
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
        // On focus, show raw editable value (no thousands separators)
        if (value && value !== 0) {
            const abs = Math.abs(value);
            const raw = abs.toFixed(2).replace('.', ',');
            setDisplayValue(value < 0 ? `-${raw}` : raw);
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
        // On blur, format with thousands separators
        const num = parseInput(displayValue);
        onChange(num);
        if (num === 0) {
            setDisplayValue('');
        } else {
            setDisplayValue(formatForDisplay(num));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Allow: Backspace, Delete, Tab, Escape, Enter, Arrow keys, Home, End
        const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
        if (allowedKeys.includes(e.key)) return;

        // Allow Ctrl/Cmd + A, C, V, X, Z
        if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase())) return;

        // Allow digits, comma, dot, minus
        if (/[\d,.\-]/.test(e.key)) return;

        // Block everything else
        e.preventDefault();
    };

    return (
        <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            autoFocus={autoFocus}
            value={displayValue}
            onChange={handleChange}
            onPaste={handlePaste}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={className}
            placeholder={placeholder}
        />
    );
};

export default CurrencyInput;
