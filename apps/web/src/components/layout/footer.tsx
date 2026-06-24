export function Footer() {
  return (
    <footer className="border-t border-border bg-background px-4 py-4 text-center text-xs text-muted-foreground">
      &copy; {new Date().getFullYear()} Business Platform. All rights reserved.
    </footer>
  );
}
