function colorFor(name: string): "primary" | "gold" {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % 2;
  return hash === 0 ? "primary" : "gold";
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initial = name.trim()[0]?.toUpperCase() ?? "?";
  const color = colorFor(name);
  const sizeClasses = { sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm", lg: "h-14 w-14 text-lg" }[size];
  const colorClasses = color === "primary" ? "bg-primary/25 text-primary-light" : "bg-gold/20 text-gold-light";

  return (
    <div className={`flex flex-shrink-0 items-center justify-center rounded-full font-medium ${sizeClasses} ${colorClasses}`}>
      {initial}
    </div>
  );
}