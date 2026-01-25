# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-01-25

### Added
- E2E testing infrastructure with Playwright
- Recording functionality E2E tests
- Recorder utility unit tests
- Wavesurfer E2E tests (sample loading, cropping, multiple samples, empty pad handling)
- GitHub Pages deployment workflow
- Comprehensive error handling for async actions
- `distinctUntilChanged` comparison function for reliable state filtering
- LICENSE file (AGPL-3.0)
- CHANGELOG.md with full project history
- Comprehensive README.md documentation
- Screenshot automation script for documentation

### Changed
- Migrated from RxJS v4 (rx) to RxJS v7 (rxjs)
- Migrated to `iblokz-state` for state management
- Updated `iblokz-data` from `^1.2.0` to `^1.6.0`
- Updated `iblokz-snabbdom-helpers` from `^1.2.0` to `^2.0.0`
- Updated all RxJS operators to use `.pipe()` method
- Updated all subscriptions to use `.unsubscribe()` (RxJS v7 API)
- Replaced custom state management with `createState()` and `attach()`
- Switched license from MIT to AGPL-3.0
- Improved consistency: added `updated: new Date()` to pad sample loading

### Fixed
- Fixed recording functionality - samples now load correctly into pads after recording
- Fixed "change is not a function" errors when loading samples from search
- Fixed `distinctUntilChanged` operator to use comparison function form for reliable filtering
- Fixed RxJS v7 API usage: replaced `.dispose()` with `.unsubscribe()` in all services
- Fixed error handling in async actions to always return reducer functions
- Fixed wavesurfer `distinctUntilChanged` operators (RxJS v7 compatibility)
  - Changed `sampleChange$` to use comparison function form
  - Fixed `session.playing` distinctUntilChanged
  - Fixed `wavesurfer$` element distinctUntilChanged
- Fixed wavesurfer sample loading - samples now properly load and display waveforms
- Improved wavesurfer error handling for missing samples and invalid formats

### Removed
- Removed custom state management utility (`src/js/util/app.js`)
- Removed `testRecording` function (replaced with proper unit tests)
- Removed debug console.log statements
- Removed redundant test files (`test-browser.js`, `test-screenshot.png`)

## [Pre-1.0.0] - 2018-2025

### 2018 (Initial Development)
- **November 2018**: Created for Abbey Road Hackathon
- **Won**: "Best use of Audio Commons" prize at Abbey Road Hackathon
- Initial implementation with Audio Commons integration
- 16 MPC-styled MIDI-enabled pads
- Sample search from Audio Commons API
- Basic pad triggering functionality
- Waveform visualization

### 2019-2024 (Development Period)
- UI improvements and refinements
- MIDI device selection and configuration
- Sound device choice implementation
- Basic sampling functionality
- Board multiple samples support
- Pads assigned visual indicators
- Controls unification
- Wave editor improvements
- Effects implementation (VCF, Reverb)
- Dependency security updates
- Build system improvements

### 2025 (Modernization)
- Dependency updates and maintenance
- Code cleanup and refactoring
- Preparation for standardization (Phase 1 & 2 planning)
