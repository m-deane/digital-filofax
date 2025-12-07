# Python Signal/Trading Libraries: Feasibility Study

**Research Date:** 2025-12-07
**Researcher:** Technical Research Agent
**Purpose:** Analyze Python trading/signal libraries for architecture patterns and ecosystem gaps

---

## Executive Summary

Analyzed 6 major Python libraries across the trading/backtesting ecosystem:

1. **Zipline** - Factor research & backtesting (abandoned, maintained fork active)
2. **VectorBT** - Vectorized backtesting for optimization (actively maintained)
3. **Backtrader** - OOP strategy framework for live trading (maintenance mode)
4. **Alphalens** - Factor analysis and validation (abandoned, forks active)
5. **Pyfolio** - Portfolio performance reporting (abandoned, fork active)
6. **Empyrical** - Risk metric calculations (abandoned, stable)

**Key Finding:** No library provides comprehensive ML integration, modern portfolio construction, or streaming architecture. Significant opportunity for a new library bridging signal generation, portfolio optimization, and real-time execution with first-class ML support.

---

## 1. Library-by-Library Analysis

### 1.1 Zipline (Quantopian)

**Repository:** https://github.com/quantopian/zipline (original, abandoned)
**Maintained Fork:** https://github.com/stefan-jansen/zipline-reloaded (active, v3.1.1 2025)

**Stats:**
- Stars: 19,200 | Forks: 4,900 | Contributors: 119
- Last Original Release: v1.4.1 (Oct 2020)
- Maintained Fork: Python 3.10-3.13, pandas 2.2+, numpy 2.0

**Signal Definition Pattern:**
```python
class MyFactor(CustomFactor):
    inputs = [USEquityPricing.close]
    window_length = 10

    def compute(self, today, assets, out, close):
        # M x N array: window_length x num_securities
        out[:] = close[-1] / close[0]  # momentum
```

**Key Concepts:**
- **Declarative CustomFactor** with `compute()` method
- **Pipeline API** for batch factor computation across all dates/securities
- **In-place mutation** pattern (`out[:]`) for performance
- **Data bundles** (SQLite) for historical data storage
- **Separation of concerns:** factor computation vs strategy execution

**Strengths:**
- Industry-standard Pipeline API for factor research
- Efficient batch computation across time/securities
- Rich ecosystem (Alphalens, Pyfolio integration)
- Prevents lookahead bias through design
- Professional-grade architecture

**Weaknesses:**
- Steep learning curve
- Rigid data bundle system (major friction)
- Difficult custom data integration
- Poor offline/local usage support
- Original library abandoned post-Quantopian shutdown
- Slow event-driven execution
- Complex infrastructure requirements

**Maintenance Status:** ABANDONED (original) | ACTIVELY MAINTAINED (zipline-reloaded)

---

### 1.2 VectorBT

**Repository:** https://github.com/polakowo/vectorbt
**Stats:**
- Stars: 6,300 | Forks: 821
- Last Commit: Feb 2025 (active)
- License: Apache 2.0 + Commons Clause

**Signal Definition Pattern:**
```python
fast_ma = vbt.MA.run(price, 10)
slow_ma = vbt.MA.run(price, 50)
entries = fast_ma.ma_crossed_above(slow_ma)
exits = fast_ma.ma_crossed_below(slow_ma)
pf = vbt.Portfolio.from_signals(price, entries, exits)
```

**Key Concepts:**
- **Boolean arrays** for entry/exit signals
- **Fluent API** with method chaining
- **Parameter broadcasting** for optimization (test 1000+ strategies simultaneously)
- **Vectorized computation** using NumPy + Numba JIT
- Despite name, uses sequential row-by-row processing (not truly vectorized)

**Strengths:**
- Exceptional performance (1000x faster than event-driven for optimization)
- Intuitive indicator composition
- Minimal code for complex strategies
- Trivial parameter optimization via broadcasting
- Comprehensive analytics built-in
- Active development

**Weaknesses:**
- Steeper learning curve (vectorized mindset required)
- No built-in lookahead bias prevention
- Stateless order execution (no complex order management)
- Limited path-dependent strategy support
- PRO version has paywall features
- Easy to introduce bugs without careful data handling

**Maintenance Status:** ACTIVELY MAINTAINED (open-source + PRO)

---

### 1.3 Backtrader

**Repository:** https://github.com/mementum/backtrader
**Stats:**
- Stars: 19,700 | Forks: 4,800 | Contributors: 52
- Used by: 3,400 projects
- Last major update: ~2019

**Signal Definition Pattern:**
```python
class MyStrategy(bt.Strategy):
    params = (('period', 20),)

    def __init__(self):
        self.sma = bt.indicators.SMA(period=self.p.period)

    def next(self):
        if self.data.close > self.sma:
            self.buy()
```

**Key Concepts:**
- **OOP with Lines abstraction** for time-series
- **params tuple** for configurable parameters
- **Indicators in __init__** (calculated once)
- **next() callback** for each bar
- **Cerebro engine** orchestrates execution
- **Metaclass-based** extensibility

**Strengths:**
- Extremely flexible and comprehensive
- Great for complex order logic
- Live trading support (Alpaca, Interactive Brokers)
- Rich indicator library (122 built-in)
- Multi-timeframe support
- Large community
- Good documentation

**Weaknesses:**
- Very slow performance (event-driven + array.array instead of NumPy)
- Steep learning curve (metaclasses, lines abstraction)
- Development stagnant since ~2019
- Complex syntax intimidates beginners
- Poor ML integration
- Optimization extremely slow
- TA-Lib integration has bugs

**Maintenance Status:** MAINTENANCE MODE (no active feature development)

---

### 1.4 Alphalens

**Repository:** https://github.com/quantopian/alphalens (original)
**Enhanced Fork:** https://github.com/cloudQuant/alphalens

**Stats:**
- Stars: 4,000 | Forks: 1,300 | Contributors: 18
- Used by: 743 projects
- Last update: ~2020 (original)

**Signal Definition Pattern:**
```python
factor_data = alphalens.utils.get_clean_factor_and_forward_returns(
    factor=my_factor,  # MultiIndex Series (date, asset)
    prices=pricing_data,
    quantiles=5,
    periods=(1, 5, 10)
)
alphalens.tears.create_full_tear_sheet(factor_data)
```

**Key Concepts:**
- **Post-hoc factor analysis** (not backtesting)
- **Two-step workflow:** data preparation → tear sheet generation
- **Quantile-based analysis** groups assets by factor values
- **Information Coefficient (IC)** measures factor-return correlation
- **Turnover analysis** estimates transaction costs
- **MultiIndex (date, asset)** for panel data

**Strengths:**
- Industry-standard factor validation tool
- Comprehensive tear sheets
- Quantile analysis reveals factor behavior
- IC provides statistical rigor
- Integrates with Zipline Pipeline
- Professional-grade output

**Weaknesses:**
- Not a backtesting tool (pure analysis)
- Requires properly aligned MultiIndex data (challenging)
- Original library abandoned
- Steep learning curve for data prep
- MaxLossExceededError can be cryptic
- Limited customization

**Maintenance Status:** ABANDONED (original) | MAINTAINED (cloudQuant fork for Python 3.8-3.13)

---

### 1.5 Pyfolio

**Repository:** https://github.com/quantopian/pyfolio (original)
**Maintained Fork:** https://github.com/stefan-jansen/pyfolio-reloaded

**Stats:**
- Stars: 6,100 | Forks: 1,900 | Contributors: 46
- Last release: v0.9.2 (Apr 2019)
- Used by: 1,400 projects

**Signal Definition Pattern:**
```python
# N/A - portfolio analysis tool, not signal generation
returns, positions, transactions = extract_rets_pos_txn_from_zipline(backtest)
pf.create_full_tear_sheet(
    returns=returns,
    positions=positions,
    transactions=transactions,
    benchmark_rets=benchmark
)
```

**Key Concepts:**
- **Tear sheet pattern** for comprehensive reporting
- **Returns:** daily percentage (non-cumulative)
- **Positions:** daily net position values
- **Transactions:** executed trades
- **Risk/return decomposition**
- **Benchmark comparison**

**Strengths:**
- Industry-standard portfolio analytics
- Comprehensive tear sheets
- Integrates with Zipline ecosystem
- Widely adopted
- Good for communicating strategy performance

**Weaknesses:**
- Original library abandoned (2019)
- Static plots (Matplotlib/Seaborn)
- Dated aesthetics
- Strict data format requirements
- Not interactive
- Limited customization

**Maintenance Status:** ABANDONED (original) | MAINTAINED (pyfolio-reloaded with pandas 2.0+)

---

### 1.6 Empyrical

**Repository:** https://github.com/quantopian/empyrical

**Stats:**
- Stars: 1,400 | Forks: 451 | Contributors: 17
- Release: v0.5.5 (Oct 2020)
- Used by: 1,700+ projects

**Signal Definition Pattern:**
```python
# N/A - pure metrics library
import empyrical as ep
sharpe = ep.sharpe_ratio(returns)
max_dd = ep.max_drawdown(returns)
alpha, beta = ep.alpha_beta(returns, benchmark)
rolling_sharpe = ep.roll_sharpe_ratio(returns, window=60)
```

**Key Concepts:**
- **Pure functional API** (stateless, side-effect free)
- **Accepts NumPy arrays or pandas Series**
- **Comprehensive risk metrics** (Sharpe, Sortino, Calmar, drawdown, alpha/beta, etc.)
- **Rolling statistics** for temporal analysis

**Strengths:**
- Simple, focused API
- Fast calculations
- Well-tested and reliable
- Used by 1,700+ projects
- No dependencies beyond NumPy/Pandas/SciPy
- Easy integration
- Pure functions enable testing/composition

**Weaknesses:**
- Original library abandoned (2020)
- Limited scope (metrics only, no visualization)
- Data fetching deprecated
- Minimal documentation

**Maintenance Status:** ABANDONED but stable (minimal maintenance needed)

---

## 2. Comparative Analysis

### 2.1 API Pattern Comparison Table

| Library | Signal API | API Style | Extensibility | Performance | Learning Curve | Primary Use Case |
|---------|-----------|-----------|---------------|-------------|----------------|------------------|
| **Zipline** | Declarative CustomFactor | Functional/Declarative | Subclassing | Slow (event-driven) | Steep | Factor research |
| **VectorBT** | Boolean arrays from indicators | Fluent/Method-chaining | Callbacks + factories | Excellent (vectorized) | Moderate-Steep | Parameter optimization |
| **Backtrader** | OOP with Lines abstraction | OOP/Imperative | Subclassing + plugins | Slow (event-driven) | Steep | Live trading + complex orders |
| **Alphalens** | Post-hoc factor analysis | Functional workflow | Limited | N/A (analysis only) | Moderate | Factor validation |
| **Pyfolio** | N/A (portfolio analysis) | Functional | Limited | N/A (visualization) | Easy | Performance reporting |
| **Empyrical** | N/A (pure metrics) | Pure functional | Easy (add functions) | Fast | Easy | Risk metric calculation |

### 2.2 Repository Statistics Summary

| Library | Stars | Forks | Contributors | Status | Maintained Fork |
|---------|-------|-------|--------------|--------|-----------------|
| Zipline | 19.2k | 4.9k | 119 | Abandoned | zipline-reloaded (active) |
| VectorBT | 6.3k | 821 | Unknown | Active | N/A |
| Backtrader | 19.7k | 4.8k | 52 | Maintenance | Community forks |
| Alphalens | 4.0k | 1.3k | 18 | Abandoned | cloudQuant (active) |
| Pyfolio | 6.1k | 1.9k | 46 | Abandoned | pyfolio-reloaded (active) |
| Empyrical | 1.4k | 451 | 17 | Abandoned | Stable, minimal updates |

---

## 3. Common Patterns That Work Well

### 3.1 Architectural Patterns

1. **Separation of Concerns:** Factor/signal computation separate from strategy execution (Zipline Pipeline)
2. **Declarative Configuration:** Class attributes for params, inputs, outputs (Zipline CustomFactor, Backtrader params/lines)
3. **Functional Metrics Library:** Pure functions as building blocks (Empyrical)
4. **Tear Sheet Pattern:** Comprehensive reporting with standardized layout (Pyfolio, Alphalens)
5. **MultiIndex for Panel Data:** (date, asset) indexing for time-series of multiple securities (Zipline, Alphalens)

### 3.2 API Design Patterns

1. **Fluent API for Composition:** Method chaining for indicators (VectorBT)
2. **Parameter Broadcasting:** Efficient multi-parameter testing (VectorBT)
3. **Compute Once, Execute Many:** Indicators calculated in __init__, not per-bar (Backtrader)
4. **In-place Mutation for Performance:** `out[:]` pattern avoids copies (Zipline)
5. **Plugin Architecture:** Registry pattern for extensibility (could be improved)

### 3.3 Data Handling

1. **PyData Integration:** Heavy use of pandas, NumPy, Matplotlib/Seaborn
2. **JIT Compilation:** Numba for performance-critical paths (VectorBT)
3. **Lazy Evaluation:** Defer computation until needed (Backtrader)

---

## 4. Pain Points and Anti-Patterns

### 4.1 Major Pain Points

1. **Data Integration Hell:**
   - Zipline bundles are rigid and complex
   - Custom data sources require significant effort
   - No standardized data abstraction layer

2. **Performance Bottlenecks:**
   - Event-driven architecture too slow for optimization (Backtrader, Zipline)
   - Using `array.array` instead of NumPy (Backtrader)
   - Creating cerebro instance and loading data takes forever (Backtrader)

3. **Abandonment Crisis:**
   - Quantopian shutdown killed 4 major libraries
   - Fragmented maintenance via community forks
   - Uncertainty about long-term support

4. **ML Integration Gap:**
   - No library has first-class ML support
   - Feature engineering must be bolted on
   - No support for online learning or model retraining

5. **Steep Learning Curves:**
   - Zipline Pipeline complexity
   - Backtrader metaclass magic
   - VectorBT vectorized mindset
   - Alphalens MultiIndex data preparation

### 4.2 Anti-Patterns Observed

1. **Tight Coupling:** Data bundles coupled to execution engine (Zipline)
2. **Metaclass Overuse:** Makes debugging difficult (Backtrader)
3. **Stateless Execution:** Too simplistic for complex strategies (VectorBT)
4. **Over-Engineering:** Unnecessary complexity for simple use cases (Zipline infrastructure)
5. **Poor Offline Support:** Designed for cloud platforms (Zipline)
6. **Rigid Data Formats:** MaxLossExceededError from minor misalignments (Alphalens)

---

## 5. Ecosystem Gaps

### 5.1 Critical Gaps

| Gap | Description | Impact |
|-----|-------------|--------|
| **ML/AI Integration** | No first-class support for ML-driven signals. Feature engineering, training, prediction must be bolted on. | HIGH - ML increasingly critical in quant finance |
| **Modern Data Interfaces** | Assume OHLCV bar data. Poor support for tick, order book, alternative data. | HIGH - Alternative data proliferating |
| **Portfolio Construction** | Signal generation well-covered, but position sizing, risk budgeting, constraints are afterthoughts. | MEDIUM-HIGH - Gap between signals and execution |
| **Real-time/Streaming** | Batch processing dominates. No library designed for streaming factor computation. | MEDIUM-HIGH - Needed for live trading |
| **Multi-asset Support** | Focus on single asset class (equities). Poor futures/options/FX/crypto integration. | MEDIUM - Important for institutional use |
| **Transaction Cost Modeling** | Simple commission models only. No market impact, spread modeling, realistic slippage. | MEDIUM - Critical for HF strategies |
| **Time-Series CV** | No built-in cross-validation for time series. Manual train/test splits only. | MEDIUM - Prevents overfitting |
| **Regime Detection** | No support for regime-dependent signals or adaptive parameters. | MEDIUM - Important for robustness |
| **Explainability** | Black box backtests. No tools for explaining trade decisions or factor contributions. | MEDIUM - Important for ML strategies |
| **Interactive Analytics** | All require Jupyter. No built-in dashboards. | LOW - Jupyter works but not ideal |

### 5.2 Missing Features

1. **Portfolio Optimization Layer:** cvxpy-style constraints and objectives for portfolio construction
2. **Streaming Architecture:** Real-time factor computation on streaming data
3. **Factor Library/Marketplace:** Centralized, tested, pre-built factors
4. **Walk-Forward Analysis:** Combinatorially purged CV (López de Prado)
5. **Market Impact Models:** Almgren-Chriss, square-root law for realistic costs
6. **Online Learning:** Model retraining on new data
7. **Signal Ensembling:** Combining multiple signals with learned weights
8. **Multi-asset Workflow:** Unified interface for equities, futures, options, FX, crypto

---

## 6. What a New Library Could Do Differently

### 6.1 Architecture

**Current:** Event-driven (slow) OR vectorized (limited path-dependence)

**New:** Hybrid architecture
- Vectorized factor computation (fast, batch)
- Optional event-driven execution (flexible, stateful)
- Separate signal generation from portfolio construction from execution

**Benefit:** Best of both worlds - speed of VectorBT + flexibility of Backtrader

### 6.2 Signal Definition

**Current:**
- Zipline: Declarative CustomFactor
- VectorBT: Boolean arrays
- Backtrader: OOP with lines

**New:** Composable signal functions with fluent API inspired by tidymodels
```python
# Conceptual API
signal_spec = (
    SignalSpec(type="momentum", lookback=10)
    .set_universe(assets=["SPY", "QQQ"])
    .set_params(threshold=0.02)
)

# Or ML-driven
ml_signal = (
    SignalSpec(type="ml_classifier", model="random_forest")
    .set_features(["momentum_10", "rsi_14", "volume_ratio"])
    .set_target("forward_return_5d")
    .set_training(method="walk_forward", window="252d")
)
```

**Benefit:** More intuitive than Zipline, more structured than VectorBT, less magic than Backtrader. ML integration built-in.

### 6.3 Data Handling

**Current:** Zipline bundles (rigid) OR VectorBT DataFrames (flexible but OHLCV-focused)

**New:** Pluggable data adapters with standardized interface
- Built-in adapters: Yahoo, Polygon, Alpaca, CCXT (crypto)
- Support: OHLCV, tick, order book, alternative data
- Automatic alignment and resampling

**Benefit:** Flexibility without complexity. Easy custom data integration.

### 6.4 Portfolio Construction

**Current:** VectorBT simple sizing, others focus on order execution

**New:** Dedicated portfolio construction layer
```python
portfolio = (
    PortfolioSpec()
    .set_signals([signal1, signal2, signal3])
    .set_weighting(method="inverse_volatility")
    .set_constraints(max_position=0.1, max_turnover=0.2)
    .set_costs(commission=0.001, slippage_model="square_root")
)
```

**Benefit:** Fills major ecosystem gap. Bridges signal generation and execution.

### 6.5 Analytics

**Current:** Pyfolio/Alphalens tear sheets (static, dated aesthetics)

**New:** Built-in interactive dashboards (Plotly Dash)
- Three-tier output like py-tidymodels: observation-level, parameter-level, model-level
- Interactive exploration
- Modern aesthetics
- Real-time updates for live trading

**Benefit:** Better UX than Pyfolio. Integrated, not bolted-on.

### 6.6 Testing & Validation

**Current:** Manual train/test splits. No built-in time-series CV.

**New:** Built-in time-series cross-validation (inspired by py-rsample)
```python
cv = TimeSeriesCV(method="walk_forward", train_window="252d", test_window="63d")
results = backtest.evaluate(signal_spec, cv=cv)
```

Multiple methodologies:
- Rolling window
- Expanding window
- Anchored (López de Prado)
- Combinatorially purged CV

**Benefit:** Prevents overfitting. Best practices built-in.

### 6.7 ML Integration (MAJOR DIFFERENTIATOR)

**Current:** None - all external

**New:** First-class ML support
- Feature engineering pipeline (automatic lag creation, technical indicators)
- Online learning with model retraining
- Prediction as signal type
- Integration with scikit-learn, LightGBM, XGBoost
- Walk-forward optimization with parameter tuning

```python
ml_signal = (
    MLSignal(model="lightgbm")
    .add_features([
        Feature("returns", lags=[1, 2, 3, 5, 10]),
        Feature("rsi", period=14),
        Feature("volume_ratio", window=20)
    ])
    .set_target("forward_return_5d", threshold=0.01)
    .set_training(
        cv=TimeSeriesCV(method="walk_forward", train_window="252d"),
        refit_frequency="monthly"
    )
)
```

**Benefit:** MAJOR differentiator. No existing library does this well.

### 6.8 Transaction Costs

**Current:** Simple commission models

**New:** Realistic cost modeling
- Bid-ask spreads
- Market impact (square-root law, Almgren-Chriss)
- Realistic slippage models
- Turnover analysis integrated into optimization

**Benefit:** More realistic backtests. Critical for high-turnover strategies.

### 6.9 Multi-Model Workflows

**Current:** Single strategy per backtest. Manual comparison.

**New:** Inspired by py-tidymodels model_group_name pattern
- Test multiple signals simultaneously
- Automatic performance comparison
- Signal ensembling built-in
- Meta-learning to combine signals

**Benefit:** Natural extension of py-tidymodels philosophy. Streamlined comparison workflow.

### 6.10 Developer Experience

**Current:** Variable quality. Complex learning curves.

**New:** Progressive disclosure
- Simple API for beginners
- Powerful API for experts
- Comprehensive example notebooks
- Type hints and clear error messages
- CLAUDE.md-style documentation

**Benefit:** Lower barrier to entry. Faster time to productivity.

---

## 7. Implementation Recommendations by Use Case

| Use Case | Recommended Library | Rationale |
|----------|-------------------|-----------|
| **Research new factors on large datasets** | Zipline Pipeline + Alphalens | Pipeline efficiently computes factors across all securities/dates. Alphalens provides comprehensive validation. Industry-standard workflow. |
| **Optimize strategy parameters** | VectorBT | Vectorized architecture enables 1000x+ speedup. Parameter broadcasting trivial. Unmatched for optimization. |
| **Live trading with complex orders** | Backtrader | Rich order types, broker integration, multi-timeframe support. Event-driven handles state-dependent logic. |
| **Generate performance reports** | Pyfolio + Empyrical | Industry-standard tear sheets. Widely recognized. Integrates with multiple backtesting engines. |
| **Build ML-driven trading system** | **None ideal - build custom** | Poor ML integration across ecosystem. VectorBT closest but limited. Better to build custom using Empyrical for metrics. |
| **Simple moving average backtest** | VectorBT or backtesting.py | Minimal code required. VectorBT for optimization, backtesting.py for single run. |

---

## 8. Community Insights

### 8.1 Popular Solutions

- **VectorBT for optimization:** Speed advantage overwhelming (1000x for some tasks)
- **Backtrader for live trading:** Most mature broker integrations
- **Zipline-reloaded over original:** Maintained fork pattern successful
- **Library combination:** Zipline/VectorBT for backtest + Pyfolio for reporting
- **Custom solutions:** Building on Empyrical as foundation
- **Cloud platforms:** QuantRocket, QuantConnect for integrated experience

### 8.2 Controversial Topics

- **VectorBT PRO paywall:** Sustainable funding vs fragmenting community
- **Event-driven vs vectorized:** VectorBT performance advantage clear
- **Zipline complexity:** Professional vs hobbyist divide on justification
- **Backtrader metaclasses:** Elegant or over-engineered?
- **Quantopian shutdown:** Blessing (forced innovation) or curse (fragmentation)?
- **Open-source sustainability:** How to fund development without going proprietary?

### 8.3 Expert Opinions

- **Stefan Jansen (zipline-reloaded):** "Keeping libraries compatible with modern Python/Pandas is critical for longevity"
- **Community consensus:** "Zipline Pipeline is best abstraction for factor research, but complexity is barrier"
- **Performance-focused users:** "VectorBT's speed advantage is game-changing for optimization"
- **Live traders:** "Backtrader's order types and broker integration still best despite age"
- **ML practitioners:** "All libraries have poor ML integration - major gap in ecosystem"
- **Industry view:** "Professional shops use custom solutions built on Empyrical + proprietary execution"

---

## 9. Key Takeaways

### 9.1 Ecosystem State

1. No single library dominates all use cases - each excels in specific area
2. Performance is critical: VectorBT shows 1000x+ speedups possible with vectorization
3. Quantopian shutdown revealed fragility of company-backed open source
4. Maintained forks (zipline-reloaded) successfully continue abandoned projects
5. Separation of concerns works well: factor computation, portfolio construction, analytics as separate layers

### 9.2 Major Gaps

1. **ML integration** - Most critical unmet need
2. **Data handling** - Bundles too rigid, raw data too unstructured
3. **Developer experience** - Complexity limits adoption
4. **Portfolio construction** - Missing layer between signals and execution
5. **Time-series CV** - Notably absent vs general ML libraries
6. **Interactive analytics** - Static tear sheets outdated
7. **Real-time/streaming** - All libraries batch-focused

### 9.3 Opportunity Areas for New Library

1. **ML-native signal library** bridging factor research and machine learning
2. **Modern portfolio construction** layer (signal → weights → orders)
3. **Interactive analytics** dashboard (Plotly Dash alternative to Pyfolio)
4. **Flexible data abstraction** supporting all data types uniformly
5. **Time-series cross-validation** framework (py-rsample equivalent)
6. **Signal marketplace** with pre-built, tested factors
7. **Streaming architecture** for real-time factor computation
8. **Realistic transaction costs** with market impact
9. **Explainability tools** for strategy understanding
10. **Multi-asset support** as first-class feature

---

## 10. Architectural Vision for New Library

### 10.1 Core Principles

1. **Composability:** Small, focused components that work together
2. **ML-First:** Machine learning integration as core feature, not afterthought
3. **Performance:** Vectorized where possible, event-driven when necessary
4. **Developer Experience:** Progressive disclosure - simple for beginners, powerful for experts
5. **Extensibility:** Plugin architecture with clear extension points
6. **Modern Stack:** Type hints, async/await, Plotly, pandas 2.0+, NumPy 2.0+

### 10.2 Proposed Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Layer 5: Analytics & Visualization (Interactive)       │
│  - Plotly Dash dashboards                               │
│  - Three-tier output (obs/param/model)                  │
│  - Real-time monitoring                                 │
└─────────────────────────────────────────────────────────┘
                           ↑
┌─────────────────────────────────────────────────────────┐
│  Layer 4: Backtesting & Execution                       │
│  - Event-driven or vectorized execution                 │
│  - Transaction cost modeling                            │
│  - Time-series cross-validation                         │
└─────────────────────────────────────────────────────────┘
                           ↑
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Portfolio Construction (NEW - fills gap)      │
│  - Signal → weights optimization                        │
│  - Constraints (position limits, turnover, etc.)        │
│  - Risk budgeting                                       │
└─────────────────────────────────────────────────────────┘
                           ↑
┌─────────────────────────────────────────────────────────┐
│  Layer 2: Signal Generation (ML-native)                 │
│  - Traditional factors (momentum, mean reversion, etc.) │
│  - ML signals (sklearn, LightGBM, XGBoost integration)  │
│  - Feature engineering pipeline                         │
│  - Signal composition & ensembling                      │
└─────────────────────────────────────────────────────────┘
                           ↑
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Data Abstraction                              │
│  - Pluggable adapters (Yahoo, Polygon, Alpaca, etc.)    │
│  - Support OHLCV, tick, order book, alternative data    │
│  - Automatic alignment and resampling                   │
└─────────────────────────────────────────────────────────┘
```

### 10.3 Relationship to py-tidymodels

This signal library would be **Layer 2 (Signal Generation)** built on top of py-tidymodels:

- **py-hardhat:** Data preprocessing (mold/forge) for features
- **py-parsnip:** Unified model interface (already supports sklearn, prophet, arima, random_forest)
- **py-rsample:** Time-series cross-validation (to be built)
- **py-signals (NEW):** Signal specification and composition layer
- **py-portfolio (NEW):** Portfolio construction layer

The py-tidymodels architecture is PERFECT foundation for a signal library:
- ModelSpec pattern extends naturally to SignalSpec
- Three-tier output (obs/param/model) ideal for backtesting
- Engine registry pattern enables multiple signal implementations
- Dual-path (standard/raw) handles different data types

---

## 11. Next Steps & Recommendations

### 11.1 For py-tidymodels Integration

1. **Build py-rsample first:** Time-series CV is foundation for backtesting
2. **Design SignalSpec API:** Similar to ModelSpec but for signals
3. **Implement basic signals:** Momentum, mean reversion, pairs trading
4. **Add ML signal type:** sklearn/LightGBM integration as signal engine
5. **Create portfolio layer:** Signal → weights → orders
6. **Build interactive analytics:** Replace Pyfolio tear sheets with Plotly Dash

### 11.2 Research Priorities

1. Study López de Prado's "Advances in Financial ML" for time-series CV methods
2. Review cvxpy for portfolio optimization inspiration
3. Analyze QuantLib for realistic transaction cost models
4. Explore Alpaca/Polygon APIs for data integration patterns
5. Survey ML feature engineering libraries (featuretools, tsfresh)

### 11.3 Proof of Concept

Start with minimal viable product:
1. SignalSpec with 3-5 basic signal types
2. Time-series CV (walk-forward, expanding window)
3. Simple portfolio construction (equal weight, inverse vol)
4. Basic analytics (returns, Sharpe, drawdown)
5. Example notebook demonstrating workflow

---

## Sources

1. [Quantopian Zipline](https://github.com/quantopian/zipline)
2. [Stefan Jansen's Zipline Reloaded](https://github.com/stefan-jansen/zipline-reloaded)
3. [VectorBT](https://github.com/polakowo/vectorbt)
4. [Backtrader](https://github.com/mementum/backtrader)
5. [Quantopian Alphalens](https://github.com/quantopian/alphalens)
6. [CloudQuant Alphalens Fork](https://github.com/cloudQuant/alphalens)
7. [Quantopian Pyfolio](https://github.com/quantopian/pyfolio)
8. [Stefan Jansen's Pyfolio Reloaded](https://github.com/stefan-jansen/pyfolio-reloaded)
9. [Quantopian Empyrical](https://github.com/quantopian/empyrical)
10. [Zipline Pipeline API Documentation](https://zipline.ml4trading.io/_modules/zipline/pipeline/factors/factor.html)
11. [VectorBT Portfolio API](https://vectorbt.dev/api/portfolio/base/)
12. [Backtrader Indicator Development Guide](https://www.backtrader.com/docu/inddev/)
13. [Alphalens API Reference](https://alphalens.ml4trading.io/api-reference.html)
14. [QuantRocket: How You Can Still Use Quantopian](https://www.quantrocket.com/alternatives/quantopian/)
15. [Medium: Battle-Tested Backtesters Comparison](https://medium.com/@trading.dude/battle-tested-backtesters-comparing-vectorbt-zipline-and-backtrader-for-financial-strategy-dee33d33a9e0)
16. [QuantStart: Event-Driven Backtesting with Python](https://www.quantstart.com/articles/Event-Driven-Backtesting-with-Python-Part-I/)
17. [PipeKit: Python Backtesting Frameworks](https://pipekit.io/blog/python-backtesting-frameworks-six-options-to-consider)
18. [Stefan Jansen's Machine Learning for Trading](https://stefan-jansen.github.io/machine-learning-for-trading/)

---

**End of Report**
