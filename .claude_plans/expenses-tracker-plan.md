# Joint Expenses Tracker - Implementation Plan

## Overview
A joint expenses tracker for splitting costs between partners. Supports configurable split ratios (default 65/35), multiple payment accounts, and monthly settlement calculations.

## Core Features

### 1. Expense Entry
- Amount, description, date
- Payment account selection (My Account / Partner's Account / Joint Account)
- Optional category for grouping
- Optional notes

### 2. Split Configuration
- Default split ratio (e.g., 65% self / 35% partner)
- Per-category overrides possible in future versions

### 3. Monthly Summary View
- Total expenses by account
- Calculated amounts each person should have paid
- Net settlement amount (who owes whom)
- Category breakdown

### 4. Settlement Tracking
- Mark months as settled
- Track settlement history

## Database Schema

### Models Added
- `Expense` - Individual expense entries
- `ExpenseCategory` - Categories for expenses (Groceries, Utilities, etc.)
- `ExpenseSplitConfig` - User's split configuration
- `ExpenseSettlement` - Monthly settlement records

### Enums Added
- `PaymentAccount` - SELF, PARTNER, JOINT

## API Endpoints (tRPC)

### expenses router
- `getAll` - List expenses with filters (month, category, account)
- `getById` - Single expense
- `create` - Add new expense
- `update` - Edit expense
- `delete` - Remove expense
- `getMonthlySummary` - Calculate monthly totals and settlement
- `getCategories` - List expense categories
- `createCategory` - Add category
- `getSplitConfig` - Get user's split configuration
- `updateSplitConfig` - Update split ratios
- `getSettlements` - List settlement history
- `markSettled` - Mark month as settled

## UI Pages

### /dashboard/expenses
Main expenses page with:
- Quick-add expense form
- Current month summary card
- Recent expenses list
- Month selector
- Settlement status

### Components
- ExpenseForm - Add/edit expense dialog
- MonthlySummary - Shows totals and who owes whom
- ExpenseList - Table of expenses with filters
- SettlementCard - Mark settled / view settlement

## Settlement Calculation Logic

```
For a given month:
1. Calculate total joint expenses (all accounts)
2. My share = Total × (my split percentage)
3. Partner's share = Total × (partner's split percentage)
4. Calculate what each person actually paid:
   - I paid = expenses from MY_ACCOUNT
   - Partner paid = expenses from PARTNER_ACCOUNT
   - Joint account doesn't affect individual balances (assumed equally funded)
5. Net settlement = (What I should pay) - (What I actually paid from my account)
   - If positive: I owe partner
   - If negative: Partner owes me
```

## Implementation Order
1. Schema + migrations
2. tRPC router with core CRUD
3. Basic expenses page with add form
4. Monthly summary calculations
5. Settlement tracking
6. Navigation integration
