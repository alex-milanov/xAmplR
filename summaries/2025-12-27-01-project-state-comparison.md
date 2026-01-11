# Project State Summary & Comparison

## Current State: xAmplR vs jam-station

### Overview

**xAmplR** - Sample-based audio workstation with waveform editing
**jam-station** - Multi-track sequencer with synth and sampler capabilities

---

## Architecture Comparison

### State Management

| Aspect | xAmplR | jam-station |
|--------|--------|-------------|
| **Reactive Framework** | RxJS v4 (Rx.Observable) | RxJS v7 (BehaviorSubject, Subject) |
| **Module System** | CommonJS (require/module.exports) | Mixed: CommonJS + ES6 Modules (migrating) |
| **State Pattern** | Observable streams with scan/reduce | BehaviorSubject with scan |
| **Actions** | Function-based reducers | Function-based reducers (same pattern) |

### Audio Architecture

| Aspect | xAmplR | jam-station |
|--------|--------|-------------|
| **Audio Library** | Custom `util/audio` (core.js) | `iblokz-audio` (external package) |
| **Effects System** | Hardcoded rack (vcf, reverb) | **Dynamic effectsChain array** (NEW) |
| **Effects Structure** | Flat object in `state.rack` | **Nested array with IDs** (NEW) |
| **Node Management** | Direct Web Audio API | ID-based node management via `nodes.js` util |
| **Sampler** | Custom `util/audio/sources/sampler` | `iblokz-audio.sampler` |

### Instrument Structure

#### xAmplR
```javascript
rack: {
  vcf: { on: false, type: 'lowpass', cutoff: 0.64, ... },
  reverb: { on: false, seconds: 3, decay: 2, ... }
}
```
- **Static effects**: Fixed VCF and Reverb
- **Global state**: Single rack for all pads
- **No per-track effects**: Effects apply globally

#### jam-station (Recent Changes)
```javascript
instrument: {
  sourceType: 'synth' | 'sampler',
  source: {
    vco1: {...}, vco2: {...}, vca1: {...}, vca2: {...}, // synth
    sampler: { file: '...' }, vca: {...} // sampler
  },
  effectsChain: [
    { id: 'uuid', type: 'vcf', on: true, cutoff: 0.64, ... },
    { id: 'uuid', type: 'reverb', on: true, seconds: 3, ... },
    { id: 'uuid', type: 'lfo', on: false, frequency: 5, ... }
  ]
}
```
- **Dynamic effects**: Array-based, can add/remove/reorder
- **Per-track**: Each track has its own instrument with effectsChain
- **ID-based**: Each effect has unique ID for node management
- **Session persistence**: Effects stored per track in `session.tracks[].inst`

---

## Recent Changes: jam-station

### 1. Effects Chain System (Major Refactor)

**Before:**
- Hardcoded effects (vcf, reverb, lfo) in global state
- Effects applied globally to all tracks

**After:**
- Dynamic `effectsChain` array with ID-based management
- Per-track effects stored in `session.tracks[].inst.effectsChain`
- UI supports drag-and-drop reordering (SortableJS)
- Effects can be added, removed, reordered, and toggled

**Implementation:**
- `src/js/services/audio/util/nodes.js` - ID-based node storage
- `syncEffectsChain()` - Syncs audio nodes with instrument config
- `updateConnections()` - Dynamic routing based on effectsChain
- `updatePrefs()` - Updates effect properties

### 2. Session & Instrument Integration

**Changes:**
- `selection.instr` - New selection type for instrument editing
- Session tracks store instrument state: `tracks[].inst`
- Instrument UI connected to selected track via `selection.instr`
- Visual feedback: `.instr-selected` class on session grid cells

**Files Modified:**
- `src/js/actions/session/index.js` - Added `selection.instr` logic
- `src/js/services/session.js` - Syncs instrument to `selection.instr` track
- `src/js/ui/session/index.js` - Visual highlighting for instrument selection

### 3. Audio Service Refactoring

**Structure:**
```
services/audio/
  ├── index.js (main service)
  └── util/
      ├── nodes.js (ID-based node management)
      ├── engine.js (WIP)
      └── group.js (WIP)
```

**Key Features:**
- Modular structure with utility modules
- ID-based node management (matches effect IDs)
- Dynamic effects routing (respects `instr.source.chains` and `instr.effectsChain`)
- Sampler track (channel 0) now uses effectsChain system

### 4. WaveSurfer Integration

**Status:** Converted to ES6 modules, basic implementation
- Component: `src/js/ui/instrument/sampler/index.js`
- Uses `state.sequencer.channel` for sample selection
- Loads from `sampleBank` pocket or URL fallback

**Issues:**
- Preloaded samples work
- Newly loaded samples from media library need proper integration
- Sample source should come from `state.instrument.source.sampler.file` (not yet implemented)

---

## xAmplR Current State

### Uncommitted Changes

1. **Build System Migration**
   - Deleted `.babelrc`
   - Added `.parcelrc`
   - Migrated from npm to pnpm (`pnpm-lock.yaml`)

2. **New Features**
   - `api/` - Express API server (untracked)
   - `cloud/` - Cloud functions (Go, Ruby) (untracked)
   - `src/js/actions/wave-editor/` - Wave editor actions (untracked)

3. **Modified Services**
   - `services/audio.js` - Audio loading/cropping
   - `services/samples.js` - Sample management
   - `services/wavesurfer.js` - Waveform visualization

4. **UI Updates**
   - `ui/board/index.js` - Sample browser
   - `ui/header/index.js` - Header controls
   - `ui/waveditor/index.js` - Wave editor

### Architecture Notes

**Effects System:**
- Static rack with VCF and Reverb
- Effects are global, not per-pad
- No dynamic effects chain

**WaveSurfer:**
- Service-based pattern with RxJS observables
- Waits for container with `$.interval(100).map(() => document.querySelector('#waveform'))`
- Uses plugins (Timeline, Regions)
- Loads samples from `sampleBank` pocket

**Audio Graph:**
- Custom audio utilities in `util/audio/`
- Direct Web Audio API usage
- Effects created via `a.create('vcf')`, `a.create('reverb')`
- Manual connection: `a.connect(vcf, reverb)`

---

## Key Differences

### 1. Effects Management

| Feature | xAmplR | jam-station |
|---------|--------|-------------|
| Effects Structure | Static object | Dynamic array |
| Per-Track Effects | ❌ No | ✅ Yes |
| Effects Reordering | ❌ No | ✅ Yes (drag-and-drop) |
| Effects IDs | ❌ No | ✅ Yes (UUID-based) |
| Add/Remove Effects | ❌ No | ✅ Yes |

### 2. Session Management

| Feature | xAmplR | jam-station |
|---------|--------|-------------|
| Session Structure | Single sample + pads | Multi-track with measures |
| Track Types | N/A | synth, piano, seq, sampler |
| Selection System | `pads.focused` | `selection.piano`, `selection.seq`, `selection.instr` |
| Persistence | Pads map | Tracks with measures and instruments |

### 3. WaveSurfer Integration

| Aspect | xAmplR | jam-station |
|--------|--------|-------------|
| Pattern | Service with RxJS | Component-based |
| Initialization | Observable stream waiting for container | Hook-based (insert/update) |
| Sample Source | `pads.map[focused].id` | `sequencer.channel` → `mediaLibrary.files` |
| Plugins | Timeline, Regions | None (basic) |

### 4. Module System

| Aspect | xAmplR | jam-station |
|--------|--------|-------------|
| Current | CommonJS | Mixed (migrating to ES6) |
| New Modules | CommonJS | ES6 Modules |
| Examples | All `require()` | `import/export` in new files |

---

## Recommendations

### For xAmplR

1. **Consider Effects Chain System**
   - Adopt jam-station's dynamic effectsChain pattern
   - Enable per-pad effects (currently global)
   - Add drag-and-drop reordering

2. **Module Migration**
   - Consider migrating to ES6 modules (like jam-station)
   - Better tree-shaking and modern tooling support

3. **Commit Current Changes**
   - Review and commit uncommitted changes
   - Document new API and cloud functions

### For jam-station

1. **Complete WaveSurfer Integration**
   - Fix sample source to use `instrument.source.sampler.file`
   - Improve sample loading from media library
   - Add WaveSurfer plugins if needed

2. **Continue ES6 Migration**
   - Convert remaining CommonJS modules
   - Standardize on ES6 modules

3. **Testing**
   - Add E2E tests for effects chain
   - Test session persistence
   - Test instrument selection across tracks

---

## Summary

**xAmplR** is a sample-focused workstation with static effects and pad-based workflow. It has uncommitted changes including API server and cloud functions.

**jam-station** recently added a dynamic effects chain system with per-track effects, ID-based node management, and improved session/instrument integration. It's migrating to ES6 modules and has better separation of concerns.

Both projects share similar reactive patterns (RxJS) and functional action reducers, but differ significantly in their effects management approach and session structure.

