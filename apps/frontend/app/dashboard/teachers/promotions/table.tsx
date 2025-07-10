"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MoreHorizontal, Search, Trash2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import PaginationControls from "@/components/ui/pagination-controls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Member } from "./action";
import { useAddMember, usePromotionMembers, useRemoveMember } from "./hooks";

const memberFormSchema = z.object({
  lastname: z.string().min(1, "Le nom est requis"),
  firstname: z.string().min(1, "Le prénom est requis"),
  email: z.string().email("L'adresse email n'est pas valide"),
});

type MemberFormValues = z.infer<typeof memberFormSchema>;

interface MembersTableProps {
  promotionId: number | null;
}

export function MembersTable({ promotionId }: MembersTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: membersResponse,
    isLoading,
    isError,
    error,
    isFetching,
  } = usePromotionMembers(promotionId, currentPage, pageSize);

  const allMembers = membersResponse?.data || [];

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return allMembers;

    const lowerCaseQuery = searchQuery.toLowerCase().trim();
    return allMembers.filter(
      (member) =>
        member.firstname.toLowerCase().includes(lowerCaseQuery) ||
        member.lastname.toLowerCase().includes(lowerCaseQuery) ||
        member.email.toLowerCase().includes(lowerCaseQuery),
    );
  }, [allMembers, searchQuery]);

  const paginatedMembers = useMemo(() => {
    const startIndex = 0;
    const endIndex = filteredMembers.length;
    return filteredMembers.slice(startIndex, endIndex);
  }, [filteredMembers]);

  const totalFilteredCount = filteredMembers.length;
  const totalCount = membersResponse?.size ?? 0;
  const totalPages = membersResponse?.totalPages || 1;

  const removeMutation = useRemoveMember();
  const addMutation = useAddMember();

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      email: "",
    },
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!(memberToDelete && promotionId)) return;

    removeMutation.mutate(
      {
        promotionId,
        memberId: memberToDelete.id,
      },
      {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          toast.success("Membre supprimé avec succès");
        },
        onError: () => {
          toast.error("Une erreur est survenue lors de la suppression");
        },
      },
    );
  };

  const onSubmit = (data: MemberFormValues) => {
    if (!promotionId) return;

    addMutation.mutate(
      {
        promotionId,
        member: [data],
      },
      {
        onSuccess: () => {
          setAddMemberDialogOpen(false);
          toast.success("Membre ajouté avec succès");
          form.reset();
        },
        onError: () => {
          toast.error("Une erreur est survenue lors de l'ajout du membre");
        },
      },
    );
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  if (isLoading) {
    return <MembersTableSkeleton />;
  }

  if (isError || !promotionId) {
    return (
      <div className="rounded-md bg-destructive/15 p-4 text-destructive">
        <p>Une erreur est survenue lors du chargement des membres.</p>
        <p className="text-sm">{error instanceof Error ? error.message : "Erreur inconnue"}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">
          Membres ({searchQuery ? `${totalFilteredCount} sur ${totalCount}` : totalCount})
          {isFetching && <span className="ml-2 text-sm text-muted-foreground">(Actualisation...)</span>}
        </h3>
        <Dialog
          open={addMemberDialogOpen}
          onOpenChange={(open) => {
            setAddMemberDialogOpen(open);
            if (!open) form.reset();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Ajouter un membre
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Ajouter un membre</DialogTitle>
              <DialogDescription>Ajoutez un nouveau membre à cette promotion.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lastname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom</FormLabel>
                        <FormControl>
                          <Input placeholder="Dupont" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="firstname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom</FormLabel>
                        <FormControl>
                          <Input placeholder="Jean" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="jean.dupont@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={addMutation.isPending}>
                    {addMutation.isPending ? "Ajout en cours..." : "Ajouter"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un membre..."
            className="pl-8"
            onChange={handleSearchChange}
            value={searchQuery}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Éléments par page:</span>
          <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder={pageSize.toString()} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Prénom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Date d'ajout</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!paginatedMembers || paginatedMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {searchQuery
                    ? "Aucun membre ne correspond à votre recherche"
                    : "Aucun membre trouvé dans cette promotion"}
                </TableCell>
              </TableRow>
            ) : (
              paginatedMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.lastname || "-"}</TableCell>
                  <TableCell>{member.firstname}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.createdAt ? formatDate(member.createdAt) : "-"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Ouvrir le menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setMemberToDelete(member);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        handlePageChange={handlePageChange}
        isFetching={isFetching}
        isLoading={isLoading}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera définitivement le membre
              {memberToDelete ? ` "${memberToDelete.firstname} ${memberToDelete.lastname || ""}"` : ""} de cette
              promotion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={removeMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {removeMutation.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function MembersTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="flex items-center justify-between mb-4 gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Prénom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Date d'ajout</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_) => (
              <TableRow key={Math.random()}>
                <TableCell>
                  <Skeleton className="h-4 w-[80px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[80px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[180px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-center">
        <Skeleton className="h-10 w-64" />
      </div>
    </div>
  );
}
