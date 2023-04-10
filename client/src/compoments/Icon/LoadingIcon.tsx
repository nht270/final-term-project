import './LoadingIcon.scss'

function LoadingIcon() {
    return (
        <svg width="24" className='loading' height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12C5 15.87 8.13 19 12 19C15.87 19 19 15.87 19 12C19 8.13 15.87 5 12 5" stroke="currentcolor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" >
                <animateTransform attributeType="xml"
                    attributeName="transform"
                    type="rotate"
                    from="0 12 12"
                    to="360 12 12"
                    dur="0.6s"
                    repeatCount="indefinite" />
            </path>
        </svg>
    )
}

export default LoadingIcon