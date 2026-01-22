import { useNavigate } from "react-router-dom";

function Header(props) {
    const navigate = useNavigate();

    const goBackButton = props.goBack;

    const goHome = () => {
        navigate("/");
    }
    return (
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-border-subtle px-6 py-4 lg:px-10 bg-white/80 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <div className="text-primary-text flex items-center justify-center">
                    <span className="icon material-symbols-outlined">security</span>
                </div>
                <h2 className="text-text-main text-lg font-bold leading-tight tracking-[-0.015em] uppercase">SQL Hunter v1</h2>
            </div>
            {goBackButton ? <div className="flex gap-3">
                    <button className=" group flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 w-10 bg-surface-card border border-border-subtle hover:border-primary transition-colors text-text-sub" onClick={() => goHome()}>
                        <span className="material-symbols-outlined group-hover:text-primary-text transition-colors">logout</span>
                    </button>
                </div>
                : null}
        </header>
    )
}




export default Header