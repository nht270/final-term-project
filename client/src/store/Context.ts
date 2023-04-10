import React, { createContext } from 'react'
import { ACTION, GlobalState } from './reducer'

const MainContext = createContext<[GlobalState, React.Dispatch<ACTION>] | null>(null)

export default MainContext