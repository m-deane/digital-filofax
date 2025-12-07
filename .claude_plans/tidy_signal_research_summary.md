# Tidy-Signal Library Research Summary

**Research Date:** 2025-12-07
**Objective:** Assess viability of a Python library applying R tidyverse/tidymodels philosophy to signal detection in commodities markets

---

## Executive Summary

**Viability Assessment: HIGHLY VIABLE**

A Python signal detection library applying tidyverse/tidymodels philosophy represents a significant opportunity. The research reveals:

1. **Clear ecosystem gap** - No existing Python library combines tidyverse-style composability with signal detection for commodities
2. **Strong existing foundation** - py-tidymodels provides proven patterns that transfer well to signal detection
3. **Unmet market need** - ML integration, portfolio construction, and time-series CV are major gaps in existing tools
4. **Proven design patterns** - R tidyverse/tidymodels patterns are well-documented and highly transferable to Python

---

## 1. R Tidyverse/Tidymodels Patterns

### Core Philosophy: Four Foundational Tenets

| Tenet | Description | Python Adaptation |
|-------|-------------|-------------------|
| **Reuse Existing Data Structures** | Use standard formats (tibbles) | Use pandas DataFrames |
| **Compose with Pipes** | Chain simple functions | Method chaining + `.pipe()` |
| **Embrace Functional Programming** | Immutable objects, no side effects | Frozen dataclasses |
| **Design for Humans** | Intuitive, discoverable API | Type hints + autocomplete-friendly naming |

### Key Patterns from Tidymodels

1. **Parsnip Model Specification**
   - Three-step pattern: Type → Engine → Mode
   - Specifications independent of data
   - Registry-based extensibility

2. **Recipes Preprocessing**
   - Specification → Preparation (prep) → Application (bake)
   - Learn from training, apply consistently to test
   - Prevents data leakage

3. **Broom Standardized Outputs**
   - `tidy()` → component-level (coefficients)
   - `glance()` → model-level (metrics)
   - `augment()` → observation-level (predictions)

4. **Rsample Time-Aware Validation**
   - Rolling origin, sliding windows
   - Training never contains future information

### Application to Signal Detection

```python
# Proposed signal detection API (inspired by tidymodels)
signal_spec = (
    SignalSpec(type="cointegration")
    .set_engine("statsmodels")
    .set_args(significance=0.05, method="johansen")
)

pipeline = (
    SignalPipeline()
    .step_normalize(method="zscore")
    .step_deseasonalize(period=12)
    .step_stationarity_check()
)

workflow = (
    DetectionWorkflow()
    .add_preprocessing(pipeline)
    .add_signal(signal_spec)
)

# Three-DataFrame output (inspired by broom)
detections, parameters, metrics = workflow.fit(data).extract_outputs()
```

---

## 2. Python Signal/Trading Libraries Analysis

### Library Comparison

| Library | Signal API | Performance | ML Integration | Maintenance |
|---------|-----------|-------------|----------------|-------------|
| **Zipline** | Declarative CustomFactor | Slow (event-driven) | Poor | Abandoned → Fork |
| **VectorBT** | Boolean arrays | Excellent (vectorized) | Limited | Active |
| **Backtrader** | OOP with Lines | Slow | Poor | Stagnant |
| **Alphalens** | Post-hoc factor analysis | N/A (analysis only) | N/A | Abandoned → Fork |
| **Pyfolio** | N/A (portfolio analysis) | N/A (visualization) | N/A | Abandoned → Fork |
| **Empyrical** | Pure functional metrics | Fast | N/A | Stable |

### Critical Ecosystem Gaps

| Gap | Impact | Opportunity |
|-----|--------|-------------|
| **ML/AI Integration** | HIGH | No library supports ML-driven signals natively |
| **Modern Data Interfaces** | HIGH | All assume OHLCV; poor alternative data support |
| **Portfolio Construction** | MEDIUM-HIGH | Missing layer between signals and execution |
| **Time-Series CV** | MEDIUM | No walk-forward, purged CV built-in |
| **Real-time/Streaming** | MEDIUM-HIGH | All batch-focused |

### Key Insights

1. **Quantopian shutdown** revealed fragility of company-backed open source
2. **Maintained forks** (zipline-reloaded, pyfolio-reloaded) can successfully continue projects
3. **VectorBT's vectorization** shows 1000x+ speedups are achievable
4. **Separation of concerns** works well: factor computation ≠ portfolio construction ≠ analytics

---

## 3. Statistical Methods Inventory

### Ranked by Importance for Commodities Signal Detection

| Rank | Method | Importance | Python Library | Use Case |
|------|--------|------------|----------------|----------|
| 1 | **Cointegration Testing** | CRITICAL | statsmodels | Pairs/spread identification |
| 2 | **Ornstein-Uhlenbeck Process** | HIGH | scipy, ouparams | Spread modeling, half-life |
| 3 | **Half-Life & Z-Score** | HIGH | Custom (OLS) | Signal generation |
| 4 | **Stationarity Testing** | HIGH | statsmodels (ADF, KPSS) | Spread validation |
| 5 | **Structural Break Detection** | MEDIUM-HIGH | ruptures, kats | Regime changes |
| 6 | **Markov Switching** | MEDIUM-HIGH | statsmodels | Volatility regimes |
| 7 | **Hurst Exponent** | MEDIUM | hurst | Mean reversion screening |
| 8 | **Seasonal Decomposition** | MEDIUM | statsmodels (STL) | Agricultural commodities |
| 9 | **Phillips-Ouliaris** | MEDIUM | arch | Robust cointegration |

### Commodities-Specific Strategy Recommendations

| Strategy | Cointegration | Half-Life | Entry Z | Libraries |
|----------|---------------|-----------|---------|-----------|
| Calendar Spreads | Strong | 10-30 days | ±2.0 | statsmodels, ouparams |
| Crack Spreads | Medium-Strong | 15-40 days | ±2.5 | arch (P-O), Markov |
| Crush Spreads | Strong | 10-25 days | ±1.5 | statsmodels + STL |
| Location Spreads | Medium | 20-50 days | ±2.5 | Johansen, Kalman |
| Inter-Commodity | Weak-Medium | 30-90 days | ±2.0 | Hurst screening first |

---

## 4. Vintage Data & Point-in-Time Analysis

### Core Concepts

1. **ALFRED Methodology** (ArchivaL Federal Reserve Economic Data)
   - 815,000+ vintage series
   - Three-date model: observation_date × vintage_date × realtime_end
   - Python: `fredapi` library

2. **Ragged-Edge Problem**
   - Uneven data availability at sample edge
   - Solutions: Factor MIDAS, Kalman filter, realignment

3. **Lookahead Bias Prevention**
   - Bitemporal modeling (valid time + transaction time)
   - Temporal train/test splits (never random)
   - Expanding window normalization
   - Point-in-time database queries

### Commodities-Specific Timing

| Data Source | Release Schedule | Lag Consideration |
|-------------|------------------|-------------------|
| WASDE Reports | Monthly 8th-12th noon ET | High impact, May critical |
| EIA Petroleum | Wednesday 9:30 AM CT | Intraday volatility |
| EIA Natural Gas | Thursday 9:30 AM CT | Seasonal importance |
| Settlement Prices | After close | Lag by 1 day in backtest |

### Recommended Data Structure

```
4D Vintage Data: vintage_date × observation_date × asset × feature
```

**Storage Options:**
- **Small (<5GB):** pandas MultiIndex + Parquet files
- **Medium (5-50GB):** PostgreSQL bitemporal schema
- **Large (>50GB):** TimescaleDB or xarray + Zarr

---

## 5. Multi-Dimensional Time Series

### Recommended Architecture

| Scenario | Data Structure | Storage | Processing |
|----------|---------------|---------|------------|
| 2-3 dimensions | pandas MultiIndex | Parquet | pandas |
| 4+ dimensions | xarray DataArray | Zarr/NetCDF | Dask |
| Production | PostgreSQL + Parquet | Hybrid | Polars |

### Tidy Format for Signals

```python
# Core columns
['date', 'asset', 'contract', 'tenor']

# Signal columns
['close', 'volume', 'SMA_20', 'momentum', 'z_score']

# Metadata columns (py-tidymodels compatible)
['model', 'model_group_name', 'group', 'split']

# Output columns
['actuals', 'fitted', 'forecast', 'residuals']
```

### Term Structure Modeling Options

1. **Constant Maturity** - Interpolate to fixed maturities (30, 60, 90 days)
2. **Rolling Contracts** - Panama or proportional adjustment
3. **Generic Contracts** - CL1, CL2, CL3 with roll rules

---

## 6. Unique Value Proposition

### What Already Exists

| Category | Libraries | Coverage |
|----------|-----------|----------|
| Backtesting | Zipline, Backtrader, VectorBT | Strong |
| Factor Analysis | Alphalens | Strong |
| Portfolio Analytics | Pyfolio, Empyrical | Strong |
| Statistical Methods | statsmodels, arch | Strong |
| Time Series | Prophet, statsmodels | Strong |

### What's Missing (The Gap)

| Gap | Current State | Opportunity |
|-----|---------------|-------------|
| **Unified Signal API** | Fragmented approaches | Tidymodels-style composability |
| **ML-Native Signals** | Bolted-on ML | First-class sklearn/LightGBM |
| **Time-Series CV** | Manual splits | py-rsample equivalent |
| **Portfolio Construction** | Order execution only | Signal → weights → orders |
| **Commodities Focus** | Equity-centric | Term structure, vintage data |
| **Interactive Analytics** | Static tear sheets | Plotly Dash dashboards |

### Unique Value Proposition

**tidy-signal** would be the first Python library to:

1. Apply **tidyverse philosophy** to commodities signal detection
2. Provide **composable signal specifications** with registry-based engines
3. Include **built-in time-series CV** (rolling, expanding, purged)
4. Support **vintage/point-in-time data** natively
5. Integrate **ML pipelines** as first-class signals
6. Handle **commodities-specific** concerns (term structure, seasonality)
7. Produce **three-DataFrame outputs** compatible with py-tidymodels

---

## 7. Recommended API Patterns

### Signal Specification (Parsnip-Inspired)

```python
@dataclass(frozen=True)
class SignalSpec:
    signal_type: str       # "cointegration", "momentum", "ml_classifier"
    engine: str            # "statsmodels", "sklearn", "custom"
    args: Dict[str, Any]   # Signal-specific parameters

    def set_engine(self, engine: str, **kwargs) -> "SignalSpec":
        return replace(self, engine=engine, args={**self.args, **kwargs})

    def fit(self, data: pd.DataFrame) -> "SignalFit":
        engine = get_engine(self.signal_type, self.engine)
        return engine.fit(self, data)
```

### Preprocessing Pipeline (Recipes-Inspired)

```python
class SignalPipeline:
    def __init__(self):
        self.steps = []
        self._prep_state = None

    def step_normalize(self, method="zscore") -> "SignalPipeline":
        self.steps.append(NormalizeStep(method))
        return self

    def prep(self, training_data: pd.DataFrame) -> "SignalPipeline":
        """Learn parameters from training data"""
        for step in self.steps:
            step.prep(training_data)
        self._prep_state = "prepped"
        return self

    def apply(self, data: pd.DataFrame) -> pd.DataFrame:
        """Apply learned transformations"""
        result = data.copy()
        for step in self.steps:
            result = step.apply(result)
        return result
```

### Three-DataFrame Output (Broom-Inspired)

```python
def extract_outputs(self) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Returns:
        detections: Observation-level (date, asset, signal_value, entry, exit)
        parameters: Signal parameters (term, estimate, std_error, p_value)
        metrics: Performance metrics (sharpe, max_drawdown, IC, turnover)
    """
    return self.detections, self.parameters, self.metrics
```

### Registry Pattern (Extensibility)

```python
@register_signal("cointegration", "statsmodels")
class StatsmodelsCointegrationEngine(SignalEngine):
    param_map = {"significance": "pvalue_threshold"}

    def fit(self, spec: SignalSpec, data: pd.DataFrame) -> SignalFit:
        # Implementation
        pass

    def detect(self, fit: SignalFit, new_data: pd.DataFrame) -> pd.DataFrame:
        # Implementation
        pass
```

---

## 8. Implementation Roadmap

### Phase 1: Core Infrastructure (Foundation)
- SignalSpec frozen dataclass
- SignalEngine ABC and registry
- Basic signal types: momentum, mean_reversion
- Three-DataFrame output pattern
- Integration with py-hardhat (mold/forge)

### Phase 2: Statistical Methods
- Cointegration (Engle-Granger, Johansen)
- Stationarity testing (ADF, KPSS)
- OU process parameter estimation
- Half-life and z-score signals

### Phase 3: Time-Series CV (py-rsample)
- Rolling origin resampling
- Sliding window / sliding period
- Expanding window
- Purged cross-validation
- Integration with signal evaluation

### Phase 4: Preprocessing Pipelines
- SignalPipeline with step_*() methods
- prep() / apply() pattern
- Deseasonalization (STL)
- Normalization with lookahead prevention
- Point-in-time data handling

### Phase 5: Commodities-Specific Features
- Term structure utilities (constant maturity, rolling)
- Spread construction (calendar, crack, crush)
- Vintage data integration
- WASDE/EIA release calendar awareness

### Phase 6: ML Integration
- ML signal type with sklearn interface
- Feature engineering pipeline
- Walk-forward validation
- Online learning support

### Phase 7: Portfolio Construction Layer
- Signal → weights optimization
- Constraint handling (max position, turnover)
- Transaction cost modeling
- Risk budgeting

### Phase 8: Analytics & Visualization
- Interactive Plotly Dash dashboards
- Tear sheet generation
- IC analysis, turnover analysis
- Regime detection visualization

---

## 9. Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Scope creep | HIGH | HIGH | Phase-based delivery, MVP first |
| Performance issues | MEDIUM | MEDIUM | Benchmark early, use Polars/Numba |
| API complexity | MEDIUM | MEDIUM | User testing, progressive disclosure |
| Maintenance burden | MEDIUM | HIGH | Clear scope, community building |

### Market Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Limited adoption | MEDIUM | HIGH | Focus on existing py-tidymodels users |
| Competition | LOW | MEDIUM | Unique commodities + tidy focus |
| Funding | MEDIUM | MEDIUM | Open-source first, optional premium |

---

## 10. Conclusions & Recommendations

### Viability: STRONG

The research confirms high viability based on:

1. **Clear gap** in Python ecosystem for tidyverse-style signal detection
2. **Proven patterns** from R tidymodels that transfer well to Python
3. **Existing foundation** in py-tidymodels to build upon
4. **Market need** evidenced by abandoned Quantopian libraries
5. **Technical feasibility** with available Python libraries

### Recommended Next Steps

1. **Prototype SignalSpec/SignalEngine** with 2-3 reference signals
2. **Build py-rsample** for time-series cross-validation
3. **User research** with commodities quants on API ergonomics
4. **Documentation-first** approach with CLAUDE.md for development
5. **Phase-based delivery** starting with core infrastructure

### Success Criteria

- 10 signal types with 20+ engines
- Time-series CV matching R rsample functionality
- Sub-second performance for typical backtests
- Seamless integration with py-parsnip models
- Interactive analytics dashboard
- Active community with 500+ GitHub stars within first year

---

## Sources

### R Tidyverse/Tidymodels
- [The tidy tools manifesto](https://tidyverse.tidyverse.org/articles/manifesto.html)
- [Tidy Modeling with R](https://www.tmwr.org/)
- [tidyquant](https://business-science.github.io/tidyquant/)

### Python Trading Libraries
- [Zipline Reloaded](https://github.com/stefan-jansen/zipline-reloaded)
- [VectorBT](https://github.com/polakowo/vectorbt)
- [Backtrader](https://github.com/mementum/backtrader)
- [Alphalens](https://github.com/quantopian/alphalens)

### Statistical Methods
- Engle & Granger (1987). Co-integration and Error Correction
- Johansen (1988). Statistical Analysis of Cointegration Vectors
- Cleveland et al. (1990). STL Decomposition

### Vintage Data
- [ALFRED Database](https://alfred.stlouisfed.org/)
- Anderson (2006). Replicability, Real-Time Data
- Marcellino et al. (2010). Factor MIDAS

### Commodities
- [CME Group Daily Settlements](https://www.cmegroup.com/market-data/daily-settlements.html)
- [USDA WASDE Reports](https://www.usda.gov/about-usda/general-information/staff-offices/office-chief-economist/commodity-markets/wasde-report)
