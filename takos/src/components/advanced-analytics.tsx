import React from "react";
import { Card, CardBody, CardHeader, Select, SelectItem, Tabs, Tab } from "@heroui/react";
import { Icon } from "@iconify/react";

const markets = [
  { label: "Match Result (1X2)", value: "1x2" },
  { label: "Over/Under 2.5", value: "over_under" },
  { label: "Both Teams To Score", value: "btts" },
  { label: "HT/FT", value: "htft" },
];

export const AdvancedAnalytics = () => {
  const [selectedMarket, setSelectedMarket] = React.useState("1x2");
  const [selectedTab, setSelectedTab] = React.useState("patterns");
  const [historicalData, setHistoricalData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    loadHistoricalData();
  }, [selectedMarket]);

  const loadHistoricalData = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, we would fetch historical performance data
      // For this example, we'll simulate the process
      const data = await fetchHistoricalPerformance();
      setHistoricalData(data);
    } catch (error) {
      console.error("Error loading historical data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-default-500">Deep dive into prediction patterns and insights</p>
        </div>
        
        <div className="w-full md:w-64">
          <Select 
            label="Market" 
            selectedKeys={[selectedMarket]} 
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0];
              if (typeof selected === "string") {
                setSelectedMarket(selected);
              }
            }}
          >
            {markets.map((market) => (
              <SelectItem key={market.value} value={market.value}>
                {market.label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      <Tabs 
        aria-label="Advanced Analytics Options" 
        selectedKey={selectedTab} 
        onSelectionChange={(key) => setSelectedTab(key.toString())}
      >
        <Tab 
          key="patterns" 
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:trending-up" />
              <span>Patterns</span>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <Card>
              <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                  <p className="text-md font-semibold">Pattern Recognition</p>
                  <p className="text-small text-default-500">Key patterns identified in historical data</p>
                </div>
              </CardHeader>
              <CardBody>
                <div className="h-64">
                  {/* Pattern recognition visualization would go here */}
                  <div className="flex items-center justify-center h-full text-default-500">
                    Pattern recognition visualization
                  </div>
                </div>
              </CardBody>
            </Card>
            
            <Card>
              <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                  <p className="text-md font-semibold">Seasonal Trends</p>
                  <p className="text-small text-default-500">Performance across seasons</p>
                </div>
              </CardHeader>
              <CardBody>
                <div className="h-64">
                  {/* Seasonal trends visualization would go here */}
                  <div className="flex items-center justify-center h-full text-default-500">
                    Seasonal trends visualization
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>
        
        <Tab 
          key="monte-carlo" 
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:activity" />
              <span>Monte Carlo</span>
            </div>
          }
        >
          <div className="mt-4">
            <Card>
              <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                  <p className="text-md font-semibold">Monte Carlo Simulation</p>
                  <p className="text-small text-default-500">Probability distribution based on 10,000 simulations</p>
                </div>
              </CardHeader>
              <CardBody>
                <div className="h-96">
                  {/* Monte Carlo simulation visualization would go here */}
                  <div className="flex items-center justify-center h-full text-default-500">
                    Monte Carlo simulation visualization
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>
        
        <Tab 
          key="bayesian" 
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:git-branch" />
              <span>Bayesian Analysis</span>
            </div>
          }
        >
          <div className="mt-4">
            <Card>
              <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                  <p className="text-md font-semibold">Bayesian Analysis</p>
                  <p className="text-small text-default-500">Prior and posterior probability distributions</p>
                </div>
              </CardHeader>
              <CardBody>
                <div className="h-96">
                  {/* Bayesian analysis visualization would go here */}
                  <div className="flex items-center justify-center h-full text-default-500">
                    Bayesian analysis visualization
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>
        
        <Tab 
          key="kelly" 
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:percent" />
              <span>Kelly Criterion</span>
            </div>
          }
        >
          <div className="mt-4">
            <Card>
              <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                  <p className="text-md font-semibold">Kelly Criterion Analysis</p>
                  <p className="text-small text-default-500">Optimal bet sizing based on edge and odds</p>
                </div>
              </CardHeader>
              <CardBody>
                <div className="h-96">
                  {/* Kelly criterion visualization would go here */}
                  <div className="flex items-center justify-center h-full text-default-500">
                    Kelly criterion visualization
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};