import React, { useReducer } from 'react'
import MainContext from './Context'
import reducer, { initState } from './reducer'

interface MainProviderProps {
    children: React.ReactNode
}

function MainProvider({ children }: MainProviderProps) {
    const [global, dispatchGlobal] = useReducer(reducer, initState)
    return (
        <MainContext.Provider value={[global, dispatchGlobal]}>
            {children}
        </MainContext.Provider>
    )
}

export default MainProvider