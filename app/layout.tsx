import './globals.css'

export const metadata = {
  title: "Portal Hunter: Awakening",
  description: "Bem-vindo, caçador de portais.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
