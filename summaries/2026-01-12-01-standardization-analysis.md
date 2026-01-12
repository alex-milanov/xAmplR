# xAmplR Standardization Analysis

**Date:** 2026-01-12  
**Status:** Analysis Complete

## Overview

Analysis of what xAmplR needs to align with common workspace patterns used across iblokz libraries and other music projects (jam-station, mega-synth, world-metronome).

---

## Current State vs. Standard

### 1. Audio Library

| Aspect | xAmplR (Current) | Standard (jam-station) | Action Needed |
|--------|------------------|------------------------|---------------|
| **Library** | Custom `util/audio/core.js` | `iblokz-audio@^0.1.0` | ✅ **Migrate** |
| **Usage** | `require('../util/audio')` | `require('iblokz-audio')` | Replace imports |
| **Sampler** | Custom `util/audio/sources/sampler` | `require('iblokz-audio').sampler` | Replace imports |
| **Effects** | Custom implementations | `iblokz-audio` (VCF, Reverb, LFO, etc.) | Use library |

**Benefits of Migration:**
- ✅ Single source of truth for audio utilities
- ✅ Shared improvements across projects
- ✅ Better tested and maintained
- ✅ Consistent API across workspace
- ✅ ~500+ lines of duplicate code removed

**Reference:** See `jam-station/summaries/2025-12-07-01-audio-library-reintegration.md`

---

### 2. Reactive Framework (RxJS)

| Aspect | xAmplR (Current) | Standard | Action Needed |
|--------|------------------|----------|---------------|
| **Library** | `rx@^4.1.0` (RxJS v4) | `rxjs@^7.8.1` (RxJS v7) | ⚠️ **Upgrade** |
| **Pattern** | `Rx.Observable`, `Rx.BehaviorSubject` | `rxjs` operators, `BehaviorSubject` | Update imports |
| **API** | Old RxJS v4 API | Modern RxJS v7 API | Update code |

**Breaking Changes:**
- RxJS v4 → v7 has significant API changes
- Operators are now separate imports (`rxjs/operators`)
- Observable creation methods changed
- Requires careful migration

**Migration Complexity:** ⚠️ **HIGH** - Breaking changes, needs testing

**Alternative:** Consider migrating to `iblokz-state` instead (see below)

---

### 3. State Management

| Aspect | xAmplR (Current) | Standard (jam-station) | Action Needed |
|--------|------------------|------------------------|---------------|
| **Library** | Custom RxJS pattern | `iblokz-state@^1.1.0` | ✅ **Migrate** |
| **Pattern** | Manual `BehaviorSubject` + `scan` | `createState()` action tree | Replace pattern |
| **Actions** | Custom `app.adapt()` pattern | `iblokz-state` `adapt()` | Use library |

**Benefits:**
- ✅ Standardized state management
- ✅ Action tree pattern (auto-dispatching)
- ✅ Built-in localStorage/sessionStorage support
- ✅ Event-driven (microfrontend ready)
- ✅ Less boilerplate code

**Note:** This migration would also solve the RxJS upgrade issue since `iblokz-state` uses RxJS v7 internally.

---

### 4. Module System

| Aspect | xAmplR (Current) | Standard | Action Needed |
|--------|------------------|----------|---------------|
| **Format** | CommonJS (`require`/`module.exports`) | Mixed: CommonJS + ES6 (migrating) | ⚠️ **Optional** |
| **New Code** | CommonJS | ES6 Modules (`import`/`export`) | Consider migration |

**Migration Priority:** ⚠️ **LOW** - Not critical, can be done incrementally

---

### 5. Dependencies Versions

| Library | xAmplR | Standard | Action Needed |
|---------|--------|----------|---------------|
| `iblokz-data` | `^1.2.0` | `^1.6.0` | ✅ **Update** |
| `iblokz-snabbdom-helpers` | `^1.2.0` | `^2.0.0` | ✅ **Update** |
| `wavesurfer.js` | `^2.1.0` (also has `wavesurfer@^1.3.4`) | `^7.8.3` | ✅ **Update & Clean** |
| `uuid` | `^3.3.2` | `^10.0.0` | ✅ **Update** |

**Issues:**
- Duplicate wavesurfer packages (`wavesurfer` + `wavesurfer.js`)
- Outdated iblokz library versions
- Old uuid version

---

### 6. GitHub Actions / CI/CD

| Aspect | xAmplR | Standard (iblokz libraries) | Action Needed |
|--------|--------|----------------------------|---------------|
| **CI Setup** | ❌ None | ✅ GitHub Actions | ✅ **Add** |
| **Tests** | ❌ None | ✅ Mocha tests | ⚠️ **Consider** |
| **Linting** | ⚠️ ESLint config exists | ✅ `pnpm run lint` | ✅ **Add to CI** |
| **Build** | ✅ Parcel build | ✅ Build in CI | ✅ **Add to CI** |

**For xAmplR (application, not library):**
- Build verification
- Linting
- Optional: E2E tests (like jam-station uses Playwright)

---

### 7. Build System

| Aspect | xAmplR | Standard | Status |
|--------|--------|----------|--------|
| **Bundler** | Parcel v2 | Parcel v2 | ✅ **Aligned** |
| **Package Manager** | pnpm | pnpm | ✅ **Aligned** |
| **Config** | `.parcelrc` | `.parcelrc` | ✅ **Aligned** |

**Status:** ✅ Already aligned after recent migration

---

## Migration Priority Summary

### High Priority (Core Functionality)

1. **Migrate to `iblokz-audio`** ⭐
   - **Impact:** High - Removes duplicate code, enables shared improvements
   - **Complexity:** Medium - Requires testing audio functionality

2. **Migrate to `iblokz-state`** ⭐
   - **Impact:** High - Standardizes state management, solves RxJS upgrade
   - **Complexity:** Medium-High - Requires refactoring state management

3. **Update dependency versions**
   - **Impact:** Medium - Security, bug fixes, new features
   - **Complexity:** Low - Mostly drop-in replacements

### Medium Priority (Quality & Consistency)

4. **Add GitHub Actions CI**
   - **Impact:** Medium - Automated testing, build verification
   - **Complexity:** Low - Standard workflow template

5. **Clean up duplicate dependencies**
   - Remove duplicate `wavesurfer` packages

### Low Priority (Nice to Have)

6. **ES6 Modules migration**
   - **Impact:** Low - Modern syntax, better tree-shaking
   - **Complexity:** Medium - Can be done incrementally

---

## Benefits Summary

### After Full Migration:

✅ **Code Reduction:**
- ~500 lines removed (audio utilities)
- Less boilerplate (state management)

✅ **Consistency:**
- Same libraries as jam-station, mega-synth, world-metronome
- Shared improvements across projects
- Easier to maintain

✅ **Modern Stack:**
- RxJS v7 (via iblokz-state)
- Latest iblokz library versions
- Standard CI/CD

✅ **Maintainability:**
- Single source of truth for audio utilities
- Standardized state management patterns
- Better tested libraries

---

## Risks & Considerations

### RxJS v4 → v7 Upgrade
- **Risk:** Breaking API changes
- **Mitigation:** Migrate to `iblokz-state` first (uses RxJS v7 internally)

### State Management Refactor
- **Risk:** Large refactor, could introduce bugs
- **Mitigation:** Do incrementally, test thoroughly
- **Benefit:** Solves RxJS upgrade issue, standardizes patterns

### Audio Library Migration
- **Risk:** Audio functionality could break
- **Mitigation:** Test thoroughly, reference jam-station implementation
- **Benefit:** Removes duplicate code, enables shared improvements

---

## References

- `jam-station/summaries/2025-12-07-01-audio-library-reintegration.md` - Audio migration example
- `jam-station/src/js/index.js` - State management pattern
- `iblokz-state/README.md` - State management library docs
- `iblokz-audio/README.md` - Audio library docs
- `iblokz-state/.github/workflows/ci.yml` - CI workflow template
