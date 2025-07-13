import './globals.css'

export const metadata = {
  title: 'MantaDrive - Secure Cloud Storage',
  description: 'Advanced cloud storage with AI-powered features and anonymous sharing',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
