# Tidyverse and Tidymodels Patterns: Feasibility Study for Python Signal Detection Library

**Research Date**: 2025-12-07
**Purpose**: Evaluate applicability of R tidyverse/tidymodels design patterns to a Python signal detection library

---

## Executive Summary

The tidyverse ecosystem represents a coherent design philosophy centered on **human-centered API design**, **composability through simple functions**, and **consistent data structures**. The tidymodels extension applies these principles to machine learning with patterns highly transferable to signal detection.

**Key Finding**: Most tidyverse/tidymodels patterns can be effectively adapted to Python, with careful consideration of language differences (mutability, evaluation semantics, type systems).

**Recommendation**: Adopt core patterns (immutable specifications, registry-based engines, standardized outputs, prep/apply pipelines) while leveraging Python strengths (type hints, method chaining via pandas, decorator-based registration).

---

## 1. Core Tidyverse Principles and Data Manipulation Philosophy

### 1.1 The Four Foundational Tenets

The tidyverse manifesto establishes four design principles that form the philosophical foundation:

1. **Reuse Existing Data Structures**
   - Leverage tibbles (enhanced data frames) rather than custom types
   - **Transfer to Python**: Use pandas DataFrames as primary structure
   - **Benefit**: Reduces cognitive load; users work with familiar objects

2. **Compose Simple Functions with the Pipe**
   - "The quality of the glue determines the power of the system"
   - Complex solutions emerge from chaining single-purpose functions
   - **Transfer to Python**: Method chaining via dot notation
   - **Benefit**: Left-to-right readable code that mirrors human thought

3. **Embrace Functional Programming**
   - Immutable objects, pure functions, avoid side-effects
   - Separate transformations from side-effects
   - **Transfer to Python**: Frozen dataclasses for specs, pure functions for transformations
   - **Benefit**: Predictable, testable, composable code

4. **Design for Humans**
   - "Programs must be written for people to read"
   - Thinking time is the bottleneck, not computing time
   - Invest in evocative, discoverable naming
   - **Transfer to Python**: Enhanced by type hints and docstrings
   - **Benefit**: Lower learning curve, self-documenting APIs

### 1.2 Grammar of Verbs (dplyr)

dplyr provides a "grammar of data manipulation" with consistent verbs:

| Verb | Purpose | Pattern |
|------|---------|---------|
| `select()` | Choose columns | Column selection by name, type, pattern |
| `filter()` | Choose rows | Row selection by logical conditions |
| `mutate()` | Transform variables | Create/modify columns |
| `summarize()` | Aggregate | Reduce to summary statistics |
| `group_by()` | Define groups | Split-apply-combine |
| `arrange()` | Sort | Reorder by column values |

**Key Insight**: Each verb does one thing well. Complexity emerges from composition.

**Application to Signal Detection**:
```python
# Proposed API inspired by grammar of verbs
(signal_data
  .filter_frequency(low=10, high=100)      # analogous to filter()
  .detect_peaks(threshold=0.5)              # domain-specific verb
  .extract_features(['amplitude', 'width']) # analogous to select()
  .group_by('channel')                      # existing pandas method
  .aggregate_detections(method='count'))    # analogous to summarize()
```

### 1.3 Pipe Operator Philosophy

The pipe (`%>%` or `|>`) is a composition mechanism enabling:
- Avoidance of intermediate objects
- Elimination of nested function calls
- Readable left-to-right, top-to-bottom flow

**Python Equivalent**: Method chaining with dot notation
- Pandas already supports via `assign()`, `pipe()`, `query()`
- Works well when each method returns a DataFrame
- Consideration: Return `self` (mutable) vs. new object (immutable)

### 1.4 Non-Standard Evaluation (NSE)

NSE allows accessing argument expressions, not just values. Enables cleaner syntax:
```r
# With NSE (tidyverse)
filter(data, column > 10)

# Without NSE (standard R)
filter(data, data$column > 10)
```

**Challenge for Python**: Lacks native NSE; requires explicit quoting
**Solutions**:
- String-based references: `filter('column > 10')`
- Lambda functions: `filter(lambda df: df.column > 10)`
- Delayed evaluation (Polars-style expressions)

**Recommendation**: Accept both strings and callables for flexibility

---

## 2. Tidymodels Ecosystem Patterns

### 2.1 Parsnip: Model Specification Pattern

**Core Philosophy**: Separate specification of "what to do" from "doing it"

**Three-Step Specification**:
1. **Type**: Declare mathematical structure (`linear_reg()`, `rand_forest()`)
2. **Engine**: Choose computational backend (`set_engine('lm')`, `set_engine('glmnet')`)
3. **Mode**: Specify outcome type (`set_mode('regression')`)

**Key Properties**:
- **Data Independence**: Specifications built without referencing data
- **Immutability**: Arguments not evaluated until `fit()`
- **Portability**: Configurations can be saved, shared, versioned

**Example Workflow**:
```r
spec <- linear_reg(penalty = 0.1) %>%
  set_engine("glmnet") %>%
  set_mode("regression")

fitted <- spec %>% fit(y ~ x1 + x2, data = train)
predictions <- fitted %>% predict(test)
```

**Application to Signal Detection**:
```python
from dataclasses import dataclass

@dataclass(frozen=True)
class DetectorSpec:
    detector_type: str
    engine: str
    threshold: float = 0.5

# Specification (no data involved)
spec = PeakDetector(threshold=0.5, method='continuous_wavelet')
spec = spec.set_engine('pywavelets')

# Execution (data provided)
fitted = spec.fit(training_signals)
detections = fitted.detect(new_signals)
```

**Benefits**:
- Detector configurations are portable and versioned
- Easy to swap algorithms without changing analysis code
- Clear separation between configuration and execution

### 2.2 Engine Registry Pattern

**Concept**: Multiple implementations (engines) for same detector type

**Example**:
```python
# Same detector type, different engines
peak_spec1 = PeakDetector().set_engine('scipy')
peak_spec2 = PeakDetector().set_engine('cwt')
peak_spec3 = PeakDetector().set_engine('custom_ml')

# All three have identical interface for fit/detect
```

**Implementation via Decorator**:
```python
@register_detector('peak_detector', 'wavelet')
class WaveletPeakEngine(DetectorEngine):
    def fit(self, spec, data): ...
    def detect(self, fitted, new_data): ...
    def extract_outputs(self, fitted): ...
```

**Benefits**:
- Extensibility without modifying core code
- Users can plug in custom algorithms
- Consistent interface across implementations

### 2.3 Parameter Standardization

**Problem**: Different packages use different names for same concepts
- Random forest: `mtry` (randomForest) vs. `max_features` (sklearn)
- Trees: `ntree` vs. `n_estimators` vs. `num.trees`

**Solution**: Unified vocabulary with translation layer
```python
# User-facing unified parameters
spec = RandomForest(trees=100, mtry=5)

# Translated to engine-specific parameters
spec.set_engine('sklearn')  # → n_estimators=100, max_features=5
spec.set_engine('ranger')   # → num.trees=100, mtry=5
```

**Implementation**: Parameter mapping dictionary in each engine
```python
class SklearnRandomForestEngine:
    param_map = {
        'trees': 'n_estimators',
        'mtry': 'max_features'
    }
```

### 2.4 Recipes: Preprocessing Pipeline Pattern

**Three-Phase Workflow**:

1. **Specification** (`recipe()` + `step_*()`)
   - Declarative: define what transformations should occur
   - Data-agnostic: no data required at specification time
   ```r
   rec <- recipe(y ~ ., data = train) %>%
     step_normalize(all_numeric()) %>%
     step_dummy(all_nominal())
   ```

2. **Preparation** (`prep()`)
   - Compute statistics from training data only
   - Examples: normalization means/SDs, factor levels, PCA loadings
   ```r
   prepped <- prep(rec, training = train)
   ```

3. **Application** (`bake()`)
   - Apply learned transformations to any dataset
   - No recomputation; uses stored statistics
   ```r
   train_processed <- bake(prepped, new_data = train)
   test_processed <- bake(prepped, new_data = test)
   ```

**Critical Principle**: All statistics computed on training data only, preventing data leakage

**Application to Signal Processing**:
```python
# Signal preprocessing pipeline
pipeline = (SignalPipeline(training_signals)
    .step_normalize(method='zscore')
    .step_denoise(method='wavelet', threshold='auto')
    .step_filter(low_freq=10, high_freq=100)
    .step_extract_features(['spectral_centroid', 'zero_crossings']))

# Prep: learn normalization params, noise profile, etc.
prepped = pipeline.prep()

# Apply: use learned parameters on new signals
test_processed = prepped.apply(test_signals)
future_processed = prepped.apply(future_signals)
```

**Benefits**:
- Prevents test set information leakage
- Ensures consistency between training and deployment
- Composable, reusable preprocessing steps

### 2.5 Workflows: Bundling Pattern

**Concept**: Combine preprocessing + model + postprocessing into single object

**Advantages**:
- Single `fit()` call executes entire pipeline
- Recipe and model stay synchronized
- Easier to track and version complete analysis

**Example**:
```r
wf <- workflow() %>%
  add_recipe(rec) %>%
  add_model(spec)

fitted_wf <- fit(wf, data = train)
predictions <- predict(fitted_wf, test)
```

**Application to Signal Detection**:
```python
workflow = (DetectionWorkflow()
    .add_preprocessing(signal_pipeline)
    .add_detector(peak_detector_spec)
    .add_postprocessing(merge_nearby_peaks))

fitted_workflow = workflow.fit(training_data)
detections = fitted_workflow.detect(new_data)
```

### 2.6 Broom: Standardized Output Pattern

**Philosophy**: Standardize diverse model outputs into consistent tibble format

**Three-Function Pattern**:

| Function | Returns | Content | Use Case |
|----------|---------|---------|----------|
| `tidy()` | Component-level | Coefficients, p-values, statistics | Statistical inference |
| `glance()` | Model-level | R², AIC, BIC, single-row summary | Model comparison |
| `augment()` | Observation-level | Fitted values, residuals, diagnostics | Residual analysis |

**Column Naming Convention**:
- New columns prefixed with `.` to prevent overwriting
- Examples: `.fitted`, `.resid`, `.se.fit`, `.cooksd`

**Application to Signal Detection**:
```python
# Detector returns three DataFrames

# 1. Detection-level (analogous to augment)
detections = pd.DataFrame({
    'timestamp': [...],
    '.detection_time': [...],
    '.confidence': [...],
    '.classification': [...],
    '.amplitude': [...]
})

# 2. Parameter-level (analogous to tidy)
parameters = pd.DataFrame({
    'parameter': ['threshold', 'window_size', 'min_distance'],
    'value': [0.5, 100, 50],
    'tuned': [True, False, True]
})

# 3. Metrics-level (analogous to glance)
metrics = pd.DataFrame({
    'precision': [0.92],
    'recall': [0.87],
    'f1_score': [0.89],
    'mean_latency_ms': [12.3]
})
```

**Benefits**:
- Predictable output structure across all detectors
- Enables consistent downstream analysis
- Facilitates algorithm comparison

### 2.7 Rsample: Time-Aware Resampling

**Core Insight**: Random resampling invalid for time series—creates lookahead bias

**Time-Based Methods**:

| Method | Pattern | Use Case |
|--------|---------|----------|
| `rolling_origin()` | Expanding windows | Walk-forward validation |
| `sliding_window()` | Fixed-size windows | Regular time series |
| `sliding_index()` | Index-relative windows | Irregular series, date-based lookback |
| `sliding_period()` | Period-grouped windows | Monthly/yearly from daily data |

**Key Property**: Deterministic (independent of random seed)

**Principle**: Analysis set never contains observations later than assessment set

**Application to Signal Detection**:
```python
# Rolling origin for real-time detection validation
from signal_detection.resampling import rolling_origin

splits = rolling_origin(
    signal_data,
    initial=1000,     # initial training window
    assess=100,       # test window size
    cumulative=True   # expanding window
)

for split in splits:
    train_signals = split.analysis_set()
    test_signals = split.assessment_set()

    detector = detector.fit(train_signals)
    performance = detector.evaluate(test_signals)
```

**Benefit**: Realistic performance estimates for real-time deployment

### 2.8 Yardstick: Metric Collections

**Pattern**: Calculate multiple performance metrics simultaneously

**Metric Types**:
- **Numeric**: RMSE, MAE, R²
- **Classification**: Accuracy, precision, recall, F1
- **Probabilistic**: ROC AUC, log loss, Brier score

**Custom Metric Sets**:
```r
detection_metrics <- metric_set(precision, recall, f1_score, latency)
results <- detection_metrics(truth, predictions)
```

**Multiclass Handling**: Macro, micro, macro-weighted averaging

**Application to Signal Detection**:
```python
from signal_detection.metrics import MetricSet

# Define custom metric collection
signal_metrics = MetricSet([
    precision,
    recall,
    f1_score,
    mean_absolute_error,
    detection_latency
])

# Evaluate on grouped data
performance = (results
    .group_by('signal_type')
    .apply(signal_metrics, truth_col='actual', pred_col='detected'))
```

---

## 3. Tidyquant: Quantitative Finance Patterns

### 3.1 Core Philosophy

**Goal**: Bring quantitative finance into tidyverse by integrating specialized packages (zoo, xts, quantmod, TTR, PerformanceAnalytics) with tidy data principles

**Key Insight**: Financial analysis requires both tidy data manipulation AND domain-specific calculations

### 3.2 Five Core Functions

| Function | Purpose | Analogous To | Pattern |
|----------|---------|--------------|---------|
| `tq_get()` | Acquire financial data | Data import | One-stop data retrieval |
| `tq_mutate()` | Add calculations | `dplyr::mutate()` | Add columns, keep all |
| `tq_transmute()` | Transform data | `dplyr::transmute()` | Return only new columns |
| `tq_performance()` | Performance metrics | `yardstick` | Calculate performance stats |
| `tq_portfolio()` | Portfolio aggregation | `dplyr::summarize()` | Aggregate assets |

### 3.3 Rolling Calculations

**Pattern**: Apply windowed operations to time series
```r
stock_prices %>%
  tq_mutate(
    select = close,
    mutate_fun = rollapply,
    width = 30,
    FUN = mean
  )
```

**Available**: `rollapply`, `rollmax`, `rollcor` (rolling correlation)

### 3.4 Scaling Pattern

**Concept**: "Greatest benefit is ability to easily scale financial analysis"
**Workflow**:
1. Create analysis for single security
2. Use `group_by()` to extend to multiple securities
3. All operations automatically applied per group

**Application to Signal Detection**:
```python
# Multi-channel signal processing
(sensor_data
  .group_by('channel_id')
  .transform_signal(method='wavelet')
  .detect_events(detector_spec)
  .calculate_metrics(metric_set))
```

### 3.5 Key Transferable Patterns

1. **Domain-Specific Verbs**: `tq_*` functions are finance-specific verbs
   - **Signal Detection**: `sd_detect()`, `sd_filter()`, `sd_transform()`

2. **Integration of Specialized Libraries**: tidyquant wraps quantmod, TTR, etc.
   - **Signal Detection**: Wrap scipy.signal, PyWavelets, scikit-learn

3. **Seamless Tidy + Domain**: Financial calcs fit naturally into tidy pipelines
   - **Signal Detection**: Signal operations should chain naturally with pandas

---

## 4. Design Patterns for Python Signal Detection Library

### 4.1 Recommended Architecture

```
signal_detection/
├── core/
│   ├── detector_spec.py      # Immutable detector specifications
│   ├── engine_registry.py    # Registry pattern for algorithms
│   └── detector_fit.py       # Fitted detector objects
├── preprocessing/
│   ├── pipeline.py           # Pipeline with prep/apply pattern
│   └── steps.py              # Individual preprocessing steps
├── detectors/
│   ├── peak_detector.py      # Detector type definitions
│   ├── event_detector.py
│   └── anomaly_detector.py
├── engines/
│   ├── scipy_engine.py       # Scipy-based implementations
│   ├── wavelet_engine.py     # PyWavelets implementations
│   └── ml_engine.py          # ML-based detectors
├── resampling/
│   └── time_series.py        # Rolling origin, sliding window
├── metrics/
│   └── detection_metrics.py  # Metric collections
└── utils/
    └── selectors.py          # Channel/feature selectors
```

### 4.2 Core API Design

**1. Detector Specification (Parsnip-Inspired)**
```python
from dataclasses import dataclass, replace

@dataclass(frozen=True)
class DetectorSpec:
    detector_type: str
    engine: str = 'scipy'
    mode: str = 'detection'
    args: dict = None

    def set_engine(self, engine: str, **kwargs):
        return replace(self, engine=engine, args=kwargs)

    def set_args(self, **kwargs):
        current_args = self.args or {}
        return replace(self, args={**current_args, **kwargs})

# Usage
spec = (PeakDetector(threshold=0.5)
    .set_engine('wavelet', wavelet='mexh')
    .set_args(min_distance=50))
```

**2. Preprocessing Pipeline (Recipes-Inspired)**
```python
class SignalPipeline:
    def __init__(self):
        self.steps = []
        self.fitted_steps = []

    def step_normalize(self, method='zscore', **kwargs):
        self.steps.append(('normalize', method, kwargs))
        return self

    def step_filter(self, low_freq=None, high_freq=None, **kwargs):
        self.steps.append(('filter', (low_freq, high_freq), kwargs))
        return self

    def prep(self, training_data):
        """Learn parameters from training data"""
        for step_name, step_args, step_kwargs in self.steps:
            # Compute and store parameters
            fitted_step = self._fit_step(step_name, training_data,
                                         step_args, step_kwargs)
            self.fitted_steps.append(fitted_step)
            training_data = fitted_step.transform(training_data)
        return self

    def apply(self, new_data):
        """Apply learned transformations"""
        result = new_data.copy()
        for fitted_step in self.fitted_steps:
            result = fitted_step.transform(result)
        return result
```

**3. Standardized Outputs (Broom-Inspired)**
```python
class DetectorFit:
    def detect(self, new_data):
        """Returns detection results"""
        # ... detection logic ...
        return self.extract_outputs()

    def extract_outputs(self):
        """Returns three DataFrames"""
        return {
            'detections': self._get_detections(),
            'parameters': self._get_parameters(),
            'metrics': self._get_metrics()
        }

    def _get_detections(self):
        """Detection-level results (observation-level)"""
        return pd.DataFrame({
            'timestamp': self.detection_times,
            '.confidence': self.confidences,
            '.amplitude': self.amplitudes,
            '.classification': self.classes,
            'channel': self.channels,
            'detector_type': self.spec.detector_type,
            'engine': self.spec.engine
        })

    def _get_parameters(self):
        """Parameter-level results (component-level)"""
        return pd.DataFrame({
            'parameter': ['threshold', 'window_size'],
            'value': [self.threshold, self.window_size],
            'learned': [True, False],
            'detector_type': self.spec.detector_type
        })

    def _get_metrics(self):
        """Metrics-level results (model-level)"""
        return pd.DataFrame({
            'precision': [self.precision],
            'recall': [self.recall],
            'f1_score': [self.f1],
            'mean_latency_ms': [self.mean_latency],
            'detector_type': [self.spec.detector_type],
            'engine': [self.spec.engine]
        })
```

**4. Engine Registry (Extensibility)**
```python
from abc import ABC, abstractmethod

class DetectorEngine(ABC):
    @abstractmethod
    def fit(self, spec, data):
        """Fit detector to data"""
        pass

    @abstractmethod
    def detect(self, fitted, new_data):
        """Make detections on new data"""
        pass

    @abstractmethod
    def extract_outputs(self, fitted):
        """Return standardized three-DataFrame output"""
        pass

# Global registry
_DETECTOR_REGISTRY = {}

def register_detector(detector_type, engine_name):
    """Decorator for registering detector engines"""
    def decorator(engine_class):
        key = (detector_type, engine_name)
        _DETECTOR_REGISTRY[key] = engine_class
        return engine_class
    return decorator

def get_engine(detector_type, engine_name):
    """Retrieve registered engine"""
    key = (detector_type, engine_name)
    if key not in _DETECTOR_REGISTRY:
        raise ValueError(f"No engine '{engine_name}' for '{detector_type}'")
    return _DETECTOR_REGISTRY[key]()

# Usage
@register_detector('peak_detector', 'scipy')
class ScipyPeakEngine(DetectorEngine):
    def fit(self, spec, data):
        # Implementation
        pass

    def detect(self, fitted, new_data):
        # Implementation
        pass

    def extract_outputs(self, fitted):
        # Return three DataFrames
        pass
```

**5. Time-Aware Validation**
```python
class RollingOrigin:
    def __init__(self, data, initial, assess, cumulative=True):
        self.data = data
        self.initial = initial
        self.assess = assess
        self.cumulative = cumulative

    def __iter__(self):
        for i in range(self.initial, len(self.data) - self.assess, self.assess):
            if self.cumulative:
                train = self.data[:i]
            else:
                train = self.data[i-self.initial:i]
            test = self.data[i:i+self.assess]
            yield Split(train, test)

# Usage
for split in RollingOrigin(signal_data, initial=1000, assess=100):
    detector = spec.fit(split.analysis_set())
    metrics = detector.evaluate(split.assessment_set())
```

**6. Selector Functions**
```python
def all_channels():
    """Select all signal channels"""
    return lambda df: [c for c in df.columns if c.startswith('ch_')]

def frequency_band(low, high):
    """Select frequency components in range"""
    return lambda df: df.select_dtypes(include='number').columns

def matches_pattern(pattern):
    """Select columns matching regex pattern"""
    import re
    return lambda df: [c for c in df.columns if re.match(pattern, c)]

# Usage in pipeline
pipeline.step_normalize(all_channels())
pipeline.step_filter(frequency_band(10, 100))
```

### 4.3 Method Chaining Design

**Option 1: Mutable (Return Self)**
```python
class SignalData:
    def filter(self, low, high):
        self._data = self._apply_filter(low, high)
        return self

    def detect(self, detector):
        self._detections = detector.detect(self._data)
        return self

# Usage
signal.filter(10, 100).detect(peak_detector)
```

**Pros**: Memory efficient, familiar to pandas users
**Cons**: Side effects, not thread-safe, harder to debug

**Option 2: Immutable (Return New Object)**
```python
class SignalData:
    def filter(self, low, high):
        new_data = self._apply_filter(low, high)
        return SignalData(new_data)

    def detect(self, detector):
        detections = detector.detect(self._data)
        return DetectionResult(self._data, detections)

# Usage
filtered = signal.filter(10, 100)
result = filtered.detect(peak_detector)
```

**Pros**: No side effects, thread-safe, easier to debug
**Cons**: Memory overhead from copying

**Recommendation**:
- **Immutable for specifications** (DetectorSpec, Pipeline)
- **Mutable for large data** (signal arrays) with clear documentation
- Provide both fluent and explicit APIs for different use cases

### 4.4 Grammar of Verbs for Signal Processing

**Proposed Core Verbs**:

| Verb | Purpose | Returns |
|------|---------|---------|
| `filter_frequency()` | Frequency domain filtering | Filtered signal |
| `filter_time()` | Time domain filtering | Filtered signal |
| `detect()` | Pattern/event detection | Detection results |
| `transform()` | Apply transformation | Transformed signal |
| `extract_features()` | Feature extraction | Feature DataFrame |
| `aggregate()` | Aggregate across channels/time | Summary statistics |
| `validate()` | Quality checks | Validation results |
| `resample()` | Change sampling rate | Resampled signal |

**Example Pipeline**:
```python
results = (signal_data
    .filter_frequency(low=10, high=100)
    .filter_time(method='median', window=5)
    .detect(peak_detector)
    .extract_features(['amplitude', 'duration', 'slope'])
    .group_by('channel')
    .aggregate(method='mean'))
```

---

## 5. Python-Specific Considerations

### 5.1 Method Chaining in Pandas

**Current Pandas Support**:
- `assign()`: Add columns (like `mutate()`)
- `pipe()`: Apply custom functions
- `query()`: Filter with string expressions

**Example**:
```python
(df
  .assign(new_col=lambda x: x.col1 + x.col2)
  .query('new_col > 10')
  .pipe(custom_function)
  .groupby('group')
  .agg({'new_col': 'mean'}))
```

**Limitation**: Debugging long chains harder (no intermediate objects)
**Mitigation**: Allow both styles:
```python
# Chained (concise)
result = signal.filter(10, 100).detect(detector)

# Explicit (debuggable)
filtered = signal.filter(10, 100)
result = filtered.detect(detector)
```

### 5.2 Type Hints for Discoverability

**Advantage Over R**: Python type hints enable:
- IDE autocomplete
- Static type checking
- Runtime validation (pydantic)
- Self-documenting APIs

**Recommendation**: Full type annotations
```python
from typing import Optional, Union, List
from pandas import DataFrame

def detect_peaks(
    signal: DataFrame,
    threshold: float = 0.5,
    min_distance: int = 50,
    channels: Optional[List[str]] = None
) -> DataFrame:
    """
    Detect peaks in signal data.

    Args:
        signal: Input signal DataFrame with time index
        threshold: Detection threshold (0-1)
        min_distance: Minimum samples between peaks
        channels: Channel names to process (None = all)

    Returns:
        DataFrame with columns: timestamp, channel, amplitude, confidence
    """
    ...
```

### 5.3 Immutability vs. Performance

**Challenge**: Python mutable by default; immutability creates copies

**For Specifications** (small objects):
```python
from dataclasses import dataclass

@dataclass(frozen=True)
class DetectorSpec:
    threshold: float
    method: str
```

**For Data** (large arrays):
```python
import numpy as np

class SignalArray:
    def __init__(self, data: np.ndarray, copy: bool = False):
        self._data = data.copy() if copy else data

    def filter(self, low, high, inplace=False):
        if inplace:
            self._data = self._apply_filter(self._data, low, high)
            return self
        else:
            new_data = self._apply_filter(self._data, low, high)
            return SignalArray(new_data)
```

**Recommendation**:
- Immutable specs (configurations)
- Offer both in-place and copy modes for data
- Document clearly which operations modify vs. return new

### 5.4 Decorator-Based Registration vs. Manual

**R Approach**: Manual registration with helper functions
**Python Advantage**: Decorators more elegant

```python
# Decorator-based (Pythonic)
@register_detector('peak', 'scipy')
class ScipyPeakDetector(DetectorEngine):
    ...

# vs. Manual (R-style)
class ScipyPeakDetector(DetectorEngine):
    ...

register_detector_manually('peak', 'scipy', ScipyPeakDetector)
```

**Recommendation**: Use decorators but provide manual option for dynamic registration

---

## 6. Implementation Roadmap

### Phase 1: Core Infrastructure
- [ ] Immutable DetectorSpec with frozen dataclass
- [ ] Engine registry with decorator-based registration
- [ ] Abstract DetectorEngine base class
- [ ] Basic fit/detect workflow

### Phase 2: Preprocessing
- [ ] Pipeline class with step composition
- [ ] Prep/apply pattern for learning transformations
- [ ] Common steps: normalize, filter, denoise
- [ ] Integration with DetectorSpec via workflow

### Phase 3: Standardized Outputs
- [ ] Three-DataFrame output pattern
- [ ] Column naming conventions (dot-prefix)
- [ ] extract_outputs() method for all engines
- [ ] Integration with pandas for downstream analysis

### Phase 4: Time-Aware Validation
- [ ] RollingOrigin resampling
- [ ] SlidingWindow resampling
- [ ] Integration with detector evaluation
- [ ] Performance tracking across splits

### Phase 5: Metrics and Evaluation
- [ ] MetricSet for bundled metrics
- [ ] Detection-specific metrics (precision, recall, latency)
- [ ] Quality metrics (SNR, THD)
- [ ] Grouped evaluation (per channel, per signal type)

### Phase 6: Advanced Features
- [ ] Workflow bundling (pipeline + detector + postprocessing)
- [ ] Selector functions (all_channels, frequency_band)
- [ ] Hyperparameter tuning integration
- [ ] Visualization utilities

---

## 7. Key Recommendations

### 7.1 Adopt These Patterns

1. **Immutable Specifications** (parsnip)
   - Clear separation between configuration and execution
   - Enables reproducibility and version control

2. **Registry-Based Engines** (parsnip)
   - Extensibility without core modifications
   - Consistent interface across implementations

3. **Prep/Apply Pipelines** (recipes)
   - Prevents data leakage
   - Ensures training/deployment consistency

4. **Three-DataFrame Outputs** (broom)
   - Predictable outputs enable ecosystem
   - Facilitates algorithm comparison

5. **Time-Aware Resampling** (rsample)
   - Critical for signal detection validation
   - Prevents lookahead bias

6. **Grammar of Verbs** (dplyr)
   - Intuitive, domain-specific API
   - Composability through method chaining

### 7.2 Adapt These Patterns

1. **NSE → String/Callable Flexibility**
   - Accept both `filter('freq > 10')` and `filter(lambda s: s.freq > 10)`

2. **Pipe → Method Chaining**
   - Leverage Python's dot notation
   - Provide both fluent and explicit APIs

3. **Tibbles → Pandas DataFrames**
   - Use existing ecosystem
   - Add custom accessors via pandas extensions if needed

4. **Formulas → Explicit Parameters**
   - Python lacks R-style formulas
   - Use explicit parameters with clear type hints

### 7.3 Leverage Python Advantages

1. **Type Hints**
   - Full API annotations for discoverability
   - IDE support superior to R

2. **Decorators**
   - Elegant registration mechanism
   - More Pythonic than manual registration

3. **Multiple Dispatch** (via functools.singledispatch)
   - Method specialization by type
   - Alternative to S3/S4 generics

4. **Context Managers**
   - Resource management for real-time processing
   - Clean setup/teardown

### 7.4 Avoid These Pitfalls

1. **Don't Force NSE**
   - Python evaluation semantics different from R
   - Explicit is better than implicit (Zen of Python)

2. **Don't Over-Mutate**
   - Returning `self` considered unpythonic
   - Balance fluency with functional purity

3. **Don't Ignore Performance**
   - Signal processing more performance-critical than typical data analysis
   - Offer optimized paths when needed

4. **Don't Abandon Pandas Conventions**
   - Users expect pandas-like behavior
   - Extend, don't replace

---

## 8. Conclusion

The tidyverse/tidymodels ecosystem provides a coherent, battle-tested set of design patterns highly applicable to a Python signal detection library. The core principles—human-centered design, composability, immutability of specifications, and standardized outputs—transcend language boundaries.

**Key Takeaway**: Most patterns transfer effectively to Python with thoughtful adaptation to language idioms. The resulting library would offer:

- **Intuitive API**: Grammar of verbs + method chaining
- **Extensibility**: Registry pattern for custom algorithms
- **Reproducibility**: Immutable specs + prep/apply pipelines
- **Consistency**: Standardized three-DataFrame outputs
- **Validity**: Time-aware resampling prevents lookahead bias

**Next Steps**:
1. Prototype core architecture (DetectorSpec, registry, engines)
2. Implement 2-3 reference detectors demonstrating patterns
3. Develop preprocessing pipeline with prep/apply
4. Create comprehensive documentation with tidyverse comparisons
5. Gather user feedback on API ergonomics

The investment in design consistency will compound as the ecosystem grows, just as it has for tidyverse.

---

## References

See `tidyverse_patterns_research.json` for complete citations and detailed technical information.

**Key Resources**:
1. [Tidyverse Design Guide](https://design.tidyverse.org/)
2. [Tidy Modeling with R](https://www.tmwr.org/)
3. [Tidyverse Principles](https://tidyverse.tidyverse.org/articles/manifesto.html)
4. [Broom Package](https://broom.tidymodels.org/)
5. [Tidyquant Documentation](https://business-science.github.io/tidyquant/)
