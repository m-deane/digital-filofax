# Feasibility Study: tidy-signal Library

**A Python Library Applying Tidyverse Philosophy to Signal Detection in Commodities Markets**

**Date:** 2025-12-07
**Status:** HIGHLY VIABLE
**Confidence Level:** HIGH

---

## 1. Executive Summary

This feasibility study evaluates the viability of creating **tidy-signal**, a Python library that applies R tidyverse/tidymodels philosophy to signal detection in commodities markets. The study concludes that this project is **highly viable** with a **clear market opportunity**.

### Key Findings

| Dimension | Assessment | Details |
|-----------|------------|---------|
| **Market Need** | Strong | Major gaps in ML integration, time-series CV, portfolio construction |
| **Technical Feasibility** | High | Proven patterns from py-tidymodels, existing statistical libraries |
| **Competitive Position** | Favorable | Unique combination of tidyverse + commodities + signals |
| **Resource Requirements** | Moderate | Can be built incrementally in phases |
| **Risk Level** | Medium | Manageable with phased approach |

### Recommendation

**PROCEED** with development, starting with core infrastructure (Phase 1) and building incrementally toward full feature set.

---

## 2. Market Analysis

### 2.1 Target Market

**Primary Users:**
- Commodities quants and traders
- Data scientists in finance/energy sectors
- Academic researchers in quantitative finance
- Existing py-tidymodels users

**Market Size Indicators:**
- Zipline: 19.2k GitHub stars
- Backtrader: 19.7k GitHub stars
- VectorBT: 6.3k GitHub stars
- Alphalens: 4.0k GitHub stars
- Combined: 50k+ developers interested in Python trading tools

### 2.2 Competitive Landscape

| Library | Strength | Weakness | tidy-signal Advantage |
|---------|----------|----------|----------------------|
| Zipline | Pipeline API | Slow, abandoned | Faster, active, composable |
| VectorBT | Speed | No ML, no CV | ML-first, built-in CV |
| Backtrader | Live trading | Slow, stagnant | Modern architecture |
| Alphalens | Factor analysis | Analysis only | Full workflow |
| Pyfolio | Reporting | Static plots | Interactive dashboards |

### 2.3 Gap Analysis

**Confirmed Gaps in Existing Ecosystem:**

1. **ML/AI Integration** (Impact: HIGH)
   - No library supports ML-driven signals natively
   - tidy-signal: First-class sklearn/LightGBM integration

2. **Time-Series Cross-Validation** (Impact: MEDIUM-HIGH)
   - Manual train/test splits only
   - tidy-signal: py-rsample equivalent with rolling, purged CV

3. **Portfolio Construction** (Impact: MEDIUM-HIGH)
   - Missing layer between signals and execution
   - tidy-signal: Signal → weights → orders pipeline

4. **Commodities Focus** (Impact: MEDIUM)
   - Equity-centric libraries dominate
   - tidy-signal: Term structure, vintage data, seasonality

5. **Interactive Analytics** (Impact: MEDIUM)
   - Static matplotlib tear sheets
   - tidy-signal: Plotly Dash dashboards

---

## 3. Technical Feasibility

### 3.1 Proven Patterns

The py-tidymodels project demonstrates that tidyverse patterns transfer effectively to Python:

| Pattern | R Package | py-tidymodels | tidy-signal |
|---------|-----------|---------------|-------------|
| Model Spec | parsnip | py-parsnip (working) | SignalSpec |
| Preprocessing | recipes | py-hardhat (working) | SignalPipeline |
| Outputs | broom | extract_outputs() | Same pattern |
| Resampling | rsample | Planned | py-rsample |

### 3.2 Required Python Libraries

All core statistical methods have mature Python implementations:

| Method | Library | Status | Notes |
|--------|---------|--------|-------|
| Cointegration | statsmodels | Stable | Engle-Granger, Johansen |
| Stationarity | statsmodels | Stable | ADF, KPSS |
| OU Process | scipy, ouparams | Stable | MLE estimation |
| Regime Detection | statsmodels | Stable | Markov switching |
| Structural Breaks | ruptures, kats | Stable | CUSUM, Bai-Perron |
| Seasonal | statsmodels | Stable | STL decomposition |
| Time Series | Prophet, arch | Stable | Forecasting, volatility |

### 3.3 Architecture Validation

```
Layer 1: py-hardhat (Data Preprocessing)
    └── mold/forge pattern for consistent transformations

Layer 2: py-parsnip (Model Interface)
    └── Unified model specs with registry-based engines

Layer 3: tidy-signal (Signal Detection) ← NEW
    └── SignalSpec, SignalEngine, SignalPipeline

Layer 4: py-rsample (Time-Series CV)
    └── Rolling origin, sliding windows, purged CV

Layer 5: py-portfolio (Portfolio Construction) ← FUTURE
    └── Signal aggregation, optimization, constraints
```

### 3.4 Technical Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Performance bottlenecks | MEDIUM | MEDIUM | Benchmark early, use Numba/Polars |
| API complexity | MEDIUM | MEDIUM | Progressive disclosure, user testing |
| Integration issues | LOW | MEDIUM | Build on proven py-tidymodels |
| Maintenance burden | MEDIUM | HIGH | Clear scope, phase-based delivery |

---

## 4. Resource Assessment

### 4.1 Development Effort Estimates

| Phase | Scope | Complexity | Notes |
|-------|-------|------------|-------|
| Phase 1: Core Infrastructure | SignalSpec, registry, basic signals | Medium | 8-12 weeks |
| Phase 2: Statistical Methods | Cointegration, stationarity, OU | Medium | 6-10 weeks |
| Phase 3: py-rsample | Time-series CV | Medium | 6-8 weeks |
| Phase 4: Preprocessing | Pipeline, deseasonalize, normalize | Medium | 4-6 weeks |
| Phase 5: Commodities Features | Term structure, spreads, vintage | Medium | 6-8 weeks |
| Phase 6: ML Integration | sklearn pipeline, walk-forward | High | 8-12 weeks |
| Phase 7: Portfolio Construction | Optimization, constraints | High | 8-12 weeks |
| Phase 8: Analytics | Plotly Dash dashboards | Medium | 6-8 weeks |

**Total Estimated Development:** 52-76 weeks for full feature set

### 4.2 Minimum Viable Product (MVP)

A focused MVP (Phases 1-3) could be delivered in **20-30 weeks**:
- SignalSpec with 5 signal types
- 10+ engines (statsmodels, scipy)
- Basic time-series CV
- Three-DataFrame outputs
- Integration with py-parsnip

### 4.3 Dependencies

**Required:**
- pandas >= 1.5.0
- numpy >= 1.21.0
- statsmodels >= 0.14.0
- scipy >= 1.7.0

**Optional:**
- arch >= 5.0.0 (Phillips-Ouliaris)
- ruptures >= 1.1.0 (changepoint detection)
- ouparams (OU estimation)
- hurst (Hurst exponent)
- plotly >= 5.0.0 (dashboards)

---

## 5. Risk Analysis

### 5.1 Technical Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| **Scope creep** | HIGH | HIGH | Phase-based delivery with clear boundaries |
| **Performance issues** | MEDIUM | MEDIUM | Benchmark from Phase 1, optimize hot paths |
| **API design mistakes** | MEDIUM | MEDIUM | User testing, follow py-tidymodels patterns |
| **Integration complexity** | LOW | MEDIUM | Build on proven py-hardhat/py-parsnip |

### 5.2 Market Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| **Limited adoption** | MEDIUM | HIGH | Focus on existing py-tidymodels users first |
| **Competition from VectorBT** | LOW | MEDIUM | Differentiate on ML, CV, tidyverse philosophy |
| **Quantopian-style abandonment** | LOW | HIGH | Open-source first, community governance |

### 5.3 Overall Risk Assessment

**Risk Level: MEDIUM**

Risks are manageable with:
- Phase-based development approach
- Clear scope boundaries
- Early user feedback
- Building on proven patterns

---

## 6. Unique Value Proposition

### 6.1 What Makes tidy-signal Different

**tidy-signal would be the FIRST Python library to:**

1. **Apply tidyverse philosophy to signal detection**
   - Composable SignalSpec with registry-based engines
   - prep()/apply() pattern preventing data leakage
   - Three-DataFrame outputs (detections, parameters, metrics)

2. **Provide built-in time-series cross-validation**
   - Rolling origin resampling
   - Purged/embargoed CV for ML
   - Walk-forward validation

3. **Support ML signals as first-class citizens**
   - sklearn-compatible interface
   - Feature engineering pipeline
   - Online learning support

4. **Handle commodities-specific concerns**
   - Term structure utilities (constant maturity, rolling)
   - Spread construction (calendar, crack, crush)
   - Vintage/point-in-time data

5. **Integrate with py-tidymodels ecosystem**
   - Seamless use with py-parsnip models
   - Consistent output format
   - Shared preprocessing (py-hardhat)

### 6.2 Competitive Moat

| Competitor | tidy-signal Advantage |
|------------|----------------------|
| Zipline | Faster, simpler, ML-native, actively maintained |
| VectorBT | Tidyverse philosophy, built-in CV, structured outputs |
| Backtrader | Modern architecture, composable, not OOP-heavy |
| Custom solutions | Pre-built, tested, documented, community-supported |

---

## 7. Implementation Strategy

### 7.1 Recommended Approach

**Phase-Based Development with Clear Milestones:**

```
MVP (Months 1-6)
├── Phase 1: Core Infrastructure (Months 1-3)
│   ├── SignalSpec frozen dataclass
│   ├── SignalEngine ABC and registry
│   ├── Basic signals: momentum, mean_reversion, cointegration
│   └── Three-DataFrame outputs
│
└── Phase 2-3: Statistical Methods + CV (Months 3-6)
    ├── Cointegration (Engle-Granger, Johansen)
    ├── Stationarity testing (ADF, KPSS)
    ├── py-rsample (rolling_origin, sliding_window)
    └── Basic documentation and examples

Full Release (Months 7-18)
├── Phase 4: Preprocessing Pipelines
├── Phase 5: Commodities Features
├── Phase 6: ML Integration
├── Phase 7: Portfolio Construction
└── Phase 8: Analytics & Visualization
```

### 7.2 Success Metrics

**Phase 1-3 (MVP) Success Criteria:**
- 5 signal types with 10+ engines
- Working time-series CV
- 20+ passing tests
- Basic documentation
- 100+ GitHub stars

**Full Release Success Criteria:**
- 10+ signal types with 20+ engines
- Complete py-rsample functionality
- Interactive dashboards
- 500+ GitHub stars
- 20+ contributors

### 7.3 Go/No-Go Criteria

**Continue to Phase 2 if Phase 1 achieves:**
- Working SignalSpec/SignalEngine pattern
- 3+ signal types implemented
- Integration with py-hardhat verified
- Positive user feedback on API design

---

## 8. Conclusions

### 8.1 Viability Assessment

| Criterion | Score (1-5) | Notes |
|-----------|-------------|-------|
| Market Need | 5 | Clear gaps in ecosystem |
| Technical Feasibility | 4 | Proven patterns exist |
| Competitive Position | 4 | Unique value proposition |
| Resource Requirements | 3 | Moderate, can phase |
| Risk Level | 3 | Medium, manageable |
| **Overall** | **4** | **HIGHLY VIABLE** |

### 8.2 Recommendations

1. **PROCEED** with development
2. Start with Phase 1 (Core Infrastructure)
3. User test API design before Phase 2
4. Build py-rsample early (high value)
5. Focus on commodities differentiation
6. Document extensively (CLAUDE.md pattern)

### 8.3 Next Steps

1. **Week 1-2:** Prototype SignalSpec/SignalEngine with 2-3 reference signals
2. **Week 3-4:** Build basic cointegration and momentum engines
3. **Week 5-6:** User research with commodities quants on API ergonomics
4. **Week 7-8:** Refine API based on feedback
5. **Week 9+:** Continue Phase 1 development

---

## Appendix: Example Code

### Proposed API Pattern

```python
from tidy_signal import SignalSpec, SignalPipeline, DetectionWorkflow
from tidy_signal.signals import cointegration, momentum, z_score
from tidy_signal.resample import rolling_origin

# Define signal specification (parsnip-inspired)
coint_signal = (
    SignalSpec(type="cointegration")
    .set_engine("statsmodels")
    .set_args(method="johansen", significance=0.05)
)

# Create preprocessing pipeline (recipes-inspired)
pipeline = (
    SignalPipeline()
    .step_normalize(method="zscore", window=60)
    .step_deseasonalize(period=12, method="stl")
    .step_stationarity_check(test="adf_kpss", significance=0.05)
)

# Combine into workflow
workflow = (
    DetectionWorkflow()
    .add_preprocessing(pipeline)
    .add_signal(coint_signal)
)

# Time-series cross-validation (rsample-inspired)
cv = rolling_origin(data, initial=252, assess=21, cumulative=True)

# Fit with cross-validation
results = workflow.fit_cv(data, cv=cv)

# Extract standardized outputs (broom-inspired)
detections, parameters, metrics = results.extract_outputs()

# detections: date, asset, signal_value, entry, exit, split
# parameters: term, estimate, std_error, p_value, method
# metrics: sharpe, max_drawdown, IC, turnover, by split
```

### Signal Engine Implementation

```python
from tidy_signal.engine_registry import SignalEngine, register_signal
from dataclasses import dataclass

@register_signal("cointegration", "statsmodels")
class StatsmodelsCointegrationEngine(SignalEngine):
    """Cointegration testing using statsmodels Johansen test."""

    param_map = {
        "significance": "pvalue_threshold",
        "max_lags": "k_ar_diff"
    }

    def fit(self, spec: SignalSpec, data: pd.DataFrame) -> SignalFit:
        from statsmodels.tsa.vector_ar.vecm import coint_johansen

        # Extract parameters
        params = self.translate_params(spec.args)

        # Run Johansen test
        result = coint_johansen(
            data.values,
            det_order=0,
            k_ar_diff=params.get("k_ar_diff", 1)
        )

        # Store fit information
        return SignalFit(
            spec=spec,
            engine=self,
            fit_data={
                "trace_stat": result.trace_stat,
                "crit_values": result.trace_stat_crit_vals,
                "eigenvectors": result.evec,
                "cointegrated": result.trace_stat[0] > result.trace_stat_crit_vals[0, 1]
            }
        )

    def detect(self, fit: SignalFit, new_data: pd.DataFrame) -> pd.DataFrame:
        # Generate spread using eigenvector
        evec = fit.fit_data["eigenvectors"][:, 0]
        spread = new_data @ evec

        # Calculate z-score
        z_score = (spread - spread.mean()) / spread.std()

        return pd.DataFrame({
            ".spread": spread,
            ".z_score": z_score,
            ".entry_long": z_score < -2.0,
            ".entry_short": z_score > 2.0,
            ".exit": abs(z_score) < 0.5
        })

    def extract_outputs(self, fit: SignalFit) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        # ... implementation following broom pattern
        pass
```

---

**Document Version:** 1.0
**Last Updated:** 2025-12-07
**Author:** Claude Technical Research
