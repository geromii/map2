"use client";

import * as React from "react";
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


export function SearchCountry({ handleCountryClick, state }) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [selectedCountry, setSelectedCountry] = React.useState("");
  const { allCountries, filteredCountries } = useCountries(searchValue);

  const handleSelect = (country) => {
    setSelectedCountry(country);
    setOpen(false); // Add this line to close the popover when a country is selected
  };
  const handleButtonClick = () => {
    if (selectedCountry) {
      handleCountryClick(selectedCountry);
    }
  };

  const selectedCountries = Object.keys(state).filter(
    (country) => state[country].state !== 0,
  );

  // Search handler
  const handleSearch = (e) => {
    console.log(e.target.value);
    setSearchValue(e.target.value);
  };


  const buttonColor = selectedCountry
    ? state[selectedCountry].color
    : "defaultButtonColor";

  return (
    <div className="flex-wrap align-center justify-center items-center lg:justify-start lg:items-start h-auto">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between overflow-hidden"
          >
            {selectedCountry || "Search countries..."}
            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput
              placeholder="Search for a country..."
              className="h-9"
              value={searchValue}
              //  console log the search value
              onValueChange={setSearchValue}
            />
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              {filteredCountries.length === 0 && (
                <CommandEmpty>No country found.</CommandEmpty>
              )}
              <CommandGroup>
                {filteredCountries.map((country) => (
                  <CommandItem
                    key={country}
                    value={country}
                    onSelect={() => handleSelect(country)}
                    style={{ color: state[country].color, fontWeight: "bold" }}
                  >
                    {country}
                    <CheckIcon
                      className={`ml-auto h-4 w-4 ${selectedCountry === country ? "opacity-100" : "opacity-0"}`}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
      <Button
        onClick={handleButtonClick}
        disabled={!selectedCountry}
        className="ml-2 lg:ml-0 lg:mt-2 "
        style={{ backgroundColor: buttonColor }}
      >
        Select
      </Button>
    </div>
  );
}
