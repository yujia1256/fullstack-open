import Link from "next/link"
import AuthSessionProvider from "./components/SessionProvider"
import NavBar from "./components/NavBar"
export default function RootLayout({
  children,
}:{
  children: React.ReactNode
}){
  return (
    <html lang="en">
      <body>
        <AuthSessionProvider>
          <NavBar />

          {children}
        </AuthSessionProvider>
      </body>
      </html>
  )
}