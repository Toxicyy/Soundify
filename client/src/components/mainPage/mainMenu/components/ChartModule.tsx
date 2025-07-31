import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ChartModule({ chartImage }: { chartImage: string }) {
  const [hover, setHover] = useState(false);
  const chartName = "Global chart";
  const navigate = useNavigate();
  return (
    <div>
      <h1 className="text-3xl font-bold text-white tracking-wider mt-2 mb-[15px]">
        Global chart
      </h1>
      <div
        className={
          "w-[100%] h-[35vh] rounded-3xl glass flex pl-10 pr-10 pb-4 items-end duration-500 cursor-pointer transition-all justify-between " +
          (hover
            ? "contrast-100 drop-shadow-[0_7px_7px_rgba(0,0,0,0.4)]"
            : "contrast-50")
        }
        style={{
          backgroundImage: `url(${chartImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => navigate("/charts")}
      >
        {hover && <div className="flex flex-col gap-2">
          <h1 className="text-white text-4xl font-bold tracking-wider">
            {chartName}
          </h1>
        </div>}
      </div>
    </div>
  );
}
