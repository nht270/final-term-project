import './LogoLoadingIcon.scss'

function LogoLoadingIcon() {
    return (
        <svg id='logo-loading' width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="linear" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f0f8ff" />
                    <stop offset="100%" stopColor="#ffeb3b" />
                </linearGradient>
            </defs>
            <path d="M2 12H17.51M17.79 10.47V17.79C17.79 18.9066 17.3464 19.9774 16.5569 20.7669C15.7674 21.5565 14.6966 22 13.58 22H6.21C3.89 22 2 20.11 2 17.79V10.47C2 9.35345 2.44355 8.28262 3.23308 7.49309C4.02261 6.70356 5.09344 6.26001 6.21 6.26001H13.58C15.9 6.26001 17.79 8.15001 17.79 10.47ZM22 13.16C22 15.48 20.11 17.37 17.79 17.37V8.95001C18.3429 8.95001 18.8903 9.0589 19.4011 9.27048C19.9119 9.48205 20.376 9.79216 20.7669 10.1831C21.1579 10.574 21.468 11.0381 21.6795 11.5489C21.8911 12.0597 22 12.6071 22 13.16Z" stroke="url(#linear)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export default LogoLoadingIcon