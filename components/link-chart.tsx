"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface ChartData {
  name: string
  value: number
  color: string
}

interface LinkChartProps {
  data: ChartData[]
}

export function LinkChart({ data }: LinkChartProps) {
  const totalLinks = data.reduce((sum, item) => sum + item.value, 0)

  if (totalLinks === 0) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground">No link data available</div>
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => [value, "Links"]} labelFormatter={(label) => `${label}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
