// src/app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { NotificationProvider } from '@/components/NotificationProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Tarreo Gamer Primavera 2025',
  description: 'Sistema de registro para torneos gaming INACAP Osorno',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </Providers>
      </body>
    </html>
  )
}