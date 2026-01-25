# xAmplR vs jam-station Comparison

**Date:** 2026-01-25  
**Status:** Analysis  
**Purpose:** Identify missing patterns and improvements from jam-station

## Overview

Comparison of xAmplR with jam-station (reference implementation) to identify missing patterns, dependencies, and architectural differences.

---

## Key Differences

### 1. Service Organization Pattern ⚠️

**jam-station:**
- Centralized service hooks in `src/js/services/index.js`
- Single `services.hook()` call in `index.js`
- Cleaner separation of concerns

**xAmplR:**
- Individual service hooks called directly in `index.js`
- No centralized service management
- More verbose, harder to maintain

**Recommendation:** Consider creating `src/js/services/index.js` to centralize service hooks.

---

### 2. State Management Pattern ⚠️

**jam-station:**
```javascript
let {actions, state$} = createState(actionsTree);
// Attach service actions AFTER createState
actions = attach(actions, 'pianoRoll', pianoRoll.actions);
```

**xAmplR:**
```javascript
// Patch service actions BEFORE createState
actionsTree = obj.patch(actionsTree, 'audio', audio.actions);
let {actions, state$} = createState(actionsTree);
```

**Analysis:**
- Both patterns work, but `attach()` after `createState()` is cleaner
- `attach()` is the recommended pattern from `iblokz-state`
- Current xAmplR pattern works but is less idiomatic

**Recommendation:** Consider migrating to `attach()` pattern for consistency.

---

### 3. Audio Library ⚠️ **CRITICAL**

**jam-station:**
- Uses `iblokz-audio@^0.1.0` library
- Clean, standardized audio API
- Shared improvements across projects

**xAmplR:**
- Still uses custom `src/js/util/audio` utilities
- Not aligned with workspace standards
- Missing shared improvements

**Files:**
- `src/js/util/audio.js` - Custom implementation
- `src/js/util/audio/sources/sampler.js` - Custom sampler
- Should be replaced with `iblokz-audio`

**Recommendation:** **Phase 3 priority** - Migrate to `iblokz-audio`.

---

### 4. Dependencies

#### Missing Dependencies in xAmplR:

| Dependency | jam-station | xAmplR | Status |
|------------|-------------|--------|--------|
| `iblokz-audio` | `^0.1.0` | ❌ Missing | **Phase 3** |
| `iblokz-gfx` | `^0.1.0` | ❌ Missing | Optional |
| `uuid` | `^10.0.0` | `^3.3.2` | ⚠️ Outdated |
| `wavesurfer.js` | `^7.8.3` | `^2.1.0` | ⚠️ Outdated |
| `mocha` | `^10.2.0` | ❌ Missing | Optional |
| `chai` | `^4.3.10` | ❌ Missing | Optional |

#### Outdated Dependencies in xAmplR:

- `uuid@^3.3.2` → Should be `^10.0.0` (Phase 4)
- `wavesurfer.js@^2.1.0` → Should be `^7.8.3` (Phase 4)

---

### 5. Testing Infrastructure

**jam-station:**
- ✅ Unit tests with Mocha
- ✅ E2E tests with Playwright
- ✅ Test helper functions
- ✅ Comprehensive test coverage

**xAmplR:**
- ✅ E2E tests with Playwright
- ❌ No unit tests (Mocha)
- ⚠️ Limited test coverage

**Recommendation:** Consider adding Mocha for unit tests (optional, not critical).

---

### 6. Window Exposure Pattern

**jam-station:**
```javascript
window.__jamStationActions = actions;
window.__jamStationState$ = state$;
```

**xAmplR:**
```javascript
window.state$ = state$;
window.actions = actions;
```

**Analysis:**
- jam-station uses namespaced variables to avoid conflicts
- xAmplR uses generic names (could conflict with other scripts)
- Both work, but namespacing is safer

**Recommendation:** Consider namespacing (low priority).

---

### 7. Audio Context & Permissions

**jam-station:**
```javascript
// Request permissions on page load
if (a.context.state === 'suspended') {
	a.context.resume().catch(err => {
		console.error('Failed to resume audio context:', err);
	});
}

// MIDI access
if (navigator.requestMIDIAccess) {
	navigator.requestMIDIAccess().catch(err => {
		console.error('Failed to request MIDI access:', err);
	});
}
```

**xAmplR:**
- ❌ No automatic audio context resume
- ❌ No automatic MIDI permission request
- Users must interact before audio works

**Recommendation:** Add automatic permission requests for better UX.

---

### 8. Service Structure

**jam-station:**
- Services organized in subdirectories:
  - `services/audio/index.js` (with `util/` subdirectory)
  - `services/piano-roll/index.js` (with `util/` subdirectory)
- Better organization for complex services

**xAmplR:**
- Flat service files:
  - `services/audio.js`
  - `services/pads.js`
- Simpler structure, but less scalable

**Analysis:** Both patterns work. xAmplR's simpler structure is fine for current complexity.

---

### 9. Hot Reloading

**jam-station:**
- Simpler hot reloading (accepts `./services` as a module)
- Less granular control

**xAmplR:**
- More granular hot reloading (per-service)
- More verbose but more control

**Analysis:** xAmplR's approach is actually better for development.

---

### 10. UI Context Passing

**jam-station:**
```javascript
const ui$ = state$.pipe(
	map(state => ui({state, actions, tapTempo, context: a.context}))
);
```

**xAmplR:**
```javascript
const ui$ = state$.pipe(
	map(state => ui({state, actions}))
);
```

**Analysis:**
- jam-station passes `tapTempo` and `a.context` to UI
- xAmplR doesn't need these (different architecture)
- Not a problem, just different design

---

## Missing Features in xAmplR

### Critical (Phase 3)
1. **iblokz-audio migration** - Replace custom audio utilities
   - This is already planned in Phase 3
   - Will align with workspace standards

### Important (Phase 4)
2. **Update wavesurfer.js** - `^2.1.0` → `^7.8.3`
   - Already planned in Phase 4
   - May require API updates

3. **Update uuid** - `^3.3.2` → `^10.0.0`
   - Already planned in Phase 4
   - May require import changes

### Nice to Have (Optional)
4. **Centralized service hooks** - Create `services/index.js`
   - Cleaner architecture
   - Easier to maintain

5. **Use `attach()` pattern** - Instead of `obj.patch()` before `createState()`
   - More idiomatic `iblokz-state` usage
   - Better separation of concerns

6. **Audio context & MIDI permissions** - Automatic on page load
   - Better UX
   - Users don't need to click first

7. **Namespaced window variables** - `window.__xAmplRActions` instead of `window.actions`
   - Avoids potential conflicts
   - More professional

8. **Unit tests with Mocha** - Add unit test infrastructure
   - Better test coverage
   - Faster feedback loop

---

## What xAmplR Does Better

1. **Granular Hot Reloading** - Per-service hot reloading is more flexible
2. **Simpler Service Structure** - Flat files are easier to navigate for current complexity
3. **E2E Test Infrastructure** - Already has Playwright setup with good helpers

---

## Recommendations by Priority

### High Priority (Do Soon)
1. ✅ **Phase 3: Migrate to iblokz-audio** (already planned)
   - This is the biggest gap
   - Will align with workspace standards

### Medium Priority (Phase 4)
2. ✅ **Update wavesurfer.js** (already planned)
3. ✅ **Update uuid** (already planned)

### Low Priority (Optional Improvements)
4. **Centralize service hooks** - Create `services/index.js`
5. **Use `attach()` pattern** - Migrate from `obj.patch()` to `attach()`
6. **Add audio context & MIDI permissions** - Automatic on page load
7. **Namespace window variables** - Use `__xAmplRActions` pattern

### Very Low Priority (Nice to Have)
8. **Add Mocha unit tests** - Only if needed for specific functionality

---

## Action Items

### Already Planned (Phase 3 & 4)
- [x] Phase 3: Migrate to `iblokz-audio` (in plan)
- [x] Phase 4: Update `wavesurfer.js` to v7.8.3 (in plan)
- [x] Phase 4: Update `uuid` to v10.0.0 (in plan)

### New Recommendations
- [ ] **Optional:** Create `src/js/services/index.js` for centralized hooks
- [ ] **Optional:** Migrate to `attach()` pattern after `createState()`
- [ ] **Optional:** Add automatic audio context resume and MIDI permission requests
- [ ] **Optional:** Namespace window variables (`__xAmplRActions`, `__xAmplRState$`)
- [ ] **Optional:** Add Mocha for unit tests (if needed)

---

## Conclusion

**Good News:**
- Most critical differences are already planned (Phase 3 & 4)
- xAmplR is well-structured and functional
- The main gap is `iblokz-audio` migration (Phase 3)

**Key Takeaways:**
1. **Phase 3 is critical** - `iblokz-audio` migration will align xAmplR with workspace standards
2. **Phase 4 improvements** - Updating `wavesurfer.js` and `uuid` will modernize dependencies
3. **Optional improvements** - Service organization and patterns can be improved incrementally

**Current Status:**
- ✅ Phase 1 & 2 complete (foundation + RxJS migration)
- ⏳ Phase 3 pending (`iblokz-audio` migration)
- ⏳ Phase 4 pending (dependency updates)

The comparison shows that xAmplR is on the right track, with the main gaps already identified in the implementation plan. The optional improvements can be done incrementally as needed.
