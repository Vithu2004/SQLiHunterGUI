//C'est ici que t'auras la logique qui va envoyer le lien au backend

import { useState } from "react";

function Input() {
    const ipcHandle = (url) => window.electron.ipcRenderer.send('send-url', url);
    const [inputValue, setInputValue] = useState("");
    
    const handleChange = (event) => {
        setInputValue(event.target.value);
    };

    const handleKeyDown = (event) => {
        if(event.key === "Enter") {
            handleSubmit();
        }
    }

    const handleSubmit = () => {
        alert("La valeur est : " + inputValue);
        ipcHandle(inputValue);
    }
    return (
        <div className="w-full flex justify-center py-6">
            <div className="flex flex-col w-full max-w-[640px] gap-2">
                <label className="text-xs font-bold text-primary-text uppercase tracking-wider ml-1">Target Acquisition</label>
                <div className="flex flex-col md:flex-row w-full items-stretch rounded-xl bg-white border border-border-subtle p-1 focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary transition-all shadow-soft">
                <div className="flex items-center pl-4 text-text-sub">
                    <span className="material-symbols-outlined">link</span>
                </div>
                <input className="flex w-full flex-1 resize-none overflow-hidden bg-transparent text-text-main focus:outline-0 focus:ring-0 border-none h-14 placeholder:text-gray-400 px-4 text-base font-mono leading-normal" placeholder="https://target-system.com/login.php" value={inputValue} onChange={handleChange} onKeyDown={handleKeyDown}/>
                <button className="flex min-w-[140px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 md:h-auto px-6 bg-primary hover:bg-[#d9c700] transition-colors text-text-main text-base font-bold leading-normal tracking-[0.015em] gap-2 shadow-sm" onClick={handleSubmit}>
                    <span className="material-symbols-outlined">radar</span>
                    <span>SCAN</span>
                </button>
            </div>
                <div className="flex justify-between px-2 mt-1">
                    <span className="text-[10px] text-text-sub uppercase tracking-widest">Protocol: HTTPS</span>
                    <span className="text-[10px] text-text-sub uppercase tracking-widest">Port: 443 (Default)</span>
                </div>
            </div>
        </div>
    )
}

export default Input