function Header() {
    return (
        <header className="header flex items-center justify-center whitespace-nowrap border-b border-solid border-border-subtle px-6 py-4 lg:px-10 bg-white/80 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <div className="text-primary-text flex items-center justify-center">
                    <span className="icon material-symbols-outlined">security</span>
                </div>
                <h2 className="text-text-main text-lg font-bold leading-tight tracking-[-0.015em] uppercase">SQL Hunter v1</h2>
            </div>
        </header>
    )
}

export default Header