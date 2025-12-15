# PHPStan Integration - Quick Start Guide

This guide provides immediate next steps for integrating PHPStan into OJS.

## What Was Created

✅ **Comprehensive Documentation**: `claude/PHPSTAN_INTEGRATION.md` (main reference)
✅ **Enhanced Configuration**: `lib/pkp/phpstan-enhanced.neon`
✅ **Bootstrap File**: `lib/pkp/includes/phpstan-bootstrap.php`
✅ **Analysis Scripts**: `lib/pkp/tools/phpstan/*.sh` (8 scripts)
✅ **Plugin Configuration**: `lib/pkp/phpstan-plugins.neon`
✅ **CI/CD Template**: `.github/workflows/phpstan.yml.example`

## Immediate Next Steps

### Step 1: Generate Baseline (First Time Setup)

```bash
cd lib/pkp

# Generate baseline to capture current state
./tools/phpstan/generate-baseline.sh
```

**What this does**: Creates `phpstan-baseline.neon` containing all existing errors, allowing you to start fresh without fixing everything immediately.

**Expected output**: Baseline file with potentially hundreds/thousands of errors (this is normal).

### Step 2: Update Configuration

Choose ONE of these options:

#### Option A: Use Enhanced Configuration (Recommended)
```bash
cd lib/pkp

# Backup current config
cp phpstan.neon phpstan.neon.backup

# Use enhanced config
cp phpstan-enhanced.neon phpstan.neon

# Edit to uncomment baseline include
# Uncomment line: - phpstan-baseline.neon
```

#### Option B: Manually Update Current Config

Add to your existing `lib/pkp/phpstan.neon`:

```neon
includes:
    - phpstan-baseline.neon

parameters:
    # Add these for better memory management
    parallel:
        jobSize: 10
        maximumNumberOfProcesses: 8
        processTimeout: 900.0

    excludePaths:
        analyseAndScan:
            - ../../cache/*
            - ../../node_modules/*
            - '*/templates/*'
            - '*/locale/*'
            - ../../cypress/*
```

### Step 3: Test Component Analysis

```bash
cd lib/pkp

# Test with a single component (smallest scope)
./tools/phpstan/analyze-api.sh
```

**Expected**: Should complete without memory errors. If it passes, you're good to go!

### Step 4: Run Full Component Analysis

```bash
cd lib/pkp

# Run all components
./tools/phpstan/analyze-all-components.sh
```

## Addressing Your Specific Problems

### Problem 1: Memory Exhaustion

**Your error**:
```
Fatal error: Allowed memory size of 536870912 bytes exhausted
```

**Solutions provided**:

1. **Component-based analysis** (prevents analyzing everything at once)
   ```bash
   ./tools/phpstan/analyze-core.sh    # Analyzes only core classes
   ./tools/phpstan/analyze-api.sh     # Analyzes only API
   ```

2. **Memory limit in scripts** (all scripts now use `-d memory_limit=2G`)

3. **Reduced parallelization** (phpstan-enhanced.neon sets `jobSize: 10`, `maximumNumberOfProcesses: 8`)

4. **Exclude unnecessary paths** (templates, cache, node_modules, etc.)

### Problem 2: Analysis Stuck at 99%

**Your issue**: Analysis freezes when analyzing everything.

**Solutions provided**:

1. **Timeout configuration**: `processTimeout: 900.0` (15 minutes per job)

2. **Smaller job sizes**: `jobSize: 10` instead of default 20

3. **Debug mode to find problematic files**:
   ```bash
   php lib/vendor/bin/phpstan analyse --debug -vvv classes/
   ```

4. **Exclude problematic files** if identified (add to `excludePaths`)

### Problem 3: Bootstrap Files

**Your question**: Do we need separate `bootstrapFiles`?

**Answer**: Yes, and it's been created for you:

- **`includes/bootstrap.php`**: Already exists, loads application
- **`includes/phpstan-bootstrap.php`**: NEW, contains PHPStan-specific stubs

**Usage**: Uncomment in `phpstan-enhanced.neon`:
```neon
bootstrapFiles:
    - includes/bootstrap.php
    - includes/phpstan-bootstrap.php  # Contains constant stubs
```

**When to add to it**: When PHPStan reports "Constant X not found", add the constant definition to `phpstan-bootstrap.php`.

### Problem 4: Better Output Presentation

**Your question**: Any better way to present outputs?

**Solutions provided**:

1. **Multiple output formats**:
   ```bash
   # JSON for CI/CD integration
   ./tools/phpstan/analyze-core.sh --error-format=json > report.json

   # Table for human reading (default)
   ./tools/phpstan/analyze-core.sh --error-format=table

   # GitHub annotations for PRs
   ./tools/phpstan/analyze-core.sh --error-format=github
   ```

2. **Report generation script**:
   ```bash
   ./tools/phpstan/generate-report.sh
   # Creates timestamped JSON + table reports in cache/phpstan-reports/
   ```

3. **Metrics tracking**:
   ```bash
   ./tools/phpstan/track-metrics.sh
   # Tracks error counts over time in CSV
   ```

4. **CI/CD integration**: See `.github/workflows/phpstan.yml.example`

## Configuration Highlights

### Enhanced phpstan.neon Features

```neon
parameters:
    level: 5  # Start here, gradually increase to 6, 7, 8

    # Memory-optimized parallel processing
    parallel:
        jobSize: 10              # Smaller batches
        maximumNumberOfProcesses: 8  # Fewer parallel processes
        processTimeout: 900.0    # 15-minute timeout

    # Comprehensive exclusions
    excludePaths:
        analyse:                 # Scanned for symbols, not analyzed
            - lib/vendor/*
        analyseAndScan:         # Completely excluded
            - cache/*
            - templates/*
            - locale/*
            - node_modules/*
            - cypress/*

    # Result caching
    tmpDir: ../../cache/phpstan

    # Relaxed rules (tighten gradually)
    checkMissingIterableValueType: false
    reportUnmatchedIgnoredErrors: false
```

## Recommended Workflow

### Daily Development

```bash
# Analyze only what you're working on
cd lib/pkp
./tools/phpstan/analyze-core.sh    # If working on core classes
./tools/phpstan/analyze-api.sh     # If working on API
```

### Weekly Progress

```bash
# Track improvement over time
cd lib/pkp
./tools/phpstan/track-metrics.sh
```

### Monthly Maintenance

```bash
# Fix some baseline errors, then regenerate
cd lib/pkp

# Fix 10-20 errors from baseline manually

# Regenerate baseline (removes fixed errors)
./tools/phpstan/generate-baseline.sh

# Verify new baseline works
php lib/vendor/bin/phpstan analyse
```

### Release Preparation

```bash
# Full analysis
cd lib/pkp
./tools/phpstan/analyze-all-components.sh
./tools/phpstan/generate-report.sh
```

## Troubleshooting Quick Reference

| Problem | Solution |
|---------|----------|
| Memory exhausted | Use component scripts, increase memory limit to 4G |
| Analysis stuck | Use `--debug -vvv`, increase `processTimeout` |
| Constant not found | Add to `includes/phpstan-bootstrap.php` |
| Too many errors | Use baseline, analyze components separately |
| Slow analysis | Set `maximumNumberOfProcesses: 1` |

## File Reference

```
ojs-main/
├── claude/
│   └── PHPSTAN_INTEGRATION.md          # MAIN DOCUMENTATION (comprehensive guide)
├── lib/pkp/
│   ├── phpstan.neon                    # Current config (update this)
│   ├── phpstan-enhanced.neon           # Enhanced config (recommended)
│   ├── phpstan-plugins.neon            # Plugin-specific config
│   ├── phpstan-baseline.neon           # Generated baseline (create with script)
│   ├── includes/
│   │   ├── bootstrap.php               # Existing bootstrap
│   │   └── phpstan-bootstrap.php       # PHPStan stubs (NEW)
│   └── tools/phpstan/
│       ├── README.md                   # Scripts documentation
│       ├── analyze-core.sh             # Analyze core classes
│       ├── analyze-api.sh              # Analyze API
│       ├── analyze-jobs.sh             # Analyze jobs
│       ├── analyze-controllers.sh      # Analyze controllers
│       ├── analyze-all-components.sh   # Run all analyses
│       ├── generate-baseline.sh        # Create/update baseline
│       ├── generate-report.sh          # Generate reports
│       └── track-metrics.sh            # Track metrics over time
└── .github/workflows/
    └── phpstan.yml.example             # CI/CD template
```

## Success Criteria

After completing the quick start:

✅ Baseline file generated without crashes
✅ Component analysis runs without memory errors
✅ Analysis completes in reasonable time (<5 minutes per component)
✅ New code passes PHPStan checks
✅ Baseline errors gradually decreasing

## Next Steps After Setup

1. **Week 1**: Use baseline, run component analysis daily
2. **Week 2-4**: Fix 25% of baseline errors (start with low-hanging fruit)
3. **Month 2**: Increase to level 6, regenerate baseline
4. **Month 3+**: Gradual improvement, track metrics

## Getting Help

- **Main documentation**: `claude/PHPSTAN_INTEGRATION.md`
- **Scripts documentation**: `lib/pkp/tools/phpstan/README.md`
- **PHPStan docs**: https://phpstan.org/user-guide/getting-started
- **Config reference**: https://phpstan.org/config-reference

## Summary of Answers to Your Questions

### Q: How to effectively integrate PHPStan?
**A**: Use **incremental approach** with baseline + component-based analysis. See `claude/PHPSTAN_INTEGRATION.md` for full strategy.

### Q: What detailed configuration should be added?
**A**: See `lib/pkp/phpstan-enhanced.neon` with:
- Optimized parallel processing (jobSize: 10, maxProcesses: 8)
- Comprehensive path exclusions (cache, templates, locale, node_modules)
- Memory-optimized settings
- Baseline support

### Q: Do we need separate bootstrapFiles?
**A**: Yes, created `lib/pkp/includes/phpstan-bootstrap.php` for PHPStan-specific constant stubs. Add constants here when PHPStan reports "Constant not found".

### Q: Better way to present outputs?
**A**: Multiple solutions provided:
- JSON/table/GitHub formats (`--error-format` flag)
- Report generation script (`generate-report.sh`)
- Metrics tracking over time (`track-metrics.sh`)
- CI/CD integration (see `.github/workflows/phpstan.yml.example`)

---

**Start here**: Run `./tools/phpstan/generate-baseline.sh` from `lib/pkp` directory! 🚀
