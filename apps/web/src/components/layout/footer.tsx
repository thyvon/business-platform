export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
      &copy; {new Date().getFullYear()} Business Platform. All rights reserved.
    </footer>
  );
}
