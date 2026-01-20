# Bazlama Icon Library Documentation

## Overview
The Bazlama icon library has been restructured with a categorized architecture for better maintainability and scalability. Icons are now organized into separate category files, each containing related icon sets.

## Architecture

```
src/baz-ui/baz-icon/
├── baz-icon.ts              # Main icon component
├── baz-icon-lib.ts          # Main library file (merges all categories)
└── icon-libs/
    ├── index.ts             # Exports all categories
    ├── arrows.ts            # Navigation & directional icons (18 icons)
    ├── files.ts             # File & folder management icons (16 icons)
    ├── system.ts            # Core UI & system icons (22 icons)
    ├── media.ts             # Media player & capture icons (18 icons)
    └── development.ts       # Development & coding icons (20 icons)
```

## Total Icon Count
- **Legacy Icons**: 51 icons (backward compatibility)
- **New Categorized Icons**: 94 icons
- **Total Available**: 145+ icons

---

## Icon Categories

### 1. Arrows & Navigation (18 icons)
**File**: `icon-libs/arrows.ts`

| Icon Name | Description |
|-----------|-------------|
| `arrowUp` | Up arrow |
| `arrowDown` | Down arrow |
| `arrowLeft` | Left arrow |
| `arrowRight` | Right arrow |
| `arrowUpLeft` | Diagonal arrow up-left |
| `arrowUpRight` | Diagonal arrow up-right |
| `arrowDownLeft` | Diagonal arrow down-left |
| `arrowDownRight` | Diagonal arrow down-right |
| `arrowsMaximize` | Expand/maximize arrows |
| `arrowsMinimize` | Collapse/minimize arrows |
| `chevronUp` | Chevron pointing up |
| `chevronDown` | Chevron pointing down |
| `chevronLeft` | Chevron pointing left |
| `chevronRight` | Chevron pointing right |
| `chevronsUp` | Double chevron up |
| `chevronsDown` | Double chevron down |
| `chevronsLeft` | Double chevron left |
| `chevronsRight` | Double chevron right |

**Usage Example**:
```typescript
<baz-icon icon="arrowUp" size="24"></baz-icon>
<baz-icon icon="chevronDown" size="20" stroke="#333"></baz-icon>
```

---

### 2. Files & Folders (16 icons)
**File**: `icon-libs/files.ts`

| Icon Name | Description |
|-----------|-------------|
| `file` | Generic file |
| `fileText` | Text file |
| `fileCode` | Code file |
| `fileHtml` | HTML file |
| `fileCss` | CSS file |
| `fileJs` | JavaScript file |
| `fileTs` | TypeScript file |
| `fileJson` | JSON file |
| `filePlus` | Add file |
| `fileMinus` | Remove file |
| `fileDownload` | Download file |
| `fileUpload` | Upload file |
| `fileZip` | Archive/ZIP file |
| `folder` | Folder/directory |
| `folderOpen` | Open folder |
| `folderPlus` | Create folder |

**Usage Example**:
```typescript
<baz-icon icon="fileTs" size="24"></baz-icon>
<baz-icon icon="folder" size="20"></baz-icon>
<baz-icon icon="fileDownload" size="22"></baz-icon>
```

---

### 3. System & UI (22 icons)
**File**: `icon-libs/system.ts`

| Icon Name | Description |
|-----------|-------------|
| `settings` | Settings/preferences |
| `search` | Search/find |
| `bell` | Notifications |
| `home` | Home/dashboard |
| `menu` | Menu/hamburger |
| `x` | Close/cancel |
| `plus` | Add/create |
| `minus` | Subtract/remove |
| `check` | Confirm/success |
| `trash` | Delete/remove |
| `edit` | Edit/modify |
| `copy` | Copy/duplicate |
| `cut` | Cut/move |
| `paste` | Paste/insert |
| `refresh` | Reload/refresh |
| `download` | Download |
| `upload` | Upload |
| `share` | Share/export |
| `link` | Link/URL |
| `externalLink` | Open external link |
| `lock` | Locked/secure |
| `lockOpen` | Unlocked/open |

**Usage Example**:
```typescript
<baz-icon icon="settings" size="24"></baz-icon>
<baz-icon icon="bell" size="20"></baz-icon>
<baz-icon icon="trash" size="22" stroke="red"></baz-icon>
```

---

### 4. Media & Player (18 icons)
**File**: `icon-libs/media.ts`

| Icon Name | Description |
|-----------|-------------|
| `playerPlay` | Play media |
| `playerPause` | Pause playback |
| `playerStop` | Stop playback |
| `playerSkipBack` | Skip backward |
| `playerSkipForward` | Skip forward |
| `playerTrackPrev` | Previous track |
| `playerTrackNext` | Next track |
| `playerEject` | Eject media |
| `volume` | Volume/sound |
| `volumeOff` | Mute/no sound |
| `volume2` | Medium volume |
| `volume3` | High volume |
| `microphone` | Microphone/record |
| `microphoneOff` | Mic muted |
| `broadcast` | Broadcasting/live |
| `camera` | Camera/photo |
| `photo` | Image/picture |
| `video` | Video |
| `music` | Music/audio |

**Usage Example**:
```typescript
<baz-icon icon="playerPlay" size="32"></baz-icon>
<baz-icon icon="volume" size="24"></baz-icon>
<baz-icon icon="camera" size="20"></baz-icon>
```

---

### 5. Development & Code (20 icons)
**File**: `icon-libs/development.ts`

| Icon Name | Description |
|-----------|-------------|
| `code` | Code/programming |
| `terminal` | Terminal/console |
| `bug` | Bug/error |
| `database` | Database |
| `server` | Server/hosting |
| `api` | API/interface |
| `git` | Git version control |
| `gitBranch` | Git branch |
| `gitCommit` | Git commit |
| `gitPullRequest` | Pull request |
| `gitMerge` | Merge branches |
| `terminal2` | Alternative terminal |
| `package` | Package/module |
| `boxModel` | Box model/layout |
| `html` | HTML markup |
| `css` | CSS styles |
| `javascript` | JavaScript |
| `typescript` | TypeScript |
| `brackets` | Brackets [] |
| `braces` | Braces {} |

**Usage Example**:
```typescript
<baz-icon icon="code" size="24"></baz-icon>
<baz-icon icon="git" size="20"></baz-icon>
<baz-icon icon="typescript" size="22" stroke="#3178c6"></baz-icon>
```

---

## Legacy Icons
The following 51 legacy icons are maintained for backward compatibility:

search, squareX, deviceFloppy, menu2, baguette, brackets, braces, folder, appWindow, palette, html, fileTs, fileHtml, fileJs, fileCss, list, playerPlay, playerStop, playerPause, volume, volumeOff, code, refresh, layers, zap, package, tool, book, atSign, link, fileText, maximize, play, arrowRight, calendar, box, clock, edit, mousePointer, download, rocket, lightbulb, database, repeat, trash, shield, activity, terminal, puzzle, help, info

---

## Component Properties

The `baz-icon` component supports the following properties:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `icon` | string | `_default` | Icon name to display |
| `size` | string/number | `24` | Icon size in pixels |
| `stroke` | string | `currentColor` | Stroke color (CSS color) |
| `strokeWidth` | string/number | `2` | Stroke width |
| `role` | string | `img` | ARIA role |
| `ariaLabel` | string | - | Accessibility label |
| `ariaHidden` | boolean | `false` | Hide from screen readers |

---

## Usage Examples

### Basic Usage
```html
<baz-icon icon="home"></baz-icon>
<baz-icon icon="settings" size="32"></baz-icon>
<baz-icon icon="code" size="24" stroke="#007acc"></baz-icon>
```

### With Attributes
```html
<baz-icon 
  icon="database" 
  size="40" 
  stroke="#ff6b6b"
  stroke-width="3"
  role="img"
  aria-label="Database icon">
</baz-icon>
```

### In TypeScript
```typescript
const iconElement = document.createElement('baz-icon')
iconElement.setAttribute('icon', 'gitBranch')
iconElement.setAttribute('size', '28')
document.body.appendChild(iconElement)
```

---

## Naming Convention

All new icons follow **camelCase** naming convention:
- ✅ `arrowUp`, `fileText`, `playerPlay`
- ❌ `arrow-up`, `file-text`, `player-play`

Legacy icons maintain their original naming for compatibility.

---

## Adding New Icons

To add new icons:

1. Choose the appropriate category file (or create a new one)
2. Add the icon to the category object using camelCase naming
3. Update the `icon-libs/index.ts` if you created a new category
4. Icons will automatically merge into the main library

**Example**:
```typescript
// In icon-libs/system.ts
export const systemIcons = {
  // ... existing icons
  newIcon: `<svg xmlns="http://www.w3.org/2000/svg" ...></svg>`,
}
```

---

## Icon Source

All icons are from **Tabler Icons** (https://tabler.io/icons), a high-quality open-source icon library.

## License

Icons are sourced from Tabler Icons under the MIT License.
