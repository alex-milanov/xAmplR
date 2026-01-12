# xAmplR Standardization Implementation Plan

**Date:** 2026-01-12  
**Status:** Planning  
**Reference:** `summaries/2026-01-12-01-standardization-analysis.md`

## Overview

Implementation plan to align xAmplR with workspace standards: update dependencies, migrate from RxJS v4 to v7, migrate to `iblokz-state` and `iblokz-audio`, and add CI/CD.

**Phase Order is Critical:**
- Phase 1: Foundation (iblokz-data + CI)
- Phase 2: RxJS migration (rx → rxjs) → iblokz-state → snabbdom-helpers v2.0
- Phase 3: Audio library migration (iblokz-audio)
- Phase 4: Optional improvements (wavesurfer, etc.)

**Important:** `iblokz-snabbdom-helpers@^2.0.0` requires RxJS v7, so the rx → rxjs migration must happen before updating snabbdom-helpers.

---

## Phase 1: Foundation (Quick Wins)

**Goal:** Update iblokz-data and add CI/CD infrastructure  
**Estimated Time:** 1-2 hours  
**Risk:** Low

### Task 1.1: Update iblokz-data

**Actions:**
1. Update `package.json`:
   - `iblokz-data`: `^1.2.0` → `^1.6.0`

2. Run `pnpm install`

3. Test application for breaking changes

4. Commit: `chore: update iblokz-data to latest version`

**Files:**
- `package.json`

**Testing:**
- Verify app starts and builds
- Check for console errors
- Test basic functionality

---

### Task 1.2: Add GitHub Actions CI

**Actions:**
1. Create `.github/workflows/ci.yml`

2. Set up workflow:
   - Test on Node 18.x, 20.x (xAmplR may not need 22.x)
   - Setup pnpm
   - Install dependencies
   - Run linter (if script exists, or add one)
   - Build with Parcel
   - Optional: Add lint script to `package.json` if missing

3. Test workflow locally (optional, using `act` or push to test branch)

4. Commit: `ci: add GitHub Actions workflow for build and lint`

**Files:**
- `.github/workflows/ci.yml` (new)
- `package.json` (add lint script if missing)

**Workflow Template:**
```yaml
name: CI

on:
  push:
    branches: [ master, main ]
  pull_request:
    branches: [ master, main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 9
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'pnpm'
    
    - name: Install dependencies
      run: pnpm install
    
    - name: Run linter
      run: pnpm run lint
      continue-on-error: true  # If lint script doesn't exist yet
    
    - name: Build
      run: pnpm run build
```

**Testing:**
- Push to test branch or create PR to verify workflow runs
- Check that build succeeds

---

## Phase 2: RxJS Migration and State Management

**Goal:** Migrate from RxJS v4 (rx) to RxJS v7, then migrate to `iblokz-state` and update `iblokz-snabbdom-helpers`  
**Estimated Time:** 4-8 hours total  
**Risk:** Medium (requires thorough testing)

**Important Note:** `iblokz-snabbdom-helpers@^2.0.0` uses RxJS v7, not RxJS v4 (rx). We must migrate to RxJS v7 first before updating snabbdom-helpers to avoid compatibility errors.

### Task 2.1: Migrate from rx to rxjs

**Goal:** Replace RxJS v4 (rx) with RxJS v7 (rxjs)  
**Why First:** `iblokz-snabbdom-helpers@^2.0.0` requires RxJS v7, so we need to migrate before updating snabbdom-helpers

**Pre-migration:**
1. Review current RxJS v4 usage:
   - Search for `require('rx')` or `require('rx/dist/rx')`
   - List all files using RxJS v4
   - Document current RxJS API usage patterns

**Actions:**
1. Add dependency:
   ```bash
   pnpm add rxjs@^7.8.0
   ```

2. Update imports in all files:
   - `require('rx')` → `require('rxjs')`
   - `require('rx/dist/rx')` → `require('rxjs')`
   - Update Observable imports: `Rx.Observable` → `Observable` from `rxjs`
   - Update Subject imports: `Rx.Subject` → `Subject` from `rxjs`
   - Update BehaviorSubject imports: `Rx.BehaviorSubject` → `BehaviorSubject` from `rxjs`

3. Update RxJS API calls:
   - Check for API differences between v4 and v7
   - Update operator usage if needed (most operators should be compatible)
   - Update subscription patterns if needed

4. Remove old dependency:
   - Remove `rx@^4.1.0` from `package.json`

5. Run `pnpm install`

6. Test application:
   - Verify app starts without errors
   - Test state management functionality
   - Check for console errors

7. Commit: `feat: migrate from rx (v4) to rxjs (v7)`

**Files to Update:**
- `package.json` (add rxjs, remove rx)
- `src/js/index.js` (main state management)
- `src/js/services/*.js` (any services using RxJS)
- Any other files importing `rx`

**Testing Checklist:**
- [ ] App starts without errors
- [ ] State management works correctly
- [ ] Observables and Subjects work
- [ ] No console errors
- [ ] UI updates reactively

**Rollback Plan:**
- Keep old `rx` dependency in backup branch
- Can revert commit if issues found

---

### Task 2.2: Migrate to `iblokz-state`

**Goal:** Replace custom RxJS state management with `iblokz-state`  
**Complexity:** Medium-High (larger refactor)

**Pre-migration:**
1. Review current state management:
   - Read `src/js/index.js` to understand current pattern
   - Review `src/js/util/app.js` (if exists)
   - List all actions and their structure
   - Document current state shape

2. Review `iblokz-state` patterns:
   - Read `iblokz-state/README.md`
   - Review `jam-station/src/js/index.js` as reference
   - Understand `createState()` and `attach()` APIs

**Actions:**
1. Add dependency:
   ```bash
   pnpm add iblokz-state@^1.1.0
   ```

2. Convert actions to action tree pattern:
   - Update `src/js/actions/index.js`
   - Convert actions to return reducer functions
   - Add `initial` state to action tree
   - Organize nested actions if needed

3. Update `src/js/index.js`:
   - Replace custom state management with `createState()`
   - Use `attach()` for service actions
   - Update service hooks to use `iblokz-state` pattern
   - Remove old RxJS state management code

4. Update services:
   - Update service hooks to work with `iblokz-state`
   - Services should export `actions` object (action tree)
   - Update `hook()` functions to use new state$ pattern

5. Test state management:
   - State updates work
   - Actions dispatch correctly
   - Services hook properly
   - UI updates reactively

6. Commit: `feat: migrate to iblokz-state for state management`

**Files to Update:**
- `package.json` (add `iblokz-state`)
- `src/js/index.js` (main refactor)
- `src/js/actions/index.js` (convert to action tree)
- `src/js/actions/**/*.js` (update action structure)
- `src/js/services/*.js` (update hooks and actions)
- `src/js/util/app.js` (may no longer be needed)

**Testing Checklist:**
- [ ] App starts without errors
- [ ] Initial state loads correctly
- [ ] Actions dispatch and update state
- [ ] UI reacts to state changes
- [ ] Services hook properly
- [ ] No console errors
- [ ] Hot reloading works (if applicable)

**Rollback Plan:**
- Keep old state management code in backup branch
- Can revert commit if issues found
- Test thoroughly before removing old code

---

### Task 2.3: Update iblokz-snabbdom-helpers

**Goal:** Update to `iblokz-snabbdom-helpers@^2.0.0` (requires RxJS v7)  
**Why After RxJS Migration:** Version 2.0 uses RxJS v7, not RxJS v4, so this must come after Task 2.1

**Actions:**
1. Update `package.json`:
   - `iblokz-snabbdom-helpers`: `^1.2.0` → `^2.0.0`

2. Run `pnpm install`

3. Review breaking changes:
   - Check `iblokz-snabbdom-helpers` changelog or README
   - Look for API changes between v1 and v2

4. Update code if needed:
   - Update imports if API changed
   - Update function calls if signatures changed
   - Test all snabbdom helper usage

5. Test application:
   - Verify app starts without errors
   - Test UI rendering
   - Check for console errors
   - Test all components using snabbdom helpers

6. Commit: `chore: update iblokz-snabbdom-helpers to v2.0.0`

**Files to Update:**
- `package.json`
- Any files using `iblokz-snabbdom-helpers` (check for API changes)

**Testing Checklist:**
- [ ] App starts without errors
- [ ] UI renders correctly
- [ ] All components work
- [ ] No console errors
- [ ] No RxJS compatibility errors

**Note:** This should work smoothly now that we're on RxJS v7 (from Task 2.1).

---

## Phase 3: Audio Library Migration

**Goal:** Migrate to `iblokz-audio`  
**Estimated Time:** 4-6 hours  
**Risk:** Medium (requires thorough testing)

### Task 3.1: Migrate to `iblokz-audio`

**Goal:** Replace custom audio utilities with `iblokz-audio` library  
**Reference:** `jam-station/summaries/2025-12-07-01-audio-library-reintegration.md`

**Pre-migration:**
1. Review current audio usage:
   - Search for `require('../util/audio')`
   - Search for `require('../util/audio/sources/sampler')`
   - List all files using audio utilities
   - Document current audio API usage

**Actions:**
1. Add dependency:
   ```bash
   pnpm add iblokz-audio@^0.1.0
   ```

2. Update imports in all files:
   - `require('../util/audio')` → `require('iblokz-audio')`
   - `require('../util/audio/sources/sampler')` → `require('iblokz-audio').sampler`

3. Update audio API calls:
   - Check `iblokz-audio` API documentation
   - Update effect creation (VCF, Reverb, etc.)
   - Update audio context usage
   - Update sampler usage

4. Test audio functionality:
   - Audio playback
   - Effects (VCF, Reverb)
   - Sampler functionality
   - WaveSurfer integration
   - MIDI integration

5. Remove old audio utilities:
   - Delete `src/js/util/audio/` directory

6. Commit: `feat: migrate to iblokz-audio library`

**Files to Update:**
- `package.json` (add dependency)
- `src/js/services/audio.js`
- `src/js/services/wavesurfer.js` (if uses audio)
- `src/js/services/pads.js` (if uses audio)
- Any other files importing audio utilities
- `src/js/util/audio/` (delete entire directory)

**Testing Checklist:**
- [ ] App starts without errors
- [ ] Audio context initializes
- [ ] Sample playback works
- [ ] Effects (VCF, Reverb) work
- [ ] WaveSurfer displays waveforms
- [ ] MIDI triggers audio
- [ ] No console errors

**Rollback Plan:**
- Keep old `util/audio/` directory in a backup branch
- Can revert commit if issues found

**Goal:** Replace custom RxJS state management with `iblokz-state`  
**Complexity:** Medium-High (larger refactor)

**Pre-migration:**
1. Review current state management:
   - Read `src/js/index.js` to understand current pattern
   - Review `src/js/util/app.js` (if exists)
   - List all actions and their structure
   - Document current state shape

2. Review `iblokz-state` patterns:
   - Read `iblokz-state/README.md`
   - Review `jam-station/src/js/index.js` as reference
   - Understand `createState()` and `attach()` APIs

**Actions:**
1. Add dependency:
   ```bash
   pnpm add iblokz-state@^1.1.0
   ```

2. Convert actions to action tree pattern:
   - Update `src/js/actions/index.js`
   - Convert actions to return reducer functions
   - Add `initial` state to action tree
   - Organize nested actions if needed

3. Update `src/js/index.js`:
   - Replace custom state management with `createState()`
   - Use `attach()` for service actions
   - Update service hooks to use `iblokz-state` pattern
   - Remove old RxJS v4 state management code

4. Update services:
   - Update service hooks to work with `iblokz-state`
   - Services should export `actions` object (action tree)
   - Update `hook()` functions to use new state$ pattern

5. Remove RxJS v4 dependency:
   - Remove `rx@^4.1.0` from `package.json`
   - `iblokz-state` uses RxJS v7 internally

6. Test state management:
   - State updates work
   - Actions dispatch correctly
   - Services hook properly
   - UI updates reactively

7. Commit: `feat: migrate to iblokz-state for state management`

**Files to Update:**
- `package.json` (add `iblokz-state`, remove `rx`)
- `src/js/index.js` (main refactor)
- `src/js/actions/index.js` (convert to action tree)
- `src/js/actions/**/*.js` (update action structure)
- `src/js/services/*.js` (update hooks and actions)
- `src/js/util/app.js` (may no longer be needed)

**Testing Checklist:**
- [ ] App starts without errors
- [ ] Initial state loads correctly
- [ ] Actions dispatch and update state
- [ ] UI reacts to state changes
- [ ] Services hook properly
- [ ] No console errors
- [ ] Hot reloading works (if applicable)

**Rollback Plan:**
- Keep old state management code in backup branch
- Can revert commit if issues found
- Test thoroughly before removing old code

**Note:** This is a larger refactor. Consider doing this after `iblokz-audio` migration is stable.

---

## Phase 4: Optional Improvements (Future)

**Goal:** Optional improvements and dependency updates  
**Priority:** Low  
**Estimated Time:** Variable

### Task 4.1: Update Wavesurfer (Optional)

**Actions:**
1. Review current wavesurfer usage:
   - Check `src/js/services/wavesurfer.js`
   - Document current API usage
   - Check for breaking changes in wavesurfer.js v7

2. Update `package.json`:
   - `wavesurfer.js`: `^2.1.0` → `^7.8.3`
   - Remove duplicate `wavesurfer@^1.3.4` package if still present

3. Update code if needed:
   - Check wavesurfer.js v7 migration guide
   - Update API calls if breaking changes
   - Test wave editor functionality

4. Run `pnpm install`

5. Test wave editor:
   - Waveform display
   - Playback controls
   - Editing functionality

6. Commit: `chore: update wavesurfer.js to v7.8.3`

**Files to Update:**
- `package.json`
- `src/js/services/wavesurfer.js` (if API changes)
- Check for any other files using wavesurfer

**Note:** This is optional and can be done later if needed. The current version may work fine.

---

### Task 4.2: Update Other Dependencies (Optional)

**Actions:**
1. Update `package.json`:
   - `uuid`: `^3.3.2` → `^10.0.0` (if still using v3)

2. Update code if needed:
   - Check UUID v10 API changes
   - Update imports if needed

3. Run `pnpm install`

4. Test application

5. Commit: `chore: update uuid to v10`

**Note:** Only update if needed. Current versions may work fine.

---

### Task 4.3: ES6 Modules Migration (Optional)

**Actions:**
1. Convert files incrementally to ES6 modules
2. Start with new files, then migrate existing ones
3. Update imports/exports
4. Test after each file conversion

**Priority:** Can wait until other migrations are stable

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Task 1.1: Update iblokz-data
- [ ] Task 1.2: Add GitHub Actions CI

### Phase 2: RxJS Migration and State Management
- [ ] Task 2.1: Migrate from rx to rxjs
- [ ] Task 2.2: Migrate to `iblokz-state`
- [ ] Task 2.3: Update iblokz-snabbdom-helpers

### Phase 3: Audio Library Migration
- [ ] Task 3.1: Migrate to `iblokz-audio`

### Phase 4: Optional Improvements
- [ ] Task 4.1: Update Wavesurfer (optional)
- [ ] Task 4.2: Update Other Dependencies (optional)
- [ ] Task 4.3: ES6 Modules migration (optional)

---

## Testing Strategy

### After Each Phase:
1. **Manual Testing:**
   - Start application
   - Test core functionality
   - Check for console errors
   - Verify audio works
   - Verify UI updates

2. **Build Verification:**
   - Run `pnpm run build`
   - Check for build errors
   - Verify dist/ output

3. **CI Verification:**
   - Push changes
   - Verify GitHub Actions passes

### Before Committing:
- [ ] Code works locally
- [ ] No console errors
- [ ] Build succeeds
- [ ] Basic functionality tested
- [ ] Commit message follows conventional commits

---

## Risk Mitigation

### For RxJS Migration (Phase 2.1):
- **Critical:** Must be done before updating snabbdom-helpers
- Test all Observable/Subject usage thoroughly
- Check for API differences between v4 and v7
- Keep old `rx` dependency in backup branch
- Can revert if issues found

### For State Migration (Phase 2.2):
- Do incrementally if possible
- Test after each major change
- Keep old code in backup branch
- Review `iblokz-state` docs carefully

### For Snabbdom-Helpers Update (Phase 2.3):
- **Must come after RxJS migration** - v2.0 requires RxJS v7
- Review breaking changes between v1 and v2
- Test all UI components using snabbdom helpers
- Can revert if issues found

### For Audio Migration (Phase 3):
- Test audio functionality thoroughly
- Reference jam-station implementation
- Keep old code in backup branch
- Can revert if issues found

### General:
- Commit after each task (not all at once)
- Test thoroughly before moving to next task
- Use feature branches for larger changes
- Get code review if possible
- **Follow phase order strictly** - dependencies matter

---

## Success Criteria

### Phase 1 Complete:
- ✅ `iblokz-data` updated to latest version
- ✅ CI workflow runs successfully
- ✅ Build passes in CI

### Phase 2 Complete:
- ✅ Migrated from rx (v4) to rxjs (v7)
- ✅ Using `iblokz-state` for state management
- ✅ `iblokz-snabbdom-helpers` updated to v2.0.0
- ✅ No RxJS v4 dependency
- ✅ All functionality works
- ✅ Code is cleaner and more maintainable

### Phase 3 Complete:
- ✅ Using `iblokz-audio` instead of custom utilities
- ✅ All audio functionality works
- ✅ Old audio utilities removed

### Overall:
- ✅ xAmplR aligned with workspace standards
- ✅ Consistent with jam-station, mega-synth, world-metronome
- ✅ Easier to maintain and extend
- ✅ Shared improvements from iblokz libraries

---

## Next Steps

1. **Start with Phase 1** - Quick wins, low risk (iblokz-data + CI)
2. **Phase 2** - Critical: Migrate rx → rxjs first, then iblokz-state, then snabbdom-helpers
3. **Phase 3** - Migrate to iblokz-audio (separate phase for audio)
4. **Phase 4** - Optional improvements (wavesurfer, etc.)
5. **Execute incrementally** - One task at a time
6. **Test thoroughly** - After each change
7. **Document issues** - If any problems arise

**Important:** Phase 2 order is critical - must do rx → rxjs before updating snabbdom-helpers to v2.0.0, as v2.0 requires RxJS v7.

---

## References

- `summaries/2026-01-12-01-standardization-analysis.md` - Full analysis
- `jam-station/summaries/2025-12-07-01-audio-library-reintegration.md` - Audio migration example
- `jam-station/src/js/index.js` - State management reference
- `iblokz-state/README.md` - State library docs
- `iblokz-audio/README.md` - Audio library docs
