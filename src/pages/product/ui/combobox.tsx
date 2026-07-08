"use client";

import { useState, useRef, useEffect } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

interface BrandComboboxProps {
  defaultValue?: string | null;
  defaultOptions: string[];
  name?: string;
  id?: string;
  placeholder?: string;
}

export function Combobox({
  defaultOptions,
  defaultValue,
  name,
  id,
  placeholder,
}: BrandComboboxProps) {
  const [value, setValue] = useState(defaultValue);
  const [options, setOptions] = useState(defaultOptions);

  const onAddOption = (newOption: string) => {
    setOptions([...options, newOption]);
  };

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync external value with internal input
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filteredOptions = options.filter((brand) =>
    brand.toLowerCase().includes(inputValue?.toLowerCase() ?? ""),
  );

  const exactMatch = options.some(
    (brand) => brand.toLowerCase() === inputValue?.trim().toLowerCase(),
  );

  const showAddOption =
    (inputValue ? inputValue.trim().length : 0) > 0 && !exactMatch;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (!open) setOpen(true);
  };

  const handleSelect = (brand: string) => {
    setValue(brand);
    setInputValue(brand);
    setOpen(false);
  };

  const handleAddNew = () => {
    const trimmed = inputValue?.trim();
    if (trimmed) {
      onAddOption(trimmed);
      setValue(trimmed);
      setInputValue(trimmed);
      setOpen(false);
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <div className='relative w-full'>
          <Input
            ref={inputRef}
            type='text'
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className='w-full px-3 py-2 pr-9'
            role='combobox'
            aria-expanded={open}
            aria-autocomplete='list'
            autoComplete='off'
            name={name}
            id={id}
          />
          <Button
            type='button'
            className='absolute right-0 top-1/2 -translate-y-1/2'
            onClick={() => {
              setOpen(!open);
              inputRef.current?.focus();
            }}
            tabIndex={-1}
          >
            <ChevronDown
              className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </Button>
        </div>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          sideOffset={4}
          align='start'
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            const target = e.target as Element | null;
            if (target === inputRef.current) {
              e.preventDefault();
            }
          }}
          className='z-[200] w-[var(--radix-popover-trigger-width)] max-h-64 overflow-hidden bg-popover rounded-xl border shadow-lg animate-in fade-in-0 zoom-in-95'
        >
          <div
            ref={listRef}
            role='listbox'
            className='overflow-y-auto max-h-64 p-1'
          >
            {filteredOptions.length === 0 && !showAddOption && (
              <div className='px-3 py-2 text-sm text-center'>
                Ничего не найдено
              </div>
            )}

            {filteredOptions.map((brand) => (
              <div
                key={brand}
                data-combobox-item
                role='option'
                aria-selected={brand === value}
                className='flex items-center gap-2 px-3 py-2 rounded-xl text-sm cursor-pointer transition-colors hover:bg-secondary hover:text-secondary-foreground'
                onClick={() => handleSelect(brand)}
              >
                {brand === value && <Check className='size-4' />}
                {brand !== value && <span className='w-4 flex-shrink-0' />}
                <span>{brand}</span>
              </div>
            ))}

            {showAddOption && (
              <>
                {filteredOptions.length > 0 && (
                  <div className='border-t my-1' />
                )}
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
                    <span className='font-semibold'>
                      «{inputValue?.trim()}»
                    </span>
                  </span>
                </div>
              </>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
