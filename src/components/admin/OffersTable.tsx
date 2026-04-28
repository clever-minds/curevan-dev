
'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  Tag
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Price } from '../money/price';
import { cn } from '@/lib/utils';
import type { Offer } from '@/lib/types';
import { useRouter } from "next/navigation";

interface OffersTableProps {
  offers: Offer[];
  onDelete?: (id: number) => Promise<void>;
  onStatusUpdate?: (id: number, active: boolean) => Promise<void>;
}

const getStatusBadgeVariant = (isActive: boolean) => {
  return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
};

export function OffersTable({ offers, onDelete, onStatusUpdate }: OffersTableProps) {
  const isMobile = useIsMobile();
  const router = useRouter();

  const handleEdit = (id: number) => {
    router.push(`/dashboard/admin/offers/${id}/edit`);
  };

  if (isMobile) {
    return (
      <div className="space-y-4">
        {offers.map(offer => (
          <Card key={offer.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="font-bold text-lg">{offer.name}</p>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider">{offer.scope}</p>
                </div>
                <Badge className={cn(getStatusBadgeVariant(offer.isActive))}>
                  {offer.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              <div className="mt-4 flex justify-between items-end">
                <div className="text-sm">
                   <p className="font-semibold text-primary">
                    {offer.type === 'percent' ? `${offer.value}% OFF` : <Price amount={offer.value} />}
                   </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(offer.id)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Targets</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map(offer => (
              <TableRow key={offer.id}>
                <TableCell className="font-bold">{offer.name}</TableCell>
                <TableCell className="capitalize">{offer.scope}</TableCell>
                <TableCell>
                  {offer.type === 'percent' ? `${offer.value}%` : <Price amount={offer.value} />}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {offer.scope === 'product' && `Product ID: ${offer.productId}`}
                  {offer.scope === 'category' && `Category ID: ${offer.categoryId}`}
                  {offer.scope === 'global' && 'All Products'}
                </TableCell>
                <TableCell>
                  <Badge className={cn(getStatusBadgeVariant(offer.isActive))}>
                    {offer.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(offer.id)}>
                        <Edit className="mr-2 w-4 h-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusUpdate?.(offer.id, !offer.isActive)}>
                        {offer.isActive ? <Pause className="mr-2 w-4 h-4" /> : <Play className="mr-2 w-4 h-4" />}
                        {offer.isActive ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(offer.id)}>
                        <Trash2 className="mr-2 w-4 h-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
