
const CURRENCIES: Record<string, { ar: { singular: string; dual: string; plural: string; singularAccusative: string; fraction: string; fractionPlural: string }; en: { singular: string; plural: string; fraction: string; fractionPlural: string } }> = {
  SAR: {
    ar: { singular: 'ريال سعودي', dual: 'ريالان سعوديان', plural: 'ريالات سعودية', singularAccusative: 'ريالاً سعودياً', fraction: 'هللة', fractionPlural: 'هللات' },
    en: { singular: 'Saudi Riyal', plural: 'Saudi Riyals', fraction: 'Halala', fractionPlural: 'Halalas' }
  },
  USD: {
    ar: { singular: 'دولار أمريكي', dual: 'دولاران أمريكيان', plural: 'دولارات أمريكية', singularAccusative: 'دولاراً أمريكياً', fraction: 'سنت', fractionPlural: 'سنتات' },
    en: { singular: 'US Dollar', plural: 'US Dollars', fraction: 'Cent', fractionPlural: 'Cents' }
  },
  EGP: {
    ar: { singular: 'جنيه مصري', dual: 'جنيهان مصريان', plural: 'جنيهات مصرية', singularAccusative: 'جنيهاً مصرياً', fraction: 'قرش', fractionPlural: 'قروش' },
    en: { singular: 'Egyptian Pound', plural: 'Egyptian Pounds', fraction: 'Piastre', fractionPlural: 'Piastres' }
  },
  AED: {
    ar: { singular: 'درهم إماراتي', dual: 'درهمان إماراتيان', plural: 'دراهم إماراتية', singularAccusative: 'درهماً إماراتياً', fraction: 'فلس', fractionPlural: 'فلسات' },
    en: { singular: 'UAE Dirham', plural: 'UAE Dirhams', fraction: 'Fils', fractionPlural: 'Fils' }
  },
  JOD: {
    ar: { singular: 'دينار أردني', dual: 'ديناران أردنيان', plural: 'دنانير أردنية', singularAccusative: 'ديناراً أردنياً', fraction: 'قرش', fractionPlural: 'قروش' },
    en: { singular: 'Jordanian Dinar', plural: 'Jordanian Dinars', fraction: 'Piastre', fractionPlural: 'Piastres' }
  },
  KWD: {
    ar: { singular: 'دينار كويتي', dual: 'ديناران كويتيان', plural: 'دنانير كويتية', singularAccusative: 'ديناراً كويتياً', fraction: 'فلس', fractionPlural: 'فلسات' },
    en: { singular: 'Kuwaiti Dinar', plural: 'Kuwaiti Dinars', fraction: 'Fils', fractionPlural: 'Fils' }
  },
  QAR: {
    ar: { singular: 'ريال قطري', dual: 'ريالان قطريان', plural: 'ريالات قطرية', singularAccusative: 'ريالاً قطرياً', fraction: 'درهم', fractionPlural: 'دراهم' },
    en: { singular: 'Qatari Riyal', plural: 'Qatari Riyals', fraction: 'Dirham', fractionPlural: 'Dirhams' }
  },
  EUR: {
    ar: { singular: 'يورو', dual: 'يورو', plural: 'يورو', singularAccusative: 'يورو', fraction: 'سنت', fractionPlural: 'سنتات' },
    en: { singular: 'Euro', plural: 'Euros', fraction: 'Cent', fractionPlural: 'Cents' }
  },
  GBP: {
    ar: { singular: 'جنيه إسترليني', dual: 'جنيهان إسترلينيان', plural: 'جنيهات إسترلينية', singularAccusative: 'جنيهاً إسترلينياً', fraction: 'بنس', fractionPlural: 'بنسات' },
    en: { singular: 'Pound Sterling', plural: 'Pounds Sterling', fraction: 'Penny', fractionPlural: 'Pence' }
  }
};

const ARABIC_ONES = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
const ARABIC_TENS = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const ARABIC_TEENS = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
const ARABIC_HUNDREDS = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
const ARABIC_THOUSANDS = ['', 'ألف', 'ألفان', 'آلاف', 'ألفاً'];
const ARABIC_MILLIONS = ['', 'مليون', 'مليونان', 'ملايين', 'مليوناً'];

function convertArabic(num: number): string {
    if (num === 0) return '';
    if (num < 10) return ARABIC_ONES[num];
    if (num < 20) return ARABIC_TEENS[num - 10];
    if (num < 100) {
        const one = num % 10;
        const ten = Math.floor(num / 10);
        return one === 0 ? ARABIC_TENS[ten] : ARABIC_ONES[one] + ' و ' + ARABIC_TENS[ten];
    }
    if (num < 1000) {
        const hundred = Math.floor(num / 100);
        const rest = num % 100;
        const hStr = ARABIC_HUNDREDS[hundred];
        return rest === 0 ? hStr : hStr + ' و ' + convertArabic(rest);
    }
    if (num < 1000000) {
        const thousand = Math.floor(num / 1000);
        const rest = num % 1000;
        let tStr = '';
        if (thousand === 1) tStr = 'ألف';
        else if (thousand === 2) tStr = 'ألفان';
        else if (thousand >= 3 && thousand <= 10) tStr = ARABIC_ONES[thousand] + ' آلاف';
        else tStr = convertArabic(thousand) + ' ألفاً';
        
        return rest === 0 ? tStr : tStr + ' و ' + convertArabic(rest);
    }
    if (num < 1000000000) {
         const million = Math.floor(num / 1000000);
         const rest = num % 1000000;
         let mStr = '';
         if (million === 1) mStr = 'مليون';
         else if (million === 2) mStr = 'مليونان';
         else if (million >= 3 && million <= 10) mStr = ARABIC_ONES[million] + ' ملايين';
         else mStr = convertArabic(million) + ' مليوناً';
         
         return rest === 0 ? mStr : mStr + ' و ' + convertArabic(rest);
    }
    return num.toString();
}

function getArabicCurrencyName(count: number, info: { singular: string; dual: string; plural: string; singularAccusative: string }) {
    if (count === 1) return info.singular;
    if (count === 2) return info.dual;
    if (count >= 3 && count <= 10) return info.plural;
    return info.singularAccusative; // Simply using accusative for >10 for flow, or singular for business
}

export function numberToWords(num: number, lang: 'ar' | 'en', currencyCode: string): string {
    const code = currencyCode.toUpperCase().trim();
    const cur = CURRENCIES[code] || {
        ar: { singular: code, dual: code, plural: code, singularAccusative: code, fraction: 'H/C', fractionPlural: 'H/C' },
        en: { singular: code, plural: code, fraction: 'Sub', fractionPlural: 'Sub' }
    };

    const whole = Math.floor(num);
    const fraction = Math.round((num - whole) * 100);

    if (lang === 'en') {
        const wholeStr = whole.toLocaleString('en-US'); // Simplified EN
        const curName = whole === 1 ? cur.en.singular : cur.en.plural;
        let text = `${wholeStr} ${curName}`;
        if (fraction > 0) {
             const fracName = fraction === 1 ? cur.en.fraction : cur.en.fractionPlural;
             text += ` and ${fraction} ${fracName}`;
        }
        return text;
    } else {
        // Arabic
        let text = '';
        
        // Handle Whole Number
        if (whole > 0) {
            // Special handling for 1 and 2 to put currency name directly
            if (whole === 1) text = cur.ar.singular;
            else if (whole === 2) text = cur.ar.dual;
            else {
                text = convertArabic(whole) + ' ' + getArabicCurrencyName(whole % 100, cur.ar);
            }
        } else {
             text = 'صفر ' + cur.ar.singular;
        }

        // Handle Fraction
        if (fraction > 0) {
            text += ' و ';
             if (fraction === 1) text += cur.ar.fraction;
             else if (fraction === 2) text += cur.ar.fraction + 'ان'; // rough dual for fraction
             else {
                 text += convertArabic(fraction) + ' ' + (fraction >= 3 && fraction <= 10 ? cur.ar.fractionPlural : cur.ar.fraction);
             }
        }

        return text;
    }
}
