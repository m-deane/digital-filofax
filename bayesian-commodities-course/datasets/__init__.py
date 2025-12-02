"""
Datasets Module
===============

Utilities for downloading and preparing commodities data.
"""

from .download_data import (
    get_commodity_data,
    get_economic_indicators,
    get_multiple_commodities,
    prepare_commodity_dataset,
    create_train_test_split,
    calculate_returns,
    add_technical_indicators,
    add_calendar_features,
    list_available_commodities,
    list_available_indicators,
    get_sample_datasets,
    COMMODITY_TICKERS,
    COMMODITY_ETFS,
    FRED_SERIES,
)

__all__ = [
    'get_commodity_data',
    'get_economic_indicators',
    'get_multiple_commodities',
    'prepare_commodity_dataset',
    'create_train_test_split',
    'calculate_returns',
    'add_technical_indicators',
    'add_calendar_features',
    'list_available_commodities',
    'list_available_indicators',
    'get_sample_datasets',
    'COMMODITY_TICKERS',
    'COMMODITY_ETFS',
    'FRED_SERIES',
]
