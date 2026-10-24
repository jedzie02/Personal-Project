"use client";

import * as React from "react";
import { cn } from "cn";

function Avatar({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar"
      className={cn(
        "relative flex size-10 shrink-0 overflow-hidden rounded-full select-none",
        className
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  src,
  alt = "",
  ...props
}: React.ComponentProps<"img">) {
  const [hasError, setHasError] = React.useState(!src);

  if (hasError || !src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      data-slot="avatar-image"
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-sm",
        className
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
