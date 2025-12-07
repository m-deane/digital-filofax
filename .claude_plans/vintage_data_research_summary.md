# Vintage Data and Point-in-Time Analysis Research Summary

**Research Date:** 2025-12-07
**Topic:** Vintage Data and Point-in-Time Analysis for Preventing Lookahead Bias
**Context:** Commodities Trading and Forecasting Systems

---

## Executive Summary

This research investigates vintage data methodologies, point-in-time database patterns, and lookahead bias prevention strategies for commodities forecasting systems. Key findings include:

- **ALFRED (ArchivaL Federal Reserve Economic Data)** provides the gold standard for vintage economic data with 815,000+ series tracking data revisions
- **Ragged-edge problem** affects real-time forecasting when variables have different publication lags; solvable with Factor MIDAS, Kalman filters, or realignment
- **Lookahead bias** is preventable through bitemporal modeling, temporal data splitting, expanding window techniques, and event-driven backtesting
- **Commodities-specific timing** issues include WASDE reports (8th-12th of month), EIA reports (Wed/Thu mornings), and settlement price delays (next-day availability)
- **Python ecosystem** offers robust solutions: fredapi for vintage data, pandas.merge_asof for point-in-time joins, xarray for multi-dimensional structures, and temporal_sqlalchemy for versioned databases

---

## 1. ALFRED Database Methodology

### What is ALFRED?

ArchivaL Federal Reserve Economic Data (ALFRED) is a St. Louis Federal Reserve database containing vintage versions of 815,000+ U.S. economic data series, showing how data were updated and revised over time.

### Core Concepts

**Three-Date Model:**
- **Observation Date:** The period being measured (e.g., Q1 2024 GDP)
- **Vintage Date (realtime_start):** When data was released/published
- **Realtime End:** Last date this value was the latest revision

**Why It Matters:**
Economic data gets revised as more accurate estimates become available. Using only the latest revision creates lookahead bias—you're analyzing decisions with information that wasn't available at the time.

### Data Structure

ALFRED data uses a cross-tabulation:
- **Rows:** Observation dates
- **Columns:** Vintage dates
- **Cells:** Data values

**Example:**
```
                 Vintage 2024-01-15  Vintage 2024-04-15  Vintage 2024-07-15
Obs 2023-Q4              25,742           25,820           25,901
Obs 2024-Q1                  --           25,965           26,042
```

This shows Q4 2023 GDP was initially estimated at 25,742, then revised twice.

### Update Process

- Research Division tracks scheduled and unscheduled releases
- ALFRED updated within one business day
- Vintage data verified with original sources when possible
- Third-party services used when sources don't maintain history

---

## 2. The Ragged-Edge Problem

### Definition

The ragged-edge problem occurs when multivariate datasets have uneven data availability at the sample edge due to different publication lags across variables.

### Causes

1. **Different sampling frequencies:** Daily, weekly, monthly, quarterly data
2. **Publication delays:** GDP available 30-45 days after quarter; some indicators within days
3. **Mixed-frequency modeling:** Nowcasting quarterly GDP using monthly indicators

### Real-World Example

**Euro Area GDP Nowcasting:**
- **Target:** Q1 2024 GDP
- **Challenge:** GDP flash estimate published 43 days after quarter end
- **Available:** Industrial production (monthly, 2-week lag), retail sales (monthly, 1-week lag), consumer confidence (weekly, real-time)
- **Result:** Ragged edge—some series have March data, others only February, GDP still unknown

### Solutions

| Method | Description | Advantages | Disadvantages |
|--------|-------------|------------|---------------|
| **Factor MIDAS** | Mixed-frequency factor model | Handles ragged-edge naturally | Computationally intensive |
| **Kalman Filter** | Treats as missing data problem | Statistically elegant | Requires state-space formulation |
| **Realignment** | Shift series by publication lag | Simple, creates balanced data | Loses lead information |
| **Factor Estimation** | Dynamic principal components | Robust to missing data | May not capture all dynamics |

### Key Insight

Research shows parsimonious Factor MIDAS models generally outperform quarterly models, confirming the value of mixed-frequency techniques that exploit timely high-frequency indicators.

---

## 3. Lookahead Bias Prevention

### Definition

Lookahead bias is the unintentional use of future information when analyzing past events, leading to unrealistically optimistic backtest results.

### Common Causes

1. **Random train/test split:** Future data leaks into training set
2. **Using revised data:** Backtesting with final values that weren't available in real-time
3. **Same-day information:** Using close prices before market closes
4. **Global normalization:** Computing mean/std from entire dataset (includes future)
5. **Improper feature engineering:** Creating features with future timestamps

### Prevention Strategies

#### 1. Bitemporal Modeling

**Concept:** Record data along two timelines:
- **Valid Time:** When the event actually occurred
- **Transaction Time:** When we learned about the event

**Example:**
```
Observation: 2024-Q1 GDP
Vintage 2024-04-30: $25.5T (first estimate)
Vintage 2024-05-30: $25.7T (first revision)
Vintage 2024-06-30: $25.8T (second revision)
```

**Benefit:** Can answer both "What happened in Q1?" and "What did we THINK happened as of May 1st?"

#### 2. Temporal Data Splitting

**Wrong:**
```python
# Random split - CREATES LOOKAHEAD BIAS
train, test = train_test_split(df, test_size=0.2)
```

**Correct:**
```python
# Time-based split - NO LOOKAHEAD
train = df[df['date'] < '2022-01-01']
test = df[df['date'] >= '2022-01-01']
```

#### 3. Expanding Window Normalization

**Wrong:**
```python
# Uses future mean/std - LOOKAHEAD BIAS
df['zscore'] = (df['price'] - df['price'].mean()) / df['price'].std()
```

**Correct:**
```python
# Only uses past data - NO LOOKAHEAD
df['zscore'] = (
    (df['price'] - df['price'].expanding(30).mean()) /
    df['price'].expanding(30).std()
)
```

#### 4. Point-in-Time Databases

**As-of Queries:**
Database systems that support querying data "as it existed on date X"

**SQL Pattern:**
```sql
SELECT value
FROM vintage_data
WHERE asset = 'CL'
  AND observation_date = '2024-01-15'
  AND vintage_date = (
    SELECT MAX(vintage_date)
    FROM vintage_data
    WHERE asset = 'CL'
      AND observation_date = '2024-01-15'
      AND vintage_date <= '2024-01-20'
  )
```

#### 5. Event-Driven Backtesting

**Concept:** Process market events in chronological order using message queues

**Benefits:**
- Prevents indexing lookahead (can't peek at future bars)
- Closely replicates live trading environment
- Forces proper handling of asynchronous data arrival

**Complexity:** More complex than vectorized backtesting but eliminates entire classes of bias

### Detection

**Indicators of Lookahead Bias:**
- Backtest Sharpe ratio >> live trading Sharpe
- Trade entry/exit prices differ between backtest and live
- Strategy works in backtest but fails immediately in live trading
- Unrealistically consistent returns

**Testing:**
Run backtest on historical period with vintage data, compare to results using final revised data. Large differences indicate revision-based lookahead bias.

---

## 4. Commodities-Specific Timing Considerations

### USDA WASDE Reports

**Full Name:** World Agricultural Supply and Demand Estimates

**Schedule:**
- **Frequency:** Monthly
- **Release Date:** 8th-12th of month at noon ET
- **2026 Dates:** Jan 12, Feb 10, Mar 10, Apr 9, May 12, Jun 11, Jul 10, Aug 12, Sep 11, Oct 9, Nov 10, Dec 10

**Special Considerations:**
- **May Report:** First comprehensive new-crop year estimates (critical for agricultural markets)
- **Crop Year:** Corn/soybeans start Sept 1 (not calendar year)
- **Process:** 2-week consensus forecasting process
- **Covered:** Wheat, rice, coarse grains, oilseeds, cotton

**Point-in-Time Implications:**
- Data released at noon, but analysis/models may take hours to update
- Recommend tagging WASDE data with vintage_date = release_date + 1 day for conservative backtesting

### EIA Energy Reports

**Petroleum Status Report:**
- **Release:** Wednesdays at 9:30 AM CT
- **Content:** Weekly U.S. crude oil and refined product inventories
- **Impact:** High volatility event for crude, gasoline, distillate markets

**Natural Gas Storage:**
- **Release:** Thursdays at 9:30 AM CT
- **Content:** Weekly underground storage changes by region
- **Seasonality:** Critical in winter (heating) and summer (cooling)

**Point-in-Time Implications:**
- Reports available same morning, can trade on release
- Vintage_date = release_date for these weekly indicators

### Other USDA Reports

**Crop Progress & Conditions:**
- **Release:** Mondays at 3:00 PM CT
- **Content:** Planting progress, development stages, condition ratings
- **Importance:** Most-watched during growing season (April-September)

**Weekly Export Sales:**
- **Release:** Thursdays at 7:30 AM CT
- **Content:** Wheat, corn, soybeans, cotton, pork, beef export sales
- **Requirement:** Exporters must report daily/weekly

### Settlement Prices

**Critical Timing Issue:**

Settlement prices are published AFTER market close, often available next morning. This creates a common lookahead bias.

**Wrong:**
```python
# Assumes settlement price available same day
df['signal'] = df['settlement_price'].shift(1) > df['ma_20']
df['return'] = df['settlement_price'].pct_change()
```

**Correct:**
```python
# Lag settlement price by 1 day (available next morning)
df['signal'] = df['settlement_price'].shift(2) > df['ma_20'].shift(1)
df['return'] = df['settlement_price'].pct_change()
```

**Exchange Details:**

**CME Group:**
- Settlement prices reflect fair market value during settlement period
- Used to mark positions to market daily
- Final settlement on last trading day for cash/physical delivery
- Occasional corrections published next day

**ICE Futures:**
- End-of-day CSV reports available via subscription
- Closing price, volume, open interest
- Agricultural commodities, equity indexes, currencies, natural gas/power

### Weather Data Vintage Tracking

**NOAA/NCEI Resources:**
- **Climate Data Online (CDO):** Historical observations, GHCN-Daily dataset
- **Service Records Retention System (SRRS):** 5-year retention of forecasts, warnings, advisories
- **National Digital Forecast Database:** Gridded forecasts from 2001-present (archived files, no API)

**Point-in-Time Considerations:**
- Weather forecasts revised frequently (every 6 hours)
- Historical observations may be corrected days/weeks later
- Use forecast vintage matching the decision date
- For backtesting, align forecast timestamp with when it was issued, not what it predicted

**Example:**
```
Decision Date: 2024-07-15 08:00
Use: Weather forecast issued 2024-07-15 06:00 for next 7 days
Don't use: Observed weather from 2024-07-16 (not yet known on 07-15)
```

---

## 5. Data Structure Recommendations

### Four-Dimensional Vintage Data

**Dimensions:**
1. **vintage_date:** When data was released/known
2. **observation_date:** What period is being measured
3. **asset:** Commodity, ticker, entity identifier
4. **feature:** Price, volume, fundamental metric

### Storage Architecture Comparison

| Approach | Structure | Advantages | Disadvantages | Best For |
|----------|-----------|------------|---------------|----------|
| **xarray DataArray** | N-D labeled array | Natural N-D representation, efficient slicing, label-based indexing | Memory intensive for sparse data, less SQL-friendly | In-memory analysis, research, prototyping |
| **pandas MultiIndex** | MultiIndex on (vintage, obs, asset) | Pandas ecosystem, efficient for ≤3D, easy pivoting | Unwieldy beyond 3D, index alignment complexity | Smaller datasets, pandas-heavy workflows |
| **Relational DB (Bitemporal)** | Table with vintage/observation columns | Scalable, standard SQL, ACID, point-in-time indexes | Requires DB setup, ORM complexity | Production systems, large-scale, multi-user |
| **Time-Series DB** | InfluxDB/TimescaleDB with tags | Optimized for time series, compression, continuous aggregates | Vintage_date as tag (not ideal), less flexible schema | High-frequency data, large volumes |

### Bitemporal Schema Pattern

```sql
CREATE TABLE vintage_data (
    id SERIAL PRIMARY KEY,
    asset VARCHAR(10) NOT NULL,
    observation_date TIMESTAMP NOT NULL,
    vintage_date TIMESTAMP NOT NULL,
    feature_name VARCHAR(50) NOT NULL,
    value NUMERIC,
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP,  -- NULL if current
    created_at TIMESTAMP DEFAULT NOW()
);

-- Critical indexes for point-in-time queries
CREATE INDEX idx_pit ON vintage_data (asset, observation_date, vintage_date DESC);
CREATE INDEX idx_vintage ON vintage_data (vintage_date, asset);
CREATE INDEX idx_asset_valid ON vintage_data (asset, valid_from, valid_to);
```

### SCD Type 2 Pattern

Slowly Changing Dimension Type 2 is a data warehouse standard for tracking changes:

```sql
CREATE TABLE commodity_dim (
    surrogate_key SERIAL PRIMARY KEY,
    commodity_code VARCHAR(10),  -- Natural key
    commodity_name VARCHAR(100),
    category VARCHAR(50),
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP,  -- NULL or 9999-12-31 for current
    is_current BOOLEAN DEFAULT TRUE
);
```

**Limitation:** Only tracks one temporal dimension (valid time). For financial backtesting, bitemporal approach (valid time + transaction time) is superior.

---

## 6. Query Pattern Recommendations

### As-Of Queries

**Purpose:** Retrieve data as it existed at a specific point in time

**SQL Pattern:**
```sql
-- Get latest vintage available on 2024-01-20 for observation 2024-01-15
SELECT value
FROM vintage_data
WHERE asset = 'CL'
  AND observation_date = '2024-01-15'
  AND vintage_date = (
    SELECT MAX(vintage_date)
    FROM vintage_data
    WHERE asset = 'CL'
      AND observation_date = '2024-01-15'
      AND vintage_date <= '2024-01-20'
  )
```

**Pandas Pattern:**
```python
cutoff_date = '2024-01-20'
df_asof = (
    df[df['vintage_date'] <= cutoff_date]
    .groupby(['asset', 'observation_date'])
    .apply(lambda g: g.loc[g['vintage_date'].idxmax()])
)
```

**xarray Pattern:**
```python
da.sel(vintage_date=cutoff_date, method='ffill')
```

**Performance Considerations:**
- Index on (asset, observation_date, vintage_date DESC) is critical
- Use window functions for batch as-of queries
- Consider materialized views for common cutoff dates (e.g., month-end)

### Revision Analysis

**Purpose:** Track how values changed across vintages

**SQL Pattern:**
```sql
SELECT
    observation_date,
    vintage_date,
    value,
    LAG(value) OVER (
        PARTITION BY observation_date
        ORDER BY vintage_date
    ) as previous_value,
    value - LAG(value) OVER (
        PARTITION BY observation_date
        ORDER BY vintage_date
    ) as revision
FROM vintage_data
WHERE asset = 'GDP'
ORDER BY observation_date, vintage_date
```

**Pandas Pattern:**
```python
# Pivot to see all vintages for each observation
revisions = df.pivot_table(
    values='value',
    index='observation_date',
    columns='vintage_date'
)

# Calculate revision deltas
revision_deltas = revisions.diff(axis=1)
```

### Point-in-Time Join

**Purpose:** Join multiple time series as they existed on specific dates

**pandas merge_asof:**
```python
# Join daily prices to monthly WASDE reports
result = pd.merge_asof(
    prices.sort_values('date'),
    wasde_reports.sort_values('release_date'),
    left_on='date',
    right_on='release_date',
    by='asset',
    direction='backward',  # Use most recent past release
    tolerance=pd.Timedelta('90 days')  # Don't match if >90 days old
)
```

**Critical Requirements:**
- Both DataFrames MUST be sorted by the join key
- Use `by` parameter for asset-level joins
- Set `tolerance` to prevent matching too-distant dates
- `direction='backward'` most common for point-in-time (use past, not future)

### Expanding Window Aggregation

**Purpose:** Compute statistics using only data available at each point in time

**Pandas Pattern:**
```python
# Expanding window - only uses past data
df['ma_expanding'] = df['price'].expanding(min_periods=30).mean()

# Rolling window (not centered!) - only uses past
df['ma_rolling'] = df['price'].rolling(window=60, min_periods=30).mean()

# WRONG: centered=True uses future data
df['ma_wrong'] = df['price'].rolling(window=60, center=True).mean()  # LOOKAHEAD BIAS
```

**Use Cases:**
- Moving averages for signals
- Z-score normalization for features
- Volatility estimation for risk management

---

## 7. Python Implementation Approaches

### Option 1: Small-Scale Research (fredapi + pandas)

**Scenario:** Economics research, <100K rows, single user

**Stack:**
- **Data:** fredapi for vintage economic indicators
- **Storage:** pandas DataFrame with MultiIndex
- **Queries:** pandas groupby + merge_asof

**Example:**
```python
from fredapi import Fred
import pandas as pd

fred = Fred(api_key='your_key')

# Get vintage GDP data
gdp = fred.get_series_all_releases('GDP')
gdp_indexed = gdp.set_index(['observation_date', 'realtime_start'])

# Point-in-time query
as_of_2020 = gdp[gdp['realtime_start'] <= '2020-01-01'].groupby('observation_date').last()
```

**Advantages:**
- Minimal setup
- fredapi handles vintage retrieval
- pandas sufficient for <10K rows

**Limitations:**
- Doesn't scale beyond 100K rows
- No persistence (in-memory only)
- Single-user

### Option 2: Multi-Asset Backtesting (PostgreSQL + SQLAlchemy + pandas)

**Scenario:** Commodities backtesting, daily data, multiple users, need persistence

**Architecture:**
- **Database:** PostgreSQL 14+ with bitemporal schema
- **ORM:** SQLAlchemy with custom bitemporal models
- **Analysis:** pandas for in-memory operations
- **Backtest:** Event-driven framework querying as-of data

**Schema:**
```python
from sqlalchemy import Column, Integer, String, Float, DateTime, Index
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class VintageData(Base):
    __tablename__ = 'vintage_data'

    id = Column(Integer, primary_key=True)
    asset = Column(String(10), nullable=False)
    observation_date = Column(DateTime, nullable=False)
    vintage_date = Column(DateTime, nullable=False)
    feature = Column(String(50), nullable=False)
    value = Column(Float)

    __table_args__ = (
        Index('idx_pit', 'asset', 'observation_date', 'vintage_date'),
    )
```

**Indexes:**
```sql
CREATE INDEX idx_pit ON vintage_data (asset, observation_date, vintage_date DESC);
CREATE INDEX idx_vintage ON vintage_data (vintage_date, asset);
```

**Advantages:**
- Scalable to millions of rows
- ACID guarantees
- Multi-user access
- Standard SQL queries

**Limitations:**
- Requires database administration
- ORM complexity
- Query verbosity vs in-memory pandas

### Option 3: High-Frequency Data (TimescaleDB)

**Scenario:** Tick-level trading data with revisions, >10M rows

**Architecture:**
- **Database:** TimescaleDB (PostgreSQL extension)
- **Chunking:** 1-day chunks
- **Compression:** After 7 days
- **Retention:** Drop chunks >5 years

**Configuration:**
```sql
-- Create hypertable
SELECT create_hypertable('vintage_data', 'observation_date',
                         chunk_time_interval => INTERVAL '1 day');

-- Enable compression
ALTER TABLE vintage_data SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'asset,vintage_date'
);

-- Continuous aggregate for daily OHLCV
CREATE MATERIALIZED VIEW daily_ohlcv
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', observation_date) as day,
    vintage_date,
    asset,
    FIRST(value, observation_date) as open,
    MAX(value) as high,
    MIN(value) as low,
    LAST(value, observation_date) as close
FROM vintage_data
GROUP BY day, vintage_date, asset;
```

**Advantages:**
- Optimized for time-series inserts
- Automatic compression
- Continuous aggregates (materialized views)
- Retention policies

**Limitations:**
- PostgreSQL overhead for very high frequency
- Compression trades write speed for storage

### Option 4: Weather Research (xarray + NetCDF + dask)

**Scenario:** Multi-dimensional weather forecasts, vintage tracking, large arrays

**Architecture:**
- **Structure:** xarray DataArray with dims ['lat', 'lon', 'observation_date', 'vintage_date', 'model']
- **Storage:** NetCDF4 with compression
- **Scaling:** dask for out-of-core computation

**Example:**
```python
import xarray as xr
import dask.array as da

# Create 5D weather data structure
weather = xr.DataArray(
    da.random.random((100, 100, 365, 50, 5)),  # dask array
    dims=['lat', 'lon', 'observation_date', 'vintage_date', 'model'],
    coords={
        'lat': np.linspace(25, 50, 100),
        'lon': np.linspace(-125, -65, 100),
        'observation_date': pd.date_range('2024-01-01', periods=365),
        'vintage_date': pd.date_range('2024-01-01', periods=50, freq='W'),
        'model': ['GFS', 'ECMWF', 'NAM', 'WRF', 'HRRR']
    }
)

# Save to NetCDF with chunking
weather.to_netcdf(
    'weather_vintages.nc',
    encoding={'temperature': {'zlib': True, 'complevel': 5}}
)

# Point-in-time query (lazy evaluation)
forecast_as_of = weather.sel(
    vintage_date='2024-06-01',
    method='ffill'
).load()  # Triggers computation
```

**Advantages:**
- Natural multi-dimensional representation
- NetCDF standard in meteorology
- Dask enables larger-than-memory datasets
- Lazy evaluation

**Limitations:**
- Less suitable for sparse data
- Not SQL-queryable
- Requires xarray knowledge

### Option 5: Production System (Hybrid: PostgreSQL + Parquet + Polars)

**Scenario:** Production commodities forecasting, cost-optimized, high performance

**Architecture:**
- **PostgreSQL:** Vintage metadata, asset lists, release schedules
- **Parquet:** Partitioned by (asset, year) for bulk data
- **Polars:** Fast DataFrame processing with lazy evaluation
- **Workflow:** Query PostgreSQL → load Parquet slices → process with Polars → write results

**Directory Structure:**
```
data/
  vintages/
    CL/
      2023/
        vintage_2023-01-01.parquet
        vintage_2023-02-01.parquet
        ...
      2024/
        vintage_2024-01-01.parquet
        ...
    GC/
      2023/
      2024/
```

**Polars Query:**
```python
import polars as pl

# Lazy scan parquet files
df = pl.scan_parquet('data/vintages/CL/2024/*.parquet')

# Point-in-time query (lazy)
as_of_query = (
    df
    .filter(pl.col('vintage_date') <= '2024-06-01')
    .groupby(['observation_date', 'asset'])
    .agg(pl.col('value').last())  # Last vintage before cutoff
)

# Execute
result = as_of_query.collect()
```

**Advantages:**
- Cost-effective (files cheaper than DB storage)
- Polars 5-10x faster than pandas
- Parquet columnar format efficient
- Horizontal scaling (add more files)

**Limitations:**
- No ACID transactions
- Manual partitioning strategy
- Less flexible than SQL

---

## 8. Best Practices and Pitfalls

### Best Practices

1. **Always timestamp data ingestion**
   - Store `insertion_timestamp` separately from `vintage_date`
   - Enables audit trail and late-arriving data detection

2. **Include data source in schema**
   - Multi-source reconciliation common (CME vs vendor data)
   - Track `source_id` for each record

3. **Use UTC timestamps**
   - Avoids DST ambiguity
   - Critical for global commodities (markets in multiple timezones)

4. **Validate vintage_date >= observation_date**
   - Can't know Q1 2024 GDP on 2024-01-01
   - Implement constraint: `CHECK (vintage_date >= observation_date)`

5. **Index strategy: Covering indexes**
   - `CREATE INDEX idx_pit ON vintage_data (asset, observation_date, vintage_date DESC, value)`
   - Enables index-only scans for point-in-time queries

6. **Partition by vintage_date year**
   - Easier archival (drop old partitions)
   - Query optimizer can skip partitions

7. **Document release calendars**
   - Store in database: `release_schedule(report_name, frequency, typical_day_of_month, time_zone)`
   - Generate expected release dates programmatically

### Common Pitfalls

1. **Assuming settlement prices available same day**
   - **Reality:** Published after close, often next morning
   - **Fix:** Lag settlement prices by 1 day

2. **Not accounting for holiday delays**
   - **Reality:** WASDE delayed if 12th falls on weekend/holiday
   - **Fix:** Use actual release dates, not scheduled dates

3. **Using rolling(center=True) for features**
   - **Problem:** Uses future data for past calculations
   - **Fix:** `rolling(window=N, center=False)` or `expanding()`

4. **Shuffling time series before split**
   - **Problem:** Future leaks into training set
   - **Fix:** Always split by time cutoff

5. **Normalizing with global mean/std**
   - **Problem:** Uses future statistics to transform past
   - **Fix:** `expanding(min_periods=30).mean()` and `.std()`

6. **Ignoring revision patterns across assets**
   - **Problem:** Some commodities heavily revised, others stable
   - **Fix:** Analyze revision frequency/magnitude per asset

7. **Forgetting weekend/holiday gaps with merge_asof**
   - **Problem:** Tolerance in days doesn't account for non-trading days
   - **Fix:** Use business day tolerance or larger tolerance with validation

---

## 9. Academic and Industry References

### Foundational Papers

1. **Anderson, Richard G. (2006)**
   - "Replicability, Real-Time Data, and the Science of Economic Research: FRED, ALFRED, and VDC"
   - Federal Reserve Bank of St. Louis Review, 88(1), pp. 81-93
   - **Key Contribution:** Introduced ALFRED and argued for vintage data in research replicability

2. **Croushore & Stark (2001)**
   - "A Real-Time Data Set for Macroeconomists"
   - Journal of Econometrics
   - **Key Contribution:** First comprehensive real-time dataset, documented revision impact on forecasts

3. **Marcellino, Porqueddu, Venditti (2010)**
   - "Factor MIDAS for Nowcasting with Ragged-Edge Data"
   - Oxford Bulletin of Economics and Statistics
   - **Key Contribution:** Factor MIDAS methodology for mixed-frequency forecasting

4. **Wallis, K.F. (1986)**
   - "Forecasting with an Econometric Model: The 'Ragged Edge' Problem"
   - Journal of Forecasting
   - **Key Contribution:** First identification and naming of ragged-edge problem

5. **Snodgrass, R.T. (1999)**
   - "Developing Time-Oriented Database Applications in SQL"
   - Morgan Kaufmann
   - **Key Contribution:** Comprehensive treatment of temporal databases including bitemporal modeling

### Data Warehouse Theory

6. **Slowly Changing Dimensions**
   - Standard SCD Type 2 pattern from Kimball dimensional modeling
   - **Limitation for Finance:** Only tracks valid time, not transaction time
   - **Recommendation:** Use bitemporal approach instead

### Industry Resources

7. **Federal Reserve ALFRED**
   - https://alfred.stlouisfed.org/
   - 815,000+ vintage economic series

8. **USDA WASDE**
   - https://www.usda.gov/oce/commodity/wasde
   - Monthly agricultural supply/demand estimates

9. **EIA Energy Data**
   - https://www.eia.gov/
   - Weekly petroleum and natural gas inventories

10. **NOAA Climate Data Online**
    - https://www.ncei.noaa.gov/cdo-web/
    - Historical weather observations and forecasts

---

## 10. Implementation Roadmap

### Phase 1: Requirements and Design (Week 1-2)

1. **Define Scope**
   - Which commodities? (e.g., energy, agriculture, metals)
   - Date range? (e.g., 2010-present)
   - Features? (price, volume, fundamentals, weather)
   - Data sources? (exchanges, USDA, EIA, weather)

2. **Calculate Storage Requirements**
   - Rows = assets × observations × vintages
   - Example: 50 assets × 5,000 days × 50 vintages/observation = 12.5M rows
   - Add 30% for features/metadata → ~16M rows
   - Storage: ~1-2GB in Parquet, ~3-5GB in PostgreSQL

3. **Choose Architecture**
   - <1M rows: pandas + files
   - 1-10M rows: PostgreSQL + pandas
   - 10-100M rows: TimescaleDB or PostgreSQL + Parquet
   - >100M rows: Distributed system (Spark + Delta Lake)

### Phase 2: Data Collection (Week 3-4)

4. **Map Release Schedules**
   - Create `release_calendar` table
   - Document timezone, typical release time, delay patterns
   - Include holiday adjustments

5. **Build Ingestion Pipeline**
   - Automated collectors for each source
   - Stamp with `vintage_date` = current date (when WE received it)
   - Validate observation_date ≤ vintage_date
   - Handle duplicates (upsert logic)
   - Log all ingestion events

### Phase 3: Storage and Indexing (Week 5-6)

6. **Implement Schema**
   - Create bitemporal table or file structure
   - Add indexes for point-in-time queries
   - Partition by vintage_date year (if database)
   - Set up compression (if TimescaleDB or Parquet)

7. **Backfill Historical Data**
   - Load historical vintages if available
   - For commodities, likely only final values available
   - Document assumptions (e.g., "pre-2020 data assumed no revisions")

### Phase 4: Query Layer (Week 7-8)

8. **Implement Point-in-Time Queries**
   - Create `get_as_of(asset, observation_date, as_of_date)` function
   - Test against known revision events
   - Benchmark performance (should be <100ms for single asset)

9. **Build Aggregation Functions**
   - Daily/weekly/monthly rollups
   - Cross-asset correlation matrices as-of dates
   - Feature engineering with expanding windows

### Phase 5: Validation (Week 9-10)

10. **Create Validation Layer**
    - Check 1: vintage_date >= observation_date
    - Check 2: No future data in as-of queries
    - Check 3: Revision history complete (no gaps)
    - Check 4: Cross-reference with source (sample checks)

11. **Backtesting Validation**
    - Run simple strategy with vintage data
    - Run same strategy with final data
    - Compare results (vintage should be worse due to revisions)
    - If vintage results BETTER → lookahead bias exists

### Phase 6: Integration (Week 11-12)

12. **Build Backtest Framework**
    - Event-driven architecture
    - Query vintage data for each simulation date
    - Log data access patterns
    - Validate no future access

13. **Performance Optimization**
    - Profile slow queries
    - Add materialized views for common aggregates
    - Consider caching layer (Redis) for frequently accessed as-of dates
    - Benchmark: 1M simulated days should complete in <1 hour

### Phase 7: Documentation and Deployment (Week 13-14)

14. **Document Data Lineage**
    - For each vintage, record source, collection time, methodology
    - Create data dictionary (asset codes, feature definitions)
    - Document known issues (e.g., "CL settlement delayed on CME holidays")

15. **Production Deployment**
    - Set up monitoring (data freshness, gap detection)
    - Alerting (missing expected releases, duplicate vintages)
    - Backup and disaster recovery
    - Access controls (read-only for researchers, write for pipeline)

---

## Conclusion

Vintage data and point-in-time analysis are critical for preventing lookahead bias in commodities forecasting and trading systems. The key insights from this research:

1. **ALFRED provides the gold standard** for vintage economic data methodology
2. **Bitemporal modeling** (valid time + transaction time) is superior to SCD Type 2 for financial applications
3. **Commodities have specific timing challenges:** settlement prices lag by 1 day, WASDE reports have irregular dates, weather forecasts are frequently revised
4. **Python ecosystem is mature:** fredapi for vintage data, pandas.merge_asof for point-in-time joins, xarray for multi-dimensional structures
5. **Architecture scales with data volume:** files for research, PostgreSQL for production, TimescaleDB for high-frequency
6. **Event-driven backtesting** combined with as-of queries is the only way to fully eliminate lookahead bias

**Recommended Starting Point for Commodities System:**

- **Data:** PostgreSQL with bitemporal schema
- **Indexes:** Covering index on (asset, observation_date, vintage_date DESC, value)
- **Queries:** SQLAlchemy ORM with custom as-of query methods
- **Analysis:** pandas for exploratory work, Polars for production pipelines
- **Backtest:** Event-driven framework querying database chronologically
- **Validation:** Automated checks for vintage_date >= observation_date, no future access

This architecture provides the right balance of flexibility, performance, and correctness for preventing lookahead bias in commodities forecasting.

---

## Sources

[1] St. Louis Fed. "ALFRED: ArchivaL Federal Reserve Economic Data." https://alfred.stlouisfed.org/

[2] Marcellino, M. et al. "Factor MIDAS for Nowcasting and Forecasting with Ragged-Edge Data." Oxford Bulletin of Economics and Statistics, 2010. https://onlinelibrary.wiley.com/doi/10.1111/j.1468-0084.2010.00591.x

[3] ECB Working Paper. "Now-casting and the real-time data flow." https://www.ecb.europa.eu/pub/pdf/scpwps/ecbwp1564.pdf

[4] Medium. "Data Leakage, Lookahead Bias, and Causality in Time Series Analytics." https://medium.com/@kyle-t-jones/data-leakage-lookahead-bias-and-causality-in-time-series-analytics-76e271ba2f6b

[5] Refinitiv. "Using point-in-time data to avoid bias in backtesting." https://www.refinitiv.com/perspectives/future-of-investing-trading/how-to-use-point-in-time-data-to-avoid-bias-in-backtesting/

[6] USDA. "WASDE Report." https://www.usda.gov/about-usda/general-information/staff-offices/office-chief-economist/commodity-markets/wasde-report

[7] Paradigm Futures. "Commodity Market Report Schedule." https://paradigmfutures.net/commodity-market-report-schedule/

[8] CME Group. "Daily Settlements." https://www.cmegroup.com/market-data/daily-settlements.html

[9] ICE. "Futures U.S." https://www.ice.com/futures-us

[10] NOAA NCEI. "Climate Data Online." https://www.ncei.noaa.gov/cdo-web/

[11] Weather Prediction Center. "NOAA Archive." https://www.wpc.ncep.noaa.gov/noaa/noaa_archive.php

[12] mortada. "fredapi: Python API for FRED and ALFRED." GitHub/PyPI. https://github.com/mortada/fredapi

[13] pandas. "pandas.merge_asof documentation." https://pandas.pydata.org/docs/reference/api/pandas.merge_asof.html

[14] xarray. "Time series data documentation." https://docs.xarray.dev/en/latest/user-guide/time-series.html

[15] bolsote. "temporal_sqlalchemy documentation." https://temporal-sqlalchemy.readthedocs.io/

[16] kernc. "backtesting.py." https://kernc.github.io/backtesting.py/

[17] mementum. "backtrader." https://github.com/mementum/backtrader

[18] ematvey. "pybacktest." https://github.com/ematvey/pybacktest

[19] Wikipedia. "Slowly changing dimension." https://en.wikipedia.org/wiki/Slowly_changing_dimension

[20] Anderson, Richard G. "Replicability, Real-Time Data, and the Science of Economic Research: FRED, ALFRED, and VDC." Federal Reserve Bank of St. Louis Review, 2006, 88(1), pp. 81-93. https://research.stlouisfed.org/publications/review/2006/01/01/replicability-real-time-data-and-the-science-of-economic-research-fred-alfred-and-vdc/
