"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc";
import { format, startOfMonth, addMonths, subMonths } from "date-fns";

type PaymentAccount = "SELF" | "PARTNER" | "JOINT";

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
}

function MonthlySummaryCard({
  month,
  isLoading,
}: {
  month: Date;
  isLoading?: boolean;
}) {
  const { data: summary, isLoading: summaryLoading } = api.expenses.getMonthlySummary.useQuery({
    month,
  });

  const utils = api.useUtils();
  const markSettled = api.expenses.markSettled.useMutation({
    onSuccess: () => {
      utils.expenses.getMonthlySummary.invalidate({ month });
    },
  });

  const unmarkSettled = api.expenses.unmarkSettled.useMutation({
    onSuccess: () => {
      utils.expenses.getMonthlySummary.invalidate({ month });
    },
  });

  if (summaryLoading || isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  const { totals, calculation, splitConfig, settlement, categories } = summary;
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
          {isSettled ? (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Settled
            </Badge>
          ) : null}
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
            <span>I should pay ({splitConfig.selfPercent}%):</span>
            <span className="font-medium">${calculation.selfShouldPay.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Partner should pay ({splitConfig.partnerPercent}%):</span>
            <span className="font-medium">${calculation.partnerShouldPay.toFixed(2)}</span>
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
              <Button
                size="sm"
                onClick={() => markSettled.mutate({ month })}
                disabled={markSettled.isPending}
              >
                {markSettled.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Mark Settled
                  </>
                )}
              </Button>
            ) : isSettled ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => unmarkSettled.mutate({ month })}
                disabled={unmarkSettled.isPending}
              >
                Undo
              </Button>
            ) : null}
          </div>
        </div>

        {/* Category Breakdown */}
        {categories.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">By Category</div>
            {categories.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span>{cat.name}</span>
                </div>
                <span className="font-medium">${cat.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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

  const handleSave = () => {
    updateConfig.mutate({
      selfPercent,
      partnerPercent: 100 - selfPercent,
    });
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
          <DialogDescription>
            Set how joint expenses should be split between you and your partner.
          </DialogDescription>
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
              className="w-full"
            />
          </div>
          <div className="flex items-center justify-center gap-4 text-lg font-medium">
            <span className="text-blue-600">{selfPercent}%</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-purple-600">{100 - selfPercent}%</span>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            You / Partner
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateConfig.isPending}>
            {updateConfig.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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
  };

  const handleOpen = (open: boolean) => {
    if (open && editingExpense) {
      setAmount(editingExpense.amount.toString());
      setDescription(editingExpense.description);
      setDate(format(new Date(editingExpense.date), "yyyy-MM-dd"));
      setPaidFrom(editingExpense.paidFrom);
      setCategoryId(editingExpense.category?.id ?? "");
      setNotes(editingExpense.notes ?? "");
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
      <DialogContent>
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
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
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
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
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
                    className={cn(
                      "flex flex-col gap-1 h-auto py-3",
                      paidFrom === account && ACCOUNT_COLORS[account]
                    )}
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
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !amount || !description.trim()}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {editingExpense ? "Update" : "Add Expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
    onSuccess: () => {
      utils.expenses.getCategories.invalidate();
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Manage Categories
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Expense Categories</DialogTitle>
          <DialogDescription>
            Create and manage categories for your expenses.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Add new category */}
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
              onClick={() =>
                createCategory.mutate({
                  name: newCategoryName,
                  color: newCategoryColor,
                })
              }
              disabled={!newCategoryName.trim() || createCategory.isPending}
            >
              {createCategory.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Existing categories */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {categories?.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-2 rounded border"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
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
              <p className="text-sm text-muted-foreground text-center py-4">
                No categories yet. Add one above!
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ExpensesPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const utils = api.useUtils();

  const { data: expensesData, isLoading } = api.expenses.getAll.useQuery({
    month: selectedMonth,
  });

  const deleteExpense = api.expenses.delete.useMutation({
    onSuccess: () => {
      utils.expenses.getAll.invalidate();
      utils.expenses.getMonthlySummary.invalidate();
    },
  });

  const expenses = useMemo(() => {
    return (expensesData?.expenses ?? []) as Expense[];
  }, [expensesData]);

  const handlePrevMonth = () => setSelectedMonth((m) => subMonths(m, 1));
  const handleNextMonth = () => setSelectedMonth((m) => addMonths(m, 1));

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    utils.expenses.getAll.invalidate();
    utils.expenses.getMonthlySummary.invalidate();
    setEditingExpense(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Joint Expenses</h1>
          <p className="text-muted-foreground">
            Track shared expenses and calculate who owes whom
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SplitConfigDialog />
          <CategoryManager />
          <Button className="gap-2" onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

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
        {/* Summary Card */}
        <div className="lg:col-span-1">
          <MonthlySummaryCard month={selectedMonth} isLoading={isLoading} />
        </div>

        {/* Expenses List */}
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
                  <p className="text-muted-foreground mb-4">
                    No expenses recorded for this month.
                  </p>
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
                            <div>
                              <div>{expense.description}</div>
                              {expense.notes && (
                                <div className="text-xs text-muted-foreground">
                                  {expense.notes}
                                </div>
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
                              <span className="text-sm">
                                {ACCOUNT_LABELS[expense.paidFrom]}
                              </span>
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
                                <DropdownMenuItem
                                  onClick={() => handleEditExpense(expense)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() =>
                                    deleteExpense.mutate({ id: expense.id })
                                  }
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
