"use client";

import type { ButtonHTMLAttributes } from "react";

export function ConfirmButton({
  message,
  children,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { message: string }) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      className={className}
      {...rest}
    >
      {children}
    </button>
  );
}
