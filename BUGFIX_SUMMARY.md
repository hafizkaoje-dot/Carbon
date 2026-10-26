# Bug Fix: "Cannot read properties of null (reading 'useCallback')"

## Issue Description
The application was throwing a runtime error: `Uncaught TypeError: Cannot read properties of null (reading 'useCallback')`

## Root Cause
The error was caused by **dynamic import of Leaflet** in the `MapView` component. When Leaflet was loaded asynchronously using `await import('leaflet')` inside a `useEffect`, it created a race condition with React's rendering cycle, causing React's internal state to become corrupted.

### Why This Happened
1. **Async Loading Conflict**: The dynamic import created an asynchronous operation that could complete at any time, potentially interrupting React's rendering cycle.
2. **Module Loading Order**: Leaflet's internal dependencies might have been loaded in an unexpected order, causing conflicts with React's module system.
3. **Timing Issues**: The async nature meant that React hooks could be called in an invalid context.

## Solution
Changed from **dynamic import** to **static import** of Leaflet:

### Before (Problematic):
```typescript
useEffect(() => {
  const initMap = async () => {
    const L = await import('leaflet');  // ❌ Dynamic import
    // ... map initialization
  };
  initMap();
}, []);
```

### After (Fixed):
```typescript
import L from 'leaflet';  // ✅ Static import at top level

export function MapView() {
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;
    
    // Direct Leaflet usage - no async needed
    const map = L.map(mapRef.current, {
      center: mapCenter,
      zoom: mapZoom,
      zoomControl: false,
    });
    // ... rest of initialization
  }, []);
}
```

## Additional Improvements
1. **Type Safety**: Changed `leafletMapRef` from `useRef<any>` to `useRef<L.Map | null>` for better TypeScript support.
2. **Removed Unnecessary Wrapper**: Eliminated the async function wrapper since Leaflet is now loaded synchronously.
3. **Cleaner Code Structure**: Removed the `initMap()` function call and simplified the useEffect logic.

## Files Modified
- `src/components/MapView.tsx` - Fixed Leaflet import and initialization

## Testing
- ✅ Build successful
- ✅ No TypeScript errors
- ✅ Leaflet map loads correctly
- ✅ No runtime errors

## Best Practices Applied
1. **Static Imports for Core Dependencies**: Libraries that are essential to the component should be imported statically to ensure they're available during the initial render.
2. **Avoid Async in useEffect Initialization**: When initializing third-party libraries in useEffect, prefer synchronous operations to avoid race conditions with React's lifecycle.
3. **Proper Cleanup**: Maintained the cleanup function to prevent memory leaks when the component unmounts.

## Prevention
To avoid similar issues in the future:
- Use static imports for libraries that need to be available immediately
- Reserve dynamic imports for code-splitting scenarios (large libraries loaded on-demand)
- Test components thoroughly to catch timing-related issues
- Use TypeScript to catch potential null/undefined access issues
