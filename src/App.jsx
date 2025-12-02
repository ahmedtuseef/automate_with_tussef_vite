import React from 'react'
import { Routes, Route } from 'react-router-dom'
import StartPage from './pages/StartPage'
import ChooseAuth from './pages/ChooseAuth'
import LoginFormPage from './pages/LoginFormPage'
import SignupPage from './pages/SignupPage'
import MainDashboard from './pages/MainDashboard'


export default function App(){
return (
<Routes>
<Route path="/" element={<StartPage/>} />
<Route path="/choose" element={<ChooseAuth/>} />
<Route path="/login" element={<LoginFormPage/>} />
<Route path="/signup" element={<SignupPage/>} />
<Route path="/dashboard" element={<MainDashboard/>} />
<Route path="*" element={<StartPage/>} />
</Routes>
)
}