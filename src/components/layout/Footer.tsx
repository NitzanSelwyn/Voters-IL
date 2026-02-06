export function Footer() {
  return (
    <footer className="border-t border-border py-6 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>בוטרס-דיף &copy; {new Date().getFullYear()}</p>
        <p className="text-xs">
          נתונים מ-<a href="https://data.gov.il" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">data.gov.il</a>
        </p>
      </div>
    </footer>
  )
}
