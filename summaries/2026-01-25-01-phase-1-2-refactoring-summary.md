# xAmplR Phase 1 & 2 Refactoring Summary

**Date:** 2026-01-25  
**Status:** Completed  
**Phases:** Phase 1 (Foundation) + Phase 2 (RxJS Migration & State Management)

## Overview

Successfully completed Phase 1 and Phase 2 of the xAmplR standardization plan. Migrated from RxJS v4 (rx) to RxJS v7 (rxjs), integrated `iblokz-state` for state management, and updated `iblokz-snabbdom-helpers` to v2.0.0. Fixed critical recording functionality bug and cleaned up codebase.

---

## Phase 1: Foundation ✅

### Task 1.1: Update iblokz-data ✅
- **Status:** Completed
- **Changes:**
  - Updated `iblokz-data` from `^1.2.0` → `^1.6.0`
  - No breaking changes encountered
- **Files Modified:**
  - `package.json`

### Task 1.2: GitHub Actions CI/CD ✅
- **Status:** Completed (replaced with deploy workflow)
- **Changes:**
  - Initially created CI workflow following library pattern
  - **Fixed:** Replaced with deploy workflow matching `jam-station` pattern
  - Created `.github/workflows/deploy.yml` for GitHub Pages deployment
  - Removed `.github/workflows/ci.yml` (was using wrong pattern for applications)
- **Files Modified:**
  - `.github/workflows/deploy.yml` (created)
  - `.github/workflows/ci.yml` (deleted - wrong pattern)
  - `package.json` (added `lint` script)

---

## Phase 2: RxJS Migration & State Management ✅

### Task 2.1: Migrate from rx to rxjs ✅
- **Status:** Completed
- **Changes:**
  - Removed `rx@^4.1.0` dependency
  - Added `rxjs@^7.8.0` dependency
  - Updated all imports:
    - `require('rx')` → `require('rxjs')`
    - `Rx.Observable` → `Observable` from `rxjs`
    - `Rx.Subject` → `Subject` from `rxjs`
    - `Rx.BehaviorSubject` → `BehaviorSubject` from `rxjs`
  - Updated all operator chains to use `.pipe()` method
  - Updated subscription methods:
    - `.dispose()` → `.unsubscribe()` (RxJS v7 API)
    - `actions.stream.onNext()` → `actions.stream.next()`
    - `actions.stream.startWith()` → `.pipe(startWith())`
  - Updated operators to use `rxjs/operators` imports
- **Files Modified:**
  - `package.json`
  - `src/js/index.js`
  - `src/js/services/*.js` (all service files)
  - `src/js/util/*.js` (pocket, midi, time, file, gamepad, recorder)
  - `src/js/actions/**/*.js` (wave-editor, midi-map)

### Task 2.2: Migrate to iblokz-state ✅
- **Status:** Completed
- **Changes:**
  - Added `iblokz-state@^1.1.0` dependency
  - Replaced custom RxJS state management with `createState()` and `attach()`
  - Updated `src/js/index.js`:
    - Removed custom `BehaviorSubject`-based state management
    - Removed `src/js/util/app.js` (no longer needed)
    - Used `createState(actionsTree)` to initialize state
    - Used `attach()` to add service actions
  - Updated all services to export `actions` object (action tree pattern)
  - Updated service hooks to work with `iblokz-state` pattern
  - Actions now return reducer functions (or Promises resolving to reducers)
  - Added error handling with `catchError` to return identity reducers on failure
- **Files Modified:**
  - `package.json`
  - `src/js/index.js` (major refactor)
  - `src/js/actions/index.js` (added `recording: false` to initial state)
  - `src/js/services/*.js` (all services updated)
  - `src/js/util/app.js` (deleted - no longer needed)

### Task 2.3: Update iblokz-snabbdom-helpers ✅
- **Status:** Completed
- **Changes:**
  - Updated `iblokz-snabbdom-helpers` from `^1.2.0` → `^2.0.0`
  - No API changes required (compatible with RxJS v7)
- **Files Modified:**
  - `package.json`

---

## Critical Bug Fixes

### Recording Functionality Fix ✅
- **Problem:** Recording was not loading samples into pads after stopping
- **Root Cause:** 
  1. `distinctUntilChanged(state => state.recording)` was not working correctly in RxJS v7
  2. The subscription callback was running multiple times, causing `recording` variable to be lost
- **Solution:**
  - Changed `distinctUntilChanged(state => state.recording)` to `distinctUntilChanged((prev, curr) => prev.recording === curr.recording)`
  - This fixed the issue - the comparison function form works correctly in RxJS v7
- **Files Modified:**
  - `src/js/services/audio.js`

### Error Handling Fix ✅
- **Problem:** "change is not a function" errors when loading samples
- **Root Cause:** Actions returning Promises that could reject, causing `iblokz-state` to receive non-reducer values
- **Solution:**
  - Added `catchError` to all `firstValueFrom` chains in `audio.load`, `audio.crop`, and `pads.load`
  - Return identity reducer `of(state => state)` on error
- **Files Modified:**
  - `src/js/services/audio.js`
  - `src/js/services/pads.js`

---

## Code Cleanup

### Removed Debug Code ✅
- Removed `testRecording` function from `src/js/services/audio.js`
- Removed `test-recording-function.e2e.test.js` (replaced with unit test)
- Removed debug `console.log` statements:
  - Removed state logging from `src/js/index.js`
  - Removed buffer logging from `src/js/services/audio.js` crop function
  - Removed analyser creation log
- **Files Modified:**
  - `src/js/services/audio.js`
  - `src/js/index.js`
  - `src/js/util/recorder.js`

### Fixed RxJS v7 API Usage ✅
- Updated all `.dispose()` calls to `.unsubscribe()` (RxJS v7 API)
- **Files Modified:**
  - `src/js/services/pads.js`
  - `src/js/services/wavesurfer.js`
  - `src/js/services/samples.js`
  - `src/js/services/midi.js`
  - `src/js/services/stt.js`
  - `src/js/services/control.js`

### Consistency Improvements ✅
- Added `updated: new Date()` to `pads.load` reducer (matching `audio.load` pattern)
- **Files Modified:**
  - `src/js/services/pads.js`

---

## Testing

### E2E Tests ✅
- Created `test/recording.e2e.test.js` - Full recording flow test
- Created `test/recorder.e2e.test.js` - Recorder utility unit test
- All tests passing:
  - Recording start/stop functionality
  - Sample loading into pads
  - Multiple recording toggles
  - Recorder utility basic functionality

### Test Scripts ✅
- `test:recording` - Run recording E2E tests
- `test:recording:headed` - Run recording tests in headed mode
- `test:recorder` - Run recorder utility tests
- `test:recorder:headed` - Run recorder tests in headed mode

---

## What We Added

1. **New Dependencies:**
   - `rxjs@^7.8.0` (replaced `rx@^4.1.0`)
   - `iblokz-state@^1.1.0`
   - `@playwright/test@^1.57.0` (for E2E testing)

2. **New Files:**
   - `.github/workflows/deploy.yml` - GitHub Pages deployment
   - `test/recording.e2e.test.js` - Recording functionality tests
   - `test/recorder.e2e.test.js` - Recorder utility tests
   - `playwright.config.js` - Playwright configuration

3. **New Features:**
   - E2E testing infrastructure
   - GitHub Pages deployment workflow
   - Error handling in async actions

---

## What We Removed

1. **Deleted Files:**
   - `src/js/util/app.js` - Custom state management utility (replaced by `iblokz-state`)
   - `.github/workflows/ci.yml` - Wrong pattern for applications
   - `test/test-recording-function.e2e.test.js` - Replaced with unit test

2. **Removed Code:**
   - `testRecording` function from audio service
   - Debug `console.log` statements
   - Old RxJS v4 API calls (`.dispose()`, direct chaining)
   - Custom state management code

---

## What We Missed (Fixed)

1. **RxJS v7 API Migration:**
   - ✅ Fixed: All `.dispose()` → `.unsubscribe()` (6 files)
   - ✅ Fixed: `distinctUntilChanged` selector function → comparison function

2. **Error Handling:**
   - ✅ Fixed: Added `catchError` to async actions returning Promises

3. **Consistency:**
   - ✅ Fixed: Added `updated: new Date()` to `pads.load` reducer

4. **Code Cleanup:**
   - ✅ Fixed: Removed debug console.logs
   - ✅ Fixed: Removed testRecording function

---

## What We Added Too Much (Removed)

1. **testRecording Function:**
   - Initially created for testing, but replaced with proper unit tests
   - ✅ Removed: Function and related test file

2. **Debug Logging:**
   - Added extensive logging during debugging
   - ✅ Removed: All debug console.logs except error logging

3. **Cleanup Code:**
   - Initially tried to add cleanup for recording subscriptions and streams
   - ✅ Removed: Restored old code behavior (no cleanup, just overwrite)

---

## Current State

### Dependencies
- ✅ `iblokz-data@^1.6.0` (updated)
- ✅ `iblokz-state@^1.1.0` (added)
- ✅ `iblokz-snabbdom-helpers@^2.0.0` (updated)
- ✅ `rxjs@^7.8.0` (migrated from `rx@^4.1.0`)
- ✅ All RxJS v4 dependencies removed

### State Management
- ✅ Using `iblokz-state` with `createState()` and `attach()`
- ✅ All actions return reducer functions
- ✅ Error handling with identity reducers
- ✅ Services properly hooked

### RxJS Migration
- ✅ All files migrated to RxJS v7
- ✅ All operators use `.pipe()` method
- ✅ All subscriptions use `.unsubscribe()`
- ✅ `distinctUntilChanged` uses comparison function form

### Recording Functionality
- ✅ Recording starts and stops correctly
- ✅ Samples load into pads after recording
- ✅ Multiple toggles work without errors
- ✅ All tests passing

### CI/CD
- ✅ GitHub Pages deployment workflow
- ✅ Follows application pattern (not library pattern)

---

## Remaining Issues

### Linting Errors (Minor)
- Some ESLint formatting issues (object-curly-spacing, semicolons)
- These are style issues, not functional problems
- Can be fixed with `pnpm run lint --fix` or manually

### Known Warnings
- ScriptProcessorNode deprecation warning (expected, from wavesurfer)
- MIDI permission warnings in tests (expected, using fake devices)

---

## Next Steps (Phase 3 & 4)

### Phase 3: Audio Library Migration (Not Started)
- Migrate to `iblokz-audio` library
- Replace custom audio utilities
- Estimated: 4-6 hours

### Phase 4: Optional Improvements (Not Started)
- Update wavesurfer.js to v7.8.3 (optional)
- Update other dependencies (optional)
- ES6 modules migration (optional)

---

## Key Learnings

1. **distinctUntilChanged in RxJS v7:**
   - Selector function form `distinctUntilChanged(state => state.recording)` doesn't work reliably
   - Comparison function form `distinctUntilChanged((prev, curr) => prev.recording === curr.recording)` works correctly

2. **Error Handling with iblokz-state:**
   - Actions returning Promises must handle errors with `catchError`
   - Always return a reducer function (or Promise resolving to reducer)
   - Identity reducer `of(state => state)` for error cases

3. **Recording Subscription Management:**
   - Don't over-cleanup - let subscriptions stay active to receive data
   - Old code didn't clean up, and that was correct for this use case

4. **Application vs Library CI/CD:**
   - Applications use `build` job, not `test` job
   - Applications don't need `develop` branch or coverage reporting
   - Applications focus on deployment, not testing

---

## Files Changed Summary

### Modified Files (30+)
- `package.json` - Dependencies and scripts
- `src/js/index.js` - State management refactor
- `src/js/actions/index.js` - Added `recording: false` to initial state
- `src/js/services/audio.js` - RxJS migration, iblokz-state, recording fix
- `src/js/services/pads.js` - RxJS migration, error handling, consistency
- `src/js/services/wavesurfer.js` - RxJS migration, unsubscribe fix
- `src/js/services/samples.js` - RxJS migration, unsubscribe fix
- `src/js/services/midi.js` - RxJS migration, unsubscribe fix
- `src/js/services/control.js` - RxJS migration, unsubscribe fix
- `src/js/services/stt.js` - RxJS migration, unsubscribe fix
- `src/js/util/pocket.js` - RxJS migration
- `src/js/util/midi.js` - RxJS migration
- `src/js/util/time.js` - RxJS migration
- `src/js/util/file.js` - RxJS migration
- `src/js/util/gamepad.js` - RxJS migration
- `src/js/util/recorder.js` - Cleanup debug logs
- `src/js/actions/wave-editor/index.js` - RxJS migration
- `src/js/actions/midi-map/index.js` - RxJS migration
- `.github/workflows/deploy.yml` - Created
- `playwright.config.js` - Created/updated
- `test/recording.e2e.test.js` - Created
- `test/recorder.e2e.test.js` - Created

### Deleted Files (3)
- `src/js/util/app.js` - Replaced by iblokz-state
- `.github/workflows/ci.yml` - Wrong pattern
- `test/test-recording-function.e2e.test.js` - Replaced by unit test

---

## Conclusion

Phase 1 and Phase 2 are **complete and working**. The codebase is now:
- ✅ Using modern RxJS v7
- ✅ Using `iblokz-state` for state management
- ✅ Using `iblokz-snabbdom-helpers` v2.0.0
- ✅ Recording functionality working correctly
- ✅ All tests passing
- ✅ Ready for Phase 3 (audio library migration)

The refactoring was successful, with all critical functionality working and tests passing.
