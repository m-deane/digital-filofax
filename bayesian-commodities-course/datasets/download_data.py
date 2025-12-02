"""
Commodities Data Download and Caching Utilities
================================================

This module provides standardized data preparation pipelines for commodities
time series used throughout the Bayesian forecasting course.

Data Sources:
- Yahoo Finance (yfinance): Recent futures and ETF data
- FRED (Federal Reserve Economic Data): Macroeconomic indicators
- Local cache: Persistent storage for downloaded data

Usage:
    from datasets.download_data import (
        get_commodity_data,
        get_economic_indicators,
        prepare_commodity_dataset,
        COMMODITY_TICKERS
    )

    # Get crude oil data
    crude = get_commodity_data('crude_oil', start='2015-01-01')

    # Get full dataset with economic indicators
    dataset = prepare_commodity_dataset('natural_gas', include_macro=True)
"""

import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Union, List, Dict, Tuple
import warnings

# Suppress yfinance warnings
warnings.filterwarnings('ignore', category=FutureWarning)

# ============================================================================
# COMMODITY TICKER MAPPINGS
# ============================================================================

COMMODITY_TICKERS = {
    # Energy
    'crude_oil': 'CL=F',      # WTI Crude Oil Futures
    'brent_oil': 'BZ=F',      # Brent Crude Oil Futures
    'natural_gas': 'NG=F',    # Natural Gas Futures
    'gasoline': 'RB=F',       # RBOB Gasoline Futures
    'heating_oil': 'HO=F',    # Heating Oil Futures

    # Precious Metals
    'gold': 'GC=F',           # Gold Futures
    'silver': 'SI=F',         # Silver Futures
    'platinum': 'PL=F',       # Platinum Futures
    'palladium': 'PA=F',      # Palladium Futures

    # Industrial Metals
    'copper': 'HG=F',         # Copper Futures
    'aluminum': 'ALI=F',      # Aluminum Futures

    # Agriculture - Grains
    'corn': 'ZC=F',           # Corn Futures
    'wheat': 'ZW=F',          # Wheat Futures
    'soybeans': 'ZS=F',       # Soybean Futures
    'soybean_oil': 'ZL=F',    # Soybean Oil Futures
    'soybean_meal': 'ZM=F',   # Soybean Meal Futures
    'oats': 'ZO=F',           # Oats Futures

    # Agriculture - Softs
    'coffee': 'KC=F',         # Coffee Futures
    'sugar': 'SB=F',          # Sugar Futures
    'cocoa': 'CC=F',          # Cocoa Futures
    'cotton': 'CT=F',         # Cotton Futures
    'orange_juice': 'OJ=F',   # Orange Juice Futures

    # Livestock
    'live_cattle': 'LE=F',    # Live Cattle Futures
    'lean_hogs': 'HE=F',      # Lean Hogs Futures
    'feeder_cattle': 'GF=F',  # Feeder Cattle Futures
}

# ETF alternatives (more liquid, longer history)
COMMODITY_ETFS = {
    'crude_oil': 'USO',       # United States Oil Fund
    'natural_gas': 'UNG',     # United States Natural Gas Fund
    'gold': 'GLD',            # SPDR Gold Shares
    'silver': 'SLV',          # iShares Silver Trust
    'copper': 'CPER',         # United States Copper Index Fund
    'agriculture': 'DBA',     # Invesco DB Agriculture Fund
    'commodities': 'DBC',     # Invesco DB Commodity Index
}

# FRED Economic Indicators
FRED_SERIES = {
    'usd_index': 'DTWEXBGS',        # Trade Weighted U.S. Dollar Index
    'inflation_cpi': 'CPIAUCSL',    # Consumer Price Index
    'inflation_pce': 'PCEPI',       # PCE Price Index
    'fed_funds': 'FEDFUNDS',        # Federal Funds Rate
    'treasury_10y': 'DGS10',        # 10-Year Treasury Rate
    'treasury_2y': 'DGS2',          # 2-Year Treasury Rate
    'gdp': 'GDP',                   # Gross Domestic Product
    'unemployment': 'UNRATE',       # Unemployment Rate
    'industrial_prod': 'INDPRO',    # Industrial Production Index
    'vix': 'VIXCLS',                # CBOE Volatility Index
}

# ============================================================================
# CACHE CONFIGURATION
# ============================================================================

CACHE_DIR = Path(__file__).parent / 'cached_data'
CACHE_DIR.mkdir(exist_ok=True)

def get_cache_path(name: str, start: str, end: str) -> Path:
    """Generate cache file path for a dataset."""
    clean_name = name.replace('=', '_').replace(' ', '_')
    return CACHE_DIR / f"{clean_name}_{start}_{end}.parquet"


def load_from_cache(cache_path: Path, max_age_days: int = 1) -> Optional[pd.DataFrame]:
    """Load data from cache if it exists and is fresh enough."""
    if not cache_path.exists():
        return None

    file_age = datetime.now() - datetime.fromtimestamp(cache_path.stat().st_mtime)
    if file_age > timedelta(days=max_age_days):
        return None

    try:
        return pd.read_parquet(cache_path)
    except Exception:
        return None


def save_to_cache(df: pd.DataFrame, cache_path: Path) -> None:
    """Save DataFrame to cache."""
    try:
        df.to_parquet(cache_path)
    except Exception as e:
        warnings.warn(f"Failed to cache data: {e}")


# ============================================================================
# DATA DOWNLOAD FUNCTIONS
# ============================================================================

def get_commodity_data(
    commodity: str,
    start: str = '2010-01-01',
    end: Optional[str] = None,
    use_etf: bool = False,
    use_cache: bool = True,
    cache_days: int = 1
) -> pd.DataFrame:
    """
    Download commodity price data from Yahoo Finance.

    Parameters
    ----------
    commodity : str
        Commodity name (e.g., 'crude_oil', 'gold', 'corn')
        or direct ticker symbol (e.g., 'CL=F')
    start : str
        Start date in 'YYYY-MM-DD' format
    end : str, optional
        End date in 'YYYY-MM-DD' format (defaults to today)
    use_etf : bool
        If True, use ETF instead of futures (more liquid, longer history)
    use_cache : bool
        If True, use local cache for data
    cache_days : int
        Number of days before cache expires

    Returns
    -------
    pd.DataFrame
        DataFrame with columns: Open, High, Low, Close, Volume, Adj Close
        Index is DatetimeIndex

    Examples
    --------
    >>> crude = get_commodity_data('crude_oil', start='2020-01-01')
    >>> gold = get_commodity_data('gold', use_etf=True)
    >>> custom = get_commodity_data('CL=F', start='2015-01-01')
    """
    import yfinance as yf

    if end is None:
        end = datetime.now().strftime('%Y-%m-%d')

    # Resolve ticker symbol
    if commodity in COMMODITY_TICKERS:
        if use_etf and commodity in COMMODITY_ETFS:
            ticker = COMMODITY_ETFS[commodity]
        else:
            ticker = COMMODITY_TICKERS[commodity]
    elif commodity in COMMODITY_ETFS:
        ticker = COMMODITY_ETFS[commodity]
    else:
        ticker = commodity  # Assume direct ticker

    # Check cache
    if use_cache:
        cache_path = get_cache_path(f"{commodity}_{ticker}", start, end)
        cached = load_from_cache(cache_path, cache_days)
        if cached is not None:
            return cached

    # Download data
    try:
        df = yf.download(ticker, start=start, end=end, progress=False)
        if df.empty:
            raise ValueError(f"No data returned for {ticker}")

        # Flatten multi-index columns if present
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        # Add metadata
        df.attrs['ticker'] = ticker
        df.attrs['commodity'] = commodity
        df.attrs['source'] = 'yfinance'

        # Cache the data
        if use_cache:
            save_to_cache(df, cache_path)

        return df

    except Exception as e:
        raise ValueError(f"Failed to download data for {commodity} ({ticker}): {e}")


def get_economic_indicators(
    indicators: Optional[List[str]] = None,
    start: str = '2010-01-01',
    end: Optional[str] = None,
    use_cache: bool = True,
    fred_api_key: Optional[str] = None
) -> pd.DataFrame:
    """
    Download economic indicators from FRED.

    Parameters
    ----------
    indicators : list of str, optional
        List of indicator names from FRED_SERIES
        If None, downloads all available indicators
    start : str
        Start date in 'YYYY-MM-DD' format
    end : str, optional
        End date (defaults to today)
    use_cache : bool
        If True, use local cache
    fred_api_key : str, optional
        FRED API key (can also be set via FRED_API_KEY env var)

    Returns
    -------
    pd.DataFrame
        DataFrame with indicators as columns, DatetimeIndex

    Notes
    -----
    Get a free FRED API key at: https://fred.stlouisfed.org/docs/api/api_key.html
    """
    from pandas_datareader import data as pdr

    if end is None:
        end = datetime.now().strftime('%Y-%m-%d')

    if indicators is None:
        indicators = list(FRED_SERIES.keys())

    # Check cache
    if use_cache:
        cache_name = '_'.join(sorted(indicators))[:50]  # Truncate for filename
        cache_path = get_cache_path(f"fred_{cache_name}", start, end)
        cached = load_from_cache(cache_path, cache_days=1)
        if cached is not None:
            return cached

    # Get API key
    if fred_api_key is None:
        fred_api_key = os.environ.get('FRED_API_KEY')

    dfs = []
    for name in indicators:
        if name not in FRED_SERIES:
            warnings.warn(f"Unknown indicator: {name}")
            continue

        series_id = FRED_SERIES[name]
        try:
            if fred_api_key:
                from fredapi import Fred
                fred = Fred(api_key=fred_api_key)
                series = fred.get_series(series_id, start, end)
                df = pd.DataFrame({name: series})
            else:
                df = pdr.DataReader(series_id, 'fred', start, end)
                df.columns = [name]
            dfs.append(df)
        except Exception as e:
            warnings.warn(f"Failed to download {name}: {e}")

    if not dfs:
        return pd.DataFrame()

    result = pd.concat(dfs, axis=1)

    # Cache the data
    if use_cache:
        save_to_cache(result, cache_path)

    return result


def get_multiple_commodities(
    commodities: List[str],
    start: str = '2010-01-01',
    end: Optional[str] = None,
    **kwargs
) -> pd.DataFrame:
    """
    Download multiple commodity price series.

    Parameters
    ----------
    commodities : list of str
        List of commodity names
    start : str
        Start date
    end : str, optional
        End date
    **kwargs
        Additional arguments passed to get_commodity_data

    Returns
    -------
    pd.DataFrame
        DataFrame with Close prices for each commodity
    """
    dfs = {}
    for commodity in commodities:
        try:
            df = get_commodity_data(commodity, start=start, end=end, **kwargs)
            dfs[commodity] = df['Close']
        except Exception as e:
            warnings.warn(f"Failed to get {commodity}: {e}")

    return pd.DataFrame(dfs)


# ============================================================================
# DATA PREPARATION FUNCTIONS
# ============================================================================

def calculate_returns(
    prices: pd.Series,
    method: str = 'log'
) -> pd.Series:
    """
    Calculate returns from price series.

    Parameters
    ----------
    prices : pd.Series
        Price series
    method : str
        'log' for log returns, 'simple' for simple returns

    Returns
    -------
    pd.Series
        Returns series
    """
    if method == 'log':
        return np.log(prices / prices.shift(1))
    else:
        return prices.pct_change()


def add_technical_indicators(
    df: pd.DataFrame,
    price_col: str = 'Close'
) -> pd.DataFrame:
    """
    Add common technical indicators to price data.

    Parameters
    ----------
    df : pd.DataFrame
        DataFrame with OHLCV data
    price_col : str
        Column to use for calculations

    Returns
    -------
    pd.DataFrame
        DataFrame with added indicators
    """
    result = df.copy()
    price = result[price_col]

    # Returns
    result['returns'] = calculate_returns(price, 'log')
    result['returns_simple'] = calculate_returns(price, 'simple')

    # Moving averages
    for window in [5, 10, 20, 50, 200]:
        result[f'ma_{window}'] = price.rolling(window).mean()
        result[f'std_{window}'] = price.rolling(window).std()

    # Bollinger Bands (20-day)
    result['bb_upper'] = result['ma_20'] + 2 * result['std_20']
    result['bb_lower'] = result['ma_20'] - 2 * result['std_20']
    result['bb_pct'] = (price - result['bb_lower']) / (result['bb_upper'] - result['bb_lower'])

    # RSI (14-day)
    delta = price.diff()
    gain = delta.where(delta > 0, 0).rolling(14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
    rs = gain / loss
    result['rsi_14'] = 100 - (100 / (1 + rs))

    # MACD
    exp12 = price.ewm(span=12, adjust=False).mean()
    exp26 = price.ewm(span=26, adjust=False).mean()
    result['macd'] = exp12 - exp26
    result['macd_signal'] = result['macd'].ewm(span=9, adjust=False).mean()
    result['macd_hist'] = result['macd'] - result['macd_signal']

    # Volatility
    result['volatility_20'] = result['returns'].rolling(20).std() * np.sqrt(252)
    result['volatility_60'] = result['returns'].rolling(60).std() * np.sqrt(252)

    # Price momentum
    for period in [5, 10, 20, 60]:
        result[f'momentum_{period}'] = price / price.shift(period) - 1

    return result


def add_calendar_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add calendar-based features to time series data.

    Parameters
    ----------
    df : pd.DataFrame
        DataFrame with DatetimeIndex

    Returns
    -------
    pd.DataFrame
        DataFrame with added calendar features
    """
    result = df.copy()
    idx = result.index

    # Basic calendar features
    result['day_of_week'] = idx.dayofweek
    result['day_of_month'] = idx.day
    result['week_of_year'] = idx.isocalendar().week.values
    result['month'] = idx.month
    result['quarter'] = idx.quarter
    result['year'] = idx.year

    # Cyclical encoding for continuous features
    result['month_sin'] = np.sin(2 * np.pi * idx.month / 12)
    result['month_cos'] = np.cos(2 * np.pi * idx.month / 12)
    result['dow_sin'] = np.sin(2 * np.pi * idx.dayofweek / 7)
    result['dow_cos'] = np.cos(2 * np.pi * idx.dayofweek / 7)

    # Trading day features
    result['is_month_start'] = idx.is_month_start.astype(int)
    result['is_month_end'] = idx.is_month_end.astype(int)
    result['is_quarter_start'] = idx.is_quarter_start.astype(int)
    result['is_quarter_end'] = idx.is_quarter_end.astype(int)

    return result


def prepare_commodity_dataset(
    commodity: str,
    start: str = '2010-01-01',
    end: Optional[str] = None,
    include_technicals: bool = True,
    include_calendar: bool = True,
    include_macro: bool = False,
    macro_indicators: Optional[List[str]] = None,
    dropna: bool = True,
    **kwargs
) -> pd.DataFrame:
    """
    Prepare a complete dataset for a commodity with all features.

    Parameters
    ----------
    commodity : str
        Commodity name or ticker
    start : str
        Start date
    end : str, optional
        End date
    include_technicals : bool
        Add technical indicators
    include_calendar : bool
        Add calendar features
    include_macro : bool
        Add macroeconomic indicators
    macro_indicators : list, optional
        Specific macro indicators to include
    dropna : bool
        Drop rows with missing values
    **kwargs
        Additional arguments for get_commodity_data

    Returns
    -------
    pd.DataFrame
        Complete dataset ready for modeling

    Examples
    --------
    >>> # Basic dataset
    >>> df = prepare_commodity_dataset('crude_oil', start='2015-01-01')

    >>> # Full dataset with macro
    >>> df = prepare_commodity_dataset(
    ...     'natural_gas',
    ...     include_macro=True,
    ...     macro_indicators=['usd_index', 'inflation_cpi', 'fed_funds']
    ... )
    """
    # Get price data
    df = get_commodity_data(commodity, start=start, end=end, **kwargs)

    # Add technical indicators
    if include_technicals:
        df = add_technical_indicators(df)

    # Add calendar features
    if include_calendar:
        df = add_calendar_features(df)

    # Add macro indicators
    if include_macro:
        if macro_indicators is None:
            macro_indicators = ['usd_index', 'inflation_cpi', 'fed_funds', 'treasury_10y']

        macro = get_economic_indicators(macro_indicators, start=start, end=end)

        # Resample macro to daily and forward fill
        macro = macro.resample('D').ffill()

        # Join with price data
        df = df.join(macro, how='left')

        # Forward fill macro indicators
        for col in macro_indicators:
            if col in df.columns:
                df[col] = df[col].ffill()

    # Drop NaN values
    if dropna:
        df = df.dropna()

    return df


def create_train_test_split(
    df: pd.DataFrame,
    test_size: Union[float, int, str] = 0.2,
    gap: int = 0
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Create chronological train/test split for time series.

    Parameters
    ----------
    df : pd.DataFrame
        DataFrame with DatetimeIndex
    test_size : float, int, or str
        If float (0-1): fraction for test
        If int: number of observations for test
        If str: date string for split point
    gap : int
        Number of observations to exclude between train and test
        (prevents look-ahead bias)

    Returns
    -------
    tuple
        (train_df, test_df)

    Examples
    --------
    >>> train, test = create_train_test_split(df, test_size=0.2)
    >>> train, test = create_train_test_split(df, test_size='2023-01-01')
    >>> train, test = create_train_test_split(df, test_size=252, gap=5)
    """
    n = len(df)

    if isinstance(test_size, float):
        split_idx = int(n * (1 - test_size))
    elif isinstance(test_size, int):
        split_idx = n - test_size
    elif isinstance(test_size, str):
        split_idx = df.index.get_indexer([pd.Timestamp(test_size)], method='bfill')[0]
    else:
        raise ValueError("test_size must be float, int, or str")

    train = df.iloc[:split_idx - gap]
    test = df.iloc[split_idx:]

    return train, test


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

def list_available_commodities() -> Dict[str, str]:
    """Return dictionary of available commodity names and tickers."""
    return COMMODITY_TICKERS.copy()


def list_available_indicators() -> Dict[str, str]:
    """Return dictionary of available economic indicators."""
    return FRED_SERIES.copy()


def get_sample_datasets() -> Dict[str, pd.DataFrame]:
    """
    Load sample datasets for quick course demonstrations.

    Returns pre-configured datasets for:
    - crude_oil: WTI crude oil with technicals
    - gold: Gold futures with macro indicators
    - corn: Corn futures with seasonal features

    Returns
    -------
    dict
        Dictionary of DataFrames
    """
    datasets = {}

    # Crude oil - energy example
    try:
        datasets['crude_oil'] = prepare_commodity_dataset(
            'crude_oil',
            start='2015-01-01',
            include_macro=True,
            macro_indicators=['usd_index', 'fed_funds']
        )
    except Exception as e:
        warnings.warn(f"Failed to load crude_oil: {e}")

    # Gold - precious metals example
    try:
        datasets['gold'] = prepare_commodity_dataset(
            'gold',
            start='2015-01-01',
            include_macro=True,
            macro_indicators=['usd_index', 'inflation_cpi', 'treasury_10y']
        )
    except Exception as e:
        warnings.warn(f"Failed to load gold: {e}")

    # Corn - agriculture example
    try:
        datasets['corn'] = prepare_commodity_dataset(
            'corn',
            start='2015-01-01',
            include_macro=False
        )
    except Exception as e:
        warnings.warn(f"Failed to load corn: {e}")

    return datasets


if __name__ == '__main__':
    # Demo usage
    print("Available commodities:")
    for name, ticker in list(COMMODITY_TICKERS.items())[:5]:
        print(f"  {name}: {ticker}")
    print(f"  ... and {len(COMMODITY_TICKERS) - 5} more\n")

    print("Downloading sample crude oil data...")
    try:
        crude = get_commodity_data('crude_oil', start='2023-01-01')
        print(f"Downloaded {len(crude)} rows")
        print(crude.tail())
    except Exception as e:
        print(f"Error: {e}")
