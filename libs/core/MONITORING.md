# Bazlama Web Component - Monitoring Guide

## 📦 Dual Build System

The Bazlama Web Component library is now available in two flavors:

### Production Build (Default)
```typescript
import { BazlamaWebComponent } from 'bazlama-web-component';
```
- **No monitoring code** - Smaller bundle size
- Optimized for production use
- ~10 KB smaller than development build

### Development Build (with Monitoring)
```typescript
import { BazlamaWebComponent, BazlamaMonitor } from 'bazlama-web-component/dev';
```
- **Includes BazlamaMonitor** - Performance tracking and statistics
- Perfect for debugging and optimization
- Track renders, callbacks, and lifecycle events

---

## 🔍 Using BazlamaMonitor

### Enable Monitoring

```typescript
// Import from dev build
import { BazlamaMonitor } from 'bazlama-web-component/dev';

// Enable monitoring
BazlamaMonitor.enabled = true;

// Optional: Track individual component instances
BazlamaMonitor.trackInstances = true;
```

### Get Statistics

```typescript
// Global statistics
const globalStats = BazlamaMonitor.getGlobalStats();
console.log('Total renders:', globalStats.totalRenders);
console.log('Total components:', globalStats.totalComponentsCreated);

// Component-specific statistics
const inputStats = BazlamaMonitor.getComponentStats('baz-input');
console.log('Input renders:', inputStats?.renderCount);
console.log('Avg render time:', inputStats?.avgRenderDuration);

// Instance-specific statistics
const myComponent = document.querySelector('baz-input');
const instanceStats = BazlamaMonitor.getInstanceStats(myComponent);
console.log('This instance rendered:', instanceStats?.renderCount);
```

### Reset Statistics

```typescript
// Clear all statistics
BazlamaMonitor.reset();
```

### Export Statistics

```typescript
// Export as JSON string
const jsonData = BazlamaMonitor.exportStats();
console.log(jsonData);

// Or download as file
const blob = new Blob([jsonData], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'bazlama-stats.json';
a.click();
```

---

## 📊 Statistics Interface

### Global Stats
```typescript
interface IGlobalStats {
  totalComponentsCreated: number;
  totalRenders: number;
  totalAttributeCallbacks: number;
  totalPropertyCallbacks: number;
  totalEventActions: number;
  byComponent: Map<string, IComponentStats>;
  byInstance: Map<HTMLElement, IComponentStats>;
}
```

### Component Stats
```typescript
interface IComponentStats {
  tagName: string;
  renderCount: number;
  attributeCallbackCount: number;
  propertyCallbackCount: number;
  eventActionCount: number;
  lifecycle: {
    created?: number;
    connected?: number;
    disconnected?: number;
    firstRender?: number;
    lastRender?: number;
  };
  avgRenderDuration: number;
  totalRenderDuration: number;
  custom: Record<string, number>;
}
```

---

## 🎯 Use Cases

### Performance Testing
```typescript
import { BazlamaMonitor } from 'bazlama-web-component/dev';

BazlamaMonitor.enabled = true;

// Run your test
performSomeOperations();

// Check results
const stats = BazlamaMonitor.getGlobalStats();
console.log(`Total renders: ${stats.totalRenders}`);
console.log(`Avg render time: ${stats.byComponent.get('my-component')?.avgRenderDuration}ms`);
```

### Debugging Component Updates
```typescript
import { BazlamaMonitor } from 'bazlama-web-component/dev';

BazlamaMonitor.enabled = true;
BazlamaMonitor.trackInstances = true;

const myComponent = document.querySelector('baz-input');

// Make changes
myComponent.value = 'test';

// Check if it triggered callbacks
const stats = BazlamaMonitor.getInstanceStats(myComponent);
console.log('Property callbacks:', stats?.propertyCallbackCount);
console.log('Renders:', stats?.renderCount);
```

### Finding Performance Bottlenecks
```typescript
import { BazlamaMonitor } from 'bazlama-web-component/dev';

BazlamaMonitor.enabled = true;

// After running your app
const stats = BazlamaMonitor.getGlobalStats();

// Find slowest components
const slowComponents = Array.from(stats.byComponent.entries())
  .sort((a, b) => b[1].avgRenderDuration - a[1].avgRenderDuration)
  .slice(0, 5);

console.log('Slowest components:');
slowComponents.forEach(([name, stats]) => {
  console.log(`${name}: ${stats.avgRenderDuration.toFixed(2)}ms avg`);
});
```

---

## 📁 Package.json Configuration

The dual build system is configured in `package.json`:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/bazlama-web-component.es.js",
      "require": "./dist/bazlama-web-component.cjs.js"
    },
    "./dev": {
      "types": "./dist/index.d.ts",
      "import": "./dist/bazlama-web-component.dev.es.js",
      "require": "./dist/bazlama-web-component.dev.cjs.js"
    }
  }
}
```

---

## 🚀 Best Practices

1. **Always use production build in production**
   ```typescript
   // ✅ Good
   import { BazlamaWebComponent } from 'bazlama-web-component';
   
   // ❌ Bad (in production)
   import { BazlamaWebComponent } from 'bazlama-web-component/dev';
   ```

2. **Enable monitoring only when needed**
   ```typescript
   // Don't enable by default, even in dev build
   if (process.env.DEBUG) {
     BazlamaMonitor.enabled = true;
   }
   ```

3. **Reset statistics between tests**
   ```typescript
   beforeEach(() => {
     BazlamaMonitor.reset();
   });
   ```

4. **Use instance tracking sparingly**
   ```typescript
   // Uses more memory, only enable when debugging specific instances
   BazlamaMonitor.trackInstances = true;
   ```

---

## 📈 Bundle Size Comparison

| Build Type | ES Module | CommonJS | UMD |
|-----------|-----------|----------|-----|
| Production | 58 KiB | 59 KiB | 63 KiB |
| Development | 68 KiB | 69 KiB | 73 KiB |
| **Difference** | **~10 KiB** | **~10 KiB** | **~10 KiB** |

*Note: Gzipped production build is ~11 KB, development build is ~13 KB*

---

## 🛠️ Development

### Building Both Versions

```bash
npm run build
```

This runs:
1. `npm run build:prod` - Production build (no monitoring)
2. `npm run build:dev` - Development build (with monitoring)

### Individual Builds

```bash
# Production only
npm run build:prod

# Development only
npm run build:dev
```

---

## 💡 Tips

- Monitoring adds approximately **10 KB** to bundle size
- Use `/dev` import only during development and testing
- BazlamaMonitor is a singleton accessible via `window.BazlamaMonitor`
- Statistics are kept in memory - reset periodically in long-running apps
- Render duration tracking uses `performance.now()` for sub-millisecond precision
