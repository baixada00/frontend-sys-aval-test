import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useUser } from '../context/UserContext'

interface ProtectedRouteProps {
    element: React.ReactElement
    allowedRoles?: ('admin' | 'gestor' | 'avaliador')[]
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element, allowedRoles }) => {
    const { user } = useUser()
    const location = useLocation()

    if (!user) {
        sessionStorage.setItem('redirectPath', location.pathname)
        return <Navigate to="/login\" replace />
    }

    if (allowedRoles && !allowedRoles.includes(user.activeRole)) {
        return <Navigate to="/dashboard" replace />
    }

    return element
}

export default ProtectedRoute