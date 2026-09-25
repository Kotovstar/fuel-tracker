import { describe, expect, it } from 'vitest'
import { comparisons, periodTotals } from './calculations'
import { Refueling } from './domain'
const record=(id:string,mileage:number,liters=20):Refueling=>({id,createdAt:Number(id),updatedAt:Number(id),date:`2026-01-0${id}`,liters,pricePerLiter:50,fuelType:'АИ-95',station:'АЗС',mileage})
describe('fuel calculations',()=>{it('calculates consumption from the later refueling',()=>{expect(comparisons([record('1',100),record('2',300)]).get('2')?.consumption).toBe(10)});it('uses distance-weighted consumption',()=>{expect(periodTotals([record('1',0),record('2',100,10),record('3',300,30)]).consumption).toBeCloseTo(13.33,1)})})
