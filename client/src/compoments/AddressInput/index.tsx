import { useQuery } from '@tanstack/react-query'
import Tippy, { TippyProps } from '@tippyjs/react'
import { ChangeEvent, FocusEvent, useEffect, useMemo, useRef, useState } from 'react'
import QueryKeyPrefix from '../../configures/queryKeyPrefix'
import useDebounce from '../../hooks/useDebounce'
import * as MapService from '../../services/map'
import './index.scss'

export interface Address {
    label: string,
    longitude: string,
    latitude: string
}

export interface AddressInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    addressText?: string
    selectAddressHandler: (address: Address) => void
    maxWidth?: TippyProps['maxWidth']
}

function AddressInput(props: AddressInputProps) {
    const [searchText, setSearchText] = useState('')
    const { selectAddressHandler, addressText, maxWidth, ...restProps } = props
    const searchAddressQuery = useQuery(
        [QueryKeyPrefix.SEARCH_ADDRESS_PREFIX, searchText],
        () => MapService.searchAddressGoongIo(searchText),
        { enabled: searchText !== '' }
    )

    const updateSearchText = useDebounce(setSearchText)
    const addressInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (addressInputRef.current && !addressInputRef.current.value) {
            addressInputRef.current.value = addressText || ''
        }
    }, [addressInputRef.current])

    const handleChangeSearchText = useMemo(() => {
        return (e: ChangeEvent) => {
            if (!e.target) { return }
            const text = (e.target as HTMLInputElement).value
            updateSearchText(text)
        }
    }, [])

    const handleFocusInputField = useMemo(() =>
        (e: FocusEvent) => {
            if (!e.target || !addressInputRef.current) { return }
            setSearchText(addressInputRef.current.value)
        }, [])

    const handleSelectAddressItem = useMemo(() =>
        (location: MapService.GoongIoAddressLocation) => {
            selectAddressHandler({ ...location, label: location.formattedAddress })
            setSearchText('')
            addressInputRef.current && (addressInputRef.current.value = location.formattedAddress)
        }, [])

    return (

        <Tippy
            trigger='focus'
            maxWidth={maxWidth}
            interactive
            placement='bottom'
            content={
                <>
                    {
                        searchText
                            ? <div className="suggestion-address">
                                {
                                    searchAddressQuery.data && searchAddressQuery.data.length > 0
                                        ? (
                                            searchAddressQuery.data.map(location => {
                                                return (
                                                    <div
                                                        key={`${Object.values(location).join('-')}`}
                                                        className="location-item"
                                                        data-longitude={location.longitude}
                                                        data-latitude={location.latitude}
                                                        onMouseDown={() => handleSelectAddressItem(location)}
                                                    >
                                                        {location.formattedAddress}
                                                    </div>
                                                )
                                            })
                                        ) : <span>Không tìm thấy địa chỉ phù hợp</span>
                                }
                            </div>
                            : null
                    }
                </>
            }
            onUntrigger={() => {
                if (addressInputRef.current) {
                    addressInputRef.current.value = addressText || ''
                }
            }}
            onShow={(instance) => {
                instance.popper.style.width = `${instance.reference.clientWidth}px`
            }}
        >
            <input
                {...restProps}
                type="text"
                name="address"
                onChange={handleChangeSearchText}
                onFocus={handleFocusInputField}
                ref={addressInputRef}
            />
        </Tippy>

    )
}

export default AddressInput