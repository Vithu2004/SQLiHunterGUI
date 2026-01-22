
function ResultTab(props){
    const result = props.result;
        // this.result = {
        //     url : this.cible.url,
        //     parameter : "",
        //     method : this.cible.method,
        //     vulnerabilityType : "",
        //     confidence : "",
        //     score : 0,
        //     payloadSent : ""
        // };

const getTr = (res) => {
    return (
        <tr className="vulnerability-row transition-colors" key={res.id}>
            {Object.entries(res).map(([key, value]) => {
                if (key === "confidence") {
                    let color = "gray";
                    if (value === "CONFIRMED") color = "red";
                    else if (value === "HIGH") color = "orange";
                    else if (value === "MEDIUM") color = "yellow";
                    return (
                        <td key={key} className="px-6 py-5 text-left">
                            <span className={`inline-flex px-2 py-0.5 rounded bg-${color}-100 text-${color}-700 text-[10px] font-bold uppercase`}>
                                {value}
                            </span>
                        </td>
                    );
                }
                if (key === "score" || key === "parameter" || key === "vulnerabilityType") {
                    return (
                        <td key={key} className="px-6 py-5">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">{value}</span>
                            </div>
                        </td>
                    );
                }
                if (key === "url" || key === "payloadSent") {
                    return (
                        <td key={key} className="px-6 py-5 text-right">
                            <code className="text-xs font-mono bg-gray-50 px-2 py-1 rounded text-accent-blue break-all">
                                {value}
                            </code>
                        </td>
                    );
                }
                return null;
            })}
        </tr>
    );
};

    return (
        <div className="flex flex-col w-full rounded-xl border border-border-subtle bg-white overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-border-subtle">
                        <th className="px-6 py-4 text-[10px] font-bold text-text-sub uppercase tracking-widest text-right">Confidence</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-text-sub uppercase tracking-widest text-right">Score</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-text-sub uppercase tracking-widest w-2/5">Vulnerable URL</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-text-sub uppercase tracking-widest w-1/5">Vulnerable parameter</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-text-sub uppercase tracking-widest w-1/4">Vulnerability Type</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-text-sub uppercase tracking-widest w-1/4">payload Sent</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                        {result.map(res => getTr(res))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ResultTab;