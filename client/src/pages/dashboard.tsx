import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar 
} from "recharts";
import { 
  Thermometer, 
  Lightbulb, 
  Activity, 
  Wifi, 
  WifiOff, 
  Play, 
  Pause,
  Download,
  Menu,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { useMqttData } from "@/hooks/useMqttData";

export default function Dashboard() {
  const {
    currentData,
    historicalData,
    chartData,
    isWebSocketConnected,
    isMqttConnected,
    requestHistoricalData,
  } = useMqttData();

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Request initial historical data
    requestHistoricalData(50);
  }, [requestHistoricalData]);

  const maxTemp = currentData 
    ? Math.max(currentData.dhtTemperature, currentData.lm35Temperature)
    : 0;

  const getLedIndicatorColor = (level: number, ledIndex: number) => {
    return ledIndex < level ? "hsl(142, 76%, 36%)" : "hsl(210, 40%, 80%)";
  };

  const getStatusColor = (ledLevel: number) => {
    if (ledLevel >= 3) return "hsl(0, 84%, 60%)";
    if (ledLevel >= 2) return "hsl(45, 93%, 47%)";
    return "hsl(142, 76%, 36%)";
  };

  const getStatusText = (ledLevel: number) => {
    if (ledLevel >= 3) return "High Temp";
    if (ledLevel >= 2) return "Elevated";
    return "Normal";
  };

  const formatChartData = () => {
    return chartData.labels.map((label, index) => ({
      time: label,
      DHT11: chartData.dhtData[index],
      LM35: chartData.lm35Data[index],
      LED: chartData.ledData[index],
    }));
  };

  const formatHistoricalData = () => {
    return historicalData.slice(0, 10).map((reading) => ({
      timestamp: new Date(reading.timestamp).toLocaleString(),
      dhtTemp: reading.dhtTemperature.toFixed(1),
      lm35Temp: reading.lm35Temperature.toFixed(1),
      ledLevel: reading.ledLevel,
      status: getStatusText(reading.ledLevel),
      statusColor: getStatusColor(reading.ledLevel),
    }));
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div className={`bg-white w-64 min-h-screen shadow-lg border-r border-slate-200 ${sidebarOpen ? 'block' : 'hidden'} lg:block`}>
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Thermometer className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">IoT Monitor</h1>
              <p className="text-sm text-slate-500">ESP8266 Dashboard</p>
            </div>
          </div>
        </div>
        
        <nav className="mt-8">
          <div className="px-6 py-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Navigation</p>
          </div>
          <ul className="mt-4 space-y-2 px-3">
            <li>
              <div className="flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-primary text-white">
                <Activity className="mr-3 h-4 w-4" />
                Dashboard
              </div>
            </li>
          </ul>
        </nav>

        {/* Device Info */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Device Status</span>
              <div className={`w-3 h-3 rounded-full ${isMqttConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            </div>
            <p className="text-xs text-slate-500">G.231.22.0024</p>
            <p className="text-xs text-slate-400 mt-1">
              Last update: {currentData ? new Date(currentData.timestamp).toLocaleTimeString() : 'Never'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Temperature Monitoring</h2>
                <p className="text-sm text-slate-500">Real-time sensor data from ESP8266</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                {isWebSocketConnected && isMqttConnected ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600">Disconnected</span>
                  </>
                )}
              </div>
              
              {/* Auto Refresh Toggle */}
              <Button
                variant={autoRefresh ? "default" : "secondary"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="flex items-center space-x-2"
              >
                {autoRefresh ? <RefreshCw className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                <span>{autoRefresh ? 'Auto Refresh' : 'Paused'}</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* DHT11 Temperature Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Thermometer className="text-blue-600 h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">DHT11 Sensor</p>
                      <p className="text-xs text-slate-400">Digital Temperature</p>
                    </div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-800">
                  {currentData ? currentData.dhtTemperature.toFixed(1) : '--'}<span className="text-lg text-slate-500">°C</span>
                </div>
                <div className="mt-2 flex items-center">
                  <span className="text-sm text-green-600">
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    Active
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* LM35 Temperature Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Thermometer className="text-orange-600 h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">LM35 Sensor</p>
                      <p className="text-xs text-slate-400">Analog Temperature</p>
                    </div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-800">
                  {currentData ? currentData.lm35Temperature.toFixed(1) : '--'}<span className="text-lg text-slate-500">°C</span>
                </div>
                <div className="mt-2 flex items-center">
                  <span className="text-sm text-green-600">
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    Active
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Max Temperature Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Thermometer className="text-red-600 h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Maximum Temp</p>
                      <p className="text-xs text-slate-400">Highest Reading</p>
                    </div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-800">
                  {maxTemp.toFixed(1)}<span className="text-lg text-slate-500">°C</span>
                </div>
                <div className="mt-2 flex items-center">
                  <span className="text-xs text-slate-500">Used for LED control</span>
                </div>
              </CardContent>
            </Card>

            {/* LED Status Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Lightbulb className="text-green-600 h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">LED Status</p>
                      <p className="text-xs text-slate-400">Alert Level</p>
                    </div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-800">
                  Level {currentData ? currentData.ledLevel : 0}
                </div>
                <div className="mt-3 flex space-x-2">
                  {[1, 2, 3].map((led) => (
                    <div
                      key={led}
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: getLedIndicatorColor(currentData?.ledLevel || 0, led)
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Real-time Temperature Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Temperature Trends</CardTitle>
                  <div className="flex space-x-2">
                    <Badge variant="default">Live</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formatChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="DHT11" 
                        stroke="hsl(217, 91%, 60%)" 
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="LM35" 
                        stroke="hsl(25, 95%, 53%)" 
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* LED Activity Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>LED Activity</CardTitle>
                  <div className="text-sm text-slate-500">Last 20 readings</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formatChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" fontSize={12} />
                      <YAxis fontSize={12} domain={[0, 3]} />
                      <Tooltip />
                      <Bar dataKey="LED" fill="hsl(142, 76%, 36%)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Data Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Readings</CardTitle>
                <Button variant="ghost" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">DHT11 (°C)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">LM35 (°C)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">LED Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {formatHistoricalData().map((reading, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{reading.timestamp}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{reading.dhtTemp}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{reading.lm35Temp}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="secondary">Level {reading.ledLevel}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant="secondary"
                            style={{ backgroundColor: reading.statusColor, color: 'white' }}
                          >
                            {reading.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
