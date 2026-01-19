function Footer() {
    return(
        <footer className="w-full py-6 border-t border-border-subtle bg-white mt-auto">
            <div className="px-10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-sub">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>SERVER STATUS: OPERATIONAL</span>
                </div>
                <div className="uppercase tracking-widest opacity-60">Security Clearance: Public</div>
                <div className="font-mono opacity-60">v.1.0.0</div>
            </div>
        </footer>
    )
}

export default Footer