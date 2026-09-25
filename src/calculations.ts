import { amount, Refueling } from './domain'

export type Comparison = { distance?: number; consumption?: number; previousConsumption?: number; priceDelta?: number; amountDelta?: number; consumptionDelta?: number }
export const chronological = (items: Refueling[]) => [...items].sort((a,b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt || a.id.localeCompare(b.id))
export function comparisons(items: Refueling[]) {
  const result = new Map<string, Comparison>(); const list = chronological(items)
  for (let index = 1; index < list.length; index++) {
    const previous = list[index - 1], current = list[index]
    const rawDistance = current.mileage !== undefined && previous.mileage !== undefined ? current.mileage - previous.mileage : undefined
    const distance = rawDistance !== undefined && rawDistance > 0 ? rawDistance : undefined
    const consumption = distance ? current.liters / distance * 100 : undefined
    const before = index > 1 ? result.get(previous.id)?.consumption : undefined
    result.set(current.id, { distance, consumption, previousConsumption: before, priceDelta: current.pricePerLiter - previous.pricePerLiter, amountDelta: amount(current) - amount(previous), consumptionDelta: consumption !== undefined && before !== undefined ? consumption - before : undefined })
  }
  return result
}
export function periodTotals(items: Refueling[]) {
  const totalAmount = items.reduce((sum, item) => sum + amount(item), 0)
  const totalLiters = items.reduce((sum, item) => sum + item.liters, 0)
  const intervals = [...comparisons(items).values()].filter((item): item is Required<Pick<Comparison,'distance'|'consumption'>> => item.distance !== undefined && item.consumption !== undefined)
  const distance = intervals.reduce((sum, item) => sum + item.distance, 0)
  const litersForDistance = intervals.reduce((sum, item) => sum + item.consumption * item.distance / 100, 0)
  return { totalAmount, totalLiters, averagePrice: totalLiters ? totalAmount / totalLiters : undefined, consumption: distance ? litersForDistance / distance * 100 : undefined, count: items.length }
}
export function validate(item: Pick<Refueling,'date'|'liters'|'pricePerLiter'|'mileage'|'remainingRange'>, previousMileage?: number) {
  if (!item.date) return 'Укажите дату заправки.'
  if (!Number.isFinite(item.liters) || item.liters <= 0) return 'Количество литров должно быть больше нуля.'
  if (!Number.isFinite(item.pricePerLiter) || item.pricePerLiter <= 0) return 'Цена за литр должна быть больше нуля.'
  if (item.mileage !== undefined && (!Number.isFinite(item.mileage) || item.mileage < 0)) return 'Пробег не может быть отрицательным.'
  if (item.remainingRange !== undefined && (!Number.isFinite(item.remainingRange) || item.remainingRange < 0)) return 'Остаток хода не может быть отрицательным.'
  if (item.mileage !== undefined && previousMileage !== undefined && item.mileage < previousMileage) return 'Пробег не может быть меньше предыдущего показания.'
  return undefined
}
