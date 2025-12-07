import { useState } from "react";
import { Search, Filter, MapPin, ChevronDown, ChevronUp } from "./icons";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";

interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedType: string;
  onTypeChange: (value: string) => void;
  selectedLocation: string; 
  onLocationChange: (value: string) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  availableTags: string[];
  availableLocations: string[]; 
}

export function SearchFilter({
  searchTerm,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedLocation,
  onLocationChange,
  selectedTags,
  onTagToggle,
  availableTags,
  availableLocations,
}: SearchFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const activeFiltersCount = [
    searchTerm && "search",
    selectedType !== "all" && "type",
    selectedLocation !== "all" && "location",
    selectedTags.length > 0 && "tags"
  ].filter(Boolean).length;

  return (
    <div className="bg-card rounded-lg border">
      <div className="p-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari destinasi dan acara..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-12 sm:h-10"
          />
        </div>
      </div>

      <div>
        <Button 
          variant="ghost" 
          className="w-full justify-between p-3 sm:p-4 pt-0 sm:pt-0 h-auto rounded-none border-t"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm sm:text-base">Filter Lanjutan</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        
        {isExpanded && (
          <div className="border-t">
            <div className="p-3 sm:p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Jenis</label>
                  <Select value={selectedType} onValueChange={onTypeChange}>
                    <SelectTrigger className="h-12 sm:h-10">
                      <SelectValue placeholder="Semua Jenis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Jenis</SelectItem>
                      <SelectItem value="destination">Destinasi</SelectItem>
                      <SelectItem value="event">Acara</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pulau / Wilayah</label>
                  <Select value={selectedLocation} onValueChange={onLocationChange}>
                    <SelectTrigger className="h-12 sm:h-10">
                      <SelectValue placeholder="Semua Wilayah" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Wilayah</SelectItem>
                      {availableLocations.map((island) => (
                        <SelectItem key={island} value={island}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{island}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tag</label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/80 h-8 text-xs sm:text-sm"
                      onClick={() => onTagToggle(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {activeFiltersCount > 0 && (
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {activeFiltersCount} filter aktif
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      onSearchChange("");
                      onTypeChange("all");
                      onLocationChange("all");
                      selectedTags.forEach(tag => onTagToggle(tag));
                    }}
                  >
                    Hapus Semua
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}