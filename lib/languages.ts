export interface Language {
  code: string
  name: string
  nativeName: string
  direction: "ltr" | "rtl"
}

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English", direction: "ltr" },
  { code: "bs", name: "Bosnian", nativeName: "Bosanski", direction: "ltr" },
  { code: "hr", name: "Croatian", nativeName: "Hrvatski", direction: "ltr" },
  { code: "sr", name: "Serbian", nativeName: "Srpski", direction: "ltr" },
  { code: "de", name: "German", nativeName: "Deutsch", direction: "ltr" },
  { code: "fr", name: "French", nativeName: "Fran\u00e7ais", direction: "ltr" },
  { code: "es", name: "Spanish", nativeName: "Espa\u00f1ol", direction: "ltr" },
  { code: "it", name: "Italian", nativeName: "Italiano", direction: "ltr" },
  { code: "pt", name: "Portuguese", nativeName: "Portugu\u00eas", direction: "ltr" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", direction: "ltr" },
  { code: "pl", name: "Polish", nativeName: "Polski", direction: "ltr" },
  { code: "tr", name: "Turkish", nativeName: "T\u00fcrk\u00e7e", direction: "ltr" },
  { code: "ru", name: "Russian", nativeName: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439", direction: "ltr" },
  { code: "ja", name: "Japanese", nativeName: "\u65e5\u672c\u8a9e", direction: "ltr" },
  { code: "ko", name: "Korean", nativeName: "\ud55c\uad6d\uc5b4", direction: "ltr" },
  { code: "zh", name: "Chinese", nativeName: "\u4e2d\u6587", direction: "ltr" },
  { code: "ar", name: "Arabic", nativeName: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629", direction: "rtl" },
  { code: "hi", name: "Hindi", nativeName: "\u0939\u093f\u0928\u094d\u0926\u0940", direction: "ltr" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", direction: "ltr" },
  { code: "no", name: "Norwegian", nativeName: "Norsk", direction: "ltr" },
  { code: "da", name: "Danish", nativeName: "Dansk", direction: "ltr" },
  { code: "fi", name: "Finnish", nativeName: "Suomi", direction: "ltr" },
  { code: "el", name: "Greek", nativeName: "\u0395\u03bb\u03bb\u03b7\u03bd\u03b9\u03ba\u03ac", direction: "ltr" },
  { code: "cs", name: "Czech", nativeName: "\u010ce\u0161tina", direction: "ltr" },
  { code: "ro", name: "Romanian", nativeName: "Rom\u00e2n\u0103", direction: "ltr" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar", direction: "ltr" },
  { code: "uk", name: "Ukrainian", nativeName: "\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430", direction: "ltr" },
  { code: "th", name: "Thai", nativeName: "\u0e44\u0e17\u0e22", direction: "ltr" },
  { code: "vi", name: "Vietnamese", nativeName: "Ti\u1ebfng Vi\u1ec7t", direction: "ltr" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", direction: "ltr" },
]

export function getLanguageByCode(code: string): Language | undefined {
  return LANGUAGES.find((l) => l.code === code)
}

export function getLanguageName(code: string): string {
  return getLanguageByCode(code)?.name ?? code
}

export function getLanguageNativeName(code: string): string {
  return getLanguageByCode(code)?.nativeName ?? code
}
