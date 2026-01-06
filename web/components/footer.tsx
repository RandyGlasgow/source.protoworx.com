export function Footer() {
  const links = ['Link 1', 'Link 2', 'Link 3', 'Link 4', 'Link 5'];

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-center gap-6">
          {links.map((link, index) => (
            <a
              key={index}
              href="#"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              {link}
            </a>
          ))}
        </div>
        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} Source. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
