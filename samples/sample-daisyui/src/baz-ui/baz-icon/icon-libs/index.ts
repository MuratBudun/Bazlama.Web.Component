// Icon library exports
export { arrowIcons } from './arrows'
export { fileIcons } from './files'
export { systemIcons } from './system'
export { mediaIcons } from './media'
export { devIcons } from './development'

// Combined icon export
import { arrowIcons } from './arrows'
import { fileIcons } from './files'
import { systemIcons } from './system'
import { mediaIcons } from './media'
import { devIcons } from './development'

export const allIcons = {
  ...arrowIcons,
  ...fileIcons,
  ...systemIcons,
  ...mediaIcons,
  ...devIcons,
}
