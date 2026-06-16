
const ISSN_REGEX = /^(?<digits4>[0-9]{4})-?(?<digits3>[0-9]{3})(?<check>[0-9xX])$/;
const CHECK_DIGIT_MAP = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'X'] as const;

export interface ISSN {
    source: string;
    issn: string;
    checkDigit: string;
    isValid: boolean;
    isIssn: true;
}

function calcISSNCheckDigit(digits: string) {
    const result = digits.split('')
        .reduce((a, v, i) => a + ((+v) * (8-i)), 0) % 11;

    return CHECK_DIGIT_MAP[result === 0 ? 0 : 11 - result];
}

export function parseISSN(issn: string): ISSN | null {
    const match = issn.match(ISSN_REGEX);
    if (!match?.groups) {
        return null;
    }

    const { digits4, digits3, check } = match.groups;

    const expCheck = calcISSNCheckDigit(digits4 + digits3);
    if (expCheck !== check.toUpperCase()) {
        return null;
    }

    return {
        source: issn,
        issn: `${digits4}-${digits3}${expCheck}`,
        checkDigit: expCheck,
        isValid: true,
        isIssn: true
    };
}

export function formatISSN(issn: string) {
    return parseISSN(issn)?.issn ?? '';
}

export function isValidISSN(issn: string) {
    return parseISSN(issn)?.isValid ?? false;
}