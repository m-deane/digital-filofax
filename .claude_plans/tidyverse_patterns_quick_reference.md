# Tidyverse/Tidymodels Patterns: Quick Reference for Signal Detection Library

## Pattern Cheat Sheet

### 1. Immutable Specification Pattern (parsnip)

**R (parsnip)**:
```r
spec <- linear_reg(penalty = 0.1) %>%
  set_engine("glmnet") %>%
  set_mode("regression")

fitted <- spec %>% fit(y ~ x, data = train)
```

**Python (proposed)**:
```python
@dataclass(frozen=True)
class DetectorSpec:
    threshold: float = 0.5

spec = PeakDetector(threshold=0.5).set_engine('wavelet')
fitted = spec.fit(training_signals)
```

**Key Points**:
- Specifications frozen (immutable)
- Data-independent until fit()
- Portable, versionable, reusable

---

### 2. Engine Registry Pattern (parsnip)

**R (parsnip)**:
```r
# Multiple engines for same model type
rf_spec %>% set_engine("ranger")
rf_spec %>% set_engine("randomForest")
```

**Python (proposed)**:
```python
@register_detector('peak_detector', 'scipy')
class ScipyPeakEngine(DetectorEngine):
    def fit(self, spec, data): ...
    def detect(self, fitted, new_data): ...

# Usage
spec.set_engine('scipy')  # or 'wavelet', 'ml', etc.
```

**Key Points**:
- One detector type, multiple implementations
- Decorator-based registration in Python
- Consistent interface across engines

---

### 3. Prep-and-Apply Pattern (recipes)

**R (recipes)**:
```r
rec <- recipe(y ~ ., data = train) %>%
  step_normalize(all_numeric()) %>%
  step_dummy(all_nominal())

prepped <- prep(rec, training = train)
train_processed <- bake(prepped, train)
test_processed <- bake(prepped, test)
```

**Python (proposed)**:
```python
pipeline = (SignalPipeline()
    .step_normalize()
    .step_filter(low=10, high=100))

pipeline.prep(training_signals)  # Learn parameters
test_processed = pipeline.apply(test_signals)  # Apply
```

**Key Points**:
- Statistics computed once on training data
- Consistently applied to new data
- Prevents data leakage

---

### 4. Three-Output Pattern (broom)

**R (broom)**:
```r
tidy(model)     # Component-level (coefficients)
glance(model)   # Model-level (R², AIC)
augment(model)  # Observation-level (fitted, residuals)
```

**Python (proposed)**:
```python
outputs = detector.extract_outputs()

# Returns dict with three DataFrames:
outputs['detections']   # Detection-level results
outputs['parameters']   # Detector parameters
outputs['metrics']      # Performance metrics
```

**Key Points**:
- Always three DataFrames
- Dot-prefix for new columns (.fitted, .confidence)
- Consistent across all detector types

---

### 5. Grammar of Verbs Pattern (dplyr)

**R (dplyr)**:
```r
data %>%
  select(var1, var2) %>%
  filter(var1 > 10) %>%
  mutate(new_var = var1 + var2) %>%
  summarize(mean_var = mean(new_var))
```

**Python (proposed)**:
```python
(signal_data
  .filter_frequency(low=10, high=100)  # Domain verb
  .detect_peaks(threshold=0.5)          # Domain verb
  .extract_features(['amplitude'])      # Domain verb
  .aggregate(method='mean'))            # Domain verb
```

**Key Points**:
- Verb-based API (detect, filter, transform, extract)
- Method chaining for composition
- Each verb does one thing well

---

### 6. Time-Aware Resampling (rsample)

**R (rsample)**:
```r
splits <- rolling_origin(
  data,
  initial = 365,
  assess = 30,
  cumulative = TRUE
)
```

**Python (proposed)**:
```python
splits = RollingOrigin(
    signal_data,
    initial=1000,
    assess=100,
    cumulative=True
)

for split in splits:
    detector.fit(split.analysis_set())
    detector.evaluate(split.assessment_set())
```

**Key Points**:
- Training never includes future data
- Expanding or sliding windows
- Deterministic (not random)

---

### 7. Metric Collections (yardstick)

**R (yardstick)**:
```r
detection_metrics <- metric_set(
  precision, recall, f1_score
)

results <- detection_metrics(truth, predictions)
```

**Python (proposed)**:
```python
signal_metrics = MetricSet([
    precision,
    recall,
    f1_score,
    detection_latency
])

results = signal_metrics(truth, predictions)
```

**Key Points**:
- Bundled metrics computed together
- Works with grouped data
- Custom metric sets

---

### 8. Workflow Bundling (workflows)

**R (workflows)**:
```r
wf <- workflow() %>%
  add_recipe(rec) %>%
  add_model(spec)

fitted_wf <- fit(wf, data = train)
```

**Python (proposed)**:
```python
workflow = (DetectionWorkflow()
    .add_preprocessing(pipeline)
    .add_detector(spec)
    .add_postprocessing(merger))

fitted = workflow.fit(training_data)
```

**Key Points**:
- Bundle preprocessing + detector + postprocessing
- Single fit() call executes all
- Keep components synchronized

---

### 9. Selector Functions (recipes/dplyr)

**R (recipes)**:
```r
recipe %>%
  step_normalize(all_numeric()) %>%
  step_dummy(all_nominal_predictors())
```

**Python (proposed)**:
```python
def all_channels():
    return lambda df: [c for c in df.columns
                       if c.startswith('ch_')]

pipeline.step_normalize(all_channels())
```

**Key Points**:
- Avoid hardcoding variable names
- Pattern-based or type-based selection
- Makes pipelines adaptable

---

### 10. Parameter Translation (parsnip)

**R (parsnip)**:
```r
# Unified interface
rf_spec <- rand_forest(trees = 100, mtry = 5)

# Translates to engine-specific
rf_spec %>% set_engine("ranger")     # num.trees, mtry
rf_spec %>% set_engine("randomForest") # ntree, mtry
```

**Python (proposed)**:
```python
class ScipyEngine:
    param_map = {
        'threshold': 'height',
        'min_distance': 'distance'
    }

    def translate_params(self, unified_params):
        return {self.param_map.get(k, k): v
                for k, v in unified_params.items()}
```

**Key Points**:
- Unified parameter names
- Map to engine-specific names
- Users learn once, apply everywhere

---

## Comparison Table: R vs Python

| Pattern | R Package | R Syntax | Python Equivalent |
|---------|-----------|----------|-------------------|
| Pipe | magrittr | `%>%` | Method chaining `.` |
| Immutable Specs | parsnip | S3 objects | `@dataclass(frozen=True)` |
| Registration | parsnip | Manual registration | `@register_detector` |
| Selectors | recipes | NSE (unquoted) | Lambda or string |
| Formula | stats | `y ~ x1 + x2` | Explicit parameters |
| Generics | stats | S3 methods | `functools.singledispatch` |
| Type Checking | - | Runtime only | Type hints + mypy |

---

## Quick Decision Guide

### Should I use immutability?

| Object Type | Recommendation | Reason |
|-------------|----------------|--------|
| Specifications | **Yes** - frozen dataclass | Small, config-focused |
| Pipelines | **Yes** - frozen or copy-on-write | Reproducibility |
| Signal arrays | **Optional** - offer both | Performance vs. safety |
| Results | **Yes** - return new DataFrames | Prevent accidental modification |

### Should I use method chaining?

**Yes, if**:
- Operations naturally compose
- Each step returns compatible type
- Readability improved

**Provide alternative if**:
- Long chains hard to debug
- Performance-critical (chaining overhead)
- Users prefer explicit style

### Should I adopt registry pattern?

**Yes, if**:
- Multiple implementations of same interface
- Users will add custom implementations
- Need runtime algorithm selection

**Simple functions if**:
- Single implementation
- No extensibility needed

---

## Implementation Checklist

### Phase 1: Core
- [ ] Frozen dataclass for DetectorSpec
- [ ] Engine ABC with fit/detect/extract_outputs
- [ ] Decorator for @register_detector
- [ ] get_engine() lookup function

### Phase 2: Pipeline
- [ ] Pipeline class with step methods
- [ ] prep() to learn from training data
- [ ] apply() to use learned parameters
- [ ] Common steps: normalize, filter, denoise

### Phase 3: Outputs
- [ ] Three-DataFrame return pattern
- [ ] Dot-prefix naming convention
- [ ] Metadata columns (detector_type, engine, group)
- [ ] Consistent across all engines

### Phase 4: Validation
- [ ] RollingOrigin class
- [ ] Split objects with analysis_set/assessment_set
- [ ] Time-ordered (never training > test)
- [ ] Deterministic splits

### Phase 5: Metrics
- [ ] MetricSet class
- [ ] Common metrics (precision, recall, F1)
- [ ] Signal-specific metrics (SNR, latency)
- [ ] Grouped evaluation support

---

## Code Templates

### Minimal Detector Engine
```python
from abc import ABC, abstractmethod

class DetectorEngine(ABC):
    @abstractmethod
    def fit(self, spec, data):
        pass

    @abstractmethod
    def detect(self, fitted, new_data):
        pass

    @abstractmethod
    def extract_outputs(self, fitted):
        return {
            'detections': pd.DataFrame(),
            'parameters': pd.DataFrame(),
            'metrics': pd.DataFrame()
        }
```

### Minimal Pipeline Step
```python
class NormalizationStep:
    def __init__(self, method='zscore'):
        self.method = method
        self.mean_ = None
        self.std_ = None

    def fit(self, data):
        if self.method == 'zscore':
            self.mean_ = data.mean()
            self.std_ = data.std()
        return self

    def transform(self, data):
        if self.method == 'zscore':
            return (data - self.mean_) / self.std_
        return data
```

### Minimal Metric
```python
def precision(truth, predictions):
    """Calculate precision metric"""
    tp = ((truth == 1) & (predictions == 1)).sum()
    fp = ((truth == 0) & (predictions == 1)).sum()
    return tp / (tp + fp) if (tp + fp) > 0 else 0.0
```

---

## Common Gotchas

### 1. Data Leakage in prep()
```python
# WRONG: Uses test data statistics
pipeline.prep(pd.concat([train, test]))

# RIGHT: Only training data
pipeline.prep(train)
```

### 2. Mutable Default Arguments
```python
# WRONG
def detector(threshold=0.5, channels=[]):
    channels.append('default')  # Mutates default!

# RIGHT
def detector(threshold=0.5, channels=None):
    if channels is None:
        channels = ['default']
```

### 3. Modifying Input Data
```python
# WRONG: Modifies in place
def filter(data, low, high):
    data['filtered'] = apply_filter(data)
    return data

# RIGHT: Returns new object
def filter(data, low, high):
    result = data.copy()
    result['filtered'] = apply_filter(result)
    return result
```

### 4. Inconsistent Column Names
```python
# WRONG: Different engines different names
scipy_output: 'peak_time'
wavelet_output: 'detection_timestamp'

# RIGHT: Standardize across engines
all_outputs: '.detection_time'
```

---

## Further Reading

- **Full analysis**: `tidyverse_patterns_feasibility_study.md`
- **Detailed research**: `tidyverse_patterns_research.json`
- **Tidyverse**: https://tidyverse.org/
- **Tidymodels**: https://tidymodels.org/
- **Tidy Modeling with R**: https://tmwr.org/
