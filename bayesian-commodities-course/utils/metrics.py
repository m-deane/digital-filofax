"""
Evaluation Metrics for Bayesian Forecasting
============================================

This module provides comprehensive metrics for evaluating:
- Point forecasts (MAE, RMSE, MAPE)
- Probabilistic forecasts (CRPS, log-likelihood, calibration)
- Trading performance (Sharpe, Sortino, max drawdown)

Key Focus: Proper scoring rules for Bayesian forecasts
"""

import numpy as np
import pandas as pd
from typing import Optional, Union, List, Tuple, Dict
from scipy import stats
import warnings

__all__ = [
    # Point forecast metrics
    'mae', 'rmse', 'mape', 'mase', 'smape',
    # Probabilistic metrics
    'crps', 'crps_gaussian', 'log_likelihood', 'calibration_score',
    'interval_coverage', 'interval_width', 'winkler_score',
    # Trading metrics
    'sharpe_ratio', 'sortino_ratio', 'max_drawdown', 'calmar_ratio',
    'profit_factor', 'win_rate', 'risk_adjusted_return',
    # Summary functions
    'forecast_summary', 'backtest_summary',
]


# ============================================================================
# POINT FORECAST METRICS
# ============================================================================

def mae(actual: np.ndarray, predicted: np.ndarray) -> float:
    """
    Mean Absolute Error.

    Parameters
    ----------
    actual : np.ndarray
        Actual values
    predicted : np.ndarray
        Predicted values

    Returns
    -------
    float
        MAE value

    Examples
    --------
    >>> mae(np.array([1, 2, 3]), np.array([1.1, 2.2, 2.9]))
    0.1333...
    """
    actual = np.asarray(actual).flatten()
    predicted = np.asarray(predicted).flatten()
    return np.mean(np.abs(actual - predicted))


def rmse(actual: np.ndarray, predicted: np.ndarray) -> float:
    """
    Root Mean Squared Error.

    Parameters
    ----------
    actual : np.ndarray
        Actual values
    predicted : np.ndarray
        Predicted values

    Returns
    -------
    float
        RMSE value
    """
    actual = np.asarray(actual).flatten()
    predicted = np.asarray(predicted).flatten()
    return np.sqrt(np.mean((actual - predicted) ** 2))


def mape(actual: np.ndarray, predicted: np.ndarray, epsilon: float = 1e-10) -> float:
    """
    Mean Absolute Percentage Error.

    Parameters
    ----------
    actual : np.ndarray
        Actual values
    predicted : np.ndarray
        Predicted values
    epsilon : float
        Small value to avoid division by zero

    Returns
    -------
    float
        MAPE value (as percentage, e.g., 5.2 = 5.2%)

    Notes
    -----
    MAPE is undefined when actual values are zero. This implementation
    adds epsilon to avoid division by zero.
    """
    actual = np.asarray(actual).flatten()
    predicted = np.asarray(predicted).flatten()
    return np.mean(np.abs((actual - predicted) / (np.abs(actual) + epsilon))) * 100


def smape(actual: np.ndarray, predicted: np.ndarray) -> float:
    """
    Symmetric Mean Absolute Percentage Error.

    More robust than MAPE when actuals are near zero.

    Parameters
    ----------
    actual : np.ndarray
        Actual values
    predicted : np.ndarray
        Predicted values

    Returns
    -------
    float
        SMAPE value (as percentage)
    """
    actual = np.asarray(actual).flatten()
    predicted = np.asarray(predicted).flatten()
    numerator = np.abs(predicted - actual)
    denominator = (np.abs(actual) + np.abs(predicted)) / 2
    return np.mean(numerator / denominator) * 100


def mase(
    actual: np.ndarray,
    predicted: np.ndarray,
    training_actual: np.ndarray,
    seasonality: int = 1
) -> float:
    """
    Mean Absolute Scaled Error.

    Scale-independent metric that compares forecast accuracy to naive
    seasonal forecast on training data.

    Parameters
    ----------
    actual : np.ndarray
        Actual test values
    predicted : np.ndarray
        Predicted values
    training_actual : np.ndarray
        Training set actual values (for scaling)
    seasonality : int
        Seasonal period (1 for non-seasonal naive)

    Returns
    -------
    float
        MASE value (< 1 means better than naive)

    Notes
    -----
    MASE < 1: Forecast is better than naive seasonal forecast
    MASE = 1: Forecast equals naive seasonal forecast
    MASE > 1: Forecast is worse than naive seasonal forecast
    """
    actual = np.asarray(actual).flatten()
    predicted = np.asarray(predicted).flatten()
    training_actual = np.asarray(training_actual).flatten()

    # Calculate naive seasonal forecast error on training set
    naive_errors = np.abs(training_actual[seasonality:] - training_actual[:-seasonality])
    scale = np.mean(naive_errors)

    if scale < 1e-10:
        warnings.warn("Training data has near-zero variance; MASE may be unreliable")
        return np.inf

    # Calculate forecast errors
    forecast_errors = np.abs(actual - predicted)

    return np.mean(forecast_errors) / scale


# ============================================================================
# PROBABILISTIC FORECAST METRICS
# ============================================================================

def crps(
    actual: np.ndarray,
    samples: np.ndarray,
) -> float:
    """
    Continuous Ranked Probability Score (CRPS).

    A proper scoring rule for probabilistic forecasts. Generalizes MAE
    to full predictive distributions.

    Parameters
    ----------
    actual : np.ndarray
        Actual values (n_observations,)
    samples : np.ndarray
        Posterior predictive samples (n_samples, n_observations)

    Returns
    -------
    float
        Mean CRPS across observations (lower is better)

    Notes
    -----
    CRPS measures both calibration (reliability) and sharpness (precision).
    It's the integral of the squared difference between the forecast CDF
    and the step function at the actual value.

    For a perfect forecast, CRPS = 0.

    Examples
    --------
    >>> actual = np.array([1.0, 2.0, 3.0])
    >>> samples = np.random.normal([1, 2, 3], 0.5, size=(1000, 3))
    >>> crps(actual, samples)
    0.28...  # approximately
    """
    actual = np.asarray(actual).flatten()
    samples = np.asarray(samples)

    if samples.ndim == 1:
        samples = samples.reshape(-1, 1)

    # Ensure samples shape is (n_samples, n_observations)
    if samples.shape[1] != len(actual):
        samples = samples.T

    n_samples, n_obs = samples.shape

    crps_values = np.zeros(n_obs)

    for i in range(n_obs):
        obs_samples = samples[:, i]
        y = actual[i]

        # CRPS formula: E|X-y| - 0.5 * E|X-X'|
        # where X, X' are independent draws from forecast distribution
        term1 = np.mean(np.abs(obs_samples - y))

        # Efficient pairwise difference calculation
        sorted_samples = np.sort(obs_samples)
        # E|X-X'| = 2 * integral of F(x)(1-F(x))dx
        # For samples: 2/n^2 * sum_{i<j} |x_i - x_j|
        # Efficient formula using sorted samples
        term2 = np.mean(np.abs(obs_samples[:, None] - obs_samples[None, :])) / 2

        crps_values[i] = term1 - term2

    return np.mean(crps_values)


def crps_gaussian(
    actual: np.ndarray,
    mean: np.ndarray,
    std: np.ndarray
) -> float:
    """
    CRPS for Gaussian predictive distribution (closed-form).

    Faster than sample-based CRPS when predictive distribution is Gaussian.

    Parameters
    ----------
    actual : np.ndarray
        Actual values
    mean : np.ndarray
        Predicted means
    std : np.ndarray
        Predicted standard deviations

    Returns
    -------
    float
        Mean CRPS

    Notes
    -----
    Uses the closed-form formula:
    CRPS = std * (z * (2*Phi(z) - 1) + 2*phi(z) - 1/sqrt(pi))

    where z = (actual - mean) / std, Phi is standard normal CDF,
    phi is standard normal PDF.
    """
    actual = np.asarray(actual).flatten()
    mean = np.asarray(mean).flatten()
    std = np.asarray(std).flatten()

    # Standardize
    z = (actual - mean) / std

    # Standard normal PDF and CDF
    phi = stats.norm.pdf(z)
    Phi = stats.norm.cdf(z)

    # Closed-form CRPS for Gaussian
    crps_values = std * (z * (2 * Phi - 1) + 2 * phi - 1 / np.sqrt(np.pi))

    return np.mean(crps_values)


def log_likelihood(
    actual: np.ndarray,
    mean: np.ndarray,
    std: np.ndarray
) -> float:
    """
    Log-likelihood of observations under Gaussian predictive distribution.

    Parameters
    ----------
    actual : np.ndarray
        Actual values
    mean : np.ndarray
        Predicted means
    std : np.ndarray
        Predicted standard deviations

    Returns
    -------
    float
        Mean log-likelihood (higher is better)
    """
    actual = np.asarray(actual).flatten()
    mean = np.asarray(mean).flatten()
    std = np.asarray(std).flatten()

    ll = stats.norm.logpdf(actual, loc=mean, scale=std)
    return np.mean(ll)


def interval_coverage(
    actual: np.ndarray,
    lower: np.ndarray,
    upper: np.ndarray
) -> float:
    """
    Calculate coverage of prediction interval.

    Parameters
    ----------
    actual : np.ndarray
        Actual values
    lower : np.ndarray
        Lower bound of interval
    upper : np.ndarray
        Upper bound of interval

    Returns
    -------
    float
        Coverage (fraction of actuals within interval)

    Notes
    -----
    For a well-calibrated 90% interval, coverage should be ~0.90.
    """
    actual = np.asarray(actual).flatten()
    lower = np.asarray(lower).flatten()
    upper = np.asarray(upper).flatten()

    within = (actual >= lower) & (actual <= upper)
    return np.mean(within)


def interval_width(lower: np.ndarray, upper: np.ndarray) -> float:
    """
    Calculate mean width of prediction interval.

    Parameters
    ----------
    lower : np.ndarray
        Lower bound of interval
    upper : np.ndarray
        Upper bound of interval

    Returns
    -------
    float
        Mean interval width
    """
    lower = np.asarray(lower).flatten()
    upper = np.asarray(upper).flatten()
    return np.mean(upper - lower)


def calibration_score(
    actual: np.ndarray,
    samples: np.ndarray,
    n_bins: int = 10
) -> Tuple[float, np.ndarray, np.ndarray]:
    """
    Calculate calibration of probabilistic forecasts.

    A well-calibrated forecast should have PIT (Probability Integral
    Transform) values uniformly distributed.

    Parameters
    ----------
    actual : np.ndarray
        Actual values
    samples : np.ndarray
        Posterior predictive samples (n_samples, n_observations)
    n_bins : int
        Number of bins for histogram

    Returns
    -------
    tuple
        (calibration_error, expected_freq, observed_freq)
        calibration_error: Mean squared deviation from uniform
        expected_freq: Expected frequency per bin (1/n_bins)
        observed_freq: Observed frequency per bin

    Notes
    -----
    PIT values are calculated as the empirical CDF of each observation
    under its predictive distribution. For well-calibrated forecasts,
    PIT values should be uniform on [0, 1].
    """
    actual = np.asarray(actual).flatten()
    samples = np.asarray(samples)

    if samples.ndim == 1:
        samples = samples.reshape(-1, 1)

    if samples.shape[1] != len(actual):
        samples = samples.T

    n_samples, n_obs = samples.shape

    # Calculate PIT values
    pit_values = np.zeros(n_obs)
    for i in range(n_obs):
        pit_values[i] = np.mean(samples[:, i] <= actual[i])

    # Histogram
    observed_freq, bin_edges = np.histogram(pit_values, bins=n_bins, range=(0, 1))
    observed_freq = observed_freq / n_obs
    expected_freq = 1 / n_bins

    # Calibration error (mean squared deviation from uniform)
    calibration_error = np.mean((observed_freq - expected_freq) ** 2)

    return calibration_error, expected_freq, observed_freq


def winkler_score(
    actual: np.ndarray,
    lower: np.ndarray,
    upper: np.ndarray,
    alpha: float = 0.05
) -> float:
    """
    Winkler score for interval forecasts.

    Penalizes both interval width and observations outside the interval.

    Parameters
    ----------
    actual : np.ndarray
        Actual values
    lower : np.ndarray
        Lower bound of (1-alpha) interval
    upper : np.ndarray
        Upper bound of (1-alpha) interval
    alpha : float
        Significance level (e.g., 0.05 for 95% interval)

    Returns
    -------
    float
        Mean Winkler score (lower is better)
    """
    actual = np.asarray(actual).flatten()
    lower = np.asarray(lower).flatten()
    upper = np.asarray(upper).flatten()

    width = upper - lower
    scores = np.zeros_like(actual)

    for i in range(len(actual)):
        if actual[i] < lower[i]:
            scores[i] = width[i] + (2 / alpha) * (lower[i] - actual[i])
        elif actual[i] > upper[i]:
            scores[i] = width[i] + (2 / alpha) * (actual[i] - upper[i])
        else:
            scores[i] = width[i]

    return np.mean(scores)


# ============================================================================
# TRADING PERFORMANCE METRICS
# ============================================================================

def sharpe_ratio(
    returns: np.ndarray,
    risk_free_rate: float = 0.0,
    periods_per_year: int = 252
) -> float:
    """
    Calculate annualized Sharpe ratio.

    Parameters
    ----------
    returns : np.ndarray
        Period returns (daily, weekly, etc.)
    risk_free_rate : float
        Annualized risk-free rate
    periods_per_year : int
        Number of periods per year (252 for daily, 52 for weekly)

    Returns
    -------
    float
        Annualized Sharpe ratio

    Notes
    -----
    Sharpe = (mean return - risk-free rate) / std(return) * sqrt(periods)
    """
    returns = np.asarray(returns).flatten()
    returns = returns[~np.isnan(returns)]

    if len(returns) < 2:
        return np.nan

    excess_returns = returns - risk_free_rate / periods_per_year
    if np.std(returns) < 1e-10:
        return 0.0

    return np.mean(excess_returns) / np.std(returns) * np.sqrt(periods_per_year)


def sortino_ratio(
    returns: np.ndarray,
    risk_free_rate: float = 0.0,
    periods_per_year: int = 252
) -> float:
    """
    Calculate annualized Sortino ratio.

    Similar to Sharpe but only penalizes downside volatility.

    Parameters
    ----------
    returns : np.ndarray
        Period returns
    risk_free_rate : float
        Annualized risk-free rate
    periods_per_year : int
        Number of periods per year

    Returns
    -------
    float
        Annualized Sortino ratio
    """
    returns = np.asarray(returns).flatten()
    returns = returns[~np.isnan(returns)]

    if len(returns) < 2:
        return np.nan

    excess_returns = returns - risk_free_rate / periods_per_year
    downside_returns = returns[returns < 0]

    if len(downside_returns) < 2:
        return np.inf if np.mean(excess_returns) > 0 else 0.0

    downside_std = np.std(downside_returns)
    if downside_std < 1e-10:
        return np.inf if np.mean(excess_returns) > 0 else 0.0

    return np.mean(excess_returns) / downside_std * np.sqrt(periods_per_year)


def max_drawdown(equity_curve: np.ndarray) -> Tuple[float, int, int]:
    """
    Calculate maximum drawdown.

    Parameters
    ----------
    equity_curve : np.ndarray
        Cumulative equity or portfolio value

    Returns
    -------
    tuple
        (max_drawdown, peak_idx, trough_idx)
        max_drawdown: Maximum drawdown as fraction (e.g., 0.25 = 25%)
        peak_idx: Index of peak before max drawdown
        trough_idx: Index of trough of max drawdown
    """
    equity_curve = np.asarray(equity_curve).flatten()

    if len(equity_curve) < 2:
        return 0.0, 0, 0

    # Running maximum
    running_max = np.maximum.accumulate(equity_curve)

    # Drawdown series
    drawdowns = (equity_curve - running_max) / running_max

    # Find maximum drawdown
    trough_idx = np.argmin(drawdowns)
    peak_idx = np.argmax(equity_curve[:trough_idx + 1])

    max_dd = -drawdowns[trough_idx]

    return max_dd, peak_idx, trough_idx


def calmar_ratio(
    returns: np.ndarray,
    periods_per_year: int = 252
) -> float:
    """
    Calculate Calmar ratio (return / max drawdown).

    Parameters
    ----------
    returns : np.ndarray
        Period returns
    periods_per_year : int
        Number of periods per year

    Returns
    -------
    float
        Calmar ratio
    """
    returns = np.asarray(returns).flatten()

    # Calculate cumulative returns
    cum_returns = (1 + returns).cumprod()

    # Annualized return
    total_return = cum_returns[-1] - 1
    n_years = len(returns) / periods_per_year
    annual_return = (1 + total_return) ** (1 / n_years) - 1

    # Max drawdown
    max_dd, _, _ = max_drawdown(cum_returns)

    if max_dd < 1e-10:
        return np.inf if annual_return > 0 else 0.0

    return annual_return / max_dd


def profit_factor(returns: np.ndarray) -> float:
    """
    Calculate profit factor (gross profit / gross loss).

    Parameters
    ----------
    returns : np.ndarray
        Period returns

    Returns
    -------
    float
        Profit factor (> 1 is profitable)
    """
    returns = np.asarray(returns).flatten()

    gross_profit = np.sum(returns[returns > 0])
    gross_loss = -np.sum(returns[returns < 0])

    if gross_loss < 1e-10:
        return np.inf if gross_profit > 0 else 0.0

    return gross_profit / gross_loss


def win_rate(returns: np.ndarray) -> float:
    """
    Calculate win rate (fraction of positive returns).

    Parameters
    ----------
    returns : np.ndarray
        Period returns

    Returns
    -------
    float
        Win rate (0 to 1)
    """
    returns = np.asarray(returns).flatten()
    return np.mean(returns > 0)


def risk_adjusted_return(
    returns: np.ndarray,
    confidence: float = 0.95,
    periods_per_year: int = 252
) -> Dict[str, float]:
    """
    Calculate comprehensive risk-adjusted return metrics.

    Parameters
    ----------
    returns : np.ndarray
        Period returns
    confidence : float
        Confidence level for VaR/CVaR
    periods_per_year : int
        Number of periods per year

    Returns
    -------
    dict
        Dictionary with VaR, CVaR, and risk-adjusted returns
    """
    returns = np.asarray(returns).flatten()

    # Value at Risk
    var = np.percentile(returns, (1 - confidence) * 100)

    # Conditional VaR (Expected Shortfall)
    cvar = np.mean(returns[returns <= var])

    # Annualized metrics
    annual_return = np.mean(returns) * periods_per_year
    annual_vol = np.std(returns) * np.sqrt(periods_per_year)

    return {
        'var': var,
        'cvar': cvar,
        'annual_return': annual_return,
        'annual_volatility': annual_vol,
        'return_over_var': annual_return / (-var) if var < 0 else np.inf,
        'return_over_cvar': annual_return / (-cvar) if cvar < 0 else np.inf,
    }


# ============================================================================
# SUMMARY FUNCTIONS
# ============================================================================

def forecast_summary(
    actual: np.ndarray,
    predicted: np.ndarray,
    samples: Optional[np.ndarray] = None,
    lower: Optional[np.ndarray] = None,
    upper: Optional[np.ndarray] = None,
    training_actual: Optional[np.ndarray] = None
) -> pd.DataFrame:
    """
    Calculate comprehensive forecast evaluation summary.

    Parameters
    ----------
    actual : np.ndarray
        Actual values
    predicted : np.ndarray
        Point predictions
    samples : np.ndarray, optional
        Posterior predictive samples for probabilistic metrics
    lower : np.ndarray, optional
        Lower bound of prediction interval
    upper : np.ndarray, optional
        Upper bound of prediction interval
    training_actual : np.ndarray, optional
        Training actual values for MASE calculation

    Returns
    -------
    pd.DataFrame
        Summary of forecast metrics
    """
    metrics = {}

    # Point forecast metrics
    metrics['MAE'] = mae(actual, predicted)
    metrics['RMSE'] = rmse(actual, predicted)
    metrics['MAPE'] = mape(actual, predicted)
    metrics['SMAPE'] = smape(actual, predicted)

    if training_actual is not None:
        metrics['MASE'] = mase(actual, predicted, training_actual)

    # Probabilistic metrics
    if samples is not None:
        metrics['CRPS'] = crps(actual, samples)
        cal_err, _, _ = calibration_score(actual, samples)
        metrics['Calibration Error'] = cal_err

    if lower is not None and upper is not None:
        metrics['Coverage (%)'] = interval_coverage(actual, lower, upper) * 100
        metrics['Interval Width'] = interval_width(lower, upper)
        metrics['Winkler Score'] = winkler_score(actual, lower, upper)

    return pd.DataFrame({'Metric': list(metrics.keys()),
                        'Value': list(metrics.values())})


def backtest_summary(
    returns: np.ndarray,
    benchmark_returns: Optional[np.ndarray] = None,
    periods_per_year: int = 252
) -> pd.DataFrame:
    """
    Calculate comprehensive backtest performance summary.

    Parameters
    ----------
    returns : np.ndarray
        Strategy returns
    benchmark_returns : np.ndarray, optional
        Benchmark returns for comparison
    periods_per_year : int
        Number of periods per year

    Returns
    -------
    pd.DataFrame
        Summary of backtest metrics
    """
    returns = np.asarray(returns).flatten()

    metrics = {}

    # Return metrics
    cum_returns = (1 + returns).cumprod()
    total_return = cum_returns[-1] - 1
    n_years = len(returns) / periods_per_year

    metrics['Total Return (%)'] = total_return * 100
    metrics['Annual Return (%)'] = ((1 + total_return) ** (1 / n_years) - 1) * 100
    metrics['Annual Volatility (%)'] = np.std(returns) * np.sqrt(periods_per_year) * 100

    # Risk metrics
    max_dd, _, _ = max_drawdown(cum_returns)
    metrics['Max Drawdown (%)'] = max_dd * 100
    metrics['Sharpe Ratio'] = sharpe_ratio(returns, periods_per_year=periods_per_year)
    metrics['Sortino Ratio'] = sortino_ratio(returns, periods_per_year=periods_per_year)
    metrics['Calmar Ratio'] = calmar_ratio(returns, periods_per_year=periods_per_year)

    # Trade metrics
    metrics['Win Rate (%)'] = win_rate(returns) * 100
    metrics['Profit Factor'] = profit_factor(returns)

    # Risk-adjusted metrics
    risk_metrics = risk_adjusted_return(returns, periods_per_year=periods_per_year)
    metrics['Daily VaR (95%)'] = risk_metrics['var'] * 100
    metrics['Daily CVaR (95%)'] = risk_metrics['cvar'] * 100

    # Benchmark comparison
    if benchmark_returns is not None:
        benchmark_returns = np.asarray(benchmark_returns).flatten()
        metrics['Benchmark Return (%)'] = ((1 + benchmark_returns).prod() - 1) * 100
        metrics['Alpha (%)'] = (metrics['Annual Return (%)'] -
                               sharpe_ratio(benchmark_returns, periods_per_year=periods_per_year) *
                               metrics['Annual Volatility (%)'])

        # Information ratio
        excess = returns - benchmark_returns[:len(returns)]
        if np.std(excess) > 1e-10:
            metrics['Information Ratio'] = (np.mean(excess) / np.std(excess) *
                                           np.sqrt(periods_per_year))

    return pd.DataFrame({'Metric': list(metrics.keys()),
                        'Value': list(metrics.values())})


if __name__ == '__main__':
    # Demo
    np.random.seed(42)

    # Generate sample forecast data
    actual = np.array([100, 102, 101, 105, 103, 108, 107, 110])
    predicted = np.array([99, 103, 100, 104, 105, 107, 108, 109])
    samples = np.random.normal(predicted[:, None], 2, size=(len(predicted), 1000)).T

    print("Forecast Summary:")
    print(forecast_summary(actual, predicted, samples))

    print("\n\nBacktest Summary:")
    returns = np.random.normal(0.001, 0.02, 252)
    print(backtest_summary(returns))
