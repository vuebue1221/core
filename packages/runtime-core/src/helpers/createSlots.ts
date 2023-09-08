import { isArray } from '@vue/shared'
import { type VNode } from '../vnode'

// #6651 res can be undefined in SSR in string push mode
type SSRSlot = (...args: any[]) => VNode[] | undefined

interface CompiledSlotDescriptor {
  name: string
  fn: SSRSlot
  key?: string
}

/**
 * Compiler runtime helper for creating dynamic slots object
 * @private
 */
export function createSlots(
  slots: Record<string, SSRSlot>,
  dynamicSlots: (
    | CompiledSlotDescriptor
    | CompiledSlotDescriptor[]
    | undefined
  )[],
): Record<string, SSRSlot> {
  for (let i = 0; i < dynamicSlots.length; i++) {
    const slot = dynamicSlots[i]
    // array of dynamic slot generated by <template v-for="..." #[...]>
    if (isArray(slot)) {
      for (let j = 0; j < slot.length; j++) {
        slots[slot[j].name] = slot[j].fn
      }
    } else if (slot) {
      // conditional single slot generated by <template v-if="..." #foo>
      slots[slot.name] = slot.key
        ? (...args: any[]) => {
            const res = slot.fn(...args)
            // attach branch key so each conditional branch is considered a
            // different fragment
            if (res) (res as any).key = slot.key
            return res
          }
        : slot.fn
    }
  }
  return slots
}
