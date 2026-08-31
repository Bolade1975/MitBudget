import type { EntryType } from './types'

export interface DefaultCategorySeed {
  type: EntryType
  name: string
}

// A small, understandable default set (per spec). Users can rename, reorder,
// deactivate/reactivate and add their own afterwards.
export const DEFAULT_CATEGORIES: DefaultCategorySeed[] = [
  { type: 'income', name: 'Løn' },
  { type: 'income', name: 'SU' },
  { type: 'income', name: 'Bidrag hjemmefra' },
  { type: 'income', name: 'Feriepenge' },
  { type: 'income', name: 'Anden indtægt' },

  { type: 'expense', name: 'Bolig/betaling hjemme' },
  { type: 'expense', name: 'Telefon' },
  { type: 'expense', name: 'Abonnementer' },
  { type: 'expense', name: 'Forsikring' },
  { type: 'expense', name: 'Transport' },
  { type: 'expense', name: 'Kontingenter' },
  { type: 'expense', name: 'Mad og dagligvarer' },
  { type: 'expense', name: 'Takeaway og restaurant' },
  { type: 'expense', name: 'Tøj og personlig pleje' },
  { type: 'expense', name: 'Fritid og venner' },
  { type: 'expense', name: 'Sport' },
  { type: 'expense', name: 'Gaver' },
  { type: 'expense', name: 'Diverse' },

  { type: 'saving', name: 'Buffer' },
  { type: 'saving', name: 'Ferie eller større køb' },
  { type: 'saving', name: 'Investering' },
  { type: 'saving', name: 'Anden opsparing' },
]
