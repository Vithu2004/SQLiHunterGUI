import Header from "../components/Header";
import Footer from "../components/Footer";
import Input from "../components/Home/Input";
import Console from "../components/Console";

function Home(){
    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
        <Header/>
        <div className="layout-container flex h-full grow flex-col justify-center py-10">
            <div className="px-4 md:px-10 lg:px-40 flex flex-1 justify-center">
                <div className="layout-content-container flex flex-col max-w-[960px] flex-1 gap-8">
                    <div className="flex flex-col gap-4 text-center items-center pt-8 md:pt-16 animate-fade-in">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-border-subtle mb-2 shadow-sm">
                            <span className="h-2 w-2 rounded-full bg-green-500 cursor-blink"></span>
                            <span className="text-xs font-mono text-text-sub uppercase tracking-widest">System Online</span>
                        </div>
                        <h1 className="text-text-main text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-[-0.033em] uppercase max-w-[800px]">SQL Injection <br/><span className="text-secondary">Analysis</span></h1>
                        <p className="text-text-sub text-base md:text-lg font-normal leading-normal max-w-[600px]">Initialize target parameter scan sequence. Ensure you have proper authorization before proceeding with penetration testing. <br/>See below for instructions</p>
                    </div>
                    <Input />
                    <Console />
                </div>
            </div>
        </div>
        <Footer/>
        </div>
    )
}

export default Home;
