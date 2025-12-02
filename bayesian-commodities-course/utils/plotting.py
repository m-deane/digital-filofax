"""
Plotting Utilities for Bayesian Time Series
============================================

Standardized visualization functions for the course.

This module provides:
- Bayesian posterior visualizations
- Time series forecast plots with uncertainty
- Model diagnostic plots
- Trading signal visualizations
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from matplotlib.patches import Patch
from typing import Optional, Union, List, Tuple, Dict, Any
import warnings

# Set style defaults
plt.style.use('seaborn-v0_8-whitegrid')

# Color palette optimized for Bayesian visualizations
COLORS = {
    'primary': '#2E86AB',       # Blue - main data
    'secondary': '#A23B72',     # Magenta - secondary data
    'accent': '#F18F01',        # Orange - highlights
    'positive': '#4CAF50',      # Green - positive/buy
    'negative': '#F44336',      # Red - negative/sell
    'neutral': '#9E9E9E',       # Gray - neutral
    'prior': '#E8A87C',         # Tan - prior
    'posterior': '#2E86AB',     # Blue - posterior
    'likelihood': '#85DCB8',    # Mint - likelihood
    'prediction': '#F18F01',    # Orange - predictions
    'uncertainty': '#2E86AB',   # Blue with alpha for uncertainty
    'train': '#2E86AB',         # Blue - training data
    'test': '#A23B72',          # Magenta - test data
}

__all__ = [
    'plot_time_series',
    'plot_forecast',
    'plot_posterior',
    'plot_prior_posterior',
    'plot_trace',
    'plot_prediction_intervals',
    'plot_residuals',
    'plot_acf_pacf',
    'plot_decomposition',
    'plot_trading_signals',
    'plot_backtest_results',
    'plot_comparison',
    'setup_plot_style',
    'COLORS',
]


def setup_plot_style() -> None:
    """Set up matplotlib style for consistent course visuals."""
    plt.rcParams.update({
        'figure.figsize': (12, 6),
        'figure.dpi': 100,
        'axes.titlesize': 14,
        'axes.labelsize': 12,
        'xtick.labelsize': 10,
        'ytick.labelsize': 10,
        'legend.fontsize': 10,
        'figure.titlesize': 16,
        'axes.spines.top': False,
        'axes.spines.right': False,
    })


def plot_time_series(
    data: Union[pd.Series, pd.DataFrame],
    title: str = 'Time Series',
    ylabel: str = 'Value',
    figsize: Tuple[int, int] = (12, 6),
    show_volume: bool = False,
    highlight_periods: Optional[List[Tuple[str, str, str]]] = None,
    ax: Optional[plt.Axes] = None
) -> plt.Figure:
    """
    Plot a time series with optional volume and highlighted periods.

    Parameters
    ----------
    data : pd.Series or pd.DataFrame
        Time series data with DatetimeIndex
    title : str
        Plot title
    ylabel : str
        Y-axis label
    figsize : tuple
        Figure size
    show_volume : bool
        If True and data has 'Volume' column, show volume subplot
    highlight_periods : list of tuples
        List of (start_date, end_date, label) to highlight
    ax : plt.Axes, optional
        Existing axes to plot on

    Returns
    -------
    plt.Figure
        Matplotlib figure

    Examples
    --------
    >>> plot_time_series(crude_oil['Close'], title='WTI Crude Oil')
    >>> plot_time_series(df, highlight_periods=[('2020-03-01', '2020-04-30', 'COVID Crash')])
    """
    if ax is None:
        if show_volume and isinstance(data, pd.DataFrame) and 'Volume' in data.columns:
            fig, (ax1, ax2) = plt.subplots(2, 1, figsize=figsize, height_ratios=[3, 1], sharex=True)
        else:
            fig, ax1 = plt.subplots(figsize=figsize)
            ax2 = None
    else:
        ax1 = ax
        ax2 = None
        fig = ax.figure

    # Plot main series
    if isinstance(data, pd.DataFrame):
        if 'Close' in data.columns:
            ax1.plot(data.index, data['Close'], color=COLORS['primary'], linewidth=1.5)
        else:
            for i, col in enumerate(data.columns[:5]):  # Limit to 5 columns
                color = list(COLORS.values())[i % len(COLORS)]
                ax1.plot(data.index, data[col], label=col, linewidth=1.5)
            ax1.legend()
    else:
        ax1.plot(data.index, data.values, color=COLORS['primary'], linewidth=1.5)

    # Highlight periods
    if highlight_periods:
        for start, end, label in highlight_periods:
            ax1.axvspan(pd.Timestamp(start), pd.Timestamp(end),
                       alpha=0.2, color=COLORS['accent'], label=label)
        ax1.legend()

    ax1.set_title(title, fontsize=14, fontweight='bold')
    ax1.set_ylabel(ylabel)
    ax1.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
    ax1.xaxis.set_major_locator(mdates.MonthLocator(interval=6))
    plt.setp(ax1.xaxis.get_majorticklabels(), rotation=45, ha='right')

    # Volume subplot
    if ax2 is not None and isinstance(data, pd.DataFrame) and 'Volume' in data.columns:
        ax2.bar(data.index, data['Volume'], color=COLORS['neutral'], alpha=0.7, width=1)
        ax2.set_ylabel('Volume')
        ax2.set_xlabel('Date')

    plt.tight_layout()
    return fig


def plot_forecast(
    actual: pd.Series,
    forecast: pd.Series,
    lower: Optional[pd.Series] = None,
    upper: Optional[pd.Series] = None,
    train_end: Optional[str] = None,
    title: str = 'Forecast vs Actual',
    ylabel: str = 'Value',
    figsize: Tuple[int, int] = (12, 6),
    credible_intervals: Optional[List[Tuple[pd.Series, pd.Series, float]]] = None,
    ax: Optional[plt.Axes] = None
) -> plt.Figure:
    """
    Plot forecast with prediction intervals.

    Parameters
    ----------
    actual : pd.Series
        Actual values
    forecast : pd.Series
        Forecasted values
    lower : pd.Series, optional
        Lower bound of prediction interval
    upper : pd.Series, optional
        Upper bound of prediction interval
    train_end : str, optional
        Date marking end of training period
    title : str
        Plot title
    ylabel : str
        Y-axis label
    figsize : tuple
        Figure size
    credible_intervals : list of tuples, optional
        List of (lower, upper, alpha) for multiple intervals (e.g., 50%, 90%)
    ax : plt.Axes, optional
        Existing axes

    Returns
    -------
    plt.Figure
        Matplotlib figure

    Examples
    --------
    >>> plot_forecast(actual, forecast, lower=ci_lower, upper=ci_upper)
    >>> plot_forecast(actual, forecast, credible_intervals=[
    ...     (ci50_low, ci50_high, 0.3),
    ...     (ci90_low, ci90_high, 0.15)
    ... ])
    """
    if ax is None:
        fig, ax = plt.subplots(figsize=figsize)
    else:
        fig = ax.figure

    # Plot actual values
    ax.plot(actual.index, actual.values, color=COLORS['primary'],
            label='Actual', linewidth=1.5)

    # Plot forecast
    ax.plot(forecast.index, forecast.values, color=COLORS['prediction'],
            label='Forecast', linewidth=2, linestyle='--')

    # Plot prediction intervals
    if credible_intervals:
        for ci_lower, ci_upper, alpha in sorted(credible_intervals, key=lambda x: -x[2]):
            ax.fill_between(ci_lower.index, ci_lower.values, ci_upper.values,
                           alpha=alpha, color=COLORS['uncertainty'])
    elif lower is not None and upper is not None:
        ax.fill_between(lower.index, lower.values, upper.values,
                       alpha=0.2, color=COLORS['uncertainty'], label='95% CI')

    # Mark train/test split
    if train_end:
        ax.axvline(pd.Timestamp(train_end), color=COLORS['neutral'],
                  linestyle=':', linewidth=2, label='Train/Test Split')

    ax.set_title(title, fontsize=14, fontweight='bold')
    ax.set_ylabel(ylabel)
    ax.set_xlabel('Date')
    ax.legend(loc='best')
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
    plt.setp(ax.xaxis.get_majorticklabels(), rotation=45, ha='right')

    plt.tight_layout()
    return fig


def plot_posterior(
    samples: np.ndarray,
    param_name: str = 'Parameter',
    prior_samples: Optional[np.ndarray] = None,
    true_value: Optional[float] = None,
    hdi_prob: float = 0.94,
    figsize: Tuple[int, int] = (10, 5),
    ax: Optional[plt.Axes] = None
) -> plt.Figure:
    """
    Plot posterior distribution with optional prior and true value.

    Parameters
    ----------
    samples : np.ndarray
        Posterior samples
    param_name : str
        Parameter name for labeling
    prior_samples : np.ndarray, optional
        Prior samples to overlay
    true_value : float, optional
        True value to mark
    hdi_prob : float
        Probability for HDI interval
    figsize : tuple
        Figure size
    ax : plt.Axes, optional
        Existing axes

    Returns
    -------
    plt.Figure
        Matplotlib figure
    """
    if ax is None:
        fig, ax = plt.subplots(figsize=figsize)
    else:
        fig = ax.figure

    # Plot prior if provided
    if prior_samples is not None:
        ax.hist(prior_samples, bins=50, density=True, alpha=0.4,
               color=COLORS['prior'], label='Prior')

    # Plot posterior
    ax.hist(samples, bins=50, density=True, alpha=0.7,
           color=COLORS['posterior'], label='Posterior')

    # Calculate and plot HDI
    hdi_low = np.percentile(samples, (1 - hdi_prob) / 2 * 100)
    hdi_high = np.percentile(samples, (1 + hdi_prob) / 2 * 100)
    ax.axvline(hdi_low, color=COLORS['posterior'], linestyle='--',
              linewidth=2, alpha=0.7)
    ax.axvline(hdi_high, color=COLORS['posterior'], linestyle='--',
              linewidth=2, alpha=0.7)

    # Plot mean
    mean_val = np.mean(samples)
    ax.axvline(mean_val, color=COLORS['accent'], linewidth=2,
              label=f'Mean: {mean_val:.3f}')

    # Plot true value if provided
    if true_value is not None:
        ax.axvline(true_value, color=COLORS['positive'], linewidth=2,
                  linestyle=':', label=f'True: {true_value:.3f}')

    ax.set_title(f'Posterior Distribution: {param_name}', fontsize=14, fontweight='bold')
    ax.set_xlabel(param_name)
    ax.set_ylabel('Density')
    ax.legend()

    # Add HDI annotation
    ax.annotate(f'{hdi_prob*100:.0f}% HDI: [{hdi_low:.3f}, {hdi_high:.3f}]',
               xy=(0.02, 0.98), xycoords='axes fraction', fontsize=10,
               verticalalignment='top', bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))

    plt.tight_layout()
    return fig


def plot_prior_posterior(
    prior_samples: np.ndarray,
    posterior_samples: np.ndarray,
    param_name: str = 'Parameter',
    true_value: Optional[float] = None,
    figsize: Tuple[int, int] = (12, 5)
) -> plt.Figure:
    """
    Side-by-side comparison of prior and posterior distributions.

    Parameters
    ----------
    prior_samples : np.ndarray
        Prior samples
    posterior_samples : np.ndarray
        Posterior samples
    param_name : str
        Parameter name
    true_value : float, optional
        True value to mark
    figsize : tuple
        Figure size

    Returns
    -------
    plt.Figure
        Matplotlib figure
    """
    fig, axes = plt.subplots(1, 2, figsize=figsize)

    # Prior
    axes[0].hist(prior_samples, bins=50, density=True, alpha=0.7, color=COLORS['prior'])
    axes[0].set_title('Prior Distribution', fontsize=12, fontweight='bold')
    axes[0].set_xlabel(param_name)
    axes[0].set_ylabel('Density')
    if true_value is not None:
        axes[0].axvline(true_value, color=COLORS['positive'], linewidth=2,
                       linestyle=':', label=f'True: {true_value:.3f}')
        axes[0].legend()

    # Posterior
    axes[1].hist(posterior_samples, bins=50, density=True, alpha=0.7, color=COLORS['posterior'])
    axes[1].set_title('Posterior Distribution', fontsize=12, fontweight='bold')
    axes[1].set_xlabel(param_name)
    axes[1].set_ylabel('Density')

    # Add statistics
    post_mean = np.mean(posterior_samples)
    post_std = np.std(posterior_samples)
    axes[1].axvline(post_mean, color=COLORS['accent'], linewidth=2,
                   label=f'Mean: {post_mean:.3f}')
    if true_value is not None:
        axes[1].axvline(true_value, color=COLORS['positive'], linewidth=2,
                       linestyle=':', label=f'True: {true_value:.3f}')
    axes[1].legend()

    # Annotate prior shrinkage
    prior_std = np.std(prior_samples)
    shrinkage = 1 - (post_std / prior_std)
    fig.suptitle(f'{param_name}: Prior → Posterior (Shrinkage: {shrinkage:.1%})',
                fontsize=14, fontweight='bold')

    plt.tight_layout()
    return fig


def plot_trace(
    samples: np.ndarray,
    param_name: str = 'Parameter',
    figsize: Tuple[int, int] = (12, 4)
) -> plt.Figure:
    """
    Plot MCMC trace and posterior histogram side by side.

    Parameters
    ----------
    samples : np.ndarray
        MCMC samples (can be 1D or 2D for multiple chains)
    param_name : str
        Parameter name
    figsize : tuple
        Figure size

    Returns
    -------
    plt.Figure
        Matplotlib figure
    """
    fig, axes = plt.subplots(1, 2, figsize=figsize)

    # Handle multiple chains
    if samples.ndim == 1:
        samples = samples.reshape(1, -1)

    # Trace plot
    for i, chain in enumerate(samples):
        axes[0].plot(chain, alpha=0.7, linewidth=0.5, label=f'Chain {i+1}')
    axes[0].set_title('Trace Plot', fontsize=12, fontweight='bold')
    axes[0].set_xlabel('Iteration')
    axes[0].set_ylabel(param_name)
    if len(samples) > 1:
        axes[0].legend()

    # Histogram
    all_samples = samples.flatten()
    axes[1].hist(all_samples, bins=50, density=True, alpha=0.7, color=COLORS['posterior'])
    axes[1].axvline(np.mean(all_samples), color=COLORS['accent'], linewidth=2,
                   label=f'Mean: {np.mean(all_samples):.3f}')
    axes[1].set_title('Posterior Distribution', fontsize=12, fontweight='bold')
    axes[1].set_xlabel(param_name)
    axes[1].set_ylabel('Density')
    axes[1].legend()

    fig.suptitle(f'MCMC Diagnostics: {param_name}', fontsize=14, fontweight='bold')
    plt.tight_layout()
    return fig


def plot_prediction_intervals(
    dates: pd.DatetimeIndex,
    mean: np.ndarray,
    intervals: Dict[float, Tuple[np.ndarray, np.ndarray]],
    actual: Optional[np.ndarray] = None,
    title: str = 'Prediction Intervals',
    ylabel: str = 'Value',
    figsize: Tuple[int, int] = (12, 6)
) -> plt.Figure:
    """
    Plot prediction with multiple credible intervals.

    Parameters
    ----------
    dates : pd.DatetimeIndex
        Date index
    mean : np.ndarray
        Mean prediction
    intervals : dict
        {probability: (lower, upper)} for each interval
    actual : np.ndarray, optional
        Actual values to overlay
    title : str
        Plot title
    ylabel : str
        Y-axis label
    figsize : tuple
        Figure size

    Returns
    -------
    plt.Figure
        Matplotlib figure

    Examples
    --------
    >>> intervals = {
    ...     0.50: (ci50_low, ci50_high),
    ...     0.90: (ci90_low, ci90_high),
    ...     0.95: (ci95_low, ci95_high)
    ... }
    >>> plot_prediction_intervals(dates, mean_pred, intervals, actual=y_test)
    """
    fig, ax = plt.subplots(figsize=figsize)

    # Sort intervals by probability (widest first for layering)
    sorted_intervals = sorted(intervals.items(), key=lambda x: -x[0])

    # Plot intervals from widest to narrowest
    base_alpha = 0.15
    for prob, (lower, upper) in sorted_intervals:
        alpha = base_alpha + (1 - prob) * 0.2
        ax.fill_between(dates, lower, upper, alpha=alpha,
                       color=COLORS['uncertainty'],
                       label=f'{prob*100:.0f}% CI')

    # Plot mean prediction
    ax.plot(dates, mean, color=COLORS['prediction'], linewidth=2, label='Prediction')

    # Plot actual if provided
    if actual is not None:
        ax.plot(dates, actual, color=COLORS['primary'], linewidth=1.5,
               label='Actual', alpha=0.8)

    ax.set_title(title, fontsize=14, fontweight='bold')
    ax.set_xlabel('Date')
    ax.set_ylabel(ylabel)
    ax.legend(loc='upper left')
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
    plt.setp(ax.xaxis.get_majorticklabels(), rotation=45, ha='right')

    plt.tight_layout()
    return fig


def plot_residuals(
    residuals: np.ndarray,
    dates: Optional[pd.DatetimeIndex] = None,
    figsize: Tuple[int, int] = (12, 8)
) -> plt.Figure:
    """
    Diagnostic plots for model residuals.

    Parameters
    ----------
    residuals : np.ndarray
        Model residuals
    dates : pd.DatetimeIndex, optional
        Date index for time series plot
    figsize : tuple
        Figure size

    Returns
    -------
    plt.Figure
        Matplotlib figure with 4 diagnostic plots
    """
    fig, axes = plt.subplots(2, 2, figsize=figsize)

    # 1. Time series of residuals
    if dates is not None:
        axes[0, 0].plot(dates, residuals, color=COLORS['primary'], linewidth=0.8)
        axes[0, 0].axhline(0, color=COLORS['neutral'], linestyle='--')
        axes[0, 0].set_xlabel('Date')
    else:
        axes[0, 0].plot(residuals, color=COLORS['primary'], linewidth=0.8)
        axes[0, 0].axhline(0, color=COLORS['neutral'], linestyle='--')
        axes[0, 0].set_xlabel('Observation')
    axes[0, 0].set_ylabel('Residual')
    axes[0, 0].set_title('Residuals Over Time', fontsize=12, fontweight='bold')

    # 2. Histogram
    axes[0, 1].hist(residuals, bins=30, density=True, alpha=0.7, color=COLORS['posterior'])
    # Overlay normal distribution
    from scipy import stats
    x = np.linspace(residuals.min(), residuals.max(), 100)
    axes[0, 1].plot(x, stats.norm.pdf(x, np.mean(residuals), np.std(residuals)),
                   color=COLORS['accent'], linewidth=2, label='Normal')
    axes[0, 1].set_xlabel('Residual')
    axes[0, 1].set_ylabel('Density')
    axes[0, 1].set_title('Residual Distribution', fontsize=12, fontweight='bold')
    axes[0, 1].legend()

    # 3. Q-Q plot
    stats.probplot(residuals, dist="norm", plot=axes[1, 0])
    axes[1, 0].set_title('Q-Q Plot', fontsize=12, fontweight='bold')

    # 4. ACF of residuals
    from statsmodels.graphics.tsaplots import plot_acf
    plot_acf(residuals, lags=30, ax=axes[1, 1], alpha=0.05)
    axes[1, 1].set_title('Residual Autocorrelation', fontsize=12, fontweight='bold')

    fig.suptitle('Residual Diagnostics', fontsize=14, fontweight='bold')
    plt.tight_layout()
    return fig


def plot_acf_pacf(
    series: pd.Series,
    lags: int = 40,
    figsize: Tuple[int, int] = (12, 5)
) -> plt.Figure:
    """
    Plot ACF and PACF for time series analysis.

    Parameters
    ----------
    series : pd.Series
        Time series data
    lags : int
        Number of lags to show
    figsize : tuple
        Figure size

    Returns
    -------
    plt.Figure
        Matplotlib figure
    """
    from statsmodels.graphics.tsaplots import plot_acf, plot_pacf

    fig, axes = plt.subplots(1, 2, figsize=figsize)

    plot_acf(series.dropna(), lags=lags, ax=axes[0], alpha=0.05)
    axes[0].set_title('Autocorrelation Function (ACF)', fontsize=12, fontweight='bold')

    plot_pacf(series.dropna(), lags=lags, ax=axes[1], alpha=0.05, method='ywm')
    axes[1].set_title('Partial Autocorrelation Function (PACF)', fontsize=12, fontweight='bold')

    plt.tight_layout()
    return fig


def plot_decomposition(
    result,
    figsize: Tuple[int, int] = (12, 10)
) -> plt.Figure:
    """
    Plot time series decomposition results.

    Parameters
    ----------
    result : DecomposeResult
        Result from statsmodels seasonal_decompose or STL
    figsize : tuple
        Figure size

    Returns
    -------
    plt.Figure
        Matplotlib figure
    """
    fig, axes = plt.subplots(4, 1, figsize=figsize, sharex=True)

    components = [
        ('observed', 'Observed', COLORS['primary']),
        ('trend', 'Trend', COLORS['secondary']),
        ('seasonal', 'Seasonal', COLORS['accent']),
        ('resid', 'Residual', COLORS['neutral'])
    ]

    for ax, (attr, title, color) in zip(axes, components):
        data = getattr(result, attr)
        ax.plot(data.index, data.values, color=color, linewidth=1)
        ax.set_ylabel(title)
        ax.set_title(title, fontsize=11, fontweight='bold', loc='left')

    axes[-1].set_xlabel('Date')
    fig.suptitle('Time Series Decomposition', fontsize=14, fontweight='bold')
    plt.tight_layout()
    return fig


def plot_trading_signals(
    prices: pd.Series,
    signals: pd.Series,
    title: str = 'Trading Signals',
    figsize: Tuple[int, int] = (14, 7)
) -> plt.Figure:
    """
    Plot price series with buy/sell signals.

    Parameters
    ----------
    prices : pd.Series
        Price series
    signals : pd.Series
        Signal series (1 = buy, -1 = sell, 0 = hold)
    title : str
        Plot title
    figsize : tuple
        Figure size

    Returns
    -------
    plt.Figure
        Matplotlib figure
    """
    fig, axes = plt.subplots(2, 1, figsize=figsize, height_ratios=[3, 1], sharex=True)

    # Price with signals
    axes[0].plot(prices.index, prices.values, color=COLORS['primary'], linewidth=1.5)

    # Mark buy signals
    buy_mask = signals == 1
    if buy_mask.any():
        axes[0].scatter(prices.index[buy_mask], prices.values[buy_mask],
                       marker='^', color=COLORS['positive'], s=100,
                       label='Buy', zorder=5)

    # Mark sell signals
    sell_mask = signals == -1
    if sell_mask.any():
        axes[0].scatter(prices.index[sell_mask], prices.values[sell_mask],
                       marker='v', color=COLORS['negative'], s=100,
                       label='Sell', zorder=5)

    axes[0].set_ylabel('Price')
    axes[0].set_title(title, fontsize=14, fontweight='bold')
    axes[0].legend()

    # Signal bar chart
    colors = [COLORS['positive'] if s > 0 else COLORS['negative'] if s < 0
              else COLORS['neutral'] for s in signals]
    axes[1].bar(signals.index, signals.values, color=colors, width=1)
    axes[1].set_ylabel('Signal')
    axes[1].set_xlabel('Date')
    axes[1].set_ylim(-1.5, 1.5)
    axes[1].axhline(0, color=COLORS['neutral'], linestyle='-', linewidth=0.5)

    plt.tight_layout()
    return fig


def plot_backtest_results(
    equity_curve: pd.Series,
    benchmark: Optional[pd.Series] = None,
    drawdown: Optional[pd.Series] = None,
    title: str = 'Backtest Results',
    figsize: Tuple[int, int] = (14, 10)
) -> plt.Figure:
    """
    Plot comprehensive backtest results.

    Parameters
    ----------
    equity_curve : pd.Series
        Strategy equity curve (cumulative returns or portfolio value)
    benchmark : pd.Series, optional
        Benchmark to compare against
    drawdown : pd.Series, optional
        Drawdown series
    title : str
        Plot title
    figsize : tuple
        Figure size

    Returns
    -------
    plt.Figure
        Matplotlib figure
    """
    n_plots = 2 if drawdown is None else 3
    fig, axes = plt.subplots(n_plots, 1, figsize=figsize, sharex=True,
                            height_ratios=[3, 1, 1][:n_plots])

    # Equity curve
    axes[0].plot(equity_curve.index, equity_curve.values,
                color=COLORS['primary'], linewidth=1.5, label='Strategy')
    if benchmark is not None:
        axes[0].plot(benchmark.index, benchmark.values,
                    color=COLORS['neutral'], linewidth=1.5,
                    linestyle='--', label='Benchmark')
    axes[0].set_ylabel('Portfolio Value')
    axes[0].set_title(title, fontsize=14, fontweight='bold')
    axes[0].legend()

    # Returns
    returns = equity_curve.pct_change().fillna(0)
    colors = [COLORS['positive'] if r > 0 else COLORS['negative'] for r in returns]
    axes[1].bar(returns.index, returns.values, color=colors, width=1, alpha=0.7)
    axes[1].set_ylabel('Daily Return')
    axes[1].axhline(0, color=COLORS['neutral'], linestyle='-', linewidth=0.5)

    # Drawdown
    if drawdown is not None:
        axes[2].fill_between(drawdown.index, 0, drawdown.values * 100,
                            color=COLORS['negative'], alpha=0.5)
        axes[2].set_ylabel('Drawdown (%)')
        axes[2].set_xlabel('Date')

    plt.tight_layout()
    return fig


def plot_comparison(
    results: Dict[str, pd.Series],
    title: str = 'Model Comparison',
    ylabel: str = 'Value',
    figsize: Tuple[int, int] = (12, 6)
) -> plt.Figure:
    """
    Compare multiple model forecasts or metrics.

    Parameters
    ----------
    results : dict
        Dictionary of {model_name: series}
    title : str
        Plot title
    ylabel : str
        Y-axis label
    figsize : tuple
        Figure size

    Returns
    -------
    plt.Figure
        Matplotlib figure
    """
    fig, ax = plt.subplots(figsize=figsize)

    colors = list(COLORS.values())
    for i, (name, series) in enumerate(results.items()):
        color = colors[i % len(colors)]
        ax.plot(series.index, series.values, label=name,
               color=color, linewidth=1.5)

    ax.set_title(title, fontsize=14, fontweight='bold')
    ax.set_xlabel('Date')
    ax.set_ylabel(ylabel)
    ax.legend(loc='best')
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
    plt.setp(ax.xaxis.get_majorticklabels(), rotation=45, ha='right')

    plt.tight_layout()
    return fig


if __name__ == '__main__':
    # Demo
    setup_plot_style()

    # Generate sample data
    np.random.seed(42)
    dates = pd.date_range('2020-01-01', periods=500, freq='D')
    prices = 100 + np.cumsum(np.random.randn(500) * 2)

    # Demo time series plot
    series = pd.Series(prices, index=dates)
    fig = plot_time_series(series, title='Demo Time Series')
    plt.show()
