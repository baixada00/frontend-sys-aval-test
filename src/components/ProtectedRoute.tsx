import React from 'react'
import { Navigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'

interface ProtectedRouteProps {
  element: React.ReactElement
  allowedRoles?: string[]
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element, allowedRoles }) => {
  const { user } = useUser()

  if (!user) {
    return <Navigate to="/admin/add-user" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.type)) {
    return <Navigate to="/dashboard" replace />
  }

  return element
}

export default ProtectedRoute