export type FuelType = 'АИ-92' | 'АИ-95' | 'АИ-98' | 'АИ-100' | 'ДТ' | 'Газ'
export type Refueling = { id: string; createdAt: number; updatedAt: number; date: string; liters: number; pricePerLiter: number; fuelType: FuelType; station: string; mileage?: number; remainingRange?: number }
export type Draft = Omit<Refueling, 'id' | 'createdAt' | 'updatedAt'>
export type Station = { id: string; name: string }
export const fuels: FuelType[] = ['АИ-92', 'АИ-95', 'АИ-98', 'АИ-100', 'ДТ', 'Газ']
export const amount = (item: Pick<Refueling, 'liters' | 'pricePerLiter'>) => item.liters * item.pricePerLiter
export const newDraft = (): Draft => ({ date: new Date().toISOString().slice(0, 10), liters: 0, pricePerLiter: 0, fuelType: 'АИ-95', station: '', mileage: undefined, remainingRange: undefined })
