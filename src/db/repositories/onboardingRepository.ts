import type { MitBudgetDB } from '../schema'
import { seedDefaultCategories, listCategories } from './categoryRepository'
import { createRootYear } from './yearRepository'
import { createEntry } from './entryRepository'
import { updateSettings } from './settingsRepository'
import type { BudgetYear, Category } from '../../domain/types'
import { withSaveErrorHandling } from './errors'

export interface OnboardingAnswers {
  year: number
  openingBalance: number
  openingBalanceDate: string
  monthlyIncome: number | null
  housingPayment: number | null
  transportCost: number | null
  subscriptions: number | null
  monthlySaving: number | null
}

function findCategory(categories: Category[], name: string): Category | undefined {
  return categories.find((c) => c.name === name)
}

/** Builds the first budget year and a small starter budget from the setup answers. */
export async function completeOnboarding(
  db: MitBudgetDB,
  answers: OnboardingAnswers,
): Promise<BudgetYear> {
  return withSaveErrorHandling(async () => {
    await seedDefaultCategories(db)
    const categories = await listCategories(db)

    const year = await createRootYear(
      db,
      answers.year,
      answers.openingBalance,
      answers.openingBalanceDate,
    )

    const monthly = { startMonth: 1, endMonth: 12, months: [] as number[] }

    async function addIfPositive(
      amount: number | null,
      type: 'income' | 'expense' | 'saving',
      categoryName: string,
      entryName: string,
    ) {
      if (!amount || amount <= 0) return
      const category = findCategory(categories, categoryName)
      if (!category) return
      await createEntry(db, {
        yearId: year.id,
        type,
        categoryId: category.id,
        name: entryName,
        amount,
        frequency: 'monthly',
        ...monthly,
        note: '',
        active: true,
      })
    }

    await addIfPositive(answers.monthlyIncome, 'income', 'Løn', 'Løn')
    await addIfPositive(
      answers.housingPayment,
      'expense',
      'Bolig/betaling hjemme',
      'Bolig/betaling hjemme',
    )
    await addIfPositive(answers.transportCost, 'expense', 'Transport', 'Transport')
    await addIfPositive(answers.subscriptions, 'expense', 'Abonnementer', 'Abonnementer')
    await addIfPositive(answers.monthlySaving, 'saving', 'Anden opsparing', 'Opsparing')

    await updateSettings(db, { onboardingComplete: true, activeYearId: year.id })
    return year
  })
}
