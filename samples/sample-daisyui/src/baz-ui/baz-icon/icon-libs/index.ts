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

// Categorized icon library for dynamic rendering
export interface IconCategory {
  name: string
  title: string
  description: string
  icons: Record<string, string>
}

export const iconCategories: IconCategory[] = [
  {
    name: 'arrows',
    title: 'Arrows & Navigation',
    description: 'Directional arrows and navigation icons',
    icons: arrowIcons
  },
  {
    name: 'files',
    title: 'Files & Documents',
    description: 'File types and document related icons',
    icons: fileIcons
  },
  {
    name: 'system',
    title: 'System & UI',
    description: 'System controls and user interface icons',
    icons: systemIcons
  },
  {
    name: 'media',
    title: 'Media & Entertainment',
    description: 'Media player and entertainment icons',
    icons: mediaIcons
  },
  {
    name: 'development',
    title: 'Development & Tools',
    description: 'Developer tools and coding related icons',
    icons: devIcons
  }
]
