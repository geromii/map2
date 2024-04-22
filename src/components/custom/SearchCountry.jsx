"use client";

import * as React from "react";
import { useRef, useEffect } from "react"; // Import useRef and useEffect
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { useCountries } from "@/app/useCountries";
import useCountryStore from "@/app/useCountryStore";

export function SearchCountry({ countries }) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const { allCountries, filteredCountries, sortedFilteredCountries } = useCountries(searchValue);
  const { setCountryPhase, incrementCountryPhase } = useCountryStore((state) => ({
    setCountryPhase: state.setCountryPhase, 
    incrementCountryPhase: state.incrementCountryPhase,
  }));
  const inputRef = useRef(null); // Create a ref for the input


 

  const handleSelect = (country) => {
    setSearchValue("");
    if (countries[country].nonInitial) {
      setCountryPhase(country, "INITIAL");
    } else {
      setCountryPhase(country, "neutral");
    }
  };
  useEffect(() => {
    // Set focus on the input whenever the selectedCountries changes
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [countries]);

  return (
    <div className="flex flex-wrap align-center justify-center items-center lg:justify-center lg:items-center h-auto w-full">
      <Popover
        open={open}
        onOpenChange={setOpen}
        className="w-full align-middle justify-center m-2"
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="default"
            role="combobox"
            aria-expanded={open}
            className="w-full max-w-[170px] md:justify-around overflow-hidden pl-1 text-xs lg:text-sm rounded-sm shadow-sm"
          >
            <CaretSortIcon className="h-5 w-5 shrink-0 opacity-50 " />
            Select countries
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[170px] p-0">
          <Command>
            <CommandInput
              placeholder="Type to search"
              className="h-9"
              value={searchValue}
              onValueChange={setSearchValue}
              ref={inputRef} // Apply the ref to the input
            />
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              {sortedFilteredCountries.length === 0 && (
                <CommandEmpty>No country found.</CommandEmpty>
              )}
              <CommandGroup>
                {sortedFilteredCountries.map((country) => (
                  <CommandItem
                    key={country}
                    value={country}
                    onSelect={() => handleSelect(country)}
                    style={{ color: "primary-foreground", fontWeight: "bold" }} className = ""
                  >
                    {country}
                    <CheckIcon
                      className={`ml-auto h-4 w-4 ${countries[country].nonInitial ? "opacity-100" : "opacity-0"}`}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
