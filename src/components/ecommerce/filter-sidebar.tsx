
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface FilterSidebarProps {
    categories: ProductCategory[];
    filters: any;
    setFilters: (filters: any) => void;
    minPrice?: number;
    maxPrice?: number;
    filterOptions?: any;
    isMobile?: boolean;
    closeSheet?: () => void;
}

export function FilterSidebar({ 
    categories, 
    filters, 
    setFilters, 
    minPrice = 0, 
    maxPrice = 10000, 
    filterOptions,
    isMobile = false, 
    closeSheet 
}: FilterSidebarProps) {
    const [localFilters, setLocalFilters] = React.useState(filters);

    // Sync local filters when parent filters change (e.g., initial load)
    // We only sync if the values have actually changed to avoid infinite loops
    React.useEffect(() => {
        const hasChanged = 
            filters.search !== localFilters.search || 
            filters.category !== localFilters.category ||
            filters.rating !== localFilters.rating ||
            filters.price[0] !== localFilters.price[0] ||
            filters.price[1] !== localFilters.price[1];
            
        if (hasChanged) {
            setLocalFilters(filters);
        }
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

    const handleArrayFilterChange = (key: string, value: string, isChecked: boolean) => {
        setLocalFilters((prev: any) => {
            const currentArray = prev[key] || [];
            if (isChecked) {
                return { ...prev, [key]: [...currentArray, value] };
            } else {
                return { ...prev, [key]: currentArray.filter((item: string) => item !== value) };
            }
        });
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
                
                <div className="space-y-1 pb-4 border-b">
                    <h3 className="font-semibold text-sm mb-3">Department</h3>
                    <button 
                        onClick={() => handleLocalFilterChange('category', 'all')}
                        className={cn(
                            "flex items-center gap-2 w-full px-3 py-2 text-left rounded-md cursor-pointer text-sm transition-colors",
                            localFilters.category === 'all' 
                                ? "text-primary bg-primary/10 font-bold" 
                                : "hover:bg-muted/50 text-foreground"
                        )}
                    >
                        <span className="w-4 text-muted-foreground">›</span>
                        All Products
                    </button>
                    {categories.map(category => (
                        <button 
                            key={category.id}
                            onClick={() => handleLocalFilterChange('category', String(category.id))}
                            className={cn(
                                "flex items-center gap-2 w-full px-3 py-2 text-left rounded-md cursor-pointer text-sm transition-colors",
                                localFilters.category === String(category.id)
                                    ? "text-primary bg-primary/10 font-bold" 
                                    : "hover:bg-muted/50 text-foreground"
                            )}
                        >
                            <span className="w-4 text-muted-foreground">›</span>
                            {category.name}
                        </button>
                    ))}
                </div>

                <div className="space-y-3 pb-4 border-b">
                    <h3 className="font-semibold text-sm">Product Type</h3>
                    {localFilters.category === 'all' ? (
                        <p className="text-xs text-muted-foreground">Select a department to narrow product types.</p>
                    ) : filterOptions?.categorySubCategories?.[localFilters.category]?.length > 0 ? (
                        <div className="space-y-2">
                            {filterOptions.categorySubCategories[localFilters.category].map((sub: string) => (
                                <div key={sub} className="flex items-start space-x-2 my-1.5">
                                    <Checkbox 
                                        id={`sub-${sub}`} 
                                        className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                        checked={localFilters.subCategories?.includes(sub)}
                                        onCheckedChange={(checked) => handleArrayFilterChange('subCategories', sub, checked as boolean)}
                                    />
                                    <Label htmlFor={`sub-${sub}`} className="font-normal text-sm cursor-pointer leading-tight">{sub}</Label>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground">No product types available for this department.</p>
                    )}
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

                <Accordion type="multiple" className="w-full">
                    {/* Brand */}
                    {filterOptions?.brands?.length > 0 && (
                        <AccordionItem value="brand">
                            <AccordionTrigger className="text-base font-semibold">Brand</AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-2 pt-2">
                                    {filterOptions.brands.map((brand: string) => (
                                        <div key={brand} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`brand-${brand}`} 
                                                checked={localFilters.brands?.includes(brand)}
                                                onCheckedChange={(checked) => handleArrayFilterChange('brands', brand, checked as boolean)}
                                            />
                                            <Label htmlFor={`brand-${brand}`} className="font-normal">{brand}</Label>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}



                    {/* Colour */}
                    {filterOptions?.colors?.length > 0 && (
                        <AccordionItem value="color">
                            <AccordionTrigger className="text-base font-semibold">Colour</AccordionTrigger>
                            <AccordionContent>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {filterOptions.colors.map((color: string) => {
                                        const colorLower = color.toLowerCase();
                                        // Default mapping for common colors to avoid transparent backgrounds
                                        let bg = colorLower;
                                        if (colorLower === 'white') bg = '#ffffff';
                                        if (colorLower === 'black') bg = '#111827';
                                        if (colorLower === 'grey' || colorLower === 'gray') bg = '#9CA3AF';
                                        if (colorLower === 'blue') bg = '#2563EB';
                                        if (colorLower === 'green') bg = '#059669';
                                        if (colorLower === 'beige') bg = '#D6C6A5';

                                        const isActive = localFilters.colors?.includes(color);
                                        return (
                                            <button 
                                                key={color} 
                                                title={color}
                                                className={cn(
                                                    "w-7 h-7 rounded-full border-2 border-white shadow-[0_0_0_1px_#C7CBD1] transition-all",
                                                    isActive ? "shadow-[0_0_0_2px_hsl(var(--primary))]" : "hover:shadow-[0_0_0_1px_hsl(var(--primary))]"
                                                )}
                                                style={{ background: bg }}
                                                onClick={() => handleArrayFilterChange('colors', color, !isActive)}
                                            />
                                        )
                                    })}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}

                    {/* Size */}
                    {filterOptions?.sizes?.length > 0 && (
                        <AccordionItem value="size">
                            <AccordionTrigger className="text-base font-semibold">Size</AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-2 pt-2">
                                    {filterOptions.sizes.map((size: string) => (
                                        <div key={size} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`size-${size}`} 
                                                checked={localFilters.sizes?.includes(size)}
                                                onCheckedChange={(checked) => handleArrayFilterChange('sizes', size, checked as boolean)}
                                            />
                                            <Label htmlFor={`size-${size}`} className="font-normal">{size}</Label>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}

                    {/* Body Part */}
                    {filterOptions?.bodyParts?.length > 0 && (
                        <AccordionItem value="bodyPart">
                            <AccordionTrigger className="text-base font-semibold">Body Part</AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-2 pt-2">
                                    {filterOptions.bodyParts.map((part: string) => (
                                        <div key={part} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`part-${part}`} 
                                                checked={localFilters.bodyParts?.includes(part)}
                                                onCheckedChange={(checked) => handleArrayFilterChange('bodyParts', part, checked as boolean)}
                                            />
                                            <Label htmlFor={`part-${part}`} className="font-normal">{part}</Label>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}

                    {/* Intended Use */}
                    {filterOptions?.intendedUses?.length > 0 && (
                        <AccordionItem value="intendedUse">
                            <AccordionTrigger className="text-base font-semibold">Intended Use</AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-2 pt-2">
                                    {filterOptions.intendedUses.map((use: string) => (
                                        <div key={use} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`use-${use}`} 
                                                checked={localFilters.intendedUses?.includes(use)}
                                                onCheckedChange={(checked) => handleArrayFilterChange('intendedUses', use, checked as boolean)}
                                            />
                                            <Label htmlFor={`use-${use}`} className="font-normal">{use}</Label>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}

                    {/* Suitable User */}
                    {filterOptions?.suitableUsers?.length > 0 && (
                        <AccordionItem value="suitableUser">
                            <AccordionTrigger className="text-base font-semibold">Suitable User</AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-2 pt-2">
                                    {filterOptions.suitableUsers.map((user: string) => (
                                        <div key={user} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`user-${user}`} 
                                                checked={localFilters.suitableUsers?.includes(user)}
                                                onCheckedChange={(checked) => handleArrayFilterChange('suitableUsers', user, checked as boolean)}
                                            />
                                            <Label htmlFor={`user-${user}`} className="font-normal">{user}</Label>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}

                    {/* Use Type */}
                    {filterOptions?.useTypes?.length > 0 && (
                        <AccordionItem value="useType">
                            <AccordionTrigger className="text-base font-semibold">Use Type</AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-2 pt-2">
                                    {filterOptions.useTypes.map((type: string) => (
                                        <div key={type} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`type-${type}`} 
                                                checked={localFilters.useTypes?.includes(type)}
                                                onCheckedChange={(checked) => handleArrayFilterChange('useTypes', type, checked as boolean)}
                                            />
                                            <Label htmlFor={`type-${type}`} className="font-normal">{type}</Label>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}

                    {/* Stock Status */}
                    <AccordionItem value="stockStatus">
                        <AccordionTrigger className="text-base font-semibold">Stock Status</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-2 pt-2">
                                {['In Stock', 'Out of Stock'].map((status: string) => (
                                    <div key={status} className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={`stock-${status}`} 
                                            checked={localFilters.stockStatus?.includes(status)}
                                            onCheckedChange={(checked) => handleArrayFilterChange('stockStatus', status, checked as boolean)}
                                        />
                                        <Label htmlFor={`stock-${status}`} className="font-normal">{status}</Label>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
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
                        const clearedFilters = { 
                            search: '', 
                            category: 'all', 
                            price: [minPrice, maxPrice], 
                            rating: 0,
                            brands: [],
                            subCategories: [],
                            colors: [],
                            sizes: [],
                            bodyParts: [],
                            intendedUses: [],
                            suitableUsers: [],
                            useTypes: [],
                            stockStatus: []
                        };
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
