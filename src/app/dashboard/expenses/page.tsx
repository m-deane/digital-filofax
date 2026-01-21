"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  ArrowRight,
  Settings,
  Receipt,
  Wallet,
  Users,
  PiggyBank,
  TrendingUp,
  Download,
  RefreshCw,
  BarChart3,
  Target,
  History,
  Pause,
  Play,
  SkipForward,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc";
import { format, startOfMonth, addMonths, subMonths } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type PaymentAccount = "SELF" | "PARTNER" | "JOINT";
type RecurrenceFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";

// Validation constants (matching server-side)
const MAX_EXPENSE_AMOUNT = 9999999.99;
const MIN_EXPENSE_AMOUNT = 0.01;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_NOTES_LENGTH = 2000;
const MAX_FUTURE_DAYS = 365;

const ACCOUNT_LABELS: Record<PaymentAccount, string> = {
  SELF: "My Account",
  PARTNER: "Partner's Account",
  JOINT: "Joint Account",
};

const ACCOUNT_ICONS: Record<PaymentAccount, typeof Wallet> = {
  SELF: Wallet,
  PARTNER: Users,
  JOINT: PiggyBank,
};

const ACCOUNT_COLORS: Record<PaymentAccount, string> = {
  SELF: "bg-blue-500",
  PARTNER: "bg-purple-500",
  JOINT: "bg-green-500",
};

const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Every 2 weeks",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
};

type Currency = "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY" | "CHF" | "CNY" | "INR" | "MXN" | "BRL" | "KRW";

const CURRENCY_LABELS: Record<Currency, { name: string; symbol: string }> = {
  USD: { name: "US Dollar", symbol: "$" },
  EUR: { name: "Euro", symbol: "€" },
  GBP: { name: "British Pound", symbol: "£" },
  CAD: { name: "Canadian Dollar", symbol: "$" },
  AUD: { name: "Australian Dollar", symbol: "$" },
  JPY: { name: "Japanese Yen", symbol: "¥" },
  CHF: { name: "Swiss Franc", symbol: "CHF" },
  CNY: { name: "Chinese Yuan", symbol: "¥" },
  INR: { name: "Indian Rupee", symbol: "₹" },
  MXN: { name: "Mexican Peso", symbol: "$" },
  BRL: { name: "Brazilian Real", symbol: "R$" },
  KRW: { name: "Korean Won", symbol: "₩" },
};

const formatCurrency = (amount: number, currency: Currency = "USD") => {
  const { symbol } = CURRENCY_LABELS[currency];
  return `${symbol}${amount.toFixed(2)}`;
};

interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
}

interface Expense {
  id: string;
  amount: number;
  description: string;
  date: Date;
  paidFrom: PaymentAccount;
  notes: string | null;
  currency: Currency;
  category: ExpenseCategory | null;
  isRecurring?: boolean;
  frequency?: RecurrenceFrequency | null;
}

// ============================================================================
// SETTLEMENT CONFIRMATION DIALOG
// ============================================================================

function SettlementConfirmDialog({
  month,
  isOpen,
  onOpenChange,
  onConfirm,
}: {
  month: Date;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const { data: breakdown, isLoading } = api.expenses.getSettlementBreakdown.useQuery(
    { month },
    { enabled: isOpen }
  );

  if (!breakdown) return null;

  const { calculation, breakdown: totals, splitConfig } = breakdown;
  const direction = calculation.direction;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Settlement</DialogTitle>
          <DialogDescription>
            Review the settlement breakdown for {format(month, "MMMM yyyy")}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Expense Summary */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Expense Summary</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="p-2 rounded bg-blue-50 dark:bg-blue-950 text-center">
                  <div className="text-xs text-muted-foreground">My Account</div>
                  <div className="font-medium text-blue-600">${totals.selfPaid.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">{totals.selfCount} items</div>
                </div>
                <div className="p-2 rounded bg-purple-50 dark:bg-purple-950 text-center">
                  <div className="text-xs text-muted-foreground">Partner</div>
                  <div className="font-medium text-purple-600">${totals.partnerPaid.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">{totals.partnerCount} items</div>
                </div>
                <div className="p-2 rounded bg-green-50 dark:bg-green-950 text-center">
                  <div className="text-xs text-muted-foreground">Joint</div>
                  <div className="font-medium text-green-600">${totals.jointPaid.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">{totals.jointCount} items</div>
                </div>
              </div>
            </div>

            {/* Calculation Breakdown */}
            <div className="space-y-2 p-3 rounded border bg-muted/50">
              <h4 className="font-medium text-sm">Calculation</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total to split:</span>
                  <span>${calculation.splitTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Split ratio:</span>
                  <span>{splitConfig.selfPercent}% / {splitConfig.partnerPercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">I should pay:</span>
                  <span>${calculation.selfShouldPay.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">I actually paid:</span>
                  <span>${totals.selfPaid.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Settlement Amount */}
            <div className={cn(
              "p-4 rounded-lg border-2 text-center",
              direction === "self_owes_partner" && "border-orange-300 bg-orange-50 dark:bg-orange-950",
              direction === "partner_owes_self" && "border-green-300 bg-green-50 dark:bg-green-950",
              direction === "settled" && "border-gray-300 bg-gray-50 dark:bg-gray-950"
            )}>
              {direction === "settled" ? (
                <div className="font-medium">All settled up!</div>
              ) : direction === "self_owes_partner" ? (
                <>
                  <div className="text-sm text-muted-foreground">You owe partner</div>
                  <div className="text-2xl font-bold text-orange-600">${Math.abs(calculation.settlementAmount).toFixed(2)}</div>
                </>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground">Partner owes you</div>
                  <div className="text-2xl font-bold text-green-600">${Math.abs(calculation.settlementAmount).toFixed(2)}</div>
                </>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onConfirm(); onOpenChange(false); }}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirm Settlement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// MONTHLY SUMMARY CARD
// ============================================================================

function MonthlySummaryCard({ month }: { month: Date }) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { data: summary, isLoading } = api.expenses.getMonthlySummary.useQuery({ month });

  const utils = api.useUtils();
  const markSettled = api.expenses.markSettled.useMutation({
    onSuccess: () => {
      utils.expenses.getMonthlySummary.invalidate({ month });
      utils.expenses.getSettlements.invalidate();
      utils.expenses.getUnsettledMonths.invalidate();
    },
  });
  const unmarkSettled = api.expenses.unmarkSettled.useMutation({
    onSuccess: () => {
      utils.expenses.getMonthlySummary.invalidate({ month });
      utils.expenses.getSettlements.invalidate();
      utils.expenses.getUnsettledMonths.invalidate();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  const { totals, calculation, splitConfig, settlement } = summary;
  const settlementAmount = calculation.settlementAmount;
  const isSettled = settlement?.settled ?? false;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Monthly Summary</CardTitle>
            <CardDescription>{format(month, "MMMM yyyy")}</CardDescription>
          </div>
          {isSettled && (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Settled
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Breakdown */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
            <div className="text-xs text-muted-foreground mb-1">My Account</div>
            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              ${totals.self.toFixed(2)}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950">
            <div className="text-xs text-muted-foreground mb-1">Partner</div>
            <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
              ${totals.partner.toFixed(2)}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950">
            <div className="text-xs text-muted-foreground mb-1">Joint</div>
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              ${totals.joint.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Split Calculation */}
        <div className="p-4 rounded-lg border bg-muted/50">
          <div className="text-sm text-muted-foreground mb-2">
            Split: {splitConfig.selfPercent}% / {splitConfig.partnerPercent}%
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Total to split:</span>
            <span className="font-medium">${calculation.splitTotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>I should pay:</span>
            <span className="font-medium">${calculation.selfShouldPay.toFixed(2)}</span>
          </div>
        </div>

        {/* Settlement */}
        <div
          className={cn(
            "p-4 rounded-lg border-2",
            settlementAmount > 0.01
              ? "border-orange-300 bg-orange-50 dark:bg-orange-950"
              : settlementAmount < -0.01
                ? "border-green-300 bg-green-50 dark:bg-green-950"
                : "border-gray-300 bg-gray-50 dark:bg-gray-950"
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              {Math.abs(settlementAmount) < 0.01 ? (
                <div className="font-medium">All settled up!</div>
              ) : settlementAmount > 0 ? (
                <>
                  <div className="text-sm text-muted-foreground">You owe partner</div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    ${Math.abs(settlementAmount).toFixed(2)}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground">Partner owes you</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ${Math.abs(settlementAmount).toFixed(2)}
                  </div>
                </>
              )}
            </div>
            {!isSettled && Math.abs(settlementAmount) >= 0.01 ? (
              <Button size="sm" onClick={() => setShowConfirmDialog(true)} disabled={markSettled.isPending}>
                {markSettled.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Mark Settled
                  </>
                )}
              </Button>
            ) : isSettled ? (
              <Button size="sm" variant="outline" onClick={() => unmarkSettled.mutate({ month })} disabled={unmarkSettled.isPending}>
                Undo
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>

      <SettlementConfirmDialog
        month={month}
        isOpen={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={() => markSettled.mutate({ month })}
      />
    </Card>
  );
}

// ============================================================================
// SPENDING INSIGHTS CARD
// ============================================================================

function SpendingInsightsCard() {
  const { data: insights, isLoading } = api.expenses.getSpendingInsights.useQuery({ months: 6 });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!insights) return null;

  const { comparison, topCategories, insights: stats } = insights;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Spending Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Month over Month Comparison */}
        <div className={cn(
          "p-4 rounded-lg border",
          comparison.trending === "up" && "border-orange-300 bg-orange-50 dark:bg-orange-950",
          comparison.trending === "down" && "border-green-300 bg-green-50 dark:bg-green-950",
          comparison.trending === "stable" && "border-gray-300 bg-gray-50 dark:bg-gray-950"
        )}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">This Month vs Last</div>
              <div className="text-2xl font-bold">${comparison.currentMonth.total.toFixed(0)}</div>
            </div>
            <div className="text-right">
              <div className={cn(
                "text-lg font-medium",
                comparison.trending === "up" && "text-orange-600",
                comparison.trending === "down" && "text-green-600"
              )}>
                {comparison.change > 0 ? "+" : ""}{comparison.change.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                vs ${comparison.previousMonth.total.toFixed(0)}
              </div>
            </div>
          </div>
        </div>

        {/* Top Categories */}
        {topCategories.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Top Categories This Month</h4>
            <div className="space-y-2">
              {topCategories.map((cat, index) => (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{index + 1}.</span>
                    <span>{cat.name}</span>
                    <span className="text-xs text-muted-foreground">({cat.count})</span>
                  </div>
                  <span className="font-medium">${cat.amount.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="border-t pt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Avg. Expense</div>
            <div className="font-medium">${stats.avgExpenseAmount.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Categories Used</div>
            <div className="font-medium">{stats.uniqueCategories}</div>
          </div>
        </div>

        {/* Largest Expense */}
        {stats.largestExpense && (
          <div className="border-t pt-4">
            <div className="text-sm text-muted-foreground mb-1">Largest Expense This Month</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{stats.largestExpense.description}</div>
                <div className="text-xs text-muted-foreground">
                  {stats.largestExpense.category} • {format(new Date(stats.largestExpense.date), "MMM d")}
                </div>
              </div>
              <div className="text-lg font-bold">${stats.largestExpense.amount.toFixed(2)}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// ANALYTICS CARD
// ============================================================================

function AnalyticsCard() {
  const { data: analytics, isLoading } = api.expenses.getAnalytics.useQuery({ months: 6 });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  const COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4"];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">${analytics.summary.totalSpent.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Total ({analytics.summary.months} months)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">${analytics.summary.avgMonthly.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Monthly Average</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{analytics.summary.expenseCount}</div>
            <p className="text-xs text-muted-foreground">Total Expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Spending Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, ""]} />
              <Bar dataKey="self" stackId="a" fill="#3b82f6" name="My Account" />
              <Bar dataKey="partner" stackId="a" fill="#8b5cf6" name="Partner" />
              <Bar dataKey="joint" stackId="a" fill="#22c55e" name="Joint" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      {analytics.categorySpending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              This Month by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.categorySpending}
                  dataKey="spent"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {analytics.categorySpending.map((entry, index) => (
                    <Cell key={entry.name} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Spent"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// SETTLEMENT HISTORY CARD
// ============================================================================

function SettlementHistoryCard() {
  const { data: settlements, isLoading } = api.expenses.getSettlements.useQuery({ limit: 12 });
  const { data: unsettledMonths } = api.expenses.getUnsettledMonths.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const hasUnsettled = unsettledMonths && unsettledMonths.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Settlement History
        </CardTitle>
        <CardDescription>Past settlement records</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Unsettled Months Warning */}
        {hasUnsettled && (
          <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
            <div className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">
              Unsettled Months
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400">
              {unsettledMonths.map(m => m.monthLabel).join(", ")}
            </div>
          </div>
        )}

        {/* Settlement Records */}
        {!settlements || settlements.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No settlements recorded yet.
          </p>
        ) : (
          <div className="space-y-2">
            {settlements.map((settlement) => (
              <div
                key={settlement.id}
                className="flex items-center justify-between p-3 rounded border"
              >
                <div>
                  <div className="font-medium text-sm">
                    {format(new Date(settlement.month), "MMMM yyyy")}
                  </div>
                  {settlement.settledAt && (
                    <div className="text-xs text-muted-foreground">
                      Settled on {format(new Date(settlement.settledAt), "MMM d, yyyy")}
                    </div>
                  )}
                  {settlement.notes && (
                    <div className="text-xs text-muted-foreground mt-1">{settlement.notes}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className={cn(
                    "font-medium",
                    settlement.amount > 0 ? "text-orange-600" : settlement.amount < 0 ? "text-green-600" : "text-gray-600"
                  )}>
                    {settlement.amount > 0 ? "Paid" : settlement.amount < 0 ? "Received" : "Even"}
                    {settlement.amount !== 0 && ` $${Math.abs(settlement.amount).toFixed(2)}`}
                  </div>
                  {settlement.settled && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Settled
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// RECURRING EXPENSES CARD
// ============================================================================

function RecurringExpensesCard({ onRefresh }: { onRefresh: () => void }) {
  const { data: recurring, isLoading } = api.expenses.getRecurringExpenses.useQuery();
  const { data: upcoming } = api.expenses.getUpcomingRecurring.useQuery({ days: 14 });

  const utils = api.useUtils();

  const generateExpense = api.expenses.generateFromRecurring.useMutation({
    onSuccess: () => {
      utils.expenses.getRecurringExpenses.invalidate();
      utils.expenses.getUpcomingRecurring.invalidate();
      utils.expenses.getAll.invalidate();
      utils.expenses.getMonthlySummary.invalidate();
      onRefresh();
    },
  });

  const togglePause = api.expenses.toggleRecurringPause.useMutation({
    onSuccess: () => {
      utils.expenses.getRecurringExpenses.invalidate();
      utils.expenses.getUpcomingRecurring.invalidate();
    },
  });

  const skipOccurrence = api.expenses.skipRecurringOccurrence.useMutation({
    onSuccess: () => {
      utils.expenses.getRecurringExpenses.invalidate();
      utils.expenses.getUpcomingRecurring.invalidate();
    },
  });

  const deleteExpense = api.expenses.delete.useMutation({
    onSuccess: () => {
      utils.expenses.getRecurringExpenses.invalidate();
      utils.expenses.getUpcomingRecurring.invalidate();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const dueSoonCount = upcoming?.filter(e => e.daysUntilDue !== null && e.daysUntilDue <= 3).length ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Recurring Expenses
          {dueSoonCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {dueSoonCount} due soon
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Manage recurring expense templates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upcoming Due */}
        {upcoming && upcoming.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Coming Up (Next 14 Days)
            </h4>
            <div className="space-y-2">
              {upcoming.map((expense) => (
                <div
                  key={expense.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded border",
                    expense.daysUntilDue !== null && expense.daysUntilDue <= 3 && "border-orange-300 bg-orange-50 dark:bg-orange-950"
                  )}
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{expense.description}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>${expense.amount.toFixed(2)}</span>
                      <span>•</span>
                      <span>{FREQUENCY_LABELS[expense.frequency as RecurrenceFrequency]}</span>
                      {expense.daysUntilDue !== null && (
                        <>
                          <span>•</span>
                          <span className={cn(expense.daysUntilDue <= 3 && "text-orange-600 font-medium")}>
                            {expense.daysUntilDue === 0 ? "Due today" :
                             expense.daysUntilDue === 1 ? "Due tomorrow" :
                             `Due in ${expense.daysUntilDue} days`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateExpense.mutate({ templateId: expense.id })}
                    disabled={generateExpense.isPending}
                  >
                    {generateExpense.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        Log
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Recurring Templates */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">All Templates</h4>
          {!recurring || recurring.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recurring expenses. Create one by enabling &quot;Recurring&quot; when adding an expense.
            </p>
          ) : (
            <div className="space-y-2">
              {recurring.map((expense) => {
                const isPaused = !expense.nextDueDate;
                return (
                  <div key={expense.id} className="flex items-center justify-between p-3 rounded border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{expense.description}</span>
                        {isPaused && (
                          <Badge variant="secondary" className="text-xs">
                            <Pause className="h-3 w-3 mr-1" />
                            Paused
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>${expense.amount.toFixed(2)}</span>
                        <span>•</span>
                        <span>{FREQUENCY_LABELS[expense.frequency as RecurrenceFrequency]}</span>
                        {expense.nextDueDate && (
                          <>
                            <span>•</span>
                            <span>Next: {format(new Date(expense.nextDueDate), "MMM d")}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => generateExpense.mutate({ templateId: expense.id })}
                          disabled={generateExpense.isPending}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Log Now
                        </DropdownMenuItem>
                        {!isPaused && (
                          <DropdownMenuItem
                            onClick={() => skipOccurrence.mutate({ id: expense.id })}
                            disabled={skipOccurrence.isPending}
                          >
                            <SkipForward className="h-4 w-4 mr-2" />
                            Skip Next
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => togglePause.mutate({ id: expense.id })}
                          disabled={togglePause.isPending}
                        >
                          {isPaused ? (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Resume
                            </>
                          ) : (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteExpense.mutate({ id: expense.id })}
                          disabled={deleteExpense.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Template
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// BUDGET TRACKER CARD
// ============================================================================

function BudgetTrackerCard({ month }: { month: Date }) {
  const { data: categories, isLoading } = api.expenses.getCategoriesWithBudgets.useQuery({ month });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [budgetValue, setBudgetValue] = useState("");

  const utils = api.useUtils();
  const updateBudget = api.expenses.updateCategoryBudget.useMutation({
    onSuccess: () => {
      utils.expenses.getCategoriesWithBudgets.invalidate({ month });
      utils.expenses.getAnalytics.invalidate();
      setEditingId(null);
      setBudgetValue("");
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const categoriesWithBudget = categories?.filter(c => c.budget !== null) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" />
          Budget Tracking
        </CardTitle>
        <CardDescription>Monitor spending against category budgets</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {categoriesWithBudget.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No budgets set. Edit a category to set a monthly budget.
          </p>
        ) : (
          categoriesWithBudget.map((cat) => {
            const percentage = cat.budget ? (cat.spent / cat.budget) * 100 : 0;
            const isOverBudget = percentage > 100;

            return (
              <div key={cat.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <div className={cn("text-sm", isOverBudget && "text-red-500 font-medium")}>
                    ${cat.spent.toFixed(0)} / ${cat.budget?.toFixed(0)}
                  </div>
                </div>
                <Progress
                  value={Math.min(percentage, 100)}
                  className={cn("h-2", isOverBudget && "[&>div]:bg-red-500")}
                />
              </div>
            );
          })
        )}

        {/* Edit Budgets */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-2">Set Category Budgets</p>
          <div className="space-y-2">
            {categories?.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="text-sm flex-1">{cat.name}</span>
                {editingId === cat.id ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={budgetValue}
                      onChange={(e) => setBudgetValue(e.target.value)}
                      className="w-20 h-7 text-sm"
                      placeholder="0"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => {
                        const budget = budgetValue ? parseFloat(budgetValue) : null;
                        updateBudget.mutate({ categoryId: cat.id, budget });
                      }}
                    >
                      <CheckCircle className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      setEditingId(cat.id);
                      setBudgetValue(cat.budget?.toString() ?? "");
                    }}
                  >
                    {cat.budget ? `$${cat.budget}` : "Set"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SPLIT CONFIG DIALOG
// ============================================================================

function SplitConfigDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [selfPercent, setSelfPercent] = useState(65);
  const [defaultCurrency, setDefaultCurrency] = useState<Currency>("USD");

  const utils = api.useUtils();
  const { data: config } = api.expenses.getSplitConfig.useQuery();
  const updateConfig = api.expenses.updateSplitConfig.useMutation({
    onSuccess: () => {
      utils.expenses.getSplitConfig.invalidate();
      utils.expenses.getMonthlySummary.invalidate();
      setIsOpen(false);
    },
  });

  const handleOpen = () => {
    setSelfPercent(config?.selfPercent ?? 65);
    setDefaultCurrency((config?.defaultCurrency as Currency) ?? "USD");
    setIsOpen(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleOpen}>
          <Settings className="h-4 w-4" />
          Split: {config?.selfPercent ?? 65}/{config?.partnerPercent ?? 35}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Expense Settings</DialogTitle>
          <DialogDescription>Configure split ratio and default currency.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Your Share: {selfPercent}%</Label>
            <Input
              type="range"
              min={0}
              max={100}
              value={selfPercent}
              onChange={(e) => setSelfPercent(parseInt(e.target.value))}
            />
          </div>
          <div className="flex items-center justify-center gap-4 text-lg font-medium">
            <span className="text-blue-600">{selfPercent}%</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-purple-600">{100 - selfPercent}%</span>
          </div>
          <div className="text-center text-sm text-muted-foreground">You / Partner</div>

          <div className="border-t pt-4 space-y-2">
            <Label>Default Currency</Label>
            <Select value={defaultCurrency} onValueChange={(v) => setDefaultCurrency(v as Currency)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CURRENCY_LABELS) as Currency[]).map((cur) => (
                  <SelectItem key={cur} value={cur}>
                    <span className="font-medium">{CURRENCY_LABELS[cur].symbol}</span>
                    <span className="ml-2">{CURRENCY_LABELS[cur].name} ({cur})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This will be the default currency for new expenses.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button
            onClick={() => updateConfig.mutate({ selfPercent, partnerPercent: 100 - selfPercent, defaultCurrency })}
            disabled={updateConfig.isPending}
          >
            {updateConfig.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// EXPENSE FORM
// ============================================================================

interface FormErrors {
  amount?: string;
  description?: string;
  date?: string;
  notes?: string;
  frequency?: string;
}

function ExpenseForm({
  isOpen,
  onOpenChange,
  editingExpense,
  onSuccess,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingExpense?: Expense | null;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paidFrom, setPaidFrom] = useState<PaymentAccount>("SELF");
  const [categoryId, setCategoryId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("MONTHLY");
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: categories } = api.expenses.getCategories.useQuery();
  const { data: config } = api.expenses.getSplitConfig.useQuery();

  const createExpense = api.expenses.create.useMutation({
    onSuccess: () => {
      resetForm();
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      setServerError(error.message || "Failed to create expense. Please try again.");
    },
  });

  const updateExpense = api.expenses.update.useMutation({
    onSuccess: () => {
      resetForm();
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      setServerError(error.message || "Failed to update expense. Please try again.");
    },
  });

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setPaidFrom("SELF");
    setCategoryId("");
    setNotes("");
    setCurrency((config?.defaultCurrency as Currency) ?? "USD");
    setIsRecurring(false);
    setFrequency("MONTHLY");
    setErrors({});
    setServerError(null);
  };

  const handleOpen = (open: boolean) => {
    if (open && editingExpense) {
      setAmount(editingExpense.amount.toString());
      setDescription(editingExpense.description);
      setDate(format(new Date(editingExpense.date), "yyyy-MM-dd"));
      setPaidFrom(editingExpense.paidFrom);
      setCategoryId(editingExpense.category?.id ?? "");
      setNotes(editingExpense.notes ?? "");
      setCurrency(editingExpense.currency ?? "USD");
      setIsRecurring(editingExpense.isRecurring ?? false);
      setFrequency(editingExpense.frequency ?? "MONTHLY");
    } else if (open && !editingExpense) {
      // Set default currency for new expense
      setCurrency((config?.defaultCurrency as Currency) ?? "USD");
    } else if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    setServerError(null);

    // Validate amount
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount)) {
      newErrors.amount = "Amount is required";
    } else if (parsedAmount < MIN_EXPENSE_AMOUNT) {
      newErrors.amount = `Amount must be at least $${MIN_EXPENSE_AMOUNT}`;
    } else if (parsedAmount > MAX_EXPENSE_AMOUNT) {
      newErrors.amount = `Amount cannot exceed $${MAX_EXPENSE_AMOUNT.toLocaleString()}`;
    }

    // Validate description
    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      newErrors.description = "Description is required";
    } else if (trimmedDesc.length > MAX_DESCRIPTION_LENGTH) {
      newErrors.description = `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`;
    }

    // Validate date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      newErrors.date = "Invalid date";
    } else {
      const maxFutureDate = addMonths(new Date(), Math.ceil(MAX_FUTURE_DAYS / 30));
      if (parsedDate > maxFutureDate) {
        newErrors.date = `Date cannot be more than ${MAX_FUTURE_DAYS} days in the future`;
      }
    }

    // Validate notes
    if (notes && notes.length > MAX_NOTES_LENGTH) {
      newErrors.notes = `Notes cannot exceed ${MAX_NOTES_LENGTH} characters`;
    }

    // Validate recurring expense
    if (isRecurring && !frequency) {
      newErrors.frequency = "Frequency is required for recurring expenses";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const parsedAmount = parseFloat(amount);
    const data = {
      amount: parsedAmount,
      description: description.trim(),
      date: new Date(date),
      paidFrom,
      categoryId: categoryId || undefined,
      notes: notes.trim() || undefined,
      currency,
      isRecurring,
      frequency: isRecurring ? frequency : undefined,
    };

    if (editingExpense) {
      updateExpense.mutate({ id: editingExpense.id, ...data });
    } else {
      createExpense.mutate(data);
    }
  };

  const isPending = createExpense.isPending || updateExpense.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingExpense ? "Edit Expense" : "Add Expense"}</DialogTitle>
          <DialogDescription>
            {editingExpense ? "Update the expense details." : "Record a new joint expense."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Server Error Display */}
          {serverError && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="flex gap-2">
                <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                  <SelectTrigger className="w-[90px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CURRENCY_LABELS) as Currency[]).map((cur) => (
                      <SelectItem key={cur} value={cur}>
                        <span className="font-medium">{CURRENCY_LABELS[cur].symbol}</span>
                        <span className="text-muted-foreground ml-1">{cur}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative flex-1">
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={MAX_EXPENSE_AMOUNT}
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (errors.amount) setErrors({ ...errors, amount: undefined });
                    }}
                    className={cn(errors.amount && "border-destructive")}
                  />
                </div>
              </div>
              {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors({ ...errors, date: undefined });
                }}
                className={cn(errors.date && "border-destructive")}
              />
              {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description
              <span className="text-xs text-muted-foreground ml-2">
                ({description.length}/{MAX_DESCRIPTION_LENGTH})
              </span>
            </Label>
            <Input
              id="description"
              placeholder="What was this expense for?"
              value={description}
              maxLength={MAX_DESCRIPTION_LENGTH}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors({ ...errors, description: undefined });
              }}
              className={cn(errors.description && "border-destructive")}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <Label>Paid From</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(ACCOUNT_LABELS) as PaymentAccount[]).map((account) => {
                const Icon = ACCOUNT_ICONS[account];
                return (
                  <Button
                    key={account}
                    type="button"
                    variant={paidFrom === account ? "default" : "outline"}
                    className={cn("flex flex-col gap-1 h-auto py-3", paidFrom === account && ACCOUNT_COLORS[account])}
                    onClick={() => setPaidFrom(account)}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{ACCOUNT_LABELS[account]}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category (Optional)</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No category</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recurring Expense Toggle */}
          <div className={cn(
            "flex items-center space-x-2 p-3 rounded-lg border",
            errors.frequency && "border-destructive"
          )}>
            <Checkbox
              id="recurring"
              checked={isRecurring}
              onCheckedChange={(checked) => {
                setIsRecurring(checked as boolean);
                if (errors.frequency) setErrors({ ...errors, frequency: undefined });
              }}
            />
            <div className="flex-1">
              <Label htmlFor="recurring" className="flex items-center gap-2 cursor-pointer">
                <RefreshCw className="h-4 w-4" />
                Recurring Expense
              </Label>
              {errors.frequency && <p className="text-xs text-destructive mt-1">{errors.frequency}</p>}
            </div>
            {isRecurring && (
              <Select value={frequency} onValueChange={(v) => {
                setFrequency(v as RecurrenceFrequency);
                if (errors.frequency) setErrors({ ...errors, frequency: undefined });
              }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(FREQUENCY_LABELS) as RecurrenceFrequency[]).map((freq) => (
                    <SelectItem key={freq} value={freq}>{FREQUENCY_LABELS[freq]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes (Optional)
              <span className="text-xs text-muted-foreground ml-2">
                ({notes.length}/{MAX_NOTES_LENGTH})
              </span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any additional details..."
              value={notes}
              maxLength={MAX_NOTES_LENGTH}
              onChange={(e) => {
                setNotes(e.target.value);
                if (errors.notes) setErrors({ ...errors, notes: undefined });
              }}
              rows={2}
              className={cn(errors.notes && "border-destructive")}
            />
            {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending || !amount || !description.trim()}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {editingExpense ? "Update" : "Add Expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// CATEGORY MANAGER
// ============================================================================

function CategoryManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#6366f1");

  const utils = api.useUtils();
  const { data: categories } = api.expenses.getCategories.useQuery();

  const createCategory = api.expenses.createCategory.useMutation({
    onSuccess: () => {
      utils.expenses.getCategories.invalidate();
      setNewCategoryName("");
      setNewCategoryColor("#6366f1");
    },
  });

  const deleteCategory = api.expenses.deleteCategory.useMutation({
    onSuccess: () => utils.expenses.getCategories.invalidate(),
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Manage Categories</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Expense Categories</DialogTitle>
          <DialogDescription>Create and manage categories for your expenses.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Input
              placeholder="New category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <input
              type="color"
              value={newCategoryColor}
              onChange={(e) => setNewCategoryColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <Button
              onClick={() => createCategory.mutate({ name: newCategoryName, color: newCategoryColor })}
              disabled={!newCategoryName.trim() || createCategory.isPending}
            >
              {createCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {categories?.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-2 rounded border">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span>{cat.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteCategory.mutate({ id: cat.id })}
                  disabled={deleteCategory.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {categories?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No categories yet.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// EXPORT DIALOG
// ============================================================================

function ExportDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 3), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { refetch, isLoading } = api.expenses.exportToCSV.useQuery(
    { startDate: new Date(startDate), endDate: new Date(endDate) },
    { enabled: false }
  );

  const handleExport = async () => {
    const result = await refetch();
    if (result.data) {
      const blob = new Blob([result.data.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.data.filename;
      a.click();
      URL.revokeObjectURL(url);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Expenses</DialogTitle>
          <DialogDescription>Download your expenses as a CSV file.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleExport} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Download CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ExpensesPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [activeTab, setActiveTab] = useState("expenses");

  const utils = api.useUtils();

  const { data: expensesData, isLoading } = api.expenses.getAll.useQuery({ month: selectedMonth });

  const deleteExpense = api.expenses.delete.useMutation({
    onSuccess: () => {
      utils.expenses.getAll.invalidate();
      utils.expenses.getMonthlySummary.invalidate();
      utils.expenses.getAnalytics.invalidate();
    },
  });

  const expenses = useMemo(() => (expensesData?.expenses ?? []) as Expense[], [expensesData]);

  const handlePrevMonth = () => setSelectedMonth((m) => subMonths(m, 1));
  const handleNextMonth = () => setSelectedMonth((m) => addMonths(m, 1));

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    utils.expenses.getAll.invalidate();
    utils.expenses.getMonthlySummary.invalidate();
    utils.expenses.getAnalytics.invalidate();
    utils.expenses.getCategoriesWithBudgets.invalidate();
    setEditingExpense(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Joint Expenses</h1>
          <p className="text-muted-foreground">Track shared expenses and calculate who owes whom</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SplitConfigDialog />
          <CategoryManager />
          <ExportDialog />
          <Button className="gap-2" onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="expenses" className="gap-2">
            <Receipt className="h-4 w-4" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="budgets" className="gap-2">
            <Target className="h-4 w-4" />
            Budgets
          </TabsTrigger>
          <TabsTrigger value="settlements" className="gap-2">
            <History className="h-4 w-4" />
            Settlements
          </TabsTrigger>
        </TabsList>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          {/* Month Selector */}
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-xl font-semibold min-w-[200px] text-center">
              {format(selectedMonth, "MMMM yyyy")}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              disabled={startOfMonth(new Date()).getTime() === selectedMonth.getTime()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-6">
              <MonthlySummaryCard month={selectedMonth} />
              <RecurringExpensesCard onRefresh={handleFormSuccess} />
            </div>

            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Expenses
                  </CardTitle>
                  <CardDescription>
                    {expenses.length} expense{expenses.length !== 1 ? "s" : ""} this month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : expenses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">No expenses recorded for this month.</p>
                      <Button onClick={() => setIsFormOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Expense
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-3">
                        {expenses.map((expense) => {
                          const Icon = ACCOUNT_ICONS[expense.paidFrom];
                          return (
                            <div key={expense.id} className="p-4 rounded-lg border bg-card">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium truncate">{expense.description}</span>
                                    {expense.isRecurring && (
                                      <RefreshCw className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                    <span>{format(new Date(expense.date), "MMM d")}</span>
                                    <span>•</span>
                                    <div className="flex items-center gap-1">
                                      <div className={cn("w-4 h-4 rounded-full flex items-center justify-center", ACCOUNT_COLORS[expense.paidFrom])}>
                                        <Icon className="h-2 w-2 text-white" />
                                      </div>
                                      <span className="text-xs">{ACCOUNT_LABELS[expense.paidFrom].split(" ")[0]}</span>
                                    </div>
                                  </div>
                                  {expense.category && (
                                    <Badge
                                      variant="secondary"
                                      className="mt-2 text-xs"
                                      style={{
                                        backgroundColor: `${expense.category.color}20`,
                                        color: expense.category.color,
                                      }}
                                    >
                                      {expense.category.name}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="font-semibold">
                                    {formatCurrency(expense.amount, expense.currency)}
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-6 px-2 mt-1">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEditExpense(expense)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => deleteExpense.mutate({ id: expense.id })}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Paid From</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {expenses.map((expense) => {
                              const Icon = ACCOUNT_ICONS[expense.paidFrom];
                              return (
                                <TableRow key={expense.id}>
                                  <TableCell className="font-medium">
                                    {format(new Date(expense.date), "MMM d")}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div>
                                        <div>{expense.description}</div>
                                        {expense.notes && (
                                          <div className="text-xs text-muted-foreground">{expense.notes}</div>
                                        )}
                                      </div>
                                      {expense.isRecurring && (
                                        <RefreshCw className="h-3 w-3 text-muted-foreground" />
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {expense.category ? (
                                      <Badge
                                        variant="secondary"
                                        style={{
                                          backgroundColor: `${expense.category.color}20`,
                                          color: expense.category.color,
                                        }}
                                      >
                                        {expense.category.name}
                                      </Badge>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1.5">
                                      <div
                                        className={cn(
                                          "w-6 h-6 rounded-full flex items-center justify-center",
                                          ACCOUNT_COLORS[expense.paidFrom]
                                        )}
                                      >
                                        <Icon className="h-3 w-3 text-white" />
                                      </div>
                                      <span className="text-sm">{ACCOUNT_LABELS[expense.paidFrom]}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {formatCurrency(expense.amount, expense.currency)}
                                  </TableCell>
                                  <TableCell>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEditExpense(expense)}>
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-destructive"
                                          onClick={() => deleteExpense.mutate({ id: expense.id })}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <AnalyticsCard />
            </div>
            <div>
              <SpendingInsightsCard />
            </div>
          </div>
        </TabsContent>

        {/* Budgets Tab */}
        <TabsContent value="budgets">
          <div className="grid gap-6 lg:grid-cols-2">
            <BudgetTrackerCard month={selectedMonth} />
            <MonthlySummaryCard month={selectedMonth} />
          </div>
        </TabsContent>

        {/* Settlements Tab */}
        <TabsContent value="settlements">
          <div className="grid gap-6 lg:grid-cols-2">
            <SettlementHistoryCard />
            <MonthlySummaryCard month={selectedMonth} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Expense Form Dialog */}
      <ExpenseForm
        isOpen={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingExpense(null);
        }}
        editingExpense={editingExpense}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
