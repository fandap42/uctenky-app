/**
 * Centralized error and success messages for the application
 * Used for internationalization readiness and consistency
 */

export const MESSAGES = {
  AUTH: {
    UNAUTHORIZED: "Nepřihlášený uživatel",
    FORBIDDEN: "Nemáte oprávnění k této akci",
    ADMIN_ONLY: "Oprávnění pouze pro administrátora",
    LOGIN_REQUIRED: "Pro tuto akci je vyžadováno přihlášení",
  },
  
  UPLOAD: {
    NO_FILE: "Nebyl nahrán žádný soubor",
    REQUIRED_FIELDS: "Vyplňte všechna povinná pole (soubor, částka, datum)",
    INVALID_AMOUNT: "Částka musí být platné kladné číslo",
    FILE_TOO_LARGE: "Soubor je příliš velký. Maximum je 20 MB.",
    INVALID_TYPE: "Nahrajte prosím obrázek",
    INVALID_EXTENSION: "Neplatný typ souboru. Povolené formáty: JPG, PNG, GIF, WebP, HEIC, PDF",
    INVALID_CONTENT: "Obsah souboru neodpovídá typu obrázku",
    UPLOAD_FAILED: "Nahrání se nezdařilo",
    MINIO_ERROR: "Nahrání se nezdařilo. Zkontrolujte, zda je MinIO spuštěno.",
    SUCCESS: "Účtenka byla úspěšně nahrána",
    HEIC_CONVERTING: "Konvertuji HEIC obrázek...",
    HEIC_SUCCESS: "HEIC konvertován na JPEG",
    HEIC_ERROR: "Nepodařilo se konvertovat HEIC obrázek",
    SELECT_FILE: "Vyberte prosím soubor",
    INVALID_IMAGE: "Nahrajte prosím obrázek účtenky",
  },
  
  TRANSACTION: {
    NOT_FOUND: "Žádost nebyla nalezena",
    TRANSACTION_NOT_FOUND: "Transakce nebyla nalezena",
    MISSING_ID: "Chybí ID transakce",
    MISSING_FIELDS: "Vyplňte všechna povinná pole",
    MISSING_SECTION: "Vyberte sekci",
    CREATE_FAILED: "Nepodařilo se vytvořit žádost",
    UPDATE_FAILED: "Nepodařilo se aktualizovat žádost",
    DELETE_FAILED: "Nepodařilo se smazat žádost",
    DELETE_FORBIDDEN: "Nemáte oprávnění k smazání této žádosti v jejím aktuálním stavu.",
    RECEIPT_UPLOAD_FAILED: "Nepodařilo se nahrát účtenku",
    RECEIPT_REMOVE_FAILED: "Nepodařilo se odstranit účtenku",
    STATUS_UPDATE_FAILED: "Nepodařilo se aktualizovat stav",
    ADMIN_APPROVAL_REQUIRED: "Nemáte oprávnění k této akci. Pouze administrátor může schvalovat žádosti.",
    PAID_STATUS_FAILED: "Nepodařilo se aktualizovat stav proplacení",
    FILED_STATUS_FAILED: "Nepodařilo se aktualizovat stav založení",
    EXPENSE_TYPE_FAILED: "Nepodařilo se aktualizovat typ výdaje",
  },
  
  USER: {
    DELETE_FAILED: "Nepodařilo se smazat uživatele. Uživatel pravděpodobně má existující žádosti.",
    CANNOT_DELETE_SELF: "Nelze smazat vlastní účet",
  },
  
  RATE_LIMIT: {
    TOO_MANY_REQUESTS: "Příliš mnoho požadavků. Zkuste to prosím později.",
  },
  
  SECURITY: {
    BOT_DETECTED: "Detekována podezřelá aktivita botů.",
  },

  BANK_ACCOUNT: {
    SAVE_FAILED: "Nepodařilo se uložit bankovní údaje",
    LOAD_FAILED: "Nepodařilo se načíst bankovní údaje",
    NO_ACCOUNT: "Uživatel nemá zadané bankovní údaje",
    SAVED: "Bankovní údaje byly uloženy",
  },
} as const

// Type helper for accessing messages
export type MessageKey = keyof typeof MESSAGES
export type AuthMessage = keyof typeof MESSAGES.AUTH
export type UploadMessage = keyof typeof MESSAGES.UPLOAD
export type TransactionMessage = keyof typeof MESSAGES.TRANSACTION
