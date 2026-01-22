import Header from "../components/Header";
import Footer from "../components/Footer";
import ResultTab from "../components/ScanResult/ResultTab";
import { useState, useEffect } from "react";

function ScanResult(){
const url = sessionStorage.getItem("targetUrl");
    const [result, setResult] = useState([]);
    const [loading, setLoading] = useState(true); // État de chargement

    const fetchResult = async () => {
        setLoading(true); // Commence le chargement
        try {
            const res = await window.electron.ipcRenderer.invoke('send-url', url);
            console.log("res reçu :", res);

            // Vérifie si c'est un tableau
            setResult(Array.isArray(res) ? res : null);
        } catch (error) {
            console.error("Erreur :", error);
            setResult([]);
        } finally {
            setLoading(false); // Fin du chargement
        }
    };

    useEffect(() => {
        fetchResult();
    }, [url]);

    if (loading) {
        // Affichage pendant le chargement
        return <div className="flex items-center justify-center">Analyse en cours...</div>;
    }

    
    return(
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
            <Header goBack={true}/>
            <main className="layout-container flex h-full grow flex-col py-10">
                <div className="px-4 md:px-10 lg:px-20 flex flex-1 flex-col">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-border-subtle mb-4 shadow-sm">
                                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                <span className="text-[10px] font-mono text-text-sub uppercase tracking-widest font-bold">Analysis Report</span>
                            </div>
                            <h1 className="text-text-main text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] uppercase">
                                Scan <span className="text-secondary">Results</span>
                            </h1>
                            <p className="text-text-sub text-sm font-mono mt-2">Target: {url}</p>
                        </div>
                        <div className="flex gap-2">
                            {/* <button className="flex items-center justify-center rounded-lg px-4 h-10 bg-white border border-border-subtle hover:border-primary transition-colors text-text-main text-xs font-bold uppercase tracking-wider gap-2">
                                <span className="material-symbols-outlined text-sm">download</span>Export CSV
                            </button> */}
                            <button className="flex items-center justify-center rounded-lg px-4 h-10 bg-primary hover:bg-[#d9c700] transition-colors text-text-main text-xs font-bold uppercase tracking-wider gap-2" onClick={() => fetchResult()}>
                                <span className="material-symbols-outlined text-sm">refresh</span>New Scan
                            </button>
                        </div>
                    </div>
                    {result === null ?                     
                        <div className="flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-border-subtle mt-8">
                            <h3 className="text-center text-xl font-bold">Incorrect URL</h3>
                            <p className="text-center text-text-sub text-sm ">The Scanner couldn't go to the page. Please check the url.</p>
                        </div> :
                        <ResultTab result={result} />
                        }
                    <div className="mt-6 flex items-center justify-between text-[11px] font-mono text-text-sub">
                        <div class="flex gap-4">
                            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> 01 CONFIRMED</span>
                            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> 01 High</span>
                            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> 01 Medium</span>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default ScanResult;