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
  category: ExpenseCategory | null;
  isRecurring?: boolean;
  frequency?: RecurrenceFrequency | null;
}

// ============================================================================
// MONTHLY SUMMARY CARD
// ============================================================================

function MonthlySummaryCard({ month }: { month: Date }) {
  const { data: summary, isLoading } = api.expenses.getMonthlySummary.useQuery({ month });

  const utils = api.useUtils();
  const markSettled = api.expenses.markSettled.useMutation({
    onSuccess: () => utils.expenses.getMonthlySummary.invalidate({ month }),
  });
  const unmarkSettled = api.expenses.unmarkSettled.useMutation({
    onSuccess: () => utils.expenses.getMonthlySummary.invalidate({ month }),
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
              <Button size="sm" onClick={() => markSettled.mutate({ month })} disabled={markSettled.isPending}>
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
          <DialogTitle>Configure Split Ratio</DialogTitle>
          <DialogDescription>Set how joint expenses should be split.</DialogDescription>
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button
            onClick={() => updateConfig.mutate({ selfPercent, partnerPercent: 100 - selfPercent })}
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
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("MONTHLY");

  const { data: categories } = api.expenses.getCategories.useQuery();

  const createExpense = api.expenses.create.useMutation({
    onSuccess: () => {
      resetForm();
      onSuccess();
      onOpenChange(false);
    },
  });

  const updateExpense = api.expenses.update.useMutation({
    onSuccess: () => {
      resetForm();
      onSuccess();
      onOpenChange(false);
    },
  });

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setPaidFrom("SELF");
    setCategoryId("");
    setNotes("");
    setIsRecurring(false);
    setFrequency("MONTHLY");
  };

  const handleOpen = (open: boolean) => {
    if (open && editingExpense) {
      setAmount(editingExpense.amount.toString());
      setDescription(editingExpense.description);
      setDate(format(new Date(editingExpense.date), "yyyy-MM-dd"));
      setPaidFrom(editingExpense.paidFrom);
      setCategoryId(editingExpense.category?.id ?? "");
      setNotes(editingExpense.notes ?? "");
      setIsRecurring(editingExpense.isRecurring ?? false);
      setFrequency(editingExpense.frequency ?? "MONTHLY");
    } else if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || !description.trim()) return;

    const data = {
      amount: parsedAmount,
      description: description.trim(),
      date: new Date(date),
      paidFrom,
      categoryId: categoryId || undefined,
      notes: notes || undefined,
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="What was this expense for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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
          <div className="flex items-center space-x-2 p-3 rounded-lg border">
            <Checkbox
              id="recurring"
              checked={isRecurring}
              onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
            />
            <div className="flex-1">
              <Label htmlFor="recurring" className="flex items-center gap-2 cursor-pointer">
                <RefreshCw className="h-4 w-4" />
                Recurring Expense
              </Label>
            </div>
            {isRecurring && (
              <Select value={frequency} onValueChange={(v) => setFrequency(v as RecurrenceFrequency)}>
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
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
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
            <div className="lg:col-span-1">
              <MonthlySummaryCard month={selectedMonth} />
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
                                ${expense.amount.toFixed(2)}
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
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <AnalyticsCard />
        </TabsContent>

        {/* Budgets Tab */}
        <TabsContent value="budgets">
          <div className="grid gap-6 lg:grid-cols-2">
            <BudgetTrackerCard month={selectedMonth} />
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
