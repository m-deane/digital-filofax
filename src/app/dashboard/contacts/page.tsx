"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Search,
  Star,
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar as CalendarIcon,
  Loader2,
  Users,
  Tag as TagIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc";
import type { Contact, ContactCategory } from "@/types";

type ContactWithCategory = Contact & {
  category: ContactCategory | null;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
  ];
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length] ?? "bg-gray-500";
}

interface ContactCardProps {
  contact: ContactWithCategory;
  onToggleFavorite: (id: string) => void;
  onEdit: (contact: ContactWithCategory) => void;
  onDelete: (id: string) => void;
}

function ContactCard({ contact, onToggleFavorite, onEdit, onDelete }: ContactCardProps) {
  const avatarColor = getAvatarColor(contact.name);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-full text-white font-semibold shrink-0", avatarColor)}>
            {getInitials(contact.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base truncate">{contact.name}</h3>
                {contact.jobTitle && contact.company && (
                  <p className="text-sm text-muted-foreground truncate">
                    {contact.jobTitle} at {contact.company}
                  </p>
                )}
                {contact.jobTitle && !contact.company && (
                  <p className="text-sm text-muted-foreground truncate">{contact.jobTitle}</p>
                )}
                {!contact.jobTitle && contact.company && (
                  <p className="text-sm text-muted-foreground truncate">{contact.company}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onToggleFavorite(contact.id)}
                >
                  <Star className={cn("h-4 w-4", contact.isFavorite && "fill-yellow-500 text-yellow-500")} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(contact)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete(contact.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="space-y-1 mt-2">
              {contact.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <a href={`mailto:${contact.email}`} className="hover:text-primary truncate">
                    {contact.email}
                  </a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <a href={`tel:${contact.phone}`} className="hover:text-primary truncate">
                    {contact.phone}
                  </a>
                </div>
              )}
              {contact.address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{contact.address}</span>
                </div>
              )}
            </div>

            {contact.category && (
              <Badge
                variant="secondary"
                className="mt-2"
                style={{ backgroundColor: `${contact.category.color}20`, color: contact.category.color }}
              >
                {contact.category.name}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: ContactWithCategory | null;
  categories: (ContactCategory & { _count: { contacts: number } })[];
}

function ContactDialog({ open, onOpenChange, contact, categories }: ContactDialogProps) {
  const [name, setName] = useState(contact?.name ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [address, setAddress] = useState(contact?.address ?? "");
  const [company, setCompany] = useState(contact?.company ?? "");
  const [jobTitle, setJobTitle] = useState(contact?.jobTitle ?? "");
  const [birthday, setBirthday] = useState(
    contact?.birthday ? new Date(contact.birthday).toISOString().split("T")[0] : ""
  );
  const [notes, setNotes] = useState(contact?.notes ?? "");
  const [categoryId, setCategoryId] = useState(contact?.categoryId ?? "");

  const utils = api.useUtils();

  const createContact = api.contacts.create.useMutation({
    onSuccess: () => {
      utils.contacts.getAll.invalidate();
      onOpenChange(false);
      resetForm();
    },
  });

  const updateContact = api.contacts.update.useMutation({
    onSuccess: () => {
      utils.contacts.getAll.invalidate();
      onOpenChange(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setCompany("");
    setJobTitle("");
    setBirthday("");
    setNotes("");
    setCategoryId("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (contact) {
      updateContact.mutate({
        id: contact.id,
        name,
        email: email || "",
        phone: phone || undefined,
        address: address || undefined,
        company: company || undefined,
        jobTitle: jobTitle || undefined,
        birthday: birthday ? new Date(birthday) : null,
        notes: notes || undefined,
        categoryId: categoryId || null,
      });
    } else {
      createContact.mutate({
        name,
        email: email || "",
        phone: phone || undefined,
        address: address || undefined,
        company: company || undefined,
        jobTitle: jobTitle || undefined,
        birthday: birthday ? new Date(birthday) : undefined,
        notes: notes || undefined,
        categoryId: categoryId || undefined,
      });
    }
  };

  const isLoading = createContact.isPending || updateContact.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contact ? "Edit Contact" : "Add Contact"}</DialogTitle>
          <DialogDescription>
            {contact ? "Update contact information" : "Add a new contact to your address book"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St, City, State ZIP"
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Inc."
                />
              </div>
              <div>
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Software Engineer"
                />
              </div>
              <div>
                <Label htmlFor="birthday">Birthday</Label>
                <Input
                  id="birthday"
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {contact ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactWithCategory | null>(null);

  const utils = api.useUtils();

  const { data: allContacts = [], isLoading } = api.contacts.getAll.useQuery();
  const { data: categories = [] } = api.contacts.getCategories.useQuery();

  const toggleFavorite = api.contacts.toggleFavorite.useMutation({
    onSuccess: () => {
      utils.contacts.getAll.invalidate();
    },
  });

  const deleteContact = api.contacts.delete.useMutation({
    onSuccess: () => {
      utils.contacts.getAll.invalidate();
    },
  });

  const handleEdit = (contact: ContactWithCategory) => {
    setEditingContact(contact);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingContact(null);
    }
  };

  const filteredContacts = allContacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      (selectedCategory === "favorites" && contact.isFavorite) ||
      (selectedCategory === "uncategorized" && !contact.categoryId) ||
      contact.categoryId === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Group contacts alphabetically
  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    const firstLetter = contact.name[0]?.toUpperCase() ?? "#";
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter]?.push(contact);
    return acc;
  }, {} as Record<string, ContactWithCategory[]>);

  const alphabeticalGroups = Object.keys(groupedContacts).sort();

  const favoriteCount = allContacts.filter((c) => c.isFavorite).length;
  const uncategorizedCount = allContacts.filter((c) => !c.categoryId).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">Manage your personal and professional contacts</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList>
          <TabsTrigger value="all">
            All ({allContacts.length})
          </TabsTrigger>
          <TabsTrigger value="favorites">
            <Star className="mr-1 h-3.5 w-3.5" />
            Favorites ({favoriteCount})
          </TabsTrigger>
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id}>
              {cat.name} ({cat._count.contacts})
            </TabsTrigger>
          ))}
          <TabsTrigger value="uncategorized">
            Uncategorized ({uncategorizedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-6 mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-1">No contacts found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchQuery
                    ? "Try adjusting your search"
                    : "Get started by adding your first contact"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Contact
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            alphabeticalGroups.map((letter) => (
              <div key={letter}>
                <h2 className="text-2xl font-bold text-muted-foreground mb-3">{letter}</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupedContacts[letter]?.map((contact) => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      onToggleFavorite={(id) => toggleFavorite.mutate({ id })}
                      onEdit={handleEdit}
                      onDelete={(id) => {
                        if (confirm("Are you sure you want to delete this contact?")) {
                          deleteContact.mutate({ id });
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      <ContactDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        contact={editingContact}
        categories={categories}
      />
    </div>
  );
}
