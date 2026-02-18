"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  Trash2,
  Target,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { format } from "date-fns";

export default function FinancePage() {
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isSavingsDialogOpen, setIsSavingsDialogOpen] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    amount: "",
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
    categoryId: "",
  });
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    color: "#3b82f6",
    budgetLimit: "",
  });
  const [savingsForm, setSavingsForm] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "0",
    deadline: "",
    color: "#10b981",
  });

  const utils = api.useUtils();
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Queries
  const { data: transactions, isLoading: transactionsLoading } = api.finance.getAllTransactions.useQuery();
  const { data: categories } = api.finance.getAllCategories.useQuery();
  const { data: savingsGoals } = api.finance.getAllSavingsGoals.useQuery();
  const { data: monthlyStats } = api.finance.getMonthlyStats.useQuery({
    year: currentYear,
    month: currentMonth,
  });
  const { data: spendingByCategory } = api.finance.getSpendingByCategory.useQuery();
  const { data: budgetStatus } = api.finance.getBudgetStatus.useQuery({
    year: currentYear,
    month: currentMonth,
  });

  // Mutations
  const createTransaction = api.finance.createTransaction.useMutation({
    onSuccess: () => {
      utils.finance.getAllTransactions.invalidate();
      utils.finance.getMonthlyStats.invalidate();
      utils.finance.getSpendingByCategory.invalidate();
      utils.finance.getBudgetStatus.invalidate();
      setIsTransactionDialogOpen(false);
      setTransactionForm({
        amount: "",
        type: "EXPENSE",
        description: "",
        date: format(new Date(), "yyyy-MM-dd"),
        categoryId: "",
      });
    },
  });

  const deleteTransaction = api.finance.deleteTransaction.useMutation({
    onSuccess: () => {
      utils.finance.getAllTransactions.invalidate();
      utils.finance.getMonthlyStats.invalidate();
      utils.finance.getSpendingByCategory.invalidate();
      utils.finance.getBudgetStatus.invalidate();
    },
  });

  const createCategory = api.finance.createCategory.useMutation({
    onSuccess: () => {
      utils.finance.getAllCategories.invalidate();
      setIsCategoryDialogOpen(false);
      setCategoryForm({
        name: "",
        type: "EXPENSE",
        color: "#3b82f6",
        budgetLimit: "",
      });
    },
  });

  const deleteCategory = api.finance.deleteCategory.useMutation({
    onSuccess: () => {
      utils.finance.getAllCategories.invalidate();
    },
  });

  const createSavingsGoal = api.finance.createSavingsGoal.useMutation({
    onSuccess: () => {
      utils.finance.getAllSavingsGoals.invalidate();
      setIsSavingsDialogOpen(false);
      setSavingsForm({
        name: "",
        targetAmount: "",
        currentAmount: "0",
        deadline: "",
        color: "#10b981",
      });
    },
  });

  const addToSavings = api.finance.addToSavingsGoal.useMutation({
    onSuccess: () => {
      utils.finance.getAllSavingsGoals.invalidate();
    },
  });

  const deleteSavingsGoal = api.finance.deleteSavingsGoal.useMutation({
    onSuccess: () => {
      utils.finance.getAllSavingsGoals.invalidate();
    },
  });

  const handleCreateTransaction = () => {
    if (!transactionForm.amount || !transactionForm.description) return;

    createTransaction.mutate({
      amount: parseFloat(transactionForm.amount),
      type: transactionForm.type,
      description: transactionForm.description,
      date: new Date(transactionForm.date),
      categoryId: transactionForm.categoryId || undefined,
    });
  };

  const handleCreateCategory = () => {
    if (!categoryForm.name) return;

    createCategory.mutate({
      name: categoryForm.name,
      type: categoryForm.type,
      color: categoryForm.color,
      budgetLimit: categoryForm.budgetLimit ? parseFloat(categoryForm.budgetLimit) : undefined,
    });
  };

  const handleCreateSavingsGoal = () => {
    if (!savingsForm.name || !savingsForm.targetAmount) return;

    createSavingsGoal.mutate({
      name: savingsForm.name,
      targetAmount: parseFloat(savingsForm.targetAmount),
      currentAmount: parseFloat(savingsForm.currentAmount) || 0,
      deadline: savingsForm.deadline ? new Date(savingsForm.deadline) : undefined,
      color: savingsForm.color,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance</h1>
          <p className="text-muted-foreground">Track your income, expenses, and savings goals</p>
        </div>
        <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Transaction</DialogTitle>
              <DialogDescription>Record a new income or expense</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={transactionForm.type}
                  onValueChange={(value: "INCOME" | "EXPENSE") =>
                    setTransactionForm({ ...transactionForm, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">Income</SelectItem>
                    <SelectItem value="EXPENSE">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="What was this for?"
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={transactionForm.date}
                  onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Category (optional)</Label>
                <Select
                  value={transactionForm.categoryId}
                  onValueChange={(value) => setTransactionForm({ ...transactionForm, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      ?.filter((c) => c.type === transactionForm.type)
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTransactionDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTransaction} disabled={createTransaction.isPending}>
                {createTransaction.isPending ? "Adding..." : "Add Transaction"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(monthlyStats?.income || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(monthlyStats?.expenses || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(monthlyStats?.net || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(monthlyStats?.net || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Goals</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{savingsGoals?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="savings">Savings Goals</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest financial activity</CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="py-8 text-center text-muted-foreground">Loading...</div>
              ) : transactions?.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Wallet className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No transactions yet</p>
                  <p className="text-sm">Add your first transaction to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions?.slice(0, 20).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            transaction.type === "INCOME"
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {transaction.type === "INCOME" ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(transaction.date), "MMM d, yyyy")}
                            {transaction.category && ` • ${transaction.category.name}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-semibold ${
                            transaction.type === "INCOME" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {transaction.type === "INCOME" ? "+" : "-"}
                          {formatCurrency(Number(transaction.amount))}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTransaction.mutate({ id: transaction.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Category</DialogTitle>
                  <DialogDescription>Create a new category for your transactions</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="e.g., Groceries"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={categoryForm.type}
                      onValueChange={(value: "INCOME" | "EXPENSE") =>
                        setCategoryForm({ ...categoryForm, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INCOME">Income</SelectItem>
                        <SelectItem value="EXPENSE">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <Input
                      type="color"
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                    />
                  </div>
                  {categoryForm.type === "EXPENSE" && (
                    <div className="space-y-2">
                      <Label>Monthly Budget Limit (optional)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={categoryForm.budgetLimit}
                        onChange={(e) => setCategoryForm({ ...categoryForm, budgetLimit: e.target.value })}
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCategory} disabled={createCategory.isPending}>
                    {createCategory.isPending ? "Adding..." : "Add Category"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
              </CardHeader>
              <CardContent>
                {categories?.filter((c) => c.type === "EXPENSE").length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No expense categories</p>
                ) : (
                  <div className="space-y-2">
                    {categories
                      ?.filter((c) => c.type === "EXPENSE")
                      .map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: category.color || "#3b82f6" }}
                            />
                            <div>
                              <p className="font-medium">{category.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {category._count?.transactions || 0} transactions
                                {category.budgetLimit && ` • Budget: ${formatCurrency(Number(category.budgetLimit))}`}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteCategory.mutate({ id: category.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Income Categories</CardTitle>
              </CardHeader>
              <CardContent>
                {categories?.filter((c) => c.type === "INCOME").length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No income categories</p>
                ) : (
                  <div className="space-y-2">
                    {categories
                      ?.filter((c) => c.type === "INCOME")
                      .map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: category.color || "#10b981" }}
                            />
                            <div>
                              <p className="font-medium">{category.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {category._count?.transactions || 0} transactions
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteCategory.mutate({ id: category.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Savings Goals Tab */}
        <TabsContent value="savings" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isSavingsDialogOpen} onOpenChange={setIsSavingsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Savings Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Savings Goal</DialogTitle>
                  <DialogDescription>Set a new savings target</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="e.g., Emergency Fund"
                      value={savingsForm.name}
                      onChange={(e) => setSavingsForm({ ...savingsForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={savingsForm.targetAmount}
                      onChange={(e) => setSavingsForm({ ...savingsForm, targetAmount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={savingsForm.currentAmount}
                      onChange={(e) => setSavingsForm({ ...savingsForm, currentAmount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Date (optional)</Label>
                    <Input
                      type="date"
                      value={savingsForm.deadline}
                      onChange={(e) => setSavingsForm({ ...savingsForm, deadline: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <Input
                      type="color"
                      value={savingsForm.color}
                      onChange={(e) => setSavingsForm({ ...savingsForm, color: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsSavingsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSavingsGoal} disabled={createSavingsGoal.isPending}>
                    {createSavingsGoal.isPending ? "Adding..." : "Add Goal"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {savingsGoals?.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Target className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No savings goals yet</p>
                <p className="text-sm">Create a savings goal to start tracking your progress</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {savingsGoals?.map((goal) => {
                const percentage = Math.min(
                  (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100,
                  100
                );
                return (
                  <Card key={goal.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{goal.name}</CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSavingsGoal.mutate({ id: goal.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {goal.deadline && (
                        <CardDescription>
                          Target: {format(new Date(goal.deadline), "MMM d, yyyy")}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>{formatCurrency(Number(goal.currentAmount))}</span>
                          <span className="text-muted-foreground">
                            {formatCurrency(Number(goal.targetAmount))}
                          </span>
                        </div>
                        <Progress
                          value={percentage}
                          className="h-2"
                          style={{
                            // @ts-expect-error CSS custom property
                            "--progress-background": goal.color || "#10b981",
                          }}
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          {percentage.toFixed(0)}% complete
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const amount = prompt("Enter amount to add:");
                          if (amount && !isNaN(parseFloat(amount))) {
                            addToSavings.mutate({ id: goal.id, amount: parseFloat(amount) });
                          }
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Funds
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Budgets Tab */}
        <TabsContent value="budgets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Overview - {format(new Date(), "MMMM yyyy")}</CardTitle>
              <CardDescription>Track your spending against category budgets</CardDescription>
            </CardHeader>
            <CardContent>
              {budgetStatus?.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Target className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No budgets set</p>
                  <p className="text-sm">
                    Add budget limits to your expense categories to track your spending
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {budgetStatus?.map((budget) => (
                    <div key={budget.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: budget.color || "#3b82f6" }}
                          />
                          <span className="font-medium">{budget.name}</span>
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            budget.isOverBudget ? "text-red-600" : "text-muted-foreground"
                          }`}
                        >
                          {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(budget.percentage, 100)}
                        className={`h-2 ${budget.isOverBudget ? "[&>div]:bg-red-500" : ""}`}
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{budget.percentage.toFixed(0)}% used</span>
                        <span
                          className={budget.isOverBudget ? "text-red-600" : "text-green-600"}
                        >
                          {budget.isOverBudget
                            ? `${formatCurrency(Math.abs(budget.remaining))} over`
                            : `${formatCurrency(budget.remaining)} remaining`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Spending by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>Where your money is going</CardDescription>
            </CardHeader>
            <CardContent>
              {spendingByCategory?.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No expenses recorded</p>
              ) : (
                <div className="space-y-4">
                  {spendingByCategory?.map((category) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {category.count} transaction{category.count !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold">{formatCurrency(category.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
