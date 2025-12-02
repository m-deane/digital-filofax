# Bayesian Regression and Time Series Forecasting for Commodities Trading

A comprehensive, interactive course teaching Bayesian methods for commodity market analysis and algorithmic trading.

## Course Overview

This course takes you from Bayesian fundamentals to building complete trading systems for commodity markets. Each module combines theory, practical code examples, and real-world trading applications.

**Duration**: ~40 hours of content
**Prerequisites**: Basic Python, pandas, undergraduate statistics
**Technical Stack**: PyMC 5+, ArviZ, pandas, NumPy, matplotlib

## Quick Start

```bash
# Create and activate virtual environment
python -m venv bayesian-course-env
source bayesian-course-env/bin/activate  # Linux/Mac
# bayesian-course-env\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Launch Jupyter
jupyter notebook

# Start with Module 1
# modules/01_bayesian_foundations/notebook.ipynb
```

## Course Structure

### Module 1: Foundations of Bayesian Thinking
- Bayesian vs Frequentist paradigms
- Bayes' theorem with trading examples
- Prior, likelihood, posterior interpretation
- Monte Carlo simulation for risk analysis

### Module 2: Prior Selection and Market Knowledge
- Conjugate priors (Beta-Binomial, Normal-Normal)
- Prior elicitation from historical data
- Weakly informative vs informative priors
- Prior predictive checks

### Module 3: MCMC and Computational Inference
- Metropolis-Hastings from scratch
- PyMC and NUTS sampler
- Convergence diagnostics (R-hat, ESS)
- Posterior predictive checks

### Module 4: Time Series Fundamentals
- Stationarity testing (ADF, KPSS)
- Time series decomposition
- ACF/PACF analysis
- Commodity-specific patterns

### Module 5: Bayesian Linear Regression
- Simple and multiple regression with PyMC
- Credible intervals vs confidence intervals
- Model comparison (WAIC, LOO)
- Robust regression with Student-t

### Module 6: Bayesian Structural Time Series (BSTS)
- State-space models
- Trend, seasonality, regression components
- Dynamic regression coefficients
- Gold price modeling example

### Module 7: Hierarchical Models
- Partial pooling and shrinkage
- Multi-commodity modeling
- Cross-commodity correlations
- Energy complex example

### Module 8: Gaussian Processes
- Kernel functions (RBF, Matérn, Periodic)
- GP regression with PyMC
- Kernel composition
- Non-linear pattern forecasting

### Module 9: Volatility Modeling
- GARCH in Bayesian framework
- Stochastic volatility models
- Epistemic vs aleatoric uncertainty
- VaR and CVaR from posteriors

### Module 10: Backtesting and Trading Strategies
- Walk-forward validation
- CRPS and calibration assessment
- Bayesian Kelly criterion
- Complete trading system development

### Capstone Project
Build a complete Bayesian forecasting and trading system for a commodity portfolio.

## Directory Structure

```
bayesian-commodities-course/
├── requirements.txt          # Python dependencies
├── README.md                 # This file
├── datasets/
│   ├── download_data.py      # Data download utilities
│   ├── __init__.py
│   └── cached_data/          # Local data cache
├── modules/
│   ├── 01_bayesian_foundations/
│   │   ├── notebook.ipynb    # Main lesson
│   │   ├── exercises.ipynb   # Practice problems
│   │   └── solutions.ipynb   # Solutions (hidden)
│   ├── 02_prior_selection/
│   ├── 03_mcmc_inference/
│   ├── 04_time_series_fundamentals/
│   ├── 05_bayesian_linear_regression/
│   ├── 06_bsts/
│   ├── 07_hierarchical_models/
│   ├── 08_gaussian_processes/
│   ├── 09_volatility_modeling/
│   └── 10_trading_strategies/
├── projects/
│   ├── capstone_project.ipynb
│   └── mid_course_project.ipynb
├── utils/
│   ├── __init__.py
│   ├── plotting.py           # Visualization utilities
│   ├── metrics.py            # Evaluation metrics (CRPS, Sharpe, etc.)
│   └── backtesting.py        # Walk-forward validation framework
└── tests/
    └── test_utils.py
```

## Commodity Data Sources

The course uses real commodity data from:

- **Yahoo Finance** (yfinance): Futures prices (CL=F, GC=F, NG=F, etc.)
- **FRED**: Economic indicators (USD index, inflation, interest rates)
- **Local cache**: Automatic caching for faster access

Available commodities include:
- Energy: Crude Oil (WTI, Brent), Natural Gas, Gasoline, Heating Oil
- Metals: Gold, Silver, Copper, Platinum
- Agriculture: Corn, Wheat, Soybeans, Coffee, Sugar, Cotton
- Livestock: Live Cattle, Lean Hogs

## Key Learning Outcomes

By completing this course, you will be able to:

1. **Apply Bayesian inference** to quantify uncertainty in market forecasts
2. **Select appropriate priors** that encode domain knowledge
3. **Build and diagnose** PyMC models for time series
4. **Implement trading strategies** that account for forecast uncertainty
5. **Properly backtest** without look-ahead bias
6. **Use proper scoring rules** (CRPS) for probabilistic forecasts
7. **Manage risk** using Bayesian uncertainty estimates

## Prerequisites

### Required Knowledge
- Python programming (intermediate)
- pandas for data manipulation
- Basic probability and statistics
- Linear regression concepts

### Recommended Background
- Time series analysis basics
- Some exposure to trading/finance
- Familiarity with maximum likelihood estimation

## Installation

### Full Installation

```bash
pip install -r requirements.txt
```

### Minimal Installation (for specific modules)

```bash
# Core (all modules)
pip install numpy pandas matplotlib scipy

# Bayesian modeling (Modules 3+)
pip install pymc arviz

# Time series (Module 4+)
pip install statsmodels

# Data download
pip install yfinance pandas-datareader
```

## Running the Course

### Recommended Order

1. Complete modules sequentially (concepts build on each other)
2. Run all code cells in each notebook
3. Complete exercises before checking solutions
4. Finish the capstone project at the end

### Tips for Success

- **Don't skip the theory**: Understanding WHY matters for debugging
- **Run prior predictive checks**: Before fitting models
- **Check convergence**: Always inspect R-hat and trace plots
- **Use the utilities**: The `utils/` modules save time
- **Practice on your own data**: Extend examples to other commodities

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

Areas for contribution:
- Additional model types
- More commodity examples
- Bug fixes and improvements
- Translations

## License

This course is provided for educational purposes.

## Acknowledgments

This course draws inspiration from:
- [Bayesian Modeling and Computation in Python](https://bayesiancomputationbook.com/)
- [Statistical Rethinking](https://xcelab.net/rm/statistical-rethinking/)
- R's tidymodels ecosystem
- PyMC documentation and tutorials

## Support

For questions and issues:
- Open a GitHub issue
- Check existing solutions in the course materials
- Review PyMC documentation for package-specific questions

---

**Happy learning! May your posteriors be well-calibrated and your forecasts profitable.**
