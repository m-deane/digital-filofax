"""
Backtesting Framework for Bayesian Forecasting
===============================================

This module provides time series cross-validation and backtesting
utilities designed specifically for Bayesian forecasting models.

Key Features:
- Walk-forward validation (expanding and rolling windows)
- Proper time series splits (no look-ahead bias)
- Integration with PyMC models
- Probabilistic forecast evaluation
"""

import numpy as np
import pandas as pd
from typing import Optional, Union, List, Tuple, Dict, Callable, Generator, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
import warnings

__all__ = [
    'TimeSeriesSplit',
    'WalkForwardValidator',
    'Backtester',
    'expanding_window_split',
    'rolling_window_split',
    'create_folds',
]


# ============================================================================
# TIME SERIES SPLITS
# ============================================================================

@dataclass
class TimeSeriesFold:
    """Container for a single train/test fold."""
    fold_id: int
    train_start: int
    train_end: int
    test_start: int
    test_end: int

    @property
    def train_slice(self) -> slice:
        return slice(self.train_start, self.train_end)

    @property
    def test_slice(self) -> slice:
        return slice(self.test_start, self.test_end)


def expanding_window_split(
    n_samples: int,
    n_folds: int = 5,
    test_size: int = 1,
    min_train_size: Optional[int] = None,
    gap: int = 0
) -> List[TimeSeriesFold]:
    """
    Create expanding window time series splits.

    Training window grows with each fold.

    Parameters
    ----------
    n_samples : int
        Total number of samples
    n_folds : int
        Number of folds
    test_size : int
        Number of samples in each test set
    min_train_size : int, optional
        Minimum training set size (defaults to n_samples // (n_folds + 1))
    gap : int
        Number of samples to skip between train and test

    Returns
    -------
    list of TimeSeriesFold
        List of fold specifications

    Examples
    --------
    >>> folds = expanding_window_split(100, n_folds=5, test_size=10)
    >>> for fold in folds:
    ...     print(f"Train: {fold.train_start}-{fold.train_end}, "
    ...           f"Test: {fold.test_start}-{fold.test_end}")
    """
    if min_train_size is None:
        min_train_size = n_samples // (n_folds + 1)

    total_test = n_folds * test_size
    if min_train_size + total_test + gap * n_folds > n_samples:
        raise ValueError("Not enough samples for specified fold configuration")

    folds = []
    remaining = n_samples - min_train_size - total_test - gap * n_folds
    step = remaining // n_folds if n_folds > 1 else 0

    for i in range(n_folds):
        train_end = min_train_size + step * (i + 1)
        test_start = train_end + gap
        test_end = test_start + test_size

        folds.append(TimeSeriesFold(
            fold_id=i,
            train_start=0,
            train_end=train_end,
            test_start=test_start,
            test_end=test_end
        ))

    return folds


def rolling_window_split(
    n_samples: int,
    n_folds: int = 5,
    train_size: int = 100,
    test_size: int = 1,
    gap: int = 0
) -> List[TimeSeriesFold]:
    """
    Create rolling window time series splits.

    Training window has fixed size and rolls forward.

    Parameters
    ----------
    n_samples : int
        Total number of samples
    n_folds : int
        Number of folds
    train_size : int
        Fixed training set size
    test_size : int
        Number of samples in each test set
    gap : int
        Number of samples to skip between train and test

    Returns
    -------
    list of TimeSeriesFold
        List of fold specifications

    Examples
    --------
    >>> folds = rolling_window_split(100, n_folds=5, train_size=50, test_size=10)
    """
    step = (n_samples - train_size - test_size - gap) // (n_folds - 1) if n_folds > 1 else 0

    folds = []
    for i in range(n_folds):
        train_start = step * i
        train_end = train_start + train_size
        test_start = train_end + gap
        test_end = min(test_start + test_size, n_samples)

        if test_end > n_samples:
            break

        folds.append(TimeSeriesFold(
            fold_id=i,
            train_start=train_start,
            train_end=train_end,
            test_start=test_start,
            test_end=test_end
        ))

    return folds


def create_folds(
    data: Union[pd.DataFrame, pd.Series],
    method: str = 'expanding',
    n_folds: int = 5,
    test_size: Union[int, float, str] = 0.2,
    train_size: Optional[int] = None,
    gap: int = 0
) -> List[Tuple[pd.DataFrame, pd.DataFrame]]:
    """
    Create train/test folds from time series data.

    Parameters
    ----------
    data : pd.DataFrame or pd.Series
        Time series data with DatetimeIndex
    method : str
        'expanding' or 'rolling'
    n_folds : int
        Number of folds
    test_size : int, float, or str
        Size of test set (int=samples, float=fraction, str=time period)
    train_size : int, optional
        Size of training set (only for rolling window)
    gap : int
        Gap between train and test

    Returns
    -------
    list of tuples
        List of (train_data, test_data) tuples
    """
    n = len(data)

    # Convert test_size to integer
    if isinstance(test_size, float) and test_size < 1:
        test_samples = int(n * test_size / n_folds)
    elif isinstance(test_size, str):
        # Parse time period (e.g., "30 days", "1 month")
        # Simplified: just use integer
        test_samples = int(test_size.split()[0]) if test_size.split()[0].isdigit() else 30
    else:
        test_samples = int(test_size)

    # Create folds
    if method == 'expanding':
        folds = expanding_window_split(n, n_folds, test_samples, gap=gap)
    else:
        if train_size is None:
            train_size = n // 2
        folds = rolling_window_split(n, n_folds, train_size, test_samples, gap)

    # Extract data for each fold
    result = []
    for fold in folds:
        train = data.iloc[fold.train_slice]
        test = data.iloc[fold.test_slice]
        result.append((train, test))

    return result


class TimeSeriesSplit:
    """
    Time series cross-validator compatible with sklearn interface.

    Parameters
    ----------
    n_splits : int
        Number of splits
    test_size : int
        Size of test set
    gap : int
        Gap between train and test
    method : str
        'expanding' or 'rolling'
    train_size : int, optional
        Training size (only for rolling)

    Examples
    --------
    >>> cv = TimeSeriesSplit(n_splits=5, test_size=30, method='expanding')
    >>> for train_idx, test_idx in cv.split(X):
    ...     X_train, X_test = X[train_idx], X[test_idx]
    """

    def __init__(
        self,
        n_splits: int = 5,
        test_size: int = 1,
        gap: int = 0,
        method: str = 'expanding',
        train_size: Optional[int] = None
    ):
        self.n_splits = n_splits
        self.test_size = test_size
        self.gap = gap
        self.method = method
        self.train_size = train_size

    def split(self, X, y=None, groups=None) -> Generator[Tuple[np.ndarray, np.ndarray], None, None]:
        """Generate train/test indices for each fold."""
        n = len(X)

        if self.method == 'expanding':
            folds = expanding_window_split(n, self.n_splits, self.test_size, gap=self.gap)
        else:
            folds = rolling_window_split(n, self.n_splits, self.train_size or n // 2,
                                        self.test_size, self.gap)

        for fold in folds:
            train_idx = np.arange(fold.train_start, fold.train_end)
            test_idx = np.arange(fold.test_start, fold.test_end)
            yield train_idx, test_idx

    def get_n_splits(self, X=None, y=None, groups=None) -> int:
        return self.n_splits


# ============================================================================
# WALK-FORWARD VALIDATOR
# ============================================================================

@dataclass
class FoldResult:
    """Container for results from a single fold."""
    fold_id: int
    train_start: datetime
    train_end: datetime
    test_start: datetime
    test_end: datetime
    predictions: pd.DataFrame
    metrics: Dict[str, float]
    model_info: Optional[Dict[str, Any]] = None


class WalkForwardValidator:
    """
    Walk-forward validation for Bayesian time series models.

    Handles the full workflow of fitting models, generating predictions,
    and computing metrics across multiple time periods.

    Parameters
    ----------
    n_folds : int
        Number of validation folds
    test_size : int
        Size of each test period
    gap : int
        Gap between training and test
    method : str
        'expanding' or 'rolling'
    refit : bool
        If True, refit model for each fold. If False, update parameters.

    Examples
    --------
    >>> validator = WalkForwardValidator(n_folds=5, test_size=30)
    >>> results = validator.validate(
    ...     data=df,
    ...     fit_func=my_fit_function,
    ...     predict_func=my_predict_function,
    ...     target_col='Close'
    ... )
    """

    def __init__(
        self,
        n_folds: int = 5,
        test_size: int = 30,
        gap: int = 0,
        method: str = 'expanding',
        train_size: Optional[int] = None,
        refit: bool = True
    ):
        self.n_folds = n_folds
        self.test_size = test_size
        self.gap = gap
        self.method = method
        self.train_size = train_size
        self.refit = refit
        self.results_: List[FoldResult] = []

    def validate(
        self,
        data: pd.DataFrame,
        fit_func: Callable,
        predict_func: Callable,
        target_col: str,
        metric_funcs: Optional[Dict[str, Callable]] = None,
        verbose: bool = True,
        **fit_kwargs
    ) -> List[FoldResult]:
        """
        Run walk-forward validation.

        Parameters
        ----------
        data : pd.DataFrame
            Full dataset with DatetimeIndex
        fit_func : callable
            Function to fit model: fit_func(train_data, **fit_kwargs) -> model
        predict_func : callable
            Function to generate predictions: predict_func(model, test_data) -> predictions
        target_col : str
            Name of target column
        metric_funcs : dict, optional
            Dictionary of {name: func} for custom metrics
        verbose : bool
            Print progress
        **fit_kwargs
            Additional arguments for fit_func

        Returns
        -------
        list of FoldResult
            Results for each fold
        """
        from .metrics import mae, rmse, crps

        # Default metrics
        if metric_funcs is None:
            metric_funcs = {
                'MAE': mae,
                'RMSE': rmse,
            }

        # Create folds
        folds = create_folds(
            data,
            method=self.method,
            n_folds=self.n_folds,
            test_size=self.test_size,
            train_size=self.train_size,
            gap=self.gap
        )

        results = []
        model = None

        for i, (train_data, test_data) in enumerate(folds):
            if verbose:
                print(f"\nFold {i+1}/{self.n_folds}")
                print(f"  Train: {train_data.index[0]} to {train_data.index[-1]} ({len(train_data)} samples)")
                print(f"  Test:  {test_data.index[0]} to {test_data.index[-1]} ({len(test_data)} samples)")

            # Fit model
            if self.refit or model is None:
                model = fit_func(train_data, **fit_kwargs)

            # Generate predictions
            predictions = predict_func(model, test_data)

            # Ensure predictions is a DataFrame
            if isinstance(predictions, np.ndarray):
                predictions = pd.DataFrame({
                    'prediction': predictions
                }, index=test_data.index)
            elif isinstance(predictions, pd.Series):
                predictions = predictions.to_frame('prediction')

            # Add actual values
            if 'actual' not in predictions.columns:
                predictions['actual'] = test_data[target_col].values

            # Calculate metrics
            metrics = {}
            actual = predictions['actual'].values
            pred = predictions['prediction'].values if 'prediction' in predictions.columns else predictions.iloc[:, 0].values

            for name, func in metric_funcs.items():
                try:
                    metrics[name] = func(actual, pred)
                except Exception as e:
                    warnings.warn(f"Failed to calculate {name}: {e}")
                    metrics[name] = np.nan

            if verbose:
                for name, value in metrics.items():
                    print(f"  {name}: {value:.4f}")

            # Store results
            result = FoldResult(
                fold_id=i,
                train_start=train_data.index[0],
                train_end=train_data.index[-1],
                test_start=test_data.index[0],
                test_end=test_data.index[-1],
                predictions=predictions,
                metrics=metrics
            )
            results.append(result)

        self.results_ = results
        return results

    def summary(self) -> pd.DataFrame:
        """
        Summarize validation results across all folds.

        Returns
        -------
        pd.DataFrame
            Summary statistics for each metric
        """
        if not self.results_:
            raise ValueError("No results available. Run validate() first.")

        # Collect metrics
        metrics_df = pd.DataFrame([r.metrics for r in self.results_])

        # Calculate summary statistics
        summary = pd.DataFrame({
            'Mean': metrics_df.mean(),
            'Std': metrics_df.std(),
            'Min': metrics_df.min(),
            'Max': metrics_df.max(),
            'Median': metrics_df.median()
        })

        return summary

    def get_all_predictions(self) -> pd.DataFrame:
        """
        Combine predictions from all folds.

        Returns
        -------
        pd.DataFrame
            All predictions with fold information
        """
        if not self.results_:
            raise ValueError("No results available. Run validate() first.")

        dfs = []
        for result in self.results_:
            df = result.predictions.copy()
            df['fold'] = result.fold_id
            dfs.append(df)

        return pd.concat(dfs)


# ============================================================================
# BACKTESTER
# ============================================================================

class Backtester:
    """
    Backtesting framework for trading strategies based on Bayesian forecasts.

    Parameters
    ----------
    initial_capital : float
        Starting capital
    transaction_cost : float
        Cost per trade as fraction of trade value
    slippage : float
        Slippage as fraction of price

    Examples
    --------
    >>> backtester = Backtester(initial_capital=100000)
    >>> results = backtester.run(
    ...     prices=price_series,
    ...     signals=signal_series,
    ...     position_sizer=my_position_sizer
    ... )
    """

    def __init__(
        self,
        initial_capital: float = 100000.0,
        transaction_cost: float = 0.001,
        slippage: float = 0.0005
    ):
        self.initial_capital = initial_capital
        self.transaction_cost = transaction_cost
        self.slippage = slippage
        self.results_: Optional[pd.DataFrame] = None

    def run(
        self,
        prices: pd.Series,
        signals: pd.Series,
        position_sizer: Optional[Callable] = None,
        max_position: float = 1.0
    ) -> pd.DataFrame:
        """
        Run backtest with signals.

        Parameters
        ----------
        prices : pd.Series
            Price series
        signals : pd.Series
            Trading signals (-1, 0, 1)
        position_sizer : callable, optional
            Function to determine position size: f(signal, price, portfolio_value) -> size
        max_position : float
            Maximum position size as fraction of portfolio

        Returns
        -------
        pd.DataFrame
            Backtest results with equity curve, positions, returns
        """
        if position_sizer is None:
            position_sizer = lambda s, p, v: s * max_position

        # Align signals and prices
        signals = signals.reindex(prices.index).fillna(0)

        # Initialize tracking
        n = len(prices)
        equity = np.zeros(n)
        positions = np.zeros(n)
        cash = np.zeros(n)
        returns = np.zeros(n)
        trades = np.zeros(n)

        equity[0] = self.initial_capital
        cash[0] = self.initial_capital
        positions[0] = 0

        for i in range(1, n):
            price = prices.iloc[i]
            prev_price = prices.iloc[i-1]
            signal = signals.iloc[i-1]  # Signal from previous day

            # Determine target position
            target_position = position_sizer(signal, price, equity[i-1])
            target_position = np.clip(target_position, -max_position, max_position)

            # Calculate trade
            position_change = target_position - positions[i-1]

            if abs(position_change) > 0.001:  # Trade threshold
                # Apply slippage
                if position_change > 0:
                    execution_price = price * (1 + self.slippage)
                else:
                    execution_price = price * (1 - self.slippage)

                trade_value = abs(position_change * equity[i-1])
                trade_cost = trade_value * self.transaction_cost

                positions[i] = target_position
                cash[i] = cash[i-1] - position_change * equity[i-1] - trade_cost
                trades[i] = 1
            else:
                positions[i] = positions[i-1]
                cash[i] = cash[i-1]

            # Calculate equity
            position_value = positions[i] * equity[i-1] * (price / prev_price)
            equity[i] = cash[i] + position_value

            # Calculate return
            returns[i] = (equity[i] / equity[i-1]) - 1

        # Create results DataFrame
        results = pd.DataFrame({
            'price': prices.values,
            'signal': signals.values,
            'position': positions,
            'equity': equity,
            'cash': cash,
            'returns': returns,
            'trades': trades
        }, index=prices.index)

        # Add cumulative metrics
        results['cumulative_return'] = (1 + results['returns']).cumprod() - 1
        results['drawdown'] = self._calculate_drawdown(equity)

        self.results_ = results
        return results

    def _calculate_drawdown(self, equity: np.ndarray) -> np.ndarray:
        """Calculate drawdown series."""
        running_max = np.maximum.accumulate(equity)
        drawdown = (equity - running_max) / running_max
        return drawdown

    def summary(self) -> Dict[str, float]:
        """
        Calculate backtest performance summary.

        Returns
        -------
        dict
            Performance metrics
        """
        if self.results_ is None:
            raise ValueError("No results available. Run backtest first.")

        from .metrics import sharpe_ratio, sortino_ratio, max_drawdown, profit_factor

        returns = self.results_['returns'].values
        equity = self.results_['equity'].values

        max_dd, _, _ = max_drawdown(equity)

        summary = {
            'Total Return (%)': (equity[-1] / equity[0] - 1) * 100,
            'Annual Return (%)': ((equity[-1] / equity[0]) ** (252 / len(equity)) - 1) * 100,
            'Annual Volatility (%)': np.std(returns) * np.sqrt(252) * 100,
            'Sharpe Ratio': sharpe_ratio(returns),
            'Sortino Ratio': sortino_ratio(returns),
            'Max Drawdown (%)': max_dd * 100,
            'Win Rate (%)': np.mean(returns > 0) * 100,
            'Profit Factor': profit_factor(returns),
            'Total Trades': self.results_['trades'].sum(),
            'Final Equity': equity[-1],
        }

        return summary


def kelly_position_sizer(
    signal: float,
    predicted_return: float,
    predicted_std: float,
    risk_free_rate: float = 0.0,
    max_leverage: float = 1.0,
    fraction: float = 0.5  # Half-Kelly for safety
) -> float:
    """
    Kelly criterion position sizing with uncertainty.

    Parameters
    ----------
    signal : float
        Trading signal direction
    predicted_return : float
        Expected return from Bayesian model
    predicted_std : float
        Standard deviation of return prediction
    risk_free_rate : float
        Risk-free rate
    max_leverage : float
        Maximum leverage allowed
    fraction : float
        Fraction of Kelly (0.5 = half-Kelly)

    Returns
    -------
    float
        Position size (-max_leverage to max_leverage)

    Notes
    -----
    Kelly fraction = (predicted_return - risk_free_rate) / predicted_std^2

    Using fraction < 1 (typically 0.5) reduces volatility and protects
    against estimation errors in predicted_return and predicted_std.
    """
    if predicted_std < 1e-10:
        return 0.0

    kelly = (predicted_return - risk_free_rate) / (predicted_std ** 2)
    position = kelly * fraction * np.sign(signal)

    return np.clip(position, -max_leverage, max_leverage)


def uncertainty_based_sizer(
    signal: float,
    confidence: float,
    base_position: float = 0.5,
    confidence_threshold: float = 0.7
) -> float:
    """
    Position sizing based on forecast confidence.

    Higher confidence = larger position.

    Parameters
    ----------
    signal : float
        Trading signal direction
    confidence : float
        Confidence level (0 to 1)
    base_position : float
        Base position size at threshold confidence
    confidence_threshold : float
        Minimum confidence to take position

    Returns
    -------
    float
        Position size
    """
    if confidence < confidence_threshold:
        return 0.0

    # Scale position with confidence
    scale = (confidence - confidence_threshold) / (1 - confidence_threshold)
    position = base_position + scale * (1 - base_position)

    return position * np.sign(signal)


if __name__ == '__main__':
    # Demo
    np.random.seed(42)

    # Generate sample data
    dates = pd.date_range('2020-01-01', periods=500, freq='D')
    prices = pd.Series(100 * np.exp(np.cumsum(np.random.randn(500) * 0.02)), index=dates)

    # Simple moving average crossover signals
    ma_short = prices.rolling(10).mean()
    ma_long = prices.rolling(50).mean()
    signals = pd.Series(np.where(ma_short > ma_long, 1, -1), index=dates)

    # Run backtest
    backtester = Backtester(initial_capital=100000)
    results = backtester.run(prices, signals)

    print("Backtest Summary:")
    for key, value in backtester.summary().items():
        print(f"  {key}: {value:.2f}")
