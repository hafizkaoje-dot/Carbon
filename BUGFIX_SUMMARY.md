# Bug Fix: "Cannot read properties of null (reading 'useCallback')"

## Issue Description
The application was throwing a runtime error: `Uncaught TypeError: Cannot read properties of null (reading 'useCallback')`

## Root Causes Identified

### 1. Dynamic Import of Leaflet (MapView.tsx)
The error was initially caused by **dynamic import of Leaflet** in the `MapView` component. When Leaflet was loaded asynchronously using `await import('leaflet')` inside a `useEffect`, it created a race condition with React's rendering cycle.

### 2. Recharts ResponsiveContainer Issue (AnalysisPanel.tsx)
The primary cause was **Recharts' `ResponsiveContainer`** component, which has a known issue where it tries to access React hooks when its internal ref is null. This happens when:
- The container is conditionally rendered
- The parent element has 0 dimensions during initial render
- The ResizeObserver fires before the component is fully mounted

### 3. Potential Duplicate React Instances
The error can also occur when multiple React instances are loaded, causing React's internal dispatcher (`ReactCurrentDispatcher.current`) to be null.

## Solutions Applied

### Fix 1: Static Import of Leaflet
**Before (Problematic):**
```typescript
useEffect(() => {
  const initMap = async () => {
    const L = await import('leaflet');  // ❌ Dynamic import
    // ... map initialization
  };
  initMap();
}, []);
```

**After (Fixed):**
```typescript
import L from 'leaflet';  // ✅ Static import at top level

export function MapView() {
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;
    const map = L.map(mapRef.current, { ... });
  }, []);
}
```

### Fix 2: SafeChartContainer Component
Created a custom chart container that replaces Recharts' `ResponsiveContainer`:

```typescript
// SafeChartContainer.tsx
export function SafeChartContainer({ children, width, height }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Use ResizeObserver for safe dimension tracking
    const resizeObserver = new ResizeObserver(() => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        setDimensions({ width: rect.width, height: rect.height });
      }
    });
    // ... setup and cleanup
  }, []);

  // Only render when mounted and dimensions are valid
  if (!isMounted || dimensions.width === 0) {
    return <div ref={containerRef} style={{ width, height }} />;
  }

  return <div ref={containerRef}>{children(dimensions)}</div>;
}
```

### Fix 3: ErrorBoundary Component
Added a React Error Boundary to catch and gracefully handle rendering errors:

```typescript
// ErrorBoundary.tsx
export class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <FallbackUI error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### Fix 4: React Initialization Check
Added a safeguard in `main.tsx` to verify React is properly initialized:

```typescript
// main.tsx
if (typeof React.useCallback !== 'function') {
  console.error('React is not properly initialized.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Fix 5: Wrapped App with ErrorBoundary
```typescript
// App.tsx
return (
  <ErrorBoundary>
    <div className="h-screen w-screen ...">
      {/* App content */}
    </div>
  </ErrorBoundary>
);
```

## Files Modified

1. **src/components/MapView.tsx**
   - Changed from dynamic to static Leaflet import
   - Improved TypeScript types
   - Simplified useEffect logic

2. **src/components/AnalysisPanel.tsx**
   - Replaced `ResponsiveContainer` with `SafeChartContainer`
   - Wrapped charts in `ErrorBoundary`
   - Added proper dimension handling

3. **src/components/SafeChartContainer.tsx** (NEW)
   - Custom chart container that avoids Recharts' null ref issues
   - Uses ResizeObserver for safe dimension tracking
   - Only renders children when mounted and dimensions are valid

4. **src/components/ErrorBoundary.tsx** (NEW)
   - React Error Boundary for graceful error handling
   - Provides fallback UI with retry option
   - Logs errors for debugging

5. **src/App.tsx**
   - Wrapped entire app in ErrorBoundary
   - Ensures errors don't crash the entire application

6. **src/main.tsx**
   - Added React initialization check
   - Wrapped app in React.StrictMode
   - Added null check for root element

## Testing
- ✅ Build successful
- ✅ No TypeScript errors
- ✅ Leaflet map loads correctly
- ✅ Charts render without errors
- ✅ Error boundary catches and displays errors gracefully
- ✅ No runtime errors

## Best Practices Applied

1. **Static Imports for Core Dependencies**: Libraries essential to the component should be imported statically
2. **Avoid Async in useEffect Initialization**: Prefer synchronous operations to avoid race conditions
3. **Safe Chart Rendering**: Use custom containers that verify dimensions before rendering
4. **Error Boundaries**: Wrap critical components to prevent app crashes
5. **Defensive Programming**: Check for null/undefined before accessing properties
6. **Proper Cleanup**: Always clean up observers and event listeners
7. **Type Safety**: Use TypeScript to catch potential null/undefined access

## Prevention Guidelines

To avoid similar issues in the future:

1. **For Third-Party Libraries:**
   - Use static imports for libraries needed immediately
   - Reserve dynamic imports for code-splitting large optional dependencies
   - Test components thoroughly to catch timing-related issues

2. **For Chart Libraries (Recharts, etc.):**
   - Avoid `ResponsiveContainer` in conditionally rendered components
   - Use custom wrappers that verify dimensions before rendering
   - Wrap charts in ErrorBoundaries

3. **For React Applications:**
   - Ensure only one React instance is loaded (use `resolve.dedupe` in Vite/Webpack)
   - Use ErrorBoundaries for critical components
   - Add initialization checks in development
   - Use React.StrictMode to catch issues early

4. **General:**
   - Always check refs before accessing properties
   - Use optional chaining (`?.`) for safe property access
   - Implement proper error handling and logging
   - Test conditional rendering scenarios thoroughly
