import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Home() {
  const [sales, setSales] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [selectedType, setSelectedType] = useState("SALES");
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/api/data")
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched data:", data);
        
        setSales(data.salesReps || []);
        generateDealsData(data.salesReps || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch data:", err);
        setLoading(false);
      });
  }, []);

  const generateDealsData = (salesReps) => {
    const dealsData = [];
    
    salesReps.forEach(sales => {
      sales.deals.forEach(deal => {
        const matchingClient = sales.clients.find(client => client.name === deal.client);
        
        const entry = {
          sales: sales.name,
          client: deal.client,
          industry: matchingClient ? matchingClient.industry : 'N/A',
          dealValue: deal.value,
          status: deal.status,
          contact: matchingClient ? matchingClient.contact : 'N/A'
        };
        
        
        if (deal.status === 'Closed Won' || deal.status === 'In Progress') {
          dealsData.push(entry);
        }
      });
    });

    setDeals(dealsData);
  }

  const handleAskQuestion = async () => {
    setIsAsking(true);
    try {
      const response = await fetch("http://localhost:8000/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();
      setAnswer(data.answer);
    } catch (error) {
      console.error("Error in AI request:", error);
    } finally {
      setIsAsking(false);
    }
  };

  let dataContent;

  if (selectedType === "SALES") {
    dataContent = <table className="table border-2 border-[#e5e5e5] border-solid">
      <thead>
        <tr className="bg-[#333333] p-5 border-b-2 border-[#e5e5e5] border-solid">
          <th>Name</th>
          <th>Role</th>
          <th>Region</th>
          <th>Total Deals Won</th>
        </tr>
      </thead>
      <tbody>
        {sales.map((s) => (
          <tr key={s.id} className="border-b-2 border-[#e5e5e5] border-solid text-center">
            <td className="min-w-[100px]">{s.name}</td>
            <td className="min-w-[200px]">{s.role}</td>
            <td className="min-w-[200px]">{s.region}</td>
            <td className="min-w-[150px]">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(
                s.deals
                  .filter((deal) => deal.status === "Closed Won")
                  .reduce((sum: number, deal) => sum + deal.value, 0)
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  } else if (selectedType === "DEALS") {
    dataContent = <table className="table border-2 border-[#e5e5e5] border-solid">
      <thead>
        <tr className="bg-[#333333] p-5 border-b-2 border-[#e5e5e5] border-solid">
          <th>Sales</th>
          <th>Client</th>
          <th>Industry</th>
          <th>Deal Value</th>
          <th>Status</th>
          <th>Contact</th>
        </tr>
      </thead>
      <tbody>
        {deals.map((d, idx) => (
          <tr key={idx} className="border-b-2 border-[#e5e5e5] border-solid text-center">
            <td className="min-w-[100px]">{d.sales}</td>
            <td className="min-w-[200px]">{d.client}</td>
            <td className="min-w-[200px]">{d.industry}</td>
            <td className="min-w-[150px]">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(
                d.dealValue
              )}
            </td>
            <td className="min-w-[150px]">{d.status}</td>
            <td className="min-w-[150px]">{d.contact}</td>
          </tr>
        ))}
      </tbody>
    </table>
  } else if (selectedType === 'DEALS_CHART') {
    const totalClosedWon = sales
      .flatMap(rep => rep.deals)
      .filter(deal => deal.status === "Closed Won")
      .reduce((sum, deal) => sum + deal.value, 0);
    const totalInProgress = sales
      .flatMap(rep => rep.deals)
      .filter(deal => deal.status === "In Progress")
      .reduce((sum, deal) => sum + deal.value, 0);
    const totalLost = sales
      .flatMap(rep => rep.deals)
      .filter(deal => deal.status === "Closed Lost")
      .reduce((sum, deal) => sum + deal.value, 0)
    const chartLabels = ['Closed Won', 'In Progress', 'Lost'];
    const chartData = {
      labels: chartLabels,
      datasets: [{
        label: 'Deal Values',
        data: [totalClosedWon, totalInProgress, totalLost],
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(255, 159, 64, 0.2)',
          'rgba(255, 205, 86, 0.2)'
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(255, 159, 64)',
          'rgb(255, 205, 86)'
        ],
        borderWidth: 1
      }]
    };

    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: "top" as const,
        },
        title: {
          display: true,
          text: "Deal Values by Status",
        },
      },
    };

    dataContent = <Bar data={chartData} options={chartOptions} />;
  }

  return (
    <div className="p-4">
      <h1 className="text-[48px] text-center">Sales Representative Insight</h1>

      <section className="flex flex-row mb-4 h-[300px]">
        <div className="w-1/4 p-4 border-r border-gray-300">
          <button
            className={`block w-full mb-2 p-2 text-left ${
              selectedType === "SALES" ? "bg-[#02006c]" : ""
            } hover:bg-[#010057]`}
            onClick={() => setSelectedType("SALES")}
          >
            Sales Data
          </button>

          <button
            className={`block w-full mb-2 p-2 text-left ${
              selectedType === "DEALS" ? "bg-[#02006c]" : ""
            } hover:bg-[#010057]`}
            onClick={() => setSelectedType("DEALS")}
          >
            Deals Data
          </button>

          <button
            className={`block w-full mb-2 p-2 text-left ${
              selectedType === "DEALS_CHART" ? "bg-[#02006c]" : ""
            } hover:bg-[#010057]`}
            onClick={() => setSelectedType("DEALS_CHART")}
          >
            Deals Chart
          </button>
        </div>
        <div className="w-3/4 p-4">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-auto h-full">
            {dataContent}
          </div>
        )}
        </div>
      </section>

      <section>
        <h2 className="text-[28px] font-bold mb-4">Interact with the data (powered by Gemini)</h2>
        <div className="flex items-center border border-gray-300 rounded-lg p-2 shadow-md">
          <input
            type="text"
            placeholder="Ask AI about the data..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAskQuestion();
              }
            }}
            className="flex-grow p-2 border-none outline-none text-gray-700"
          />
          <button
            onClick={handleAskQuestion}
            disabled={isAsking}
            className={`ml-2 px-4 py-2 rounded-lg ${
              isAsking
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {isAsking ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Ask"
            )}
          </button>
        </div>
        {answer && (
          <div className="mt-4 p-4 border border-gray-300 rounded-lg bg-gray-50 shadow-md text-gray-400">
            <strong>AI Response:</strong> {answer}
          </div>
        )}
      </section>
    </div>
  );
}
