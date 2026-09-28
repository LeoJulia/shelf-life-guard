"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/shared/ui/popover";
import { cn } from "@/shared/utils";

type ComboboxDefaultValue = string | string[] | null;

interface ComboboxProps {
  defaultValue?: ComboboxDefaultValue;
  defaultOptions: string[];
  multiple?: boolean;
  name?: string;
  id?: string;
  placeholder?: string;
  isEditable?: boolean;
}

const toSelectedValues = (
  value: ComboboxDefaultValue | undefined,
): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item) => item.trim().length > 0);
  }

  if (value && value.trim().length > 0) {
    return [value];
  }

  return [];
};

export function Combobox({
  defaultOptions,
  defaultValue,
  multiple = false,
  name,
  id,
  placeholder,
  isEditable = false,
}: ComboboxProps) {
  const isMultiple = multiple || Array.isArray(defaultValue);
  const [selectedValues, setSelectedValues] = useState<string[]>(() =>
    toSelectedValues(defaultValue),
  );
  const [options, setOptions] = useState(defaultOptions);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const selectedText = selectedValues.join(", ");
  const hasSelectedValues = selectedValues.length > 0;
  const trimmedInput = inputValue.trim();
  const isFiltering = isSearching && trimmedInput.length > 0;
  const searchQuery = isFiltering ? trimmedInput.toLowerCase() : "";

  const filteredOptions = isFiltering
    ? options.filter((option) => option.toLowerCase().includes(searchQuery))
    : options;

  const normalizedInput = trimmedInput.toLowerCase();
  const exactMatch = options.some(
    (option) => option.toLowerCase() === normalizedInput,
  );
  const alreadySelected = selectedValues.some(
    (value) => value.toLowerCase() === normalizedInput,
  );

  const showAddOption =
    isEditable && isFiltering && !exactMatch && !alreadySelected;

  const showSelection = (values: string[]) => {
    setInputValue(values.join(", "));
    setIsSearching(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setInputValue(selectedText);
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextText = e.target.value;
    const isTypingAfterSelection =
      !isSearching && nextText.startsWith(selectedText);

    setInputValue(
      isTypingAfterSelection
        ? nextText.slice(selectedText.length).trimStart()
        : nextText,
    );
    setIsSearching(true);
    if (!open) setOpen(true);
  };

  const handleClear = () => {
    setSelectedValues([]);
    showSelection([]);

    if (open) {
      inputRef.current?.focus();
    }
  };

  const handleSelect = (option: string) => {
    if (isMultiple) {
      const nextValues = selectedValues.includes(option)
        ? selectedValues.filter((value) => value !== option)
        : [...selectedValues, option];

      setSelectedValues(nextValues);
      showSelection(nextValues);
      setOpen(true);
      return;
    }

    setSelectedValues([option]);
    showSelection([option]);
    setOpen(false);
  };

  const handleAddNew = () => {
    if (!trimmedInput) return;

    if (isMultiple && selectedValues.includes(trimmedInput)) {
      showSelection(selectedValues);
      setOpen(true);
      return;
    }

    setOptions((currentOptions) =>
      currentOptions.some(
        (option) => option.toLowerCase() === trimmedInput.toLowerCase(),
      )
        ? currentOptions
        : [...currentOptions, trimmedInput],
    );

    const nextValues = isMultiple
      ? [...selectedValues, trimmedInput]
      : [trimmedInput];

    setSelectedValues(nextValues);
    showSelection(nextValues);
    setOpen(!isMultiple);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverAnchor asChild>
        <div ref={triggerRef} className='relative w-full'>
          <Input
            ref={inputRef}
            type='text'
            value={isSearching ? inputValue : selectedText}
            onChange={handleInputChange}
            onFocus={() => {
              if (open) return;

              setInputValue(selectedText);
              setIsSearching(false);
              setOpen(true);
            }}
            placeholder={placeholder}
            className={cn(
              "w-full px-3 py-2 pr-9",
              hasSelectedValues && "pr-21",
            )}
            role='combobox'
            aria-expanded={open}
            aria-autocomplete='list'
            autoComplete='off'
            name={isMultiple ? undefined : name}
            id={id}
          />
          {isMultiple &&
            selectedValues.map((selectedValue) => (
              <Input
                key={`${name ?? "value"}-${selectedValue}`}
                type='hidden'
                name={name}
                value={selectedValue}
              />
            ))}
          {hasSelectedValues && (
            <Button
              type='button'
              size='icon'
              variant='ghost'
              className='absolute right-12 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
              onClick={handleClear}
              tabIndex={-1}
              aria-label='Очистить'
            >
              <X className='size-4' />
            </Button>
          )}
          <Button
            type='button'
            className='absolute right-0 top-1/2 -translate-y-1/2'
            onClick={() => {
              handleOpenChange(!open);
              inputRef.current?.focus();
            }}
            tabIndex={-1}
          >
            <ChevronDown
              className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </Button>
        </div>
      </PopoverAnchor>

      <PopoverContent
        sideOffset={4}
        align='start'
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          const target = e.target as Element | null;
          if (target && triggerRef.current?.contains(target)) {
            e.preventDefault();
          }
        }}
        className='z-200 w-(--radix-popover-trigger-width) max-h-64 overflow-hidden rounded-xl border-border shadow-lg animate-in fade-in-0 zoom-in-95'
      >
        <div
          role='listbox'
          aria-multiselectable={isMultiple || undefined}
          className='overflow-y-auto max-h-64'
        >
          {filteredOptions.length === 0 && !showAddOption && (
            <div className='px-3 py-2 text-sm text-center'>
              Ничего не найдено
            </div>
          )}

          {filteredOptions.map((option) => {
            const isSelected = selectedValues.includes(option);

            return (
              <div
                key={option}
                data-combobox-item
                role='option'
                aria-selected={isSelected}
                className='flex items-center gap-2 px-3 py-2 rounded-xl text-sm cursor-pointer transition-colors hover:bg-secondary hover:text-secondary-foreground'
                onClick={() => handleSelect(option)}
              >
                {isSelected ? (
                  <Check className='size-4 shrink-0' />
                ) : (
                  <span className='w-4 shrink-0' />
                )}
                <span>{option}</span>
              </div>
            );
          })}

          {showAddOption && (
            <>
              {filteredOptions.length > 0 && <div className='border-t my-1' />}
              <div
                data-combobox-item
                role='option'
                aria-selected={false}
                className='flex items-center gap-2 px-3 py-2 rounded-xl text-sm cursor-pointer transition-colors hover:bg-secondary hover:text-secondary-foreground'
                onClick={handleAddNew}
              >
                <Plus className='size-4' />
                <span>
                  Добавить{" "}
                  <span className='font-semibold'>«{trimmedInput}»</span>
                </span>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
