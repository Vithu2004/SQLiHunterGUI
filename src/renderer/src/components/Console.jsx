function Console() {
    //Changer le text pour que ce soit des instructions qui permette de savoir comment le logiciel marche et quel type d'injection il fait
    return (
        <div className="flex flex-col w-full rounded-lg border border-border-subtle bg-white overflow-hidden shadow-soft">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-text-sub text-[16px]">terminal</span>
                    <span className="text-xs font-bold text-text-sub uppercase tracking-widest">Console_Output_Log</span>
                </div>
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                </div>
            </div>
            <div className="p-6 font-mono text-sm leading-relaxed overflow-y-auto max-h-[240px] bg-terminal-bg text-gray-600">
                <p className="mb-2"><span className="text-accent-blue font-bold">[SYSTEM_INIT]</span> <span className="text-text-main">Loading core vulnerability definitions v4.2...</span></p>
                <p className="mb-2"><span className="text-primary-text font-bold">[MODULE_LOAD]</span> <span className="text-gray-500">SQLMap integration ready.</span></p>
                <p className="mb-2"><span className="text-primary-text font-bold">[MODULE_LOAD]</span> <span className="text-gray-500">Heuristic analysis engine warm-up complete.</span></p>
                <p className="mb-2 text-gray-400">---------------------------------------------------</p>
                <p className="mb-2 text-gray-500">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                <p className="mb-2 text-gray-500">Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                <p className="mb-2"><span className="text-green-600 font-bold">[READY]</span> <span className="text-text-main">Target parameter required. Waiting for user input<span className="cursor-blink">_</span></span></p>
            </div>
        </div>
    )
}

export default Console 