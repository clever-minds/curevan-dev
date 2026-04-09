
'use client';

import * as React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { ProductCategory } from "@/lib/types";
import { Search, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { SheetClose } from '../ui/sheet';
import { Price } from '../money/price';

interface FilterSidebarProps {
    categories: ProductCategory[];
    filters: any;
    setFilters: (filters: any) => void;
    minPrice?: number;
    maxPrice?: number;
    isMobile?: boolean;
    closeSheet?: () => void;
}

export function FilterSidebar({ 
    categories, 
    filters, 
    setFilters, 
    minPrice = 0, 
    maxPrice = 10000, 
    isMobile = false, 
    closeSheet 
}: FilterSidebarProps) {
    const [localFilters, setLocalFilters] = React.useState(filters);

    // Sync local filters when parent filters change (e.g., initial load)
    React.useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    const handleLocalFilterChange = (key: string, value: any) => {
        setLocalFilters((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleRatingChange = (rating: number) => {
        setLocalFilters((prev: any) => ({
            ...prev,
            rating: prev.rating === rating ? 0 : rating
        }));
    };

    const handleApplyFilters = () => {
        setFilters(localFilters);
        if (closeSheet) {
            closeSheet();
        }
    }
    
    // For desktop, apply filters instantly
    React.useEffect(() => {
        if (!isMobile) {
            setFilters(localFilters);
        }
    }, [localFilters, isMobile, setFilters]);

    const step = React.useMemo(() => {
        const range = maxPrice - minPrice;
        if (range <= 100) return 1;
        if (range <= 1000) return 10;
        if (range <= 5000) return 100;
        return 500;
    }, [minPrice, maxPrice]);

    return (
        <div className="space-y-6 flex flex-col h-full">
            <div className="flex-1 space-y-6">
                <h3 className="text-xl font-bold font-headline">Filters</h3>
                
                <div className="space-y-2">
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                        <Input 
                            id="search" 
                            placeholder="Search products..." 
                            className="pl-9"
                            value={localFilters.search}
                            onChange={(e) => handleLocalFilterChange('search', e.target.value)}
                        />
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Label>Category</Label>
                    <RadioGroup 
                        value={localFilters.category} 
                        onValueChange={(value) => handleLocalFilterChange('category', value)}
                        className="space-y-1"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="all" id="cat-all" />
                            <Label htmlFor="cat-all" className="font-normal">All</Label>
                        </div>
                    {categories.map(category => (
                        <div key={category.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={category.id} id={`cat-${category.id}`} />
                            <Label htmlFor={`cat-${category.id}`} className="font-normal">{category.name}</Label>
                        </div>
                    ))}
                    </RadioGroup>
                </div>
                
                <div className="space-y-4">
                    <Label>Price Range</Label>
                    <Slider
                        value={localFilters.price}
                        onValueChange={(value) => handleLocalFilterChange('price', value)}
                        min={minPrice}
                        max={maxPrice}
                        step={step}
                        className="my-4"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span><Price amount={localFilters.price[0]} /></span>
                        <span><Price amount={localFilters.price[1]} /></span>
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Label>Rating</Label>
                    <div className="space-y-1">
                        {[4, 3, 2].map(rating => (
                            <div key={rating} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`rating-${rating}`} 
                                    checked={localFilters.rating === rating}
                                    onCheckedChange={() => handleRatingChange(rating)}
                                />
                                <Label htmlFor={`rating-${rating}`} className="font-normal flex items-center">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} className={cn("w-4 h-4", i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-400")} />
                                    ))}
                                    <span className="ml-2">& up</span>
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-2 mt-auto">
                {isMobile && (
                    <Button 
                        className="w-full"
                        onClick={handleApplyFilters}
                    >
                        Apply Filters
                    </Button>
                )}
                <Button 
                    className="w-full"
                    variant="outline"
                    onClick={() => {
                        const clearedFilters = { search: '', category: 'all', price: [minPrice, maxPrice], rating: 0 };
                        setLocalFilters(clearedFilters);
                        if (!isMobile) {
                            setFilters(clearedFilters);
                        }
                    }}
                >
                    Clear Filters
                </Button>
            </div>
        </div>
    );
}
