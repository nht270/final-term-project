import { useContext } from 'react'
import MainContext from '../store/Context'
import { ACTION, GlobalState } from '../store/reducer'

export default function useStore() {
    const store = useContext(MainContext)
    return store as [GlobalState, React.Dispatch<ACTION>]
}