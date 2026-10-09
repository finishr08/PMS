"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

const paperSizes = ["A4", "Letter", "Legal"];

export default function PaperSizeSelector({ paperSize, setPaperSize }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const optionRefs = useRef([]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      const index = paperSizes.indexOf(paperSize);
      optionRefs.current[index]?.focus();
    }
  }, [isOpen, paperSize]);

  function selectPaper(size) {
    setPaperSize(size);
    setIsOpen(false);
    buttonRef.current?.focus();
  }

  function handleKeyDown(event, index) {
    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      buttonRef.current?.focus();
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      optionRefs.current[(index + 1) % paperSizes.length]?.focus();
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      optionRefs.current[
        (index - 1 + paperSizes.length) % paperSizes.length
      ]?.focus();
    }

    if (event.key === "Home") {
      event.preventDefault();
      optionRefs.current[0]?.focus();
    }

    if (event.key === "End") {
      event.preventDefault();
      optionRefs.current[paperSizes.length - 1]?.focus();
    }
  }

  return (
    <div ref={dropdownRef} className="relative w-full max-w-97.5">
      <label
        id="paper-size-label"
        className="mb-2 block text-[13px] font-semibold text-text-primary"
      >
        Paper Size
      </label>

      {/* Dropdown trigger */}
      <button
        ref={buttonRef}
        type="button"
        aria-labelledby="paper-size-label"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="paper-size-options"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`
          flex h-10 w-full cursor-pointer
          items-center justify-between
          rounded-lg border bg-white px-3
          text-left text-[13px] text-text-primary
          transition-all duration-150
          ${
            isOpen
              ? "border-primary shadow-[0_0_0_3px_rgba(37,131,245,0.10)]"
              : "border-border hover:border-blue-300"
          }
        `}
      >
        <span>{paperSize}</span>

        <ChevronDown
          size={16}
          className={`text-text-secondary transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Custom dropdown menu */}
      {isOpen && (
        <div
          id="paper-size-options"
          role="listbox"
          aria-labelledby="paper-size-label"
          className="
            absolute left-0 top-full z-50 mt-1
            w-full overflow-hidden rounded-lg
            border border-[#E1E8F2] bg-white
            p-1 shadow-[0_8px_20px_rgba(30,64,175,0.12)]
          "
        >
          {paperSizes.map((size, index) => {
            const selected = size === paperSize;

            return (
              <button
                key={size}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                type="button"
                role="option"
                aria-selected={selected}
                tabIndex={-1}
                onClick={() => selectPaper(size)}
                onKeyDown={(event) => {
                  handleKeyDown(event, index);
                }}
                className={`
                  flex h-9 w-full cursor-pointer
                  items-center justify-between rounded-md
                  px-3 text-left text-[13px]
                  transition-colors
                  ${
                    selected
                      ? "bg-[#EAF3FF] font-semibold text-primary"
                      : "text-text-primary hover:bg-[#F4F8FF]"
                  }
                `}
              >
                <span>{size}</span>

                {selected && (
                  <Check size={16} strokeWidth={2.5} className="text-primary" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
