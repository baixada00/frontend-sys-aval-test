import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface User {
    id: number
    name: string
    roles: ('admin' | 'gestor' | 'avaliador')[]
    activeRole: 'admin' | 'gestor' | 'avaliador'
    username: string
}

interface UserContextType {
    user: User | null
    setUser: (user: User | null) => void
    setActiveRole: (role: 'admin' | 'gestor' | 'avaliador') => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUserState] = useState<User | null>(null)

    useEffect(() => {
        const storedUser = sessionStorage.getItem('fuc_user')
        if (storedUser) {
            setUserState(JSON.parse(storedUser))
        }
    }, [])

    const setUser = (newUser: User | null) => {
        if (newUser) {
            sessionStorage.setItem('fuc_user', JSON.stringify(newUser))
        } else {
            sessionStorage.removeItem('fuc_user')
        }
        setUserState(newUser)
    }

    const setActiveRole = (role: 'admin' | 'gestor' | 'avaliador') => {
        if (user && user.roles.includes(role)) {
            const updatedUser = { ...user, activeRole: role }
            sessionStorage.setItem('fuc_user', JSON.stringify(updatedUser))
            setUserState(updatedUser)
        }
    }

    return (
        <UserContext.Provider value={{ user, setUser, setActiveRole }}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    const context = useContext(UserContext)
    if (!context) {
        throw new Error('useUser must be used within a UserProvider')
    }
    return context
}